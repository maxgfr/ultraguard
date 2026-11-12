# Citations

Two kinds of tokens, both numbered by the run:

- `[S#]`: a source, a page fetched by `intel`, or an OSV advisory registered
  by `scan deps`. Listed in `<run>/sources.json`.
- `[F#]`: a finding, a match made by a scan. Listed in `<run>/findings.json`
  with its evidence (an API path, a URL, a file path or a command).

`ultraguard check <answer.md> --out <run>` refuses:

| Rule | What it means |
|---|---|
| `dangling` | a `[S#]` or `[F#]` that is not in the run |
| `uncited-claim` | a sentence calls something compromised, exposed, infected or hit, and its paragraph cites no real `[F#]` |
| `omitted-surface` | a COMPROMISED or EXPOSED surface the answer never mentions |
| `omitted-subject` | a compromised or exposed repository, file or resource the answer never names nor cites |
| `wrong-clean` | a sentence calls a surface clean (or "everything is clean") when its verdict is not CLEAN |
| `no-coverage` | the run has coverage gaps and the answer mentions none |

It reads French as well as English. Cite in the same sentence, paragraph or
list item; a parent bullet is grounded by the citations of its nested
sub-items. Sections headed Coverage, Couverture, Sources, Gaps or Limits make
no claim, so "the repositories hit were not checked for cloud roles" there
needs no citation. A sentence that calls a finding a false positive still
cites it: "F11 is a false positive: an ordinary Unicode table [F11]."

Example: "The account `x` ran the stealer in `org/site` CI [F12][F14]."
