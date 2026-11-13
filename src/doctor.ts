// doctor: what this machine lets ultraguard see. Run it first: every "no" is a
// surface that will come back UNKNOWN, and the fix is printed next to it.
import { homedir } from "node:os";
import { join } from "node:path";
import type { Runner } from "./runner.js";
import { EPSS_URL, feedCache, KEV_URL } from "./feeds.js";
import { installedRules, rulesAgeDays } from "./rules.js";
import { detectAv } from "./scan/antivirus.js";
import { FEED_FILES, feedDir, localFeeds } from "./scan/deps.js";
import { Gh } from "./scan/gh.js";
import { detectXProtect, hardeningFindings, XPROTECT_STALE_DAYS } from "./scan/xprotect.js";
import { PACKAGE_CHECKER_REF, PACKAGE_CHECKER_VERSION } from "./vendor/package-checker-script.js";

export interface DoctorLine {
  check: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export async function doctor(
  runner: Runner,
  opts: { probe?: boolean; state?: string; platform?: NodeJS.Platform; xprotectBundle?: string; appDirs?: string[]; now?: Date } = {},
): Promise<DoctorLine[]> {
  const out: DoctorLine[] = [];
  const major = Number(process.versions.node.split(".")[0]);
  out.push({ check: "node", ok: major >= 18, detail: process.versions.node, fix: major >= 18 ? undefined : "install Node 18 or newer" });

  const gh = new Gh(runner);
  const me = await gh.api<{ login: string }>("user");
  if (!me.ok)
    out.push({
      check: "gh",
      ok: false,
      detail: me.error ?? `HTTP ${me.status}`,
      fix: me.status === 0 ? "install the GitHub CLI: https://cli.github.com" : "gh auth login",
    });
  else {
    const scopes = await gh.scopes();
    // admin:* includes read:*; the key scopes let the scan see keys added to the account.
    const need = ["repo", "read:org", "read:public_key", "read:gpg_key"];
    const missing = scopes ? need.filter((s) => !scopes.includes(s) && !scopes.includes(s.replace(/^read:/, "admin:"))) : [];
    out.push({
      check: "gh",
      ok: missing.length === 0,
      detail: `logged in as ${me.data?.login}${scopes ? `; scopes: ${scopes.join(", ")}` : "; fine-grained token (scopes not listed)"}`,
      fix: missing.length ? `gh auth refresh -s ${missing.join(",")}` : undefined,
    });
  }

  const net = process.platform === "darwin" ? (["lsof", ["-v"], "lsof (open connections)"] as const) : (["ss", ["-V"], "ss (open connections)"] as const);
  for (const [cmd, args, label] of [net, ["crontab", ["-l"], "crontab"] as const]) {
    const r = await runner(cmd, [...args], { timeoutMs: 10_000 });
    out.push({ check: label, ok: !r.missing, detail: r.missing ? "not installed" : "available" });
  }

  for (const [cmd, args, fix] of [
    ["aws", ["sts", "get-caller-identity", "--output", "json"], "aws sso login"],
    ["gcloud", ["config", "get-value", "account"], "gcloud auth login"],
    ["az", ["account", "show", "--output", "json"], "az login"],
  ] as const) {
    const r = await runner(cmd, [...args], { timeoutMs: 30_000 });
    const ok = r.ok && r.stdout.trim().length > 0;
    out.push({
      check: cmd,
      ok,
      detail: r.missing ? "not installed (cloud surface skipped for it)" : ok ? "logged in" : "not logged in",
      fix: r.missing ? undefined : ok ? undefined : fix,
    });
  }

  // scan deps runs package-checker: a Bash 4+ script that downloads its advisory feeds with curl (rules update keeps a copy).
  const bash = await runner("bash", ["-c", "echo $BASH_VERSINFO"], { timeoutMs: 10_000 });
  const bashMajor = Number(bash.stdout.trim()) || 0;
  out.push({
    check: "bash",
    ok: !bash.missing && bashMajor >= 4,
    detail: bash.missing
      ? "not installed (scan deps cannot run package-checker)"
      : `Bash ${bash.stdout.trim() || "?"}${bashMajor >= 4 ? "" : " (scan deps needs Bash 4 or newer for package-checker)"}`,
    fix: !bash.missing && bashMajor >= 4 ? undefined : process.platform === "darwin" ? "brew install bash" : "install Bash 4 or newer",
  });
  // The vendored package-checker, and the advisory feed copy ultraguard keeps for it in the state folder.
  const feeds = opts.state ? localFeeds(feedDir(opts.state), opts.now) : undefined;
  const fresh = !!feeds && !feeds.missing.length && !feeds.stale;
  out.push({
    check: "package-checker",
    ok: !opts.state || fresh,
    detail: `${PACKAGE_CHECKER_VERSION} (${PACKAGE_CHECKER_REF}, vendored)${
      opts.state
        ? feeds
          ? `; ${feeds.files} feed(s) in ${feedDir(opts.state)}, ${feeds.ageDays} days old${
              feeds.missing.length
                ? ` (incomplete: ${feeds.missing.length} of ${FEED_FILES.length} feeds missing, ${feeds.missing.slice(0, 3).join(", ")}${feeds.missing.length > 3 ? ", ..." : ""})`
                : fresh
                  ? ""
                  : " (stale: refreshed after 1 day)"
            }`
          : `; no advisory feeds in ${feedDir(opts.state)} (the next scan deps downloads them, or ultraguard rules update now)`
        : ""
    }`,
    fix: opts.state && !fresh ? "ultraguard rules update" : undefined,
  });
  const curl = await runner("curl", ["--version"], { timeoutMs: 10_000 });
  out.push({
    check: "curl",
    ok: !curl.missing,
    detail: curl.missing ? "not installed (scan deps cannot download the advisory feeds)" : "available",
    fix: curl.missing ? "install curl" : undefined,
  });

  const av = await detectAv(runner);
  out.push({
    check: "clamav",
    ok: !!av && (av.ageDays ?? 0) <= 7,
    detail: av
      ? `${av.name} ${av.version}, signatures of ${av.signatures?.slice(0, 10) ?? "?"}${av.ageDays !== undefined ? ` (${av.ageDays} days old)` : ""}`
      : "not installed (no antivirus pass)",
    fix: !av
      ? "brew install clamav (or apt install clamav), then ultraguard rules update"
      : (av.ageDays ?? 0) > 7
        ? "ultraguard rules update (runs freshclam; scan host also does it)"
        : undefined,
  });
  const yara = await runner("yara", ["--version"], { timeoutMs: 10_000 });
  out.push({
    check: "yara",
    ok: yara.ok,
    detail: yara.ok ? `yara ${yara.stdout.trim()}` : "not installed (no YARA pass)",
    fix: yara.ok ? undefined : "brew install yara (or apt install yara)",
  });
  if (opts.state) {
    const meta = installedRules(opts.state);
    const age = meta ? rulesAgeDays(meta) : 0;
    out.push({
      check: "rules",
      ok: !!meta && age <= 14,
      detail: meta
        ? `YARA-Forge ${meta.set} ${meta.tag}, ${meta.rules} rules, ${age} days old${meta.compiled ? "" : ", not compiled"}`
        : "no community YARA rules",
      fix: !meta || age > 14 ? "ultraguard rules update" : undefined,
    });
  }

  // scan deps ranks known CVEs with CISA KEV and FIRST EPSS, cached for 24 hours in the state folder.
  const cache = opts.state ? feedCache(opts.state) : {};
  const age = (h: number) => (h < 48 ? `${h} h old` : `${Math.floor(h / 24)} days old`);
  const cached = [
    cache.kev ? `CISA KEV ${cache.kev.catalogVersion ?? ""} cached, ${age(cache.kev.ageHours)}`.replace("  ", " ") : "CISA KEV not cached yet",
    cache.epss ? `EPSS scores for ${cache.epss.entries} CVE(s) cached, ${age(cache.epss.ageHours)}` : "EPSS not cached yet",
  ].join("; ");
  let reach: { kev: boolean; epss: boolean } | undefined;
  if (opts.probe) {
    const probe = async (url: string, head: boolean) =>
      (
        await runner("curl", [...(head ? ["--head"] : []), "--silent", "--fail", "--connect-timeout", "10", "--max-time", "30", "--output", "/dev/null", url], {
          timeoutMs: 40_000,
        })
      ).ok;
    reach = { kev: await probe(KEV_URL, true), epss: await probe(`${EPSS_URL}?cve=CVE-2021-44228`, false) };
  }
  out.push({
    check: "vulnerability feeds",
    ok: !reach || (reach.kev && reach.epss),
    detail: `${cached}${reach ? `; ${reach.kev ? "cisa.gov reachable" : "cisa.gov unreachable"}, ${reach.epss ? "api.first.org reachable" : "api.first.org unreachable"}` : ""} (ranking of known CVEs in scan deps)`,
    fix: reach && !(reach.kev && reach.epss) ? "check the network; without the feeds, scan deps ranks CVEs by severity only and says so" : undefined,
  });

  // macOS's own antivirus and the hardening a stealer turns off.
  if ((opts.platform ?? process.platform) === "darwin") {
    const xp = await detectXProtect(runner, { bundle: opts.xprotectBundle, now: opts.now });
    const stale = (xp.ageDays ?? 0) > XPROTECT_STALE_DAYS;
    out.push({
      check: "xprotect",
      ok: !xp.missing && xp.rules.length > 0 && !stale,
      detail: xp.missing
        ? xp.missing
        : `XProtect ${xp.version ?? "?"}${xp.installed ? `, installed ${xp.installed.slice(0, 10)}` : ""}${xp.ageDays !== undefined ? ` (${xp.ageDays} days old)` : ""}; ${xp.rules.length} rule file(s)${yara.ok ? "" : " (yara is needed to run them)"}`,
      fix: stale ? "turn on Install Security Responses and system files in Software Update (or sudo softwareupdate --background-critical)" : undefined,
    });
    const { hardening: h } = await hardeningFindings(runner, { appDirs: opts.appDirs ?? ["/Applications", join(homedir(), "Applications")] });
    const unknown = (v: string | undefined) => v ?? "unknown (could not be read)";
    out.push({
      check: "gatekeeper",
      ok: h.gatekeeper === "enabled",
      detail: unknown(h.gatekeeper),
      fix: h.gatekeeper === "disabled" ? "sudo spctl --global-enable" : undefined,
    });
    out.push({
      check: "sip",
      ok: h.sip === "enabled",
      detail: unknown(h.sip),
      fix: h.sip && h.sip !== "enabled" ? "csrutil enable, from macOS Recovery" : undefined,
    });
    out.push({
      check: "filevault",
      ok: h.filevault === "on",
      detail: unknown(h.filevault),
      fix: h.filevault === "off" ? "System Settings > Privacy & Security > FileVault" : undefined,
    });
    const off = [h.criticalUpdateInstall, h.configDataInstall].some((v) => v === "false" || v === "0");
    out.push({
      check: "security updates",
      ok: !off,
      detail: `security responses ${h.criticalUpdateInstall === "default" ? "on (default)" : h.criticalUpdateInstall}, security data ${h.configDataInstall === "default" ? "on (default)" : h.configDataInstall}${h.realtimeTools.length ? `; real-time tools: ${h.realtimeTools.join(", ")}` : ""}`,
      fix: off ? "System Settings > General > Software Update > Automatic Updates: Install Security Responses and system files" : undefined,
    });
  }

  if (opts.probe) {
    // Where scan deps downloads the OSV and GHSA feeds from, the way package-checker does it.
    const url = "https://raw.githubusercontent.com/maxgfr/package-checker.sh/refs/heads/main/data/osv.purl";
    const r = await runner("curl", ["--head", "--silent", "--fail", "--connect-timeout", "10", "--max-time", "30", "--output", "/dev/null", url], {
      timeoutMs: 40_000,
    });
    out.push({
      check: "advisory feeds",
      ok: r.ok,
      detail: r.ok
        ? "raw.githubusercontent.com reachable (OSV and GHSA feeds for scan deps)"
        : r.missing
          ? "curl is not installed"
          : `raw.githubusercontent.com unreachable (curl exit ${r.status})`,
      fix: r.ok ? undefined : "check the network; scan deps --no-osv works offline",
    });
  }
  return out;
}

export function formatDoctor(lines: DoctorLine[]): string {
  return lines.map((l) => `${l.ok ? "ok  " : "no  "} ${l.check}: ${l.detail}${l.fix ? `\n       fix: ${l.fix}` : ""}`).join("\n");
}
