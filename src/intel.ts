// intel: the pages the agent's web search found become fetched sources [S#].
// The agent searches (its host's search tool is better at discovery than any
// bundled engine); this command fetches each page once, keeps its text, and
// writes the IOC template the agent fills from that text, not from memory.
import { mkdirSync, readFileSync } from "node:fs";
import { canonicalizeUrl, type ExtractResult, fetchAndExtract, writeFileAtomic } from "./engine.js";
import { iocTemplate } from "./ioc.js";
import type { Run } from "./run.js";
import type { Source } from "./types.js";

export type Fetcher = (url: string) => Promise<Pick<ExtractResult, "text" | "title" | "status" | "finalUrl">>;

export const defaultFetcher: Fetcher = (url) => fetchAndExtract(url, { stripConsent: true, format: "markdown" });

export interface WebHit {
  url: string;
  title?: string;
}

/** Accepts what host search tools emit: a list of URLs, a list of hits, or {results|hits|items: [...]}. */
export function parseWebResults(raw: unknown): WebHit[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? ((raw as Record<string, unknown>).results ?? (raw as Record<string, unknown>).hits ?? (raw as Record<string, unknown>).items ?? [])
      : [];
  const out: WebHit[] = [];
  for (const item of list as unknown[]) {
    if (typeof item === "string") out.push({ url: item });
    else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const url = (o.url ?? o.link ?? o.href) as string | undefined;
      if (typeof url === "string") out.push({ url, title: typeof o.title === "string" ? o.title : undefined });
    }
  }
  const seen = new Set<string>();
  return out.filter((h) => {
    if (!/^https?:\/\//i.test(h.url)) return false;
    const k = safeCanonical(h.url);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function safeCanonical(url: string): string {
  try {
    return canonicalizeUrl(url);
  } catch {
    return url;
  }
}

export function readWebResultsFile(path: string): WebHit[] {
  return parseWebResults(JSON.parse(readFileSync(path, "utf8")));
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
