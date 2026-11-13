import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { main, setRulesDeps, setRunner } from "../src/cli.js";
import { freshclamSummary, refreshDefenses, updateAdvisoryFeeds, updateClamav, updateYaraForge } from "../src/defenses.js";
import { defaultRulesDeps, installedRules, type RulesDeps } from "../src/rules.js";
import { defaultRunner, type Runner } from "../src/runner.js";
import { FEED_FILES, feedDir, localFeeds } from "../src/scan/deps.js";
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

/** What the CLI prints, captured. */
function captureOut(): string[] {
  const out: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((t) => {
    out.push(String(t));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  return out;
}

const ok = (stdout = "") => ({ ok: true, status: 0, stdout, stderr: "" });
const fail = (stdout = "", status = 1) => ({ ok: false, status, stdout, stderr: "" });
const missing = () => ({ ok: false, status: 127, stdout: "", stderr: "", missing: true });

const N = FEED_FILES.length;

/** package-checker's --update-feeds: writes the feeds to --data-dir (ok), only one of them (partial, exit 3), or none (exit 2). */
function updateFeeds(args: string[], how: "ok" | "partial" | "fail") {
  const dir = args[args.indexOf("--data-dir") + 1] as string;
  if (how === "fail") return { ok: false, status: 2, stdout: "", stderr: `\u001b[0;31m❌ Error: unable to write the feed directory ${dir}\u001b[0m\n` };
  mkdirSync(dir, { recursive: true });
  for (const f of how === "ok" ? FEED_FILES : ["osv.purl"]) writeFileSync(join(dir, f), "pkg:npm/x@1\n");
  return how === "ok" ? ok(`Updating feeds in ${dir}...\nUpdated ${N} of ${N} feed(s) in ${dir}\n`) : fail(`Updated 1 of ${N} feed(s) in ${dir}\n`, 3);
}

/** A fake machine: clamscan whose signatures freshclam renews, yara, unzip that unpacks one rule, package-checker's feed update. */
function machine(opts: { sigs?: string; freshclam?: ReturnType<typeof ok>; yara?: boolean; feeds?: "ok" | "partial" | "fail" } = {}) {
  let version = opts.sigs ?? OLD;
  const calls: string[] = [];
  const runner: Runner = async (cmd, args) => {
    calls.push(cmd);
    if (cmd === "bash" && args.includes("--update-feeds")) return updateFeeds(args, opts.feeds ?? "ok");
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

  it("refreshDefenses honours --no-av and --no-rules, and refreshes the advisory feeds only when asked", async () => {
    const state = tmp("ug-def-");
    const m = machine();
    expect((await refreshDefenses(state, m.runner, { clamav: false, yaraForge: false, deps, now: NOW })).length).toBe(0);
    expect(m.calls).toEqual([]);
    expect((await refreshDefenses(state, m.runner, { yaraForge: false, deps, now: NOW })).map((u) => u.engine)).toEqual(["clamav"]);
    expect(m.calls).not.toContain("bash");
    expect((await refreshDefenses(state, m.runner, { clamav: false, yaraForge: false, advisoryFeeds: true })).map((u) => u.engine)).toEqual([
      "package-checker",
    ]);
  });
});

describe("advisory feeds refresh", () => {
  it("downloads the feeds into the state folder, then leaves a copy younger than 1 day alone unless forced", async () => {
    const state = tmp("ug-def-");
    const m = machine();
    const r = await updateAdvisoryFeeds(state, m.runner);
    expect(r).toEqual({ engine: "package-checker", status: "updated", detail: `Updated ${N} of ${N} feed(s) (OSV and GHSA advisories for scan deps)` });
    expect(localFeeds(feedDir(state))?.files).toBe(N);
    expect((await updateAdvisoryFeeds(state, m.runner)).status).toBe("current");
    expect((await updateAdvisoryFeeds(state, m.runner, { now: new Date(Date.now() + 23 * 3_600_000) })).status).toBe("current");
    // Older than 1 day means 24 hours, not two whole days.
    expect((await updateAdvisoryFeeds(state, m.runner, { now: new Date(Date.now() + 30 * 3_600_000) })).status).toBe("updated");
    expect((await updateAdvisoryFeeds(state, m.runner, { force: true })).status).toBe("updated");
  });

  it("a partial copy is refreshed even when it is fresh", async () => {
    const state = tmp("ug-def-");
    mkdirSync(feedDir(state), { recursive: true });
    for (const f of FEED_FILES.filter((f) => f.startsWith("ghsa"))) writeFileSync(join(feedDir(state), f), "pkg:npm/x@1\n");
    expect(localFeeds(feedDir(state))?.missing).toEqual(FEED_FILES.filter((f) => f.startsWith("osv")));
    const m = machine();
    expect((await updateAdvisoryFeeds(state, m.runner)).status).toBe("updated");
    expect(m.calls).toContain("bash");
    expect(localFeeds(feedDir(state))?.missing).toEqual([]);
  });

  it("a failed refresh keeps the older copy and gives its age; with no copy, says each scan downloads them again", async () => {
    const state = tmp("ug-def-");
    const none = await updateAdvisoryFeeds(state, machine({ feeds: "fail" }).runner);
    expect(none.status).toBe("failed");
    expect(none.detail).toBe(
      `feed refresh failed: Error: unable to write the feed directory ${feedDir(state)}; no local copy: each scan deps downloads the feeds again`,
    );
    const partial = await updateAdvisoryFeeds(state, machine({ feeds: "partial" }).runner);
    expect(partial.detail).toBe(
      `feed refresh failed: Updated 1 of ${N} feed(s) (the others could not be downloaded); kept the copy in ${feedDir(state)} (0 days old, ${N - 1} of ${N} feeds missing)`,
    );
    const later = await updateAdvisoryFeeds(state, machine({ feeds: "fail" }).runner, { now: new Date(Date.now() + 3.5 * 86_400_000) });
    expect(later.detail).toContain(`kept the copy in ${feedDir(state)} (3 days old, ${N - 1} of ${N} feeds missing)`);
  });
});

describe("advisory feeds refresh messages", () => {
  afterEach(() => {
    setRunner(defaultRunner);
    setRulesDeps(defaultRulesDeps);
    vi.restoreAllMocks();
  });

  const BASH3 = "Error: package-checker requires Bash 4 or newer (this shell: 3.2.57(1)-release).\n  macOS (/bin/bash is 3.2): brew install bash\n";

  it("Bash 3 skips the feeds with the fix, and does not fail rules update", async () => {
    const bash3: Runner = async (cmd, args) =>
      cmd === "bash" && args.includes("--update-feeds") ? { ok: false, status: 2, stdout: "", stderr: BASH3 } : missing();
    const r = await updateAdvisoryFeeds(tmp("ug-def-"), bash3);
    expect(r.status).toBe("skipped");
    expect(r.detail).toContain("brew install bash");
    expect(r.detail).not.toContain("downloads");
    setRunner(bash3);
    setRulesDeps(deps);
    captureOut();
    expect(await main(["rules", "update", "--state", tmp("ug-def-")])).toBe(0);
  });

  it("the stale-feed gap quotes the refresh error once, without the copy it kept", async () => {
    const state = tmp("ug-def-");
    mkdirSync(feedDir(state), { recursive: true });
    const old = new Date(Date.now() - 3 * 86_400_000);
    for (const f of FEED_FILES) {
      writeFileSync(join(feedDir(state), f), "pkg:npm/x@1\n");
      utimesSync(join(feedDir(state), f), old, old);
    }
    const root = tmp("ug-defr-");
    mkdirSync(join(root, "app"));
    writeFileSync(join(root, "app", "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: { "": {} } }));
    setRunner(async (cmd, args) => {
      if (cmd !== "bash") return missing();
      if (args.includes("--update-feeds")) return { ok: false, status: 2, stdout: "", stderr: "Error: curl: (6) Could not resolve host\n" };
      const osv = join(feedDir(state), "osv.purl");
      const report = {
        vulnerabilities: [],
        sources: [{ kind: "osv", ecosystem: "npm", status: "loaded", origin: osv, origin_type: "local", date: old.toISOString(), age_days: 3 }],
      };
      writeFileSync(args[args.indexOf("--export-json") + 1] as string, JSON.stringify(report));
      return ok();
    });
    captureOut();
    const run = aikidoRun();
    expect(await main(["scan", "deps", "--out", run.dir, "--roots", root, "--no-registry", "--state", state])).toBe(0);
    expect(run.gaps().find((g) => g.what.startsWith("advisories newer than 3 days"))?.why).toBe(
      "the feed refresh failed (Error: curl: (6) Could not resolve host): the 3-day-old copy was used",
    );
  });
});

describe("rules update", () => {
  afterEach(() => {
    setRunner(defaultRunner);
    setRulesDeps(defaultRulesDeps);
    vi.restoreAllMocks();
  });

  it("runs freshclam, fetches YARA-Forge and the advisory feeds, even when all are fresh", async () => {
    const state = tmp("ug-def-");
    const m = machine({ sigs: NEW });
    setRunner(m.runner);
    setRulesDeps(deps);
    const out = captureOut();
    expect(await main(["rules", "update", "--state", state])).toBe(0);
    expect(m.calls).toContain("freshclam");
    expect(installedRules(state)?.tag).toBe("20261108");
    expect(localFeeds(feedDir(state))?.files).toBe(N);
    expect(out.join("")).toMatch(new RegExp(`^package-checker +updated +Updated ${N} of ${N} feed\\(s\\)`, "m"));
    // Fresh feeds are refreshed again: rules update is forced.
    expect(await main(["rules", "update", "--state", state])).toBe(0);
    expect(m.calls.filter((c) => c === "bash")).toHaveLength(2);
  });

  it("fails when the advisory feeds could not be refreshed", async () => {
    setRunner(machine({ sigs: NEW, feeds: "fail" }).runner);
    setRulesDeps(deps);
    captureOut();
    expect(await main(["rules", "update", "--state", tmp("ug-def-")])).toBe(1);
  });

  it("scan deps refreshes the advisory feeds older than 1 day and reads them with --data-dir, unless --no-update", async () => {
    const state = tmp("ug-def-");
    const root = tmp("ug-defr-");
    mkdirSync(join(root, "app"));
    writeFileSync(join(root, "app", "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: { "": {} } }));
    const calls: string[][] = [];
    setRunner(async (cmd, args) => {
      if (cmd !== "bash") return missing();
      calls.push(args);
      if (args.includes("--update-feeds")) return updateFeeds(args, "ok");
      writeFileSync(args[args.indexOf("--export-json") + 1] as string, JSON.stringify({ vulnerabilities: [] }));
      return ok();
    });
    const out = captureOut();
    const scan = (...flags: string[]) => main(["scan", "deps", "--out", aikidoRun().dir, "--roots", root, "--no-registry", "--state", state, ...flags]);
    expect(await scan()).toBe(0);
    expect(calls[0]).toContain("--update-feeds");
    expect(calls[1]?.slice(calls[1].indexOf("--data-dir"), calls[1].indexOf("--data-dir") + 2)).toEqual(["--data-dir", feedDir(state)]);
    expect(out.join("")).toContain("package-checker updated");
    // Fresh now: the next scan reads the copy without downloading it again.
    calls.length = 0;
    expect(await scan()).toBe(0);
    expect(calls.map((c) => c.includes("--update-feeds"))).toEqual([false]);
    // Stale, but --no-update: no refresh.
    const old = new Date(Date.now() - 3 * 86_400_000);
    for (const f of FEED_FILES) utimesSync(join(feedDir(state), f), old, old);
    calls.length = 0;
    expect(await scan("--no-update")).toBe(0);
    expect(calls.map((c) => c.includes("--update-feeds"))).toEqual([false]);
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
