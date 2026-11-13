import { mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { doctor } from "../src/doctor.js";
import type { Runner } from "../src/runner.js";
import { scanHost } from "../src/scan/host.js";
import { walk } from "../src/scan/walk.js";
import {
  detectXProtect,
  hardeningFindings,
  parseXProtectVersion,
  remediatorFindings,
  XPR_PREDICATE,
  xprOutcome,
  xprotectSource,
  xprotectYara,
} from "../src/scan/xprotect.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
type Res = { ok: boolean; status: number; stdout: string; stderr: string; missing?: boolean };
const ok = (stdout: string): Res => ({ ok: true, status: 0, stdout, stderr: "" });
const missing: Res = { ok: false, status: 127, stdout: "", stderr: "", missing: true };

/** A runner answering by command line prefix ("spctl --status"); anything else is not installed. */
function machine(table: Record<string, Res | ((args: string[]) => Res)>): Runner & { calls: string[][] } {
  const calls: string[][] = [];
  const r = (async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    const line = [cmd, ...args].join(" ");
    const key = Object.keys(table)
      .sort((a, b) => b.length - a.length)
      .find((k) => line.startsWith(k));
    const v = key ? table[key] : undefined;
    return (typeof v === "function" ? v(args) : v) ?? missing;
  }) as Runner & { calls: string[][] };
  r.calls = calls;
  return r;
}

function bundle(version = "5372", ruleDate?: Date) {
  const b = join(tmp("ug-xpb-"), "XProtect.bundle");
  mkdirSync(join(b, "Contents/Resources"), { recursive: true });
  writeFileSync(
    join(b, "Contents/Info.plist"),
    `<?xml version="1.0"?><plist><dict><key>CFBundleShortVersionString</key><string>${version}</string></dict></plist>`,
  );
  writeFileSync(join(b, "Contents/Resources/XProtect.yara"), "rule MACOS_AMOS { condition: true }");
  writeFileSync(join(b, "Contents/Resources/XPScripts.yr"), "rule S { condition: true }");
  if (ruleDate) utimesSync(join(b, "Contents/Resources/XProtect.yara"), ruleDate, ruleDate);
  return b;
}

const event = (family: string, msg: Record<string, unknown>, ts = "2026-11-10 03:27:22.104878+0100") =>
  JSON.stringify({
    subsystem: "com.apple.XProtectFramework.PluginAPI",
    processImagePath: `/Library/Apple/System/Library/CoreServices/XProtect.app/Contents/MacOS/XProtectRemediator${family}`,
    timestamp: ts,
    eventMessage: JSON.stringify(msg),
  });

describe("XProtect rules", () => {
  it("reads the version and install date from `xprotect version`, else from the bundle", async () => {
    expect(parseXProtectVersion("Version: 5372 Installed: 2026-11-10 22:35:13 +0000\n")).toEqual({ version: "5372", installed: "2026-11-10T22:35:13.000Z" });
    const b = bundle("5300", new Date("2026-09-01T00:00:00Z"));
    const fromBundle = await detectXProtect(machine({}), { bundle: b, now: NOW });
    expect(fromBundle).toMatchObject({ version: "5300", installed: "2026-09-01T00:00:00.000Z", ageDays: 72 });
    expect(fromBundle.rules.map((r) => r.split("/").pop())).toEqual(["XProtect.yara", "XPScripts.yr"]);
    const fromTool = await detectXProtect(machine({ "xprotect version": ok("Version: 5372 Installed: 2026-11-10 22:35:13 +0000") }), { bundle: b, now: NOW });
    expect(fromTool).toMatchObject({ version: "5372", ageDays: 1 });
    expect((await detectXProtect(machine({}), { bundle: join(b, "nope") })).missing).toContain("no XProtect bundle");
    expect(xprotectSource(fromTool)).toMatchObject({ url: `file://${b}#5372`, origin: "rules", title: expect.stringContaining("Apple XProtect 5372") });
  });

  it("runs both rule files over the targets: a match is compromised and cites the rule set; a rule file yara cannot compile and stale rules are gaps", async () => {
    const b = bundle("5300", new Date("2026-09-01T00:00:00Z"));
    const info = { ...(await detectXProtect(machine({}), { bundle: b, now: NOW })), sourceId: "S2" };
    const runner = machine({
      yara: (args) => {
        const rules = args.find((a) => /XProtect\.yara|XPScripts\.yr/.test(a)) ?? "";
        if (rules.endsWith("XPScripts.yr")) return { ok: false, status: 1, stdout: "", stderr: `${rules}(12): error: syntax error, unexpected identifier` };
        return ok("MACOS_AMOS [] /tmp/x/.agent\n");
      },
    });
    const r = await xprotectYara(runner, info, { targets: ["/tmp/x/.agent"], listDir: tmp("ug-xpl-") });
    expect(r.findings.map((f) => [f.severity, f.source, f.title])).toEqual([
      ["compromised", "S2", "Apple XProtect 5300 rule MACOS_AMOS matches /tmp/x/.agent"],
    ]);
    expect(r.gaps.map((g) => g.why)).toEqual([
      "macOS stopped updating XProtect: version 5300 is 72 days old",
      expect.stringMatching(/^yara failed: .*XPScripts\.yr\(12\): error: syntax error/),
    ]);
    expect(r.gaps[1]?.what).toBe("the Apple XProtect 5300 (XPScripts) pass");
    expect(r.stats).toMatchObject({ xprotectRules: 1, xprotectMatches: 1 });
    // No yara: a gap, never silence.
    const none = await xprotectYara(machine({}), info, { targets: ["/a"], listDir: tmp("ug-xpl-") });
    expect(none.gaps.map((g) => g.why)).toContain("yara is not installed");
  });
});

describe("XProtect Remediator reports", () => {
  it("turns threats into findings, says whether Apple removed them, and counts the clean scans", async () => {
    const out = [
      event("Pirrit", { status_message: "NoThreatDetected", status_code: 20, caused_by: [] }),
      event("RankStank", { status_message: "Success", status_code: 0, caused_by: [] }),
      event("Adload", { status_message: "ThreatDetected", status_code: 30, caused_by: ["/Users/me/Library/Application Support/.adl/agent"] }),
      event(
        "Adload",
        { status_message: "ThreatDetected", status_code: 30, caused_by: ["/Users/me/Library/Application Support/.adl/agent"] },
        "2026-11-11 09:00:00.5+0000",
      ),
      event("KeySteal", { status_message: "ThreatRemediated", status_code: 31, caused_by: [{ path: "/Library/LaunchDaemons/com.x.plist" }] }),
      event("SnowDrift", { status_message: "RemediationFailed", status_code: 40, caused_by: [] }),
      event("BlueTop", { status_message: "PluginTimedOut", status_code: 50 }),
      "not json",
      JSON.stringify({ count: 7, finished: 1 }),
    ].join("\n");
    const runner = machine({ "/usr/bin/log show": ok(out) });
    const r = await remediatorFindings(runner);
    expect(runner.calls[0]).toEqual(["/usr/bin/log", "show", "--style", "ndjson", "--last", "30d", "--predicate", XPR_PREDICATE]);
    expect(r.findings.map((f) => [f.severity, f.title])).toEqual([
      [
        "compromised",
        "XProtect Remediator detected Adload (no removal reported) on 2026-11-11 09:00 UTC (2 reports): /Users/me/Library/Application Support/.adl/agent; status ThreatDetected (30)",
      ],
      [
        "compromised",
        'XProtect Remediator found KeySteal and removed it (Apple remediated it) on 2026-11-10 02:27 UTC: {"path":"/Library/LaunchDaemons/com.x.plist"}; status ThreatRemediated (31)',
      ],
      ["compromised", "XProtect Remediator found SnowDrift and failed to remove it on 2026-11-10 02:27 UTC; status RemediationFailed (40)"],
      ["suspicious", 'XProtect Remediator reported "PluginTimedOut" while scanning for BlueTop on 2026-11-10 02:27 UTC; status PluginTimedOut (50)'],
    ]);
    expect(r.findings[0]?.subject).toBe("/Users/me/Library/Application Support/.adl/agent");
    expect(r.stats).toEqual({ xprScans: 7, xprReports: 4 });
    expect(r.gaps).toEqual([]);
    expect(["ThreatNotRemediated", "RemediationSucceeded", "MalwareFound", "Error"].map(xprOutcome)).toEqual(["failed", "remediated", "detected", "other"]);
  });

  it("an unreadable log, a cut-off log and thirty days without a scan are gaps", async () => {
    const denied = await remediatorFindings(
      machine({ "/usr/bin/log": { ok: false, status: 1, stdout: "", stderr: "log: Must be admin to run 'show' command\n" } }),
    );
    expect(denied.gaps.map((g) => [g.why, g.fix?.startsWith("sudo /usr/bin/log show --style ndjson --last 30d")])).toEqual([
      ["the unified log could not be read: log: Must be admin to run 'show' command", true],
    ]);
    expect((await remediatorFindings(machine({}))).gaps[0]?.why).toBe("/usr/bin/log is not available");
    const quiet = await remediatorFindings(machine({ "/usr/bin/log": ok(`${JSON.stringify({ count: 0, finished: 1 })}\n`) }));
    expect(quiet.gaps.map((g) => g.what)).toEqual(["XProtect Remediator's scans"]);
    const cut = await remediatorFindings(machine({ "/usr/bin/log": ok(`${event("Pirrit", { status_message: "NoThreatDetected" })}\n`) }));
    expect(cut.gaps.map((g) => g.what)).toEqual(["part of XProtect Remediator's reports"]);
  });
});

describe("hardening", () => {
  it("Gatekeeper, SIP and automatic security updates off are suspicious, FileVault off is info, real-time tools are recorded", async () => {
    const apps = tmp("ug-rt-");
    mkdirSync(join(apps, "LuLu.app"));
    const off = (k: string) => ok(`${k === "CriticalUpdateInstall" ? "false" : "0"}\n`);
    const r = await hardeningFindings(
      machine({
        "spctl --status": { ok: false, status: 1, stdout: "assessments disabled\n", stderr: "" },
        "csrutil status": ok("System Integrity Protection status: disabled.\n"),
        "fdesetup status": ok("FileVault is Off.\n"),
        "plutil -extract CriticalUpdateInstall": off("CriticalUpdateInstall"),
        "plutil -extract ConfigDataInstall": off("ConfigDataInstall"),
      }),
      { appDirs: [apps] },
    );
    expect(r.findings.map((f) => [f.severity, f.subject])).toEqual([
      ["suspicious", "Gatekeeper"],
      ["suspicious", "System Integrity Protection"],
      ["info", "FileVault"],
      ["suspicious", "Software Update"],
      ["suspicious", "Software Update"],
    ]);
    expect(new Set(r.findings.map((f) => f.key)).size).toBe(5);
    expect(r.gaps).toEqual([]);
    expect(r.hardening).toEqual({
      gatekeeper: "disabled",
      sip: "disabled",
      filevault: "off",
      criticalUpdateInstall: "false",
      configDataInstall: "0",
      realtimeTools: ["LuLu"],
    });
  });

  it("all on says nothing; an absent update key is the default (on); a tool that cannot answer is a gap", async () => {
    const noKey: Res = { ok: false, status: 1, stdout: "", stderr: "Could not extract value, error: No value at that key path or invalid key path: X" };
    const fine = await hardeningFindings(
      machine({
        "spctl --status": ok("assessments enabled\n"),
        "csrutil status": ok("System Integrity Protection status: enabled.\n"),
        "fdesetup status": ok("FileVault is On.\n"),
        "plutil -extract": noKey,
      }),
      { appDirs: [] },
    );
    expect([fine.findings, fine.gaps]).toEqual([[], []]);
    expect(fine.hardening).toMatchObject({ criticalUpdateInstall: "default", configDataInstall: "default" });
    const blind = await hardeningFindings(machine({}), { appDirs: [] });
    expect(blind.findings).toEqual([]);
    expect(blind.gaps.map((g) => g.what)).toEqual([
      "Gatekeeper status",
      "System Integrity Protection status",
      "FileVault status",
      "whether Install Security Responses and system files is on",
      "whether automatic security data updates (XProtect's rules) is on",
    ]);
  });
});

describe("scan host on macOS", () => {
  it("runs XProtect's rules, reads XPR and the hardening, and records them in the inventory", async () => {
    const home = tmp("ug-xph-");
    const b = bundle("5372", new Date("2026-11-10T00:00:00Z"));
    const info = { ...(await detectXProtect(machine({}), { bundle: b, now: NOW })), sourceId: "S9" };
    const dl = join(home, "Downloads");
    mkdirSync(dl, { recursive: true });
    writeFileSync(join(dl, "Installer.dmg"), "x");
    const runner = machine({
      yara: (args) => {
        if (!args.some((a) => a.endsWith("XProtect.yara"))) return ok("");
        const list = readFileSync(args.at(-1) as string, "utf8")
          .split("\n")
          .filter(Boolean);
        return ok(list.map((p) => `MACOS_AMOS [] ${p}`).join("\n"));
      },
      "/usr/bin/log": ok(`${event("Pirrit", { status_message: "NoThreatDetected" })}\n{"finished":1}\n`),
      "spctl --status": ok("assessments enabled"),
      "csrutil status": ok("System Integrity Protection status: enabled."),
      "fdesetup status": ok("FileVault is On."),
    });
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "none")]), runner, {
      home,
      platform: "darwin",
      startupDirs: [],
      dropDirs: [dl],
      appDirs: [],
      av: "off",
      listDir: tmp("ug-xpl-"),
      xprotect: info,
      now: NOW,
    });
    expect(r.findings.filter((f) => f.source === "S9").map((f) => f.subject)).toEqual([join(dl, "Installer.dmg")]);
    expect(r.result.stats).toMatchObject({ xprotectMatches: 1, xprScans: 1 });
    expect(r.inventory.macos).toMatchObject({ xprotect: { version: "5372" }, hardening: { gatekeeper: "enabled", sip: "enabled", filevault: "on" } });
    // Skipping live checks skips all of it, and says so.
    const skipped = await scanHost(AIKIDO_IOCS, walk([join(home, "none")]), runner, {
      home,
      platform: "darwin",
      startupDirs: [],
      dropDirs: [],
      skipLive: true,
      now: NOW,
    });
    expect(skipped.inventory.macos).toBeUndefined();
    expect(skipped.gaps.find((g) => g.why === "live checks were skipped")?.what).toContain("XProtect");
  });

  it("doctor prints XProtect's version and the hardening", async () => {
    const b = bundle("5372", new Date("2026-11-10T00:00:00Z"));
    const lines = await doctor(
      machine({
        "xprotect version": ok("Version: 5372 Installed: 2026-11-10 22:35:13 +0000"),
        "spctl --status": ok("assessments disabled"),
        "csrutil status": ok("System Integrity Protection status: enabled."),
        "fdesetup status": ok("FileVault is On."),
      }),
      { platform: "darwin", xprotectBundle: b, appDirs: [], now: NOW },
    );
    const by = Object.fromEntries(lines.map((l) => [l.check, l]));
    expect(by.xprotect).toMatchObject({ ok: true, detail: expect.stringContaining("XProtect 5372, installed 2026-11-10 (1 days old); 2 rule file(s)") });
    expect(by.gatekeeper).toMatchObject({ ok: false, detail: "disabled", fix: "sudo spctl --global-enable" });
    expect(by.sip?.ok).toBe(true);
    expect(by["security updates"]).toMatchObject({ ok: true });
    expect((await doctor(machine({}), { platform: "linux" })).some((l) => l.check === "xprotect")).toBe(false);
  });
});
