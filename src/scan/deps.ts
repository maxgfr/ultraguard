// scan deps: every lockfile under the roots, against two lists.
//  1. The packages the campaign's sources name (IOC `package` indicators),
//     matched here so each finding cites the source that named the package.
//  2. The OSV and GHSA advisory feeds, through package-checker.sh
//     (maxgfr/package-checker.sh, 12 ecosystems), vendored and pinned. A
//     malicious-package advisory (MAL-*) is a compromise and cites its OSV
//     page as a source; ordinary CVEs are a patching backlog, summed up in
//     one info finding and listed in deps-vulnerabilities.json.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { writeFileAtomic } from "../engine.js";
import { matchers, normEco, packageHit, SUPPORTED_ECOSYSTEMS } from "../ioc.js";
import type { Run } from "../run.js";
import { parseJsonOutput, type Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import { PACKAGE_CHECKER_SCRIPT, PACKAGE_CHECKER_SHA256, PACKAGE_CHECKER_VERSION } from "../vendor/package-checker-script.js";
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

/** One advisory feed package-checker loaded: a URL, or a local copy and its age. */
export interface CheckerFeed {
  feed: string;
  source: string;
  ageDays?: number;
}

/**
 * Runs package-checker on one directory; answers its JSON report, or why it could not.
 * `warnings` are what made a finished run partial (a feed it could not load, a file it could not read).
 */
export type Checker = (dir: string) => Promise<{ ok: boolean; vulnerabilities: CheckerVuln[]; error?: string; warnings?: string[]; feeds?: CheckerFeed[] }>;

/**
 * What package-checker printed about its feeds and the files it skipped. A run
 * that exits 0 or 1 can still have loaded no OSV feed (the malicious-package
 * advisories), or read its feeds from a stale local copy.
 */
export function readCheckerLog(log: string, now = Date.now()): { missingOsv: string[]; warnings: string[]; feeds: CheckerFeed[] } {
  // The ANSI colours package-checker prints would stick to the paths it names.
  const text = log.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "");
  const missingOsv: string[] = [];
  const warnings: string[] = [];
  const feeds: CheckerFeed[] = [];
  for (const m of text.matchAll(/Unable to find (\w+) feed for (\S+)/g)) {
    if (m[1] === "osv") missingOsv.push(m[2] as string);
    else warnings.push(`the ${(m[1] as string).toUpperCase()} feed for ${m[2]} could not be loaded`);
  }
  if (/results may be incomplete/.test(text)) warnings.push("some directories could not be read");
  const unreadable = (text.match(/Cannot read this file: it was not scanned/g) ?? []).length;
  if (unreadable) warnings.push(`${unreadable} lockfile(s) could not be read`);
  const ignored = /Skipping (\d+) git-ignored file/.exec(text);
  if (ignored) warnings.push(`${ignored[1]} git-ignored lockfile(s) were skipped`);
  for (const m of text.matchAll(/Using (\w+) source: (\S+)/g)) {
    const source = m[2] as string;
    const f: CheckerFeed = { feed: m[1] as string, source };
    if (!/^https?:\/\//.test(source))
      try {
        f.ageDays = Math.floor((now - statSync(source).mtimeMs) / 86_400_000);
      } catch {
        // A path we cannot stat: no age to report.
      }
    feeds.push(f);
  }
  return { missingOsv, warnings, feeds };
}

/** Writes the vendored script where it can run, once per version. */
export function materializeChecker(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `package-checker-${PACKAGE_CHECKER_VERSION}.sh`);
  if (!existsSync(p) || statSync(p).size !== Buffer.byteLength(PACKAGE_CHECKER_SCRIPT)) writeFileAtomic(p, PACKAGE_CHECKER_SCRIPT);
  return p;
}

export function defaultChecker(runner: Runner, workDir: string): Checker {
  const script = materializeChecker(join(workDir, "tools"));
  let n = 0;
  return async (dir) => {
    const out = join(workDir, `package-checker-${++n}.json`);
    // A report left by an earlier scan in this run must never pass for this one's.
    rmSync(out, { force: true });
    // Exit 0: nothing found. 1: vulnerabilities found. Anything else: it could not scan.
    // --include-gitignored: a lockfile a repository ignores is still what was installed.
    const res = await runner(
      "bash",
      [script, dir, "--default-source-ghsa-osv", "--only-lockfiles", "--include-gitignored", "--no-config", "--no-runtime-check", "--export-json", out],
      {
        timeoutMs: 15 * 60_000,
        cwd: workDir,
      },
    );
    if (res.missing) return { ok: false, vulnerabilities: [], error: "bash is not installed" };
    if (res.status !== 0 && res.status !== 1)
      return { ok: false, vulnerabilities: [], error: (res.stderr || res.stdout).trim().split("\n").slice(-1)[0]?.slice(0, 200) };
    const log = readCheckerLog(`${res.stdout}\n${res.stderr}`);
    // No OSV feed: no MAL- advisory was loaded, so "0 malicious" would be a lie.
    if (log.missingOsv.length)
      return { ok: false, vulnerabilities: [], error: `OSV feed unreachable for ${log.missingOsv.join(", ")}: malicious-package advisories not loaded` };
    const extra = { warnings: log.warnings, feeds: log.feeds };
    if (!existsSync(out)) return { ok: res.status === 0, vulnerabilities: [], error: res.status === 0 ? undefined : "no JSON report written", ...extra };
    const json = parseJsonOutput<{ vulnerabilities?: CheckerVuln[] }>({ ok: true, status: 0, stdout: readFileSync(out, "utf8"), stderr: "" });
    if (!json) return { ok: false, vulnerabilities: [], error: "unreadable JSON report" };
    return {
      ok: true,
      vulnerabilities: (json.vulnerabilities ?? []).map((v) => ({ ...v, file: isAbsolute(v.file) ? v.file : resolve(workDir, v.file) })),
      ...extra,
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
}

const MANIFESTS = new Set(["package.json", "pyproject.toml", "Pipfile", "Gemfile", "setup.py", "setup.cfg"]);

export async function scanDeps(
  iocs: IocFile,
  tree: WalkResult,
  run: Run | undefined,
  opts: DepsScanOptions = {},
): Promise<{ result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] }> {
  const result: SurfaceResult = { surface: "deps", scanned: true, stats: {}, startedAt: (opts.now ?? new Date()).toISOString() };
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
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

  // A project with a manifest and no lockfile (in its folder or above it) was installed from the manifest.
  const lockDirs = new Set([...lockfilePaths, ...advisoryOnly].map((p) => dirname(p)));
  const locked = (d: string): boolean => {
    for (let x = d; ; x = dirname(x)) {
      if (lockDirs.has(x)) return true;
      if (dirname(x) === x) return false;
    }
  };
  const orphans = manifests.filter((m) => !locked(dirname(m)));
  if (pkgs.length && orphans.length) {
    let unread = 0;
    for (const m of orphans) {
      if (basename(m) !== "package.json") {
        unread++;
        continue;
      }
      // package.json names its dependencies: an every-version indicator (a typosquat) matches the name alone.
      try {
        const j = JSON.parse(readFileSync(m, "utf8"));
        for (const field of ["dependencies", "devDependencies", "optionalDependencies"])
          for (const name of Object.keys(j?.[field] ?? {})) hit(m, { ecosystem: "npm", name, version: "*" }, `${m} depends on ${name} (no lockfile)`);
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
    const checker = opts.checker ?? (opts.runner ? defaultChecker(opts.runner, workDir) : undefined);
    if (!checker) gaps.push({ surface: "deps", what: "the OSV and GHSA advisory feeds", why: "no command runner" });
    else {
      const all = [...lockfilePaths, ...advisoryOnly];
      const roots = opts.roots ?? [];
      // A lockfile directly in a walk root is copied to a folder of its own: package-checker would walk the whole root.
      const staged = new Map<string, string>(); // staged dir -> original lockfile
      for (const [i, f] of rootLevelLockfiles(all, roots).entries()) {
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
      const groups = [...checkerGroups(all, roots), ...staged.keys()];
      const vulns: CheckerVuln[] = [];
      let failed = 0;
      let feedAge: number | undefined;
      for (const g of groups) {
        const r = await checker(g);
        const label = staged.get(g) ?? `the lockfiles under ${g}`;
        if (!r.ok) {
          failed++;
          gaps.push({
            surface: "deps",
            what: `advisories for ${label}`,
            why: `package-checker failed: ${r.error ?? "unknown error"}`,
            fix: /bash 4/i.test(r.error ?? "") ? "brew install bash (package-checker needs Bash 4 or newer), then re-run" : "re-run when online",
          });
          continue;
        }
        for (const w of r.warnings ?? []) gaps.push({ surface: "deps", what: `advisories for ${label}`, why: `package-checker: ${w}` });
        for (const f of r.feeds ?? [])
          if (f.ageDays !== undefined) {
            feedAge = Math.max(feedAge ?? 0, f.ageDays);
            if (f.ageDays > 2)
              gaps.push({
                surface: "deps",
                what: `advisories newer than ${f.ageDays} days (${f.feed} feed read from ${f.source})`,
                why: "package-checker used a local copy of its feed instead of downloading the current one",
                fix: "brew upgrade package-checker (or remove that copy), then re-run scan deps",
              });
          }
        const orig = staged.get(g);
        vulns.push(...(orig ? r.vulnerabilities.map((v) => ({ ...v, file: orig })) : r.vulnerabilities));
      }
      if (feedAge !== undefined) result.stats.feedAgeDays = feedAge;
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
      const backlog: CheckerVuln[] = [];
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
          sha256: PACKAGE_CHECKER_SHA256,
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
  return { result, findings, gaps };
}
