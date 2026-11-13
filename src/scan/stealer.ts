// What 2026 macOS stealers and backdoors leave on disk, when no IOC names it
// (AMOS and its backdoor, MacSync, Phexia, Odyssey...):
// - a hidden program directly in the home folder (~/.agent, ~/.mainhelper),
// - hidden folders named like Apple's under Application Support
//   (/Library/Application Support/.com.apple.accountsd/),
// - the archive a stealer packs its loot into before upload (browser
//   logins, cookies, keychains in a zip in /tmp).
// Read-only: zip listings come from the archive's central directory, read in
// Node; tar listings from `tar -tzf` through the Runner.
import { closeSync, type Dirent, fstatSync, lstatSync, openSync, readdirSync, readSync, realpathSync } from "node:fs";
import { basename, join } from "node:path";
import type { Runner } from "../runner.js";
import type { Finding, Gap } from "../types.js";
import { changedMs, pathToken, type StartupItem } from "./hostintel.js";

type NewFinding = Omit<Finding, "id">;

const readdirOr = (d: string): string[] => {
  try {
    return readdirSync(d);
  } catch {
    return [];
  }
};

/** The first bytes of a file, or undefined. */
function head(p: string, n: number): Buffer | undefined {
  let fd: number | undefined;
  try {
    fd = openSync(p, "r");
    const buf = Buffer.alloc(n);
    const got = readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, got);
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** Mach-O (thin or universal) or ELF: a compiled program. */
export function binaryKind(p: string): "Mach-O" | "ELF" | undefined {
  const b = head(p, 4);
  if (!b || b.length < 4) return undefined;
  const be = b.readUInt32BE(0);
  if ([0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe, 0xbebafeca].includes(be)) return "Mach-O";
  if (be === 0x7f454c46) return "ELF";
  return undefined;
}

/**
 * Dotfiles directly in the home folder that are compiled programs, or that a
 * startup item runs (AMOS's ~/.agent loop and ~/.mainhelper backdoor).
 */
export function hiddenHomePrograms(home: string, items: StartupItem[]): { path: string; why: string; runBy?: string }[] {
  const runBy = new Map<string, string>();
  for (const it of items)
    for (const t of [it.executable, it.script, ...it.command.split(/\s+/)]) {
      if (!t) continue;
      const p = pathToken(t, home);
      if (p.startsWith(`${home}/.`) && !p.slice(home.length + 1).includes("/")) runBy.set(p, it.path);
    }
  const out: { path: string; why: string; runBy?: string }[] = [];
  for (const n of readdirOr(home)) {
    if (!n.startsWith(".") || n === "." || n === "..") continue;
    const p = join(home, n);
    try {
      if (!lstatSync(p).isFile()) continue;
    } catch {
      continue;
    }
    const kind = binaryKind(p);
    const by = runBy.get(p);
    if (kind || by)
      out.push({
        path: p,
        why: [kind ? `a ${kind} program` : undefined, by ? `run by the startup item ${by}` : undefined].filter(Boolean).join(", "),
        runBy: by,
      });
  }
  return out;
}

/** Hidden folders named like Apple's (`.com.apple.accountsd`) in Application Support folders: Apple's own are not hidden there. */
export function appleLookalikeFolders(dirs: string[]): string[] {
  const out: string[] = [];
  for (const d of dirs) for (const n of readdirOr(d)) if (/^\.com\.apple\./i.test(n)) out.push(join(d, n));
  return out;
}

/** Names in a zip's central directory, read without unpacking (zip64 included). At most `max` names. */
export function zipEntries(p: string, max = 20_000): string[] | undefined {
  let fd: number | undefined;
  try {
    fd = openSync(p, "r");
    const size = fstatSync(fd).size;
    const tailLen = Math.min(size, 65_557);
    const tail = Buffer.alloc(tailLen);
    readSync(fd, tail, 0, tailLen, size - tailLen);
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--)
      if (tail.readUInt32LE(i) === 0x06054b50) {
        eocd = i;
        break;
      }
    if (eocd < 0) return undefined;
    let count = tail.readUInt16LE(eocd + 10);
    let cdSize = tail.readUInt32LE(eocd + 12);
    let cdOffset = tail.readUInt32LE(eocd + 16);
    // zip64: the locator sits just before the end record and points to the zip64 end record.
    if ((cdOffset === 0xffffffff || count === 0xffff) && eocd >= 20 && tail.readUInt32LE(eocd - 20) === 0x07064b50) {
      const rec = Number(tail.readBigUInt64LE(eocd - 20 + 8));
      const z = Buffer.alloc(56);
      readSync(fd, z, 0, 56, rec);
      if (z.readUInt32LE(0) !== 0x06064b50) return undefined;
      count = Number(z.readBigUInt64LE(32));
      cdSize = Number(z.readBigUInt64LE(40));
      cdOffset = Number(z.readBigUInt64LE(48));
    }
    if (cdOffset + cdSize > size) return undefined;
    const cd = Buffer.alloc(Math.min(cdSize, 16 * 1024 * 1024));
    readSync(fd, cd, 0, cd.length, cdOffset);
    const names: string[] = [];
    let at = 0;
    for (let i = 0; i < count && names.length < max && at + 46 <= cd.length; i++) {
      if (cd.readUInt32LE(at) !== 0x02014b50) break;
      const nameLen = cd.readUInt16LE(at + 28);
      const extra = cd.readUInt16LE(at + 30);
      const comment = cd.readUInt16LE(at + 32);
      names.push(cd.subarray(at + 46, at + 46 + nameLen).toString("utf8"));
      at += 46 + nameLen + extra + comment;
    }
    return names;
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** Browser and keychain stores a stealer packs: Chromium's Login Data, Cookies, Local State; Firefox's logins.json, key4.db; keychains. */
const STOLEN = /(^|\/)(Login Data|Cookies|Local State|Web Data|logins\.json|key4\.db|cookies\.sqlite)$|\.keychain(-db)?$|Safe Storage/i;
/** Archive names stealers use for their loot. */
const LOOT_NAME = /^(osalogging|out)\.zip$/i;
const ARCHIVE = /\.(zip|tar\.gz|tgz)$/i;

/**
 * Archives changed in the review window in the staging folders (/tmp,
 * $TMPDIR, /Users/Shared), two levels deep: one holding browser or keychain
 * stores is compromised (a stealer packed them), one named like a stealer's
 * loot is suspicious.
 */
export async function stagingArchives(
  runner: Runner,
  dirs: string[],
  opts: { sinceMs: number; nowMs: number; skip: (p: string) => boolean },
): Promise<{ findings: NewFinding[]; gaps: Gap[]; archives: number }> {
  const findings: NewFinding[] = [];
  const gaps: Gap[] = [];
  const archives: string[] = [];
  const seen = new Set<string>();
  let entries = 0;
  const visit = (d: string, depth: number) => {
    let list: Dirent[] = [];
    try {
      list = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    // The entry types come with the listing: only archives are stat'ed (a temp folder can hold hundreds of thousands of entries).
    for (const e of list) {
      if (++entries > 200_000 || archives.length >= 500) return;
      const p = join(d, e.name);
      if (e.isDirectory()) {
        if (depth > 0 && !opts.skip(p)) visit(p, depth - 1);
      } else if (e.isFile() && ARCHIVE.test(e.name) && !opts.skip(p))
        try {
          if (changedMs(lstatSync(p), opts.nowMs) >= opts.sinceMs) archives.push(p);
        } catch {}
    }
  };
  for (const d of dirs) {
    let real = d;
    try {
      real = realpathSync(d);
    } catch {}
    if (seen.has(real)) continue;
    seen.add(real);
    visit(d, 2);
  }
  const unlisted: string[] = [];
  for (const p of archives) {
    let names: string[] | undefined;
    if (/\.zip$/i.test(p)) names = zipEntries(p);
    else {
      const r = await runner("tar", ["-tzf", p], { timeoutMs: 60_000 });
      if (r.ok) names = r.stdout.split("\n").filter(Boolean).slice(0, 20_000);
    }
    if (!names) unlisted.push(p);
    const stolen = [...new Set((names ?? []).filter((x) => STOLEN.test(x.replace(/\/+$/, ""))).map((x) => basename(x.replace(/\/+$/, ""))))];
    if (stolen.length)
      findings.push({
        surface: "host",
        severity: "compromised",
        subject: p,
        title: `Archive ${p} holds browser or keychain stores (${stolen.slice(0, 6).join(", ")}): a stealer packs these before uploading them`,
        evidence: {
          kind: "file",
          ref: p,
          excerpt: (names ?? [])
            .filter((x) => STOLEN.test(x))
            .slice(0, 8)
            .join(" | ")
            .slice(0, 300),
        },
        key: `host|staging|${p}`,
      });
    else if (LOOT_NAME.test(basename(p)))
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: p,
        title: `Archive ${basename(p)} in ${p.slice(0, -basename(p).length - 1)} is named like a macOS stealer's loot (osalogging.zip, out.zip)${names ? `: ${names.length} file(s) inside` : ""}`,
        evidence: { kind: "file", ref: p, excerpt: (names ?? []).slice(0, 8).join(" | ").slice(0, 300) },
        key: `host|staging|${p}`,
      });
  }
  if (unlisted.length)
    gaps.push({
      surface: "host",
      what: `the contents of ${unlisted.length} recent archive(s) in temp and shared folders: ${unlisted.slice(0, 3).join(", ")}${unlisted.length > 3 ? ", ..." : ""}`,
      why: "they could not be listed (unreadable, damaged, or tar failed)",
      fix: `unzip -l or tar -tzf ${JSON.stringify(unlisted[0])}`,
    });
  return { findings, gaps, archives: archives.length };
}
