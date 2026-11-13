// What the GitHub scan could not read must never come out CLEAN, and must say why.
import { describe, expect, it } from "vitest";
import type { Runner } from "../src/runner.js";
import { scanGithub } from "../src/scan/github.js";
import type { IocFile } from "../src/types.js";
import { verdicts } from "../src/verdict.js";
import { AIKIDO_IOCS, fakeGh } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const RATE = "gh: API rate limit exceeded for user ID 1. (HTTP 403)";
const noSleep = async () => {};

/** fakeGh, with some paths answered by a failure instead. */
function failing(routes: Record<string, unknown>, fails: [RegExp, string][]): Runner & { calls: string[] } {
  const base = fakeGh(routes);
  const runner = (async (cmd: string, args: string[]) => {
    const p = args[args.length - 1] as string;
    const f = fails.find(([re]) => re.test(p));
    if (f) {
      base.calls.push(p);
      return { ok: false, status: 1, stdout: "", stderr: f[1] };
    }
    return base(cmd, args);
  }) as Runner & { calls: string[] };
  runner.calls = base.calls;
  return runner;
}

const repo = (full_name: string, pushed_at: string, extra: Record<string, unknown> = {}) => ({
  full_name,
  archived: false,
  pushed_at,
  default_branch: "main",
  permissions: { push: true },
  ...extra,
});

const ACCOUNT = {
  user: { login: "me" },
  "search/issues": { items: [] },
  "search/commits": { items: [] },
  "users/me/events": [],
  "user/keys": [],
  "user/gpg_keys": [],
};

function verdictOf(r: Awaited<ReturnType<typeof scanGithub>>) {
  const v = verdicts([], [...r.account.gaps, ...r.repos.gaps], [r.account.result, r.repos.result]);
  return Object.fromEntries(v.map((x) => [x.surface, x.verdict]));
}

describe("github: a surface nothing was read from is UNKNOWN, not CLEAN", () => {
  it("the repository list answering 502 leaves github:repos UNKNOWN, with one gap", async () => {
    const gh = failing(ACCOUNT, [[/^user\/repos/, "gh: Bad Gateway (HTTP 502)"]]);
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(verdictOf(r)["github:repos"]).toBe("UNKNOWN");
    expect(verdictOf(r)["github:account"]).toBe("CLEAN");
    // The list's own gap, not a second generic "API read(s) that failed" one.
    expect(r.repos.gaps.filter((g) => `${g.what} ${g.why}`.includes("user/repos") || g.what.includes("list of your repositories"))).toHaveLength(1);
  });

  it("every call after `user` refused by the rate limit leaves both surfaces UNKNOWN", async () => {
    const gh = failing({ user: { login: "me" } }, [[/^(?!user$)/, RATE]]);
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW, sleep: noSleep });
    expect(verdictOf(r)).toMatchObject({ "github:account": "UNKNOWN", "github:repos": "UNKNOWN" });
    // A rate limit is not a missing scope.
    expect(r.account.gaps.some((g) => g.why.includes("lacks the read:public_key"))).toBe(false);
  });

  it("--repos where every lookup is refused leaves github:repos UNKNOWN", async () => {
    const gh = failing(ACCOUNT, [[/^repos\/org\/site$/, "gh: Forbidden (HTTP 403)"]]);
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW, repos: ["org/site"] });
    expect(verdictOf(r)["github:repos"]).toBe("UNKNOWN");
    expect(r.repos.gaps.filter((g) => g.what === "org/site")).toHaveLength(1);
    expect(r.repos.gaps.some((g) => g.what.includes("API read(s) that failed"))).toBe(false);
  });

  it("an empty repository list that was read is still a scan", async () => {
    const r = await scanGithub(AIKIDO_IOCS, fakeGh({ ...ACCOUNT, "user/repos": [] }), { now: NOW });
    expect(verdictOf(r)["github:repos"]).toBe("CLEAN");
  });
});

describe("github: rate limit", () => {
  const many = Array.from({ length: 5 }, (_, i) => repo(`org/r${i}`, `2026-11-1${i}T00:00:00Z`));

  it("estimates the cost per active repository and names the reset time", async () => {
    const gh = fakeGh({ ...ACCOUNT, "user/repos": many, rate_limit: { resources: { core: { remaining: 40, reset: 1794500000 } } } });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const g = r.repos.gaps.find((x) => x.what.includes("rate limit"));
    expect(g?.why).toMatch(/need up to 74/);
    expect(g?.fix).toContain(new Date(1794500000 * 1000).toISOString());
  });

  it("stops starting repositories once the hourly budget is gone, and names them with a --repos fix", async () => {
    let refused = false;
    const base = fakeGh({ ...ACCOUNT, "user/repos": many });
    const gh = (async (cmd: string, args: string[]) => {
      const p = args[args.length - 1] as string;
      // The most recently pushed repository is read first; the budget runs out during it.
      if (p.startsWith("repos/org/r4/actions/runs")) refused = true;
      if (refused && p.startsWith("repos/")) return { ok: false, status: 1, stdout: "", stderr: RATE };
      return base(cmd, args);
    }) as Runner;
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW, concurrency: 1 });
    expect(base.calls.find((p) => p.startsWith("repos/"))).toMatch(/^repos\/org\/r4\//);
    expect(base.calls.some((p) => p.startsWith("repos/org/r0/"))).toBe(false);
    const g = r.repos.gaps.find((x) => x.what.includes("repositories not read"));
    expect(g?.what).toContain("org/r0");
    expect(g?.fix).toContain("--repos org/r3,org/r2,org/r1,org/r0");
    expect(r.repos.result.scanned).toBe(true);
  });
});

describe("github: failures and lists", () => {
  it("a non-JSON answer is a failed read, not an empty list", async () => {
    const base = fakeGh({ ...ACCOUNT, "user/repos": [repo("org/site", "2026-11-12T00:00:00Z")] });
    const gh = (async (cmd: string, args: string[]) => {
      const p = args[args.length - 1] as string;
      if (p.startsWith("repos/org/site/commits")) return { ok: true, status: 0, stdout: "<html>502</html>", stderr: "" };
      return base(cmd, args);
    }) as Runner;
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.repos.gaps.some((g) => g.what.includes("API read(s) that failed") && g.why.includes("non-JSON"))).toBe(true);
  });

  it("a search refused on a later page says so, waits once for the per-minute reset, and is not blamed on the 1,000 cap", async () => {
    const commits = Array.from({ length: 100 }, (_, i) => ({ commit: { message: `fix ${i}` }, repository: { full_name: "me/x" } }));
    const waits: number[] = [];
    let tries = 0;
    const gh = failing({ ...ACCOUNT, "search/commits": { items: commits }, "user/repos": [] }, []);
    const runner = (async (cmd: string, args: string[]) => {
      const p = args[args.length - 1] as string;
      if (p.startsWith("search/commits") && p.includes("page=2")) {
        tries++;
        return { ok: false, status: 1, stdout: "", stderr: RATE };
      }
      return gh(cmd, args);
    }) as Runner;
    const r = await scanGithub(AIKIDO_IOCS, runner, { now: NOW, sleep: async (ms) => void waits.push(ms) });
    expect(tries).toBe(2);
    expect(waits).toEqual([30_000]);
    const g = r.account.gaps.find((x) => x.what.startsWith("commits you authored"));
    expect(g?.what).toBe("commits you authored past the first 100");
    expect(g?.why).toContain("page 2 failed");
    expect(g?.fix).toContain("in a minute");
    expect(r.account.gaps.some((x) => x.why.includes("1,000"))).toBe(false);
    // Reported once, not again as a generic rate-limit gap.
    expect(r.account.gaps.some((x) => x.what.endsWith("GitHub API calls"))).toBe(false);
  });

  it("a search retried after the per-minute reset leaves no gap", async () => {
    let first = true;
    const base = fakeGh({ ...ACCOUNT, "user/repos": [] });
    const runner = (async (cmd: string, args: string[]) => {
      const p = args[args.length - 1] as string;
      if (p.startsWith("search/issues") && first) {
        first = false;
        return { ok: false, status: 1, stdout: "", stderr: RATE };
      }
      return base(cmd, args);
    }) as Runner;
    const r = await scanGithub(AIKIDO_IOCS, runner, { now: NOW, sleep: noSleep });
    expect(r.account.gaps.some((g) => /pull requests|rate limit/.test(`${g.what} ${g.why}`))).toBe(false);
  });

  it("searches commits by committer date and reports a timed-out search", async () => {
    const gh = fakeGh({ ...ACCOUNT, "search/commits": { items: [], incomplete_results: true }, "user/repos": [] });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const q = gh.calls.find((p) => p.startsWith("search/commits")) ?? "";
    expect(decodeURIComponent(q)).toContain("committer-date:>=2026-11-10");
    expect(decodeURIComponent(q)).not.toContain("author-date");
    expect(r.account.gaps.some((g) => g.what === "part of the commits you authored")).toBe(true);
  });

  it("a truncated events list is an account gap, not a repository one", async () => {
    const events = Array.from({ length: 100 }, () => ({ type: "WatchEvent", created_at: "2026-11-11T00:00:00Z" }));
    const prs = Array.from({ length: 100 }, (_, i) => ({ number: i, title: "x", head: { ref: "x" }, created_at: "2026-11-11T00:00:00Z" }));
    const gh = fakeGh({
      ...ACCOUNT,
      "users/me/events": () => events,
      "user/repos": [repo("org/site", "2026-11-11T00:00:00Z")],
      "repos/org/site/pulls": () => prs,
    });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.account.gaps.some((g) => g.what === "1 list(s) cut by the page cap: users/me/events")).toBe(true);
    expect(r.repos.gaps.some((g) => g.what === "1 list(s) cut by the page cap: repos/org/site/pulls")).toBe(true);
  });

  it("--max-repos keeps the most recently pushed repositories", async () => {
    const gh = fakeGh({
      ...ACCOUNT,
      "user/repos": [repo("org/a-old", "2026-01-01T00:00:00Z"), repo("org/z-new", "2026-11-12T00:00:00Z"), repo("org/m-mid", "2026-11-11T00:00:00Z")],
    });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW, maxRepos: 1 });
    expect(gh.calls.some((p) => p.startsWith("repos/org/z-new/"))).toBe(true);
    expect(gh.calls.some((p) => p.startsWith("repos/org/a-old/") || p.startsWith("repos/org/m-mid/"))).toBe(false);
    expect(r.repos.gaps.some((g) => g.what === "2 repositories past --max-repos (1 pushed to since 2026-11-10)")).toBe(true);
  });
});

describe("github: keys, webhooks and deploy keys", () => {
  const oldCampaign = (since: string): IocFile => ({
    campaigns: [{ ...(AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][number]), since }],
  });

  it("reads every page of the key lists", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ id: i, title: `k${i}`, created_at: "2026-01-01T00:00:00Z" }));
    const gh = fakeGh({
      ...ACCOUNT,
      "user/keys": (p: string) => (p.includes("page=2") ? [{ id: 999, title: "attacker", created_at: "2026-11-11T00:00:00Z" }] : page1),
      "user/repos": [],
    });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(gh.calls.some((p) => p.startsWith("user/keys?per_page=100&page=2"))).toBe(true);
    expect(r.account.findings.some((f) => f.title.includes('"attacker"'))).toBe(true);
  });

  it("compares keys and deploy keys with the campaign window, not the 30-day review cap", async () => {
    const gh = fakeGh({
      ...ACCOUNT,
      "user/keys": [{ id: 1, title: "attacker", created_at: "2026-09-28T00:00:00Z" }],
      "user/repos": [repo("org/site", "2026-11-11T00:00:00Z", { permissions: { push: true, admin: true } })],
      "repos/org/site/keys": [{ id: 2, title: "deploy", created_at: "2026-09-28T00:00:00Z" }],
    });
    const r = await scanGithub(oldCampaign("2026-09-13T00:00:00Z"), gh, { now: NOW });
    expect(r.account.findings.some((f) => f.title.includes('"attacker"'))).toBe(true);
    expect(r.repos.findings.some((f) => f.title.includes("Deploy key added in the window: deploy"))).toBe(true);
  });

  it("says which keys were not listed when the window is older than 180 days", async () => {
    const r = await scanGithub(oldCampaign("2026-01-01T00:00:00Z"), fakeGh({ ...ACCOUNT, "user/repos": [] }), { now: NOW });
    expect(r.account.gaps.some((g) => g.what.startsWith("keys, webhooks and deploy keys added between 2026-01-01 and 2026-05-16"))).toBe(true);
  });
});
