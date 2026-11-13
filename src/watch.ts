// watch: the routine mode. Same flow as on demand, scoped to what is new:
//   watch plan   → drops the sources already handled, fetches the new ones,
//                  and, every --resweep-days, re-arms every campaign seen so far.
//   (the agent fills iocs.json from the new sources, then `sweep`)
//   watch commit → records what was handled and alerts only on findings never
//                  alerted before, so a daily run is quiet until something changes.
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { env } from "./engine.js";
import { type Fetcher, intel, safeCanonical, type WebHit } from "./intel.js";
import { Run } from "./run.js";
import type { Runner } from "./runner.js";
import type { Campaign, Finding, IocFile, Surface } from "./types.js";
import { verdicts } from "./verdict.js";

export interface WatchState {
  handled: { url: string; at: string }[];
  campaigns: Campaign[];
  alerted: string[];
  lastSweep?: string;
  lastFullSweep?: string;
  /** Pages that could not be fetched: retried on later runs, given up after MAX_ATTEMPTS. */
  failed?: { url: string; attempts: number; last: string; error?: string }[];
}

/** A page that failed this many daily runs is marked handled (unreachable): it stops counting as new. */
export const MAX_ATTEMPTS = 3;

export const EXIT_ALERT = 10;
export const EXIT_INCOMPLETE = 20;

export function stateDir(flag?: string): string {
  return flag ?? env("HOME") ?? join(homedir(), ".ultraguard");
}

function loadState(dir: string): { store: Run; state: WatchState } {
  mkdirSync(dir, { recursive: true });
  const store = new Run(dir);
  return { store, state: store.read<WatchState>("state.json", { handled: [], campaigns: [], alerted: [] }) };
}

export interface PlanResult {
  /** New pages fetched with text: what the agent has to read. */
  newSources: number;
  /** New pages that could not be fetched this time. */
  failed: { url: string; error?: string; attempts: number; givenUp: boolean }[];
  skipped: number;
  resweep: boolean;
  since?: string;
  nothingNew: boolean;
}

export async function watchPlan(
  dir: string,
  run: Run,
  hits: WebHit[],
  opts: { resweepDays?: number; now?: Date; fetcher?: Fetcher } = {},
): Promise<PlanResult> {
  const now = opts.now ?? new Date();
  const { store, state } = loadState(dir);
  const done = new Set(state.handled.map((h) => safeCanonical(h.url)));
  const fresh = hits.filter((h) => !done.has(safeCanonical(h.url)));
  const days = opts.resweepDays ?? 7;
  const resweep = state.campaigns.length > 0 && (!state.lastFullSweep || now.getTime() - Date.parse(state.lastFullSweep) >= days * 86_400_000);
  const fetched = fresh.length ? await intel(run, fresh, opts.fetcher, now) : [];
  // A page that cannot be fetched is not news the agent can read: count it apart, and stop retrying it after a few runs.
  const tries = new Map((state.failed ?? []).map((f) => [safeCanonical(f.url), f]));
  const failed: PlanResult["failed"] = [];
  for (const s of fetched) {
    const k = safeCanonical(s.url);
    if (!s.error) {
      tries.delete(k);
      continue;
    }
    const attempts = (tries.get(k)?.attempts ?? 0) + 1;
    const givenUp = attempts >= MAX_ATTEMPTS;
    failed.push({ url: s.url, error: s.error, attempts, givenUp });
    if (givenUp) {
      tries.delete(k);
      state.handled.push({ url: s.url, at: now.toISOString() });
    } else tries.set(k, { url: s.url, attempts, last: now.toISOString(), error: s.error });
  }
  if (fetched.length) store.write("state.json", { ...state, failed: [...tries.values()] } satisfies WatchState);
  const ok = fetched.filter((s) => !s.error).length;
  if (resweep) {
    // Re-arm the campaigns already known: their sources become sources of this run too.
    const carried: Campaign[] = [];
    for (const c of state.campaigns) {
      const ids = c.sources.map((s) => {
        const known = (c as Campaign & { sourceUrls?: Record<string, string> }).sourceUrls?.[s];
        return known ? run.addSource({ url: known, title: c.title, fetchedAt: now.toISOString(), origin: "manual" }).id : s;
      });
      const remap = Object.fromEntries(c.sources.map((s, i) => [s, ids[i] as string]));
      carried.push({ ...c, sources: ids, indicators: c.indicators.map((ind) => ({ ...ind, source: remap[ind.source] ?? ind.source })) });
    }
    run.write("iocs.carried.json", { campaigns: carried } satisfies IocFile);
  }
  const result: PlanResult = {
    newSources: ok,
    failed,
    skipped: hits.length - fresh.length,
    resweep,
    since: state.lastSweep,
    nothingNew: ok === 0 && !resweep,
  };
  run.write("watch.json", result);
  return result;
}

export interface CommitResult {
  alert: boolean;
  incomplete: boolean;
  newFindings: Finding[];
  exitCode: number;
  summary: string;
  notified?: string;
}

export async function watchCommit(dir: string, run: Run, opts: { now?: Date; notifyIssue?: string; runner?: Runner } = {}): Promise<CommitResult> {
  const now = opts.now ?? new Date();
  const { store, state } = loadState(dir);
  const plan = run.read<PlanResult | undefined>("watch.json", undefined);
  const sources = run.sources();
  const urlOf = Object.fromEntries(sources.map((s) => [s.id, s.url]));

  // Remember each campaign with the URLs of its sources: [S#] ids are per run.
  const byId = new Map(state.campaigns.map((c) => [c.id, c]));
  for (const c of run.iocs()?.campaigns ?? []) byId.set(c.id, { ...c, sourceUrls: Object.fromEntries(c.sources.map((s) => [s, urlOf[s] ?? ""])) } as Campaign);
  const findingsNow = run.findings();
  const results = run.surfaces();
  const requested = run.meta().requested;
  // UNKNOWN blocks the routine only when a scan was due and failed: not for a surface with nothing to scan
  // (no cloud CLI installed at all), nor for one the sweep was told to leave out (--surfaces).
  const blocking = (v: { surface: Surface; verdict: string }) => {
    if (v.verdict !== "UNKNOWN") return false;
    const r = results.find((x) => x.surface === v.surface);
    if (r?.notApplicable) return false;
    return !(requested && !r && !requested.includes(v.surface));
  };
  const incompleteNow = verdicts(findingsNow, run.gaps(), results).some(blocking);
  const handled = new Map(state.handled.map((h) => [safeCanonical(h.url), h]));
  // A run that could not scan every surface leaves its sources pending: tomorrow's run sweeps them again.
  if (!incompleteNow) for (const s of sources) if (s.origin === "web" && !s.error) handled.set(safeCanonical(s.url), { url: s.url, at: now.toISOString() });

  const findings = run.findings();
  const alerted = new Set(state.alerted);
  // New suspicious items alert too (a fresh fetch-and-run LaunchAgent has no IOC): each one once, like the rest.
  const newFindings = findings.filter((f) => f.severity !== "info" && !alerted.has(f.key));
  const vs = verdicts(findings, run.gaps(), results);
  const incomplete = vs.some(blocking);
  const alert = newFindings.length > 0;

  const lines = alert
    ? newFindings.map(
        (f) =>
          `${f.severity === "suspicious" ? "REVIEW" : "ALERT"}: ${f.campaign ?? (f.surface === "deps" ? "malicious package" : f.severity === "suspicious" ? "machine analysis" : "no campaign")} → ${f.surface} ${f.severity.toUpperCase()}: ${f.title} [${f.id}]`,
      )
    : [`NOTHING NEW: ${vs.map((v) => `${v.surface}=${v.verdict}`).join(", ")}`];
  lines.push(`report: ${run.path("REPORT.md")}`);
  const result: CommitResult = { alert, incomplete, newFindings, exitCode: alert ? EXIT_ALERT : incomplete ? EXIT_INCOMPLETE : 0, summary: lines.join("\n") };

  // The issue goes out before the findings count as alerted: if it cannot be opened, tomorrow's run alerts again.
  let sent = true;
  if (alert && opts.notifyIssue && opts.runner) {
    const body = [
      ...lines.slice(0, -1),
      "",
      "| Surface | Verdict |",
      "|---|---|",
      ...vs.map((v) => `| \`${v.surface}\` | ${v.verdict} |`),
      "",
      `Full report on the machine that ran the sweep: \`${run.path("REPORT.md")}\``,
    ]
      .join("\n")
      .slice(0, 60_000);
    run.writeText("ISSUE.md", `${body}\n`);
    const res = await opts.runner(
      "gh",
      [
        "issue",
        "create",
        "-R",
        opts.notifyIssue,
        "--title",
        `ultraguard: ${newFindings.length} new finding(s) on ${now.toISOString().slice(0, 10)}`,
        "--body-file",
        run.path("ISSUE.md"),
      ],
      { timeoutMs: 60_000 },
    );
    sent = res.ok;
    result.notified = res.ok ? res.stdout.trim() : `failed: ${(res.stderr || res.stdout).trim()} (the findings will alert again on the next run)`;
  }
  if (sent) for (const f of newFindings) alerted.add(f.key);

  const next: WatchState = {
    handled: [...handled.values()],
    campaigns: [...byId.values()],
    alerted: [...alerted],
    lastSweep: now.toISOString(),
    lastFullSweep: !incompleteNow && (plan?.resweep || !state.lastFullSweep) ? now.toISOString() : state.lastFullSweep,
    failed: state.failed,
  };
  store.write("state.json", next);
  return result;
}
