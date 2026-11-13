// Ranking known CVEs: versions, projects, direct dependencies, tiers, findings, report.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Epss, KevEntry } from "../src/feeds.js";
import type { CheckerVuln } from "../src/scan/deps.js";
import {
  compareVersions,
  declaredDeps,
  isBreaking,
  pickFix,
  projectOf,
  type RankedItem,
  rankVulnerabilities,
  renderVulnSection,
  vulnFindings,
} from "../src/vulns.js";
import { tmp } from "./helpers.js";

function put(root: string, rel: string, body = ""): string {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  return p;
}

const vuln = (file: string, name: string, version: string, severity: string, advisories: CheckerVuln["advisories"], ecosystem = "npm"): CheckerVuln => ({
  name,
  version,
  file,
  ecosystem,
  severity,
  advisories,
});

const kevOf = (...cves: string[]) =>
  new Map<string, KevEntry>(cves.map((c) => [c, { cveID: c, vendorProject: "x", product: "y", dateAdded: "2026-11-01", knownRansomwareCampaignUse: "Known" }]));

describe("versions", () => {
  it("compares semver, pre-releases, Python and Go versions", () => {
    expect(compareVersions("1.2.10", "1.2.9")).toBe(1);
    expect(compareVersions("v1.2.3", "1.2.3")).toBe(0);
    expect(compareVersions("5.0.0-beta.30", "5.0.0")).toBe(-1);
    expect(compareVersions("5.0.0-beta.30", "5.0.0-beta.4")).toBe(1);
    expect(compareVersions("2026.10.18", "2026.6.17")).toBe(1);
    expect(compareVersions("2.0.0rc1", "2.0.0")).toBe(-1);
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
  });

  it("picks the smallest version that closes every advisory, and names a major upgrade", () => {
    expect(pickFix("4.1.9", ["4.1.11", "4.1.12", ""])).toBe("4.1.12");
    // A fix at or below the current version is another branch's: not an upgrade.
    expect(pickFix("4.1.9", ["3.9.0", ""])).toBeUndefined();
    expect(isBreaking("3.31.1", "4.0.1")).toBe(true);
    expect(isBreaking("0.27.7", "0.28.1")).toBe(true);
    expect(isBreaking("4.7.9", "4.7.10")).toBe(false);
  });
});

describe("projects", () => {
  it("tells own projects from worktrees, tool folders and vendored copies", () => {
    const home = tmp("ug-vh-");
    put(home, "code/app/.git/HEAD", "ref");
    const own = put(home, "code/app/web/pnpm-lock.yaml");
    put(home, "code/app/../wt/.git", `gitdir: ${join(home, "code/app/.git/worktrees/wt")}\n`);
    const linked = put(home, "code/wt/package-lock.json");
    const agent = put(home, "code/app/.claude/worktrees/issue-1/pnpm-lock.yaml");
    const plugin = put(home, ".claude/plugins/cache/p/1.0.0/pnpm-lock.yaml");
    const caches = put(home, "Library/Caches/x/package-lock.json");
    const vendored = put(home, "code/app/.venv/lib/python3.13/site-packages/jupyterlab/staging/yarn.lock");
    const loose = put(home, "code/nogit/uv.lock");
    expect(projectOf(own, home)).toEqual({ root: join(home, "code/app"), kind: "own" });
    expect(projectOf(linked, home)).toEqual({ root: join(home, "code/wt"), kind: "worktree", mainRepo: join(home, "code/app") });
    expect(projectOf(agent, home)).toMatchObject({
      root: join(home, "code/app/.claude/worktrees/issue-1"),
      kind: "worktree",
      mainRepo: join(home, "code/app"),
    });
    expect(projectOf(plugin, home).kind).toBe("tool");
    expect(projectOf(caches, home).kind).toBe("tool");
    expect(projectOf(vendored, home).kind).toBe("vendored");
    // A folder of the user's own with no git: still theirs, the lockfile's folder is the project.
    expect(projectOf(loose, home)).toEqual({ root: join(home, "code/nogit"), kind: "own" });
  });

  it("lockfiles in test fixtures are vulnerable on purpose: their own kind, never one of your projects", () => {
    const home = tmp("ug-fx-");
    mkdirSync(join(home, "code/scanner/.git"), { recursive: true });
    const lock = join(home, "code/scanner/test-fixtures/log4j/pom.xml");
    mkdirSync(join(lock, ".."), { recursive: true });
    writeFileSync(lock, "<project/>");
    expect(projectOf(lock, home)).toEqual({ root: join(home, "code/scanner/test-fixtures"), kind: "fixture" });
    const own = join(home, "code/scanner/package-lock.json");
    writeFileSync(own, "{}");
    expect(projectOf(own, home).kind).toBe("own");
  });

  it("reads which packages a project declares, and which are dev-only", () => {
    const d = tmp("ug-decl-");
    put(d, "js/package.json", JSON.stringify({ dependencies: { next: "^16" }, devDependencies: { vitest: "^4", next: "^16" } }));
    const pnpm = put(
      d,
      "js/pnpm-lock.yaml",
      "lockfileVersion: '9.0'\n\nimporters:\n\n  .:\n    dependencies:\n      next:\n        specifier: ^16\n  packages/a:\n    devDependencies:\n      '@scope/tool':\n        specifier: ^1\n    dependencies:\n      axios:\n        specifier: ^1\n\npackages:\n\n  handlebars@4.7.9:\n    resolution: {}\n",
    );
    const m = declaredDeps(pnpm);
    expect(m.get("next")).toBe("direct");
    expect(m.get("vitest")).toBe("dev");
    expect(m.get("@scope/tool")).toBe("dev");
    expect(m.get("axios")).toBe("direct");
    expect(m.has("handlebars")).toBe(false);

    put(
      d,
      "py/pyproject.toml",
      '[project]\nname = "x"\ndependencies = [\n  "Jupyter_Server>=2",\n  "anyio",\n]\n\n[dependency-groups]\ndev = ["pytest>=8"]\n\n[tool.poetry.dependencies]\npython = "^3.12"\nrequests = "^2"\n',
    );
    const py = declaredDeps(put(d, "py/uv.lock"));
    expect(py.get("jupyter-server")).toBe("direct");
    expect(py.get("pytest")).toBe("dev");
    expect(py.get("requests")).toBe("direct");
    expect(py.has("python")).toBe(false);

    put(d, "go/go.mod", "module x\n\nrequire (\n\tgithub.com/a/b v1.2.3\n\tgolang.org/x/net v0.1.0 // indirect\n)\n");
    const go = declaredDeps(put(d, "go/go.sum"));
    expect(go.get("github.com/a/b")).toBe("direct");
    expect(go.has("golang.org/x/net")).toBe(false);

    put(d, "rs/Cargo.toml", '[package]\nname = "x"\n\n[dependencies]\nserde = "1"\n\n[dev-dependencies]\ntokio = { version = "1" }\n');
    const rs = declaredDeps(put(d, "rs/Cargo.lock"));
    expect(rs.get("serde")).toBe("direct");
    expect(rs.get("tokio")).toBe("dev");
  });
});

describe("ranking", () => {
  it("ranks P0 KEV, P1 EPSS or critical with a fix, P2 high with a fix, P3 the rest; own projects first", () => {
    const home = tmp("ug-rank-");
    put(home, "code/app/.git/HEAD");
    put(home, "code/app/package.json", JSON.stringify({ dependencies: { kevpkg: "1" }, devDependencies: { devpkg: "1" } }));
    const lock = put(home, "code/app/package-lock.json", "{}");
    const plugin = put(home, ".claude/plugins/cache/p/package-lock.json", "{}");
    const vulns = [
      vuln(lock, "p3pkg", "1.0.0", "high", [{ severity: "high", cve: "CVE-2026-5", fix: "" }]),
      vuln(lock, "p2pkg", "1.0.0", "high", [{ severity: "high", cve: "CVE-2026-4", fix: "1.0.1" }]),
      vuln(lock, "devpkg", "2.0.0", "critical", [{ severity: "critical", cve: "CVE-2026-3", fix: "3.0.0" }]),
      vuln(lock, "epsspkg", "1.0.0", "moderate", [{ severity: "moderate", cve: "CVE-2026-2" }]),
      vuln(lock, "kevpkg", "1.0.0", "low", [{ severity: "low", cve: "cve-2026-1", fix: "1.0.2" }]),
      vuln(plugin, "kevpkg", "1.0.0", "low", [{ severity: "low", cve: "CVE-2026-1", fix: "1.0.2" }]),
    ];
    const epss = new Map<string, Epss>([
      ["CVE-2026-2", { epss: 0.42, percentile: 0.99 }],
      ["CVE-2026-1", { epss: 0.01, percentile: 0.5 }],
    ]);
    const r = rankVulnerabilities(vulns, { kev: kevOf("CVE-2026-1"), epss, home });
    expect(r.counts).toEqual({ P0: 2, P1: 2, P2: 1, P3: 1 });
    expect(r.projects.map((p) => p.kind)).toEqual(["own", "tool"]);
    const own = r.projects[0];
    expect(own?.items.map((i) => `${i.tier} ${i.name}`)).toEqual(["P0 kevpkg", "P1 epsspkg", "P1 devpkg", "P2 p2pkg", "P3 p3pkg"]);
    const top = own?.items[0] as RankedItem;
    expect(top).toMatchObject({ relation: "direct", fix: "1.0.2", kev: [{ cve: "CVE-2026-1", ransomware: true }] });
    expect(own?.items.find((i) => i.name === "devpkg")).toMatchObject({ relation: "dev", majorBump: true });
    expect(own?.items.find((i) => i.name === "p2pkg")?.relation).toBe("transitive");
    expect(own?.items.find((i) => i.name === "p3pkg")?.unfixed).toEqual(["CVE-2026-5"]);
  });

  it("findings are info: one per own project with P0/P1 items, and one summary", () => {
    const home = tmp("ug-find-");
    put(home, "code/a/.git/HEAD");
    put(home, "code/b/.git/HEAD");
    const a = put(home, "code/a/yarn.lock");
    const b = put(home, "code/b/yarn.lock");
    const plugin = put(home, ".vscode/extensions/x/package-lock.json");
    const r = rankVulnerabilities(
      [
        vuln(a, "handlebars", "4.7.9", "critical", [{ severity: "critical", cve: "CVE-2026-106445", fix: "4.7.10" }]),
        vuln(b, "minor", "1.0.0", "moderate", [{ severity: "moderate", cve: "CVE-2026-9", fix: "1.0.1" }]),
        vuln(plugin, "handlebars", "4.7.9", "critical", [{ severity: "critical", cve: "CVE-2026-106445", fix: "4.7.10" }]),
      ],
      { home, kev: new Map() },
    );
    const f = vulnFindings(r, "/runs/x");
    expect(f.every((x) => x.severity === "info")).toBe(true);
    expect(f.map((x) => x.key)).toEqual([`deps|vulns|${join(home, "code/a")}`, "deps|vulnerable-backlog"]);
    expect(f[0]?.title).toBe("a: 1 P1 vulnerable package(s) to upgrade, none in CISA KEV: handlebars 4.7.9 -> 4.7.10 (CVE-2026-106445, critical)");
    expect(f[0]?.evidence.ref).toBe(`ultraguard fixes --out /runs/x --project ${join(home, "code/a")}`);
    expect(f[1]?.title).toMatch(
      /^3 locked package versions have known vulnerabilities \(2 P1, 1 P3\) in 2 of your projects and 1 worktree, cache, plugin, vendored or test-fixture folder\(s\) \(1 of them\): a patching/,
    );
  });

  it("the report section ranks the top 10 per project, counts the rest, and collapses tool folders", () => {
    const home = tmp("ug-sec-");
    put(home, "code/a/.git/HEAD");
    const a = put(home, "code/a/package-lock.json", "{}");
    const plugin = put(home, ".claude/plugins/cache/p/package-lock.json", "{}");
    const many = Array.from({ length: 12 }, (_, i) =>
      vuln(a, `pkg${i}`, "1.0.0", "high", [{ severity: "high", cve: `CVE-2026-${i}`, fix: i < 11 ? "1.0.1" : "" }]),
    );
    const r = rankVulnerabilities([...many, vuln(plugin, "x", "1.0.0", "low", [{ cve: "CVE-2026-99" }])], { home, kev: new Map() });
    r.machine = [
      {
        tier: "P0",
        software: "macOS",
        installed: "27.2",
        cve: "CVE-2026-1",
        title: "CVE-2026-1 (Apple macOS), in CISA KEV since 2026-11-04",
        status: "update pending",
      },
    ];
    const md = renderVulnSection(r, home).join("\n");
    expect(md).toContain("## Vulnerabilities to fix");
    expect(md).toContain("### This machine\n\n- **P0** CVE-2026-1 (Apple macOS), in CISA KEV since 2026-11-04 (installed: macOS 27.2): update pending");
    expect(md).toContain("### a (`~/code/a`): 11 P2, 1 P3");
    expect(md.match(/^- \*\*P[0-3]\*\* `pkg/gm)?.length).toBe(10);
    expect(md).toContain("- and 2 more (1 P2, 1 P3): vulnerabilities.json");
    expect(md).toContain("- `~/.claude/plugins/cache/p` (a cache, plugin or tool folder): 1 P3");
    expect(md).toContain("CISA KEV could not be loaded");
    expect(renderVulnSection(rankVulnerabilities([], {}))).toEqual([]);
  });
});
