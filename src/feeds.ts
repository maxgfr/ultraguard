// Exploitation feeds for ranking vulnerabilities, cached in ultraguard's state
// folder for 24 hours: CISA's Known Exploited Vulnerabilities catalog (KEV:
// exploited in the wild) and FIRST's EPSS scores (the probability of
// exploitation in the next 30 days). Both are keyless. A failed fetch falls
// back to the cache, however old, and says so; no cache at all is a gap.
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { httpJson, writeFileAtomic } from "./engine.js";
import { mapPool } from "./pool.js";

export const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
export const EPSS_URL = "https://api.first.org/data/v1/epss";
export const CHROME_STABLE_URL = "https://versionhistory.googleapis.com/v1/chrome/platforms/mac/channels/stable/versions";
export const NODE_RELEASES_URL = "https://nodejs.org/dist/index.json";

/** How long a cached feed is fresh. */
export const FEED_TTL_MS = 24 * 3_600_000;
/** EPSS answers at most this many CVEs per call. */
const EPSS_BATCH = 100;

/** A GET answering JSON: the network seam every feed goes through. */
export type FeedGet = (url: string) => Promise<{ ok: boolean; status: number; data?: unknown; error?: string }>;

export const defaultFeedGet: FeedGet = async (url) => {
  const r = await httpJson("GET", url, undefined, { timeoutMs: 60_000, maxBytes: 32 * 1024 * 1024, retries: 2, accept: "application/json" });
  return { ok: r.ok, status: r.status, data: r.data, error: r.error };
};

export interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName?: string;
  dateAdded: string;
  shortDescription?: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
}

export interface KevCatalog {
  catalogVersion?: string;
  dateReleased?: string;
  vulnerabilities: KevEntry[];
}

export interface Epss {
  epss: number;
  percentile: number;
  date?: string;
}

/** What a feed load produced: the data, how old it is, and why it is not fresh when it is not. */
export interface FeedLoad<T> {
  data?: T;
  fetchedAt?: string;
  /** Read from the cache after a failed fetch, older than the TTL. */
  stale?: boolean;
  /** Why the fetch failed, when it did. */
  error?: string;
}

export function feedsDir(state: string): string {
  return join(state, "feeds");
}

function readJson<T>(p: string): T | undefined {
  try {
    return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : undefined;
  } catch {
    return undefined;
  }
}

function save(state: string, name: string, value: unknown): void {
  mkdirSync(feedsDir(state), { recursive: true });
  writeFileAtomic(join(feedsDir(state), name), `${JSON.stringify(value)}\n`);
}

const fresh = (at: string | undefined, now: Date) => !!at && now.getTime() - Date.parse(at) < FEED_TTL_MS;

/** The KEV catalog: from the cache when under 24 hours old, else downloaded (and cached). */
export async function loadKev(state: string, get: FeedGet, now = new Date()): Promise<FeedLoad<KevCatalog>> {
  const p = join(feedsDir(state), "kev.json");
  const cached = readJson<{ fetchedAt: string; catalog: KevCatalog }>(p);
  if (cached && fresh(cached.fetchedAt, now)) return { data: cached.catalog, fetchedAt: cached.fetchedAt };
  const r = await get(KEV_URL);
  const catalog = r.data as KevCatalog | undefined;
  if (r.ok && Array.isArray(catalog?.vulnerabilities)) {
    const slim: KevCatalog = {
      catalogVersion: catalog.catalogVersion,
      dateReleased: catalog.dateReleased,
      vulnerabilities: catalog.vulnerabilities.map((v) => ({
        cveID: v.cveID,
        vendorProject: v.vendorProject,
        product: v.product,
        vulnerabilityName: v.vulnerabilityName,
        dateAdded: v.dateAdded,
        requiredAction: v.requiredAction,
        dueDate: v.dueDate,
        knownRansomwareCampaignUse: v.knownRansomwareCampaignUse,
      })),
    };
    const fetchedAt = now.toISOString();
    save(state, "kev.json", { fetchedAt, catalog: slim });
    return { data: slim, fetchedAt };
  }
  const error = r.ok ? "the answer is not a KEV catalog" : (r.error ?? `HTTP ${r.status}`);
  return cached ? { data: cached.catalog, fetchedAt: cached.fetchedAt, stale: true, error } : { error };
}

interface EpssCache {
  /** A CVE EPSS does not score has no epss: it is remembered so it is not asked again for a day. */
  entries: Record<string, Partial<Epss> & { fetchedAt: string }>;
}

/**
 * EPSS scores for these CVEs: cached ones under 24 hours old are reused, the
 * others are asked in batches of 100. A CVE EPSS does not score is simply absent.
 */
export async function loadEpss(state: string, cves: string[], get: FeedGet, now = new Date()): Promise<FeedLoad<Map<string, Epss>>> {
  const p = join(feedsDir(state), "epss.json");
  const cache = readJson<EpssCache>(p) ?? { entries: {} };
  const wanted = [...new Set(cves.filter((c) => /^CVE-\d{4}-\d+$/i.test(c)).map((c) => c.toUpperCase()))];
  const todo = wanted.filter((c) => !fresh(cache.entries[c]?.fetchedAt, now));
  const batches: string[][] = [];
  for (let i = 0; i < todo.length; i += EPSS_BATCH) batches.push(todo.slice(i, i + EPSS_BATCH));
  const fetchedAt = now.toISOString();
  const errors: string[] = [];
  let asked = 0;
  await mapPool(batches, 4, async (batch) => {
    const r = await get(`${EPSS_URL}?cve=${batch.join(",")}`);
    const rows = (r.data as { data?: { cve: string; epss: string | number; percentile: string | number; date?: string }[] } | undefined)?.data;
    if (!r.ok || !Array.isArray(rows)) {
      errors.push(r.error ?? `HTTP ${r.status}`);
      return;
    }
    asked += batch.length;
    for (const row of rows) {
      const epss = Number(row.epss);
      if (!row.cve || Number.isNaN(epss)) continue;
      cache.entries[row.cve.toUpperCase()] = { epss, percentile: Number(row.percentile) || 0, date: row.date, fetchedAt };
    }
    for (const c of batch) if (cache.entries[c]?.fetchedAt !== fetchedAt) cache.entries[c] = { fetchedAt };
  });
  if (asked) save(state, "epss.json", cache);
  const scores = new Map<string, Epss>();
  let oldest: string | undefined;
  for (const c of wanted) {
    const e = cache.entries[c];
    if (!e) continue;
    if (!oldest || e.fetchedAt < oldest) oldest = e.fetchedAt;
    if (typeof e.epss === "number") scores.set(c, { epss: e.epss, percentile: e.percentile ?? 0, date: e.date });
  }
  const missing = wanted.filter((c) => !cache.entries[c]).length;
  return {
    data: scores,
    fetchedAt: oldest,
    stale: errors.length > 0 && wanted.some((c) => cache.entries[c] && !fresh(cache.entries[c]?.fetchedAt, now)),
    error: errors.length ? `${errors[0]}${missing ? ` (${missing} CVE(s) without a score)` : ""}` : undefined,
  };
}

/** How old the cached feeds are, for doctor. */
export function feedCache(
  state: string,
  now = new Date(),
): { kev?: { ageHours: number; catalogVersion?: string; entries: number }; epss?: { ageHours: number; entries: number } } {
  const out: ReturnType<typeof feedCache> = {};
  const hours = (at: string) => Math.max(0, Math.floor((now.getTime() - Date.parse(at)) / 3_600_000));
  const kev = readJson<{ fetchedAt: string; catalog: KevCatalog }>(join(feedsDir(state), "kev.json"));
  if (kev?.fetchedAt)
    out.kev = { ageHours: hours(kev.fetchedAt), catalogVersion: kev.catalog?.catalogVersion, entries: kev.catalog?.vulnerabilities?.length ?? 0 };
  const epssPath = join(feedsDir(state), "epss.json");
  const epss = readJson<EpssCache>(epssPath);
  if (epss) {
    let mtime = now.toISOString();
    try {
      mtime = statSync(epssPath).mtime.toISOString();
    } catch {
      // keep "now": the file was just read
    }
    out.epss = { ageHours: hours(mtime), entries: Object.keys(epss.entries ?? {}).length };
  }
  return out;
}

/** The current stable Chrome for macOS, or undefined when Google could not be asked. */
export async function chromeStable(get: FeedGet): Promise<string | undefined> {
  const r = await get(CHROME_STABLE_URL);
  const v = (r.data as { versions?: { version?: string }[] } | undefined)?.versions?.[0]?.version;
  return r.ok && typeof v === "string" ? v : undefined;
}

export interface NodeRelease {
  version: string;
  date?: string;
  security?: boolean;
  lts?: string | boolean;
}

/** Every Node.js release, newest first, or undefined when nodejs.org could not be asked. */
export async function nodeReleases(get: FeedGet): Promise<NodeRelease[] | undefined> {
  const r = await get(NODE_RELEASES_URL);
  return r.ok && Array.isArray(r.data) ? (r.data as NodeRelease[]) : undefined;
}
