// Community detection rules, kept in ultraguard's own state folder: YARA-Forge
// (YARAHQ/yara-forge), a curated, quality-tested merge of public YARA rule
// sets, released weekly. `rules update` fetches a set, checks it, and compiles
// it once with yarac so every scan loads it in a fraction of a second.
// Nothing outside the state folder is written.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { httpGet, httpJson, writeFileAtomic } from "./engine.js";
import type { Runner } from "./runner.js";

export const RULE_SETS = ["core", "extended", "full"] as const;
export type RuleSet = (typeof RULE_SETS)[number];

export interface RulesMeta {
  name: "yara-forge";
  set: RuleSet;
  tag: string;
  published?: string;
  url: string;
  sha256: string;
  rules: number;
  /** The rule text; always present. */
  source: string;
  /** The yarac-compiled file, when yarac is installed and compiled it. */
  compiled?: string;
  fetchedAt: string;
}

export interface RulesDeps {
  latest: () => Promise<{ tag: string; published?: string; assets: { name: string; url: string }[] }>;
  download: (url: string) => Promise<Buffer>;
}

const RELEASES = "https://api.github.com/repos/YARAHQ/yara-forge/releases/latest";

export const defaultRulesDeps: RulesDeps = {
  latest: async () => {
    const res = await httpJson("GET", RELEASES, undefined, { timeoutMs: 30_000, accept: "application/vnd.github+json" });
    if (!res.ok) throw new Error(`GitHub releases API: ${res.error ?? `HTTP ${res.status}`}`);
    const r = res.data;
    return {
      tag: String(r?.tag_name ?? ""),
      published: r?.published_at,
      assets: ((r?.assets ?? []) as any[]).map((a) => ({ name: String(a.name), url: String(a.browser_download_url) })),
    };
  },
  download: async (url) => {
    const res = await httpGet(url, { binary: true, maxBytes: 64 * 1024 * 1024, timeoutMs: 120_000, retries: 2 });
    if (!res.ok || !res.bytes) throw new Error(`download failed: HTTP ${res.status}${res.error ? ` (${res.error})` : ""}`);
    return res.bytes;
  },
};

export function rulesDir(state: string): string {
  return join(state, "rules");
}

export function installedRules(state: string): RulesMeta | undefined {
  const p = join(rulesDir(state), "yara-forge.json");
  if (!existsSync(p)) return undefined;
  try {
    const meta = JSON.parse(readFileSync(p, "utf8")) as RulesMeta;
    return existsSync(meta.source) ? meta : undefined;
  } catch {
    return undefined;
  }
}

function findYar(dir: string): string | undefined {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      const inner = findYar(p);
      if (inner) return inner;
    } else if (/\.yara?$/i.test(name)) return p;
  }
  return undefined;
}

export async function updateRules(state: string, set: RuleSet, runner: Runner, deps: RulesDeps = defaultRulesDeps, now = new Date()): Promise<RulesMeta> {
  const rel = await deps.latest();
  const asset = rel.assets.find((a) => a.name === `yara-forge-rules-${set}.zip`);
  if (!asset) throw new Error(`YARA-Forge release ${rel.tag || "?"} has no ${set} rule set`);
  const bytes = await deps.download(asset.url);
  const dir = rulesDir(state);
  mkdirSync(dir, { recursive: true });
  const work = join(dir, `.unpack-${process.pid}`);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  try {
    const zip = join(work, "rules.zip");
    writeFileAtomic(zip, bytes);
    const unzip = await runner("unzip", ["-o", "-q", zip, "-d", work], { timeoutMs: 120_000 });
    if (!unzip.ok) throw new Error(unzip.missing ? "unzip is not installed" : `unzip failed: ${unzip.stderr.trim().split("\n")[0]}`);
    const yar = findYar(work);
    if (!yar) throw new Error("the archive holds no .yar file");
    const text = readFileSync(yar, "utf8");
    const rules = (text.match(/^\s*(private\s+|global\s+)*rule\s+\w+/gm) ?? []).length;
    if (rules === 0) throw new Error("the rule file holds no rule");
    const source = join(dir, `yara-forge-${set}.yar`);
    renameSync(yar, source);
    let compiled: string | undefined;
    const target = join(dir, `yara-forge-${set}.yarc`);
    const yc = await runner("yarac", ["--no-warnings", source, target], { timeoutMs: 300_000 });
    if (yc.ok && existsSync(target)) compiled = target;
    else rmSync(target, { force: true });
    const meta: RulesMeta = {
      name: "yara-forge",
      set,
      tag: rel.tag,
      published: rel.published,
      url: `https://github.com/YARAHQ/yara-forge/releases/tag/${rel.tag}`,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      rules,
      source,
      compiled,
      fetchedAt: now.toISOString(),
    };
    writeFileAtomic(join(dir, "yara-forge.json"), `${JSON.stringify(meta, null, 2)}\n`);
    return meta;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** Days since the installed rules were released (or fetched, when the release date is unknown). */
export function rulesAgeDays(meta: RulesMeta, now = new Date()): number {
  const t = Date.parse(meta.published ?? meta.fetchedAt);
  return Number.isNaN(t) ? 0 : Math.floor((now.getTime() - t) / 86_400_000);
}
