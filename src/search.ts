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
  return { query, added, total: all.length, searched: res.searched !== false, notes: res.notes };
}
