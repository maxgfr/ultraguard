// Branches, commits and runs: who did it, and what actually ran.
import { describe, expect, it } from "vitest";
import { payloadRan } from "../src/report.js";
import type { Runner } from "../src/runner.js";
import { scanGithub } from "../src/scan/github.js";
import type { Finding } from "../src/types.js";
import { verdicts } from "../src/verdict.js";
import { AIKIDO_IOCS, fakeGh } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");

function routes(extra: Record<string, unknown> = {}) {
  return {
    user: { login: "me" },
    "search/issues": { items: [] },
    "search/commits": { items: [] },
    "users/me/events": [],
    "user/keys": [],
    "user/gpg_keys": [],
    "user/repos": [{ full_name: "org/site", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: true } }],
    "repos/org/site/pulls": [],
    "repos/org/site/branches": [{ name: "main" }],
    "repos/org/site/commits": [],
    "repos/org/site/actions/runs": { workflow_runs: [] },
    ...extra,
  };
}

const ev = (ref: string, activity_type: string, login: string, timestamp: string, after = "0000000000000000000000000000000000000000", id?: number) => ({
  id,
  ref: `refs/heads/${ref}`,
  activity_type,
  actor: { login },
  timestamp,
  before: "0000000000000000000000000000000000000000",
  after,
});

const withIds = (fs: Omit<Finding, "id">[]) => fs.map((f, i) => ({ ...f, id: `F${i + 1}` }));

describe("github: the repository activity log", () => {
  it("asks for a literal branch by ref and follows the cursor for regex branches, never page=N", async () => {
    const filler = Array.from({ length: 100 }, (_, i) => ev(`feature-${i}`, "branch_creation", "dev", "2026-11-12T08:00:00Z", "a".repeat(40), 1000 + i));
    const gh = fakeGh(
      routes({
        "repos/org/site/activity": (p: string) => {
          if (p.includes("after=CURSOR2")) return [ev("chore/k2fpat9i", "branch_creation", "victim", "2026-11-11T10:52:00Z", "b".repeat(40), 7)];
          if (p.includes("activity_type=branch_creation"))
            return { $link: '<https://api.github.com/repos/org/site/activity?activity_type=branch_creation&after=CURSOR2>; rel="next"', $body: filler };
          return [];
        },
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const activity = gh.calls.filter((p) => p.includes("/activity"));
    expect(activity.some((p) => p.includes(`ref=${encodeURIComponent("refs/heads/wfx-docs")}`))).toBe(true);
    expect(activity.some((p) => p === "repos/org/site/activity?activity_type=branch_creation&after=CURSOR2")).toBe(true);
    expect(activity.some((p) => /[?&]page=/.test(p))).toBe(false);
    expect(r.repos.findings.some((f) => f.title.startsWith("Branch chore/k2fpat9i: created by victim"))).toBe(true);
  });

  it("names the creator, not whoever deleted the branch: your own cleanup leaves your account CLEAN", async () => {
    const gh = fakeGh(
      routes({
        "repos/org/site/activity": [
          ev("wfx-docs", "branch_deletion", "me", "2026-11-12T10:46:00Z", undefined, 2),
          ev("wfx-docs", "branch_creation", "victim", "2026-11-11T10:52:00Z", "c".repeat(40), 1),
        ],
        [`repos/org/site/compare/${"c".repeat(40)}...main`]: { status: "ahead" },
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const branch = r.repos.findings.filter((f) => f.title.startsWith("Branch wfx-docs"));
    expect(branch).toHaveLength(1);
    expect(branch[0]?.actor).toBe("victim");
    expect(branch[0]?.scope).toBe("other");
    expect(branch[0]?.title).toContain("deleted by me (cleanup) 24 h later");
    const v = verdicts(withIds([...r.account.findings, ...r.repos.findings]), [], [r.account.result, r.repos.result]);
    expect(v.find((x) => x.surface === "github:account")?.verdict).toBe("CLEAN");
  });

  it("a deletion alone names no actor", async () => {
    const gh = fakeGh(routes({ "repos/org/site/activity": [ev("wfx-docs", "branch_deletion", "admin", "2026-11-12T10:46:00Z")] }));
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith("Branch wfx-docs"));
    expect(f?.title).toBe("Branch wfx-docs: deleted by admin (creation not in the activity log)");
    expect(f?.actor).toBeUndefined();
    expect(f?.scope).toBeUndefined();
  });

  it("tells a branch created at the default branch's head from one carrying a pushed payload", async () => {
    const head = "d".repeat(40);
    const payload = "e".repeat(40);
    const gh = fakeGh(
      routes({
        "repos/org/site/activity": [
          ev("chore/k2fpat9i", "branch_creation", "victim", "2026-11-11T10:52:00Z", head, 1),
          ev("chore/t768jl38", "branch_creation", "victim", "2026-11-11T10:53:00Z", payload, 2),
        ],
        [`repos/org/site/compare/${head}...main`]: { status: "ahead" },
        [`repos/org/site/compare/${payload}...main`]: { status: "diverged" },
        [`repos/org/site/commits/${payload}`]: { files: [{ filename: ".github/workflows/build-audit-x1.yml", status: "added" }] },
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const probe = r.repos.findings.find((f) => f.title.startsWith("Branch chore/k2fpat9i"));
    const pushed = r.repos.findings.find((f) => f.title.startsWith("Branch chore/t768jl38"));
    expect(probe?.title).toContain("it points at a commit already on main: no commit pushed");
    expect(probe?.ciRun).toBeUndefined();
    expect(pushed?.title).toContain("the commit changes .github/workflows/build-audit-x1.yml");
    expect(pushed?.ciRun).toBe("attacker");
    expect(payloadRan(withIds(r.repos.findings), "org/site")).toBe(true);
  });
});

describe("github: what a run executed", () => {
  const attackerRun = {
    workflow_id: 1,
    name: "CI",
    run_number: 3,
    id: 30,
    head_branch: "wfx-docs",
    head_sha: "evil0001",
    display_title: "update",
    conclusion: "success",
    triggering_actor: { login: "victim" },
    created_at: "2026-11-11T11:00:00Z",
    html_url: "r3",
  };

  it("a commit authored as someone else, carrying an IOC file, is never 'own code'", async () => {
    const gh = fakeGh(
      routes({
        "repos/org/site/actions/runs": { workflow_runs: [attackerRun] },
        "repos/org/site/commits/evil0001": { author: { login: "alice" }, files: [{ filename: ".ci-gvwxh6.sh", status: "added" }] },
        "repos/org/site/compare/evil0001...main": { status: "ahead" },
        "repos/org/site/activity": [ev("main", "push", "victim", "2026-11-11T12:00:00Z", "evil0001", 5)],
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith('Workflow "CI"'));
    expect(f?.ciRun).toBe("attacker");
    expect(f?.title).not.toContain("own code");
  });

  it("a commit merged into the default branch after the run is not 'own code'", async () => {
    const gh = fakeGh(
      routes({
        "repos/org/site/actions/runs": { workflow_runs: [{ ...attackerRun, head_sha: "c0ffee01" }] },
        "repos/org/site/commits/c0ffee01": { author: { login: "alice" }, files: [{ filename: "src/app.ts", status: "modified" }] },
        // Today's main holds it (merged at 12:00), but main at 11:00 was "old0001", which does not.
        "repos/org/site/compare/c0ffee01...main": { status: "ahead" },
        "repos/org/site/compare/c0ffee01...old0001": { status: "behind" },
        "repos/org/site/activity": [
          ev("main", "push", "victim", "2026-11-11T12:00:00Z", "c0ffee01", 6),
          ev("main", "push", "dev", "2026-11-10T13:00:00Z", "old0001", 5),
        ],
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith('Workflow "CI"'));
    expect(f?.ciRun).toBe("attacker");
  });

  it("asks for runs on a literal attacker branch directly, past the newest 300", async () => {
    const busy = Array.from({ length: 100 }, (_, i) => ({
      ...attackerRun,
      id: 1000 + i,
      run_number: 1000 + i,
      head_branch: "main",
      display_title: "build",
      head_sha: undefined,
    }));
    const gh = fakeGh(
      routes({
        "repos/org/site/actions/runs": (p: string) => ({ workflow_runs: p.includes("branch=wfx-docs") ? [{ ...attackerRun, head_sha: undefined }] : busy }),
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(gh.calls.some((p) => p.startsWith("repos/org/site/actions/runs?branch=wfx-docs&created=>=2026-11-10"))).toBe(true);
    expect(r.repos.findings.some((f) => f.title.startsWith('Workflow "CI" ran on wfx-docs'))).toBe(true);
  });
});

describe("github: who pushed a commit", () => {
  const ioc = { sha: "eeafd44d0000", commit: { message: "chore: add ci helper", author: { name: "me", date: "2026-11-11T11:20:37Z" } }, html_url: "u" };

  it("a free-text author name equal to your login does not make it your account's commit", async () => {
    const gh = fakeGh(routes({ "repos/org/site/commits": [{ ...ioc, author: null }] }));
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith("Commit eeafd44d"));
    expect(f?.title).toContain("authored as me (author not linked to an account)");
    expect(f?.scope).toBeUndefined();
    const v = verdicts(withIds(r.repos.findings), [], [r.account.result, r.repos.result]);
    expect(v.find((x) => x.surface === "github:account")?.verdict).toBe("CLEAN");
  });

  it("the pusher from the activity log decides the scope, whatever the author says", async () => {
    const gh = fakeGh(
      routes({
        "repos/org/site/commits": [{ ...ioc, author: { login: "alice" } }],
        "repos/org/site/activity": [ev("main", "push", "me", "2026-11-11T11:21:00Z", "eeafd44d0000", 9)],
      }),
    );
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith("Commit eeafd44d"));
    expect(f?.title).toContain("authored as alice, pushed by me");
    expect(f?.actor).toBe("me");
    expect(f?.scope).toBe("own");
  });

  it("an IOC commit whose files cannot be read still counts as the payload having run", async () => {
    const base = fakeGh(routes({ "repos/org/site/commits": [{ ...ioc, author: { login: "victim" } }] }));
    const gh = (async (cmd: string, args: string[]) => {
      const p = args[args.length - 1] as string;
      if (p === "repos/org/site/commits/eeafd44d0000") return { ok: false, status: 1, stdout: "", stderr: "gh: Bad Gateway (HTTP 502)" };
      return base(cmd, args);
    }) as Runner;
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    const f = r.repos.findings.find((x) => x.title.startsWith("Commit eeafd44d"));
    expect(f?.ciRun).toBe("attacker");
    expect(f?.title).toContain("its changed files could not be read");
    expect(payloadRan(withIds(r.repos.findings), "org/site")).toBe(true);
  });
});
