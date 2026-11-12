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
  --skip-live           host: skip crontab, open connections and processes
  --no-osv              deps: skip the OSV malicious-package advisories
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

export const COMMANDS = ["doctor", "search", "intel", "ioc", "scan", "sweep", "report", "check", "watch"];
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
];
export const BOOL_FLAGS = ["json", "probe", "skip-live", "no-osv"];

const SCAN = ["out", "repos", "max-repos", "concurrency", "roots", "depth", "skip-live", "no-osv", "json"];
const SPEC: CliSpec = {
  commands: COMMANDS,
  valueFlags: VALUE_FLAGS,
  boolFlags: BOOL_FLAGS,
  commandFlags: {
    doctor: ["probe", "json"],
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
    const r = await scanHost(iocs, (tree ?? (() => walkFor(a)))(), runner, { hitRepos: run.meta().hitRepos, skipLive: argBool(a, "skip-live") });
    const f = run.recordSurface(r.result, r.findings, r.gaps);
    return `host: ${r.result.stats.files ?? 0} files, ${r.result.stats.startupItems ?? 0} startup items; ${f.length} finding(s)`;
  }
  if (surface === "deps") {
    const r = await scanDeps(iocs, (tree ?? (() => walkFor(a)))(), run, { osv: argBool(a, "no-osv") ? false : undefined });
    const f = run.recordSurface(r.result, r.findings, r.gaps);
    return `deps: ${r.result.stats.lockfiles ?? 0} lockfiles, ${r.result.stats.packages ?? 0} packages; ${f.length} finding(s)`;
  }
  const r = await scanCloud(iocs, runner);
  const f = run.recordSurface(r.result, r.findings, r.gaps);
  return `cloud: ${r.result.scanned ? "scanned" : "no logged-in CLI"}; ${f.length} finding(s)`;
}

const SURFACE_OF: Record<string, Surface[]> = { github: ["github:account", "github:repos"], host: ["host"], deps: ["deps"], cloud: ["cloud"] };

async function dispatch(a: CommandArgs): Promise<number> {
  const json = argBool(a, "json");
  switch (a.command) {
    case "doctor": {
      const lines = await doctor(runner, { probe: argBool(a, "probe") });
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
        if (!r.searched) out(`search could not reach any engine: ${r.notes.join("; ")}`);
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
          `\nNext: read each source, fill ${run.path(run.iocs() ? "iocs.json" : "iocs.todo.json")}, then \`ultraguard ioc set --file <it> --out ${run.dir}\`.`,
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
                .map((c) => `${c.id}: ${c.title} (since ${c.since}, ${c.indicators.length} indicators) ${c.sources.map((s) => `[${s}]`).join("")}`)
                .join("\n"),
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
      const list = (wanted.length ? wanted : ["github", "host", "deps", "cloud"]) as ("github" | "host" | "deps" | "cloud")[];
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
