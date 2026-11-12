import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main, setRulesDeps, setRunner } from "../src/cli.js";
import { freshclamSummary, refreshDefenses, updateClamav, updateYaraForge } from "../src/defenses.js";
import { defaultRulesDeps, installedRules, type RulesDeps } from "../src/rules.js";
import { defaultRunner, type Runner } from "../src/runner.js";
import { aikidoRun, tmp } from "./helpers.js";

const NOW = new Date("2026-11-13T12:00:00Z");
const OLD = "ClamAV 1.5.4/27970/Mon Apr 13 08:24:33 2026";
const NEW = "ClamAV 1.5.4/28181/Thu Nov 12 07:27:14 2026";

// Recorded from a real freshclam run: the X509 errors are noise it recovers from.
const FRESHCLAM_OK = `ERROR: NULL X509 store
WARNING: Incremental update failed, trying to download daily.cvd
Testing database: '/opt/homebrew/var/lib/clamav/tmp.7b05267d40/daily.cvd' ...
Database test passed.
daily.cvd updated (version: 28181, sigs: 355854, f-level: 90, builder: svc.clamav-publisher)
main.cvd database is up-to-date (version: 63, sigs: 3287027, f-level: 90, builder: tomjudge)
bytecode.cvd database is up-to-date (version: 339, sigs: 80, f-level: 90, builder: nrandolp)
`;

const ok = (stdout = "") => ({ ok: true, status: 0, stdout, stderr: "" });
const fail = (stdout = "", status = 1) => ({ ok: false, status, stdout, stderr: "" });
const missing = () => ({ ok: false, status: 127, stdout: "", stderr: "", missing: true });

/** A fake machine: clamscan whose signatures freshclam renews, yara, unzip that unpacks one rule. */
function machine(opts: { sigs?: string; freshclam?: ReturnType<typeof ok>; yara?: boolean } = {}) {
  let version = opts.sigs ?? OLD;
  const calls: string[] = [];
  const runner: Runner = async (cmd, args) => {
    calls.push(cmd);
    if (cmd === "clamdscan") return fail();
    if (cmd === "clamscan") return ok(version);
    if (cmd === "freshclam") {
      const r = opts.freshclam ?? ok(FRESHCLAM_OK);
      if (r.ok) version = NEW;
      return r;
    }
    if (cmd === "yara") return opts.yara === false ? missing() : ok("4.5.5");
    if (cmd === "unzip") {
      const dir = args[args.indexOf("-d") + 1] as string;
      mkdirSync(join(dir, "packages", "core"), { recursive: true });
      writeFileSync(join(dir, "packages", "core", "yara-rules-core.yar"), "rule A { condition: true }\nrule B { condition: false }\n");
      return ok();
    }
    if (cmd === "yarac") return fail();
    return missing();
  };
  return { runner, calls };
}

const deps: RulesDeps = {
  latest: async () => ({ tag: "20261108", assets: [{ name: "yara-forge-rules-core.zip", url: "https://example.test/core.zip" }] }),
  download: async () => Buffer.from("PK"),
};

describe("freshclam", () => {
  it("keeps the database summary lines, without the builder", () => {
    expect(freshclamSummary(FRESHCLAM_OK)).toEqual([
      "daily.cvd updated (version: 28181, sigs: 355854, f-level: 90)",
      "main.cvd database is up-to-date (version: 63, sigs: 3287027, f-level: 90)",
      "bytecode.cvd database is up-to-date (version: 339, sigs: 80, f-level: 90)",
    ]);
  });

  it("refreshes stale signatures and reports their new date", async () => {
    const m = machine();
    const r = await updateClamav(m.runner, { now: NOW });
    expect(r.status).toBe("updated");
    expect(r.detail).toMatch(/^signatures of 2026-11-12: daily\.cvd updated/);
    expect(m.calls).toContain("freshclam");
  });

  it("leaves fresh signatures alone, unless forced", async () => {
    const m = machine({ sigs: NEW });
    expect((await updateClamav(m.runner, { now: NOW })).status).toBe("current");
    expect(m.calls).not.toContain("freshclam");
    expect((await updateClamav(m.runner, { now: NOW, force: true })).status).toBe("updated");
  });

  it("says why freshclam failed, past the errors it recovers from, and hints at the Linux service", async () => {
    const m = machine({
      freshclam: fail("ERROR: NULL X509 store\nERROR: Failed to lock the log file /var/log/clamav/freshclam.log: Resource temporarily unavailable\n"),
    });
    const r = await updateClamav(m.runner, { now: NOW });
    expect(r.status).toBe("failed");
    expect(r.detail).toContain("Failed to lock the log file");
    expect(r.detail).not.toContain("X509");
    expect(r.detail).toContain("systemctl restart clamav-freshclam");
  });

  it("skips a machine without ClamAV", async () => {
    const runner: Runner = async () => missing();
    expect((await updateClamav(runner, { now: NOW })).status).toBe("skipped");
  });
});

describe("YARA-Forge refresh", () => {
  it("installs the rules when none are there", async () => {
    const state = tmp("ug-def-");
    const m = machine();
    const r = await updateYaraForge(state, m.runner, { deps, now: NOW });
    expect(r).toEqual({ engine: "yara-forge", status: "updated", detail: "core 20261108: 2 rules, not compiled (install yarac for faster scans)" });
    expect(installedRules(state)?.rules).toBe(2);
    // Fresh now: a second scan does not download again.
    expect((await updateYaraForge(state, m.runner, { deps, now: NOW })).status).toBe("current");
    // A week later it does.
    expect((await updateYaraForge(state, m.runner, { deps, now: new Date("2026-11-21T12:00:00Z") })).status).toBe("updated");
  });

  it("skips without yara, and reports a failed download", async () => {
    const state = tmp("ug-def-");
    expect((await updateYaraForge(state, machine({ yara: false }).runner, { deps, now: NOW })).status).toBe("skipped");
    const broken: RulesDeps = { ...deps, download: async () => Promise.reject(new Error("download failed: HTTP 503")) };
    expect(await updateYaraForge(state, machine().runner, { deps: broken, now: NOW })).toEqual({
      engine: "yara-forge",
      status: "failed",
      detail: "download failed: HTTP 503",
    });
  });

  it("refreshDefenses honours --no-av and --no-rules", async () => {
    const state = tmp("ug-def-");
    const m = machine();
    expect((await refreshDefenses(state, m.runner, { clamav: false, yaraForge: false, deps, now: NOW })).length).toBe(0);
    expect(m.calls).toEqual([]);
    expect((await refreshDefenses(state, m.runner, { yaraForge: false, deps, now: NOW })).map((u) => u.engine)).toEqual(["clamav"]);
  });
});

describe("rules update", () => {
  afterEach(() => {
    setRunner(defaultRunner);
    setRulesDeps(defaultRulesDeps);
  });

  it("runs freshclam and fetches YARA-Forge, even when both are fresh", async () => {
    const state = tmp("ug-def-");
    const m = machine({ sigs: NEW });
    setRunner(m.runner);
    setRulesDeps(deps);
    expect(await main(["rules", "update", "--state", state])).toBe(0);
    expect(m.calls).toContain("freshclam");
    expect(installedRules(state)?.tag).toBe("20261108");
  });

  it("scan host refreshes stale signatures before scanning, unless --no-update", async () => {
    const state = tmp("ug-def-");
    setRulesDeps(deps);
    const m = machine();
    setRunner(m.runner);
    const run = aikidoRun();
    expect(await main(["scan", "host", "--out", run.dir, "--roots", tmp(), "--state", state, "--no-rules"])).toBe(0);
    expect(m.calls.indexOf("freshclam")).toBeGreaterThan(-1);
    expect(m.calls.indexOf("freshclam")).toBeLessThan(m.calls.lastIndexOf("clamscan"));
    // Fresh signatures: no stale-signature gap left in the run.
    expect(run.gaps().some((g) => /signatures are \d+ days old/.test(g.why))).toBe(false);
    const n = machine();
    setRunner(n.runner);
    expect(await main(["scan", "host", "--out", run.dir, "--roots", tmp(), "--state", state, "--no-rules", "--no-update"])).toBe(0);
    expect(n.calls).not.toContain("freshclam");
    expect(run.gaps().some((g) => /signatures are \d+ days old/.test(g.why))).toBe(true);
  });

  it("fails when a refresh failed", async () => {
    const state = tmp("ug-def-");
    setRunner(machine({ freshclam: fail("ERROR: Can't connect to database.clamav.net\n") }).runner);
    setRulesDeps(deps);
    expect(await main(["rules", "update", "--state", state])).toBe(1);
  });
});
