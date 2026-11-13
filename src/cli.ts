import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkAnswer } from "./check.js";
import { doctor, formatDoctor } from "./doctor.js";
import {
  argBool,
  argInt,
  argList,
  argValue,
  type CliSpec,
  type CommandArgs,
  ENGINE_VERSION,
  EXIT_FAILURE,
  EXIT_OK,
  EXIT_USAGE,
  isInvokedDirectly,
  jsonLine,
  parseArgs,
  UsageError,
} from "./engine.js";
import { defaultFeedGet, type FeedGet } from "./feeds.js";
import { fixProject, renderFix } from "./fix.js";
import { planFixes, renderFixes } from "./fixes.js";
import { intel, readWebResultsFile, type WebHit } from "./intel.js";
import { normEco, SUPPORTED_ECOSYSTEMS, validateIocs } from "./ioc.js";
import { renderReport } from "./report.js";
import { formatDefenses, refreshDefenses, updateAdvisoryFeeds } from "./defenses.js";
import { defaultRulesDeps, installedRules, RULE_SETS, type RuleSet, type RulesDeps, rulesAgeDays } from "./rules.js";
import { OS_NAMES, type Searcher, searchInto, searchNews } from "./search.js";
import { Run } from "./run.js";
import { defaultRunner, type Runner } from "./runner.js";
import { scanCloud } from "./scan/cloud.js";
import { type CheckerVuln, feedDir, scanDeps } from "./scan/deps.js";
import { scanGithub } from "./scan/github.js";
import { DEFAULT_RESCAN_DAYS } from "./scan/avcache.js";
import { scanHost } from "./scan/host.js";
import { scanSoftware } from "./scan/software.js";
import { assessVulnerabilities, type SoftwareScan } from "./scan/vulns.js";
import { detectXProtect, type XProtectInfo, xprotectSource } from "./scan/xprotect.js";
import { defaultRegistryGet, type RegistryGet, scanNpmPublishes } from "./scan/registry.js";
import { walk, type WalkResult } from "./scan/walk.js";
import { type Campaign, type Gap, type IocFile, SURFACES, type Surface } from "./types.js";
import { VERSION } from "./version.js";
import type { RankedVulns, Tier } from "./vulns.js";
import { EXIT_INCOMPLETE, stateDir, watchCommit, watchPlan } from "./watch.js";

export const HELP = `ultraguard v${VERSION} (webindex ${ENGINE_VERSION})
An AI antivirus for an agent: the agent finds attack news on the web, turns
each article into indicators of compromise (IOCs) that cite it, and ultraguard
sweeps your GitHub account and the repositories you can push to, this machine,
your lockfiles and your cloud for them. Read-only on what it scans: the only
things it writes are its run folders, its state folder and the antivirus
databases it keeps current (ClamAV signatures, YARA-Forge rules, package-checker's advisory feeds). The one
exception is fix --apply, run only when you ask to fix a named project: it
upgrades that project's dependencies in a new git worktree and branch, and
never pushes.

USAGE
  ultraguard doctor [--probe] [--state <dir>] [--json]
  ultraguard rules update [--set core|extended|full] [--state <dir>]   freshclam + YARA-Forge + advisory feeds
  ultraguard rules status [--state <dir>]
  ultraguard search <query> --out <run> [--limit <n>]
  ultraguard search --news --out <run> [--limit <n>]   the standard query set, this month
  ultraguard intel [<url>...] [--web-results <file.json>] --out <run>
  ultraguard ioc set --file <iocs.json> --out <run>
  ultraguard ioc show --out <run> [--json]
  ultraguard scan github|host|deps|cloud --out <run> [scan flags] [--json]
  ultraguard sweep --out <run> [--surfaces <list>] [scan flags] [--json]
  ultraguard report --out <run> [--json]
  ultraguard check <answer.md> --out <run> [--json]
  ultraguard fixes --out <run> [--project <path>] [--json]   upgrade plan for the ranked CVEs
  ultraguard fix --out <run> --project <path> [--apply] [--tiers P0,P1,P2] [--no-test] [--json]
  ultraguard watch plan [--web-results <file.json>] --out <run> [--state <dir>] [--resweep-days <n>]
  ultraguard watch commit --out <run> [--state <dir>] [--notify-issue <owner/repo>]

THE LOOP
  1. You search the web for attacks: with your own search tool (save the hits
     as JSON), or with search, keyless, into <run>/search-hits.json
     (search --news: supply-chain attacks and this OS's malware, this month).
  2. intel        fetch each page once: sources [S1], [S2]... and iocs.todo.json
  3. ioc set      validate your IOC file: every indicator cites a fetched [S#]
  4. sweep        run every scan: findings [F1], [F2]... and coverage gaps
  5. report       REPORT.md (verdict per surface) and REMEDIATION.md
  6. check        your answer cites only real [S#]/[F#] and hides no verdict

VULNERABILITIES (scan deps)
  Known CVEs are ranked, not alerted: P0 in CISA KEV (exploited in the wild),
  P1 EPSS >= 10% or critical with a fix, P2 high with a fix, P3 the rest,
  grouped by project (your git repositories first; caches, plugins, worktrees
  and vendored copies one line each). On macOS it also lists pending updates
  and the last 30 days of KEV entries for the software installed here.
  <run>/vulnerabilities.json holds the ranked list; fixes prints the smallest
  upgrades with the command for each package manager (FIXES.md) and runs none.
  The KEV and EPSS feeds are cached for 24 hours in <state>/feeds.

FIX (one own project, on request)
  fix --project <path> prints what it would do (a dry run: nothing written).
  With --apply it makes a new worktree <state>/fixes/<repo>-<yyyymmdd-hhmm> on a
  new branch ultraguard/fix-<yyyymmdd>-<sha> from the default branch, runs the
  plan there (install scripts off), re-checks the lockfiles with
  package-checker, runs the project's tests (15 min timeout) and commits with
  your git config. It never pushes, opens a PR or merges: it prints how to,
  and how to drop the fix. Record: <run>/fix-<project>.json. It refuses
  caches, plugins, vendored copies, worktrees and folders outside git.
  Exit codes: 0 applied and tests pass, 1 tests fail, a step failed or
  advisories remain, 2 refused.

SCAN FLAGS
  --repos <a/b,c/d>     github: only these repositories
  --max-repos <n>       github: stop after n repositories
  --concurrency <n>     github: parallel repositories (default 8)
  --roots <dir,dir>     host, deps: existing folders to walk (default: your home directory)
  --depth <n>           host, deps: walk depth (default 6)
  --skip-live           host: skip crontab, open connections, processes, signatures, antivirus
  --no-av               host: skip the ClamAV pass (on by default when ClamAV is installed)
  --av-full             host: ClamAV and YARA over every file under the roots instead of
                        the targeted list; incremental: unchanged files scanned clean
                        recently are skipped (the first run takes hours, the next minutes)
  --av-rescan-days <n>  host: with --av-full, rescan unchanged files after n days (default 7)
  --yara <rules>        host: also run YARA rules (a .yar file or a folder of them)
  --yara-source <S#>    host: the source the YARA rules came from, cited by their findings
  --no-rules            host: skip the community YARA rules (YARA-Forge) installed by rules update
  --no-update           host: do not refresh ClamAV signatures or YARA-Forge rules older than 7 days;
                        deps: do not refresh package-checker's advisory feeds older than 1 day
  --state <dir>         host, deps, rules, watch: ultraguard's state folder (default ~/.ultraguard)
  --set <name>          rules update: core (default, highest precision), extended or full
  --npm-user <name>     deps: the npm account whose packages to check for versions published in a campaign window (default: npm whoami)
  --no-registry         deps: skip that check (it reads the public npm registry)
  --no-osv              deps: skip package-checker (OSV and GHSA feeds, malicious packages)
  --surfaces <list>     sweep: github,host,deps,cloud (default: all)
  --project <path>      fixes: only this project (any kind, even a worktree or a cache); fix: the project to fix
  --apply               fix: do it (without it, fix is a dry run)
  --tiers <list>        fix: the tiers to fix (default P0,P1,P2)
  --no-test             fix: do not run the project's tests
  scan and sweep exit 20 when GitHub was asked for and could not be scanned
  (logged out, every read refused): its verdict is UNKNOWN, never CLEAN.
  --limit <n>           search: hits to aim for per query (default 10; 5 with --news)
  --news                search: run the standard "anything new?" queries instead of
                        one: supply-chain attacks, then malware for this OS (macOS
                        stealers and backdoors, ClickFix...; Linux), each with the
                        current month and year. Exit 1 when no engine answered.

ROUTINE (watch)
  watch plan --web-results <run>/search-hits.json takes the hits of search
  (or search --news) as they are. It drops sources already handled in --state (default ~/.ultraguard,
  or ULTRAGUARD_HOME), fetches the new ones, and re-arms every known campaign
  each --resweep-days (default 7). Fill iocs.json, sweep, report, then
  watch commit: it alerts only on findings never alerted before.
  Exit codes: 0 nothing new, 10 alert, 20 a surface could not be scanned.
  --notify-issue opens a GitHub issue on alert. Off unless you pass it.

VERDICTS (per surface)
  COMPROMISED an IOC matched   EXPOSED in the blast radius   REVIEW changed in
  the window, judge it   CLEAN no IOC matched   UNKNOWN not scanned

  --out <dir>   the run directory shared by every command
  --json        machine-readable output
  --help, --version
`;

export const COMMANDS = ["doctor", "rules", "search", "intel", "ioc", "scan", "sweep", "report", "check", "fixes", "fix", "watch"];
export const VALUE_FLAGS = [
  "out",
  "web-results",
  "file",
  "repos",
  "max-repos",
  "concurrency",
  "roots",
  "depth",
  "surfaces",
  "state",
  "resweep-days",
  "av-rescan-days",
  "notify-issue",
  "limit",
  "yara",
  "yara-source",
  "set",
  "npm-user",
  "project",
  "tiers",
];
export const BOOL_FLAGS = ["json", "news", "probe", "skip-live", "no-osv", "no-av", "av-full", "no-rules", "no-update", "no-registry", "apply", "no-test"];

const SCAN = [
  "out",
  "repos",
  "max-repos",
  "concurrency",
  "roots",
  "depth",
  "skip-live",
  "no-osv",
  "no-registry",
  "npm-user",
  "no-av",
  "av-full",
  "av-rescan-days",
  "yara",
  "yara-source",
  "no-rules",
  "no-update",
  "state",
  "json",
];
const SPEC: CliSpec = {
  commands: COMMANDS,
  valueFlags: VALUE_FLAGS,
  boolFlags: BOOL_FLAGS,
  commandFlags: {
    doctor: ["probe", "state", "json"],
    rules: ["set", "state", "json"],
    search: ["out", "limit", "news", "json"],
    intel: ["out", "web-results", "json"],
    ioc: ["out", "file", "json"],
    scan: SCAN,
    sweep: [...SCAN, "surfaces"],
    report: ["out", "json"],
    check: ["out", "json"],
    fixes: ["out", "project", "state", "json"],
    fix: ["out", "project", "tiers", "apply", "no-test", "state", "json"],
    watch: ["out", "web-results", "state", "resweep-days", "notify-issue", "json"],
  },
};

let runner: Runner = defaultRunner;
/** Test seam: replace every external command. */
export function setRunner(r: Runner): void {
  runner = r;
}
let registryGet: RegistryGet = defaultRegistryGet;
/** Test seam: replace the npm registry reads. */
export function setRegistryGet(g: RegistryGet): void {
  registryGet = g;
}
let rulesDeps: RulesDeps = defaultRulesDeps;
/** Test seam: replace the YARA-Forge download. */
export function setRulesDeps(d: RulesDeps): void {
  rulesDeps = d;
}

let newsDeps: { searcher?: Searcher; platform?: NodeJS.Platform; now?: () => Date } = {};
/** Test seam: replace the web search engine, the platform and the clock `search` uses. */
export function setNewsDeps(d: { searcher?: Searcher; platform?: NodeJS.Platform; now?: () => Date }): void {
  newsDeps = d;
}

let feedGet: FeedGet = defaultFeedGet;
/** Test seam: replace the CISA KEV, EPSS, Chrome and Node.js feed reads. */
export function setFeedGet(g: FeedGet): void {
  feedGet = g;
}
const defaultSoftwareScan: SoftwareScan = (ctx) =>
  scanSoftware({ ...ctx, platform: process.platform, appsDirs: ["/Applications", join(homedir(), "Applications")] });
let softwareScan: SoftwareScan | undefined = defaultSoftwareScan;
/** Test seam: replace (or, with undefined, skip) the machine-software check of scan deps (softwareupdate, installed apps). */
export function setSoftwareScan(s: SoftwareScan | undefined): void {
  softwareScan = s;
}

function out(text: string): void {
  process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}

function needRun(a: CommandArgs, opts: { mustExist?: boolean } = {}): Run {
  const dir = argValue(a, "out");
  if (!dir) throw new UsageError(`${a.command} needs --out <run>: one directory per investigation, shared by every command`);
  // Commands that read a run must not create an empty one from a mistyped path: it would pass every check.
  if (opts.mustExist && !existsSync(resolve(dir)))
    throw new UsageError(`no run at ${dir}: check the --out path (a run is created by search, intel or watch plan)`);
  return new Run(dir);
}

function needIocs(run: Run): IocFile {
  const raw = run.iocs();
  if (!raw) throw new UsageError(`no iocs.json in ${run.dir}: run \`ultraguard ioc set --file <iocs.json> --out ${run.dir}\` first`);
  // The agent may edit iocs.json after ioc set refused it: re-validate, never sweep an unchecked file.
  const { iocs, problems } = validateIocs(raw, run.sources());
  if (!iocs)
    throw new UsageError(
      `iocs.json in ${run.dir} does not validate (${problems.length} problem(s), first: ${problems[0]?.path}: ${problems[0]?.message}); fix it and run ioc set again`,
    );
  return iocs;
}

/** Types matched as a whole line unless "regex" is set: `ioc show` says so. */
const EXACT = new Set(["branch", "pr_title", "commit_message", "actor"]);

/** Package ecosystems in the file that no reader covers, with their indicator count: "maven (2)". */
function uncheckedEcosystems(iocs: IocFile): string[] {
  const n = new Map<string, number>();
  for (const c of iocs.campaigns)
    for (const i of c.indicators) {
      const e = normEco(i.ecosystem ?? "");
      if (i.type === "package" && !(SUPPORTED_ECOSYSTEMS as readonly string[]).includes(e)) n.set(e, (n.get(e) ?? 0) + 1);
    }
  return [...n].map(([e, k]) => `${e} (${k})`);
}

/** Indicator types the GitHub scan reads. */
const GITHUB_TYPES = new Set([
  "branch",
  "pr_title",
  "commit_message",
  "file",
  "workflow_file",
  "string",
  "ip",
  "domain",
  "url",
  "cache_key_prefix",
  "artifact_prefix",
  "actor",
]);

/**
 * The --roots, each an existing directory. A typo or a space-separated list would
 * otherwise walk nothing and come back CLEAN with "0 lockfiles".
 */
function rootsOf(a: CommandArgs): string[] {
  const roots = argList(a, "roots").map((r) => resolve(r.replace(/^~(?=$|\/)/, homedir())));
  for (const r of roots) {
    let dir = false;
    try {
      dir = statSync(r).isDirectory();
    } catch {
      dir = false;
    }
    if (!dir) throw new UsageError(`--roots: ${r} does not exist or is not a directory (pass existing folders, comma-separated)`);
  }
  return roots;
}

function walkFor(a: CommandArgs): WalkResult {
  const roots = rootsOf(a);
  return walk(roots.length ? roots : [homedir()], { maxDepth: argInt(a, "depth", { min: 1, max: 20 }) ?? 6 });
}

/** Set by runScan when the GitHub surface was asked for and came back unscanned: sweep and scan then exit 20. */
let githubBlind = false;

async function runScan(surface: "github" | "host" | "deps" | "cloud", a: CommandArgs, run: Run, iocs: IocFile, tree?: () => WalkResult): Promise<string> {
  if (surface === "github") {
    const r = await scanGithub(iocs, runner, {
      repos: argList(a, "repos"),
      maxRepos: argInt(a, "max-repos", { min: 1 }),
      concurrency: argInt(a, "concurrency", { min: 1, max: 32 }),
    });
    // Nothing in the file is a GitHub indicator (a package-only campaign): CLEAN would mean "checked against nothing".
    if (r.account.result.scanned && !iocs.campaigns.some((c) => c.indicators.some((i) => GITHUB_TYPES.has(i.type))))
      for (const g of [r.account.gaps, r.repos.gaps])
        g.push({
          surface: g === r.account.gaps ? "github:account" : "github:repos",
          what: "the campaign's indicators",
          why: "no indicator of this run applies to GitHub: only new keys, webhooks and deploy keys were reviewed",
          fix: "add the branches, PR titles, commit messages or files the sources name, if any",
        });
    const accF = run.recordSurface(r.account.result, r.account.findings, r.account.gaps);
    const repF = run.recordSurface(r.repos.result, r.repos.findings, r.repos.gaps);
    run.setMeta({ login: r.login, hitRepos: r.hitRepos });
    // Zero findings from a scan that read nothing must not read as clean.
    const blind = [r.account, r.repos].filter((x) => !x.result.scanned);
    if (blind.length) githubBlind = true;
    if (blind.length === 2) {
      const g = r.account.gaps[r.account.gaps.length - 1] ?? r.repos.gaps[0];
      return `github: NOT SCANNED (${g ? `${g.what}: ${g.why}` : "gh failed"}). Fix: ${g?.fix ?? "gh auth login"}`;
    }
    const line = `github: ${r.repos.result.stats.repos ?? 0} repositories as ${r.login ?? "?"}; ${accF.length} account finding(s), ${repF.length} repository finding(s)`;
    return blind.length
      ? `${line}\n${blind.map((x) => `${x.result.surface} NOT SCANNED: ${x.gaps.find((g) => g.fix)?.what ?? "see gaps.json"}`).join("\n")}`
      : line;
  }
  if (surface === "host") {
    // Stale signatures miss this month's malware: refresh them first (ClamAV and YARA-Forge, each only if older than 7 days).
    let refreshed = "";
    const refreshGaps: Gap[] = [];
    if (!argBool(a, "no-update") && !argBool(a, "skip-live")) {
      const ups = await refreshDefenses(stateDir(argValue(a, "state")), runner, {
        clamav: !argBool(a, "no-av"),
        yaraForge: !argBool(a, "no-rules"),
        deps: rulesDeps,
      });
      const shown = ups.filter((u) => u.status === "updated" || u.status === "failed");
      if (shown.length) refreshed = `${formatDefenses(shown)}\n`;
      // A failed refresh is part of the run's coverage, not only a line on the terminal.
      for (const u of ups.filter((x) => x.status === "failed"))
        refreshGaps.push({
          surface: "host",
          what: `fresh ${u.engine === "clamav" ? "ClamAV signatures" : "YARA-Forge rules"}`,
          why: u.detail,
          fix: "ultraguard rules update",
        });
    }
    const roots = rootsOf(a);
    const r = await scanHost(iocs, (tree ?? (() => walkFor(a)))(), runner, {
      hitRepos: run.meta().hitRepos,
      skipLive: argBool(a, "skip-live"),
      av: argBool(a, "no-av") ? "off" : argBool(a, "av-full") ? "full" : "targeted",
      roots: roots.length ? roots : undefined,
      yara: argValue(a, "yara"),
      yaraSource: argValue(a, "yara-source"),
      listDir: run.dir,
      stateDir: stateDir(argValue(a, "state")),
      avRescanDays: argInt(a, "av-rescan-days", { min: 0, max: 365 }),
      ...communityRules(a, run),
      xprotect: process.platform === "darwin" && !argBool(a, "skip-live") ? await xprotectRules(run) : undefined,
    });
    const f = run.recordSurface(r.result, r.findings, [...refreshGaps, ...r.gaps]);
    run.write("host-inventory.json", r.inventory);
    const st = r.result.stats;
    // --av-full is incremental: say how much of the disk this run read and how much the cache let it skip.
    const full =
      st.avScanned !== undefined
        ? `\nantivirus (--av-full): ${st.avScanned} file(s) scanned, ${st.avSkipped ?? 0} unchanged and scanned clean in the last ${argInt(a, "av-rescan-days", { min: 0, max: 365 }) ?? DEFAULT_RESCAN_DAYS} days skipped`
        : "";
    return `${refreshed}host: ${st.files ?? 0} files, ${st.startupItems ?? 0} startup items, ${st.credentialFiles ?? 0} credential files; ${f.length} finding(s)${full}`;
  }
  if (surface === "deps") {
    const roots = rootsOf(a);
    const state = stateDir(argValue(a, "state"));
    // The OSV and GHSA feeds package-checker reads: ultraguard's copy, refreshed when older than 1 day.
    const feeds = argBool(a, "no-osv") || argBool(a, "no-update") ? undefined : await updateAdvisoryFeeds(state, runner);
    const refreshed = feeds && feeds.status !== "current" ? `${formatDefenses([feeds])}\n` : "";
    const r = await scanDeps(iocs, (tree ?? (() => walkFor(a)))(), run, {
      checker: argBool(a, "no-osv") ? false : undefined,
      runner,
      roots: roots.length ? roots : [homedir()],
      // Global installs (npm -g, nvm, bun, uv tools, pipx) are read under the real home.
      home: homedir(),
      feedDir: feedDir(state),
      feedRefreshError: feeds?.status === "failed" ? feeds.error : undefined,
    });
    // The packages the user publishes: a worm with their npm token republishes them.
    const pub = argBool(a, "no-registry") ? undefined : await scanNpmPublishes(iocs, { user: argValue(a, "npm-user"), runner, get: registryGet });
    if (pub) Object.assign(r.result.stats, pub.stats);
    // The CVE backlog, ranked (KEV, EPSS, own projects first), and the machine's own software: replaces the single backlog line.
    const v = await assessVulnerabilities(r.vulnerable, run, {
      get: feedGet,
      state: stateDir(argValue(a, "state")),
      runner,
      home: homedir(),
      software: softwareScan,
    });
    Object.assign(r.result.stats, v.stats);
    const found = [...r.findings.filter((x) => x.key !== "deps|vulnerable-backlog"), ...v.findings, ...(pub?.findings ?? [])];
    const f = run.recordSurface(r.result, found, [...r.gaps, ...v.gaps, ...(pub?.gaps ?? [])]);
    const c = v.ranked.counts;
    const ranked = v.ranked.packages ? ` (P0 ${c.P0}, P1 ${c.P1}, P2 ${c.P2}, P3 ${c.P3}: ultraguard fixes --out ${run.dir})` : "";
    const age = r.result.stats.feedAgeDays;
    return `${refreshed}deps: ${r.result.stats.lockfiles ?? 0} lockfiles${pub?.user ? `, ${pub.stats.npmPackages ?? 0} npm packages of ${pub.user}` : ""}, ${r.result.stats.packages ?? 0} packages, ${r.result.stats.malicious ?? 0} malicious, ${r.result.stats.vulnerable ?? 0} with known CVEs${ranked}${age !== undefined ? `; advisory feeds ${age} days old` : ""}; ${f.length} finding(s)`;
  }
  const r = await scanCloud(iocs, runner);
  const f = run.recordSurface(r.result, r.findings, r.gaps);
  return `cloud: ${r.result.scanned ? "scanned" : (r.result.notApplicable ?? "not fully read, see the gaps")}; ${f.length} finding(s)`;
}

/** The installed YARA-Forge rules for scan host, registered as a source of the run so their findings cite it. */
function communityRules(
  a: CommandArgs,
  run: Run,
): { community?: { source: string; compiled?: string; label: string; sourceId?: string; ageDays: number }; communityMissing?: boolean } {
  if (argBool(a, "no-rules")) return {};
  const meta = installedRules(stateDir(argValue(a, "state")));
  if (!meta) return { communityMissing: true };
  const src = run.addSource({
    url: meta.url,
    title: `YARA-Forge ${meta.set} rules ${meta.tag} (${meta.rules} rules)`,
    fetchedAt: meta.fetchedAt,
    origin: "rules",
  });
  return { community: { source: meta.source, compiled: meta.compiled, label: `YARA-Forge ${meta.set}`, sourceId: src.id, ageDays: rulesAgeDays(meta) } };
}

/** Apple's XProtect rules for scan host (macOS), registered as a source of the run so their matches cite it. */
async function xprotectRules(run: Run): Promise<XProtectInfo> {
  const info = await detectXProtect(runner);
  if (!info.missing && info.rules.length) info.sourceId = run.addSource(xprotectSource(info)).id;
  return info;
}

const SURFACE_OF: Record<string, Surface[]> = { github: ["github:account", "github:repos"], host: ["host"], deps: ["deps"], cloud: ["cloud"] };

async function dispatch(a: CommandArgs): Promise<number> {
  const json = argBool(a, "json");
  switch (a.command) {
    case "rules": {
      const sub = a.positional[0];
      const dir = stateDir(argValue(a, "state"));
      if (sub === "status") {
        const meta = installedRules(dir);
        out(
          json
            ? jsonLine(meta ?? null)
            : meta
              ? `YARA-Forge ${meta.set} ${meta.tag}: ${meta.rules} rules, ${rulesAgeDays(meta)} days old, ${meta.compiled ? "compiled" : "not compiled (install yarac for faster scans)"}\n${meta.source}`
              : "no community rules installed: ultraguard rules update",
        );
        return meta ? EXIT_OK : EXIT_FAILURE;
      }
      if (sub !== "update")
        throw new UsageError("rules takes `update [--set core|extended|full]` (ClamAV signatures, YARA-Forge rules, advisory feeds) or `status`");
      const set = (argValue(a, "set") ?? "core") as RuleSet;
      if (!RULE_SETS.includes(set)) throw new UsageError(`--set takes ${RULE_SETS.join(", ")}, not "${set}"`);
      // Every database, now: ClamAV's signatures through freshclam, the YARA-Forge rules and package-checker's advisory feeds.
      const ups = await refreshDefenses(dir, runner, { force: true, set, advisoryFeeds: true, deps: rulesDeps });
      const meta = installedRules(dir);
      out(json ? jsonLine({ updates: ups, rules: meta ?? null }) : `${formatDefenses(ups)}${meta ? `\n${meta.source}` : ""}`);
      return ups.some((u) => u.status === "failed") ? EXIT_FAILURE : EXIT_OK;
    }
    case "doctor": {
      const lines = await doctor(runner, { probe: argBool(a, "probe"), state: stateDir(argValue(a, "state")) });
      out(json ? jsonLine(lines) : formatDoctor(lines));
      return lines.find((l) => l.check === "gh" && !l.ok) ? EXIT_FAILURE : EXIT_OK;
    }
    case "search": {
      const query = a.positional.join(" ").trim();
      if (argBool(a, "news")) {
        if (query) throw new UsageError(`search takes a query or --news, not both: drop "${query}" or --news`);
        return searchNewsCommand(a, needRun(a), json);
      }
      const run = needRun(a);
      if (!query)
        throw new UsageError('search needs a query, or --news for the standard set: ultraguard search "malicious npm packages november 2026" --out <run>');
      const r = await searchInto(run, query, { limit: argInt(a, "limit", { min: 1, max: 50 }), searcher: newsDeps.searcher });
      if (json) out(jsonLine(r));
      else {
        for (const h of r.added) out(`- ${h.title ?? ""} <${h.url}>${h.snippet ? `\n    ${h.snippet}` : ""}`);
        if (!r.searched) out(NO_ENGINE);
        out(
          `\n${r.added.length} new hit(s), ${r.total} in ${run.path("search-hits.json")}. Keep the primary write-ups, then: ultraguard intel --web-results <that file, trimmed> --out ${run.dir}`,
        );
      }
      return r.searched ? EXIT_OK : EXIT_FAILURE;
    }
    case "intel": {
      const run = needRun(a);
      for (const url of a.positional) if (!/^https?:\/\//i.test(url)) throw new UsageError(`intel: "${url}" is not a URL: add https://`);
      const hits: WebHit[] = a.positional.map((url) => ({ url }));
      const file = argValue(a, "web-results");
      if (file) hits.push(...readWebResultsFile(file));
      if (!hits.length) throw new UsageError("intel needs at least one <url> or --web-results <file.json>");
      const sources = await intel(run, hits);
      if (json) out(jsonLine(sources));
      else {
        for (const s of sources)
          out(`[${s.id}] ${s.error ? `FAILED (${s.error})` : "ok"}  ${s.title ?? ""} <${s.url}>${s.file ? `\n     text: ${run.path(s.file)}` : ""}`);
        if (!sources.some((s) => !s.error)) out("\nNo source could be fetched: nothing to extract IOCs from. Try other pages for the same attack.");
        else
          out(
            `\nNext: read each source, then write ${run.path("iocs.json")} (start from ${run.path("iocs.todo.json")}: one campaign per ATTACK, so merge the sources that describe the same one), then \`ultraguard ioc set --file ${run.path("iocs.json")} --out ${run.dir}\`.`,
          );
      }
      return sources.some((s) => !s.error) ? EXIT_OK : EXIT_FAILURE;
    }
    case "ioc": {
      const run = needRun(a);
      const sub = a.positional[0];
      if (sub === "show") {
        const iocs = needIocs(run);
        out(
          json
            ? jsonLine(iocs)
            : iocs.campaigns
                .map((c) =>
                  [
                    `${c.id}: ${c.title} (since ${c.since}${c.until ? `, until ${c.until}` : ""}, ${c.indicators.length} indicators) ${c.sources.map((s) => `[${s}]`).join("")}`,
                    ...c.indicators.map(
                      (i) =>
                        `  ${i.type.padEnd(20)} ${i.ecosystem ? `${i.ecosystem}:` : ""}${i.value}${i.versions?.length ? `@${i.versions.join(",")}` : ""}${i.regex ? " (regex)" : EXACT.has(i.type) ? " (exact)" : ""}${i.weak ? " (weak)" : ""} [${i.source}]`,
                    ),
                  ].join("\n"),
                )
                .join("\n\n"),
        );
        return EXIT_OK;
      }
      if (sub !== "set") throw new UsageError("ioc takes `set --file <iocs.json>` or `show`");
      const file = argValue(a, "file");
      let raw: unknown;
      if (file)
        try {
          raw = JSON.parse(readFileSync(file, "utf8"));
        } catch (e) {
          throw new UsageError(`${file}: not valid JSON (${(e as Error).message})`);
        }
      const carried = run.read<IocFile>("iocs.carried.json", { campaigns: [] }).campaigns;
      if (!file && !carried.length) throw new UsageError("ioc set needs --file <iocs.json>");
      // A file of the wrong shape (a bare list of indicators) is answered by the validator, not merged.
      const own: Campaign[] | undefined = file ? ((raw as IocFile | null)?.campaigns as Campaign[] | undefined) : [];
      const { iocs, problems } = Array.isArray(own)
        ? validateIocs({ campaigns: [...own, ...carried.filter((c) => !own.some((o) => o?.id === c.id))] }, run.sources())
        : validateIocs(raw, run.sources());
      if (!iocs) {
        out(json ? jsonLine(problems) : `iocs refused: ${problems.length} problem(s)\n${problems.map((p) => `  ${p.path}: ${p.message}`).join("\n")}`);
        return EXIT_FAILURE;
      }
      run.write("iocs.json", iocs);
      const n = iocs.campaigns.reduce((s, c) => s + c.indicators.length, 0);
      const unchecked = uncheckedEcosystems(iocs);
      out(
        json
          ? jsonLine({ campaigns: iocs.campaigns.length, indicators: n, uncheckedEcosystems: unchecked })
          : `iocs set: ${iocs.campaigns.length} campaign(s), ${n} indicator(s)${carried.length ? ` (${carried.length} carried from the watch state)` : ""}${
              unchecked.length
                ? `\nnote: ultraguard has no reader for ${unchecked.join(", ")}: those package indicators are reported as a deps coverage gap (supported: ${SUPPORTED_ECOSYSTEMS.join(", ")})`
                : ""
            }`,
      );
      return EXIT_OK;
    }
    case "scan": {
      const surface = a.positional[0];
      if (surface !== "github" && surface !== "host" && surface !== "deps" && surface !== "cloud")
        throw new UsageError("scan takes github, host, deps or cloud");
      const run = needRun(a);
      const iocs = needIocs(run);
      if (surface === "host" || surface === "deps") rootsOf(a);
      githubBlind = false;
      const line = await runScan(surface, a, run, iocs);
      const mine = SURFACE_OF[surface] ?? [];
      out(
        json
          ? jsonLine({
              summary: line,
              surfaces: run.surfaces().filter((x) => mine.includes(x.surface)),
              findings: run.findings().filter((f) => mine.includes(f.surface)).length,
              gaps: run.gaps().filter((g) => mine.includes(g.surface)),
            })
          : line,
      );
      return githubBlind ? EXIT_INCOMPLETE : EXIT_OK;
    }
    case "sweep": {
      const run = needRun(a);
      const iocs = needIocs(run);
      const wanted = argList(a, "surfaces");
      for (const w of wanted) if (!SURFACE_OF[w]) throw new UsageError(`--surfaces takes github,host,deps,cloud, not "${w}"`);
      // Always github first, whatever order was asked: the host scan looks for clones of the repos it found hit.
      const ORDER = ["github", "host", "deps", "cloud"] as const;
      const list = ORDER.filter((s) => !wanted.length || wanted.includes(s));
      // The routine tells "left out on purpose" from "could not scan" with this.
      run.setMeta({ requested: list.flatMap((s) => SURFACE_OF[s] ?? []) });
      // A mistyped root fails now, before the GitHub stage spends its API budget.
      if (list.includes("host") || list.includes("deps")) rootsOf(a);
      let tree: WalkResult | undefined;
      githubBlind = false;
      const shared = () => (tree ??= walkFor(a));
      const lines: string[] = [];
      let crashed = 0;
      // GitHub first: the host scan looks for local clones of the repositories it found hit.
      for (const s of list) {
        // Progress on stderr (stdout stays clean for --json): a large account takes minutes.
        process.stderr.write(`${s}: scanning${s === "github" ? " (about one second per API call)" : ""}...\n`);
        let line: string;
        try {
          line = await runScan(s, a, run, iocs, shared);
        } catch (e) {
          if (e instanceof UsageError) throw e;
          // One surface that crashes must not take the others and the report with it: it becomes a gap.
          crashed++;
          const why = (e as Error).message;
          for (const surface of SURFACE_OF[s] ?? [])
            run.recordSurface(
              { surface, scanned: false, stats: {}, startedAt: new Date().toISOString() },
              [],
              [{ surface, what: `the ${s} scan`, why: `it stopped with an error: ${why}`, fix: `fix the cause, then ultraguard scan ${s} --out ${run.dir}` }],
            );
          line = `${s}: FAILED (${why}), recorded as a gap`;
        }
        if (json) lines.push(line);
        else out(line);
      }
      const { verdicts: vs } = writeReport(run);
      out(
        json
          ? jsonLine({
              surfaces: list,
              summary: lines,
              verdicts: vs,
              findings: run.findings().length,
              gaps: run.gaps().length,
              report: run.path("REPORT.md"),
            })
          : `\n${vs.map((v) => `${v.surface.padEnd(15)} ${v.verdict}`).join("\n")}\n\nreport: ${run.path("REPORT.md")}`,
      );
      return crashed ? EXIT_FAILURE : githubBlind ? EXIT_INCOMPLETE : EXIT_OK;
    }
    case "report": {
      const run = needRun(a, { mustExist: true });
      const r = writeReport(run);
      out(
        json
          ? jsonLine(r.verdicts)
          : `${r.verdicts.map((v) => `${v.surface.padEnd(15)} ${v.verdict}  ${v.why}`).join("\n")}\n\n${run.path("REPORT.md")}\n${run.path("REMEDIATION.md")}`,
      );
      return EXIT_OK;
    }
    case "check": {
      const file = a.positional[0];
      if (!file) throw new UsageError("check needs the answer file: ultraguard check <answer.md> --out <run>");
      const run = needRun(a, { mustExist: true });
      const problems = checkAnswer(run, readFileSync(file, "utf8"));
      if (json) out(jsonLine({ ok: problems.length === 0, problems }));
      else
        out(
          problems.length
            ? `check FAILED: ${problems.length} problem(s)\n${problems.map((p) => `  ${p.line ? `line ${p.line}: ` : ""}[${p.rule}] ${p.message}`).join("\n")}`
            : "check passed",
        );
      return problems.length ? EXIT_FAILURE : EXIT_OK;
    }
    case "fixes": {
      const run = needRun(a, { mustExist: true });
      const ranked = await rankedOf(a, run, run);
      const flag = argValue(a, "project");
      const project = flag ? resolve(flag.replace(/^~(?=$|\/)/, homedir())) : undefined;
      const plans = planFixes(ranked, { project });
      if (project && !plans.length)
        throw new UsageError(`--project: no vulnerable lockfile under ${project} in this run (see ${run.path("vulnerabilities.json")})`);
      const md = renderFixes(plans, ranked);
      run.writeText("FIXES.md", md);
      out(json ? jsonLine({ counts: ranked.counts, plans, file: run.path("FIXES.md") }) : `${md}\n${run.path("FIXES.md")}`);
      return EXIT_OK;
    }
    case "fix": {
      const run = needRun(a, { mustExist: true });
      const flag = argValue(a, "project");
      if (!flag) throw new UsageError("fix needs --project <path>: the one project of yours to fix (see ultraguard fixes --out <run>)");
      const tiers = argList(a, "tiers").map((t) => t.toUpperCase());
      for (const t of tiers) if (!["P0", "P1", "P2"].includes(t)) throw new UsageError(`--tiers takes P0, P1 and P2 (P3 has no plan), not "${t}"`);
      const apply = argBool(a, "apply");
      // The dry run writes nothing: an older run is ranked in memory, not saved.
      const ranked = await rankedOf(a, run, apply ? run : undefined);
      const r = await fixProject(
        ranked,
        {
          project: resolve(flag.replace(/^~(?=$|\/)/, homedir())),
          apply,
          tiers: (tiers.length ? tiers : ["P0", "P1", "P2"]) as Tier[],
          test: !argBool(a, "no-test"),
        },
        run,
        { runner, state: stateDir(argValue(a, "state")) },
      );
      out(json ? jsonLine(r) : renderFix(r, run));
      return r.exitCode;
    }
    case "watch": {
      const sub = a.positional[0];
      const run = needRun(a, { mustExist: sub === "commit" });
      const dir = stateDir(argValue(a, "state"));
      if (sub === "plan") {
        const file = argValue(a, "web-results");
        const hits = file ? readWebResultsFile(file) : [];
        const r = await watchPlan(dir, run, hits, { resweepDays: argInt(a, "resweep-days", { min: 1, max: 365 }) });
        const failures = r.failed.map(
          (f) => `could not fetch ${f.url} (${f.error ?? "?"})${f.givenUp ? `: given up after ${f.attempts} attempts` : `, attempt ${f.attempts}`}`,
        );
        if (json) out(jsonLine({ ...r, hits: hits.length }));
        else if (r.nothingNew)
          out(
            [
              `NOTHING NEW: ${hits.length} hit(s) read, ${r.skipped} source(s) already handled${r.since ? ` (last sweep ${r.since})` : ""}; no re-sweep due`,
              ...failures,
            ].join("\n"),
          );
        else
          out(
            [
              `${hits.length} hit(s) read: ${r.newSources} new source(s), ${r.skipped} already handled${r.resweep ? "; re-sweep of every known campaign is due (iocs.carried.json)" : ""}.`,
              ...failures,
              "Next: fill the IOCs, ioc set, sweep, report, then watch commit.",
            ].join("\n"),
          );
        return EXIT_OK;
      }
      if (sub !== "commit") throw new UsageError("watch takes `plan` or `commit`");
      writeReport(run);
      const r = await watchCommit(dir, run, { notifyIssue: argValue(a, "notify-issue"), runner });
      out(json ? jsonLine({ ...r, newFindings: r.newFindings.map((f) => f.id) }) : `${r.summary}${r.notified ? `\nissue: ${r.notified}` : ""}`);
      return r.exitCode;
    }
  }
  throw new UsageError(`unknown command "${a.command}"`);
}

/** The ranked list of a run: vulnerabilities.json, or the package-checker list of an older run ranked now (saved in `save`, when given). */
async function rankedOf(a: CommandArgs, run: Run, save: Run | undefined): Promise<RankedVulns> {
  const ranked = run.read<RankedVulns | undefined>("vulnerabilities.json", undefined);
  if (ranked) return ranked;
  // A run scanned before the ranking existed: rank its package-checker list now.
  const raw = run.read<{ vulnerabilities?: CheckerVuln[] } | undefined>("deps-vulnerabilities.json", undefined);
  if (!raw) throw new UsageError(`no vulnerability list in ${run.dir}: run \`ultraguard scan deps --out ${run.dir}\` first`);
  const backlog = (raw.vulnerabilities ?? []).filter((x) => !x.advisories.some((y) => (y.id ?? "").startsWith("MAL-")));
  return (await assessVulnerabilities(backlog, save, { get: feedGet, state: stateDir(argValue(a, "state")), runner, home: homedir() })).ranked;
}

const NO_ENGINE =
  "search could not reach any engine (the keyless engines refused or throttled this address). Retry in a few minutes, use your own web search tool, or point ULTRAGUARD_SEARXNG at a SearXNG instance.";

async function searchNewsCommand(a: CommandArgs, run: Run, json: boolean): Promise<number> {
  const r = await searchNews(run, {
    limit: argInt(a, "limit", { min: 1, max: 50 }),
    searcher: newsDeps.searcher,
    platform: newsDeps.platform,
    now: newsDeps.now?.(),
  });
  if (json) out(jsonLine(r));
  else {
    for (const q of r.queries) {
      out(`## ${q.query}: ${q.searched ? `${q.added.length} new hit(s)` : "NOT SEARCHED (no engine answered)"}`);
      for (const h of q.added) out(`- ${h.title ?? ""} <${h.url}>${h.snippet ? `\n    ${h.snippet}` : ""}`);
    }
    for (const n of r.notes) out(`note: ${n}`);
    if (!r.searched) out(NO_ENGINE);
    else if (r.unsearched.length)
      out(
        `\n${r.unsearched.length} of ${r.queries.length} queries got no answer: their news is unknown, not absent. Retry them one by one with search "<query>" in a few minutes, or with your own search tool.`,
      );
    out(
      `\n${r.queries.length} queries (supply chain, then ${OS_NAMES[r.platform] ?? r.platform} malware, ${r.month}), ${r.total} hit(s) in ${run.path("search-hits.json")}. Keep the primary write-ups that can reach this user, then: ultraguard intel --web-results <that file, trimmed> --out ${run.dir}`,
    );
  }
  return r.searched ? EXIT_OK : EXIT_FAILURE;
}

function writeReport(run: Run) {
  const r = renderReport(run);
  run.writeText("REPORT.md", r.report);
  run.writeText("REMEDIATION.md", r.remediation);
  run.write("verdicts.json", r.verdicts);
  return r;
}

export async function main(argv: string[]): Promise<number> {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs(argv, SPEC);
  } catch (e) {
    process.stderr.write(`ultraguard: ${(e as Error).message}\nRun \`ultraguard --help\`.\n`);
    return EXIT_USAGE;
  }
  if (parsed.kind === "help") {
    out(HELP);
    return EXIT_OK;
  }
  if (parsed.kind === "version") {
    out(VERSION);
    return EXIT_OK;
  }
  try {
    return await dispatch(parsed);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`ultraguard: ${e.message}\n`);
      return EXIT_USAGE;
    }
    process.stderr.write(`ultraguard: ${(e as Error).message}\n`);
    return EXIT_FAILURE;
  }
}

export { SURFACES };

function isStartedFile(): boolean {
  try {
    return !!process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
}

// Only when run as a program: `webindex skill bundle` imports the built file to
// read HELP and the flag tables, and importing must not start anything.
if (isInvokedDirectly() || isStartedFile()) {
  for (const stream of [process.stdout, process.stderr]) {
    stream.on("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "EPIPE") process.exit(EXIT_OK);
      throw e;
    });
  }
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      process.stderr.write(`ultraguard: ${(e as Error).message}\n`);
      process.exitCode = EXIT_FAILURE;
    },
  );
}
