// A classic antivirus pass with ClamAV, when it is installed: signatures for
// known malware families complement the campaign IOCs (what the news names)
// and the machine analysis (what looks wrong).
//
// Targeted by default, because a whole home directory takes hours: the
// programs startup items run, the files the other checks flagged, temporary
// and shared folders, recent downloads and newly installed extensions.
// `--av-full` scans every root. ultraguard never installs ClamAV; it refreshes
// stale signatures before a scan (defenses.ts), and if that fails, they are a
// coverage gap.
import { accessSync, constants, readdirSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomic } from "../engine.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap } from "../types.js";
import type { HostInventory } from "./hostintel.js";

type NewFinding = Omit<Finding, "id">;

export interface AvEngine {
  name: "clamscan" | "clamdscan";
  version: string;
  /** When the signature database was built, from the version line. */
  signatures?: string;
  ageDays?: number;
}

const MAX_TARGETS = 5000;

/** "ClamAV 1.5.4/27970/Mon Apr 13 08:24:33 2026" → version and signature date. */
export function parseClamVersion(line: string, now = new Date()): Omit<AvEngine, "name"> | undefined {
  const m = /ClamAV\s+([\d.]+)(?:\/(\d+)\/(.+))?/.exec(line.trim());
  if (!m) return undefined;
  const built = m[3] ? new Date(`${m[3]} UTC`) : undefined;
  const ok = built && !Number.isNaN(built.getTime());
  return {
    version: m[1] as string,
    signatures: ok ? built.toISOString() : undefined,
    ageDays: ok ? Math.floor((now.getTime() - built.getTime()) / 86_400_000) : undefined,
  };
}

export async function detectAv(runner: Runner, now = new Date()): Promise<AvEngine | undefined> {
  // clamdscan is much faster (signatures already loaded) but needs a running clamd.
  const ping = await runner("clamdscan", ["--ping", "1"], { timeoutMs: 5_000 });
  const name = ping.ok ? "clamdscan" : "clamscan";
  const v = await runner(name, ["--version"], { timeoutMs: 15_000 });
  if (!v.ok) return undefined;
  const parsed = parseClamVersion(v.stdout, now);
  return parsed ? { name, ...parsed } : undefined;
}

function recentFiles(dir: string, sinceMs: number, cap: number, depth = 3): string[] {
  const out: string[] = [];
  const walk = (d: string, left: number) => {
    let names: string[] = [];
    try {
      names = readdirSync(d);
    } catch {
      return;
    }
    for (const n of names) {
      if (out.length >= cap) return;
      const p = join(d, n);
      try {
        const st = statSync(p);
        if (st.isDirectory()) {
          if (left > 0 && n !== "node_modules" && n !== ".git") walk(p, left - 1);
        } else if (st.isFile() && st.mtimeMs >= sinceMs) out.push(p);
      } catch {}
    }
  };
  walk(dir, depth);
  return out;
}

/** What the targeted pass scans, deduplicated, existing paths only. */
export function avTargets(home: string, inventory: HostInventory, flagged: string[], sinceMs: number): string[] {
  const set = new Set<string>();
  const add = (p: string | undefined) => {
    if (p?.startsWith("/") && set.size < MAX_TARGETS) set.add(p);
  };
  for (const s of inventory.startupItems) {
    add(s.path);
    if (s.exists) add(s.executable);
  }
  for (const p of flagged) add(p);
  for (const e of inventory.recentExtensions) add(e.path);
  for (const dir of ["/tmp", "/private/tmp", "/var/tmp", "/Users/Shared", "/dev/shm", join(home, "Downloads")])
    for (const p of recentFiles(dir, sinceMs, 2000)) add(p);
  // One entry per real file: on macOS /tmp is /private/tmp, and a file listed twice is scanned twice.
  const real = new Set<string>();
  return [...set].filter((p) => {
    try {
      statSync(p);
      const r = realpathSync(p);
      if (real.has(r)) return false;
      real.add(r);
      return true;
    } catch {
      return false;
    }
  });
}

/** Split targets by whether this user can read them: clamscan --infected says nothing about the others. */
export function readableTargets(targets: string[]): { readable: string[]; unreadable: string[] } {
  const readable: string[] = [];
  const unreadable: string[] = [];
  for (const t of targets) {
    try {
      accessSync(t, constants.R_OK);
      readable.push(t);
    } catch (e) {
      // Only a refusal: a path that vanished is clamscan's to report.
      if ((e as NodeJS.ErrnoException).code === "EACCES" || (e as NodeJS.ErrnoException).code === "EPERM") unreadable.push(t);
      else readable.push(t);
    }
  }
  return { readable, unreadable };
}

/** `<path>: <Signature> FOUND` lines. */
export function parseClamOutput(stdout: string): { path: string; signature: string }[] {
  const out: { path: string; signature: string }[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^(.*): (.+) FOUND$/.exec(line.trim());
    if (m) out.push({ path: m[1] as string, signature: m[2] as string });
  }
  return out;
}

export async function antivirusPass(
  runner: Runner,
  opts: { home: string; inventory: HostInventory; flagged: string[]; sinceMs: number; full?: string[]; listDir: string; now?: Date },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number>; engine?: AvEngine }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const stats: Record<string, number> = {};
  const engine = await detectAv(runner, opts.now);
  if (!engine) {
    gaps.push({
      surface: "host",
      what: "a signature-based antivirus pass (known malware families)",
      why: "ClamAV is not installed",
      fix: "brew install clamav (or apt install clamav), then ultraguard rules update and re-run scan host",
    });
    return { findings, gaps, stats };
  }
  if (engine.ageDays !== undefined && engine.ageDays > 7)
    gaps.push({
      surface: "host",
      what: `malware families newer than ${engine.signatures?.slice(0, 10)}`,
      why: `ClamAV's signatures are ${engine.ageDays} days old`,
      fix: "ultraguard rules update (runs freshclam), then re-run scan host",
    });

  const { readable: targets, unreadable } = readableTargets(opts.full ?? avTargets(opts.home, opts.inventory, opts.flagged, opts.sinceMs));
  stats.avTargets = targets.length;
  if (unreadable.length)
    gaps.push({
      surface: "host",
      what: `${unreadable.length} antivirus target(s): ${unreadable.slice(0, 3).join(", ")}${unreadable.length > 3 ? ", ..." : ""}`,
      why: "this user cannot read them (owned by root or another user)",
      fix: `sudo clamscan ${unreadable
        .slice(0, 3)
        .map((u) => JSON.stringify(u))
        .join(" ")}`,
    });
  if (!targets.length) return { findings, gaps, stats, engine };
  // A list file is one path per line: a name with a line break (a hiding trick) goes as an argument instead.
  const { listed, odd } = splitTargets(targets);
  const list = join(opts.listDir, "av-targets.txt");
  writeFileAtomic(list, `${listed.join("\n")}\n`);
  const args = ["--infected", "--no-summary", `--file-list=${list}`];
  if (engine.name === "clamscan") args.push("--recursive", "--stdout", "--max-filesize=100M", "--max-scansize=400M", "--detect-pua=yes");
  else args.push("--fdpass", "--multiscan");
  args.push(...odd);
  const res = await runner(engine.name, args, { timeoutMs: opts.full ? 3 * 60 * 60_000 : 20 * 60_000 });
  // Exit 0: clean. 1: something found. 2: errors (unreadable files), possibly with findings.
  const hits = parseClamOutput(res.stdout);
  for (const h of hits) {
    // PUA.* is ClamAV's "potentially unwanted": adware, bundlers, hacking tools. Worth a look, not proof.
    const pua = /^PUA\./i.test(h.signature);
    findings.push({
      surface: "host",
      severity: pua ? "suspicious" : "compromised",
      subject: h.path,
      title: `ClamAV detects ${h.signature} in ${h.path}${pua ? " (potentially unwanted program)" : ""}`,
      evidence: {
        kind: "command",
        ref: `${engine.name} --no-summary ${h.path}`,
        excerpt: `${h.signature} (ClamAV ${engine.version}, signatures of ${engine.signatures?.slice(0, 10) ?? "?"})`,
      },
      key: `host|av|${h.path}|${h.signature}`,
    });
  }
  stats.avDetections = hits.length;
  // Warnings (an old database, a skipped archive) are not errors; unreadable files are.
  // --stdout sends clamscan's error lines to stdout, next to the FOUND ones.
  const errors = `${res.stdout}\n${res.stderr}`
    .split("\n")
    .filter((l) => /ERROR|Can't open|Access denied|Permission denied|Not supported/i.test(l) && !/Warning/i.test(l) && !/ FOUND$/.test(l));
  if (errors.length || (!res.ok && res.status !== 1 && !hits.length && !/Warning/i.test(res.stderr)))
    gaps.push({
      surface: "host",
      what: `${errors.length || "some"} antivirus target(s)`,
      why: `${engine.name} could not read them: ${(errors[0] ?? res.stderr.trim().split("\n")[0] ?? "").slice(0, 160) || `it exited with status ${res.status} without naming the file`}`,
    });
  // 0 clean, 1 found, 2 errors: anything else (a timeout, a kill) means the pass did not finish.
  if (res.status !== 0 && res.status !== 1 && res.status !== 2)
    gaps.push({
      surface: "host",
      what: "part of the antivirus pass",
      why: `${engine.name} did not finish (exit ${res.status}): files after the stop were not scanned`,
      fix: "re-run scan host, or narrow --roots",
    });
  if (!opts.full)
    gaps.push({
      surface: "host",
      what: "an antivirus pass over the whole disk",
      why: `the pass is targeted: ${targets.length} files (startup items and their programs, flagged files, recent files in temp and shared folders and Downloads, new extensions)`,
      fix: "scan host --av-full (hours on a large home directory)",
    });
  return { findings, gaps, stats, engine };
}

/** Rule files from a path: one .yar/.yara file, or every one in a folder (not recursive). */
export function yaraRuleFiles(path: string): string[] {
  try {
    const st = statSync(path);
    if (st.isFile()) return [path];
    return readdirSync(path)
      .filter((f) => /\.(yar|yara)$/i.test(f))
      .sort()
      .slice(0, 500)
      .map((f) => join(path, f));
  } catch {
    return [];
  }
}

/** Paths a one-per-line list can hold, and the ones with a line break in their name. */
export function splitTargets(targets: string[]): { listed: string[]; odd: string[] } {
  const listed: string[] = [];
  const odd: string[] = [];
  for (const t of targets) (/[\r\n]/.test(t) ? odd : listed).push(t);
  return { listed, odd };
}

export interface YaraHit {
  rule: string;
  path: string;
  score?: number;
  description?: string;
}

/** `<Rule> <path>`, or with -m `<Rule> [k="v",score=75,...] <path>`, lines from `yara`. */
export function parseYaraOutput(stdout: string): YaraHit[] {
  const out: YaraHit[] = [];
  for (const line of stdout.split("\n")) {
    const t = line.trim();
    const meta = /^(\S+)\s+\[(.*)\]\s+(\/.*)$/.exec(t);
    if (meta) {
      const m = meta[2] as string;
      // yara prints integer metadata as `score =75`: allow spaces around "=".
      const score = /(?:^|,)score\s*=\s*(\d+)/.exec(m)?.[1];
      const description = /(?:^|,)description\s*=\s*"((?:[^"\\]|\\.)*)"/.exec(m)?.[1];
      out.push({ rule: meta[1] as string, path: meta[3] as string, score: score ? Number(score) : undefined, description });
      continue;
    }
    const plain = /^(\S+)\s+(\/.*)$/.exec(t);
    if (plain) out.push({ rule: plain[1] as string, path: plain[2] as string });
  }
  return out;
}

/** Community rules score their own confidence (YARA-Forge: 0 to 100, 75 by default, below 70 for hunting rules). Below this, a match is worth a look, not proof. */
export const COMMUNITY_SCORE = 75;

/**
 * A YARA pass, over the same targets as the antivirus pass, with either rules
 * the agent saved from a source (`--yara`, findings cite that source: a match
 * is a compromise) or a community set (YARA-Forge: the rule's own score sets
 * the severity). A compiled set (.yarc) loads in a fraction of a second.
 */
export async function yaraPass(
  runner: Runner,
  opts: {
    rules: string;
    targets: string[];
    listDir: string;
    source?: string;
    recursive?: boolean;
    /** The rules are a community set: severity follows each rule's score. */
    community?: boolean;
    compiled?: boolean;
    label?: string;
  },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number> }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const label = opts.label ?? "YARA";
  const files = opts.compiled ? [opts.rules] : yaraRuleFiles(opts.rules);
  if (!files.length) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: `no .yar or .yara rule file at ${opts.rules}` });
    return { findings, gaps, stats: {} };
  }
  const { listed, odd } = splitTargets(opts.targets);
  const list = join(opts.listDir, opts.community ? "yara-community-targets.txt" : "yara-targets.txt");
  writeFileAtomic(list, `${listed.join("\n")}\n`);
  const base = ["--no-warnings", "--print-meta", ...(opts.recursive ? ["--recursive"] : []), ...(opts.compiled ? ["-C"] : [])];
  const timeoutMs = opts.recursive ? 3 * 60 * 60_000 : 30 * 60_000;
  const res = await runner("yara", [...base, "--scan-list", ...files, list], { timeoutMs });
  if (res.missing) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: "yara is not installed", fix: "brew install yara (or apt install yara)" });
    return { findings, gaps, stats: {} };
  }
  let stdout = res.stdout;
  let stderr = res.stderr;
  // yara takes one target per call outside a list: names with a line break get their own call.
  for (const t of odd.slice(0, 50)) {
    const one = await runner("yara", [...base, ...files, t], { timeoutMs: 60_000 });
    stdout += `\n${one.stdout}`;
    stderr += `\n${one.stderr}`;
  }
  const unreadable = stderr.split("\n").filter((l) => /could not open file|can not open file/i.test(l)).length;
  const fatal = stderr.split("\n").find((l) => l.trim() && !/could not open file|can not open file|warning/i.test(l));
  if (!stdout.trim() && fatal && !res.ok) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: `yara failed: ${fatal.slice(0, 200)}` });
    return { findings, gaps, stats: { yaraRules: files.length } };
  }
  if (unreadable) gaps.push({ surface: "host", what: `${unreadable} ${label} target(s)`, why: "yara could not open them (permissions, or the file vanished)" });
  // The rule files contain the strings they look for: never report them.
  const ruleSet = new Set(files);
  for (const h of parseYaraOutput(stdout).filter((x) => !ruleSet.has(x.path))) {
    const weak = opts.community && (h.score ?? 0) < COMMUNITY_SCORE;
    findings.push({
      surface: "host",
      severity: weak ? "suspicious" : "compromised",
      subject: h.path,
      title: `${label} rule ${h.rule} matches ${h.path}${h.score !== undefined ? ` (score ${h.score})` : ""}${h.description ? `: ${h.description.slice(0, 140)}` : ""}`,
      ...(opts.source ? { source: opts.source } : {}),
      evidence: {
        kind: "command",
        ref: `yara ${opts.compiled ? "-C " : ""}${files.length === 1 ? files[0] : `<${files.length} rule files in ${opts.rules}>`} ${h.path}`,
      },
      key: `host|yara|${h.path}|${h.rule}`,
    });
  }
  return {
    findings,
    gaps,
    stats: {
      [opts.community ? "communityRules" : "yaraRules"]: files.length,
      yaraTargets: opts.targets.length,
      [opts.community ? "communityMatches" : "yaraMatches"]: findings.length,
    },
  };
}
