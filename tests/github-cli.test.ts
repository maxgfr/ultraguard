// The one-line summary an agent reads must not make an unscanned GitHub look clean.
import { afterEach, describe, expect, it, vi } from "vitest";
import { main, setRunner } from "../src/cli.js";
import { defaultRunner } from "../src/runner.js";
import { aikidoRun, fakeGh } from "./helpers.js";

afterEach(() => {
  setRunner(defaultRunner);
  vi.restoreAllMocks();
});

function capture(): () => string {
  const chunks: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((c: string | Uint8Array) => {
    chunks.push(String(c));
    return true;
  });
  return () => chunks.join("");
}

describe("cli: GitHub not scanned", () => {
  it("sweep says NOT SCANNED with the fix, and exits 20, when gh is logged out", async () => {
    const run = aikidoRun();
    const logs = capture();
    setRunner(fakeGh({}));
    const code = await main(["sweep", "--surfaces", "github", "--out", run.dir]);
    const text = logs();
    expect(code).toBe(20);
    expect(text).toContain("github: NOT SCANNED (the whole GitHub surface: HTTP 404). Fix: gh auth login");
    expect(text).not.toContain("0 account finding(s)");
  });

  it("scan github exits 0 when GitHub was read", async () => {
    const run = aikidoRun();
    capture();
    setRunner(fakeGh({ user: { login: "me" }, "user/keys": [], "user/gpg_keys": [], "user/repos": [] }));
    expect(await main(["scan", "github", "--out", run.dir])).toBe(0);
  });
});
