// Regressions from the pipeline audit: cloud persistence and per-provider coverage.
import { describe, expect, it } from "vitest";
import type { Runner } from "../src/runner.js";
import { scanCloud } from "../src/scan/cloud.js";
import { AIKIDO_IOCS } from "./helpers.js";

const missing: Runner = async () => ({ ok: false, status: 1, stdout: "", stderr: "", missing: true });
const json = (v: unknown) => ({ ok: true, status: 0, stdout: JSON.stringify(v), stderr: "" });

describe("cloud-1: a provider in use that answered nothing keeps the cloud UNKNOWN", () => {
  it("AWS logged out while gcloud answers", async () => {
    const runner: Runner = async (cmd, args) => {
      if (cmd === "aws") return { ok: false, status: 255, stdout: "", stderr: "The SSO session has expired" };
      if (cmd === "gcloud" && args[0] === "config") return { ok: true, status: 0, stdout: args[2] === "account" ? "me@x.dev\n" : "proj-1\n", stderr: "" };
      if (cmd === "gcloud" && args[0] === "iam") return json([]);
      if (cmd === "gcloud") return json([]);
      return missing(cmd, args);
    };
    const r = await scanCloud(AIKIDO_IOCS, runner);
    expect(r.result.scanned).toBe(false);
    expect(r.result.notApplicable).toBeUndefined();
    expect(r.gaps.some((g) => g.what.includes("AWS (not logged in)"))).toBe(true);
    expect(r.gaps.some((g) => g.what.includes("GCP project proj-1"))).toBe(true);
  });

  it("AWS logged in but every IAM listing denied", async () => {
    const runner: Runner = async (cmd, args) => {
      if (cmd !== "aws") return missing(cmd, args);
      if (args[0] === "sts") return json({ Account: "123" });
      return { ok: false, status: 254, stdout: "", stderr: "AccessDenied" };
    };
    const r = await scanCloud(AIKIDO_IOCS, runner);
    expect(r.result.scanned).toBe(false);
  });

  it("no CLI at all is not applicable, still UNKNOWN", async () => {
    const r = await scanCloud(AIKIDO_IOCS, missing);
    expect(r.result).toMatchObject({ scanned: false, notApplicable: "no cloud CLI installed (aws, gcloud, az)" });
  });
});

describe("cloud-2: the usual AWS persistence", () => {
  it("flags a new role trusting another account, an open GitHub OIDC trust and a new user", async () => {
    const runner: Runner = async (cmd, args) => {
      if (cmd !== "aws") return missing(cmd, args);
      const a = args.join(" ");
      if (a.startsWith("sts")) return json({ Account: "111122223333" });
      if (a.startsWith("iam list-roles"))
        return json({
          Roles: [
            {
              RoleName: "backdoor",
              CreateDate: "2026-11-11T00:00:00Z",
              AssumeRolePolicyDocument: { Statement: [{ Effect: "Allow", Principal: { AWS: "arn:aws:iam::999988887777:root" } }] },
            },
            {
              RoleName: "gha",
              CreateDate: "2025-01-01T00:00:00Z",
              AssumeRolePolicyDocument: {
                Statement: [{ Effect: "Allow", Principal: { Federated: "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com" } }],
              },
            },
            {
              RoleName: "gha-pinned",
              CreateDate: "2025-01-01T00:00:00Z",
              AssumeRolePolicyDocument: {
                Statement: [
                  {
                    Effect: "Allow",
                    Principal: { Federated: "arn:aws:iam::111122223333:oidc-provider/token.actions.githubusercontent.com" },
                    Condition: { StringLike: { "token.actions.githubusercontent.com:sub": "repo:acme/site:*" } },
                  },
                ],
              },
            },
            {
              RoleName: "vendor",
              CreateDate: "2025-01-01T00:00:00Z",
              AssumeRolePolicyDocument: { Statement: [{ Effect: "Allow", Principal: { AWS: "arn:aws:iam::444455556666:root" } }] },
            },
          ],
        });
      if (a.startsWith("iam list-users")) return json({ Users: [{ UserName: "ops2", CreateDate: "2026-11-11T05:00:00Z" }] });
      if (a.startsWith("iam list-access-keys")) return json({ AccessKeyMetadata: [] });
      return json({});
    };
    const r = await scanCloud(AIKIDO_IOCS, runner, { now: new Date("2026-11-12T12:00:00Z") });
    expect(r.findings.map((f) => f.key).sort()).toEqual([
      "cloud|aws|111122223333|newrole|backdoor",
      "cloud|aws|111122223333|newuser|ops2",
      "cloud|aws|111122223333|oidc|gha",
    ]);
    expect(r.findings.find((f) => f.key.endsWith("newrole|backdoor"))?.title).toContain("999988887777");
    expect(r.result.scanned).toBe(true);
  });
});
