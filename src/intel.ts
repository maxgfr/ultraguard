// intel: the pages the agent's web search found become fetched sources [S#].
// The agent searches (its host's search tool is better at discovery than any
// bundled engine); this command fetches each page once, keeps its text, and
// writes the IOC template the agent fills from that text, not from memory.
import { mkdirSync, readFileSync } from "node:fs";
import { canonicalizeUrl, type ExtractResult, fetchAndExtract, UsageError, writeFileAtomic } from "./engine.js";
import { iocTemplate } from "./ioc.js";
import type { Run } from "./run.js";
import type { Source } from "./types.js";

export type Fetcher = (url: string) => Promise<Pick<ExtractResult, "text" | "title" | "status" | "finalUrl">>;

export const defaultFetcher: Fetcher = (url) => fetchAndExtract(url, { stripConsent: true, format: "markdown" });

export interface WebHit {
  url: string;
  title?: string;
}

/** The keys host search tools put their list under. */
const LIST_KEYS = ["results", "hits", "items", "data", "organic_results", "urls", "sources", "web"];
export const WEB_RESULTS_SHAPES =
  'a list of URLs, a list of {"url", "title"} hits, or an object holding such a list under results, hits, items, data, organic_results, urls, sources or web.results';

function hitList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const k of LIST_KEYS) {
    const v = o[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object" && Array.isArray((v as Record<string, unknown>).results)) return (v as Record<string, unknown[]>).results as unknown[];
  }
  return [];
}

/** Accepts what host search tools emit: see WEB_RESULTS_SHAPES. */
export function parseWebResults(raw: unknown): WebHit[] {
  return readHits(raw).hits;
}

function readHits(raw: unknown): { hits: WebHit[]; noScheme: number } {
  const out: WebHit[] = [];
  for (const item of hitList(raw)) {
    if (typeof item === "string") out.push({ url: item });
    else if (item && typeof item === "object") {
      // Keys compare case-insensitive: {"URL": ...} and {"Link": ...} are hits too.
      const o = Object.fromEntries(Object.entries(item as Record<string, unknown>).map(([k, v]) => [k.toLowerCase(), v]));
      const url = (o.url ?? o.link ?? o.href) as string | undefined;
      if (typeof url === "string") out.push({ url, title: typeof o.title === "string" ? o.title : undefined });
    }
  }
  const seen = new Set<string>();
  let noScheme = 0;
  const hits = out.filter((h) => {
    if (!/^https?:\/\//i.test(h.url)) {
      if (!/^[a-z][a-z0-9+.-]*:/i.test(h.url)) noScheme++;
      return false;
    }
    const k = safeCanonical(h.url);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { hits, noScheme };
}

export function safeCanonical(url: string): string {
  try {
    return canonicalizeUrl(url);
  } catch {
    return url;
  }
}

/**
 * The hits of a --web-results file. A file that holds something but no http(s) URL is refused:
 * read as zero hits, it would make `watch plan` say NOTHING NEW on a day with news.
 */
export function readWebResultsFile(path: string, warn: (s: string) => void = (s) => process.stderr.write(`${s}\n`)): WebHit[] {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new UsageError(`${path}: not valid JSON (${(e as Error).message})`);
  }
  const { hits, noScheme } = readHits(raw);
  const nonEmpty = Array.isArray(raw)
    ? raw.length > 0
    : !!raw && typeof raw === "object" && Object.values(raw).some((v) => (Array.isArray(v) ? v.length > 0 : !!v && typeof v === "object"));
  if (!hits.length && nonEmpty) throw new UsageError(`${path}: no http(s) URL found. Expected ${WEB_RESULTS_SHAPES}`);
  if (noScheme) warn(`${path}: ${noScheme} hit(s) without https:// were dropped: write the full URL`);
  return hits;
}

export async function intel(run: Run, hits: WebHit[], fetcher: Fetcher = defaultFetcher, now = new Date()): Promise<Source[]> {
  mkdirSync(run.path("sources"), { recursive: true });
  const out: Source[] = [];
  for (const hit of hits) {
    let res: Awaited<ReturnType<Fetcher>> | undefined;
    let error: string | undefined;
    try {
      res = await fetcher(hit.url);
      if (res.status >= 400 || !res.text || res.text.trim().length < 200) error = `HTTP ${res.status}, ${res.text?.trim().length ?? 0} chars of text`;
    } catch (e) {
      error = (e as Error).message;
    }
    const src = run.addSource({
      url: hit.url,
      title: res?.title ?? hit.title,
      fetchedAt: now.toISOString(),
      origin: "web",
      ...(error ? { error } : {}),
    });
    if (!error && res) {
      const file = `sources/${src.id}.md`;
      writeFileAtomic(run.path(file), `# ${src.title ?? src.url}\n\n<${res.finalUrl || src.url}>\n\n${res.text}\n`);
      run.addSource({ ...src, file });
      src.file = file;
    }
    out.push(src);
  }
  if (!run.iocs()) run.write("iocs.todo.json", iocTemplate(run.sources()));
  return out;
}
