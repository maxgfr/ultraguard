import { readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
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
import { intel, readWebResultsFile, type WebHit } from "./intel.js";
import { validateIocs } from "./ioc.js";
import { renderReport } from "./report.js";
import { installedRules, RULE_SETS, type RuleSet, rulesAgeDays, updateRules } from "./rules.js";
import { searchInto } from "./search.js";
import { Run } from "./run.js";
import { defaultRunner, type Runner } from "./runner.js";
import { scanCloud } from "./scan/cloud.js";
import { scanDeps } from "./scan/deps.js";
import { scanGithub } from "./scan/github.js";
import { scanHost } from "./scan/host.js";
import { walk, type WalkResult } from "./scan/walk.js";
import { type Campaign, type IocFile, SURFACES, type Surface } from "./types.js";
import { VERSION } from "./version.js";
import { stateDir, watchCommit, watchPlan } from "./watch.js";

export const HELP = `ultraguard v${VERSION} (webindex ${ENGINE_VERSION})
An AI antivirus for an agent: the agent finds attack news on the web, turns
each article into indicators of compromise (IOCs) that cite it, and ultraguard
sweeps your GitHub account and the repositories you can push to, this machine,
your lockfiles and your cloud for them. Read-only: it changes nothing.

USAGE
  ultraguard doctor [--probe] [--json]
  ultraguard rules update [--set core|extended|full] [--state <dir>]
  ultraguard rules status [--state <dir>]
  ultraguard search <query> --out <run> [--limit <n>]
  ultraguard intel [<url>...] [--web-results <file.json>] --out <run>
  ultraguard ioc set --file <iocs.json> --out <run>
  ultraguard ioc show --out <run> [--json]
  ultraguard scan github|host|deps|cloud --out <run> [scan flags]
  ultraguard sweep --out <run> [--surfaces <list>] [scan flags]
  ultraguard report --out <run> [--json]
  ultraguard check <answer.md> --out <run> [--json]
  ultraguard watch plan [--web-results <file.json>] --out <run> [--state <dir>] [--resweep-days <n>]
  ultraguard watch commit --out <run> [--state <dir>] [--notify-issue <owner/repo>]

THE LOOP
  1. You search the web for attacks: with your own search tool (save the hits
     as JSON), or with search, keyless, into <run>/search-hits.json.
  2. intel        fetch each page once: sources [S1], [S2]... and iocs.todo.json
  3. ioc set      validate your IOC file: every indicator cites a fetched [S#]
  4. sweep        run every scan: findings [F1], [F2]... and coverage gaps
  5. report       REPORT.md (verdict per surface) and REMEDIATION.md
  6. check        your answer cites only real [S#]/[F#] and hides no verdict

SCAN FLAGS
  --repos <a/b,c/d>     github: only these repositories
  --max-repos <n>       github: stop after n repositories
  --concurrency <n>     github: parallel repositories (default 8)
  --roots <dir,dir>     host, deps: where to walk (default: your home directory)
  --depth <n>           host, deps: walk depth (default 6)
  --skip-live           host: skip crontab, open connections, processes, signatures, antivirus
  --no-av               host: skip the ClamAV pass (on by default when ClamAV is installed)
  --av-full             host: ClamAV over every root instead of the targeted list (slow)
  --yara <rules>        host: also run YARA rules (a .yar file or a folder of them)
  --yara-source <S#>    host: the source the YARA rules came from, cited by their findings
  --no-rules            host: skip the community YARA rules (YARA-Forge) installed by rules update
  --set <name>          rules update: core (default, highest precision), extended or full
  --no-osv              deps: skip package-checker (OSV and GHSA feeds, malicious packages)
  --surfaces <list>     sweep: github,host,deps,cloud (default: all)
  --limit <n>           search: hits to aim for (default 10)

ROUTINE (watch)
  watch plan drops sources already handled in --state (default ~/.ultraguard,
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

export const COMMANDS = ["doctor", "rules", "search", "intel", "ioc", "scan", "sweep", "report", "check", "watch"];
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
  "notify-issue",
  "limit",
  "yara",
  "yara-source",
  "set",
];
export const BOOL_FLAGS = ["json", "probe", "skip-live", "no-osv", "no-av", "av-full", "no-rules"];

const SCAN = [
  "out",
  "repos",
  "max-repos",
  "concurrency",
  "roots",
  "depth",
  "skip-live",
  "no-osv",
  "no-av",
  "av-full",
  "yara",
  "yara-source",
  "no-rules",
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
    search: ["out", "limit", "json"],
    intel: ["out", "web-results", "json"],
    ioc: ["out", "file", "json"],
    scan: SCAN,
    sweep: [...SCAN, "surfaces"],
    report: ["out", "json"],
    check: ["out", "json"],
    watch: ["out", "web-results", "state", "resweep-days", "notify-issue", "json"],
  },
};

let runner: Runner = defaultRunner;
/** Test seam: replace every external command. */
export function setRunner(r: Runner): void {
  runner = r;
}

function out(text: string): void {
  process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}

function needRun(a: CommandArgs): Run {
  const dir = argValue(a, "out");
  if (!dir) throw new UsageError(`${a.command} needs --out <run>: one directory per investigation, shared by every command`);
  return new Run(dir);
}

function needIocs(run: Run): IocFile {
  const iocs = run.iocs();
  if (!iocs) throw new UsageError(`no iocs.json in ${run.dir}: run \`ultraguard ioc set --file <iocs.json> --out ${run.dir}\` first`);
  return iocs;
}

function walkFor(a: CommandArgs): WalkResult {
  const roots = argList(a, "roots").map((r) => resolve(r.replace(/^~(?=$|\/)/, homedir())));
  return walk(roots.length ? roots : [homedir()], { maxDepth: argInt(a, "depth", { min: 1, max: 20 }) ?? 6 });
}

async function runScan(surface: "github" | "host" | "deps" | "cloud", a: CommandArgs, run: Run, iocs: IocFile, tree?: () => WalkResult): Promise<string> {
  if (surface === "github") {
    const r = await scanGithub(iocs, runner, {
      repos: argList(a, "repos"),
      maxRepos: argInt(a, "max-repos", { min: 1 }),
      concurrency: argInt(a, "concurrency", { min: 1, max: 32 }),
    });
    const accF = run.recordSurface(r.account.result, r.account.findings, r.account.gaps);
    const repF = run.recordSurface(r.repos.result, r.repos.findings, r.repos.gaps);
    run.setMeta({ login: r.login, hitRepos: r.hitRepos });
    return `github: ${r.repos.result.stats.repos ?? 0} repositories as ${r.login ?? "?"}; ${accF.length} account finding(s), ${repF.length} repository finding(s)`;
  }
  if (surface === "host") {
    const roots = argList(a, "roots").map((r) => resolve(r.replace(/^~(?=$|\/)/, homedir())));
    const r = await scanHost(iocs, (tree ?? (() => walkFor(a)))(), runner, {
      hitRepos: run.meta().hitRepos,
      skipLive: argBool(a, "skip-live"),
      av: argBool(a, "no-av") ? "off" : argBool(a, "av-full") ? "full" : "targeted",
      roots: roots.length ? roots : undefined,
      yara: argValue(a, "yara"),
      yaraSource: argValue(a, "yara-source"),
      listDir: run.dir,
      ...communityRules(a, run),
    });
    const f = run.recordSurface(r.result, r.findings, r.gaps);
    run.write("host-inventory.json", r.inventory);
    return `host: ${r.result.stats.files ?? 0} files, ${r.result.stats.startupItems ?? 0} startup items, ${r.result.stats.credentialFiles ?? 0} credential files; ${f.length} finding(s)`;
  }
  if (surface === "deps") {
    const roots = argList(a, "roots").map((r) => resolve(r.replace(/^~(?=$|\/)/, homedir())));
    const r = await scanDeps(iocs, (tree ?? (() => walkFor(a)))(), run, {
      checker: argBool(a, "no-osv") ? false : undefined,
      runner,
      roots: roots.length ? roots : [homedir()],
    });
    const f = run.recordSurface(r.result, r.findings, r.gaps);
    return `deps: ${r.result.stats.lockfiles ?? 0} lockfiles, ${r.result.stats.packages ?? 0} packages, ${r.result.stats.malicious ?? 0} malicious, ${r.result.stats.vulnerable ?? 0} with known CVEs; ${f.length} finding(s)`;
  }
  const r = await scanCloud(iocs, runner);
  const f = run.recordSurface(r.result, r.findings, r.gaps);
  return `cloud: ${r.result.scanned ? "scanned" : "no logged-in CLI"}; ${f.length} finding(s)`;
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
      if (sub !== "update") throw new UsageError("rules takes `update [--set core|extended|full]` or `status`");
      const set = (argValue(a, "set") ?? "core") as RuleSet;
      if (!RULE_SETS.includes(set)) throw new UsageError(`--set takes ${RULE_SETS.join(", ")}, not "${set}"`);
      const meta = await updateRules(dir, set, runner);
      out(
        json
          ? jsonLine(meta)
          : `YARA-Forge ${meta.set} ${meta.tag}: ${meta.rules} rules (sha256 ${meta.sha256.slice(0, 16)}...), ${meta.compiled ? "compiled with yarac" : "not compiled: yarac missing, scans will parse the rules each time"}\n${meta.source}`,
      );
      return EXIT_OK;
    }
    case "doctor": {
      const lines = await doctor(runner, { probe: argBool(a, "probe"), state: stateDir(argValue(a, "state")) });
      out(json ? jsonLine(lines) : formatDoctor(lines));
      return lines.find((l) => l.check === "gh" && !l.ok) ? EXIT_FAILURE : EXIT_OK;
    }
    case "search": {
      const run = needRun(a);
      const query = a.positional.join(" ").trim();
      if (!query) throw new UsageError('search needs a query: ultraguard search "malicious npm packages november 2026" --out <run>');
      const r = await searchInto(run, query, { limit: argInt(a, "limit", { min: 1, max: 50 }) });
      if (json) out(jsonLine(r));
      else {
        for (const h of r.added) out(`- ${h.title ?? ""} <${h.url}>${h.snippet ? `\n    ${h.snippet}` : ""}`);
        if (!r.searched)
          out(
            "search could not reach any engine (the keyless engines refused or throttled this address). Retry in a few minutes, use your own web search tool, or point ULTRAGUARD_SEARXNG at a SearXNG instance.",
          );
        out(
          `\n${r.added.length} new hit(s), ${r.total} in ${run.path("search-hits.json")}. Keep the primary write-ups, then: ultraguard intel --web-results <that file, trimmed> --out ${run.dir}`,
        );
      }
      return r.searched ? EXIT_OK : EXIT_FAILURE;
    }
    case "intel": {
      const run = needRun(a);
      const hits: WebHit[] = a.positional.map((url) => ({ url }));
      const file = argValue(a, "web-results");
      if (file) hits.push(...readWebResultsFile(file));
      if (!hits.length) throw new UsageError("intel needs at least one <url> or --web-results <file.json>");
      const sources = await intel(run, hits);
      if (json) out(jsonLine(sources));
      else {
        for (const s of sources)
          out(`[${s.id}] ${s.error ? `FAILED (${s.error})` : "ok"}  ${s.title ?? ""} <${s.url}>${s.file ? `\n     text: ${run.path(s.file)}` : ""}`);
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
                        `  ${i.type.padEnd(20)} ${i.ecosystem ? `${i.ecosystem}:` : ""}${i.value}${i.versions?.length ? `@${i.versions.join(",")}` : ""}${i.regex ? " (regex)" : ""}${i.weak ? " (weak)" : ""} [${i.source}]`,
                    ),
                  ].join("\n"),
                )
                .join("\n\n"),
        );
        return EXIT_OK;
      }
      if (sub !== "set") throw new UsageError("ioc takes `set --file <iocs.json>` or `show`");
      const file = argValue(a, "file");
      const own: Campaign[] = file ? (JSON.parse(readFileSync(file, "utf8")) as IocFile).campaigns : [];
      const carried = run.read<IocFile>("iocs.carried.json", { campaigns: [] }).campaigns;
      if (!file && !carried.length) throw new UsageError("ioc set needs --file <iocs.json>");
      const merged = [...own, ...carried.filter((c) => !own.some((o) => o.id === c.id))];
      const { iocs, problems } = validateIocs({ campaigns: merged }, run.sources());
      if (!iocs) {
        out(json ? jsonLine(problems) : `iocs refused: ${problems.length} problem(s)\n${problems.map((p) => `  ${p.path}: ${p.message}`).join("\n")}`);
        return EXIT_FAILURE;
      }
      run.write("iocs.json", iocs);
      const n = iocs.campaigns.reduce((s, c) => s + c.indicators.length, 0);
      out(
        json
          ? jsonLine({ campaigns: iocs.campaigns.length, indicators: n })
          : `iocs set: ${iocs.campaigns.length} campaign(s), ${n} indicator(s)${carried.length ? ` (${carried.length} carried from the watch state)` : ""}`,
      );
      return EXIT_OK;
    }
    case "scan": {
      const surface = a.positional[0];
      if (surface !== "github" && surface !== "host" && surface !== "deps" && surface !== "cloud")
        throw new UsageError("scan takes github, host, deps or cloud");
      const run = needRun(a);
      out(await runScan(surface, a, run, needIocs(run)));
      return EXIT_OK;
    }
    case "sweep": {
      const run = needRun(a);
      const iocs = needIocs(run);
      const wanted = argList(a, "surfaces");
      for (const w of wanted) if (!SURFACE_OF[w]) throw new UsageError(`--surfaces takes github,host,deps,cloud, not "${w}"`);
      // Always github first, whatever order was asked: the host scan looks for clones of the repos it found hit.
      const ORDER = ["github", "host", "deps", "cloud"] as const;
      const list = ORDER.filter((s) => !wanted.length || wanted.includes(s));
      let tree: WalkResult | undefined;
      const shared = () => (tree ??= walkFor(a));
      // GitHub first: the host scan looks for local clones of the repositories it found hit.
      for (const s of list) out(await runScan(s, a, run, iocs, shared));
      const { verdicts: vs } = writeReport(run);
      out(`\n${vs.map((v) => `${v.surface.padEnd(15)} ${v.verdict}`).join("\n")}\n\nreport: ${run.path("REPORT.md")}`);
      return EXIT_OK;
    }
    case "report": {
      const run = needRun(a);
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
      const run = needRun(a);
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
    case "watch": {
      const sub = a.positional[0];
      const run = needRun(a);
      const dir = stateDir(argValue(a, "state"));
      if (sub === "plan") {
        const file = argValue(a, "web-results");
        const hits = file ? readWebResultsFile(file) : [];
        const r = await watchPlan(dir, run, hits, { resweepDays: argInt(a, "resweep-days", { min: 1, max: 365 }) });
        if (json) out(jsonLine(r));
        else if (r.nothingNew) out(`NOTHING NEW: ${r.skipped} source(s) already handled${r.since ? ` (last sweep ${r.since})` : ""}; no re-sweep due`);
        else
          out(
            `${r.newSources} new source(s), ${r.skipped} already handled${r.resweep ? "; re-sweep of every known campaign is due (iocs.carried.json)" : ""}.\nNext: fill the IOCs, ioc set, sweep, report, then watch commit.`,
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
