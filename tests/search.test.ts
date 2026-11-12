import { describe, expect, it } from "vitest";
import { Run } from "../src/run.js";
import { searchInto } from "../src/search.js";
import { tmp } from "./helpers.js";

describe("search", () => {
  it("accumulates deduplicated hits in the shape intel reads", async () => {
    const run = new Run(tmp());
    const searcher = async (q: string) => ({
      hits: [
        { url: "https://www.stepsecurity.io/blog/wfx", title: `A ${q}`, snippet: "s", via: "searxng" as const },
        { url: "https://safedep.io/blog/wfx", title: "B", snippet: "", via: "searxng" as const },
      ],
      notes: [],
      searched: true,
    });
    const first = await searchInto(run, "wfx", { searcher });
    const second = await searchInto(run, "wfx again", { searcher });
    expect(first.added).toHaveLength(2);
    expect(second.added).toHaveLength(0);
    expect(run.read<{ url: string; query: string }[]>("search-hits.json", []).map((h) => [h.url, h.query])).toEqual([
      ["https://www.stepsecurity.io/blog/wfx", "wfx"],
      ["https://safedep.io/blog/wfx", "wfx"],
    ]);
  });

  it("says when no engine answered, so an empty list is not read as no news", async () => {
    const run = new Run(tmp());
    const r = await searchInto(run, "x", { searcher: async () => ({ hits: [], notes: ["every engine refused"], searched: false }) });
    expect(r.searched).toBe(false);
    expect(r.notes).toEqual(["every engine refused"]);
  });
});
