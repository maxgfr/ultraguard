import { chmodSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  antivirusPass,
  avTargetList,
  avTargets,
  dropFolders,
  parseClamOutput,
  readableTargets,
  parseClamVersion,
  parseYaraOutput,
  yaraPass,
  yaraRuleFiles,
} from "../src/scan/antivirus.js";
import type { HostInventory } from "../src/scan/hostintel.js";
import { tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const inv = (over: Partial<HostInventory> = {}): HostInventory => ({ startupItems: [], credentials: [], recentExtensions: [], shellStartup: [], ...over });

describe("clamav", () => {
  it("reads the engine and signature age from the version line", () => {
    expect(parseClamVersion("ClamAV 1.5.4/27970/Mon Apr 13 08:24:33 2026", NOW)).toEqual({
      version: "1.5.4",
      signatures: "2026-04-13T08:24:33.000Z",
      ageDays: 213,
    });
    expect(parseClamVersion("ClamAV 1.5.4", NOW)).toEqual({ version: "1.5.4", signatures: undefined, ageDays: undefined });
  });

  it("parses detections", () => {
    expect(parseClamOutput("/a/b: Eicar-Test-Signature FOUND\n/c: OK\nLibClamAV Warning: x\n")).toEqual([{ path: "/a/b", signature: "Eicar-Test-Signature" }]);
  });

  it("a PUA detection is suspicious, not a compromise, and odd file names go as arguments", async () => {
    const dir = tmp("ug-pua-");
    const calls: string[][] = [];
    const runner = async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args]);
      if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "" };
      if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/27999/Wed Nov 11 08:00:00 2026\n", stderr: "" };
      return { ok: false, status: 1, stdout: "/x/tool: PUA.Osx.Tool.Netcat FOUND\n", stderr: "" };
    };
    const r = await antivirusPass(runner, { home: dir, inventory: inv(), flagged: [], sinceMs: 0, listDir: dir, now: NOW, full: ["/a", "/b\nc"] });
    expect(r.findings.map((f) => f.severity)).toEqual(["suspicious"]);
    expect(r.gaps).toEqual([]);
    expect(calls.at(-1)).toContain("--detect-pua=yes");
    expect(calls.at(-1)?.at(-1)).toBe("/b\nc");
  });

  it("turns detections into compromised findings and stale signatures into a gap; warnings are not errors", async () => {
    const dir = tmp("ug-av-");
    const calls: string[][] = [];
    const runner = async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args]);
      if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "no clamd" };
      if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/27970/Mon Apr 13 08:24:33 2026\n", stderr: "" };
      return {
        ok: false,
        status: 1,
        stdout: "/x/evil.app: Win.Trojan.Agent FOUND\n",
        stderr: "LibClamAV Warning: *** The virus database is older than 7 days! ***\n",
      };
    };
    // A future window keeps the real /tmp out of the targets.
    const r = await antivirusPass(runner, {
      home: dir,
      inventory: inv(),
      flagged: ["/etc/hosts"],
      sinceMs: Date.now() + 1e10,
      listDir: dir,
      now: NOW,
      folders: [],
    });
    expect(r.findings.map((f) => [f.severity, f.title])).toEqual([["compromised", "ClamAV detects Win.Trojan.Agent in /x/evil.app"]]);
    expect(r.gaps.map((g) => g.why)).toEqual(["ClamAV's signatures are 213 days old", expect.stringContaining("the pass is targeted")]);
    expect(calls.at(-1)?.[0]).toBe("clamscan");
    expect(calls.at(-1)).toContain("--infected");
  });

  it.skipIf(process.getuid?.() === 0)("names the targets this user cannot read instead of an empty error, and never scans them", async () => {
    const dir = tmp("ug-avr-");
    const locked = join(dir, "root-only.sock");
    writeFileSync(locked, "x");
    chmodSync(locked, 0o000);
    const fine = join(dir, "fine.txt");
    writeFileSync(fine, "y");
    expect(readableTargets([locked, fine, join(dir, "gone")])).toEqual({ readable: [fine, join(dir, "gone")], unreadable: [locked] });
    const calls: string[][] = [];
    const runner = async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args]);
      if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "" };
      if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/28181/Thu Nov 12 07:27:14 2026", stderr: "" };
      return { ok: true, status: 0, stdout: "", stderr: "" };
    };
    const r = await antivirusPass(runner, { home: dir, inventory: inv(), flagged: [], sinceMs: 0, listDir: dir, now: NOW, full: [locked, fine] });
    expect(r.gaps).toEqual([
      {
        surface: "host",
        what: `1 antivirus target(s): ${locked}`,
        why: "this user cannot read them (owned by root or another user)",
        fix: `sudo clamscan "${locked}"`,
      },
    ]);
    chmodSync(locked, 0o600);
  });

  it("a clamscan error printed on stdout (--stdout) is a named gap, and status 2 alone still says why", async () => {
    const dir = tmp("ug-ave-");
    const res = (stdout: string) => async (cmd: string, args: string[]) => {
      if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "" };
      if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/28181/Thu Nov 12 07:27:14 2026", stderr: "" };
      return { ok: false, status: 2, stdout, stderr: "" };
    };
    const a = await antivirusPass(res("/x/y: Access denied. ERROR\n"), {
      home: dir,
      inventory: inv(),
      flagged: [],
      sinceMs: 0,
      listDir: dir,
      now: NOW,
      full: ["/x"],
    });
    expect(a.gaps.map((g) => g.why)).toEqual(["clamscan could not read them: /x/y: Access denied. ERROR"]);
    const b = await antivirusPass(res(""), { home: dir, inventory: inv(), flagged: [], sinceMs: 0, listDir: dir, now: NOW, full: ["/x"] });
    expect(b.gaps.map((g) => g.why)).toEqual(["clamscan could not read them: it exited with status 2 without naming the file"]);
  });

  it("lists a file once when two paths lead to it (/tmp is /private/tmp on macOS)", () => {
    const home = tmp("ug-avl-");
    mkdirSync(join(home, "real"), { recursive: true });
    writeFileSync(join(home, "real", "a.sh"), "x");
    symlinkSync(join(home, "real"), join(home, "link"));
    expect(avTargets(home, inv(), [join(home, "real", "a.sh"), join(home, "link", "a.sh")], Date.now() + 1e10, { folders: [] })).toEqual([
      join(home, "real", "a.sh"),
    ]);
  });

  it("is a gap, never a clean bill, when ClamAV is missing", async () => {
    const none = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
    const r = await antivirusPass(none, { home: tmp(), inventory: inv(), flagged: [], sinceMs: 0, listDir: tmp(), now: NOW });
    expect(r.gaps[0]?.why).toBe("ClamAV is not installed");
  });

  it("targets startup programs, flagged files and recent downloads, existing ones only", () => {
    const home = tmp("ug-avt-");
    mkdirSync(join(home, "Downloads"), { recursive: true });
    writeFileSync(join(home, "Downloads", "setup.pkg"), "x");
    writeFileSync(join(home, "agent"), "x");
    const t = avTargets(
      home,
      inv({ startupItems: [{ path: join(home, "agent"), mtime: "", command: "", executable: "/nope", exists: false, signals: [] }] }),
      [join(home, "agent")],
      0,
      { folders: [join(home, "Downloads")] },
    );
    expect(t).toContain(join(home, "Downloads", "setup.pkg"));
    expect(t).toContain(join(home, "agent"));
    expect(t).not.toContain("/nope");
  });
});

describe("yara", () => {
  it("finds rule files and parses matches, never reporting the rule file itself", async () => {
    const dir = tmp("ug-yara-");
    writeFileSync(join(dir, "a.yar"), "rule A { condition: true }");
    writeFileSync(join(dir, "notes.txt"), "");
    expect(yaraRuleFiles(dir)).toEqual([join(dir, "a.yar")]);
    expect(parseYaraOutput("Rule_X /p/q.js\nwarning: slow\n")).toEqual([{ rule: "Rule_X", path: "/p/q.js" }]);
    const runner = async () => ({ ok: true, status: 0, stdout: `A /p/evil.js\nA ${join(dir, "a.yar")}\n`, stderr: "" });
    const r = await yaraPass(runner, { rules: dir, targets: ["/p"], listDir: dir, source: "S2" });
    expect(r.findings.map((f) => [f.title, f.source])).toEqual([["YARA rule A matches /p/evil.js", "S2"]]);
  });
});

describe("community rules", () => {
  const line =
    'RUSSIANPANDA_Supperbackdoor [description="Detects Supper backdoor",author="RussianPanda",reference="https://x/y?a=1,b",score =75,quality =85,tags=""] /p/update.bin';
  it("reads yara's metadata line, integers printed as `score =75`", () => {
    expect(parseYaraOutput(line)).toEqual([{ rule: "RUSSIANPANDA_Supperbackdoor", path: "/p/update.bin", score: 75, description: "Detects Supper backdoor" }]);
  });

  it("a community rule at the default score is a compromise, a hunting rule only suspicious, and both cite the rule set", async () => {
    const dir = tmp("ug-comm-");
    const out = `${line}\nHUNT_Generic_Thing [description="hunting",score =60] /p/other.js\n`;
    const calls: string[][] = [];
    const runner = async (_cmd: string, args: string[]) => {
      calls.push(args);
      return { ok: true, status: 0, stdout: out, stderr: "error scanning /x: could not open file\n" };
    };
    const r = await yaraPass(runner, {
      rules: join(dir, "core.yarc"),
      compiled: true,
      community: true,
      label: "YARA-Forge core",
      targets: ["/p"],
      listDir: dir,
      source: "S3",
    });
    expect(r.findings.map((f) => [f.severity, f.source])).toEqual([
      ["compromised", "S3"],
      ["suspicious", "S3"],
    ]);
    expect(r.findings[0]?.title).toBe("YARA-Forge core rule RUSSIANPANDA_Supperbackdoor matches /p/update.bin (score 75): Detects Supper backdoor");
    expect(calls[0]).toContain("-C");
    expect(r.gaps.map((g) => g.what)).toEqual(["1 YARA-Forge core target(s)"]);
  });

  it("scans a file whose name holds a line break on its own, outside the list", async () => {
    const dir = tmp("ug-nl-");
    const calls: string[][] = [];
    const runner = async (_cmd: string, args: string[]) => {
      calls.push(args);
      return { ok: true, status: 0, stdout: "", stderr: "" };
    };
    await yaraPass(runner, { rules: join(dir, "r.yarc"), compiled: true, targets: ["/ok", "/bad\nname"], listDir: dir });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.at(-1)).toBe("/bad\nname");
  });
});

describe("antivirus and yara regressions", () => {
  const clam = (scan: { ok: boolean; status: number; stdout: string; stderr: string }) => {
    const calls: string[][] = [];
    const runner = async (cmd: string, args: string[]) => {
      calls.push([cmd, ...args]);
      if (cmd === "clamdscan") return { ok: false, status: 2, stdout: "", stderr: "" };
      if (args[0] === "--version") return { ok: true, status: 0, stdout: "ClamAV 1.5.4/28181/Thu Nov 12 07:27:14 2026", stderr: "" };
      return scan;
    };
    return { runner, calls };
  };

  it("targeted yara is recursive: a new extension's code is in out/ or dist/ (machine-16)", async () => {
    const dir = tmp("ug-yrec-");
    const calls: string[][] = [];
    await yaraPass(
      async (_c, args) => {
        calls.push(args);
        return { ok: true, status: 0, stdout: "", stderr: "" };
      },
      { rules: join(dir, "r.yarc"), compiled: true, targets: ["/ext"], listDir: dir },
    );
    expect(calls[0]).toContain("--recursive");
  });

  it("a scanner killed or timed out after some output leaves a gap (machine-17)", async () => {
    const dir = tmp("ug-ykill-");
    const y = await yaraPass(async () => ({ ok: false, status: 124, stdout: "SomeRule [score=60] /Users/x/a.bin", stderr: "timed out after 10800000ms" }), {
      rules: join(dir, "r.yarc"),
      compiled: true,
      targets: ["/x"],
      listDir: dir,
    });
    expect(y.findings).toHaveLength(1);
    expect(y.gaps.map((g) => g.why)).toEqual(["yara did not finish (exit 124): timed out after 10800000ms"]);
    const killed = await yaraPass(async () => ({ ok: false, status: 1, stdout: "", stderr: "" }), {
      rules: join(dir, "r.yarc"),
      compiled: true,
      targets: ["/x"],
      listDir: dir,
    });
    expect(killed.gaps.map((g) => g.what)).toEqual(["part of the YARA pass"]);
    const { runner } = clam({ ok: false, status: 1, stdout: "", stderr: "" });
    const c = await antivirusPass(runner, { home: dir, inventory: inv(), flagged: [], sinceMs: 0, listDir: dir, now: NOW, full: ["/x"] });
    expect(c.gaps.map((g) => g.what)).toEqual(["part of the antivirus pass"]);
  });

  it("files over ClamAV's size limits are a gap, not silence and not a detection (machine-18)", async () => {
    const dir = tmp("ug-big-");
    const { runner, calls } = clam({ ok: false, status: 1, stdout: "/d/big.zip: Heuristics.Limits.Exceeded.MaxFileSize FOUND\n", stderr: "" });
    const r = await antivirusPass(runner, { home: dir, inventory: inv(), flagged: [join(dir)], sinceMs: 0, listDir: dir, now: NOW, folders: [] });
    expect(r.findings).toEqual([]);
    expect(r.gaps[0]?.what).toBe("1 file(s) over ClamAV's size limits: /d/big.zip");
    expect(calls.at(-1)).toContain("--alert-exceeds-max=yes");
    expect(calls.at(-1)).toContain("--max-filesize=2000M");
  });

  it("Downloads comes before temp folders, /tmp counts once, and caps are named (machine-19, machine-30)", () => {
    const home = tmp("ug-ord-");
    const t1 = join(home, "t1");
    mkdirSync(join(home, "Downloads"), { recursive: true });
    mkdirSync(t1, { recursive: true });
    for (let i = 0; i < 2100; i++) writeFileSync(join(t1, `f${i}`), "x");
    writeFileSync(join(home, "Downloads", "zzz-dropper.bin"), "x");
    mkdirSync(join(home, "Downloads/a/b/c/d"), { recursive: true });
    symlinkSync(t1, join(home, "t2"));
    const r = avTargetList(home, inv(), [], 0, { folders: [join(home, "Downloads"), t1, join(home, "t2")] });
    expect(r.targets[0]).toBe(join(home, "Downloads", "zzz-dropper.bin"));
    expect(r.targets).toHaveLength(2001);
    expect(r.truncated).toEqual([`1 folder(s) in ${join(home, "Downloads")} deeper than 3 levels`, `recent files in ${t1} past the first 2000`]);
    expect(dropFolders(home)).toContain(tmpdir());
  });

  it("a ClamAV that could not load its database says the pass did not run (machine-25)", async () => {
    const dir = tmp("ug-nodb-");
    const { runner } = clam({
      ok: false,
      status: 2,
      stdout: "",
      stderr: "LibClamAV Error: cli_loaddbdir: No supported database files found in /opt/homebrew/var/lib/clamav\nERROR: Can't open file or directory\n",
    });
    const r = await antivirusPass(runner, { home: dir, inventory: inv(), flagged: [dir], sinceMs: 0, listDir: dir, now: NOW, folders: [] });
    expect(r.gaps.map((g) => g.what)).toEqual(["the antivirus pass did not run"]);
    expect(r.stats.avTargets).toBe(0);
  });

  it("the run and state folders are never targets nor findings (machine-5, e2e-8)", async () => {
    const home = tmp("ug-excl-");
    const run = join(home, "Downloads/ug-run");
    mkdirSync(join(run, "sources"), { recursive: true });
    writeFileSync(join(run, "sources/S1.md"), "x");
    writeFileSync(join(home, "Downloads/real.bin"), "x");
    expect(avTargets(home, inv(), [], 0, { exclude: [run], folders: [join(home, "Downloads")] })).toEqual([join(home, "Downloads/real.bin")]);
    const { runner } = clam({ ok: false, status: 1, stdout: `${run}/sources/S1.md: Win.Test FOUND\n${home}/Downloads/real.bin: Win.Test FOUND\n`, stderr: "" });
    const r = await antivirusPass(runner, {
      home,
      inventory: inv(),
      flagged: [],
      sinceMs: 0,
      listDir: run,
      now: NOW,
      exclude: [run],
      folders: [join(home, "Downloads")],
    });
    expect(r.findings.map((f) => f.subject)).toEqual([join(home, "Downloads/real.bin")]);
    const y = await yaraPass(async () => ({ ok: true, status: 0, stdout: `R ${run}/iocs.json\nR ${home}/Downloads/real.bin\n`, stderr: "" }), {
      rules: join(run, "r.yarc"),
      compiled: true,
      targets: [home],
      listDir: run,
      exclude: [run],
    });
    expect(y.findings.map((f) => f.subject)).toEqual([join(home, "Downloads/real.bin")]);
  });
});
