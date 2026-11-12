# ultraguard

An AI antivirus for an agent. A security firm publishes a campaign: compromised
GitHub accounts pushing a CI secret stealer, a worm in npm, a malicious VS Code
extension. Were you hit? The agent reads the write-ups, turns each one into
indicators of compromise (IOCs) that cite it, and ultraguard sweeps for them:

- your **GitHub account**: did your login open the probe PR, push the branch,
  author the commit?
- every **repository you can push to**: did anyone do it there, and did the
  payload run in CI?
- **this machine**: files, hashes, startup items, VS Code auto-run tasks,
  crontab, open connections, shell history, editor extensions;
- your **lockfiles**: the campaign's packages, and OSV's malicious-package
  advisories for every locked version;
- your **cloud**: roles that trust everyone, keys minted during the campaign,
  federated credentials.

Then the agent judges what an IOC cannot settle alone and writes a verdict
per surface. `ultraguard check` refuses an answer that cites a finding that
does not exist, claims a compromise without evidence, or calls a surface
clean when it is not. ultraguard is read-only: it prints the remediation, the
user runs it.

```bash
npx skills add maxgfr/ultraguard
```

## Invocation

```
/ultraguard https://www.aikido.dev/blog/compromised-github-accounts-push-ci-secret-stealer-to-tens-of-thousands-of-repositories
/ultraguard check I wasn't hacked by the latest supply-chain attacks
/ultraguard am I affected by the Shai-Hulud npm worm?
/ultraguard set it up as a daily routine
```

## Why

Checking yourself against an incident write-up by hand means reading the
article, copying its IOCs, and querying GitHub repo by repo, then the disk,
the lockfiles and the cloud. It is easy to stop at the first clean result. The
first real run of ultraguard, on the campaign above, found probe PRs from a
compromised collaborator in 11 organisation repositories. A manual check the
same day had found 4, because the attacker had deleted the branches and
closed the PRs. It also flagged the two workflow runs the attacker deleted
to cover the leak.

What the model does best (searching, reading, judging) stays with the model.
What it does badly (exhaustive, repeatable sweeps, citing exactly what it saw)
moves into a deterministic CLI.

## What you get

A run directory with:

- `sources.json` and `sources/S#.md`: every page the IOCs came from, as `[S#]`;
- `iocs.json`: the campaigns and their indicators, each citing its `[S#]`;
- `findings.json`: every match as `[F#]`, with its evidence (API path, URL,
  file, command), the actor, and whether it was your login or someone else's;
- `gaps.json`: what could not be looked at. Gaps are not absence;
- `REPORT.md`: verdict per surface (COMPROMISED, EXPOSED, REVIEW, CLEAN,
  UNKNOWN), repositories where attacker code ran listed first, timeline,
  coverage;
- `REMEDIATION.md`: the commands to run, most urgent first. ultraguard runs none.

## Commands

```bash
ultraguard doctor --probe                                  # what this machine lets it see
ultraguard search "<query>" --out <run>                    # keyless web search, when the host has none
ultraguard intel <url>... --out <run>                      # or --web-results <hits.json>
ultraguard ioc set --file iocs.json --out <run>            # every indicator must cite a fetched [S#]
ultraguard sweep --out <run>                               # github, host, deps, cloud
ultraguard scan github|host|deps|cloud --out <run>         # one surface
ultraguard report --out <run>
ultraguard check ANSWER.md --out <run>
ultraguard watch plan|commit --out <run>                   # the routine mode
```

`ultraguard --help` lists every flag. The bundle (`scripts/ultraguard.mjs`)
runs on Node 18+ with no install. It needs the GitHub CLI logged in, plus the
`aws`, `gcloud` or `az` CLIs for the cloud surface.

## Routine mode

`watch plan` drops the articles already handled, `watch commit` alerts only on
findings never alerted before (exit code 10), and known campaigns are swept
again every week. Run it as a Claude Code cloud routine (GitHub and cloud), or
locally with launchd, cron or `/loop` to cover the machine too. See
[routine](skills/ultraguard/references/routine.md).

## Privacy

Nothing leaves the machine except `gh` calls to the GitHub API with your own
token, the fetches of the articles you chose, and OSV queries of package names
and versions. No secret value is read: secrets are listed by name to be rotated.

## License

MIT.

## On request or explicit-only

The skill ships **model-invocable, on request**: the agent may call it through
its skill tool, but the skill's description restricts it to explicit requests,
so the agent calls it when you ask, not on its own. Install it with `npx skills
add maxgfr/ultraguard`, or use the bundle directly: `node
skills/ultraguard/scripts/ultraguard.mjs --help`.

Making it explicit-only is one setting, read by Claude Code and OpenCode,
applied to the **installed** copy of the skill:

| Host | Shipped, on request | Explicit-only |
| --- | --- | --- |
| Claude Code, OpenCode | no `disable-model-invocation` in `SKILL.md` | add `disable-model-invocation: true` |

Claude Code can do it without touching the file:
`"skillOverrides": { "ultraguard": "user-invocable-only" }` in `settings.json`
leaves `/ultraguard` working while hiding the skill from the model.
