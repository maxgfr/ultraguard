// fix: the plan of one own project, applied in a new worktree and branch, re-checked, tested, committed; never pushed.
// git is real but hermetic (a temp repository, no global or system config); every other command is a fake.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { main, setRunner } from "../src/cli.js";
import { detectTest, editJson, editLine, editWorkspaceOverrides, fixProject, splitCommand } from "../src/fix.js";
import { Run } from "../src/run.js";
import { defaultRunner, type Runner } from "../src/runner.js";
import type { Checker, CheckerVuln } from "../src/scan/deps.js";
import { rankVulnerabilities } from "../src/vulns.js";
import { tmp } from "./helpers.js";

const saved = { global: process.env.GIT_CONFIG_GLOBAL, nosystem: process.env.GIT_CONFIG_NOSYSTEM };
beforeAll(() => {
  // Never the user's git config (signing, hooks): only the temp repository's own.
  process.env.GIT_CONFIG_GLOBAL = "/dev/null";
  process.env.GIT_CONFIG_NOSYSTEM = "1";
});
afterAll(() => {
  for (const [k, v] of [
    ["GIT_CONFIG_GLOBAL", saved.global],
    ["GIT_CONFIG_NOSYSTEM", saved.nosystem],
  ] as const)
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
});
afterEach(() => {
  setRunner(defaultRunner);
  vi.restoreAllMocks();
});

const git = (cwd: string, ...args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();

const NOW = new Date(2026, 10, 13, 9, 30);
const PKG = `{\n    "name": "app",\n    "dependencies": {\n        "tar": "^7"\n    }\n}\n`;

/** home/app: a git repository on main with a pnpm project, tar direct and minimatch transitive. */
function repo(opts: { git?: boolean; test?: string } = {}) {
  const home = tmp("ug-fix-");
  const root = join(home, "app");
  mkdirSync(root, { recursive: true });
  const pkg = opts.test ? PKG.replace('"name": "app",', `"name": "app",\n    "scripts": {\n        "test": "${opts.test}"\n    },`) : PKG;
  writeFileSync(join(root, "package.json"), pkg);
  const lock = join(root, "pnpm-lock.yaml");
  writeFileSync(lock, "lockfileVersion: '9.0'\n# tar 7.5.9 minimatch 3.0.5\n");
  if (opts.git !== false) {
    execFileSync("git", ["init", "-q", "-b", "main", root]);
    git(root, "config", "user.name", "Test");
    git(root, "config", "user.email", "test@example.com");
    git(root, "config", "commit.gpgsign", "false");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "init");
  }
  const vulns: CheckerVuln[] = [
    {
      name: "tar",
      version: "7.5.9",
      file: lock,
      ecosystem: "npm",
      severity: "critical",
      advisories: [{ severity: "critical", cve: "CVE-2026-1001", fix: "7.5.21" }],
    },
    {
      name: "minimatch",
      version: "3.0.5",
      file: lock,
      ecosystem: "npm",
      severity: "high",
      advisories: [{ severity: "high", cve: "CVE-2026-1002", fix: "3.1.4" }],
    },
  ];
  const ranked = rankVulnerabilities(vulns, { home, kev: new Map() });
  const run = new Run(tmp("ug-fix-run-"));
  return { home, root, lock, ranked, run, state: tmp("ug-fix-state-") };
}

/** A fake pnpm that rewrites the lockfile, a fake test command; everything else (git) is real. */
function fakes(o: { missing?: string; testOk?: boolean } = {}): Runner & { calls: string[] } {
  const calls: string[] = [];
  const runner = (async (cmd, args, opts) => {
    if (cmd === "git") return defaultRunner(cmd, args, opts);
    calls.push(`${cmd} ${args.join(" ")}${opts?.cwd ? ` @${opts.cwd}` : ""}`);
    if (cmd === o.missing) return { ok: false, status: 127, stdout: "", stderr: "", missing: true };
    if (cmd === "pnpm" && args[0] === "test")
      return o.testOk === false
        ? { ok: false, status: 1, stdout: "FAIL tar.test.ts\n1 failed", stderr: "" }
        : { ok: true, status: 0, stdout: "1 passed", stderr: "" };
    if (cmd === "pnpm" && (args[0] === "up" || args[0] === "install") && opts?.cwd) {
      const f = join(opts.cwd, "pnpm-lock.yaml");
      const text = readFileSync(f, "utf8");
      writeFileSync(f, args[0] === "up" ? text.replace("tar 7.5.9", "tar 7.5.21") : text.replace("minimatch 3.0.5", "minimatch 3.1.4"));
    }
    return { ok: true, status: 0, stdout: "", stderr: "" };
  }) as Runner & { calls: string[] };
  runner.calls = calls;
  return runner;
}

/** package-checker on the worktree: whatever the lockfile still names. */
const checker: Checker = async (dir) => {
  const lock = join(dir, "pnpm-lock.yaml");
  const text = readFileSync(lock, "utf8");
  const v: CheckerVuln[] = [];
  if (text.includes("tar 7.5.9"))
    v.push({ name: "tar", version: "7.5.9", file: lock, ecosystem: "npm", severity: "critical", advisories: [{ cve: "CVE-2026-1001", fix: "7.5.21" }] });
  if (text.includes("minimatch 3.0.5"))
    v.push({ name: "minimatch", version: "3.0.5", file: lock, ecosystem: "npm", severity: "high", advisories: [{ cve: "CVE-2026-1002", fix: "3.1.4" }] });
  return { ok: true, vulnerabilities: v };
};

const TIERS = ["P0", "P1", "P2"] as ("P0" | "P1" | "P2")[];

describe("fix", () => {
  it("dry run: says what --apply would do and writes nothing", async () => {
    const p = repo();
    const runner = fakes();
    const before = readdirSync(p.run.dir);
    const r = await fixProject(p.ranked, { project: p.root, apply: false, tiers: TIERS, test: true }, p.run, { runner, state: p.state, now: NOW, checker });
    const sha = git(p.root, "rev-parse", "HEAD");
    expect(r.dryRun).toBe(true);
    expect(r.exitCode).toBe(0);
    expect(r.branch).toBe(`ultraguard/fix-20261113-${sha.slice(0, 7)}`);
    expect(r.worktree).toBe(join(p.state, "fixes", "app-20261113-0930"));
    expect(r.base).toEqual({ ref: "main", commit: sha });
    expect(r.actions.map((a) => `${a.kind} ${a.command}`)).toEqual([
      "command pnpm up tar@7.5.21 --ignore-scripts",
      'edit set package.json "pnpm.overrides": "minimatch@3.0.5": "3.1.4"',
      "install pnpm install --ignore-scripts",
    ]);
    expect(r.expectedFiles).toEqual(["package.json", "pnpm-lock.yaml"]);
    expect(r.next.drop).toEqual([`git -C ${r.repo} worktree remove --force ${r.worktree}`, `git -C ${r.repo} branch -D ${r.branch}`]);
    // Only the manager check ran; nothing on disk changed.
    expect(runner.calls).toEqual([`pnpm --version @${r.repo}`]);
    expect(readdirSync(p.run.dir)).toEqual(before);
    expect(existsSync(join(p.state, "fixes"))).toBe(false);
    expect(git(p.root, "branch", "--list")).toBe("* main");
    expect(git(p.root, "worktree", "list").split("\n")).toHaveLength(1);
  });

  it("apply: pnpm up for the direct dependency, an override for the transitive one, re-check, tests, a commit; the checkout untouched", async () => {
    const p = repo({ test: "vitest run" });
    const runner = fakes();
    const r = await fixProject(p.ranked, { project: p.root, apply: true, tiers: TIERS, test: true }, p.run, { runner, state: p.state, now: NOW, checker });
    const wt = r.worktree;
    expect(runner.calls).toEqual([
      `pnpm --version @${r.repo}`,
      `pnpm up tar@7.5.21 --ignore-scripts @${wt}`,
      `pnpm install --ignore-scripts @${wt}`,
      `pnpm test @${wt}`,
    ]);
    expect(r.actions.every((a) => a.ok)).toBe(true);
    // The override, written with the file's own four-space indentation.
    expect(readFileSync(join(wt, "package.json"), "utf8")).toBe(
      `{\n    "name": "app",\n    "scripts": {\n        "test": "vitest run"\n    },\n    "dependencies": {\n        "tar": "^7"\n    },\n    "pnpm": {\n        "overrides": {\n            "minimatch@3.0.5": "3.1.4"\n        }\n    }\n}\n`,
    );
    expect(r.recheck).toMatchObject({ ok: true, remaining: [], introduced: [] });
    expect(r.recheck?.closed.map((x) => x.id).sort()).toEqual(["CVE-2026-1001", "CVE-2026-1002"]);
    expect(r.test).toMatchObject({ ran: true, ok: true, command: "pnpm test" });
    expect(r.commit?.ok).toBe(true);
    expect(git(wt, "log", "-1", "--format=%s")).toBe("fix(deps): close 2 known vulnerabilities");
    expect(git(wt, "log", "-1", "--format=%b")).toContain("- minimatch 3.0.5 -> 3.1.4 (override): CVE-2026-1002");
    expect(git(wt, "rev-parse", "--abbrev-ref", "HEAD")).toBe(r.branch);
    expect(r.diffStat).toMatch(/2 files changed/);
    expect(r.exitCode).toBe(0);
    // The user's checkout: same branch, same files, clean.
    expect(git(p.root, "rev-parse", "--abbrev-ref", "HEAD")).toBe("main");
    expect(git(p.root, "status", "--porcelain")).toBe("");
    expect(readFileSync(join(p.root, "pnpm-lock.yaml"), "utf8")).toContain("tar 7.5.9");
    // Nothing pushed: no remote was even configured, and the record holds every step.
    const saved = p.run.read<{ actions: { exitCode: number }[]; exitCode: number }>("fix-app.json", { actions: [], exitCode: -1 });
    expect(saved.exitCode).toBe(0);
    expect(saved.actions.map((a) => a.exitCode)).toEqual([0, 0, 0]);
  });

  it("a failing test keeps the worktree, reports the output, exits 1; remaining advisories exit 1 too", async () => {
    const p = repo({ test: "vitest run" });
    const r = await fixProject(p.ranked, { project: p.root, apply: true, tiers: TIERS, test: true }, p.run, {
      runner: fakes({ testOk: false }),
      state: p.state,
      now: NOW,
      checker,
    });
    expect(r.test).toMatchObject({ ran: true, ok: false, exitCode: 1 });
    expect(r.test?.output).toContain("1 failed");
    expect(r.exitCode).toBe(1);
    expect(existsSync(r.worktree)).toBe(true);

    const q = repo();
    const stuck: Checker = async (dir) => ({
      ok: true,
      vulnerabilities: [
        { name: "tar", version: "7.5.9", file: join(dir, "pnpm-lock.yaml"), ecosystem: "npm", severity: "critical", advisories: [{ cve: "CVE-2026-1001" }] },
      ],
    });
    const s = await fixProject(q.ranked, { project: q.root, apply: true, tiers: TIERS, test: false }, q.run, {
      runner: fakes(),
      state: q.state,
      now: NOW,
      checker: stuck,
    });
    expect(s.test).toMatchObject({ ran: false, why: "--no-test" });
    expect(s.recheck?.remaining.map((x) => x.id)).toEqual(["CVE-2026-1001"]);
    expect(s.recheck?.closed.map((x) => x.id)).toEqual(["CVE-2026-1002"]);
    expect(s.exitCode).toBe(1);
  });

  it("a commit that cannot be signed leaves the changes uncommitted and says so", async () => {
    const p = repo();
    git(p.root, "config", "commit.gpgsign", "true");
    git(p.root, "config", "gpg.program", "false");
    const r = await fixProject(p.ranked, { project: p.root, apply: true, tiers: TIERS, test: false }, p.run, {
      runner: fakes(),
      state: p.state,
      now: NOW,
      checker,
    });
    expect(r.commit?.ok).toBe(false);
    expect(r.commit?.error).toMatch(/git commit failed, the changes are left uncommitted/);
    expect(git(r.worktree, "status", "--porcelain")).toContain("pnpm-lock.yaml");
    expect(r.exitCode).toBe(1);
  });

  it("refuses: no git, a cache, an empty plan, an existing branch, a missing package manager; creates nothing", async () => {
    const opts = (project: string, tiers = TIERS) => ({ project, apply: true, tiers, test: false });
    const nogit = repo({ git: false });
    await expect(fixProject(nogit.ranked, opts(nogit.root), nogit.run, { runner: fakes(), state: nogit.state, now: NOW, checker })).rejects.toThrow(
      /is not a git repository/,
    );

    const home = tmp("ug-fix-cache-");
    const cached = join(home, ".cache/tool/package-lock.json");
    mkdirSync(join(cached, ".."), { recursive: true });
    writeFileSync(cached, "{}");
    const cache = rankVulnerabilities(
      [{ name: "qs", version: "6.1.0", file: cached, ecosystem: "npm", severity: "high", advisories: [{ cve: "CVE-2026-1", fix: "6.14.1" }] }],
      { home, kev: new Map() },
    );
    await expect(fixProject(cache, opts(join(home, ".cache/tool")), new Run(tmp()), { runner: fakes(), state: tmp(), now: NOW })).rejects.toThrow(
      /belongs to a tool, a cache or a plugin/,
    );

    const p = repo();
    await expect(fixProject(p.ranked, opts(p.root, ["P0"]), p.run, { runner: fakes(), state: p.state, now: NOW, checker })).rejects.toThrow(
      /the plan of .* is empty at P0/,
    );
    await expect(fixProject(p.ranked, opts(p.root), p.run, { runner: fakes({ missing: "pnpm" }), state: p.state, now: NOW, checker })).rejects.toThrow(
      /pnpm is not installed/,
    );
    git(p.root, "branch", `ultraguard/fix-20261113-${git(p.root, "rev-parse", "--short=7", "HEAD")}`);
    await expect(fixProject(p.ranked, opts(p.root), p.run, { runner: fakes(), state: p.state, now: NOW, checker })).rejects.toThrow(/already exists/);
    expect(existsSync(join(p.state, "fixes"))).toBe(false);
    expect(git(p.root, "worktree", "list").split("\n")).toHaveLength(1);
  });

  it("CLI: a dry run exits 0, a refusal or a missing --project exits 2, an applied fix with failing tests exits 1", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const p = repo({ test: "vitest run" });
    p.run.write("vulnerabilities.json", p.ranked);
    const before = readdirSync(p.run.dir).sort();
    setRunner(fakes({ testOk: false }));
    expect(await main(["fix", "--out", p.run.dir, "--project", p.root, "--state", p.state])).toBe(0);
    expect(readdirSync(p.run.dir).sort()).toEqual(before);
    expect(await main(["fix", "--out", p.run.dir, "--state", p.state])).toBe(2);
    expect(await main(["fix", "--out", p.run.dir, "--project", p.root, "--tiers", "P3", "--state", p.state])).toBe(2);
    expect(await main(["fix", "--out", p.run.dir, "--project", p.root, "--tiers", "P0", "--state", p.state])).toBe(2);
    // Applied, but the tests fail: exit 1, and the record is written.
    expect(await main(["fix", "--out", p.run.dir, "--project", p.root, "--state", p.state, "--apply"])).toBe(1);
    expect(existsSync(p.run.path("fix-app.json"))).toBe(true);
  });
});

describe("fix edits", () => {
  it("keeps a JSON file's indentation, tabs, CRLF and a missing final newline", () => {
    const d = tmp("ug-fix-json-");
    const f = join(d, "package.json");
    writeFileSync(f, '{\r\n\t"name": "x",\r\n\t"overrides": {\r\n\t\t"a": "1"\r\n\t}\r\n}');
    editJson(f, ["overrides"], "qs@6.1.0", "6.14.1");
    expect(readFileSync(f, "utf8")).toBe('{\r\n\t"name": "x",\r\n\t"overrides": {\r\n\t\t"a": "1",\r\n\t\t"qs@6.1.0": "6.14.1"\r\n\t}\r\n}');
    writeFileSync(f, '{"name":"x"}\n');
    editJson(f, ["resolutions"], "qs", "6.14.1");
    expect(readFileSync(f, "utf8")).toBe('{"name":"x","resolutions":{"qs":"6.14.1"}}\n');
  });

  it("adds to the overrides of a pnpm-workspace.yaml, replacing an existing entry", () => {
    const f = join(tmp("ug-fix-ws-"), "pnpm-workspace.yaml");
    writeFileSync(f, "packages:\n  - packages/*\noverrides:\n    'tar@6.2.1': 6.2.1\n    left-pad: 1.3.0\n\nonlyBuiltDependencies:\n  - esbuild\n");
    expect(editWorkspaceOverrides(f, "tar@6.2.1", "6.2.2")).toBe(true);
    expect(editWorkspaceOverrides(f, "minimatch@3.0.5", "3.1.4")).toBe(true);
    expect(readFileSync(f, "utf8")).toBe(
      'packages:\n  - packages/*\noverrides:\n    "tar@6.2.1": "6.2.2"\n    left-pad: 1.3.0\n    "minimatch@3.0.5": "3.1.4"\n\nonlyBuiltDependencies:\n  - esbuild\n',
    );
    writeFileSync(f, "packages: []\n");
    expect(editWorkspaceOverrides(f, "a", "1")).toBe(false);
  });

  it("pins a requirement, a Cargo.toml dependency and a gem", () => {
    const d = tmp("ug-fix-line-");
    writeFileSync(join(d, "requirements.txt"), "flask==2.0\nRequests[socks]>=2.0 ; python_version > '3.8'\n");
    editLine(join(d, "requirements.txt"), "requests", "2.32.4");
    editLine(join(d, "requirements.txt"), "certifi", "2026.10.18");
    expect(readFileSync(join(d, "requirements.txt"), "utf8")).toBe("flask==2.0\nRequests[socks]==2.32.4; python_version > '3.8'\ncertifi==2026.10.18\n");
    writeFileSync(join(d, "Cargo.toml"), '[dependencies]\nring = "0.16"\nserde = { version = "1.0", features = ["derive"] }\n');
    editLine(join(d, "Cargo.toml"), "ring", "0.17.12");
    editLine(join(d, "Cargo.toml"), "serde", "1.0.200");
    expect(readFileSync(join(d, "Cargo.toml"), "utf8")).toBe('[dependencies]\nring = "0.17.12"\nserde = { version = "1.0.200", features = ["derive"] }\n');
    writeFileSync(join(d, "Gemfile"), "gem 'rack', '~> 2.2', require: false\n");
    editLine(join(d, "Gemfile"), "rack", "2.2.8");
    expect(readFileSync(join(d, "Gemfile"), "utf8")).toBe("gem 'rack', \">= 2.2.8\", require: false\n");
    expect(() => editLine(join(d, "Gemfile"), "rails", "7.1.0")).toThrow(/rails not found in Gemfile/);
  });

  it("splits plan commands and finds the test command", () => {
    expect(splitCommand('uv add --dev "anyio>=4.14.2"')).toEqual(["uv", "add", "--dev", "anyio>=4.14.2"]);
    const d = tmp("ug-fix-test-");
    expect(detectTest(d)).toBeUndefined();
    writeFileSync(join(d, "package.json"), JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }));
    expect(detectTest(d)).toBeUndefined();
    writeFileSync(join(d, "Cargo.toml"), "[package]\n");
    expect(detectTest(d)?.argv).toEqual(["cargo", "test"]);
    writeFileSync(join(d, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
    writeFileSync(join(d, "yarn.lock"), "");
    expect(detectTest(d)?.argv).toEqual(["yarn", "test"]);
    const py = tmp("ug-fix-py-");
    writeFileSync(join(py, "pyproject.toml"), "[tool.pytest.ini_options]\n");
    writeFileSync(join(py, "uv.lock"), "");
    expect(detectTest(py)?.argv).toEqual(["uv", "run", "pytest"]);
  });
});
