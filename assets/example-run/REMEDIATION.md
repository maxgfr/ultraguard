# Remediation

ultraguard runs none of these commands. Read each one, then run the ones that apply.

## 1. Repositories hit: assume every secret their CI could read is stolen

The activity came from `collab-bot`. Tell the owners or org admins: that account must be locked and its tokens revoked.

### acme/site: attacker code ran in CI, rotate now

- PR #8 "docs: dependency audit notes" (branch wfx-docs) by collab-bot [F1]
- Commit eeafd44d "chore: add ci helper" on main by collab-bot [F2]
- Workflow "Deploy" ran on main ("chore: add ci helper"), success, triggered by collab-bot [F3]
- Workflow "Deploy" is missing 1 run(s) in the window (#22): deleted runs [F4]

```sh
gh secret list -R acme/site                       # rotate each one AT ITS SOURCE, then update it here
gh variable list -R acme/site
gh api repos/acme/site/environments --jq '.environments[].name'   # environment secrets too
gh api repos/acme/site/actions/runs --paginate --jq '.workflow_runs[] | [.run_number,.head_branch,.display_title,.actor.login] | @tsv' | less
gh api repos/acme/site/commits --jq '.[] | [.sha[0:8], .author.login, .commit.message] | @tsv' | head -50
```

- Check branch protection and recent commit statuses: a forged `success` status can let a bad commit merge.
- Delete leftover attacker branches, caches and artifacts once you have kept a copy as evidence.

### acme/docs: probe PR only

The probe proves the attacker could write here. No attacker run was seen, but runs can be deleted: check the run list below for gaps, and rotate if any attacker run executed.

- PR #3 "docs: dependency audit notes" (branch wfx-docs) by collab-bot [F5]

```sh
gh secret list -R acme/docs                       # rotate each one AT ITS SOURCE, then update it here
gh variable list -R acme/docs
gh api repos/acme/docs/environments --jq '.environments[].name'   # environment secrets too
gh api repos/acme/docs/actions/runs --paginate --jq '.workflow_runs[] | [.run_number,.head_branch,.display_title,.actor.login] | @tsv' | less
gh api repos/acme/docs/commits --jq '.[] | [.sha[0:8], .author.login, .commit.message] | @tsv' | head -50
```

- Check branch protection and recent commit statuses: a forged `success` status can let a bad commit merge.
- Delete leftover attacker branches, caches and artifacts once you have kept a copy as evidence.

Org-level secrets shared with these repositories count too: `gh secret list --org <org>`.

## 2. To judge: changes in the window that match no IOC

- Workflow "Deploy" is missing 1 run(s) in the window (#22): deleted runs [F4]: `repos/acme/site/actions/workflows/5/runs`
- Startup item com.example.remote.plist was written during the campaign window (runs /Applications/Remote.app/Contents/MacOS/Remote) [F6]: `/Library/LaunchAgents/com.example.remote.plist`

Each one is either yours (an install, an update) or not. If it is not, treat it as compromised.

## 3. Close the coverage gaps

- `github:account` the account security log (sign-ins, token creation, OAuth grants): open https://github.com/settings/security-log
