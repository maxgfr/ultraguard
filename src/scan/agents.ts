// AI coding agents as a supply-chain surface. Their configs run commands
// (hooks, status lines, API key helpers) and start MCP servers, often straight
// from a registry with `npx -y`: code that runs at every start and appears in
// no lockfile. Their instruction files (CLAUDE.md, AGENTS.md, rules) steer what
// the agent does, and invisible Unicode there is a known injection trick.
//
// Read-only. Config values are read for commands, packages and URLs only;
// environment values are never copied into a finding except base URLs.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { packageHit, type Matcher } from "../ioc.js";
import type { Finding } from "../types.js";
import { riskSignals } from "./hostintel.js";

type NewFinding = Omit<Finding, "id">;

export interface AgentMcpServer {
  config: string;
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  /** The registry package an `npx`/`uvx`/`bunx`/`pnpm dlx` launcher runs, with its pinned version when any. */
  package?: { ecosystem: "npm" | "pypi"; name: string; version?: string };
}

export interface AgentInventory {
  configs: string[];
  commands: { config: string; where: string; command: string }[];
  mcpServers: AgentMcpServer[];
}

const MAX = 2 * 1024 * 1024;

function readJson(p: string): any {
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

/** The package an MCP launcher runs: `npx -y pkg@1.2.3`, `uvx pkg==1.0`, `pnpm dlx pkg`, `bunx pkg`. */
export function launcherPackage(command: string | undefined, args: string[] = []): AgentMcpServer["package"] {
  const cmd = basename(command ?? "");
  let rest = args;
  let eco: "npm" | "pypi" | undefined;
  if (cmd === "npx" || cmd === "bunx") eco = "npm";
  else if ((cmd === "pnpm" || cmd === "yarn") && args[0] === "dlx") {
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
  const spec = rest.find((a) => !a.startsWith("-"));
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
      const args = Array.isArray(s.args) ? s.args.map(String) : [];
      out.push({ config, name, command: s.command, args, url: s.url ?? s.serverUrl, package: launcherPackage(s.command, args) });
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
    out.push({ config, name, command, args, url, package: launcherPackage(command, args) });
  }
  return out;
}

/** Base URLs that send prompts, code and keys somewhere other than the vendor. */
const BASE_URL_KEYS = /^(ANTHROPIC_BASE_URL|ANTHROPIC_BEDROCK_BASE_URL|OPENAI_BASE_URL|OPENAI_API_BASE|GOOGLE_GEMINI_BASE_URL|GEMINI_BASE_URL)$/;
const VENDOR_HOST = /^https:\/\/([a-z0-9-]+\.)*(anthropic\.com|openai\.com|googleapis\.com|azure\.com|amazonaws\.com)(\/|$)/i;

/** Zero-width and bidi controls, and Unicode tag characters: text a human cannot see and an agent reads. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/u;
export const INSTRUCTION_FILES = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursorrules", ".windsurfrules", ".github/copilot-instructions.md"];

export function scanAgents(
  home: string,
  clones: string[],
  m: { content: Matcher[]; pkg: Matcher[] },
): { findings: NewFinding[]; inventory: AgentInventory; instructionFiles: number } {
  const findings: NewFinding[] = [];
  const inventory: AgentInventory = { configs: [], commands: [], mcpServers: [] };
  const configs = [...agentConfigPaths(home), ...clones.flatMap(projectConfigPaths)];
  const add = (f: Omit<NewFinding, "surface">) => findings.push({ surface: "host", ...f });

  for (const p of configs) {
    inventory.configs.push(p);
    const isToml = p.endsWith(".toml");
    const text = readText(p) ?? "";
    const j = isToml ? undefined : readJson(p);
    // IOC strings anywhere in an agent config (a C2 URL in a hook, an attacker package).
    const ioc = m.content.find((x) => x.test(text));
    if (ioc)
      add({
        severity: "compromised",
        subject: p,
        title: `AI agent config ${p} contains "${ioc.indicator.value}"`,
        campaign: ioc.campaign.id,
        source: ioc.indicator.source,
        indicator: { type: ioc.indicator.type, value: ioc.indicator.value },
        evidence: { kind: "file", ref: p },
        key: `host|agent|${p}|${ioc.indicator.value}`,
      });
    for (const c of j ? configCommands(j) : []) {
      inventory.commands.push({ config: p, ...c });
      // Judge what the hook runs, not where it lives: the command line, then the script it points to.
      const script = c.command
        .trim()
        .split(/\s+/)
        .find((t) => t.startsWith("/") || t.startsWith("~/"));
      const signals = [
        ...new Set([...riskSignals(c.command, undefined, home, { location: false }), ...scriptSignals(script?.replace(/^~(?=\/)/, home), home)]),
      ];
      if (signals.length)
        add({
          severity: "suspicious",
          subject: p,
          title: `AI agent ${c.where} in ${p} ${signals.join("; ")}: ${c.command.slice(0, 160)}`,
          evidence: { kind: "file", ref: p, excerpt: c.command.slice(0, 300) },
          key: `host|agent-cmd|${p}|${c.where}|${c.command.slice(0, 80)}`,
        });
    }
    const env = j?.env && typeof j.env === "object" ? (j.env as Record<string, unknown>) : {};
    for (const [k, v] of Object.entries(env))
      if (BASE_URL_KEYS.test(k) && typeof v === "string" && !VENDOR_HOST.test(v))
        add({
          severity: "suspicious",
          subject: p,
          title: `AI agent config ${p} sends ${k} to ${v}: prompts, code and keys go there; check you set it`,
          evidence: { kind: "file", ref: p, excerpt: `${k}=${v}` },
          key: `host|agent-baseurl|${p}|${k}`,
        });
    const servers = isToml ? mcpFromToml(text, p) : j ? mcpFrom(j, p) : [];
    for (const s of servers) {
      inventory.mcpServers.push(s);
      const line = [s.command, ...(s.args ?? [])].filter(Boolean).join(" ");
      const signals = line ? riskSignals(line, s.command, home) : [];
      const pkgHit = s.package
        ? m.pkg.find((x) => packageHit(x.indicator, s.package!.ecosystem, s.package!.name, s.package!.version ?? x.indicator.versions?.[0] ?? ""))
        : undefined;
      if (pkgHit)
        add({
          severity: s.package?.version ? "compromised" : "exposed",
          subject: p,
          title: `MCP server "${s.name}" in ${p} runs ${s.package?.name}${s.package?.version ? `@${s.package.version}` : " (unpinned: the latest version at each start)"}, named by the campaign`,
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

  // Instruction files with invisible characters: in the home folder and every clone.
  let instructionFiles = 0;
  const dirs = [join(home, ".claude"), ...clones];
  for (const d of dirs) {
    const files = [...INSTRUCTION_FILES.map((f) => join(d, f)), ...ruleFiles(join(d, ".cursor/rules"))];
    for (const p of files) {
      const text = existsSync(p) ? readText(p) : undefined;
      if (text === undefined) continue;
      instructionFiles++;
      const lines = text.split("\n");
      const ln = lines.findIndex((l, i) => INVISIBLE.test(i === 0 ? l.replace(/^\uFEFF/, "") : l));
      if (ln < 0) continue;
      const count = [...text.matchAll(new RegExp(INVISIBLE.source, "gu"))].length;
      add({
        severity: "suspicious",
        subject: p,
        title: `Agent instruction file ${p} holds ${count} invisible character(s) (zero-width, bidi or tag characters), a known prompt-injection trick: read it with a hex viewer`,
        evidence: { kind: "file", ref: `${p}:${ln + 1}` },
        key: `host|invisible|${p}`,
      });
    }
  }
  return { findings, inventory, instructionFiles };
}

/** Strong signals in a script a hook or server runs (bounded read). Where it lives is not a signal here. */
function scriptSignals(path: string | undefined, home: string): string[] {
  if (!path) return [];
  const text = readText(path);
  if (!text) return [];
  const out = new Set<string>();
  for (const l of text.split("\n").slice(0, 5000))
    if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, undefined, home, { location: false })) out.add(`its script ${basename(path)} ${s}`);
  return [...out];
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
