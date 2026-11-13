# The GitHub scan

Everything goes through `gh api` with the user's own token: no other
credential, no write.

## Your account (`github:account`)

- PRs your login opened **anywhere** since the window, via search. The probe
  PR of a campaign usually lands in repositories the victim does not own.
- Commits your login authored and committed since the window, via commit
  search (default branches GitHub indexes; capped at 1,000).
- Branches your login created or pushed, from your public event stream
  (last 300 events).
- SSH and GPG keys added since the window start, 180 days back at most
  (suspicious: judge them). They
  need the `read:public_key` and `read:gpg_key` scopes; without them the gap
  says so (`gh auth refresh -s read:public_key,read:gpg_key`).
- Not readable with a token: the security log, sessions, OAuth grants. They
  are always a coverage gap; tell the user to open
  `github.com/settings/security-log`.

A match here means the user's credentials act for the attacker: COMPROMISED.
A match by the user's login inside `github:repos` counts here too.

## Repositories you can push to (`github:repos`)

Every repository from `user/repos` (owner, collaborator, organization
member) with push rights, not archived, the most recently pushed first (so
`--max-repos` and the rate limit spend the budget where an attack can be).
For each:

- **PRs** created in the window, by anyone: title and head branch. Checked on
  every repository, because a PR from a fork does not move `pushed_at`.
- **Webhooks and deploy keys** added since the window start, 180 days back
  at most (admin rights only), on every repository: adding one needs no push.
- When the campaign has string, IP, domain, URL or workflow-file indicators
  and a workflow ran in the window, the **workflow files** of a repository
  not pushed since: a moved action tag (tj-actions, trivy-action) changes
  nothing in the repository, yet the workflow ran it.
- Then, only if the repository was pushed to since the window:
  - **branches** by name, and the repository **activity log** (branch
    creations, pushes and deletions, with their actor): it finds the
    attacker branch the cleanup already deleted. A literal branch is asked
    for by ref (complete); a regex branch through the list of branch
    creations back to the window start. One finding per branch: its actor
    is who created or pushed it, never who deleted it (the cleanup, often
    you or an org admin). It also says what the branch pointed at: a commit
    already on the default branch ("no commit pushed") or the files of the
    pushed commit;
  - **commits** on the default branch since the window, by anyone, with the
    files each matching commit touched. The author is free text: the finding
    says "authored as", and takes its actor and `scope` from the pusher in
    the default branch's activity log when it is there;
  - **workflow runs** since the window: branch, title, and **gaps in
    `run_number`** per workflow (the attacker deletes the run that leaked).
    Runs on each literal attacker branch are also asked for directly, so a
    busy repository's newest 300 runs do not hide them.
    A gap is reported only in a repository that also has an IOC match: alone,
    gaps are mostly retention and re-runs, and are counted in the coverage;
  - **Actions caches and artifacts** by prefix;
  - the default branch's **whole file tree** (one call): every path against
    `file` indicators (`public/fonts/x.woff2`, `.claude/setup.mjs`), workflow
    files and composite actions (`.github/actions/**/action.yml`) by name,
    and their contents when the campaign has string, IP, domain or URL
    indicators (first 25 per repository);
  - **install hooks** (`preinstall`, `install`, `postinstall`, `prepare`) of
    every package.json in the tree (first 20, outside node_modules).

Each finding carries the actor and `scope`: `own` (your login) or `other`.
Run and commit findings also say what the commit changed: "the commit only
changes docs (a probe)" or "the commit changes .ci-x.sh, package.json". Their
evidence holds the full SHA and the run id (`gh api repos/<r>/actions/runs/<id>`).
A run counts as the repository's own code only when the default branch
already held its commit when the run started (from the activity log, not
today's branch), the commit is by someone else, and it touches no IOC file
and carries no IOC message. An IOC commit whose files cannot be read is
treated as the payload.

## Rate limit and failed reads

- A surface where no read answered (logged out, the repository list
  refused, every call rate-limited) is UNKNOWN, never CLEAN.
- The scan estimates about 16 REST calls per repository pushed in the window
  and warns, with the reset time, when the hourly budget is short. Once the
  budget runs out it stops starting repositories and names them in a gap
  with the `--repos a/b,c/d` to re-run after the reset.
- A search refused by its per-minute limit is retried once after 30 s; a list
  whose later page failed says how many items were read.

## Reading the result

- Probe PR only: the attacker proved write access. Treat the repository's
  secrets as at risk; check the runs.
- Attacker branch only, no run seen: the same proof of write access, without
  a PR.
- A run on an attacker branch, or attacker commits on the default branch: the
  payload ran in CI. Every secret, variable, OIDC role and cloud credential
  that workflow could reach is stolen. REPORT.md says "the attacker made CI
  run" for these.
- The account that acted is a victim too. Its owner must lock it; tell the
  org admins.
