// check: the answer the agent writes is held to the run's facts.
//  1. Every [S#] / [F#] it cites exists in the run.
//  2. Every sentence that calls something compromised, exposed or hit cites a finding.
//  3. Every surface whose verdict is not CLEAN is named in the answer, and every
//     surface gets one line with its computed verdict.
//  4. A surface the answer calls clean must have the CLEAN verdict.
//  5. When the run has coverage gaps, the answer says so.
//  An answer checked against a run that was never swept is refused outright.
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

/** A whole word, Unicode-aware: `\b` never matches after "é", so "touché." slipped through. */
const W = (body: string, flags = "iu") => new RegExp(`(?<![\\p{L}\\p{N}_])(?:${body})(?![\\p{L}\\p{N}_])`, flags);

const NAMES: Record<Surface, RegExp> = {
  "github:account": W("github:account|(your|the|my|mon|ton|votre|notre|son|their) (github )?(account|compte)|github account|compte github|github (login|user)"),
  "github:repos": W("github:repos|repositor(y|ies)|repos?|d[ée]p[ôo]ts?"),
  host: W("host|machine|mac|macbook|laptop|computer|ordinateur|poste"),
  deps: W("deps|dependenc(y|ies)|lockfiles?|d[ée]pendances?|packages?|paquets?"),
  cloud: W("cloud|aws|gcp|azure"),
};
/** "GitHub" alone speaks for both GitHub surfaces. */
const GITHUB = W("github");

const CLEAN_WORDS = W(
  [
    "clean|safe|unaffected|fine(?!-)|ok(?!-)|okay|healthy|all good|no issues?|no problems?",
    "not (been )?(compromised|hit|affected|touched|infected|impacted)",
    "no (sign|evidence|indication|trace)s? of (a |any |the |this )?(compromise|infection|campaign|attack)",
    "shows? no (sign|indicator|trace)s?",
    "propres?|saine?s?|intacte?s?|s[ûu]re?s?|ras|rien à signaler|aucun problème|aucune compromission",
    "pas ([ée]t[ée] )?(touch[ée]e?s?|compromise?s?|affect[ée]e?s?|concern[ée]e?s?|infect[ée]e?s?)",
    "✅|✔️?|✓",
  ].join("|"),
);
const NOTHING_WORDS = W(
  "nothing (was |is )?(found|detected|matched)|no(\\s+\\S+){0,4}?\\s+(was |were |is |are )?(found|matched|detected)|rien (n'a été |de )?(trouvé|détecté)|aucune? (trace|ioc|indicateur|signe)",
);
const NEGATED_CLEAN = W("(not|isn't|aren't|n'est pas|ne sont pas|pas|never)\\s+([\\p{L}']+\\s+)?(clean|safe|propres?|saine?s?|s[ûu]re?s?)");
const BAD_WORDS = W("compromised|exposed|infected|hit|review|unknown|compromise?s?|expos[ée]e?s?|touch[ée]e?s?|infect[ée]e?s?|à vérifier|inconnue?s?");
const ALL_CLEAN = W(
  "(everything|all (surfaces )?(is |are )?|nothing (was )?(found|hit)|tout est|rien n'a été)[^.]{0,20}(clean|safe|found|fine|ok|propre|sain|trouvé|touché|en ordre)",
);
/** A clean claim with no surface at all: "you are not affected", "vous n'êtes pas concerné". */
const YOU_CLEAN = W(
  "(you|your account|tu|vous|on)[^.]{0,30}(not|never|pas|n['’])[^.]{0,20}(affected|compromised|hit|impacted|concern|touch|affect|compromis)\\p{L}*|no (sign|evidence|indicator|trace)s? of (the |this |any )?(campaign|compromise|attack)|rien [àa] signaler",
);
/** "I could not check whether your account is clean": a hedge, not a claim. */
const HEDGE = W(
  "(cannot|can't|could ?n[o']t|unable to|whether|if|to (get|confirm|know)|not (be )?(confirmed|sure|known)|impossible de|ne (peux|peut|pouvons) pas|si)[^.]{0,60}(clean|safe|propre|sain)",
);
/** "clean" describing another thing: "from another, clean machine", "pin a clean version", "safe to delete". */
const ATTRIBUTIVE = new RegExp(
  `${W("(another|other|different|separate|autre)").source}[^.]{0,12}(clean|safe|propre|sain)|${W("(clean|safe)\\s+(machine|computer|laptop|host|mac|version|release|install|copy|state|environment)").source}|${W("safe to|clean(-| )?up").source}`,
  "giu",
);
/** A verdict written as the report writes it, in capitals; "not scanned" phrasings state UNKNOWN. */
const VERDICT_TOKEN = /(?<![\p{L}])(COMPROMISED|EXPOSED|REVIEW|CLEAN|UNKNOWN)(?![\p{L}])/gu;
const UNKNOWN_PHRASE = W(
  "unknown|not (been )?(scanned|checked|verified|covered)|could ?n[o']t (be )?(scann?|check|verif)\\w*|inconnue?s?|non (scann|v[ée]rifi|analys)\\p{L}*|pas (pu [êe]tre |[ée]t[ée] )?(scann|v[ée]rifi|analys)\\p{L}*",
);
const SOURCES_SECTION = /\b(sources?|references?|références?)\b/i;

/** Lines as claims are read: no code fences, no inline code, no Sources section. `heading` is the last heading's text. */
function claimLines(lines: string[]): { text: string; line: number; heading: string }[] {
  const out: { text: string; line: number; heading: string }[] = [];
  let fence = false;
  let heading = "";
  for (const [i, l] of lines.entries()) {
    if (/^\s*```/.test(l)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) heading = h[1] ?? "";
    else if (SOURCES_SECTION.test(heading)) continue;
    out.push({ text: l.replace(/`[^`]*`/g, " "), line: i + 1, heading: h ? "" : heading });
  }
  return out;
}

const named = (c: string): Surface[] => {
  const n = SURFACES.filter((x) => NAMES[x].test(c));
  if (GITHUB.test(c) && !n.some((x) => x.startsWith("github:"))) n.push("github:account", "github:repos");
  return n;
};

export function checkAnswer(run: Run, text: string): CheckProblem[] {
  const problems: CheckProblem[] = [];
  // Before any rule: an answer checked against an empty run has nothing to contradict, so it would always pass.
  if (run.surfaces().length === 0)
    return [{ rule: "not-swept", message: "no surface was scanned in this run: run sweep (or scan) before check, with the same --out" }];
  const known = [...run.sources().map((s) => s.id), ...run.findings().map((f) => f.id)];
  const lines = text.split("\n");
  const lineOf = (needle: string) => lines.findIndex((l) => l.includes(needle)) + 1 || undefined;
  const cited = new Set(citationTokensIn(text, isCitation));

  for (const t of danglingTokens([...cited], known))
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
  const omitted = new Set<Surface>();
  for (const v of vs) {
    if (v.verdict === "CLEAN") continue;
    // An account compromise derived from repository findings must still be said of the account itself.
    const byCitation = v.surface === "github:account" && v.verdict === "COMPROMISED" ? false : v.findings.some((id) => cited.has(id));
    if (NAMES[v.surface].test(text) || byCitation) continue;
    omitted.add(v.surface);
    problems.push({
      rule: "omitted-surface",
      message: `${v.surface} is ${v.verdict}${v.findings.length ? ` (${v.findings.map((x) => `[${x}]`).join("")})` : ""} but the answer never mentions it`,
    });
  }

  // Naming the surface is not enough: every compromised or exposed SUBJECT (a repository, a file, a
  // cloud resource) must appear, by name or through one of its findings. Ten hit repositories cannot
  // hide behind "the repositories are compromised [F1]", nor behind a shared "package-lock.json".
  const bySubject = new Map<string, string[]>();
  for (const f of run.findings())
    if (f.severity === "compromised" || f.severity === "exposed") bySubject.set(f.subject, [...(bySubject.get(f.subject) ?? []), f.id]);
  for (const [subject, ids] of bySubject) {
    // A path is named by its folder and file ("a/package-lock.json"); an owner/name by both parts.
    const short = subject.split("/").filter(Boolean).slice(-2).join("/");
    if (text.includes(subject) || (short.includes("/") && text.includes(short)) || ids.some((id) => cited.has(id))) continue;
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
  // keep an eye on it" still claims clean before the "but". A clause naming no surface
  // speaks for the section it sits in ("## This machine" then "Clean.").
  const claimed = claimLines(lines);
  const sentences = claimed.flatMap((l) => l.text.split(/(?<=[.!?;])\s+/).map((t) => ({ t, line: l.line, heading: named(l.heading) })));
  const anyBad = vs.some((v) => v.verdict !== "CLEAN");
  const hardBad = vs.some((v) => v.verdict === "COMPROMISED" || v.verdict === "EXPOSED" || v.verdict === "UNKNOWN");
  const bad = (surface: Surface, strength: "clean" | "nothing") => {
    const v = vs.find((x) => x.surface === surface);
    if (!v || v.verdict === "CLEAN") return undefined;
    // "Nothing matched" is true of a REVIEW surface (no IOC, only changes to judge); "clean" is not.
    if (strength === "nothing" && v.verdict === "REVIEW") return undefined;
    return v;
  };
  const stated = new Map<Surface, Set<string>>();
  const state = (surfaces: Iterable<Surface>, words: string[]) => {
    for (const x of surfaces) for (const w of words) stated.set(x, new Set([...(stated.get(x) ?? []), w]));
  };
  for (const { t, line, heading } of sentences) {
    const head = t.split(W("but|however|except|although|though|mais|sauf|cependant|toutefois|bien que"))[0] ?? t;
    const surfaceless = !SURFACES.some((x) => NAMES[x].test(head)) && !GITHUB.test(head) && heading.length === 0;
    const hedged = HEDGE.test(head);
    if (!hedged && surfaceless && ((anyBad && ALL_CLEAN.test(head)) || (hardBad && YOU_CLEAN.test(head)))) {
      problems.push({
        rule: "wrong-clean",
        message: `"${head.trim().slice(0, 80)}" but the verdicts are ${vs.map((v) => `${v.surface}=${v.verdict}`).join(", ")}`,
        line,
      });
      continue;
    }
    // Verdict lines: "Machine: REVIEW", "| Cloud | UNKNOWN |". A table row is one clause.
    const clauses = /^\s*\|/.test(t) ? [t] : t.split(W(",|;|and|et|while|whereas|alors que|tandis que"));
    let pending: Surface[] = [];
    let pendingVerdict: Surface[] = [];
    for (const c of clauses) {
      if (c === undefined) continue;
      const here = named(c);
      const words = [...c.matchAll(VERDICT_TOKEN)].map((m) => m[1] as string);
      if (UNKNOWN_PHRASE.test(c)) words.push("UNKNOWN");
      const subjects = here.length || pendingVerdict.length ? [...pendingVerdict, ...here] : heading;
      if (words.length) {
        state(subjects, words);
        pendingVerdict = [];
      } else pendingVerdict = [...pendingVerdict, ...here];

      if (HEDGE.test(c)) {
        pending = [];
        continue;
      }
      const plain = c.replace(ATTRIBUTIVE, " ");
      const negated = NEGATED_CLEAN.test(plain);
      const word = negated ? undefined : (CLEAN_WORDS.exec(plain)?.[0] ?? NOTHING_WORDS.exec(plain)?.[0]);
      const strength = word === undefined ? undefined : CLEAN_WORDS.test(plain) ? "clean" : "nothing";
      if (!strength) {
        // A clause naming surfaces with no verdict of its own lends them to the next clause ("your machine and your deps are clean").
        pending = BAD_WORDS.test(c) ? [] : [...pending, ...here];
        continue;
      }
      const targets = here.length || pending.length ? [...pending, ...here] : heading;
      for (const surface of new Set(targets)) {
        const v = bad(surface, strength);
        if (v)
          problems.push({
            rule: "wrong-clean",
            message: `calls ${surface} ${strength === "clean" ? "clean" : "free of findings"} ("${word}" in "${c.trim().slice(0, 60)}") but its verdict is ${v.verdict}`,
            line,
          });
      }
      pending = [];
    }
  }

  // One line per surface with its verdict, in the report's words: a surface the answer leaves out
  // (REVIEW, UNKNOWN as much as COMPROMISED) is a verdict the user never hears.
  for (const v of vs) {
    if (omitted.has(v.surface)) continue;
    const said = stated.get(v.surface);
    if (!said?.size)
      problems.push({
        rule: "missing-verdict",
        message: `no line gives ${v.surface}'s verdict: write it as the report does ("${v.surface}: ${v.verdict}"${v.findings.length ? ` with ${v.findings.map((x) => `[${x}]`).join("")}` : ""})`,
      });
    else if (!said.has(v.verdict))
      problems.push({
        rule: "wrong-verdict",
        message: `the answer gives ${v.surface} as ${[...said].join("/")} but its verdict is ${v.verdict}: keep the computed verdict and explain a false positive next to it`,
      });
  }

  if (
    run.gaps().length &&
    !W("coverage|gaps?|not (checked|scanned|covered|read)|couverture|non vérifiée?s?|pas vérifiée?s?|non scann\\p{L}*|angles? morts?|limits|limites").test(text)
  )
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
