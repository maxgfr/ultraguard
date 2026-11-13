// scan host: the machine the agent runs on, macOS or Linux.
//
// IOC matches (a file, a hash, a cron tag, a connection to a C2 address) are
// findings on their own. Things that merely CHANGED in the campaign window
// (a new LaunchAgent, a VS Code task that runs on folder open) are
// "suspicious": the scan cannot tell a fresh install from a dropper, the agent
// and the user can, so the report asks them to judge.
import { createHash } from "node:crypto";
import { closeSync, existsSync, lstatSync, openSync, readdirSync, readFileSync, readSync, realpathSync, statSync } from "node:fs";
import { homedir, platform, tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { globRegex, type Matcher, matchers, normEco, reviewStart } from "../ioc.js";
import { mapPool } from "../pool.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import { readJson, scanAgents } from "./agents.js";
import { appFindings } from "./macos.js";
import { antivirusPass, avTargetList, dropFolders, excludedBy, yaraPass } from "./antivirus.js";
import {
  appBundleOf,
  backdated,
  browserExtensions,
  bundleIdOf,
  codesignInfo,
  changedMs,
  configFindings,
  credentialInventory,
  EXTENSION_ENTRY,
  extensionDirs,
  extensionEntryFile,
  gitHookFindings,
  type HostInventory,
  INTERPRETERS,
  interpretedScript,
  iocHit,
  npmCacheHits,
  packageStoreHits,
  processFindings,
  pthFindings,
  recentExtensions,
  riskSignals,
  SELECTOR_RUN,
  type StartupItem,
  shellStartupFiles,
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
  /** Folders a dropper writes to (Downloads, temp folders, caches), overriding the defaults (tests): probed for file IOCs by name, listed for recent files. */
  dropDirs?: string[];
  /** Skip commands that read live system state (crontab, lsof, ps): tests and sandboxes. */
  skipLive?: boolean;
  /** Antivirus: "off", targeted (default) or every root ("full"). */
  av?: "off" | "targeted" | "full";
  /** Roots for a full antivirus pass. */
  roots?: string[];
  /** YARA rules (a file or a folder of .yar files) to run over the same targets. */
  yara?: string;
  /** The [S#] the YARA rules came from, when the agent saved them from a source. */
  yaraSource?: string;
  /** Where the scanners' target lists are written (the run directory). */
  listDir?: string;
  /** ultraguard's state folder (community rules): never a scanner target or finding. */
  stateDir?: string;
  /** Installed community rules (YARA-Forge) and the run's [S#] for them. */
  community?: { source: string; compiled?: string; label: string; sourceId?: string; ageDays: number };
  /** yara is installed but no community rules are: say how to get them. */
  communityMissing?: boolean;
  /** macOS: folders holding installed apps (default /Applications and ~/Applications). Read with the live checks. */
  appDirs?: string[];
}

/** A character below space, or DEL: what a line-oriented tool splits or hides on. */
const hasControlChar = (s: string) => [...s].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);

/** sha256 of a file, read in 1 MB chunks (no size limit unless `max` is given). Undefined when unreadable or over `max`. */
export function sha256File(p: string, max = Number.POSITIVE_INFINITY): string | undefined {
  let fd: number | undefined;
  try {
    const st = statSync(p);
    if (!st.isFile() || st.size > max) return undefined;
    fd = openSync(p, "r");
    const h = createHash("sha256");
    const buf = Buffer.alloc(1024 * 1024);
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (n <= 0) break;
      h.update(buf.subarray(0, n));
    }
    return h.digest("hex");
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

const MAX_TEXT = 2 * 1024 * 1024;

function readText(p: string, max = MAX_TEXT): string | undefined {
  try {
    if (statSync(p).size > max) return undefined;
    return readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
}

const hitOf = iocHit;

function startupDirs(home: string, os: NodeJS.Platform): string[] {
  if (os === "darwin") return [join(home, "Library/LaunchAgents"), "/Library/LaunchAgents", "/Library/LaunchDaemons"];
  return [
    join(home, ".config/systemd/user"),
    join(home, ".local/share/systemd/user"),
    join(home, ".config/autostart"),
    join(home, ".config/environment.d"),
    "/etc/systemd/system",
    "/etc/cron.d",
    "/etc/cron.hourly",
    "/etc/cron.daily",
    "/etc/cron.weekly",
    "/etc/cron.monthly",
    "/etc/xdg/autostart",
    "/etc/profile.d",
    // Single files.
    "/etc/crontab",
    "/etc/rc.local",
    "/etc/ld.so.preload",
  ];
}

/** Folders a dropper writes to: Downloads and temp folders, then caches and per-user data folders. */
function defaultDropDirs(home: string): string[] {
  return [
    ...dropFolders(home),
    join(home, "Library/Caches"),
    "/Library/Caches",
    join(home, "Library/Application Support"),
    join(home, ".local/share"),
    join(home, ".local/bin"),
    join(home, ".config"),
    join(home, ".cache"),
  ];
}

/** A `file` IOC written as a home path (`~/x`, `$HOME/x`, `${HOME}/x`, `%USERPROFILE%\\x`). */
const HOME_ANCHOR = /^(~|\$HOME|\$\{HOME\}|%USERPROFILE%)[/\\]/i;

const realOr = (p: string): string => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

const readdirOr = (d: string): string[] => {
  try {
    return readdirSync(d);
  } catch {
    return [];
  }
};

export async function scanHost(
  iocs: IocFile,
  tree: WalkResult,
  runner: Runner,
  opts: HostScanOptions = {},
): Promise<{ result: SurfaceResult; findings: NewFinding[]; gaps: Gap[]; inventory: HostInventory }> {
  const home = opts.home ?? homedir();
  const os = opts.platform ?? platform();
  const nowMs = (opts.now ?? new Date()).getTime();
  // Startup items changed without an IOC are worth a look over the last 30 days at most.
  const sinceMs = Date.parse(reviewStart(iocs, opts.now));
  const result: SurfaceResult = { surface: "host", scanned: true, stats: {}, startedAt: (opts.now ?? new Date()).toISOString() };
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const inventory: HostInventory = { startupItems: [], credentials: [], recentExtensions: [], shellStartup: [] };
  const dropDirs = opts.dropDirs ?? defaultDropDirs(home);
  const startupFolders = opts.startupDirs ?? startupDirs(home, os);

  const M = {
    file: matchers(iocs, "file", "workflow_file"),
    hash: matchers(iocs, "sha256"),
    content: matchers(iocs, "string", "ip", "domain", "url", "cron_tag"),
    net: matchers(iocs, "ip", "domain"),
    process: matchers(iocs, "process"),
    pkg: matchers(iocs, "package").filter((m) => (m.indicator.ecosystem ?? "").toLowerCase().startsWith("vs") || m.indicator.ecosystem === "openvsx"),
    label: matchers(iocs, "launchd_label"),
    team: matchers(iocs, "team_id"),
    bundle: matchers(iocs, "bundle_id"),
  };
  const hashes = new Map(M.hash.map((m) => [m.indicator.value.toLowerCase(), m]));
  const hashed = new Set<string>();

  // 1. Files named like an IOC, and their hashes.
  const fileSeen = new Set<string>();
  const reportFile = (p: string, m: Matcher, isDir = false) => {
    // One finding per real file: /tmp is /private/tmp on macOS.
    const real = realOr(p);
    if (fileSeen.has(p) || fileSeen.has(real)) return;
    fileSeen.add(p).add(real);
    if (isDir) {
      findings.push(
        hitOf(m, {
          subject: p,
          severity: m.indicator.weak ? "suspicious" : "compromised",
          title: `Folder ${p} matches "${m.indicator.value}"${m.indicator.weak ? " (a common name)" : ""}`,
          evidence: { kind: "file", ref: p },
        }),
      );
      return;
    }
    const digest = sha256File(p);
    hashed.add(p);
    const hashHit = digest ? hashes.get(digest) : undefined;
    // A weak name (one ordinary files also have) is only suspicious on its own;
    // its hash, when the campaign publishes it, settles it.
    const campaignHashes = M.hash.filter((h) => h.campaign.id === m.campaign.id).length;
    // An exact file name (no wildcard) from a campaign that publishes hashes is
    // identified by those hashes: matching the name but none of them is most
    // likely the ordinary file of that name. A wildcard pattern (a random-named
    // dropper like `.ci-*.sh`) stays strong. A hash that could not be computed settles nothing.
    const exactName = !/[*?]/.test(m.indicator.value) && !m.indicator.regex;
    const nameOnly = !hashHit && (!!m.indicator.weak || (exactName && campaignHashes > 0 && digest !== undefined));
    const notHashed = digest === undefined && campaignHashes ? " (sha256 not computed: the file could not be read)" : "";
    findings.push(
      hitOf(hashHit ?? m, {
        subject: p,
        severity: nameOnly ? "suspicious" : "compromised",
        title: hashHit
          ? `File ${p} matches the sha256`
          : nameOnly
            ? `File ${p} is named like "${m.indicator.value}"${m.indicator.weak ? " (a common name)" : ""}${digest && campaignHashes ? `, but its sha256 matches none of the campaign's ${campaignHashes} hash(es)` : notHashed}`
            : `File ${p} matches "${m.indicator.value}"${notHashed}`,
        evidence: { kind: "file", ref: p, excerpt: digest ? `sha256=${digest}` : undefined },
      }),
    );
  };
  result.stats.files = tree.files.length;
  for (const p of tree.files) {
    const m = M.file.find((x) => x.test(p));
    if (m) reportFile(p, m);
  }
  // 1a. File IOCs looked up where they say they are, whatever the walk reached:
  // `~/.dev-env/`, `/tmp/inventory.txt`, `.local/share/pgmon/service.py`, a
  // bare name in a drop folder (Downloads, temp folders, caches, LaunchAgents).
  const probe = (p: string, m: Matcher) => {
    const name = basename(p);
    if (/[*?]/.test(dirname(p))) return;
    const hits = /[*?]/.test(name)
      ? readdirOr(dirname(p))
          .filter((n) => globRegex(name).test(n))
          .slice(0, 50)
          .map((n) => join(dirname(p), n))
      : [p];
    for (const h of hits) {
      try {
        const st = lstatSync(h);
        if (st.isDirectory()) reportFile(h, m, true);
        else if (st.isFile()) reportFile(h, m);
      } catch {}
    }
  };
  let nameDirs: string[] | undefined;
  for (const m of M.file) {
    if (m.indicator.regex) continue;
    const raw = m.indicator.value.trim().replace(/[/\\]+$/, "");
    if (!raw) continue;
    if (HOME_ANCHOR.test(raw)) probe(join(home, raw.replace(HOME_ANCHOR, "").replace(/\\/g, "/")), m);
    else if (raw.startsWith("/")) {
      probe(raw, m);
      // Another user's home in the write-up (`/Users/victim/.dev-env`): the same place in this one.
      const other = /^\/(Users|home)\/[^/]+\/(.+)$/.exec(raw);
      if (other && !raw.startsWith(`${home}/`)) probe(join(home, other[2] as string), m);
      if (/^\/(tmp|var)\//.test(raw)) probe(`/private${raw}`, m);
    } else if (raw.includes("/")) probe(join(home, raw), m);
    else {
      // A bare name: the drop folders and one level below them.
      nameDirs ??= [...new Set([home, ...dropDirs, ...startupFolders])].flatMap((d) => [
        d,
        ...readdirOr(d)
          .slice(0, 2000)
          .map((n) => join(d, n))
          .filter((x) => {
            try {
              return lstatSync(x).isDirectory();
            } catch {
              return false;
            }
          })
          .slice(0, 500),
      ]);
      for (const d of nameDirs) probe(join(d, raw), m);
    }
  }
  // 1c. Package folders the walk skips (node_modules, virtualenvs): a dropped
  // file sits at a package's top level (bun_environment.js, litellm_init.pth).
  if (M.file.length)
    for (const clone of tree.gitDirs) {
      const nm = join(clone, "node_modules");
      const pkgs = readdirOr(nm)
        .slice(0, 5000)
        .flatMap((n) => (n.startsWith("@") ? readdirOr(join(nm, n)).map((x) => join(nm, n, x)) : [join(nm, n)]));
      const site = [".venv", "venv"].flatMap((v) =>
        readdirOr(join(clone, v, "lib"))
          .filter((x) => x.startsWith("python"))
          .map((x) => join(clone, v, "lib", x, "site-packages")),
      );
      for (const dir of [...pkgs.slice(0, 5000), ...site])
        for (const n of readdirOr(dir).slice(0, 2000)) {
          const p = join(dir, n);
          const m = M.file.find((x) => x.test(p));
          if (!m) continue;
          try {
            const st = lstatSync(p);
            if (st.isFile()) reportFile(p, m);
            else if (st.isDirectory()) reportFile(p, m, true);
          } catch {}
        }
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

  // 1b. File names with a line break or another control character: a trick to hide from tools and lists.
  let oddNames = 0;
  for (const p of tree.files) {
    // "Icon\r" is how macOS stores a custom folder icon: the one legitimate control-character name.
    if (!hasControlChar(basename(p)) || basename(p) === "Icon\r" || oddNames >= 50) continue;
    oddNames++;
    findings.push({
      surface: "host",
      severity: "suspicious",
      subject: p,
      title: `File name with a control character (line break or similar), a trick to hide from tools: ${JSON.stringify(basename(p))} in ${p.slice(0, p.length - basename(p).length)}`,
      evidence: { kind: "file", ref: JSON.stringify(p) },
      key: `host|odd-name|${p}`,
    });
  }

  // 2. VS Code tasks that run when a folder opens: how GhostActions re-runs its stealer.
  for (const dir of tree.vscodeDirs) {
    const p = join(dir, "tasks.json");
    const text = existsSync(p) ? readText(p) : undefined;
    if (!text || !/"runOn"\s*:\s*"folderOpen"/.test(text)) continue;
    const line = text.split("\n").findIndex((l) => /folderOpen/.test(l)) + 1;
    // The tasks that run on open, not the first command of the file.
    const j = readJson(p) as { tasks?: unknown } | undefined;
    const tasks = Array.isArray(j?.tasks) ? (j.tasks as any[]) : undefined;
    const auto = (tasks ?? [])
      .filter((t) => t?.runOptions?.runOn === "folderOpen")
      .map((t) => {
        const args = Array.isArray(t.args) ? t.args.map((x: unknown) => (typeof x === "string" ? x : ((x as { value?: string })?.value ?? ""))) : [];
        const cmd = [typeof t.command === "string" ? t.command : "", ...args].filter(Boolean).join(" ");
        return { label: typeof t.label === "string" ? t.label : undefined, cmd };
      });
    const cmd = tasks
      ? auto.map((t) => `${t.label ? `${t.label}: ` : ""}${t.cmd || "(no command)"}`).join(" | ")
      : "(command not attributed: the file did not parse)";
    const signals = [...new Set(auto.flatMap((t) => riskSignals(t.cmd, undefined, home)))];
    const m = M.content.find((x) => x.test(text));
    if (m)
      findings.push(
        hitOf(m, {
          subject: p,
          title: `VS Code task in ${p} runs on folder open and contains "${m.indicator.value}"`,
          evidence: { kind: "file", ref: `${p}:${line}`, excerpt: cmd.slice(0, 300) },
        }),
      );
    else
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: p,
        title: `VS Code task runs automatically when the folder opens: ${cmd.slice(0, 200)}${signals.length ? `; ${signals.join("; ")}` : ""}`,
        evidence: { kind: "file", ref: `${p}:${line}`, excerpt: cmd.slice(0, 300) },
        key: `host|${p}|folderOpen`,
      });
  }
  result.stats.vscodeDirs = tree.vscodeDirs.length;

  // 3. Startup items: an IOC inside is a compromise. Without one, the item's
  // facts decide: who signed what it runs, where that lives, what the command
  // does, and whether it changed recently. A risk signal is worth a look
  // whatever the date; a recent change is worth a look with its facts.
  let startupCount = 0;
  const startupFiles: string[] = [];
  for (const dir of startupFolders) {
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(dir);
    } catch {
      continue;
    }
    if (st.isFile()) {
      startupFiles.push(dir);
      continue;
    }
    for (const name of readdirOr(dir)) {
      const p = join(dir, name);
      // systemd drop-ins (`x.service.d/override.conf`) and `*.wants` links run too: one level down.
      if (/\.(d|wants|requires)$/.test(name)) {
        try {
          if (statSync(p).isDirectory()) {
            for (const n of readdirOr(p).slice(0, 200)) startupFiles.push(join(p, n));
            continue;
          }
        } catch {}
      }
      startupFiles.push(p);
    }
  }
  for (const p of startupFiles) {
    const name = basename(p);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    startupCount++;
    let text = readText(p);
    const unreadable = text === undefined && st.size <= MAX_TEXT;
    // plutil decodes what a regex cannot: binary plists, XML entities, CDATA, and comments padding a file past the read limit.
    if (os === "darwin" && !opts.skipLive && !unreadable && (name.endsWith(".plist") || text?.startsWith("bplist"))) {
      const xml = await runner("plutil", ["-convert", "xml1", "-o", "-", p], { timeoutMs: 10_000 });
      if (xml.ok && xml.stdout.trim()) text = xml.stdout;
    }
    const changed = changedMs(st, nowMs);
    const at = new Date(changed).toISOString();
    if (text === undefined) {
      inventory.startupItems.push({ path: p, mtime: st.mtime.toISOString(), command: "", signals: [unreadable ? "unreadable" : "too large to read"] });
      if (unreadable)
        gaps.push({
          surface: "host",
          what: `startup item ${p}`,
          why: "this user cannot read it",
          fix: name.endsWith(".plist") ? `sudo plutil -p ${JSON.stringify(p)}` : `sudo cat ${JSON.stringify(p)}`,
        });
      else
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `Startup item ${name} is ${(st.size / 1024 / 1024).toFixed(1)} MB and could not be read: a startup item is a few KB`,
          at,
          evidence: { kind: "file", ref: p },
          key: `host|${p}|startup`,
        });
      continue;
    }
    const sc = startupCommand(text);
    const { command, executable } = sc;
    const item: StartupItem = { path: p, mtime: st.mtime.toISOString(), command, executable, signals: riskSignals(command, executable, home) };
    if (sc.unparsed) item.signals.push("its program could not be read (an encoding that hides the command)");
    for (const c of sc.more ?? []) item.signals.push(...riskSignals(c, undefined, home));
    if (name === "ld.so.preload" && text.trim()) item.signals.push(`preloads ${text.trim().split(/\s+/)[0]} into every program`);
    // No program key (a /etc/cron.d file, a shell snippet): every non-comment line is a command.
    if (!command && !sc.unparsed)
      for (const l of text.split("\n").slice(0, 2000)) if (l.trim() && !/^\s*#/.test(l)) item.signals.push(...riskSignals(l, undefined, home));
    // `/bin/bash script.sh` runs the script: read it, an Apple-signed bash says nothing. Same for a `#!` script run directly.
    const interp = interpretedScript(command, executable, home, sc.args);
    if (interp.script) item.script = interp.script;
    item.signals = [...new Set([...item.signals, ...interp.signals])];
    if (executable?.startsWith("/")) {
      item.exists = existsSync(executable);
      if (!item.exists) item.signals.push("points to a program that no longer exists");
      else if (os === "darwin" && !opts.skipLive) {
        const sig = await signerOf(runner, executable);
        if (!sig) item.signer = "unreadable (codesign could not read it, often a root-only helper)";
        else {
          item.signed = sig.signed;
          item.signer = sig.signer;
          item.team = sig.team;
          if (sig.invalid) item.signals.push(`has an ${sig.signer}`);
          else if (!sig.signed) item.signals.push(`is not signed by any developer${sig.signer ? ` (${sig.signer})` : ""}`);
        }
      }
    }
    // A third-party folder item named like Apple's own: Apple's live in /System. Who signed an interpreter says nothing about the script it runs.
    const label = /<key>Label<\/key>\s*<string>([^<]+)<\/string>/.exec(text)?.[1] ?? name.replace(/\.plist$/, "");
    const appleProgram = /^\/(System|usr\/libexec|usr\/sbin|Library\/Apple)\//.test(executable ?? "") && !INTERPRETERS.test(basename(executable ?? ""));
    if (/^com\.apple\./i.test(label) && !appleProgram) item.signals.unshift(`is named like an Apple service (${label}) but is not Apple's`);
    // A program inside an app bundle: the bundle's identifier, for bundle_id IOCs.
    const bundle = item.exists ? appBundleOf(executable) : undefined;
    const bundleId = bundle && M.bundle.length ? await bundleIdOf(bundle, opts.skipLive ? undefined : runner) : undefined;
    inventory.startupItems.push(item);
    const recent = changed >= sinceMs;
    const facts = [
      command ? `runs ${command.slice(0, 160)}` : sc.unparsed ? undefined : "no program found",
      item.signer ? `signed by ${item.signer}${item.team ? ` (team ${item.team})` : ""}` : undefined,
      ...item.signals,
    ].filter(Boolean);
    // A strong signal (fetch-and-run, reverse shell, temp folder) is suspicious at any date.
    const strong = item.signals.some((s) => !s.startsWith("points to") && !s.startsWith("is not signed"));
    // An IOC in the item, in the script it runs, its name, or the hash of the item, its program or its script.
    const hashOf = (f: string | undefined) => {
      if (!f || !hashes.size) return undefined;
      hashed.add(f);
      return hashes.get(sha256File(f) ?? "");
    };
    // The launchd label, the file name without its extension (a systemd unit's name), the signing team, the app bundle.
    const unit = name.replace(/\.(plist|service|timer|socket|path|desktop)$/, "");
    const idHit =
      M.label.find((x) => x.test(label) || x.test(unit) || x.test(name)) ??
      (item.team ? M.team.find((x) => x.test(item.team ?? "")) : undefined) ??
      (bundleId ? M.bundle.find((x) => x.test(bundleId)) : undefined);
    const m =
      idHit ??
      M.content.find((x) => x.test(text ?? "")) ??
      (interp.text ? M.content.find((x) => x.test(interp.text ?? "")) : undefined) ??
      (fileSeen.has(p) ? undefined : M.file.find((x) => x.test(p))) ??
      hashOf(p) ??
      (item.exists ? hashOf(executable) : undefined) ??
      hashOf(interp.script);
    if (m)
      findings.push(
        hitOf(m, {
          subject: p,
          title:
            m.indicator.type === "sha256"
              ? `Startup item ${p}, or the program or script it runs, matches the sha256 ${m.indicator.value}`
              : m === idHit
                ? `Startup item ${p} ${m.indicator.type === "launchd_label" ? "has the launchd label" : m.indicator.type === "team_id" ? `runs ${executable} signed by team` : `runs a program of the app`} "${m.indicator.value}"`
                : `Startup item ${p} ${m.indicator.type === "file" || m.indicator.type === "workflow_file" ? "matches" : "contains"} "${m.indicator.value}"`,
          at,
          evidence: { kind: "file", ref: p, excerpt: command },
        }),
      );
    else if (strong || recent)
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: p,
        title: `${strong ? "Risky startup item" : "Startup item"} ${name}${recent ? ` was written recently${backdated(st, nowMs)}` : ""}: ${facts.join("; ")}`,
        at,
        evidence: { kind: "file", ref: p, excerpt: command.slice(0, 300) },
        key: `host|${p}|startup`,
      });
  }
  result.stats.startupItems = startupCount;

  // 4a. AI coding agents: hooks, MCP servers, base URLs, instruction files (home and every clone).
  // One malformed config must not stop the surface: an exception is a gap.
  try {
    const agents = scanAgents(home, tree.gitDirs, { content: M.content, pkg: matchers(iocs, "package") }, { files: tree.files });
    findings.push(...agents.findings);
    inventory.agents = agents.inventory;
    result.stats.agentConfigs = agents.inventory.configs.length;
    result.stats.mcpServers = agents.inventory.mcpServers.length;
  } catch (e) {
    gaps.push({
      surface: "host",
      what: "AI agent configs (hooks, MCP servers, instruction files)",
      why: `the check failed: ${(e as Error).message.slice(0, 200)}`,
    });
  }
  // 4b. Git hooks in local clones, and package caches and stores for campaign packages.
  findings.push(...gitHookFindings(tree.gitDirs, home, sinceMs, M.content, nowMs));
  const npmPkgs = matchers(iocs, "package")
    .filter((x) => normEco(x.indicator.ecosystem ?? "") === "npm")
    .map((x) => ({ name: x.indicator.value, versions: x.indicator.versions, source: x.indicator.source, campaign: x.campaign.id, value: x.indicator.value }));
  findings.push(...npmCacheHits(home, npmPkgs), ...packageStoreHits(home, npmPkgs));
  // 4c. Executable .pth files in site-packages: code that runs at every Python start.
  findings.push(...pthFindings(home, tree.gitDirs, M.file, hashes, !opts.skipLive));

  // 4. Shell startup files (risk signals), and package-manager, git and SSH settings.
  const rc = shellStartupFindings(home);
  findings.push(...rc.findings);
  inventory.shellStartup = rc.lines;
  findings.push(...configFindings(home, sinceMs, nowMs));

  // 5. Shell history, startup files and /etc/hosts: a C2 address typed, pinned or wired in.
  const traces = [".zsh_history", ".bash_history", ".local/share/fish/fish_history", ".python_history", ...shellStartupFiles(home)].map((f) => join(home, f));
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

  // 5. Editor extensions named by an IOC, in VS Code and every fork (Cursor, Windsurf, VSCodium, Antigravity, Kiro...),
  // and invisible payloads in their code (GlassWorm hides its loader in variation selectors).
  let extensions = 0;
  for (const dir of extensionDirs(home)) {
    for (const name of readdirOr(dir)) {
      // "publisher.name-1.2.3" or, for platform builds, "publisher.name-1.2.3-darwin-arm64".
      const mm = /^(.+?)-(\d+\.\d+\.\d+)(-.+)?$/.exec(name);
      if (!mm || !EXTENSION_ENTRY.test(name)) continue;
      extensions++;
      const [, id, version] = mm as unknown as [string, string, string];
      const m = M.pkg.find(
        (x) =>
          x.indicator.value.toLowerCase() === id.toLowerCase() &&
          (!x.indicator.versions?.length || x.indicator.versions.some((v) => v.replace(/^v/, "") === version || v === `${version}${mm[3] ?? ""}`)),
      );
      if (m) {
        findings.push(
          hitOf(m, { subject: join(dir, name), title: `Editor extension ${id}@${version} is installed`, evidence: { kind: "file", ref: join(dir, name) } }),
        );
        continue;
      }
      const entry = extensionEntryFile(join(dir, name));
      if (!entry) continue;
      const c = M.content.find((x) => x.test(entry.text));
      if (c)
        findings.push(
          hitOf(c, {
            subject: entry.path,
            title: `Editor extension ${id}@${version} code contains "${c.indicator.value}"`,
            evidence: { kind: "file", ref: entry.path },
          }),
        );
      else if (SELECTOR_RUN.test(entry.text))
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: entry.path,
          title: `Editor extension ${id}@${version} hides a run of invisible Unicode variation selectors in its code (the GlassWorm technique): read ${basename(entry.path)} with a hex viewer`,
          evidence: { kind: "file", ref: entry.path },
          key: `host|${entry.path}|selectors`,
        });
    }
  }
  result.stats.extensions = extensions;
  const ext = recentExtensions(home, sinceMs);
  findings.push(...ext.findings);
  inventory.recentExtensions = ext.list;

  // 5b. Browser extensions: Chromium profiles list them as <id>/<version>, Firefox in extensions.json.
  const browserPkgs = matchers(iocs, "package").filter((x) => ["chrome", "firefox"].includes(normEco(x.indicator.ecosystem ?? "")));
  const browsers = browserExtensions(home, os);
  result.stats.browserExtensions = browsers.length;
  for (const b of browsers) {
    const eco = b.browser === "Firefox" ? "firefox" : "chrome";
    const m = browserPkgs.find(
      (x) =>
        normEco(x.indicator.ecosystem ?? "") === eco &&
        x.indicator.value.toLowerCase() === b.id.toLowerCase() &&
        (!x.indicator.versions?.length || x.indicator.versions.some((v) => v.replace(/^v/, "") === b.version)),
    );
    if (m)
      findings.push(
        hitOf(m, {
          subject: b.path,
          title: `${b.browser} extension ${b.id}@${b.version} is installed (profile ${b.profile})`,
          evidence: { kind: "file", ref: b.path },
        }),
      );
  }
  const newBrowser = browsers.filter((b) => b.installedMs && b.installedMs >= sinceMs && b.installedMs <= nowMs);
  inventory.recentBrowserExtensions = newBrowser.map((b) => ({
    browser: b.browser,
    profile: b.profile,
    id: b.id,
    version: b.version,
    installed: new Date(b.installedMs as number).toISOString(),
  }));
  if (newBrowser.length)
    findings.push({
      surface: "host",
      severity: "info",
      subject: "browser extensions",
      title: `${newBrowser.length} browser extension version(s) installed or updated in the review window (listed in host-inventory.json)`,
      evidence: { kind: "file", ref: "host-inventory.json" },
      key: "host|browser-ext-recent",
    });

  // 5c. macOS apps: bundle_id and team_id IOCs. Live: codesign and plutil run.
  if (os === "darwin" && !opts.skipLive) {
    const apps = await appFindings(runner, opts.appDirs ?? ["/Applications", join(home, "Applications")], {
      nowMs,
      team: M.team,
      bundle: M.bundle,
    });
    findings.push(...apps.findings);
    result.stats.apps = apps.apps.length;
  }

  // 6. Local clones of repositories the GitHub scan found hit.
  if (opts.hitRepos?.length) {
    const wanted = new Set(opts.hitRepos.map((r) => r.toLowerCase()));
    for (const dir of tree.gitDirs) {
      const cfg = readText(join(dir, ".git/config")) ?? "";
      const urls = [...cfg.matchAll(/url\s*=\s*(\S+)/g)].map((x) => x[1] ?? "");
      const repo = urls.map((u) => /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(u)?.[1]?.toLowerCase()).find((r) => r && wanted.has(r));
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
      inventory.crontab = lines.filter((l) => l.trim() && !/^\s*#/.test(l)).map((l) => l.slice(0, 500));
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
      if (os === "darwin" && M.net.length && process.getuid?.() !== 0)
        gaps.push({
          surface: "host",
          what: "connections of processes owned by other users (root daemons included)",
          why: "lsof runs without root and lists this user's sockets only",
          fix: "sudo lsof -nPi | grep <IOC address>",
        });
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
    findings.push(...(await processFindings(runner, home, os)));
    // team_id IOCs: who signed each running program, at most 400 distinct ones.
    if (M.team.length && os === "darwin") {
      const ps = await runner("ps", ["-axo", "comm="], { timeoutMs: 10_000 });
      const exes = [...new Set(ps.stdout.split("\n").map((l) => l.trim()))].filter((e) => e.startsWith("/"));
      const signed = await mapPool(exes.slice(0, 400), 8, async (exe) => ({ exe, sig: await codesignInfo(runner, exe) }));
      for (const { exe, sig } of signed) {
        const m = sig?.team ? M.team.find((x) => x.test(sig.team ?? "")) : undefined;
        if (m)
          findings.push(
            hitOf(m, {
              subject: exe,
              title: `Running program ${exe} is signed by team "${m.indicator.value}"`,
              evidence: { kind: "command", ref: `codesign -dv ${exe}`, excerpt: [sig?.identifier, sig?.authority].filter(Boolean).join(" | ") },
            }),
          );
      }
      if (!ps.ok)
        gaps.push({
          surface: "host",
          what: "the signing team of running programs (team_id IOCs)",
          why: "ps failed",
          fix: "ps -axo comm= | xargs -n1 codesign -dv",
        });
      else if (exes.length > 400)
        gaps.push({
          surface: "host",
          what: `the signing team of ${exes.length - 400} running program(s) past the first 400`,
          why: "codesign runs on a bounded number of programs",
        });
    }
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

  // 9. Signature scanners over the same short list: ClamAV (known families), YARA (rules from a source).
  // ultraguard's own folders hold the strings the rules look for (the rule text, a saved article): never targets, never findings.
  const listDir = opts.listDir ?? tmpdir();
  const exclude = [opts.listDir, opts.stateDir, opts.yara && existsSync(opts.yara) && statSync(opts.yara).isDirectory() ? opts.yara : undefined].filter(
    (x): x is string => !!x,
  );
  const flagged = findings.map((f) => f.subject).filter((s) => s.startsWith("/"));
  const full = opts.av === "full";
  let targetList: ReturnType<typeof avTargetList> | undefined;
  const targets = () => {
    targetList ??= avTargetList(home, inventory, flagged, sinceMs, { exclude, folders: opts.dropDirs ? dropDirs : undefined, nowMs });
    return targetList;
  };
  // sha256 IOCs against the short list too: a renamed dropper a startup item runs, or one in Downloads or a temp folder.
  if (hashes.size) {
    const skip = excludedBy(exclude);
    let tooBig = 0;
    const files = targets().targets.flatMap((t) => {
      try {
        return statSync(t).isDirectory()
          ? readdirOr(t)
              .slice(0, 500)
              .map((n) => join(t, n))
          : [t];
      } catch {
        return [];
      }
    });
    for (const f of files) {
      if (hashed.has(f) || skip(f)) continue;
      hashed.add(f);
      let size = 0;
      try {
        const st = statSync(f);
        if (!st.isFile()) continue;
        size = st.size;
      } catch {
        continue;
      }
      if (size > 500 * 1024 * 1024) {
        tooBig++;
        continue;
      }
      const m = hashes.get(sha256File(f) ?? "");
      if (m)
        findings.push(
          hitOf(m, { subject: f, title: `File ${f} matches the sha256`, evidence: { kind: "file", ref: f, excerpt: `sha256=${m.indicator.value}` } }),
        );
    }
    result.stats.hashed = hashed.size;
    gaps.push({
      surface: "host",
      what: `sha256 of files outside startup programs, flagged files, recent temp and Downloads files and new extensions${tooBig ? ` (and ${tooBig} file(s) over 500 MB)` : ""}`,
      why: "hashing every file on the disk takes hours",
    });
  }
  if (!opts.skipLive && opts.av !== "off") {
    const av = await antivirusPass(runner, {
      home,
      inventory,
      flagged,
      sinceMs,
      listDir,
      now: opts.now,
      exclude,
      full: full ? (opts.roots ?? [home]) : undefined,
      targets: full ? undefined : targets(),
    });
    findings.push(...av.findings);
    gaps.push(...av.gaps);
    Object.assign(result.stats, av.stats);
  } else if (opts.av === "off") gaps.push({ surface: "host", what: "the antivirus pass", why: "--no-av" });
  const yaraTargets = () => (full ? (opts.roots ?? [home]) : targets().targets);
  if (opts.yara) {
    const y = await yaraPass(runner, { rules: opts.yara, targets: yaraTargets(), recursive: full, listDir, source: opts.yaraSource, exclude });
    findings.push(...y.findings);
    gaps.push(...y.gaps);
    Object.assign(result.stats, y.stats);
  }
  // Community rules (YARA-Forge), when installed with `ultraguard rules update`.
  if (opts.community && !opts.skipLive) {
    const c = opts.community;
    const y = await yaraPass(runner, {
      rules: c.compiled ?? c.source,
      compiled: !!c.compiled,
      community: true,
      label: c.label,
      targets: yaraTargets(),
      recursive: full,
      listDir,
      source: c.sourceId,
      // The rule text (.yar) sits next to the compiled set (.yarc): it holds every string the rules look for.
      exclude: [...exclude, dirname(c.source)],
    });
    findings.push(...y.findings);
    gaps.push(...y.gaps);
    Object.assign(result.stats, y.stats);
    if (c.ageDays > 14)
      gaps.push({
        surface: "host",
        what: `threats newer than the ${c.label} rules`,
        why: `the rules are ${c.ageDays} days old`,
        fix: "ultraguard rules update",
      });
  } else if (opts.communityMissing && !opts.skipLive)
    gaps.push({
      surface: "host",
      what: "community YARA rules (thousands of malware and hacking-tool families)",
      why: "not installed",
      fix: "ultraguard rules update (needs yara; yarac makes scans faster)",
    });
  gaps.push({
    surface: "host",
    what: "login items registered in System Settings, Safari extensions, kernel and system extensions",
    why: "not read: the background task database needs an admin (sfltool dumpbtm), and Safari keeps its extensions inside app bundles",
    fix: "System Settings > General > Login Items; Safari > Settings > Extensions",
  });

  const pruned = Object.entries(tree.pruned ?? {}).sort((a, b) => b[1] - a[1]);
  gaps.push({
    surface: "host",
    what: `files outside the scanned roots${
      pruned.length
        ? `, and inside skipped folders: ${pruned
            .slice(0, 8)
            .map(([n, c]) => `${n} (${c})`)
            .join(", ")}`
        : ""
    }`,
    why: "the walk is bounded: package folders, caches and system libraries are skipped for speed",
    fix: "pass --roots and --depth to widen it; scan a skipped folder with --roots <it>",
  });
  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps, inventory };
}
