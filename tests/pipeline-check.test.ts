// Regressions from the pipeline audit: answers `check` let through, and correct answers it refused.
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAnswer } from "../src/check.js";
import { main } from "../src/cli.js";
import { renderReport } from "../src/report.js";
import { Run } from "../src/run.js";
import type { Finding, Surface } from "../src/types.js";
import { aikidoRun, tmp } from "./helpers.js";

type Spec = Partial<Record<Surface, "COMPROMISED" | "EXPOSED" | "REVIEW" | "CLEAN" | "UNKNOWN">>;
const SEV = { COMPROMISED: "compromised", EXPOSED: "exposed", REVIEW: "suspicious" } as const;

/** A run whose verdicts are `spec`; every surface not listed is CLEAN. One finding per non-clean surface, F1 first. */
function runWith(spec: Spec, extra: Omit<Finding, "id">[] = []): Run {
  const run = aikidoRun();
  for (const surface of ["github:account", "github:repos", "host", "deps", "cloud"] as const) {
    const v = spec[surface] ?? "CLEAN";
    const sev = v === "COMPROMISED" || v === "EXPOSED" || v === "REVIEW" ? SEV[v] : undefined;
    const found: Omit<Finding, "id">[] = sev
      ? [{ surface, severity: sev, subject: `/subject/${surface}`, title: "t", evidence: { kind: "file", ref: "x" }, key: surface }]
      : [];
    run.recordSurface({ surface, scanned: v !== "UNKNOWN", stats: {}, startedAt: "" }, [...found, ...extra.filter((f) => f.surface === surface)], []);
  }
  return run;
}
const rules = (run: Run, text: string) => checkAnswer(run, text).map((p) => p.rule);
const ALL_LINES = (spec: Spec) => (["github:account", "github:repos", "host", "deps", "cloud"] as const).map((s) => `- ${s}: ${spec[s] ?? "CLEAN"}`).join("\n");

describe("check-1 / e2e-6: clean claims in other words", () => {
  const host = runWith({ host: "COMPROMISED" });
  const says = (sentence: string) => rules(host, `${ALL_LINES({ host: "COMPROMISED" })} [F1]\n\n${sentence}\n\n## Coverage\nnone`);
  it.each([
    "No evidence of compromise on the machine.",
    "The machine is fine.",
    "Host: no issues.",
    "Host: all good.",
    "Machine : RAS.",
    "La machine n'est pas compromise.",
    "Aucune compromission détectée sur la machine.",
    "Votre machine est saine.",
    "Votre machine n'est pas infectée.",
    "| This machine | ✅ |",
  ])("refuses %s", (sentence) => {
    expect(says(sentence)).toContain("wrong-clean");
  });

  it("a heading lends its surface to the section ('## This machine' then 'Clean.')", () => {
    expect(says("## This machine\n\nClean.")).toContain("wrong-clean");
  });

  it("French plural and feminine forms, and the GitHub account without a determiner", () => {
    const deps = runWith({ deps: "COMPROMISED", "github:repos": "REVIEW" });
    expect(rules(deps, "Les dépendances sont propres.")).toContain("wrong-clean");
    expect(rules(deps, "Vos dépôts sont propres.")).toContain("wrong-clean");
    const acct = runWith({ "github:account": "COMPROMISED" });
    expect(rules(acct, "- GitHub account: CLEAN, [F1] is a false positive.")).toEqual(expect.arrayContaining(["wrong-clean", "wrong-verdict"]));
    expect(rules(acct, "Ton compte GitHub n'a pas été touché.")).toContain("wrong-clean");
  });

  it("still accepts 'Votre machine n'est pas saine.'", () => {
    expect(says("Votre machine n'est pas saine.")).not.toContain("wrong-clean");
  });
});

describe("check-2 / e2e-1: surfaces the answer leaves out", () => {
  it("a REVIEW surface and UNKNOWN surfaces must be named with their verdict", () => {
    const run = runWith({ host: "REVIEW", cloud: "UNKNOWN" });
    const r = rules(run, "GitHub, the dependencies are CLEAN.\n\n## Coverage\nnone");
    expect(r).toContain("omitted-surface");
    expect(checkAnswer(run, "x").some((p) => p.message.startsWith("host is REVIEW"))).toBe(true);
    expect(checkAnswer(run, "x").some((p) => p.message.startsWith("cloud is UNKNOWN"))).toBe(true);
  });

  it("an account compromise derived from a repository finding must be said of the account", () => {
    const run = runWith({}, [
      {
        surface: "github:repos",
        severity: "compromised",
        subject: "acme/site",
        title: "t",
        scope: "own",
        evidence: { kind: "url", ref: "u" },
        key: "own",
      },
    ]);
    expect(rules(run, "The repository acme/site was hit by the campaign [F1].")).toContain("omitted-surface");
  });

  it("'you are not affected' fails when a surface was not scanned, whatever the wording", () => {
    const run = runWith({ "github:account": "UNKNOWN", "github:repos": "UNKNOWN", host: "UNKNOWN", deps: "UNKNOWN", cloud: "UNKNOWN" });
    for (const t of [
      "Good news: you are not affected by wfx-loot [S1]. No indicator of the campaign was found.",
      "You have not been compromised.",
      "Vous n'êtes pas concerné.",
    ])
      expect([t, rules(run, `${t}\n\n## Coverage\nSee REPORT.md.`)]).toEqual([t, expect.arrayContaining(["wrong-clean"])]);
  });

  it("a complete answer passes, with UNKNOWN said as 'not scanned'", () => {
    const run = runWith({ host: "REVIEW", cloud: "UNKNOWN" });
    const text = `${ALL_LINES({ host: "REVIEW" }).replace("- cloud: CLEAN", "- Cloud: not scanned (no CLI)")} [F1]\n\n## Coverage\nThe cloud was not scanned.`;
    expect(checkAnswer(run, text)).toEqual([]);
  });

  it("e2e-2: a run that was never swept is refused", () => {
    const run = new Run(tmp());
    expect(rules(run, "You are safe.")).toEqual(["not-swept"]);
  });
});

describe("check-3: a generic basename does not name every subject", () => {
  it("three hit package-lock.json files need three names", () => {
    const f = (p: string): Omit<Finding, "id"> => ({
      surface: "deps",
      severity: "compromised",
      subject: p,
      title: "t",
      evidence: { kind: "file", ref: p },
      key: p,
    });
    const run = runWith({}, [f("/Users/x/code/a/package-lock.json"), f("/Users/x/code/b/package-lock.json"), f("/Users/x/code/c/package-lock.json")]);
    const r = checkAnswer(run, "Dependencies: COMPROMISED. /Users/x/code/a/package-lock.json [F1].");
    expect(r.filter((p) => p.rule === "omitted-subject")).toHaveLength(2);
    expect(checkAnswer(run, "Dependencies: COMPROMISED in a/package-lock.json, b/package-lock.json, c/package-lock.json").map((p) => p.rule)).not.toContain(
      "omitted-subject",
    );
  });

  it("acme/docs is not named by the word 'docs'", () => {
    const f = (subject: string): Omit<Finding, "id"> => ({
      surface: "github:repos",
      severity: "compromised",
      subject,
      title: "t",
      evidence: { kind: "url", ref: "u" },
      key: subject,
    });
    const run = runWith({}, [f("acme/api-server"), f("acme/docs")]);
    expect(rules(run, "acme/api-server was hit, a docs-only probe [F1].")).toContain("omitted-subject");
  });
});

describe("check-4 / e2e-14: correct answers check used to refuse", () => {
  const host = runWith({ host: "COMPROMISED", "github:repos": "COMPROMISED", deps: "COMPROMISED" });
  const lines = `${ALL_LINES({ host: "COMPROMISED", "github:repos": "COMPROMISED", deps: "COMPROMISED" })} [F1][F2][F3]`;
  it.each([
    "Rotate every credential from another, clean machine.",
    "An IOC is on this machine. Treat every credential it holds as stolen, and rotate them from ANOTHER, clean machine.",
    "Pin a clean version of the package.",
    "It is safe to delete the attacker branch in each repository.",
    "I could not check whether your GitHub account is clean.",
    "```sh\ngit clean -fdx   # in each of your repositories\n```",
    "Run `git clean -fdx` in each of your repositories.",
    "## Sources\n- [S1] Is your GitHub account safe?",
    "Clean up the attacker branches in each repository.",
    "Your GitHub login uses a fine-grained token.",
  ])("accepts %s", (sentence) => {
    expect(rules(host, `${lines}\n\n${sentence}\n\n## Coverage\nnone`)).not.toContain("wrong-clean");
  });

  it("comma-separated citations cite each finding", () => {
    const f = (subject: string): Omit<Finding, "id"> => ({
      surface: "github:repos",
      severity: "compromised",
      subject,
      title: "t",
      evidence: { kind: "url", ref: "u" },
      key: subject,
    });
    const run = runWith({}, [f("o/one"), f("o/two")]);
    expect(rules(run, "Two repositories were hit by the campaign [F1, F2].")).not.toContain("omitted-subject");
  });

  it("a Limites section counts as coverage", () => {
    const run = aikidoRun();
    run.recordSurface({ surface: "host", scanned: true, stats: {}, startedAt: "" }, [], [{ surface: "host", what: "x", why: "y" }]);
    expect(rules(run, "Tout est propre.\n\n## Limites\nLe cloud n'a pas été lu.")).not.toContain("no-coverage");
  });

  it("the wrong-clean message names the word that triggered it", () => {
    const msg = checkAnswer(host, `${lines}\n\nThe machine is fine.\n\n## Coverage\nnone`).find((p) => p.rule === "wrong-clean")?.message;
    expect(msg).toContain('"fine"');
  });
});

describe("report: unscanned surfaces", () => {
  it("check-2: REPORT.md lists a surface with no scan as a coverage line, REMEDIATION.md does not say 'nothing to do'", () => {
    const run = aikidoRun();
    run.recordSurface({ surface: "host", scanned: true, stats: {}, startedAt: "" }, [], []);
    const { report, remediation } = renderReport(run);
    expect(report).toContain("- `cloud`: not scanned in this run");
    expect(report).not.toContain("no gap recorded");
    expect(remediation).not.toContain("no surface was hit");
    expect(remediation).toContain("Not scanned, so not known to be clean: `github:account`");
  });

  it("e2e-14: the remediation's own sentence passes check", () => {
    const run = runWith({ host: "COMPROMISED" });
    const { remediation } = renderReport(run);
    const sentence = remediation.split("\n").find((l) => l.startsWith("An IOC is on this machine")) as string;
    expect(rules(run, `${ALL_LINES({ host: "COMPROMISED" })} [F1]\n\n${sentence}\n\n## Coverage\nnone`)).not.toContain("wrong-clean");
  });
});

describe("e2e-2: check and report never create a mistyped --out", () => {
  afterEach(() => vi.restoreAllMocks());
  it("exit 2 and no directory", async () => {
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const dir = join(tmp(), "typo");
    const answer = join(tmp(), "a.md");
    writeFileSync(answer, "You are safe.");
    expect(await main(["check", answer, "--out", dir])).toBe(2);
    expect(await main(["report", "--out", dir])).toBe(2);
    expect(await main(["watch", "commit", "--out", dir])).toBe(2);
    expect(existsSync(dir)).toBe(false);
  });
});
