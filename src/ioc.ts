// The IOC file: validated on read, never trusted. An indicator that does not
// cite a fetched source is refused, because an IOC from the model's memory is a
// guess, and a guess either misses a real compromise or raises a false one.
import { escapeRegExp } from "./engine.js";
import { INDICATOR_TYPES, type Campaign, type Indicator, type IocFile, type Source } from "./types.js";

export interface IocProblem {
  path: string;
  message: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

export function validateIocs(raw: unknown, sources: readonly Source[], now = new Date()): { iocs?: IocFile; problems: IocProblem[] } {
  const problems: IocProblem[] = [];
  const usable = new Set(sources.filter((s) => !s.error).map((s) => s.id));
  const push = (path: string, message: string) => problems.push({ path, message });

  if (!raw || typeof raw !== "object" || !Array.isArray((raw as IocFile).campaigns)) {
    push("$", 'expected an object with a "campaigns" array');
    return { problems };
  }
  const campaigns = (raw as IocFile).campaigns;
  // No campaign, no matcher: every scan would come back CLEAN against nothing.
  if (campaigns.length === 0) push("$.campaigns", "at least one campaign");
  const ids = new Set<string>();
  for (const [ci, c] of campaigns.entries() as IterableIterator<[number, Campaign]>) {
    const at = `campaigns[${ci}]`;
    if (!c || typeof c !== "object") {
      push(at, "expected an object");
      continue;
    }
    if (!c.id || typeof c.id !== "string") push(`${at}.id`, "required string");
    else if (/^campaign-\d+$/.test(c.id))
      push(`${at}.id`, `"${c.id}" is the template's placeholder: name the campaign (e.g. wfx-loot-2026-11), the routine remembers campaigns by id`);
    else if (ids.has(c.id)) push(`${at}.id`, `duplicate campaign id "${c.id}"`);
    else ids.add(c.id);
    if (!c.title) push(`${at}.title`, "required string");
    const since = typeof c.since === "string" && ISO_DATE.test(c.since) ? Date.parse(c.since) : Number.NaN;
    if (Number.isNaN(since)) push(`${at}.since`, "required ISO date (YYYY-MM-DD or full timestamp)");
    // A typo in the year puts the window in the future: every event falls outside it, and the scan says CLEAN.
    else if (since > now.getTime() + 86_400_000) push(`${at}.since`, `${c.since} is in the future: the campaign would match nothing`);
    if (c.until && (typeof c.until !== "string" || !ISO_DATE.test(c.until) || Number.isNaN(Date.parse(c.until)))) push(`${at}.until`, "must be an ISO date");
    else if (c.until && !Number.isNaN(since) && Date.parse(c.until) < since)
      push(`${at}.until`, `${c.until} is before since (${c.since}): no date fits the window`);
    if (!Array.isArray(c.sources) || c.sources.length === 0) push(`${at}.sources`, "cite at least one [S#]");
    else for (const s of c.sources) if (!usable.has(s)) push(`${at}.sources`, `${s} is not a fetched source of this run`);
    if (!Array.isArray(c.indicators) || c.indicators.length === 0) push(`${at}.indicators`, "at least one indicator");
    else
      c.indicators.forEach((ind, ii) => {
        validateIndicator(ind, `${at}.indicators[${ii}]`, usable, push);
        if (ind?.source && Array.isArray(c.sources) && !c.sources.includes(ind.source))
          push(`${at}.indicators[${ii}].source`, `${ind.source} is not one of this campaign's sources (${c.sources.join(", ")}): add it to "sources"`);
      });
  }
  return problems.length ? { problems } : { iocs: raw as IocFile, problems };
}

/** Ordinary text no indicator regex may match: a pattern that does flags every repository. */
const CANARIES = ["", "main", "Update README.md", "Merge pull request #1 from a/b"];
/** Characters git forbids in a ref name: a branch value holding one is a pattern written without "regex": true. */
const NOT_A_BRANCH = /[\s*?[\\^~:]/;
/** Regex syntax in a value meant to be an exact line (pr_title, commit_message, actor). */
const LOOKS_LIKE_REGEX = /^\^|[^\\]\$$|\[[^\]]*\w-\w[^\]]*\]|\{\d+(,\d*)?\}|\)[?*+]|\(\?[:=!]|\\[dwsb.]|\.[*+]/;

function validateIndicator(ind: Indicator, at: string, usable: Set<string>, push: (p: string, m: string) => void): void {
  if (!ind || typeof ind !== "object") {
    push(at, "expected an object");
    return;
  }
  if (!INDICATOR_TYPES.includes(ind.type)) push(`${at}.type`, `one of ${INDICATOR_TYPES.join(", ")}`);
  if (!ind.source) push(`${at}.source`, "cite the [S#] that states this indicator");
  else if (!usable.has(ind.source)) push(`${at}.source`, `${ind.source} is not a fetched source of this run`);
  if (ind.weak !== undefined && typeof ind.weak !== "boolean") push(`${at}.weak`, "true or false");
  if (ind.regex !== undefined && typeof ind.regex !== "boolean") push(`${at}.regex`, "true or false");
  if (typeof ind.value !== "string" || ind.value.trim() === "") {
    push(`${at}.value`, "required non-empty string");
    return;
  }
  const value = stripInvisible(ind.value);
  if (/^\s*TODO\b/i.test(value)) push(`${at}.value`, "still the template's placeholder: replace it with an indicator the source states");
  if (ind.regex === true) {
    // Exactly what compile() builds.
    let re: RegExp | undefined;
    try {
      re = new RegExp(value, "i");
    } catch (e) {
      push(`${at}.value`, `invalid regex: ${(e as Error).message}`);
    }
    if (re && CANARIES.some((c) => re.test(c)))
      push(`${at}.value`, "this regex matches ordinary text (an empty string, main, Update README.md): anchor it (^...$) and remove empty alternatives");
  } else if (ind.regex === undefined) {
    // A pattern copied from the article without "regex": true is compared as an exact string, and never matches.
    if (ind.type === "branch" && NOT_A_BRANCH.test(value))
      push(`${at}.value`, 'not a valid branch name: it looks like a pattern, add "regex": true and anchor it (^...$)');
    if ((ind.type === "pr_title" || ind.type === "commit_message" || ind.type === "actor") && LOOKS_LIKE_REGEX.test(value))
      push(`${at}.value`, 'looks like a regular expression: add "regex": true and anchor it (^...$), or "regex": false to match it literally');
  }
  if (ind.type === "package") {
    if (typeof ind.ecosystem !== "string" || !ind.ecosystem.trim()) push(`${at}.ecosystem`, "required for a package indicator");
    if (/.@v?\d|==/.test(value)) push(`${at}.value`, 'the package name only: put the version in "versions": ["1.2.3"]');
    if (ind.versions !== undefined) {
      if (!Array.isArray(ind.versions) || ind.versions.some((v) => typeof v !== "string" || !v.trim()))
        push(`${at}.versions`, 'a list of version strings, e.g. ["1.2.3"]');
      else
        for (const v of ind.versions)
          if (!/^v?\d[\w.+-]*$/.test(stripInvisible(v).trim()))
            push(`${at}.versions`, `"${v}" is not an exact version: list them one by one, e.g. ["0.1.0", "0.1.1"]; ranges and wildcards never match`);
    }
  }
  if (ind.type === "sha256" && !/^[a-f0-9]{64}$/i.test(value.trim())) push(`${at}.value`, "a sha256 is 64 hex characters");
  if (ind.type === "team_id" && !ind.regex && !/^[A-Z0-9]{10}$/.test(value.trim()))
    push(`${at}.value`, "an Apple Developer Team ID is 10 capital letters and digits, e.g. A1B2C3D4E5");
  if (ind.type === "ip" && !/^[\d.]+$|^[a-f0-9:]+$/i.test(defang(value).trim())) push(`${at}.value`, "an IPv4 or IPv6 address");
}

/** Articles defang IOCs ("194.150.166[.]244", "hxxp://"). Matching needs them armed. */
export function defang(s: string): string {
  return s
    .replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]|\(dot\)|\{dot\}/gi, ".")
    .replace(/\[:\/\/\]|\[:\]\/\//g, "://")
    .replace(/\[:\]/g, ":")
    .replace(/\[\/\]/g, "/")
    .replace(/\bhxxp(s?)/gi, "http$1");
}

/** A glob (`*`, `?`) as an anchored regex. */
export function globRegex(glob: string): RegExp {
  let re = "";
  for (const ch of glob) {
    if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}

/** A compiled indicator: `test` answers whether a string matches it. */
export interface Matcher {
  campaign: Campaign;
  indicator: Indicator;
  test: (s: string) => boolean;
}

/** Types whose values articles defang ("194.150.166[.]244", "hxxp://"). */
const ARMED = new Set<Indicator["type"]>(["ip", "domain", "url"]);

function compile(c: Campaign, ind: Indicator): Matcher {
  const raw = stripInvisible(ind.value);
  // Only addresses are defanged: "[.]" or "(.)" in a branch, a payload string or a regex means what it says.
  const value = ind.regex || !ARMED.has(ind.type) ? raw : defang(raw);
  let test: (s: string) => boolean;
  if (ind.regex) {
    const re = new RegExp(value, "i");
    // A first line can keep a trailing "\r" or space (commits made through the API): an anchored regex must still match.
    const one = (s: string) => re.test(s) || (s !== s.trim() && re.test(s.trim()));
    // A file regex is written for a name (`^setup_bun\\.js$`): try the basename too, not only the full path.
    test = ind.type === "file" || ind.type === "workflow_file" ? (s) => one(s) || one(s.split("/").pop() ?? s) : one;
  } else if (ind.type === "ip") {
    // 1.2.3.4 must not match 11.2.3.45. IPv6 compares case-insensitive.
    const re = new RegExp(`(?<![\\d.])${escapeRegExp(value.trim())}(?![\\d])`, "i");
    test = (s) => re.test(s);
  } else if (ind.type === "domain") {
    // evil.com matches x.evil.com, not notevil.com. "*.evil.com" and "https://evil.com/x" mean evil.com.
    const host = value
      .trim()
      .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
      .replace(/[/?#].*$/, "")
      .replace(/^\*\./, "");
    const re = new RegExp(`(?<![a-z0-9-])${escapeRegExp(host)}(?![a-z0-9-])`, "i");
    test = (s) => re.test(s);
  } else if (ind.type === "file" || ind.type === "workflow_file") {
    // A glob with a slash matches the path's tail, otherwise the basename.
    // Write-ups give home paths (`~/.dev-env/`, `$HOME/x`, `/Users/<name>/x`): the part under the home is the tail.
    const glob = value
      .trim()
      .replace(/^(~|\$HOME|\$\{HOME\}|%USERPROFILE%)[/\\]|^\/(Users|home)\/[^/]+\//i, "")
      .replace(/\\/g, "/")
      .replace(/\/+$/, "");
    const re = globRegex(glob);
    const hasSlash = glob.includes("/");
    test = (s) => {
      if (!hasSlash) return re.test(s.split("/").pop() ?? s);
      const parts = s.split("/");
      const depth = glob.split("/").length;
      return re.test(parts.slice(-depth).join("/"));
    };
  } else if (
    ind.type === "branch" ||
    ind.type === "actor" ||
    ind.type === "commit_message" ||
    ind.type === "pr_title" ||
    ind.type === "repo_name" ||
    ind.type === "runner_name"
  ) {
    // Exact, case-insensitive: "ci: cleanup" is also an ordinary commit message,
    // and a substring match would flag every "ci: cleanup workflows". Use a regex
    // indicator for the variants a source describes.
    const want = value.trim().toLowerCase();
    test = (s) => s.trim().toLowerCase() === want;
  } else if (ind.type === "launchd_label" || ind.type === "team_id" || ind.type === "bundle_id") {
    // Exact and case-sensitive, as launchd and codesign compare them.
    const want = value.trim();
    test = (s) => s.trim() === want;
  } else if (ind.type.endsWith("_prefix")) {
    test = (s) => s.toLowerCase().startsWith(value.toLowerCase());
  } else if (ind.type === "string") {
    // A quoted command may defang its host ("curl hxxp://x[.]com"): try the text as written and armed.
    const needles = [...new Set([value.toLowerCase(), defang(value).toLowerCase()])];
    test = (s) => {
      const l = s.toLowerCase();
      return needles.some((n) => l.includes(n));
    };
  } else {
    const needle = value.toLowerCase();
    test = (s) => s.toLowerCase().includes(needle);
  }
  return { campaign: c, indicator: { ...ind, value, ...(ind.ecosystem ? { ecosystem: normEco(ind.ecosystem) } : {}) }, test };
}

export function matchers(iocs: IocFile, ...types: Indicator["type"][]): Matcher[] {
  const out: Matcher[] = [];
  for (const c of iocs.campaigns) for (const ind of c.indicators) if (types.includes(ind.type)) out.push(compile(c, ind));
  return out;
}

/** The earliest `since` across campaigns: the scan window. */
export function windowStart(iocs: IocFile): string {
  const times = iocs.campaigns.map((c) => Date.parse(c.since)).filter((t) => !Number.isNaN(t));
  return new Date(times.length ? Math.min(...times) : Date.now() - 30 * 86_400_000).toISOString();
}

/**
 * Where changes that match NO indicator (a new key, a fresh startup item, a
 * webhook) are worth a look: from the window start, but never more than 30
 * days back. An old campaign in the file must not turn a year of ordinary
 * installs into REVIEW items.
 */
export function reviewStart(iocs: IocFile, now = new Date(), days = 30): string {
  return new Date(Math.max(Date.parse(windowStart(iocs)), now.getTime() - days * 86_400_000)).toISOString();
}

/** Whether an event at `at` falls in the matcher's own campaign window. No date: yes. */
export function inWindow(m: Matcher, at: string | undefined | null): boolean {
  if (!at) return true;
  const t = Date.parse(at);
  if (Number.isNaN(t)) return true;
  if (t < Date.parse(m.campaign.since)) return false;
  return !m.campaign.until || t <= Date.parse(m.campaign.until) + 86_400_000;
}

/** A package indicator matches a locked (name, version) when the name matches and the version is listed (or none are). */
export function packageHit(ind: Indicator, ecosystem: string, name: string, version: string): boolean {
  if (ind.type !== "package") return false;
  if (normEco(ind.ecosystem ?? "") !== normEco(ecosystem)) return false;
  // PyPI names compare normalised (PEP 503): python_dateutil is python-dateutil.
  const norm = (n: string) => {
    const s = stripInvisible(n).trim().toLowerCase();
    return normEco(ecosystem) === "pypi" ? s.replace(/[-_.]+/g, "-") : s;
  };
  if (norm(ind.value) !== norm(name)) return false;
  if (!ind.versions || ind.versions.length === 0) return true;
  // "*": an unpinned requirement. Only an every-version indicator (a typosquat) can claim it.
  if (version === "*") return false;
  const ver = (v: string) =>
    stripInvisible(v)
      .trim()
      .replace(/^v/, "")
      .replace(/\+incompatible$/, "");
  const v = ver(version);
  return ind.versions.some((x) => typeof x === "string" && ver(x) === v);
}

/** The ecosystems ultraguard has a reader for: lockfiles, editor extensions (vscode) and browser extensions (chrome, firefox). */
export const SUPPORTED_ECOSYSTEMS = ["npm", "pypi", "crates.io", "go", "packagist", "rubygems", "vscode", "chrome", "firefox"] as const;

export function normEco(e: string): string {
  const s = e.trim().toLowerCase();
  if (s === "crates" || s === "cargo" || s === "rust") return "crates.io";
  if (s === "golang") return "go";
  if (s === "composer" || s === "php") return "packagist";
  if (s === "gem" || s === "gems" || s === "ruby") return "rubygems";
  if (s === "python" || s === "pip") return "pypi";
  if (["node", "nodejs", "node.js", "js", "javascript", "npmjs", "yarn", "pnpm"].includes(s)) return "npm";
  // VS Code Marketplace, Open VSX and the editors that install from it.
  if (/^(vs|open[-_ ]?vsx|ovsx|cursor|windsurf)/.test(s)) return "vscode";
  if (["chromium", "edge", "brave", "browser", "chrome-web-store", "chrome-extension"].includes(s)) return "chrome";
  if (s === "amo" || s === "firefox-addon") return "firefox";
  return s;
}

/** Zero-width characters a page puts next to code spans: copied into a value, they make it match nothing. */
export function stripInvisible(s: string): string {
  return s.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
}

/** A blank file for the agent to fill: one campaign per fetched source. */
export function iocTemplate(sources: readonly Source[]): IocFile {
  const ok = sources.filter((s) => !s.error && s.origin === "web");
  return {
    campaigns: ok.map((s, i) => ({
      id: `campaign-${i + 1}`,
      title: s.title ?? s.url,
      sources: [s.id],
      since: "YYYY-MM-DD",
      indicators: [{ type: "string", value: "TODO: replace with the indicators the source states, verbatim", source: s.id }],
    })),
  };
}
