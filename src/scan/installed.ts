// Installed packages: what a project or a global install actually put on disk,
// for the campaign's package indicators. A lockfile says what a project would
// install; `pip install litellm` in a venv, a `uvx` tool or an `npm -g` CLI has
// no lockfile at all. Read-only, and from names only: the hidden lockfile npm
// and pnpm write into node_modules, the package.json of each global module, and
// the `<name>-<version>.dist-info` folders of Python environments.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { type Locked, parseLockfile } from "./lockfiles.js";

export interface Installed extends Locked {
  /** The folder or file that shows the install. */
  where: string;
}

const ls = (dir: string): string[] => {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
};

const readSmall = (p: string, max = 64 * 1024 * 1024): string | undefined => {
  try {
    if (statSync(p).size > max) return undefined;
    return readFileSync(p, "utf8");
  } catch {
    return undefined;
  }
};

/** Every `<dir>/lib/python*\/site-packages` under one environment folder. */
function sitePackages(env: string): string[] {
  return ls(join(env, "lib"))
    .filter((n) => n.startsWith("python"))
    .map((n) => join(env, "lib", n, "site-packages"))
    .filter((d) => existsSync(d));
}

/** `requests-2.31.0.dist-info` (or `.egg-info`) folders: the packages a Python environment holds. */
function pythonPackages(site: string): Installed[] {
  const out: Installed[] = [];
  for (const n of ls(site)) {
    const m = /^(.+)-([^-]+)\.(?:dist|egg)-info$/.exec(n);
    if (m) out.push({ ecosystem: "pypi", name: m[1] as string, version: m[2] as string, where: join(site, n) });
  }
  return out;
}

/** A global node_modules: each `name/package.json` and `@scope/name/package.json`. */
function nodeModules(dir: string): Installed[] {
  const out: Installed[] = [];
  const one = (p: string) => {
    const text = readSmall(join(p, "package.json"), 1024 * 1024);
    if (!text) return;
    try {
      const j = JSON.parse(text);
      if (typeof j.name === "string" && typeof j.version === "string") out.push({ ecosystem: "npm", name: j.name, version: j.version, where: p });
    } catch {
      // A broken package.json is not an install we can name.
    }
  };
  for (const n of ls(dir)) {
    if (n.startsWith(".")) continue;
    if (n.startsWith("@")) for (const s of ls(join(dir, n))) one(join(dir, n, s));
    else one(join(dir, n));
  }
  return out;
}

/** The global install folders under `home`, plus the system ones (Homebrew, /usr/local). */
export function globalInstallDirs(
  home: string,
  system = ["/opt/homebrew/lib/node_modules", "/usr/local/lib/node_modules"],
): { node: string[]; python: string[] } {
  const nvm = join(home, ".nvm/versions/node");
  const node = [...system, ...ls(nvm).map((v) => join(nvm, v, "lib/node_modules")), join(home, ".bun/install/global/node_modules")];
  const python: string[] = [];
  for (const base of [join(home, ".local/share/uv/tools"), join(home, ".local/pipx/venvs")])
    for (const tool of ls(base)) python.push(...sitePackages(join(base, tool)));
  return { node: node.filter((d) => existsSync(d)), python };
}

/**
 * The packages installed in each project folder (its node_modules and venv) and
 * in the global folders given. `read` lists every place that was looked at.
 */
export function installedPackages(
  projects: Iterable<string>,
  globals: { node: string[]; python: string[] } = { node: [], python: [] },
): {
  packages: Installed[];
  read: string[];
} {
  const packages: Installed[] = [];
  const read: string[] = [];
  for (const d of new Set(projects)) {
    for (const [file, as] of [
      [join(d, "node_modules/.package-lock.json"), "package-lock.json"],
      [join(d, "node_modules/.pnpm/lock.yaml"), "pnpm-lock.yaml"],
    ] as const) {
      const text = readSmall(file);
      if (text === undefined) continue;
      read.push(file);
      try {
        for (const l of parseLockfile(as, text)) packages.push({ ...l, where: join(d, "node_modules") });
      } catch {
        // An unparsable hidden lockfile: nothing to name.
      }
    }
    for (const venv of [".venv", "venv"])
      for (const site of sitePackages(join(d, venv))) {
        read.push(site);
        packages.push(...pythonPackages(site));
      }
  }
  for (const dir of globals.node) {
    read.push(dir);
    packages.push(...nodeModules(dir));
  }
  for (const site of globals.python) {
    read.push(site);
    packages.push(...pythonPackages(site));
  }
  return { packages, read };
}
