import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matchers, validateIocs } from "../src/ioc.js";
import type { Runner } from "../src/runner.js";
import { scanHost } from "../src/scan/host.js";
import { walk } from "../src/scan/walk.js";
import type { Indicator, IocFile, Source } from "../src/types.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const C0 = AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0];
const withIndicators = (indicators: Indicator[]): IocFile => ({ campaigns: [{ ...C0, indicators }] });
const S1: Source[] = [{ id: "S1", url: "https://example.com/a", fetchedAt: NOW.toISOString(), origin: "web" }];

function put(root: string, rel: string, body: string) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  return p;
}

const plist = (label: string, program: string) =>
  `<?xml version="1.0"?><plist><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array><string>${program}</string></array></dict></plist>`;
const infoPlist = (id: string) => `<?xml version="1.0"?><plist><dict><key>CFBundleIdentifier</key><string>${id}</string></dict></plist>`;

/** A macOS that answers codesign with a team for the paths in `teams`, and nothing else. */
function fakeMac(teams: Record<string, string>, ps = ""): Runner & { calls: string[][] } {
  const calls: string[][] = [];
  const r = (async (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    if (cmd === "codesign" && args[0] === "-dv") {
      const path = args.at(-1) as string;
      const team = teams[path];
      if (!team) return { ok: false, status: 1, stdout: "", stderr: `${path}: code object is not signed at all\n` };
      return { ok: true, status: 0, stdout: "", stderr: `Identifier=com.x\nAuthority=Developer ID Application: X (${team})\nTeamIdentifier=${team}\n` };
    }
    if (cmd === "codesign") return { ok: true, status: 0, stdout: "", stderr: "" };
    if (cmd === "ps" && args.join(" ") === "-axo comm=") return { ok: true, status: 0, stdout: ps, stderr: "" };
    return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
  }) as Runner & { calls: string[][] };
  r.calls = calls;
  return r;
}

describe("launchd_label, team_id and bundle_id indicators", () => {
  it("validates them: a Team ID is 10 letters and digits, a label or bundle id is exact unless it is a regex", () => {
    const iocs = withIndicators([
      { type: "team_id", value: "ABC", source: "S1" },
      { type: "launchd_label", value: "com.evil.*", source: "S1" },
      { type: "bundle_id", value: "^com\\.evil\\..*", source: "S1" },
      { type: "team_id", value: "A1B2C3D4E5", source: "S1" },
      { type: "launchd_label", value: "com.finder.helper", source: "S1" },
      { type: "bundle_id", value: "com.apple.crashreporter", source: "S1" },
      { type: "bundle_id", value: "^com\\.evil\\.", regex: true, source: "S1" },
    ]);
    const { problems } = validateIocs({ campaigns: [{ ...iocs.campaigns[0], sources: ["S1"] }] }, S1, NOW);
    expect(problems.map((p) => p.path)).toEqual(["campaigns[0].indicators[0].value", "campaigns[0].indicators[1].value", "campaigns[0].indicators[2].value"]);
  });

  it("compares labels and bundle ids exactly (case-sensitive), a label written with .plist, and Team IDs in any case", () => {
    const [label, bundle, team] = matchers(
      withIndicators([
        { type: "launchd_label", value: "com.finder.helper.plist", source: "S1" },
        { type: "bundle_id", value: "com.apple.CrashReporter", source: "S1" },
        { type: "team_id", value: "a1b2c3d4e5", source: "S1" },
      ]),
      "launchd_label",
      "bundle_id",
      "team_id",
    );
    expect([label?.test("com.finder.helper"), label?.test("com.Finder.helper"), label?.test("com.finder.helper.x")]).toEqual([true, false, false]);
    expect([bundle?.test("com.apple.CrashReporter"), bundle?.test("com.apple.crashreporter")]).toEqual([true, false]);
    expect([team?.test("A1B2C3D4E5"), team?.test("A1B2C3D4E")]).toEqual([true, false]);
  });

  it("matches a startup item by its Label, its file name, a systemd unit name, the program's team and its app bundle", async () => {
    const home = tmp("ug-mio-");
    const la = join(home, "LaunchDaemons");
    const helper = put(home, "Evil.app/Contents/MacOS/helper", "x");
    put(home, "Evil.app/Contents/Info.plist", infoPlist("com.evil.helper"));
    const signedBin = put(home, "bin/agent", "x");
    put(la, "random.plist", plist("com.finder.helper", "/bin/true"));
    put(la, "com.apple.accountsd.helper.plist", plist("x", "/bin/true"));
    put(la, "team.plist", plist("com.team", signedBin));
    put(la, "bundle.plist", plist("com.bundle", helper));
    const iocs = withIndicators([
      { type: "launchd_label", value: "com.finder.helper", source: "S1" },
      { type: "launchd_label", value: "com.apple.accountsd.helper", source: "S1" },
      { type: "team_id", value: "A1B2C3D4E5", source: "S1" },
      { type: "bundle_id", value: "com.evil.helper", source: "S1" },
    ]);
    const r = await scanHost(iocs, walk([join(home, "none")]), fakeMac({ [signedBin]: "A1B2C3D4E5" }), {
      home,
      platform: "darwin",
      startupDirs: [la],
      dropDirs: [],
      appDirs: [],
      av: "off",
      now: NOW,
    });
    const hits = r.findings.filter((f) => f.indicator).map((f) => [f.severity, f.source, f.indicator?.type, f.subject.slice(la.length + 1)]);
    expect(hits.sort()).toEqual(
      [
        ["compromised", "S1", "bundle_id", "bundle.plist"],
        ["compromised", "S1", "launchd_label", "com.apple.accountsd.helper.plist"],
        ["compromised", "S1", "launchd_label", "random.plist"],
        ["compromised", "S1", "team_id", "team.plist"],
      ].sort(),
    );
    expect(r.findings.find((f) => f.indicator?.type === "team_id")?.title).toBe(
      `Startup item ${join(la, "team.plist")} runs ${signedBin} signed by team "A1B2C3D4E5"`,
    );

    // Linux: a systemd unit's name, with or without its suffix.
    const units = join(home, "systemd");
    put(units, "dbus-helper.service", "[Service]\nExecStart=/usr/bin/true\n");
    const linux = await scanHost(withIndicators([{ type: "launchd_label", value: "dbus-helper", source: "S1" }]), walk([join(home, "none")]), fakeMac({}), {
      home,
      platform: "linux",
      startupDirs: [units],
      dropDirs: [],
      skipLive: true,
      now: NOW,
    });
    expect(linux.findings.filter((f) => f.indicator).map((f) => f.subject)).toEqual([join(units, "dbus-helper.service")]);
  });

  it("matches apps in the app folders by bundle id and team, and running programs by team", async () => {
    const home = tmp("ug-mapp-");
    const apps = join(home, "Applications");
    put(apps, "Crash Reporter.app/Contents/Info.plist", infoPlist("com.apple.CrashReporterHelper"));
    put(apps, "Utilities/Tool.app/Contents/Info.plist", infoPlist("com.vendor.tool"));
    put(apps, "Fine.app/Contents/Info.plist", infoPlist("com.fine.app"));
    const tool = join(apps, "Utilities/Tool.app");
    const iocs = withIndicators([
      { type: "bundle_id", value: "com.apple.CrashReporterHelper", source: "S1" },
      { type: "team_id", value: "Z9Y8X7W6V5", source: "S1" },
    ]);
    const runner = fakeMac({ [tool]: "Z9Y8X7W6V5", "/opt/x/miner": "Z9Y8X7W6V5" }, "/opt/x/miner\n/usr/libexec/fine\nrelative\n");
    const r = await scanHost(iocs, walk([join(home, "none")]), runner, {
      home,
      platform: "darwin",
      startupDirs: [],
      dropDirs: [],
      appDirs: [apps],
      av: "off",
      now: NOW,
    });
    const hits = r.findings.filter((f) => f.indicator).map((f) => [f.indicator?.type, f.subject, f.title]);
    expect(hits).toEqual([
      ["bundle_id", join(apps, "Crash Reporter.app"), 'App Crash Reporter.app has the bundle identifier "com.apple.CrashReporterHelper"'],
      ["team_id", tool, 'App Tool.app is signed by team "Z9Y8X7W6V5"'],
      ["team_id", "/opt/x/miner", 'Running program /opt/x/miner is signed by team "Z9Y8X7W6V5"'],
    ]);
    expect(r.result.stats.apps).toBe(3);
    // Only absolute programs are asked about.
    expect(runner.calls.filter((c) => c[0] === "codesign" && c.at(-1) === "relative")).toEqual([]);
  });
});
