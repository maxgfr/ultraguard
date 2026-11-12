import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { antivirusPass, avTargets, parseClamOutput, parseClamVersion, parseYaraOutput, yaraPass, yaraRuleFiles } from "../src/scan/antivirus.js";
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
    const r = await antivirusPass(runner, { home: dir, inventory: inv(), flagged: ["/etc/hosts"], sinceMs: 0, listDir: dir, now: NOW });
    expect(r.findings.map((f) => [f.severity, f.title])).toEqual([["compromised", "ClamAV detects Win.Trojan.Agent in /x/evil.app"]]);
    expect(r.gaps.map((g) => g.why)).toEqual(["ClamAV's signatures are 213 days old", expect.stringContaining("the pass is targeted")]);
    expect(calls.at(-1)?.[0]).toBe("clamscan");
    expect(calls.at(-1)).toContain("--infected");
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
