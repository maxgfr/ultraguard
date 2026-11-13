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
| `not-swept` | no surface was scanned in this run (check before sweep, or a wrong `--out`): nothing else is checked |
| `omitted-surface` | a surface whose verdict is not CLEAN (REVIEW and UNKNOWN included) the answer never mentions; a COMPROMISED account must be named, not only its repository findings cited |
| `missing-verdict` | no line gives a surface's verdict: write `Machine: REVIEW [F6]`, the verdict word in capitals as the report writes it; "not scanned" also states UNKNOWN |
| `wrong-verdict` | the line for a surface gives another verdict than the computed one |
| `omitted-subject` | a compromised or exposed repository, file or resource the answer never names (full `owner/name`, or `folder/file` for a path) nor cites |
| `wrong-clean` | a sentence calls a surface clean (clean, safe, fine, no issues, no sign of compromise, propre, saine, RAS, a check mark...), or "everything is clean" / "you are not affected", when its verdict is not CLEAN |
| `no-coverage` | the run has coverage gaps and the answer mentions none |

It reads French as well as English. Cite in the same sentence, paragraph or
list item (`[F1, F2]` cites both); a parent bullet is grounded by the
citations of its nested sub-items. Sections headed Coverage, Couverture,
Sources, Gaps, Limits or Limites make no claim, so "the repositories hit were
not checked for cloud roles" there needs no citation; a clean claim is still
refused there, except under Sources. A heading names the surface of its
section: "## This machine" then "Clean." calls the machine clean. Code,
hedges ("I could not check whether...") and "clean" describing something else
("from another, clean machine", "pin a clean version") are not claims. A sentence that calls a finding a false positive still
cites it: "F11 is a false positive: an ordinary Unicode table [F11]."

Example: "The account `x` ran the stealer in `org/site` CI [F12][F14]."
