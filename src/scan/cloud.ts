// scan cloud: the persistence a CI stealer leaves behind once it holds cloud
// credentials. A rotated secret does not undo a role that trusts everyone or
// an access key minted the night of the theft. Each provider is checked only
// through its own CLI, already logged in; one that is absent is a gap, never
// a clean bill.
import { matchers, reviewStart } from "../ioc.js";
import { mapPool } from "../pool.js";
import { parseJsonOutput, type Runner } from "../runner.js";
import type { Finding, Gap, IocFile, SurfaceResult } from "../types.js";

type NewFinding = Omit<Finding, "id">;

const T = 60_000;

/** A trust policy statement that lets any AWS principal assume the role. */
export function wildcardTrust(doc: any): { statement: any; conditioned: boolean } | undefined {
  const stmts = Array.isArray(doc?.Statement) ? doc.Statement : doc?.Statement ? [doc.Statement] : [];
  for (const s of stmts) {
    if (s.Effect !== "Allow") continue;
    const p = s.Principal;
    const aws = p === "*" ? ["*"] : p?.AWS ? (Array.isArray(p.AWS) ? p.AWS : [p.AWS]) : [];
    if (aws.some((a: string) => a === "*" || /^arn:aws:iam::\*:/.test(a))) return { statement: s, conditioned: !!s.Condition };
  }
  return undefined;
}

/**
 * A GitHub Actions OIDC trust that does not pin the repository: no condition on
 * the `sub` claim, or one whose owner part is a wildcard. Any workflow on
 * GitHub, the attacker's included, can then assume the role.
 */
export function openGithubOidc(doc: any): { statement: any; sub?: string } | undefined {
  const stmts = Array.isArray(doc?.Statement) ? doc.Statement : doc?.Statement ? [doc.Statement] : [];
  for (const s of stmts) {
    if (s.Effect !== "Allow") continue;
    const fed = s.Principal?.Federated;
    const feds: string[] = Array.isArray(fed) ? fed : fed ? [fed] : [];
    if (!feds.some((f) => String(f).includes("token.actions.githubusercontent.com"))) continue;
    const subs: string[] = [];
    for (const op of Object.values<any>(s.Condition ?? {}))
      for (const [k, v] of Object.entries<any>(op ?? {})) if (/:sub$/.test(k)) subs.push(...(Array.isArray(v) ? v : [v]).map(String));
    if (!subs.length) return { statement: s };
    const open = subs.find((v) => /^(\*|repo:\*|repo:[^/]*\*)/.test(v));
    if (open) return { statement: s, sub: open };
  }
  return undefined;
}

/** AWS accounts other than `account` a trust policy lets assume the role. */
export function foreignAccounts(doc: any, account: string): string[] {
  const stmts = Array.isArray(doc?.Statement) ? doc.Statement : doc?.Statement ? [doc.Statement] : [];
  const out = new Set<string>();
  for (const s of stmts) {
    if (s.Effect !== "Allow") continue;
    const p = s.Principal?.AWS;
    for (const a of Array.isArray(p) ? p : p ? [p] : []) {
      const id = /^(\d{12})$/.exec(String(a))?.[1] ?? /^arn:aws:iam::(\d{12}):/.exec(String(a))?.[1];
      if (id && id !== account) out.add(id);
    }
  }
  return [...out];
}

export async function scanCloud(
  iocs: IocFile,
  runner: Runner,
  opts: { now?: Date } = {},
): Promise<{ result: SurfaceResult; findings: NewFinding[]; gaps: Gap[] }> {
  // Keys minted without an IOC to tie them to: the last 30 days at most.
  const since = reviewStart(iocs, opts.now);
  const result: SurfaceResult = { surface: "cloud", scanned: false, stats: {}, startedAt: (opts.now ?? new Date()).toISOString() };
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  // A listing the CLI refuses (AccessDenied, a missing permission, a timeout) is a gap, never an empty answer.
  const denied = new Map<string, { n: number; why: string }>();
  const read = async <T>(what: string, cmd: string, args: string[], timeoutMs = T): Promise<T | undefined> => {
    const res = await runner(cmd, args, { timeoutMs });
    const data = parseJsonOutput<T>(res);
    if (data === undefined) {
      const d = denied.get(what) ?? { n: 0, why: (res.stderr || res.stdout).trim().split("\n")[0]?.slice(0, 200) || `exit ${res.status}` };
      d.n++;
      denied.set(what, d);
    }
    return data;
  };
  const fedPrefix = matchers(iocs, "azure_fedcred_prefix");
  // One flag per provider: a provider in use that answered nothing must not hide behind another that did.
  const read_ok: string[] = [];
  const blind: string[] = [];

  // ---- AWS -------------------------------------------------------------------
  const who = await runner("aws", ["sts", "get-caller-identity", "--output", "json"], { timeoutMs: T });
  if (who.missing) gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not installed", fix: "skip if you use no AWS account" });
  else if (!who.ok) {
    blind.push("AWS (not logged in)");
    gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not logged in", fix: "aws sso login (or set a profile), then re-run scan cloud" });
  } else {
    const account = parseJsonOutput<{ Account: string }>(who)?.Account ?? "?";
    const rolesRes = await read<{ Roles: any[] }>("AWS IAM roles", "aws", ["iam", "list-roles", "--output", "json"]);
    const roles = rolesRes?.Roles ?? [];
    result.stats.awsRoles = roles.length;
    for (const role of roles) {
      let doc = role.AssumeRolePolicyDocument;
      if (typeof doc === "string") {
        try {
          doc = JSON.parse(decodeURIComponent(doc));
        } catch {
          doc = undefined;
        }
      }
      const created = typeof role.CreateDate === "string" && role.CreateDate >= since;
      const oidc = openGithubOidc(doc);
      if (oidc)
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `aws:${account}:role/${role.RoleName}`,
          title: `IAM role ${role.RoleName} trusts GitHub Actions OIDC ${oidc.sub ? `for any repository (sub "${oidc.sub}")` : "with no condition on the sub claim"}: any workflow on GitHub can assume it`,
          evidence: { kind: "command", ref: `aws iam get-role --role-name ${role.RoleName}`, excerpt: JSON.stringify(oidc.statement).slice(0, 300) },
          key: `cloud|aws|${account}|oidc|${role.RoleName}`,
        });
      if (created) {
        // Every cross-account trust would make each third-party integration a permanent REVIEW: only new roles say who they trust.
        const foreign = foreignAccounts(doc, account);
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `aws:${account}:role/${role.RoleName}`,
          title: `IAM role ${role.RoleName} was created during the campaign window${foreign.length ? ` and trusts another AWS account (${foreign.join(", ")})` : ""}`,
          at: role.CreateDate,
          evidence: { kind: "command", ref: `aws iam get-role --role-name ${role.RoleName}` },
          key: `cloud|aws|${account}|newrole|${role.RoleName}`,
        });
      }
      const w = wildcardTrust(doc);
      if (!w) continue;
      findings.push({
        surface: "cloud",
        severity: w.conditioned ? "suspicious" : "compromised",
        subject: `aws:${account}:role/${role.RoleName}`,
        title: `IAM role ${role.RoleName} trusts any AWS principal${w.conditioned ? " (with a Condition: check it)" : ""}`,
        evidence: { kind: "command", ref: `aws iam get-role --role-name ${role.RoleName}`, excerpt: JSON.stringify(w.statement).slice(0, 300) },
        key: `cloud|aws|${account}|trust|${role.RoleName}`,
      });
    }
    const usersRes = await read<{ Users: any[] }>("AWS IAM users", "aws", ["iam", "list-users", "--output", "json"]);
    const users = usersRes?.Users ?? [];
    result.stats.awsUsers = users.length;
    if (rolesRes || usersRes) read_ok.push(`AWS account ${account}`);
    else blind.push(`AWS account ${account} (every IAM listing refused)`);
    for (const u of users)
      if (typeof u.CreateDate === "string" && u.CreateDate >= since)
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `aws:${account}:user/${u.UserName}`,
          title: `IAM user ${u.UserName} was created during the campaign window`,
          at: u.CreateDate,
          evidence: { kind: "command", ref: `aws iam get-user --user-name ${u.UserName}` },
          key: `cloud|aws|${account}|newuser|${u.UserName}`,
        });
    await mapPool(users, 4, async (u) => {
      const keys =
        (await read<{ AccessKeyMetadata: any[] }>("AWS access keys", "aws", ["iam", "list-access-keys", "--user-name", u.UserName, "--output", "json"]))
          ?.AccessKeyMetadata ?? [];
      for (const k of keys) {
        if (!k.CreateDate || k.CreateDate < since) continue;
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `aws:${account}:user/${u.UserName}`,
          title: `Access key ${k.AccessKeyId} for IAM user ${u.UserName} was created during the campaign window (${k.Status})`,
          at: k.CreateDate,
          evidence: { kind: "command", ref: `aws iam list-access-keys --user-name ${u.UserName}` },
          key: `cloud|aws|${account}|key|${k.AccessKeyId}`,
        });
      }
    });
    gaps.push({
      surface: "cloud",
      what: "AWS CloudTrail (who assumed which role)",
      why: "not queried: it needs a trail and can be large",
      fix: "aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateAccessKey",
    });
  }

  // ---- GCP -------------------------------------------------------------------
  const gacct = await runner("gcloud", ["config", "get-value", "account"], { timeoutMs: T });
  const gproj = gacct.ok ? (await runner("gcloud", ["config", "get-value", "project"], { timeoutMs: T })).stdout.trim() : "";
  if (gacct.missing) gaps.push({ surface: "cloud", what: "GCP", why: "the gcloud CLI is not installed", fix: "skip if you use no GCP project" });
  else if (!gacct.ok || !gacct.stdout.trim() || !gproj) {
    blind.push("GCP (no account or project set)");
    gaps.push({ surface: "cloud", what: "GCP", why: "gcloud has no account or project set", fix: "gcloud auth login && gcloud config set project <id>" });
  } else {
    const sasRes = await read<any[]>("GCP service accounts", "gcloud", ["iam", "service-accounts", "list", "--format=json"]);
    if (sasRes) read_ok.push(`GCP project ${gproj}`);
    else blind.push(`GCP project ${gproj} (service accounts not listed)`);
    const sas = sasRes ?? [];
    result.stats.gcpServiceAccounts = sas.length;
    await mapPool(sas, 4, async (sa) => {
      const keys =
        (await read<any[]>("GCP service-account keys", "gcloud", [
          "iam",
          "service-accounts",
          "keys",
          "list",
          `--iam-account=${sa.email}`,
          "--managed-by=user",
          "--format=json",
        ])) ?? [];
      for (const k of keys) {
        if (!k.validAfterTime || k.validAfterTime < since) continue;
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `gcp:${gproj}:${sa.email}`,
          title: `User-managed key for ${sa.email} was created during the campaign window`,
          at: k.validAfterTime,
          evidence: { kind: "command", ref: `gcloud iam service-accounts keys list --iam-account=${sa.email}`, excerpt: String(k.name).split("/").pop() },
          key: `cloud|gcp|${k.name}`,
        });
      }
    });
    const filter = `protoPayload.methodName:("GenerateAccessToken" OR "SignJwt") AND timestamp>="${since}"`;
    const logs = parseJsonOutput<any[]>(await runner("gcloud", ["logging", "read", filter, "--limit=200", "--format=json"], { timeoutMs: 2 * T }));
    if (!logs)
      gaps.push({
        surface: "cloud",
        what: "GCP service-account impersonation logs",
        why: "gcloud logging read failed (Data Access logs off, or no permission)",
      });
    else if (logs.length) {
      const callers = new Map<string, number>();
      for (const e of logs) {
        const who = e.protoPayload?.authenticationInfo?.principalEmail ?? "?";
        callers.set(who, (callers.get(who) ?? 0) + 1);
      }
      for (const [who, n] of callers)
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `gcp:${gproj}:${who}`,
          title: `${who} minted service-account tokens ${n} time(s) during the campaign window (generateAccessToken/signJwt)`,
          evidence: { kind: "command", ref: `gcloud logging read '${filter}'` },
          key: `cloud|gcp|impersonation|${who}`,
        });
    }
  }

  // ---- Azure -----------------------------------------------------------------
  const az = await runner("az", ["account", "show", "--output", "json"], { timeoutMs: T });
  if (az.missing) gaps.push({ surface: "cloud", what: "Azure", why: "the az CLI is not installed", fix: "skip if you use no Azure tenant" });
  else if (!az.ok) {
    blind.push("Azure (not logged in)");
    gaps.push({ surface: "cloud", what: "Azure", why: "the az CLI is not logged in", fix: "az login" });
  } else {
    const sub = parseJsonOutput<{ name?: string; id?: string }>(az);
    const appsRes = await read<any[]>("Azure app registrations", "az", ["ad", "app", "list", "--show-mine", "--output", "json"]);
    const label = `Azure subscription ${sub?.name ?? sub?.id ?? "?"}`;
    if (appsRes) read_ok.push(label);
    else blind.push(`${label} (app registrations not listed)`);
    const apps = appsRes ?? [];
    result.stats.azureApps = apps.length;
    await mapPool(apps, 4, async (app) => {
      const creds =
        (await read<any[]>("Azure federated credentials", "az", ["ad", "app", "federated-credential", "list", "--id", app.appId, "--output", "json"])) ?? [];
      for (const c of creds) {
        const m = fedPrefix.find((x) => x.test(c.name ?? ""));
        if (!m && !/github|token\.actions/.test(String(c.issuer ?? ""))) continue;
        findings.push({
          surface: "cloud",
          severity: m ? "compromised" : "info",
          subject: `azure:app/${app.displayName}`,
          title: m
            ? `Federated credential "${c.name}" on app ${app.displayName} matches "${m.indicator.value}"`
            : `App ${app.displayName} trusts GitHub Actions OIDC (${c.subject}): any workflow matching this subject can get a token`,
          ...(m ? { campaign: m.campaign.id, source: m.indicator.source, indicator: { type: m.indicator.type, value: m.indicator.value } } : {}),
          evidence: { kind: "command", ref: `az ad app federated-credential list --id ${app.appId}`, excerpt: `${c.name} ${c.subject}` },
          key: `cloud|azure|${app.appId}|${c.name}`,
        });
      }
    });
  }

  // Scanned only when something was read and no provider in use was left unread: a logged-out AWS
  // next to a working gcloud is not a clean cloud.
  result.scanned = read_ok.length > 0 && blind.length === 0;
  if (who.missing && gacct.missing && az.missing) result.notApplicable = "no cloud CLI installed (aws, gcloud, az)";
  if (read_ok.length)
    gaps.push({
      surface: "cloud",
      what: `every other cloud account than ${read_ok.join(", ")}`,
      why: "only the active profile, project and subscription are read",
      fix: "select each account your CI can reach, then re-run scan cloud",
    });
  if (read_ok.length && blind.length)
    gaps.push({
      surface: "cloud",
      what: blind.join(", "),
      why: "a provider in use could not be read, so the cloud surface stays UNKNOWN",
      fix: "log in (or grant read access), then re-run scan cloud",
    });
  for (const [what, d] of denied)
    gaps.push({
      surface: "cloud",
      what: `${d.n} listing(s) of ${what}`,
      why: `the CLI refused or failed: ${d.why}`,
      fix: "check the role's read permissions, then re-run scan cloud",
    });
  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps };
}
