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

export function validateIocs(raw: unknown, sources: readonly Source[]): { iocs?: IocFile; problems: IocProblem[] } {
  const problems: IocProblem[] = [];
  const usable = new Set(sources.filter((s) => !s.error).map((s) => s.id));
  const push = (path: string, message: string) => problems.push({ path, message });

  if (!raw || typeof raw !== "object" || !Array.isArray((raw as IocFile).campaigns)) {
    push("$", 'expected an object with a "campaigns" array');
    return { problems };
  }
  const campaigns = (raw as IocFile).campaigns;
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
    if (!c.since || !ISO_DATE.test(c.since) || Number.isNaN(Date.parse(c.since))) push(`${at}.since`, "required ISO date (YYYY-MM-DD or full timestamp)");
    if (c.until && (!ISO_DATE.test(c.until) || Number.isNaN(Date.parse(c.until)))) push(`${at}.until`, "must be an ISO date");
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

function validateIndicator(ind: Indicator, at: string, usable: Set<string>, push: (p: string, m: string) => void): void {
  if (!ind || typeof ind !== "object") {
    push(at, "expected an object");
    return;
  }
  if (!INDICATOR_TYPES.includes(ind.type)) push(`${at}.type`, `one of ${INDICATOR_TYPES.join(", ")}`);
  if (typeof ind.value !== "string" || ind.value.trim() === "") push(`${at}.value`, "required non-empty string");
  if (!ind.source) push(`${at}.source`, "cite the [S#] that states this indicator");
  else if (!usable.has(ind.source)) push(`${at}.source`, `${ind.source} is not a fetched source of this run`);
  if (ind.regex) {
    try {
      new RegExp(ind.value);
    } catch (e) {
      push(`${at}.value`, `invalid regex: ${(e as Error).message}`);
    }
  }
  if (ind.weak !== undefined && typeof ind.weak !== "boolean") push(`${at}.weak`, "true or false");
  if (ind.type === "package" && !ind.ecosystem) push(`${at}.ecosystem`, "required for a package indicator");
  if (ind.type === "sha256" && !/^[a-f0-9]{64}$/i.test(ind.value)) push(`${at}.value`, "a sha256 is 64 hex characters");
  if (ind.type === "ip" && !/^[\d.]+$|^[a-f0-9:]+$/i.test(defang(ind.value))) push(`${at}.value`, "an IPv4 or IPv6 address");
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

function compile(c: Campaign, ind: Indicator): Matcher {
  const value = defang(ind.value);
  let test: (s: string) => boolean;
  if (ind.regex) {
    const re = new RegExp(value, "i");
    // A file regex is written for a name (`^setup_bun\\.js$`): try the basename too, not only the full path.
    test = ind.type === "file" || ind.type === "workflow_file" ? (s) => re.test(s) || re.test(s.split("/").pop() ?? s) : (s) => re.test(s);
  } else if (ind.type === "ip") {
    // 1.2.3.4 must not match 11.2.3.45.
    const re = new RegExp(`(?<![\\d.])${escapeRegExp(value)}(?![\\d])`);
    test = (s) => re.test(s);
  } else if (ind.type === "domain") {
    // evil.com matches x.evil.com, not notevil.com.
    const re = new RegExp(`(?<![a-z0-9-])${escapeRegExp(value)}(?![a-z0-9-])`, "i");
    test = (s) => re.test(s);
  } else if (ind.type === "file" || ind.type === "workflow_file") {
    // A glob with a slash matches the path's tail, otherwise the basename.
    const re = globRegex(value);
    const hasSlash = value.includes("/");
    test = (s) => {
      if (!hasSlash) return re.test(s.split("/").pop() ?? s);
      const parts = s.split("/");
      const depth = value.split("/").length;
      return re.test(parts.slice(-depth).join("/"));
    };
  } else if (ind.type === "branch" || ind.type === "actor" || ind.type === "commit_message" || ind.type === "pr_title") {
    // Exact, case-insensitive: "ci: cleanup" is also an ordinary commit message,
    // and a substring match would flag every "ci: cleanup workflows". Use a regex
    // indicator for the variants a source describes.
    const want = value.trim().toLowerCase();
    test = (s) => s.trim().toLowerCase() === want;
  } else if (ind.type.endsWith("_prefix")) {
    test = (s) => s.toLowerCase().startsWith(value.toLowerCase());
  } else {
    const needle = value.toLowerCase();
    test = (s) => s.toLowerCase().includes(needle);
  }
  return { campaign: c, indicator: { ...ind, value }, test };
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
  const norm = (n: string) => (normEco(ecosystem) === "pypi" ? n.toLowerCase().replace(/[-_.]+/g, "-") : n.toLowerCase());
  if (norm(ind.value) !== norm(name)) return false;
  if (!ind.versions || ind.versions.length === 0) return true;
  const v = version.replace(/^v/, "");
  return ind.versions.some((x) => x.replace(/^v/, "") === v);
}

export function normEco(e: string): string {
  const s = e.toLowerCase();
  if (s === "crates" || s === "cargo") return "crates.io";
  if (s === "golang") return "go";
  if (s === "composer") return "packagist";
  if (s === "gem" || s === "gems") return "rubygems";
  if (s === "python" || s === "pip") return "pypi";
  if (s === "openvsx" || s === "vscode-extension") return "vscode";
  return s;
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
