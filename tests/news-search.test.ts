// search --news: the standard "anything new?" query set, supply chain plus this OS's machine malware.
import { afterEach, describe, expect, it, vi } from "vitest";
import { BOOL_FLAGS, HELP, main, setNewsDeps } from "../src/cli.js";
import { Run } from "../src/run.js";
import { MACHINE_QUERIES, newsQueries, type Searcher, SUPPLY_CHAIN_QUERIES, searchNews } from "../src/search.js";
import { tmp } from "./helpers.js";

const NOW = new Date("2026-11-13T09:00:00Z");

/** A searcher that answers each query with one hit of its own and one shared by every query. */
function fakeSearcher(refuse: (q: string) => boolean = () => false): Searcher & { asked: string[] } {
  const asked: string[] = [];
  const s: Searcher = async (q, opts) => {
    asked.push(q);
    if (refuse(q)) return { hits: [], notes: ["every engine refused (`webindex searxng up`)"], searched: false };
    expect(opts.limit).toBeGreaterThan(0);
    const slug = q.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      hits: [
        { url: `https://research.example/${slug}`, title: q, snippet: "write-up", via: "searxng" as const },
        { url: "https://news.example/roundup", title: "weekly roundup", snippet: "", via: "searxng" as const },
      ],
      notes: [],
      searched: true,
    };
  };
  return Object.assign(s, { asked });
}

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((s) => {
    out.push(String(s));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((s) => {
    err.push(String(s));
    return true;
  });
  return { out, err };
}

afterEach(() => {
  setNewsDeps({});
  vi.restoreAllMocks();
});

describe("newsQueries", () => {
  it("runs the supply-chain set, then this OS's machine-malware set, each with the month and year", () => {
    const mac = newsQueries("darwin", NOW).map((q) => q.query);
    expect(mac.slice(0, SUPPLY_CHAIN_QUERIES.length)).toEqual(SUPPLY_CHAIN_QUERIES.map((q) => `${q} November 2026`));
    expect(mac).toContain("macOS stealer November 2026");
    expect(mac).toContain("ClickFix macOS November 2026");
    expect(mac.some((q) => /Linux/.test(q))).toBe(false);
    const linux = newsQueries("linux", new Date("2027-01-02T00:00:00Z")).map((q) => q.query);
    expect(linux).toContain("Linux malware campaign January 2027");
    expect(linux.some((q) => /macOS|XProtect/.test(q))).toBe(false);
    expect(newsQueries("darwin", NOW).filter((q) => q.topic === "machine")).toHaveLength(MACHINE_QUERIES.darwin?.length ?? -1);
  });

  it("uses the UTC month: the last hours of a month are not the next one", () => {
    expect(newsQueries("darwin", new Date("2026-11-30T23:30:00Z"))[0]?.query).toMatch(/November 2026$/);
  });
});

describe("searchNews", () => {
  it("appends every query's hits to search-hits.json, deduplicated, with per-query counts", async () => {
    const run = new Run(tmp());
    const searcher = fakeSearcher();
    const r = await searchNews(run, { searcher, platform: "darwin", now: NOW });
    const expected = newsQueries("darwin", NOW).map((q) => q.query);
    expect(searcher.asked).toEqual(expected);
    expect(r.queries.map((q) => q.added.length)).toEqual(expected.map((_, i) => (i === 0 ? 2 : 1)));
    expect(r.total).toBe(expected.length + 1);
    expect(r.searched).toBe(true);
    expect(r.unsearched).toEqual([]);
    const hits = run.read<{ url: string; query: string }[]>("search-hits.json", []);
    expect(hits).toHaveLength(expected.length + 1);
    expect(hits.find((h) => h.url.includes("macos-stealer"))?.query).toBe("macOS stealer November 2026");
    // A second run adds nothing new.
    expect((await searchNews(run, { searcher, platform: "darwin", now: NOW })).queries.every((q) => q.added.length === 0)).toBe(true);
  });

  it("names the queries no engine answered, and keeps the engine notes in ultraguard's terms, once", async () => {
    const run = new Run(tmp());
    const r = await searchNews(run, { searcher: fakeSearcher((q) => q.startsWith("macOS")), platform: "darwin", now: NOW });
    expect(r.unsearched).toEqual(["macOS stealer November 2026", "macOS backdoor November 2026"]);
    expect(r.searched).toBe(true);
    expect(r.notes).toEqual(["every engine refused (a SearXNG instance (ULTRAGUARD_SEARXNG))"]);
    const none = await searchNews(new Run(tmp()), { searcher: fakeSearcher(() => true), platform: "linux", now: NOW });
    expect(none.searched).toBe(false);
  });

  it("says when this OS has no machine-malware set, instead of silently searching supply chain only", async () => {
    const r = await searchNews(new Run(tmp()), { searcher: fakeSearcher(), platform: "win32", now: NOW });
    expect(r.queries.every((q) => q.topic === "supply-chain")).toBe(true);
    expect(r.notes.join("\n")).toContain("no machine-malware query set for Windows");
  });
});

describe("ultraguard search --news", () => {
  it("is a documented boolean flag of search", () => {
    expect(BOOL_FLAGS).toContain("news");
    expect(HELP).toContain("ultraguard search --news --out <run>");
  });

  it("runs the set for the injected platform and date, and prints per-query counts", async () => {
    const run = new Run(tmp());
    const searcher = fakeSearcher((q) => q.startsWith("XProtect"));
    setNewsDeps({ searcher, platform: "darwin", now: () => NOW });
    const io = capture();
    expect(await main(["search", "--news", "--out", run.dir])).toBe(0);
    const text = io.out.join("");
    expect(text).toContain("## macOS stealer November 2026: 1 new hit(s)");
    expect(text).toContain("## XProtect new rules November 2026: NOT SEARCHED (no engine answered)");
    expect(text).toContain("1 of 12 queries got no answer: their news is unknown, not absent");
    expect(text).toContain("then macOS malware, November 2026");
    expect(run.read<unknown[]>("search-hits.json", [])).toHaveLength(12);
  });

  it("--json gives one line with every query; exit 1 when no engine answered any", async () => {
    const run = new Run(tmp());
    setNewsDeps({ searcher: fakeSearcher(() => true), platform: "linux", now: () => NOW });
    const io = capture();
    expect(await main(["search", "--news", "--limit", "3", "--out", run.dir, "--json"])).toBe(1);
    const r = JSON.parse(io.out.join(""));
    expect(r.platform).toBe("linux");
    expect(r.unsearched).toHaveLength(r.queries.length);
  });

  it("a query and --news together is a usage error; a plain query still works", async () => {
    const run = new Run(tmp());
    const searcher = fakeSearcher();
    setNewsDeps({ searcher, platform: "darwin", now: () => NOW });
    const io = capture();
    expect(await main(["search", "macOS stealer", "--news", "--out", run.dir])).toBe(2);
    expect(io.err.join("")).toContain("a query or --news, not both");
    expect(searcher.asked).toEqual([]);
    expect(await main(["search", "macOS stealer", "--out", run.dir])).toBe(0);
    expect(searcher.asked).toEqual(["macOS stealer"]);
    expect(await main(["search", "--out", run.dir])).toBe(2);
    expect(io.err.join("")).toContain("or --news for the standard set");
  });
});
