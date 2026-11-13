import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach } from "vitest";
import { setRegistryGet } from "../src/cli.js";

// The watch state lives in a throwaway directory: a test must never read or
// overwrite a user's ~/.ultraguard.
const scratch = mkdtempSync(join(tmpdir(), "ultraguard-tests-"));
beforeEach(() => {
  process.env.ULTRAGUARD_HOME = join(scratch, "home");
  process.env.ULTRAGUARD_CACHE_DIR = join(scratch, "cache");
  // Never the real npm registry from a test: a test that wants it installs its own fake.
  setRegistryGet(async () => ({ ok: false, status: 0, error: "no network in tests" }));
});
