// Regressions from the pipeline audit: the CLI around the scans.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main, setRunner } from "../src/cli.js";
import { Run } from "../src/run.js";
import { defaultRunner, type Runner } from "../src/runner.js";
import type { Finding } from "../src/types.js";
import { AIKIDO_IOCS, aikidoRun as fullRun, tmp } from "./helpers.js";

/** The Aikido run without its package indicators: scan deps then never reads this machine's global installs. */
function aikidoRun(): Run {
  const run = fullRun();
  run.write("iocs.json", { campaigns: AIKIDO_IOCS.campaigns.map((c) => ({ ...c, indicators: c.indicators.filter((i) => i.type !== "package") })) });
  return run;
}

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((s) => {
    out.push(String(s));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((s) => {
    err.push(String(s));
    return true;
  });
  return { out, err };
}

afterEach(() => {
  setRunner(defaultRunner);
  vi.restoreAllMocks();
});

describe("cli-1 / e2e-5: --roots must exist", () => {
  it("a missing root, a file and a space-separated list are usage errors", async () => {
    const run = aikidoRun();
    const file = join(run.dir, "f.txt");
    writeFileSync(file, "x");
    const io = capture();
    expect(await main(["scan", "deps", "--no-osv", "--out", run.dir, "--roots", join(tmp(), "ultragard")])).toBe(2);
    expect(await main(["scan", "host", "--skip-live", "--no-av", "--no-rules", "--out", run.dir, "--roots", file])).toBe(2);
    expect(await main(["sweep", "--surfaces", "deps", "--no-osv", "--out", run.dir, "--roots", `${tmp()} ${tmp()}`])).toBe(2);
    expect(io.err.join("")).toContain("does not exist or is not a directory");
    expect(run.surfaces()).toEqual([]);
  });
});

describe("e2e-17: --json on scan and sweep", () => {
  it("prints one JSON line", async () => {
    const run = aikidoRun();
    const io = capture();
    expect(await main(["scan", "deps", "--no-osv", "--out", run.dir, "--roots", tmp(), "--json"])).toBe(0);
    expect(JSON.parse(io.out.join("")).surfaces[0].surface).toBe("deps");
    io.out.length = 0;
    expect(await main(["sweep", "--surfaces", "deps", "--no-osv", "--out", run.dir, "--roots", tmp(), "--json"])).toBe(0);
    const r = JSON.parse(io.out.join(""));
    expect(r.verdicts.find((v: { surface: string }) => v.surface === "deps").verdict).toBe("CLEAN");
    expect(io.err.join("")).toContain("deps: scanning");
  });
});

describe("ioc-1: a surface that crashes does not take the sweep down", () => {
  it("records a gap, scans the rest and writes the report", async () => {
    const run = aikidoRun();
    const runner: Runner = async (cmd) => {
      if (cmd === "aws") throw new Error("boom");
      return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    };
    setRunner(runner);
    capture();
    expect(await main(["sweep", "--surfaces", "deps,cloud", "--no-osv", "--out", run.dir, "--roots", tmp()])).toBe(1);
    expect(run.gaps().some((g) => g.surface === "cloud" && g.why.includes("boom"))).toBe(true);
    expect(run.surfaces().find((s) => s.surface === "deps")?.scanned).toBe(true);
    expect(existsSync(run.path("REPORT.md"))).toBe(true);
  });
});

describe("e2e-18: errors that lead to the fix", () => {
  it("a malformed run file names its path; a URL without scheme is refused", async () => {
    const run = aikidoRun();
    writeFileSync(run.path("iocs.json"), "{ campaigns: [");
    const io = capture();
    expect(await main(["scan", "cloud", "--out", run.dir])).toBe(1);
    expect(io.err.join("")).toContain(`${run.path("iocs.json")}: not valid JSON`);
    expect(await main(["intel", "aikido.dev/blog/x", "--out", run.dir])).toBe(2);
    expect(io.err.join("")).toContain('"aikido.dev/blog/x" is not a URL');
  });
});

describe("run-1: a re-scan never reuses an [F#] for another finding", () => {
  it("ids keep growing, and an unchanged finding keeps its id", () => {
    const run = new Run(tmp());
    const f = (surface: Finding["surface"], key: string): Omit<Finding, "id"> => ({
      surface,
      severity: "compromised",
      subject: key,
      title: key,
      evidence: { kind: "file", ref: key },
      key,
    });
    const r = (surface: Finding["surface"]) => ({ surface, scanned: true, stats: {}, startedAt: "" });
    run.recordSurface(r("host"), [f("host", "h")], []);
    run.recordSurface(r("deps"), [f("deps", "/code/a/package-lock.json"), f("deps", "b")], []);
    run.recordSurface(r("deps"), [f("deps", "/code/c/Cargo.lock"), f("deps", "b")], []);
    const ids = Object.fromEntries(run.findings().map((x) => [x.key, x.id]));
    expect(ids).toEqual({ h: "F1", b: "F3", "/code/c/Cargo.lock": "F4" });
  });
});
