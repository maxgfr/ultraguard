// The fix plan: package manager from the lockfile, smallest fixed version, the exact command.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { managerOf, planFixes, renderFixes } from "../src/fixes.js";
import type { CheckerVuln } from "../src/scan/deps.js";
import { rankVulnerabilities } from "../src/vulns.js";
import { tmp } from "./helpers.js";

function put(root: string, rel: string, body = ""): string {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  return p;
}

const v = (file: string, name: string, version: string, fix: string, severity = "high", cve = `CVE-2026-${name.length}${version.length}`): CheckerVuln => ({
  name,
  version,
  file,
  ecosystem: "npm",
  severity,
  advisories: [{ severity, cve, fix }],
});

describe("fixes", () => {
  it("knows the package manager from the lockfile", () => {
    const d = tmp("ug-mgr-");
    expect(managerOf(put(d, "a/yarn.lock", "# yarn lockfile v1\n"))).toBe("yarn");
    expect(managerOf(put(d, "b/yarn.lock", "__metadata:\n  version: 8\n"))).toBe("yarn-berry");
    expect(managerOf("/x/pnpm-lock.yaml")).toBe("pnpm");
    expect(managerOf("/x/requirements-dev.txt")).toBe("pip");
    expect(managerOf("/x/go.sum")).toBe("go");
    expect(managerOf("/x/Gemfile.lock")).toBe("bundler");
  });

  it("pnpm: pnpm up for a direct dependency, one override per older locked version, each to its own fix", () => {
    const home = tmp("ug-fx-");
    put(home, "app/.git/HEAD");
    put(home, "app/pnpm-workspace.yaml", "packages: ['packages/*']\n");
    put(home, "app/package.json", JSON.stringify({ dependencies: { tar: "^7" } }));
    const lock = put(home, "app/pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
    const r = rankVulnerabilities(
      [
        v(lock, "tar", "7.5.9", "7.5.21", "critical"),
        v(lock, "tar", "6.2.1", "6.2.2", "critical"),
        v(lock, "minimatch", "3.0.5", "3.1.4"),
        v(lock, "minimatch", "10.1.1", "11.0.1"),
        v(lock, "lowpkg", "1.0.0", "1.0.1", "low"),
        v(lock, "nofix", "1.0.0", "", "critical"),
      ],
      { home, kev: new Map() },
    );
    const [plan] = planFixes(r);
    const l = plan?.lockfiles[0];
    expect(l?.manager).toBe("pnpm");
    expect(l?.steps.map((s) => `${s.tier} ${s.command}`)).toEqual([
      "P1 pnpm up -r tar@7.5.21",
      'P1 add to pnpm-workspace.yaml "overrides" (or package.json "pnpm.overrides"): "tar@6.2.1": "6.2.2"',
      'P2 add to pnpm-workspace.yaml "overrides" (or package.json "pnpm.overrides"): "minimatch@10.1.1": "11.0.1"',
      'P2 add to pnpm-workspace.yaml "overrides" (or package.json "pnpm.overrides"): "minimatch@3.0.5": "3.1.4"',
    ]);
    expect(l?.steps.find((s) => s.from[0] === "10.1.1")?.majorBump).toBe(true);
    expect(l?.steps.find((s) => s.from[0] === "3.0.5")?.majorBump).toBe(false);
    expect(l?.finally).toEqual(["pnpm install"]);
    // Critical with no fix is P3: no plan line, counted with the other P3.
    expect(l?.unfixed).toEqual([]);
    expect(l?.p3).toBe(2);
    const md = renderFixes(planFixes(r), r);
    expect(md).toContain("ultraguard runs none of these commands");
    expect(md).toContain(
      `cd ${join(home, "app")}\npnpm up -r tar@7.5.21\n# edit pnpm-workspace.yaml "overrides" (or package.json "pnpm.overrides"):\n#   "tar@6.2.1": "6.2.2"`,
    );
    expect(md).toContain("major upgrade from 10.1.1: read the changelog");
  });

  it("a P1 with no fixed version is listed as unfixed, not dropped", () => {
    const home = tmp("ug-fx3-");
    put(home, "app/.git/HEAD");
    const lock = put(home, "app/package-lock.json", "{}");
    const r = rankVulnerabilities([v(lock, "x", "1.0.0", "", "moderate", "CVE-2026-7")], {
      home,
      kev: new Map(),
      epss: new Map([["CVE-2026-7", { epss: 0.5, percentile: 1 }]]),
    });
    const l = planFixes(r)[0]?.lockfiles[0];
    expect(l?.unfixed).toEqual([{ tier: "P1", name: "x", version: "1.0.0", ids: ["CVE-2026-7"] }]);
    expect(renderFixes(planFixes(r), r)).toContain("- **P1** x 1.0.0: no fixed version yet (CVE-2026-7)");
  });

  it("writes the command of each package manager", () => {
    const home = tmp("ug-fx2-");
    const mk = (dir: string, lockName: string, manifest: [string, string] | undefined, name: string, version: string, fix: string, eco = "npm") => {
      put(home, `${dir}/.git/HEAD`);
      if (manifest) put(home, `${dir}/${manifest[0]}`, manifest[1]);
      const lock = put(home, `${dir}/${lockName}`, lockName === "yarn.lock" ? "__metadata:\n" : "");
      return { name, version, file: lock, ecosystem: eco, severity: "high", advisories: [{ severity: "high", cve: `CVE-2026-${dir.length}`, fix }] };
    };
    const vulns: CheckerVuln[] = [
      mk("npm", "package-lock.json", ["package.json", JSON.stringify({ devDependencies: { vitest: "^4" } })], "vitest", "4.1.9", "4.1.12"),
      mk("npm2", "package-lock.json", ["package.json", "{}"], "qs", "6.1.0", "6.14.1"),
      mk("berry", "yarn.lock", ["package.json", "{}"], "qs", "6.1.0", "6.14.1"),
      mk("bun", "bun.lock", ["package.json", JSON.stringify({ dependencies: { hono: "4" } })], "hono", "4.0.0", "4.0.5"),
      mk("uv", "uv.lock", ["pyproject.toml", '[project]\ndependencies = ["anyio>=4"]\n'], "anyio", "4.14.0", "4.14.2", "pypi"),
      mk("uv2", "uv.lock", ["pyproject.toml", "[project]\ndependencies = []\n"], "certifi", "2026.6.17", "2026.10.18", "pypi"),
      mk("poetry", "poetry.lock", ["pyproject.toml", '[tool.poetry.group.dev.dependencies]\npytest = "^8"\n'], "pytest", "8.0.0", "8.0.2", "pypi"),
      mk("pip", "requirements.txt", undefined, "requests", "2.31.0", "2.32.4", "pypi"),
      mk("cargo", "Cargo.lock", ["Cargo.toml", '[dependencies]\nring = "0.16"\n'], "ring", "0.16.20", "0.17.12", "cargo"),
      mk("go", "go.sum", ["go.mod", "module x\nrequire golang.org/x/net v0.1.0\n"], "golang.org/x/net", "v0.1.0", "0.38.0", "go"),
      mk(
        "php",
        "composer.lock",
        ["composer.json", JSON.stringify({ require: { "guzzlehttp/guzzle": "^7" } })],
        "guzzlehttp/guzzle",
        "7.4.0",
        "7.4.5",
        "packagist",
      ),
      mk("rb", "Gemfile.lock", ["Gemfile", 'gem "rack"\n'], "rack", "2.2.3", "2.2.8", "rubygems"),
    ];
    const r = rankVulnerabilities(vulns, { home, kev: new Map() });
    const cmd = Object.fromEntries(planFixes(r).map((p) => [p.name, p.lockfiles[0]?.steps.map((s) => s.command).join(" | ")]));
    expect(cmd).toEqual({
      npm: "npm install vitest@4.1.12 --save-dev",
      npm2: 'add to package.json "overrides": "qs@6.1.0": "6.14.1"',
      berry: 'add to package.json "resolutions": "qs@npm:6.1.0": "6.14.1"',
      bun: "bun add hono@4.0.5",
      uv: 'uv add "anyio>=4.14.2"',
      uv2: 'uv lock --upgrade-package "certifi==2026.10.18"',
      poetry: 'poetry add --group dev "pytest>=8.0.2"',
      pip: "in requirements.txt: requests==2.32.4",
      cargo: 'in Cargo.toml: ring = "0.17.12"',
      go: "go get golang.org/x/net@v0.38.0",
      php: "composer require guzzlehttp/guzzle:^7.4.5",
      rb: "bundle update rack --conservative",
    });
  });

  it("--project picks one project, even a worktree, and says to fix the main checkout", () => {
    const home = tmp("ug-fx4-");
    put(home, "app/.git/HEAD");
    const wt = put(home, "app/.claude/worktrees/issue-1/package-lock.json", "{}");
    const r = rankVulnerabilities([v(wt, "qs", "6.1.0", "6.14.1")], { home, kev: new Map() });
    expect(planFixes(r)).toEqual([]);
    const plans = planFixes(r, { project: join(home, "app/.claude/worktrees/issue-1") });
    expect(plans.map((p) => p.kind)).toEqual(["worktree"]);
    expect(renderFixes(plans, r)).toContain(`a git worktree of \`${join(home, "app")}\`: fix the main checkout`);
    expect(renderFixes([], r)).toContain("No project of yours locks a vulnerable package version.");
  });
});
