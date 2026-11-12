# Contributing

## Architecture in one minute

A thin, deterministic CLI and a markdown playbook. `src/intel.ts` fetches the
sources the agent found, `src/ioc.ts` validates and compiles the IOCs,
`src/scan/` sweeps each surface (`github`, `host`, `deps`, `cloud`) through an
injectable `Runner`, `src/verdict.ts` computes the verdicts, `src/report.ts`
writes REPORT.md and REMEDIATION.md, and `src/check.ts` holds the agent's
answer to the findings. `skills/ultraguard/SKILL.md` and its `references/`
tell the agent how to use it. tsup bundles everything, the vendored webindex
engine included, into one dependency-free `scripts/ultraguard.mjs`, copied
into the skill.

## Prerequisites

Node 20+ and pnpm for development; the bundle runs on Node 18+.

```bash
pnpm install
pnpm run typecheck && pnpm run lint && pnpm test && pnpm run check:build && pnpm run eval
```

## Rules

1. TDD: write the failing test first. External commands go through a fake
   `Runner` (`tests/helpers.ts`); tests never call `gh`, `lsof` or a cloud CLI.
2. Read-only, always. A scan never writes outside its run directory.
3. A new check reports what it could not see as a gap, not as clean.
4. Reuse an engine export before writing a helper (`webindex skill check`
   refuses a re-declared one).
5. `pnpm run build` and commit the bundle with the source: CI fails when they differ.
6. SKILL.md description stays under 1000 characters; every documented
   `--flag` exists in `--help` (`webindex skill bundle`).

## Commits and releases

[Conventional Commits](https://www.conventionalcommits.org/): `feat:` → minor,
`fix:` → patch, `!` → major. semantic-release cuts the release from `main` in
CI. Commits are signed.
