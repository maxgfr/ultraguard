// XProtect, macOS's own antivirus, read three ways (macOS only, read-only,
// every command through the Runner):
//
// 1. Apple's YARA rules (XProtect.yara, XPScripts.yr in XProtect.bundle) run
//    with yara over the same targets as the YARA-Forge pass. A match cites the
//    rule set as a source of the run ("Apple XProtect <version>").
// 2. XProtect Remediator (XPR) scans in the background and never tells the
//    user what it found: its reports are in the unified log. A threat it
//    detected, removed or failed to remove is a finding.
// 3. The hardening a stealer turns off: Gatekeeper, SIP, automatic security
//    updates (they also bring XProtect's rules), FileVault.
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import type { Runner } from "../runner.js";
import type { Finding, Gap, Source } from "../types.js";
import { yaraPass } from "./antivirus.js";
import type { Incremental } from "./avcache.js";

type NewFinding = Omit<Finding, "id">;

export const XPROTECT_BUNDLE = "/Library/Apple/System/Library/CoreServices/XProtect.bundle";
/** Older than this, XProtect's rules are a gap: macOS stopped updating them. */
export const XPROTECT_STALE_DAYS = 30;
/** XProtect Remediator's scan reports in the unified log. */
export const XPR_PREDICATE = 'subsystem == "com.apple.XProtectFramework.PluginAPI" && category == "XPEvent.structured"';
const XPR_DAYS = 30;
/** `log show` in zsh is a builtin: always the binary. */
const LOG = "/usr/bin/log";

export interface XProtectInfo {
  bundle: string;
  version?: string;
  /** When this version was installed (from `xprotect version`), or the rule file's date. */
  installed?: string;
  ageDays?: number;
  /** The rule files present: XProtect.yara, XPScripts.yr. */
  rules: string[];
  /** The run's [S#] for the rule set. */
  sourceId?: string;
  /** Why XProtect could not be read at all. */
  missing?: string;
}

/** "Version: 5372 Installed: 2026-11-10 22:35:13 +0000" → version and ISO date. */
export function parseXProtectVersion(text: string): { version?: string; installed?: string } {
  const version = /Version:\s*(\S+)/.exec(text)?.[1];
  const raw = /Installed:\s*(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*([+-]\d{2}):?(\d{2})/.exec(text);
  const t = raw ? Date.parse(`${raw[1]}T${raw[2]}${raw[3]}:${raw[4]}`) : Number.NaN;
  return { version, installed: Number.isNaN(t) ? undefined : new Date(t).toISOString() };
}

/** XProtect's version and rule files: `xprotect version`, else the bundle's Info.plist and the rule file's date. */
export async function detectXProtect(runner: Runner, opts: { bundle?: string; now?: Date } = {}): Promise<XProtectInfo> {
  const bundle = opts.bundle ?? XPROTECT_BUNDLE;
  const res = join(bundle, "Contents/Resources");
  const rules = ["XProtect.yara", "XPScripts.yr"].map((n) => join(res, n)).filter((p) => existsSync(p));
  if (!existsSync(bundle)) return { bundle, rules, missing: `no XProtect bundle at ${bundle}` };
  const v = await runner("xprotect", ["version"], { timeoutMs: 15_000 });
  let { version, installed } = v.ok ? parseXProtectVersion(v.stdout) : {};
  if (!version) {
    try {
      const plist = readFileSync(join(bundle, "Contents/Info.plist"), "utf8");
      version = /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/.exec(plist)?.[1];
    } catch {}
    if (!version) {
      const p = await runner("plutil", ["-extract", "CFBundleShortVersionString", "raw", "-o", "-", join(bundle, "Contents/Info.plist")], {
        timeoutMs: 10_000,
      });
      if (p.ok) version = p.stdout.trim() || undefined;
    }
  }
  if (!installed && rules[0])
    try {
      installed = statSync(rules[0]).mtime.toISOString();
    } catch {}
  const now = (opts.now ?? new Date()).getTime();
  const ageDays = installed ? Math.max(0, Math.floor((now - Date.parse(installed)) / 86_400_000)) : undefined;
  return { bundle, version, installed, ageDays, rules };
}

/** The rule set as a source of the run, so a match cites it. */
export function xprotectSource(info: XProtectInfo, now = new Date()): Omit<Source, "id"> {
  return {
    url: `file://${info.bundle}#${info.version ?? "unknown"}`,
    title: `Apple XProtect ${info.version ?? "(version unknown)"} (macOS's built-in YARA rules)`,
    fetchedAt: info.installed ?? now.toISOString(),
    origin: "rules",
  };
}

/** Apple's rules over the YARA-Forge targets: a match is compromised and cites the rule set. */
export async function xprotectYara(
  runner: Runner,
  info: XProtectInfo,
  opts: { targets: string[]; listDir: string; exclude?: string[]; incremental?: (name: string, rules: string[]) => Incremental | undefined },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number> }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const stats: Record<string, number> = {};
  if (info.missing || !info.rules.length) {
    gaps.push({ surface: "host", what: "Apple's XProtect rules", why: info.missing ?? `no rule file in ${info.bundle}` });
    return { findings, gaps, stats };
  }
  if (info.ageDays !== undefined && info.ageDays > XPROTECT_STALE_DAYS)
    gaps.push({
      surface: "host",
      what: `malware Apple added to XProtect after ${info.installed?.slice(0, 10)}`,
      why: `macOS stopped updating XProtect: version ${info.version ?? "?"} is ${info.ageDays} days old`,
      fix: "System Settings > General > Software Update > Automatic Updates: turn on Install Security Responses and system files (or sudo softwareupdate --background-critical)",
    });
  for (const rules of info.rules) {
    const key = basename(rules) === "XPScripts.yr" ? "xpscripts" : "xprotect";
    const y = await yaraPass(runner, {
      rules,
      targets: opts.targets,
      listDir: opts.listDir,
      source: info.sourceId,
      label: `Apple XProtect ${info.version ?? ""}`.trim() + (key === "xpscripts" ? " (XPScripts)" : ""),
      statsKey: key,
      exclude: opts.exclude,
      incremental: opts.incremental?.(key, [rules]),
    });
    findings.push(...y.findings);
    gaps.push(...y.gaps);
    Object.assign(stats, y.stats);
  }
  return { findings, gaps, stats };
}

/** "2026-11-13 03:27:22.104878+0100" → ISO. */
function logTime(t: unknown): string | undefined {
  const m = typeof t === "string" ? /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?([+-]\d{2}):?(\d{2})$/.exec(t.trim()) : null;
  if (!m) return undefined;
  const ms = Date.parse(`${m[1]}T${m[2]}${(m[3] ?? "").slice(0, 4)}${m[4]}:${m[5]}`);
  return Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
}

const CLEAN_STATUS = /^(NoThreatDetected|Success)$/i;

/** What an XPR status says: a threat Apple removed, one it failed to remove, one it only detected, or something else. */
export function xprOutcome(status: string): "remediated" | "failed" | "detected" | "other" {
  if (/remediat|remov|clean|delet|quarantin/i.test(status)) return /fail|error|unable|partial|not/i.test(status) ? "failed" : "remediated";
  if (/threat|detect|infect|malware|found/i.test(status)) return "detected";
  return "other";
}

/**
 * XProtect Remediator's reports over the last 30 days. Each event is one
 * plugin (XProtectRemediator<Family>) run; its message is JSON with a status.
 */
export async function remediatorFindings(runner: Runner): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number> }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const cmd = `${LOG} show --style ndjson --last ${XPR_DAYS}d --predicate '${XPR_PREDICATE}'`;
  const res = await runner(LOG, ["show", "--style", "ndjson", "--last", `${XPR_DAYS}d`, "--predicate", XPR_PREDICATE], { timeoutMs: 180_000 });
  if (!res.ok) {
    gaps.push({
      surface: "host",
      what: "XProtect Remediator's reports (what macOS's own antivirus found and removed)",
      why: res.missing
        ? `${LOG} is not available`
        : `the unified log could not be read: ${(res.stderr.trim().split("\n")[0] ?? "").slice(0, 160) || `exit ${res.status}`}`,
      fix: `sudo ${cmd}`,
    });
    return { findings, gaps, stats: {} };
  }
  let scans = 0;
  let finished = false;
  const groups = new Map<
    string,
    { family: string; status: string; code?: number; causedBy: string[]; at?: string; count: number; outcome: ReturnType<typeof xprOutcome> }
  >();
  for (const line of res.stdout.split("\n").slice(0, 200_000)) {
    if (!line.trim()) continue;
    let ev: { eventMessage?: string; processImagePath?: string; timestamp?: string; finished?: number };
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.finished !== undefined) finished = true;
    if (typeof ev.eventMessage !== "string") continue;
    let msg: { status_message?: unknown; status_code?: unknown; caused_by?: unknown };
    try {
      msg = JSON.parse(ev.eventMessage);
    } catch {
      continue;
    }
    const status = typeof msg.status_message === "string" ? msg.status_message : undefined;
    if (!status) continue;
    scans++;
    if (CLEAN_STATUS.test(status)) continue;
    const family = /XProtectRemediator(\w+)$/.exec(ev.processImagePath ?? "")?.[1] ?? basename(ev.processImagePath ?? "unknown plugin");
    const causedBy = (Array.isArray(msg.caused_by) ? msg.caused_by : [])
      .map((c) => (typeof c === "string" ? c : JSON.stringify(c)))
      .filter(Boolean)
      .slice(0, 20);
    const k = `${family}|${status}|${causedBy.join(",")}`;
    const at = logTime(ev.timestamp);
    const g = groups.get(k);
    if (g) {
      g.count++;
      if (at && (!g.at || at > g.at)) g.at = at;
    } else
      groups.set(k, {
        family,
        status,
        code: typeof msg.status_code === "number" ? msg.status_code : undefined,
        causedBy,
        at,
        count: 1,
        outcome: xprOutcome(status),
      });
  }
  for (const g of groups.values()) {
    const what =
      g.outcome === "remediated"
        ? `found ${g.family} and removed it (Apple remediated it)`
        : g.outcome === "failed"
          ? `found ${g.family} and failed to remove it`
          : g.outcome === "detected"
            ? `detected ${g.family} (no removal reported)`
            : `reported "${g.status}" while scanning for ${g.family}`;
    findings.push({
      surface: "host",
      severity: g.outcome === "other" ? "suspicious" : "compromised",
      subject: g.causedBy[0] ?? `XProtect Remediator ${g.family}`,
      title: `XProtect Remediator ${what}${g.at ? ` on ${g.at.slice(0, 16).replace("T", " ")} UTC` : ""}${g.count > 1 ? ` (${g.count} reports)` : ""}${g.causedBy.length ? `: ${g.causedBy.slice(0, 3).join(", ")}` : ""}; status ${g.status}${g.code !== undefined ? ` (${g.code})` : ""}`,
      at: g.at,
      evidence: { kind: "command", ref: cmd, excerpt: JSON.stringify({ family: g.family, status: g.status, caused_by: g.causedBy }).slice(0, 300) },
      key: `host|xpr|${g.family}|${g.status}|${g.causedBy.join(",")}`,
    });
  }
  if (!finished && res.stdout.trim())
    gaps.push({
      surface: "host",
      what: "part of XProtect Remediator's reports",
      why: "the unified log output stopped before its end (too large or interrupted)",
      fix: `sudo ${cmd}`,
    });
  if (scans === 0)
    gaps.push({
      surface: "host",
      what: "XProtect Remediator's scans",
      why: `no scan report in the last ${XPR_DAYS} days: XProtect Remediator does not seem to run on this Mac`,
      fix: "keep the Mac awake and on power for a while (XPR scans when idle), and turn on Install Security Responses and system files in Software Update",
    });
  return { findings, gaps, stats: { xprScans: scans, xprReports: groups.size } };
}

const SOFTWARE_UPDATE = "/Library/Preferences/com.apple.SoftwareUpdate.plist";

/** Third-party real-time protection, by the paths it installs. Recorded, not judged. */
const REALTIME_TOOLS: [string, string[]][] = [
  ["LuLu", ["LuLu.app"]],
  ["BlockBlock", ["BlockBlock Helper.app", "BlockBlock.app"]],
  ["KnockKnock", ["KnockKnock.app"]],
  ["Little Snitch", ["Little Snitch.app"]],
];

export interface Hardening {
  gatekeeper?: string;
  sip?: string;
  filevault?: string;
  criticalUpdateInstall?: string;
  configDataInstall?: string;
  realtimeTools: string[];
}

/** What a stealer turns off, as findings: Gatekeeper, SIP, automatic security updates (suspicious), FileVault (info). */
export async function hardeningFindings(runner: Runner, opts: { appDirs: string[] }): Promise<{ findings: NewFinding[]; gaps: Gap[]; hardening: Hardening }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const hardening: Hardening = { realtimeTools: [] };
  const add = (key: string, severity: Finding["severity"], subject: string, title: string, ref: string, excerpt: string) =>
    findings.push({
      surface: "host",
      severity,
      subject,
      title,
      evidence: { kind: "command", ref, excerpt: excerpt.trim().slice(0, 200) },
      key: `host|hardening|${key}`,
    });
  const read = async (cmd: string, args: string[], what: string, re: RegExp): Promise<{ value?: string; text: string }> => {
    const r = await runner(cmd, args, { timeoutMs: 15_000 });
    const text = `${r.stdout}\n${r.stderr}`;
    const value = re.exec(text)?.[1]?.toLowerCase();
    if (!value)
      gaps.push({
        surface: "host",
        what,
        why: r.missing ? `${cmd} is not available` : `${cmd} ${args.join(" ")} said: ${(text.trim().split("\n")[0] ?? "").slice(0, 120) || `exit ${r.status}`}`,
        fix: `${cmd} ${args.join(" ")}`,
      });
    return { value, text };
  };

  const gk = await read("spctl", ["--status"], "Gatekeeper status", /assessments\s+(enabled|disabled)/i);
  hardening.gatekeeper = gk.value;
  if (gk.value === "disabled")
    add(
      "gatekeeper",
      "suspicious",
      "Gatekeeper",
      "Gatekeeper is off (spctl --status: assessments disabled): macOS no longer checks downloaded apps, and stealers turn it off (spctl --master-disable)",
      "spctl --status",
      gk.text,
    );
  const sip = await read("csrutil", ["status"], "System Integrity Protection status", /status:\s*(enabled|disabled|unknown)/i);
  hardening.sip = sip.value;
  if (sip.value === "disabled" || sip.value === "unknown")
    add(
      "sip",
      "suspicious",
      "System Integrity Protection",
      `System Integrity Protection is ${sip.value === "disabled" ? "disabled" : "partly disabled (custom configuration)"}: system files and Apple's protections can be changed`,
      "csrutil status",
      sip.text,
    );
  const fv = await read("fdesetup", ["status"], "FileVault status", /FileVault is (On|Off)/i);
  hardening.filevault = fv.value;
  if (fv.value === "off")
    add("filevault", "info", "FileVault", "FileVault is off: the disk is not encrypted, so anyone with the Mac can read it", "fdesetup status", fv.text);

  // Absent keys mean the default: on.
  for (const [key, label] of [
    ["CriticalUpdateInstall", "Install Security Responses and system files"],
    ["ConfigDataInstall", "automatic security data updates (XProtect's rules)"],
  ] as const) {
    const r = await runner("plutil", ["-extract", key, "raw", "-o", "-", SOFTWARE_UPDATE], { timeoutMs: 10_000 });
    const value = r.ok ? r.stdout.trim().toLowerCase() : undefined;
    if (key === "CriticalUpdateInstall") hardening.criticalUpdateInstall = value ?? "default";
    else hardening.configDataInstall = value ?? "default";
    if (!r.ok && !/No value at that key path|does not exist|No such file/i.test(`${r.stderr}${r.stdout}`))
      gaps.push({
        surface: "host",
        what: `whether ${label} is on`,
        why: r.missing ? "plutil is not available" : `${SOFTWARE_UPDATE} could not be read`,
        fix: `defaults read ${SOFTWARE_UPDATE.replace(/\.plist$/, "")} ${key}`,
      });
    if (value === "false" || value === "0")
      add(
        key,
        "suspicious",
        "Software Update",
        `${label} is turned off (${key} = ${value}): macOS stops installing Apple's security fixes and malware rules, a setting stealers change`,
        `plutil -extract ${key} raw ${SOFTWARE_UPDATE}`,
        `${key}=${value}`,
      );
  }
  for (const [name, apps] of REALTIME_TOOLS) if (opts.appDirs.some((d) => apps.some((a) => existsSync(join(d, a))))) hardening.realtimeTools.push(name);
  return { findings, gaps, hardening };
}
