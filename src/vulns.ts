// Vulnerabilities that matter, ranked. package-checker lists every locked
// package version with a known advisory: on a developer's machine that is a
// thousand lines, most of them in caches, plugins and vendored copies nobody
// fixes. This module enriches each CVE with exploitation data (CISA KEV:
// exploited in the wild; FIRST EPSS: probability of exploitation), groups the
// packages by the project that locks them (the git repository holding the
// lockfile), tells the user's own projects from the rest, and ranks:
//   P0 in KEV
//   P1 EPSS >= 0.1, or critical with a fixed version
//   P2 high with a fixed version
//   P3 the rest
// A known CVE is a patching backlog, never a compromise: every finding here is info.
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import type { Epss, KevEntry } from "./feeds.js";
import type { CheckerVuln } from "./scan/deps.js";
import type { Finding } from "./types.js";

type NewFinding = Omit<Finding, "id">;

export const TIERS = ["P0", "P1", "P2", "P3"] as const;
export type Tier = (typeof TIERS)[number];

/** P1 starts at this EPSS probability (10% chance of exploitation in the next 30 days). */
export const EPSS_P1 = 0.1;

/**
 * Where a lockfile lives:
 * - own: a project of the user (a git repository, or a folder of their own)
 * - worktree: a linked git worktree of one of their projects (fixed in the main checkout)
 * - tool: a cache, a plugin, an editor extension or a tool's own folder (~/.claude/plugins, ~/.vscode, ~/Library...)
 * - vendored: a copy inside node_modules, a virtualenv or site-packages
 */
export type ProjectKind = "own" | "worktree" | "tool" | "vendored";

/** How the project declares the package: a production or dev-only direct dependency, or pulled in by another. */
export type Relation = "direct" | "dev" | "transitive" | "unknown";

export const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, moderate: 2, medium: 2, low: 1 };

export interface RankedItem {
  tier: Tier;
  name: string;
  version: string;
  ecosystem: string;
  /** The lockfile, absolute. */
  file: string;
  severity: string;
  relation: Relation;
  /** The smallest version that closes every advisory with a fix, when there is one. */
  fix?: string;
  /** The fix leaves the current major (or 0.x minor) line: read the changelog. */
  majorBump?: boolean;
  cves: string[];
  ghsas: string[];
  /** Advisories with no fixed version yet. */
  unfixed: string[];
  kev: { cve: string; dateAdded: string; ransomware: boolean; dueDate?: string }[];
  /** The highest EPSS score among the CVEs, and which CVE has it. */
  epss?: { cve: string; score: number; percentile: number };
}

export interface RankedProject {
  root: string;
  name: string;
  kind: ProjectKind;
  /** worktree: the main checkout. */
  mainRepo?: string;
  lockfiles: string[];
  counts: Record<Tier, number>;
  items: RankedItem[];
}

export interface RankedVulns {
  generatedAt: string;
  feeds: { kev?: { fetchedAt?: string; catalogVersion?: string; stale?: boolean }; epss?: { fetchedAt?: string; stale?: boolean } };
  counts: Record<Tier, number>;
  packages: number;
  projects: RankedProject[];
  /** Machine software: KEV entries for what is installed here, pending OS updates. Filled by scan deps. */
  machine?: MachineItem[];
}

export interface MachineItem {
  tier: Tier;
  /** What is installed: "macOS", "Google Chrome". */
  software: string;
  installed?: string;
  cve?: string;
  title: string;
  dateAdded?: string;
  /** "update pending", "current", "unknown": whether this machine still has to update. */
  status?: string;
}

const zero = (): Record<Tier, number> => ({ P0: 0, P1: 0, P2: 0, P3: 0 });

// ---------------------------------------------------------------------------
// Versions

function splitVersion(v: string): { main: (number | string)[]; pre: (number | string)[] } {
  const clean = v.trim().replace(/^v/i, "").replace(/\+.*$/, "");
  const dash = clean.indexOf("-");
  const mainPart = dash >= 0 ? clean.slice(0, dash) : clean;
  const prePart = dash >= 0 ? clean.slice(dash + 1) : "";
  const seg = (s: string) =>
    s
      .split(/[.]/)
      .filter(Boolean)
      .map((x) => (/^\d+$/.test(x) ? Number(x) : x));
  // Python's "1.0rc1": the letters start a pre-release.
  const m = /^([\d.]+)((?:a|b|rc|alpha|beta|dev|pre)\d*.*)$/i.exec(mainPart);
  if (m && !prePart) return { main: seg(m[1] as string), pre: seg(m[2] as string) };
  return { main: seg(mainPart), pre: seg(prePart) };
}

function compareSeg(a: (number | string)[], b: (number | string)[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x === y) continue;
    if (typeof x === "number" && typeof y === "number") return x < y ? -1 : 1;
    if (typeof x === "number") return 1;
    if (typeof y === "number") return -1;
    return x < y ? -1 : 1;
  }
  return 0;
}

/** Compares two versions, semver-style, tolerant of Python, Go and calendar versions. */
export function compareVersions(a: string, b: string): number {
  const x = splitVersion(a);
  const y = splitVersion(b);
  const c = compareSeg(x.main, y.main);
  if (c) return c;
  if (!x.pre.length || !y.pre.length) return x.pre.length === y.pre.length ? 0 : x.pre.length ? -1 : 1;
  return compareSeg(x.pre, y.pre);
}

/** Moving from `from` to `to` changes the major (or, under 1.0.0, the minor) line. */
export function isBreaking(from: string, to: string): boolean {
  const a = splitVersion(from).main;
  const b = splitVersion(to).main;
  if (a[0] !== b[0]) return true;
  return a[0] === 0 && (a[1] ?? 0) !== (b[1] ?? 0);
}

/** The smallest version that closes every advisory that has a fix: the highest per-advisory fix above the current version. */
export function pickFix(current: string, fixes: string[]): string | undefined {
  const above = fixes.filter((f) => f && compareVersions(f, current) > 0);
  return above.sort(compareVersions).pop();
}

// ---------------------------------------------------------------------------
// Projects

/** Folders under the home directory that hold tools, caches and plugins, not the user's code. */
const TOOL_SEGMENTS = new Set([".tmp", "Caches", ".cache"]);
const VENDORED_SEGMENTS = new Set(["node_modules", "site-packages", "dist-packages", ".venv", "venv", ".tox", ".pnpm-store", "bower_components", "vendor"]);

export interface ProjectInfo {
  root: string;
  kind: ProjectKind;
  mainRepo?: string;
}

/** Classifies the folder that holds a lockfile. `home` marks where tool folders (~/.x, ~/Library) start. */
export function projectOf(lockfile: string, home: string | undefined, cache = new Map<string, ProjectInfo>()): ProjectInfo {
  const dir = dirname(resolve(lockfile));
  const hit = cache.get(dir);
  if (hit) return hit;
  const info = classify(dir, home);
  cache.set(dir, info);
  return info;
}

function gitRoot(dir: string, stop: string | undefined): string | undefined {
  let d = dir;
  for (let i = 0; i < 40; i++) {
    if (existsSync(join(d, ".git"))) return d;
    const up = dirname(d);
    if (up === d || d === stop) return undefined;
    d = up;
  }
  return undefined;
}

function classify(dir: string, home: string | undefined): ProjectInfo {
  const parts = dir.split(sep).filter(Boolean);
  const vi = parts.findIndex((p) => VENDORED_SEGMENTS.has(p));
  if (vi >= 0) return { root: dir, kind: "vendored" };
  const inHome = home && (dir === home || dir.startsWith(home.endsWith(sep) ? home : home + sep));
  const rel = inHome && home ? relative(home, dir).split(sep).filter(Boolean) : parts;
  // ~/.claude/plugins, ~/.vscode/extensions, ~/Library/Caches, ~/.config/<tool>: a tool's own copy.
  if ((inHome && (rel[0]?.startsWith(".") || rel[0] === "Library")) || rel.some((p) => TOOL_SEGMENTS.has(p))) return { root: dir, kind: "tool" };
  // An agent's worktree folder (.claude/worktrees/<name>, .worktrees/<name>), even once its .git is gone.
  const wt = /^(.*?)[/\\](?:\.claude[/\\]worktrees|\.worktrees)[/\\]([^/\\]+)/.exec(dir);
  if (wt) return { root: wt[0], kind: "worktree", mainRepo: wt[1] };
  const root = gitRoot(dir, home) ?? dir;
  const dotGit = join(root, ".git");
  try {
    if (existsSync(dotGit) && statSync(dotGit).isFile()) {
      // A linked worktree: ".git" is a file "gitdir: <main>/.git/worktrees/<name>".
      const gitdir = /^gitdir:\s*(.+)$/m.exec(readFileSync(dotGit, "utf8"))?.[1]?.trim();
      const main = gitdir ? /^(.*?)[/\\]\.git[/\\]worktrees[/\\]/.exec(gitdir)?.[1] : undefined;
      return { root, kind: "worktree", mainRepo: main };
    }
  } catch {
    // An unreadable .git file: an ordinary project.
  }
  return { root, kind: "own" };
}

// ---------------------------------------------------------------------------
// Direct and transitive dependencies, from the manifest next to the lockfile

const normPy = (n: string) => n.toLowerCase().replace(/[-_.]+/g, "-");

function readText(p: string): string | undefined {
  try {
    return existsSync(p) && statSync(p).size < 16 * 1024 * 1024 ? readFileSync(p, "utf8") : undefined;
  } catch {
    return undefined;
  }
}

/** name -> "direct" (production) or "dev", for the packages the project declares itself. */
export type Declared = Map<string, "direct" | "dev">;

function add(m: Declared, name: string, rel: "direct" | "dev") {
  if (m.get(name) !== "direct") m.set(name, rel);
}

function fromPackageJson(m: Declared, j: any) {
  for (const k of ["dependencies", "optionalDependencies", "peerDependencies"]) for (const n of Object.keys(j?.[k] ?? {})) add(m, n, "direct");
  for (const n of Object.keys(j?.devDependencies ?? {})) add(m, n, "dev");
}

/** pnpm-lock.yaml importers: every workspace package's own dependencies. */
function pnpmImporters(m: Declared, text: string) {
  const start = text.search(/^importers:\s*$/m);
  if (start < 0) return;
  let section: "direct" | "dev" | undefined;
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (/^\S/.test(line)) break;
    const sec = /^ {4}(dependencies|devDependencies|optionalDependencies):\s*$/.exec(line);
    if (sec) {
      section = sec[1] === "devDependencies" ? "dev" : "direct";
      continue;
    }
    if (/^ {0,4}\S/.test(line)) {
      section = undefined;
      continue;
    }
    const dep = /^ {6}['"]?((?:@[^/\s'"]+\/)?[^:\s'"]+)['"]?:/.exec(line);
    if (dep && section) add(m, dep[1] as string, section);
  }
}

/** pyproject.toml, read line by line: [project] dependencies, optional groups, poetry tables, uv dev groups. */
function fromPyproject(m: Declared, text: string) {
  let table = "";
  let array: "direct" | "dev" | undefined;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*$/, "");
    const t = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (t) {
      table = (t[1] as string).trim();
      array = undefined;
      continue;
    }
    if (array) {
      for (const q of line.matchAll(/["']([A-Za-z0-9][A-Za-z0-9._-]*)/g)) add(m, normPy(q[1] as string), array);
      if (line.includes("]")) array = undefined;
      continue;
    }
    const key = /^\s*([A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(line);
    if (!key) continue;
    const name = key[1] as string;
    const value = key[2] as string;
    const devTable = table === "dependency-groups" || /^tool\.poetry\.(dev-dependencies|group\.[^.]+\.dependencies)$/.test(table);
    let rel: "direct" | "dev" | undefined;
    if ((table === "project" && name === "dependencies") || table === "project.optional-dependencies") rel = "direct";
    else if (table === "dependency-groups" || (table === "tool.uv" && name === "dev-dependencies")) rel = "dev";
    if (rel && value.trim().startsWith("[")) {
      for (const q of value.matchAll(/["']([A-Za-z0-9][A-Za-z0-9._-]*)/g)) add(m, normPy(q[1] as string), rel);
      if (!value.includes("]")) array = rel;
      continue;
    }
    if (table === "tool.poetry.dependencies" && name !== "python") add(m, normPy(name), "direct");
    else if (devTable && table.startsWith("tool.poetry")) add(m, normPy(name), "dev");
  }
}

function fromTomlTables(m: Declared, text: string, tables: Record<string, "direct" | "dev">, norm = (n: string) => n) {
  let rel: "direct" | "dev" | undefined;
  for (const line of text.split("\n")) {
    const t = /^\s*\[([^\]]+)\]\s*$/.exec(line);
    if (t) {
      rel = tables[(t[1] as string).trim()];
      continue;
    }
    const key = rel && /^\s*["']?([A-Za-z0-9_.-]+)["']?\s*=/.exec(line);
    if (key && rel) add(m, norm(key[1] as string), rel);
  }
}

/** The packages the project around this lockfile declares, and whether each is dev-only. */
export function declaredDeps(lockfile: string): Declared {
  const m: Declared = new Map();
  const dir = dirname(lockfile);
  const name = basename(lockfile);
  const json = (p: string) => {
    const t = readText(p);
    try {
      return t ? JSON.parse(t) : undefined;
    } catch {
      return undefined;
    }
  };
  if (["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock"].includes(name)) {
    fromPackageJson(m, json(join(dir, "package.json")));
    if (name === "pnpm-lock.yaml") pnpmImporters(m, readText(lockfile) ?? "");
    if (name === "package-lock.json" || name === "npm-shrinkwrap.json") {
      // npm workspaces: each workspace package is an entry outside node_modules.
      const lock = json(lockfile);
      for (const [k, v] of Object.entries<any>(lock?.packages ?? {})) if (!k.includes("node_modules")) fromPackageJson(m, v);
    }
  } else if (["uv.lock", "poetry.lock", "pdm.lock"].includes(name)) {
    fromPyproject(m, readText(join(dir, "pyproject.toml")) ?? "");
  } else if (name === "Pipfile.lock") {
    fromTomlTables(m, readText(join(dir, "Pipfile")) ?? "", { packages: "direct", "dev-packages": "dev" }, normPy);
  } else if (/^requirements.*\.txt$/.test(name)) {
    const rel = /dev|test|lint/i.test(name) ? "dev" : "direct";
    for (const x of (readText(lockfile) ?? "").matchAll(/^[ \t]*([A-Za-z0-9][A-Za-z0-9_.-]*)/gm)) add(m, normPy(x[1] as string), rel);
  } else if (name === "Cargo.lock") {
    fromTomlTables(m, readText(join(dir, "Cargo.toml")) ?? "", {
      dependencies: "direct",
      "workspace.dependencies": "direct",
      "dev-dependencies": "dev",
      "build-dependencies": "dev",
    });
  } else if (name === "go.sum" || name === "go.mod") {
    for (const x of (readText(join(dir, "go.mod")) ?? "").matchAll(/^\s*(?:require\s+)?([a-z0-9][^\s]*\.[^\s]+)\s+v\S+(\s*\/\/\s*indirect)?/gm))
      if (!x[2]) add(m, x[1] as string, "direct");
  } else if (name === "composer.lock") {
    const j = json(join(dir, "composer.json"));
    for (const n of Object.keys(j?.require ?? {})) add(m, n, "direct");
    for (const n of Object.keys(j?.["require-dev"] ?? {})) add(m, n, "dev");
  } else if (name === "Gemfile.lock") {
    let dev = false;
    for (const line of (readText(join(dir, "Gemfile")) ?? "").split("\n")) {
      if (/^\s*group\b.*\bdo\b/.test(line)) dev = !/:production|:default/.test(line);
      else if (/^\s*end\b/.test(line)) dev = false;
      const g = /^\s*gem\s+["']([^"']+)["']/.exec(line);
      if (g) add(m, g[1] as string, dev ? "dev" : "direct");
    }
  }
  return m;
}

/** Ecosystems whose package names compare case- and separator-insensitively. */
const PY = new Set(["pypi", "pip", "python"]);

function relationOf(declared: Declared | undefined, ecosystem: string, name: string): Relation {
  if (!declared) return "unknown";
  if (!declared.size) return "unknown";
  return declared.get(PY.has(ecosystem.toLowerCase()) ? normPy(name) : name) ?? "transitive";
}

// ---------------------------------------------------------------------------
// Ranking

export interface RankInput {
  kev?: Map<string, KevEntry>;
  epss?: Map<string, Epss>;
  home?: string;
  now?: Date;
  feeds?: RankedVulns["feeds"];
}

/** Every CVE the advisories name, for the EPSS query. */
export function cvesOf(vulns: CheckerVuln[]): string[] {
  const out = new Set<string>();
  for (const v of vulns) for (const a of v.advisories) if (a.cve && /^CVE-/i.test(a.cve)) out.add(a.cve.toUpperCase());
  return [...out];
}

function tierOf(i: Omit<RankedItem, "tier">): Tier {
  if (i.kev.length) return "P0";
  if ((i.epss?.score ?? 0) >= EPSS_P1 || (i.severity === "critical" && i.fix)) return "P1";
  if (i.severity === "high" && i.fix) return "P2";
  return "P3";
}

/** Sorts the most urgent first: tier, KEV, EPSS, severity, then a fix being available. */
export function byUrgency(a: RankedItem, b: RankedItem): number {
  return (
    TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) ||
    b.kev.length - a.kev.length ||
    (b.epss?.score ?? 0) - (a.epss?.score ?? 0) ||
    (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
    Number(!!b.fix) - Number(!!a.fix) ||
    a.name.localeCompare(b.name)
  );
}

const KIND_ORDER: Record<ProjectKind, number> = { own: 0, worktree: 1, tool: 2, vendored: 3 };

export function rankVulnerabilities(vulns: CheckerVuln[], input: RankInput = {}): RankedVulns {
  const projects = new Map<string, RankedProject>();
  const cache = new Map<string, ProjectInfo>();
  const declared = new Map<string, Declared>();
  const total = zero();
  for (const v of vulns) {
    const advisories = v.advisories ?? [];
    const cves = [...new Set(advisories.map((a) => a.cve?.toUpperCase()).filter((c): c is string => !!c && /^CVE-/.test(c)))];
    const ghsas = [...new Set(advisories.map((a) => a.ghsa).filter((g): g is string => !!g))];
    const kev = cves.flatMap((c) => {
      const k = input.kev?.get(c);
      return k ? [{ cve: c, dateAdded: k.dateAdded, ransomware: k.knownRansomwareCampaignUse === "Known", dueDate: k.dueDate }] : [];
    });
    let epss: RankedItem["epss"];
    for (const c of cves) {
      const e = input.epss?.get(c);
      if (e && (!epss || e.epss > epss.score)) epss = { cve: c, score: e.epss, percentile: e.percentile };
    }
    const fix = pickFix(
      v.version,
      advisories.map((a) => a.fix ?? ""),
    );
    const unfixed = advisories.filter((a) => !a.fix).map((a) => a.cve || a.ghsa || a.id || "?");
    const severity = (
      v.severity ||
      advisories.map((a) => a.severity ?? "").sort((a, b) => (SEVERITY_RANK[b] ?? 0) - (SEVERITY_RANK[a] ?? 0))[0] ||
      "unknown"
    ).toLowerCase();
    const info = projectOf(v.file, input.home, cache);
    if (!declared.has(v.file)) declared.set(v.file, info.kind === "own" || info.kind === "worktree" ? declaredDeps(v.file) : new Map());
    const base = {
      name: v.name,
      version: v.version,
      ecosystem: v.ecosystem,
      file: v.file,
      severity,
      relation: relationOf(declared.get(v.file), v.ecosystem, v.name),
      fix,
      majorBump: fix ? isBreaking(v.version, fix) : undefined,
      cves,
      ghsas,
      unfixed,
      kev,
      epss,
    };
    const item: RankedItem = { tier: tierOf(base), ...base };
    let p = projects.get(info.root);
    if (!p) {
      p = { root: info.root, name: basename(info.root), kind: info.kind, mainRepo: info.mainRepo, lockfiles: [], counts: zero(), items: [] };
      projects.set(info.root, p);
    }
    if (!p.lockfiles.includes(v.file)) p.lockfiles.push(v.file);
    p.items.push(item);
    p.counts[item.tier]++;
    total[item.tier]++;
  }
  const list = [...projects.values()];
  for (const p of list) p.items.sort(byUrgency);
  const worstTier = (p: RankedProject) => TIERS.findIndex((t) => p.counts[t] > 0);
  list.sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || worstTier(a) - worstTier(b) || b.items.length - a.items.length || a.root.localeCompare(b.root),
  );
  return { generatedAt: (input.now ?? new Date()).toISOString(), feeds: input.feeds ?? {}, counts: total, packages: vulns.length, projects: list };
}

// ---------------------------------------------------------------------------
// Words

const pct = (x: number) => `${(x * 100).toFixed(x < 0.01 ? 2 : 1)}%`;

/** "handlebars 4.7.9 -> 4.7.10 (CVE-2026-1, critical, KEV 2026-11-10, EPSS 61%)" */
export function itemLabel(i: RankedItem): string {
  const why = [
    i.kev[0]?.cve ?? i.epss?.cve ?? i.cves[0] ?? i.ghsas[0],
    i.severity,
    i.kev.length ? `in CISA KEV since ${i.kev[0]?.dateAdded}${i.kev.some((k) => k.ransomware) ? ", used by ransomware" : ""}` : undefined,
    i.epss && i.epss.score >= 0.01 ? `EPSS ${pct(i.epss.score)}` : undefined,
    i.relation === "dev" ? "dev-only" : i.relation === "transitive" ? "transitive" : undefined,
  ].filter(Boolean);
  return `${i.name} ${i.version} -> ${i.fix ?? "no fix yet"}${i.majorBump ? " (major upgrade)" : ""} (${why.join(", ")})`;
}

export const KIND_LABEL: Record<ProjectKind, string> = {
  own: "your project",
  worktree: "a git worktree",
  tool: "a cache, plugin or tool folder",
  vendored: "a vendored copy",
};

const tierCounts = (c: Record<Tier, number>) =>
  TIERS.filter((t) => c[t])
    .map((t) => `${c[t]} ${t}`)
    .join(", ");

/**
 * The findings that replace the single backlog line: one per own project with
 * P0 or P1 items, and one summary. All info: a CVE is not a compromise.
 */
export function vulnFindings(r: RankedVulns, runDir?: string): NewFinding[] {
  const out: NewFinding[] = [];
  const own = r.projects.filter((p) => p.kind === "own");
  for (const p of own) {
    const urgent = p.items.filter((i) => i.tier === "P0" || i.tier === "P1");
    if (!urgent.length) continue;
    const kev = urgent.filter((i) => i.kev.length).length;
    out.push({
      surface: "deps",
      severity: "info",
      subject: p.root,
      title: `${p.name}: ${tierCounts({ ...zero(), P0: p.counts.P0, P1: p.counts.P1 })} vulnerable package(s) to upgrade, ${kev ? `${kev} in CISA KEV (exploited in the wild)` : "none in CISA KEV"}: ${urgent
        .slice(0, 3)
        .map(itemLabel)
        .join("; ")}${urgent.length > 3 ? `; and ${urgent.length - 3} more` : ""}`,
      evidence: {
        kind: "command",
        ref: `ultraguard fixes --out ${runDir ?? "<run>"} --project ${p.root}`,
        excerpt: `${p.lockfiles.map((f) => relative(p.root, f) || basename(f)).join(", ")}; vulnerabilities.json`,
      },
      key: `deps|vulns|${p.root}`,
    });
  }
  if (r.packages) {
    const others = r.projects.filter((p) => p.kind !== "own");
    const otherItems = others.reduce((n, p) => n + p.items.length, 0);
    out.push({
      surface: "deps",
      severity: "info",
      subject: "vulnerable dependencies",
      title: `${r.packages} locked package versions have known vulnerabilities (${tierCounts(r.counts)}) in ${own.length} of your projects${others.length ? ` and ${others.length} worktree, cache, plugin or vendored folder(s) (${otherItems} of them)` : ""}: a patching backlog, not a compromise (vulnerabilities.json, ultraguard fixes)`,
      evidence: { kind: "file", ref: "vulnerabilities.json" },
      key: "deps|vulnerable-backlog",
    });
  }
  return out;
}

const tick = (s: string) => `\`${s.replace(/`/g, "'")}\``;

/** The REPORT.md section: machine items, then each own project P0 -> P3 (top 10), then the rest collapsed. */
export function renderVulnSection(r: RankedVulns, home?: string, top = 10): string[] {
  const out: string[] = [];
  const short = (p: string) => (home && p.startsWith(home + sep) ? `~/${relative(home, p)}` : p);
  const machine = r.machine ?? [];
  if (!r.packages && !machine.length) return out;
  out.push(
    "## Vulnerabilities to fix",
    "",
    `A known CVE is a patching backlog, not a compromise. Ranked P0 (in CISA KEV: exploited in the wild), P1 (EPSS >= ${EPSS_P1 * 100}% or critical with a fix), P2 (high with a fix), P3 (the rest). The plan with the exact commands: \`ultraguard fixes --out <run>\` (FIXES.md).`,
    "",
  );
  const kev = r.feeds.kev;
  if (!kev?.fetchedAt) out.push("CISA KEV could not be loaded: no package is ranked P0 for being exploited, which does not mean none is.", "");
  if (machine.length) {
    out.push("### This machine", "");
    for (const m of machine.sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier)))
      out.push(`- **${m.tier}** ${m.title}${m.installed ? ` (installed: ${m.software} ${m.installed})` : ""}${m.status ? `: ${m.status}` : ""}`);
    out.push("");
  }
  for (const p of r.projects.filter((x) => x.kind === "own")) {
    out.push(`### ${p.name} (${tick(short(p.root))}): ${tierCounts(p.counts)}`, "");
    for (const i of p.items.slice(0, top)) {
      const lock = relative(p.root, i.file) || basename(i.file);
      out.push(
        `- **${i.tier}** ${tick(`${i.name}@${i.version}`)} -> ${i.fix ? tick(i.fix) : "no fix yet"}${i.majorBump ? " (major upgrade)" : ""}: ${i.severity}${i.relation !== "unknown" ? `, ${i.relation === "dev" ? "dev-only (lower risk)" : i.relation}` : ""}${i.kev.length ? `, CISA KEV since ${i.kev[0]?.dateAdded}` : ""}${i.epss ? `, EPSS ${pct(i.epss.score)}` : ""} (${[...i.cves, ...i.ghsas].slice(0, 3).join(", ") || "no id"}; ${lock})`,
      );
    }
    const rest = p.items.slice(top);
    if (rest.length) {
      const c = zero();
      for (const i of rest) c[i.tier]++;
      out.push(`- and ${rest.length} more (${tierCounts(c)}): vulnerabilities.json`);
    }
    out.push("");
  }
  const others = r.projects.filter((x) => x.kind !== "own");
  if (others.length) {
    out.push("### Worktrees, caches, plugins and vendored copies", "", "Not fixed here: update the tool, the plugin or the main checkout instead.", "");
    for (const p of others)
      out.push(`- ${tick(short(p.root))} (${KIND_LABEL[p.kind]}${p.mainRepo ? ` of ${tick(short(p.mainRepo))}` : ""}): ${tierCounts(p.counts)}`);
    out.push("");
  }
  return out;
}
