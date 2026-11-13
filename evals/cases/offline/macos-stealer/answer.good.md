# ultraguard: AMOS backdoor on this Mac

- **This machine: COMPROMISED.** The backdoor binary `~/.mainhelper` matches the campaign's sha256 [F3], and the LaunchDaemon `/Library/LaunchDaemons/com.finder.helper.plist` runs the `~/.agent` watchdog that keeps it alive [F4][F1][F2]. The pasted command that installed it is in your shell history and reached the campaign's server `amos-c2.example` [F5].
- **Your GitHub account: UNKNOWN**, not scanned in this run.
- **Repositories you can push to: UNKNOWN**, not scanned.
- **Dependencies: UNKNOWN**, not scanned.
- **Cloud: UNKNOWN**, not scanned.

## Do first

1. Disconnect this Mac from the network, then from another device change the passwords of every account saved in the browsers and the keychain, starting with email and banking [F3].
2. Unload and remove the LaunchDaemon, `~/.agent` and `~/.mainhelper` (REMEDIATION.md lists the commands) [F4].
3. Revoke the browser sessions and API tokens this Mac held: the stealer takes cookies and developer secrets [F3].

## Coverage

Not checked: GitHub, dependencies and the cloud (only the host was swept), and no antivirus pass ran because ClamAV is not installed.

Source: the campaign write-up [S1].
