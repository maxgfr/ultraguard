// What the GitHub scan looks at beyond names: force pushes, code search, runners, exfiltration repositories.
import { describe, expect, it } from "vitest";
import { matchers, validateIocs } from "../src/ioc.js";
import { scanGithub } from "../src/scan/github.js";
import type { Indicator, IocFile } from "../src/types.js";
import { fakeGh } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");

const iocs = (...indicators: Omit<Indicator, "source">[]): IocFile => ({
  campaigns: [
    { id: "c1", title: "t", sources: ["S1"], since: "2026-11-10T00:00:00Z", indicators: indicators.map((i) => ({ ...i, source: "S1" }) as Indicator) },
  ],
});

function routes(repo: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  return {
    user: { login: "me" },
    "user/keys": [],
    "user/gpg_keys": [],
    "users/me/events": [],
    "user/repos": [{ full_name: "me/pylib", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: true }, ...repo }],
    "repos/me/pylib/actions/runs": { workflow_runs: [] },
    ...extra,
  };
}

describe("github: force pushes to the default branch", () => {
  it("reports each one in the window, and finds content indicators in what it added", async () => {
    const gh = fakeGh(
      routes(
        {},
        {
          "repos/me/pylib/activity": [
            {
              id: 1,
              ref: "refs/heads/main",
              activity_type: "force_push",
              actor: { login: "me" },
              timestamp: "2026-11-11T09:00:00Z",
              before: "aaaa1111",
              after: "bbbb2222",
            },
          ],
          "repos/me/pylib/compare/aaaa1111...bbbb2222": { files: [{ filename: "setup.py", patch: "@@ -1 +1,2 @@\n import os\n+exec(lzcdrtfxyqiplpd)\n" }] },
        },
      ),
    );
    const r = await scanGithub(iocs({ type: "string", value: "lzcdrtfxyqiplpd" }), gh, { now: NOW });
    const hit = r.repos.findings.find((f) => f.severity === "compromised");
    expect(hit?.title).toBe('Force push to main by me added "lzcdrtfxyqiplpd" to setup.py');
    expect(hit?.scope).toBe("own");
    expect(hit?.evidence.ref).toBe("https://github.com/me/pylib/blob/bbbb2222/setup.py");
    expect(r.repos.findings.some((f) => f.severity === "suspicious" && f.title.startsWith("Force push to main by me at 2026-11-11T09:00:00Z"))).toBe(true);
  });
});

describe("github: code search for content indicators", () => {
  it("reports hits in scanned repositories only, and always states its limits", async () => {
    const gh = fakeGh(
      routes(
        {},
        {
          "search/code": {
            items: [
              { path: "setup.py", html_url: "https://github.com/me/pylib/blob/main/setup.py", repository: { full_name: "me/pylib" } },
              { path: "docs/iocs.md", html_url: "https://github.com/me/pylib/blob/main/docs/iocs.md", repository: { full_name: "me/pylib" } },
              { path: "x.py", html_url: "u", repository: { full_name: "me/not-scanned" } },
            ],
          },
        },
      ),
    );
    const r = await scanGithub(iocs({ type: "string", value: "lzcdrtfxyqiplpd" }), gh, { now: NOW });
    const q = gh.calls.find((p) => p.startsWith("search/code")) ?? "";
    expect(decodeURIComponent(q)).toContain('"lzcdrtfxyqiplpd" user:me');
    const found = r.repos.findings.filter((f) => f.title.endsWith("(code search)"));
    expect(found.map((f) => [f.title, f.severity])).toEqual([
      ['setup.py contains "lzcdrtfxyqiplpd" (code search)', "compromised"],
      ['docs/iocs.md contains "lzcdrtfxyqiplpd" (code search)', "suspicious"],
    ]);
    expect(r.repos.gaps.find((g) => g.what.startsWith("string, IP, domain and URL indicators"))?.why).toContain("indexed default branches only");
  });

  it("a refused code search is counted in the gap, not taken as no match", async () => {
    const r = await scanGithub(iocs({ type: "string", value: "lzcdrtfxyqiplpd" }), fakeGh(routes()), { now: NOW });
    expect(r.repos.gaps.find((g) => g.what.startsWith("string, IP, domain and URL indicators"))?.why).toContain("0 of 1 queries answered");
  });
});

describe("github: indicators that name a login, a runner or a repository", () => {
  it("activity by a login a source names is reported even under names the source did not list", async () => {
    const gh = fakeGh(
      routes(
        {},
        {
          "repos/me/pylib/pulls": [
            {
              number: 4,
              title: "chore: bump",
              head: { ref: "bump" },
              user: { login: "victim" },
              created_at: "2026-11-11T00:00:00Z",
              html_url: "https://github.com/me/pylib/pull/4",
            },
          ],
        },
      ),
    );
    const r = await scanGithub(iocs({ type: "actor", value: "victim" }), gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith("PR #4"));
    expect(f?.severity).toBe("suspicious");
    expect(f?.title).toBe('PR #4 "chore: bump" (branch bump) by victim (named compromised by S1)');
  });

  it("lists self-hosted runners and flags one an indicator names", async () => {
    const gh = fakeGh(
      routes(
        { permissions: { push: true, admin: true } },
        {
          "repos/me/pylib/actions/runners": {
            runners: [
              { id: 1, name: "SHA1HULUD", os: "Linux", status: "online" },
              { id: 2, name: "build-box", os: "macOS", status: "offline" },
            ],
          },
        },
      ),
    );
    const r = await scanGithub(iocs({ type: "runner_name", value: "sha1hulud" }), gh, { now: NOW });
    expect(r.repos.findings.find((f) => f.severity === "compromised")?.title).toBe('Self-hosted runner "SHA1HULUD" is registered (Linux, online)');
    expect(r.repos.findings.find((f) => f.severity === "info")?.title).toBe("Self-hosted runner(s) registered: build-box (macOS, offline)");
  });

  it("finds an exfiltration repository on your account by name, description and event, even once deleted", async () => {
    const gh = fakeGh(
      routes(
        {},
        {
          "user/repos": [
            {
              full_name: "me/s1ngularity-repository-1",
              name: "s1ngularity-repository-1",
              owner: { login: "me" },
              description: null,
              created_at: "2026-11-11T00:00:00Z",
              pushed_at: "2026-11-11T00:00:00Z",
              archived: false,
              default_branch: "main",
              permissions: { push: true },
            },
            {
              full_name: "me/x7k2q9w1z0p3m5n8r4",
              name: "x7k2q9w1z0p3m5n8r4",
              owner: { login: "me" },
              description: "Sha1-Hulud: The Second Coming.",
              created_at: "2026-11-11T00:00:00Z",
              pushed_at: "2026-11-11T00:00:00Z",
              archived: false,
              default_branch: "main",
              permissions: { push: true },
            },
          ],
          "users/me/events": [
            { id: 10, type: "CreateEvent", payload: { ref_type: "repository" }, repo: { name: "me/Shai-Hulud" }, created_at: "2026-11-11T01:00:00Z" },
            { id: 11, type: "PublicEvent", payload: {}, repo: { name: "me/private-app-migration" }, created_at: "2026-11-11T02:00:00Z" },
          ],
        },
      ),
    );
    const r = await scanGithub(
      iocs(
        { type: "repo_name", value: "^s1ngularity-repository(-\\d+)?$", regex: true },
        { type: "repo_name", value: "Shai-Hulud" },
        { type: "repo_description", value: "Sha1-Hulud: The Second Coming" },
      ),
      gh,
      { now: NOW },
    );
    const byTitle = Object.fromEntries(r.account.findings.map((f) => [f.title.split(",")[0]?.split(" (")[0], f.severity]));
    expect(byTitle).toMatchObject({
      "Repository me/s1ngularity-repository-1": "compromised",
      "Repository me/x7k2q9w1z0p3m5n8r4": "compromised",
      "Your account created repository me/Shai-Hulud": "compromised",
    });
    expect(r.account.findings.find((f) => f.title.startsWith("Your account made repository me/private-app-migration public"))?.severity).toBe("suspicious");
    // New repositories are one line of context, not one REVIEW item each.
    expect(r.account.findings.filter((f) => f.title.includes("repositories created on your account"))).toHaveLength(1);
    expect(r.account.findings.find((f) => f.title.includes("repositories created on your account"))?.severity).toBe("info");
  });

  it("accepts the new indicator types and matches names exactly", () => {
    const file = iocs(
      { type: "repo_name", value: "tpcp-docs" },
      { type: "runner_name", value: "SHA1HULUD" },
      { type: "repo_description", value: "Here We Go Again" },
    );
    expect(validateIocs(file, [{ id: "S1", url: "u", fetchedAt: "", origin: "web", file: "x" }]).problems).toEqual([]);
    const [name] = matchers(file, "repo_name");
    expect(name?.test("tpcp-docs")).toBe(true);
    expect(name?.test("tpcp-docs-old")).toBe(false);
    expect(matchers(file, "repo_description")[0]?.test("Shai-Hulud: Here We Go Again")).toBe(true);
  });
});
