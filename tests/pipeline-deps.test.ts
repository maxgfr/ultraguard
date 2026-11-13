// Regressions for the dependency-scan findings of the pipeline audit.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { doctor } from "../src/doctor.js";
import { Run } from "../src/run.js";
import type { Runner } from "../src/runner.js";
import { renderReport } from "../src/report.js";
import { type CheckerSource, type CheckerVuln, defaultChecker, FEED_FILES, feedDir, feedSummary, scanDeps, updateCheckerFeeds } from "../src/scan/deps.js";
import { parseLockfile } from "../src/scan/lockfiles.js";
import { walk } from "../src/scan/walk.js";
import { PACKAGE_CHECKER_REF, PACKAGE_CHECKER_VERSION } from "../src/vendor/package-checker-script.js";
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

type Report = { vulnerabilities: Partial<CheckerVuln>[]; incomplete?: boolean; incomplete_reasons?: string[]; sources?: Partial<CheckerSource>[] };

/** A fake bash running package-checker: exits `status`, prints `stderr`, writes `report` to the --export-json path when given. */
function fakeChecker(status: number, report?: Report, stderr = ""): Runner & { calls: string[][] } {
  const calls: string[][] = [];
  const r = (async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (report) writeFileSync(args[args.indexOf("--export-json") + 1] as string, JSON.stringify(report));
    return { ok: status === 0, status, stdout: "", stderr };
  }) as Runner & { calls: string[][] };
  r.calls = calls;
  return r;
}

const OSV_MISSING = "the osv feed for npm (osv.purl) could not be found";

describe("package-checker runs", () => {
  it("deps-1: exit 3 without the OSV feed is a gap that says the malicious-package advisories were not loaded", async () => {
    const work = tmp("ug-pc1-");
    const report: Report = {
      vulnerabilities: [],
      incomplete: true,
      incomplete_reasons: [OSV_MISSING],
      sources: [{ kind: "osv", ecosystem: "npm", file: "osv.purl", status: "missing", origin: null }],
    };
    const runner = fakeChecker(3, report);
    const r = await defaultChecker(runner, work)(work);
    expect(r.ok).toBe(true);
    expect(r.warnings).toEqual([`${OSV_MISSING}: malicious-package (MAL-) advisories were not loaded`]);

    const root = tmp("ug-pc1r-");
    put(root, "app/package-lock.json", npmLock({ a: "1.0.0" }));
    const s = await scanDeps(NO_PKG, walk([root]), new Run(tmp()), { runner, roots: [root] });
    expect(s.gaps.find((g) => g.why === `package-checker: ${OSV_MISSING}: malicious-package (MAL-) advisories were not loaded`)?.fix).toBe(
      "ultraguard rules update, then re-run scan deps",
    );
    expect(s.gaps.some((g) => g.why.startsWith("package-checker failed"))).toBe(false);
  });

  it("deps-1: exit 0 or 1 is a complete scan; exit 3 with no reason is still a gap", async () => {
    const work = tmp("ug-pc1c-");
    expect((await defaultChecker(fakeChecker(1, { vulnerabilities: [] }), work)(work)).warnings).toEqual([]);
    expect((await defaultChecker(fakeChecker(3, { vulnerabilities: [] }), work)(work)).warnings).toEqual(["the scan was incomplete (exit 3)"]);
  });

  it("deps-3: reads the feed copy in the state folder; no copy, no --data-dir; git-ignored lockfiles need no flag", async () => {
    const work = tmp("ug-pc3-");
    const data = tmp("ug-pc3d-");
    const runner = fakeChecker(0);
    await defaultChecker(runner, work, { dataDir: data })(work);
    expect(runner.calls[0]).not.toContain("--data-dir");
    // A partial copy: package-checker's own age limit stays, so a missing feed is never an old Homebrew file.
    put(data, "ghsa.purl", "pkg:npm/x@1\n");
    await defaultChecker(runner, work, { dataDir: data })(work);
    expect(runner.calls[1]).toContain("--data-dir");
    expect(runner.calls[1]).not.toContain("--max-feed-age");
    for (const f of FEED_FILES) put(data, f, "pkg:npm/x@1\n");
    await defaultChecker(runner, work, { dataDir: data })(work);
    const args = runner.calls[2] as string[];
    expect(args.slice(args.indexOf("--data-dir"), args.indexOf("--data-dir") + 4)).toEqual(["--data-dir", data, "--max-feed-age", "0"]);
    expect(args).not.toContain("--include-gitignored");
  });

  it("with no feed copy, the feeds are downloaded once for the scan, not once per run", async () => {
    const root = tmp("ug-pc8-");
    for (const g of ["a/x", "b/y", "c/z"]) put(root, `${g}/package-lock.json`, npmLock({ a: "1.0.0" }));
    const calls: string[][] = [];
    const runner: Runner = async (_cmd, args) => {
      calls.push(args);
      const dir = args[args.indexOf("--data-dir") + 1] as string;
      if (args.includes("--update-feeds")) for (const f of FEED_FILES) put(dir, f, "pkg:npm/x@1\n");
      else writeFileSync(args[args.indexOf("--export-json") + 1] as string, JSON.stringify({ vulnerabilities: [] }));
      return { ok: true, status: 0, stdout: "", stderr: "" };
    };
    const run = new Run(tmp());
    const once = join(run.dir, "package-checker", "data");
    await scanDeps(NO_PKG, walk([root]), run, { runner, roots: [root], feedDir: tmp("ug-pc8s-") });
    expect(calls.filter((c) => c.includes("--update-feeds"))).toHaveLength(1);
    const scans = calls.filter((c) => !c.includes("--update-feeds"));
    expect(scans).toHaveLength(3);
    for (const c of scans) expect(c[c.indexOf("--data-dir") + 1]).toBe(once);
    expect(existsSync(once)).toBe(false);
  });

  it("deps-9: a report left by an earlier scan is never read as this run's", async () => {
    const work = tmp("ug-pc9-");
    writeFileSync(join(work, "package-checker-1.json"), JSON.stringify({ vulnerabilities: [] }));
    const r = await defaultChecker(fakeChecker(1), work)(work);
    expect(r).toMatchObject({ ok: false, error: "no JSON report written" });
  });

  it("deps-2: the feeds' origins and ages are recorded; a copy older than 1 day is a gap with its age", async () => {
    const feeds = tmp("ug-feed-");
    const osv = join(feeds, "osv.purl");
    const report: Report = {
      vulnerabilities: [],
      sources: [
        {
          kind: "osv",
          ecosystem: "npm",
          file: "osv.purl",
          status: "loaded",
          origin: osv,
          origin_type: "local",
          entries: 7,
          date: "2026-11-03T00:00:00Z",
          age_days: 10,
        },
        { kind: "ghsa", ecosystem: "npm", file: "ghsa.purl", status: "loaded", origin: "https://x/ghsa.purl", origin_type: "remote", entries: 5, age_days: 0 },
      ],
    };
    const root = tmp("ug-pc2r-");
    put(root, "app/package-lock.json", npmLock({ a: "1.0.0" }));
    const run = new Run(tmp());
    const s = await scanDeps(NO_PKG, walk([root]), run, { runner: fakeChecker(0, report), roots: [root], feedRefreshError: "curl: offline" });
    expect(s.result.stats.feedAgeDays).toBe(10);
    expect(s.result.stats.feedEntries).toBe(12);
    const gap = s.gaps.find((g) => g.what.includes("newer than 10 days"));
    expect(gap?.what).toContain(feeds);
    expect(gap?.why).toContain("curl: offline");
    expect(gap?.fix).toMatch(/^ultraguard rules update/);
    expect(run.meta().advisoryFeeds?.map((f) => f.origin)).toEqual([osv, "https://x/ghsa.purl"]);
    expect(run.read<{ sources: unknown[] }>("deps-vulnerabilities.json", { sources: [] }).sources).toHaveLength(2);
    expect(feedSummary(run.meta().advisoryFeeds ?? [])).toBe(
      `2 loaded, 12 entries; 1 from ${feeds} (oldest 10 days, 2026-11-03); 1 downloaded during the scan`,
    );
    expect(renderReport(run).report).toContain("advisory feeds (package-checker): 2 loaded");
    // A fresh copy: no gap. A copy 30 hours old (age_days 1, floored) is past the 1-day limit.
    const NOW = new Date("2026-11-13T12:00:00Z");
    const aged = (hours: number) =>
      scanDeps(NO_PKG, walk([root]), new Run(tmp()), {
        runner: fakeChecker(0, {
          vulnerabilities: [],
          sources: [{ ...report.sources?.[0], age_days: Math.floor(hours / 24), date: new Date(NOW.getTime() - hours * 3_600_000).toISOString() }],
        }),
        roots: [root],
        now: NOW,
      });
    expect((await aged(20)).gaps.some((g) => g.what.startsWith("advisories newer than"))).toBe(false);
    expect((await aged(30)).gaps.find((g) => g.what.startsWith("advisories newer than"))?.what).toContain("newer than 1 days");
  });

  it("deps-7: exit 2 is a failure with package-checker's reason (Bash 3: install Bash)", async () => {
    const work = tmp("ug-pc7w-");
    const bash3 = "Error: package-checker requires Bash 4 or newer (this shell: 3.2.57(1)-release).\n  macOS (/bin/bash is 3.2): brew install bash\n";
    const r = await defaultChecker(fakeChecker(2, undefined, bash3), work)(work);
    expect(r).toMatchObject({ ok: false, error: "Error: package-checker requires Bash 4 or newer (this shell: 3.2.57(1)-release)." });
  });

  it("a run killed on timeout says so, and the update leaves no temp file in the feed folder", async () => {
    const work = tmp("ug-pcto-");
    const killed: Runner = async (_cmd, args) => {
      const i = args.indexOf("--data-dir");
      if (args.includes("--update-feeds")) writeFileSync(join(args[i + 1] as string, ".ghsa.purl.tmp.51mzbE"), "partial");
      return { ok: false, status: 124, stdout: "Updating feeds...\nFormat: purl\n", stderr: "" };
    };
    expect(await defaultChecker(killed, work)(work)).toMatchObject({ ok: false, error: "timed out after 15 min" });
    const data = tmp("ug-pctod-");
    expect(await updateCheckerFeeds(killed, data)).toEqual({ ok: false, detail: "timed out after 20 min" });
    expect(readdirSync(data)).toEqual([]);
    const root = tmp("ug-pcto-r-");
    put(root, "app/package-lock.json", npmLock({ a: "1.0.0" }));
    const s = await scanDeps(NO_PKG, walk([root]), undefined, { runner: killed, roots: [root] });
    expect(s.gaps.find((g) => g.why === "package-checker failed: timed out after 15 min")?.fix).toBe("re-run with --roots narrowed to your code folders");
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
        warnings: dir.includes("root-lockfiles") ? [`${f} could not be read`] : [],
      };
    };
    const run = new Run(tmp());
    const s = await scanDeps(NO_PKG, walk([root]), run, { checker, roots: [root] });
    expect(dirs).not.toContain(root);
    expect(dirs).toContain(join(root, "code/app"));
    expect(dirs.some((d) => d.startsWith(join(run.dir, "package-checker", "root-lockfiles")))).toBe(true);
    expect(s.findings.find((f) => f.severity === "compromised")?.subject).toBe(stray);
    // A reason about the staged copy names the lockfile it stands for.
    expect(s.gaps.find((g) => g.what === `advisories for ${stray}`)?.why).toBe(`package-checker: ${stray} could not be read`);
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

  it("lockfiles under folders package-checker prunes are scanned: no default prune, vendor staged on its own", async () => {
    const root = tmp("ug-prune-");
    const lock = npmLock({ "flatmap-stream": "0.1.1" });
    const vendored = put(root, "proj/vendor/lib/package-lock.json", lock);
    for (const rel of ["ios/Pods/x", "web/.nuxt/y", "py/site-packages/z", "mac/DerivedData/w"]) put(root, `${rel}/package-lock.json`, lock);
    const runner = fakeChecker(0, { vulnerabilities: [] });
    const run = new Run(tmp());
    await scanDeps(NO_PKG, walk([root]), run, { runner, roots: [root] });
    const dirs = runner.calls.map((c) => c[2] as string);
    expect(runner.calls.every((c) => c.includes("--no-default-prune"))).toBe(true);
    expect(dirs.filter((d) => !d.startsWith(run.dir)).sort()).toEqual(
      ["ios/Pods", "mac/DerivedData", "py/site-packages", "web/.nuxt"].map((d) => join(root, d)),
    );
    // package-checker always ignores vendor/: that lockfile gets a run of its own.
    const staged = dirs.find((d) => d.startsWith(join(run.dir, "package-checker", "root-lockfiles"))) as string;
    expect(readFileSync(join(staged, "package-lock.json"), "utf8")).toBe(readFileSync(vendored, "utf8"));
    expect(dirs).not.toContain(join(root, "proj/vendor"));
  });

  it("bun.lockb is handed to package-checker, and its not-scanned reason is a gap", async () => {
    const root = tmp("ug-bun-");
    const lockb = put(root, "web/app/bun.lockb", "\u0000binary");
    const reason = `${lockb} was not scanned: bun.lockb is binary and bun is not installed to read it`;
    const dirs: string[] = [];
    const s = await scanDeps(NO_PKG, walk([root]), undefined, {
      checker: async (d) => {
        dirs.push(d);
        return { ok: true, vulnerabilities: [], warnings: [reason] };
      },
      roots: [root],
    });
    expect(dirs).toEqual([join(root, "web/app")]);
    expect(s.result.stats.advisoryOnlyLockfiles).toBe(1);
    expect(s.gaps.find((g) => g.why === `package-checker: ${reason}`)?.fix).toMatch(/^install bun/);
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

  it("a package.json next to bun.lockb is still matched by name, and the advisory-only lockfile is a gap", async () => {
    const root = tmp("ug-bunm-");
    put(root, "web/app/bun.lockb", "\u0000binary");
    const manifest = put(root, "web/app/package.json", JSON.stringify({ dependencies: { "evil-typo": "^1.0.0", lodash: "4.17.20" } }));
    const s = await scanDeps(typo, walk([root]), undefined, { checker: false, globalDirs: { node: [], python: [] } });
    expect(s.findings.map((f) => f.title)).toEqual([`${manifest} depends on evil-typo (its lockfile is read for advisories only), named by the campaign`]);
    expect(s.gaps.find((g) => g.what.startsWith("1 lockfile(s) checked against the advisory feeds only"))?.what).toContain(join(root, "web/app/bun.lockb"));
    expect(s.gaps.some((g) => g.what.includes("manifest(s) with no lockfile"))).toBe(false);
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
  it("names the vendored package-checker and the age of the feed copy in the state folder", async () => {
    const runner: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
    const state = tmp("ug-doc-");
    const line = async (now?: Date) => (await doctor(runner, { state, now, platform: "linux" })).find((l) => l.check === "package-checker");
    expect(await line()).toMatchObject({ ok: false, fix: "ultraguard rules update" });
    expect((await line())?.detail).toContain(
      `${PACKAGE_CHECKER_VERSION} (${PACKAGE_CHECKER_REF}, vendored); no advisory feeds in ${feedDir(state)} (the next scan deps downloads them`,
    );
    // A partial copy is not ok.
    put(feedDir(state), "osv.purl", "pkg:npm/x@1\n");
    expect(await line()).toMatchObject({ ok: false, fix: "ultraguard rules update" });
    expect((await line())?.detail).toContain(
      `1 feed(s) in ${feedDir(state)}, 0 days old (incomplete: ${FEED_FILES.length - 1} of ${FEED_FILES.length} feeds missing, ghsa.purl,`,
    );
    for (const f of FEED_FILES) put(feedDir(state), f, "pkg:npm/x@1\n");
    expect(await line()).toMatchObject({ ok: true, fix: undefined });
    expect((await line())?.detail).toContain(`${FEED_FILES.length} feed(s) in ${feedDir(state)}, 0 days old`);
    const later = await line(new Date(Date.now() + 2.5 * 86_400_000));
    expect(later).toMatchObject({ ok: false, fix: "ultraguard rules update" });
    expect(later?.detail).toContain("2 days old (stale: refreshed after 1 day)");
    expect(await line(new Date(Date.now() + 30 * 3_600_000))).toMatchObject({ ok: false, fix: "ultraguard rules update" });
  });

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
