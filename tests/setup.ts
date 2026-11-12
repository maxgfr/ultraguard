import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach } from "vitest";

// The watch state lives in a throwaway directory: a test must never read or
// overwrite a user's ~/.ultraguard.
const scratch = mkdtempSync(join(tmpdir(), "ultraguard-tests-"));
beforeEach(() => {
  process.env.ULTRAGUARD_HOME = join(scratch, "home");
  process.env.ULTRAGUARD_CACHE_DIR = join(scratch, "cache");
});
