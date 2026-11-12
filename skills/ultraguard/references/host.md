# The host scan (macOS and Linux)

The walk starts at `--roots` (default: the home directory), goes `--depth`
levels (default 6), skips heavy and system trees (`node_modules`, `.git`,
`Library`, caches, build output, media folders) and stops after 400,000
entries. Everything it skipped is a coverage gap.

| Check | Severity on a match |
|---|---|
| Files named like a `file` / `workflow_file` IOC, with their sha256 | compromised |
| `.vscode/tasks.json` with `"runOn": "folderOpen"` | compromised with an IOC, suspicious without |
| Startup items: `~/Library/LaunchAgents`, `/Library/LaunchAgents`, `/Library/LaunchDaemons` (macOS); systemd user and system units, autostart, `/etc/cron.d` (Linux) | compromised with an IOC; suspicious when written during the window |
| Shell history (zsh, bash, fish, python) mentioning an IOC | exposed |
| `/etc/hosts` mentioning an IOC | compromised |
| Editor extensions (VS Code, Insiders, Cursor, Windsurf, VSCodium) named by a `package` IOC with `ecosystem: "vscode"` | compromised |
| Local clones of repositories the GitHub scan found hit | exposed |
| crontab lines with an IOC (`crontab -l`) | compromised |
| Open connections to an IOC IP (`lsof -nPi` on macOS, `ss -tunap` on Linux) | compromised |
| Running processes matching a `process` IOC | compromised |

## Judging a suspicious startup item

Read-only, on macOS:

- `plutil -p <plist>`: what it runs and when;
- `codesign -dv --verbose=2 <binary>`: who signed it;
- `pkgutil --file-info <path>`: which installer put it there;
- `ls -l@ <path>`: dates and the quarantine attribute.

On Linux: `systemctl --user cat <unit>`, and `dpkg -S` or `rpm -qf` for the
owning package. If the user installed or updated that software during the
window, say so and keep it at REVIEW for them to confirm. Otherwise treat it
as compromised.

## When the host is compromised

Every credential the machine holds is stolen: browser sessions, `~/.ssh`,
`~/.aws`, `~/.config/gcloud`, `~/.azure`, `~/.npmrc`, `~/.pypirc`,
`~/.docker/config.json`, `~/.kube`, the gh token, `.env` files, AI provider
keys. Rotation must happen from another, clean machine.
