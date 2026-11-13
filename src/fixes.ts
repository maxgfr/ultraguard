// fixes: the smallest upgrades that close the P0-P2 vulnerabilities of each of
// the user's own projects, with the exact command for the project's package
// manager, read from its lockfile. `fixes` runs none of them; `fix --apply`
// (fix.ts) runs them in a new worktree and branch, once the user says so.
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { compareVersions, isBreaking, type ProjectKind, type RankedItem, type RankedVulns, type Relation, type Tier, TIERS } from "./vulns.js";

export type Manager = "npm" | "pnpm" | "yarn" | "yarn-berry" | "bun" | "uv" | "poetry" | "pipenv" | "pip" | "cargo" | "go" | "composer" | "bundler" | "other";

/** The package manager that wrote a lockfile. */
export function managerOf(lockfile: string): Manager {
  const name = basename(lockfile);
  if (name === "package-lock.json" || name === "npm-shrinkwrap.json") return "npm";
  if (name === "pnpm-lock.yaml") return "pnpm";
  if (name === "yarn.lock") {
    try {
      return /^__metadata:/m.test(readFileSync(lockfile, "utf8").slice(0, 4096)) ? "yarn-berry" : "yarn";
    } catch {
      return "yarn";
    }
  }
  if (name === "bun.lock" || name === "bun.lockb") return "bun";
  if (name === "uv.lock") return "uv";
  if (name === "poetry.lock") return "poetry";
  if (name === "Pipfile.lock") return "pipenv";
  if (/^requirements.*\.txt$/.test(name)) return "pip";
  if (name === "Cargo.lock") return "cargo";
  if (name === "go.sum" || name === "go.mod") return "go";
  if (name === "composer.lock") return "composer";
  if (name === "Gemfile.lock") return "bundler";
  return "other";
}

export interface FixStep {
  tier: Tier;
  name: string;
  ecosystem: string;
  from: string[];
  to: string;
  relation: Relation;
  majorBump: boolean;
  /** The CVE and GHSA ids the upgrade closes. */
  closes: string[];
  /** The command to run in the lockfile's folder, or the edit to make, in words. */
  command: string;
  /**
   * When the fix is an edit rather than a command: the file (and field) and the entry to add or change.
   * `file` is relative to the lockfile's folder; `field` is the JSON path of an override map, absent for a line edit.
   */
  edit?: { where: string; entry: string; file: string; field?: string[]; key: string; value: string };
  note?: string;
}

export interface LockfilePlan {
  lockfile: string;
  /** Where to run the commands. */
  dir: string;
  manager: Manager;
  steps: FixStep[];
  /** What to run once every edit is made (an install after overrides). */
  finally: string[];
  /** P0-P2 items no fixed version closes yet. */
  unfixed: { tier: Tier; name: string; version: string; ids: string[] }[];
  /** P3 items left out of the plan. */
  p3: number;
}

export interface ProjectPlan {
  root: string;
  name: string;
  kind: ProjectKind;
  mainRepo?: string;
  lockfiles: LockfilePlan[];
}

/** Managers whose overrides can target one locked version ("pkg@1.2.3"): the others override every copy. */
const PER_VERSION = new Set<Manager>(["npm", "pnpm", "yarn-berry", "cargo"]);

const REL_ORDER: Relation[] = ["direct", "dev", "transitive", "unknown"];
const bestRel = (a: Relation, b: Relation) => (REL_ORDER.indexOf(a) <= REL_ORDER.indexOf(b) ? a : b);
const isDirect = (r: Relation) => r === "direct" || r === "dev";

/** The command (or edit) for one package in one lockfile, plus what to run at the end. */
function commandFor(
  m: Manager,
  s: Omit<FixStep, "command" | "tier" | "closes">,
  lockfile: string,
): { command: string; edit?: FixStep["edit"]; finally?: string; note?: string } {
  const dir = dirname(lockfile);
  const direct = isDirect(s.relation);
  const dev = s.relation === "dev";
  const from = s.from[0] as string;
  const pin = (key: string, value: string, where: string, field: string[]) => ({
    command: `add to ${where}: "${key}": "${value}"`,
    edit: { where, entry: `"${key}": "${value}"`, file: "package.json", field, key, value },
  });
  const line = (file: string, entry: string) => ({ command: `in ${file}: ${entry}`, edit: { where: file, entry, file, key: s.name, value: s.to } });
  switch (m) {
    case "npm":
      return direct
        ? { command: `npm install ${s.name}@${s.to}${dev ? " --save-dev" : ""}` }
        : { ...pin(`${s.name}@${from}`, s.to, 'package.json "overrides"', ["overrides"]), finally: "npm install" };
    case "pnpm": {
      const ws = existsSync(join(dir, "pnpm-workspace.yaml"));
      return direct
        ? { command: `pnpm up${ws ? " -r" : ""} ${s.name}@${s.to}` }
        : {
            ...pin(`${s.name}@${from}`, s.to, ws ? 'pnpm-workspace.yaml "overrides" (or package.json "pnpm.overrides")' : 'package.json "pnpm.overrides"', [
              "pnpm",
              "overrides",
            ]),
            finally: "pnpm install",
          };
    }
    case "yarn":
      return direct
        ? { command: `yarn upgrade ${s.name}@${s.to}` }
        : {
            ...pin(s.name, s.to, 'package.json "resolutions"', ["resolutions"]),
            finally: "yarn install",
            note: "a resolution applies to every copy of the package",
          };
    case "yarn-berry":
      return direct
        ? { command: `yarn up ${s.name}@${s.to}` }
        : { ...pin(`${s.name}@npm:${from}`, s.to, 'package.json "resolutions"', ["resolutions"]), finally: "yarn install" };
    case "bun":
      return direct
        ? { command: `bun add${dev ? " -d" : ""} ${s.name}@${s.to}` }
        : { ...pin(s.name, s.to, 'package.json "overrides"', ["overrides"]), finally: "bun install", note: "an override applies to every copy of the package" };
    case "uv":
      return direct ? { command: `uv add${dev ? " --dev" : ""} "${s.name}>=${s.to}"` } : { command: `uv lock --upgrade-package "${s.name}==${s.to}"` };
    case "poetry":
      return direct
        ? { command: `poetry add${dev ? " --group dev" : ""} "${s.name}>=${s.to}"` }
        : { command: `poetry update ${s.name}`, note: `check poetry.lock now has ${s.name} ${s.to} or newer; if not, add a constraint` };
    case "pipenv":
      return direct ? { command: `pipenv install${dev ? " --dev" : ""} "${s.name}>=${s.to}"` } : { command: `pipenv update ${s.name}` };
    case "pip":
      return { ...line(basename(lockfile), `${s.name}==${s.to}`), finally: `pip install -r ${basename(lockfile)}` };
    case "cargo":
      return direct && s.majorBump
        ? { ...line("Cargo.toml", `${s.name} = "${s.to}"`), finally: "cargo update" }
        : { command: `cargo update -p ${s.name}@${from} --precise ${s.to}` };
    case "go":
      return { command: `go get ${s.name}@v${s.to.replace(/^v/, "")}`, finally: "go mod tidy" };
    case "composer":
      return direct ? { command: `composer require${dev ? " --dev" : ""} ${s.name}:^${s.to}` } : { command: `composer update ${s.name} --with-dependencies` };
    case "bundler":
      return direct && s.majorBump
        ? { ...line("Gemfile", `gem "${s.name}", ">= ${s.to}"`), finally: `bundle update ${s.name}` }
        : { command: `bundle update ${s.name} --conservative` };
    default:
      return { command: `upgrade ${s.name} to ${s.to}` };
  }
}

/** The fix plan for each own project (or the one --project names, whatever its kind). */
export function planFixes(r: RankedVulns, opts: { project?: string } = {}): ProjectPlan[] {
  const want = opts.project?.replace(/[/\\]+$/, "");
  const projects = want ? r.projects.filter((p) => p.root === want || want.startsWith(`${p.root}/`)) : r.projects.filter((p) => p.kind === "own");
  return projects.map((p) => {
    const byFile = new Map<string, RankedItem[]>();
    for (const i of p.items) byFile.set(i.file, [...(byFile.get(i.file) ?? []), i]);
    const lockfiles: LockfilePlan[] = [];
    for (const [file, items] of byFile) {
      const manager = managerOf(file);
      const wanted = items.filter((i) => i.tier !== "P3");
      const groups = new Map<string, RankedItem[]>();
      for (const i of wanted.filter((x) => x.fix)) groups.set(i.name, [...(groups.get(i.name) ?? []), i]);
      const steps: FixStep[] = [];
      const fin = new Set<string>();
      const stepOf = (list: RankedItem[], relation: Relation): FixStep => {
        const to = list
          .map((i) => i.fix as string)
          .sort(compareVersions)
          .pop() as string;
        const from = [...new Set(list.map((i) => i.version))].sort(compareVersions);
        const head = list[0] as RankedItem;
        const majorBump = from.some((v) => isBreaking(v, to));
        const base = { name: head.name, ecosystem: head.ecosystem, from, to, relation, majorBump };
        const c = commandFor(manager, base, file);
        if (c.finally) fin.add(c.finally);
        return {
          ...base,
          tier: list.map((i) => i.tier).sort((a, b) => TIERS.indexOf(a) - TIERS.indexOf(b))[0] as Tier,
          closes: [...new Set(list.flatMap((i) => (i.cves.length ? i.cves : i.ghsas)))],
          command: c.command,
          edit: c.edit,
          note: [majorBump ? `major upgrade from ${from.join(", ")}: read the changelog` : undefined, c.note].filter(Boolean).join("; ") || undefined,
        };
      };
      for (const list of groups.values()) {
        // Newest locked version first: a direct dependency is the one the project declares.
        list.sort((a, b) => compareVersions(b.version, a.version));
        const relation = list.map((i) => i.relation).reduce(bestRel);
        let rest = list;
        if (isDirect(relation)) {
          const top = list.filter((i) => i.version === list[0]?.version);
          steps.push(stepOf(top, relation));
          rest = list.filter((i) => !top.includes(i));
        }
        if (!rest.length) continue;
        // Older copies pulled in by other packages: one override per locked version, each to its own fix,
        // so a 3.x copy moves to the fixed 3.x and not to the newest major. Name-only overrides take the highest.
        if (PER_VERSION.has(manager))
          for (const v of [...new Set(rest.map((i) => i.version))])
            steps.push(
              stepOf(
                rest.filter((i) => i.version === v),
                "transitive",
              ),
            );
        else steps.push(stepOf(rest, isDirect(relation) ? "transitive" : relation));
      }
      steps.sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.name.localeCompare(b.name));
      lockfiles.push({
        lockfile: file,
        dir: dirname(file),
        manager,
        steps,
        finally: [...fin],
        unfixed: wanted
          .filter((i) => !i.fix)
          .map((i) => ({ tier: i.tier, name: i.name, version: i.version, ids: i.unfixed.length ? i.unfixed : [...i.cves, ...i.ghsas] })),
        p3: items.length - wanted.length,
      });
    }
    return { root: p.root, name: p.name, kind: p.kind, mainRepo: p.mainRepo, lockfiles: lockfiles.filter((l) => l.steps.length || l.unfixed.length || l.p3) };
  });
}

const REL_WORD: Record<Relation, string> = { direct: "direct", dev: "dev-only, lower risk", transitive: "transitive", unknown: "relation unknown" };

/** The plan as Markdown: FIXES.md, and what `ultraguard fixes` prints. */
export function renderFixes(plans: ProjectPlan[], r: RankedVulns): string {
  const out: string[] = [
    "# Fix plan",
    "",
    "`fixes` runs none of these commands. Once the user asks to fix a project: `ultraguard fix --out <run> --project <path>` shows what it would do, and `--apply` runs them in a new worktree and branch, re-checks the lockfiles, runs the tests and commits there (never pushes).",
    "",
    `Closes the P0-P2 vulnerabilities (P0 in CISA KEV, P1 EPSS >= 10% or critical, P2 high) with the smallest version that fixes every advisory. ${r.counts.P0} P0, ${r.counts.P1} P1, ${r.counts.P2} P2, ${r.counts.P3} P3 on this machine.`,
    "",
  ];
  if (!plans.length) out.push("No project of yours locks a vulnerable package version.", "");
  for (const p of plans) {
    const steps = p.lockfiles.reduce((n, l) => n + l.steps.length, 0);
    out.push(`## ${p.name}: \`${p.root}\``, "");
    if (p.kind !== "own")
      out.push(
        p.kind === "fixture"
          ? "These are test fixtures, vulnerable on purpose: nothing to fix."
          : `This is ${p.kind === "worktree" ? `a git worktree${p.mainRepo ? ` of \`${p.mainRepo}\`` : ""}: fix the main checkout` : `a ${p.kind} folder: update the tool that owns it`} rather than this copy.`,
        "",
      );
    if (!steps && !p.lockfiles.some((l) => l.unfixed.length)) out.push("Nothing at P0-P2.", "");
    for (const l of p.lockfiles) {
      if (!l.steps.length && !l.unfixed.length) {
        out.push(`- \`${relative(p.root, l.lockfile) || basename(l.lockfile)}\`: ${l.p3} P3 only, no plan`, "");
        continue;
      }
      out.push(`### \`${relative(p.root, l.lockfile) || basename(l.lockfile)}\` (${l.manager})`, "");
      for (const s of l.steps)
        out.push(
          `- **${s.tier}** ${s.name} ${s.from.join(", ")} -> ${s.to} (${REL_WORD[s.relation]}): closes ${s.closes.slice(0, 4).join(", ")}${s.closes.length > 4 ? ` and ${s.closes.length - 4} more` : ""}${s.note ? `. ${s.note}` : ""}`,
        );
      for (const u of l.unfixed)
        out.push(`- **${u.tier}** ${u.name} ${u.version}: no fixed version yet (${u.ids.slice(0, 4).join(", ")}): watch the advisory, or replace the package`);
      if (l.steps.length) {
        out.push("", "```sh", `cd ${l.dir}`);
        for (const s of l.steps) if (!s.edit) out.push(s.command);
        // The edits, one block per file: every override at once, then the install.
        const edits = new Map<string, string[]>();
        for (const s of l.steps) if (s.edit) edits.set(s.edit.where, [...(edits.get(s.edit.where) ?? []), s.edit.entry]);
        for (const [where, entries] of edits) out.push(`# edit ${where}:`, ...entries.map((e) => `#   ${e}`));
        for (const f of l.finally) out.push(f);
        out.push("```");
      }
      if (l.p3) out.push("", `${l.p3} P3 item(s) left out: vulnerabilities.json`);
      out.push("");
    }
  }
  return out.join("\n");
}
