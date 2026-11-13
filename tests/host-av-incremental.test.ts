import { existsSync, mkdirSync, readFileSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Runner } from "../src/runner.js";
import { antivirusPass, yaraPass } from "../src/scan/antivirus.js";
import { fullFiles, pathsIn, ScanCache } from "../src/scan/avcache.js";
import { scanHost } from "../src/scan/host.js";
import type { HostInventory } from "../src/scan/hostintel.js";
import { walk } from "../src/scan/walk.js";
import { main } from "../src/cli.js";
import { AIKIDO_IOCS, aikidoRun, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const DAY = 86_400_000;
const inv = (): HostInventory => ({ startupItems: [], credentials: [], recentExtensions: [], shellStartup: [] });

function tree(n: number) {
  const root = tmp("ug-full-");
  for (let i = 0; i < n; i++) {
    mkdirSync(join(root, `d${i % 3}`), { recursive: true });
    writeFileSync(join(root, `d${i % 3}`, `f${i}`), `file ${i}`);
  }
  return root;
}

/** A clamscan that reads its list file, records what it was asked to scan, and flags or fails the paths given. */
function fakeClam(opts: { found?: (p: string) => boolean; error?: (p: string) => boolean; status?: (list: string[]) => number } = {}) {
  const scanned: string[][] = [];
  const runner: Runner = async (cmd, args) => {
    if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "" };
    if (cmd !== "clamscan") return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/28181/Thu Nov 12 07:27:14 2026", stderr: "" };
    const list = readFileSync((args.find((a) => a.startsWith("--file-list=")) as string).slice(12), "utf8")
      .split("\n")
      .filter(Boolean);
    scanned.push(list);
    const found = list.filter((p) => opts.found?.(p)).map((p) => `${p}: Osx.Trojan.Amos FOUND`);
    const errors = list.filter((p) => opts.error?.(p)).map((p) => `${p}: Can't open file or directory ERROR`);
    const status = opts.status?.(list) ?? (errors.length ? 2 : found.length ? 1 : 0);
    return { ok: status === 0, status, stdout: [...found, ...errors].join("\n"), stderr: "" };
  };
  return { runner, scanned };
}

describe("incremental full pass (--av-full)", () => {
  it("lists every regular file under the roots, without symlinks or excluded folders", () => {
    const root = tree(4);
    symlinkSync(join(root, "d0"), join(root, "link"));
    mkdirSync(join(root, "run"));
    writeFileSync(join(root, "run", "iocs.json"), "{}");
    const r = fullFiles([root], [join(root, "run")]);
    expect(r.files.map((f) => f.path.slice(root.length + 1)).sort()).toEqual(["d0/f0", "d0/f3", "d1/f1", "d2/f2"]);
    expect(r.files[0]).toMatchObject({ size: expect.any(Number), mtimeMs: expect.any(Number), ino: expect.any(Number) });
    expect(fullFiles([root], [], 2)).toMatchObject({ capped: true });
  });

  it("names the files of a batch in a scanner's error lines", () => {
    const batch = new Set(["/a: b", "/c"]);
    expect(
      [...pathsIn(["/a: b: Can't open file ERROR", "WARNING: /c: Can't access file", "error scanning /c: could not open file", "/z: x"], batch)].sort(),
    ).toEqual(["/a: b", "/c"]);
  });

  it("scans everything once, then only what changed, what was flagged or unreadable, and everything again after --av-rescan-days", async () => {
    const root = tree(6);
    const state = tmp("ug-state-");
    const evil = join(root, "d0/f3");
    const locked = join(root, "d1/f1");
    const base = { home: root, inventory: inv(), flagged: [], sinceMs: 0, listDir: tmp("ug-list-"), now: NOW };
    const files = () => fullFiles([root]).files;
    const inc = (nowMs: number) => ({ files: files(), nowMs, maxAgeMs: 7 * DAY, stateDir: state });

    const first = fakeClam({ found: (p) => p === evil, error: (p) => p === locked });
    const a = await antivirusPass(first.runner, { ...base, incremental: inc(NOW.getTime()) });
    expect(first.scanned.flat()).toHaveLength(6);
    expect(a.stats).toMatchObject({ avScanned: 6, avSkipped: 0, avDetections: 1 });
    expect(a.findings.map((f) => f.subject)).toEqual([evil]);
    // Not the "the pass is targeted" gap: this one is full.
    expect(a.gaps.map((g) => g.what)).toEqual(["1 antivirus target(s)"]);
    expect(existsSync(join(state, "av-cache", "clamav.json"))).toBe(true);

    // Next day: one file changed. The detection and the unreadable file are scanned again, the rest skipped.
    const changed = join(root, "d2/f5");
    writeFileSync(changed, "changed and longer");
    const second = fakeClam();
    const b = await antivirusPass(second.runner, { ...base, incremental: inc(NOW.getTime() + DAY) });
    expect(second.scanned.flat().sort()).toEqual([evil, locked, changed].sort());
    expect(b.stats).toMatchObject({ avScanned: 3, avSkipped: 3 });

    // Past the rescan age, everything again.
    const third = fakeClam();
    const c = await antivirusPass(third.runner, { ...base, incremental: inc(NOW.getTime() + 9 * DAY) });
    expect(c.stats).toMatchObject({ avScanned: 6, avSkipped: 0 });
  });

  it("keeps the batches an interrupted run finished, and forgets everything when ClamAV changes version", async () => {
    const root = tree(3);
    const state = tmp("ug-state-");
    const base = { home: root, inventory: inv(), flagged: [], sinceMs: 0, listDir: tmp("ug-list-"), now: NOW };
    const incremental = { files: fullFiles([root]).files, nowMs: NOW.getTime(), maxAgeMs: 7 * DAY, stateDir: state };
    // A killed scan (exit 143): nothing of its batch is remembered, and it is a gap.
    const killed = fakeClam({ status: () => 143 });
    const k = await antivirusPass(killed.runner, { ...base, incremental });
    expect(k.stats).toMatchObject({ avScanned: 0, avSkipped: 0 });
    expect(k.gaps.map((g) => g.why)).toEqual([expect.stringContaining("clamscan did not finish (exit 143)")]);
    const ok = fakeClam();
    await antivirusPass(ok.runner, { ...base, incremental });
    const again = fakeClam();
    expect((await antivirusPass(again.runner, { ...base, incremental })).stats).toMatchObject({ avScanned: 0, avSkipped: 3 });
    // Another ClamAV version: a new key, an empty cache.
    const cache = new ScanCache(join(state, "av-cache", "clamav.json"), "ClamAV 1.6.0");
    expect(cache.fresh(incremental.files[0] as never, NOW.getTime(), 7 * DAY)).toBe(false);
  });

  it("runs YARA rule sets incrementally too, keyed by the rules' sha256", async () => {
    const root = tree(4);
    const state = tmp("ug-state-");
    const rules = join(tmp("ug-rules-"), "r.yar");
    writeFileSync(rules, "rule a { condition: true }");
    const asked: string[][] = [];
    const runner: Runner = async (_cmd, args) => {
      const list = readFileSync(args.at(-1) as string, "utf8")
        .split("\n")
        .filter(Boolean);
      asked.push(list);
      const hit = list.find((p) => p.endsWith("f2"));
      return { ok: true, status: 0, stdout: hit ? `Amos [] ${hit}\n` : "", stderr: "" };
    };
    const run = async (nowMs: number) => {
      const { ScanCache: C, ruleSetKey } = await import("../src/scan/avcache.js");
      return yaraPass(runner, {
        rules,
        targets: [],
        listDir: tmp("ug-list-"),
        statsKey: "xprotect",
        incremental: { files: fullFiles([root]).files, nowMs, maxAgeMs: 7 * DAY, cache: C.open(state, "xprotect", ruleSetKey([rules])) },
      });
    };
    const a = await run(NOW.getTime());
    expect(a.stats).toMatchObject({ xprotectScanned: 4, xprotectSkipped: 0, xprotectMatches: 1 });
    const b = await run(NOW.getTime() + DAY);
    expect(asked.at(-1)?.map((p) => p.slice(root.length + 1))).toEqual(["d2/f2"]);
    expect(b.stats).toMatchObject({ xprotectScanned: 1, xprotectSkipped: 3, xprotectMatches: 1 });
    // New rules: everything again.
    writeFileSync(rules, "rule b { condition: true }");
    expect((await run(NOW.getTime() + DAY)).stats).toMatchObject({ xprotectScanned: 4, xprotectSkipped: 0 });
  });

  it("scan host --av-full enumerates once and reports scanned and skipped files", async () => {
    const home = tree(5);
    const state = tmp("ug-state-");
    utimesSync(home, NOW, NOW);
    const opts = { home, startupDirs: [], dropDirs: [], appDirs: [], av: "full" as const, roots: [home], stateDir: state, listDir: tmp("ug-list-"), now: NOW };
    const first = fakeClam();
    const a = await scanHost(AIKIDO_IOCS, walk([join(home, "none")]), first.runner, { ...opts, platform: "linux" });
    expect(a.result.stats).toMatchObject({ fullFiles: 5, avScanned: 5, avSkipped: 0 });
    const second = fakeClam();
    const b = await scanHost(AIKIDO_IOCS, walk([join(home, "none")]), second.runner, { ...opts, platform: "linux", avRescanDays: 7 });
    expect(b.result.stats).toMatchObject({ avScanned: 0, avSkipped: 5 });
    // --av-rescan-days 0: everything, every time.
    const third = fakeClam();
    expect((await scanHost(AIKIDO_IOCS, walk([join(home, "none")]), third.runner, { ...opts, platform: "linux", avRescanDays: 0 })).result.stats).toMatchObject(
      {
        avScanned: 5,
        avSkipped: 0,
      },
    );
  });

  it("--av-rescan-days is a scan flag taking a whole number of days", async () => {
    const run = aikidoRun();
    const err: string[] = [];
    const spy = (s: string | Uint8Array) => {
      err.push(String(s));
      return true;
    };
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = spy as typeof process.stderr.write;
    try {
      expect(await main(["scan", "host", "--skip-live", "--no-av", "--no-rules", "--out", run.dir, "--roots", tmp(), "--av-rescan-days", "-1"])).toBe(2);
    } finally {
      process.stderr.write = orig;
    }
    expect(err.join("")).toContain("--av-rescan-days expects a whole number from 0 to 365");
    expect(run.surfaces()).toEqual([]);
  });
});
