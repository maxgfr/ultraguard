// Shared shapes of a run directory. Everything a scan learns is written to the
// run as JSON, so the agent, `report` and `check` all read the same facts.

/** A page the agent found and the engine fetched: what every IOC must cite. */
export interface Source {
  id: string; // "S1"
  url: string;
  title?: string;
  fetchedAt: string;
  /** The file under <run>/sources/ holding the extracted text. */
  file?: string;
  /** Why the fetch failed, when it did. A source that failed cannot ground an IOC. */
  error?: string;
  origin: "web" | "osv" | "manual" | "rules";
}

export const INDICATOR_TYPES = [
  "branch",
  "pr_title",
  "commit_message",
  "file",
  "workflow_file",
  "string",
  "sha256",
  "ip",
  "domain",
  "url",
  "package",
  "cache_key_prefix",
  "artifact_prefix",
  "cron_tag",
  "process",
  "azure_fedcred_prefix",
  "actor",
] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

export interface Indicator {
  type: IndicatorType;
  /** The literal, glob (file, workflow_file) or regex (when `regex` is true). Package: the package name. */
  value: string;
  regex?: boolean;
  /**
   * A name that ordinary files also have (`bundle.js`, `tasks.json`, `lint.yml`):
   * a match alone is "suspicious", not "compromised". A matching sha256 still
   * makes the file compromised.
   */
  weak?: boolean;
  /** The [S#] that states this indicator. Required: no IOC from memory. */
  source: string;
  /** package only: npm, pypi, crates.io, go, packagist, rubygems, vscode. */
  ecosystem?: string;
  /** package only: affected versions. Empty or absent means every version. */
  versions?: string[];
  note?: string;
}

export interface Campaign {
  id: string;
  title: string;
  sources: string[];
  /** ISO date the campaign started; scans look at activity from here on. */
  since: string;
  until?: string;
  indicators: Indicator[];
}

export interface IocFile {
  campaigns: Campaign[];
}

export const SURFACES = ["github:account", "github:repos", "host", "deps", "cloud"] as const;
export type Surface = (typeof SURFACES)[number];

/**
 * How bad one finding is on its own.
 * - compromised: an IOC matched activity, a file or a process.
 * - exposed: you were in the blast radius (a hit repo you clone, secrets a hit workflow could read).
 * - suspicious: no IOC matched but something changed in the window that a human must judge.
 * - info: context for the report, no action.
 */
export const SEVERITIES = ["compromised", "exposed", "suspicious", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface Finding {
  id: string; // "F1"
  surface: Surface;
  severity: Severity;
  /** What was hit: a repo full name, a path, a cloud resource. */
  subject: string;
  /** One line a human can read. */
  title: string;
  /** Who did it, when the surface knows (a GitHub login). */
  actor?: string;
  /** "own" when the actor is the scanning account, "other" when it is someone else. */
  scope?: "own" | "other";
  at?: string;
  campaign?: string;
  /** The [S#] of the indicator that matched, when one did. */
  source?: string;
  indicator?: { type: IndicatorType; value: string };
  /** Where to see it again: an API path, a URL, a file path, a command. */
  evidence: { kind: "api" | "url" | "file" | "command"; ref: string; excerpt?: string };
  /** A stable key so a re-scan does not add the same finding twice. */
  key: string;
  /** For a CI run or a default-branch commit: did it carry attacker code, a docs-only probe, or the repository's own code? */
  ciRun?: "attacker" | "probe" | "own-code";
}

/** A thing a scan could not look at. Gaps are not absence. */
export interface Gap {
  surface: Surface;
  what: string;
  why: string;
  /** How to close it, when there is a way. */
  fix?: string;
}

export const VERDICTS = ["COMPROMISED", "EXPOSED", "REVIEW", "CLEAN", "UNKNOWN"] as const;
export type Verdict = (typeof VERDICTS)[number];

export interface SurfaceResult {
  surface: Surface;
  scanned: boolean;
  /** What the scan covered, in numbers: repos, files, lockfiles, packages. */
  stats: Record<string, number>;
  startedAt: string;
  finishedAt?: string;
}
