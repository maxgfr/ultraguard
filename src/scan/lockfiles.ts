// Lockfile readers: (ecosystem, name, version) for every locked package.
// Deliberately small and regex-based: a lockfile is machine-written, and a
// reader that throws on a format quirk would turn one odd file into a silent
// gap in the whole scan. A file that cannot be read is reported, not fatal.
import { basename } from "node:path";

export interface Locked {
  ecosystem: string;
  name: string;
  version: string;
}

export const LOCKFILES: Record<string, string> = {
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "pnpm-lock.yaml": "npm",
  "yarn.lock": "npm",
  "bun.lock": "npm",
  "poetry.lock": "pypi",
  "uv.lock": "pypi",
  "Pipfile.lock": "pypi",
  "Cargo.lock": "crates.io",
  "go.sum": "go",
  "composer.lock": "packagist",
  "Gemfile.lock": "rubygems",
};

/**
 * Lockfiles package-checker reads that ultraguard has no parser for: they are
 * handed to its advisory pass, never matched against campaign packages here.
 */
export const ADVISORY_ONLY = new Set([
  "bun.lockb",
  "deno.lock",
  "go.mod",
  "pdm.lock",
  "gradle.lockfile",
  "pom.xml",
  "packages.lock.json",
  "pubspec.lock",
  "mix.lock",
  "Package.resolved",
]);

/** Manifests that name a project's dependencies. */
export const MANIFESTS = new Set(["package.json", "pyproject.toml", "Pipfile", "Gemfile", "setup.py", "setup.cfg"]);

export function advisoryOnlyKind(path: string): boolean {
  return ADVISORY_ONLY.has(basename(path));
}

export function lockfileKind(path: string): string | undefined {
  const name = basename(path);
  if (LOCKFILES[name]) return name;
  if (/^requirements.*\.txt$/.test(name)) return "requirements.txt";
  return undefined;
}

export function parseLockfile(path: string, text: string): Locked[] {
  const kind = lockfileKind(path);
  switch (kind) {
    case "package-lock.json":
    case "npm-shrinkwrap.json":
      return npmLock(text);
    case "pnpm-lock.yaml":
      return pnpmLock(text);
    case "yarn.lock":
      return yarnLock(text);
    case "bun.lock":
      return bunLock(text);
    case "poetry.lock":
    case "uv.lock":
      return tomlPackages(text, "pypi");
    case "Cargo.lock":
      return tomlPackages(text, "crates.io");
    case "Pipfile.lock":
      return pipfileLock(text);
    case "requirements.txt":
      return requirements(text);
    case "go.sum":
      return goSum(text);
    case "composer.lock":
      return composerLock(text);
    case "Gemfile.lock":
      return gemfileLock(text);
    default:
      return [];
  }
}

function uniq(list: Locked[]): Locked[] {
  const seen = new Set<string>();
  return list.filter((l) => {
    const k = `${l.ecosystem}|${l.name}|${l.version}`;
    if (seen.has(k) || !l.name || !l.version) return false;
    seen.add(k);
    return true;
  });
}

function npmLock(text: string): Locked[] {
  const j = JSON.parse(text);
  const out: Locked[] = [];
  for (const [key, v] of Object.entries<any>(j.packages ?? {})) {
    if (!key) continue;
    const name = v.name ?? key.split("node_modules/").pop();
    if (v.version && !v.link) out.push({ ecosystem: "npm", name, version: v.version });
  }
  const walkDeps = (deps: Record<string, any> | undefined) => {
    for (const [name, v] of Object.entries<any>(deps ?? {})) {
      // An alias (lockfileVersion 1): {"my-alias": {"version": "npm:real-pkg@1.2.3"}} installs real-pkg.
      const alias = typeof v.version === "string" ? /^npm:((?:@[^/@]+\/)?[^@]+)@([^@]+)$/.exec(v.version) : null;
      if (alias) out.push({ ecosystem: "npm", name: alias[1] as string, version: alias[2] as string });
      else if (v.version) out.push({ ecosystem: "npm", name, version: v.version });
      walkDeps(v.dependencies);
    }
  };
  walkDeps(j.dependencies);
  return uniq(out);
}

function pnpmLock(text: string): Locked[] {
  const out: Locked[] = [];
  // v6+: "  /name@1.2.3:" or "  name@1.2.3:" or "  '@scope/name@1.2.3(peer)':"; v5: "  /name/1.2.3:"
  // pnpm v5 appends peer resolutions with "_": 1.2.3_react@17.0.2 is version 1.2.3.
  for (const m of text.matchAll(/^ {2}['"]?\/?((?:@[^/@\s]+\/)?[^/@\s:'"(]+)[@/](\d[^:'"(\s]*)/gm))
    out.push({ ecosystem: "npm", name: m[1] as string, version: (m[2] as string).replace(/_.*$/, "") });
  return uniq(out);
}

function yarnLock(text: string): Locked[] {
  const out: Locked[] = [];
  for (const block of text.split(/\n(?=\S)/)) {
    const header = /^"?((?:@[^/@\s]+\/)?[^@\s",]+)@/.exec(block);
    const version = /^\s+version:?\s+"?([^"\s]+)"?/m.exec(block);
    if (!header || !version) continue;
    out.push({ ecosystem: "npm", name: header[1] as string, version: version[1] as string });
    // An alias installs another package: "my-alias@npm:real-pkg@^1.2.3" (v1), or berry's resolution line.
    const real =
      /^"?(?:@[^/@\s]+\/)?[^@\s",]+@npm:((?:@[^/@\s]+\/)?[^@\s",]+)@/.exec(block)?.[1] ?? /^\s+resolution:\s+"?((?:@[^/@\s]+\/)?[^@\s"]+)@/m.exec(block)?.[1];
    if (real && real !== header[1]) out.push({ ecosystem: "npm", name: real, version: version[1] as string });
  }
  return uniq(out);
}

function bunLock(text: string): Locked[] {
  const out: Locked[] = [];
  for (const m of text.matchAll(/\[\s*"((?:@[^/@"]+\/)?[^@"]+)@(\d[^"]*)"/g)) out.push({ ecosystem: "npm", name: m[1] as string, version: m[2] as string });
  return uniq(out);
}

function tomlPackages(text: string, ecosystem: string): Locked[] {
  const out: Locked[] = [];
  for (const block of text.split(/^\[\[package\]\]\s*$/m).slice(1)) {
    const name = /^name\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    const version = /^version\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    if (name && version) out.push({ ecosystem, name, version });
  }
  return uniq(out);
}

function pipfileLock(text: string): Locked[] {
  const j = JSON.parse(text);
  const out: Locked[] = [];
  for (const section of ["default", "develop"])
    for (const [name, v] of Object.entries<any>(j[section] ?? {}))
      if (typeof v.version === "string") out.push({ ecosystem: "pypi", name, version: v.version.replace(/^==/, "") });
  return uniq(out);
}

function requirements(text: string): Locked[] {
  const out: Locked[] = [];
  // "name==1.2.3" is pinned. "name", "name>=0.4" or "name ; marker" is not: version "*", which only an
  // every-version indicator (a typosquat) matches. Options (-r, -e), URLs and VCS lines are skipped.
  for (const m of text.matchAll(/^[ \t]*([A-Za-z0-9][A-Za-z0-9_.-]*)(?:\[[^\]]*\])?[ \t]*(?:==[ \t]*([^\s;#]+)|(?=[<>=!~;#]|[ \t]*$))/gm))
    out.push({ ecosystem: "pypi", name: m[1] as string, version: (m[2] as string | undefined) ?? "*" });
  return uniq(out);
}

function goSum(text: string): Locked[] {
  const out: Locked[] = [];
  // Only module zip lines: a "/go.mod"-only line is a version the build graph considered, not one it uses.
  for (const m of text.matchAll(/^(\S+)\s+(v\S+)\s+h1:/gm))
    if (!(m[2] as string).endsWith("/go.mod")) out.push({ ecosystem: "go", name: m[1] as string, version: m[2] as string });
  return uniq(out);
}

function composerLock(text: string): Locked[] {
  const j = JSON.parse(text);
  const out: Locked[] = [];
  for (const p of [...(j.packages ?? []), ...(j["packages-dev"] ?? [])])
    if (p.name && p.version) out.push({ ecosystem: "packagist", name: p.name, version: String(p.version).replace(/^v/, "") });
  return uniq(out);
}

function gemfileLock(text: string): Locked[] {
  const out: Locked[] = [];
  // Native gems carry their platform: "nokogiri (1.16.0-arm64-darwin)" is version 1.16.0.
  for (const m of text.matchAll(/^ {4}([A-Za-z0-9_.-]+) \(([^)]+)\)$/gm))
    out.push({
      ecosystem: "rubygems",
      name: m[1] as string,
      version: (m[2] as string).replace(/-(x86|x64|arm|aarch|universal|java|mingw|mswin|i386|i686|ppc|s390)[\w-]*$/i, ""),
    });
  return uniq(out);
}

/** The OSV ecosystem name for one of ours. */
export function osvEcosystem(e: string): string | undefined {
  return { npm: "npm", pypi: "PyPI", "crates.io": "crates.io", go: "Go", packagist: "Packagist", rubygems: "RubyGems" }[e];
}
