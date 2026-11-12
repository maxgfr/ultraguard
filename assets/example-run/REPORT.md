# ultraguard report

Generated 2026-11-12T20:03:00.000Z for GitHub account `you`. Overall: **COMPROMISED**.

## Verdict

| Surface | Verdict | Evidence | Gaps |
|---|---|---|---|
| GitHub account (`github:account`) | **CLEAN** | none | 1 |
| GitHub repositories you can push to (`github:repos`) | **COMPROMISED** | [F1] [F2] [F3] [F5] | 0 |
| This machine (`host`) | **REVIEW** | [F6] | 0 |
| Local dependencies (lockfiles) (`deps`) | **CLEAN** | none | 0 |
| Cloud (AWS, GCP, Azure) (`cloud`) | **UNKNOWN** | none | 1 |

## Campaigns checked

- **wfx-loot: compromised GitHub accounts push a CI secret stealer** (`wfx-loot-2026-11`), since 2026-11-10: 27 indicators (branch, pr_title, commit_message, workflow_file, file, string, ip, sha256, cache_key_prefix, artifact_prefix, azure_fedcred_prefix, package, cron_tag) [S1]

## GitHub repositories you can push to

### acme/site: attacker code ran in CI

- **compromised**: PR #8 "docs: dependency audit notes" (branch wfx-docs) by collab-bot (2026-11-11 11:20) [F1][S1]
- **compromised**: Commit eeafd44d "chore: add ci helper" on main by collab-bot (2026-11-11 11:20) [F2][S1]
- **compromised**: Workflow "Deploy" ran on main ("chore: add ci helper"), success, triggered by collab-bot (2026-11-11 11:20) [F3][S1]
- **suspicious**: Workflow "Deploy" is missing 1 run(s) in the window (#22): deleted runs [F4]

### acme/docs: probe only, no attacker run seen

- **compromised**: PR #3 "docs: dependency audit notes" (branch wfx-docs) by collab-bot (2026-11-11 10:44) [F5][S1]

## This machine

- **suspicious**: Startup item com.example.remote.plist was written during the campaign window (runs /Applications/Remote.app/Contents/MacOS/Remote) (2026-11-10 17:24) [F6]

## Timeline

- 2026-11-10 17:24: /Library/LaunchAgents/com.example.remote.plist: Startup item com.example.remote.plist was written during the campaign window (runs /Applications/Remote.app/Contents/MacOS/Remote) [F6]
- 2026-11-11 10:44: acme/docs: PR #3 "docs: dependency audit notes" (branch wfx-docs) by collab-bot [F5]
- 2026-11-11 11:20: acme/site: PR #8 "docs: dependency audit notes" (branch wfx-docs) by collab-bot [F1]
- 2026-11-11 11:20: acme/site: Commit eeafd44d "chore: add ci helper" on main by collab-bot [F2]
- 2026-11-11 11:20: acme/site: Workflow "Deploy" ran on main ("chore: add ci helper"), success, triggered by collab-bot [F3]

## Coverage

Gaps are not absence: what was not looked at is not clean.

- `github:account`: the account security log (sign-ins, token creation, OAuth grants): GitHub exposes it to the web UI, not to a personal token (to close: open https://github.com/settings/security-log)
- `cloud`: AWS: the aws CLI is not installed

## Sources

- [S1] wfx-loot campaign pushes CI secret stealer to tens of thousands of repositories <https://www.aikido.dev/blog/compromised-github-accounts-push-ci-secret-stealer-to-tens-of-thousands-of-repositories>

## Findings register

- [F1] url: `https://github.com/acme/site/pull/8`: state=closed
- [F2] url: `https://github.com/acme/site/commit/eeafd44d`: added .ci-gvwxh6.sh
- [F3] url: `https://github.com/acme/site/actions/runs/21`
- [F4] api: `repos/acme/site/actions/workflows/5/runs`
- [F5] url: `https://github.com/acme/docs/pull/3`
- [F6] file: `/Library/LaunchAgents/com.example.remote.plist`
