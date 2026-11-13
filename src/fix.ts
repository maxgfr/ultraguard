// fix: applies the fix plan of ONE of the user's own projects, when they ask.
// It is the single ultraguard command that writes outside its own folders, and
// it never touches the user's checkout: it makes a new git worktree under
// <state>/fixes, on a new branch from the default branch, runs the plan there
// (install scripts off), re-checks the lockfiles with package-checker, runs the
// project's tests, and commits with the user's own git config. It never pushes,
// never opens a PR, never merges: it prints the commands for that, and for
// dropping the fix. Without --apply it only says what it would do.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { UsageError } from "./engine.js";
import { type FixStep, type LockfilePlan, type Manager, type ProjectPlan, planFixes } from "./fixes.js";
import type { Run } from "./run.js";
import type { Runner } from "./runner.js";
import { type Checker, defaultChecker } from "./scan/deps.js";
import type { RankedVulns, Tier } from "./vulns.js";

export const FIX_TEST_TIMEOUT_MS = 15 * 60_000;
const GIT_TIMEOUT_MS = 60_000;
const INSTALL_TIMEOUT_MS = 10 * 60_000;

export interface FixDeps {
  runner: Runner;
  /** ultraguard's state folder: the worktrees go under <state>/fixes. */
  state: string;
  /** The re-check: package-checker through the runner unless a test injects one. */
  checker?: Checker;
  now?: Date;
  testTimeoutMs?: number;
}

export interface FixOptions {
  /** The project to fix: its root, or a folder inside it. */
  project: string;
  apply: boolean;
  tiers: Tier[];
  test: boolean;
}

/** One thing fix does in the worktree: a package-manager command or an edit ultraguard makes itself. */
export interface FixAction {
  kind: "command" | "edit" | "install";
  /** The folder it runs in, inside the worktree. */
  cwd: string;
  /** What runs, as typed in a shell, or the edit in words. */
  command: string;
  argv?: string[];
  /** The plan steps it carries out: indices into FixRecord.steps. */
  steps: number[];
  ok?: boolean;
  exitCode?: number;
  output?: string;
}

export interface Advisory {
  lockfile: string;
  name: string;
  version: string;
  id: string;
}

export interface FixRecord {
  project: string;
  name: string;
  dryRun: boolean;
  tiers: Tier[];
  repo: string;
  base: { ref: string; commit: string };
  worktree: string;
  branch: string;
  steps: (FixStep & { lockfile: string })[];
  actions: FixAction[];
  /** Files the plan is expected to change, relative to the repository. */
  expectedFiles: string[];
  /** Lockfiles of the plan fix leaves alone, and why. */
  skipped: { lockfile: string; why: string }[];
  notes: string[];
  recheck?: { ok: boolean; error?: string; closed: Advisory[]; remaining: Advisory[]; introduced: Advisory[] };
  test?: { command?: string; cwd?: string; ran: boolean; ok: boolean; exitCode?: number; output?: string; why?: string };
  commit?: { ok: boolean; sha?: string; message: string; error?: string; log?: string; unstaged?: string[] };
  diffStat?: string;
  next: { push: string; pr: string; drop: string[] };
  exitCode: number;
}

/** The binary each manager's commands start with. */
const BIN: Partial<Record<Manager, string>> = {
  npm: "npm",
  pnpm: "pnpm",
  yarn: "yarn",
  "yarn-berry": "yarn",
  bun: "bun",
  uv: "uv",
  poetry: "poetry",
  pipenv: "pipenv",
  cargo: "cargo",
  go: "go",
  composer: "composer",
  bundler: "bundle",
};

/** What keeps a JavaScript install from running the install scripts of a tree that may be hostile. */
const NO_SCRIPTS: Partial<Record<Manager, string>> = {
  npm: "--ignore-scripts",
  pnpm: "--ignore-scripts",
  yarn: "--ignore-scripts",
  bun: "--ignore-scripts",
  "yarn-berry": "--mode=skip-build",
};

/** The manifests a manager edits next to its lockfile: the files a fix commits. */
const MANIFEST: Partial<Record<Manager, string[]>> = {
  npm: ["package.json"],
  pnpm: ["package.json"],
  yarn: ["package.json"],
  "yarn-berry": ["package.json"],
  bun: ["package.json"],
  uv: ["pyproject.toml"],
  poetry: ["pyproject.toml"],
  pipenv: ["Pipfile"],
  cargo: ["Cargo.toml"],
  go: ["go.mod", "go.sum"],
  composer: ["composer.json"],
  bundler: ["Gemfile"],
};

/** Files a fix may commit: manifests and lockfiles, nothing a test or a build leaves behind. */
const COMMITTABLE =
  /(^|\/)(package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|bun\.lockb?|uv\.lock|pyproject\.toml|poetry\.lock|Pipfile(\.lock)?|requirements[^/]*\.txt|Cargo\.(toml|lock)|go\.(mod|sum)|composer\.(json|lock)|Gemfile(\.lock)?)$/;

/** Splits a plan command into argv: words, and "double-quoted" words. */
export function splitCommand(command: string): string[] {
  return [...command.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => (m[1] ?? m[2]) as string);
}

const tail = (s: string, lines = 40) => s.trim().split("\n").slice(-lines).join("\n").slice(-4000);

// ---------------------------------------------------------------------------
// Edits, with the file's own formatting kept

/** Sets `key` to `value` in the object at `field` of a JSON file, keeping its indentation, line endings and final newline. */
export function editJson(path: string, field: string[], key: string, value: string): void {
  const text = readFileSync(path, "utf8");
  // A one-line file stays on one line; otherwise the first member's indentation (two spaces, four, a tab).
  const indent = /\n/.test(text.trim()) ? (/^\{\r?\n([ \t]+)"/.exec(text.trimStart())?.[1] ?? "  ") : "";
  const data = JSON.parse(text) as Record<string, unknown>;
  let obj = data;
  for (const f of field) {
    const next = obj[f];
    if (!next || typeof next !== "object" || Array.isArray(next)) obj[f] = {};
    obj = obj[f] as Record<string, unknown>;
  }
  obj[key] = value;
  let out = JSON.stringify(data, null, indent);
  if (/\r?\n$/.test(text)) out += "\n";
  if (text.includes("\r\n")) out = out.replace(/\n/g, "\r\n");
  writeFileSync(path, out);
}

/** Adds (or replaces) "key": "value" in the top-level `overrides:` map of a pnpm-workspace.yaml. False when it has none. */
export function editWorkspaceOverrides(path: string, key: string, value: string): boolean {
  const lines = readFileSync(path, "utf8").split("\n");
  const at = lines.findIndex((l) => /^overrides:\s*(#.*)?$/.test(l));
  if (at < 0) return false;
  let end = at + 1;
  let indent: string | undefined;
  for (; end < lines.length; end++) {
    const l = lines[end] as string;
    if (!l.trim() || /^\s*#/.test(l)) continue;
    const m = /^(\s+)\S/.exec(l);
    if (!m) break;
    indent ??= m[1] as string;
  }
  indent ??= "  ";
  while (end > at + 1 && !(lines[end - 1] as string).trim()) end--;
  const entry = `${indent}${JSON.stringify(key)}: ${JSON.stringify(value)}`;
  const quoted = new RegExp(`^\\s+(["']?)${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\1\\s*:`);
  const same = lines.slice(at + 1, end).findIndex((l) => quoted.test(l));
  if (same >= 0) lines[at + 1 + same] = entry;
  else lines.splice(end, 0, entry);
  writeFileSync(path, lines.join("\n"));
  return true;
}

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Pins a package in a requirements file, a Cargo.toml or a Gemfile. An error says why the line could not be found. */
export function editLine(path: string, name: string, to: string): void {
  const file = basename(path);
  const text = readFileSync(path, "utf8");
  let out: string | undefined;
  if (/^requirements.*\.txt$/.test(file)) {
    const pyName = name
      .split(/[-_.]+/)
      .map(escRe)
      .join("[-_.]+");
    const re = new RegExp(`^(\\s*)(${pyName})(\\[[^\\]]*\\])?[ \\t]*(?:(?:===|==|>=|<=|~=|!=|<|>)[^;#\\n]*)?`, "im");
    out = re.test(text)
      ? text.replace(re, (_m, sp: string, n: string, extras = "") => `${sp}${n}${extras}==${to}`)
      : `${text}${text.endsWith("\n") || !text ? "" : "\n"}${name}==${to}\n`;
  } else if (file === "Cargo.toml") {
    const plain = new RegExp(`^(\\s*${escRe(name)}\\s*=\\s*)"[^"]*"`, "m");
    const table = new RegExp(`^(\\s*${escRe(name)}\\s*=\\s*\\{[^}\\n]*?\\bversion\\s*=\\s*)"[^"]*"`, "m");
    if (plain.test(text)) out = text.replace(plain, `$1"${to}"`);
    else if (table.test(text)) out = text.replace(table, `$1"${to}"`);
  } else if (file === "Gemfile") {
    const re = new RegExp(`^(\\s*gem\\s+(["'])${escRe(name)}\\2)((?:\\s*,\\s*(["'])[^"'\\n]*\\4)*)`, "m");
    if (re.test(text)) out = text.replace(re, `$1, ">= ${to}"`);
  }
  if (out === undefined) throw new Error(`${name} not found in ${file}: edit it by hand`);
  writeFileSync(path, out);
}

// ---------------------------------------------------------------------------
// The plan, turned into actions

function actionsFor(l: LockfilePlan, cwd: string, steps: { s: FixStep; i: number }[], notes: string[]): FixAction[] {
  const flag = NO_SCRIPTS[l.manager];
  const withFlag = (argv: string[]) => (flag && !argv.includes(flag) ? [...argv, flag] : argv);
  const out: FixAction[] = [];
  for (const { s, i } of steps)
    if (!s.edit) {
      const argv = withFlag(splitCommand(s.command));
      out.push({ kind: "command", cwd, command: argv.map((a) => (/[\s"<>|&;]/.test(a) ? `"${a}"` : a)).join(" "), argv, steps: [i] });
    }
  for (const { s, i } of steps)
    if (s.edit)
      out.push({
        kind: "edit",
        cwd,
        command: s.edit.field ? `set ${s.edit.where}: "${s.edit.key}": "${s.edit.value}"` : `in ${s.edit.file}: ${s.edit.entry}`,
        steps: [i],
      });
  // The final installs only when a selected step needs them: an edit with no install would leave the lockfile as it was.
  const fin = steps.some(({ s }) => s.edit) || l.manager === "go" ? l.finally : [];
  for (const f of fin) {
    if (l.manager === "pip") {
      notes.push(`${basename(l.lockfile)}: not running "${f}": it would install into your Python environment, not the worktree`);
      continue;
    }
    const argv = withFlag(splitCommand(f));
    out.push({ kind: "install", cwd, command: argv.join(" "), argv, steps: [] });
  }
  return out;
}

function stamp(d: Date): { day: string; minute: string } {
  const p = (n: number) => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  return { day, minute: `${day}-${p(d.getHours())}${p(d.getMinutes())}` };
}

const real = (p: string) => {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
};

const KIND_REFUSAL: Record<string, (p: ProjectPlan) => string> = {
  worktree: (p) =>
    `${p.root} is a git worktree${p.mainRepo ? ` of ${p.mainRepo}: fix the main checkout (--project ${p.mainRepo})` : ": fix the main checkout"}`,
  tool: (p) => `${p.root} belongs to a tool, a cache or a plugin: update the tool that owns it, ultraguard does not fix it`,
  vendored: (p) => `${p.root} is a vendored copy (node_modules, a virtualenv): update the package that ships it, ultraguard does not fix it`,
};

/** Every check that needs no write: what fix would do, or a UsageError saying why it refuses. */
async function prepare(ranked: RankedVulns, opts: FixOptions, deps: FixDeps): Promise<{ record: FixRecord; plan: ProjectPlan }> {
  const { runner } = deps;
  const git = (args: string[], cwd?: string) => runner("git", cwd ? ["-C", cwd, ...args] : args, { timeoutMs: GIT_TIMEOUT_MS });
  const plans = planFixes(ranked, { project: opts.project }).sort((a, b) => b.root.length - a.root.length);
  const plan = plans[0];
  if (!plan) throw new UsageError(`fix: no vulnerable lockfile under ${opts.project} in this run: nothing to fix`);
  const refusal = KIND_REFUSAL[plan.kind];
  if (refusal) throw new UsageError(`fix refused: ${refusal(plan)}`);

  const skipped: FixRecord["skipped"] = [];
  const notes: string[] = [];
  const lockfiles: { plan: LockfilePlan; steps: FixStep[] }[] = [];
  for (const l of plan.lockfiles) {
    const steps = l.steps.filter((s) => opts.tiers.includes(s.tier));
    if (!steps.length) continue;
    if (l.manager === "other") {
      skipped.push({ lockfile: l.lockfile, why: "ultraguard has no command for this lockfile: fix it by hand" });
      continue;
    }
    lockfiles.push({ plan: l, steps });
  }
  if (!lockfiles.length)
    throw new UsageError(
      `fix refused: the plan of ${plan.root} is empty at ${opts.tiers.join(",")}${skipped.length ? ` (${skipped.map((s) => basename(s.lockfile)).join(", ")}: no automatic fix)` : ""}: nothing to apply`,
    );

  // A git repository, and its main checkout: never a linked worktree, never a folder inside another repository.
  const top = await git(["rev-parse", "--show-toplevel"], plan.root);
  if (top.missing) throw new UsageError("fix refused: git is not installed");
  if (!top.ok) throw new UsageError(`fix refused: ${plan.root} is not a git repository (fix works in a new git worktree and branch)`);
  const repo = top.stdout.trim();
  if (real(repo) !== real(plan.root)) throw new UsageError(`fix refused: ${plan.root} is not the root of its git repository (${repo})`);
  const dirs = await git(["rev-parse", "--path-format=absolute", "--git-dir", "--git-common-dir"], repo);
  const [gitDir, commonDir] = dirs.stdout.trim().split("\n");
  if (dirs.ok && gitDir && commonDir && real(gitDir) !== real(commonDir))
    throw new UsageError(`fix refused: ${repo} is a linked git worktree: fix the main checkout (${dirname(real(commonDir))})`);

  // Every package manager the plan needs, before anything is created.
  const bins = new Set<string>();
  for (const { plan: l } of lockfiles) {
    const b = BIN[l.manager];
    if (b) bins.add(b);
  }
  for (const b of bins) {
    const r = await runner(b, ["--version"], { timeoutMs: 30_000, cwd: repo });
    if (r.missing)
      throw new UsageError(
        `fix refused: ${b} is not installed, and the plan of ${plan.root} needs it (${lockfiles
          .filter((x) => BIN[x.plan.manager] === b)
          .map((x) => relative(repo, x.plan.lockfile))
          .join(", ")}): install it, then run fix again`,
      );
  }

  // The base: the default branch as it is here (no fetch), or HEAD.
  const exists = async (ref: string) => (await git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], repo)).ok;
  const origin = (await git(["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"], repo)).stdout.trim().replace(/^origin\//, "");
  let ref = "HEAD";
  for (const c of [origin, "main", "master"].filter(Boolean)) {
    if (await exists(`refs/heads/${c}`)) {
      ref = c;
      break;
    }
    if (await exists(`refs/remotes/origin/${c}`)) {
      ref = `origin/${c}`;
      break;
    }
  }
  const head = await git(["rev-parse", "--verify", `${ref}^{commit}`], repo);
  if (!head.ok) throw new UsageError(`fix refused: ${repo} has no commit to branch from (${ref})`);
  const commit = head.stdout.trim();
  const now = stamp(deps.now ?? new Date());
  const branch = `ultraguard/fix-${now.day}-${commit.slice(0, 7)}`;
  if (await exists(`refs/heads/${branch}`))
    throw new UsageError(`fix refused: the branch ${branch} already exists in ${repo}: finish or drop that fix first (git -C ${repo} branch -D ${branch})`);
  const worktree = join(deps.state, "fixes", `${basename(repo)}-${now.minute}`);
  if (existsSync(worktree))
    throw new UsageError(`fix refused: ${worktree} already exists: wait a minute, or remove it (git -C ${repo} worktree remove ${worktree})`);

  const inWt = (p: string) => join(worktree, relative(real(repo), real(p)));
  const actions: FixAction[] = [];
  const expected = new Set<string>();
  let n = 0;
  for (const { plan: l, steps } of lockfiles) {
    actions.push(
      ...actionsFor(
        l,
        inWt(l.dir),
        steps.map((s) => ({ s, i: n++ })),
        notes,
      ),
    );
    const rel = relative(real(repo), real(l.dir));
    const at = (f: string) => (rel ? `${rel}/${f}` : f);
    expected.add(at(basename(l.lockfile)));
    for (const m of MANIFEST[l.manager] ?? []) expected.add(at(m));
    for (const s of steps) if (s.edit) expected.add(at(s.edit.file));
    if (
      l.manager === "pnpm" &&
      steps.some((s) => s.edit) &&
      existsSync(join(l.dir, "pnpm-workspace.yaml")) &&
      hasWorkspaceOverrides(join(l.dir, "pnpm-workspace.yaml"))
    )
      expected.add(at("pnpm-workspace.yaml"));
    if (steps.some((s) => / -r /.test(s.command)))
      notes.push(`${rel || "."}: pnpm up -r also changes the package.json of the workspace packages that declare the package`);
  }
  const record: FixRecord = {
    project: plan.root,
    name: plan.name,
    dryRun: !opts.apply,
    tiers: opts.tiers,
    repo,
    base: { ref, commit },
    worktree,
    branch,
    steps: lockfiles.flatMap(({ plan: l, steps }) => steps.map((s) => ({ ...s, lockfile: l.lockfile }))),
    actions,
    expectedFiles: [...expected].sort(),
    skipped,
    notes,
    next: {
      push: `git -C ${worktree} push -u origin ${branch}`,
      pr: `cd ${worktree} && gh pr create --base ${ref.replace(/^origin\//, "") === "HEAD" ? "<default branch>" : ref.replace(/^origin\//, "")} --head ${branch} --fill`,
      drop: [`git -C ${repo} worktree remove --force ${worktree}`, `git -C ${repo} branch -D ${branch}`],
    },
    exitCode: 0,
  };
  return { record, plan };
}

function hasWorkspaceOverrides(path: string): boolean {
  try {
    return /^overrides:\s*(#.*)?$/m.test(readFileSync(path, "utf8"));
  } catch {
    return false;
  }
}

/** Applies one edit action in the worktree. */
function applyEdit(step: FixStep, dir: string): void {
  const e = step.edit;
  if (!e) return;
  if (!e.field) {
    editLine(join(dir, e.file), e.key, e.value);
    return;
  }
  // pnpm: the workspace file wins when it already holds the overrides; package.json "pnpm.overrides" otherwise.
  const ws = join(dir, "pnpm-workspace.yaml");
  if (e.field.join(".") === "pnpm.overrides" && existsSync(ws) && editWorkspaceOverrides(ws, e.key, e.value)) return;
  editJson(join(dir, e.file), e.field, e.key, e.value);
}

// ---------------------------------------------------------------------------
// The project's tests

/** The test command of the project in `dir`, when it has one. */
export function detectTest(dir: string): { argv: string[]; cwd: string } | undefined {
  const has = (f: string) => existsSync(join(dir, f));
  const read = (f: string) => {
    try {
      return readFileSync(join(dir, f), "utf8");
    } catch {
      return "";
    }
  };
  if (has("package.json")) {
    let test: unknown;
    try {
      test = (JSON.parse(read("package.json")) as { scripts?: Record<string, unknown> }).scripts?.test;
    } catch {
      test = undefined;
    }
    if (typeof test === "string" && test.trim() && !/no test specified/.test(test)) {
      const argv = has("pnpm-lock.yaml")
        ? ["pnpm", "test"]
        : has("yarn.lock")
          ? ["yarn", "test"]
          : has("bun.lock") || has("bun.lockb")
            ? ["bun", "run", "test"]
            : ["npm", "test"];
      return { argv, cwd: dir };
    }
  }
  if (has("Cargo.toml")) return { argv: ["cargo", "test"], cwd: dir };
  if (has("go.mod")) return { argv: ["go", "test", "./..."], cwd: dir };
  const pytest =
    has("pytest.ini") ||
    has("conftest.py") ||
    /^\[tool\.pytest/m.test(read("pyproject.toml")) ||
    /^\[tool:pytest\]/m.test(read("setup.cfg")) ||
    /^\[pytest\]/m.test(read("tox.ini"));
  if (pytest)
    return { argv: has("uv.lock") ? ["uv", "run", "pytest"] : has("poetry.lock") ? ["poetry", "run", "pytest"] : ["python3", "-m", "pytest"], cwd: dir };
  return undefined;
}

// ---------------------------------------------------------------------------

/** Dry run (opts.apply false): what fix would do, nothing written. Apply: does it in a new worktree, writes <run>/fix-<name>.json. */
export async function fixProject(ranked: RankedVulns, opts: FixOptions, run: Run, deps: FixDeps): Promise<FixRecord> {
  const { record, plan } = await prepare(ranked, opts, deps);
  if (!opts.apply) return record;
  const { runner } = deps;
  const git = (args: string[]) => runner("git", ["-C", record.worktree, ...args], { timeoutMs: GIT_TIMEOUT_MS });

  mkdirSync(dirname(record.worktree), { recursive: true });
  const add = await runner("git", ["-C", record.repo, "worktree", "add", "-b", record.branch, record.worktree, record.base.commit], {
    timeoutMs: 5 * 60_000,
  });
  if (!add.ok) throw new Error(`git worktree add failed: ${tail(add.stderr || add.stdout, 3)}`);

  // The plan, in order: commands, then the edits, then the installs.
  for (const a of record.actions) {
    if (a.kind === "edit") {
      try {
        applyEdit(record.steps[a.steps[0] as number] as FixStep, a.cwd);
        a.ok = true;
        a.exitCode = 0;
      } catch (e) {
        a.ok = false;
        a.exitCode = 1;
        a.output = (e as Error).message;
      }
      continue;
    }
    const [cmd, ...args] = a.argv as string[];
    const r = await runner(cmd as string, args, { timeoutMs: INSTALL_TIMEOUT_MS, cwd: a.cwd });
    a.ok = r.ok;
    a.exitCode = r.missing ? 127 : r.status;
    a.output = tail(`${r.stdout}\n${r.stderr}`);
  }

  // Re-check: package-checker on the worktree's copies of the plan's lockfiles.
  const rel = (f: string) => relative(real(record.repo), real(f));
  const lockRels = new Set(plan.lockfiles.map((l) => rel(l.lockfile)));
  const project = ranked.projects.find((p) => p.root === plan.root);
  const adv = (lockfile: string, name: string, version: string, ids: string[]) => ids.map((id) => ({ lockfile, name, version, id }));
  const target = record.steps.flatMap((s) => s.closes.map((id) => ({ lockfile: rel(s.lockfile), name: s.name, version: s.from.join(", "), id })));
  const before = new Set(
    (project?.items ?? []).flatMap((i) => adv(rel(i.file), i.name, i.version, [...i.cves, ...i.ghsas])).map((x) => `${x.lockfile}|${x.name}|${x.id}`),
  );
  const checker = deps.checker ?? defaultChecker(runner, join(run.dir, "package-checker", `fix-${record.name}`));
  const c = await checker(record.worktree);
  if (!c.ok) record.recheck = { ok: false, error: c.error ?? "package-checker failed", closed: [], remaining: [], introduced: [] };
  else {
    const after = c.vulnerabilities
      .map((v) => ({ v, lockfile: relative(real(record.worktree), real(v.file)) }))
      .filter((x) => lockRels.has(x.lockfile))
      .flatMap(({ v, lockfile }) => adv(lockfile, v.name, v.version, v.advisories.map((a) => a.cve || a.ghsa || a.id || "").filter(Boolean)));
    const afterKeys = new Set(after.map((x) => `${x.lockfile}|${x.name}|${x.id}`));
    const seen = new Set<string>();
    record.recheck = {
      ok: true,
      closed: target.filter((t) => !afterKeys.has(`${t.lockfile}|${t.name}|${t.id}`)),
      remaining: after.filter((x) => target.some((t) => t.lockfile === x.lockfile && t.name === x.name && t.id === x.id)),
      introduced: after.filter((x) => {
        const k = `${x.lockfile}|${x.name}|${x.id}`;
        if (before.has(k) || seen.has(k)) return false;
        seen.add(k);
        return true;
      }),
    };
  }

  // The tests, unless --no-test. A failure leaves the worktree as it is, to repair.
  if (!opts.test) record.test = { ran: false, ok: true, why: "--no-test" };
  else {
    const dirs = [record.worktree, ...new Set(record.actions.map((a) => a.cwd))];
    const t = dirs.map(detectTest).find(Boolean);
    if (!t) record.test = { ran: false, ok: true, why: "no test command found (package.json scripts.test, Cargo.toml, go.mod, pytest)" };
    else {
      const [cmd, ...args] = t.argv;
      const r = await runner(cmd as string, args, { timeoutMs: deps.testTimeoutMs ?? FIX_TEST_TIMEOUT_MS, cwd: t.cwd });
      record.test = {
        command: t.argv.join(" "),
        cwd: t.cwd,
        ran: !r.missing,
        ok: r.ok,
        exitCode: r.missing ? 127 : r.status,
        output: tail(`${r.stdout}\n${r.stderr}`),
        why: r.missing ? `${cmd} is not installed` : undefined,
      };
    }
  }

  // Commit the manifests and lockfiles only, with the user's own git config (and signature).
  const status = await git(["status", "--porcelain", "-z", "--untracked-files=all"]);
  const changed = status.stdout
    .split("\0")
    .filter(Boolean)
    .map((l) => l.slice(3));
  const stage = changed.filter((f) => COMMITTABLE.test(f));
  const unstaged = changed.filter((f) => !COMMITTABLE.test(f));
  const done = record.steps.filter((_, i) => record.actions.some((a) => a.ok && a.steps.includes(i)));
  const closedIds = record.recheck?.ok ? [...new Set(record.recheck.closed.map((x) => x.id))] : [...new Set(done.flatMap((s) => s.closes))];
  const subject = closedIds.length ? `fix(deps): close ${closedIds.length} known vulnerabilities` : `fix(deps): upgrade ${done.length} vulnerable packages`;
  const body = done
    .map((s) => `- ${s.name} ${s.from.join(", ")} -> ${s.to}${s.relation === "transitive" ? " (override)" : ""}: ${s.closes.join(", ")}`)
    .join("\n");
  const message = `${subject}\n\n${body}`;
  if (!stage.length) record.commit = { ok: false, message, error: "nothing changed: no manifest or lockfile was modified", unstaged };
  else {
    const added = await git(["add", "--", ...stage]);
    const commit = added.ok ? await runner("git", ["-C", record.worktree, "commit", "-m", subject, "-m", body], { timeoutMs: 5 * 60_000 }) : added;
    if (!commit.ok)
      record.commit = {
        ok: false,
        message,
        error: `git commit failed, the changes are left uncommitted in the worktree: ${tail(commit.stderr || commit.stdout, 5)}`,
        unstaged,
      };
    else {
      const sha = (await git(["rev-parse", "HEAD"])).stdout.trim();
      const log = (await git(["log", "-1"])).stdout.trim();
      record.commit = { ok: true, sha, message, log, unstaged };
    }
  }
  const stat = record.commit?.ok ? await git(["diff", "--stat", `${record.base.commit}..HEAD`]) : await git(["diff", "--stat", "HEAD"]);
  record.diffStat = stat.stdout.trim();

  const failed = record.actions.some((a) => !a.ok);
  const remaining = !record.recheck?.ok || record.recheck.remaining.length > 0;
  record.exitCode = failed || remaining || !record.test?.ok || !record.commit?.ok ? 1 : 0;
  run.write(`fix-${record.name}.json`, record);
  return record;
}

/** What fix prints. */
export function renderFix(r: FixRecord, run: Run): string {
  const out: string[] = [];
  const short = (p: string) => (p.startsWith(r.worktree + sep) ? relative(r.worktree, p) || "." : p === r.worktree ? "." : p);
  out.push(
    r.dryRun ? `# fix ${r.name} (dry run: nothing written)` : `# fix ${r.name}`,
    "",
    `project:  ${r.project}`,
    `base:     ${r.base.ref} (${r.base.commit.slice(0, 12)})`,
    `worktree: ${r.worktree}`,
    `branch:   ${r.branch}`,
    "",
    `${r.dryRun ? "Would run" : "Ran"}, in the worktree (install scripts off):`,
  );
  for (const a of r.actions)
    out.push(
      `  [${short(a.cwd)}] ${a.command}${a.ok === undefined ? "" : a.ok ? "  -> ok" : `  -> FAILED (exit ${a.exitCode})${a.output ? `\n      ${tail(a.output, 3).replace(/\n/g, "\n      ")}` : ""}`}`,
    );
  out.push("", `Files expected to change: ${r.expectedFiles.join(", ")}`);
  for (const s of r.skipped) out.push(`Skipped ${s.lockfile}: ${s.why}`);
  for (const n of r.notes) out.push(`Note: ${n}`);
  out.push("", `Closes (planned): ${[...new Set(r.steps.flatMap((s) => s.closes))].join(", ")}`);
  if (r.dryRun) {
    out.push(
      "",
      `Then: package-checker re-checks the lockfiles, the project's tests run (unless --no-test), and the change is committed in the worktree with your git config. Nothing is pushed.`,
      `Apply: ultraguard fix --out ${run.dir} --project ${r.project} --apply${r.tiers.join(",") === "P0,P1,P2" ? "" : ` --tiers ${r.tiers.join(",")}`}`,
    );
    return out.join("\n");
  }
  const rc = r.recheck;
  if (rc && !rc.ok) out.push("", `Re-check: could not run (${rc.error}): the advisories are not confirmed closed.`);
  else if (rc) {
    out.push("", `Re-check: ${rc.closed.length} advisory(ies) closed, ${rc.remaining.length} remaining, ${rc.introduced.length} new.`);
    for (const x of rc.remaining) out.push(`  remaining: ${x.name} ${x.version} ${x.id} (${x.lockfile})`);
    for (const x of rc.introduced) out.push(`  new:       ${x.name} ${x.version} ${x.id} (${x.lockfile})`);
  }
  const t = r.test;
  if (t)
    out.push(
      "",
      t.ran
        ? `Tests: ${t.ok ? "PASSED" : `FAILED (exit ${t.exitCode})`}: ${t.command}${t.ok ? "" : `\n${t.output ?? ""}\nThe worktree is kept: repair the code there, re-run the tests, then commit.`}`
        : `Tests: not run (${t.why})`,
    );
  const c = r.commit;
  if (c?.ok) out.push("", "Commit:", c.log ?? c.sha ?? "");
  else if (c) out.push("", `Not committed: ${c.error}`);
  if (c?.unstaged?.length) out.push(`Left unstaged (not manifests or lockfiles): ${c.unstaged.join(", ")}`);
  if (r.diffStat) out.push("", r.diffStat);
  out.push(
    "",
    "Nothing was pushed. To publish it:",
    `  ${r.next.push}`,
    `  ${r.next.pr}`,
    "To drop it:",
    ...r.next.drop.map((d) => `  ${d}`),
    "",
    run.path(`fix-${r.name}.json`),
  );
  return out.join("\n");
}
