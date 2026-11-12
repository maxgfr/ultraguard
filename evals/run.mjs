#!/usr/bin/env node
// Evals for the built bundle.
//   offline: each case is a recorded run. The report must give the expected
//            verdicts, the good answer must pass `check`, the bad one must fail
//            with the expected rules.
//   network: live fetches of real write-ups, report-only in CI (evals.yml).
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "scripts", "ultraguard.mjs");
const suite = process.argv.includes("--suite") ? process.argv[process.argv.indexOf("--suite") + 1] : "offline";

function cli(args) {
  try {
    return { code: 0, out: execFileSync("node", [bundle, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  process.stdout.write(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `\n      ${detail}`}\n`);
};

if (suite === "offline") {
  const dir = join(root, "evals", "cases", "offline");
  for (const name of readdirSync(dir)) {
    const c = JSON.parse(readFileSync(join(dir, name, "case.json"), "utf8"));
    const run = mkdtempSync(join(tmpdir(), `ug-eval-${name}-`));
    cpSync(join(dir, name, "run"), run, { recursive: true });
    const report = cli(["report", "--out", run, "--json"]);
    const got = Object.fromEntries(JSON.parse(report.out).map((v) => [v.surface, v.verdict]));
    record(`${name}: verdicts`, JSON.stringify(got) === JSON.stringify(c.verdicts), `got ${JSON.stringify(got)}`);
    const good = cli(["check", join(dir, name, "answer.good.md"), "--out", run, "--json"]);
    record(`${name}: good answer passes check`, good.code === 0, good.out);
    const bad = cli(["check", join(dir, name, "answer.bad.md"), "--out", run, "--json"]);
    const rules = bad.code === 0 ? [] : JSON.parse(bad.out).problems.map((p) => p.rule);
    const missing = c.badRules.filter((r) => !rules.includes(r));
    record(
      `${name}: bad answer fails check on ${c.badRules.join(", ")}`,
      bad.code !== 0 && missing.length === 0,
      `missing ${missing.join(", ")}; got ${rules.join(", ")}`,
    );
    const remediation = readFileSync(join(run, "REMEDIATION.md"), "utf8");
    record(
      `${name}: remediation runs nothing and names who acted`,
      remediation.includes("ultraguard runs none of these commands") && /`[\w-]+`\. Tell the owners/.test(remediation),
      "remediation text changed",
    );
  }
} else {
  const dir = join(root, "evals", "cases", "network");
  for (const file of readdirSync(dir)) {
    const c = JSON.parse(readFileSync(join(dir, file), "utf8"));
    const run = mkdtempSync(join(tmpdir(), "ug-eval-net-"));
    const res = cli(["intel", c.url, "--out", run]);
    const text = existsSync(join(run, "sources", "S1.md")) ? readFileSync(join(run, "sources", "S1.md"), "utf8") : "";
    const missing = c.mustContain.filter((s) => !text.includes(s));
    record(`${file}: ${c.description}`, res.code === 0 && missing.length === 0, `exit ${res.code}; missing ${missing.join(", ")}`);
  }
}

const failed = results.filter((r) => !r.ok).length;
writeFileSync(join(root, "evals", "last-run.json"), `${JSON.stringify({ suite, results }, null, 2)}\n`);
process.stdout.write(`\n${results.length - failed}/${results.length} passed\n`);
process.exit(failed ? 1 : 0);
