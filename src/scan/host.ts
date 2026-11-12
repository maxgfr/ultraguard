// scan host: the machine the agent runs on, macOS or Linux.
//
// IOC matches (a file, a hash, a cron tag, a connection to a C2 address) are
// findings on their own. Things that merely CHANGED in the campaign window
// (a new LaunchAgent, a VS Code task that runs on folder open) are
// "suspicious": the scan cannot tell a fresh install from a dropper, the agent
// and the user can, so the report asks them to judge.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { basename, join } from "node:path";
import { type Matcher, matchers, reviewStart } from "../ioc.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import {
  configFindings,
  credentialInventory,
  type HostInventory,
  processFindings,
  recentExtensions,
  riskSignals,
  type StartupItem,
  shellStartupFindings,
  signerOf,
  startupCommand,
} from "./hostintel.js";
import type { WalkResult } from "./walk.js";

type NewFinding = Omit<Finding, "id">;

export interface HostScanOptions {
  home?: string;
  platform?: NodeJS.Platform;
  now?: Date;
  /** Repositories the GitHub scan found hit: a local clone of one is exposure. */
  hitRepos?: string[];
  /** Directories that hold startup items, overriding the platform defaults (tests). */
  startupDirs?: string[];
  /** Skip commands that read live system state (crontab, lsof, ps): tests and sandboxes. */
  skipLive?: boolean;
}

const MAX_HASH_BYTES = 50 * 1024 * 1024;

function sha256File(p: string): string | undefined {
  try {
    if (statSync(p).size > MAX_HASH_BYTES) return undefined;
    return createHash("sha256").update(readFileSync(p)).digest("hex");
  } catch {
    return undefined;
  }
}

function readText(p: string, max = 2 * 1024 * 1024): string | undefined {
  try {
    if (statSync(p).size > max) return undefined;
    return readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
}

function hitOf(
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

function startupDirs(home: string, os: NodeJS.Platform): string[] {
  if (os === "darwin") return [join(home, "Library/LaunchAgents"), "/Library/LaunchAgents", "/Library/LaunchDaemons"];
  return [join(home, ".config/systemd/user"), join(home, ".config/autostart"), "/etc/systemd/system", "/etc/cron.d", "/etc/xdg/autostart"];
}

export async function scanHost(
  iocs: IocFile,
  tree: WalkResult,
  runner: Runner,
  opts: HostScanOptions = {},
): Promise<{ result: SurfaceResult; findings: NewFinding[]; gaps: Gap[]; inventory: HostInventory }> {
  const home = opts.home ?? homedir();
  const os = opts.platform ?? platform();
  // Startup items changed without an IOC are worth a look over the last 30 days at most.
  const sinceMs = Date.parse(reviewStart(iocs, opts.now));
  const result: SurfaceResult = { surface: "host", scanned: true, stats: {}, startedAt: (opts.now ?? new Date()).toISOString() };
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const inventory: HostInventory = { startupItems: [], credentials: [], recentExtensions: [], shellStartup: [] };

  const M = {
    file: matchers(iocs, "file", "workflow_file"),
    hash: matchers(iocs, "sha256"),
    content: matchers(iocs, "string", "ip", "domain", "url", "cron_tag"),
    net: matchers(iocs, "ip", "domain"),
    process: matchers(iocs, "process"),
    pkg: matchers(iocs, "package").filter((m) => (m.indicator.ecosystem ?? "").toLowerCase().startsWith("vs") || m.indicator.ecosystem === "openvsx"),
  };
  const hashes = new Map(M.hash.map((m) => [m.indicator.value.toLowerCase(), m]));

  // 1. Files named like an IOC, and their hashes.
  result.stats.files = tree.files.length;
  for (const p of tree.files) {
    const m = M.file.find((x) => x.test(p));
    if (!m) continue;
    const digest = sha256File(p);
    const hashHit = digest ? hashes.get(digest) : undefined;
    // A weak name (one ordinary files also have) is only suspicious on its own;
    // its hash, when the campaign publishes it, settles it.
    const campaignHashes = M.hash.filter((h) => h.campaign.id === m.campaign.id).length;
    // An exact file name (no wildcard) from a campaign that publishes hashes is
    // identified by those hashes: matching the name but none of them is most
    // likely the ordinary file of that name. A wildcard pattern (a random-named
    // dropper like `.ci-*.sh`) stays strong.
    const exactName = !/[*?]/.test(m.indicator.value) && !m.indicator.regex;
    const nameOnly = !hashHit && (!!m.indicator.weak || (exactName && campaignHashes > 0));
    findings.push(
      hitOf(hashHit ?? m, {
        subject: p,
        severity: nameOnly ? "suspicious" : "compromised",
        title: hashHit
          ? `File ${p} matches the sha256`
          : nameOnly
            ? `File ${p} is named like "${m.indicator.value}"${m.indicator.weak ? " (a common name)" : ""}${campaignHashes ? `, but its sha256 matches none of the campaign's ${campaignHashes} hash(es)` : ""}`
            : `File ${p} matches "${m.indicator.value}"`,
        evidence: { kind: "file", ref: p, excerpt: digest ? `sha256=${digest}` : undefined },
      }),
    );
  }
  if (tree.capped)
    gaps.push({
      surface: "host",
      what: `files past the first ${tree.entries} entries`,
      why: "the walk is capped",
      fix: "re-run with --roots narrowed to your code folders",
    });
  if (tree.unreadable)
    gaps.push({
      surface: "host",
      what: `${tree.unreadable} unreadable directories`,
      why: "permission denied (macOS privacy protection or another user's files)",
    });
  if (hashes.size) gaps.push({ surface: "host", what: "sha256 of every file", why: "only files named like an IOC and startup items are hashed" });

  // 2. VS Code tasks that run when a folder opens: how GhostActions re-runs its stealer.
  for (const dir of tree.vscodeDirs) {
    const p = join(dir, "tasks.json");
    const text = existsSync(p) ? readText(p) : undefined;
    if (!text || !/"runOn"\s*:\s*"folderOpen"/.test(text)) continue;
    const line = text.split("\n").findIndex((l) => /folderOpen/.test(l)) + 1;
    const cmd = /"command"\s*:\s*"([^"]+)"/.exec(text)?.[1];
    const m = M.content.find((x) => x.test(text));
    if (m)
      findings.push(
        hitOf(m, {
          subject: p,
          title: `VS Code task in ${p} runs on folder open and contains "${m.indicator.value}"`,
          evidence: { kind: "file", ref: `${p}:${line}`, excerpt: cmd },
        }),
      );
    else
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: p,
        title: `VS Code task runs automatically when the folder opens${cmd ? `: ${cmd}` : ""}`,
        evidence: { kind: "file", ref: `${p}:${line}`, excerpt: cmd },
        key: `host|${p}|folderOpen`,
      });
  }
  result.stats.vscodeDirs = tree.vscodeDirs.length;

  // 3. Startup items: an IOC inside is a compromise. Without one, the item's
  // facts decide: who signed what it runs, where that lives, what the command
  // does, and whether it changed recently. A risk signal is worth a look
  // whatever the date; a recent change is worth a look with its facts.
  let startupCount = 0;
  for (const dir of opts.startupDirs ?? startupDirs(home, os)) {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const p = join(dir, name);
      let st: ReturnType<typeof statSync>;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      startupCount++;
      const text = readText(p) ?? "";
      const m = M.content.find((x) => x.test(text)) ?? (hashes.size ? hashes.get(sha256File(p) ?? "") : undefined);
      const { command, executable } = startupCommand(text);
      const item: StartupItem = { path: p, mtime: st.mtime.toISOString(), command, executable, signals: riskSignals(command, executable, home) };
      if (executable?.startsWith("/")) {
        item.exists = existsSync(executable);
        if (!item.exists) item.signals.push("points to a program that no longer exists");
        else if (os === "darwin" && !opts.skipLive) {
          const sig = await signerOf(runner, executable);
          if (sig) {
            item.signed = sig.signed;
            item.signer = sig.signer;
            item.team = sig.team;
            if (!sig.signed) item.signals.push(`is not signed by any developer${sig.signer ? ` (${sig.signer})` : ""}`);
          }
        }
      }
      inventory.startupItems.push(item);
      const recent = st.mtimeMs >= sinceMs;
      const facts = [
        command ? `runs ${command.slice(0, 160)}` : "no program found",
        item.signer ? `signed by ${item.signer}${item.team ? ` (team ${item.team})` : ""}` : undefined,
        ...item.signals,
      ].filter(Boolean);
      // A strong signal (fetch-and-run, reverse shell, temp folder) is suspicious at any date.
      const strong = item.signals.some((s) => !s.startsWith("points to") && !s.startsWith("is not signed"));
      if (m)
        findings.push(
          hitOf(m, {
            subject: p,
            title: `Startup item ${p} contains "${m.indicator.value}"`,
            at: item.mtime,
            evidence: { kind: "file", ref: p, excerpt: command },
          }),
        );
      else if (strong || recent)
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `${strong ? "Risky startup item" : "Startup item"} ${basename(p)}${recent ? " was written recently" : ""}: ${facts.join("; ")}`,
          at: item.mtime,
          evidence: { kind: "file", ref: p, excerpt: command.slice(0, 300) },
          key: `host|${p}|startup`,
        });
    }
  }
  result.stats.startupItems = startupCount;

  // 4. Shell startup files (risk signals), and package-manager, git and SSH settings.
  const rc = shellStartupFindings(home);
  findings.push(...rc.findings);
  inventory.shellStartup = rc.lines;
  findings.push(...configFindings(home, sinceMs));

  // 5. Shell history, startup files and /etc/hosts: a C2 address typed, pinned or wired in.
  const traces = [".zsh_history", ".bash_history", ".local/share/fish/fish_history", ".python_history", ".zshrc", ".bashrc", ".profile", ".zprofile"].map((f) =>
    join(home, f),
  );
  traces.push("/etc/hosts");
  for (const p of traces) {
    const text = existsSync(p) ? readText(p, 20 * 1024 * 1024) : undefined;
    if (!text) continue;
    const lines = text.split("\n");
    for (const m of M.content) {
      const ln = lines.findIndex((l) => m.test(l));
      if (ln < 0) continue;
      findings.push(
        hitOf(m, {
          subject: p,
          // In history it was typed (maybe while investigating); in a startup file or /etc/hosts it is wired in.
          severity: /_history$/.test(p) ? "exposed" : "compromised",
          title: `${p} line ${ln + 1} mentions "${m.indicator.value}"`,
          evidence: {
            kind: "file",
            ref: `${p}:${ln + 1}`,
            excerpt: (lines[ln] ?? "")
              .replace(/^: \d+:\d+;/, "")
              .trim()
              .slice(0, 200),
          },
        }),
      );
    }
  }

  // 5. Editor extensions named by an IOC (VS Code, Cursor, Windsurf, VSCodium).
  let extensions = 0;
  for (const dir of [".vscode/extensions", ".vscode-insiders/extensions", ".cursor/extensions", ".windsurf/extensions", ".vscode-oss/extensions"].map((d) =>
    join(home, d),
  )) {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const mm = /^(.+?)-(\d+\.\d+\.\d+.*)$/.exec(name);
      if (!mm) continue;
      extensions++;
      const [, id, version] = mm as unknown as [string, string, string];
      const m = M.pkg.find(
        (x) => x.indicator.value.toLowerCase() === id.toLowerCase() && (!x.indicator.versions?.length || x.indicator.versions.includes(version)),
      );
      if (m)
        findings.push(
          hitOf(m, { subject: join(dir, name), title: `Editor extension ${id}@${version} is installed`, evidence: { kind: "file", ref: join(dir, name) } }),
        );
    }
  }
  result.stats.extensions = extensions;
  const ext = recentExtensions(home, sinceMs);
  findings.push(...ext.findings);
  inventory.recentExtensions = ext.list;

  // 6. Local clones of repositories the GitHub scan found hit.
  if (opts.hitRepos?.length) {
    const wanted = new Set(opts.hitRepos.map((r) => r.toLowerCase()));
    for (const dir of tree.gitDirs) {
      const cfg = readText(join(dir, ".git/config")) ?? "";
      const urls = [...cfg.matchAll(/url\s*=\s*(\S+)/g)].map((x) => x[1] ?? "");
      const repo = urls.map((u) => /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/.exec(u)?.[1]?.toLowerCase()).find((r) => r && wanted.has(r));
      if (!repo) continue;
      let fetched: string | undefined;
      try {
        fetched = statSync(join(dir, ".git/FETCH_HEAD")).mtime.toISOString();
      } catch {}
      findings.push({
        surface: "host",
        severity: "exposed",
        subject: dir,
        title: `Local clone of ${repo}, a repository the GitHub scan found hit${fetched ? ` (last fetch ${fetched})` : ""}`,
        at: fetched,
        evidence: { kind: "file", ref: join(dir, ".git/config") },
        key: `host|${dir}|clone|${repo}`,
      });
    }
  }
  result.stats.clones = tree.gitDirs.length;

  // 7. Live state: crontab, open connections, running processes.
  if (!opts.skipLive) {
    const cron = await runner("crontab", ["-l"], { timeoutMs: 10_000 });
    if (cron.ok) {
      const lines = cron.stdout.split("\n");
      for (const m of M.content) {
        const ln = lines.findIndex((l) => m.test(l));
        if (ln >= 0)
          findings.push(
            hitOf(m, {
              subject: "crontab",
              title: `crontab line ${ln + 1} contains "${m.indicator.value}"`,
              evidence: { kind: "command", ref: "crontab -l", excerpt: lines[ln]?.slice(0, 200) },
            }),
          );
      }
      lines.forEach((l, i) => {
        if (/^\s*#/.test(l) || !l.trim()) return;
        const signals = riskSignals(l, undefined, home);
        if (signals.length)
          findings.push({
            surface: "host",
            severity: "suspicious",
            subject: "crontab",
            title: `crontab line ${i + 1} ${signals.join("; ")}`,
            evidence: { kind: "command", ref: "crontab -l", excerpt: l.slice(0, 200) },
            key: `host|crontab|${i + 1}`,
          });
      });
    }
    const net = os === "darwin" ? await runner("lsof", ["-nPi"], { timeoutMs: 20_000 }) : await runner("ss", ["-tunap"], { timeoutMs: 20_000 });
    if (net.ok) {
      const lines = net.stdout.split("\n");
      result.stats.connections = lines.length;
      for (const m of M.net) {
        const line = lines.find((l) => m.test(l));
        if (line)
          findings.push(
            hitOf(m, {
              subject: "network",
              title: `Open connection to ${m.indicator.value}`,
              evidence: { kind: "command", ref: os === "darwin" ? "lsof -nPi" : "ss -tunap", excerpt: line.trim().slice(0, 200) },
            }),
          );
      }
      if (M.net.some((m) => m.indicator.type === "domain"))
        gaps.push({ surface: "host", what: "connections to IOC domains", why: "open sockets show addresses, not names; only IOC IPs are matched live" });
    } else
      gaps.push({
        surface: "host",
        what: "open network connections",
        why: net.missing ? "lsof/ss is not installed" : (net.stderr.trim().split("\n")[0] ?? "the command failed"),
      });
    if (M.process.length) {
      const ps = await runner("ps", ["-axo", "pid=,command="], { timeoutMs: 10_000 });
      for (const m of M.process) {
        const line = ps.stdout.split("\n").find((l) => m.test(l) && !l.includes("ultraguard"));
        if (line)
          findings.push(
            hitOf(m, {
              subject: "process",
              title: `Running process matches "${m.indicator.value}"`,
              evidence: { kind: "command", ref: "ps -axo pid=,command=", excerpt: line.trim().slice(0, 200) },
            }),
          );
      }
    }
    findings.push(...(await processFindings(runner, home)));
  } else gaps.push({ surface: "host", what: "crontab, open connections, processes and code signatures", why: "live checks were skipped" });

  // 8. What a stealer here would take: the credential stores, by path.
  inventory.credentials = credentialInventory(
    home,
    tree.files.filter((f) => /^\.env(\.[\w-]+)?$/.test(basename(f)) && !/\.(example|sample|template|dist)$/.test(f)),
  );
  if (inventory.credentials.length) {
    const kinds = [...new Set(inventory.credentials.map((c) => c.kind))];
    findings.push({
      surface: "host",
      severity: "info",
      subject: "credentials",
      title: `Credentials a stealer on this machine would take: ${kinds.join(", ")} (${inventory.credentials.length} files, listed in host-inventory.json)`,
      evidence: { kind: "file", ref: "host-inventory.json" },
      key: "host|credentials",
    });
  }
  result.stats.credentialFiles = inventory.credentials.length;
  gaps.push({
    surface: "host",
    what: "login items, browser extensions and kernel or system extensions",
    why: "not read: they need privileges or per-browser profiles",
    fix: "System Settings > General > Login Items; each browser's extensions page",
  });

  gaps.push({
    surface: "host",
    what: "files outside the scanned roots and deeper than the walk depth",
    why: "the walk is bounded",
    fix: "pass --roots and --depth to widen it",
  });
  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps, inventory };
}
