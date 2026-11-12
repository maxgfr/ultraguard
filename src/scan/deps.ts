// scan deps: every lockfile under the roots, against two lists.
//  1. The packages the campaign's sources name (IOC `package` indicators).
//  2. OSV's malicious-package advisories (MAL-*), queried keyless per locked
//     version: the feed that catches the packages no article has named yet.
// Each OSV hit is registered as its own source, so the finding still cites a
// page fetched in this run (invariant I1).
import { readFileSync, statSync } from "node:fs";
import { httpJson } from "../engine.js";
import { matchers, packageHit } from "../ioc.js";
import type { Run } from "../run.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import { type Locked, lockfileKind, osvEcosystem, parseLockfile } from "./lockfiles.js";
import type { WalkResult } from "./walk.js";

type NewFinding = Omit<Finding, "id">;

export type OsvBatch = (
  queries: { package: { ecosystem: string; name: string }; version: string }[],
) => Promise<{ ok: boolean; results: { vulns?: { id: string }[] }[]; error?: string }>;

export const defaultOsvBatch: OsvBatch = async (queries) => {
  try {
    // httpJson answers { ok, status, data }: the batch results are in data.
    const res = await httpJson("POST", "https://api.osv.dev/v1/querybatch", { queries }, { timeoutMs: 60_000, retries: 2, maxBytes: 32 * 1024 * 1024 });
    if (!res.ok || !Array.isArray(res.data?.results)) return { ok: false, results: [], error: res.error ?? `HTTP ${res.status}` };
    if (res.data.results.length !== queries.length)
      return { ok: false, results: [], error: `OSV answered ${res.data.results.length} results for ${queries.length} queries` };
    return { ok: true, results: res.data.results };
  } catch (e) {
    return { ok: false, results: [], error: (e as Error).message };
  }
};

export interface DepsScanOptions {
  osv?: OsvBatch | false;
  now?: Date;
}

export async function scanDeps(
  iocs: IocFile,
  tree: WalkResult,
  run: Run | undefined,
  opts: DepsScanOptions = {},
): Promise<{ result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] }> {
  const result: SurfaceResult = { surface: "deps", scanned: true, stats: {}, startedAt: (opts.now ?? new Date()).toISOString() };
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const pkgs = matchers(iocs, "package");

  const where = new Map<string, Set<string>>(); // "eco|name|version" -> lockfiles
  let lockfiles = 0;
  let unreadable = 0;
  for (const p of tree.files) {
    if (!lockfileKind(p)) continue;
    let locked: Locked[];
    try {
      if (statSync(p).size > 64 * 1024 * 1024) throw new Error("too large");
      locked = parseLockfile(p, readFileSync(p, "utf8"));
    } catch {
      unreadable++;
      continue;
    }
    lockfiles++;
    for (const l of locked) {
      const k = `${l.ecosystem}|${l.name}|${l.version}`;
      const set = where.get(k) ?? new Set<string>();
      set.add(p);
      where.set(k, set);
      for (const m of pkgs) {
        if (!packageHit(m.indicator, l.ecosystem, l.name, l.version)) continue;
        findings.push({
          surface: "deps",
          severity: "compromised",
          subject: p,
          title: `${p} locks ${l.name}@${l.version}, named by the campaign`,
          campaign: m.campaign.id,
          source: m.indicator.source,
          indicator: { type: "package", value: m.indicator.value },
          evidence: { kind: "file", ref: p, excerpt: `${l.ecosystem} ${l.name}@${l.version}` },
          key: `deps|${p}|${l.ecosystem}|${l.name}|${l.version}`,
        });
      }
    }
  }
  result.stats.lockfiles = lockfiles;
  result.stats.packages = where.size;
  if (unreadable) gaps.push({ surface: "deps", what: `${unreadable} lockfiles`, why: "could not be parsed or were over 64 MB" });

  if (opts.osv !== false) {
    const osv = opts.osv ?? defaultOsvBatch;
    const keys = [...where.keys()].filter((k) => osvEcosystem(k.split("|")[0] as string));
    let failed = 0;
    let malicious = 0;
    for (let i = 0; i < keys.length; i += 1000) {
      const chunk = keys.slice(i, i + 1000);
      const queries = chunk.map((k) => {
        const [eco, name, version] = k.split("|") as [string, string, string];
        return { package: { ecosystem: osvEcosystem(eco) as string, name }, version };
      });
      const res = await osv(queries);
      if (!res.ok) {
        failed += chunk.length;
        continue;
      }
      res.results.forEach((r, j) => {
        for (const v of r.vulns ?? []) {
          if (!v.id.startsWith("MAL-")) continue;
          malicious++;
          const k = chunk[j] as string;
          const [eco, name, version] = k.split("|") as [string, string, string];
          const url = `https://osv.dev/vulnerability/${v.id}`;
          const src = run?.addSource({ url, title: `OSV ${v.id}: malicious package ${name}`, fetchedAt: new Date().toISOString(), origin: "osv" });
          for (const p of where.get(k) ?? []) {
            findings.push({
              surface: "deps",
              severity: "compromised",
              subject: p,
              title: `${p} locks ${name}@${version}, a malicious package (${v.id})`,
              source: src?.id,
              evidence: { kind: "url", ref: url, excerpt: `${eco} ${name}@${version}` },
              key: `deps|${p}|${eco}|${name}|${version}|${v.id}`,
            });
          }
        }
      });
    }
    result.stats.osvQueried = keys.length - failed;
    result.stats.osvMalicious = malicious;
    if (failed)
      gaps.push({
        surface: "deps",
        what: `${failed} packages against OSV malicious-package advisories`,
        why: "the OSV API did not answer",
        fix: "re-run when online",
      });
  } else gaps.push({ surface: "deps", what: "OSV malicious-package advisories", why: "--no-osv" });

  gaps.push({
    surface: "deps",
    what: "globally installed packages (npm -g, pipx, cargo install) and Docker images",
    why: "only lockfiles under the roots are read",
  });
  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps };
}
