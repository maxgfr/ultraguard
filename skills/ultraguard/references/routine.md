# Running ultraguard as a routine

`watch` is the on-demand loop, scoped to what is new since the last run. Its
state lives in `--state` (default `~/.ultraguard`, or `ULTRAGUARD_HOME`): the
sources already handled, the campaigns already seen, and the findings already
alerted.

```bash
# 1. Search the news: your search tool, or keyless (works on a headless runner):
ultraguard search "GitHub Actions supply chain attack <month year>" --out <run>
ultraguard search "malicious npm packages <month year>" --out <run>
#    then, with the hits you keep:
ultraguard watch plan --web-results <hits.json> --out <run>
#    NOTHING NEW: stop here and say so in one line.
#    Otherwise it fetched the new sources. Every --resweep-days (default 7) it
#    also writes <run>/iocs.carried.json so known campaigns are swept again.
# 2. Fill <run>/iocs.json for the new sources (skip it if there are none):
ultraguard ioc set --file <run>/iocs.json --out <run>      # carried campaigns are merged in
# 3. (on a cloud runner: sweep --surfaces github,cloud --out <run>)
ultraguard sweep --out <run>
# 4.
ultraguard watch commit --out <run>
#    exit 0: nothing new. 10: ALERT (new findings). 20: a surface could not be scanned.
```

`watch commit` alerts only on findings it never alerted before, so a
compromise already reported does not alert again every day. New suspicious
items (a fresh startup item that fetches and runs code, a new MCP server with
a risky command) alert as REVIEW, once each. A run that could not scan every
surface leaves its new sources pending for the next run (exit 20): gh logged
out, a cloud CLI installed but logged out or refused every listing. A surface
with nothing to scan (no aws, gcloud or az installed at all) and a surface the
sweep was told to leave out with `--surfaces` do not count: they stay UNKNOWN
in the report, but the routine settles. A page that cannot be fetched is
listed apart, not counted as new, and given up after 3 runs. Each sweep keeps the
antivirus current by itself: ClamAV signatures and YARA-Forge rules older
than 7 days are refreshed before the host scan.

Opt-in notification: `watch commit --notify-issue owner/private-repo` opens a
GitHub issue with the alert lines and the verdicts (the full report stays on
the machine) when there is an alert. If the issue cannot be opened, the
findings alert again on the next run. It writes to GitHub, so
use it only when the user asked for it and named the repository. Prefer a
private repository: the report names repositories and accounts.

## Where to run it

| Routine | Sees | Setup |
|---|---|---|
| Claude Code cloud routine (`/schedule`, daily) | web, GitHub, cloud if credentials are present | the prompt below with `sweep --surfaces github,cloud`: the runner's own disk is not the user's machine, so host and deps are left out (UNKNOWN in the report, not blocking) |
| Local: launchd or cron running Claude Code headless | everything, this machine included | a LaunchAgent that runs `claude -p "<the prompt below>"` once a day |
| `/loop` in an open session | everything, while the session lives | `/loop 24h <the prompt below>` |

The prompt for any of them:

> Run ultraguard in routine mode: search the threat-intel news of the last 3
> days, then `watch plan`, extract IOCs for the new sources, `ioc set`,
> `sweep`, `watch commit`. Reply in one line when there is nothing new.
> On an alert, give the verdicts and the first remediation steps.

Never schedule a routine for the user unprompted. Give them these lines and
let them choose.
