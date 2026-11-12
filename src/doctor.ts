// doctor: what this machine lets ultraguard see. Run it first: every "no" is a
// surface that will come back UNKNOWN, and the fix is printed next to it.
import { httpJson } from "./engine.js";
import type { Runner } from "./runner.js";
import { Gh } from "./scan/gh.js";

export interface DoctorLine {
  check: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export async function doctor(runner: Runner, opts: { probe?: boolean } = {}): Promise<DoctorLine[]> {
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
    const missing = scopes ? ["repo", "read:org"].filter((s) => !scopes.includes(s)) : [];
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

  if (opts.probe) {
    try {
      const res = (await httpJson(
        "POST",
        "https://api.osv.dev/v1/query",
        { package: { ecosystem: "npm", name: "left-pad" }, version: "1.3.0" },
        { timeoutMs: 20_000 },
      )) as unknown;
      out.push({ check: "osv.dev", ok: !!res, detail: "reachable" });
    } catch (e) {
      out.push({ check: "osv.dev", ok: false, detail: (e as Error).message, fix: "check the network; scan deps --no-osv works offline" });
    }
  }
  return out;
}

export function formatDoctor(lines: DoctorLine[]): string {
  return lines.map((l) => `${l.ok ? "ok  " : "no  "} ${l.check}: ${l.detail}${l.fix ? `\n       fix: ${l.fix}` : ""}`).join("\n");
}
