// AI coding agents as a supply-chain surface. Their configs run commands
// (hooks, status lines, API key helpers) and start MCP servers, often straight
// from a registry with `npx -y`: code that runs at every start and appears in
// no lockfile. Their instruction files (CLAUDE.md, AGENTS.md, rules) steer what
// the agent does, and invisible Unicode there is a known injection trick.
//
// Read-only. Config values are read for commands, packages and URLs only;
// environment values are never copied into a finding except base URLs.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { escapeRegExp } from "../engine.js";
import { packageHit, type Matcher } from "../ioc.js";
import type { Finding } from "../types.js";
import { isVendorAiUrl, pathToken, riskSignals } from "./hostintel.js";

type NewFinding = Omit<Finding, "id">;

export interface AgentMcpServer {
  config: string;
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  /** The server's environment, for its base URLs only (never copied into a finding otherwise). */
  env?: Record<string, unknown>;
  /** The registry package an `npx`/`uvx`/`bunx`/`pnpm dlx` launcher runs, with its pinned version when any. */
  package?: { ecosystem: "npm" | "pypi"; name: string; version?: string };
}

export interface AgentInventory {
  configs: string[];
  commands: { config: string; where: string; command: string }[];
  mcpServers: AgentMcpServer[];
}

const MAX = 2 * 1024 * 1024;

export function readJson(p: string): any {
  try {
    if (statSync(p).size > MAX) return undefined;
    const text = readFileSync(p, "utf8");
    // Some editors keep comments in JSON settings (JSONC): strip line comments outside strings, roughly.
    try {
      return JSON.parse(text);
    } catch {
      return JSON.parse(text.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));
    }
  } catch {
    return undefined;
  }
}

function readText(p: string): string | undefined {
  try {
    if (statSync(p).size > MAX) return undefined;
    return readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
}

/** Home-level agent configs, by tool. */
export function agentConfigPaths(home: string): string[] {
  return [
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".claude.json",
    ".cursor/mcp.json",
    ".cursor/hooks.json",
    ".codex/config.toml",
    ".gemini/settings.json",
    ".codeium/windsurf/mcp_config.json",
    "Library/Application Support/Claude/claude_desktop_config.json",
    ".config/Claude/claude_desktop_config.json",
    "Library/Application Support/Code/User/mcp.json",
    "Library/Application Support/Code/User/settings.json",
    ".config/Code/User/mcp.json",
    ".config/Code/User/settings.json",
  ]
    .map((r) => join(home, r))
    .filter((p) => existsSync(p));
}

/** Claude Code plugins: `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/{hooks/hooks.json,.mcp.json}`, with the version folder (CLAUDE_PLUGIN_ROOT). */
export function pluginConfigPaths(home: string): { path: string; root: string }[] {
  const out: { path: string; root: string }[] = [];
  const cache = join(home, ".claude/plugins/cache");
  for (const market of listDir(cache))
    for (const plugin of listDir(join(cache, market)))
      for (const version of listDir(join(cache, market, plugin)).slice(0, 20)) {
        const root = join(cache, market, plugin, version);
        for (const rel of ["hooks/hooks.json", ".mcp.json"]) if (existsSync(join(root, rel))) out.push({ path: join(root, rel), root });
      }
  return out.slice(0, 500);
}

function listDir(d: string): string[] {
  try {
    return readdirSync(d).filter((n) => !n.startsWith("."));
  } catch {
    return [];
  }
}

/** Per-project agent configs inside a clone. */
export function projectConfigPaths(repo: string): string[] {
  return [
    ".mcp.json",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".cursor/mcp.json",
    ".cursor/hooks.json",
    ".vscode/mcp.json",
    ".gemini/settings.json",
  ]
    .map((r) => join(repo, r))
    .filter((p) => existsSync(p));
}

/** Launcher flags that take a value: the value is not the package. */
const FLAG_WITH_VALUE = new Set([
  "--registry",
  "-p",
  "--package",
  "--python",
  "--from",
  "--with",
  "-c",
  "--call",
  "--cache",
  "--userconfig",
  "--index-url",
  "--extra-index-url",
]);

/** The package an MCP launcher runs: `npx -y pkg@1.2.3`, `uvx pkg==1.0`, `pnpm dlx pkg`, `bunx pkg`, `npm exec pkg`, through `sh -c` or `env` too. */
export function launcherPackage(command: string | undefined, args: string[] = [], depth = 0): AgentMcpServer["package"] {
  if (typeof command !== "string") return undefined;
  const cmd = basename(command);
  // `env A=1 npx pkg`, `sh -c "npx -y pkg"`: unwrap to the launcher.
  if (cmd === "env" && depth < 3) {
    const i = args.findIndex((a) => !/^-|^[A-Za-z_][A-Za-z0-9_]*=/.test(a));
    return i < 0 ? undefined : launcherPackage(args[i], args.slice(i + 1), depth + 1);
  }
  if (/^(ba|z|da)?sh$/.test(cmd) && depth < 3) {
    const line = args[args.indexOf("-c") + 1];
    if (!args.includes("-c") || !line) return undefined;
    const words = line
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/^["']|["']$/g, ""));
    return launcherPackage(words[0], words.slice(1), depth + 1);
  }
  let rest = args;
  let eco: "npm" | "pypi" | undefined;
  if (cmd === "npx" || cmd === "bunx" || cmd === "pnpx") eco = "npm";
  else if ((cmd === "pnpm" || cmd === "yarn") && args[0] === "dlx") {
    eco = "npm";
    rest = args.slice(1);
  } else if (cmd === "npm" && (args[0] === "exec" || args[0] === "x")) {
    eco = "npm";
    rest = args.slice(1);
  } else if (cmd === "bun" && args[0] === "x") {
    eco = "npm";
    rest = args.slice(1);
  } else if (cmd === "uvx" || cmd === "pipx") {
    eco = "pypi";
    if (cmd === "pipx" && args[0] === "run") rest = args.slice(1);
  } else if (cmd === "uv" && args[0] === "tool" && args[1] === "run") {
    eco = "pypi";
    rest = args.slice(2);
  }
  if (!eco) return undefined;
  let spec: string | undefined;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i] as string;
    if (a === "--") continue;
    if (a.startsWith("-")) {
      if (FLAG_WITH_VALUE.has(a)) i++;
      continue;
    }
    spec = a;
    break;
  }
  if (!spec) return undefined;
  if (eco === "npm") {
    const m = /^(@[^/@]+\/[^@]+|[^@]+)(?:@(.+))?$/.exec(spec);
    return m ? { ecosystem: eco, name: m[1] as string, version: m[2] && /^\d/.test(m[2]) ? m[2] : undefined } : undefined;
  }
  const m = /^([A-Za-z0-9_.-]+)(?:==(.+))?/.exec(spec);
  return m ? { ecosystem: eco, name: m[1] as string, version: m[2] } : undefined;
}

/** Every command an agent config runs on its own: hooks, status line, API key helpers. */
function configCommands(j: any): { where: string; command: string }[] {
  const out: { where: string; command: string }[] = [];
  const hooks = j?.hooks;
  if (hooks && typeof hooks === "object")
    for (const [event, list] of Object.entries<any>(hooks))
      for (const entry of Array.isArray(list) ? list : [])
        for (const h of Array.isArray(entry?.hooks) ? entry.hooks : [entry])
          if (typeof h?.command === "string") out.push({ where: `hook ${event}`, command: h.command });
  if (typeof j?.statusLine?.command === "string") out.push({ where: "statusLine", command: j.statusLine.command });
  if (typeof j?.apiKeyHelper === "string") out.push({ where: "apiKeyHelper", command: j.apiKeyHelper });
  if (typeof j?.awsAuthRefresh === "string") out.push({ where: "awsAuthRefresh", command: j.awsAuthRefresh });
  return out;
}

function mcpFrom(j: any, config: string): AgentMcpServer[] {
  const out: AgentMcpServer[] = [];
  const add = (servers: any) => {
    if (!servers || typeof servers !== "object") return;
    for (const [name, s] of Object.entries<any>(servers)) {
      if (!s || typeof s !== "object") continue;
      // Config files are repository content: accept strings only. `command: ["node", "x.js"]` is the array form some tools use.
      let command = typeof s.command === "string" ? s.command : undefined;
      let args: string[] = Array.isArray(s.args) ? s.args.map(String) : [];
      if (Array.isArray(s.command) && s.command.length) {
        command = String(s.command[0] ?? "");
        args = [...s.command.slice(1).map(String), ...args];
      }
      const url = typeof s.url === "string" ? s.url : typeof s.serverUrl === "string" ? s.serverUrl : undefined;
      const env = s.env && typeof s.env === "object" && !Array.isArray(s.env) ? (s.env as Record<string, unknown>) : undefined;
      out.push({ config, name, command, args, url, env, package: launcherPackage(command, args) });
    }
  };
  add(j?.mcpServers);
  add(j?.servers); // VS Code mcp.json
  add(j?.mcp?.servers); // VS Code settings.json
  for (const p of Object.values<any>(j?.projects ?? {})) add(p?.mcpServers); // ~/.claude.json, per project
  return out;
}

/** Codex keeps MCP servers in TOML: [mcp_servers.name] with command = "..." and args = [...]. */
function mcpFromToml(text: string, config: string): AgentMcpServer[] {
  const out: AgentMcpServer[] = [];
  for (const block of text.split(/^\[mcp_servers\./m).slice(1)) {
    const name = /^([^\]]+)\]/.exec(block)?.[1]?.replace(/^"|"$/g, "") ?? "?";
    // [mcp_servers.x.env] and other sub-tables belong to server x, they are not servers.
    if (!/^"/.test(/^([^\]]+)\]/.exec(block)?.[1] ?? "") && name.includes(".")) continue;
    const command = /^\s*command\s*=\s*"([^"]*)"/m.exec(block)?.[1];
    const argsRaw = /^\s*args\s*=\s*\[([^\]]*)\]/m.exec(block)?.[1] ?? "";
    const args = [...argsRaw.matchAll(/"([^"]*)"/g)].map((m) => m[1] as string);
    const url = /^\s*url\s*=\s*"([^"]*)"/m.exec(block)?.[1];
    // [mcp_servers.x.env] KEY = "value"
    const envBlock = new RegExp(`^\\[mcp_servers\\.${escapeRegExp(name)}\\.env\\]([^\\[]*)`, "m").exec(text)?.[1] ?? "";
    const env = Object.fromEntries([...envBlock.matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"([^"]*)"/gm)].map((m) => [m[1] as string, m[2] as string]));
    out.push({ config, name, command, args, url, env, package: launcherPackage(command, args) });
  }
  return out;
}

/** Base URLs that send prompts, code and keys somewhere other than the vendor. */
const BASE_URL_KEYS = /^(ANTHROPIC_BASE_URL|ANTHROPIC_BEDROCK_BASE_URL|OPENAI_BASE_URL|OPENAI_API_BASE|GOOGLE_GEMINI_BASE_URL|GEMINI_BASE_URL)$/;

/** Zero-width and bidi controls, Unicode tag characters, and runs of variation selectors (GlassWorm): text a human cannot see and an agent reads. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]|[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]{3,}/u;
/** Invisible characters that are part of ordinary emoji: a joiner between two pictographs (man + ZWJ + laptop), a flag's tag sequence (🏴 + tags). */
const EMOJI_JOINER = /(?<=\p{Extended_Pictographic}|\uFE0F|[\u{1F3FB}-\u{1F3FF}])\u200D(?=\p{Extended_Pictographic})/gu;
const FLAG_TAGS = /\u{1F3F4}[\u{E0020}-\u{E007E}]+\u{E007F}/gu;
const withoutEmoji = (s: string) => s.replace(EMOJI_JOINER, "").replace(FLAG_TAGS, "");

/** `U+200B x3, U+E0041 x12`: the invisible code points found, so the agent can judge without a hex viewer. */
function codePoints(text: string): { count: number; summary: string } {
  const counts = new Map<string, number>();
  let count = 0;
  for (const m of text.matchAll(new RegExp(INVISIBLE.source, "gu")))
    for (const ch of m[0]) {
      count++;
      const cp = `U+${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;
      counts.set(cp, (counts.get(cp) ?? 0) + 1);
    }
  const summary = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cp, n]) => `${cp} x${n}`)
    .join(", ");
  return { count, summary };
}

export const INSTRUCTION_FILES = [
  "CLAUDE.md",
  "CLAUDE.local.md",
  ".claude/CLAUDE.md",
  "AGENTS.md",
  "GEMINI.md",
  ".cursorrules",
  ".windsurfrules",
  ".clinerules",
  ".github/copilot-instructions.md",
];
/** Instruction files by name wherever they sit in a clone (a nested packages/x/CLAUDE.md is loaded too). */
const NESTED_INSTRUCTIONS = new Set(["CLAUDE.md", "AGENTS.md", "GEMINI.md", "CLAUDE.local.md"]);

/** Folders whose .md files steer an agent: rules, slash commands, sub-agents, Copilot instructions. */
function steeringFiles(dir: string): string[] {
  return [...ruleFiles(join(dir, ".cursor/rules")), ...ruleFiles(join(dir, ".claude/rules")), ...ruleFiles(join(dir, ".github/instructions"))];
}

/** Files that tell the agent what to do and may tell it to run something: skills, slash commands, sub-agents. */
function commandingFiles(dir: string): string[] {
  return [
    ...ruleFiles(join(dir, ".claude/commands")),
    ...ruleFiles(join(dir, ".claude/agents")),
    ...listDir(join(dir, ".claude/skills"))
      .slice(0, 200)
      .map((s) => join(dir, ".claude/skills", s, "SKILL.md")),
  ];
}

/** A config's project folder: the clone for `<clone>/.claude/settings.json` or `<clone>/.mcp.json`, none for a home config. */
function projectRoot(config: string, clones: string[]): string | undefined {
  return clones.filter((c) => config.startsWith(`${c}/`)).sort((a, b) => b.length - a.length)[0];
}

/**
 * The script a hook command runs: the first token that is an existing file,
 * once quotes are off and `$CLAUDE_PROJECT_DIR`, `${CLAUDE_PLUGIN_ROOT}`,
 * `$HOME` and `~` are expanded; a relative token resolves against the project.
 */
export function hookScript(command: string, home: string, project?: string, pluginRoot?: string): string | undefined {
  const expanded = command
    .replace(/\$\{?CLAUDE_PROJECT_DIR\}?/g, project ?? "\0")
    .replace(/\$\{?CLAUDE_PLUGIN_ROOT\}?/g, pluginRoot ?? "\0")
    .replace(/["']/g, "");
  for (const raw of expanded.split(/\s+/)) {
    if (!raw || raw.includes("\0")) continue;
    const t = pathToken(raw, home);
    const base = pluginRoot ?? project;
    const p = t.startsWith("/") ? t : base && t.includes("/") && !t.startsWith("-") && !/^\w+:\/\//.test(t) ? resolve(base, t) : undefined;
    if (!p) continue;
    try {
      if (statSync(p).isFile()) return p;
    } catch {}
  }
  return undefined;
}

export function scanAgents(
  home: string,
  clones: string[],
  m: { content: Matcher[]; pkg: Matcher[] },
  opts: { files?: string[] } = {},
): { findings: NewFinding[]; inventory: AgentInventory; instructionFiles: number } {
  const findings: NewFinding[] = [];
  const inventory: AgentInventory = { configs: [], commands: [], mcpServers: [] };
  const plugins = pluginConfigPaths(home);
  const pluginRootOf = new Map(plugins.map((x) => [x.path, x.root]));
  const configs = [...agentConfigPaths(home), ...plugins.map((x) => x.path), ...clones.flatMap(projectConfigPaths)];
  const add = (f: Omit<NewFinding, "surface">) => findings.push({ surface: "host", ...f });
  const iocHit = (subject: string, title: string, ioc: Matcher, ref = subject) =>
    add({
      severity: "compromised",
      subject,
      title,
      campaign: ioc.campaign.id,
      source: ioc.indicator.source,
      indicator: { type: ioc.indicator.type, value: ioc.indicator.value },
      evidence: { kind: "file", ref },
      key: `host|agent|${subject}|${ioc.indicator.value}`,
    });
  const baseUrls = (p: string, env: Record<string, unknown>, where = "") => {
    for (const [k, v] of Object.entries(env))
      if (BASE_URL_KEYS.test(k) && typeof v === "string" && v.trim() && !isVendorAiUrl(v))
        add({
          severity: "suspicious",
          subject: p,
          title: `AI agent config ${p}${where} sends ${k} to ${v}: prompts, code and keys go there; check you set it`,
          evidence: { kind: "file", ref: p, excerpt: `${k}=${v}` },
          key: `host|agent-baseurl|${p}|${where}|${k}`,
        });
  };

  for (const p of configs) {
    inventory.configs.push(p);
    const isToml = p.endsWith(".toml");
    const text = readText(p) ?? "";
    const j = isToml ? undefined : readJson(p);
    const project = projectRoot(p, clones);
    // IOC strings anywhere in an agent config (a C2 URL in a hook, an attacker package).
    const ioc = m.content.find((x) => x.test(text));
    if (ioc) iocHit(p, `AI agent config ${p} contains "${ioc.indicator.value}"`, ioc);
    for (const c of j ? configCommands(j) : []) {
      inventory.commands.push({ config: p, ...c });
      // Judge what the hook runs, not where it lives: the command line, then the script it points to.
      const script = hookScript(c.command, home, project, pluginRootOf.get(p));
      const s = scriptSignals(script, home, m.content);
      if (s.ioc && script) {
        iocHit(script, `AI agent ${c.where} in ${p} runs ${script}, which contains "${s.ioc.indicator.value}"`, s.ioc);
        continue;
      }
      const signals = [...new Set([...riskSignals(c.command, undefined, home, { location: false }), ...s.signals])];
      if (signals.length)
        add({
          severity: "suspicious",
          subject: p,
          title: `AI agent ${c.where} in ${p} ${signals.join("; ")}: ${c.command.slice(0, 160)}`,
          evidence: { kind: "file", ref: p, excerpt: c.command.slice(0, 300) },
          key: `host|agent-cmd|${p}|${c.where}|${c.command.slice(0, 80)}`,
        });
    }
    baseUrls(p, j?.env && typeof j.env === "object" ? (j.env as Record<string, unknown>) : {});
    if (isToml)
      for (const mm of text.matchAll(/^\s*(openai_base_url|base_url)\s*=\s*"([^"]*)"/gm))
        if (mm[2] && !isVendorAiUrl(mm[2]))
          add({
            severity: "suspicious",
            subject: p,
            title: `AI agent config ${p} sends ${mm[1]} to ${mm[2]}: prompts, code and keys go there; check you set it`,
            evidence: { kind: "file", ref: p, excerpt: `${mm[1]} = ${mm[2]}` },
            key: `host|agent-baseurl|${p}|${mm[1]}|${mm[2]}`,
          });
    // A repository that turns off the agent's permission prompts or trusts every MCP server it ships.
    if (project && j) {
      if (j.permissions?.defaultMode === "bypassPermissions" || j.enableAllProjectMcpServers === true)
        add({
          severity: "suspicious",
          subject: p,
          title: `Project agent config ${p} ${j.permissions?.defaultMode === "bypassPermissions" ? "turns off permission prompts (bypassPermissions)" : "trusts every MCP server the repository ships (enableAllProjectMcpServers)"}`,
          evidence: { kind: "file", ref: p },
          key: `host|agent-trust|${p}`,
        });
    }
    const servers = isToml ? mcpFromToml(text, p) : j ? mcpFrom(j, p) : [];
    for (const s of servers) {
      inventory.mcpServers.push({ ...s, env: undefined });
      if (s.env) baseUrls(p, s.env, ` (MCP server "${s.name}")`);
      const line = [s.command, ...(s.args ?? [])].filter(Boolean).join(" ");
      const signals = line ? riskSignals(line, s.command, home) : [];
      const pkgHit = s.package
        ? m.pkg.find((x) => packageHit(x.indicator, s.package!.ecosystem, s.package!.name, s.package!.version ?? x.indicator.versions?.[0] ?? ""))
        : // Backstop: a launcher this parser does not know still names the package on its command line.
          m.pkg.find(
            (x) =>
              ["npm", "pypi"].includes((x.indicator.ecosystem ?? "").toLowerCase()) &&
              line.split(/[\s"'=]+/).some((t) => t.replace(/@[^@/]*$/, "") === x.indicator.value),
          );
      if (pkgHit)
        add({
          severity: s.package?.version ? "compromised" : "exposed",
          subject: p,
          title: `MCP server "${s.name}" in ${p} runs ${s.package?.name ?? pkgHit.indicator.value}${s.package?.version ? `@${s.package.version}` : " (unpinned: the latest version at each start)"}, named by the campaign`,
          campaign: pkgHit.campaign.id,
          source: pkgHit.indicator.source,
          indicator: { type: "package", value: pkgHit.indicator.value },
          evidence: { kind: "file", ref: p, excerpt: line.slice(0, 300) },
          key: `host|mcp-ioc|${p}|${s.name}`,
        });
      else if (signals.length)
        add({
          severity: "suspicious",
          subject: p,
          title: `MCP server "${s.name}" in ${p} ${signals.join("; ")}: ${line.slice(0, 160)}`,
          evidence: { kind: "file", ref: p, excerpt: line.slice(0, 300) },
          key: `host|mcp-risk|${p}|${s.name}`,
        });
    }
  }

  // The same server is often listed in several configs (one per project): count each package once.
  const unpinned = [...new Map(inventory.mcpServers.filter((s) => s.package && !s.package.version).map((s) => [s.package?.name, s])).values()];
  if (unpinned.length)
    add({
      severity: "info",
      subject: "MCP servers",
      title: `${unpinned.length} MCP server(s) start an unpinned registry package at every launch (${unpinned
        .slice(0, 5)
        .map((s) => s.package?.name)
        .join(", ")}${unpinned.length > 5 ? ", ..." : ""}): a compromised release would run without any install step; pin a version`,
      evidence: { kind: "file", ref: "host-inventory.json" },
      key: "host|mcp-unpinned",
    });

  // Instruction files: invisible characters and IOC strings, in the home folder, every clone, skills and commands.
  let instructionFiles = 0;
  const steering = new Set<string>();
  const commanding = new Set<string>();
  for (const d of [join(home, ".claude"), ...clones]) {
    for (const f of [...INSTRUCTION_FILES.map((x) => join(d, x)), ...steeringFiles(d)]) steering.add(f);
    for (const f of commandingFiles(d)) commanding.add(f);
  }
  for (const f of [join(home, ".codex/AGENTS.md"), join(home, ".gemini/GEMINI.md")]) steering.add(f);
  for (const root of [join(home, ".claude/skills"), join(home, ".agents/skills")])
    for (const s of listDir(root).slice(0, 200)) commanding.add(join(root, s, "SKILL.md"));
  for (const f of (opts.files ?? []).filter((x) => NESTED_INSTRUCTIONS.has(basename(x))).slice(0, 2000)) steering.add(f);
  for (const p of [...steering, ...commanding]) {
    const text = existsSync(p) ? readText(p) : undefined;
    if (text === undefined) continue;
    instructionFiles++;
    const ioc = m.content.find((x) => x.test(text));
    if (ioc) {
      iocHit(p, `Agent instruction file ${p} contains "${ioc.indicator.value}"`, ioc);
      continue;
    }
    const lines = text.split("\n");
    const visible = (l: string, i: number) => withoutEmoji(i === 0 ? l.replace(/^\uFEFF/, "") : l);
    const ln = lines.findIndex((l, i) => INVISIBLE.test(visible(l, i)));
    if (ln >= 0) {
      const { count, summary } = codePoints(lines.map(visible).join("\n"));
      add({
        severity: "suspicious",
        subject: p,
        title: `Agent instruction file ${p} holds ${count} invisible character(s) (${summary}: zero-width, bidi, tag characters or variation selectors), a known prompt-injection trick: read it with a hex viewer`,
        evidence: { kind: "file", ref: `${p}:${ln + 1}` },
        key: `host|invisible|${p}`,
      });
      continue;
    }
    // A skill or command that tells the agent to fetch and run code (the ClawHavoc skills).
    if (commanding.has(p)) {
      const i = lines.findIndex((l) => riskSignals(l, undefined, home, { location: false }).length > 0);
      if (i >= 0)
        add({
          severity: "suspicious",
          subject: p,
          title: `Agent skill or command ${p} line ${i + 1} ${riskSignals(lines[i] ?? "", undefined, home, { location: false }).join("; ")}: the agent may run it`,
          evidence: { kind: "file", ref: `${p}:${i + 1}`, excerpt: (lines[i] ?? "").trim().slice(0, 200) },
          key: `host|agent-skill|${p}`,
        });
    }
  }
  return { findings, inventory, instructionFiles };
}

/** A base64 or hex run this long is a payload, not code. */
const BLOB = /[A-Za-z0-9+/=]{10000,}|[0-9a-fA-F]{10000,}/;

/**
 * Strong signals in a script a hook or server runs (bounded read), an IOC in
 * it, and the same for one level of local imports. Where it lives is not a signal here.
 */
function scriptSignals(path: string | undefined, home: string, content: Matcher[] = [], depth = 0): { signals: string[]; ioc?: Matcher } {
  if (!path) return { signals: [] };
  let size = 0;
  try {
    size = statSync(path).size;
  } catch {
    return { signals: [] };
  }
  if (size > MAX) return { signals: [`its script ${basename(path)} is over 2 MB`] };
  const text = readText(path);
  if (!text) return { signals: [] };
  const ioc = content.find((x) => x.test(text));
  if (ioc) return { signals: [], ioc };
  const out = new Set<string>();
  const lines = text.split("\n");
  for (const l of lines.slice(0, 5000))
    if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, undefined, home, { location: false })) out.add(`its script ${basename(path)} ${s}`);
  if (lines.some((l) => l.length >= 20_000) || BLOB.test(text)) out.add(`its script ${basename(path)} holds a large encoded blob`);
  if (depth === 0)
    for (const mm of [...text.matchAll(/(?:require\(|import\(|from\s+|import\s+)\s*["'](\.{1,2}\/[^"']+)["']/g)].slice(0, 20)) {
      const base = resolve(dirname(path), mm[1] as string);
      const target = [base, `${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.ts`].find((x) => {
        try {
          return statSync(x).isFile();
        } catch {
          return false;
        }
      });
      const sub = scriptSignals(target, home, content, 1);
      if (sub.ioc) return { signals: [...out], ioc: sub.ioc };
      for (const x of sub.signals) out.add(x);
    }
  return { signals: [...out] };
}

function ruleFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => /\.(mdc|md)$/.test(f))
      .slice(0, 200)
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}
