// report: REPORT.md (the facts, verdict per surface, every line cited) and
// REMEDIATION.md (the commands to run, none of which ultraguard runs).
// The agent writes its own answer on top; `check` holds that answer to these facts.
import type { Run } from "./run.js";
import type { HostInventory } from "./scan/hostintel.js";
import { type Finding, type Gap, SURFACES, type Source, type Surface } from "./types.js";
import { type SurfaceVerdict, verdicts, worst } from "./verdict.js";

const LABEL: Record<Surface, string> = {
  "github:account": "GitHub account",
  "github:repos": "GitHub repositories you can push to",
  host: "This machine",
  deps: "Local dependencies (lockfiles)",
  cloud: "Cloud (AWS, GCP, Azure)",
};

const cite = (f: Finding) => `[${f.id}]${f.source ? `[${f.source}]` : ""}`;

function findingLine(f: Finding): string {
  const when = f.at ? ` (${f.at.slice(0, 16).replace("T", " ")})` : "";
  const who = f.scope === "other" && f.actor && !f.title.includes(f.actor) ? ` by \`${f.actor}\`` : "";
  return `- **${f.severity}**: ${f.title}${who}${when} ${cite(f)}`;
}

const SEV_ORDER = ["compromised", "exposed", "suspicious", "info"] as const;

/**
 * A repository where the attacker made CI run (a workflow run on an attacker
 * branch or commit, or a commit on the default branch), not just a probe PR.
 * A workflow FILE matching an IOC name is not a run.
 */
export function payloadRan(findings: Finding[], repo: string): boolean {
  // A structured kind set by the scan: never parsed back from a title, which holds attacker-written text.
  return findings.some((f) => f.subject === repo && f.severity === "compromised" && f.ciRun === "attacker");
}

/** A hit repository with a probe PR: otherwise the attacker only left a branch (or a file) behind. */
function probePr(findings: Finding[], repo: string): boolean {
  return findings.some((f) => f.subject === repo && f.severity === "compromised" && (f.indicator?.type === "pr_title" || /\/pull\/\d+/.test(f.evidence.ref)));
}

/** A probe PR, or a run that only carried a docs-only probe commit. */
function probeSeen(findings: Finding[], repo: string): boolean {
  return probePr(findings, repo) || findings.some((f) => f.subject === repo && f.severity === "compromised" && f.ciRun === "probe");
}

function idList(ids: string[], max = 8): string {
  if (!ids.length) return "none";
  const shown = ids
    .slice(0, max)
    .map((id) => `[${id}]`)
    .join(" ");
  return ids.length > max ? `${shown} and ${ids.length - max} more` : shown;
}

export function renderReport(run: Run, now = new Date()): { report: string; remediation: string; verdicts: SurfaceVerdict[] } {
  const findings = run.findings();
  const gaps = run.gaps();
  const sources = run.sources();
  const iocs = run.iocs();
  const vs = verdicts(findings, gaps, run.surfaces());
  const meta = run.meta();

  const out: string[] = [];
  out.push(`# ultraguard report`, "");
  out.push(`Generated ${now.toISOString()}${meta.login ? ` for GitHub account \`${meta.login}\`` : ""}. Overall: **${worst(vs)}**.`, "");
  out.push("## Verdict", "", "| Surface | Verdict | Evidence | Gaps |", "|---|---|---|---|");
  for (const v of vs) out.push(`| ${LABEL[v.surface]} (\`${v.surface}\`) | **${v.verdict}** | ${idList(v.findings)} | ${v.gaps} |`);
  out.push("");

  out.push("## Campaigns checked", "");
  for (const c of iocs?.campaigns ?? []) {
    const types = [...new Set(c.indicators.map((i) => i.type))].join(", ");
    out.push(
      `- **${c.title}** (\`${c.id}\`), since ${c.since.slice(0, 10)}: ${c.indicators.length} indicators (${types}) ${c.sources.map((s) => `[${s}]`).join("")}`,
    );
  }
  if (!iocs?.campaigns.length) out.push("- none: no IOC file was set for this run");
  out.push("");

  for (const v of vs) {
    const fs = findings.filter((f) => f.surface === v.surface);
    if (!fs.length) continue;
    out.push(`## ${LABEL[v.surface]}`, "");
    if (v.surface === "github:repos") {
      // One block per repository, the ones where attacker code ran first.
      const repos = [...new Set(fs.map((f) => f.subject))].sort((a, b) => Number(payloadRan(fs, b)) - Number(payloadRan(fs, a)) || a.localeCompare(b));
      for (const r of repos) {
        const own = fs.filter((f) => f.subject === r);
        const ran = payloadRan(fs, r);
        const hitRepo = own.some((f) => f.severity === "compromised");
        out.push(
          `### ${r}${hitRepo ? (ran ? ": the attacker made CI run" : probeSeen(fs, r) ? ": probe only, no attacker run seen" : ": attacker branch only, no run seen") : ""}`,
          "",
        );
        for (const sev of SEV_ORDER) for (const f of own.filter((x) => x.severity === sev)) out.push(findingLine(f));
        out.push("");
      }
      continue;
    }
    // Within a severity, the items with a risk signal ("Risky ...") come first.
    const risky = (f: Finding) => (/^Risky |not Apple's|downloads and runs|reverse shell|encoded payload/.test(f.title) ? 0 : 1);
    for (const sev of SEV_ORDER) for (const f of fs.filter((x) => x.severity === sev).sort((a, b) => risky(a) - risky(b))) out.push(findingLine(f));
    out.push("");
  }

  const timed = findings.filter((f) => f.at && f.severity !== "info").sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if (timed.length) {
    out.push("## Timeline", "");
    for (const f of timed) out.push(`- ${String(f.at).slice(0, 16).replace("T", " ")}: ${f.subject}: ${f.title} [${f.id}]`);
    out.push("");
  }

  out.push("## Coverage", "", "Gaps are not absence: what was not looked at is not clean.", "");
  // A surface this run never scanned has no gap of its own: say so, or the section reads "nothing missing".
  const results = run.surfaces();
  const unscanned = SURFACES.filter((x) => !results.find((r) => r.surface === x)?.scanned);
  for (const x of unscanned) {
    const r = results.find((y) => y.surface === x);
    out.push(
      `- \`${x}\`: not scanned in this run${r?.notApplicable ? ` (${r.notApplicable})` : r ? "" : ": run `ultraguard scan` for it, or say it was left out"}`,
    );
  }
  for (const g of gaps) out.push(`- \`${g.surface}\`: ${g.what}: ${g.why}${g.fix ? ` (to close: ${g.fix})` : ""}`);
  if (!gaps.length && !unscanned.length) out.push("- no gap recorded");
  out.push("");

  out.push("## Sources", "");
  for (const s of sources) out.push(`- [${s.id}] ${s.title ?? s.url} <${s.url}>${s.error ? ` (fetch failed: ${s.error})` : ""}`);
  out.push("", "## Findings register", "");
  for (const f of findings)
    out.push(`- [${f.id}] ${f.evidence.kind}: \`${f.evidence.ref}\`${f.evidence.excerpt ? `: ${f.evidence.excerpt.replace(/`/g, "'")}` : ""}`);
  out.push("");

  const inventory = run.read<HostInventory | undefined>("host-inventory.json", undefined);
  return { report: out.join("\n"), remediation: renderRemediation(findings, vs, sources, gaps, inventory), verdicts: vs };
}

export function renderRemediation(findings: Finding[], vs: SurfaceVerdict[], _sources: Source[], gaps: Gap[], inventory?: HostInventory): string {
  const out: string[] = ["# Remediation", "", "ultraguard runs none of these commands. Read each one, then run the ones that apply.", ""];
  const v = Object.fromEntries(vs.map((x) => [x.surface, x.verdict]));
  let step = 0;
  const h = (t: string) => out.push(`## ${++step}. ${t}`, "");

  if (v["github:account"] === "COMPROMISED") {
    h("Your GitHub account acted for the attacker: lock it first");
    out.push(
      "1. Change your password and check 2FA: <https://github.com/settings/security>",
      "2. Revoke every session, token and OAuth grant you do not recognise: <https://github.com/settings/sessions>, <https://github.com/settings/tokens>, <https://github.com/settings/applications>",
      "3. Refresh the gh CLI token: `gh auth logout && gh auth login`",
      "4. Read the security log for the window: <https://github.com/settings/security-log>",
      "5. Close the PRs and delete the branches your account created:",
      "",
    );
    for (const f of findings.filter((x) => x.surface === "github:account" && x.severity === "compromised"))
      out.push(`   - ${f.title} [${f.id}]: <${f.evidence.ref}>`);
    out.push("", "6. Find where the token leaked: a machine with the stealer (see the host section), a CI log, a `.env` in a public repo.", "");
  }

  const hitRepos = [...new Set(findings.filter((f) => f.surface === "github:repos" && f.severity === "compromised").map((f) => f.subject))];
  if (hitRepos.length) {
    h("Repositories hit: assume every secret their CI could read is stolen");
    const others = [...new Set(findings.filter((f) => f.surface === "github:repos" && f.scope === "other" && f.actor).map((f) => f.actor as string))];
    if (others.length)
      out.push(
        `The activity came from ${others.map((a) => `\`${a}\``).join(", ")}. Tell the owners or org admins: that account must be locked and its tokens revoked.`,
        "",
      );
    hitRepos.sort((a, b) => Number(payloadRan(findings, b)) - Number(payloadRan(findings, a)) || a.localeCompare(b));
    for (const r of hitRepos) {
      const ran = payloadRan(findings, r);
      out.push(
        `### ${r}${ran ? ": the attacker made CI run, rotate unless the run's code is provably yours" : probePr(findings, r) ? ": probe PR only" : probeSeen(findings, r) ? ": probe only" : ": attacker branch only, no run seen"}`,
        "",
      );
      if (!ran)
        out.push(
          "The probe proves the attacker could write here. No attacker run was seen, but runs can be deleted: check the run list below for gaps, and rotate if any attacker run executed.",
          "",
        );
      for (const f of findings.filter((x) => x.subject === r && x.surface === "github:repos")) out.push(`- ${f.title} [${f.id}]`);
      out.push(
        "",
        "```sh",
        `gh secret list -R ${r}                       # rotate each one AT ITS SOURCE, then update it here`,
        `gh variable list -R ${r}`,
        `gh api repos/${r}/environments --jq '.environments[].name'   # environment secrets too`,
        `gh api repos/${r}/actions/runs --paginate --jq '.workflow_runs[] | [.run_number,.head_branch,.display_title,.actor.login] | @tsv' | less`,
        `gh api repos/${r}/commits --jq '.[] | [.sha[0:8], .author.login, .commit.message] | @tsv' | head -50`,
        "```",
        "",
        "- Check branch protection and recent commit statuses: a forged `success` status can let a bad commit merge.",
        "- Delete leftover attacker branches, caches and artifacts once you have kept a copy as evidence.",
        "",
      );
    }
    out.push("Org-level secrets shared with these repositories count too: `gh secret list --org <org>`.", "");
  }

  const host = findings.filter((f) => f.surface === "host" && (f.severity === "compromised" || f.severity === "exposed"));
  if (host.length) {
    h("This machine");
    if (host.some((f) => f.severity === "compromised")) {
      out.push("An IOC is on this machine. Treat every credential it holds as stolen, and rotate them from another machine you trust:", "");
      const creds = inventory?.credentials ?? [];
      const envs = creds.filter((c) => c.kind.startsWith(".env"));
      for (const c of creds.filter((x) => !x.kind.startsWith(".env"))) out.push(`- ${c.kind}: \`${c.path}\``);
      if (envs.length) out.push(`- ${envs.length} \`.env\` file(s) with project secrets (listed in host-inventory.json)`);
      if (!creds.length)
        out.push(
          "- `~/.ssh`, `~/.aws`, `~/.config/gcloud`, `~/.azure`, `~/.npmrc`, `~/.pypirc`, `~/.docker/config.json`, `~/.kube`, the gh token, `.env` files",
        );
      out.push(
        "- browser sessions and saved passwords, and AI provider keys in your shell profile or apps",
        "",
        "Then remove the persistence below and consider a reinstall.",
        "",
      );
    }
    for (const f of host) out.push(`- ${f.title} [${f.id}]: \`${f.evidence.ref}\``);
    out.push("");
  }

  const deps = findings.filter((f) => f.surface === "deps" && f.severity === "compromised");
  if (deps.length) {
    h("Malicious dependencies");
    out.push("A project locks a malicious version. If it was installed, its install scripts ran: treat that machine and its CI as compromised.", "");
    for (const f of deps) out.push(`- ${f.title} [${f.id}]`);
    out.push(
      "",
      "Pin a clean version, delete `node_modules` (or the venv), reinstall with scripts off (`npm ci --ignore-scripts`), and rotate what the install could read.",
      "",
    );
  }

  const cloud = findings.filter((f) => f.surface === "cloud" && f.severity !== "info");
  if (cloud.length) {
    h("Cloud persistence");
    for (const f of cloud) out.push(`- ${f.title} [${f.id}]: \`${f.evidence.ref}\``);
    out.push(
      "",
      "- A role that trusts `*` lets anyone assume it: restore its trust policy (`aws iam update-assume-role-policy`).",
      "- Delete access keys you did not create (`aws iam delete-access-key`), GCP keys (`gcloud iam service-accounts keys delete`) and Azure federated credentials (`az ad app federated-credential delete`).",
      "",
    );
  }

  const review = findings
    .filter((f) => f.severity === "suspicious")
    .sort((a, b) => Number(!/^Risky |not Apple's/.test(a.title)) - Number(!/^Risky |not Apple's/.test(b.title)));
  if (review.length) {
    h("To judge: changes in the window that match no IOC");
    for (const f of review) out.push(`- ${f.title} [${f.id}]: \`${f.evidence.ref}\``);
    out.push("", "Each one is either yours (an install, an update) or not. If it is not, treat it as compromised.", "");
  }

  if (gaps.length) {
    h("Close the coverage gaps");
    for (const g of gaps.filter((x) => x.fix)) out.push(`- \`${g.surface}\` ${g.what}: ${g.fix}`);
    out.push("");
  }
  const unknown = vs.filter((x) => x.verdict === "UNKNOWN").map((x) => `\`${x.surface}\``);
  if (step === 0)
    out.push(
      unknown.length
        ? `Nothing to do on the surfaces that were scanned. Not scanned, so not known to be clean: ${unknown.join(", ")}.`
        : "Nothing to do: no surface was hit.",
      "",
    );
  return out.join("\n");
}
