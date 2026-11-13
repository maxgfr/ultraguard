// Feeds (KEV, EPSS) with their 24-hour cache, and the machine-software check of scan deps.
import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { doctor } from "../src/doctor.js";
import { EPSS_URL, type FeedGet, feedCache, KEV_URL, type KevCatalog, loadEpss, loadKev } from "../src/feeds.js";
import type { Runner } from "../src/runner.js";
import { parseSoftwareUpdate, scanSoftware } from "../src/scan/software.js";
import { tmp } from "./helpers.js";

const NOW = new Date("2026-11-13T12:00:00Z");
const CATALOG: KevCatalog = {
  catalogVersion: "2026.11.10",
  vulnerabilities: [
    { cveID: "CVE-2026-125350", vendorProject: "Google", product: "Chromium", vulnerabilityName: "Chromium V8 Type Confusion", dateAdded: "2026-11-10" },
    { cveID: "CVE-2024-27834", vendorProject: "Apple", product: "Multiple Products", dateAdded: "2026-11-04", knownRansomwareCampaignUse: "Unknown" },
    { cveID: "CVE-2026-124194", vendorProject: "Microsoft", product: "Office", dateAdded: "2026-11-10" },
    { cveID: "CVE-2026-123158", vendorProject: "OpenBSD", product: "OpenSSH", dateAdded: "2026-11-09" },
    { cveID: "CVE-2026-1", vendorProject: "Mozilla", product: "Firefox", dateAdded: "2026-01-02" },
  ],
};

function fakeGet(routes: Record<string, unknown>): FeedGet & { calls: string[] } {
  const calls: string[] = [];
  const get = (async (url: string) => {
    calls.push(url);
    const key = Object.keys(routes).find((k) => url === k || url.startsWith(k));
    if (!key) return { ok: false, status: 0, error: "offline" };
    const v = routes[key];
    return { ok: true, status: 200, data: typeof v === "function" ? (v as (u: string) => unknown)(url) : v };
  }) as FeedGet & { calls: string[] };
  get.calls = calls;
  return get;
}

describe("feeds", () => {
  it("KEV: fetched once, cached 24 h, then the stale cache with the error when the fetch fails", async () => {
    const state = tmp("ug-st-");
    const get = fakeGet({ [KEV_URL]: CATALOG });
    const first = await loadKev(state, get, NOW);
    expect(first.data?.vulnerabilities).toHaveLength(5);
    expect(await loadKev(state, get, new Date(NOW.getTime() + 3_600_000))).toMatchObject({ fetchedAt: NOW.toISOString() });
    expect(get.calls).toHaveLength(1);
    const later = await loadKev(state, fakeGet({}), new Date(NOW.getTime() + 3 * 86_400_000));
    expect(later).toMatchObject({ stale: true, error: "offline", fetchedAt: NOW.toISOString() });
    expect(later.data?.catalogVersion).toBe("2026.11.10");
    expect(await loadKev(tmp("ug-st2-"), fakeGet({}), NOW)).toEqual({ error: "offline" });
    expect(feedCache(state, new Date(NOW.getTime() + 5 * 3_600_000)).kev).toEqual({ ageHours: 5, catalogVersion: "2026.11.10", entries: 5 });
  });

  it("EPSS: batches of 100, scores as numbers, cached per CVE", async () => {
    const state = tmp("ug-ep-");
    const cves = Array.from({ length: 150 }, (_, i) => `CVE-2026-${i + 1}`);
    const get = fakeGet({
      [EPSS_URL]: (url: string) => ({
        data: (new URL(url).searchParams.get("cve") ?? "")
          .split(",")
          .filter((c) => c !== "CVE-2026-2")
          .map((c) => ({ cve: c, epss: c === "CVE-2026-1" ? "0.355390000" : "0.000400000", percentile: "0.5", date: "2026-11-12" })),
      }),
    });
    const r = await loadEpss(state, [...cves, "GHSA-xxxx", "cve-2026-1"], get, NOW);
    expect(get.calls).toHaveLength(2);
    expect(get.calls[0]?.split(",")).toHaveLength(100);
    expect(r.data?.get("CVE-2026-1")).toEqual({ epss: 0.35539, percentile: 0.5, date: "2026-11-12" });
    expect(r.data?.has("CVE-2026-2")).toBe(false);
    expect(r.error).toBeUndefined();
    // Second call: every CVE is cached, unscored ones too.
    const again = await loadEpss(state, cves, get, NOW);
    expect(get.calls).toHaveLength(2);
    expect(again.data?.size).toBe(149);
    const off = await loadEpss(tmp("ug-ep2-"), ["CVE-2026-1"], fakeGet({}), NOW);
    expect(off.error).toBe("offline (1 CVE(s) without a score)");
  });
});

const SU_PENDING = `Software Update Tool

Finding available software
Software Update found the following new or updated software:
* Label: macOS 27.2.1-26B131
\tTitle: macOS 27.2.1, Version: 27.2.1, Size: 3256502KiB, Recommended: YES, Action: restart,
* Label: Safari19.2-19.2
\tTitle: Safari, Version: 19.2, Size: 120000KiB, Recommended: NO,
`;

function macRunner(opts: { su?: { ok: boolean; stdout: string; stderr?: string }; node?: string } = {}): Runner & { calls: string[] } {
  const calls: string[] = [];
  const r = (async (cmd: string, args: string[]) => {
    calls.push(`${cmd} ${args.join(" ")}`);
    if (cmd === "sw_vers") return { ok: true, status: 0, stdout: "27.2\n", stderr: "" };
    if (cmd === "softwareupdate") {
      const su = opts.su ?? { ok: true, stdout: SU_PENDING };
      return { ok: su.ok, status: su.ok ? 0 : 1, stdout: su.stdout, stderr: su.stderr ?? "" };
    }
    if (cmd === "plutil") return { ok: true, status: 0, stdout: args[3]?.includes("Google Chrome") ? "157.0.8103.79\n" : "1.2.3\n", stderr: "" };
    if (cmd === "/usr/bin/ssh") return { ok: true, status: 0, stdout: "", stderr: "OpenSSH_10.5p1, LibreSSL 3.3.6\n" };
    if (cmd === "node")
      return opts.node ? { ok: true, status: 0, stdout: `${opts.node}\n`, stderr: "" } : { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
  }) as Runner & { calls: string[] };
  r.calls = calls;
  return r;
}

function apps(...names: string[]): string {
  const d = tmp("ug-apps-");
  for (const n of names) mkdirSync(join(d, `${n}.app`, "Contents"), { recursive: true });
  return d;
}

describe("machine software", () => {
  it("parses softwareupdate --list, real output", () => {
    expect(parseSoftwareUpdate(SU_PENDING)).toEqual([
      { label: "macOS 27.2.1-26B131", title: "macOS 27.2.1", version: "27.2.1", recommended: true, restart: true, security: false },
      { label: "Safari19.2-19.2", title: "Safari", version: "19.2", recommended: false, restart: false, security: false },
    ]);
    expect(parseSoftwareUpdate("Software Update Tool\n\nFinding available software\nNo new software available.\n")).toEqual([]);
    expect(
      parseSoftwareUpdate("* Label: Background Security Improvement (a)\n\tTitle: macOS Security Response 27.2 (a), Version: 27.2 (a), Recommended: YES,\n")[0]
        ?.security,
    ).toBe(true);
  });

  it("lists pending updates (to judge) and the recent KEV entries for what is installed, with versions", async () => {
    const dir = apps("Google Chrome", "Brave Browser", "Firefox");
    const runner = macRunner({ node: "v22.3.0" });
    const get = fakeGet({
      "https://versionhistory.googleapis.com": { versions: [{ version: "157.0.8103.92" }] },
      "https://nodejs.org": [
        { version: "v24.1.0", security: true },
        { version: "v22.5.0", security: false },
        { version: "v22.4.1", security: true },
        { version: "v22.3.0", security: false },
      ],
    });
    const r = await scanSoftware({ runner, platform: "darwin", appsDirs: [dir], kev: CATALOG, get, now: NOW });
    const t = r.findings.map((f) => `${f.severity}: ${f.title}`);
    expect(t).toContain(
      "suspicious: 2 software update(s) pending on this Mac: macOS 27.2.1 (recommended, restart); Safari: install them (System Settings > General > Software Update)",
    );
    expect(t).toContain("info: Google Chrome 157.0.8103.79 is behind the current stable 157.0.8103.92: relaunch it to update (chrome://settings/help)");
    expect(t).toContain(
      "info: CVE-2026-125350 (Google Chromium: Chromium V8 Type Confusion) is in CISA KEV since 2026-11-10, exploited in the wild; installed here: Google Chrome 157.0.8103.79, Brave Browser 1.2.3; Google Chrome: Chrome is behind the current stable 157.0.8103.92: update it; Brave Browser: update the app (check its About window)",
    );
    expect(t).toContain(
      // An old CVE KEV adds late, on a much newer macOS: most likely fixed already, never "exploited here".
      "info: CVE-2024-27834 (Apple Multiple Products) was added to CISA KEV on 2026-11-04, but it dates from 2024: macOS 27.2 most likely already has the fix (KEV does not list affected versions; confirm on Apple's security notes)",
    );
    expect(t).toContain("info: Node.js 22.3.0: 1 security release(s) since (v22.4.1): upgrade to 22.5.0");
    // Office is not installed; the Firefox entry is older than 30 days.
    expect(t.some((x) => x.includes("CVE-2026-124194") || x.includes("CVE-2026-1 "))).toBe(false);
    expect(t).toContain(
      "info: CVE-2026-123158 (OpenBSD OpenSSH) is in CISA KEV since 2026-11-09, exploited in the wild; installed here: OpenSSH 10.5p1; update pending (macOS 27.2.1): install it",
    );
    expect(r.machine.filter((m) => m.tier === "P0").map((m) => `${m.software} ${m.cve} ${m.status}`)).toEqual([
      "Google Chrome CVE-2026-125350 Chrome is behind the current stable 157.0.8103.92: update it",
      "Brave Browser CVE-2026-125350 update the app (check its About window)",
      "OpenSSH CVE-2026-123158 update pending (macOS 27.2.1): install it",
    ]);
    expect(r.gaps).toEqual([]);
    expect(r.stats).toMatchObject({ pendingUpdates: 2, kevInstalled: 3, appsChecked: 3 });
  });

  it("nothing pending: macOS is said patched if Apple shipped the fix; failures and missing feeds are gaps", async () => {
    const quiet = await scanSoftware({
      runner: macRunner({ su: { ok: true, stdout: "Software Update Tool\n\nFinding available software\n", stderr: "No new software available.\n" } }),
      platform: "darwin",
      appsDirs: [apps()],
      kev: CATALOG,
      now: NOW,
    });
    expect(quiet.findings.map((f) => f.title)).toEqual([
      "CVE-2026-123158 (OpenBSD OpenSSH) is in CISA KEV since 2026-11-09, exploited in the wild; installed here: OpenSSH 10.5p1; macOS reports no pending update: patched if Apple has shipped the fix",
      "CVE-2024-27834 (Apple Multiple Products) was added to CISA KEV on 2026-11-04, but it dates from 2024: macOS 27.2 most likely already has the fix (KEV does not list affected versions; confirm on Apple's security notes)",
    ]);
    expect(quiet.findings.every((f) => f.severity === "info")).toBe(true);

    const failed = await scanSoftware({
      runner: macRunner({ su: { ok: false, stdout: "", stderr: "Error: could not reach the update server" } }),
      platform: "darwin",
      appsDirs: [apps()],
      kevError: "offline",
      now: NOW,
    });
    expect(failed.gaps.map((g) => `${g.what}: ${g.why}`)).toEqual([
      "pending macOS updates: softwareupdate --list failed: Error: could not reach the update server",
      "exploited vulnerabilities (CISA KEV) in the software installed here: the KEV catalog could not be loaded: offline",
    ]);

    const linux = await scanSoftware({ runner: macRunner(), platform: "linux", appsDirs: [], kev: CATALOG });
    expect(linux.findings).toEqual([]);
    expect(linux.gaps[0]?.why).toBe("only read on macOS (this is linux)");
  });
});

describe("doctor", () => {
  it("shows the feed cache age, and probes cisa.gov and api.first.org with --probe", async () => {
    const state = tmp("ug-doc-");
    mkdirSync(join(state, "feeds"), { recursive: true });
    writeFileSync(join(state, "feeds/kev.json"), JSON.stringify({ fetchedAt: new Date(Date.now() - 3 * 3_600_000).toISOString(), catalog: CATALOG }));
    const epss = join(state, "feeds/epss.json");
    writeFileSync(epss, JSON.stringify({ entries: { "CVE-2026-1": { epss: 0.1, fetchedAt: "x" } } }));
    const old = new Date(Date.now() - 3 * 86_400_000);
    utimesSync(epss, old, old);
    const seen: string[] = [];
    const runner: Runner = async (cmd, args) => {
      seen.push(`${cmd} ${args.join(" ")}`);
      if (cmd === "curl")
        return { ok: !args.some((x) => x.includes("first.org")), status: args.some((x) => x.includes("first.org")) ? 7 : 0, stdout: "", stderr: "" };
      return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    };
    const quiet = (await doctor(runner, { state })).find((l) => l.check === "vulnerability feeds");
    expect(quiet).toMatchObject({ ok: true });
    expect(quiet?.detail).toMatch(/^CISA KEV 2026\.11\.10 cached, 3 h old; EPSS scores for 1 CVE\(s\) cached, 3 days old/);
    expect(seen.some((c) => c.includes("cisa.gov"))).toBe(false);
    const probed = (await doctor(runner, { state, probe: true })).find((l) => l.check === "vulnerability feeds");
    expect(probed?.ok).toBe(false);
    expect(probed?.detail).toContain("cisa.gov reachable, api.first.org unreachable");
    expect(probed?.fix).toMatch(/ranks CVEs by severity only/);
    expect((await doctor(runner, { state: tmp() })).find((l) => l.check === "vulnerability feeds")?.detail).toMatch(
      /^CISA KEV not cached yet; EPSS not cached yet/,
    );
  });
});
