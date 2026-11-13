// A thin, testable layer over `gh api`. gh handles auth, hosts and proxies;
// this layer only knows paths, pages and how gh reports an HTTP failure.
import type { Runner } from "../runner.js";

export interface GhResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/** A list read only in part: page `page` failed after earlier pages were read. */
export interface GhPartial {
  page: number;
  error?: string;
  rateLimited: boolean;
}

export type GhList<T> = GhResult<T[]> & { truncated?: boolean; partial?: GhPartial };

const isRateLimit = (s: string | undefined) => /rate limit/i.test(s ?? "");
const sleepMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class Gh {
  calls = 0;
  /** Calls the rate limit refused: every one is something not looked at. */
  rateLimited = 0;
  /** The same, counting only the hourly REST budget (not the per-minute search budget). */
  coreRateLimited = 0;
  /**
   * Every failed call except "not found" (no such file or list) and "empty
   * repository": a 403 or a 500 is something not looked at, never a clean answer.
   */
  failures: { path: string; status: number; error?: string }[] = [];
  /** Every call and whether it got an answer (a 404 is an answer: "there is none"). */
  log: { path: string; answered: boolean }[] = [];
  /** Lists cut by the page cap: their oldest items were not read. */
  truncated: string[] = [];
  constructor(
    private readonly run: Runner,
    private readonly timeoutMs = 60_000,
    /** Injected so tests do not wait for the search rate limit to reset. */
    private readonly sleep: (ms: number) => Promise<void> = sleepMs,
  ) {}

  private async request(path: string, extra: string[], retried = false): Promise<GhResult<string>> {
    this.calls++;
    const res = await this.run("gh", ["api", ...extra, path], { timeoutMs: this.timeoutMs });
    if (res.missing) {
      this.log.push({ path, answered: false });
      return { ok: false, status: 0, error: "gh is not installed" };
    }
    if (!res.ok) {
      const limited = isRateLimit(res.stderr) || isRateLimit(res.stdout);
      // Search allows 30 calls a minute: a refusal clears within a minute, so wait once and retry.
      if (limited && !retried && path.startsWith("search/")) {
        await this.sleep(30_000);
        return this.request(path, extra, true);
      }
      if (limited) {
        this.rateLimited++;
        if (!path.startsWith("search/")) this.coreRateLimited++;
      }
      const m = /HTTP (\d{3})/.exec(res.stderr) ?? /"status":\s*"?(\d{3})/.exec(res.stdout) ?? /^HTTP\/[\d.]+ (\d{3})/.exec(res.stdout);
      const status = m ? Number(m[1]) : 0;
      const error = (res.stderr || res.stdout).trim().split("\n")[0];
      const answered = status === 404 || status === 409;
      if (!answered) this.failures.push({ path, status, error });
      this.log.push({ path, answered });
      return { ok: false, status, error };
    }
    return { ok: true, status: 200, data: res.stdout };
  }

  private parse<T>(path: string, body: string): GhResult<T> {
    try {
      const data = JSON.parse(body) as T;
      this.log.push({ path, answered: true });
      return { ok: true, status: 200, data };
    } catch {
      // A proxy page or an empty body: nothing was read, so it is a failure, not an empty answer.
      const error = "gh returned non-JSON output";
      this.failures.push({ path, status: 0, error });
      this.log.push({ path, answered: false });
      return { ok: false, status: 0, error };
    }
  }

  async api<T>(path: string, extra: string[] = []): Promise<GhResult<T>> {
    const res = await this.request(path, extra);
    if (!res.ok) return { ok: false, status: res.status, error: res.error };
    return this.parse<T>(path, res.data ?? "");
  }

  /**
   * Every page of a list endpoint, up to `maxPages`. `pick` extracts the list
   * from an envelope (`workflow_runs`, `items`). `truncated` says the cap cut it,
   * `partial` that a later page failed after the first ones were read.
   */
  async paged<T>(path: string, opts: { pick?: (body: any) => T[]; maxPages?: number; stop?: (page: T[]) => boolean } = {}): Promise<GhList<T>> {
    const all: T[] = [];
    const max = opts.maxPages ?? 10;
    for (let page = 1; page <= max; page++) {
      const sep = path.includes("?") ? "&" : "?";
      const res = await this.api<any>(`${path}${sep}per_page=100&page=${page}`);
      if (!res.ok) {
        if (page === 1) return { ok: false, status: res.status, error: res.error };
        return { ok: true, status: 200, data: all, truncated: true, partial: { page, error: res.error, rateLimited: isRateLimit(res.error) } };
      }
      const list: T[] = opts.pick ? opts.pick(res.data) : (res.data as T[]);
      all.push(...list);
      if (list.length < 100 || opts.stop?.(list)) return { ok: true, status: 200, data: all };
    }
    this.truncated.push(path);
    return { ok: true, status: 200, data: all, truncated: true };
  }

  /**
   * A cursor-paginated list (the repository activity log ignores `page=`): follow
   * the `rel="next"` URL of the Link header, up to `maxPages`.
   */
  async cursor<T>(path: string, opts: { maxPages?: number; stop?: (page: T[]) => boolean } = {}): Promise<GhList<T>> {
    const all: T[] = [];
    const max = opts.maxPages ?? 5;
    let next: string | undefined = `${path}${path.includes("?") ? "&" : "?"}per_page=100`;
    for (let page = 1; next && page <= max; page++) {
      const res = await this.request(next, ["-i"]);
      if (!res.ok) {
        if (page === 1) return { ok: false, status: res.status, error: res.error };
        return { ok: true, status: 200, data: all, truncated: true, partial: { page, error: res.error, rateLimited: isRateLimit(res.error) } };
      }
      const raw = res.data ?? "";
      const cut = /\r?\n\r?\n/.exec(raw);
      const head = cut ? raw.slice(0, cut.index) : "";
      const body = cut ? raw.slice(cut.index + cut[0].length) : raw;
      const parsed = this.parse<T[]>(next, body);
      if (!parsed.ok) {
        if (page === 1) return { ok: false, status: 0, error: parsed.error };
        return { ok: true, status: 200, data: all, truncated: true, partial: { page, error: parsed.error, rateLimited: false } };
      }
      const list = Array.isArray(parsed.data) ? parsed.data : [];
      all.push(...list);
      if (opts.stop?.(list)) return { ok: true, status: 200, data: all };
      const link = /^link:(.*)$/im.exec(head)?.[1] ?? "";
      next = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1]?.replace(/^https?:\/\/[^/]+\/(api\/v3\/)?/, "");
    }
    if (!next) return { ok: true, status: 200, data: all };
    this.truncated.push(path);
    return { ok: true, status: 200, data: all, truncated: true };
  }

  /** The token's OAuth scopes, read from the X-OAuth-Scopes header. Undefined when gh hides them (fine-grained tokens). */
  async scopes(): Promise<string[] | undefined> {
    this.calls++;
    const res = await this.run("gh", ["api", "-i", "user"], { timeoutMs: this.timeoutMs });
    if (!res.ok) return undefined;
    const m = /^x-oauth-scopes:\s*(.*)$/im.exec(res.stdout);
    return m
      ? (m[1] ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
  }
}
