# Severities and verdicts

Each finding has a severity:

- **compromised**: an IOC matched activity, a file, a process or a resource.
- **exposed**: in the blast radius. A local clone of a hit repo, an IOC
  address in shell history.
- **suspicious**: no IOC matched, but it changed during the campaign window
  in a way attackers use: a startup item, a new key, deleted runs. You judge it.
- **info**: context.

Each surface gets the worst verdict its findings support:

| Verdict | When |
|---|---|
| COMPROMISED | at least one compromised finding |
| EXPOSED | at least one exposed finding, none compromised |
| UNKNOWN | the surface could not be scanned (gh logged out, no cloud CLI) |
| REVIEW | scanned, only suspicious findings |
| CLEAN | scanned, nothing matched. Read its coverage gaps anyway |

`github:account` also turns COMPROMISED when a `github:repos` finding was made
by the user's own login.

## Your judgment changes the answer, not the data

When a COMPROMISED finding is a false positive (a real branch that happens to
match a pattern), say so in the answer with the evidence you checked. Do not
edit `findings.json`. When a REVIEW item is the user's own install, say so,
and say what you checked. `check` only refuses an answer that calls a surface
clean when its verdict is not CLEAN. Say "REVIEW: the remote-desktop agent, installed by you
on Oct 29 [F44]", not "clean".
