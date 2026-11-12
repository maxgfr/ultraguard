// doctor: what this machine lets ultraguard see. Run it first: every "no" is a
// surface that will come back UNKNOWN, and the fix is printed next to it.
import { httpJson } from "./engine.js";
import type { Runner } from "./runner.js";
import { installedRules, rulesAgeDays } from "./rules.js";
import { detectAv } from "./scan/antivirus.js";
import { Gh } from "./scan/gh.js";

export interface DoctorLine {
  check: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export async function doctor(runner: Runner, opts: { probe?: boolean; state?: string } = {}): Promise<DoctorLine[]> {
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

  const av = await detectAv(runner);
  out.push({
    check: "clamav",
    ok: !!av && (av.ageDays ?? 0) <= 7,
    detail: av
      ? `${av.name} ${av.version}, signatures of ${av.signatures?.slice(0, 10) ?? "?"}${av.ageDays !== undefined ? ` (${av.ageDays} days old)` : ""}`
      : "not installed (no antivirus pass)",
    fix: !av ? "brew install clamav (or apt install clamav), then freshclam" : (av.ageDays ?? 0) > 7 ? "freshclam" : undefined,
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

  if (opts.probe) {
    try {
      const res = await httpJson(
        "POST",
        "https://api.osv.dev/v1/query",
        { package: { ecosystem: "npm", name: "left-pad" }, version: "1.3.0" },
        { timeoutMs: 20_000 },
      );
      out.push({
        check: "osv.dev",
        ok: res.ok,
        detail: res.ok ? "reachable" : (res.error ?? `HTTP ${res.status}`),
        fix: res.ok ? undefined : "check the network; scan deps --no-osv works offline",
      });
    } catch (e) {
      out.push({ check: "osv.dev", ok: false, detail: (e as Error).message, fix: "check the network; scan deps --no-osv works offline" });
    }
  }
  return out;
}

export function formatDoctor(lines: DoctorLine[]): string {
  return lines.map((l) => `${l.ok ? "ok  " : "no  "} ${l.check}: ${l.detail}${l.fix ? `\n       fix: ${l.fix}` : ""}`).join("\n");
}
