// What an analyst looks at on a machine when no IOC is known yet. Each check
// collects facts and risk signals; none decides alone. A risky signal makes a
// "suspicious" finding with the facts in its title, so the agent can judge it
// in one look, and everything collected goes to <run>/host-inventory.json.
//
// Read-only throughout. Credential files are recorded by path and kind, never
// by content: the only thing read inside them is whether a token key exists.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import type { Runner } from "../runner.js";
import type { Finding } from "../types.js";

type NewFinding = Omit<Finding, "id">;

export interface StartupItem {
  path: string;
  mtime: string;
  /** The program and its arguments, as the item runs them. */
  command: string;
  executable?: string;
  exists?: boolean;
  signer?: string;
  team?: string;
  signed?: boolean;
  signals: string[];
}

export interface HostInventory {
  startupItems: StartupItem[];
  credentials: { path: string; kind: string }[];
  recentExtensions: { path: string; id: string; installed: string }[];
  shellStartup: { path: string; line: number; signal: string; text: string }[];
}

/** Commands that fetch and run code, open a reverse shell, or decode a payload. */
const STRONG: [RegExp, string][] = [
  [/\b(curl|wget)\b[^|;\n]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i, "downloads and runs a script"],
  [/\b(curl|wget)\b[^\n]*(-o|--output|>)\s*\S*\s*(&&|;)\s*(chmod|\.\/|sh|bash|zsh|python|node)/i, "downloads then executes a file"],
  [/\/dev\/(tcp|udp)\//, "opens a raw network socket (reverse shell pattern)"],
  [/base64\s+(-d|-D|--decode)[^\n]*\|\s*(ba|z)?sh\b|\becho\s+[A-Za-z0-9+/=]{40,}\s*\|\s*base64/i, "decodes and runs an encoded payload"],
  [/\b(python3?|perl|ruby|node)\s+-(c|e)\s+['"][^'"]*(socket|exec|eval|child_process|subprocess)/i, "runs inline interpreter code that spawns or connects"],
  [/\bosascript\s+-e\b[^\n]*(do shell script|password)/i, "AppleScript that runs shell code or asks for a password"],
];

/** Locations no installed software should run from. */
const TEMP_PATH = /^(\/tmp\/|\/private\/tmp\/|\/var\/tmp\/|\/private\/var\/tmp\/|\/dev\/shm\/|\/Users\/Shared\/)/;

/** Hidden home directories where developer tools legitimately live. */
const KNOWN_HIDDEN = new Set([
  ".nvm",
  ".volta",
  ".local",
  ".cargo",
  ".rustup",
  ".bun",
  ".deno",
  ".pyenv",
  ".rbenv",
  ".asdf",
  ".sdkman",
  ".vscode",
  ".vscode-insiders",
  ".cursor",
  ".windsurf",
  ".docker",
  ".orbstack",
  ".colima",
  ".rd",
  ".config",
  ".npm",
  ".pnpm",
  ".yarn",
  ".fnm",
  ".gem",
  ".go",
  ".foundry",
  ".claude",
  ".codex",
  ".agents",
  ".lima",
  ".ollama",
  ".dotnet",
  ".jenv",
  ".nix-profile",
  ".oh-my-zsh",
  ".antigen",
  ".zinit",
  ".tmux",
  ".gradle",
  ".m2",
]);

export function riskSignals(rawCommand: string, executable: string | undefined, home: string): string[] {
  // Bounded input: these patterns scan a line more than once, and a 2 MB line must not stall the scan.
  const command = rawCommand.length > 4000 ? rawCommand.slice(0, 4000) : rawCommand;
  const out: string[] = [];
  for (const [re, label] of STRONG) if (re.test(command)) out.push(label);
  for (const p of [executable, ...command.split(/\s+/)].filter(Boolean) as string[]) {
    if (TEMP_PATH.test(p)) {
      out.push(`runs from a temporary or shared folder (${p})`);
      break;
    }
    if (p.startsWith(`${home}/.`)) {
      const top = p.slice(home.length + 1).split("/")[0] ?? "";
      if (!KNOWN_HIDDEN.has(top)) {
        out.push(`runs from a hidden folder of your home (${p})`);
        break;
      }
    }
  }
  return [...new Set(out)];
}

/** A plist's ProgramArguments (or Program), a systemd ExecStart, an autostart Exec. */
export function startupCommand(text: string): { command: string; executable?: string } {
  const args = /<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(text)?.[1];
  if (args) {
    const parts = [...args.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => decodeXml(m[1] ?? ""));
    const program = /<key>Program<\/key>\s*<string>([^<]+)<\/string>/.exec(text)?.[1];
    // `/bin/sh -c "<script>"`: the script is what runs; its first word is the executable.
    const shellC = parts.length >= 3 && /\/(ba|z|da)?sh$/.test(parts[0] ?? "") && parts[1] === "-c";
    const executable =
      program ??
      (shellC
        ? (parts[2] ?? "")
            .trim()
            .split(/\s+/)[0]
            ?.replace(/^["']|["']$/g, "")
        : parts[0]);
    return { command: parts.join(" "), executable };
  }
  const program = /<key>Program<\/key>\s*<string>([^<]+)<\/string>/.exec(text)?.[1];
  if (program) return { command: decodeXml(program), executable: decodeXml(program) };
  const exec = /^ExecStart=[-@+!:]*(.*)$/m.exec(text)?.[1] ?? /^Exec=(.*)$/m.exec(text)?.[1];
  if (exec) return { command: exec.trim(), executable: exec.trim().split(/\s+/)[0] };
  return { command: "" };
}

function decodeXml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Who signed a macOS binary or bundle, from `codesign -dv`. Undefined off macOS or when codesign is absent. */
export async function signerOf(runner: Runner, executable: string): Promise<{ signed: boolean; signer?: string; team?: string } | undefined> {
  const res = await runner("codesign", ["-dv", "--verbose=2", executable], { timeoutMs: 15_000 });
  if (res.missing) return undefined;
  const text = `${res.stderr}\n${res.stdout}`;
  if (/not signed at all|code object is not signed/i.test(text)) return { signed: false };
  if (!res.ok && !/Authority=|Signature=adhoc/.test(text)) return undefined;
  const authority = /^Authority=(.+)$/m.exec(text)?.[1]?.trim();
  const team = /^TeamIdentifier=(.+)$/m.exec(text)?.[1]?.trim();
  if (/Signature=adhoc/.test(text)) return { signed: false, signer: "ad-hoc signature (no identity)" };
  return { signed: true, signer: authority, team: team && team !== "not set" ? team : undefined };
}

/** Shell startup files: the persistence that runs every time a terminal opens. */
export const SHELL_STARTUP = [".zshrc", ".zprofile", ".zshenv", ".zlogin", ".bashrc", ".bash_profile", ".profile", ".config/fish/config.fish"];

const SHELL_RISK: [RegExp, string][] = [
  ...STRONG,
  [/\b(DYLD_INSERT_LIBRARIES|LD_PRELOAD)\s*=/, "injects a library into every program"],
  [/\bNODE_OPTIONS\s*=.*--(require|import|loader)\b/, "makes every Node.js process load a module"],
  [/\bPYTHONSTARTUP\s*=|\bPERL5OPT\s*=|\bRUBYOPT\s*=.*-r/, "makes every interpreter load a file"],
  [/^\s*alias\s+(sudo|ssh|git|gh|npm|su|passwd)=/, "redefines a security-sensitive command"],
  [/^\s*(function\s+)?(sudo|ssh|git|gh)\s*\(\)/, "redefines a security-sensitive command"],
  [/\bexport\s+PATH=["']?(\/tmp|\/private\/tmp|\/Users\/Shared)/, "puts a temporary folder first in PATH"],
];

export function shellStartupFindings(home: string): { findings: NewFinding[]; lines: HostInventory["shellStartup"] } {
  const findings: NewFinding[] = [];
  const lines: HostInventory["shellStartup"] = [];
  for (const rel of SHELL_STARTUP) {
    const p = join(home, rel);
    let text: string;
    try {
      if (statSync(p).size > 2 * 1024 * 1024) continue;
      text = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((rawLine, i) => {
      const line = rawLine.length > 4000 ? rawLine.slice(0, 4000) : rawLine;
      if (/^\s*#/.test(line)) return;
      for (const [re, signal] of SHELL_RISK) {
        if (!re.test(line)) continue;
        lines.push({ path: p, line: i + 1, signal, text: line.trim().slice(0, 200) });
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `${basename(p)} line ${i + 1} ${signal}`,
          evidence: { kind: "file", ref: `${p}:${i + 1}`, excerpt: line.trim().slice(0, 200) },
          key: `host|${p}|${i + 1}|${signal}`,
        });
        break;
      }
    });
  }
  return { findings, lines };
}

function readSmall(p: string): string | undefined {
  try {
    if (statSync(p).size > 1024 * 1024) return undefined;
    return readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
}

/** Package-manager and git settings an attacker changes to stay in, or to serve you their packages. */
export function configFindings(home: string, reviewSinceMs: number): NewFinding[] {
  const out: NewFinding[] = [];
  const add = (p: string, title: string, excerpt?: string, line?: number) =>
    out.push({
      surface: "host",
      severity: "suspicious",
      subject: p,
      title,
      evidence: { kind: "file", ref: line ? `${p}:${line}` : p, excerpt },
      key: `host|${p}|${title}`,
    });
  const lineOf = (text: string, re: RegExp) => text.split("\n").findIndex((l) => re.test(l)) + 1;

  const npmrc = readSmall(join(home, ".npmrc"));
  const reg = npmrc ? /^\s*registry\s*=\s*(\S+)/m.exec(npmrc)?.[1] : undefined;
  if (npmrc && reg && !/^https:\/\/registry\.(npmjs\.org|yarnpkg\.com)\/?$/.test(reg))
    add(join(home, ".npmrc"), `~/.npmrc sends every npm install to another registry: ${reg}`, `registry=${reg}`, lineOf(npmrc, /^\s*registry\s*=/));
  for (const pip of [join(home, ".pip/pip.conf"), join(home, ".config/pip/pip.conf"), join(home, "Library/Application Support/pip/pip.conf")]) {
    const text = readSmall(pip);
    const idx = text ? /^\s*index-url\s*=\s*(\S+)/m.exec(text)?.[1] : undefined;
    if (text && idx && !/^https:\/\/pypi\.org\/simple\/?$/.test(idx))
      add(pip, `pip installs from another index: ${idx}`, `index-url = ${idx}`, lineOf(text, /index-url/));
  }
  const gitconfig = readSmall(join(home, ".gitconfig"));
  if (gitconfig) {
    const hooks = /^\s*hooksPath\s*=\s*(.+)$/m.exec(gitconfig)?.[1]?.trim();
    if (hooks) {
      const dir = hooks.replace(/^~(?=\/)/, home);
      let recent: string[] = [];
      try {
        recent = readdirSync(dir).filter((f) => statSync(join(dir, f)).mtimeMs >= reviewSinceMs);
      } catch {}
      add(
        join(home, ".gitconfig"),
        `git runs global hooks from ${hooks} in every repository${recent.length ? `; changed recently: ${recent.join(", ")}` : ""}`,
        `hooksPath = ${hooks}`,
        lineOf(gitconfig, /hooksPath/),
      );
    }
    const sshCmd = /^\s*sshCommand\s*=\s*(.+)$/m.exec(gitconfig)?.[1]?.trim();
    if (sshCmd && !/^ssh(\s|$)/.test(sshCmd))
      add(join(home, ".gitconfig"), `git runs a custom SSH command: ${sshCmd}`, sshCmd, lineOf(gitconfig, /sshCommand/));
  }
  const ak = join(home, ".ssh/authorized_keys");
  try {
    const st = statSync(ak);
    if (st.mtimeMs >= reviewSinceMs) {
      const keys = (readSmall(ak) ?? "").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
      const comments = keys.map((k) => k.trim().split(/\s+/).slice(2).join(" ") || "(no comment)");
      out.push({
        surface: "host",
        severity: "suspicious",
        subject: ak,
        title: `~/.ssh/authorized_keys changed recently: ${keys.length} key(s) can log in to this machine (${comments.join(", ").slice(0, 120)})`,
        at: st.mtime.toISOString(),
        evidence: { kind: "file", ref: ak },
        key: `host|${ak}|recent`,
      });
    }
  } catch {}
  return out;
}

/**
 * Editor extensions FIRST installed in the review window (malicious extensions
 * are a campaign of their own). The editor's extensions.json tells a new
 * install from an update and the Marketplace from a sideloaded .vsix; without
 * it, the folder's creation date is all there is.
 */
export function recentExtensions(home: string, reviewSinceMs: number): { findings: NewFinding[]; list: HostInventory["recentExtensions"] } {
  const findings: NewFinding[] = [];
  const list: HostInventory["recentExtensions"] = [];
  for (const rel of [".vscode/extensions", ".vscode-insiders/extensions", ".cursor/extensions", ".windsurf/extensions", ".vscode-oss/extensions"]) {
    const dir = join(home, rel);
    const editor = rel.split("/")[0]?.replace(/^\./, "") ?? rel;
    const manifest =
      readSmall(join(dir, "extensions.json")) ??
      (() => {
        try {
          return readFileSync(join(dir, "extensions.json"), "utf8");
        } catch {
          return undefined;
        }
      })();
    let entries: { id: string; version: string; path: string; installed?: number; updated?: boolean; source?: string; publisher?: string }[] = [];
    if (manifest) {
      try {
        entries = (JSON.parse(manifest) as any[]).map((e) => ({
          id: e.identifier?.id,
          version: e.version,
          path: e.location?.path ?? join(dir, e.relativeLocation ?? ""),
          installed: e.metadata?.installedTimestamp,
          updated: e.metadata?.updated,
          source: e.metadata?.source,
          publisher: e.metadata?.publisherDisplayName,
        }));
      } catch {}
    } else {
      let names: string[] = [];
      try {
        names = readdirSync(dir);
      } catch {
        continue;
      }
      for (const name of names) {
        if (name.startsWith(".") || !/-\d+\.\d+\.\d+/.test(name)) continue;
        try {
          const st = statSync(join(dir, name));
          if (st.isDirectory()) entries.push({ id: name.replace(/-\d+\.\d+\.\d+.*$/, ""), version: "", path: join(dir, name), installed: st.birthtimeMs });
        } catch {}
      }
    }
    for (const e of entries) {
      if (!e.id || !e.installed || e.installed < reviewSinceMs || e.updated) continue;
      const installed = new Date(e.installed).toISOString();
      list.push({ path: e.path, id: e.id, installed });
      const sideloaded = e.source === "vsix";
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: e.path,
        title: `Editor extension ${e.id}${e.version ? `@${e.version}` : ""} was newly installed in ${editor}${e.publisher ? ` (publisher: ${e.publisher})` : ""}${sideloaded ? ", from a .vsix file, not the Marketplace" : ""}: check it is the one you meant`,
        at: installed,
        evidence: { kind: "file", ref: e.path },
        key: `host|${e.path}|new-ext`,
      });
    }
  }
  return { findings, list };
}

/** Running programs whose executable sits where no installed software lives. */
export async function processFindings(runner: Runner, home: string, os: NodeJS.Platform = process.platform): Promise<NewFinding[]> {
  // macOS prints the executable's path in comm; Linux prints a 15-character name, so read the command line there.
  const ps = await runner("ps", os === "darwin" ? ["-axo", "pid=,comm="] : ["-eo", "pid=,args="], { timeoutMs: 10_000 });
  if (!ps.ok) return [];
  const out: NewFinding[] = [];
  for (const line of ps.stdout.split("\n")) {
    const m = os === "darwin" ? /^\s*(\d+)\s+(\/.+)$/.exec(line) : /^\s*(\d+)\s+(\/\S+)/.exec(line);
    if (!m) continue;
    const exe = m[2] as string;
    const signals = riskSignals("", exe, home);
    if (!signals.length) continue;
    out.push({
      surface: "host",
      severity: "suspicious",
      subject: exe,
      title: `Running process ${basename(exe)} (pid ${m[1]}) ${signals[0]}`,
      evidence: { kind: "command", ref: "ps -axo pid=,comm=", excerpt: line.trim() },
      key: `host|process|${exe}`,
    });
  }
  return out;
}

/**
 * The credentials on this machine, by path and kind: what a stealer here would
 * take, and so what to rotate if the machine is compromised. Contents are not
 * read, except to tell whether a token entry exists.
 */
export function credentialInventory(home: string, envFiles: string[]): HostInventory["credentials"] {
  const out: HostInventory["credentials"] = [];
  const has = (rel: string, kind: string, test?: RegExp) => {
    const p = join(home, rel);
    if (!existsSync(p)) return;
    if (test) {
      const text = readSmall(p);
      if (!text || !test.test(text)) return;
    }
    out.push({ path: p, kind });
  };
  has(".aws/credentials", "AWS access keys");
  has(".aws/sso/cache", "AWS SSO tokens");
  has(".config/gcloud/credentials.db", "Google Cloud credentials");
  has(".config/gcloud/application_default_credentials.json", "Google Cloud application credentials");
  has(".azure/msal_token_cache.json", "Azure tokens");
  has(".azure/accessTokens.json", "Azure tokens");
  has(".npmrc", "npm publish token", /_authToken\s*=/);
  has(".yarnrc.yml", "yarn registry token", /npmAuthToken/);
  has(".pypirc", "PyPI upload token", /password\s*=|token/i);
  has(".cargo/credentials.toml", "crates.io token");
  has(".gem/credentials", "RubyGems key");
  has(".docker/config.json", "Docker registry logins", /"auths"\s*:\s*\{\s*"/);
  has(".kube/config", "Kubernetes credentials");
  has(".config/gh/hosts.yml", "GitHub CLI token", /oauth_token|user:/);
  has(".git-credentials", "git HTTPS credentials (plain text)");
  has(".netrc", "netrc logins (plain text)");
  has(".vault-token", "HashiCorp Vault token");
  has(".terraform.d/credentials.tfrc.json", "Terraform Cloud token");
  try {
    for (const f of readdirSync(join(home, ".ssh"))) {
      if (/^id_[a-z0-9]+$/.test(f) || /\.pem$/.test(f)) out.push({ path: join(home, ".ssh", f), kind: "SSH private key" });
    }
  } catch {}
  if (existsSync(join(home, ".gnupg/private-keys-v1.d"))) out.push({ path: join(home, ".gnupg"), kind: "GPG private keys" });
  for (const p of envFiles.slice(0, 200)) out.push({ path: p, kind: ".env file (project secrets)" });
  return out;
}
