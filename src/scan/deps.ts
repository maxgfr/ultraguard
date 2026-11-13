// scan deps: every lockfile under the roots, against two lists.
//  1. The packages the campaign's sources name (IOC `package` indicators),
//     matched here so each finding cites the source that named the package.
//  2. The OSV and GHSA advisory feeds, through package-checker.sh
//     (maxgfr/package-checker.sh, 12 ecosystems), vendored and pinned. A
//     malicious-package advisory (MAL-*) is a compromise and cites its OSV
//     page as a source; ordinary CVEs are a patching backlog, summed up in
//     one info finding and listed in deps-vulnerabilities.json. The CLI hands
//     them to vulns.ts, which ranks them and replaces that line. The feeds are
//     ultraguard's own copy in the state folder (--data-dir), and completeness
//     is package-checker's exit code and JSON report (3, incomplete_reasons).
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { writeFileAtomic } from "../engine.js";
import { matchers, normEco, packageHit, SUPPORTED_ECOSYSTEMS } from "../ioc.js";
import type { Run } from "../run.js";
import { parseJsonOutput, type Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import { PACKAGE_CHECKER_REF, PACKAGE_CHECKER_SCRIPT, PACKAGE_CHECKER_SHA256, PACKAGE_CHECKER_VERSION } from "../vendor/package-checker-script.js";
import { globalInstallDirs, installedPackages } from "./installed.js";
import { advisoryOnlyKind, type Locked, lockfileKind, parseLockfile } from "./lockfiles.js";
import type { WalkResult } from "./walk.js";

type NewFinding = Omit<Finding, "id">;

export interface CheckerVuln {
  package?: string;
  name: string;
  version: string;
  file: string;
  ecosystem: string;
  severity: string;
  advisories: { severity?: string; ghsa?: string; cve?: string; id?: string; source?: string; fix?: string }[];
}

/** One feed of package-checker's JSON report (`sources[]`): where it came from, how many entries, how old. */
export interface CheckerSource {
  kind: string;
  ecosystem: string | null;
  file?: string | null;
  status: "loaded" | "missing" | "failed";
  origin: string | null;
  origin_type?: "local" | "remote" | null;
  entries?: number;
  date?: string | null;
  age_days?: number | null;
  stale?: boolean;
}

/**
 * Runs package-checker on one directory; answers its JSON report, or why it could not.
 * `warnings` are what made a finished run incomplete (a feed it could not load, a file it could not read).
 */
export type Checker = (dir: string) => Promise<{ ok: boolean; vulnerabilities: CheckerVuln[]; error?: string; warnings?: string[]; sources?: CheckerSource[] }>;

/** Older than this (24 hours, not whole days), the advisory feeds in the state folder are refreshed before scan deps. */
export const FEED_STALE_DAYS = 1;

/** A feed last written at `mtime` (ms or ISO date) is stale: older than FEED_STALE_DAYS, to the millisecond. */
export const feedStale = (mtime: number | string, now: Date): boolean =>
  now.getTime() - (typeof mtime === "number" ? mtime : Date.parse(mtime)) > FEED_STALE_DAYS * 86_400_000;

/** Where ultraguard keeps package-checker's advisory feeds, refreshed by `rules update` and scan deps. */
export const feedDir = (state: string): string => join(state, "package-checker", "data");

/**
 * The feed files a complete copy holds: GHSA and OSV for every ecosystem package-checker's --update-feeds
 * downloads (read from its FEED_ECOSYSTEM_MAP; the runtime feed is not read, --no-runtime-check).
 */
export const FEED_FILES: string[] = (() => {
  const map = /FEED_ECOSYSTEM_MAP=\(([\s\S]*?)\n\)/.exec(PACKAGE_CHECKER_SCRIPT)?.[1] ?? "";
  const types = [...map.matchAll(/"([a-z]+)\|/g)].map((m) => m[1] as string);
  return (types.length ? types : ["npm"]).flatMap((t) => ["ghsa", "osv"].map((k) => (t === "npm" ? `${k}.purl` : `${k}-${t}.purl`)));
})();

/** The feed copy in `dir`: how many files, the feeds it lacks, and the age in whole days of the oldest one. */
export function localFeeds(dir: string, now = new Date()): { files: number; missing: string[]; ageDays: number; date: string; stale: boolean } | undefined {
  let oldest = Number.POSITIVE_INFINITY;
  const names = new Set<string>();
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".purl")) continue;
      names.add(f);
      oldest = Math.min(oldest, statSync(join(dir, f)).mtimeMs);
    }
  } catch {
    return undefined;
  }
  if (!names.size) return undefined;
  return {
    files: names.size,
    missing: FEED_FILES.filter((f) => !names.has(f)),
    ageDays: Math.max(0, Math.floor((now.getTime() - oldest) / 86_400_000)),
    date: new Date(oldest).toISOString(),
    stale: feedStale(oldest, now),
  };
}

/** One line on the feeds a scan loaded: how many, from where, how old; the ones it could not load. */
export function feedSummary(feeds: CheckerSource[]): string {
  const loaded = feeds.filter((f) => f.status === "loaded");
  const local = loaded.filter((f) => f.origin_type === "local" && f.origin);
  const dirs = [...new Set(local.map((f) => dirname(f.origin as string)))];
  const oldest = local.reduce<CheckerSource | undefined>((o, f) => ((f.age_days ?? 0) >= (o?.age_days ?? -1) ? f : o), undefined);
  const parts = [
    `${loaded.length} loaded, ${loaded.reduce((n, f) => n + (f.entries ?? 0), 0)} entries`,
    local.length ? `${local.length} from ${dirs.join(", ")} (oldest ${oldest?.age_days ?? "?"} days, ${oldest?.date?.slice(0, 10) ?? "?"})` : "",
    loaded.length - local.length ? `${loaded.length - local.length} downloaded during the scan` : "",
    ...feeds.filter((f) => f.status !== "loaded").map((f) => `${f.kind} for ${f.ecosystem ?? "?"} ${f.status}`),
  ];
  return parts.filter(Boolean).join("; ");
}

/** Writes the vendored script where it can run, once per pinned version. */
export function materializeChecker(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `package-checker-${PACKAGE_CHECKER_VERSION}-${PACKAGE_CHECKER_SHA256.slice(0, 12)}.sh`);
  if (!existsSync(p) || statSync(p).size !== Buffer.byteLength(PACKAGE_CHECKER_SCRIPT)) writeFileAtomic(p, PACKAGE_CHECKER_SCRIPT);
  return p;
}

/** The runner's exit status for a command it killed on timeout. */
const TIMED_OUT = 124;
const CHECK_TIMEOUT_MIN = 15;
const UPDATE_TIMEOUT_MIN = 20;

/** The line of package-checker's error output that says why: its first "Error:" line, else the last line. */
const checkerError = (out: string): string | undefined => {
  const lines = out
    .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (lines.find((l) => /(^|\s)Error:/.test(l)) ?? lines.at(-1))?.replace(/^❌\s*/, "").slice(0, 200);
};

/**
 * Refreshes the advisory feeds in `dir` with package-checker's `--update-feeds`.
 * Exit 0: all refreshed; 3: some failed, their previous copies kept; 2: it could not run.
 */
export async function updateCheckerFeeds(runner: Runner, dir: string): Promise<{ ok: boolean; detail: string }> {
  const script = materializeChecker(join(dir, "..", "bin"));
  const res = await runner("bash", [script, "--update-feeds", "--data-dir", dir], { timeoutMs: UPDATE_TIMEOUT_MIN * 60_000 });
  if (res.missing) return { ok: false, detail: "bash is not installed" };
  const summary = /Updated \d+ of \d+ feed\(s\)/.exec(res.stdout)?.[0];
  if (res.status === 0) return { ok: true, detail: summary ?? "feeds updated" };
  // A download cut short (killed on timeout) leaves its temp file (.<feed>.purl.tmp.XXXXXX) behind.
  try {
    for (const f of readdirSync(dir)) if (/^\..+\.purl\.tmp\./.test(f)) rmSync(join(dir, f), { force: true });
  } catch {
    // No feed folder: nothing to clean.
  }
  if (res.status === TIMED_OUT) return { ok: false, detail: `timed out after ${UPDATE_TIMEOUT_MIN} min` };
  if (res.status === 3) return { ok: false, detail: `${summary ?? "some feeds"} (the others could not be downloaded)` };
  return { ok: false, detail: checkerError(`${res.stderr}\n${res.stdout}`) ?? `exit ${res.status}` };
}

/** What to do about a failed package-checker run, by its error. */
const checkerFix = (error: string): string =>
  /bash 4|bash is not installed/i.test(error)
    ? "brew install bash (package-checker needs Bash 4 or newer), then re-run"
    : /^timed out/.test(error)
      ? "re-run with --roots narrowed to your code folders"
      : "re-run when online";

/** What to do about one of package-checker's incomplete_reasons. */
const warningFix = (reason: string): string =>
  /\bfeed\b.*could not be (found|loaded)/.test(reason)
    ? "ultraguard rules update, then re-run scan deps"
    : /\bbun\b/.test(reason)
      ? "install bun (https://bun.sh) so package-checker can read bun.lockb, then re-run scan deps"
      : /could not be read/.test(reason)
        ? "check the permissions of those files, then re-run scan deps"
        : "check those lockfiles by hand";

export function defaultChecker(runner: Runner, workDir: string, opts: { dataDir?: string } = {}): Checker {
  const script = materializeChecker(join(workDir, "tools"));
  // ultraguard owns the feed copy and its age: on a complete copy, --max-feed-age 0 keeps package-checker on it whatever
  // its age (ultraguard refreshes it and reports the age). A feed missing from the copy would be looked up in
  // package-checker's other places (its Homebrew copy, then a download): with a partial copy its own age limit stays.
  const have = opts.dataDir ? localFeeds(opts.dataDir) : undefined;
  const feeds = opts.dataDir && have ? ["--data-dir", opts.dataDir, ...(have.missing.length ? [] : ["--max-feed-age", "0"])] : [];
  let n = 0;
  return async (dir) => {
    const out = join(workDir, `package-checker-${++n}.json`);
    // A report left by an earlier scan in this run must never pass for this one's.
    rmSync(out, { force: true });
    // Exit 0: nothing found. 1: vulnerabilities found. 3: incomplete. 2: it could not scan.
    const res = await runner(
      "bash",
      // --no-default-prune: ultraguard's walk decides which folders count (Pods, .nuxt, site-packages included).
      [script, dir, "--default-source-ghsa-osv", "--only-lockfiles", "--no-config", "--no-runtime-check", "--no-default-prune", ...feeds, "--export-json", out],
      {
        timeoutMs: CHECK_TIMEOUT_MIN * 60_000,
        cwd: workDir,
      },
    );
    if (res.missing) return { ok: false, vulnerabilities: [], error: "bash is not installed" };
    if (res.status === TIMED_OUT) return { ok: false, vulnerabilities: [], error: `timed out after ${CHECK_TIMEOUT_MIN} min` };
    if (res.status !== 0 && res.status !== 1 && res.status !== 3)
      return { ok: false, vulnerabilities: [], error: checkerError(`${res.stderr}\n${res.stdout}`) ?? `exit ${res.status}` };
    if (!existsSync(out)) return { ok: res.status === 0, vulnerabilities: [], error: res.status === 0 ? undefined : "no JSON report written" };
    const json = parseJsonOutput<{ vulnerabilities?: CheckerVuln[]; incomplete?: boolean; incomplete_reasons?: string[]; sources?: CheckerSource[] }>({
      ok: true,
      status: 0,
      stdout: readFileSync(out, "utf8"),
      stderr: "",
    });
    if (!json) return { ok: false, vulnerabilities: [], error: "unreadable JSON report" };
    // No OSV feed: no MAL- advisory was loaded, so "0 malicious" would be a lie.
    const warnings = (json.incomplete_reasons ?? []).map((r) => (/\bosv feed\b/i.test(r) ? `${r}: malicious-package (MAL-) advisories were not loaded` : r));
    if ((res.status === 3 || json.incomplete) && !warnings.length) warnings.push("the scan was incomplete (exit 3)");
    return {
      ok: true,
      vulnerabilities: (json.vulnerabilities ?? []).map((v) => ({ ...v, file: isAbsolute(v.file) ? v.file : resolve(workDir, v.file) })),
      warnings,
      sources: json.sources ?? [],
    };
  };
}

const rootOf = (d: string, roots: string[]) =>
  roots.filter((r) => d === r || d.startsWith(r.endsWith(sep) ? r : r + sep)).sort((a, b) => b.length - a.length)[0];

/** Lockfiles that sit directly in a walk root: handing the root to package-checker would walk all of it. */
export function rootLevelLockfiles(lockfiles: string[], roots: string[]): string[] {
  return lockfiles.filter((f) => rootOf(dirname(f), roots) === dirname(f));
}

/**
 * Folders package-checker never descends into, even with --no-default-prune (its default ignore_paths;
 * node_modules, .git and .yarn are pruned by ultraguard's walk too). A lockfile under one is staged on its own.
 */
const CHECKER_IGNORED = new Set(["vendor"]);

/** Lockfiles package-checker would skip in their group: under a folder it always ignores. */
export function ignoredByChecker(lockfiles: string[], roots: string[]): string[] {
  return lockfiles.filter((f) => {
    const d = dirname(f);
    const root = rootOf(d, roots);
    return (root ? relative(root, d) : d).split(sep).some((s) => CHECKER_IGNORED.has(s));
  });
}

/**
 * Directories to hand package-checker: lockfile folders grouped two levels
 * under their walk root, so one run covers a whole projects folder instead of
 * one run per lockfile, and no run walks the whole home directory. A lockfile
 * directly in a root is left out: scanDeps stages it on its own.
 */
export function checkerGroups(lockfiles: string[], roots: string[]): string[] {
  const groups = new Set<string>();
  for (const f of lockfiles) {
    const d = dirname(f);
    const root = rootOf(d, roots);
    if (!root) {
      groups.add(d);
      continue;
    }
    const rel = relative(root, d).split(sep).filter(Boolean);
    if (rel.length) groups.add(join(root, ...rel.slice(0, 2)));
  }
  // Drop a group nested inside another one.
  const list = [...groups].sort();
  return list.filter((g) => !list.some((o) => o !== g && g.startsWith(o + sep)));
}

export interface DepsScanOptions {
  /** package-checker: a fake in tests, false to skip it (--no-osv). */
  checker?: Checker | false;
  runner?: Runner;
  /** The walk roots, to group lockfiles into package-checker runs. */
  roots?: string[];
  now?: Date;
  /**
   * The home directory whose global installs (npm -g, nvm, bun, uv tools, pipx) are read for the
   * campaign's packages. Unset: global installs are not read (a gap says so).
   */
  home?: string;
  /** Global install folders, instead of the ones under `home` and the system ones (tests). */
  globalDirs?: { node: string[]; python: string[] };
  /** The advisory feed copy package-checker reads (--data-dir): feedDir(state). Empty: downloaded once for the scan. Unset: each run downloads them. */
  feedDir?: string;
  /** Why refreshing that copy failed, when it did: the stale-feed gap says so. */
  feedRefreshError?: string;
}

const MANIFESTS = new Set(["package.json", "pyproject.toml", "Pipfile", "Gemfile", "setup.py", "setup.cfg"]);

export async function scanDeps(
  iocs: IocFile,
  tree: WalkResult,
  run: Run | undefined,
  opts: DepsScanOptions = {},
): Promise<{ result: SurfaceResult; findings: NewFinding[]; gaps: Gap[]; vulnerable: CheckerVuln[] }> {
  const result: SurfaceResult = { surface: "deps", scanned: true, stats: {}, startedAt: (opts.now ?? new Date()).toISOString() };
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  // The locked versions with known CVEs (not malicious): what `vulns` ranks.
  const backlog: CheckerVuln[] = [];
  const pkgs = matchers(iocs, "package");

  const where = new Map<string, Set<string>>(); // "eco|name|version" -> lockfiles
  let lockfiles = 0;
  let unreadable = 0;
  const lockfilePaths = new Set<string>();
  // Lockfiles package-checker reads but ultraguard has no parser for: advisories only.
  const advisoryOnly = new Set<string>();
  const manifests: string[] = [];
  const shown = (l: Locked) => (l.version === "*" ? `${l.name} (unpinned)` : `${l.name}@${l.version}`);
  const hit = (p: string, l: Locked, title: string) => {
    for (const m of pkgs) {
      if (!packageHit(m.indicator, l.ecosystem, l.name, l.version)) continue;
      findings.push({
        surface: "deps",
        severity: "compromised",
        subject: p,
        title: `${title}, named by the campaign`,
        campaign: m.campaign.id,
        source: m.indicator.source,
        indicator: { type: "package", value: m.indicator.value },
        evidence: { kind: "file", ref: p, excerpt: `${l.ecosystem} ${l.name}@${l.version}` },
        key: `deps|${p}|${l.ecosystem}|${l.name}|${l.version}`,
      });
    }
  };
  for (const p of tree.files) {
    if (MANIFESTS.has(basename(p))) manifests.push(p);
    if (!lockfileKind(p)) {
      if (advisoryOnlyKind(p)) advisoryOnly.add(p);
      continue;
    }
    let locked: Locked[];
    try {
      if (statSync(p).size > 64 * 1024 * 1024) throw new Error("too large");
      locked = parseLockfile(p, readFileSync(p, "utf8"));
    } catch {
      unreadable++;
      continue;
    }
    lockfiles++;
    lockfilePaths.add(p);
    for (const l of locked) {
      const k = `${l.ecosystem}|${l.name}|${l.version}`;
      const set = where.get(k) ?? new Set<string>();
      set.add(p);
      where.set(k, set);
      hit(p, l, `${p} ${l.version === "*" ? "requires" : "locks"} ${shown(l)}`);
    }
  }
  result.stats.lockfiles = lockfiles;
  if (advisoryOnly.size) result.stats.advisoryOnlyLockfiles = advisoryOnly.size;

  // A project with a manifest and no lockfile ultraguard reads (in its folder or above it): its manifest is matched instead.
  // A lockfile read for advisories only (bun.lockb, deno.lock...) names no package here, so its project stays an orphan.
  const lockDirs = new Set([...lockfilePaths, ...advisoryOnly].map((p) => dirname(p)));
  const under = (dirs: Set<string>, d: string): boolean => {
    for (let x = d; ; x = dirname(x)) {
      if (dirs.has(x)) return true;
      if (dirname(x) === x) return false;
    }
  };
  const parsedDirs = new Set([...lockfilePaths].map((p) => dirname(p)));
  const advisoryDirs = new Set([...advisoryOnly].map((p) => dirname(p)));
  const orphans = manifests.filter((m) => !under(parsedDirs, dirname(m)));
  if (pkgs.length && orphans.length) {
    let unread = 0;
    for (const m of orphans) {
      const advisoryLocked = under(advisoryDirs, dirname(m));
      if (basename(m) !== "package.json") {
        // The gap on advisory-only lockfiles below covers a manifest next to one.
        if (!advisoryLocked) unread++;
        continue;
      }
      // package.json names its dependencies: an every-version indicator (a typosquat) matches the name alone.
      const why = advisoryLocked ? "its lockfile is read for advisories only" : "no lockfile";
      try {
        const j = JSON.parse(readFileSync(m, "utf8"));
        for (const field of ["dependencies", "devDependencies", "optionalDependencies"])
          for (const name of Object.keys(j?.[field] ?? {})) hit(m, { ecosystem: "npm", name, version: "*" }, `${m} depends on ${name} (${why})`);
      } catch {
        unread++;
      }
    }
    if (unread)
      gaps.push({
        surface: "deps",
        what: `${unread} manifest(s) with no lockfile (pyproject.toml, Pipfile, Gemfile, setup.py)`,
        why: "only lockfiles and package.json are matched against the campaign's packages",
        fix: "check those projects' dependencies by hand, or lock them",
      });
  }
  if (pkgs.length && advisoryOnly.size)
    gaps.push({
      surface: "deps",
      what: `${advisoryOnly.size} lockfile(s) checked against the advisory feeds only, not the campaign's packages: ${[...advisoryOnly].slice(0, 5).join(", ")}${advisoryOnly.size > 5 ? ", ..." : ""}`,
      why: "ultraguard has no reader for these lockfiles; a package.json next to one is matched by package name only",
      fix: "check those projects' locked versions by hand (`bun bun.lockb` prints a bun.lockb as a yarn.lock)",
    });

  // What a project or a global install put on disk: a `pip install` or an `npm -g` CLI has no lockfile.
  if (pkgs.length) {
    const projects = [...lockDirs, ...manifests.map((m) => dirname(m)), ...tree.gitDirs];
    const globals = opts.globalDirs ?? (opts.home ? globalInstallDirs(opts.home) : undefined);
    const inst = installedPackages(projects, globals);
    result.stats.installedPackages = inst.packages.length;
    for (const l of inst.packages) hit(l.where, l, `${l.name}@${l.version} is installed in ${l.where}`);
  }
  if (!opts.home && !opts.globalDirs)
    gaps.push({
      surface: "deps",
      what: "global installs (npm -g, nvm, bun, uv tools, pipx)",
      why: "not read in this scan",
    });

  // Package indicators in an ecosystem no reader covers match nothing: say so instead of a silent CLEAN.
  const unsupported = new Map<string, number>();
  for (const m of pkgs) {
    const e = normEco(m.indicator.ecosystem ?? "");
    if (!(SUPPORTED_ECOSYSTEMS as readonly string[]).includes(e)) unsupported.set(e || "(none)", (unsupported.get(e || "(none)") ?? 0) + 1);
  }
  if (unsupported.size)
    gaps.push({
      surface: "deps",
      what: `package indicator(s) in ecosystems ultraguard cannot check: ${[...unsupported].map(([e, n]) => `${e} (${n})`).join(", ")}`,
      why: `no reader for these ecosystems (supported: ${SUPPORTED_ECOSYSTEMS.join(", ")})`,
      fix: "check them by hand",
    });
  if (tree.capped)
    gaps.push({
      surface: "deps",
      what: `lockfiles past the first ${tree.entries} entries of the walk`,
      why: "the walk is capped",
      fix: "re-run with --roots narrowed to your code folders",
    });
  if (tree.unreadable) gaps.push({ surface: "deps", what: `lockfiles in ${tree.unreadable} unreadable directories`, why: "permission denied" });
  const deeper = tree.pruned?.["(deeper than --depth)"] ?? 0;
  if (deeper)
    gaps.push({
      surface: "deps",
      what: `lockfiles deeper than --depth in ${deeper} folder(s)`,
      why: "the walk stops at --depth",
      fix: "re-run with a larger --depth, or --roots narrowed to your code folders",
    });
  if (lockfiles + advisoryOnly.size === 0)
    gaps.push({
      surface: "deps",
      what: `no lockfile found under ${opts.roots?.length ? opts.roots.join(", ") : "the walk roots"}`,
      why: "nothing to compare with the package indicators and the advisory feeds",
      fix: "pass --roots <the folders that hold your code>",
    });
  result.stats.packages = where.size;
  if (unreadable) gaps.push({ surface: "deps", what: `${unreadable} lockfiles`, why: "could not be parsed or were over 64 MB" });

  if (opts.checker !== false && lockfiles + advisoryOnly.size > 0) {
    const workDir = run ? join(run.dir, "package-checker") : join(tmpdir(), `ultraguard-pc-${process.pid}`);
    mkdirSync(workDir, { recursive: true });
    const injected = opts.checker || undefined;
    const runner = injected ? undefined : opts.runner;
    if (!injected && !runner) gaps.push({ surface: "deps", what: "the OSV and GHSA advisory feeds", why: "no command runner" });
    else {
      const all = [...lockfilePaths, ...advisoryOnly];
      const roots = opts.roots ?? [];
      // A lockfile directly in a walk root is copied to a folder of its own: package-checker would walk the whole root.
      // So is one under a folder package-checker ignores (vendor): its group's run would skip it.
      const ignored = new Set(ignoredByChecker(all, roots));
      const staged = new Map<string, string>(); // staged dir -> original lockfile
      for (const [i, f] of [...new Set([...rootLevelLockfiles(all, roots), ...ignored])].entries()) {
        const d = join(workDir, "root-lockfiles", String(i + 1));
        try {
          rmSync(d, { recursive: true, force: true });
          mkdirSync(d, { recursive: true });
          copyFileSync(f, join(d, basename(f)));
          staged.set(d, f);
        } catch {
          gaps.push({ surface: "deps", what: `advisories for ${f}`, why: "the lockfile could not be copied for package-checker" });
        }
      }
      const groups = [
        ...checkerGroups(
          all.filter((f) => !ignored.has(f)),
          roots,
        ),
        ...staged.keys(),
      ];
      // No feed copy in the state folder (--no-update on a fresh state, a failed first refresh): download the
      // feeds once for this scan into the run folder, not once per run; removed after the runs.
      let dataDir = opts.feedDir;
      if (runner && dataDir && groups.length > 1 && !localFeeds(dataDir)) {
        const once = join(workDir, "data");
        await updateCheckerFeeds(runner, once);
        if (localFeeds(once)) dataDir = once;
      }
      const checker = injected ?? defaultChecker(runner as Runner, workDir, { dataDir });
      const vulns: CheckerVuln[] = [];
      let failed = 0;
      const sources = new Map<string, CheckerSource>();
      for (const g of groups) {
        const r = await checker(g);
        const orig = staged.get(g);
        const label = orig ?? `the lockfiles under ${g}`;
        if (!r.ok) {
          failed++;
          gaps.push({
            surface: "deps",
            what: `advisories for ${label}`,
            why: `package-checker failed: ${r.error ?? "unknown error"}`,
            fix: checkerFix(r.error ?? ""),
          });
          continue;
        }
        // A staged copy is named by the lockfile it stands for.
        for (const w of r.warnings ?? [])
          gaps.push({
            surface: "deps",
            what: `advisories for ${label}`,
            why: `package-checker: ${orig ? w.split(join(g, basename(orig))).join(orig) : w}`,
            fix: warningFix(w),
          });
        for (const src of r.sources ?? []) {
          const k = `${src.kind}|${src.ecosystem}|${src.origin}`;
          if (!sources.has(k)) sources.set(k, src);
        }
        vulns.push(...(orig ? r.vulnerabilities.map((v) => ({ ...v, file: orig })) : r.vulnerabilities));
      }
      if (dataDir && dataDir !== opts.feedDir) rmSync(dataDir, { recursive: true, force: true });
      // The feeds the runs loaded: where from, how many entries, how old.
      const feeds = [...sources.values()];
      const local = feeds.filter((f) => f.status === "loaded" && f.origin_type === "local" && typeof f.age_days === "number");
      const feedAge = local.length ? Math.max(...local.map((f) => f.age_days as number)) : feeds.some((f) => f.status === "loaded") ? 0 : undefined;
      if (feedAge !== undefined) result.stats.feedAgeDays = feedAge;
      if (feeds.length) result.stats.feedEntries = feeds.reduce((n, f) => n + (f.status === "loaded" ? (f.entries ?? 0) : 0), 0);
      if (run && feeds.length) run.setMeta({ advisoryFeeds: feeds });
      // Stale from the file date when package-checker gives it: its age_days is floored to whole days.
      const now = opts.now ?? new Date();
      const stale = local.filter((f) => (f.date && !Number.isNaN(Date.parse(f.date)) ? feedStale(f.date, now) : (f.age_days as number) > FEED_STALE_DAYS));
      if (feedAge !== undefined && stale.length) {
        const dirs = [...new Set(stale.map((f) => dirname(f.origin as string)))];
        gaps.push({
          surface: "deps",
          what: `advisories newer than ${feedAge} days (feeds read from ${dirs.join(", ")})`,
          why: opts.feedRefreshError
            ? `the feed refresh failed (${opts.feedRefreshError}): the ${feedAge}-day-old copy was used`
            : `the local copy of the advisory feeds is ${feedAge} days old`,
          fix: "ultraguard rules update, then re-run scan deps",
        });
      }
      // One entry per locked file and version, whatever run reported it.
      const seen = new Set<string>();
      const unique = vulns.filter((v) => {
        const k = `${v.file}|${v.ecosystem}|${v.name}|${v.version}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      vulns.length = 0;
      vulns.push(...unique);
      result.stats.checkerRuns = groups.length - failed;
      let malicious = 0;
      for (const v of vulns) {
        const mal = v.advisories.filter((a) => (a.id ?? "").startsWith("MAL-"));
        if (!mal.length) {
          backlog.push(v);
          continue;
        }
        for (const a of mal) {
          malicious++;
          const url = `https://osv.dev/vulnerability/${a.id}`;
          const src = run?.addSource({ url, title: `OSV ${a.id}: malicious package ${v.name}`, fetchedAt: new Date().toISOString(), origin: "osv" });
          findings.push({
            surface: "deps",
            severity: "compromised",
            subject: v.file,
            title: `${v.file} locks ${v.name}@${v.version}, a malicious package (${a.id})`,
            source: src?.id,
            evidence: { kind: "url", ref: url, excerpt: `${v.ecosystem} ${v.name}@${v.version} (package-checker ${PACKAGE_CHECKER_VERSION})` },
            key: `deps|${v.file}|${v.ecosystem}|${v.name}|${v.version}|${a.id}`,
          });
        }
      }
      result.stats.malicious = malicious;
      result.stats.vulnerable = backlog.length;
      if (run)
        run.write("deps-vulnerabilities.json", {
          checker: `package-checker.sh ${PACKAGE_CHECKER_VERSION}`,
          ref: PACKAGE_CHECKER_REF,
          sha256: PACKAGE_CHECKER_SHA256,
          sources: feeds,
          vulnerabilities: vulns,
        });
      if (backlog.length) {
        const by = (sev: string) => backlog.filter((v) => v.severity === sev).length;
        findings.push({
          surface: "deps",
          severity: "info",
          subject: "vulnerable dependencies",
          title: `${backlog.length} locked package versions have known vulnerabilities (${by("critical")} critical, ${by("high")} high): a patching backlog, not a compromise (deps-vulnerabilities.json)`,
          evidence: { kind: "file", ref: "deps-vulnerabilities.json" },
          key: "deps|vulnerable-backlog",
        });
      }
    }
  } else if (opts.checker === false) gaps.push({ surface: "deps", what: "the OSV and GHSA advisory feeds (malicious packages)", why: "--no-osv" });

  gaps.push({
    surface: "deps",
    what: "cargo install binaries, Docker images, and the yarn, pnpm, bun and uv download caches",
    why: "only lockfiles, package.json, node_modules, virtualenvs and global install folders are read",
  });
  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps, vulnerable: backlog };
}
