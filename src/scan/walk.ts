// A bounded walk of the user's tree, shared by the host and deps scans so the
// disk is read once. Bounded by depth and by entry count: a home directory can
// hold millions of files, and a scan that never returns protects nobody.
import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { advisoryOnlyKind, lockfileKind, MANIFESTS } from "./lockfiles.js";

export const PRUNE = new Set([
  "node_modules",
  ".git",
  "Library",
  ".Trash",
  ".cache",
  ".npm",
  ".pnpm-store",
  ".yarn",
  ".cargo",
  ".rustup",
  ".gradle",
  ".m2",
  ".venv",
  "venv",
  "__pycache__",
  ".next",
  "dist",
  "build",
  "target",
  ".docker",
  ".local",
  "Pictures",
  "Movies",
  "Music",
  "Photos Library.photoslibrary",
]);

export interface WalkResult {
  files: string[];
  /** Directories that hold a .git, i.e. local clones. */
  gitDirs: string[];
  /** .vscode directories met on the way. */
  vscodeDirs: string[];
  entries: number;
  capped: boolean;
  unreadable: number;
  /** Directories skipped by name (node_modules, Library...), and how many: a coverage gap, never silence. */
  pruned: Record<string, number>;
  /** Folders of more than maxDirEntries entries: only their sub-folders, lockfiles and manifests were read. */
  huge?: string[];
}

/**
 * A folder holding more entries than this is a data set (audio, images, a dump), not code: its plain files are
 * skipped, and said, but its sub-folders, lockfiles and manifests are kept (a project inside a big Downloads).
 */
export const MAX_DIR_ENTRIES = 20_000;
export const HUGE_DIRS = "(folders of more than 20,000 entries: data sets)";

/** Up to five paths, and how many more. */
export const listed = (paths: string[]): string => `${paths.slice(0, 5).join(", ")}${paths.length > 5 ? ` and ${paths.length - 5} more` : ""}`;

/** The file names a folder over the entry limit still yields: lockfiles and manifests. */
const keptName = (name: string): boolean => !!lockfileKind(name) || advisoryOnlyKind(name) || MANIFESTS.has(name);

export function walk(roots: string[], opts: { maxDepth?: number; maxEntries?: number; maxDirEntries?: number } = {}): WalkResult {
  const maxDepth = opts.maxDepth ?? 6;
  const maxEntries = opts.maxEntries ?? 400_000;
  const maxDirEntries = opts.maxDirEntries ?? MAX_DIR_ENTRIES;
  const out: WalkResult = { files: [], gitDirs: [], vscodeDirs: [], entries: 0, capped: false, unreadable: 0, pruned: {}, huge: [] };
  // Level by level: when the entry cap is reached, it cuts the deepest levels of every
  // project, never whole projects that happen to sort after a large one.
  const queue: { dir: string; depth: number }[] = roots.map((dir) => ({ dir, depth: 0 }));
  for (let head = 0; head < queue.length; head++) {
    const { dir, depth } = queue[head] as { dir: string; depth: number };
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      out.unreadable++;
      continue;
    }
    if (depth > 0 && names.length > maxDirEntries) {
      out.pruned[HUGE_DIRS] = (out.pruned[HUGE_DIRS] ?? 0) + 1;
      out.huge?.push(dir);
      // The entry types come with the names (no lstat per file): keep what is not a data file.
      try {
        names = readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isDirectory() || e.name === ".git" || e.name === ".vscode" || (e.isFile() && keptName(e.name)))
          .map((e) => e.name);
      } catch {
        out.unreadable++;
        continue;
      }
    }
    for (const name of names) {
      if (++out.entries > maxEntries) {
        out.capped = true;
        return out;
      }
      const p = join(dir, name);
      if (name === ".git") {
        out.gitDirs.push(dir);
        continue;
      }
      if (name === ".vscode") out.vscodeDirs.push(p);
      let st: ReturnType<typeof lstatSync>;
      try {
        st = lstatSync(p);
      } catch {
        out.unreadable++;
        continue;
      }
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (PRUNE.has(name)) {
          out.pruned[name] = (out.pruned[name] ?? 0) + 1;
          continue;
        }
        if (depth + 1 > maxDepth) {
          out.pruned["(deeper than --depth)"] = (out.pruned["(deeper than --depth)"] ?? 0) + 1;
          continue;
        }
        queue.push({ dir: p, depth: depth + 1 });
      } else if (st.isFile()) out.files.push(p);
    }
  }
  return out;
}
