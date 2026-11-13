// Regressions from the pipeline audit: the routine (watch) and the cloud scan it depends on.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseWebResults, readWebResultsFile } from "../src/intel.js";
import { Run } from "../src/run.js";
import type { Runner } from "../src/runner.js";
import { scanCloud } from "../src/scan/cloud.js";
import { EXIT_ALERT, EXIT_INCOMPLETE, watchCommit, watchPlan } from "../src/watch.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const missing: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
const json = (v: unknown) => ({ ok: true, status: 0, stdout: JSON.stringify(v), stderr: "" });
const okFetch = async (url: string) => ({ text: "y".repeat(500), title: "t", status: 200, finalUrl: url });
const day = (n: number) => new Date(Date.parse("2026-11-12T08:00:00Z") + n * 86_400_000);

/** github, host and deps scanned clean; cloud as scanCloud leaves it with `runner`. */
async function sweepWith(run: Run, cloudRunner: Runner) {
  for (const surface of ["github:account", "github:repos", "host", "deps"] as const)
    run.recordSurface({ surface, scanned: true, stats: {}, startedAt: "" }, [], []);
  const c = await scanCloud(AIKIDO_IOCS, cloudRunner);
  run.recordSurface(c.result, c.findings, c.gaps);
}

describe("watch-1 / e2e-10: a machine with no cloud CLI settles", () => {
  it("day 0 handles the source, day 1 says NOTHING NEW and exits 0", async () => {
    const state = tmp("ug-w1-");
    const hits = [{ url: "https://example.org/campaign" }];
    const run0 = new Run(tmp());
    expect((await watchPlan(state, run0, hits, { fetcher: okFetch, now: day(0) })).newSources).toBe(1);
    await sweepWith(run0, missing);
    const c0 = await watchCommit(state, run0, { now: day(0) });
    expect(c0.incomplete).toBe(false);
    expect(c0.exitCode).toBe(0);

    const run1 = new Run(tmp());
    const p1 = await watchPlan(state, run1, hits, { fetcher: okFetch, now: day(1) });
    expect(p1).toMatchObject({ newSources: 0, nothingNew: true });
  });

  it("a cloud CLI installed but logged out still blocks (exit 20)", async () => {
    const state = tmp("ug-w1b-");
    const run = new Run(tmp());
    await watchPlan(state, run, [{ url: "https://example.org/c" }], { fetcher: okFetch });
    await sweepWith(run, async (cmd) => (cmd === "aws" ? { ok: false, status: 255, stdout: "", stderr: "expired" } : await missing(cmd, [])));
    const c = await watchCommit(state, run);
    expect(c.exitCode).toBe(EXIT_INCOMPLETE);
  });

  it("surfaces a sweep was told to leave out (--surfaces) do not block", async () => {
    const state = tmp("ug-w1c-");
    const run = new Run(tmp());
    await watchPlan(state, run, [{ url: "https://example.org/c" }], { fetcher: okFetch });
    run.setMeta({ requested: ["github:account", "github:repos", "cloud"] });
    for (const surface of ["github:account", "github:repos", "cloud"] as const) run.recordSurface({ surface, scanned: true, stats: {}, startedAt: "" }, [], []);
    expect((await watchCommit(state, run)).exitCode).toBe(0);
  });
});

describe("watch-2: a failed --notify-issue alerts again on the next run", () => {
  it("keeps the findings un-alerted when gh issue create fails, and sends a short body", async () => {
    const state = tmp("ug-w2-");
    const run = new Run(tmp());
    for (const surface of ["github:account", "github:repos", "deps", "cloud"] as const)
      run.recordSurface({ surface, scanned: true, stats: {}, startedAt: "" }, [], []);
    run.recordSurface(
      { surface: "host", scanned: true, stats: {}, startedAt: "" },
      [{ surface: "host", severity: "compromised", subject: "/x", title: "File /x", evidence: { kind: "file", ref: "/x" }, key: "k" }],
      [],
    );
    const calls: string[][] = [];
    const failing: Runner = async (_cmd, args) => {
      calls.push(args);
      return { ok: false, status: 1, stdout: "", stderr: "HTTP 502" };
    };
    const c1 = await watchCommit(state, run, { notifyIssue: "me/alerts", runner: failing });
    expect(c1.exitCode).toBe(EXIT_ALERT);
    expect(c1.notified).toMatch(/^failed: HTTP 502/);
    expect(calls[0]).toContain(run.path("ISSUE.md"));
    const c2 = await watchCommit(state, run, { notifyIssue: "me/alerts", runner: async () => ({ ok: true, status: 0, stdout: "https://x/1", stderr: "" }) });
    expect(c2.exitCode).toBe(EXIT_ALERT);
    expect((await watchCommit(state, run)).exitCode).toBe(0);
  });
});

describe("watch-3: a --web-results file of an unknown shape is refused", () => {
  it("reads the common shapes, refuses one with no URL, and drops scheme-less URLs loudly", () => {
    expect(parseWebResults({ data: [{ url: "https://a.dev/x" }] })).toHaveLength(1);
    expect(parseWebResults({ organic_results: [{ link: "https://a.dev/x" }] })).toHaveLength(1);
    expect(parseWebResults({ web: { results: [{ url: "https://a.dev/x" }] } })).toHaveLength(1);
    expect(parseWebResults([{ URL: "https://a.dev/x" }])).toHaveLength(1);
    const dir = tmp();
    const odd = join(dir, "odd.json");
    writeFileSync(odd, JSON.stringify({ payload: [{ address: "https://a.dev/x" }] }));
    expect(() => readWebResultsFile(odd)).toThrow(/no http\(s\) URL found/);
    const empty = join(dir, "empty.json");
    writeFileSync(empty, "[]");
    expect(readWebResultsFile(empty)).toEqual([]);
    const bare = join(dir, "bare.json");
    writeFileSync(bare, JSON.stringify(["aikido.dev/blog/x", "https://a.dev/y"]));
    const warned: string[] = [];
    expect(readWebResultsFile(bare, (s) => warned.push(s))).toHaveLength(1);
    expect(warned[0]).toMatch(/1 hit\(s\) without https:\/\//);
  });
});

describe("watch-4: a page that cannot be fetched is not news every day", () => {
  it("counts it apart, and gives up after three runs", async () => {
    const state = tmp("ug-w4-");
    const hits = [{ url: "https://ok.dev/a" }, { url: "https://blocked.dev/b" }];
    const fetcher = async (url: string) => (url.includes("blocked") ? { text: "", status: 403, finalUrl: url } : okFetch(url));
    const run0 = new Run(tmp());
    const p0 = await watchPlan(state, run0, hits, { fetcher });
    expect(p0.newSources).toBe(1);
    expect(p0.failed.map((f) => f.attempts)).toEqual([1]);
    for (const surface of ["github:account", "github:repos", "host", "deps", "cloud"] as const)
      run0.recordSurface({ surface, scanned: true, stats: {}, startedAt: "" }, [], []);
    await watchCommit(state, run0);
    const p1 = await watchPlan(state, new Run(tmp()), hits, { fetcher });
    expect(p1).toMatchObject({ newSources: 0, nothingNew: true });
    expect(p1.failed[0]?.attempts).toBe(2);
    const p2 = await watchPlan(state, new Run(tmp()), hits, { fetcher });
    expect(p2.failed[0]).toMatchObject({ attempts: 3, givenUp: true });
    const p3 = await watchPlan(state, new Run(tmp()), hits, { fetcher });
    expect(p3).toMatchObject({ newSources: 0, skipped: 2, failed: [] });
  });
});
