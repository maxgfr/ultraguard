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
  const fedPrefix = matchers(iocs, "azure_fedcred_prefix");

  // ---- AWS -------------------------------------------------------------------
  const who = await runner("aws", ["sts", "get-caller-identity", "--output", "json"], { timeoutMs: T });
  if (who.missing) gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not installed", fix: "skip if you use no AWS account" });
  else if (!who.ok)
    gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not logged in", fix: "aws sso login (or set a profile), then re-run scan cloud" });
  else {
    result.scanned = true;
    const account = parseJsonOutput<{ Account: string }>(who)?.Account ?? "?";
    const roles = parseJsonOutput<{ Roles: any[] }>(await runner("aws", ["iam", "list-roles", "--output", "json"], { timeoutMs: T }))?.Roles ?? [];
    result.stats.awsRoles = roles.length;
    for (const role of roles) {
      let doc = role.AssumeRolePolicyDocument;
      if (typeof doc === "string") doc = JSON.parse(decodeURIComponent(doc));
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
    const users = parseJsonOutput<{ Users: any[] }>(await runner("aws", ["iam", "list-users", "--output", "json"], { timeoutMs: T }))?.Users ?? [];
    result.stats.awsUsers = users.length;
    await mapPool(users, 4, async (u) => {
      const keys =
        parseJsonOutput<{ AccessKeyMetadata: any[] }>(
          await runner("aws", ["iam", "list-access-keys", "--user-name", u.UserName, "--output", "json"], { timeoutMs: T }),
        )?.AccessKeyMetadata ?? [];
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
  else if (!gacct.ok || !gacct.stdout.trim() || !gproj)
    gaps.push({ surface: "cloud", what: "GCP", why: "gcloud has no account or project set", fix: "gcloud auth login && gcloud config set project <id>" });
  else {
    result.scanned = true;
    const sas = parseJsonOutput<any[]>(await runner("gcloud", ["iam", "service-accounts", "list", "--format=json"], { timeoutMs: T })) ?? [];
    result.stats.gcpServiceAccounts = sas.length;
    await mapPool(sas, 4, async (sa) => {
      const keys =
        parseJsonOutput<any[]>(
          await runner("gcloud", ["iam", "service-accounts", "keys", "list", `--iam-account=${sa.email}`, "--managed-by=user", "--format=json"], {
            timeoutMs: T,
          }),
        ) ?? [];
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
  else if (!az.ok) gaps.push({ surface: "cloud", what: "Azure", why: "the az CLI is not logged in", fix: "az login" });
  else {
    result.scanned = true;
    const apps = parseJsonOutput<any[]>(await runner("az", ["ad", "app", "list", "--show-mine", "--output", "json"], { timeoutMs: T })) ?? [];
    result.stats.azureApps = apps.length;
    await mapPool(apps, 4, async (app) => {
      const creds =
        parseJsonOutput<any[]>(await runner("az", ["ad", "app", "federated-credential", "list", "--id", app.appId, "--output", "json"], { timeoutMs: T })) ??
        [];
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

  result.finishedAt = new Date().toISOString();
  return { result, findings, gaps };
}
