# Where to look for attacks

The engine fetches; you search. Use your host's web search tool, or, when
there is none, `ultraguard search "<query>" --out <run>`: keyless, through the
webindex engine, every hit appended to `<run>/search-hits.json`. Keep the
primary write-ups (the research team that found the attack), drop the
aggregators that only repeat them, then pass the kept ones to `intel`.

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

## "Anything new?": queries for a sweep with no article

Run several, scoped to the last 30 days (add the month and year):

- `GitHub Actions supply chain attack <month year>`
- `compromised GitHub accounts malicious pull requests <month year>`
- `malicious npm packages campaign <month year>`, then the same for PyPI,
  crates.io, Go modules, Packagist, RubyGems
- `VS Code extension malware <month year>` (Open VSX too)
- `CI secret stealer workflow <month year>`
- `AI coding agent prompt injection supply chain <month year>`

Shortlist what can reach this user. Their ecosystems show in their lockfiles
and their repos, so read `doctor` and a `--surfaces deps` scan first if
unsure. A Windows-only stealer cannot hit a Mac; a PyPI worm is irrelevant to
a user with no Python.

Keep 3 to 8 sources. Each kept source must state concrete indicators: a write-up
with no IOCs grounds nothing; look for the vendor's follow-up post.
