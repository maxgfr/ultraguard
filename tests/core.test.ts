import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkAnswer } from "../src/check.js";
import { main } from "../src/cli.js";
import { intel, parseWebResults } from "../src/intel.js";
import { defang, globRegex, matchers, validateIocs } from "../src/ioc.js";
import { renderReport } from "../src/report.js";
import { Run } from "../src/run.js";
import { scanCloud, wildcardTrust } from "../src/scan/cloud.js";
import type { Finding } from "../src/types.js";
import { verdicts } from "../src/verdict.js";
import { EXIT_ALERT, watchCommit, watchPlan } from "../src/watch.js";
import { AIKIDO_IOCS, aikidoRun, tmp } from "./helpers.js";

const finding = (over: Partial<Finding>): Omit<Finding, "id"> => ({
  surface: "github:repos",
  severity: "compromised",
  subject: "org/site",
  title: 'Workflow "Deploy" ran on main ("chore: add ci helper"), success, triggered by victim',
  actor: "victim",
  scope: "other",
  campaign: "wfx-loot-2026-11",
  source: "S1",
  evidence: { kind: "url", ref: "https://github.com/org/site/actions/runs/1" },
  key: `k-${Math.random()}`,
  ...over,
});

describe("iocs", () => {
  it("accepts the Aikido worked example", () => {
    const run = aikidoRun();
    expect(validateIocs(AIKIDO_IOCS, run.sources()).problems).toEqual([]);
  });

  it("refuses indicators that cite no fetched source", () => {
    const { problems } = validateIocs(
      {
        campaigns: [
          {
            id: "c",
            title: "t",
            since: "2026-11-10",
            sources: ["S1"],
            indicators: [
              { type: "branch", value: "x", source: "S9" },
              { type: "sha256", value: "nothex", source: "S1" },
              { type: "package", value: "p", source: "S1" },
            ],
          },
        ],
      },
      [{ id: "S1", url: "u", fetchedAt: "", origin: "web" }],
    );
    expect(problems.map((p) => p.message)).toEqual([
      "S9 is not a fetched source of this run",
      "a sha256 is 64 hex characters",
      "required for a package indicator",
    ]);
    const failed = validateIocs(
      { campaigns: [{ id: "c", title: "t", since: "2026-11-10", sources: ["S1"], indicators: [{ type: "branch", value: "x", source: "S1" }] }] },
      [{ id: "S1", url: "u", fetchedAt: "", origin: "web", error: "HTTP 404" }],
    );
    expect(failed.problems.length).toBeGreaterThan(0);
  });

  it("re-arms defanged indicators and matches globs and exact messages", () => {
    expect(defang("194.150.166[.]244")).toBe("194.150.166.244");
    expect(defang("hxxp://evil[.]com")).toBe("http://evil.com");
    expect(globRegex(".ci-*.sh").test(".ci-gvwxh6.sh")).toBe(true);
    const ms = matchers(AIKIDO_IOCS, "commit_message", "workflow_file", "ip");
    const hit = (s: string) => ms.some((m) => m.test(s));
    expect(hit("ci: cleanup")).toBe(true);
    expect(hit("CI: Cleanup ")).toBe(true);
    expect(hit("ci: cleanup workflows")).toBe(false);
    expect(hit("repo/.github/workflows/build-audit-x1y2z3.yml")).toBe(true);
    expect(hit("lsof: 10.0.0.1->194.150.166.244:8080")).toBe(true);
  });
});

describe("intel", () => {
  it("parses the shapes host search tools emit, deduplicated", () => {
    expect(parseWebResults(["https://a.dev/x", { url: "https://a.dev/x" }, { link: "https://b.dev", title: "B" }, { url: "ftp://no" }])).toEqual([
      { url: "https://a.dev/x" },
      { url: "https://b.dev", title: "B" },
    ]);
    expect(parseWebResults({ results: [{ url: "https://c.dev" }] })).toEqual([{ url: "https://c.dev", title: undefined }]);
  });

  it("registers fetched pages as sources and writes the IOC template; a failed fetch cannot ground an IOC", async () => {
    const run = new Run(tmp());
    const fetcher = async (url: string) =>
      url.includes("ok") ? { text: "x".repeat(500), title: "Campaign", status: 200, finalUrl: url } : { text: "", status: 404, finalUrl: url };
    const s = await intel(run, [{ url: "https://ok.dev/a" }, { url: "https://gone.dev/b" }], fetcher);
    expect(s.map((x) => [x.id, !!x.error])).toEqual([
      ["S1", false],
      ["S2", true],
    ]);
    expect(run.read<{ campaigns: unknown[] }>("iocs.todo.json", { campaigns: [] }).campaigns).toHaveLength(1);
  });
});

describe("verdicts and report", () => {
  it("ranks COMPROMISED over EXPOSED over REVIEW, and UNKNOWN when a surface was not scanned", () => {
    const run = aikidoRun();
    run.recordSurface({ surface: "github:repos", scanned: true, stats: {}, startedAt: "" }, [finding({})], []);
    run.recordSurface({ surface: "github:account", scanned: true, stats: {}, startedAt: "" }, [], []);
    run.recordSurface({ surface: "host", scanned: true, stats: {}, startedAt: "" }, [finding({ surface: "host", severity: "suspicious", subject: "/x" })], []);
    run.recordSurface({ surface: "deps", scanned: true, stats: {}, startedAt: "" }, [], [{ surface: "deps", what: "x", why: "y" }]);
    const v = Object.fromEntries(verdicts(run.findings(), run.gaps(), run.surfaces()).map((x) => [x.surface, x.verdict]));
    expect(v).toEqual({ "github:account": "CLEAN", "github:repos": "COMPROMISED", host: "REVIEW", deps: "CLEAN", cloud: "UNKNOWN" });
  });

  it("a re-scan replaces the surface's findings instead of piling up duplicates", () => {
    const run = aikidoRun();
    const r = { surface: "host" as const, scanned: true, stats: {}, startedAt: "" };
    run.recordSurface(r, [finding({ surface: "host", key: "a" })], []);
    run.recordSurface(r, [finding({ surface: "host", key: "a" }), finding({ surface: "host", key: "a" })], []);
    expect(run.findings()).toHaveLength(1);
  });

  it("a run on a docs-only probe commit does not count as the attacker making CI run", () => {
    const run = aikidoRun();
    run.recordSurface(
      { surface: "github:repos", scanned: true, stats: {}, startedAt: "" },
      [finding({ subject: "org/p", title: 'Workflow "CI" ran on wfx-docs ("docs: x"), success, triggered by victim; the commit only changes docs (a probe)' })],
      [],
    );
    expect(renderReport(run).report).toContain("### org/p: probe only, no attacker run seen");
  });

  it("separates repos where attacker code ran from probe-only repos, and never runs a command", () => {
    const run = aikidoRun();
    run.recordSurface(
      { surface: "github:repos", scanned: true, stats: {}, startedAt: "" },
      [finding({}), finding({ subject: "org/docs", title: 'PR #3 "docs: dependency audit notes" (branch wfx-docs) by victim' })],
      [],
    );
    const { report, remediation } = renderReport(run, new Date("2026-11-12T12:00:00Z"));
    expect(report).toContain("### org/site: the attacker made CI run");
    expect(report).toContain("### org/docs: probe only, no attacker run seen");
    expect(remediation).toContain("ultraguard runs none of these commands");
    expect(remediation).toContain("`victim`");
    expect(remediation.indexOf("org/site")).toBeLessThan(remediation.indexOf("org/docs"));
  });
});

describe("check", () => {
  function hitRun() {
    const run = aikidoRun();
    run.recordSurface({ surface: "github:repos", scanned: true, stats: {}, startedAt: "" }, [finding({})], [{ surface: "github:repos", what: "x", why: "y" }]);
    run.recordSurface({ surface: "github:account", scanned: true, stats: {}, startedAt: "" }, [], []);
    return run;
  }

  it("passes a grounded answer", () => {
    const text =
      "Your GitHub account is clean [S1]. The repositories are COMPROMISED: victim ran the stealer in org/site CI [F1].\n\n## Coverage\nThe cloud was not scanned.";
    expect(checkAnswer(hitRun(), text)).toEqual([]);
  });

  it("refuses dangling citations, uncited compromise claims, a false all-clear and a missing coverage note", () => {
    const rules = checkAnswer(hitRun(), "Everything is clean. The repository org/site was hit by victim. See [F7].").map((p) => p.rule);
    expect(rules).toEqual(expect.arrayContaining(["dangling", "uncited-claim", "wrong-clean", "no-coverage"]));
  });

  it("refuses an answer that hides a compromised surface", () => {
    const rules = checkAnswer(hitRun(), "Your GitHub account looks fine. Coverage: the cloud was not scanned.").map((p) => p.rule);
    expect(rules).toContain("omitted-surface");
  });
});

describe("cloud", () => {
  it("spots a trust policy open to every AWS principal", () => {
    expect(wildcardTrust({ Statement: [{ Effect: "Allow", Principal: { AWS: "*" }, Action: "sts:AssumeRole" }] })?.conditioned).toBe(false);
    expect(wildcardTrust({ Statement: [{ Effect: "Allow", Principal: { AWS: "arn:aws:iam::123:root" } }] })).toBeUndefined();
  });

  it("turns a missing or logged-out CLI into a gap, never a clean bill", async () => {
    const runner = async (cmd: string) =>
      cmd === "aws" ? { ok: false, status: 255, stdout: "", stderr: "expired" } : { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    const r = await scanCloud(AIKIDO_IOCS, runner);
    expect(r.result.scanned).toBe(false);
    expect(r.gaps.map((g) => g.what)).toEqual(["AWS", "GCP", "Azure"]);
  });

  it("flags wildcard roles and fresh access keys through the aws CLI", async () => {
    const runner = async (cmd: string, args: string[]) => {
      if (cmd !== "aws") return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
      const a = args.join(" ");
      const json = (v: unknown) => ({ ok: true, status: 0, stdout: JSON.stringify(v), stderr: "" });
      if (a.startsWith("sts")) return json({ Account: "123" });
      if (a.startsWith("iam list-roles"))
        return json({ Roles: [{ RoleName: "deploy", AssumeRolePolicyDocument: { Statement: [{ Effect: "Allow", Principal: { AWS: "*" } }] } }] });
      if (a.startsWith("iam list-users")) return json({ Users: [{ UserName: "ci" }] });
      if (a.startsWith("iam list-access-keys"))
        return json({ AccessKeyMetadata: [{ AccessKeyId: "AKIA1", CreateDate: "2026-11-11T00:00:00Z", Status: "Active" }] });
      return json({});
    };
    const r = await scanCloud(AIKIDO_IOCS, runner);
    expect(r.findings.map((f) => `${f.severity}: ${f.subject}`)).toEqual(["compromised: aws:123:role/deploy", "suspicious: aws:123:user/ci"]);
  });
});

describe("watch", () => {
  it("dedups sources across runs and alerts once per finding, with exit codes", async () => {
    const state = tmp("ug-state-");
    const fetcher = async (url: string) => ({ text: "y".repeat(500), title: "wfx-loot", status: 200, finalUrl: url });
    const hits = [{ url: "https://www.aikido.dev/blog/wfx" }];

    const run1 = new Run(tmp());
    const p1 = await watchPlan(state, run1, hits, { fetcher });
    expect(p1).toMatchObject({ newSources: 1, nothingNew: false, resweep: false });
    run1.write("iocs.json", { campaigns: [{ ...AIKIDO_IOCS.campaigns[0], sources: ["S1"] }] });
    run1.recordSurface({ surface: "github:repos", scanned: true, stats: {}, startedAt: "" }, [finding({ key: "stable" })], []);
    const c1 = await watchCommit(state, run1);
    expect(c1.alert).toBe(true);
    expect(c1.exitCode).toBe(EXIT_ALERT);
    expect(c1.summary).toMatch(/^ALERT: wfx-loot-2026-11 → github:repos COMPROMISED/);

    const run2 = new Run(tmp());
    const p2 = await watchPlan(state, run2, hits, { fetcher, resweepDays: 7 });
    expect(p2).toMatchObject({ newSources: 0, skipped: 1, nothingNew: true });
    run2.recordSurface({ surface: "github:repos", scanned: true, stats: {}, startedAt: "" }, [finding({ key: "stable" })], []);
    const c2 = await watchCommit(state, run2);
    expect(c2.alert).toBe(false);
    expect(c2.summary).toMatch(/^NOTHING NEW/);

    // A week later the known campaign is re-armed, with its source carried into the new run.
    const run3 = new Run(tmp());
    const p3 = await watchPlan(state, run3, [], { now: new Date(Date.now() + 8 * 86_400_000) });
    expect(p3.resweep).toBe(true);
    const carried = run3.read<{ campaigns: { sources: string[] }[] }>("iocs.carried.json", { campaigns: [] });
    expect(carried.campaigns[0]?.sources).toEqual(["S1"]);
    expect(run3.sources()[0]?.url).toBe("https://www.aikido.dev/blog/wfx");
  });
});

describe("cli", () => {
  it("answers --help and refuses an unknown flag with a usage exit code", async () => {
    expect(await main(["--help"])).toBe(0);
    expect(await main(["sweep", "--bogus"])).toBe(2);
    expect(await main(["sweep"])).toBe(2);
  });

  it("ioc set refuses an IOC file that cites nothing", async () => {
    const run = aikidoRun();
    const file = join(run.dir, "bad.json");
    writeFileSync(
      file,
      JSON.stringify({
        campaigns: [{ id: "c", title: "t", since: "2026-11-10", sources: ["S4"], indicators: [{ type: "branch", value: "x", source: "S4" }] }],
      }),
    );
    expect(await main(["ioc", "set", "--file", file, "--out", run.dir])).toBe(1);
  });

  it("doctor names the key scopes the account scan needs", async () => {
    const { doctor } = await import("../src/doctor.js");
    const runner = async (cmd: string, args: string[]) => {
      if (cmd !== "gh") return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
      if (args[1] === "-i") return { ok: true, status: 0, stdout: "HTTP/2.0 200 OK\nX-Oauth-Scopes: repo, read:org, admin:gpg_key\n\n{}", stderr: "" };
      return { ok: true, status: 0, stdout: '{"login":"me"}', stderr: "" };
    };
    const gh = (await doctor(runner)).find((l) => l.check === "gh");
    expect(gh?.ok).toBe(false);
    expect(gh?.fix).toBe("gh auth refresh -s read:public_key");
  });
});
