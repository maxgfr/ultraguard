// Files on the default branch, and what inactive repositories still need read.
import { describe, expect, it } from "vitest";
import { scanGithub } from "../src/scan/github.js";
import type { Indicator, IocFile } from "../src/types.js";
import { fakeGh } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const b64 = (s: string) => Buffer.from(s).toString("base64");

const iocs = (...indicators: Omit<Indicator, "source">[]): IocFile => ({
  campaigns: [
    { id: "c1", title: "t", sources: ["S1"], since: "2026-11-10T00:00:00Z", indicators: indicators.map((i) => ({ ...i, source: "S1" }) as Indicator) },
  ],
});

function routes(repo: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    user: { login: "me" },
    "user/keys": [],
    "user/gpg_keys": [],
    "user/repos": [{ full_name: "org/site", archived: false, default_branch: "main", permissions: { push: true }, ...repo }],
    "repos/org/site/actions/runs": { workflow_runs: [] },
    ...extra,
  };
}
const ACTIVE = { pushed_at: "2026-11-12T00:00:00Z" };
const STALE = { pushed_at: "2026-10-01T00:00:00Z" };
const tree = (...paths: string[]) => ({ tree: paths.map((path) => ({ path, type: "blob" })) });

describe("github: the default branch's whole tree", () => {
  it("matches file indicators with a folder, and basenames in any folder", async () => {
    const gh = fakeGh(
      routes(ACTIVE, {
        "repos/org/site/git/trees/main": tree(
          "README.md",
          "public/fonts/fa-solid-400.woff2",
          "scripts/.ci-abc.sh",
          ".claude/setup.mjs",
          "lib/router_runtime.js",
        ),
      }),
    );
    const r = await scanGithub(
      iocs(
        { type: "file", value: "public/fonts/fa-solid-400.woff2" },
        { type: "file", value: ".ci-*.sh" },
        { type: "file", value: ".claude/setup.mjs" },
        { type: "file", value: "router_runtime.js" },
      ),
      gh,
      { now: NOW },
    );
    const titles = r.repos.findings.map((f) => f.title).sort();
    expect(titles).toEqual([
      "File .claude/setup.mjs on main",
      "File lib/router_runtime.js on main",
      "File public/fonts/fa-solid-400.woff2 on main",
      "File scripts/.ci-abc.sh on main",
    ]);
    expect(r.repos.findings.find((f) => f.title.includes("woff2"))?.evidence.ref).toBe("https://github.com/org/site/blob/main/public/fonts/fa-solid-400.woff2");
    // Only file indicators: the commit list is not read for nothing.
    expect(gh.calls.some((p) => p.startsWith("repos/org/site/commits"))).toBe(false);
    expect(r.repos.gaps.some((g) => g.why.includes("whole file tree"))).toBe(true);
  });

  it("reads install hooks of nested package.json files and content of composite actions", async () => {
    const gh = fakeGh(
      routes(ACTIVE, {
        "repos/org/site/git/trees/main": tree("packages/a/package.json", "node_modules/x/package.json", ".github/actions/setup/action.yml"),
        "repos/org/site/contents/packages/a/package.json": { content: b64(JSON.stringify({ scripts: { postinstall: "node setup_bun.js" } })) },
        "repos/org/site/contents/.github/actions/setup/action.yml": { content: b64("runs:\n  steps:\n    - run: echo $WF_CTOKEN\n") },
      }),
    );
    const r = await scanGithub(iocs({ type: "file", value: "setup_bun.js" }, { type: "string", value: "WF_CTOKEN" }), gh, { now: NOW });
    const titles = r.repos.findings.map((f) => f.title);
    expect(titles).toContain('packages/a/package.json "postinstall" runs "node setup_bun.js"');
    expect(titles).toContain('.github/actions/setup/action.yml contains "WF_CTOKEN"');
    expect(gh.calls.some((p) => p.includes("node_modules"))).toBe(false);
  });

  it("a tree GitHub cut is a gap, and the workflow folder and root are listed as well", async () => {
    const gh = fakeGh(
      routes(ACTIVE, {
        "repos/org/site/git/trees/main": { truncated: true, tree: [] },
        "repos/org/site/contents/.github/workflows": [{ path: ".github/workflows/build-audit-1.yml", type: "file" }],
        "repos/org/site/contents/": [{ path: ".ci-x.sh", type: "file" }],
      }),
    );
    const r = await scanGithub(iocs({ type: "workflow_file", value: ".github/workflows/build-audit-*.yml" }, { type: "file", value: ".ci-*.sh" }), gh, {
      now: NOW,
    });
    const titles = r.repos.findings.map((f) => f.title).sort();
    expect(titles).toEqual(["File .ci-x.sh on main", "Workflow file .github/workflows/build-audit-1.yml on main"]);
    expect(r.repos.gaps.some((g) => g.what.startsWith("files of org/site past what GitHub returns in one tree"))).toBe(true);
  });
});

describe("github: repositories with no push in the window", () => {
  it("reads webhooks and deploy keys of an inactive repository you administer", async () => {
    const gh = fakeGh(
      routes(
        { ...STALE, permissions: { push: true, admin: true } },
        { "repos/org/site/keys": [{ id: 4, title: "persist", created_at: "2026-11-11T00:00:00Z" }], "repos/org/site/hooks": [] },
      ),
    );
    const r = await scanGithub(iocs({ type: "branch", value: "x" }), gh, { now: NOW });
    expect(r.repos.findings.map((f) => f.title)).toContain("Deploy key added in the window: persist");
    expect(r.repos.gaps.some((g) => g.what.includes("webhooks and deploy keys"))).toBe(false);
    expect(r.repos.gaps.find((g) => g.what.includes("with no push"))?.why).toMatch(/^only their pull requests, webhooks and deploy keys/);
  });

  it("reads the workflows of an inactive repository when one ran in the window (a moved action tag)", async () => {
    const gh = fakeGh(
      routes(STALE, {
        "repos/org/site/actions/runs": { total_count: 3, workflow_runs: [{}] },
        "repos/org/site/git/trees/main": tree(".github/workflows/nightly.yml"),
        "repos/org/site/contents/.github/workflows/nightly.yml": {
          content: b64("on: schedule\njobs:\n  x:\n    steps:\n      - uses: tj-actions/changed-files@v45\n"),
        },
      }),
    );
    const r = await scanGithub(iocs({ type: "string", value: "tj-actions/changed-files" }), gh, { now: NOW });
    expect(r.repos.findings.map((f) => f.title)).toEqual(['.github/workflows/nightly.yml contains "tj-actions/changed-files" (3 run(s) since 2026-11-10)']);
  });

  it("does not read the files of an inactive repository where nothing ran", async () => {
    const gh = fakeGh(routes(STALE, { "repos/org/site/actions/runs": { total_count: 0, workflow_runs: [] } }));
    await scanGithub(iocs({ type: "string", value: "tj-actions/changed-files" }), gh, { now: NOW });
    expect(gh.calls.some((p) => p.includes("git/trees"))).toBe(false);
  });
});
