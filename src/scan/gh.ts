// A thin, testable layer over `gh api`. gh handles auth, hosts and proxies;
// this layer only knows paths, pages and how gh reports an HTTP failure.
import type { Runner } from "../runner.js";

export interface GhResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export class Gh {
  calls = 0;
  /** Calls the rate limit refused: every one is something not looked at. */
  rateLimited = 0;
  constructor(
    private readonly run: Runner,
    private readonly timeoutMs = 60_000,
  ) {}

  async api<T>(path: string, extra: string[] = []): Promise<GhResult<T>> {
    this.calls++;
    const res = await this.run("gh", ["api", ...extra, path], { timeoutMs: this.timeoutMs });
    if (res.missing) return { ok: false, status: 0, error: "gh is not installed" };
    if (!res.ok) {
      if (/rate limit/i.test(res.stderr) || /rate limit/i.test(res.stdout)) this.rateLimited++;
      const m = /HTTP (\d{3})/.exec(res.stderr) ?? /"status":\s*"?(\d{3})/.exec(res.stdout);
      return { ok: false, status: m ? Number(m[1]) : 0, error: (res.stderr || res.stdout).trim().split("\n")[0] };
    }
    try {
      return { ok: true, status: 200, data: JSON.parse(res.stdout) as T };
    } catch {
      return { ok: false, status: 0, error: "gh returned non-JSON output" };
    }
  }

  /**
   * Every page of a list endpoint, up to `maxPages`. `pick` extracts the list
   * from an envelope (`workflow_runs`, `items`). `truncated` says the cap cut it.
   */
  async paged<T>(
    path: string,
    opts: { pick?: (body: any) => T[]; maxPages?: number; stop?: (page: T[]) => boolean } = {},
  ): Promise<GhResult<T[]> & { truncated?: boolean }> {
    const all: T[] = [];
    const max = opts.maxPages ?? 10;
    for (let page = 1; page <= max; page++) {
      const sep = path.includes("?") ? "&" : "?";
      const res = await this.api<any>(`${path}${sep}per_page=100&page=${page}`);
      if (!res.ok) return page === 1 ? { ok: false, status: res.status, error: res.error } : { ok: true, status: 200, data: all, truncated: true };
      const list: T[] = opts.pick ? opts.pick(res.data) : (res.data as T[]);
      all.push(...list);
      if (list.length < 100 || opts.stop?.(list)) return { ok: true, status: 200, data: all };
    }
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
