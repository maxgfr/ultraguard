# From an article to `iocs.json`

An IOC file is a list of campaigns. Each campaign cites the sources it comes
from, states when it started, and lists indicators copied from those sources.

```json
{
  "campaigns": [
    {
      "id": "wfx-loot-2026-11",
      "title": "wfx-loot: compromised GitHub accounts push a CI secret stealer",
      "sources": ["S1"],
      "since": "2026-11-10T12:45:00Z",
      "indicators": [
        { "type": "branch", "value": "wfx-docs", "source": "S1" },
        { "type": "branch", "value": "^chore/[a-z0-9]{8}$", "regex": true, "source": "S1" },
        { "type": "pr_title", "value": "^docs: (add )?dependency audit notes$", "regex": true, "source": "S1" },
        { "type": "commit_message", "value": "chore: add ci helper", "source": "S1" },
        { "type": "file", "value": ".ci-*.sh", "source": "S1" },
        { "type": "string", "value": "WF_CTOKEN", "source": "S1" },
        { "type": "ip", "value": "194.150.166[.]244", "source": "S1" },
        { "type": "sha256", "value": "89695abb392d5cfd4972672961e644bb46baa98aa1ed7173c2a2816c762735cf", "source": "S1" },
        { "type": "package", "ecosystem": "packagist", "value": "digitalelvis/neuronai-studio", "versions": ["3.14.3"], "source": "S1" }
      ]
    }
  ]
}
```

The full worked example, with all 27 indicators of that article, is
[example-iocs.json](example-iocs.json), next to this file.

## Fields

- One campaign per **attack**, not per article. `intel` writes
  `iocs.todo.json` with one placeholder per source: merge the sources that
  describe the same attack into one campaign that cites them all.
- `id`: short and stable (`<name>-<yyyy>-<mm>`). The routine remembers
  campaigns by id.
- `since` (and optional `until`): the window the source gives for THIS
  campaign. An indicator only matches activity inside its own campaign's
  window, so an old wave in the file does not flag this month's commits.
  Changes that match no IOC (new keys, startup items, webhooks, deleted runs)
  are reviewed over the last 30 days at most. When the source gives no date,
  use its publication date minus 7 days and say so.
- `sources`: every `[S#]` that describes the campaign.
- `source` (per indicator): the `[S#]` that states this indicator. Required.

## Indicator types

| type | value | matched against |
|---|---|---|
| `branch` | exact name (or regex) | branches, PR head refs, workflow run branches, pushes by your login |
| `pr_title` | exact title (or regex) | PRs you opened anywhere; PRs in repos you can push to; run titles |
| `commit_message` | exact first line (or regex) | commits on default branches; run titles |
| `workflow_file` | glob, e.g. `.github/workflows/build-audit-*.yml` | workflow files and composite actions on default branches, files on disk |
| `file` | glob on the name (`.ci-*.sh`), the path tail (`public/fonts/x.woff2`), or a path as the source writes it (`~/.dev-env/`, `$HOME/.config/x.py`, `/tmp/x`): a folder counts | every file path on default branches, install hooks, files on disk (the walk, the exact path, drop folders, package folders) |
| `string` | substring | workflow and composite action contents, startup items, VS Code tasks, crontab, shell history |
| `ip`, `domain`, `url` | the address, defanged or not | the same contents, plus open connections (IPs) |
| `sha256` | 64 hex characters | files named like a `file` IOC, startup items and the programs and scripts they run, the antivirus target list (recent Downloads and temp files, flagged files, new extensions), `.pth` files |
| `package` | name, with `ecosystem` and optional `versions` | every lockfile; editor extensions (`ecosystem: "vscode"`); browser extensions (`ecosystem: "chrome"` with the 32-letter ID, or `"firefox"` with the add-on ID) |
| `cache_key_prefix`, `artifact_prefix` | prefix | GitHub Actions caches and artifacts |
| `cron_tag` | substring | crontab, startup items |
| `process` | substring | running processes |
| `azure_fedcred_prefix` | prefix | Azure AD federated credentials |
| `actor` | a GitHub login the source names | annotates findings by that login; its PRs, runs and default-branch pushes in your repositories are suspicious on their own (5 per repository) |
| `repo_name` | exact repository name (or regex), e.g. `s1ngularity-repository` | repositories you can see, repositories your login created or made public (event stream) |
| `repo_description` | substring, e.g. `Sha1-Hulud: The Second Coming` | descriptions of the repositories you can see |
| `runner_name` | exact self-hosted runner name (or regex), e.g. `SHA1HULUD` | self-hosted runners of repositories you administer (a `string` equal to the name also matches) |

Ecosystems: `npm`, `pypi`, `crates.io`, `go`, `packagist`, `rubygems`, `vscode`
(common spellings such as `node`, `rust`, `php`, `ruby`, `OpenVSX` are
understood). A package in another ecosystem (`maven`, `nuget`, `homebrew`) is
kept, but ultraguard has no reader for it: `ioc set` says so and `scan deps`
reports it as a coverage gap. Check those by hand and say so in the answer.

## Rules of thumb

- **Mark common names `"weak": true`.** A file, workflow or message that
  ordinary projects also have (`bundle.js`, `setup.js`, `.vscode/tasks.json`,
  `lint.yml`, `codeql.yml`) is only suspicious on a name match. Add the
  campaign's sha256 values when it publishes them: a hash match settles it.
  On disk, an exact file name (no wildcard) from a campaign that publishes
  hashes is treated as weak automatically until its hash matches. Keep a
  distinctive pattern (`.ci-*.sh`, `wfx-docs`) strong.
- **`weak` works for every type.** On a `commit_message` or `pr_title` it
  turns matches into suspicious ones: use it only for messages ordinary
  projects also write, never for the campaign's own (`chore: add ci helper`).
- **A hash identifies one sample.** Payloads are often rebuilt per victim
  (different callback, different token), so a published sha256 may match
  nothing even on a hit repository. Keep the hash, and keep the name and
  string indicators that survive rebuilds (`WF_CTOKEN`, `wfx-loot-`).
- **Vague dates.** A source that says "in October" gives `since`: the 1st of
  that month. Say in the answer that the date is approximate.
- **YARA rules a source publishes** are worth more than any single hash:
  save them verbatim to `<run>/yara/<name>.yar` and pass `--yara` (see the
  host reference).
- **Versions are listed one by one.** Expand a range a source writes as
  `0.0.16-18` into `["0.0.16", "0.0.17", "0.0.18"]`, after checking the source
  means a range. `ioc set` refuses ranges (`>=1.0 <1.2`), wildcards and a
  version inside the name (`name@1.2.3`). A package listed with no version flags every version: use
  another source that lists versions, or mark it `"weak": true`.
- **Long package tables:** extract them with a short script from
  `<run>/sources/S#.md` rather than by hand, and spot-check a few rows against
  the page. Tables vary (`,`, `;` or `|` separators, bullet lists), so print
  what you parsed before `ioc set`. Raw IOC files a write-up links to (CSV, a
  GitHub repo) can be fetched with `intel` too: they become sources.

- **Exact by default.** `commit_message` and `pr_title` match the whole first
  line, case-insensitive: `ci: cleanup` must not flag every `ci: cleanup
  workflows`. When the source shows variants (`docs: add dependency audit
  notes` next to `docs: dependency audit notes`), write one regex.
- **A pattern needs `"regex": true`.** Without it the value is compared as an
  exact string: `chore/[a-z0-9]{8}` would never match a branch. `ioc set`
  refuses a branch holding a character git forbids (`[`, `*`, `?`, a space)
  and a title or message that looks like a regex; write `"regex": false` to
  keep such a text literal.
- **Anchor regexes.** `^chore/[a-z0-9]{8}$`, not `chore/[a-z0-9]{8}`. A regex
  that matches an empty string or ordinary text (`wfx|`, `^(docs: )?`) is
  refused: it would flag every repository.
- **Generic patterns produce noise.** A random-looking branch pattern also
  matches real branches. Keep it, and judge each hit against its run title and
  actor before calling it compromised.
- **Defanged is fine** for `ip`, `domain` and `url`: `194.150.166[.]244` and
  `hxxp://` are re-armed for matching; keep them defanged in the file. A
  `string` is tried as written and re-armed. Other types (branches, messages,
  globs, regexes) are never re-armed: `[.]` there means what it says.
- **Dates.** `since` cannot be in the future and `until` cannot precede it:
  `ioc set` refuses both, since such a window matches nothing.
- **One campaign per attack.** Two articles about the same attack are one
  campaign with two sources. Two attacks are two campaigns.
- **Related campaigns the article links to** (an earlier wave, the same
  actor) are separate campaigns: fetch their own write-up first.
- If `ioc set` refuses the file, fix what it names. It never accepts an
  indicator whose source failed to fetch.
