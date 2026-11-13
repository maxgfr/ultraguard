// scan github: your account, and every repository you can push to.
//
// Two different questions, kept apart (invariant I4):
//  - github:account — did YOUR login do something an IOC describes (open a
//    probe PR anywhere, push an attacker branch, author an attacker commit)?
//    That means your credentials are in someone else's hands.
//  - github:repos — did ANYONE do it in a repository you can write to? A
//    collaborator's stolen token running a stealer in your org's CI exposes the
//    secrets that CI holds, even when your own account is clean.
import { inWindow, type Matcher, matchers, reviewStart, windowStart } from "../ioc.js";
import { mapPool } from "../pool.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";
import { Gh, type GhList } from "./gh.js";

type NewFinding = Omit<Finding, "id">;

export interface GithubScanOptions {
  concurrency?: number;
  /** Only these repositories (owner/name). */
  repos?: string[];
  maxRepos?: number;
  now?: Date;
  /** Injected so tests do not wait for the search rate limit to reset. */
  sleep?: (ms: number) => Promise<void>;
}

export interface GithubScanResult {
  login?: string;
  account: { result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] };
  repos: { result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] };
  hitRepos: string[];
}

interface Repo {
  full_name: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  owner?: { login?: string };
  archived: boolean;
  pushed_at: string | null;
  default_branch: string;
  permissions?: { push?: boolean; admin?: boolean };
}

const firstLine = (s: string | undefined | null) => (s ?? "").split("\n")[0] ?? "";

/** The smallest activity-log period that still covers the window. */
const activityPeriod = (since: string, now: Date): string => {
  const days = (now.getTime() - Date.parse(since)) / 86_400_000;
  return days <= 1 ? "day" : days <= 7 ? "week" : days <= 31 ? "month" : days <= 92 ? "quarter" : "year";
};

/** How long from `a` to `b`, in words. */
const elapsed = (a: string, b: string): string => {
  const s = Math.max(0, (Date.parse(b) - Date.parse(a)) / 1000);
  return s < 120 ? `${Math.round(s)} s` : s < 7200 ? `${Math.round(s / 60)} min` : s < 172_800 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86_400)} days`;
};

/** The later of two ISO dates (author vs committer), or whichever exists. */
const laterOf = (a?: string | null, b?: string | null): string | undefined => (a && b ? (a > b ? a : b) : (a ?? b ?? undefined));

/** Paths a probe commit touches: docs and text only, nothing that runs. */
// Text documents only: a .txt can be requirements.txt, a docs/ folder can hold conf.py or package.json.
const DOCS_ONLY = /\.(md|mdx|rst|adoc)$|(^|\/)(README|CHANGELOG|LICENSE|NOTICE|AUTHORS)(\.(md|txt|rst))?$/i;

function hit(m: Matcher, base: Omit<NewFinding, "campaign" | "source" | "indicator" | "key" | "severity"> & { severity?: Finding["severity"] }): NewFinding {
  return {
    severity: m.indicator.weak ? "suspicious" : "compromised",
    ...base,
    campaign: m.campaign.id,
    source: m.indicator.source,
    indicator: { type: m.indicator.type, value: m.indicator.value },
    key: `${base.surface}|${base.subject}|${m.indicator.type}:${m.indicator.value}|${base.evidence.ref}`,
  };
}

/** REST calls an active repository costs at most, and an inactive one (PRs only). */
const COST_ACTIVE = 16;
const COST_INACTIVE = 1;

/** The query-free path, for grouping failures by what they read. */
const basePath = (p: string) => p.split("?")[0] ?? p;
/** Paths that read a repository rather than the account. */
const REPO_PATH = /^(repos\/|repositories\/|user\/repos|search\/code)/;

/** The first indicator that matches `value`, counting only campaigns whose own window holds `at`. */
function firstMatch(ms: Matcher[], value: string | undefined | null, at?: string | null): Matcher | undefined {
  if (!value) return undefined;
  return ms.find((m) => inWindow(m, at) && m.test(value));
}

export async function scanGithub(iocs: IocFile, runner: Runner, opts: GithubScanOptions = {}): Promise<GithubScanResult> {
  const gh = new Gh(runner, undefined, opts.sleep);
  const now = opts.now ?? new Date();
  const since = windowStart(iocs);
  const sinceDay = since.slice(0, 10);
  // Changes that match no indicator are reviewed over 30 days at most.
  const reviewSince = reviewStart(iocs, now);
  const accountRes: SurfaceResult = { surface: "github:account", scanned: false, stats: {}, startedAt: now.toISOString() };
  const reposRes: SurfaceResult = { surface: "github:repos", scanned: false, stats: {}, startedAt: now.toISOString() };
  const accF: NewFinding[] = [];
  const accG: Gap[] = [];
  const repF: NewFinding[] = [];
  const repG: Gap[] = [];

  const M = {
    branch: matchers(iocs, "branch"),
    pr: matchers(iocs, "pr_title"),
    commit: matchers(iocs, "commit_message"),
    file: matchers(iocs, "file"),
    workflow: matchers(iocs, "workflow_file"),
    content: matchers(iocs, "string", "ip", "domain", "url"),
    cache: matchers(iocs, "cache_key_prefix"),
    artifact: matchers(iocs, "artifact_prefix"),
    actor: matchers(iocs, "actor"),
    repoName: matchers(iocs, "repo_name"),
    repoDesc: matchers(iocs, "repo_description"),
    runner: matchers(iocs, "runner_name"),
  };

  // Literal branch names can be asked for directly (activity log, runs): one exact, complete call each.
  const literalBranches = [...new Set(M.branch.filter((m) => !m.indicator.regex).map((m) => m.indicator.value))];
  const period = activityPeriod(since, now);

  const me = await gh.api<{ login: string }>("user");
  if (!me.ok || !me.data) {
    const why = me.status === 0 ? (me.error ?? "gh failed") : `HTTP ${me.status}`;
    const gap = { what: "the whole GitHub surface", why, fix: "gh auth login" };
    return {
      account: { result: accountRes, findings: [], gaps: [{ surface: "github:account", ...gap }] },
      repos: { result: reposRes, findings: [], gaps: [{ surface: "github:repos", ...gap }] },
      hitRepos: [],
    };
  }
  const login = me.data.login;
  // Paths whose failure already has its own gap: not counted again in the generic failed-reads gap.
  const reported = new Set(["user", "rate_limit"]);
  /** The gap for a list read in part (a later page failed) or not at all. */
  const listGap = (gaps: Gap[], surface: Gap["surface"], what: string, res: GhList<unknown>, base: string, fix?: string) => {
    reported.add(base);
    if (!res.ok) gaps.push({ surface, what, why: res.error ?? `HTTP ${res.status}`, ...(fix ? { fix } : {}) });
    else if (res.partial)
      gaps.push({
        surface,
        what: `${what} past the first ${res.data?.length ?? 0}`,
        why: `page ${res.partial.page} failed: ${res.partial.error ?? "error"}`,
        fix: res.partial.rateLimited
          ? "re-run scan github in a minute (search calls reset each minute, the rest each hour: gh api rate_limit)"
          : (fix ?? "re-run scan github"),
      });
  };
  // Every account read that was attempted, and whether it answered: none answering is not a scan.
  const accountReads: boolean[] = [];
  const scopeOf = (actor?: string): "own" | "other" | undefined => (actor ? (actor.toLowerCase() === login.toLowerCase() ? "own" : "other") : undefined);

  // ---- Account ---------------------------------------------------------------
  const scopes = await gh.scopes();
  if (scopes && !scopes.includes("repo"))
    accG.push({
      surface: "github:account",
      what: "private repositories",
      why: `token scopes are ${scopes.join(", ") || "none"}`,
      fix: "gh auth refresh -s repo",
    });
  accG.push({
    surface: "github:account",
    what: "the account security log (sign-ins, token creation, OAuth grants)",
    why: "GitHub exposes it to the web UI, not to a personal token",
    fix: "open https://github.com/settings/security-log and https://github.com/settings/applications",
  });

  // PRs your login opened anywhere on GitHub: the probe PR lands in repos you do not own.
  if (M.pr.length) {
    const q = encodeURIComponent(`author:${login} type:pr created:>=${sinceDay}`);
    let incomplete = false;
    const prs = await gh.paged<any>(`search/issues?q=${q}`, {
      pick: (b) => {
        incomplete ||= !!b.incomplete_results;
        return b.items ?? [];
      },
      maxPages: 10,
    });
    accountReads.push(prs.ok);
    accountRes.stats.prsSearched = prs.data?.length ?? 0;
    listGap(accG, "github:account", "pull requests you opened", prs, "search/issues");
    if (prs.truncated && !prs.partial)
      accG.push({ surface: "github:account", what: "pull requests past the first 1,000", why: "search caps at 1,000 results" });
    if (incomplete)
      accG.push({
        surface: "github:account",
        what: "part of the pull requests you opened",
        why: "GitHub search timed out (incomplete_results)",
        fix: "re-run scan github",
      });
    for (const pr of prs.data ?? []) {
      const m = firstMatch(M.pr, pr.title, pr.created_at);
      if (!m) continue;
      const repo = String(pr.repository_url ?? "").replace("https://api.github.com/repos/", "");
      accF.push(
        hit(m, {
          surface: "github:account",
          subject: repo,
          title: `Your account opened PR "${pr.title}" in ${repo}`,
          actor: login,
          scope: "own",
          at: pr.created_at,
          evidence: { kind: "url", ref: pr.html_url, excerpt: `state=${pr.state}` },
        }),
      );
    }
  }

  // Commits your login authored since the window, on default branches GitHub indexes.
  if (M.commit.length) {
    // The committer date is when it landed: an author date can be backdated out of the window.
    const q = encodeURIComponent(`author:${login} committer-date:>=${sinceDay}`);
    let incomplete = false;
    const commits = await gh.paged<any>(`search/commits?q=${q}`, {
      pick: (b) => {
        incomplete ||= !!b.incomplete_results;
        return b.items ?? [];
      },
      maxPages: 10,
    });
    accountReads.push(commits.ok);
    accountRes.stats.commitsSearched = commits.data?.length ?? 0;
    listGap(accG, "github:account", "commits you authored", commits, "search/commits");
    if (incomplete)
      accG.push({
        surface: "github:account",
        what: "part of the commits you authored",
        why: "GitHub search timed out (incomplete_results)",
        fix: "re-run scan github",
      });
    if (commits.truncated && !commits.partial)
      accG.push({
        surface: "github:account",
        what: "commits you authored past the first 1,000",
        why: "search caps at 1,000 results; per-repository commits are still read below",
      });
    for (const c of commits.data ?? []) {
      const msg = firstLine(c.commit?.message);
      const m = firstMatch(M.commit, msg, laterOf(c.commit?.author?.date, c.commit?.committer?.date));
      if (!m) continue;
      const repo = c.repository?.full_name ?? "?";
      accF.push(
        hit(m, {
          surface: "github:account",
          subject: repo,
          title: `Your account authored commit "${msg}" in ${repo}`,
          actor: login,
          scope: "own",
          at: c.commit?.author?.date,
          evidence: { kind: "url", ref: c.html_url },
        }),
      );
    }
  }

  // Branches your login created or pushed, and repositories it created or made public, from the
  // public event stream (90 days, 300 events): it still shows an exfiltration repository already deleted.
  {
    const events = await gh.paged<any>(`users/${login}/events`, { maxPages: 3 });
    accountReads.push(events.ok);
    accountRes.stats.events = events.data?.length ?? 0;
    listGap(accG, "github:account", "your public events (branches and repositories you created, repositories made public)", events, `users/${login}/events`);
    for (const e of events.data ?? []) {
      if (e.created_at < since) continue;
      const repoName = String(e.repo?.name ?? "?");
      if ((e.type === "CreateEvent" && e.payload?.ref_type === "repository") || e.type === "PublicEvent") {
        const verb = e.type === "PublicEvent" ? "made public" : "created";
        const m = firstMatch(M.repoName, repoName.split("/").pop(), e.created_at);
        if (m)
          accF.push(
            hit(m, {
              surface: "github:account",
              subject: repoName,
              title: `Your account ${verb} repository ${repoName}`,
              actor: login,
              scope: "own",
              at: e.created_at,
              evidence: { kind: "api", ref: `users/${login}/events`, excerpt: `${e.type} ${repoName}` },
            }),
          );
        // A private repository turned public is rare, and how stolen secrets get published.
        else if (e.type === "PublicEvent" && e.created_at >= reviewSince)
          accF.push({
            surface: "github:account",
            severity: "suspicious",
            subject: repoName,
            title: `Your account made repository ${repoName} public at ${e.created_at}: is it yours, and meant to be public?`,
            actor: login,
            scope: "own",
            at: e.created_at,
            evidence: { kind: "api", ref: `users/${login}/events`, excerpt: `PublicEvent ${repoName}` },
            key: `github:account|public|${repoName}|${e.id ?? e.created_at}`,
          });
        continue;
      }
      const ref = String(e.payload?.ref ?? "").replace(/^refs\/heads\//, "");
      if (!ref || (e.type !== "CreateEvent" && e.type !== "PushEvent")) continue;
      const m = firstMatch(M.branch, ref, e.created_at);
      if (!m) continue;
      accF.push(
        hit(m, {
          surface: "github:account",
          subject: e.repo?.name ?? "?",
          title: `Your account ${e.type === "CreateEvent" ? "created" : "pushed to"} branch ${ref} in ${e.repo?.name}`,
          actor: login,
          scope: "own",
          at: e.created_at,
          evidence: { kind: "api", ref: `users/${login}/events`, excerpt: `${e.type} ${ref}` },
        }),
      );
    }
  }

  // Keys, webhooks and deploy keys are rare events: compare them with the campaign window
  // (bounded at 180 days), not with the 30-day review cap meant for host installs.
  const keySince = reviewStart(iocs, now, 180);
  if (keySince > since)
    for (const [surface, gaps] of [
      ["github:account", accG],
      ["github:repos", repG],
    ] as const)
      gaps.push({
        surface,
        what: `keys, webhooks and deploy keys added between ${sinceDay} and ${keySince.slice(0, 10)}`,
        why: "not listed: the review of changes that match no indicator stops 180 days back",
      });

  // Keys added in the window: the classic persistence step after a token theft.
  for (const [path, label] of [
    ["user/keys", "SSH key"],
    ["user/gpg_keys", "GPG key"],
  ] as const) {
    const keys = await gh.paged<any>(path, { maxPages: 5 });
    accountReads.push(keys.ok);
    reported.add(path);
    if (keys.partial) listGap(accG, "github:account", `${label}s added to your account`, keys, path);
    if (!keys.ok) {
      const scope = path === "user/keys" ? "read:public_key" : "read:gpg_key";
      accG.push({
        surface: "github:account",
        what: `${label}s added to your account`,
        why:
          keys.status === 404 || (keys.status === 403 && !/rate limit/i.test(keys.error ?? ""))
            ? `the token lacks the ${scope} scope (${keys.error ?? `HTTP ${keys.status}`})`
            : (keys.error ?? `HTTP ${keys.status}`),
        fix: `gh auth refresh -s ${scope}`,
      });
      continue;
    }
    accountRes.stats[path === "user/keys" ? "sshKeys" : "gpgKeys"] = keys.data?.length ?? 0;
    for (const k of keys.data ?? []) {
      if (!k.created_at || k.created_at < keySince) continue;
      accF.push({
        surface: "github:account",
        severity: "suspicious",
        subject: login,
        title: `${label} "${k.title ?? k.key_id}" was added during the campaign window`,
        at: k.created_at,
        evidence: { kind: "api", ref: path, excerpt: `id=${k.id} created_at=${k.created_at}` },
        key: `github:account|${path}|${k.id}`,
      });
    }
  }
  accountRes.scanned = accountReads.some(Boolean);
  if (!accountRes.scanned)
    accG.push({
      surface: "github:account",
      what: "your account",
      why: "every account read failed: nothing was looked at",
      fix: "check gh auth status and gh api rate_limit, then re-run scan github",
    });
  accountRes.finishedAt = new Date().toISOString();

  // ---- Repositories you can push to -------------------------------------------
  let repos: Repo[];
  let allListed: Repo[] | undefined;
  let listed = true;
  if (opts.repos?.length) {
    const got = await mapPool(opts.repos, 8, (r) => gh.api<Repo>(`repos/${r}`));
    repos = got.filter((g) => g.ok && g.data).map((g) => g.data as Repo);
    for (const [i, g] of got.entries())
      if (!g.ok) {
        reported.add(`repos/${opts.repos[i]}`);
        repG.push({ surface: "github:repos", what: opts.repos[i] as string, why: g.error ?? `HTTP ${g.status}` });
      }
    listed = repos.length > 0;
  } else {
    const list = await gh.paged<Repo>("user/repos?affiliation=owner,collaborator,organization_member", { maxPages: 50 });
    listGap(repG, "github:repos", "the list of your repositories", list, "user/repos");
    listed = list.ok;
    allListed = list.data ?? [];
    repos = allListed.filter((r) => r.permissions?.push && !r.archived);
    // The most recently pushed first: a cap or a rate limit then spends the budget where an attack can be.
    repos.sort((a, b) => String(b.pushed_at ?? "").localeCompare(String(a.pushed_at ?? "")));
  }
  const isActive = (r: Repo) => !!r.pushed_at && r.pushed_at >= since;
  // Exfiltration repositories (Shai-Hulud, s1ngularity): by name or description, on every listed
  // repository, not only those you can push to.
  const seenRepos = opts.repos?.length ? repos : (allListed ?? []);
  for (const x of seenRepos) {
    const name = x.name ?? x.full_name.split("/").pop() ?? "";
    const m = firstMatch(M.repoName, name, x.created_at) ?? firstMatch(M.repoDesc, x.description, x.created_at);
    if (!m) continue;
    const mine = (x.owner?.login ?? x.full_name.split("/")[0])?.toLowerCase() === login.toLowerCase();
    (mine ? accF : repF).push(
      hit(m, {
        surface: mine ? "github:account" : "github:repos",
        subject: x.full_name,
        title: `Repository ${x.full_name}${x.description ? ` ("${firstLine(x.description).slice(0, 120)}")` : ""}, created ${x.created_at ?? "?"}`,
        at: x.created_at,
        evidence: { kind: "url", ref: `https://github.com/${x.full_name}` },
      }),
    );
  }
  // New repositories on your account: one line of context, never one REVIEW item each.
  const created = seenRepos.filter(
    (x) => (x.owner?.login ?? x.full_name.split("/")[0])?.toLowerCase() === login.toLowerCase() && x.created_at && x.created_at >= reviewSince,
  );
  if (created.length)
    accF.push({
      surface: "github:account",
      severity: "info",
      subject: login,
      title: `${created.length} repositories created on your account since ${reviewSince.slice(0, 10)}: ${created
        .slice(0, 8)
        .map((x) => x.full_name)
        .join(", ")}${created.length > 8 ? ", ..." : ""}`,
      evidence: { kind: "api", ref: "user/repos?sort=created" },
      key: `github:account|new-repos|${created
        .map((x) => x.full_name)
        .sort()
        .join(",")}`,
    });
  if (opts.maxRepos && repos.length > opts.maxRepos) {
    const skipped = repos.slice(opts.maxRepos);
    repG.push({
      surface: "github:repos",
      what: `${skipped.length} repositories past --max-repos (${skipped.filter(isActive).length} pushed to since ${sinceDay})`,
      why: "capped by the caller",
    });
    repos = repos.slice(0, opts.maxRepos);
  }
  reposRes.stats.repos = repos.length;

  let inactive = 0;
  let noAdmin = 0;
  let quietGaps = 0;
  let inactiveRan = 0;
  const contentCapped: string[] = [];
  const pkgCapped: string[] = [];
  const treeCut: string[] = [];
  const rate = await gh.api<any>("rate_limit");
  const remaining = rate.data?.resources?.core?.remaining as number | undefined;
  const resetEpoch = rate.data?.resources?.core?.reset as number | undefined;
  const resetAt = resetEpoch ? new Date(resetEpoch * 1000).toISOString() : undefined;
  const activeCount = repos.filter(isActive).length;
  const perActive = COST_ACTIVE + literalBranches.length * 2;
  const perInactive = COST_INACTIVE + (M.content.length || M.workflow.length ? 1 : 0);
  // Webhooks and deploy keys are read on every repository you administer.
  const admins = repos.filter((x) => x.permissions?.admin).length;
  const cost = activeCount * perActive + (repos.length - activeCount) * perInactive + admins * 3;
  if (remaining !== undefined && remaining < cost)
    repG.push({
      surface: "github:repos",
      what: "part of the repositories may hit the API rate limit",
      why: `${remaining} REST calls left this hour; ${repos.length} repositories need up to ${cost} (about ${perActive} per repository pushed since ${sinceDay}, ${perInactive} per other, 3 more per one you administer)`,
      fix: `wait for the reset${resetAt ? ` at ${resetAt}` : ""}, or narrow with --repos`,
    });
  const truncated: string[] = [];
  // Repositories not started because the hourly budget ran out: named, so the user can re-run just them.
  const notStarted: string[] = [];
  const poolStart = gh.log.length;
  await mapPool(repos, opts.concurrency ?? 8, async (repo) => {
    const r = repo.full_name;
    if (gh.coreRateLimited > 0) {
      notStarted.push(r);
      return;
    }
    const add = (f: NewFinding) => repF.push(f);
    const active = isActive(repo);
    // A login a source names as compromised, active here under names the source did not list.
    let actorOnlyCount = 0;
    const actorOnly = (what: string, actor: string | undefined, at: string | undefined, ref: string) => {
      const m = firstMatch(M.actor, actor, at);
      if (!m || actorOnlyCount >= 5 || (at && at < since)) return;
      actorOnlyCount++;
      add(
        hit(m, {
          severity: "suspicious",
          surface: "github:repos",
          subject: r,
          title: `${what} by ${actor} (named compromised by ${m.indicator.source})`,
          actor,
          scope: scopeOf(actor),
          at,
          evidence: { kind: "url", ref },
        }),
      );
    };

    // The default branch's whole tree in one call. GitHub cuts trees past about 100,000 entries:
    // then the workflow folder and the root are listed as well.
    const blobUrl = (path: string) =>
      `https://github.com/${r}/blob/${encodeURIComponent(repo.default_branch)}/${path.split("/").map(encodeURIComponent).join("/")}`;
    const treeOf = async (): Promise<string[]> => {
      const t = await gh.api<any>(`repos/${r}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
      const paths: string[] = ((t.data?.tree ?? []) as { path: string; type: string }[]).filter((e) => e.type === "blob").map((e) => e.path);
      if (!t.data?.truncated) return paths;
      treeCut.push(r);
      for (const dir of [".github/workflows", ""]) {
        const list = await gh.api<any[]>(`repos/${r}/contents/${dir}`);
        for (const e of Array.isArray(list.data) ? list.data : []) if (e.type === "file" && !paths.includes(e.path)) paths.push(e.path);
      }
      return paths;
    };
    const isWorkflow = (p: string) => /^\.github\/workflows\/[^/]+$/.test(p);
    /** Workflow file names and contents. `note` says why an inactive repository's files were read. */
    const scanWorkflows = async (paths: string[], note = "") => {
      // Composite actions run in CI too: their action.yml is read like a workflow.
      const runnable = paths.filter((p) => isWorkflow(p) || /^\.github\/actions\/(.+\/)?action\.ya?ml$/.test(p));
      for (const p of runnable) {
        const m = firstMatch(M.workflow, p) ?? firstMatch(M.file, p);
        if (m)
          add(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `Workflow file ${p} on ${repo.default_branch}${note}`,
              evidence: { kind: "url", ref: blobUrl(p) },
            }),
          );
      }
      if (!M.content.length) return;
      if (runnable.length > 25) contentCapped.push(`${r} (${runnable.length} workflow files)`);
      for (const p of runnable.slice(0, 25)) {
        const body = await gh.api<any>(`repos/${r}/contents/${p.split("/").map(encodeURIComponent).join("/")}`);
        const text = body.data?.content ? Buffer.from(body.data.content, "base64").toString("utf8") : "";
        const lines = text.split("\n");
        for (const m of M.content) {
          const ln = lines.findIndex((l) => m.test(l));
          if (ln < 0) continue;
          add(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `${p} contains "${m.indicator.value}"${note}`,
              evidence: { kind: "url", ref: `${blobUrl(p)}#L${ln + 1}`, excerpt: lines[ln]?.trim().slice(0, 200) },
            }),
          );
        }
      }
    };
    /** Every file of the tree against file IOCs, the workflows, and every package.json's install hooks. */
    const scanFiles = async (paths: string[]) => {
      await scanWorkflows(paths);
      for (const p of paths) {
        if (/^\.github\//.test(p) && (isWorkflow(p) || /action\.ya?ml$/.test(p))) continue;
        const m = firstMatch(M.file, p) ?? (p.startsWith(".github/") ? firstMatch(M.workflow, p) : undefined);
        if (m) add(hit(m, { surface: "github:repos", subject: r, title: `File ${p} on ${repo.default_branch}`, evidence: { kind: "url", ref: blobUrl(p) } }));
      }
      // Install hooks: the npm variant drops a script and wires it to postinstall.
      if (!M.file.length && !M.content.length) return;
      const pkgs = paths.filter((p) => /(^|\/)package\.json$/.test(p) && !/(^|\/)node_modules\//.test(p));
      if (pkgs.length > 20) pkgCapped.push(`${r} (${pkgs.length} package.json files)`);
      for (const p of pkgs.slice(0, 20)) {
        const pkg = await gh.api<any>(`repos/${r}/contents/${p.split("/").map(encodeURIComponent).join("/")}`);
        const text = pkg.data?.content ? Buffer.from(pkg.data.content, "base64").toString("utf8") : "";
        try {
          const scripts = (JSON.parse(text).scripts ?? {}) as Record<string, string>;
          for (const hook of ["preinstall", "install", "postinstall", "prepare"]) {
            const cmd = scripts[hook];
            if (!cmd) continue;
            const m = M.file.find((x) => cmd.split(/[\s;&|]+/).some((tok) => x.test(tok))) ?? firstMatch(M.content, cmd);
            if (m)
              add(
                hit(m, {
                  surface: "github:repos",
                  subject: r,
                  title: `${p} "${hook}" runs "${cmd}"`,
                  evidence: { kind: "url", ref: pkg.data?.html_url ?? blobUrl(p), excerpt: cmd },
                }),
              );
          }
        } catch {
          // Not JSON: nothing an install hook could run from.
        }
      }
    };

    // Webhooks and deploy keys created in the window: persistence that survives a token rotation and
    // needs no push, so they are read on every repository, active or not.
    if (repo.permissions?.admin) {
      for (const [path, label] of [
        ["hooks", "Webhook"],
        ["keys", "Deploy key"],
      ] as const) {
        const items = await gh.paged<any>(`repos/${r}/${path}`, { maxPages: 5 });
        for (const it of items.data ?? []) {
          if (!it.created_at || it.created_at < keySince) continue;
          add({
            surface: "github:repos",
            severity: "suspicious",
            subject: r,
            title: `${label} added in the window: ${label === "Webhook" ? it.config?.url : it.title}`,
            at: it.created_at,
            evidence: { kind: "api", ref: `repos/${r}/${path}/${it.id}` },
            key: `github:repos|${r}|${path}|${it.id}`,
          });
        }
      }
      // Self-hosted runners: Shai-Hulud 2.0 registers the infected machine as one (SHA1HULUD).
      const runners = await gh.paged<any>(`repos/${r}/actions/runners`, { pick: (b) => b.runners ?? [], maxPages: 3 });
      const plain: string[] = [];
      for (const rn of runners.data ?? []) {
        const name = String(rn.name ?? "");
        const m =
          firstMatch(M.runner, name) ??
          M.content.find((x) => x.indicator.type === "string" && x.indicator.value.trim().toLowerCase() === name.trim().toLowerCase());
        if (m)
          add(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `Self-hosted runner "${name}" is registered (${rn.os ?? "?"}, ${rn.status ?? "?"})`,
              evidence: { kind: "api", ref: `repos/${r}/actions/runners/${rn.id}` },
            }),
          );
        else plain.push(`${name} (${rn.os ?? "?"}, ${rn.status ?? "?"})`);
      }
      if (plain.length)
        add({
          surface: "github:repos",
          severity: "info",
          subject: r,
          title: `Self-hosted runner(s) registered: ${plain.slice(0, 5).join(", ")}${plain.length > 5 ? ", ..." : ""}`,
          evidence: { kind: "api", ref: `repos/${r}/actions/runners` },
          key: `github:repos|${r}|runners|${(runners.data ?? []).map((x: any) => x.id).join(",")}`,
        });
    } else noAdmin++;

    // Pull requests: a fork PR does not move pushed_at, so check them on every repo.
    if (M.pr.length || M.branch.length || M.actor.length) {
      const prs = await gh.paged<any>(`repos/${r}/pulls?state=all&sort=created&direction=desc`, {
        maxPages: 3,
        stop: (page) => page.some((p) => p.created_at < since),
      });
      for (const pr of prs.data ?? []) {
        if (pr.created_at < since) continue;
        const m = firstMatch(M.pr, pr.title, pr.created_at) ?? firstMatch(M.branch, pr.head?.ref, pr.created_at);
        const actor = pr.user?.login;
        if (!m) {
          actorOnly(`PR #${pr.number} "${pr.title}" (branch ${pr.head?.ref})`, actor, pr.created_at, pr.html_url);
          continue;
        }
        add(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `PR #${pr.number} "${pr.title}" (branch ${pr.head?.ref}) by ${actor}`,
            actor,
            scope: scopeOf(actor),
            at: pr.created_at,
            evidence: { kind: "url", ref: pr.html_url, excerpt: `state=${pr.state}` },
          }),
        );
      }
    }

    if (!active) {
      inactive++;
      // A moved action tag (tj-actions, trivy-action) changes nothing in the repository: a workflow
      // that only ran on a schedule or by hand still executed it. Read the workflows when any ran.
      if (M.content.length || M.workflow.length) {
        const ran = await gh.api<any>(`repos/${r}/actions/runs?created=>=${sinceDay}&per_page=1`);
        const n = Number(ran.data?.total_count ?? 0);
        if (n > 0) {
          inactiveRan++;
          await scanWorkflows(await treeOf(), ` (${n} run(s) since ${sinceDay})`);
        }
      }
      return;
    }

    // What a commit changed, once per SHA: it tells a probe (a docs file) from a payload (a script, an install hook).
    type CommitInfo = { files: string[]; author?: string; message: string };
    const changed = new Map<string, Promise<CommitInfo | undefined>>();
    const commitOf = (sha: string) => {
      if (!changed.has(sha))
        changed.set(
          sha,
          gh.api<any>(`repos/${r}/commits/${sha}`).then((d) =>
            d.ok
              ? {
                  files: ((d.data?.files ?? []) as { filename: string; status: string }[]).map((f) => `${f.status} ${f.filename}`),
                  author: d.data?.author?.login as string | undefined,
                  message: firstLine(d.data?.commit?.message),
                }
              : undefined,
          ),
        );
      return changed.get(sha) as Promise<CommitInfo | undefined>;
    };
    const filesOf = async (sha: string) => (await commitOf(sha))?.files;
    const fileName = (f: string) => f.split(" ").slice(1).join(" ");
    /** `tip` (default: the default branch now) already contains the commit. */
    const onDefault = async (sha: string, tip = repo.default_branch) => {
      const cmp = await gh.api<any>(`repos/${r}/compare/${sha}...${tip}`);
      return cmp.ok && (cmp.data?.status === "identical" || cmp.data?.status === "ahead");
    };
    // The default branch's activity log: who pushed what, and where the branch pointed at a given time.
    // The pusher is recorded by GitHub, unlike a commit's author, which is free text.
    let defaultLog: Promise<any[] | undefined> | undefined;
    const defaultActivity = () =>
      (defaultLog ??= gh
        .cursor<any>(`repos/${r}/activity?ref=${encodeURIComponent(`refs/heads/${repo.default_branch}`)}&time_period=${period}`, {
          maxPages: 5,
          stop: (page) => page.some((e) => e.timestamp && e.timestamp < since),
        })
        .then((x) => (x.ok ? x.data : undefined)));
    const pusherOf = async (sha: string): Promise<string | undefined> =>
      (await defaultActivity())?.find((e) => e.after === sha && e.activity_type !== "branch_deletion")?.actor?.login;
    /** The default branch's tip at `at`, from the activity log (newest first), when the log reaches that far. */
    const tipAt = async (at: string | undefined): Promise<string | undefined> => {
      if (!at) return undefined;
      return (await defaultActivity())?.find((e) => e.timestamp && e.timestamp <= at && e.after && !/^0+$/.test(e.after))?.after;
    };
    // What a commit or a run carried, as a structured kind (never parsed back from a title the attacker writes).
    type Carried = { text: string; kind?: "probe" | "own-code" | "attacker" };
    const describe = (files: string[] | undefined): Carried => {
      if (!files) return { text: "" };
      if (files.length && files.every((f) => DOCS_ONLY.test(fileName(f)))) return { text: "; the commit only changes docs (a probe)", kind: "probe" };
      return {
        text: files.length ? `; the commit changes ${files.slice(0, 4).map(fileName).join(", ")}${files.length > 4 ? ", ..." : ""}` : "",
        kind: "attacker",
      };
    };
    /**
     * For a run: what it executed. A commit by someone else that the default branch
     * already held when the run started is the repository's own code. Neither the
     * author (free text) nor today's default branch (the attacker's commit may
     * have been merged since) settles that, so the tip comes from the activity
     * log, and a commit that touches an IOC file or carries an IOC message never
     * counts as own code. Bot authors are not trusted either: a bot name is the
     * easiest to borrow.
     */
    const describeRun = async (sha: string | undefined, actor: string | undefined, at: string | undefined): Promise<Carried> => {
      if (!sha) return { text: "" };
      const c = await commitOf(sha);
      const carried = describe(c?.files);
      const iocInside = c?.files.some((f) => firstMatch(M.file, fileName(f)) || firstMatch(M.workflow, fileName(f))) || !!firstMatch(M.commit, c?.message);
      if (c?.author && actor && !iocInside && !/\[bot\]$/i.test(c.author) && c.author.toLowerCase() !== actor.toLowerCase()) {
        const tip = await tipAt(at);
        if (tip && (await onDefault(sha, tip)))
          return {
            text: `; it ran ${repo.default_branch}'s own code (commit by ${c.author}, already on ${repo.default_branch} when the run started)`,
            kind: "own-code",
          };
      }
      return carried;
    };

    if (M.branch.length) {
      const branches = await gh.paged<{ name: string }>(`repos/${r}/branches`, { maxPages: 10 });
      for (const b of branches.data ?? []) {
        const m = firstMatch(M.branch, b.name);
        if (m)
          add(
            hit(m, { surface: "github:repos", subject: r, title: `Branch ${b.name} exists`, evidence: { kind: "api", ref: `repos/${r}/branches/${b.name}` } }),
          );
      }
      // The repository activity log keeps branch creations, deletions and force pushes with their actor:
      // it finds the attacker branch the cleanup deleted, which no branch list shows any more. It is
      // cursor-paginated: a literal branch is asked for by ref (complete in one call), a regex by
      // listing branch creations back to the window start.
      const lists = await Promise.all([
        ...literalBranches.map((b) =>
          gh.cursor<any>(`repos/${r}/activity?ref=${encodeURIComponent(`refs/heads/${b}`)}&time_period=${period}`, { maxPages: 2 }),
        ),
        ...(M.branch.some((m) => m.indicator.regex)
          ? [
              gh.cursor<any>(`repos/${r}/activity?activity_type=branch_creation&time_period=${period}`, {
                maxPages: 5,
                stop: (page) => page.some((e) => e.timestamp && e.timestamp < since),
              }),
            ]
          : []),
      ]);
      const seen = new Set<string>();
      const byBranch = new Map<string, { m: Matcher; events: any[] }>();
      for (const ev of lists.flatMap((l) => l.data ?? [])) {
        const id = String(ev.id ?? `${ev.ref}|${ev.timestamp}|${ev.activity_type}|${ev.after}`);
        if (seen.has(id)) continue;
        seen.add(id);
        const name = String(ev.ref ?? "").replace(/^refs\/heads\//, "");
        if (!name || (ev.timestamp && ev.timestamp < since)) continue;
        const m = firstMatch(M.branch, name, ev.timestamp);
        if (!m) continue;
        const g = byBranch.get(name) ?? { m, events: [] };
        g.events.push(ev);
        byBranch.set(name, g);
      }
      // One finding per branch. Its actor is who created or pushed it: deleting the branch is cleanup,
      // and the one who cleaned up (often you or an org admin) is never named as the attacker.
      for (const [name, { m, events }] of byBranch) {
        events.sort((a, b) => String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? "")));
        const writes = events.filter((e) => e.activity_type !== "branch_deletion");
        const deletion = events.find((e) => e.activity_type === "branch_deletion");
        const first = writes[0];
        const actor: string | undefined = first?.actor?.login;
        let title = first
          ? `Branch ${name}: ${first.activity_type === "branch_creation" ? "created" : "pushed"} by ${actor ?? "?"} at ${first.timestamp}${writes.length > 1 ? `, pushed ${writes.length - 1} more time(s)` : ""}`
          : `Branch ${name}: deleted by ${deletion?.actor?.login ?? "?"} (creation not in the activity log)`;
        if (first && deletion)
          title += `, deleted by ${deletion.actor?.login ?? "?"}${deletion.actor?.login === actor ? "" : " (cleanup)"} ${elapsed(first.timestamp, deletion.timestamp)} later`;
        // What the branch pointed at: a commit already on the default branch means nothing was pushed.
        let ciRun: Carried["kind"];
        const shas = [...new Set(writes.map((e) => String(e.after ?? "")).filter((x) => x && !/^0+$/.test(x)))].slice(0, 3);
        for (const sha of shas) {
          if (await onDefault(sha)) {
            title += `; it points at a commit already on ${repo.default_branch}: no commit pushed`;
            continue;
          }
          const files = await filesOf(sha);
          if (!files) {
            title += `; its commit ${sha.slice(0, 8)} is no longer readable`;
            continue;
          }
          const c = describe(files);
          title += c.text;
          if (c.kind === "attacker" || (c.kind && !ciRun)) ciRun = c.kind;
        }
        add(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title,
            ...(ciRun ? { ciRun } : {}),
            actor,
            scope: scopeOf(actor),
            at: first?.timestamp ?? deletion?.timestamp,
            evidence: {
              kind: "api",
              ref: `repos/${r}/activity?ref=${encodeURIComponent(name)}`,
              excerpt: events
                .map(
                  (e) =>
                    `${e.timestamp} ${e.activity_type} by ${e.actor?.login ?? "?"} ${String(e.before ?? "").slice(0, 8)}..${String(e.after ?? "").slice(0, 8)}`,
                )
                .join("; ")
                .slice(0, 600),
            },
          }),
        );
      }
    }

    // Force pushes to the default branch rewrite history under the same messages and authors
    // (ForceMemo, GlassWorm): each one in the review window is for a human to judge, and its
    // diff is searched for content indicators.
    for (const e of (await defaultActivity()) ?? []) {
      if (e.activity_type !== "force_push" || !e.timestamp || e.timestamp < reviewSince) continue;
      const actor: string | undefined = e.actor?.login;
      const range = `${String(e.before ?? "").slice(0, 8)}..${String(e.after ?? "").slice(0, 8)}`;
      if (M.content.length && e.before && e.after) {
        const cmp = await gh.api<any>(`repos/${r}/compare/${e.before}...${e.after}`);
        for (const f of (cmp.data?.files ?? []) as { filename: string; patch?: string }[]) {
          const added = (f.patch ?? "").split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
          for (const m of M.content) {
            const line = added.find((l) => m.test(l));
            if (!line || !inWindow(m, e.timestamp)) continue;
            add(
              hit(m, {
                surface: "github:repos",
                subject: r,
                title: `Force push to ${repo.default_branch} by ${actor ?? "?"} added "${m.indicator.value}" to ${f.filename}`,
                actor,
                scope: scopeOf(actor),
                at: e.timestamp,
                ciRun: "attacker",
                evidence: { kind: "url", ref: `https://github.com/${r}/blob/${e.after}/${f.filename}`, excerpt: line.slice(1).trim().slice(0, 200) },
              }),
            );
          }
        }
      }
      add({
        surface: "github:repos",
        severity: "suspicious",
        subject: r,
        title: `Force push to ${repo.default_branch} by ${actor ?? "?"} at ${e.timestamp} (${range}): history was rewritten`,
        actor,
        scope: scopeOf(actor),
        at: e.timestamp,
        evidence: { kind: "api", ref: `repos/${r}/activity?ref=refs/heads/${repo.default_branch}`, excerpt: `force_push ${e.before}..${e.after}` },
        key: `github:repos|${r}|force-push|${e.id ?? e.after}`,
      });
    }
    // Pushes to the default branch by a login a source names.
    for (const e of (await defaultActivity()) ?? [])
      if (e.activity_type === "push" || e.activity_type === "force_push")
        actorOnly(
          `Push to ${repo.default_branch} (${String(e.after ?? "").slice(0, 8)})`,
          e.actor?.login,
          e.timestamp,
          `https://github.com/${r}/commit/${e.after}`,
        );

    if (M.commit.length) {
      const commits = await gh.paged<any>(`repos/${r}/commits?since=${since}`, { maxPages: 3 });
      if (commits.truncated && !commits.partial) truncated.push(`${r} commits`);
      for (const c of commits.data ?? []) {
        const msg = firstLine(c.commit?.message);
        // The committer date is when it landed; an author date can be backdated to slip out of the window.
        const landed = laterOf(c.commit?.author?.date, c.commit?.committer?.date);
        const m = firstMatch(M.commit, msg, landed);
        if (!m) continue;
        // The author is self-declared: the pusher (activity log) says whose credentials did it.
        const authorLogin: string | undefined = c.author?.login;
        const pusher = await pusherOf(c.sha);
        const actor = pusher ?? authorLogin;
        const authored = authorLogin ?? `${c.commit?.author?.name ?? "?"} (author not linked to an account)`;
        const files = await filesOf(c.sha);
        const carried = describe(files);
        const excerpt = `sha=${c.sha}${files ? `; ${files.join(", ")}` : ""}`.slice(0, 600);
        add(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Commit ${String(c.sha).slice(0, 8)} "${msg}" on ${repo.default_branch}, authored as ${authored}${pusher ? `, pushed by ${pusher}` : ""}${carried.text}${files ? "" : "; its changed files could not be read"}`,
            // A commit on the default branch ran in CI; when its files cannot be read, assume the payload.
            ciRun: carried.kind ?? "attacker",
            actor,
            scope: scopeOf(actor),
            at: c.commit?.author?.date,
            evidence: { kind: "url", ref: c.html_url, excerpt },
          }),
        );
      }
    }

    // Workflow runs: attacker branches and titles, and deleted runs (gaps in run_number).
    const runs = await gh.paged<any>(`repos/${r}/actions/runs?created=>=${sinceDay}`, { pick: (b) => b.workflow_runs ?? [], maxPages: 3 });
    if (runs.truncated && !runs.partial) truncated.push(`${r} workflow runs`);
    // A busy repository passes 300 runs in days: ask for runs on each literal attacker branch directly.
    const runList: any[] = [...(runs.data ?? [])];
    const runIds = new Set(runList.map((x) => x.id ?? x.html_url));
    for (const b of literalBranches) {
      const more = await gh.paged<any>(`repos/${r}/actions/runs?branch=${encodeURIComponent(b)}&created=>=${sinceDay}`, {
        pick: (x) => x.workflow_runs ?? [],
        maxPages: 3,
      });
      for (const x of more.data ?? [])
        if (!runIds.has(x.id ?? x.html_url)) {
          runIds.add(x.id ?? x.html_url);
          runList.push(x);
        }
    }
    const byWorkflow = new Map<number, { numbers: number[]; name: string }>();
    for (const run of runList) {
      const w: { numbers: number[]; name: string } = byWorkflow.get(run.workflow_id) ?? { numbers: [], name: run.name };
      w.numbers.push(run.run_number);
      byWorkflow.set(run.workflow_id, w);
      const m =
        firstMatch(M.branch, run.head_branch, run.created_at) ??
        firstMatch(M.commit, firstLine(run.display_title), run.created_at) ??
        firstMatch(M.pr, run.display_title, run.created_at);
      const actor = run.triggering_actor?.login ?? run.actor?.login;
      if (!m) {
        actorOnly(`Workflow "${run.name}" ran on ${run.head_branch} ("${firstLine(run.display_title)}")`, actor, run.created_at, run.html_url);
        continue;
      }
      const carried = await describeRun(run.head_sha, actor, run.created_at);
      add(
        hit(m, {
          surface: "github:repos",
          subject: r,
          title: `Workflow "${run.name}" ran on ${run.head_branch} ("${firstLine(run.display_title)}"), ${run.conclusion ?? run.status}, triggered by ${actor}${carried.text}`,
          ciRun: carried.kind ?? "attacker",
          actor,
          scope: scopeOf(actor),
          at: run.created_at,
          evidence: { kind: "url", ref: run.html_url, excerpt: `run_id=${run.id} head_sha=${run.head_sha}; gh api repos/${r}/actions/runs/${run.id}` },
        }),
      );
    }
    // Deleted runs (gaps in run_number) are judged at the end: alone they are
    // mostly retention and re-runs; next to an IOC hit they are the cover-up.
    const runGaps: { id: number; name: string; missing: number[] }[] = [];
    for (const [id, w] of byWorkflow) {
      const nums = [...new Set(w.numbers)].sort((a, b) => a - b);
      const missing: number[] = [];
      for (let i = 1; i < nums.length; i++) for (let n = (nums[i - 1] as number) + 1; n < (nums[i] as number); n++) missing.push(n);
      // More holes than runs is a listing artefact (another event type, a filter), not deletions.
      if (!missing.length || runs.truncated || missing.length > nums.length) continue;
      runGaps.push({ id, name: w.name, missing });
    }

    if (M.cache.length) {
      // The API filters caches by key prefix: one call per prefix finds them all, however many caches exist.
      for (const m0 of M.cache) {
        const caches = await gh.paged<any>(`repos/${r}/actions/caches?key=${encodeURIComponent(m0.indicator.value)}`, {
          pick: (b) => b.actions_caches ?? [],
          maxPages: 5,
        });
        for (const c of caches.data ?? []) {
          const m = firstMatch(M.cache, c.key);
          if (m)
            add(
              hit(m, {
                surface: "github:repos",
                subject: r,
                title: `Actions cache "${c.key}"`,
                at: c.created_at,
                evidence: { kind: "api", ref: `repos/${r}/actions/caches?key=${encodeURIComponent(c.key)}` },
              }),
            );
        }
      }
    }
    if (M.artifact.length) {
      const arts = await gh.paged<any>(`repos/${r}/actions/artifacts`, { pick: (b) => b.artifacts ?? [], maxPages: 5 });
      for (const a of arts.data ?? []) {
        const m = firstMatch(M.artifact, a.name);
        if (m)
          add(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `Workflow artifact "${a.name}"`,
              at: a.created_at,
              evidence: { kind: "api", ref: `repos/${r}/actions/artifacts/${a.id}` },
            }),
          );
      }
    }

    // The default branch's files: names against file IOCs, workflow contents, install hooks.
    await scanFiles(await treeOf());

    if (runGaps.length && repF.some((f) => f.subject === r && f.severity === "compromised")) {
      for (const g of runGaps)
        add({
          surface: "github:repos",
          severity: "suspicious",
          subject: r,
          title: `Workflow "${g.name}" is missing ${g.missing.length} run(s) in the window (#${g.missing.slice(0, 5).join(", #")}${g.missing.length > 5 ? ", ..." : ""}): deleted runs`,
          evidence: { kind: "api", ref: `repos/${r}/actions/workflows/${g.id}/runs` },
          key: `github:repos|${r}|run-gap|${g.id}|${g.missing.join(",")}`,
        });
    } else if (runGaps.length) quietGaps++;
  });

  // Content indicators in any file: GitHub code search, best effort. It covers indexed default
  // branches only, so a zero result never closes the gap; it can only add findings.
  const searchable = [...new Map(M.content.map((m) => [m.indicator.value.replace(/"/g, "").trim().toLowerCase(), m])).values()].filter(
    (m) => m.indicator.value.replace(/"/g, "").trim().length >= 4,
  );
  if (searchable.length && repos.length) {
    const scanned = new Set(repos.map((x) => x.full_name.toLowerCase()));
    const owners = [...new Set([login, ...repos.map((x) => x.full_name.split("/")[0] as string)].map((o) => o.toLowerCase()))];
    const queries = searchable.flatMap((m) => owners.map((owner) => ({ m, owner })));
    // Code search allows 10 calls a minute.
    const CODE_SEARCH_CAP = 10;
    let refused = 0;
    for (const { m, owner } of queries.slice(0, CODE_SEARCH_CAP)) {
      const q = encodeURIComponent(`"${m.indicator.value.replace(/"/g, "")}" user:${owner}`);
      const res = await gh.api<any>(`search/code?q=${q}&per_page=100`);
      reported.add("search/code");
      if (!res.ok) {
        refused++;
        continue;
      }
      for (const it of (res.data?.items ?? []) as { path: string; html_url: string; repository?: { full_name?: string } }[]) {
        const repoName = it.repository?.full_name ?? "";
        if (!scanned.has(repoName.toLowerCase())) continue;
        if (repF.some((f) => f.subject === repoName && f.indicator?.value === m.indicator.value && f.title.startsWith(`${it.path} contains`))) continue;
        repF.push(
          hit(m, {
            ...(DOCS_ONLY.test(it.path) ? { severity: "suspicious" as const } : {}),
            surface: "github:repos",
            subject: repoName,
            title: `${it.path} contains "${m.indicator.value}" (code search)`,
            evidence: { kind: "url", ref: it.html_url },
          }),
        );
      }
    }
    repG.push({
      surface: "github:repos",
      what: "string, IP, domain and URL indicators in files other than workflows and install hooks",
      why: `searched with GitHub code search (${Math.min(queries.length, CODE_SEARCH_CAP) - refused} of ${queries.length} queries answered${queries.length > CODE_SEARCH_CAP ? `, capped at ${CODE_SEARCH_CAP} a run` : ""}): it covers indexed default branches only, so new repositories, other branches and files over 384 KB are not searched`,
    });
  }

  // Actor IOCs: a login an article names as compromised, seen anywhere in your repos.
  for (const f of repF) {
    const m = f.actor ? firstMatch(M.actor, f.actor) : undefined;
    if (m && !f.title.includes("(named compromised")) f.title += ` (named compromised by ${m.indicator.source})`;
  }

  if (quietGaps)
    repG.push({
      surface: "github:repos",
      what: `missing workflow run numbers in ${quietGaps} repositories with no IOC match`,
      why: "not reported as findings: alone they are usually retention or re-runs",
    });
  // Which repositories were not read at all: skipped for the rate limit, or every read refused.
  const poolLog = gh.log.slice(poolStart);
  const unread = repos
    .map((x) => x.full_name)
    .filter((r) => {
      if (notStarted.includes(r)) return true;
      const reads = poolLog.filter((l) => l.path.startsWith(`repos/${r}/`));
      return reads.length > 0 && reads.every((l) => !l.answered);
    });
  reposRes.scanned = listed && !(repos.length > 0 && unread.length === repos.length);
  if (unread.length)
    repG.push({
      surface: "github:repos",
      what: `${unread.length} repositories not read: ${unread.slice(0, 10).join(", ")}${unread.length > 10 ? ", ..." : ""}`,
      why: notStarted.length ? `the API rate limit ran out (${notStarted.length} not started)` : "every read of them failed",
      fix: `re-run scan github --repos ${unread.slice(0, 20).join(",")}${resetAt ? ` after ${resetAt}` : ""}`,
    });
  const limited = gh.failures.filter((f) => /rate limit/i.test(f.error ?? "") && !reported.has(basePath(f.path)));
  for (const [surface, list] of [
    ["github:account", limited.filter((f) => !REPO_PATH.test(f.path))],
    ["github:repos", limited.filter((f) => REPO_PATH.test(f.path))],
  ] as const)
    if (list.length)
      (surface === "github:account" ? accG : repG).push({
        surface,
        what: `${list.length} GitHub API calls`,
        why: "the API rate limit refused them: what they would have read was not checked",
        fix: "re-run scan github (search calls reset each minute, the rest each hour: gh api rate_limit)",
      });
  reposRes.stats.inactiveSkipped = inactive;
  reposRes.stats.apiCalls = gh.calls;
  if (inactive)
    repG.push({
      surface: "github:repos",
      what: `${inactive} repositories with no push since ${sinceDay}`,
      why: `only their pull requests, webhooks and deploy keys${M.content.length || M.workflow.length ? `, and the workflow files of the ${inactiveRan} where a workflow ran in the window,` : ""} were checked; their branches, commits, runs, caches and artifacts were not read`,
    });
  if (treeCut.length)
    repG.push({
      surface: "github:repos",
      what: `files of ${treeCut.join(", ")} past what GitHub returns in one tree`,
      why: "the tree was cut (truncated): only its first part, the workflow folder and the root were compared with file indicators",
    });
  if (pkgCapped.length)
    repG.push({ surface: "github:repos", what: `package.json files past the first 20 in ${pkgCapped.join(", ")}`, why: "their install hooks were not read" });
  if (contentCapped.length)
    repG.push({
      surface: "github:repos",
      what: `workflow files past the first 25 in ${contentCapped.join(", ")}`,
      why: "their contents were not read for string, IP, domain or URL indicators",
    });
  if (noAdmin)
    repG.push({
      surface: "github:repos",
      what: `webhooks, deploy keys and self-hosted runners of ${noAdmin} repositories`,
      why: "they need admin rights on the repository",
    });
  if (truncated.length) repG.push({ surface: "github:repos", what: truncated.join("; "), why: "more than 300 items in the window: the oldest were not read" });
  // Every other refused or failed call, and every list the page cap cut: not looked at, so never clean.
  const failed = gh.failures.filter((f) => !reported.has(basePath(f.path)) && !/rate limit/i.test(f.error ?? ""));
  for (const [surface, list] of [
    ["github:account", failed.filter((f) => !REPO_PATH.test(f.path))],
    ["github:repos", failed.filter((f) => REPO_PATH.test(f.path))],
  ] as const) {
    if (!list.length) continue;
    const byStatus = new Map<number, number>();
    for (const f of list) byStatus.set(f.status, (byStatus.get(f.status) ?? 0) + 1);
    const where = [...new Set(list.map((f) => f.path.split("?")[0]?.split("/").slice(0, 3).join("/")))].slice(0, 6);
    (surface === "github:account" ? accG : repG).push({
      surface,
      what: `${list.length} GitHub API read(s) that failed (${[...byStatus].map(([st, n]) => `${n}x ${st ? `HTTP ${st}` : "error"}`).join(", ")}), e.g. ${where.join(", ")}`,
      why: `what they would have read was not checked: ${list[0]?.error ?? ""}`.slice(0, 300),
      fix: "check the token's scopes and permissions (gh auth status), then re-run scan github",
    });
  }
  // Search lists, runs and commits have their own truncation gap.
  const cut = gh.truncated.filter((p) => !/actions\/runs|\/commits\?|^search\//.test(p));
  for (const [surface, list] of [
    ["github:account", cut.filter((p) => !REPO_PATH.test(p))],
    ["github:repos", cut.filter((p) => REPO_PATH.test(p))],
  ] as const)
    if (list.length)
      (surface === "github:account" ? accG : repG).push({
        surface,
        what: `${list.length} list(s) cut by the page cap: ${list.slice(0, 5).map(basePath).join(", ")}`,
        why: "their oldest items were not read",
      });
  repG.push({
    surface: "github:repos",
    what: "branches other than the default branch, for commits and files",
    why: "commits and the whole file tree are read on the default branch; attacker branches are caught by name, activity log, runs and PRs",
  });
  reposRes.finishedAt = new Date().toISOString();

  const hitRepos = [...new Set(repF.filter((f) => f.severity === "compromised").map((f) => f.subject))].sort();
  return {
    login,
    account: { result: accountRes, findings: accF, gaps: accG },
    repos: { result: reposRes, findings: repF, gaps: repG },
    hitRepos,
  };
}
