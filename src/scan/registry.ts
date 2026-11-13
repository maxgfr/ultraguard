// The user's own npm packages: a worm that steals an npm token (Shai-Hulud and
// its successors) spreads by publishing a new version of every package the
// victim maintains, with an install script. A version published inside a
// campaign window is the one place that shows up. Read-only: the public
// registry API, plus `npm whoami` to learn the login when none is given.
import { httpJson } from "../engine.js";
import { packageHit } from "../ioc.js";
import { mapPool } from "../pool.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap, IocFile } from "../types.js";

type NewFinding = Omit<Finding, "id">;

const REGISTRY = "https://registry.npmjs.org";
const SEARCH_PAGE = 250;
const MAX_PACKAGES = 500;
const INSTALL_SCRIPTS = ["preinstall", "install", "postinstall", "prepare"];

export type RegistryGet = (url: string) => Promise<{ ok: boolean; status: number; data?: any; error?: string }>;

export const defaultRegistryGet: RegistryGet = (url) => httpJson("GET", url, undefined, { timeoutMs: 30_000 });

export interface RegistryOptions {
  /** The npm login to check; otherwise `npm whoami`. */
  user?: string;
  runner: Runner;
  get?: RegistryGet;
  concurrency?: number;
}

/** Who publishes as this machine: --npm-user, or the logged-in npm account. */
async function npmLogin(opts: RegistryOptions): Promise<{ user?: string; why?: string }> {
  if (opts.user) return { user: opts.user };
  const r = await opts.runner("npm", ["whoami", `--registry=${REGISTRY}/`], { timeoutMs: 20_000 });
  if (r.missing) return { why: "npm is not installed" };
  const user = r.stdout.trim().split("\n").pop()?.trim();
  if (!r.ok || !user) return { why: "npm is not logged in here (npm whoami failed)" };
  return { user };
}

export async function scanNpmPublishes(
  iocs: IocFile,
  opts: RegistryOptions,
): Promise<{ findings: NewFinding[]; gaps: Gap[]; stats: Record<string, number>; user?: string }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const stats: Record<string, number> = {};
  const get = opts.get ?? defaultRegistryGet;
  const campaigns = iocs.campaigns;
  if (!campaigns.length) return { findings, gaps, stats };

  const login = await npmLogin(opts);
  if (!login.user) {
    gaps.push({
      surface: "deps",
      what: "new versions of npm packages you maintain (a worm republishing them)",
      why: login.why ?? "no npm login",
      fix: "pass --npm-user <your npm username> (or skip if you publish nothing to npm)",
    });
    return { findings, gaps, stats };
  }
  const user = login.user;

  // Every package this login maintains, through the registry search.
  const names: string[] = [];
  for (let from = 0; from < MAX_PACKAGES; from += SEARCH_PAGE) {
    const res = await get(`${REGISTRY}/-/v1/search?text=maintainer:${encodeURIComponent(user)}&size=${SEARCH_PAGE}&from=${from}`);
    if (!res.ok) {
      gaps.push({
        surface: "deps",
        what: `npm packages maintained by ${user}`,
        why: `the registry search failed: ${res.error ?? `HTTP ${res.status}`}`,
        fix: "re-run scan deps later",
      });
      return { findings, gaps, stats, user };
    }
    const objects = (res.data?.objects ?? []) as any[];
    for (const o of objects) if (typeof o?.package?.name === "string") names.push(o.package.name);
    if (objects.length < SEARCH_PAGE) break;
    if (from + SEARCH_PAGE >= MAX_PACKAGES)
      gaps.push({ surface: "deps", what: `npm packages of ${user} past the first ${MAX_PACKAGES}`, why: "the scan caps the package list" });
  }
  stats.npmPackages = names.length;

  let unread = 0;
  await mapPool(names, opts.concurrency ?? 8, async (name) => {
    const res = await get(`${REGISTRY}/${name.startsWith("@") ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name)}`);
    if (!res.ok || !res.data?.time) {
      unread++;
      return;
    }
    const time = res.data.time as Record<string, string>;
    for (const [version, at] of Object.entries(time)) {
      if (version === "created" || version === "modified") continue;
      const t = Date.parse(at);
      if (Number.isNaN(t)) continue;
      const camp = campaigns.find((c) => t >= Date.parse(c.since) && (!c.until || t <= Date.parse(c.until) + 86_400_000));
      if (!camp) continue;
      const meta = res.data.versions?.[version] ?? {};
      const scripts = INSTALL_SCRIPTS.filter((s) => typeof meta.scripts?.[s] === "string");
      const publisher = typeof meta._npmUser?.name === "string" ? meta._npmUser.name : undefined;
      const named = camp.indicators.find((i) => packageHit(i, "npm", name, version));
      const by = publisher ? ` by ${publisher}${publisher.toLowerCase() === user.toLowerCase() ? " (your npm account)" : ""}` : "";
      const withScript = scripts.length ? ` with an install script (${scripts.map((s) => `${s}: ${String(meta.scripts[s]).slice(0, 120)}`).join("; ")})` : "";
      findings.push({
        surface: "deps",
        severity: named ? "compromised" : "suspicious",
        subject: `npm:${name}`,
        title: named
          ? `Your npm package ${name}@${version} was published${by} during the campaign, and the campaign names it`
          : `Your npm package ${name}@${version} was published${by} during the campaign window${withScript}: confirm you published it`,
        at,
        actor: publisher,
        scope: publisher && publisher.toLowerCase() === user.toLowerCase() ? "own" : publisher ? "other" : undefined,
        campaign: camp.id,
        source: named?.source,
        indicator: named ? { type: "package", value: named.value } : undefined,
        evidence: { kind: "url", ref: `https://www.npmjs.com/package/${name}/v/${version}`, excerpt: `published ${at}${withScript}` },
        key: `deps|npm-publish|${name}|${version}`,
      });
    }
  });
  stats.npmPublishesInWindow = findings.length;
  if (unread)
    gaps.push({
      surface: "deps",
      what: `${unread} of ${names.length} npm package(s) maintained by ${user}`,
      why: "the registry did not answer for them",
      fix: "re-run scan deps later",
    });
  return { findings, gaps, stats, user };
}
