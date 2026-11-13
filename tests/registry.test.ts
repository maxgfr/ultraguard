import { describe, expect, it } from "vitest";
import { type RegistryGet, scanNpmPublishes } from "../src/scan/registry.js";
import type { Runner } from "../src/runner.js";
import type { IocFile } from "../src/types.js";

const iocs: IocFile = {
  campaigns: [
    {
      id: "worm-2026-11",
      title: "npm worm",
      since: "2026-11-10",
      sources: ["S1"],
      indicators: [{ type: "package", value: "left-thing", ecosystem: "npm", versions: ["2.0.1"], source: "S1" }],
    },
  ],
} as IocFile;

const whoami =
  (user?: string): Runner =>
  async () =>
    user ? { ok: true, status: 0, stdout: `${user}\n`, stderr: "" } : { ok: false, status: 1, stdout: "", stderr: "ENEEDAUTH" };

function registry(packages: Record<string, any>, calls: string[] = []): RegistryGet {
  return async (url) => {
    calls.push(url);
    if (url.includes("/-/v1/search")) return { ok: true, status: 200, data: { objects: Object.keys(packages).map((name) => ({ package: { name } })) } };
    const name = decodeURIComponent(url.split("registry.npmjs.org/")[1] as string);
    const doc = packages[name];
    return doc ? { ok: true, status: 200, data: doc } : { ok: false, status: 404 };
  };
}

describe("npm packages you publish", () => {
  it("flags a version published in the window, with its install script and who published it", async () => {
    const calls: string[] = [];
    const get = registry(
      {
        "left-thing": {
          time: { created: "2020-01-01T00:00:00Z", "2.0.0": "2025-01-01T00:00:00Z", "2.0.1": "2026-11-11T08:00:00Z" },
          versions: { "2.0.1": { scripts: { postinstall: "node bundle.js" }, _npmUser: { name: "me" } } },
        },
        "@me/tool": {
          time: { "1.0.0": "2024-05-01T00:00:00Z", "1.0.1": "2026-11-12T08:00:00Z" },
          versions: { "1.0.1": { scripts: { preinstall: "bash setup.sh" }, _npmUser: { name: "someone-else" } } },
        },
        quiet: { time: { "1.0.0": "2023-01-01T00:00:00Z" }, versions: {} },
      },
      calls,
    );
    const r = await scanNpmPublishes(iocs, { runner: whoami("me"), get });
    expect(r.user).toBe("me");
    expect(r.stats.npmPackages).toBe(3);
    const byName = Object.fromEntries(r.findings.map((f) => [f.subject, f]));
    expect(byName["npm:left-thing"]?.severity).toBe("compromised");
    expect(byName["npm:left-thing"]?.source).toBe("S1");
    expect(byName["npm:@me/tool"]?.severity).toBe("suspicious");
    expect(byName["npm:@me/tool"]?.title).toContain("by someone-else");
    expect(byName["npm:@me/tool"]?.title).toContain("preinstall: bash setup.sh");
    expect(byName["npm:@me/tool"]?.scope).toBe("other");
    expect(byName["npm:quiet"]).toBeUndefined();
    // Scoped names keep their @ and encode the slash.
    expect(calls).toContain("https://registry.npmjs.org/@me%2Ftool");
    expect(r.gaps).toEqual([]);
  });

  it("is a gap, never silence, when npm is not logged in and no --npm-user is given", async () => {
    const r = await scanNpmPublishes(iocs, { runner: whoami(), get: registry({}) });
    expect(r.findings).toEqual([]);
    expect(r.gaps[0]?.why).toContain("not logged in");
    expect(r.gaps[0]?.fix).toContain("--npm-user");
  });

  it("uses --npm-user without asking npm, and names the packages the registry did not return", async () => {
    let asked = false;
    const runner: Runner = async () => {
      asked = true;
      return { ok: false, status: 1, stdout: "", stderr: "" };
    };
    const get: RegistryGet = async (url) =>
      url.includes("/-/v1/search") ? { ok: true, status: 200, data: { objects: [{ package: { name: "a" } }] } } : { ok: false, status: 503 };
    const r = await scanNpmPublishes(iocs, { user: "me", runner, get });
    expect(asked).toBe(false);
    expect(r.gaps.map((g) => g.what)).toEqual(["1 of 1 npm package(s) maintained by me"]);
  });

  it("a failed registry search is a gap", async () => {
    const r = await scanNpmPublishes(iocs, { user: "me", runner: whoami("me"), get: async () => ({ ok: false, status: 500, error: "HTTP 500" }) });
    expect(r.gaps[0]?.why).toContain("the registry search failed");
  });
});
