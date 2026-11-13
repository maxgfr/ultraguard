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
import { bundleIdOf, type CodeSignature, changedMs, codesignInfo, iocHit } from "./hostintel.js";

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
  opts: { nowMs: number; team: Matcher[]; bundle: Matcher[] },
): Promise<{ findings: NewFinding[]; apps: MacApp[] }> {
  const findings: NewFinding[] = [];
  const apps = await mapPool(listApps(dirs), 8, async (path): Promise<MacApp> => {
    let changed = 0;
    try {
      changed = changedMs(lstatSync(path), opts.nowMs);
    } catch {}
    const app: MacApp = { path, bundleId: await bundleIdOf(path, runner), changed: new Date(changed).toISOString() };
    if (opts.team.length) app.signature = await codesignInfo(runner, path);
    return app;
  });
  for (const app of apps) {
    const name = basename(app.path);
    const bundle = app.bundleId ? opts.bundle.find((x) => x.test(app.bundleId ?? "")) : undefined;
    const team = app.signature?.team ? opts.team.find((x) => x.test(app.signature?.team ?? "")) : undefined;
    const m = bundle ?? team;
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
