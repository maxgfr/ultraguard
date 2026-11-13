// scan deps ranks known CVEs end to end: findings, vulnerabilities.json, REPORT.md, fixes, check.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAnswer } from "../src/check.js";
import { main, setFeedGet, setRunner, setSoftwareScan } from "../src/cli.js";
import { EPSS_URL, type FeedGet, KEV_URL } from "../src/feeds.js";
import { Run } from "../src/run.js";
import { defaultRunner, type Runner } from "../src/runner.js";
import { scanSoftware } from "../src/scan/software.js";
import type { RankedVulns } from "../src/vulns.js";
import { AIKIDO_IOCS, aikidoRun as fullRun, tmp } from "./helpers.js";

function aikidoRun(): Run {
  const run = fullRun();
  run.write("iocs.json", { campaigns: AIKIDO_IOCS.campaigns.map((c) => ({ ...c, indicators: c.indicators.filter((i) => i.type !== "package") })) });
  return run;
}

function capture() {
  const out: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((s) => {
    out.push(String(s));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  return out;
}

afterEach(() => {
  setRunner(defaultRunner);
  vi.restoreAllMocks();
});

function project(): { root: string; lock: string } {
  const root = tmp("ug-pv-");
  mkdirSync(join(root, "app/.git"), { recursive: true });
  writeFileSync(join(root, "app/package.json"), JSON.stringify({ dependencies: { handlebars: "^4" } }));
  const lock = join(root, "app/package-lock.json");
  writeFileSync(
    lock,
    JSON.stringify({ lockfileVersion: 3, packages: { "": {}, "node_modules/handlebars": { version: "4.7.9" }, "node_modules/qs": { version: "6.1.0" } } }),
  );
  return { root, lock };
}

/** A fake bash that is package-checker: it reports handlebars (in KEV) and qs (high, with a fix). */
function checkerRunner(lock: string, extra: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true })): Runner {
  return async (cmd, args, opts) => {
    if (cmd !== "bash") return extra(cmd, args, opts);
    writeFileSync(
      args[args.indexOf("--export-json") + 1] as string,
      JSON.stringify({
        vulnerabilities: [
          {
            name: "handlebars",
            version: "4.7.9",
            file: lock,
            ecosystem: "npm",
            severity: "critical",
            advisories: [{ severity: "critical", cve: "CVE-2026-106445", fix: "4.7.10" }],
          },
          {
            name: "qs",
            version: "6.1.0",
            file: lock,
            ecosystem: "npm",
            severity: "high",
            advisories: [{ severity: "high", ghsa: "GHSA-aaaa-bbbb-cccc", fix: "6.14.1" }],
          },
        ],
      }),
    );
    return { ok: false, status: 1, stdout: "", stderr: "" };
  };
}

const feeds: FeedGet = async (url) => {
  if (url === KEV_URL)
    return {
      ok: true,
      status: 200,
      data: {
        catalogVersion: "2026.11.10",
        vulnerabilities: [
          { cveID: "CVE-2026-106445", vendorProject: "Handlebars", product: "handlebars", dateAdded: "2026-11-02" },
          { cveID: "CVE-2024-27834", vendorProject: "Apple", product: "Multiple Products", dateAdded: "2026-11-04" },
        ],
      },
    };
  if (url.startsWith(EPSS_URL)) return { ok: true, status: 200, data: { data: [{ cve: "CVE-2026-106445", epss: "0.61", percentile: "0.99" }] } };
  return { ok: false, status: 0, error: "offline" };
};

describe("scan deps: known CVEs ranked", () => {
  it("replaces the backlog line with ranked findings, keeps deps CLEAN, and plans the fixes", async () => {
    const { root, lock } = project();
    const run = aikidoRun();
    const state = tmp("ug-pvs-");
    setRunner(checkerRunner(lock));
    setFeedGet(feeds);
    const out = capture();
    expect(await main(["scan", "deps", "--out", run.dir, "--roots", root, "--no-registry", "--state", state])).toBe(0);
    expect(out.join("")).toMatch(/2 with known CVEs \(P0 1, P1 0, P2 1, P3 0: ultraguard fixes --out /);
    const deps = run.findings().filter((f) => f.surface === "deps");
    expect(deps.every((f) => f.severity === "info")).toBe(true);
    expect(deps.map((f) => f.title)).toEqual([
      "app: 1 P0 vulnerable package(s) to upgrade, 1 in CISA KEV (exploited in the wild): handlebars 4.7.9 -> 4.7.10 (CVE-2026-106445, critical, in CISA KEV since 2026-11-02, EPSS 61.0%)",
      "2 locked package versions have known vulnerabilities (1 P0, 1 P2) in 1 of your projects: a patching backlog, not a compromise (vulnerabilities.json, ultraguard fixes)",
    ]);
    const ranked = run.read<RankedVulns | undefined>("vulnerabilities.json", undefined);
    expect(ranked?.projects[0]?.items.map((i) => `${i.tier} ${i.name} ${i.relation}`)).toEqual(["P0 handlebars direct", "P2 qs transitive"]);
    expect(ranked?.feeds.kev?.catalogVersion).toBe("2026.11.10");
    expect(existsSync(join(state, "feeds/kev.json"))).toBe(true);

    out.length = 0;
    expect(await main(["report", "--out", run.dir, "--json"])).toBe(0);
    expect(JSON.parse(out.join("")).find((v: { surface: string }) => v.surface === "deps").verdict).toBe("CLEAN");
    const report = readFileSync(run.path("REPORT.md"), "utf8");
    expect(report).toContain("## Vulnerabilities to fix");
    expect(report).toMatch(/- \*\*P0\*\* `handlebars@4\.7\.9` -> `4\.7\.10`: critical, direct, CISA KEV since 2026-11-02, EPSS 61\.0%/);
    expect(readFileSync(run.path("REMEDIATION.md"), "utf8")).toContain(`ultraguard fixes --out ${run.dir}`);

    out.length = 0;
    expect(await main(["fixes", "--out", run.dir])).toBe(0);
    const plan = out.join("");
    expect(plan).toContain(`cd ${join(root, "app")}\nnpm install handlebars@4.7.10\n# edit package.json "overrides":\n#   "qs@6.1.0": "6.14.1"\nnpm install`);
    expect(readFileSync(run.path("FIXES.md"), "utf8")).toContain("- **P0** handlebars 4.7.9 -> 4.7.10 (direct): closes CVE-2026-106445");
    out.length = 0;
    expect(await main(["fixes", "--out", run.dir, "--project", join(root, "app"), "--json"])).toBe(0);
    expect(JSON.parse(out.join("")).plans[0].lockfiles[0].steps.map((s: { name: string }) => s.name)).toEqual(["handlebars", "qs"]);
    expect(await main(["fixes", "--out", run.dir, "--project", tmp()])).toBe(2);

    // An answer that never talks about CVEs still passes check: they are info.
    const answer = [
      "- github:account: not scanned",
      "- github:repos: not scanned",
      "- host: not scanned",
      "- deps: CLEAN",
      "- cloud: not scanned",
      "",
      "## Coverage",
      "Only the dependencies were scanned; the gaps are in REPORT.md.",
    ].join("\n");
    expect(checkAnswer(run, answer)).toEqual([]);
  });

  it("fixes ranks an older run that only has deps-vulnerabilities.json; with no list at all it says to scan", async () => {
    const { lock } = project();
    const run = new Run(tmp());
    run.write("deps-vulnerabilities.json", {
      vulnerabilities: [
        { name: "qs", version: "6.1.0", file: lock, ecosystem: "npm", severity: "high", advisories: [{ severity: "high", cve: "CVE-2026-9", fix: "6.14.1" }] },
        { name: "evil", version: "1.0.0", file: lock, ecosystem: "npm", severity: "critical", advisories: [{ id: "MAL-2026-1" }] },
      ],
    });
    const out = capture();
    expect(await main(["fixes", "--out", run.dir, "--state", tmp()])).toBe(0);
    expect(out.join("")).toContain('"qs@6.1.0": "6.14.1"');
    expect(out.join("")).not.toContain("evil");
    expect(run.read<RankedVulns | undefined>("vulnerabilities.json", undefined)?.packages).toBe(1);
    expect(await main(["fixes", "--out", tmp()])).toBe(2);
  });

  it("offline: KEV and EPSS are gaps, the ranking falls back to severity, nothing is P0", async () => {
    const { root, lock } = project();
    const run = aikidoRun();
    setRunner(checkerRunner(lock));
    capture();
    expect(await main(["scan", "deps", "--out", run.dir, "--roots", root, "--no-registry", "--state", tmp()])).toBe(0);
    expect(run.gaps().map((g) => g.what)).toEqual(
      expect.arrayContaining(["which of your vulnerable packages are exploited in the wild (CISA KEV)", "EPSS exploitation scores for some of 1 CVE(s)"]),
    );
    expect(run.read<RankedVulns | undefined>("vulnerabilities.json", undefined)?.counts).toEqual({ P0: 0, P1: 1, P2: 1, P3: 0 });
  });

  it("on a Mac: a pending security update makes deps REVIEW; KEV entries for macOS are listed", async () => {
    const root = tmp("ug-pvm-");
    const run = aikidoRun();
    setRunner(async (cmd) => {
      if (cmd === "sw_vers") return { ok: true, status: 0, stdout: "27.2\n", stderr: "" };
      if (cmd === "softwareupdate")
        return {
          ok: true,
          status: 0,
          stdout:
            "* Label: macOS Security Response 27.2 (a)\n\tTitle: macOS Security Response 27.2 (a), Version: 27.2 (a), Recommended: YES, Action: restart,\n",
          stderr: "",
        };
      return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    });
    setFeedGet(feeds);
    setSoftwareScan((ctx) => scanSoftware({ ...ctx, platform: "darwin", appsDirs: [tmp()] }));
    const out = capture();
    expect(await main(["sweep", "--surfaces", "deps", "--out", run.dir, "--roots", root, "--no-osv", "--no-registry", "--state", tmp(), "--json"])).toBe(0);
    expect(JSON.parse(out.join("")).verdicts.find((v: { surface: string }) => v.surface === "deps").verdict).toBe("REVIEW");
    const titles = run.findings().map((f) => `${f.severity}: ${f.title}`);
    expect(
      titles.some((t) =>
        t.startsWith("suspicious: 1 software update(s) pending on this Mac: macOS Security Response 27.2 (a) (security, recommended, restart)"),
      ),
    ).toBe(true);
    // An old CVE KEV added late: listed, as most likely fixed already on this macOS.
    expect(titles.some((t) => t.startsWith("info: CVE-2024-27834 (Apple Multiple Products) was added to CISA KEV on 2026-11-04, but it dates from 2024"))).toBe(
      true,
    );
    expect(readFileSync(run.path("REPORT.md"), "utf8")).toContain("### This machine");
  });
});
