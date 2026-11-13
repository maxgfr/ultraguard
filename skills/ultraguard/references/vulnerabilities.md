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

ultraguard stays read-only (I0). Fixing is a separate step the user asks for,
project by project:

1. Create a worktree or a branch (`fix/vulnerabilities-<date>`); never work on
   the default branch.
2. Apply the plan from `ultraguard fixes --project <path>`: the commands, then
   the override edits, then the install.
3. Run the project's own checks (its test, lint and build scripts). A major
   upgrade that breaks them: read the changelog, adapt the code, or leave that
   one out and say why.
4. Re-run `ultraguard scan deps --roots <project> --out <run>` and confirm the
   items are gone.
5. Show the diff. Commit, push or open a PR only as the user asks, with the
   CVEs the change closes in the message.

Never edit a cache, a plugin or a vendored copy: update the tool, the plugin
or the parent package instead.

## News: what is exploited right now

KEV is the authoritative list, but it lags the news by days. When the user
asks about "the latest vulnerabilities", also search the web for
`actively exploited vulnerability <month year>`, `zero-day exploited <month
year>`, and `<vendor> emergency patch <month year>` for the software found on
the machine, and cite what you use. A CVE the news reports as exploited that
is not in KEV yet is still worth naming, with its source.
