import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Run } from "../src/run.js";
import type { Runner } from "../src/runner.js";
import type { IocFile } from "../src/types.js";

export const AIKIDO_IOCS = JSON.parse(readFileSync(new URL("./fixtures/aikido-iocs.json", import.meta.url), "utf8")) as IocFile;

export function tmp(prefix = "ug-"): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

/** A run with one fetched source S1, ready for the Aikido IOC file. */
export function aikidoRun(): Run {
  const run = new Run(tmp("ug-run-"));
  run.addSource({
    url: "https://www.aikido.dev/blog/compromised-github-accounts",
    title: "wfx-loot",
    fetchedAt: "2026-11-12T10:00:00Z",
    origin: "web",
    file: "sources/S1.md",
  });
  run.write("iocs.json", AIKIDO_IOCS);
  return run;
}

/**
 * A fake `gh` that answers `gh api <path>` from a table. A path missing from the
 * table answers 404, as GitHub does; a function value can vary by call.
 */
export function fakeGh(
  routes: Record<string, unknown>,
  other: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true }),
): Runner & { calls: string[] } {
  const calls: string[] = [];
  const runner = (async (cmd, args) => {
    if (cmd !== "gh") return other(cmd, args);
    if (args[0] === "api" && args[1] === "-i")
      return { ok: true, status: 0, stdout: "HTTP/2.0 200 OK\nX-Oauth-Scopes: repo, read:org, workflow\n\n{}", stderr: "" };
    const path = args[args.length - 1] as string;
    calls.push(path);
    const key = Object.keys(routes).find((k) => k === path || path.startsWith(`${k}?`) || path.startsWith(`${k}&`));
    if (!key) return { ok: false, status: 1, stdout: '{"message":"Not Found","status":"404"}', stderr: "gh: Not Found (HTTP 404)" };
    const value = routes[key];
    // Page 2+ of a list is empty unless the route says otherwise.
    if (/[?&]page=([2-9]|\d{2,})/.test(path) && Array.isArray(value)) return { ok: true, status: 0, stdout: "[]", stderr: "" };
    return { ok: true, status: 0, stdout: JSON.stringify(typeof value === "function" ? (value as (p: string) => unknown)(path) : value), stderr: "" };
  }) as Runner & { calls: string[] };
  runner.calls = calls;
  return runner;
}
