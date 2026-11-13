# Vulnerabilities: ranked, then fixed on the user's go-ahead

A known CVE in a lockfile is a patching backlog, not a compromise. On a
developer's machine package-checker finds a thousand of them, most in caches,
plugins and vendored copies nobody patches. `scan deps` ranks them, so you can
show the few that matter and offer to fix them.

## Tiers

| Tier | When | What to say |
|---|---|---|
| **P0** | the CVE is in CISA KEV: exploited in the wild | patch now; say if KEV marks ransomware use |
| **P1** | EPSS >= 0.1 (10% chance of exploitation in 30 days), or critical with a fixed version | patch this week |
| **P2** | high with a fixed version | patch with the next update |
| **P3** | the rest (moderate, low, or no fix yet) | counted, not listed |

Within a tier: KEV first, then EPSS, then severity, then a fix being
available. A dev-only dependency (`devDependencies`, a dev group) keeps its
tier, but say it is lower risk: it does not ship.

## Where the packages live

Each lockfile belongs to the git repository that holds it (walk up to the
`.git`):

- **own**: one of the user's projects (a repository, or a folder of theirs
  with no git). These get a finding when they have P0/P1 items, and a plan.
- **worktree**: a linked git worktree (`.git` is a file) or an agent's
  worktree folder (`.claude/worktrees/<name>`). Fix the main checkout.
- **tool**: under a dot folder of the home (`~/.claude/plugins`,
  `~/.vscode/extensions`, `~/.config/<tool>`) or `~/Library`: update the tool.
- **vendored**: inside `node_modules`, `site-packages`, a virtualenv: it comes
  with the package that vendors it.

The last three get one line each in REPORT.md, never a plan (unless
`fixes --project <path>` names one).

## Feeds

Both keyless, cached 24 hours in `<state>/feeds/` (default `~/.ultraguard`).
A failed fetch reuses the cache, however old, and says so as a gap; no cache
at all is a gap too, and nothing is ranked P0 then.

- CISA KEV: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
  (`cveID`, `vendorProject`, `product`, `dateAdded`, `knownRansomwareCampaignUse`).
- FIRST EPSS: `https://api.first.org/data/v1/epss?cve=CVE-a,CVE-b` (100 per
  call; `epss` and `percentile` are strings in [0, 1]). Only CVE ids are sent.
- Chrome stable for macOS: `https://versionhistory.googleapis.com/v1/chrome/platforms/mac/channels/stable/versions`.
- Node.js releases: `https://nodejs.org/dist/index.json` (entries with `"security": true`).

`ultraguard doctor` shows the cache age; `doctor --probe` checks that cisa.gov
and api.first.org answer.

## This machine (macOS)

- `softwareupdate --list`: every pending update is listed. A security update
  (Rapid Security Response, Background Security Improvement) or a recommended
  update that restarts is suspicious, so deps reads REVIEW until it is installed.
- KEV entries added in the last 30 days for what is installed: Apple (macOS,
  Safari, WebKit) always; Chromium bugs for every Chromium browser found in
  `/Applications` (Chrome, Brave, Edge, Opera, Arc, Vivaldi); Firefox, Office,
  Teams, VS Code, Docker, Zoom, VLC, Slack, 1Password... when the app is
  there. Each is P0 with the installed version (`plutil` on the app's
  Info.plist, `sw_vers`). The status says whether an update is pending.
- A command that fails (`softwareupdate` offline) is a gap.

## The fix plan

`ultraguard fixes --out <run> [--project <path>] [--json]` reads
`<run>/vulnerabilities.json` (or ranks `deps-vulnerabilities.json` of an older
run) and writes `<run>/FIXES.md`. Per lockfile of each own project, it takes,
for each locked version, the smallest version that closes every advisory with
a fix, and says when that leaves the major line (for 0.x, the minor line).

| Lockfile | Direct dependency | Transitive |
|---|---|---|
| `pnpm-lock.yaml` | `pnpm up [-r] pkg@ver` | `"pkg@cur": "ver"` in `pnpm.overrides` (or `overrides:` in pnpm-workspace.yaml), then `pnpm install` |
| `package-lock.json` | `npm install pkg@ver [--save-dev]` | `"pkg@cur": "ver"` in `overrides`, then `npm install` |
| `yarn.lock` (v1) | `yarn upgrade pkg@ver` | `"pkg": "ver"` in `resolutions`, then `yarn install` |
| `yarn.lock` (berry) | `yarn up pkg@ver` | `"pkg@npm:cur": "ver"` in `resolutions`, then `yarn install` |
| `bun.lock` | `bun add [-d] pkg@ver` | `"pkg": "ver"` in `overrides`, then `bun install` |
| `uv.lock` | `uv add [--dev] "pkg>=ver"` | `uv lock --upgrade-package "pkg==ver"` |
| `poetry.lock` | `poetry add [--group dev] "pkg>=ver"` | `poetry update pkg` (check the lock) |
| `Pipfile.lock` | `pipenv install "pkg>=ver"` | `pipenv update pkg` |
| `requirements*.txt` | `pkg==ver` in the file | same |
| `Cargo.lock` | `cargo update -p pkg@cur --precise ver` (major: edit Cargo.toml) | same |
| `go.sum` | `go get mod@vver`, then `go mod tidy` | same |
| `composer.lock` | `composer require pkg:^ver` | `composer update pkg --with-dependencies` |
| `Gemfile.lock` | `bundle update gem --conservative` (major: edit the Gemfile) | same |

An item with no fixed version yet is listed as such: watch the advisory, or
replace the package.

## Fixing, when the user says yes

ultraguard changes nothing on its own (I0). `fix --apply` is the one command
that writes, for one project the user named, after they said yes:

1. Show the P0/P1 items and ask which projects to fix.
2. `ultraguard fix --out <run> --project <path>`: the dry run. It writes
   nothing, and prints the worktree, the branch, the base commit, every
   command and edit in order, and the files expected to change. Show it.
3. After the user's go-ahead: the same command with `--apply`
   (`--tiers P0,P1` to leave the P2 out, `--no-test` to skip the tests).
4. Read what it prints: the re-check (advisories closed, remaining, new), the
   test result with the tail of its output, the commit, the diff stat.
5. Tests failing: repair the code in the worktree (a major upgrade: read the
   changelog), re-run the tests there, and commit the repair in the
   worktree. Push, open a PR or merge only when the user asks.

### What `--apply` does

- **Refuses** (exit 2, nothing created): a cache, plugin, vendored copy or
  worktree (fix the main checkout instead); a folder that is not the root of
  a git repository; a plan with nothing at the chosen tiers; a branch of the
  same name that already exists; a package manager the plan needs that is
  not installed.
- **Worktree**: `<state>/fixes/<repo>-<yyyymmdd-hhmm>` (state: `--state`,
  `ULTRAGUARD_HOME`, default `~/.ultraguard`), on a new branch
  `ultraguard/fix-<yyyymmdd>-<sha7>` from the default branch as it is
  locally (`origin/HEAD`, else `main` or `master`; HEAD when there is none).
  No fetch. The user's checkout, its branch and its files are not touched.
- **The plan**, per lockfile in its folder of the worktree: the commands
  (`pnpm up`, `npm install pkg@ver`, `yarn up`, `cargo update -p --precise`,
  `go get`, `uv add`, `composer require`, `bundle update --conservative`...),
  then the edits ultraguard makes itself (`pnpm.overrides`, `overrides`,
  `resolutions` in package.json with its own indentation and line endings;
  `overrides:` in pnpm-workspace.yaml when it already has that map; a pinned
  line in `requirements*.txt`, `Cargo.toml` or the `Gemfile`), then the
  install that refreshes the lockfile. npm, pnpm, yarn and bun run with
  `--ignore-scripts` (yarn berry: `--mode=skip-build`): a fix never runs the
  install scripts of a tree that may be hostile. `pip install` is not run.
- **Re-check**: package-checker on the worktree's copies of the lockfiles.
- **Tests**: `scripts.test` of package.json (with the project's manager),
  `cargo test`, `go test ./...`, or pytest when it is configured; 15 minutes
  at most. A failure keeps the worktree as it is.
- **Commit**: only the manifests and lockfiles, as `fix(deps): close <n> known
  vulnerabilities` with one line per package and its CVEs, with the user's
  git config: it is signed when `commit.gpgsign` is on. If the commit fails
  (signing), the changes stay uncommitted in the worktree and fix says so.
- **Record**: `<run>/fix-<project>.json`: every command and edit with its exit
  code and output, the closed and remaining advisories, the test result.
- Exit 0: applied, advisories closed, tests pass (or `--no-test`, or no test
  command found). Exit 1: a step failed, an advisory remains, the re-check
  could not run, the tests fail or the commit failed.

### Publishing or dropping a fix

fix prints the commands; it runs none of them:

```sh
git -C <worktree> push -u origin <branch>
cd <worktree> && gh pr create --base <default branch> --head <branch> --fill
# or drop it:
git -C <repo> worktree remove --force <worktree>
git -C <repo> branch -D <branch>
```

Never edit a cache, a plugin or a vendored copy: update the tool, the plugin
or the parent package instead.

## News: what is exploited right now

KEV is the authoritative list, but it lags the news by days. When the user
asks about "the latest vulnerabilities", also search the web for
`actively exploited vulnerability <month year>`, `zero-day exploited <month
year>`, and `<vendor> emergency patch <month year>` for the software found on
the machine, and cite what you use. A CVE the news reports as exploited that
is not in KEV yet is still worth naming, with its source.
