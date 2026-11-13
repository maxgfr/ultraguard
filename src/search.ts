// search: keyless web discovery through the vendored webindex engine, for a
// host with no search tool of its own (a headless routine, a cloud runner).
// Hits accumulate in <run>/search-hits.json, deduplicated, in the shape
// `intel --web-results` reads, so the agent picks what to fetch from one list.
import { type SearchResult, search as engineSearch } from "./engine.js";
import { type WebHit, parseWebResults, safeCanonical } from "./intel.js";
import type { Run } from "./run.js";

export type Searcher = (query: string, opts: { limit: number }) => Promise<SearchResult>;

export const defaultSearcher: Searcher = (query, opts) => engineSearch(query, { limit: opts.limit, timeoutMs: 45_000 });

export interface SearchHitRecord extends WebHit {
  snippet?: string;
  query: string;
}

export interface SearchOutcome {
  query: string;
  added: SearchHitRecord[];
  total: number;
  searched: boolean;
  notes: string[];
}

export async function searchInto(run: Run, query: string, opts: { limit?: number; searcher?: Searcher } = {}): Promise<SearchOutcome> {
  const res = await (opts.searcher ?? defaultSearcher)(query, { limit: opts.limit ?? 10 });
  const existing = run.read<SearchHitRecord[]>("search-hits.json", []);
  const seen = new Set(existing.map((h) => safeCanonical(h.url)));
  const added: SearchHitRecord[] = [];
  for (const h of parseWebResults(res.hits)) {
    const k = safeCanonical(h.url);
    if (seen.has(k)) continue;
    seen.add(k);
    const raw = res.hits.find((x) => x.url === h.url);
    added.push({ url: h.url, title: h.title, snippet: raw?.snippet?.slice(0, 300), query });
  }
  const all = [...existing, ...added];
  run.write("search-hits.json", all);
  // The engine's notes name webindex's own commands (`searxng up`); say it in ultraguard's terms.
  const notes = res.notes.map((n) => n.replace(/`?(webindex|ultraguard) (searxng|stack|firecrawl) [a-z]+`?/g, "a SearXNG instance (ULTRAGUARD_SEARXNG)"));
  return { query, added, total: all.length, searched: res.searched !== false, notes };
}

// --- search --news: the standard "anything new?" query set, run by ultraguard itself.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Supply-chain attacks: reach every user, whatever their OS. */
export const SUPPLY_CHAIN_QUERIES = [
  "GitHub Actions supply chain attack",
  "compromised GitHub accounts malicious pull requests",
  "malicious npm packages campaign",
  "malicious PyPI packages campaign",
  "VS Code extension malware",
  "CI secret stealer workflow",
  "AI coding agent prompt injection supply chain",
];

/** Machine malware, per OS: a macOS stealer matters to a Mac user, a Windows one does not. */
export const MACHINE_QUERIES: Partial<Record<NodeJS.Platform, string[]>> = {
  darwin: ["macOS stealer", "macOS backdoor", "ClickFix macOS", "fake developer tool installer malware macOS", "XProtect new rules"],
  linux: ["Linux malware campaign", "Linux backdoor", "Linux cryptominer botnet", "Linux infostealer"],
};

export const OS_NAMES: Partial<Record<NodeJS.Platform, string>> = { darwin: "macOS", linux: "Linux", win32: "Windows" };

/** The month and year a news query is scoped to, in English ("November 2026"). */
export function monthYear(now: Date): string {
  return `${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

/** Every query `search --news` runs: supply chain, then this OS's machine malware, each suffixed with the month and year. */
export function newsQueries(platform: NodeJS.Platform, now: Date): { query: string; topic: "supply-chain" | "machine" }[] {
  const when = monthYear(now);
  return [
    ...SUPPLY_CHAIN_QUERIES.map((q) => ({ query: `${q} ${when}`, topic: "supply-chain" as const })),
    ...(MACHINE_QUERIES[platform] ?? []).map((q) => ({ query: `${q} ${when}`, topic: "machine" as const })),
  ];
}

export interface NewsOutcome {
  platform: NodeJS.Platform;
  month: string;
  queries: (Omit<SearchOutcome, "total"> & { topic: "supply-chain" | "machine" })[];
  /** Queries no engine answered: their news is unknown, not absent. */
  unsearched: string[];
  total: number;
  /** At least one query was answered. */
  searched: boolean;
  notes: string[];
}

/**
 * Runs the standard query set one query at a time (parallel queries would get
 * the keyless engines to throttle sooner), appending to <run>/search-hits.json.
 */
export async function searchNews(run: Run, opts: { limit?: number; searcher?: Searcher; platform?: NodeJS.Platform; now?: Date } = {}): Promise<NewsOutcome> {
  const platform = opts.platform ?? process.platform;
  const now = opts.now ?? new Date();
  const queries: NewsOutcome["queries"] = [];
  const notes = new Set<string>();
  let total = run.read<SearchHitRecord[]>("search-hits.json", []).length;
  for (const q of newsQueries(platform, now)) {
    const { total: t, ...r } = await searchInto(run, q.query, { limit: opts.limit ?? 5, searcher: opts.searcher });
    total = t;
    queries.push({ ...r, topic: q.topic });
    for (const n of r.notes) notes.add(n);
  }
  if (!MACHINE_QUERIES[platform])
    notes.add(
      `no machine-malware query set for ${OS_NAMES[platform] ?? platform}: search for malware targeting it yourself, e.g. "${OS_NAMES[platform] ?? platform} infostealer ${monthYear(now)}"`,
    );
  const unsearched = queries.filter((q) => !q.searched).map((q) => q.query);
  return { platform, month: monthYear(now), queries, unsearched, total, searched: unsearched.length < queries.length, notes: [...notes] };
}
