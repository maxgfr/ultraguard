import { describe, expect, it } from "vitest";
import { scanGithub } from "../src/scan/github.js";
import { verdicts } from "../src/verdict.js";
import { AIKIDO_IOCS, aikidoRun, fakeGh } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const b64 = (s: string) => Buffer.from(s).toString("base64");

// The case this skill was born from: a collaborator's stolen token probes an
// org repository, pushes a stealer and its postinstall hook to main, lets CI
// run it, then cleans up. The scanning account itself did nothing wrong.
function collaboratorCase(extra: Record<string, unknown> = {}) {
  return fakeGh({
    user: { login: "me" },
    "search/issues": {
      items: [
        {
          title: "feat: unrelated",
          repository_url: "https://api.github.com/repos/me/app",
          html_url: "https://github.com/me/app/pull/1",
          created_at: "2026-11-11T09:00:00Z",
        },
      ],
    },
    "search/commits": {
      items: [{ commit: { message: "fix: something\n\nbody", author: { date: "2026-11-11T09:00:00Z" } }, repository: { full_name: "me/app" }, html_url: "x" }],
    },
    "users/me/events": [],
    "user/keys": [{ id: 1, title: "laptop", created_at: "2026-03-01T00:00:00Z" }],
    "user/gpg_keys": [],
    "user/repos": [
      { full_name: "org/site", archived: false, pushed_at: "2026-11-12T07:04:31Z", default_branch: "main", permissions: { push: true, admin: false } },
      { full_name: "org/stale", archived: false, pushed_at: "2025-01-01T00:00:00Z", default_branch: "main", permissions: { push: true } },
      { full_name: "org/readonly", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: false } },
    ],
    "repos/org/site/pulls": [
      {
        number: 8,
        title: "docs: dependency audit notes",
        head: { ref: "wfx-docs" },
        user: { login: "victim" },
        created_at: "2026-11-11T11:20:00Z",
        html_url: "https://github.com/org/site/pull/8",
        state: "closed",
      },
      { number: 7, title: "feat: old", head: { ref: "feat" }, user: { login: "me" }, created_at: "2026-10-01T00:00:00Z", html_url: "u", state: "closed" },
    ],
    "repos/org/stale/pulls": [],
    "repos/org/site/branches": [{ name: "main" }],
    "repos/org/site/commits": [
      {
        sha: "a93213fe0000",
        commit: { message: "ci: cleanup", author: { date: "2026-11-12T07:04:31Z" } },
        author: { login: "victim" },
        html_url: "https://github.com/org/site/commit/a93213fe",
      },
      {
        sha: "eeafd44d0000",
        commit: { message: "chore: add ci helper", author: { date: "2026-11-11T11:20:37Z" } },
        author: { login: "victim" },
        html_url: "https://github.com/org/site/commit/eeafd44d",
      },
      { sha: "11110000", commit: { message: "ci: cleanup workflows", author: { date: "2026-11-11T08:00:00Z" } }, author: { login: "me" }, html_url: "y" },
    ],
    "repos/org/site/commits/eeafd44d0000": { files: [{ filename: ".ci-gvwxh6.sh", status: "added" }] },
    "repos/org/site/commits/a93213fe0000": { files: [{ filename: ".ci-gvwxh6.sh", status: "removed" }] },
    "repos/org/site/commits/probe0001": { files: [{ filename: "docs/wfx-audit.md", status: "added" }] },
    "repos/org/site/actions/runs": {
      workflow_runs: [
        {
          workflow_id: 5,
          name: "Deploy",
          run_number: 21,
          head_branch: "main",
          display_title: "chore: add ci helper",
          conclusion: "success",
          triggering_actor: { login: "victim" },
          created_at: "2026-11-11T11:20:39Z",
          html_url: "r21",
        },
        {
          workflow_id: 7,
          name: "Docs",
          run_number: 4,
          head_branch: "wfx-docs",
          head_sha: "probe0001",
          id: 99,
          display_title: "docs: dependency audit notes",
          conclusion: "success",
          triggering_actor: { login: "victim" },
          created_at: "2026-11-11T11:19:00Z",
          html_url: "r4",
        },
        {
          workflow_id: 5,
          name: "Deploy",
          run_number: 23,
          head_branch: "main",
          display_title: "ci: cleanup",
          conclusion: "success",
          triggering_actor: { login: "victim" },
          created_at: "2026-11-12T07:04:33Z",
          html_url: "r23",
        },
      ],
    },
    "repos/org/site/actions/caches": { actions_caches: [{ key: "wfx-abc", created_at: "2026-11-11T11:21:00Z" }] },
    "repos/org/site/actions/artifacts": { artifacts: [] },
    "repos/org/site/contents/.github/workflows": [
      { path: ".github/workflows/deploy.yml", html_url: "https://github.com/org/site/blob/main/.github/workflows/deploy.yml" },
    ],
    "repos/org/site/contents/.github/workflows/deploy.yml": { content: b64("on: push\njobs:\n  x:\n    env:\n      WF_CTOKEN: b42d70a7aab9140ca19e8249\n") },
    "repos/org/site/contents/": [{ path: "package.json", name: "package.json", html_url: "p" }],
    "repos/org/site/contents/package.json": {
      content: b64(JSON.stringify({ scripts: { postinstall: "sh .ci-gvwxh6.sh" } })),
      html_url: "https://github.com/org/site/blob/main/package.json",
    },
    ...extra,
  });
}

describe("scan github", () => {
  it("flags a collaborator's attack in a repo you can push to, and leaves your account clean", async () => {
    const gh = collaboratorCase();
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.login).toBe("me");
    expect(r.account.findings).toEqual([]);
    expect(r.hitRepos).toEqual(["org/site"]);
    const titles = r.repos.findings.map((f) => f.title);
    expect(titles.some((t) => t.startsWith('PR #8 "docs: dependency audit notes"'))).toBe(true);
    expect(titles.some((t) => t.includes('"chore: add ci helper"') && t.startsWith("Commit"))).toBe(true);
    expect(titles.some((t) => t.startsWith('Workflow "Deploy" ran on main'))).toBe(true);
    expect(titles.some((t) => t.includes('Actions cache "wfx-abc"'))).toBe(true);
    expect(titles.some((t) => t.includes("WF_CTOKEN"))).toBe(true);
    expect(titles.some((t) => t.includes('"postinstall" runs "sh .ci-gvwxh6.sh"'))).toBe(true);
    // The deleted run #22 between #21 and #23.
    expect(r.repos.findings.find((f) => f.severity === "suspicious")?.title).toMatch(/missing 1 run\(s\).*#22/);
    // Every attacker action is attributed to the other account, not to you.
    expect(r.repos.findings.filter((f) => f.actor).every((f) => f.scope === "other")).toBe(true);
    // A probe run (docs-only commit) says so, and the commit of a payload names its files.
    expect(titles.some((t) => t.startsWith('Workflow "Docs" ran on wfx-docs') && t.endsWith("the commit only changes docs (a probe)"))).toBe(true);
    expect(titles.some((t) => t.startsWith("Commit eeafd44d") && t.includes("the commit changes .ci-gvwxh6.sh"))).toBe(true);
    // An ordinary "ci: cleanup workflows" is not the IOC "ci: cleanup".
    expect(titles.some((t) => t.includes("cleanup workflows"))).toBe(false);
  });

  it("skips repos you cannot push to and checks only PRs on stale ones", async () => {
    const gh = collaboratorCase();
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.repos.result.stats.repos).toBe(2);
    expect(gh.calls.some((p) => p.startsWith("repos/org/readonly"))).toBe(false);
    expect(gh.calls.some((p) => p.startsWith("repos/org/stale/pulls"))).toBe(true);
    expect(gh.calls.some((p) => p.startsWith("repos/org/stale/branches"))).toBe(false);
    expect(r.repos.gaps.some((g) => g.what.includes("1 repositories with no push"))).toBe(true);
  });

  it("marks your account COMPROMISED when your login opened a probe PR anywhere", async () => {
    const gh = collaboratorCase({
      "search/issues": {
        items: [
          {
            title: "docs: dependency audit notes",
            repository_url: "https://api.github.com/repos/stranger/lib",
            html_url: "https://github.com/stranger/lib/pull/3",
            created_at: "2026-11-11T09:00:00Z",
            state: "open",
          },
        ],
      },
    });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.account.findings).toHaveLength(1);
    expect(r.account.findings[0]?.scope).toBe("own");
    const run = aikidoRun();
    run.recordSurface(r.account.result, r.account.findings, r.account.gaps);
    run.recordSurface(r.repos.result, r.repos.findings, r.repos.gaps);
    const v = verdicts(run.findings(), run.gaps(), run.surfaces());
    expect(v.find((x) => x.surface === "github:account")?.verdict).toBe("COMPROMISED");
  });

  it("reports the whole surface as a gap when gh is not logged in", async () => {
    const r = await scanGithub(AIKIDO_IOCS, fakeGh({}), { now: NOW });
    expect(r.account.result.scanned).toBe(false);
    expect(r.account.gaps[0]?.fix).toBe("gh auth login");
    expect(verdicts([], [...r.account.gaps, ...r.repos.gaps], [r.account.result, r.repos.result]).every((v) => v.verdict === "UNKNOWN")).toBe(true);
  });
});
