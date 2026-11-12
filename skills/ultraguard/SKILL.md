---
name: ultraguard
description: AI antivirus and incident response. Checks whether a supply-chain attack, compromised-account campaign or malicious package reported on the web has reached the user. You search the threat-intel news and turn each article into indicators of compromise (IOCs) that cite it. ultraguard sweeps the user's GitHub account and every repository they can push to, this machine, their lockfiles and their cloud for them, read-only. You then judge the findings and write a cited verdict per surface with the remediation. Use only when the user explicitly asks for ultraguard or to check whether they were hacked, compromised or hit by an attack, e.g. "am I affected by this attack <url>", "check I wasn't hacked", "scan for the latest supply-chain attacks", "est-ce qu'on m'a hacké", "vérifie que je ne suis pas touché par cette attaque". Can also run as a routine (watch). Never changes anything on its own.
license: MIT
metadata:
  version: 1.1.1
---

# ultraguard: the AI is the antivirus

**You find and judge; the engine sweeps.** You search the web for attacks, read
each article, and write its indicators of compromise (IOCs) in a file where
every indicator cites the page it came from. `ultraguard` sweeps every surface
for them and numbers each match as a finding `[F#]`. You read the findings,
judge what an IOC cannot decide alone, and write the verdict. `check` then
proves that the verdict cites only real findings and hides none.

## Invariants

- **I0 Read-only.** Never delete a branch, close a PR, revoke a key, rotate a
  secret or kill a process yourself. `REMEDIATION.md` lists the commands; the
  user runs them. Opening an issue (`--notify-issue`) happens only when the
  user configured it.
- **I1 No IOC from memory.** Every indicator cites an `[S#]` fetched in this
  run with `intel`; `ioc set` refuses one that does not. Copy indicators
  verbatim from the source, and re-arm defanged ones (`1.2.3[.]4` becomes
  `1.2.3.4`; ultraguard does it too).
- **I2 Every claim cites its evidence.** A sentence that says something is
  compromised, exposed or hit cites the `[F#]` that shows it. Never paste a
  secret value into the answer: name the secret, not its content.
- **I3 Gaps are not absence.** A surface that was not scanned is UNKNOWN, not
  clean. Say what was not checked (the Coverage section) every time.
- **I4 Your account vs. your repositories.** `github:account` asks whether the
  user's own login did what the attacker does. `github:repos` asks whether
  anyone did it in a repository they can push to. A collaborator's stolen
  token running a stealer in the user's org CI exposes that CI's secrets even
  when the user's account is clean. Never merge the two.
- **I5 Run `check` before you answer.** Fix every problem it reports.

## Run it

Node 18 or newer, no install, no key. `<skill-dir>` is the directory holding
this file; every `ultraguard …` below stands for
`node <skill-dir>/scripts/ultraguard.mjs …`. Pick one absolute run directory
per investigation and pass it as `--out` to every command that works on a run
(all but `doctor`).

```bash
ultraguard doctor --probe                    # what this machine lets ultraguard see
```

`gh` must be logged in (`gh auth status`). Cloud checks run only for the CLIs
(`aws`, `gcloud`, `az`) already logged in.

**GitHub API budget.** A sweep costs about 5 REST calls per repository you can
push to (1,000 for 200 repositories) out of 5,000 an hour, and the search API
allows 30 calls a minute. Run one sweep at a time, and keep some budget for
judging the findings with `gh api` afterwards. A refused call is recorded as a
coverage gap; `gh api rate_limit` shows what is left.

## Routing

| The user says | Do | Read |
|---|---|---|
| "am I affected by <url>" | `intel <url>`, then the loop below | [ioc-extraction](references/ioc-extraction.md) |
| "ultraguard", "check I wasn't hacked" (no article) | Search for attacks of the last 30 days (your search tool, or `ultraguard search`), shortlist the ones that can reach this user, `intel` them, then the loop | [threat-intel-sources](references/threat-intel-sources.md) |
| "am I hit by <campaign name>" | Search for that name, keep the primary write-ups, then the loop | [threat-intel-sources](references/threat-intel-sources.md) |
| "check only GitHub" / "only this machine" | the loop with `sweep --surfaces github` (or host, deps, cloud) | [github-surface](references/github-surface.md), [host](references/host.md) |
| "set it up as a routine", "watch every day" | `watch plan` / `watch commit` | [routine](references/routine.md) |
| A finding needs judgment (REVIEW) | Look at it yourself, read-only, then say whose it is | [verdicts](references/verdicts.md) |

## The loop

```bash
# 1. Search. With your own web search tool, save the hits you keep as JSON:
#    [{"url": "...", "title": "..."}]  (a list of URLs works too).
#    With none (a headless routine, a cloud runner), search keyless:
ultraguard search "<query>" --out <run> --limit 10           # → <run>/search-hits.json, one call per query
ultraguard intel --web-results <hits.json> --out <run>     # or: intel <url> <url> --out <run>
# → sources [S1], [S2]... with their text in <run>/sources/S#.md, and <run>/iocs.todo.json

# 2. Read every <run>/sources/S#.md. Write <run>/iocs.json from what they state.
ultraguard ioc set --file <run>/iocs.json --out <run>      # refuses an IOC with no fetched [S#]

# 3. Sweep. GitHub first: the host scan then looks for local clones of the repos it found hit.
ultraguard sweep --out <run>                               # github, host, deps, cloud
# → findings [F#], coverage gaps, REPORT.md and REMEDIATION.md

# 4. Judge, write the answer, check it.
ultraguard check <run>/ANSWER.md --out <run>
```

Scan flags: `--repos owner/a,owner/b` and `--max-repos <n>` narrow GitHub;
`--concurrency <n>` sets parallel repositories; `--roots ~/code,~/work` and
`--depth <n>` bound the walk of the disk; `--skip-live` skips crontab, sockets
and processes; `--no-osv` skips the OSV malicious-package feed (offline).
`ultraguard scan github|host|deps|cloud --out <run>` re-runs one surface; it
replaces that surface's findings rather than adding duplicates. `report --out
<run>` rewrites REPORT.md after a re-scan; `ioc show --out <run>` prints what
was set.

## Judge, then write the answer

The verdicts are computed: COMPROMISED (an IOC matched), EXPOSED (in the blast
radius: a clone of a hit repo, a C2 address in shell history), REVIEW (changed
during the campaign window, no IOC: you judge it), CLEAN, UNKNOWN (not
scanned). `check` refuses an answer that calls a non-CLEAN surface clean.

Your job is what the engine cannot do:

1. **Rule out false positives.** Read every COMPROMISED finding. A regex
   branch like `^chore/[a-z0-9]{8}$` can match a real branch. Open the
   evidence (`gh api …`, the URL, the commit diff) and say so if it is the
   user's own work. A finding stays in the data; your answer says it is a
   false positive and cites it.
2. **Resolve REVIEW findings.** The host scan analyses the machine beyond the
   IOCs (startup items with their signer, shell startup files, package and
   git settings, new extensions, odd processes) and writes the facts to
   `<run>/host-inventory.json`. A LaunchAgent written recently is either an
   install the user made or persistence: check it read-only
   ([host](references/host.md) lists the commands), then say which, and ask
   the user when only they can know.
3. **Rank by what ran.** REPORT.md separates repositories where the attacker
   made CI run from probe-only ones. Open the run or commit: a probe run that
   only executed the repository's own workflows on a docs change leaked
   nothing; a run of the attacker's script leaked everything it could read.
4. **Name who acted.** When another account did it, say so: its owner must
   lock it, and the org admins must know.

Write `<run>/ANSWER.md` in the user's language:

- one line per surface with its verdict and the `[F#]` that support it;
- what to do first, taken from REMEDIATION.md, most urgent first;
- a **Coverage** section: what was not checked and how to close it;
- the sources `[S#]` of the campaigns you checked.

Then `ultraguard check <run>/ANSWER.md --out <run>` and fix what it reports.

## Orchestration

With subagents (Claude Code), you may fan out the reading: one agent per
source writes that campaign's indicators, then you merge them into one
`iocs.json` (one campaign each). Run `sweep` once, yourself: it is
deterministic and shares one walk of the disk. Then re-check each COMPROMISED
finding before answering. Without subagents, do the same steps in order.

## Will not

- Act on a finding: no deletion, revocation, rotation or push. Ever.
- Guess an IOC the sources do not state, or call a surface clean because a
  scan could not reach it.
- Read secrets' values: `gh secret list` names them, which is enough to rotate.
- Upload anything: the only network calls are `gh` (GitHub API), your search
  queries, page fetches of your sources, and OSV queries of package names and
  versions.

## References

- [ioc-extraction](references/ioc-extraction.md): article → `iocs.json`, with the
  wfx-loot campaign as the worked example
- [threat-intel-sources](references/threat-intel-sources.md): where to search, and the
  queries for "anything new?"
- [github-surface](references/github-surface.md): what the GitHub scan reads and why
- [host](references/host.md): the macOS and Linux checks
- [cloud-persistence](references/cloud-persistence.md): AWS, GCP, Azure
- [verdicts](references/verdicts.md): severities, verdicts, judging REVIEW
- [routine](references/routine.md): `watch` as a daily cloud or local routine
- [citation-format](references/citation-format.md): `[S#]`, `[F#]` and what `check` enforces
