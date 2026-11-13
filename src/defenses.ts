// ultraguard keeps its own detection databases current: ClamAV's signatures
// (through freshclam), the YARA-Forge community rules and package-checker's
// OSV and GHSA advisory feeds (scan deps). A scan on stale
// signatures misses this month's malware families, and leaving that to the
// user means it does not happen. These are the only writes ultraguard makes
// outside a run folder: ClamAV's own database and ultraguard's state folder.
import { detectAv } from "./scan/antivirus.js";
import { FEED_FILES, FEED_STALE_DAYS, feedDir, localFeeds, updateCheckerFeeds } from "./scan/deps.js";
import { defaultRulesDeps, installedRules, type RuleSet, type RulesDeps, rulesAgeDays, updateRules } from "./rules.js";
import type { Runner } from "./runner.js";

/** Older than this, a database is refreshed before a scan. */
export const STALE_DAYS = 7;

export interface DefenseUpdate {
  engine: "clamav" | "yara-forge" | "package-checker";
  /** updated: refreshed now; current: fresh enough, left alone; skipped: engine absent; failed: the refresh did not work. */
  status: "updated" | "current" | "skipped" | "failed";
  detail: string;
}

/** freshclam's summary lines ("daily.cvd updated (version: 28181, ...)"), without the noise. */
export function freshclamSummary(output: string): string[] {
  return output
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\w+\.c[vl]d (updated|database is up-to-date)/.test(l))
    .map((l) => l.replace(/, builder: [^)]*/, ""));
}

/** The line that says why freshclam failed, skipping the errors it recovers from. */
function freshclamError(output: string): string {
  const lines = output
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^ERROR:/.test(l) && !/NULL X509 store/.test(l));
  return (lines.at(-1) ?? output.trim().split("\n").at(-1) ?? "no output").replace(/^ERROR:\s*/, "");
}

export async function updateClamav(runner: Runner, opts: { force?: boolean; now?: Date } = {}): Promise<DefenseUpdate> {
  const av = await detectAv(runner, opts.now);
  if (!av) return { engine: "clamav", status: "skipped", detail: "ClamAV is not installed (brew install clamav, or apt install clamav)" };
  if (!opts.force && av.ageDays !== undefined && av.ageDays <= STALE_DAYS)
    return { engine: "clamav", status: "current", detail: `signatures of ${av.signatures?.slice(0, 10)} (${av.ageDays} days old)` };
  const res = await runner("freshclam", ["--stdout"], { timeoutMs: 600_000 });
  const output = `${res.stdout}\n${res.stderr}`;
  if (res.missing) return { engine: "clamav", status: "failed", detail: "freshclam is not installed next to ClamAV" };
  if (!res.ok) {
    const why = freshclamError(output);
    // On Linux the clamav-freshclam service holds the lock and the database belongs to the clamav user.
    const hint = /lock|permission|denied|Can't open/i.test(why) ? " (the freshclam service may own the database: sudo systemctl restart clamav-freshclam)" : "";
    return { engine: "clamav", status: "failed", detail: `freshclam failed: ${why}${hint}` };
  }
  const after = await detectAv(runner, opts.now);
  const summary = freshclamSummary(output);
  return {
    engine: "clamav",
    status: "updated",
    detail: `signatures of ${after?.signatures?.slice(0, 10) ?? "?"}${summary.length ? `: ${summary.join("; ")}` : ""}`,
  };
}

export async function updateYaraForge(
  state: string,
  runner: Runner,
  opts: { force?: boolean; set?: RuleSet; deps?: RulesDeps; now?: Date } = {},
): Promise<DefenseUpdate> {
  const yara = await runner("yara", ["--version"], { timeoutMs: 10_000 });
  if (!yara.ok) return { engine: "yara-forge", status: "skipped", detail: "YARA is not installed (brew install yara, or apt install yara)" };
  const now = opts.now ?? new Date();
  const have = installedRules(state);
  // A different set asked for is a refresh too.
  if (!opts.force && have && (!opts.set || opts.set === have.set) && rulesAgeDays(have, now) <= STALE_DAYS)
    return { engine: "yara-forge", status: "current", detail: `${have.set} ${have.tag}, ${have.rules} rules (${rulesAgeDays(have, now)} days old)` };
  try {
    const meta = await updateRules(state, opts.set ?? have?.set ?? "core", runner, opts.deps ?? defaultRulesDeps, now);
    return {
      engine: "yara-forge",
      status: "updated",
      detail: `${meta.set} ${meta.tag}: ${meta.rules} rules, ${meta.compiled ? "compiled with yarac" : "not compiled (install yarac for faster scans)"}`,
    };
  } catch (e) {
    return { engine: "yara-forge", status: "failed", detail: (e as Error).message };
  }
}

/**
 * package-checker's advisory feeds in the state folder (scan deps reads them with --data-dir).
 * A failed refresh keeps the previous copy; with no copy at all, package-checker downloads the feeds itself.
 */
export async function updateAdvisoryFeeds(state: string, runner: Runner, opts: { force?: boolean; now?: Date } = {}): Promise<DefenseUpdate> {
  const dir = feedDir(state);
  const have = localFeeds(dir, opts.now);
  // A partial copy (a feed missing) is refreshed: package-checker would look for the missing feed elsewhere.
  if (!opts.force && have && !have.missing.length && have.ageDays <= FEED_STALE_DAYS)
    return { engine: "package-checker", status: "current", detail: `${have.files} feed(s) in ${dir} (${have.ageDays} days old)` };
  const r = await updateCheckerFeeds(runner, dir);
  if (r.ok) return { engine: "package-checker", status: "updated", detail: `${r.detail} (OSV and GHSA advisories for scan deps)` };
  const kept = localFeeds(dir, opts.now);
  return {
    engine: "package-checker",
    status: "failed",
    detail: `feed refresh failed: ${r.detail}; ${kept ? `kept the copy in ${dir} (${kept.ageDays} days old${kept.missing.length ? `, ${kept.missing.length} of ${FEED_FILES.length} feeds missing` : ""})` : "no local copy: package-checker looks for the feeds itself on each scan (its Homebrew copy, else a download)"}`,
  };
}

/** The databases: forced by `rules update`, only when stale before a scan. The advisory feeds only when asked (rules update, scan deps). */
export async function refreshDefenses(
  state: string,
  runner: Runner,
  opts: { force?: boolean; set?: RuleSet; clamav?: boolean; yaraForge?: boolean; advisoryFeeds?: boolean; deps?: RulesDeps; now?: Date } = {},
): Promise<DefenseUpdate[]> {
  const out: DefenseUpdate[] = [];
  if (opts.clamav !== false) out.push(await updateClamav(runner, opts));
  if (opts.yaraForge !== false) out.push(await updateYaraForge(state, runner, opts));
  if (opts.advisoryFeeds) out.push(await updateAdvisoryFeeds(state, runner, opts));
  return out;
}

export function formatDefenses(updates: DefenseUpdate[]): string {
  return updates.map((u) => `${u.engine.padEnd(15)} ${u.status.padEnd(7)} ${u.detail}`).join("\n");
}
