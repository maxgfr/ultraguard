# Where to look for attacks

The engine fetches; you search. Use your host's web search tool, or, when
there is none, `ultraguard search "<query>" --out <run>`: keyless, through the
webindex engine, every hit appended to `<run>/search-hits.json`.
`ultraguard search --news --out <run>` runs the whole "anything new?" set
below for you (supply chain, then malware for this OS, each with the current
month and year) and says which queries got no answer. Keep the primary
write-ups (the research team that found the attack), drop the aggregators
that only repeat them, then pass the kept ones to `intel`.

Two kinds of news can reach the user, and a sweep with no article covers
both: **supply-chain attacks** (their accounts, repositories, packages and
CI) and **machine malware** (stealers, backdoors and droppers aimed at the
OS they run, macOS or Linux). `doctor` names the OS.

If both fail (the keyless engines throttle some addresses, and a host
search can refuse a query), retry `search` a few minutes later, fetch the
pages the primary article itself links to with `intel`, or ask the user for
the article. Never fill the gap from memory: an indicator needs a fetched
source.

A secondary write-up is still worth a source when it adds indicators the
primary one lacks (another vendor saw a second variant). Keep it, and cite it
for those indicators only.

## Primary sources

| Who | What they publish |
|---|---|
| Aikido Security blog, aikido.dev/blog | npm, PyPI, GitHub Actions campaigns, with IOCs |
| Socket, socket.dev/blog | malicious packages across registries |
| StepSecurity, stepsecurity.io/blog | GitHub Actions compromises (tj-actions style) |
| Wiz, wiz.io/blog | cloud and CI supply-chain incidents |
| Datadog Security Labs, securitylabs.datadoghq.com | campaigns and IOCs |
| GitHub Security Lab and the GitHub blog | platform-side incidents and advisories |
| OSV, osv.dev (`MAL-` ids) | malicious package records; `scan deps` queries it for you |
| GitHub Advisory Database, github.com/advisories (malware) | the same, GitHub-curated |
| CISA, cisa.gov/news-events/alerts | government alerts on widespread compromises |
| Koi Security, Checkmarx Zero, JFrog, Phylum, ReversingLabs, Snyk | registry malware and IDE extension campaigns |

## Primary sources: machine malware

macOS:

| Who | What they publish |
|---|---|
| Objective-See, objective-see.org/blog | macOS malware teardowns, with hashes, paths and launchd plists |
| Jamf Threat Labs, jamf.com/blog | macOS stealers and backdoors, signing teams and bundle ids |
| Moonlock (MacPaw), moonlock.com | macOS stealer families (AMOS and its forks), infection chains |
| Kandji, kandji.io/blog | macOS malware analyses with IOCs |
| SentinelOne Labs, sentinelone.com/labs | macOS and Linux malware, nation-state backdoors |
| Huntress, huntress.com/blog | incidents seen on managed Macs, ClickFix chains |
| Intego, intego.com/mac-security-blog | new macOS threats, fake installers |
| Malwarebytes Labs, malwarebytes.com/blog | stealers, fake apps, malvertising |
| Unit 42 (Palo Alto Networks), unit42.paloaltonetworks.com | AMOS builds, persistence, C2 infrastructure |
| Microsoft Threat Intelligence, microsoft.com/security/blog | ClickFix on macOS, cross-platform campaigns |
| Kaspersky Securelist, securelist.com | macOS stealers and backdoors with full IOC lists |
| WithSecure Labs, labs.withsecure.com | macOS backdoors and stealers (smart-contract C2) |
| Elastic Security Labs, elastic.co/security-labs | macOS and Linux malware with detection rules |

Linux:

| Who | What they publish |
|---|---|
| Elastic Security Labs, elastic.co/security-labs | Linux backdoors, rootkits, detection rules |
| Sysdig, sysdig.com/blog | cloud and container malware, cryptominers |
| Aqua Nautilus, aquasec.com/blog | Linux and container campaigns, honeypot captures |
| Wiz, wiz.io/blog | Linux malware on cloud hosts |
| Trend Micro Research, trendmicro.com/en_us/research | Linux malware families and botnets |

A YARA rule a write-up publishes is worth saving (`--yara`, see
[host](host.md)). Apple's own XProtect updates add rules for families it
learned of: a family named there is worth a search for its write-up.

## "Anything new?": queries for a sweep with no article

Run several, scoped to the last 30 days (add the month and year):

- `GitHub Actions supply chain attack <month year>`
- `compromised GitHub accounts malicious pull requests <month year>`
- `malicious npm packages campaign <month year>`, then the same for PyPI,
  crates.io, Go modules, Packagist, RubyGems
- `VS Code extension malware <month year>` (Open VSX too)
- `CI secret stealer workflow <month year>`
- `AI coding agent prompt injection supply chain <month year>`

Then, for the user's OS (`doctor` names it):

- macOS: `macOS stealer <month year>`, `macOS backdoor <month year>`,
  `ClickFix macOS <month year>`, `fake <developer tool> installer malware
  macOS <month year>` (the tools the user has: Homebrew, an IDE, an AI
  coding agent), `XProtect new rules <month year>`
- Linux: `Linux malware campaign <month year>`, `Linux backdoor <month year>`,
  `Linux cryptominer botnet <month year>`, `Linux infostealer <month year>`

`search --news` runs all of these (the developer-tool query as `fake
developer tool installer malware macOS`; refine it with the user's tools by
hand). A query it reports as not searched is unknown, not quiet: retry it.

Shortlist what can reach this user. Their ecosystems show in their lockfiles
and their repos, so read `doctor` and a `--surfaces deps` scan first if
unsure. A Windows-only stealer cannot hit a Mac; a PyPI worm is irrelevant to
a user with no Python. For machine malware the OS decides: a macOS stealer
matters to a Mac user, a Windows one does not, and a Linux server backdoor
matters only if the user runs Linux (or the write-up targets the developer
tools they use). Keep every machine-malware campaign that can run on this
OS: the loop checks the machine against each of them.

Keep 3 to 8 sources. Each kept source must state concrete indicators: a write-up
with no IOCs grounds nothing; look for the vendor's follow-up post.
