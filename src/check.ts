// check: the answer the agent writes is held to the run's facts.
//  1. Every [S#] / [F#] it cites exists in the run.
//  2. Every sentence that calls something compromised, exposed or hit cites a finding.
//  3. Every surface whose verdict is COMPROMISED or EXPOSED is named in the answer.
//  4. A surface the answer calls clean must have the CLEAN verdict.
//  5. When the run has coverage gaps, the answer says so.
import { citationTokensIn, danglingTokens } from "./engine.js";
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

const CLEAN_WORDS = /\b(clean|safe|unaffected|not (been )?(compromised|hit|affected|touched)|propre|sain|intact|pas (été )?(touché|compromis))\b/i;
const NOTHING_WORDS =
  /\b(nothing (was |is )?(found|detected|matched)|no (sign|trace|indicator|ioc|finding|match)s?\b.{0,30}\b(found|matched|detected)|rien (n'a été |de )?(trouvé|détecté)|aucune? (trace|ioc|indicateur|signe))/i;
const NEGATED_CLEAN = /\b(not|isn't|aren't|n'est pas|ne sont pas|pas)\s+(\w+\s+)?(clean|safe|propre|sain)\b/i;
const BAD_WORDS = /\b(compromised|exposed|infected|hit|review|unknown|compromis|exposé|touché|à vérifier|inconnu)\b/i;
const ALL_CLEAN =
  /\b(everything|all (surfaces )?(is |are )?|nothing (was )?(found|hit)|tout est|rien n'a été)\b.{0,20}\b(clean|safe|found|propre|sain|trouvé|touché)\b/i;

export function checkAnswer(run: Run, text: string): CheckProblem[] {
  const problems: CheckProblem[] = [];
  const known = [...run.sources().map((s) => s.id), ...run.findings().map((f) => f.id)];
  const lines = text.split("\n");
  const lineOf = (needle: string) => lines.findIndex((l) => l.includes(needle)) + 1 || undefined;

  for (const t of danglingTokens(citationTokensIn(text, isCitation), known))
    problems.push({ rule: "dangling", message: `[${t}] is not a source or finding of this run`, line: lineOf(`[${t}]`) });

  // A claim is a sentence. Its citation may sit anywhere in the same paragraph,
  // or in the same list item including its nested sub-items. Coverage and
  // Sources sections state what was NOT looked at, so they make no claim.
  const isKnownF = (t: string) => /^F\d+$/.test(t) && known.includes(t);
  for (const b of claimBlocks(lines)) {
    if (citationTokensIn(b.text, isKnownF).length > 0) continue;
    for (const sentence of b.own.split(/(?<=[.!?])\s+/)) {
      if (!/\b(compromised|exposed|infected|hit by|touché|compromis|exposé)/i.test(sentence)) continue;
      if (/\b(not|no|never|pas|aucun|aucune|ni)\b[^.]{0,40}\b(compromised|exposed|infected|hit|touché|compromis|exposé)/i.test(sentence)) continue;
      problems.push({ rule: "uncited-claim", message: `claims a compromise without citing a finding [F#]: "${sentence.trim().slice(0, 140)}"`, line: b.line });
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

  // Naming the surface is not enough: every compromised or exposed SUBJECT (a repository, a file, a
  // cloud resource) must appear, by name or through one of its findings. Ten hit repositories cannot
  // hide behind "the repositories are compromised [F1]".
  const bySubject = new Map<string, string[]>();
  for (const f of run.findings())
    if (f.severity === "compromised" || f.severity === "exposed") bySubject.set(f.subject, [...(bySubject.get(f.subject) ?? []), f.id]);
  for (const [subject, ids] of bySubject) {
    const short = subject.split("/").pop() ?? subject;
    if (text.includes(subject) || (short.length >= 4 && text.includes(short)) || ids.some((id) => text.includes(`[${id}]`))) continue;
    problems.push({
      rule: "omitted-subject",
      message: `${subject} has ${ids.length} compromised or exposed finding(s) (${ids
        .slice(0, 3)
        .map((x) => `[${x}]`)
        .join("")}) but the answer never names it`,
    });
  }

  // Clean claims, clause by clause: "your machine is clean. The repos were hit" names two
  // surfaces; "your machine and your dependencies are clean" claims two; "clean, but
  // keep an eye on it" still claims clean before the "but".
  const sentences = lines.flatMap((l, i) => l.split(/(?<=[.!?;])\s+/).map((t) => ({ t, line: i + 1 })));
  const anyBad = vs.some((v) => v.verdict !== "CLEAN");
  const bad = (surface: Surface, strength: "clean" | "nothing") => {
    const v = vs.find((x) => x.surface === surface);
    if (!v || v.verdict === "CLEAN") return undefined;
    // "Nothing matched" is true of a REVIEW surface (no IOC, only changes to judge); "clean" is not.
    if (strength === "nothing" && v.verdict === "REVIEW") return undefined;
    return v;
  };
  for (const { t, line } of sentences) {
    const head = t.split(/\b(?:but|however|except|although|though|mais|sauf|cependant|toutefois|bien que)\b/i)[0] ?? t;
    if (anyBad && ALL_CLEAN.test(head) && !SURFACES.some((x) => NAMES[x].test(head))) {
      problems.push({
        rule: "wrong-clean",
        message: `"${head.trim().slice(0, 80)}" but the verdicts are ${vs.map((v) => `${v.surface}=${v.verdict}`).join(", ")}`,
        line,
      });
      continue;
    }
    const clauses = head.split(/,|;|\b(?:and|et|while|whereas|alors que|tandis que)\b/i);
    let pending: Surface[] = [];
    for (const c of clauses) {
      const named = SURFACES.filter((x) => NAMES[x].test(c));
      const strength = NEGATED_CLEAN.test(c) ? undefined : CLEAN_WORDS.test(c) ? "clean" : NOTHING_WORDS.test(c) ? "nothing" : undefined;
      if (!strength) {
        // A clause naming surfaces with no verdict of its own lends them to the next clause ("your machine and your deps are clean").
        pending = BAD_WORDS.test(c) ? [] : [...pending, ...named];
        continue;
      }
      for (const surface of new Set([...pending, ...named])) {
        const v = bad(surface, strength);
        if (v)
          problems.push({
            rule: "wrong-clean",
            message: `calls ${surface} ${strength === "clean" ? "clean" : "free of findings"} but its verdict is ${v.verdict}`,
            line,
          });
      }
      pending = [];
    }
  }

  if (run.gaps().length && !/\b(coverage|gaps?|not (checked|scanned|covered)|couverture|non vérifié|pas vérifié|angles? morts?)\b/i.test(text))
    problems.push({
      rule: "no-coverage",
      message: `the run has ${run.gaps().length} coverage gap(s) and the answer does not mention any: gaps are not absence`,
    });

  return problems;
}

const NO_CLAIM_SECTION = /\b(coverage|couverture|sources?|gaps?|angles? morts?|non vérifié|not checked|limites|limits)\b/i;

/**
 * Paragraphs and list items of a Markdown answer, as raw text. `own` is what
 * the block itself says; `text` adds its nested sub-items, whose citations
 * ground it. Code fences and no-claim sections are left out.
 */
export function claimBlocks(lines: string[]): { line: number; own: string; text: string }[] {
  const out: { line: number; own: string; text: string }[] = [];
  let fence = false;
  let skip = false;
  const indent = (l: string) => l.length - l.trimStart().length;
  const bullet = /^\s*([-*+]|\d+[.)])\s+/;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i] as string;
    if (/^\s*```/.test(l)) {
      fence = !fence;
      continue;
    }
    if (fence || !l.trim()) continue;
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) {
      skip = NO_CLAIM_SECTION.test(h[1] ?? "");
      continue;
    }
    if (skip) continue;
    if (bullet.test(l)) {
      const own: string[] = [l.replace(bullet, "")];
      const all: string[] = [...own];
      const base = indent(l);
      let j = i + 1;
      for (; j < lines.length; j++) {
        const n = lines[j] as string;
        if (!n.trim()) break;
        if (indent(n) <= base && (bullet.test(n) || /^#/.test(n))) break;
        all.push(n.trim());
        if (!bullet.test(n)) own.push(n.trim());
        else break;
      }
      // Children (more-indented bullets) ground the parent too.
      for (let k = j; k < lines.length; k++) {
        const n = lines[k] as string;
        if (!n.trim() || indent(n) <= base) break;
        all.push(n.trim());
      }
      out.push({ line: i + 1, own: own.join(" "), text: all.join(" ") });
      continue;
    }
    // A paragraph: consecutive non-bullet, non-heading lines.
    const para: string[] = [l.trim()];
    let j = i + 1;
    while (j < lines.length && (lines[j] as string).trim() && !bullet.test(lines[j] as string) && !/^#/.test(lines[j] as string))
      para.push((lines[j++] as string).trim());
    out.push({ line: i + 1, own: para.join(" "), text: para.join(" ") });
    i = j - 1;
  }
  return out;
}
