// Regressions from the first cold-start runs of the skill (three fresh agents).
import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkAnswer, claimBlocks } from "../src/check.js";
import { inWindow, matchers, reviewStart } from "../src/ioc.js";
import { payloadRan } from "../src/report.js";
import { scanGithub } from "../src/scan/github.js";
import { scanHost } from "../src/scan/host.js";
import { walk } from "../src/scan/walk.js";
import type { Finding, IocFile } from "../src/types.js";
import { AIKIDO_IOCS, aikidoRun, fakeGh, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const OLD: IocFile["campaigns"][0] = {
  id: "old-wave",
  title: "an old wave",
  sources: ["S1"],
  since: "2025-09-15",
  until: "2025-09-30",
  indicators: [{ type: "commit_message", value: "ci: refresh build cache", source: "S1" }],
};

describe("campaign windows", () => {
  it("an old campaign does not match activity outside its own window", () => {
    const [m] = matchers({ campaigns: [OLD] }, "commit_message");
    expect(inWindow(m!, "2025-09-20T00:00:00Z")).toBe(true);
    expect(inWindow(m!, "2026-11-11T00:00:00Z")).toBe(false);
  });

  it("changes with no IOC are reviewed over 30 days at most, whatever the oldest campaign", () => {
    expect(reviewStart({ campaigns: [OLD, ...AIKIDO_IOCS.campaigns] }, NOW)).toBe("2026-10-13T12:00:00.000Z");
    expect(reviewStart(AIKIDO_IOCS, NOW)).toBe("2026-11-10T12:45:00.000Z");
  });
});

function repoRoutes(runs: unknown[], commits: unknown[] = []) {
  return {
    user: { login: "me" },
    "search/issues": { items: [] },
    "search/commits": { items: [] },
    "users/me/events": [],
    "user/keys": [{ id: 1, title: "old laptop", created_at: "2026-03-12T00:00:00Z" }],
    "user/gpg_keys": [],
    rate_limit: { resources: { core: { remaining: 5000 } } },
    "user/repos": [{ full_name: "org/cron", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: true } }],
    "repos/org/cron/pulls": [],
    "repos/org/cron/branches": [],
    "repos/org/cron/commits": commits,
    "repos/org/cron/actions/runs": { workflow_runs: runs },
  };
}
const run = (n: number, title = "nightly") => ({
  workflow_id: 9,
  name: "Nightly",
  run_number: n,
  head_branch: "main",
  display_title: title,
  created_at: "2026-11-11T00:00:00Z",
});

describe("github noise", () => {
  it("missing run numbers in a repo with no IOC hit are a coverage note, not a finding", async () => {
    const r = await scanGithub({ campaigns: [OLD, ...AIKIDO_IOCS.campaigns] }, fakeGh(repoRoutes([run(1), run(3), run(5)])), { now: NOW });
    expect(r.repos.findings).toEqual([]);
    expect(r.repos.gaps.some((g) => g.what.includes("missing workflow run numbers in 1"))).toBe(true);
    // The SSH key from March is outside the 30-day review window even with a 2025 campaign in the file.
    expect(r.account.findings).toEqual([]);
  });

  it("next to an IOC hit, the same gap is a finding", async () => {
    const r = await scanGithub(AIKIDO_IOCS, fakeGh(repoRoutes([run(1), run(3, "chore: add ci helper")])), { now: NOW });
    expect(r.repos.findings.some((f) => f.severity === "suspicious" && f.title.includes("missing 1 run(s)"))).toBe(true);
  });

  it("a weak indicator only makes a finding suspicious", async () => {
    const iocs: IocFile = {
      campaigns: [
        { ...(AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0]), indicators: [{ type: "commit_message", value: "nightly", weak: true, source: "S1" }] },
      ],
    };
    const r = await scanGithub(
      iocs,
      fakeGh(
        repoRoutes(
          [run(1)],
          [{ sha: "abc", commit: { message: "nightly", author: { date: "2026-11-11T00:00:00Z" } }, author: { login: "bot" }, html_url: "u" }],
        ),
      ),
      { now: NOW },
    );
    expect(r.repos.findings.map((f) => f.severity)).toEqual(["suspicious", "suspicious"]);
  });

  it("records the calls the rate limit refused as a gap", async () => {
    const base = fakeGh(repoRoutes([]));
    const limited = (async (cmd: string, args: string[]) => {
      const path = args[args.length - 1] as string;
      if (path.startsWith("repos/org/cron/branches"))
        return { ok: false, status: 1, stdout: "", stderr: "gh: API rate limit exceeded for user ID 1. (HTTP 403)" };
      return base(cmd, args);
    }) as typeof base;
    const r = await scanGithub(AIKIDO_IOCS, limited, { now: NOW });
    expect(r.repos.gaps.some((g) => g.why.includes("rate limit refused"))).toBe(true);
  });
});

describe("host noise", () => {
  it("a weak file name is suspicious until its hash matches", async () => {
    const home = tmp("ug-weak-");
    mkdirSync(join(home, "p"), { recursive: true });
    writeFileSync(join(home, "p/bundle.js"), "ordinary");
    const iocs: IocFile = {
      campaigns: [
        {
          ...(AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0]),
          indicators: [
            { type: "file", value: "bundle.js", weak: true, source: "S1" },
            { type: "sha256", value: "a".repeat(64), source: "S1" },
          ],
        },
      ],
    };
    const r = await scanHost(iocs, walk([home]), async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true }), {
      home,
      startupDirs: [],
      skipLive: true,
      now: NOW,
    });
    expect(r.findings[0]?.severity).toBe("suspicious");
    expect(r.findings[0]?.title).toContain("matches none of the campaign's 1 hash(es)");
  });

  it("startup items older than 30 days are not reviewed even with an old campaign", async () => {
    const home = tmp("ug-start-");
    const dir = join(home, "LA");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "a.plist"), "<key>Program</key><string>/x</string>");
    utimesSync(join(dir, "a.plist"), new Date("2026-03-12"), new Date("2026-03-12"));
    const r = await scanHost({ campaigns: [OLD] }, walk([home]), async () => ({ ok: false, status: 1, stdout: "", stderr: "" }), {
      home,
      startupDirs: [dir],
      skipLive: true,
      now: NOW,
    });
    expect(r.findings).toEqual([]);
  });
});

describe("report and check wording", () => {
  const f = (title: string): Finding => ({
    id: "F1",
    surface: "github:repos",
    severity: "compromised",
    subject: "r",
    title,
    evidence: { kind: "url", ref: "u" },
    key: title,
  });
  it("a workflow FILE named like an IOC is not a run", () => {
    expect(payloadRan([f("Workflow file .github/workflows/lint.yml on main")], "r")).toBe(false);
    expect(payloadRan([f('Workflow "CI" ran on wfx-docs')], "r")).toBe(true);
  });

  it("citations in nested sub-items ground the parent bullet; coverage sections make no claim", () => {
    const run = aikidoRun();
    run.recordSurface(
      { surface: "github:repos", scanned: true, stats: {}, startedAt: "" },
      [{ ...f('Workflow "CI" ran on main'), key: "k" }],
      [{ surface: "github:repos", what: "x", why: "y" }],
    );
    run.recordSurface({ surface: "github:account", scanned: true, stats: {}, startedAt: "" }, [], []);
    const text =
      "- **Dépôts : COMPROMISED**, la CI a été exécutée par l'attaquant.\n  - `org/site` [F1]\n\n## Couverture\n\nSi la CI des dépôts touchés a un rôle cloud, il n'a pas été vérifié.\n";
    expect(checkAnswer(run, text)).toEqual([]);
    expect(claimBlocks(text.split("\n")).map((b) => b.line)).toEqual([1, 2]);
  });
});
