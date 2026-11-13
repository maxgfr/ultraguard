// The vulnerability half of scan deps: loads the exploitation feeds (KEV,
// EPSS), ranks the locked packages package-checker found vulnerable, checks the
// machine's own software, and writes <run>/vulnerabilities.json. Its findings
// replace the single backlog line of scanDeps; every one is info (a pending
// security update is suspicious), so a CVE never makes deps EXPOSED or COMPROMISED.
import { type FeedGet, type KevCatalog, type KevEntry, loadEpss, loadKev } from "../feeds.js";
import type { Run } from "../run.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap } from "../types.js";
import { cvesOf, type RankedVulns, rankVulnerabilities, vulnFindings } from "../vulns.js";
import type { CheckerVuln } from "./deps.js";
import type { SoftwareResult } from "./software.js";

type NewFinding = Omit<Finding, "id">;

/** The machine-software check, injected so a test never runs softwareupdate. */
export type SoftwareScan = (ctx: { runner: Runner; kev?: KevCatalog; kevError?: string; get: FeedGet; now?: Date }) => Promise<SoftwareResult>;

export interface VulnDeps {
  get: FeedGet;
  /** ultraguard's state folder: the feed cache lives in <state>/feeds. */
  state: string;
  runner: Runner;
  home?: string;
  /** The scan roots: where a folder outside any git repository starts. */
  roots?: string[];
  software?: SoftwareScan;
  now?: Date;
}

export async function assessVulnerabilities(
  backlog: CheckerVuln[],
  run: Run | undefined,
  deps: VulnDeps,
): Promise<{ findings: NewFinding[]; gaps: Gap[]; ranked: RankedVulns; stats: Record<string, number> }> {
  const gaps: Gap[] = [];
  const now = deps.now ?? new Date();
  const kev = backlog.length || deps.software ? await loadKev(deps.state, deps.get, now) : undefined;
  if (backlog.length && kev && !kev.data)
    gaps.push({
      surface: "deps",
      what: "which of your vulnerable packages are exploited in the wild (CISA KEV)",
      why: `the KEV catalog could not be loaded and none is cached: ${kev.error ?? "unknown error"}`,
      fix: "re-run scan deps when online",
    });
  else if (kev?.stale)
    gaps.push({
      surface: "deps",
      what: `CISA KEV entries newer than ${kev.fetchedAt?.slice(0, 10)}`,
      why: `the catalog could not be refreshed (${kev.error ?? "unknown error"}): the cached copy was used`,
      fix: "re-run scan deps when online",
    });
  const kevMap = new Map<string, KevEntry>((kev?.data?.vulnerabilities ?? []).map((v) => [v.cveID.toUpperCase(), v]));
  const cves = cvesOf(backlog);
  const epss = cves.length ? await loadEpss(deps.state, cves, deps.get, now) : undefined;
  if (epss?.error)
    gaps.push({
      surface: "deps",
      what: `EPSS exploitation scores for some of ${cves.length} CVE(s)`,
      why: `api.first.org could not be read: ${epss.error}`,
      fix: "re-run scan deps when online",
    });
  const ranked = rankVulnerabilities(backlog, {
    kev: kevMap,
    epss: epss?.data,
    home: deps.home,
    roots: deps.roots,
    now,
    feeds: {
      kev: kev?.data ? { fetchedAt: kev.fetchedAt, catalogVersion: kev.data.catalogVersion, stale: kev.stale } : undefined,
      epss: epss ? { fetchedAt: epss.fetchedAt, stale: epss.stale } : undefined,
    },
  });
  const findings = vulnFindings(ranked, run?.dir);
  const stats: Record<string, number> = { ...Object.fromEntries(Object.entries(ranked.counts).map(([t, n]) => [`vuln${t}`, n])) };
  if (deps.software) {
    const sw = await deps.software({ runner: deps.runner, kev: kev?.data, kevError: kev?.error, get: deps.get, now });
    ranked.machine = sw.machine;
    findings.push(...sw.findings);
    gaps.push(...sw.gaps);
    Object.assign(stats, sw.stats);
  }
  run?.write("vulnerabilities.json", ranked);
  return { findings, gaps, ranked, stats };
}
