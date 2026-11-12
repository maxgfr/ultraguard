// A classic antivirus pass with ClamAV, when it is installed: signatures for
// known malware families complement the campaign IOCs (what the news names)
// and the machine analysis (what looks wrong).
//
// Targeted by default, because a whole home directory takes hours: the
// programs startup items run, the files the other checks flagged, temporary
// and shared folders, recent downloads and newly installed extensions.
// `--av-full` scans every root. ultraguard never installs ClamAV nor updates
// its signatures (read-only); stale signatures are a coverage gap.
import { readdirSync, statSync } from "node:fs";
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
  return [...set].filter((p) => {
    try {
      statSync(p);
      return true;
    } catch {
      return false;
    }
  });
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
      fix: "brew install clamav (or apt install clamav), configure freshclam, run freshclam, then re-run scan host",
    });
    return { findings, gaps, stats };
  }
  if (engine.ageDays !== undefined && engine.ageDays > 7)
    gaps.push({
      surface: "host",
      what: `malware families newer than ${engine.signatures?.slice(0, 10)}`,
      why: `ClamAV's signatures are ${engine.ageDays} days old`,
      fix: "freshclam, then re-run scan host",
    });

  const targets = opts.full ?? avTargets(opts.home, opts.inventory, opts.flagged, opts.sinceMs);
  stats.avTargets = targets.length;
  if (!targets.length) return { findings, gaps, stats, engine };
  const list = join(opts.listDir, "av-targets.txt");
  writeFileAtomic(list, `${targets.join("\n")}\n`);
  const args = ["--infected", "--no-summary", `--file-list=${list}`];
  if (engine.name === "clamscan") args.push("--recursive", "--stdout", "--max-filesize=100M", "--max-scansize=400M");
  else args.push("--fdpass", "--multiscan");
  const res = await runner(engine.name, args, { timeoutMs: opts.full ? 3 * 60 * 60_000 : 20 * 60_000 });
  // Exit 0: clean. 1: something found. 2: errors (unreadable files), possibly with findings.
  const hits = parseClamOutput(res.stdout);
  for (const h of hits)
    findings.push({
      surface: "host",
      severity: "compromised",
      subject: h.path,
      title: `ClamAV detects ${h.signature} in ${h.path}`,
      evidence: {
        kind: "command",
        ref: `${engine.name} --no-summary ${h.path}`,
        excerpt: `${h.signature} (ClamAV ${engine.version}, signatures of ${engine.signatures?.slice(0, 10) ?? "?"})`,
      },
      key: `host|av|${h.path}|${h.signature}`,
    });
  stats.avDetections = hits.length;
  // Warnings (an old database, a skipped archive) are not errors; unreadable files are.
  const errors = res.stderr.split("\n").filter((l) => /ERROR|Can't open|Access denied|Permission denied|Not supported/i.test(l) && !/Warning/i.test(l));
  if (errors.length || (!res.ok && res.status !== 1 && !hits.length && !/Warning/i.test(res.stderr)))
    gaps.push({
      surface: "host",
      what: `${errors.length || "some"} antivirus target(s)`,
      why: `${engine.name} could not read them: ${(errors[0] ?? res.stderr.trim().split("\n")[0] ?? "").slice(0, 160)}`,
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

/** `<RuleName> <path>` lines from `yara`. */
export function parseYaraOutput(stdout: string): { rule: string; path: string }[] {
  const out: { rule: string; path: string }[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^(\S+)\s+(\/.*)$/.exec(line.trim());
    if (m) out.push({ rule: m[1] as string, path: m[2] as string });
  }
  return out;
}

/**
 * A YARA pass with rules the agent saved from a source (write-ups often
 * publish them) or a community set. Same targets as the antivirus pass.
 */
export async function yaraPass(
  runner: Runner,
  opts: { rules: string; targets: string[]; listDir: string; source?: string; recursive?: boolean },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number> }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const files = yaraRuleFiles(opts.rules);
  if (!files.length) {
    gaps.push({ surface: "host", what: "the YARA pass", why: `no .yar or .yara rule file at ${opts.rules}` });
    return { findings, gaps, stats: {} };
  }
  const list = join(opts.listDir, "yara-targets.txt");
  writeFileAtomic(list, `${opts.targets.join("\n")}\n`);
  const res = await runner("yara", ["--no-warnings", ...(opts.recursive ? ["--recursive"] : []), "--scan-list", ...files, list], {
    timeoutMs: opts.recursive ? 3 * 60 * 60_000 : 30 * 60_000,
  });
  if (res.missing) {
    gaps.push({ surface: "host", what: "the YARA pass", why: "yara is not installed", fix: "brew install yara (or apt install yara)" });
    return { findings, gaps, stats: {} };
  }
  if (!res.ok && !res.stdout.trim()) {
    gaps.push({ surface: "host", what: "the YARA pass", why: `yara failed: ${(res.stderr.trim().split("\n")[0] ?? "").slice(0, 200)}` });
    return { findings, gaps, stats: { yaraRules: files.length } };
  }
  // The rule files contain the strings they look for: never report them.
  const ruleSet = new Set(files);
  for (const h of parseYaraOutput(res.stdout).filter((x) => !ruleSet.has(x.path)))
    findings.push({
      surface: "host",
      severity: "compromised",
      subject: h.path,
      title: `YARA rule ${h.rule} matches ${h.path}`,
      ...(opts.source ? { source: opts.source } : {}),
      evidence: { kind: "command", ref: `yara ${files.length === 1 ? files[0] : `<${files.length} rule files in ${opts.rules}>`} ${h.path}` },
      key: `host|yara|${h.path}|${h.rule}`,
    });
  return { findings, gaps, stats: { yaraRules: files.length, yaraTargets: opts.targets.length, yaraMatches: findings.length } };
}
