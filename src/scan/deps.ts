// scan deps: every lockfile under the roots, against two lists.
//  1. The packages the campaign's sources name (IOC `package` indicators),
//     matched here so each finding cites the source that named the package.
//  2. The OSV and GHSA advisory feeds, through package-checker.sh
//     (maxgfr/package-checker.sh, 12 ecosystems), vendored and pinned. A
//     malicious-package advisory (MAL-*) is a compromise and cites its OSV
//     page as a source; ordinary CVEs are a patching backlog, summed up in
//     one info finding and listed in deps-vulnerabilities.json.
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { writeFileAtomic } from "../engine.js";
import { matchers, packageHit } from "../ioc.js";
import type { Run } from "../run.js";
import { parseJsonOutput, type Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import { PACKAGE_CHECKER_SCRIPT, PACKAGE_CHECKER_SHA256, PACKAGE_CHECKER_VERSION } from "../vendor/package-checker-script.js";
import { type Locked, lockfileKind, parseLockfile } from "./lockfiles.js";
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

/** Runs package-checker on one directory; answers its JSON report, or why it could not. */
export type Checker = (dir: string) => Promise<{ ok: boolean; vulnerabilities: CheckerVuln[]; error?: string }>;

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
    // Exit 0: nothing found. 1: vulnerabilities found. Anything else: it could not scan.
    const res = await runner(
      "bash",
      [script, dir, "--default-source-ghsa-osv", "--only-lockfiles", "--no-config", "--no-runtime-check", "--export-json", out],
      {
        timeoutMs: 15 * 60_000,
        cwd: workDir,
      },
    );
    if (res.missing) return { ok: false, vulnerabilities: [], error: "bash is not installed" };
    if (res.status !== 0 && res.status !== 1)
      return { ok: false, vulnerabilities: [], error: (res.stderr || res.stdout).trim().split("\n").slice(-1)[0]?.slice(0, 200) };
    if (!existsSync(out)) return { ok: res.status === 0, vulnerabilities: [], error: res.status === 0 ? undefined : "no JSON report written" };
    const json = parseJsonOutput<{ vulnerabilities?: CheckerVuln[] }>({ ok: true, status: 0, stdout: readFileSync(out, "utf8"), stderr: "" });
    if (!json) return { ok: false, vulnerabilities: [], error: "unreadable JSON report" };
    return { ok: true, vulnerabilities: (json.vulnerabilities ?? []).map((v) => ({ ...v, file: isAbsolute(v.file) ? v.file : resolve(workDir, v.file) })) };
  };
}

/**
 * Directories to hand package-checker: lockfile folders grouped two levels
 * under their walk root, so one run covers a whole projects folder instead of
 * one run per lockfile, and no run walks the whole home directory.
 */
export function checkerGroups(lockfiles: string[], roots: string[]): string[] {
  const groups = new Set<string>();
  for (const f of lockfiles) {
    const d = dirname(f);
    const root = roots.filter((r) => d === r || d.startsWith(r.endsWith(sep) ? r : r + sep)).sort((a, b) => b.length - a.length)[0];
    if (!root) {
      groups.add(d);
      continue;
    }
    const rel = relative(root, d).split(sep).filter(Boolean);
    groups.add(rel.length ? join(root, ...rel.slice(0, 2)) : root);
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
}

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
  for (const p of tree.files) {
    if (!lockfileKind(p)) continue;
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
      for (const m of pkgs) {
        if (!packageHit(m.indicator, l.ecosystem, l.name, l.version)) continue;
        findings.push({
          surface: "deps",
          severity: "compromised",
          subject: p,
          title: `${p} locks ${l.name}@${l.version}, named by the campaign`,
          campaign: m.campaign.id,
          source: m.indicator.source,
          indicator: { type: "package", value: m.indicator.value },
          evidence: { kind: "file", ref: p, excerpt: `${l.ecosystem} ${l.name}@${l.version}` },
          key: `deps|${p}|${l.ecosystem}|${l.name}|${l.version}`,
        });
      }
    }
  }
  result.stats.lockfiles = lockfiles;
  result.stats.packages = where.size;
  if (unreadable) gaps.push({ surface: "deps", what: `${unreadable} lockfiles`, why: "could not be parsed or were over 64 MB" });

  if (opts.checker !== false && lockfiles > 0) {
    const workDir = run ? join(run.dir, "package-checker") : join(tmpdir(), `ultraguard-pc-${process.pid}`);
    mkdirSync(workDir, { recursive: true });
    const checker = opts.checker ?? (opts.runner ? defaultChecker(opts.runner, workDir) : undefined);
    if (!checker) gaps.push({ surface: "deps", what: "the OSV and GHSA advisory feeds", why: "no command runner" });
    else {
      const groups = checkerGroups([...lockfilePaths], opts.roots ?? []);
      const vulns: CheckerVuln[] = [];
      let failed = 0;
      for (const g of groups) {
        const r = await checker(g);
        if (!r.ok) {
          failed++;
          gaps.push({
            surface: "deps",
            what: `advisories for the lockfiles under ${g}`,
            why: `package-checker failed: ${r.error ?? "unknown error"}`,
            fix: "re-run when online",
          });
          continue;
        }
        vulns.push(...r.vulnerabilities);
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
    what: "globally installed packages (npm -g, pipx, cargo install) and Docker images",
    why: "only lockfiles under the roots are read",
  });
  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps };
}
