// Regressions for the dependency-scan findings of the pipeline audit.
import { existsSync, mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { doctor } from "../src/doctor.js";
import { Run } from "../src/run.js";
import type { Runner } from "../src/runner.js";
import { type CheckerVuln, defaultChecker, scanDeps } from "../src/scan/deps.js";
import { parseLockfile } from "../src/scan/lockfiles.js";
import { walk } from "../src/scan/walk.js";
import type { Indicator, IocFile } from "../src/types.js";
import { tmp } from "./helpers.js";

const C = { id: "c", title: "t", sources: ["S1"], since: "2026-11-01" };
const iocs = (...indicators: Omit<Indicator, "source">[]): IocFile => ({
  campaigns: [{ ...C, indicators: indicators.map((i) => ({ ...i, source: "S1" })) as Indicator[] }],
});
const NO_PKG = iocs({ type: "branch", value: "x" });

function put(root: string, rel: string, body: string): string {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  return p;
}
const npmLock = (pkgs: Record<string, string>) =>
  JSON.stringify({
    lockfileVersion: 3,
    packages: { "": {}, ...Object.fromEntries(Object.entries(pkgs).map(([n, v]) => [`node_modules/${n}`, { version: v }])) },
  });

/** A fake bash running package-checker: prints `stdout`, writes `report` to the --export-json path when given. */
function fakeChecker(stdout: string, status: number, report?: { vulnerabilities: Partial<CheckerVuln>[] }): Runner & { calls: string[][] } {
  const calls: string[][] = [];
  const r = (async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (report) writeFileSync(args[args.indexOf("--export-json") + 1] as string, JSON.stringify(report));
    return { ok: status === 0, status, stdout, stderr: "" };
  }) as Runner & { calls: string[][] };
  r.calls = calls;
  return r;
}

describe("package-checker runs", () => {
  it("deps-1: a run that could not load the OSV feed is a failure, not 0 malicious", async () => {
    const work = tmp("ug-pc1-");
    const runner = fakeChecker("\u001b[0;33m⚠️  Warning: Unable to find osv feed for npm (osv.purl)\u001b[0m\n✓ Using GHSA source: https://x/ghsa.purl\n", 1, {
      vulnerabilities: [],
    });
    const r = await defaultChecker(runner, work)(work);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/OSV feed unreachable for npm/);

    const root = tmp("ug-pc1r-");
    put(root, "app/package-lock.json", npmLock({ a: "1.0.0" }));
    const s = await scanDeps(NO_PKG, walk([root]), new Run(tmp()), { runner, roots: [root] });
    expect(s.gaps.some((g) => g.why.includes("OSV feed unreachable"))).toBe(true);
  });

  it("deps-3: git-ignored lockfiles are scanned too", async () => {
    const work = tmp("ug-pc3-");
    const runner = fakeChecker("", 0);
    await defaultChecker(runner, work)(work);
    expect(runner.calls[0]).toContain("--include-gitignored");
  });

  it("deps-9: a report left by an earlier scan is never read as this run's", async () => {
    const work = tmp("ug-pc9-");
    writeFileSync(join(work, "package-checker-1.json"), JSON.stringify({ vulnerabilities: [] }));
    const r = await defaultChecker(fakeChecker("", 1), work)(work);
    expect(r).toMatchObject({ ok: false, error: "no JSON report written" });
  });

  it("deps-2: a stale local feed copy is a gap with its age", async () => {
    const feeds = tmp("ug-feed-");
    const osv = put(feeds, "osv.purl", "pkg:npm/x@1\n");
    const old = new Date(Date.now() - 10 * 86_400_000);
    utimesSync(osv, old, old);
    const runner = fakeChecker(`\u001b[0;32m✓ Using OSV source: ${osv}\u001b[0m\n`, 0, { vulnerabilities: [] });
    const root = tmp("ug-pc2r-");
    put(root, "app/package-lock.json", npmLock({ a: "1.0.0" }));
    const s = await scanDeps(NO_PKG, walk([root]), new Run(tmp()), { runner, roots: [root] });
    expect(s.result.stats.feedAgeDays).toBe(10);
    expect(s.gaps.some((g) => g.what.includes("newer than 10 days") && g.fix?.includes("brew upgrade package-checker"))).toBe(true);
  });

  it("deps-7: a Bash 3 failure says to install Bash, not to go online", async () => {
    const root = tmp("ug-pc7-");
    put(root, "app/package-lock.json", npmLock({ a: "1.0.0" }));
    const s = await scanDeps(NO_PKG, walk([root]), undefined, {
      checker: async () => ({ ok: false, vulnerabilities: [], error: "Error: package-checker requires Bash 4 or newer (macOS: brew install bash)." }),
      roots: [root],
    });
    expect(s.gaps.find((g) => g.why.includes("Bash 4"))?.fix).toMatch(/^brew install bash/);
  });

  it("deps-6: a lockfile directly in a root is staged on its own, the other groups are kept", async () => {
    const root = tmp("ug-pc6-");
    const stray = put(root, "package-lock.json", npmLock({ evil: "1.0.0" }));
    put(root, "code/app/package-lock.json", npmLock({ a: "1.0.0" }));
    const dirs: string[] = [];
    const checker = async (dir: string) => {
      dirs.push(dir);
      const f = join(dir, "package-lock.json");
      return {
        ok: true,
        vulnerabilities:
          existsSync(f) && dir.includes("root-lockfiles")
            ? [{ name: "evil", version: "1.0.0", file: f, ecosystem: "npm", severity: "critical", advisories: [{ id: "MAL-2026-9" }] }]
            : [],
      };
    };
    const run = new Run(tmp());
    const s = await scanDeps(NO_PKG, walk([root]), run, { checker, roots: [root] });
    expect(dirs).not.toContain(root);
    expect(dirs).toContain(join(root, "code/app"));
    expect(dirs.some((d) => d.startsWith(join(run.dir, "package-checker", "root-lockfiles")))).toBe(true);
    expect(s.findings.find((f) => f.severity === "compromised")?.subject).toBe(stray);
  });
});

describe("what the deps walk could not see", () => {
  it("deps-4: lockfiles past --depth are a gap; lockfiles only package-checker reads are handed to it", async () => {
    const root = tmp("ug-d4-");
    put(root, "a/b/c/d/package-lock.json", npmLock({ a: "1.0.0" }));
    put(root, "dart/app/pubspec.lock", "packages:\n");
    const dirs: string[] = [];
    const s = await scanDeps(NO_PKG, walk([root], { maxDepth: 2 }), undefined, {
      checker: async (d) => {
        dirs.push(d);
        return { ok: true, vulnerabilities: [] };
      },
      roots: [root],
    });
    expect(s.gaps.some((g) => g.what.startsWith("lockfiles deeper than --depth"))).toBe(true);
    expect(dirs).toEqual([join(root, "dart/app")]);
    expect(s.result.stats.advisoryOnlyLockfiles).toBe(1);
  });

  it("e2e-5: no lockfile at all under the roots is said, with the roots", async () => {
    const root = tmp("ug-e5-");
    const s = await scanDeps(NO_PKG, walk([root]), undefined, { checker: false, roots: [root] });
    expect(s.result.scanned).toBe(true);
    expect(s.gaps.find((g) => g.what.startsWith("no lockfile found under"))?.what).toContain(root);
  });

  it("cov-7: package indicators in an ecosystem with no reader are a gap", async () => {
    const s = await scanDeps(
      iocs(
        { type: "package", ecosystem: "maven", value: "org.x:y" },
        { type: "package", ecosystem: "maven", value: "org.x:z" },
        { type: "package", ecosystem: "homebrew", value: "xz" },
        { type: "package", ecosystem: "OpenVSX", value: "pub.ext" },
      ),
      walk([tmp()]),
      undefined,
      { checker: false, globalDirs: { node: [], python: [] } },
    );
    expect(s.gaps.find((g) => g.what.includes("ecosystems ultraguard cannot check"))?.what).toMatch(/maven \(2\), homebrew \(1\)$/);
  });
});

describe("package indicators beyond pinned lockfiles", () => {
  const typo = iocs({ type: "package", ecosystem: "pypi", value: "colourama" }, { type: "package", ecosystem: "npm", value: "evil-typo" });
  const pinned = iocs({ type: "package", ecosystem: "pypi", value: "colourama", versions: ["0.4.6"] });

  it("deps-5: an unpinned requirement matches an every-version indicator only", async () => {
    expect(
      parseLockfile("requirements.txt", "colourama>=0.4\nrequests==2.31.0\n-r base.txt\ngit+https://x/y.git\nflask ; python_version>'3'\nplain\n"),
    ).toEqual([
      { ecosystem: "pypi", name: "colourama", version: "*" },
      { ecosystem: "pypi", name: "requests", version: "2.31.0" },
      { ecosystem: "pypi", name: "flask", version: "*" },
      { ecosystem: "pypi", name: "plain", version: "*" },
    ]);
    const root = tmp("ug-d5-");
    put(root, "py/requirements.txt", "colourama>=0.4\n");
    const opts = { checker: false as const, globalDirs: { node: [], python: [] } };
    expect((await scanDeps(typo, walk([root]), undefined, opts)).findings.map((f) => f.title)).toEqual([
      `${join(root, "py/requirements.txt")} requires colourama (unpinned), named by the campaign`,
    ]);
    expect((await scanDeps(pinned, walk([root]), undefined, opts)).findings).toEqual([]);
  });

  it("deps-5: a package.json with no lockfile is matched by name; other lone manifests are a gap", async () => {
    const root = tmp("ug-d5m-");
    put(root, "js/package.json", JSON.stringify({ dependencies: { "evil-typo": "^1.0.0" } }));
    put(root, "py/pyproject.toml", '[project]\ndependencies = ["colourama"]\n');
    // A workspace member under a locked root is covered by that lockfile.
    put(root, "mono/package-lock.json", npmLock({}));
    put(root, "mono/packages/a/package.json", JSON.stringify({ dependencies: { "evil-typo": "1" } }));
    const s = await scanDeps(typo, walk([root]), undefined, { checker: false, globalDirs: { node: [], python: [] } });
    expect(s.findings.map((f) => f.subject)).toEqual([join(root, "js/package.json")]);
    expect(s.gaps.some((g) => g.what.startsWith("1 manifest(s) with no lockfile"))).toBe(true);
  });

  it("deps-8: aliased packages are recorded under the real package", () => {
    const v1 = JSON.stringify({ lockfileVersion: 1, dependencies: { "my-alias": { version: "npm:evil-pkg@1.2.3" } } });
    expect(parseLockfile("package-lock.json", v1)).toEqual([{ ecosystem: "npm", name: "evil-pkg", version: "1.2.3" }]);
    const yarn1 = '"my-alias@npm:evil-pkg@^1.2.3":\n  version "1.2.3"\n';
    expect(parseLockfile("yarn.lock", yarn1)).toContainEqual({ ecosystem: "npm", name: "evil-pkg", version: "1.2.3" });
    const berry = '"my-alias@npm:evil-pkg@npm:1.2.3":\n  version: 1.2.3\n  resolution: "evil-pkg@npm:1.2.3"\n';
    expect(parseLockfile("yarn.lock", berry)).toContainEqual({ ecosystem: "npm", name: "evil-pkg", version: "1.2.3" });
    expect(parseLockfile("yarn.lock", '"lodash@npm:^4.17.21":\n  version: 4.17.21\n  resolution: "lodash@npm:4.17.21"\n')).toEqual([
      { ecosystem: "npm", name: "lodash", version: "4.17.21" },
    ]);
  });

  it("cov-6: packages installed in node_modules, a venv and global folders are matched", async () => {
    const home = tmp("ug-c6-");
    const root = join(home, "code");
    put(root, "app/package.json", "{}");
    put(root, "app/package-lock.json", npmLock({}));
    put(root, "app/node_modules/.package-lock.json", npmLock({ axios: "1.14.1" }));
    mkdirSync(join(root, "ml/.venv/lib/python3.12/site-packages/litellm-1.82.8.dist-info"), { recursive: true });
    put(root, "ml/.git/HEAD", "ref: refs/heads/main\n");
    put(home, ".bun/install/global/node_modules/@evil/cli/package.json", JSON.stringify({ name: "@evil/cli", version: "2.0.0" }));
    mkdirSync(join(home, ".local/share/uv/tools/llm/lib/python3.11/site-packages/litellm-1.82.7.dist-info"), { recursive: true });
    const set = iocs(
      { type: "package", ecosystem: "npm", value: "axios", versions: ["1.14.1"] },
      { type: "package", ecosystem: "pypi", value: "litellm", versions: ["1.82.7", "1.82.8"] },
      { type: "package", ecosystem: "npm", value: "@evil/cli" },
    );
    const { globalInstallDirs } = await import("../src/scan/installed.js");
    const s = await scanDeps(set, walk([root]), undefined, { checker: false, globalDirs: globalInstallDirs(home, []) });
    expect(s.findings.map((f) => f.title).sort()).toEqual(
      [
        `@evil/cli@2.0.0 is installed in ${join(home, ".bun/install/global/node_modules/@evil/cli")}, named by the campaign`,
        `axios@1.14.1 is installed in ${join(root, "app/node_modules")}, named by the campaign`,
        `litellm@1.82.7 is installed in ${join(home, ".local/share/uv/tools/llm/lib/python3.11/site-packages/litellm-1.82.7.dist-info")}, named by the campaign`,
        `litellm@1.82.8 is installed in ${join(root, "ml/.venv/lib/python3.12/site-packages/litellm-1.82.8.dist-info")}, named by the campaign`,
      ].sort(),
    );
    // Without a home, the global folders are not read, and the gap says so.
    const bare = await scanDeps(set, walk([root]), undefined, { checker: false });
    expect(bare.gaps.some((g) => g.what.startsWith("global installs"))).toBe(true);
  });
});

describe("doctor", () => {
  it("deps-7: names Bash 3 and probes the feed host scan deps downloads from", async () => {
    const seen: string[] = [];
    const runner: Runner = async (cmd, args) => {
      seen.push(`${cmd} ${args.join(" ")}`);
      if (cmd === "bash") return { ok: true, status: 0, stdout: "3\n", stderr: "" };
      if (cmd === "curl") return { ok: true, status: 0, stdout: "", stderr: "" };
      return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    };
    const lines = await doctor(runner, { probe: true });
    const bash = lines.find((l) => l.check === "bash");
    expect(bash?.ok).toBe(false);
    expect(bash?.detail).toContain("Bash 4");
    expect(lines.find((l) => l.check === "curl")?.ok).toBe(true);
    expect(lines.find((l) => l.check === "advisory feeds")?.ok).toBe(true);
    expect(seen.some((c) => c.startsWith("curl --head") && c.includes("raw.githubusercontent.com/maxgfr/package-checker.sh"))).toBe(true);
    expect(seen.some((c) => c.includes("api.osv.dev"))).toBe(false);
  });
});
