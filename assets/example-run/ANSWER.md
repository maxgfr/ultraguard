# ultraguard: wfx-loot

- **Your GitHub account: CLEAN.** No probe PR, commit or branch from your login matches the campaign [S1].
- **Repositories you can push to: COMPROMISED.** The account `collab-bot` pushed the stealer to `acme/site` main and its Deploy workflow ran it [F2][F3]; run #22 was deleted afterwards [F4]. `acme/docs` only got the probe PR [F5].
- **This machine: REVIEW.** A remote-desktop LaunchAgent was rewritten during the window [F6]; confirm you installed or updated it.
- **Dependencies: CLEAN** against the campaign's packages and OSV.
- **Cloud: UNKNOWN**, the aws CLI is not installed.

## Do first

1. Rotate every secret `acme/site` CI could read, at its source [F3].
2. Tell the `acme` admins that `collab-bot` is compromised [F1].

## Coverage

Not checked: the GitHub security log, and AWS.
