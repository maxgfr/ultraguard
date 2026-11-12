// check: the answer the agent writes is held to the run's facts.
//  1. Every [S#] / [F#] it cites exists in the run.
//  2. Every sentence that calls something compromised, exposed or hit cites a finding.
//  3. Every surface whose verdict is COMPROMISED or EXPOSED is named in the answer.
//  4. A surface the answer calls clean must have the CLEAN verdict.
//  5. When the run has coverage gaps, the answer says so.
import { citationTokensIn, danglingTokens, extractClaimUnits, unitTexts } from "./engine.js";
import type { Run } from "./run.js";
import { SURFACES, type Surface } from "./types.js";
import { verdicts } from "./verdict.js";

export interface CheckProblem {
  rule: string;
  message: string;
  line?: number;
}

const isCitation = (t: string) => /^[SF]\d+$/.test(t);

const NAMES: Record<Surface, RegExp> = {
  "github:account": /github:account|\b(your|the|my|mon|ton) (github )?(account|compte)\b|\bcompte github\b/i,
  "github:repos": /github:repos|\brepositor(y|ies)\b|\brepos?\b|\bd[ée]p[ôo]ts?\b/i,
  host: /\bhost\b|\bmachine\b|\bmac\b|\blaptop\b|\bcomputer\b|\bordinateur\b/i,
  deps: /\bdeps\b|\bdependenc(y|ies)\b|\blockfiles?\b|\bd[ée]pendances?\b|\bpackages?\b|\bpaquets?\b/i,
  cloud: /\bcloud\b|\baws\b|\bgcp\b|\bazure\b/i,
};

export function checkAnswer(run: Run, text: string): CheckProblem[] {
  const problems: CheckProblem[] = [];
  const known = [...run.sources().map((s) => s.id), ...run.findings().map((f) => f.id)];
  const lines = text.split("\n");
  const lineOf = (needle: string) => lines.findIndex((l) => l.includes(needle)) + 1 || undefined;

  for (const t of danglingTokens(citationTokensIn(text, isCitation), known))
    problems.push({ rule: "dangling", message: `[${t}] is not a source or finding of this run`, line: lineOf(`[${t}]`) });

  // A claim is a sentence; its citation may sit anywhere in the same paragraph or list item.
  for (const unit of extractClaimUnits(text)) {
    for (const block of unitTexts(unit)) {
      const cited = citationTokensIn(block, (t) => /^F\d+$/.test(t) && known.includes(t)).length > 0;
      if (cited) continue;
      for (const s of block.split(/(?<=[.!?])\s+/)) {
        if (!/\b(compromised|exposed|infected|hit by|touché|compromis|exposé)/i.test(s)) continue;
        if (/\b(not|no|never|pas|aucun|aucune|ni)\b[^.]{0,40}\b(compromised|exposed|infected|hit|touché|compromis|exposé)/i.test(s)) continue;
        problems.push({
          rule: "uncited-claim",
          message: `claims a compromise without citing a finding [F#]: "${s.slice(0, 120)}"`,
          line: lineOf(s.slice(0, 40)),
        });
      }
    }
  }

  const vs = verdicts(run.findings(), run.gaps(), run.surfaces());
  for (const v of vs) {
    if ((v.verdict === "COMPROMISED" || v.verdict === "EXPOSED") && !NAMES[v.surface].test(text) && !v.findings.some((id) => text.includes(`[${id}]`)))
      problems.push({
        rule: "omitted-surface",
        message: `${v.surface} is ${v.verdict} (${v.findings.map((x) => `[${x}]`).join("")}) but the answer never mentions it`,
      });
  }

  // Sentence by sentence: "your machine is clean. The repos were hit" names two surfaces on one line.
  const sentences = lines.flatMap((l, i) => l.split(/(?<=[.!?;])\s+/).map((t) => ({ t, line: i + 1 })));
  const CLEAN_WORDS = /\b(clean|safe|not (been )?(compromised|hit|affected)|propre|sain|rien trouvé|aucune trace)\b/i;
  const allClean =
    /\b(everything|all (surfaces )?(is |are )?|nothing (was )?(found|hit)|tout est|rien n'a été)\b.{0,20}\b(clean|safe|found|propre|sain|trouvé|touché)\b/i;
  const anyBad = vs.some((v) => v.verdict !== "CLEAN");
  for (const { t, line } of sentences) {
    if (/\b(but|except|however|mais|sauf)\b/i.test(t)) continue;
    if (anyBad && allClean.test(t)) {
      problems.push({
        rule: "wrong-clean",
        message: `"${t.slice(0, 80)}" but the verdicts are ${vs.map((v) => `${v.surface}=${v.verdict}`).join(", ")}`,
        line,
      });
      continue;
    }
    if (!CLEAN_WORDS.test(t)) continue;
    const named = SURFACES.filter((x) => NAMES[x].test(t));
    if (named.length !== 1) continue;
    const v = vs.find((x) => x.surface === named[0]);
    if (v && v.verdict !== "CLEAN") problems.push({ rule: "wrong-clean", message: `calls ${v.surface} clean but its verdict is ${v.verdict}`, line });
  }

  if (run.gaps().length && !/\b(coverage|gaps?|not (checked|scanned|covered)|couverture|non vérifié|pas vérifié|angles? morts?)\b/i.test(text))
    problems.push({
      rule: "no-coverage",
      message: `the run has ${run.gaps().length} coverage gap(s) and the answer does not mention any: gaps are not absence`,
    });

  return problems;
}
