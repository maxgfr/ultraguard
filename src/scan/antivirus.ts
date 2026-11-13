// A classic antivirus pass with ClamAV, when it is installed: signatures for
// known malware families complement the campaign IOCs (what the news names)
// and the machine analysis (what looks wrong).
//
// Targeted by default, because a whole home directory takes hours: the
// programs startup items run, the files the other checks flagged, temporary
// and shared folders, recent downloads and newly installed extensions.
// `--av-full` scans every root. ultraguard never installs ClamAV; it refreshes
// stale signatures before a scan (defenses.ts), and if that fails, they are a
// coverage gap.
import { accessSync, closeSync, constants, openSync, readdirSync, readSync, realpathSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { writeFileAtomic } from "../engine.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap } from "../types.js";
import { batches, type FullFile, type Incremental, pathsIn, pending, ScanCache } from "./avcache.js";
import { changedMs, type HostInventory } from "./hostintel.js";

type NewFinding = Omit<Finding, "id">;

export interface AvEngine {
  name: "clamscan" | "clamdscan";
  version: string;
  /** When the signature database was built, from the version line. */
  signatures?: string;
  ageDays?: number;
}

const MAX_TARGETS = 20_000;
const MAX_FOLDER_ENTRIES = 50_000;
/** Recent files kept per drop folder, and how deep the listing goes: stealers stage in nested random folders of /tmp and $TMPDIR. */
export const RECENT_CAP = 10_000;
export const RECENT_DEPTH = 6;

/** "ClamAV 1.5.4/27970/Mon Apr 13 08:24:33 2026" → version and signature date. */
export function parseClamVersion(line: string, now = new Date()): Omit<AvEngine, "name"> | undefined {
  const m = /ClamAV\s+([\d.]+)(?:\/(\d+)\/(.+))?/.exec(line.trim());
  if (!m) return undefined;
  const built = m[3] ? new Date(`${m[3]} UTC`) : undefined;
  const ok = built && !Number.isNaN(built.getTime());
  return {
    version: m[1] as string,
    signatures: ok ? built.toISOString() : undefined,
    ageDays: ok ? Math.floor((now.getTime() - built.getTime()) / 86_400_000) : undefined,
  };
}

export async function detectAv(runner: Runner, now = new Date()): Promise<AvEngine | undefined> {
  // clamdscan is much faster (signatures already loaded) but needs a running clamd.
  const ping = await runner("clamdscan", ["--ping", "1"], { timeoutMs: 5_000 });
  const name = ping.ok ? "clamdscan" : "clamscan";
  const v = await runner(name, ["--version"], { timeoutMs: 15_000 });
  if (!v.ok) return undefined;
  const parsed = parseClamVersion(v.stdout, now);
  return parsed ? { name, ...parsed } : undefined;
}

/** Files changed since `sinceMs` under `dir`, depth-bounded and capped: what was left out is counted, never silent. */
function recentFiles(
  dir: string,
  sinceMs: number,
  cap: number,
  depth = 3,
  nowMs = Date.now(),
): { files: string[]; capped: boolean; deeper: number; entries: number; stopped: boolean } {
  const files: string[] = [];
  let capped = false;
  let deeper = 0;
  let entries = 0;
  let stopped = false;
  const walk = (d: string, left: number) => {
    let names: string[] = [];
    try {
      names = readdirSync(d);
    } catch {
      return;
    }
    for (const n of names) {
      if (files.length >= cap) {
        capped = true;
        return;
      }
      // A temp folder can hold millions of entries: the walk is bounded by what it reads, not only by what it keeps.
      if (++entries > MAX_FOLDER_ENTRIES) {
        stopped = true;
        return;
      }
      const p = join(d, n);
      try {
        const st = statSync(p);
        if (st.isDirectory()) {
          if (n === "node_modules" || n === ".git") continue;
          if (left > 0) walk(p, left - 1);
          else deeper++;
        } else if (st.isFile() && changedMs(st, nowMs) >= sinceMs) files.push(p);
      } catch {}
    }
  };
  walk(dir, depth);
  return { files, capped, deeper, entries, stopped };
}

const realOf = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

/** Whether `p` (resolved) is one of `dirs` or inside one: ultraguard's own run and state folders hold the strings the rules look for. */
export function excludedBy(dirs: string[]): (p: string) => boolean {
  const roots = [...new Set(dirs.filter(Boolean).flatMap((d) => [d, realOf(d)].map((x) => x.replace(/\/+$/, ""))))];
  const under = (p: string) => roots.some((d) => p === d || p.startsWith(`${d}/`));
  return (p: string) => roots.length > 0 && (under(p) || under(realOf(p)));
}

/** YARA and ClamAV signature databases, by extension. */
const SIGNATURE_EXT = /\.(yar|yara|yarc|yr|cvd|cld|cud|ndb|hdb|hsb|ldb|mdb|ndu|ign2)$/i;

/**
 * A copy of a rule set (YARA source or compiled, ClamAV databases, a downloaded
 * rule-set archive): it holds the very patterns the scanners look for, so
 * every rule "matches" it. Never a detection; listed once as not scanned.
 */
export function isSignatureFile(p: string): boolean {
  if (SIGNATURE_EXT.test(p)) return true;
  if (/\.zip$/i.test(p) && /yara|sigma|signature|rules/i.test(basename(p))) return true;
  let fd: number | undefined;
  try {
    fd = openSync(p, "r");
    const b = Buffer.alloc(4);
    // yarac's compiled rules start with "YARA".
    return readSync(fd, b, 0, 4, 0) === 4 && b.toString("latin1") === "YARA";
  } catch {
    return false;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** A gap naming the rule-set copies a pass met and did not report. */
export function signatureFilesGap(paths: string[], label: string): Gap | undefined {
  const uniq = [...new Set(paths)];
  if (!uniq.length) return undefined;
  return {
    surface: "host",
    what: `${uniq.length} copy(ies) of a rule set, not judged by the ${label} pass: ${uniq.slice(0, 3).join(", ")}${uniq.length > 3 ? ", ..." : ""}`,
    why: "a YARA or ClamAV rule set holds the patterns it detects, so every rule matches it; check you put it there",
  };
}

/** Folders a dropper writes to, scanned for recent files: Downloads first, then the temp folders (macOS's per-user $TMPDIR too). */
export function dropFolders(home: string): string[] {
  return [join(home, "Downloads"), tmpdir(), "/tmp", "/var/tmp", "/Users/Shared", "/dev/shm"];
}

/**
 * What the targeted pass scans, deduplicated by real path, existing paths
 * only, most telling first: startup items and their programs, flagged files,
 * new extensions, Downloads, then temp folders. `truncated` names what the
 * caps left out.
 */
export function avTargetList(
  home: string,
  inventory: HostInventory,
  flagged: string[],
  sinceMs: number,
  opts: { exclude?: string[]; folders?: string[]; nowMs?: number } = {},
): { targets: string[]; truncated: string[] } {
  const out: string[] = [];
  const real = new Set<string>();
  const skip = excludedBy(opts.exclude ?? []);
  const truncated: string[] = [];
  const add = (p: string | undefined) => {
    if (!p?.startsWith("/") || out.length >= MAX_TARGETS) return;
    let r: string;
    try {
      statSync(p);
      r = realpathSync(p);
    } catch {
      return;
    }
    // One entry per real file: on macOS /tmp is /private/tmp, and a file listed twice is scanned twice.
    if (real.has(r) || skip(p)) return;
    real.add(r);
    out.push(p);
  };
  for (const s of inventory.startupItems) {
    add(s.path);
    if (s.exists) add(s.executable);
    add(s.script);
  }
  for (const p of flagged) add(p);
  for (const e of inventory.recentExtensions) add(e.path);
  const seenDirs = new Set<string>();
  for (const dir of opts.folders ?? dropFolders(home)) {
    const rd = realOf(dir);
    if (seenDirs.has(rd)) continue;
    seenDirs.add(rd);
    const r = recentFiles(dir, sinceMs, RECENT_CAP, RECENT_DEPTH, opts.nowMs);
    const before = out.length;
    for (const p of r.files) add(p);
    const dropped = r.files.length - (out.length - before);
    if (r.capped) truncated.push(`recent files in ${dir} past the first ${RECENT_CAP}`);
    else if (r.stopped) truncated.push(`entries in ${dir} past the first ${MAX_FOLDER_ENTRIES}`);
    else if (dropped > 0 && out.length >= MAX_TARGETS) truncated.push(`${dropped} recent file(s) in ${dir} past the ${MAX_TARGETS}-target cap`);
    if (r.deeper) truncated.push(`${r.deeper} folder(s) in ${dir} deeper than ${RECENT_DEPTH} levels`);
  }
  return { targets: out, truncated };
}

/** What the targeted pass scans (see avTargetList). */
export function avTargets(
  home: string,
  inventory: HostInventory,
  flagged: string[],
  sinceMs: number,
  opts: { exclude?: string[]; folders?: string[] } = {},
): string[] {
  return avTargetList(home, inventory, flagged, sinceMs, opts).targets;
}

/** Split targets by whether this user can read them: clamscan --infected says nothing about the others. */
export function readableTargets(targets: string[]): { readable: string[]; unreadable: string[] } {
  const readable: string[] = [];
  const unreadable: string[] = [];
  for (const t of targets) {
    try {
      accessSync(t, constants.R_OK);
      readable.push(t);
    } catch (e) {
      // Only a refusal: a path that vanished is clamscan's to report.
      if ((e as NodeJS.ErrnoException).code === "EACCES" || (e as NodeJS.ErrnoException).code === "EPERM") unreadable.push(t);
      else readable.push(t);
    }
  }
  return { readable, unreadable };
}

/** `<path>: <Signature> FOUND` lines. */
export function parseClamOutput(stdout: string): { path: string; signature: string }[] {
  const out: { path: string; signature: string }[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^(.*): (.+) FOUND$/.exec(line.trim());
    if (m) out.push({ path: m[1] as string, signature: m[2] as string });
  }
  return out;
}

export async function antivirusPass(
  runner: Runner,
  opts: {
    home: string;
    inventory: HostInventory;
    flagged: string[];
    sinceMs: number;
    full?: string[];
    listDir: string;
    now?: Date;
    /** Folders whose files are never targets nor findings: the run and state folders. */
    exclude?: string[];
    /** Drop folders to list recent files from (default: Downloads and the temp folders). */
    folders?: string[];
    /** The target list, when the caller built it already. */
    targets?: { targets: string[]; truncated: string[] };
    /** A full pass over enumerated files, skipping the ones the cache says are unchanged and clean (the ClamAV cache in `stateDir`). */
    incremental?: Incremental & { stateDir?: string };
  },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number>; engine?: AvEngine }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const stats: Record<string, number> = {};
  const engine = await detectAv(runner, opts.now);
  if (!engine) {
    gaps.push({
      surface: "host",
      what: "a signature-based antivirus pass (known malware families)",
      why: "ClamAV is not installed",
      fix: "brew install clamav (or apt install clamav), then ultraguard rules update and re-run scan host",
    });
    return { findings, gaps, stats };
  }
  if (engine.ageDays !== undefined && engine.ageDays > 7)
    gaps.push({
      surface: "host",
      what: `malware families newer than ${engine.signatures?.slice(0, 10)}`,
      why: `ClamAV's signatures are ${engine.ageDays} days old`,
      fix: "ultraguard rules update (runs freshclam), then re-run scan host",
    });

  // Full and incremental: every file under the roots, minus the ones the cache says are unchanged and clean.
  // One cache for clamscan and clamdscan (same signatures), emptied when ClamAV itself changes version.
  const inc = opts.incremental && {
    ...opts.incremental,
    cache: opts.incremental.cache ?? (opts.incremental.stateDir ? ScanCache.open(opts.incremental.stateDir, "clamav", `ClamAV ${engine.version}`) : undefined),
  };
  const todo = inc ? pending(inc) : undefined;
  if (todo) stats.avSkipped = todo.skipped;
  const list0 = todo
    ? { targets: todo.todo.map((f) => f.path), truncated: [] }
    : opts.full
      ? { targets: opts.full, truncated: [] }
      : (opts.targets ?? avTargetList(opts.home, opts.inventory, opts.flagged, opts.sinceMs, { exclude: opts.exclude, folders: opts.folders }));
  const { readable: targets, unreadable } = readableTargets(list0.targets);
  const skip = excludedBy(opts.exclude ?? []);
  stats.avTargets = targets.length;
  if (inc) stats.avScanned = 0;
  if (unreadable.length)
    gaps.push({
      surface: "host",
      what: `${unreadable.length} antivirus target(s): ${unreadable.slice(0, 3).join(", ")}${unreadable.length > 3 ? ", ..." : ""}`,
      why: "this user cannot read them (owned by root or another user)",
      fix: `sudo clamscan ${unreadable
        .slice(0, 3)
        .map((u) => JSON.stringify(u))
        .join(" ")}`,
    });
  if (!targets.length) return { findings, gaps, stats, engine };
  const byPath = todo ? new Map(todo.todo.map((f) => [f.path, f])) : undefined;
  const all: { path: string; signature: string }[] = [];
  const errors: string[] = [];
  let silent: { status: number; message: string } | undefined;
  let unfinished: string | undefined;
  for (const group of byPath ? batches(targets) : [targets]) {
    // A list file is one path per line: a name with a line break (a hiding trick) goes as an argument instead.
    const { listed, odd } = splitTargets(group);
    const list = join(opts.listDir, "av-targets.txt");
    writeFileAtomic(list, `${listed.join("\n")}\n`);
    const args = ["--infected", "--no-summary", `--file-list=${list}`];
    // The targeted list is short: raise the size limits there. --alert-exceeds-max names what is still too big instead of skipping it silently.
    if (engine.name === "clamscan")
      args.push(
        "--recursive",
        "--stdout",
        ...(opts.full || inc ? ["--max-filesize=100M", "--max-scansize=400M"] : ["--max-filesize=2000M", "--max-scansize=4000M"]),
        "--alert-exceeds-max=yes",
        "--detect-pua=yes",
      );
    else args.push("--fdpass", "--multiscan");
    args.push(...odd);
    const res = await runner(engine.name, args, { timeoutMs: inc ? 60 * 60_000 : opts.full ? 3 * 60 * 60_000 : 20 * 60_000 });
    // Exit 0: clean. 1: something found. 2: errors (unreadable files), possibly with findings.
    const out = `${res.stdout}\n${res.stderr}`;
    // The engine itself did not start (no database, no clamd): nothing was scanned, whatever the list says.
    const engineDown = /cli_loaddbdir|No supported database files|Could not connect to clamd|^ERROR: Can't open file or directory\s*$/im.exec(out);
    const found = parseClamOutput(res.stdout);
    if (engineDown && !found.length) {
      stats.avTargets = 0;
      gaps.push({
        surface: "host",
        what: "the antivirus pass did not run",
        why: `${engine.name}: ${engineDown[0].trim().slice(0, 160)}`,
        fix: "ultraguard rules update (downloads ClamAV's signatures), then re-run scan host",
      });
      return { findings, gaps, stats, engine };
    }
    all.push(...found.filter((h) => !skip(h.path)));
    // Warnings (an old database, a skipped archive) are not errors; unreadable files are.
    // --stdout sends clamscan's error lines to stdout, next to the FOUND ones.
    const errs = out
      .split("\n")
      .filter(
        (l) =>
          /ERROR|Can't open|Can't access|Access denied|Permission denied|Not supported/i.test(l) &&
          !/Warning: \*\*\*|LibClamAV Warning/i.test(l) &&
          !/ FOUND$/.test(l),
      );
    errors.push(...errs.filter((l) => !/^WARNING:/.test(l) || /Can't (open|access)/.test(l)));
    // 0 clean, 1 found, 2 errors: anything else (a timeout, a kill) means the pass did not finish.
    // Exit 1 always comes with a FOUND line; without one it is a crash or a kill the runner reports as 1.
    const finished = (res.status === 0 || res.status === 1 || res.status === 2) && !(res.status === 1 && !found.length);
    if (res.status === 2 && !found.length && !errs.length && !/Warning/i.test(res.stderr))
      silent ??= { status: res.status, message: res.stderr.trim().split("\n")[0] ?? "" };
    if (!finished) {
      unfinished ??= `${engine.name} did not finish (exit ${res.status})`;
      continue;
    }
    if (inc) stats.avScanned = (stats.avScanned ?? 0) + group.length;
    // Clean files go to the cache, saved after every batch. Not a file with a detection or an error, nor a batch that failed without naming its files.
    if (byPath && inc?.cache && !(res.status === 2 && !errs.length)) {
      const set = new Set(group);
      const bad = new Set([...found.map((h) => h.path), ...pathsIn(errs, set)]);
      inc.cache.markClean(
        group.filter((p) => !bad.has(p)).map((p) => byPath.get(p) as FullFile),
        inc.nowMs,
      );
      inc.cache.save();
    }
  }
  // Heuristics.Limits.Exceeded.*: a file over the size limits, not a detection.
  const tooBig = all.filter((h) => /^Heuristics\.Limits\.Exceeded/.test(h.signature));
  const sigCopies = all.filter((h) => isSignatureFile(h.path)).map((h) => h.path);
  const sigGap = signatureFilesGap(sigCopies, "antivirus");
  if (sigGap) gaps.push(sigGap);
  const hits = all.filter((h) => !/^Heuristics\.Limits\.Exceeded/.test(h.signature) && !isSignatureFile(h.path));
  if (tooBig.length)
    gaps.push({
      surface: "host",
      what: `${tooBig.length} file(s) over ClamAV's size limits: ${tooBig
        .slice(0, 3)
        .map((h) => h.path)
        .join(", ")}${tooBig.length > 3 ? ", ..." : ""}`,
      why: "clamscan reads files up to its size limits only",
      fix: `clamscan --max-filesize=4000M --max-scansize=4000M ${tooBig
        .slice(0, 3)
        .map((h) => JSON.stringify(h.path))
        .join(" ")}`,
    });
  for (const h of hits) {
    // PUA.* is ClamAV's "potentially unwanted": adware, bundlers, hacking tools. Worth a look, not proof.
    const pua = /^PUA\./i.test(h.signature);
    // EICAR is the industry's harmless test file: someone tested an antivirus, nothing more.
    const eicar = /^Eicar-(Test-)?Signature/i.test(h.signature);
    findings.push({
      surface: "host",
      severity: eicar ? "info" : pua ? "suspicious" : "compromised",
      subject: h.path,
      title: `ClamAV detects ${h.signature} in ${h.path}${eicar ? " (the harmless EICAR antivirus test file)" : pua ? " (potentially unwanted program)" : ""}`,
      evidence: {
        kind: "command",
        ref: `${engine.name} --no-summary ${h.path}`,
        excerpt: `${h.signature} (ClamAV ${engine.version}, signatures of ${engine.signatures?.slice(0, 10) ?? "?"})`,
      },
      key: `host|av|${h.path}|${h.signature}`,
    });
  }
  stats.avDetections = hits.length;
  if (errors.length || silent !== undefined)
    gaps.push({
      surface: "host",
      what: `${errors.length || "some"} antivirus target(s)`,
      why: `${engine.name} could not read them: ${(errors[0] ?? silent?.message ?? "").slice(0, 160) || `it exited with status ${silent?.status} without naming the file`}`,
    });
  if (unfinished)
    gaps.push({
      surface: "host",
      what: "part of the antivirus pass",
      why: `${unfinished}: files after the stop were not scanned${inc ? " (the files of the batches that finished are remembered: the next --av-full run skips them)" : ""}`,
      fix: "re-run scan host, or narrow --roots",
    });
  if (list0.truncated.length)
    gaps.push({
      surface: "host",
      what: `antivirus targets left out: ${list0.truncated.slice(0, 6).join("; ")}${list0.truncated.length > 6 ? "; ..." : ""}`,
      why: "the targeted list is bounded",
      fix: "scan host --av-full, or --roots <folder> --av-full",
    });
  if (!opts.full && !inc)
    gaps.push({
      surface: "host",
      what: "an antivirus pass over the whole disk",
      why: `the pass is targeted: ${targets.length} files (startup items and their programs, flagged files, recent files in temp and shared folders and Downloads, new extensions)`,
      fix: "scan host --av-full (hours on a large home directory)",
    });
  return { findings, gaps, stats, engine };
}

/** Rule files from a path: one .yar/.yara file, or every one in a folder (not recursive). */
export function yaraRuleFiles(path: string): string[] {
  try {
    const st = statSync(path);
    if (st.isFile()) return [path];
    return readdirSync(path)
      .filter((f) => /\.(yar|yara)$/i.test(f))
      .sort()
      .slice(0, 500)
      .map((f) => join(path, f));
  } catch {
    return [];
  }
}

/** Paths a one-per-line list can hold, and the ones with a line break in their name. */
export function splitTargets(targets: string[]): { listed: string[]; odd: string[] } {
  const listed: string[] = [];
  const odd: string[] = [];
  for (const t of targets) (/[\r\n]/.test(t) ? odd : listed).push(t);
  return { listed, odd };
}

export interface YaraHit {
  rule: string;
  path: string;
  score?: number;
  description?: string;
}

/** `<Rule> <path>`, or with -m `<Rule> [k="v",score=75,...] <path>`, lines from `yara`. */
export function parseYaraOutput(stdout: string): YaraHit[] {
  const out: YaraHit[] = [];
  for (const line of stdout.split("\n")) {
    const t = line.trim();
    const meta = /^(\S+)\s+\[(.*)\]\s+(\/.*)$/.exec(t);
    if (meta) {
      const m = meta[2] as string;
      // yara prints integer metadata as `score =75`: allow spaces around "=".
      const score = /(?:^|,)score\s*=\s*(\d+)/.exec(m)?.[1];
      const description = /(?:^|,)description\s*=\s*"((?:[^"\\]|\\.)*)"/.exec(m)?.[1];
      out.push({ rule: meta[1] as string, path: meta[3] as string, score: score ? Number(score) : undefined, description });
      continue;
    }
    const plain = /^(\S+)\s+(\/.*)$/.exec(t);
    if (plain) out.push({ rule: plain[1] as string, path: plain[2] as string });
  }
  return out;
}

/** Community rules score their own confidence (YARA-Forge: 0 to 100, 75 by default, below 70 for hunting rules). Below this, a match is worth a look, not proof. */
export const COMMUNITY_SCORE = 75;

/**
 * A YARA pass, over the same targets as the antivirus pass, with either rules
 * the agent saved from a source (`--yara`, findings cite that source: a match
 * is a compromise) or a community set (YARA-Forge: the rule's own score sets
 * the severity). A compiled set (.yarc) loads in a fraction of a second.
 */
export async function yaraPass(
  runner: Runner,
  opts: {
    rules: string;
    targets: string[];
    listDir: string;
    source?: string;
    recursive?: boolean;
    /** The rules are a community set: severity follows each rule's score. */
    community?: boolean;
    compiled?: boolean;
    label?: string;
    /** Folders whose matches are never findings: the run folder, the state folder (the rule text itself), the --yara rules. */
    exclude?: string[];
    /** Stat names: "<key>Rules", "<key>Matches"... (default "community" or "yara"). */
    statsKey?: string;
    /** A full pass over enumerated files, skipping the ones the cache says are unchanged and clean. */
    incremental?: Incremental;
  },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number> }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const label = opts.label ?? "YARA";
  const files = opts.compiled ? [opts.rules] : yaraRuleFiles(opts.rules);
  if (!files.length) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: `no .yar or .yara rule file at ${opts.rules}` });
    return { findings, gaps, stats: {} };
  }
  const key = opts.statsKey ?? (opts.community ? "community" : "yara");
  const stats: Record<string, number> = { [`${key}Rules`]: files.length };
  const inc = opts.incremental;
  const todo = inc ? pending(inc) : undefined;
  const targets = todo ? todo.todo.map((f) => f.path) : opts.targets;
  if (todo) Object.assign(stats, { [`${key}Scanned`]: 0, [`${key}Skipped`]: todo.skipped });
  const byPath = todo ? new Map(todo.todo.map((f) => [f.path, f])) : undefined;
  const list = join(opts.listDir, key === "yara" ? "yara-targets.txt" : `yara-${key}-targets.txt`);
  // Always recursive: a new extension is a folder, and its code is in out/ or dist/. A file target is unaffected.
  const base = ["--no-warnings", "--print-meta", "--recursive", ...(opts.compiled ? ["-C"] : [])];
  const timeoutMs = inc ? 60 * 60_000 : opts.recursive ? 3 * 60 * 60_000 : 30 * 60_000;
  let stdout = "";
  let unreadable = 0;
  let failed: { status: number; message: string } | undefined;
  for (const group of byPath ? batches(targets) : [targets]) {
    if (byPath && !group.length) break;
    const { listed, odd } = splitTargets(group);
    writeFileAtomic(list, `${listed.join("\n")}\n`);
    const res = await runner("yara", [...base, "--scan-list", ...files, list], { timeoutMs });
    if (res.missing) {
      gaps.push({ surface: "host", what: `the ${label} pass`, why: "yara is not installed", fix: "brew install yara (or apt install yara)" });
      return { findings, gaps, stats: {} };
    }
    let out = res.stdout;
    let err = res.stderr;
    // yara takes one target per call outside a list: names with a line break get their own call.
    for (const t of odd.slice(0, 50)) {
      const one = await runner("yara", [...base, ...files, t], { timeoutMs: 60_000 });
      out += `\n${one.stdout}`;
      err += `\n${one.stderr}`;
    }
    const errLines = err.split("\n").filter((l) => /could not open file|can not open file/i.test(l));
    unreadable += errLines.length;
    const fatal = err.split("\n").find((l) => l.trim() && !/could not open file|can not open file|warning/i.test(l));
    if (!out.trim() && fatal && !res.ok) {
      gaps.push({ surface: "host", what: `the ${label} pass`, why: `yara failed: ${fatal.slice(0, 200)}` });
      return { findings, gaps, stats };
    }
    stdout += `\n${out}`;
    // Matches found before a timeout, a crash or a kill are kept, but the pass did not cover the rest.
    if (!res.ok) {
      failed ??= { status: res.status, message: (fatal ?? res.stderr.trim().split("\n")[0] ?? "").slice(0, 160) };
      continue;
    }
    if (todo) stats[`${key}Scanned`] = (stats[`${key}Scanned`] ?? 0) + group.length;
    // A finished batch: its files without a match or an error are remembered as clean.
    if (byPath && inc?.cache) {
      const set = new Set(group);
      const bad = new Set([...parseYaraOutput(out).map((h) => h.path), ...pathsIn(errLines, set)]);
      inc.cache.markClean(
        group.filter((p) => !bad.has(p)).map((p) => byPath.get(p) as FullFile),
        inc.nowMs,
      );
      inc.cache.save();
    }
  }
  if (unreadable) gaps.push({ surface: "host", what: `${unreadable} ${label} target(s)`, why: "yara could not open them (permissions, or the file vanished)" });
  if (failed)
    gaps.push({
      surface: "host",
      what: `part of the ${label} pass`,
      why: `yara did not finish (exit ${failed.status}): ${failed.message || "no message"}${inc ? " (the files of the batches that finished are remembered: the next --av-full run skips them)" : ""}`,
      fix: "re-run scan host, or narrow --roots",
    });
  // The rule files contain the strings they look for: never report them, nor ultraguard's own folders.
  const ruleSet = new Set(files);
  const skip = excludedBy(opts.exclude ?? []);
  const parsed = parseYaraOutput(stdout).filter((x) => !ruleSet.has(x.path) && !skip(x.path));
  const sigGap = signatureFilesGap(
    parsed.filter((x) => isSignatureFile(x.path)).map((x) => x.path),
    label,
  );
  if (sigGap) gaps.push(sigGap);
  for (const h of parsed.filter((x) => !isSignatureFile(x.path))) {
    const weak = opts.community && (h.score ?? 0) < COMMUNITY_SCORE;
    findings.push({
      surface: "host",
      severity: weak ? "suspicious" : "compromised",
      subject: h.path,
      title: `${label} rule ${h.rule} matches ${h.path}${h.score !== undefined ? ` (score ${h.score})` : ""}${h.description ? `: ${h.description.slice(0, 140)}` : ""}`,
      ...(opts.source ? { source: opts.source } : {}),
      evidence: {
        kind: "command",
        ref: `yara ${opts.compiled ? "-C " : ""}${files.length === 1 ? files[0] : `<${files.length} rule files in ${opts.rules}>`} ${h.path}`,
      },
      key: `host|yara|${h.path}|${h.rule}`,
    });
  }
  return { findings, gaps, stats: { ...stats, yaraTargets: targets.length, [`${key}Matches`]: findings.length } };
}
