// A bounded walk of the user's tree, shared by the host and deps scans so the
// disk is read once. Bounded by depth and by entry count: a home directory can
// hold millions of files, and a scan that never returns protects nobody.
import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

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
}

export function walk(roots: string[], opts: { maxDepth?: number; maxEntries?: number } = {}): WalkResult {
  const maxDepth = opts.maxDepth ?? 6;
  const maxEntries = opts.maxEntries ?? 400_000;
  const out: WalkResult = { files: [], gitDirs: [], vscodeDirs: [], entries: 0, capped: false, unreadable: 0 };
  const stack: { dir: string; depth: number }[] = roots.map((dir) => ({ dir, depth: 0 }));
  while (stack.length) {
    const { dir, depth } = stack.pop() as { dir: string; depth: number };
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      out.unreadable++;
      continue;
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
        if (PRUNE.has(name) || depth + 1 > maxDepth) continue;
        stack.push({ dir: p, depth: depth + 1 });
      } else if (st.isFile()) out.files.push(p);
    }
  }
  return out;
}
