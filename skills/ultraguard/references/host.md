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
| Files named like a `file` / `workflow_file` IOC, with their sha256: in the walk, at the exact path the IOC gives (`~/x`, `$HOME/x`, `/tmp/x`, folders too), a bare name in the drop folders (Downloads, temp folders, caches, `~/Library/Application Support`, `~/.local/share`, `~/.config`, LaunchAgents) and one level below, and at the top of each clone's `node_modules` packages and virtualenv `site-packages` | compromised (suspicious for a `weak` name whose hash does not match; a hash that could not be computed is said, never read as a mismatch) |
| sha256 IOCs | compromised: files named like an IOC, startup items and the programs and scripts they run, and the antivirus target list |
| `.vscode/tasks.json` with `"runOn": "folderOpen"` | compromised with an IOC, suspicious without |
| Startup items holding an IOC (or the script they run, or named like a `file` IOC) | compromised |
| Shell startup files (`.zshrc`, `.zlogout`, `.bash_login`, `.bash_logout`, `.profile`, fish `config.fish` and `conf.d/*.fish`…) or `/etc/hosts` holding an IOC | compromised |
| Shell history mentioning an IOC | exposed (it may have been typed while investigating) |
| Editor extensions named by a `package` IOC with `ecosystem: "vscode"`, in VS Code and every fork or remote server (`~/.<editor>/extensions`: Cursor, Windsurf, VSCodium, Antigravity, Kiro, `~/.vscode-server`...); IOC strings in an extension's entry file | compromised |
| Browser extensions named by a `package` IOC with `ecosystem: "chrome"` (Chrome, Brave, Edge, Arc, Chromium, Vivaldi: the 32-letter ID) or `"firefox"` (the add-on ID), with `versions` | compromised |
| Git hooks, agent configs, hook scripts, skills and instruction files holding an IOC | compromised |
| pnpm's store and bun's cache holding a campaign package version | exposed |
| Local clones of repositories the GitHub scan found hit | exposed |
| crontab lines, open connections (IOC IPs), running processes | compromised. Every crontab line goes to the inventory; on macOS, lsof without root sees only this user's sockets (a gap says so) |

## Machine analysis (no IOC needed)

| Check | Suspicious when |
|---|---|
| Startup items: `~/Library/LaunchAgents`, `/Library/LaunchAgents`, `/Library/LaunchDaemons` (macOS, read through `plutil` so entities, CDATA and padding hide nothing); systemd units with their drop-ins and every `Exec*=` line, autostart, `environment.d`, `/etc/cron.d` and `cron.{hourly,daily,weekly,monthly}`, `/etc/crontab`, `/etc/rc.local`, `/etc/profile.d`, `/etc/ld.so.preload` (Linux) | the command fetches and runs code, opens a raw socket or reverse shell, decodes a payload, or runs from `/tmp`, `/Users/Shared`, macOS's per-user temp folder or an unknown hidden folder (`~` and `$HOME` expanded): at any date. Also: a `com.apple.*` label whose program is not Apple's own (an Apple-signed interpreter does not count), a signature that no longer verifies (`codesign --verify`), a program key that cannot be read, a file too large to be a startup item. Changed in the last 30 days (the later of mtime and ctime, so `touch -t` does not hide it): always, with what it runs and who signed it |
| Shell startup files | a line (backslash continuations joined) fetches and runs code, runs something from a temp or shared folder, sets `DYLD_INSERT_LIBRARIES` / `LD_PRELOAD` / `NODE_OPTIONS=--require`, puts a temp folder in `PATH`, redefines `sudo`, `ssh`, `git`, `gh`, `npm` (alias or function), shuts the machine down, sends `*_BASE_URL` to a non-vendor host, or points `PIP_INDEX_URL` / `NPM_CONFIG_REGISTRY` elsewhere |
| `~/.npmrc`, pip config | packages come from a registry other than npmjs.org or pypi.org (scoped `@x:registry` and `extra-index-url` included), or npm sets `script-shell`, `node-options`, a proxy or `strict-ssl=false`; pip trusts a host |
| `~/.gitconfig`, `~/.config/git/config` and their includes | global hooks (`core.hooksPath`), a custom `sshCommand`, `core.fsmonitor` running a program, a `credential.helper` command other than the forges' own, a risky `pager`/`editor`/`diff.external`/alias, an `insteadOf` sending github.com, gitlab.com or bitbucket.org elsewhere, `http.sslVerify = false`, `http.proxy` |
| `~/.ssh/authorized_keys` | changed in the last 30 days (lists who can log in) |
| Editor extensions (VS Code and every fork found in `~/.<editor>/extensions`) | first installed in the last 30 days (updates are ignored), with the publisher; flagged harder when sideloaded from a `.vsix`. Any date: a run of invisible variation selectors in the entry file (GlassWorm) |
| Browser extensions | versions installed or updated in the last 30 days go to the inventory (one info line) |
| crontab | a line fetches and runs code or opens a socket |
| Running processes | the executable (resolved through lsof when started by a relative path), or the script an interpreter runs, lives in a temporary folder or an unknown hidden folder of your home |
| Startup items run by an interpreter (`/bin/bash script.sh`, a path with spaces included) or a `#!` script run directly | the script itself fetches and runs code, opens a socket, or lives in a temp folder |
| AI coding agents: `~/.claude/settings.json`, `~/.claude.json`, `.mcp.json`, Cursor, Codex, Gemini, Windsurf, Claude Desktop, VS Code `mcp.json` (home and every clone), Claude Code plugins (`~/.claude/plugins/cache/*/*/*/{hooks/hooks.json,.mcp.json}`) | a hook, status line or API key helper (or the script it runs, found through `$CLAUDE_PROJECT_DIR`, `${CLAUDE_PLUGIN_ROOT}`, `$HOME`, quotes or a repo-relative path, with one level of local imports) fetches and runs code or holds a large encoded blob; an MCP server runs a campaign package (through `sh -c`, `env`, `npm exec`, `bun x`, `pnpx` too: compromised) or a risky command; a base URL (settings `env`, an MCP server's `env`, Codex `base_url`) sends prompts to a host other than the vendors' API hosts (`api.anthropic.com`, `api.openai.com`, Bedrock, Azure OpenAI, Vertex/Gemini); a project config sets `bypassPermissions` or `enableAllProjectMcpServers`. Unpinned `npx -y` MCP packages are listed as info |
| Agent instruction files (CLAUDE.md anywhere in a clone, CLAUDE.local.md, .claude/CLAUDE.md, AGENTS.md, GEMINI.md, .cursorrules, .clinerules, .windsurfrules, .cursor/rules, .claude/rules, .github/instructions, copilot instructions, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`), skills (`~/.claude/skills`, `~/.agents/skills`, `.claude/skills`), commands and sub-agents | they hold invisible characters (zero-width, bidi, tag characters, runs of variation selectors; emoji joiners and flag tags excepted), named by code point; a skill, command or sub-agent tells the agent to fetch and run code |
| Git hooks: `.git/hooks`, a clone's `core.hooksPath`, `.husky`, the global `core.hooksPath` | a hook fetches and runs code, or is recent and not generated by a known hook manager (recognised by its template, not by a word in it) |
| npm's download cache (`~/.npm/_cacache`), pnpm's store, bun's cache | they fetched a campaign package (exposed, with the date): installed then removed still counts |
| `.pth` files in site-packages (clone virtualenvs, uv and pipx tools, pyenv, Homebrew, `~/Library/Python`) | an `import` line decodes, executes or connects: it runs at every Python start (LiteLLM 1.82.8). Tool-generated `.pth` files are recognised by name and content |
| File names | a name holds a line break or another control character (macOS's `Icon\r` excepted) |

## Signature scanners

| Scanner | When | Severity on a match |
|---|---|---|
| ClamAV (`clamdscan` when clamd runs, else `clamscan`) | installed; on by default, `--no-av` to skip | compromised |
| YARA | `--yara <file or folder of .yar>`, rules saved from a source or a community set | compromised, citing `--yara-source` |

Both scan the same targeted list, most telling first: startup items and the
programs and scripts they run, the files the other checks flagged, newly
installed extensions (YARA reads their folders recursively), then files
changed in the last 30 days in `~/Downloads`, macOS's per-user temp folder,
`/tmp`, `/var/tmp` and `/Users/Shared` (3 levels, 2,000 files per folder;
what the caps leave out is a gap). `--av-full` scans every `--roots` (or the
whole home) instead. The run folder and ultraguard's state folder (the
community rule text) are never targets nor findings. On the targeted list
ClamAV reads files up to 2 GB; a file over its limits is a gap, as is a
scanner that was killed, timed out or could not load its database.
ClamAV signatures older than 7 days are refreshed first (`freshclam`, or
`ultraguard rules update` at any time); only a refresh that failed leaves a
gap in the run, with freshclam's error. ClamAV
knows common malware families; it rarely knows a supply-chain payload from
this week, which is what the IOCs and the machine analysis are for.

Plus one `info` finding: the **credential stores** on the machine (AWS, GCP,
Azure, npm, PyPI, Docker, Kubernetes, gh, git, SSH and GPG keys, `.env`
files), recorded by path and kind, never by value. It is what a stealer here
would take, and REMEDIATION.md lists exactly these when the host is
compromised.

Not read: login items registered through System Settings (the background
task database needs `sfltool dumpbtm` as an admin), Safari extensions, kernel
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
