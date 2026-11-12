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
import { Gh } from "./gh.js";

type NewFinding = Omit<Finding, "id">;

export interface GithubScanOptions {
  concurrency?: number;
  /** Only these repositories (owner/name). */
  repos?: string[];
  maxRepos?: number;
  now?: Date;
}

export interface GithubScanResult {
  login?: string;
  account: { result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] };
  repos: { result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] };
  hitRepos: string[];
}

interface Repo {
  full_name: string;
  archived: boolean;
  pushed_at: string | null;
  default_branch: string;
  permissions?: { push?: boolean; admin?: boolean };
}

const firstLine = (s: string | undefined | null) => (s ?? "").split("\n")[0] ?? "";

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

/** The first indicator that matches `value`, counting only campaigns whose own window holds `at`. */
function firstMatch(ms: Matcher[], value: string | undefined | null, at?: string | null): Matcher | undefined {
  if (!value) return undefined;
  return ms.find((m) => inWindow(m, at) && m.test(value));
}

export async function scanGithub(iocs: IocFile, runner: Runner, opts: GithubScanOptions = {}): Promise<GithubScanResult> {
  const gh = new Gh(runner);
  const now = opts.now ?? new Date();
  const since = windowStart(iocs);
  const sinceDay = since.slice(0, 10);
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
  };

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
  accountRes.scanned = true;
  reposRes.scanned = true;
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
    const prs = await gh.paged<any>(`search/issues?q=${q}`, { pick: (b) => b.items ?? [], maxPages: 10 });
    accountRes.stats.prsSearched = prs.data?.length ?? 0;
    if (!prs.ok) accG.push({ surface: "github:account", what: "pull requests you opened", why: prs.error ?? `HTTP ${prs.status}` });
    if (prs.truncated) accG.push({ surface: "github:account", what: "pull requests past the first 1,000", why: "search caps at 1,000 results" });
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
    const q = encodeURIComponent(`author:${login} author-date:>=${sinceDay}`);
    const commits = await gh.paged<any>(`search/commits?q=${q}`, { pick: (b) => b.items ?? [], maxPages: 10 });
    accountRes.stats.commitsSearched = commits.data?.length ?? 0;
    if (!commits.ok) accG.push({ surface: "github:account", what: "commits you authored", why: commits.error ?? `HTTP ${commits.status}` });
    if (commits.truncated)
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

  // Branches your login created or pushed, from the public event stream (90 days, 300 events).
  if (M.branch.length) {
    const events = await gh.paged<any>(`users/${login}/events`, { maxPages: 3 });
    accountRes.stats.events = events.data?.length ?? 0;
    for (const e of events.data ?? []) {
      if (e.created_at < since) continue;
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

  // Keys added in the window: the classic persistence step after a token theft.
  for (const [path, label] of [
    ["user/keys", "SSH key"],
    ["user/gpg_keys", "GPG key"],
  ] as const) {
    const keys = await gh.api<any[]>(path);
    if (!keys.ok) {
      const scope = path === "user/keys" ? "read:public_key" : "read:gpg_key";
      accG.push({
        surface: "github:account",
        what: `${label}s added to your account`,
        why:
          keys.status === 404 || keys.status === 403
            ? `the token lacks the ${scope} scope (${keys.error ?? `HTTP ${keys.status}`})`
            : (keys.error ?? `HTTP ${keys.status}`),
        fix: `gh auth refresh -s ${scope}`,
      });
      continue;
    }
    accountRes.stats[path === "user/keys" ? "sshKeys" : "gpgKeys"] = keys.data?.length ?? 0;
    for (const k of keys.data ?? []) {
      if (!k.created_at || k.created_at < reviewSince) continue;
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
  accountRes.finishedAt = new Date().toISOString();

  // ---- Repositories you can push to -------------------------------------------
  let repos: Repo[];
  if (opts.repos?.length) {
    const got = await mapPool(opts.repos, 8, (r) => gh.api<Repo>(`repos/${r}`));
    repos = got.filter((g) => g.ok && g.data).map((g) => g.data as Repo);
    for (const [i, g] of got.entries()) if (!g.ok) repG.push({ surface: "github:repos", what: opts.repos[i] as string, why: g.error ?? `HTTP ${g.status}` });
  } else {
    const list = await gh.paged<Repo>("user/repos?affiliation=owner,collaborator,organization_member", { maxPages: 50 });
    if (!list.ok) repG.push({ surface: "github:repos", what: "the list of your repositories", why: list.error ?? `HTTP ${list.status}` });
    repos = (list.data ?? []).filter((r) => r.permissions?.push && !r.archived);
  }
  if (opts.maxRepos && repos.length > opts.maxRepos) {
    repG.push({ surface: "github:repos", what: `${repos.length - opts.maxRepos} repositories past --max-repos`, why: "capped by the caller" });
    repos = repos.slice(0, opts.maxRepos);
  }
  reposRes.stats.repos = repos.length;

  let inactive = 0;
  let noAdmin = 0;
  let quietGaps = 0;
  const contentCapped: string[] = [];
  const rate = await gh.api<any>("rate_limit");
  const remaining = rate.data?.resources?.core?.remaining as number | undefined;
  if (remaining !== undefined && remaining < repos.length * 6)
    repG.push({
      surface: "github:repos",
      what: "part of the repositories may hit the API rate limit",
      why: `${remaining} REST calls left this hour for ${repos.length} repositories (about 5 each)`,
      fix: "wait for the hourly reset, or narrow with --repos",
    });
  const truncated: string[] = [];
  await mapPool(repos, opts.concurrency ?? 8, async (repo) => {
    const r = repo.full_name;
    const add = (f: NewFinding) => repF.push(f);
    const active = !!repo.pushed_at && repo.pushed_at >= since;

    // Pull requests: a fork PR does not move pushed_at, so check them on every repo.
    if (M.pr.length || M.branch.length) {
      const prs = await gh.paged<any>(`repos/${r}/pulls?state=all&sort=created&direction=desc`, {
        maxPages: 3,
        stop: (page) => page.some((p) => p.created_at < since),
      });
      for (const pr of prs.data ?? []) {
        if (pr.created_at < since) continue;
        const m = firstMatch(M.pr, pr.title, pr.created_at) ?? firstMatch(M.branch, pr.head?.ref, pr.created_at);
        if (!m) continue;
        const actor = pr.user?.login;
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
      return;
    }

    if (M.branch.length) {
      const branches = await gh.paged<{ name: string }>(`repos/${r}/branches`, { maxPages: 10 });
      for (const b of branches.data ?? []) {
        const m = firstMatch(M.branch, b.name);
        if (m)
          add(
            hit(m, { surface: "github:repos", subject: r, title: `Branch ${b.name} exists`, evidence: { kind: "api", ref: `repos/${r}/branches/${b.name}` } }),
          );
      }
    }

    // What a commit changed, once per SHA: it tells a probe (a docs file) from a payload (a script, an install hook).
    const changed = new Map<string, Promise<{ files: string[]; author?: string } | undefined>>();
    const commitOf = (sha: string) => {
      if (!changed.has(sha))
        changed.set(
          sha,
          gh.api<any>(`repos/${r}/commits/${sha}`).then((d) =>
            d.ok
              ? {
                  files: ((d.data?.files ?? []) as { filename: string; status: string }[]).map((f) => `${f.status} ${f.filename}`),
                  author: d.data?.author?.login as string | undefined,
                }
              : undefined,
          ),
        );
      return changed.get(sha) as Promise<{ files: string[]; author?: string } | undefined>;
    };
    const filesOf = async (sha: string) => (await commitOf(sha))?.files;
    /** The commit is already part of the default branch: a run on it executed the repository's own code. */
    const onDefault = async (sha: string) => {
      const cmp = await gh.api<any>(`repos/${r}/compare/${sha}...${repo.default_branch}`);
      return cmp.ok && (cmp.data?.status === "identical" || cmp.data?.status === "ahead");
    };
    // What a commit or a run carried, as a structured kind (never parsed back from a title the attacker writes).
    type Carried = { text: string; kind?: "probe" | "own-code" | "attacker" };
    const describe = (files: string[] | undefined): Carried => {
      if (!files) return { text: "" };
      if (files.length && files.every((f) => DOCS_ONLY.test(f.split(" ").slice(1).join(" "))))
        return { text: "; the commit only changes docs (a probe)", kind: "probe" };
      return {
        text: files.length
          ? `; the commit changes ${files
              .slice(0, 4)
              .map((f) => f.split(" ").slice(1).join(" "))
              .join(", ")}${files.length > 4 ? ", ..." : ""}`
          : "",
        kind: "attacker",
      };
    };
    /**
     * For a run: what it executed. A commit by someone else, already on the default
     * branch, is the repository's own code. Bot authors are not trusted for that:
     * the author of a commit is free text, and a bot name is the easiest to borrow.
     */
    const describeRun = async (sha: string | undefined, actor: string | undefined): Promise<Carried> => {
      if (!sha) return { text: "" };
      const c = await commitOf(sha);
      if (c?.author && actor && !/\[bot\]$/i.test(c.author) && c.author.toLowerCase() !== actor.toLowerCase() && (await onDefault(sha)))
        return { text: `; it ran ${repo.default_branch}'s own code (commit by ${c.author}, no attacker change)`, kind: "own-code" };
      return describe(c?.files);
    };

    if (M.commit.length || M.file.length) {
      const commits = await gh.paged<any>(`repos/${r}/commits?since=${since}`, { maxPages: 3 });
      if (commits.truncated) truncated.push(`${r} commits`);
      for (const c of commits.data ?? []) {
        const msg = firstLine(c.commit?.message);
        // The committer date is when it landed; an author date can be backdated to slip out of the window.
        const landed = laterOf(c.commit?.author?.date, c.commit?.committer?.date);
        const m = firstMatch(M.commit, msg, landed);
        if (!m) continue;
        const actor = c.author?.login ?? c.commit?.author?.name;
        const files = await filesOf(c.sha);
        const carried = describe(files);
        const excerpt = `sha=${c.sha}${files ? `; ${files.join(", ")}` : ""}`.slice(0, 600);
        add(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Commit ${String(c.sha).slice(0, 8)} "${msg}" on ${repo.default_branch} by ${actor}${carried.text}`,
            ciRun: carried.kind,
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
    if (runs.truncated) truncated.push(`${r} workflow runs`);
    const byWorkflow = new Map<number, { numbers: number[]; name: string }>();
    for (const run of runs.data ?? []) {
      const w: { numbers: number[]; name: string } = byWorkflow.get(run.workflow_id) ?? { numbers: [], name: run.name };
      w.numbers.push(run.run_number);
      byWorkflow.set(run.workflow_id, w);
      const m =
        firstMatch(M.branch, run.head_branch, run.created_at) ??
        firstMatch(M.commit, firstLine(run.display_title), run.created_at) ??
        firstMatch(M.pr, run.display_title, run.created_at);
      if (!m) continue;
      const actor = run.triggering_actor?.login ?? run.actor?.login;
      const carried = await describeRun(run.head_sha, actor);
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

    // Workflow files on the default branch: names, then contents when content IOCs exist.
    const wf = await gh.api<any[]>(`repos/${r}/contents/.github/workflows`);
    for (const f of Array.isArray(wf.data) ? wf.data : []) {
      const m = firstMatch(M.workflow, f.path) ?? firstMatch(M.file, f.path);
      if (m)
        add(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Workflow file ${f.path} on ${repo.default_branch}`,
            evidence: { kind: "url", ref: f.html_url },
          }),
        );
    }
    if (M.content.length && Array.isArray(wf.data)) {
      if (wf.data.length > 25) contentCapped.push(`${r} (${wf.data.length} workflow files)`);
      for (const f of wf.data.slice(0, 25)) {
        const body = await gh.api<any>(`repos/${r}/contents/${String(f.path).split("/").map(encodeURIComponent).join("/")}`);
        const text = body.data?.content ? Buffer.from(body.data.content, "base64").toString("utf8") : "";
        const lines = text.split("\n");
        for (const m of M.content) {
          const ln = lines.findIndex((l) => m.test(l));
          if (ln < 0) continue;
          add(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `${f.path} contains "${m.indicator.value}"`,
              evidence: { kind: "url", ref: `${f.html_url}#L${ln + 1}`, excerpt: lines[ln]?.trim().slice(0, 200) },
            }),
          );
        }
      }
    }

    // Root files and install hooks: the npm variant drops a script and wires it to postinstall.
    if (M.file.length || M.content.length) {
      const root = await gh.api<any[]>(`repos/${r}/contents/`);
      const names = Array.isArray(root.data) ? root.data : [];
      for (const f of names) {
        const m = firstMatch(M.file, f.path);
        if (m)
          add(hit(m, { surface: "github:repos", subject: r, title: `File ${f.path} on ${repo.default_branch}`, evidence: { kind: "url", ref: f.html_url } }));
      }
      if (names.some((f) => f.name === "package.json")) {
        const pkg = await gh.api<any>(`repos/${r}/contents/package.json`);
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
                  title: `package.json "${hook}" runs "${cmd}"`,
                  evidence: { kind: "url", ref: pkg.data.html_url, excerpt: cmd },
                }),
              );
          }
        } catch {
          // Not JSON: nothing an install hook could run from.
        }
      }
    }

    // Webhooks and deploy keys created in the window: persistence that survives a token rotation.
    if (repo.permissions?.admin) {
      for (const [path, label] of [
        ["hooks", "Webhook"],
        ["keys", "Deploy key"],
      ] as const) {
        const items = await gh.api<any[]>(`repos/${r}/${path}`);
        for (const it of items.data ?? []) {
          if (!it.created_at || it.created_at < reviewSince) continue;
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
    } else noAdmin++;

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
  if (gh.rateLimited)
    for (const g of [accG, repG])
      g.push({
        surface: g === accG ? "github:account" : "github:repos",
        what: `${gh.rateLimited} GitHub API calls`,
        why: "the API rate limit refused them: what they would have read was not checked",
        fix: "re-run scan github after the hourly reset (gh api rate_limit)",
      });
  reposRes.stats.inactiveSkipped = inactive;
  reposRes.stats.apiCalls = gh.calls;
  if (inactive)
    repG.push({
      surface: "github:repos",
      what: `${inactive} repositories with no push since ${sinceDay}`,
      why: "only their pull requests were checked; their branches, commits and files cannot have changed without a push, but scheduled or manual runs, caches, artifacts, webhooks and deploy keys were not read",
    });
  if (contentCapped.length)
    repG.push({
      surface: "github:repos",
      what: `workflow files past the first 25 in ${contentCapped.join(", ")}`,
      why: "their contents were not read for string, IP, domain or URL indicators",
    });
  if (noAdmin)
    repG.push({ surface: "github:repos", what: `webhooks and deploy keys of ${noAdmin} repositories`, why: "they need admin rights on the repository" });
  if (truncated.length) repG.push({ surface: "github:repos", what: truncated.join("; "), why: "more than 300 items in the window: the oldest were not read" });
  // Every other refused or failed call, and every list the page cap cut: not looked at, so never clean.
  const handled = new Set(["user/keys", "user/gpg_keys", "user", "rate_limit"]);
  const failed = gh.failures.filter((f) => !handled.has(f.path) && !/rate limit/i.test(f.error ?? ""));
  for (const [surface, list] of [
    ["github:account", failed.filter((f) => !/^(repos\/|user\/repos)/.test(f.path))],
    ["github:repos", failed.filter((f) => /^(repos\/|user\/repos)/.test(f.path))],
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
  const cut = gh.truncated.filter((p) => !/actions\/runs|\/commits\?/.test(p));
  if (cut.length)
    (cut.some((p) => p.startsWith("repos/") || p.startsWith("user/repos")) ? repG : accG).push({
      surface: cut.some((p) => p.startsWith("repos/") || p.startsWith("user/repos")) ? "github:repos" : "github:account",
      what: `${cut.length} list(s) cut by the page cap: ${cut
        .slice(0, 5)
        .map((p) => p.split("?")[0])
        .join(", ")}`,
      why: "their oldest items were not read",
    });
  repG.push({
    surface: "github:repos",
    what: "branches other than the default branch, for commits and files",
    why: "commits and files are read on the default branch; attacker branches are caught by name, runs and PRs",
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
