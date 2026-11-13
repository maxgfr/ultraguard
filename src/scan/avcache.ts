// The incremental full-disk pass. `--av-full` scans every file under the
// roots; a home directory takes hours. Files already scanned clean are kept in
// a cache in ultraguard's state folder (<state>/av-cache/<engine>.json), with
// what identifies their content without reading it: size, mtime, ctime and
// inode. The next full run skips the ones that did not change and were scanned
// less than --av-rescan-days ago by the same engine (ClamAV's version, or the
// sha256 of a YARA rule set), and scans the rest. After that age everything
// is scanned again, so new signatures reach old files.
//
// A file with a detection, or that the scanner could not read, is never
// cached. The cache is saved after each batch: an interrupted run keeps what
// it finished.
import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readdirSync, readFileSync, readSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomic } from "../engine.js";
import { excludedBy } from "./antivirus.js";

/** A regular file under the full-pass roots, with what the cache compares. */
export interface FullFile {
  path: string;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
  ino: number;
}

/** size, mtime, ctime, inode, when it was scanned clean (ms). */
type Entry = [number, number, number, number, number];

interface CacheFile {
  /** What scanned the files: an engine version or a rule set's sha256. A different one empties the cache. */
  key: string;
  files: Record<string, Entry>;
}

export const DEFAULT_RESCAN_DAYS = 7;
/** A full pass reads at most this many files: past it, a gap. */
export const MAX_FULL_FILES = 5_000_000;
/** Files per scanner call: ClamAV loads its signatures once per call (about 20 seconds). */
export const BATCH = 20_000;

/** Every regular file under `roots` (no symlinks), outside the excluded folders. */
export function fullFiles(roots: string[], exclude: string[] = [], max = MAX_FULL_FILES): { files: FullFile[]; unreadable: number; capped: boolean } {
  const files: FullFile[] = [];
  const skip = excludedBy(exclude);
  let unreadable = 0;
  let capped = false;
  const stack = [...roots];
  const seen = new Set<string>();
  while (stack.length) {
    const p = stack.pop() as string;
    if (seen.has(p) || skip(p)) continue;
    seen.add(p);
    let st: ReturnType<typeof lstatSync>;
    try {
      st = lstatSync(p);
    } catch {
      unreadable++;
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (st.isFile()) {
      if (files.length >= max) {
        capped = true;
        break;
      }
      files.push({ path: p, size: st.size, mtimeMs: st.mtimeMs, ctimeMs: st.ctimeMs, ino: st.ino });
      continue;
    }
    if (!st.isDirectory()) continue;
    try {
      for (const n of readdirSync(p).reverse()) stack.push(join(p, n));
    } catch {
      unreadable++;
    }
  }
  return { files, unreadable, capped };
}

/** sha256 of rule files (their content, in order): the identity of a YARA rule set. */
export function ruleSetKey(files: string[]): string {
  const h = createHash("sha256");
  for (const f of files) {
    let fd: number | undefined;
    try {
      fd = openSync(f, "r");
      const buf = Buffer.alloc(1024 * 1024);
      for (;;) {
        const n = readSync(fd, buf, 0, buf.length, null);
        if (n <= 0) break;
        h.update(buf.subarray(0, n));
      }
    } catch {
      h.update(`unreadable:${f}`);
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }
  return h.digest("hex");
}

export class ScanCache {
  private data: CacheFile;
  constructor(
    readonly file: string,
    readonly key: string,
  ) {
    let data: CacheFile | undefined;
    try {
      if (existsSync(file)) data = JSON.parse(readFileSync(file, "utf8")) as CacheFile;
    } catch {}
    this.data = data && data.key === key && data.files && typeof data.files === "object" ? data : { key, files: {} };
  }

  /** The cache of one engine in the state folder: `<state>/av-cache/<name>.json`. */
  static open(stateDir: string, name: string, key: string): ScanCache {
    return new ScanCache(join(stateDir, "av-cache", `${name.replace(/[^\w.-]+/g, "-")}.json`), key);
  }

  /** Unchanged since it was scanned clean, less than `maxAgeMs` ago. */
  fresh(f: FullFile, nowMs: number, maxAgeMs: number): boolean {
    const e = this.data.files[f.path];
    return !!e && e[0] === f.size && e[1] === f.mtimeMs && e[2] === f.ctimeMs && e[3] === f.ino && nowMs - e[4] < maxAgeMs && e[4] <= nowMs;
  }

  markClean(files: FullFile[], nowMs: number): void {
    for (const f of files) this.data.files[f.path] = [f.size, f.mtimeMs, f.ctimeMs, f.ino, nowMs];
  }

  forget(paths: Iterable<string>): void {
    for (const p of paths) delete this.data.files[p];
  }

  save(): void {
    mkdirSync(join(this.file, ".."), { recursive: true });
    writeFileAtomic(this.file, JSON.stringify(this.data));
  }
}

/** The paths of `batch` named in a scanner's error lines (`<path>: Can't open`, `error scanning <path>: ...`). */
export function pathsIn(lines: string[], batch: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const l of lines) {
    const t = l.replace(/^(WARNING|ERROR):\s*|^error scanning\s+/i, "");
    for (let i = t.indexOf(": "); i > 0; i = t.indexOf(": ", i + 1)) {
      const p = t.slice(0, i);
      if (batch.has(p)) out.add(p);
    }
  }
  return out;
}

export interface Incremental {
  files: FullFile[];
  cache?: ScanCache;
  nowMs: number;
  maxAgeMs: number;
}

/** The files a full pass still has to scan, and how many the cache let it skip. */
export function pending(inc: Incremental): { todo: FullFile[]; skipped: number } {
  if (!inc.cache) return { todo: inc.files, skipped: 0 };
  const todo = inc.files.filter((f) => !inc.cache?.fresh(f, inc.nowMs, inc.maxAgeMs));
  return { todo, skipped: inc.files.length - todo.length };
}

export function batches<T>(items: T[], size = BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
