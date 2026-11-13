// macOS apps: what /Applications and ~/Applications hold, who signed each one,
// and its bundle identifier, for team_id and bundle_id IOCs and for the apps a
// stealer installs (unsigned, ad-hoc signed, or named like an Apple app).
// Read-only: Info.plist is read, codesign only displays a signature.
import { lstatSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import type { Matcher } from "../ioc.js";
import { mapPool } from "../pool.js";
import type { Runner } from "../runner.js";
import type { Finding } from "../types.js";
import { bundleIdOf, type CodeSignature, changedMs, codesignInfo, iocHit, isAppleSigned } from "./hostintel.js";

type NewFinding = Omit<Finding, "id">;

const MAX_APPS = 2000;

/** The .app bundles in `dirs` and one folder level below them (Utilities, a vendor folder). Symlinks (Safari in /Applications) are not apps installed there. */
export function listApps(dirs: string[]): string[] {
  const out: string[] = [];
  const visit = (dir: string, depth: number) => {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const n of names.sort()) {
      if (out.length >= MAX_APPS) return;
      const p = join(dir, n);
      try {
        const st = lstatSync(p);
        if (st.isSymbolicLink() || !st.isDirectory()) continue;
        if (n.endsWith(".app")) out.push(p);
        else if (depth > 0 && !n.startsWith(".")) visit(p, depth - 1);
      } catch {}
    }
  };
  for (const d of dirs) visit(d, 1);
  return out;
}

/** Apps and system components that ship with macOS: a copy outside /System is an impersonation (CrashStealer poses as CrashReporter). */
const APPLE_NAMES = new Set(
  [
    "CrashReporter",
    "Finder",
    "System Settings",
    "System Preferences",
    "Software Update",
    "Activity Monitor",
    "Terminal",
    "Safari",
    "App Store",
    "Keychain Access",
    "Disk Utility",
    "Console",
    "System Information",
    "Installer",
    "Archive Utility",
    "Migration Assistant",
    "Script Editor",
    "Automator",
    "Font Book",
    "Spotlight",
    "XProtect",
  ].map((n) => n.toLowerCase().replace(/\s+/g, "")),
);

/** Named like an Apple app (by its folder name) or carrying an Apple bundle identifier. */
export function appleLike(path: string, bundleId?: string): boolean {
  return APPLE_NAMES.has(basename(path, ".app").toLowerCase().replace(/\s+/g, "")) || /^com\.apple\./i.test(bundleId ?? "");
}

export interface MacApp {
  path: string;
  bundleId?: string;
  changed: string;
  signature?: CodeSignature;
}

/**
 * Apps matched against team_id and bundle_id IOCs. codesign runs on an app
 * only when its signature can decide something (a team_id IOC exists), and
 * at most 8 at a time.
 */
export async function appFindings(
  runner: Runner,
  dirs: string[],
  opts: { nowMs: number; sinceMs: number; team: Matcher[]; bundle: Matcher[] },
): Promise<{ findings: NewFinding[]; apps: MacApp[] }> {
  const findings: NewFinding[] = [];
  const recent = new Set<string>();
  const apps = await mapPool(listApps(dirs), 8, async (path): Promise<MacApp> => {
    let changed = 0;
    try {
      changed = changedMs(lstatSync(path), opts.nowMs);
    } catch {}
    if (changed >= opts.sinceMs) recent.add(path);
    const app: MacApp = { path, bundleId: await bundleIdOf(path, runner), changed: new Date(changed).toISOString() };
    // codesign only where the signature decides something: a team_id IOC, a new app, an Apple look-alike.
    if (opts.team.length || recent.has(path) || appleLike(path, app.bundleId)) app.signature = await codesignInfo(runner, path);
    return app;
  });
  for (const app of apps) {
    const name = basename(app.path);
    const bundle = app.bundleId ? opts.bundle.find((x) => x.test(app.bundleId ?? "")) : undefined;
    const team = app.signature?.team ? opts.team.find((x) => x.test(app.signature?.team ?? "")) : undefined;
    const m = bundle ?? team;
    const sig = app.signature;
    // Not an IOC: what the stealers of 2026 install. An unsigned or ad-hoc signed new app, an app named like Apple's not signed by Apple.
    const signals = [
      recent.has(app.path) && sig && !sig.signed ? (sig.adhoc ? "is ad-hoc signed (no developer identity)" : "is not signed") : undefined,
      appleLike(app.path, app.bundleId) && sig && !isAppleSigned(sig)
        ? `is named like an Apple app (${app.bundleId?.startsWith("com.apple.") ? app.bundleId : name}) but is not signed by Apple${sig.signed ? ` (${sig.authority ?? "unknown signer"})` : ""}`
        : undefined,
    ].filter((x): x is string => !!x);
    if (!m && signals.length)
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: app.path,
        title: `App ${name}${recent.has(app.path) ? ` (added or changed ${app.changed.slice(0, 10)})` : ""} ${signals.join("; ")}`,
        at: app.changed,
        evidence: {
          kind: "command",
          ref: `codesign -dv ${JSON.stringify(app.path)}`,
          excerpt: [app.bundleId, sig?.authority, sig?.team].filter(Boolean).join(" | "),
        },
        key: `host|app|${app.path}`,
      });
    if (m)
      findings.push(
        iocHit(m, {
          subject: app.path,
          title: m === bundle ? `App ${name} has the bundle identifier "${m.indicator.value}"` : `App ${name} is signed by team "${m.indicator.value}"`,
          at: app.changed,
          evidence: { kind: "file", ref: app.path, excerpt: [app.bundleId, app.signature?.authority, app.signature?.team].filter(Boolean).join(" | ") },
        }),
      );
  }
  return { findings, apps };
}
