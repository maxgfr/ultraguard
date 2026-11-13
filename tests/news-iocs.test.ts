// The machine-malware indicator types of the shared contract: launchd_label, team_id, bundle_id.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { matchers, validateIocs } from "../src/ioc.js";
import type { Indicator, IocFile, Source } from "../src/types.js";

const S1: Source = { id: "S1", url: "https://research.example/amos", fetchedAt: "2026-11-12T00:00:00Z", origin: "web", file: "sources/S1.md" };
const file = (indicators: Omit<Indicator, "source">[]): IocFile => ({
  campaigns: [
    { id: "amos-2026-11", title: "AMOS backdoor", sources: ["S1"], since: "2026-11-01", indicators: indicators.map((i) => ({ ...i, source: "S1" })) },
  ],
});

describe("launchd_label, team_id, bundle_id", () => {
  it("ioc set accepts them, and refuses a team_id that is not 10 capitals and digits", () => {
    const ok = file([
      { type: "launchd_label", value: "com.finder.helper" },
      { type: "launchd_label", value: "^com\\.apple\\.accountsd\\.helper$", regex: true },
      { type: "team_id", value: "ZZ00ZZ00ZZ" },
      { type: "bundle_id", value: "com.example.crashreporter" },
    ]);
    expect(validateIocs(ok, [S1]).problems).toEqual([]);
    const bad = validateIocs(file([{ type: "team_id", value: "zz00zz00" }]), [S1]).problems;
    expect(bad.map((p) => p.path)).toEqual(["campaigns[0].indicators[0].value"]);
  });

  it("match exactly and case-sensitively, or by regex", () => {
    const m = matchers(
      file([
        { type: "launchd_label", value: "com.finder.helper" },
        { type: "team_id", value: "ZZ00ZZ00ZZ" },
        { type: "bundle_id", value: "^com\\.example\\.crash", regex: true },
      ]),
      "launchd_label",
      "team_id",
      "bundle_id",
    );
    const [label, team, bundle] = m;
    expect(label?.test("com.finder.helper")).toBe(true);
    expect(label?.test("com.finder.helper.plist")).toBe(false);
    expect(label?.test("COM.FINDER.HELPER")).toBe(false);
    expect(team?.test("ZZ00ZZ00ZZ")).toBe(true);
    expect(team?.test("zz00zz00zz")).toBe(false);
    expect(bundle?.test("com.example.crashreporter")).toBe(true);
  });
});

describe("ioc-extraction.md's macOS worked example", () => {
  it("is a valid IOC file", () => {
    const doc = readFileSync(new URL("../skills/ultraguard/references/ioc-extraction.md", import.meta.url), "utf8");
    const block = /### Worked example: an AMOS-style backdoor[\s\S]*?```json\n([\s\S]*?)```/.exec(doc)?.[1];
    expect(block).toBeDefined();
    const iocs = JSON.parse(block ?? "") as IocFile;
    expect(validateIocs(iocs, [S1], new Date("2026-11-13T00:00:00Z")).problems).toEqual([]);
    expect(new Set(iocs.campaigns[0]?.indicators.map((i) => i.type))).toEqual(
      new Set(["file", "launchd_label", "team_id", "bundle_id", "process", "string", "domain", "ip", "sha256"]),
    );
  });
});
