// Verdicts are computed, not written: the same findings always give the same
// verdict, and `check` refuses an answer that states a different one.
import type { Finding, Gap, Surface, SurfaceResult, Verdict } from "./types.js";
import { SURFACES } from "./types.js";

export interface SurfaceVerdict {
  surface: Surface;
  verdict: Verdict;
  findings: string[];
  gaps: number;
  why: string;
}

/** Gaps that leave a surface unscanned rather than partly scanned. */
function blind(surface: Surface, results: SurfaceResult[]): boolean {
  const r = results.find((x) => x.surface === surface);
  return !r?.scanned;
}

export function verdicts(findings: Finding[], gaps: Gap[], results: SurfaceResult[]): SurfaceVerdict[] {
  return SURFACES.map((surface) => {
    // Your own login acting like the attacker in a repo is an account compromise too.
    const mine = findings.filter(
      (f) => f.surface === surface || (surface === "github:account" && f.surface === "github:repos" && f.scope === "own" && f.severity === "compromised"),
    );
    const ids = (sev: Finding["severity"]) => mine.filter((f) => f.severity === sev).map((f) => f.id);
    const g = gaps.filter((x) => x.surface === surface).length;
    const compromised = ids("compromised");
    const exposed = ids("exposed");
    const suspicious = ids("suspicious");
    if (compromised.length) return { surface, verdict: "COMPROMISED", findings: compromised, gaps: g, why: `${compromised.length} IOC match(es)` };
    if (exposed.length) return { surface, verdict: "EXPOSED", findings: exposed, gaps: g, why: `${exposed.length} exposure(s)` };
    if (blind(surface, results)) return { surface, verdict: "UNKNOWN", findings: [], gaps: g, why: "not scanned" };
    if (suspicious.length) return { surface, verdict: "REVIEW", findings: suspicious, gaps: g, why: `${suspicious.length} change(s) in the window to judge` };
    return { surface, verdict: "CLEAN", findings: [], gaps: g, why: g ? `no IOC matched; ${g} coverage gap(s)` : "no IOC matched" };
  });
}

const RANK: Record<Verdict, number> = { COMPROMISED: 4, EXPOSED: 3, REVIEW: 2, UNKNOWN: 1, CLEAN: 0 };

export function worst(list: SurfaceVerdict[]): Verdict {
  return list.reduce<Verdict>((w, v) => (RANK[v.verdict] > RANK[w] ? v.verdict : w), "CLEAN");
}
