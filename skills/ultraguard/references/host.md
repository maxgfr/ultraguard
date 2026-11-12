# The host scan (macOS and Linux)

Two layers. **IOC matching** finds what a campaign's sources name. **Machine
analysis** looks at what an analyst checks when no IOC is known yet: who
signed what starts at login, what the shell runs when a terminal opens, where
packages come from, which extensions are new. Each check collects facts and
risk signals. A signal makes a `suspicious` finding with the facts in its
title, and everything collected goes to `<run>/host-inventory.json`.

The walk starts at `--roots` (default: the home directory), goes `--depth`
levels (default 6), skips heavy and system trees (`node_modules`, `.git`,
`Library`, caches, build output, media folders) and stops after 400,000
entries. What it skipped is a coverage gap.

## IOC matching

| Check | Severity on a match |
|---|---|
| Files named like a `file` / `workflow_file` IOC, with their sha256 | compromised (suspicious for a `weak` name whose hash does not match) |
| `.vscode/tasks.json` with `"runOn": "folderOpen"` | compromised with an IOC, suspicious without |
| Startup items holding an IOC | compromised |
| Shell startup files (`.zshrc`, `.profile`…) or `/etc/hosts` holding an IOC | compromised |
| Shell history mentioning an IOC | exposed (it may have been typed while investigating) |
| Editor extensions named by a `package` IOC with `ecosystem: "vscode"` | compromised |
| Local clones of repositories the GitHub scan found hit | exposed |
| crontab lines, open connections (IOC IPs), running processes | compromised |

## Machine analysis (no IOC needed)

| Check | Suspicious when |
|---|---|
| Startup items: `~/Library/LaunchAgents`, `/Library/LaunchAgents`, `/Library/LaunchDaemons` (macOS); systemd units, autostart, `/etc/cron.d` (Linux) | the command fetches and runs code, opens a raw socket, decodes a payload, or runs from `/tmp`, `/Users/Shared` or an unknown hidden folder: at any date. Written in the last 30 days: always, with what it runs and who signed it (`codesign`) |
| Shell startup files | a line fetches and runs code, sets `DYLD_INSERT_LIBRARIES` / `LD_PRELOAD` / `NODE_OPTIONS=--require`, or redefines `sudo`, `ssh`, `git`, `gh`, `npm` |
| `~/.npmrc`, pip config | packages come from a registry other than npmjs.org or pypi.org |
| `~/.gitconfig` | global hooks (`core.hooksPath`) or a custom `sshCommand` |
| `~/.ssh/authorized_keys` | changed in the last 30 days (lists who can log in) |
| Editor extensions (VS Code, Insiders, Cursor, Windsurf, VSCodium) | first installed in the last 30 days (updates are ignored), with the publisher; flagged harder when sideloaded from a `.vsix` |
| crontab | a line fetches and runs code or opens a socket |
| Running processes | the executable lives in a temporary folder or an unknown hidden folder of your home |
| Startup items run by an interpreter (`/bin/bash script.sh`) | the script itself fetches and runs code, opens a socket, or lives in a temp folder |
| AI coding agents: `~/.claude/settings.json`, `~/.claude.json`, `.mcp.json`, Cursor, Codex, Gemini, Windsurf, Claude Desktop, VS Code `mcp.json` (home and every clone) | a hook, status line or API key helper (or the script it runs) fetches and runs code; an MCP server runs a campaign package (compromised) or a risky command; a base URL sends prompts to a non-vendor host. Unpinned `npx -y` MCP packages are listed as info |
| Agent instruction files (CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules, .cursor/rules, copilot instructions) | they hold invisible characters (zero-width, bidi, tag characters): a prompt-injection trick |
| Git hooks in local clones | a hook fetches and runs code, or is recent and not from a known hook manager (husky, lefthook, pre-commit...) |
| npm's download cache (`~/.npm/_cacache`) | npm downloaded a campaign package (exposed, with the date): installed then removed still counts |
| File names | a name holds a line break or another control character (macOS's `Icon\r` excepted) |

## Signature scanners

| Scanner | When | Severity on a match |
|---|---|---|
| ClamAV (`clamdscan` when clamd runs, else `clamscan`) | installed; on by default, `--no-av` to skip | compromised |
| YARA | `--yara <file or folder of .yar>`, rules saved from a source or a community set | compromised, citing `--yara-source` |

Both scan the same targeted list: startup items and the programs they run,
the files the other checks flagged, files changed in the last 30 days in
`/tmp`, `/var/tmp`, `/Users/Shared` and `~/Downloads`, and newly installed
extensions. `--av-full` scans every `--roots` (or the whole home) instead.
ClamAV signatures older than 7 days are refreshed first (`freshclam`, or
`ultraguard rules update` at any time); only a refresh that failed leaves a
gap, with freshclam's error. ClamAV
knows common malware families; it rarely knows a supply-chain payload from
this week, which is what the IOCs and the machine analysis are for.

Plus one `info` finding: the **credential stores** on the machine (AWS, GCP,
Azure, npm, PyPI, Docker, Kubernetes, gh, git, SSH and GPG keys, `.env`
files), recorded by path and kind, never by value. It is what a stealer here
would take, and REMEDIATION.md lists exactly these when the host is
compromised.

Not read: login items registered through System Settings (the background
task database needs `sfltool dumpbtm` as an admin), browser extensions, kernel
and system extensions. They are a coverage gap.

## Judging a suspicious item

Start from `host-inventory.json`: each startup item carries its command, its
executable, whether that exists, its signer and team ID, and its signals.
Then, read-only:

- macOS: `plutil -p <plist>` (what runs, when), `codesign -dv --verbose=2
  <binary>` (who signed), `spctl -a -vv <app>` (Gatekeeper's verdict),
  `pkgutil --file-info <path>` (which installer), `ls -l@ <path>` (dates,
  quarantine attribute), `mdls -name kMDItemWhereFroms <file>` (download
  origin).
- Linux: `systemctl --user cat <unit>`, `dpkg -S <path>` or `rpm -qf <path>`.

Signed by the vendor you expect, in `/Applications`, installed or updated by
the user on that date: say so and leave it at REVIEW for the user to confirm.
Unsigned, ad-hoc signed, in a temporary or hidden folder, or not installed by
anyone the user remembers: treat it as compromised.

A remote-access tool (RustDesk, AnyDesk, TeamViewer, ScreenConnect) that the
user did not install is a classic intrusion: ask first.
