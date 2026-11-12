# The GitHub scan

Everything goes through `gh api` with the user's own token: no other
credential, no write.

## Your account (`github:account`)

- PRs your login opened **anywhere** since the window, via search. The probe
  PR of a campaign usually lands in repositories the victim does not own.
- Commits your login authored, via commit search (default branches GitHub
  indexes; capped at 1,000).
- Branches your login created or pushed, from your public event stream
  (last 300 events).
- SSH and GPG keys added in the last 30 days (suspicious: judge them). They
  need the `read:public_key` and `read:gpg_key` scopes; without them the gap
  says so (`gh auth refresh -s read:public_key,read:gpg_key`).
- Not readable with a token: the security log, sessions, OAuth grants. They
  are always a coverage gap; tell the user to open
  `github.com/settings/security-log`.

A match here means the user's credentials act for the attacker: COMPROMISED.
A match by the user's login inside `github:repos` counts here too.

## Repositories you can push to (`github:repos`)

Every repository from `user/repos` (owner, collaborator, organization
member) with push rights, not archived. For each:

- **PRs** created in the window, by anyone: title and head branch. Checked on
  every repository, because a PR from a fork does not move `pushed_at`.
- Then, only if the repository was pushed to since the window:
  - **branches** by name, and the repository **activity log** (branch
    creations, deletions and force pushes, with their actor): it finds the
    attacker branch the cleanup already deleted;
  - **commits** on the default branch since the window, by anyone, with the
    files each matching commit touched;
  - **workflow runs** since the window: branch, title, and **gaps in
    `run_number`** per workflow (the attacker deletes the run that leaked).
    A gap is reported only in a repository that also has an IOC match: alone,
    gaps are mostly retention and re-runs, and are counted in the coverage;
  - **Actions caches and artifacts** by prefix;
  - **workflow files** on the default branch: names, and contents when the
    campaign has string, IP, domain or URL indicators;
  - **root files and install hooks** (`preinstall`, `install`,
    `postinstall`, `prepare` in package.json);
  - **webhooks and deploy keys** added in the window (admin rights only).

Each finding carries the actor and `scope`: `own` (your login) or `other`.
Run and commit findings also say what the commit changed: "the commit only
changes docs (a probe)" or "the commit changes .ci-x.sh, package.json". Their
evidence holds the full SHA and the run id (`gh api repos/<r>/actions/runs/<id>`).

## Reading the result

- Probe PR only: the attacker proved write access. Treat the repository's
  secrets as at risk; check the runs.
- A run on an attacker branch, or attacker commits on the default branch: the
  payload ran in CI. Every secret, variable, OIDC role and cloud credential
  that workflow could reach is stolen. REPORT.md says "the attacker made CI
  run" for these.
- The account that acted is a victim too. Its owner must lock it; tell the
  org admins.
