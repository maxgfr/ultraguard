// Machine software, part of scan deps: what this Mac runs that attackers are
// exploiting now. Pending macOS updates (`softwareupdate --list`), and the CISA
// KEV entries of the last 30 days for software installed here (macOS, Safari
// and WebKit always; Chrome, Firefox, Edge, Docker, Zoom... when the app is in
// /Applications), with the installed version. A KEV entry is ranked P0: the
// user should update. None of it is a compromise: the findings are info, but a
// pending security update is to judge (suspicious). A command that fails is a gap.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { chromeStable, type FeedGet, type KevCatalog, type KevEntry, nodeReleases } from "../feeds.js";
import type { Runner } from "../runner.js";
import type { Finding, Gap } from "../types.js";
import { compareVersions, type MachineItem } from "../vulns.js";

type NewFinding = Omit<Finding, "id">;

/** KEV entries added in the last this many days count as "the latest". */
export const KEV_RECENT_DAYS = 30;

interface Product {
  /** What the KEV entry names. */
  vendor: RegExp;
  product: RegExp;
  /** The apps that carry it, by bundle name in /Applications. */
  apps?: string[];
  /** Part of the operating system: always installed on a Mac. */
  system?: "macOS" | "OpenSSH";
}

/** KEV vendor/product -> what carries it on a Mac. Chromium bugs ship in every Chromium browser. */
export const PRODUCTS: Product[] = [
  { vendor: /^apple$/i, product: /macos|os x|multiple products|safari|webkit/i, system: "macOS" },
  { vendor: /^openbsd$/i, product: /openssh/i, system: "OpenSSH" },
  {
    vendor: /^google$/i,
    product: /chrom(e|ium)|v8|skia|angle|dawn/i,
    apps: ["Google Chrome", "Chromium", "Brave Browser", "Microsoft Edge", "Opera", "Arc", "Vivaldi"],
  },
  { vendor: /^mozilla$/i, product: /firefox/i, apps: ["Firefox"] },
  { vendor: /^mozilla$/i, product: /thunderbird/i, apps: ["Thunderbird"] },
  { vendor: /^microsoft$/i, product: /edge/i, apps: ["Microsoft Edge"] },
  {
    vendor: /^microsoft$/i,
    product: /office|outlook|word|excel|powerpoint/i,
    apps: ["Microsoft Outlook", "Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint"],
  },
  { vendor: /^microsoft$/i, product: /teams/i, apps: ["Microsoft Teams"] },
  { vendor: /^microsoft$/i, product: /visual studio code/i, apps: ["Visual Studio Code"] },
  { vendor: /^docker$/i, product: /./, apps: ["Docker"] },
  { vendor: /^zoom/i, product: /./, apps: ["zoom.us"] },
  { vendor: /^videolan$/i, product: /vlc/i, apps: ["VLC"] },
  { vendor: /^oracle$/i, product: /virtualbox/i, apps: ["VirtualBox"] },
  { vendor: /^adobe$/i, product: /acrobat|reader/i, apps: ["Adobe Acrobat Reader", "Adobe Acrobat"] },
  { vendor: /^slack/i, product: /./, apps: ["Slack"] },
  { vendor: /^telegram/i, product: /./, apps: ["Telegram"] },
  { vendor: /^(whatsapp|meta)/i, product: /whatsapp/i, apps: ["WhatsApp"] },
  { vendor: /^(1password|agilebits)/i, product: /./, apps: ["1Password"] },
];

export interface PendingUpdate {
  label: string;
  title: string;
  version?: string;
  recommended: boolean;
  restart: boolean;
  security: boolean;
}

/** `softwareupdate --list`: one entry per "* Label:" block; empty when it says nothing is available. */
export function parseSoftwareUpdate(text: string): PendingUpdate[] {
  const out: PendingUpdate[] = [];
  for (const m of text.matchAll(/^\s*\*\s*Label:\s*(.+)\n\s*(Title:.*)$/gm)) {
    const label = (m[1] as string).trim();
    const line = m[2] as string;
    const field = (k: string) => new RegExp(`${k}:\\s*([^,]+)`, "i").exec(line)?.[1]?.trim();
    const title = field("Title") ?? label;
    out.push({
      label,
      title,
      version: field("Version"),
      recommended: /^yes$/i.test(field("Recommended") ?? ""),
      restart: /restart/i.test(field("Action") ?? ""),
      security: /security|xprotect|\(\w\)$/i.test(`${label} ${title}`),
    });
  }
  return out;
}

export interface SoftwareOpts {
  runner: Runner;
  platform: string;
  /** Where apps are installed: /Applications and ~/Applications. */
  appsDirs: string[];
  kev?: KevCatalog;
  /** Why the KEV catalog could not be loaded. */
  kevError?: string;
  /** Google's and nodejs.org's version feeds; absent: those two checks are skipped. */
  get?: FeedGet;
  now?: Date;
}

export interface SoftwareResult {
  findings: NewFinding[];
  gaps: Gap[];
  machine: MachineItem[];
  stats: Record<string, number>;
}

async function appVersion(runner: Runner, app: string): Promise<string | undefined> {
  const r = await runner("plutil", ["-extract", "CFBundleShortVersionString", "raw", join(app, "Contents", "Info.plist")], { timeoutMs: 10_000 });
  return r.ok ? r.stdout.trim() || undefined : undefined;
}

export async function scanSoftware(opts: SoftwareOpts): Promise<SoftwareResult> {
  const res: SoftwareResult = { findings: [], gaps: [], machine: [], stats: {} };
  if (opts.platform !== "darwin") {
    res.gaps.push({
      surface: "deps",
      what: "pending OS updates and exploited vulnerabilities in installed apps",
      why: `only read on macOS (this is ${opts.platform})`,
      fix: "check your system's updates by hand",
    });
    return res;
  }
  const { runner } = opts;
  const now = opts.now ?? new Date();

  // 1. The OS and its pending updates.
  const sw = await runner("sw_vers", ["-productVersion"], { timeoutMs: 10_000 });
  const macos = sw.ok ? sw.stdout.trim() : undefined;
  const su = await runner("softwareupdate", ["--list"], { timeoutMs: 180_000 });
  const suText = `${su.stdout}\n${su.stderr}`;
  let pending: PendingUpdate[] | undefined;
  if (su.ok || /No new software available/i.test(suText)) pending = parseSoftwareUpdate(suText);
  else
    res.gaps.push({
      surface: "deps",
      what: "pending macOS updates",
      why: su.missing ? "softwareupdate is not available" : `softwareupdate --list failed: ${(suText.trim().split("\n").pop() ?? "").slice(0, 160)}`,
      fix: "run softwareupdate --list by hand (it needs the network), or open System Settings > General > Software Update",
    });
  res.stats.pendingUpdates = pending?.length ?? 0;
  const osUpdate = pending?.find((p) => /macos/i.test(p.title));
  if (pending?.length) {
    const urgent = pending.filter((p) => p.security || (p.recommended && p.restart));
    res.findings.push({
      surface: "deps",
      severity: urgent.length ? "suspicious" : "info",
      subject: `macOS ${macos ?? ""}`.trim(),
      title: `${pending.length} software update(s) pending on this Mac: ${pending
        .map(
          (p) =>
            `${p.title}${[p.security ? "security" : "", p.recommended ? "recommended" : "", p.restart ? "restart" : ""].filter(Boolean).length ? ` (${[p.security ? "security" : "", p.recommended ? "recommended" : "", p.restart ? "restart" : ""].filter(Boolean).join(", ")})` : ""}`,
        )
        .join("; ")}: install them (System Settings > General > Software Update)`,
      evidence: { kind: "command", ref: "softwareupdate --list", excerpt: pending.map((p) => p.label).join(", ") },
      key: `deps|softwareupdate|${pending.map((p) => p.label).join("|")}`,
    });
    for (const p of pending)
      res.machine.push({
        tier: p.security ? "P0" : p.recommended ? "P1" : "P2",
        software: "macOS",
        installed: macos,
        title: `${p.title} is pending${p.security ? " (security update)" : ""}`,
        status: "update pending",
      });
  }

  // 2. The apps installed here, and their versions.
  const installed = new Map<string, { path: string; version?: string }>();
  const wantedApps = new Set(PRODUCTS.flatMap((p) => p.apps ?? []));
  for (const name of wantedApps)
    for (const dir of opts.appsDirs) {
      const path = join(dir, `${name}.app`);
      if (!installed.has(name) && existsSync(path)) installed.set(name, { path, version: await appVersion(runner, path) });
    }
  res.stats.appsChecked = installed.size;

  // Chrome: is it the current stable?
  let stable: string | undefined;
  const chrome = installed.get("Google Chrome");
  if (chrome?.version && opts.get) {
    stable = await chromeStable(opts.get);
    if (!stable) res.gaps.push({ surface: "deps", what: "whether Google Chrome is current", why: "Google's version history API could not be read" });
    else if (compareVersions(chrome.version, stable) < 0) {
      res.findings.push({
        surface: "deps",
        severity: "info",
        subject: chrome.path,
        title: `Google Chrome ${chrome.version} is behind the current stable ${stable}: relaunch it to update (chrome://settings/help)`,
        evidence: { kind: "url", ref: "https://versionhistory.googleapis.com/v1/chrome/platforms/mac/channels/stable/versions", excerpt: stable },
        key: `deps|chrome-stable|${chrome.version}|${stable}`,
      });
      res.machine.push({
        tier: "P1",
        software: "Google Chrome",
        installed: chrome.version,
        title: `Google Chrome is behind the current stable ${stable}`,
        status: "update pending",
      });
    }
  }

  // 3. The KEV entries of the last 30 days for what is installed here.
  if (!opts.kev)
    res.gaps.push({
      surface: "deps",
      what: "exploited vulnerabilities (CISA KEV) in the software installed here",
      why: `the KEV catalog could not be loaded${opts.kevError ? `: ${opts.kevError}` : ""}`,
      fix: "re-run scan deps when online",
    });
  else {
    const since = new Date(now.getTime() - KEV_RECENT_DAYS * 86_400_000).toISOString().slice(0, 10);
    const recent = opts.kev.vulnerabilities.filter((v) => v.dateAdded >= since).sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    res.stats.kevRecent = recent.length;
    let hits = 0;
    for (const k of recent) {
      const carriers = carriersOf(k, installed);
      if (!carriers.length) continue;
      hits++;
      // The OpenSSH macOS ships (and patches), not one a package manager put first on the PATH.
      const ssh = carriers.includes("OpenSSH") ? await runner("/usr/bin/ssh", ["-V"], { timeoutMs: 10_000 }) : undefined;
      const versions = carriers.map((c) => {
        if (c === "macOS") return { name: "macOS", version: macos };
        if (c === "OpenSSH") return { name: "OpenSSH", version: /OpenSSH_([\w.]+)/.exec(`${ssh?.stderr ?? ""}${ssh?.stdout ?? ""}`)?.[1] };
        return { name: c, version: installed.get(c)?.version };
      });
      const ctx = { osUpdate, pendingKnown: !!pending, chrome: chrome?.version, stable };
      // Each carrier has its own way to update: one status per distinct answer.
      const statuses = carriers.map((c) => statusOf(c, ctx));
      const distinct = [...new Set(statuses)];
      const status = distinct.length === 1 ? (distinct[0] as string) : carriers.map((c, i) => `${c}: ${statuses[i]}`).join("; ");
      const what = versions.map((v) => `${v.name}${v.version ? ` ${v.version}` : ""}`).join(", ");
      // KEV names products, not affected versions. A CVE numbered two or more years before
      // today, on an OS release made since, was most likely fixed before that release.
      const cveYear = Number(/^CVE-(\d{4})-/.exec(k.cveID)?.[1]);
      const old = carriers.length === 1 && carriers[0] === "macOS" && cveYear > 0 && now.getUTCFullYear() - cveYear >= 2;
      if (old) {
        res.findings.push({
          surface: "deps",
          severity: "info",
          subject: what,
          title: `${k.cveID} (${k.vendorProject} ${k.product}) was added to CISA KEV on ${k.dateAdded}, but it dates from ${cveYear}: ${what} most likely already has the fix (KEV does not list affected versions; confirm on Apple's security notes)`,
          evidence: { kind: "url", ref: `https://nvd.nist.gov/vuln/detail/${k.cveID}`, excerpt: `CISA KEV ${k.dateAdded}` },
          key: `deps|kev|${k.cveID}`,
        });
        continue;
      }
      res.findings.push({
        surface: "deps",
        severity: "info",
        subject: what,
        title: `${k.cveID} (${k.vendorProject} ${k.product}${k.vulnerabilityName ? `: ${k.vulnerabilityName}` : ""}) is in CISA KEV since ${k.dateAdded}, exploited in the wild; installed here: ${what}; ${status}`,
        evidence: {
          kind: "url",
          ref: `https://nvd.nist.gov/vuln/detail/${k.cveID}`,
          excerpt: `CISA KEV ${k.dateAdded}${k.dueDate ? `, federal due date ${k.dueDate}` : ""}${k.knownRansomwareCampaignUse === "Known" ? ", used by ransomware" : ""}`,
        },
        key: `deps|kev|${k.cveID}`,
      });
      for (const [i, v] of versions.entries())
        res.machine.push({
          tier: "P0",
          software: v.name,
          installed: v.version,
          cve: k.cveID,
          dateAdded: k.dateAdded,
          title: `${k.cveID} (${k.vendorProject} ${k.product}), in CISA KEV since ${k.dateAdded}`,
          status: statuses[i],
        });
    }
    res.stats.kevInstalled = hits;
  }

  // 4. Node.js: security releases in the installed line since this version.
  if (opts.get) {
    const node = await runner("node", ["--version"], { timeoutMs: 10_000 });
    const v = node.ok ? node.stdout.trim().replace(/^v/, "") : undefined;
    if (v) {
      const releases = await nodeReleases(opts.get);
      if (!releases) res.gaps.push({ surface: "deps", what: `Node.js security releases after ${v}`, why: "nodejs.org/dist/index.json could not be read" });
      else {
        const major = v.split(".")[0];
        const line = releases.filter((r) => r.version.replace(/^v/, "").split(".")[0] === major);
        const newer = line.filter((r) => compareVersions(r.version, v) > 0);
        const security = newer.filter((r) => r.security);
        const latest = line[0]?.version.replace(/^v/, "");
        if (security.length && latest) {
          res.findings.push({
            surface: "deps",
            severity: "info",
            subject: `node ${v}`,
            title: `Node.js ${v}: ${security.length} security release(s) since (${security
              .slice(0, 3)
              .map((r) => r.version)
              .join(", ")}): upgrade to ${latest}`,
            evidence: { kind: "url", ref: "https://nodejs.org/en/blog/vulnerability", excerpt: `latest ${major}.x: ${latest}` },
            key: `deps|node-security|${v}|${latest}`,
          });
          res.machine.push({
            tier: "P2",
            software: "Node.js",
            installed: v,
            title: `Node.js has ${security.length} security release(s) after ${v} (latest ${latest})`,
            status: "update pending",
          });
        }
      }
    }
  }
  return res;
}

/** What installed here carries the product a KEV entry names. */
function carriersOf(k: KevEntry, installed: Map<string, unknown>): string[] {
  const out = new Set<string>();
  for (const p of PRODUCTS) {
    if (!p.vendor.test(k.vendorProject) || !p.product.test(k.product)) continue;
    if (p.system) out.add(p.system);
    for (const a of p.apps ?? []) if (installed.has(a)) out.add(a);
  }
  return [...out];
}

function statusOf(carrier: string, s: { osUpdate?: PendingUpdate; pendingKnown: boolean; chrome?: string; stable?: string }): string {
  if (carrier === "macOS" || carrier === "OpenSSH") {
    if (s.osUpdate) return `update pending (${s.osUpdate.title}): install it`;
    if (s.pendingKnown) return "macOS reports no pending update: patched if Apple has shipped the fix";
    return "update macOS if an update is offered";
  }
  if (carrier === "Google Chrome" && s.chrome && s.stable)
    return compareVersions(s.chrome, s.stable) < 0
      ? `Chrome is behind the current stable ${s.stable}: update it`
      : "Chrome is the current stable: patched if Google has shipped the fix";
  return "update the app (check its About window)";
}
