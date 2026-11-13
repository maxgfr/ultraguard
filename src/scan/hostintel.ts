// What an analyst looks at on a machine when no IOC is known yet. Each check
// collects facts and risk signals; none decides alone. A risky signal makes a
// "suspicious" finding with the facts in its title, so the agent can judge it
// in one look, and everything collected goes to <run>/host-inventory.json.
//
// Read-only throughout. Credential files are recorded by path and kind, never
// by content: the only thing read inside them is whether a token key exists.
import { createHash } from "node:crypto";
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import type { Matcher } from "../ioc.js";
import type { Runner } from "../runner.js";
import type { Finding } from "../types.js";

type NewFinding = Omit<Finding, "id">;

export interface StartupItem {
  path: string;
  mtime: string;
  /** The program and its arguments, as the item runs them. */
  command: string;
  executable?: string;
  /** The script an interpreter launcher runs (`/bin/bash /path/script.sh`). */
  script?: string;
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
  /** AI coding agents: configs read, commands they run, MCP servers they start. */
  agents?: import("./agents.js").AgentInventory;
  /** Every non-comment line of the user's crontab. */
  crontab?: string[];
  /** macOS: XProtect's version and the hardening settings read (real-time tools found: LuLu, BlockBlock...). */
  macos?: {
    xprotect?: { version?: string; installed?: string; ageDays?: number };
    hardening?: import("./xprotect.js").Hardening;
  };
  /** Browser extensions installed in the review window. */
  recentBrowserExtensions?: { browser: string; profile: string; id: string; version: string; installed: string }[];
}

/** A rule: a regex, or a test written in linear steps where a regex would backtrack. */
type Rule = [RegExp | ((s: string) => boolean), string];
const hit = (rule: Rule[0], s: string) => (typeof rule === "function" ? rule(s) : rule.test(s));

/** The part of `s` from the first match of `re` on, or undefined: one linear search instead of a backtracking prefix. */
const from = (s: string, re: RegExp): string | undefined => {
  const i = s.search(re);
  return i < 0 ? undefined : s.slice(i);
};

const FETCHER = /\b(curl|wget)\b/i;
/** Interpreters a download is piped into. Non-shell ones count only when no option follows: `| python3 -m json.tool` reads data. */
const PIPE_TO_RUN =
  /\b(curl|wget)\b[^|;\n]*\|\s*(sudo\s+(-\S+\s+)*)?(env\s+)?(\/\S*\/)?((ba|z|da|k|fi)?sh\b|(python[\d.]*|node|perl|ruby|osascript|bun|deno)\b(?!\s+-{1,2}[a-zA-Z]))/i;
/** `bash -c "$(curl ...)"`, `eval "$(curl ...)"`, `source <(curl ...)`, `bash <(curl ...)`. */
const RUN_FETCHED = /(\beval|\b(ba|z|da|k)?sh(\s+-\w+)*|\bsource|(^|[\s;&(])\.)\s+["']?(\$\(|<\(|`)\s*(curl|wget)\b/i;
const INLINE_CODE = /\b(python[\d.]*|perl|ruby|node)\b(\s+-\S+)*\s+-(c|e)\b/i;
const INLINE_RISK = /os\.system|popen|subprocess|socket|urllib|urlopen|child_process|execSync|spawn|TCPSocket|\beval\b|\bexec\b/i;

/** Commands that fetch and run code, open a reverse shell, or decode a payload. Every test is linear in the line's length. */
const STRONG: Rule[] = [
  [PIPE_TO_RUN, "downloads and runs a script"],
  [RUN_FETCHED, "runs code fetched at run time"],
  [
    (s) => {
      // A download saved to a file (-o, -O, --output, >) that a later command on the line runs.
      const rest = from(s, FETCHER);
      const out = rest && from(rest, /\s-[a-zA-Z]*[oO]\b|--output\b|>/);
      return !!out && /(&&|;|\|\|)\s*(sudo\s+)?(chmod\b|\.\/|(ba|z|da)?sh\b|python|node)/i.test(out);
    },
    "downloads then executes a file",
  ],
  [/\/dev\/(tcp|udp)\//, "opens a raw network socket (reverse shell pattern)"],
  [
    (s) =>
      (/\bbase64\s+(-d|-D|--decode)\b/.test(s) &&
        /\beval\b|\|\s*(sudo\s+)?(\S*\/)?((ba|z|da|k)?sh|python[\d.]*|perl|ruby|node|osascript)\b|\b(ba|z|da)?sh\s+-c\s+["']?\$\(/i.test(s)) ||
      /\becho\s+["']?[A-Za-z0-9+/=]{40,}["']?\s*\|\s*base64/i.test(s),
    "decodes and runs an encoded payload",
  ],
  [(s) => INLINE_CODE.test(s) && INLINE_RISK.test(s), "runs inline interpreter code that spawns or connects"],
  [
    (s) => {
      const rest = from(s, /\bosascript\b/i);
      return !!rest && /do shell script|doShellScript|password|\$\.system|ObjC\.import/i.test(rest);
    },
    "AppleScript that runs shell code or asks for a password",
  ],
  [
    (s) => {
      const nc = from(s, /\b(nc|ncat|netcat)\b/i);
      if (nc && /\s-(e|c)\s+\S*sh\b/i.test(nc)) return true;
      const socat = from(s, /\bsocat\b/i);
      if (socat && /exec:|system:/i.test(socat)) return true;
      const fifo = from(s, /\bmkfifo\b/i);
      return !!fifo && /\b(nc|ncat|netcat)\b/i.test(fifo);
    },
    "opens a reverse shell (netcat or socat)",
  ],
];

/** Locations no installed software should run from. */
const TEMP_PATH = /^(\/tmp\/|\/private\/tmp\/|\/var\/tmp\/|\/private\/var\/tmp\/|\/dev\/shm\/|\/Users\/Shared\/)/;
/** macOS's per-user temp folder ($TMPDIR, Node's os.tmpdir(), mktemp). Not for running processes: app translocation runs from there. */
const MAC_TMPDIR = /^\/(private\/)?var\/folders\//;

const stripToken = (token: string) => token.replace(/^[\s"'`()<>;&|]+|[\s"'`()<>;&|]+$/g, "");
const inTemp = (token: string) => {
  const t = stripToken(token);
  return TEMP_PATH.test(t) || MAC_TMPDIR.test(t);
};

/** A command-line token as a path: quotes and shell punctuation off, `~`, `$HOME` and `${HOME}` expanded. */
export function pathToken(token: string, home: string): string {
  return stripToken(token).replace(/^(~|\$HOME|\$\{HOME\})(?=\/)/, home);
}

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

export function riskSignals(rawCommand: string, executable: string | undefined, home: string, opts: { location?: boolean; tmpdir?: boolean } = {}): string[] {
  // Bounded input: a 2 MB line must not stall the scan.
  const command = rawCommand.length > 4000 ? rawCommand.slice(0, 4000) : rawCommand;
  const out: string[] = [];
  for (const [rule, label] of STRONG) if (hit(rule, command)) out.push(label);
  const tokens = opts.location === false ? [] : ([executable, ...command.split(/\s+/)].filter(Boolean) as string[]);
  for (const raw of tokens) {
    const p = pathToken(raw, home);
    if (TEMP_PATH.test(p) || (opts.tmpdir !== false && MAC_TMPDIR.test(p))) {
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

/** A plist `<string>`: plain, or CDATA. */
const PLIST_STRING = /<string>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/string>/g;
const plistStrings = (xml: string) => [...xml.matchAll(PLIST_STRING)].map((m) => (m[1] !== undefined ? m[1] : decodeXml(m[2] ?? "")));

/**
 * A plist's ProgramArguments (or Program), a systemd unit's Exec lines, an
 * autostart Exec. `args` is the argument list as launchd passes it (a path with
 * a space stays one argument); `more` holds a unit's other Exec lines
 * (ExecStartPre, ExecStartPost, ExecStop...); `unparsed` says a program key is
 * there but its value could not be read.
 */
export function startupCommand(text: string): { command: string; executable?: string; args?: string[]; more?: string[]; unparsed?: boolean } {
  const programKey = /<key>Program<\/key>\s*(<string>(?:<!\[CDATA\[[\s\S]*?\]\]>|[^<]*)<\/string>)/.exec(text)?.[1];
  const program = programKey ? plistStrings(programKey)[0] || undefined : undefined;
  const argsXml = /<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(text)?.[1];
  const parts = argsXml ? plistStrings(argsXml) : [];
  if (parts.length) {
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
    return { command: parts.join(" "), executable, args: parts };
  }
  if (program) return { command: program, executable: program, args: [program] };
  if (/<key>(ProgramArguments|Program)<\/key>/.test(text)) return { command: "", unparsed: true };
  // systemd: every Exec line runs; ExecStart is the main one.
  const execs = [...text.matchAll(/^\s*(Exec\w*)=[-@+!:]*(.*)$/gm)].map((m) => ({ key: m[1] as string, cmd: (m[2] ?? "").trim() })).filter((e) => e.cmd);
  if (execs.length) {
    const main = execs.find((e) => e.key === "ExecStart" || e.key === "Exec") ?? execs[0];
    const cmd = main?.cmd ?? "";
    return { command: cmd, executable: cmd.split(/\s+/)[0], more: execs.filter((e) => e !== main).map((e) => e.cmd) };
  }
  return { command: "" };
}

function decodeXml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => safeCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => safeCodePoint(Number.parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
const safeCodePoint = (n: number) => (n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");

/** Who signed a macOS binary or bundle, from `codesign -dv`. Undefined off macOS or when codesign is absent. */
export async function signerOf(
  runner: Runner,
  executable: string,
): Promise<{ signed: boolean; signer?: string; team?: string; invalid?: boolean } | undefined> {
  const res = await runner("codesign", ["-dv", "--verbose=2", executable], { timeoutMs: 15_000 });
  if (res.missing) return undefined;
  const text = `${res.stderr}\n${res.stdout}`;
  if (/not signed at all|code object is not signed/i.test(text)) return { signed: false };
  if (!res.ok && !/Authority=|Signature=adhoc/.test(text)) return undefined;
  const authority = /^Authority=(.+)$/m.exec(text)?.[1]?.trim();
  const team = /^TeamIdentifier=(.+)$/m.exec(text)?.[1]?.trim();
  if (/Signature=adhoc/.test(text)) return { signed: false, signer: "ad-hoc signature (no identity)" };
  // -dv shows who signed; only --verify says the code is still what they signed.
  const verify = await runner("codesign", ["--verify", "--strict", executable], { timeoutMs: 15_000 });
  if (!verify.ok && !verify.missing && /invalid signature|modified|not valid|revoked/i.test(`${verify.stderr}\n${verify.stdout}`))
    return { signed: false, signer: `invalid signature (modified after signing; claimed ${authority ?? "an identity"})`, invalid: true };
  return { signed: true, signer: authority, team: team && team !== "not set" ? team : undefined };
}

/** What `codesign -dv` says about a program or a bundle. */
export interface CodeSignature {
  signed: boolean;
  adhoc?: boolean;
  /** The first Authority line: who signed it. */
  authority?: string;
  team?: string;
  identifier?: string;
}

/**
 * Who signed a program or an app bundle, from `codesign -dv` alone: no
 * `--verify`, which hashes every resource of a bundle and takes minutes on a
 * large app. Undefined when codesign is absent or could not read the file.
 */
export async function codesignInfo(runner: Runner, path: string): Promise<CodeSignature | undefined> {
  const res = await runner("codesign", ["-dv", "--verbose=2", path], { timeoutMs: 15_000 });
  if (res.missing) return undefined;
  const text = `${res.stderr}\n${res.stdout}`;
  if (/not signed at all|code object is not signed/i.test(text)) return { signed: false };
  if (!res.ok && !/Authority=|Signature=adhoc|Identifier=/.test(text)) return undefined;
  const identifier = /^Identifier=(.+)$/m.exec(text)?.[1]?.trim();
  const team = /^TeamIdentifier=(.+)$/m.exec(text)?.[1]?.trim();
  if (/Signature=adhoc/.test(text)) return { signed: false, adhoc: true, identifier };
  return {
    signed: true,
    authority: /^Authority=(.+)$/m.exec(text)?.[1]?.trim(),
    team: team && team !== "not set" ? team : undefined,
    identifier,
  };
}

/** Apple's own signing identities: the OS (Software Signing), the App Store, and Apple's Developer ID. */
export const isAppleSigned = (sig: CodeSignature | undefined): boolean =>
  !!sig?.signed &&
  /^(Software Signing|Apple Mac OS Application Signing|Apple iPhone OS Application Signing|Developer ID Application: Apple Inc\.)/.test(sig.authority ?? "");

/** The app bundle a program lives in (`/Applications/X.app/Contents/MacOS/x` → `/Applications/X.app`), if any. */
export function appBundleOf(program: string | undefined): string | undefined {
  const i = program?.indexOf(".app/Contents/") ?? -1;
  return program && i > 0 ? program.slice(0, i + 4) : undefined;
}

/**
 * A bundle's CFBundleIdentifier: read from an XML Info.plist directly, through
 * `plutil` for a binary one (when `runner` is given). Undefined when unreadable.
 */
export async function bundleIdOf(bundle: string, runner?: Runner): Promise<string | undefined> {
  const plist = join(bundle, "Contents/Info.plist");
  const text = readSmall(plist);
  if (text === undefined) return undefined;
  const xml = /<key>CFBundleIdentifier<\/key>\s*<string>([^<]*)<\/string>/.exec(text)?.[1];
  if (xml !== undefined) return decodeXml(xml).trim() || undefined;
  if (!runner || !text.startsWith("bplist")) return undefined;
  const r = await runner("plutil", ["-extract", "CFBundleIdentifier", "raw", "-o", "-", plist], { timeoutMs: 10_000 });
  return r.ok ? r.stdout.trim() || undefined : undefined;
}

/** A finding for an IOC match: compromised unless said otherwise, citing the indicator's source. */
export function iocHit(
  m: Matcher,
  f: Omit<NewFinding, "campaign" | "source" | "indicator" | "key" | "severity" | "surface"> & { severity?: Finding["severity"] },
): NewFinding {
  return {
    surface: "host",
    severity: "compromised",
    ...f,
    campaign: m.campaign.id,
    source: m.indicator.source,
    indicator: { type: m.indicator.type, value: m.indicator.value },
    key: `host|${f.subject}|${m.indicator.type}:${m.indicator.value}`,
  };
}

/** Shell startup files: the persistence that runs every time a terminal opens (or closes). */
export const SHELL_STARTUP = [
  ".zshrc",
  ".zprofile",
  ".zshenv",
  ".zlogin",
  ".zlogout",
  ".zshrc.local",
  ".bashrc",
  ".bash_profile",
  ".bash_login",
  ".bash_logout",
  ".profile",
  ".config/fish/config.fish",
];

/** SHELL_STARTUP plus every fish snippet in conf.d (fish runs them all), relative to home. */
export function shellStartupFiles(home: string): string[] {
  let fish: string[] = [];
  try {
    fish = readdirSync(join(home, ".config/fish/conf.d"))
      .filter((f) => f.endsWith(".fish"))
      .sort()
      .slice(0, 200)
      .map((f) => `.config/fish/conf.d/${f}`);
  } catch {}
  return [...SHELL_STARTUP, ...fish];
}

/** Vendor API hosts for AI agents. Anything else under amazonaws.com or azure.com can be registered by anyone. */
const VENDOR_AI_HOST =
  /^https:\/\/(api\.anthropic\.com|api\.openai\.com|bedrock(-runtime)?(-fips)?\.[a-z0-9-]+\.amazonaws\.com|[a-z0-9-]+\.openai\.azure\.com|[a-z0-9-]+\.services\.ai\.azure\.com|[a-z0-9-]+\.cognitiveservices\.azure\.com|generativelanguage\.googleapis\.com|([a-z0-9-]+-)?aiplatform\.googleapis\.com)(:443)?(\/|$)/i;
export const isVendorAiUrl = (url: string) => VENDOR_AI_HOST.test(url.trim());

const SHELL_RISK: Rule[] = [
  ...STRONG,
  [/\b(DYLD_INSERT_LIBRARIES|LD_PRELOAD)\s*=/, "injects a library into every program"],
  [/\bNODE_OPTIONS\s*=.*--(require|import|loader)\b/, "makes every Node.js process load a module"],
  [/\bPYTHONSTARTUP\s*=|\bPERL5OPT\s*=|\bRUBYOPT\s*=.*-r/, "makes every interpreter load a file"],
  [/^\s*alias\s+(sudo|ssh|git|gh|npm|su|passwd)=/, "redefines a security-sensitive command"],
  [/^\s*function\s+(sudo|ssh|git|gh)\b|^\s*(sudo|ssh|git|gh)\s*\(\)/, "redefines a security-sensitive command"],
  [/\b(export\s+)?PATH=["']?(\/tmp|\/private\/tmp|\/var\/tmp|\/Users\/Shared)/, "puts a temporary folder first in PATH"],
  [/^\s*(sudo\s+)?(shutdown|halt|poweroff|reboot)\b/, "shuts the machine down at every shell start"],
  [
    (s) => {
      const v = /\b(ANTHROPIC|OPENAI|GEMINI|GOOGLE_GEMINI)\w*_(BASE_URL|API_BASE)\s*=\s*["']?([^"'\s]*)/.exec(s)?.[3];
      return !!v && !isVendorAiUrl(v);
    },
    "sends AI agent traffic to another host",
  ],
  [/\b(PIP_(EXTRA_)?INDEX_URL|NPM_CONFIG_REGISTRY|UV_(EXTRA_)?INDEX_URL)\s*=/, "points a package manager to another registry"],
  // A program run from a temp or shared folder. Not hidden home folders: `source ~/.fzf.zsh` is everywhere.
  [(s) => s.split(/\s+/).some(inTemp), "runs from a temporary or shared folder"],
];

/**
 * ClickFix and what 2026 macOS stealers run once pasted into Terminal (AMOS,
 * MacSync, Phexia...): a download piped into osascript, a download decoded
 * and decompressed into a shell, a fake password dialog, a password checked
 * with dscl or piped into sudo, quarantine stripped from an app, Gatekeeper
 * turned off. Matched in shell history, where the pasted command stays.
 */
const CLICKFIX: Rule[] = [
  [
    (s) => {
      const rest = from(s, FETCHER);
      return !!rest && /\|\s*(sudo\s+(-\S+\s+)*)?(\S*\/)?osascript\b/i.test(rest);
    },
    "pipes a download into osascript (ClickFix)",
  ],
  [
    (s) =>
      FETCHER.test(s) &&
      /\bbase64\s+(-\w*[dD]\b|--decode\b)/.test(s) &&
      /\b(gunzip|zcat|gzip\s+(-\w*d\b|--decompress\b))/.test(s) &&
      /\|\s*(sudo\s+(-\S+\s+)*)?(\S*\/)?((ba|z|da|k)?sh|osascript)\b/.test(s),
    "downloads, decodes and decompresses a payload into a shell (ClickFix)",
  ],
  [
    (s) => {
      const rest = from(s, /\bosascript\b/i);
      return !!rest && /display dialog/i.test(rest) && /hidden answer/i.test(rest);
    },
    "shows a fake password dialog (osascript display dialog with hidden answer)",
  ],
  [/\bdscl\s+\.\s+-authonly\b/, "checks a password with dscl . -authonly, how stealers validate a phished password"],
  [
    (s) => {
      const rest = from(s, /\bxattr\b/);
      return !!rest && /\s-[a-z]*[cd][a-z]*\b/.test(rest) && /\.app\b/i.test(rest);
    },
    "strips macOS's quarantine from an app, which skips Gatekeeper's check",
  ],
  [/\becho\b[^|\n]*\|\s*sudo\b[^|\n]*\s-[a-zA-Z]*S\b/, "pipes a password into sudo -S"],
  [/\bspctl\s+(--master-disable|--global-disable)\b/, "turns Gatekeeper off"],
];

/** The ClickFix signals of one command line. */
export function clickfixSignals(rawLine: string): string[] {
  const line = rawLine.length > 4000 ? rawLine.slice(0, 4000) : rawLine;
  return CLICKFIX.filter(([rule]) => hit(rule, line)).map(([, label]) => label);
}

/** History lines with ClickFix signals: the 1-based line, the command (zsh's ": <time>:0;" prefix off), when zsh recorded it. */
export function clickfixLines(text: string): { line: number; text: string; signals: string[]; at?: string }[] {
  const out: { line: number; text: string; signals: string[]; at?: string }[] = [];
  for (const { line, text: raw } of logicalLines(text)) {
    const zsh = /^: (\d+):\d+;/.exec(raw);
    const cmd = (zsh ? raw.slice(zsh[0].length) : raw.replace(/^- cmd: /, "")).trim();
    if (!cmd) continue;
    const signals = clickfixSignals(cmd);
    if (signals.length) out.push({ line, text: cmd, signals, at: zsh ? new Date(Number(zsh[1]) * 1000).toISOString() : undefined });
  }
  return out;
}

/** Physical lines joined where a line ends with a backslash, each with its first line number. */
function logicalLines(text: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  let cur: { line: number; text: string } | undefined;
  text.split("\n").forEach((raw, i) => {
    const l = raw.length > 4000 ? raw.slice(0, 4000) : raw;
    if (cur) cur.text += ` ${l}`;
    else cur = { line: i + 1, text: l };
    if (/\\\s*$/.test(l) && cur.text.length < 8000) cur.text = cur.text.replace(/\\\s*$/, "");
    else {
      out.push(cur);
      cur = undefined;
    }
  });
  if (cur) out.push(cur);
  return out;
}

export function shellStartupFindings(home: string): { findings: NewFinding[]; lines: HostInventory["shellStartup"] } {
  const findings: NewFinding[] = [];
  const lines: HostInventory["shellStartup"] = [];
  for (const rel of shellStartupFiles(home)) {
    const p = join(home, rel);
    let text: string;
    try {
      if (statSync(p).size > 2 * 1024 * 1024) continue;
      text = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    for (const { line: n, text: line } of logicalLines(text)) {
      if (/^\s*#/.test(line)) continue;
      for (const [rule, signal] of SHELL_RISK) {
        if (!hit(rule, line)) continue;
        lines.push({ path: p, line: n, signal, text: line.trim().slice(0, 200) });
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `${basename(p)} line ${n} ${signal}`,
          evidence: { kind: "file", ref: `${p}:${n}`, excerpt: line.trim().slice(0, 200) },
          key: `host|${p}|${n}|${signal}`,
        });
        break;
      }
    }
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

/** When a file last changed: the later of mtime and ctime. A dropper sets mtime back (`touch -t`, an unpacked archive); ctime cannot be set from user space. A ctime after `nowMs` (a scan replayed at an earlier date) is ignored. */
export function changedMs(st: { mtimeMs: number; ctimeMs: number }, nowMs = Date.now()): number {
  // A minute of slack: a file written in the same instant can carry a ctime a fraction past "now".
  return st.ctimeMs <= nowMs + 60_000 ? Math.max(st.mtimeMs, st.ctimeMs) : st.mtimeMs;
}

/** `(changed on <ctime>, dated <mtime>)` when the two disagree by more than a day: the date was set back. */
export function backdated(st: { mtimeMs: number; ctimeMs: number }, nowMs = Date.now()): string {
  if (st.ctimeMs > nowMs + 60_000 || st.ctimeMs - st.mtimeMs <= 86_400_000) return "";
  return ` (changed on ${new Date(st.ctimeMs).toISOString().slice(0, 10)}, dated ${new Date(st.mtimeMs).toISOString().slice(0, 10)})`;
}

export interface GitConfigEntry {
  file: string;
  line: number;
  section: string;
  sub?: string;
  key: string;
  value: string;
}

/** A git config file as entries, following `[include] path` one level. Keys and sections are lower-cased, as git compares them. */
export function readGitConfig(path: string, home: string, depth = 0): GitConfigEntry[] {
  const text = readSmall(path);
  if (!text) return [];
  const out: GitConfigEntry[] = [];
  let section = "";
  let sub: string | undefined;
  text.split("\n").forEach((raw, i) => {
    const l = raw.trim();
    if (!l || /^[#;]/.test(l)) return;
    const sec = /^\[\s*([\w.-]+)(?:\s+"((?:[^"\\]|\\.)*)")?\s*\]\s*(.*)$/.exec(l);
    let rest = l;
    if (sec) {
      section = (sec[1] ?? "").toLowerCase();
      sub = sec[2];
      // `[core.x]` old-style subsection.
      if (!sub && section.includes(".")) [section, sub] = [section.split(".")[0] as string, section.split(".").slice(1).join(".")];
      rest = sec[3] ?? "";
      if (!rest) return;
    }
    const kv = /^([\w-]+)\s*(?:=\s*(.*))?$/.exec(rest);
    if (!kv) return;
    const value = (kv[2] ?? "true")
      .replace(/\s+[#;].*$/, "")
      .replace(/^"(.*)"$/, "$1")
      .trim();
    out.push({ file: path, line: i + 1, section, sub, key: (kv[1] ?? "").toLowerCase(), value });
  });
  if (depth < 1)
    for (const e of out.filter((x) => (x.section === "include" || x.section === "includeif") && x.key === "path")) {
      const inc = e.value.replace(/^~(?=\/)/, home);
      out.push(...readGitConfig(inc.startsWith("/") ? inc : join(path, "..", inc), home, depth + 1));
    }
  return out;
}

/** The user's global git config: ~/.gitconfig and ~/.config/git/config, with their includes. */
export function globalGitConfig(home: string): GitConfigEntry[] {
  return [...readGitConfig(join(home, ".gitconfig"), home), ...readGitConfig(join(home, ".config/git/config"), home)];
}

/** The host of a git remote URL: https://host/x, ssh://git@host/x, git@host:x. */
function gitHost(url: string): string | undefined {
  return (/^[a-z+]+:\/\/(?:[^@/]+@)?([^/:]+)/i.exec(url)?.[1] ?? /^(?:[^@/]+@)?([^/:]+):/.exec(url)?.[1])?.toLowerCase();
}
const FORGES = new Set(["github.com", "gitlab.com", "bitbucket.org"]);
/** Credential helpers that the forges' own CLIs and git's packages install. */
const KNOWN_HELPER =
  /^!?\s*(\S*\/)?(gh|glab) auth git-credential\b|^!?\s*aws\s+codecommit\s+credential-helper\b|git-credential-(manager|osxkeychain|libsecret|wincred)|^(osxkeychain|store|cache|manager|manager-core|libsecret|wincred)(\s|$)/;

/** Package-manager and git settings an attacker changes to stay in, or to serve you their packages. */
export function configFindings(home: string, reviewSinceMs: number, nowMs = Date.now()): NewFinding[] {
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
  const short = (p: string) => (p.startsWith(`${home}/`) ? `~/${p.slice(home.length + 1)}` : p);

  const npmrcPath = join(home, ".npmrc");
  const npmrc = readSmall(npmrcPath);
  npmrc?.split("\n").forEach((raw, i) => {
    const l = raw.trim();
    if (!l || /^[#;]/.test(l)) return;
    const reg = /^(@[^:\s]+:)?registry\s*=\s*(\S+)/.exec(l);
    if (reg) {
      const url = reg[2] as string;
      if (!/^https:\/\/(registry\.npmjs\.org|registry\.yarnpkg\.com|npm\.pkg\.github\.com)\/?$/.test(url))
        add(
          npmrcPath,
          reg[1]
            ? `~/.npmrc sends ${reg[1].slice(0, -1)} packages to another registry: ${url}`
            : `~/.npmrc sends every npm install to another registry: ${url}`,
          l,
          i + 1,
        );
      return;
    }
    const kv = /^(script-shell|node-options|proxy|https-proxy|strict-ssl)\s*=\s*(.*)$/.exec(l);
    if (kv && !(kv[1] === "strict-ssl" && !/^false$/i.test((kv[2] ?? "").trim())))
      add(npmrcPath, `~/.npmrc sets ${kv[1]} = ${(kv[2] ?? "").slice(0, 120)}: it changes what every npm command runs or where it connects`, l, i + 1);
  });
  for (const pip of [join(home, ".pip/pip.conf"), join(home, ".config/pip/pip.conf"), join(home, "Library/Application Support/pip/pip.conf")]) {
    const text = readSmall(pip);
    text?.split("\n").forEach((raw, i) => {
      const idx = /^\s*(extra-)?index-url\s*=\s*(\S+)/.exec(raw);
      if (idx && !/^https:\/\/pypi\.org\/simple\/?$/.test(idx[2] as string))
        add(pip, `pip installs from ${idx[1] ? "an extra" : "another"} index: ${idx[2]}`, raw.trim(), i + 1);
      const trusted = /^\s*trusted-host\s*=\s*(.+)$/.exec(raw);
      if (trusted) add(pip, `pip trusts ${trusted[1]?.trim()} without TLS verification`, raw.trim(), i + 1);
    });
  }

  for (const e of globalGitConfig(home)) {
    const where = short(e.file);
    const name = `${e.section}${e.sub ? `.${e.sub}` : ""}.${e.key}`;
    const flag = (why: string) => add(e.file, `${where}: ${why}`, `${name} = ${e.value}`.slice(0, 300), e.line);
    const risky = (cmd: string) => riskSignals(cmd.replace(/^!/, ""), undefined, home).length > 0;
    if (e.section === "core" && e.key === "hookspath") {
      const dir = e.value.replace(/^~(?=\/)/, home);
      let recent: string[] = [];
      try {
        recent = readdirSync(dir).filter((f) => changedMs(statSync(join(dir, f)), nowMs) >= reviewSinceMs);
      } catch {}
      add(
        e.file,
        `git runs global hooks from ${e.value} in every repository${recent.length ? `; changed recently: ${recent.join(", ")}` : ""}`,
        `hooksPath = ${e.value}`,
        e.line,
      );
    } else if (e.section === "core" && e.key === "sshcommand") {
      if (!/^ssh(\s|$)/.test(e.value)) add(e.file, `git runs a custom SSH command: ${e.value}`, e.value, e.line);
    } else if (e.section === "core" && e.key === "fsmonitor") {
      if (!/^(true|false|yes|no|on|off|1|0)?$/i.test(e.value)) flag(`git runs ${e.value} at every git status (core.fsmonitor)`);
    } else if (e.section === "credential" && e.key === "helper") {
      if (e.value && !KNOWN_HELPER.test(e.value) && (e.value.startsWith("!") || e.value.startsWith("/") || risky(e.value)))
        flag(`git hands every credential to ${e.value} (credential.helper)`);
    } else if ((e.section === "core" && (e.key === "pager" || e.key === "editor")) || (e.section === "diff" && e.key === "external") || e.section === "alias") {
      if (risky(e.value)) flag(`${name} runs ${e.value.slice(0, 120)}`);
    } else if (e.section === "url" && e.key === "insteadof") {
      const to = gitHost(e.sub ?? "");
      const from = gitHost(e.value);
      if (from && FORGES.has(from) && to !== from && !(to && FORGES.has(to))) flag(`git sends ${e.value} to ${e.sub} instead (url.insteadOf)`);
    } else if (e.section === "http" && e.key === "sslverify" && /^(false|no|off|0)$/i.test(e.value))
      flag("git does not verify TLS certificates (http.sslVerify = false)");
    else if (e.section === "http" && e.key === "proxy" && e.value) flag(`git sends its traffic through ${e.value} (http.proxy)`);
  }

  const ak = join(home, ".ssh/authorized_keys");
  try {
    const st = statSync(ak);
    if (changedMs(st, nowMs) >= reviewSinceMs) {
      const keys = (readSmall(ak) ?? "").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
      const comments = keys.map((k) => k.trim().split(/\s+/).slice(2).join(" ") || "(no comment)");
      out.push({
        surface: "host",
        severity: "suspicious",
        subject: ak,
        title: `~/.ssh/authorized_keys changed recently${backdated(st, nowMs)}: ${keys.length} key(s) can log in to this machine (${comments.join(", ").slice(0, 120)})`,
        at: new Date(changedMs(st, nowMs)).toISOString(),
        evidence: { kind: "file", ref: ak },
        key: `host|${ak}|recent`,
      });
    }
  } catch {}
  return out;
}

/** An editor extension folder entry: `publisher.name-1.2.3`, or `publisher.name-1.2.3-darwin-arm64` for platform builds. */
export const EXTENSION_ENTRY = /^[\w-]+\.[\w.-]+?-\d+\.\d+\.\d+/;

/**
 * Every editor's extensions folder: VS Code and its forks (Cursor, Windsurf,
 * VSCodium, Antigravity, Kiro, Trae, Positron...) and their remote servers all
 * keep them in `~/.<editor>/extensions`. A folder counts when it looks like one
 * (an extensions.json, or `publisher.name-x.y.z` entries), so ~/.duckdb/extensions does not.
 */
export function extensionDirs(home: string): string[] {
  const out: string[] = [];
  let names: string[] = [];
  try {
    names = readdirSync(home);
  } catch {
    return out;
  }
  for (const n of names.filter((x) => x.startsWith(".")).sort()) {
    const dir = join(home, n, "extensions");
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }
    if (entries.includes("extensions.json") || entries.some((e) => EXTENSION_ENTRY.test(e))) out.push(dir);
  }
  return out;
}

/** "vscode" for ~/.vscode/extensions, "cursor-server" for ~/.cursor-server/extensions. */
export const editorOf = (dir: string) => basename(join(dir, "..")).replace(/^\./, "");

/** Runs of invisible variation selectors: emoji carry one, GlassWorm hides its loader in thousands. */
export const SELECTOR_RUN = /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]{32,}/u;

/** An extension's entry file (package.json `main`, else `browser`), bounded to 5 MB. */
export function extensionEntryFile(extDir: string): { path: string; text: string } | undefined {
  let pkg: { main?: unknown; browser?: unknown };
  try {
    pkg = JSON.parse(readFileSync(join(extDir, "package.json"), "utf8"));
  } catch {
    return undefined;
  }
  const rel = typeof pkg.main === "string" ? pkg.main : typeof pkg.browser === "string" ? pkg.browser : undefined;
  if (!rel) return undefined;
  for (const cand of [rel, `${rel}.js`, join(rel, "index.js")]) {
    const p = join(extDir, cand);
    try {
      const st = statSync(p);
      if (!st.isFile()) continue;
      if (st.size > 5 * 1024 * 1024) return undefined;
      return { path: p, text: readFileSync(p, "utf8") };
    } catch {}
  }
  return undefined;
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
  for (const dir of extensionDirs(home)) {
    const editor = editorOf(dir);
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

/** The `n` line of `lsof -F n` output: a process's program (`-d txt`) or working folder (`-d cwd`). */
async function lsofPath(runner: Runner, pid: string, fd: "txt" | "cwd"): Promise<string | undefined> {
  const r = await runner("lsof", ["-a", "-p", pid, "-d", fd, "-Fn"], { timeoutMs: 5_000 });
  return r.ok ? /^n(\/.*)$/m.exec(r.stdout)?.[1] : undefined;
}

/**
 * Running programs whose executable, or the script an interpreter runs, sits
 * where no installed software lives. A program started by a relative path
 * (`cd /tmp/.x && ./agent`) is resolved through lsof; `/bin/sh /tmp/p.sh` and
 * `node /tmp/x.js` are judged by their script.
 */
export async function processFindings(runner: Runner, home: string, os: NodeJS.Platform = process.platform): Promise<NewFinding[]> {
  // macOS prints the executable's path in comm; Linux prints a 15-character name, so read the command line there.
  const ps = await runner("ps", os === "darwin" ? ["-axo", "pid=,comm="] : ["-eo", "pid=,args="], { timeoutMs: 10_000 });
  if (!ps.ok) return [];
  const args = new Map<string, string>();
  if (os === "darwin") {
    const pa = await runner("ps", ["-axo", "pid=,args="], { timeoutMs: 10_000 });
    if (pa.ok)
      for (const l of pa.stdout.split("\n")) {
        const m = /^\s*(\d+)\s+(.*)$/.exec(l);
        if (m) args.set(m[1] as string, m[2] as string);
      }
  }
  const out: NewFinding[] = [];
  const seen = new Set<string>();
  let lookups = 0;
  for (const line of ps.stdout.split("\n")) {
    const m = /^\s*(\d+)\s+(.+)$/.exec(line);
    if (!m) continue;
    const pid = m[1] as string;
    const cmdline = os === "darwin" ? (args.get(pid) ?? (m[2] as string)) : (m[2] as string);
    let exe = os === "darwin" ? (m[2] as string).trim() : ((m[2] as string).split(/\s+/)[0] ?? "");
    // A relative program (`./agent`): ask lsof where it really is, for a bounded number of processes.
    if (!exe.startsWith("/") && /^\.{0,2}\//.test(exe) && lookups++ < 50) exe = (await lsofPath(runner, pid, "txt")) ?? exe;
    let subject = exe;
    let signals = exe.startsWith("/") ? riskSignals("", exe, home, { tmpdir: false }) : [];
    // An interpreter: the script it runs is the program.
    if (!signals.length && INTERPRETERS.test(basename(exe))) {
      const script = cmdline
        .split(/\s+/)
        .slice(1)
        .find((t) => t && !t.startsWith("-"));
      if (script && /\//.test(script)) {
        let path = script;
        if (!path.startsWith("/") && lookups++ < 50) {
          const cwd = await lsofPath(runner, pid, "cwd");
          if (cwd) path = join(cwd, path);
        }
        if (path.startsWith("/")) {
          signals = riskSignals("", path, home, { tmpdir: false }).map((x) => `its script ${x}`);
          subject = path;
        }
      }
    }
    // A cryptocurrency miner (Phexia installs XMRig): its name, or a mining pool on its command line.
    if (
      /^(xmrig|xmr-stak)/i.test(basename(exe)) ||
      /^(xmrig|xmr-stak)/i.test(basename(cmdline.split(/\s+/)[0] ?? "")) ||
      /\bstratum\+(tcp|ssl|tls):\/\//i.test(cmdline)
    )
      signals = ["looks like a cryptocurrency miner (xmrig, or a stratum mining pool on its command line)", ...signals];
    if (!signals.length || seen.has(subject)) continue;
    seen.add(subject);
    out.push({
      surface: "host",
      severity: "suspicious",
      subject,
      title: `Running process ${basename(exe)} (pid ${pid}) ${signals[0]}`,
      evidence: {
        kind: "command",
        ref: os === "darwin" ? "ps -axo pid=,comm=" : "ps -eo pid=,args=",
        excerpt: (os === "darwin" ? `${pid} ${cmdline}` : line).trim().slice(0, 300),
      },
      key: `host|process|${subject}`,
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

/**
 * npm's download cache: every tarball npm fetched, with the time it fetched it.
 * A malicious version installed, then removed from the lockfile, is still here,
 * and the date says when the machine ran its install scripts.
 */
export function npmCacheHits(home: string, pkgs: { name: string; versions?: string[]; source: string; campaign: string; value: string }[]): NewFinding[] {
  const dir = join(home, ".npm/_cacache/index-v5");
  if (!pkgs.length || !existsSync(dir)) return [];
  // Tarball URLs look like https://registry.npmjs.org/<name>/-/<basename>-<version>.tgz (scoped: @s%2fname or @s/name).
  const wanted = pkgs.map((p) => ({ ...p, base: p.name.split("/").pop() as string }));
  const out: NewFinding[] = [];
  const stack = [dir];
  let files = 0;
  while (stack.length && files < 200_000) {
    const d = stack.pop() as string;
    let names: string[] = [];
    try {
      names = readdirSync(d);
    } catch {
      continue;
    }
    for (const n of names) {
      const p = join(d, n);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(p);
        continue;
      }
      files++;
      if (st.size > 4 * 1024 * 1024) continue;
      let text: string;
      try {
        text = readFileSync(p, "utf8");
      } catch {
        continue;
      }
      if (!text.includes(".tgz")) continue;
      for (const w of wanted) {
        if (!text.includes(`/-/${w.base}-`)) continue;
        for (const line of text.split("\n")) {
          const m = /"key":"[^"]*?(https:\/\/[^"]+\/-\/([^"/]+)-(\d[^"/]*)\.tgz)"/.exec(line);
          if (!m || m[2] !== w.base) continue;
          const url = decodeURIComponent(m[1] as string);
          if (!url.includes(`/${w.name}/-/`) && !url.includes(`/${w.name.replace("/", "%2f")}/-/`)) continue;
          const version = m[3] as string;
          if (w.versions?.length && !w.versions.some((v) => v.replace(/^v/, "") === version)) continue;
          const time = /"time":(\d+)/.exec(line)?.[1];
          const at = time ? new Date(Number(time)).toISOString() : undefined;
          out.push({
            surface: "host",
            severity: "exposed",
            subject: "~/.npm/_cacache",
            title: `npm downloaded ${w.name}@${version}${at ? ` on ${at.slice(0, 16).replace("T", " ")}` : ""}, named by the campaign: its install scripts likely ran on this machine`,
            at,
            campaign: w.campaign,
            source: w.source,
            indicator: { type: "package", value: w.value },
            evidence: { kind: "file", ref: p, excerpt: url },
            key: `host|npm-cache|${w.name}|${version}`,
          });
        }
      }
    }
  }
  return out;
}

const readdirOr = (d: string): string[] => {
  try {
    return readdirSync(d);
  } catch {
    return [];
  }
};

/**
 * pnpm's store and bun's cache name every package they fetched by name and
 * version: `<hash>-@scope+name@1.2.3.json` in pnpm's index, `name@1.2.3@@@1`
 * in bun's cache. Like npm's cache, a campaign version found here was
 * installed on this machine, even if a lockfile no longer names it.
 */
export function packageStoreHits(home: string, pkgs: { name: string; versions?: string[]; source: string; campaign: string; value: string }[]): NewFinding[] {
  if (!pkgs.length) return [];
  const out: NewFinding[] = [];
  const seen = new Set<string>();
  const report = (tool: string, p: string, name: string, version: string) => {
    for (const w of pkgs) {
      if (w.name.toLowerCase() !== name.toLowerCase()) continue;
      if (w.versions?.length && !w.versions.some((v) => v.replace(/^v/, "") === version)) continue;
      const key = `host|${tool}|${name}|${version}`;
      if (seen.has(key)) continue;
      seen.add(key);
      let at: string | undefined;
      try {
        at = statSync(p).mtime.toISOString();
      } catch {}
      out.push({
        surface: "host",
        severity: "exposed",
        subject: p,
        title: `${tool} fetched ${name}@${version}${at ? ` (${at.slice(0, 16).replace("T", " ")})` : ""}, named by the campaign: its install scripts likely ran on this machine`,
        at,
        campaign: w.campaign,
        source: w.source,
        indicator: { type: "package", value: w.value },
        evidence: { kind: "file", ref: p },
        key,
      });
    }
  };
  for (const root of [join(home, "Library/pnpm/store"), join(home, ".local/share/pnpm/store"), join(home, ".pnpm-store")])
    for (const v of readdirOr(root).filter((x) => /^v\d+$/.test(x))) {
      const index = join(root, v, "index");
      for (const sub of readdirOr(index))
        for (const f of readdirOr(join(index, sub))) {
          const m = /^[0-9a-f]+-(.+)@([^@]+)\.json$/.exec(f);
          if (m) report("pnpm", join(index, sub, f), (m[1] as string).replace(/^(@[^+]+)\+/, "$1/"), m[2] as string);
        }
    }
  const bun = join(home, ".bun/install/cache");
  for (const e of readdirOr(bun)) {
    const entries = e.startsWith("@") ? readdirOr(join(bun, e)).map((x) => [join(bun, e, x), `${e}/${x}`] as const) : [[join(bun, e), e] as const];
    for (const [p, n] of entries) {
      const m = /^(@[^/]+\/[^@]+|[^@]+)@(\d[^@]*)(@@@\d+)?$/.exec(n);
      if (m) report("bun", p, m[1] as string, m[2] as string);
    }
  }
  return out;
}

/** site-packages folders: each clone's virtualenv, tool environments, the user's and Homebrew's Python. */
function sitePackages(home: string, clones: string[], system: boolean): string[] {
  const out: string[] = [];
  const pythons = (lib: string) =>
    readdirOr(lib)
      .filter((x) => /^python\d/.test(x))
      .map((x) => join(lib, x, "site-packages"));
  for (const c of clones) for (const v of [".venv", "venv"]) out.push(...pythons(join(c, v, "lib")));
  for (const tools of [join(home, ".local/share/uv/tools"), join(home, ".local/pipx/venvs"), join(home, ".local/share/pipx/venvs")])
    for (const t of readdirOr(tools)) out.push(...pythons(join(tools, t, "lib")));
  for (const v of readdirOr(join(home, ".pyenv/versions"))) out.push(...pythons(join(home, ".pyenv/versions", v, "lib")));
  if (system) out.push(...pythons("/opt/homebrew/lib"), ...pythons("/usr/local/lib"));
  out.push(...pythons(join(home, ".local/lib")));
  for (const v of readdirOr(join(home, "Library/Python"))) out.push(join(home, "Library/Python", v, "lib/python/site-packages"));
  return out.filter((d) => existsSync(d));
}

/** .pth files that packaging tools write, recognised by name AND shape: a payload can borrow a name, not the content. */
function benignPth(name: string, text: string): boolean {
  const t = text.trim();
  if (name === "_virtualenv.pth") return t === "import _virtualenv";
  if (name === "distutils-precedence.pth") return t.length < 300 && t.includes("_distutils_hack");
  if (/-nspkg\.pth$/.test(name)) return /importlib\.util|module_from_spec|types\.ModuleType/.test(t) && !/base64|exec\(|eval\(/.test(t);
  if (/^pytest-cov.*\.pth$|^init_cov_core\.pth$/.test(name)) return t.includes("COV_CORE_SOURCE");
  return /^__editable__.*\.pth$/.test(name) && !/base64|b64decode|urllib|socket|subprocess/.test(t);
}

/**
 * Executable `.pth` files: Python runs every `import` line of every .pth in
 * site-packages at each start, no import of the package needed, and
 * `pip uninstall` leaves a stray one behind (LiteLLM 1.82.8's litellm_init.pth).
 * A file IOC or hash on one is a compromise; a line that decodes, executes or
 * connects is worth a look.
 */
export function pthFindings(home: string, clones: string[], files: Matcher[], hashes: Map<string, Matcher>, system = true): NewFinding[] {
  const out: NewFinding[] = [];
  for (const dir of sitePackages(home, clones, system))
    for (const n of readdirOr(dir).filter((x) => x.endsWith(".pth"))) {
      const p = join(dir, n);
      let text: string;
      try {
        if (statSync(p).size > 1024 * 1024) continue;
        text = readFileSync(p, "utf8");
      } catch {
        continue;
      }
      const ioc = files.find((x) => x.test(p)) ?? hashes.get(createHash("sha256").update(text).digest("hex"));
      if (ioc) {
        out.push({
          surface: "host",
          severity: "compromised",
          subject: p,
          title: `Python startup file ${p} matches "${ioc.indicator.value}": it runs at every Python start`,
          campaign: ioc.campaign.id,
          source: ioc.indicator.source,
          indicator: { type: ioc.indicator.type, value: ioc.indicator.value },
          evidence: { kind: "file", ref: p },
          key: `host|pth|${p}|${ioc.indicator.value}`,
        });
        continue;
      }
      if (benignPth(n, text)) continue;
      const line = text
        .split("\n")
        .find((l) => /^import[ \t]/.test(l) && (/base64|b64decode|exec\(|eval\(|compile\(|subprocess|urllib|socket|os\.system/.test(l) || l.length > 1000));
      if (line)
        out.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `Python startup file ${n} in ${dir} runs code at every Python start (decodes, executes or connects)`,
          evidence: { kind: "file", ref: p, excerpt: line.slice(0, 200) },
          key: `host|pth|${p}`,
        });
    }
  return out;
}

/** Chromium browsers' user-data folders, by platform. */
function chromiumRoots(home: string, os: NodeJS.Platform): { browser: string; dir: string }[] {
  const mac: [string, string][] = [
    ["Chrome", "Google/Chrome"],
    ["Brave", "BraveSoftware/Brave-Browser"],
    ["Edge", "Microsoft Edge"],
    ["Arc", "Arc/User Data"],
    ["Chromium", "Chromium"],
    ["Vivaldi", "Vivaldi"],
  ];
  const linux: [string, string][] = [
    ["Chrome", "google-chrome"],
    ["Brave", "BraveSoftware/Brave-Browser"],
    ["Edge", "microsoft-edge"],
    ["Chromium", "chromium"],
    ["Vivaldi", "vivaldi"],
  ];
  return os === "darwin"
    ? mac.map(([browser, d]) => ({ browser, dir: join(home, "Library/Application Support", d) }))
    : linux.map(([browser, d]) => ({ browser, dir: join(home, ".config", d) }));
}

export interface BrowserExtension {
  browser: string;
  profile: string;
  id: string;
  version: string;
  path: string;
  installedMs?: number;
}

/**
 * Browser extensions, by listing only: Chromium keeps them as
 * `<profile>/Extensions/<id>/<version>_N`, Firefox lists them in each
 * profile's extensions.json. IDs and versions are what extension-hijack
 * write-ups publish.
 */
export function browserExtensions(home: string, os: NodeJS.Platform): BrowserExtension[] {
  const out: BrowserExtension[] = [];
  for (const { browser, dir } of chromiumRoots(home, os))
    for (const profile of readdirOr(dir).filter((x) => x === "Default" || /^Profile \d+$/.test(x))) {
      const ext = join(dir, profile, "Extensions");
      for (const id of readdirOr(ext).filter((x) => /^[a-p]{32}$/.test(x)))
        for (const v of readdirOr(join(ext, id))) {
          const path = join(ext, id, v);
          let installedMs: number | undefined;
          try {
            const st = statSync(path);
            if (!st.isDirectory()) continue;
            installedMs = st.birthtimeMs || undefined;
          } catch {
            continue;
          }
          out.push({ browser, profile, id, version: v.replace(/_\d+$/, ""), path, installedMs });
        }
    }
  const ff = os === "darwin" ? join(home, "Library/Application Support/Firefox/Profiles") : join(home, ".mozilla/firefox");
  for (const profile of readdirOr(ff)) {
    const p = join(ff, profile, "extensions.json");
    const text = readSmall(p) ?? (existsSync(p) ? readBig(p) : undefined);
    if (!text) continue;
    try {
      for (const a of (JSON.parse(text) as { addons?: { id?: string; version?: string; installDate?: number; location?: string }[] }).addons ?? [])
        if (a.id && a.version && a.location !== "app-builtin" && a.location !== "app-system-defaults")
          out.push({ browser: "Firefox", profile, id: a.id, version: a.version, path: p, installedMs: a.installDate });
    } catch {}
  }
  return out;
}

function readBig(p: string): string | undefined {
  try {
    return statSync(p).size <= 16 * 1024 * 1024 ? readFileSync(p, "utf8") : undefined;
  } catch {
    return undefined;
  }
}

/** Interpreters whose first file argument is the code that really runs. */
export const INTERPRETERS = /^(sh|bash|zsh|dash|ksh|fish|python[\d.]*|node|perl|ruby|osascript|deno|bun)$/;

const isFile = (p: string) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

/** Whether a file starts with `#!`: a script, whatever its name. */
function isShebang(p: string): boolean {
  try {
    const fd = openSync(p, "r");
    try {
      const b = Buffer.alloc(2);
      return readSync(fd, b, 0, 2, 0) === 2 && b.toString() === "#!";
    } finally {
      closeSync(fd);
    }
  } catch {
    return false;
  }
}

/**
 * A startup item that runs `/bin/bash script.sh` is signed by Apple and tells
 * nothing: the script is the program. Same for a `#!` script run directly.
 * Read it (bounded) and give its signals and its text (for IOC matching).
 */
export function interpretedScript(
  command: string,
  executable: string | undefined,
  home: string,
  args?: string[],
): { script?: string; text?: string; signals: string[] } {
  const parts = args?.length ? args : command.split(/\s+/).filter(Boolean);
  const exePath = pathToken(executable ?? parts[0] ?? "", home);
  let script: string | undefined;
  if (INTERPRETERS.test(basename(exePath))) {
    // An argument that is a file; a `-c "<line>"` argument holds paths of its own.
    const cands = parts.slice(1).flatMap((a) => [a, ...a.split(/\s+/)]);
    script = cands.map((t) => pathToken(t, home)).find((t) => t.startsWith("/") && isFile(t));
  } else if (exePath.startsWith("/") && isFile(exePath) && isShebang(exePath)) script = exePath;
  if (!script) return { signals: [] };
  let text = "";
  try {
    if (statSync(script).size <= 256 * 1024) text = readFileSync(script, "utf8");
  } catch {}
  const signals = new Set<string>(script === exePath ? [] : riskSignals("", script, home).map((s) => `its script ${s}`));
  for (const l of text.split("\n").slice(0, 5000))
    if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, undefined, home)) signals.add(`its script ${basename(script)} ${s}`);
  return { script, text, signals: [...signals] };
}

/** Hooks a manager generated: recognised by their template, not by a word anywhere in the file (a comment is enough to fake that). */
/** The hook names git runs (githooks(5)). */
const GIT_HOOKS = new Set([
  "applypatch-msg",
  "pre-applypatch",
  "post-applypatch",
  "pre-commit",
  "pre-merge-commit",
  "prepare-commit-msg",
  "commit-msg",
  "post-commit",
  "pre-rebase",
  "post-checkout",
  "post-merge",
  "pre-push",
  "pre-receive",
  "update",
  "proc-receive",
  "post-receive",
  "post-update",
  "reference-transaction",
  "push-to-checkout",
  "pre-auto-gc",
  "post-rewrite",
  "sendemail-validate",
  "fsmonitor-watchman",
  "p4-changelist",
  "p4-prepare-changelist",
  "p4-post-changelist",
  "p4-pre-submit",
  "post-index-change",
]);

const MANAGED_HOOK =
  /husky\.sh|\.husky\/_\/h\b|^\s*git lfs (pre-push|post-checkout|post-commit|post-merge)\b|lefthook\b.*\b(run|install)\b|pre-commit.*hook-impl|^\s*INSTALL_PYTHON=|simple-git-hooks|overcommit|yorkie|lint-staged/m;

/** The folders git runs a clone's hooks from: .git/hooks, or core.hooksPath (relative to the clone), and .husky. */
function hookDirs(repo: string, home: string): string[] {
  const dirs = [join(repo, ".git/hooks")];
  const hp = readGitConfig(join(repo, ".git/config"), home, 1).find((e) => e.section === "core" && e.key === "hookspath")?.value;
  if (hp) {
    const d = hp.replace(/^~(?=\/)/, home);
    dirs.push(d.startsWith("/") ? d : join(repo, d));
  }
  dirs.push(join(repo, ".husky"));
  return [...new Set(dirs)];
}

/**
 * Git hooks in local clones (.git/hooks, a clone's core.hooksPath, .husky) and
 * in the global core.hooksPath: they run on commit, checkout or push, with the
 * user's rights. An IOC inside is a compromise; a risk signal, or a recent
 * hook no manager generated, is worth a look.
 */
export function gitHookFindings(clones: string[], home: string, reviewSinceMs: number, content: Matcher[] = [], nowMs = Date.now()): NewFinding[] {
  const out: NewFinding[] = [];
  const seen = new Set<string>();
  const globalHp = globalGitConfig(home).find((e) => e.section === "core" && e.key === "hookspath")?.value;
  const groups: { owner: string; dirs: string[] }[] = clones.map((repo) => ({ owner: repo, dirs: hookDirs(repo, home) }));
  if (globalHp) groups.push({ owner: "every repository (global core.hooksPath)", dirs: [globalHp.replace(/^~(?=\/)/, home)] });
  for (const { owner, dirs } of groups)
    for (const dir of dirs) {
      let names: string[] = [];
      try {
        names = readdirSync(dir);
      } catch {
        continue;
      }
      for (const n of names) {
        // Only names git runs: husky's helpers (h, husky.sh) and stray files are not hooks.
        if (!GIT_HOOKS.has(n)) continue;
        const p = join(dir, n);
        if (seen.has(p)) continue;
        seen.add(p);
        let st: ReturnType<typeof statSync>;
        let text = "";
        try {
          st = statSync(p);
          if (!st.isFile()) continue;
          if (st.size <= 256 * 1024) text = readFileSync(p, "utf8");
        } catch {
          continue;
        }
        const at = new Date(changedMs(st, nowMs)).toISOString();
        const ioc = content.find((x) => x.test(text));
        if (ioc) {
          out.push({
            surface: "host",
            severity: "compromised",
            subject: p,
            title: `Git hook ${n} in ${owner} contains "${ioc.indicator.value}"`,
            at,
            campaign: ioc.campaign.id,
            source: ioc.indicator.source,
            indicator: { type: ioc.indicator.type, value: ioc.indicator.value },
            evidence: { kind: "file", ref: p },
            key: `host|git-hook|${p}|${ioc.indicator.type}:${ioc.indicator.value}`,
          });
          continue;
        }
        const signals = new Set<string>();
        for (const l of text.split("\n").slice(0, 5000)) if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, undefined, home)) signals.add(s);
        // .husky/<hook> is the project's own committed hook and .husky/_ husky's generated stubs (a fresh clone or worktree writes them today): only their content counts.
        const managed = MANAGED_HOOK.test(text) || /(^|\/)\.husky(\/_)?$/.test(dir);
        const recent = changedMs(st, nowMs) >= reviewSinceMs;
        if (!signals.size && (managed || !recent)) continue;
        out.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `Git hook ${n} in ${owner}${signals.size ? ` ${[...signals].join("; ")}` : ` was written recently${backdated(st, nowMs)} and is not from a known hook manager`}: it runs on every ${n.replace(/^(pre|post)-/, "")}`,
          at,
          evidence: { kind: "file", ref: p },
          key: `host|git-hook|${p}`,
        });
      }
    }
  return out;
}
