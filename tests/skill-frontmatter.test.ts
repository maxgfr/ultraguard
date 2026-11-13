// The installer (skills.sh) parses SKILL.md's frontmatter as YAML: an unquoted
// value holding ": " or " #" is not a plain scalar, the description is lost,
// and the published skill no longer installs ("No valid skills found").
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const text = readFileSync(join(__dirname, "..", "skills", "ultraguard", "SKILL.md"), "utf8");
const front = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";

describe("SKILL.md frontmatter", () => {
  it("has a name and a description", () => {
    expect(front).toMatch(/^name: ultraguard$/m);
    expect(front).toMatch(/^description: \S/m);
  });

  it("keeps every unquoted top-level value a plain YAML scalar", () => {
    for (const line of front.split("\n").filter((l) => /^[a-z_-]+: /.test(l))) {
      const value = line.slice(line.indexOf(": ") + 2);
      if (/^["']/.test(value)) continue;
      expect(value, line.slice(0, 60)).not.toMatch(/: | #|^[&*!|>%@`]/);
    }
  });
});
