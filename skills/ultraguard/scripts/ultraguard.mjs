#!/usr/bin/env node

// src/cli.ts
import { readFileSync as readFileSync12, realpathSync as realpathSync2 } from "fs";
import { homedir as homedir5 } from "os";
import { resolve as resolve2 } from "path";
import { pathToFileURL } from "url";

// src/vendor/webindex-engine.mjs
import { inflateRawSync, inflateSync } from "zlib";
import { spawn, spawnSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { spawn as spawn2 } from "child_process";
import { mkdtempSync, readFileSync as readFileSync2, rmSync, writeFileSync, existsSync } from "fs";
import { join as join2 } from "path";
import { tmpdir as tmpdir2 } from "os";
import { isAbsolute } from "path";
import { inflateRawSync as inflateRawSync2 } from "zlib";
import { spawn as spawn3, spawnSync as spawnSync2 } from "child_process";
import { mkdtempSync as mkdtempSync2, readdirSync as readdirSync2, readFileSync as readFileSync3, rmSync as rmSync2, writeFileSync as writeFileSync2 } from "fs";
import { tmpdir as tmpdir3 } from "os";
import { join as join3 } from "path";
import { existsSync as existsSync2, readFileSync as readFileSync4, writeFileSync as writeFileSync3 } from "fs";
import { join as join4 } from "path";
import { mkdirSync, renameSync, unlinkSync, writeFileSync as writeFileSync4 } from "fs";
import { existsSync as existsSync3, readdirSync as readdirSync3, readFileSync as readFileSync5, statSync } from "fs";
import { basename } from "path";
import { createHash, randomBytes } from "crypto";
import { EventEmitter } from "events";
import { accessSync, constants, statSync as statSync2 } from "fs";
import { homedir } from "os";
import { posix, win32 } from "path";
import { chmodSync as chmodSync2, copyFileSync as copyFileSync2, existsSync as existsSync5, lstatSync as lstatSync2, mkdirSync as mkdirSync4, readdirSync as readdirSync5, readFileSync as readFileSync7, realpathSync, rmSync as rmSync4, statSync as statSync3, writeFileSync as writeFileSync5 } from "fs";
import { homedir as homedir2 } from "os";
import { basename as basename2, join as join8, resolve as resolve3, sep } from "path";
import { randomUUID as randomUUID2 } from "crypto";
import { appendFileSync, closeSync, existsSync as existsSync6, linkSync, openSync, readFileSync as readFileSync8, renameSync as renameSync3, rmSync as rmSync5, statSync as statSync4, unlinkSync as unlinkSync2, writeSync } from "fs";
import { join as join9 } from "path";
import { spawn as nodeSpawn } from "child_process";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "fs/promises";
import { existsSync as existsSync7, statSync as statSync5 } from "fs";
import { isAbsolute as isAbsolute2, join as join10 } from "path";
import { join as join11 } from "path";
import { createContext, Script } from "vm";
import { promisify } from "util";
import { gunzip } from "zlib";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
function configure(next) {
  if (!next.envPrefix || !/^[A-Z][A-Z0-9_]*$/.test(next.envPrefix)) {
    throw new Error(`webindex: envPrefix must be UPPER_SNAKE, got ${JSON.stringify(next.envPrefix)}`);
  }
  if (!next.name || !next.cli) {
    throw new Error("webindex: configure() requires both `name` and `cli`");
  }
  current = { ...next };
}
function brand() {
  return current;
}
function countFetch(bytes, cached = false) {
  const hook = current.onFetch;
  if (!hook) return;
  try {
    hook(bytes, cached);
  } catch {
  }
}
function envName(suffix) {
  return `${current.envPrefix}_${suffix}`;
}
function env(suffix) {
  const raw = process.env[envName(suffix)];
  if (typeof raw !== "string") return void 0;
  const trimmed = raw.trim();
  return trimmed ? trimmed : void 0;
}
function envFlag(suffix) {
  const v = env(suffix);
  if (v === void 0) return false;
  const lower = v.toLowerCase();
  return lower !== "0" && lower !== "false" && lower !== "no" && lower !== "off";
}
function envInt(suffix, def, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const raw = env(suffix);
  if (raw === void 0) return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
var DEFAULT_BRAND;
var current;
var MAX_TIMER_MS;
var init_brand = __esm({
  "src/brand.ts"() {
    "use strict";
    DEFAULT_BRAND = {
      name: "webindex",
      envPrefix: "WEBINDEX",
      cli: "webindex",
      contactUrl: "https://github.com/maxgfr/webindex"
    };
    current = { ...DEFAULT_BRAND };
    MAX_TIMER_MS = 2 ** 31 - 1;
  }
});
function decodePdfString(tok) {
  return tok.slice(1, -1).replace(/\\(?:([nrtbf()\\])|([0-7]{1,3})|(\r\n|\r|\n)|([\s\S]))/g, (_m, esc, oct, _eol, other) => {
    if (esc) return ESCAPES[esc];
    if (oct) return String.fromCharCode(parseInt(oct, 8) & 255);
    return other ?? "";
  });
}
function decodeHexString(tok) {
  const hex = tok.slice(1, -1).replace(/\s+/g, "");
  let out2 = "";
  for (let i = 0; i + 1 < hex.length; i += 2) out2 += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  if (hex.length % 2) out2 += String.fromCharCode(parseInt(hex[hex.length - 1] + "0", 16));
  return out2;
}
function decodeString(tok) {
  const bytes = tok[0] === "<" ? decodeHexString(tok) : decodePdfString(tok);
  return bytes.replace(/[\x7f-\x9f]/g, winAnsi);
}
function decodeTJArray(items) {
  let out2 = "";
  for (const item of items) {
    if (typeof item === "string") out2 += decodeString(item);
    else if (item <= -100) out2 += " ";
  }
  return out2;
}
function inlineImageEnd(s, from) {
  for (let k = s.indexOf("EI", from); k >= 0; k = s.indexOf("EI", k + 1)) {
    const after = k + 2 >= s.length || isWhite(s.charCodeAt(k + 2)) || isDelimiter(s.charCodeAt(k + 2));
    if (isWhite(s.charCodeAt(k - 1)) && after) return k + 2;
  }
  return s.length;
}
function extractTextOps(s) {
  const lexer = new Lexer(s);
  let out2 = "";
  let operands = [];
  const take = () => {
    const last = operands[operands.length - 1];
    if (last === void 0) return "";
    return typeof last === "string" ? decodeString(last) : decodeTJArray(last);
  };
  let i = 0;
  while (i < s.length) {
    const c = s.charCodeAt(i);
    if (c === 40 || c === 60 && s.charCodeAt(i + 1) !== 60) {
      const end2 = c === 40 ? lexer.stringEnd(i) : lexer.hexEnd(i);
      if (end2 > 0) {
        operands.push(s.slice(i, end2));
        i = end2;
      } else i++;
      continue;
    }
    if (c === 91) {
      const arr = lexer.array(i);
      if (arr) {
        operands.push(arr.items);
        i = arr.end;
      } else i++;
      continue;
    }
    if (c === 37) {
      while (i < s.length && s.charCodeAt(i) !== 10 && s.charCodeAt(i) !== 13) i++;
      continue;
    }
    if (isWhite(c) || isDelimiter(c)) {
      i++;
      continue;
    }
    let end = i + 1;
    while (end < s.length && !isWhite(s.charCodeAt(end)) && !isDelimiter(s.charCodeAt(end))) end++;
    const word = s.slice(i, end);
    i = end;
    if (word === "Tj" || word === "TJ") out2 += take() + " ";
    else if (word === "'" || word === '"') out2 += "\n" + take() + " ";
    else if (word === "T*") out2 += "\n";
    else if (word === "ID") i = inlineImageEnd(s, i);
    else if (word !== "Td" && word !== "TD") continue;
    operands = [];
  }
  return out2;
}
function ascii85Decode(text, cap) {
  const out2 = Buffer.allocUnsafe(Math.min(cap, 4 * text.length));
  let n = 0;
  let group = 0;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 126) break;
    if (isWhite(c)) continue;
    if (c === 122 && count === 0) {
      if (n + 4 > cap) return TOO_BIG;
      out2.writeUInt32BE(0, n);
      n += 4;
      continue;
    }
    if (c < 33 || c > 117) return void 0;
    group = group * 85 + (c - 33);
    if (++count === 5) {
      if (n + 4 > cap) return TOO_BIG;
      out2.writeUInt32BE(group >>> 0, n);
      n += 4;
      group = 0;
      count = 0;
    }
  }
  if (count === 1) return void 0;
  if (count > 1) {
    for (let k = count; k < 5; k++) group = group * 85 + 84;
    if (n + count - 1 > cap) return TOO_BIG;
    for (let k = 0; k < count - 1; k++) out2[n++] = group >>> 24 - 8 * k & 255;
  }
  return out2.subarray(0, n);
}
function asciiHexDecode(text) {
  const end = text.indexOf(">");
  const hex = (end < 0 ? text : text.slice(0, end)).replace(/[^0-9A-Fa-f]/g, "");
  return Buffer.from(hex.length % 2 ? `${hex}0` : hex, "hex");
}
function inflateCapped(data, cap) {
  for (const inflate of [inflateSync, inflateRawSync]) {
    try {
      return inflate(data, { maxOutputLength: cap });
    } catch (e) {
      if (e.code === "ERR_BUFFER_TOO_LARGE") return TOO_BIG;
    }
  }
  return void 0;
}
function filtersOf(dict) {
  const m = /\/Filter\s*(\[[^\]]*\]|\/[^\s/<>[\]()]+)/.exec(dict);
  return m ? (m[1].match(/\/[^\s/<>[\]()]+/g) ?? []).map((f) => f.slice(1)) : void 0;
}
function* contentStreams(buf) {
  const s = buf.toString("latin1");
  const re = /(?<!end)stream\r?\n/g;
  let budget = MAX_TOTAL_BYTES;
  let previousEnd = 0;
  let m;
  while (budget > 0 && (m = re.exec(s))) {
    const start = m.index + m[0].length;
    const end = s.indexOf("endstream", start);
    if (end < 0) return;
    re.lastIndex = end + "endstream".length;
    const window = s.slice(Math.max(previousEnd, m.index - DICT_WINDOW), m.index);
    previousEnd = re.lastIndex;
    const dict = window.slice(window.lastIndexOf("obj") + 1);
    if (NOT_TEXT_RE.test(dict)) continue;
    let stop = end;
    if (s[stop - 1] === "\n") stop--;
    if (s[stop - 1] === "\r") stop--;
    let data = buf.subarray(start, stop);
    const filters = filtersOf(dict);
    if (filters) {
      for (const f of filters) {
        if (!data) break;
        const cap = Math.min(MAX_STREAM_BYTES, budget);
        let decoded;
        if (f === "ASCII85Decode" || f === "A85") decoded = ascii85Decode(data.toString("latin1"), cap);
        else if (f === "ASCIIHexDecode" || f === "AHx") decoded = asciiHexDecode(data.toString("latin1"));
        else if (f === "FlateDecode" || f === "Fl") decoded = inflateCapped(data, cap);
        if (decoded === TOO_BIG) budget -= cap;
        data = decoded instanceof Buffer ? decoded : void 0;
      }
    } else {
      const cap = Math.min(MAX_STREAM_BYTES, budget);
      if (/~>\s*$/.test(s.slice(Math.max(start, stop - 8), stop))) {
        const decoded = ascii85Decode(data.toString("latin1"), cap);
        if (decoded === TOO_BIG) {
          budget -= cap;
          continue;
        }
        data = decoded ?? data;
      }
      const inflated = inflateCapped(data, cap);
      if (inflated === TOO_BIG) {
        budget -= cap;
        data = void 0;
      } else if (inflated) data = inflated;
    }
    if (!data) continue;
    budget -= data.length;
    yield data.toString("latin1");
  }
}
function pdfToText(buf) {
  let out2 = "";
  try {
    for (const stream of contentStreams(buf)) {
      if (/\b(Tj|TJ)\b/.test(stream) || /\)\s*'/.test(stream)) out2 += extractTextOps(stream) + "\n";
    }
  } catch {
  }
  return out2.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
var MAX_STREAM_BYTES;
var MAX_TOTAL_BYTES;
var DICT_WINDOW;
var WIN_ANSI_C1;
var winAnsi;
var ESCAPES;
var isWhite;
var isDelimiter;
var isHexDigit;
var isNumberChar;
var Lexer;
var TOO_BIG;
var NOT_TEXT_RE;
var init_native = __esm({
  "src/pdf/native.ts"() {
    "use strict";
    MAX_STREAM_BYTES = 32 * 1024 * 1024;
    MAX_TOTAL_BYTES = 128 * 1024 * 1024;
    DICT_WINDOW = 4096;
    WIN_ANSI_C1 = [
      8364,
      8226,
      8218,
      402,
      8222,
      8230,
      8224,
      8225,
      710,
      8240,
      352,
      8249,
      338,
      8226,
      381,
      8226,
      8226,
      8216,
      8217,
      8220,
      8221,
      8226,
      8211,
      8212,
      732,
      8482,
      353,
      8250,
      339,
      8226,
      382,
      376
    ];
    winAnsi = (c) => {
      const code = c.charCodeAt(0);
      return code === 127 ? "\u2022" : String.fromCharCode(WIN_ANSI_C1[code - 128]);
    };
    ESCAPES = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
    isWhite = (c) => c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0;
    isDelimiter = (c) => c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 || c === 123 || c === 125 || c === 47 || c === 37;
    isHexDigit = (c) => c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
    isNumberChar = (c) => c >= 48 && c <= 57 || c === 45 || c === 43 || c === 46;
    Lexer = class {
      constructor(s) {
        this.s = s;
      }
      s;
      // Cleared by the first literal string whose parentheses never balance: from
      // then on strings are read flat, which is what every string was before
      // nesting was supported, and costs no more than the next parenthesis.
      nested = true;
      // Cleared by the first array that runs to the end of the stream. Every later
      // `[` is scanned through the same segmentation and reaches the same end, so
      // scanning them would re-pay the whole stream each time.
      arrays = true;
      /** End (exclusive) of the literal string opening at `i`, or -1. */
      stringEnd(i) {
        const s = this.s;
        if (this.nested) {
          let depth = 0;
          for (let j = i; j < s.length; j++) {
            const c = s.charCodeAt(j);
            if (c === 92) j++;
            else if (c === 40) depth++;
            else if (c === 41 && --depth === 0) return j + 1;
          }
          this.nested = false;
        }
        for (let j = i + 1; j < s.length; j++) {
          const c = s.charCodeAt(j);
          if (c === 92) j++;
          else if (c === 41) return j + 1;
          else if (c === 40) return -1;
        }
        return -1;
      }
      /** End (exclusive) of the hex string opening at `i`, or -1. */
      hexEnd(i) {
        const s = this.s;
        for (let j = i + 1; j < s.length; j++) {
          const c = s.charCodeAt(j);
          if (c === 62) return j + 1;
          if (!isHexDigit(c) && !isWhite(c)) return -1;
        }
        return -1;
      }
      /**
       * The array opening at `i`: its strings and numbers, and where it ends.
       *
       * A `]` inside one of its strings does not close it. That detail is
       * load-bearing: `[(] and gated recurrent [)-250(7)]` truncated at the inner
       * `]` silently dropped the rest of the array — on a real paper, whole clauses
       * from the middle of sentences, leaving fluent, citable prose.
       */
      array(i) {
        if (!this.arrays) return void 0;
        const s = this.s;
        const items = [];
        for (let j = i + 1; j < s.length; ) {
          const c = s.charCodeAt(j);
          if (c === 93) return { end: j + 1, items };
          const end = c === 40 ? this.stringEnd(j) : c === 60 ? this.hexEnd(j) : -1;
          if (end > 0) {
            items.push(s.slice(j, end));
            j = end;
          } else if (isNumberChar(c)) {
            let e = j + 1;
            while (e < s.length && isNumberChar(s.charCodeAt(e))) e++;
            items.push(Number(s.slice(j, e)));
            j = e;
          } else j++;
        }
        this.arrays = false;
        return void 0;
      }
    };
    TOO_BIG = /* @__PURE__ */ Symbol("too big");
    NOT_TEXT_RE = /\/Subtype\s*\/Image\b|\/Length[123]\b/;
  }
});
function isControlCode(c) {
  if (c >= 9 && c <= 13) return false;
  return c < 32 || c >= 127 && c <= 159;
}
function scanShape(t) {
  let control = 0;
  let replacement = 0;
  let letters = 0;
  let nonSpace = 0;
  let run = 0;
  let runIsRule = true;
  let longestRun2 = 0;
  const endRun = () => {
    if (!runIsRule && run > longestRun2) longestRun2 = run;
    run = 0;
    runIsRule = true;
  };
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    if (isSpace(c)) {
      endRun();
      continue;
    }
    if (c === REPLACEMENT_CODE) replacement++;
    else if (isControlCode(c)) control++;
    if (!isRuleChar(c)) runIsRule = false;
    if (c < 128) {
      if (c >= 48 && c <= 57 || (c | 32) >= 97 && (c | 32) <= 122) letters++;
      nonSpace++;
      run++;
      continue;
    }
    const cp = t.codePointAt(i);
    const units = cp > 65535 ? 2 : 1;
    if (LETTER_RE.test(String.fromCodePoint(cp))) letters++;
    nonSpace += units;
    run += units;
    i += units - 1;
  }
  endRun();
  return { control: control / t.length, replacement: replacement / t.length, longestRun: longestRun2, letterRatio: nonSpace ? letters / nonSpace : 0 };
}
function assessPdfText(text) {
  return assessExtractedText(text, NO_TEXT_LAYER);
}
function assessExtractedText(text, emptyReason, undecodable = "undecodable PDF stream") {
  const t = text.trim();
  if (!t) return { ok: false, reason: emptyReason };
  const shape = scanShape(t);
  if (shape.control > CONTROL_RATIO_MAX) {
    return { ok: false, reason: `binary/control characters in the text (${undecodable})` };
  }
  if (shape.replacement > REPLACEMENT_RATIO_MAX) {
    return { ok: false, reason: "replacement characters throughout (wrong character map)" };
  }
  if (t.length < MIN_CHARS_FOR_SHAPE_CHECKS) return { ok: true };
  if (shape.longestRun > LONGEST_RUN_MAX && shape.letterRatio < LETTER_RATIO_MIN) {
    return { ok: false, reason: "unreadable text layer (garbled glyph encoding)" };
  }
  return { ok: true };
}
var MIN_CHARS_FOR_SHAPE_CHECKS;
var CONTROL_RATIO_MAX;
var REPLACEMENT_RATIO_MAX;
var LONGEST_RUN_MAX;
var LETTER_RATIO_MIN;
var REPLACEMENT_CODE;
var SPACE_RE;
var isSpace;
var LETTER_RE;
var isRuleChar;
var NO_TEXT_LAYER;
var init_quality = __esm({
  "src/pdf/quality.ts"() {
    "use strict";
    MIN_CHARS_FOR_SHAPE_CHECKS = 200;
    CONTROL_RATIO_MAX = 5e-3;
    REPLACEMENT_RATIO_MAX = 5e-3;
    LONGEST_RUN_MAX = 300;
    LETTER_RATIO_MIN = 0.5;
    REPLACEMENT_CODE = 65533;
    SPACE_RE = /\s/;
    isSpace = (c) => c < 128 ? c === 32 || c >= 9 && c <= 13 : SPACE_RE.test(String.fromCharCode(c));
    LETTER_RE = /[\p{L}\p{N}]/u;
    isRuleChar = (c) => c === 95 || c === 45 || c === 46 || c === 61;
    NO_TEXT_LAYER = "no text layer (scanned or image-only PDF?)";
  }
});
function addChild(tree, parent, child) {
  const siblings = tree.get(parent);
  if (siblings) siblings.push(child);
  else tree.set(parent, [child]);
}
function treeFromProc() {
  let entries;
  try {
    entries = readdirSync("/proc");
  } catch {
    return void 0;
  }
  const tree = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    let stat2;
    try {
      stat2 = readFileSync(`/proc/${entry}/stat`, "latin1");
    } catch {
      continue;
    }
    const ppid = Number(stat2.slice(stat2.lastIndexOf(")") + 2).split(" ")[1]);
    if (ppid > 0) addChild(tree, ppid, Number(entry));
  }
  return tree;
}
function treeFromPs() {
  const r = spawnSync("ps", ["-A", "-o", "pid=,ppid="], { encoding: "utf8", timeout: 5e3 });
  if (r.status !== 0 || !r.stdout) return void 0;
  const tree = /* @__PURE__ */ new Map();
  for (const line of r.stdout.split("\n")) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number);
    if (pid && ppid) addChild(tree, ppid, pid);
  }
  return tree;
}
function descendants(pid) {
  const tree = (process.platform === "linux" ? treeFromProc() : void 0) ?? treeFromPs();
  if (!tree) return [];
  const found = /* @__PURE__ */ new Set();
  const queue2 = [pid];
  while (queue2.length) {
    for (const child of tree.get(queue2.shift()) ?? []) {
      if (found.has(child) || child === pid) continue;
      found.add(child);
      queue2.push(child);
    }
  }
  return [...found];
}
function killTree(child) {
  try {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }).on("error", () => child.kill("SIGKILL"));
    } else {
      const pids = child.pid ? descendants(child.pid) : [];
      child.kill("SIGKILL");
      for (const pid of pids) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {
        }
      }
    }
  } catch {
    child.kill("SIGKILL");
  }
  child.stdin?.destroy();
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.unref();
}
var init_process_tree = __esm({
  "src/process-tree.ts"() {
    "use strict";
  }
});
function binaryName(name) {
  return process.platform === "win32" && name === "npx" ? "npx.cmd" : name;
}
function cmdLine(bin, args) {
  const bad = [bin, ...args].find((a) => /[%\r\n]/.test(a));
  if (bad !== void 0) throw new Error(`refusing to pass ${JSON.stringify(bad)} through cmd.exe, which would rewrite it`);
  return [bin, ...args].map((s) => `"${s.replace(/"/g, '""')}"`).join(" ");
}
function runWithInput(cmd, args, input, timeoutMs, opts = {}) {
  return new Promise((resolve9) => {
    let child;
    try {
      const bin = binaryName(cmd);
      const viaShell = process.platform === "win32" && /\.(?:cmd|bat)$/i.test(bin);
      const common = { stdio: ["pipe", "pipe", "pipe"], ...opts.env ? { env: opts.env } : {} };
      child = viaShell ? spawn2(cmdLine(bin, args), { ...common, shell: true, windowsHide: true }) : spawn2(bin, args, common);
    } catch (e) {
      resolve9({ ok: false, stdout: "", error: e.message });
      return;
    }
    const chunks = [];
    let size = 0;
    let stderrHead = "";
    let stderrTail = "";
    let stderrCut = false;
    const withStderr = (r) => {
      const stderr = (stderrCut ? `${stderrHead}
\u2026
${stderrTail}` : stderrHead + stderrTail).trim();
      return stderr ? { ...r, stderr } : r;
    };
    let settled = false;
    const done = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve9(r);
    };
    const timer = setTimeout(
      () => {
        killTree(child);
        done(withStderr({ ok: false, stdout: "", error: `timed out after ${Math.round(timeoutMs / 1e3)}s` }));
      },
      Math.min(timeoutMs, MAX_TIMER_MS)
    );
    child.stdout?.on("data", (d) => {
      if (size >= MAX_STDOUT_BYTES) return;
      size += d.length;
      chunks.push(d);
    });
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk) => {
      let rest = chunk;
      if (stderrHead.length < STDERR_END_CHARS) {
        const room = STDERR_END_CHARS - stderrHead.length;
        stderrHead += rest.slice(0, room);
        rest = rest.slice(room);
      }
      const tail = stderrTail + rest;
      if (tail.length > STDERR_END_CHARS) stderrCut = true;
      stderrTail = tail.slice(-STDERR_END_CHARS);
    });
    child.on("error", (e) => {
      done({ ok: false, stdout: "", error: e.code === "ENOENT" ? "not installed" : e.message });
    });
    child.on("close", (code, signal) => {
      const stdout = Buffer.concat(chunks).subarray(0, MAX_STDOUT_BYTES).toString("utf8");
      if (code === 0) done({ ok: true, stdout });
      else done(withStderr({ ok: false, stdout, error: code === null ? `killed by ${signal}` : `exit ${code}` }));
    });
    child.stdin?.on("error", () => {
    });
    child.stdin?.end(input);
  });
}
var PDF_INSPECTOR_SPEC;
var ANYDOC_SPEC;
var MAX_STDOUT_BYTES;
var STDERR_END_CHARS;
var init_exec = __esm({
  "src/pdf/exec.ts"() {
    "use strict";
    init_brand();
    init_process_tree();
    PDF_INSPECTOR_SPEC = "@firecrawl/pdf-inspector@1";
    ANYDOC_SPEC = "@firecrawl/anydoc@0.1";
    MAX_STDOUT_BYTES = 24 * 1024 * 1024;
    STDERR_END_CHARS = 1024;
  }
});
function ocrBudgetLeft() {
  return Math.max(0, envInt("OCR_MAX", DEFAULT_MAX_DOCS) - spent);
}
async function ocrTools() {
  if (!toolsProbe) {
    toolsProbe = (async () => {
      const probe = async (cmd, args) => (await runWithInput(cmd, args, Buffer.alloc(0), 2e4)).ok;
      const [copyablePdf, tesseract] = await Promise.all([probe("copyable-pdf", ["--help"]), probe("tesseract", ["--version"])]);
      return { copyablePdf, tesseract };
    })();
  }
  return toolsProbe;
}
async function ocrAttempt(bytes) {
  if (ocrBudgetLeft() <= 0) return { declined: "budget" };
  const { copyablePdf, tesseract } = await ocrTools();
  if (!copyablePdf || !tesseract) return { declined: "tools" };
  if (ocrBudgetLeft() <= 0) return { declined: "budget" };
  spent++;
  const dir = mkdtempSync(join2(tmpdir2(), `${brand().name}-ocr-`));
  try {
    const input = join2(dir, "in.pdf");
    const output = join2(dir, "out.pdf");
    writeFileSync(input, bytes);
    const lang = env("OCR_LANG") || DEFAULT_LANG;
    const r = await runWithInput("copyable-pdf", ["-o", output, "-m", "-l", lang, input], Buffer.alloc(0), envInt("OCR_TIMEOUT_MS", DEFAULT_TIMEOUT_MS));
    if (r.error === "not installed") {
      spent = Math.max(0, spent - 1);
      return { declined: "tools" };
    }
    if (!r.ok) return { failed: true };
    const md = output.replace(/\.pdf$/, ".md");
    return existsSync(md) ? { text: readFileSync2(md, "utf8") } : { failed: true };
  } catch {
    return { failed: true };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
var DEFAULT_TIMEOUT_MS;
var DEFAULT_MAX_DOCS;
var DEFAULT_LANG;
var spent;
var toolsProbe;
var init_ocr = __esm({
  "src/pdf/ocr.ts"() {
    "use strict";
    init_brand();
    init_exec();
    DEFAULT_TIMEOUT_MS = 3e5;
    DEFAULT_MAX_DOCS = 3;
    DEFAULT_LANG = "eng";
    spent = 0;
  }
});
function npxTimeoutMs() {
  return envInt("NPX_TIMEOUT_MS", 9e4, 1e3, 6e5);
}
function npxEnv() {
  const env2 = { ...process.env };
  for (const [key, value] of Object.entries(FAIL_FAST)) {
    if (env2[key] === void 0 && env2[key.toUpperCase()] === void 0) env2[key] = value;
  }
  return env2;
}
function unavailability(r, spec) {
  if (r.error === "not installed" || r.error === "exit 127") return "not installed";
  const stderr = r.stderr ?? "";
  const code = NPM_ERROR_RE.exec(stderr)?.[1];
  if (code) {
    if (!NETWORK_CODES.has(code)) return `could not be installed (npm error ${code})`;
    registryDown = code;
    return `could not be installed (npm error ${code} \u2014 offline?)`;
  }
  if (/could not determine executable to run/.test(stderr)) return "could not be installed (npm found no executable)";
  if (!proven.has(spec) && r.error?.startsWith("timed out")) return `${r.error} on first use (raise ${envName("NPX_TIMEOUT_MS")} on a slow network)`;
  return void 0;
}
function npxBinName(spec) {
  return spec.replace(/^@[^/]+\//, "").replace(/@.*$/, "");
}
function findInstalled(spec) {
  let hit2 = installed.get(spec);
  if (!hit2) {
    hit2 = (async () => {
      if (process.platform === "win32") return {};
      const probe = ["-y", "--prefer-offline", "--package", spec, "-c", `command -v ${npxBinName(spec)}`];
      const r = await runWithInput("npx", probe, Buffer.alloc(0), npxTimeoutMs(), { env: npxEnv() });
      if (!r.ok) {
        const why = unavailability(r, spec);
        return why ? { unavailable: { ...r, unavailable: why } } : {};
      }
      const path = r.stdout.trim().split("\n").pop()?.trim();
      return path && isAbsolute(path) ? { path } : {};
    })();
    installed.set(spec, hit2);
  }
  return hit2;
}
async function runNpx(spec, args, input) {
  if (registryDown && !proven.has(spec) && !installed.has(spec)) {
    const why2 = `could not be installed (npm error ${registryDown} \u2014 offline?)`;
    return { ok: false, stdout: "", error: why2, unavailable: why2 };
  }
  const found = await findInstalled(spec);
  if (found.unavailable) return found.unavailable;
  if (found.path) {
    const run = await runWithInput(found.path, args, input, npxTimeoutMs());
    if (run.ok) proven.add(spec);
    if (run.error !== "not installed") return run;
    installed.delete(spec);
  }
  const r = await runWithInput("npx", ["-y", "--prefer-offline", spec, ...args], input, npxTimeoutMs(), { env: npxEnv() });
  if (r.ok) {
    proven.add(spec);
    return r;
  }
  const why = unavailability(r, spec);
  return why ? { ...r, unavailable: why } : r;
}
function skipNpxHint() {
  return `set ${envName("NO_NPX")}=1 to skip the rungs that install through npx`;
}
function failureDetail(tool, r) {
  const lines = [];
  let source2 = false;
  let props = false;
  for (const raw of (r.stderr ?? "").split(/\r?\n/)) {
    const l = raw.trim();
    if (source2) source2 = false;
    else if (props) props = l !== "}";
    else if (THROW_SITE_RE.test(l)) source2 = true;
    else if (l.startsWith("at ") && l.endsWith("{")) props = true;
    else if (l && !NOISE_RE.test(l)) lines.push(l);
  }
  const line = lines.find((l) => ERROR_LINE_RE.test(l)) ?? lines[0];
  const detail = (line ?? r.error ?? "failed").replace(PATH_RE, (p) => p.slice(Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\")) + 1)).slice(0, 200);
  return detail.startsWith(`${tool}:`) ? detail : `${tool}: ${detail}`;
}
var FAIL_FAST;
var NPM_ERROR_RE;
var NETWORK_CODES;
var proven;
var registryDown;
var installed;
var NOISE_RE;
var THROW_SITE_RE;
var ERROR_LINE_RE;
var PATH_RE;
var init_npx = __esm({
  "src/pdf/npx.ts"() {
    "use strict";
    init_brand();
    init_exec();
    FAIL_FAST = {
      npm_config_fetch_retries: "1",
      npm_config_fetch_retry_mintimeout: "1000",
      npm_config_fetch_retry_maxtimeout: "2000",
      npm_config_fetch_timeout: "30000"
    };
    NPM_ERROR_RE = /^npm (?:ERR!|error) code (\S+)/m;
    NETWORK_CODES = /* @__PURE__ */ new Set([
      "ECONNREFUSED",
      "ECONNRESET",
      "ENOTFOUND",
      "EAI_AGAIN",
      "ETIMEDOUT",
      "ESOCKETTIMEDOUT",
      "EHOSTUNREACH",
      "ENETUNREACH",
      "ENOTCACHED",
      "ERR_SOCKET_TIMEOUT"
    ]);
    proven = /* @__PURE__ */ new Set();
    installed = /* @__PURE__ */ new Map();
    NOISE_RE = /^(?:npm (?:warn|WARN|notice)\b|\(node:\d+\)|\(Use `node --|\^+$|at\s|Node\.js v\d)/;
    THROW_SITE_RE = /^(?:file:\/\/|\/|[A-Za-z]:\\)\S*:\d+$/;
    ERROR_LINE_RE = /^\w*error\b/i;
    PATH_RE = /(?<![\w:/.\\])(?:file:\/\/\/?(?:[A-Za-z]:)?|[A-Za-z]:(?=\\))?(?:[/\\][^\s/\\:'"()]+)+/g;
  }
});
function enginesFromEnv(name, known) {
  const raw = env(name)?.trim();
  if (!raw) return void 0;
  const asked = raw.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  if (asked.length === 1 && asked[0] === "none") return [];
  const picked = [...new Set(asked.filter((s) => known.includes(s)))];
  const unknown = asked.filter((s) => !known.includes(s));
  if (unknown.length && !warnedEngineValues.has(`${name}=${raw}`)) {
    warnedEngineValues.add(`${name}=${raw}`);
    const fallback = picked.length ? "" : " \u2014 using the full ladder";
    process.emitWarning(`${envName(name)}: ignoring unknown rung ${unknown.map((u) => `"${u}"`).join(", ")} (known: ${known.join(", ")}, or none)${fallback}`);
  }
  return picked.length ? picked : void 0;
}
function enabledExtractors(engines) {
  if (engines) return engines;
  const chosen = enginesFromEnv("PDF_ENGINE", PDF_EXTRACTORS);
  if (chosen) return chosen;
  if (envFlag("NO_NPX")) return PDF_EXTRACTORS.filter((e) => e !== "pdf-inspector" && e !== "anydoc");
  return PDF_EXTRACTORS;
}
async function viaNpx(id, spec, args, bytes) {
  const r = await runNpx(spec, args, bytes);
  if (r.ok) return { text: r.stdout };
  if (r.unavailable === "not installed") return { unavailable: true };
  if (r.unavailable) return { unavailable: true, failure: `${id} ${r.unavailable}`, hint: skipNpxHint() };
  return { failure: failureDetail(id, r) };
}
async function viaPdftotext(bytes) {
  const r = await runWithInput("pdftotext", ["-layout", "-", "-"], bytes, PDFTOTEXT_TIMEOUT_MS);
  if (r.ok) return { text: r.stdout.replace(/\f/g, "\n\n") };
  return r.error === "not installed" ? { unavailable: true } : { failure: failureDetail("pdftotext", r) };
}
async function viaOcr(bytes) {
  const r = await ocrAttempt(bytes);
  if ("text" in r) return { text: r.text };
  if ("declined" in r) return r.declined === "tools" ? { unavailable: true } : { budgetSpent: true };
  return { failure: "ocr: the conversion failed on this document" };
}
async function runRung(id, bytes, opts) {
  try {
    if (id === "pdf-inspector") return await viaNpx(id, PDF_INSPECTOR_SPEC, ["-"], bytes);
    if (id === "anydoc") return await viaNpx(id, ANYDOC_SPEC, ["-", "--format", "pdf"], bytes);
    if (id === "pdftotext") return await viaPdftotext(bytes);
    if (id === "ocr") return await viaOcr(bytes);
    if (id === "firecrawl") {
      const text = opts.firecrawl ? await opts.firecrawl() : void 0;
      return text === void 0 ? {} : { text };
    }
    return { text: pdfToText(bytes) };
  } catch {
    return {};
  }
}
async function extractPdf(bytes, opts = {}) {
  if (!bytes.subarray(0, 1024).includes("%PDF-")) {
    return { text: "", reason: "not a PDF (no %PDF- header \u2014 an error page or a login wall?)" };
  }
  let lastReason;
  const failures = [];
  const hints = /* @__PURE__ */ new Set();
  let ocrMissing = false;
  const noteFailure = (id, got) => {
    if (id === "ocr" && got.unavailable) ocrMissing = true;
    else if (got.failure) failures.push(got.failure);
    if (got.hint) hints.add(got.hint);
  };
  const budgetSpent = `scanned PDF, and this run's OCR budget is spent (raise ${envName("OCR_MAX")})`;
  for (const id of enabledExtractors(opts.engines)) {
    const known = dead.get(id);
    if (known) {
      noteFailure(id, known);
      continue;
    }
    if (id === "ocr" && ocrBudgetLeft() <= 0) {
      lastReason = budgetSpent;
      continue;
    }
    const got = await runRung(id, bytes, opts);
    if (got.text === void 0) {
      if (got.budgetSpent) {
        lastReason = budgetSpent;
        continue;
      }
      if (got.unavailable) dead.set(id, got);
      noteFailure(id, got);
      continue;
    }
    const verdict = assessPdfText(got.text);
    if (verdict.ok) return { text: got.text.trim(), via: id };
    lastReason = verdict.reason;
  }
  if (lastReason === NO_TEXT_LAYER) {
    if (bytes.includes("/Encrypt")) lastReason = "encrypted PDF (no rung here could decrypt its text)";
    else if (ocrMissing) lastReason = `${NO_TEXT_LAYER} \u2014 install copyable-pdf and tesseract to OCR it`;
  }
  const reason = [...new Set([lastReason, ...failures, ...hints].filter(Boolean))].join("; ");
  return { text: "", reason: reason || "no PDF extractor available" };
}
var PDF_EXTRACTORS;
var PDFTOTEXT_TIMEOUT_MS;
var dead;
var warnedEngineValues;
var init_ladder = __esm({
  "src/pdf/ladder.ts"() {
    "use strict";
    init_brand();
    init_exec();
    init_npx();
    init_quality();
    init_native();
    init_ocr();
    PDF_EXTRACTORS = ["pdf-inspector", "anydoc", "firecrawl", "pdftotext", "native", "ocr"];
    PDFTOTEXT_TIMEOUT_MS = 6e4;
    dead = /* @__PURE__ */ new Map();
    warnedEngineValues = /* @__PURE__ */ new Set();
  }
});
var init_pdf = __esm({
  "src/pdf.ts"() {
    "use strict";
    init_native();
    init_quality();
    init_ocr();
    init_ladder();
  }
});
function docFormatForUrl(url) {
  const m = /\.([a-z0-9]{2,5})(?:$|[?#])/i.exec(url);
  return m ? BY_EXTENSION[m[1].toLowerCase()] : void 0;
}
function docFormatForContentType(contentType) {
  const type = contentType.split(";")[0]?.trim().toLowerCase();
  return type ? BY_CONTENT_TYPE[type] : void 0;
}
function sniffDocument(bytes) {
  const head = bytes.subarray(0, 1024).toString("latin1");
  if (PDF_HEADER_RE.test(head)) return "pdf";
  if (bytes.subarray(0, 8).equals(OLE_SIGNATURE)) return BINARY;
  if (head.startsWith("{\\rtf")) return BINARY;
  if (head.startsWith("PK") && (head.startsWith("mimetype", 30) || bytes.includes("[Content_Types].xml"))) return BINARY;
  return void 0;
}
var BINARY;
var CSV;
var BY_EXTENSION;
var BY_CONTENT_TYPE;
var DOC_EXTENSIONS;
var PDF_HEADER_RE;
var OLE_SIGNATURE;
var init_formats = __esm({
  "src/doc/formats.ts"() {
    "use strict";
    BINARY = { textFallback: false };
    CSV = { format: "csv", textFallback: true };
    BY_EXTENSION = {
      // Word
      doc: BINARY,
      docx: BINARY,
      docm: BINARY,
      odt: BINARY,
      rtf: BINARY,
      // PowerPoint
      ppt: BINARY,
      pps: BINARY,
      pot: BINARY,
      pptx: BINARY,
      pptm: BINARY,
      ppsx: BINARY,
      ppsm: BINARY,
      odp: BINARY,
      // Excel
      xls: BINARY,
      xlsx: BINARY,
      xlsm: BINARY,
      xlsb: BINARY,
      ods: BINARY,
      // Everything else the converter reads
      epub: BINARY,
      csv: CSV
    };
    BY_CONTENT_TYPE = {
      "application/msword": BINARY,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": BINARY,
      "application/vnd.ms-word.document.macroenabled.12": BINARY,
      "application/vnd.oasis.opendocument.text": BINARY,
      "application/rtf": BINARY,
      "text/rtf": BINARY,
      "application/vnd.ms-powerpoint": BINARY,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": BINARY,
      "application/vnd.oasis.opendocument.presentation": BINARY,
      "application/vnd.ms-excel": BINARY,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": BINARY,
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": BINARY,
      "application/vnd.oasis.opendocument.spreadsheet": BINARY,
      "application/epub+zip": BINARY,
      "text/csv": CSV
    };
    DOC_EXTENSIONS = Object.keys(BY_EXTENSION);
    PDF_HEADER_RE = /(?:^|[\r\n])%PDF-\d/;
    OLE_SIGNATURE = Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]);
  }
});
function openZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 101010256) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0)
    throw new Refused(buf.subarray(0, 4).toString("latin1") === "PK" ? "truncated or corrupt ZIP archive" : "not an OOXML or OpenDocument file");
  if (eocd >= 20 && buf.readUInt32LE(eocd - 20) === 117853008) throw new Refused("ZIP64 archives are not supported");
  const count = buf.readUInt16LE(eocd + 10);
  const dirSize = buf.readUInt32LE(eocd + 12);
  const dirOffset = buf.readUInt32LE(eocd + 16);
  if (count === 65535 || dirSize === 4294967295 || dirOffset === 4294967295) throw new Refused("ZIP64 archives are not supported");
  if (count > MAX_ENTRIES) throw new Refused(`more than ${MAX_ENTRIES} ZIP entries`);
  if (dirOffset + dirSize > eocd) throw new Refused("truncated or corrupt ZIP archive");
  const entries = /* @__PURE__ */ new Map();
  let p = dirOffset;
  for (let n = 0; n < count; n++) {
    if (p + 46 > eocd || buf.readUInt32LE(p) !== 33639248) throw new Refused("truncated or corrupt ZIP archive");
    const nameLength = buf.readUInt16LE(p + 28);
    const next = p + 46 + nameLength + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    if (next > eocd) throw new Refused("truncated or corrupt ZIP archive");
    entries.set(buf.toString("utf8", p + 46, p + 46 + nameLength), {
      flags: buf.readUInt16LE(p + 8),
      method: buf.readUInt16LE(p + 10),
      compressedSize: buf.readUInt32LE(p + 20),
      size: buf.readUInt32LE(p + 24),
      localHeader: buf.readUInt32LE(p + 42)
    });
    p = next;
  }
  return new Zip(buf, entries);
}
function decodeXml(s) {
  if (!s.includes("&")) return s;
  return s.replace(/&(?:#x([0-9a-fA-F]{1,6})|#([0-9]{1,7})|([a-zA-Z]{2,4}));/g, (m, hex, dec, name) => {
    if (name) return ENTITIES[name] ?? m;
    const cp = hex ? parseInt(hex, 16) : Number(dec);
    return cp > 0 && cp <= 1114111 ? String.fromCodePoint(cp) : m;
  });
}
function walkXml(xml, v) {
  let i = 0;
  while (i < xml.length) {
    const lt = xml.indexOf("<", i);
    const textEnd = lt < 0 ? xml.length : lt;
    if (textEnd > i && v.text) v.text(decodeXml(xml.slice(i, textEnd)));
    if (lt < 0) return;
    if (xml.startsWith("<!--", lt)) {
      const end = xml.indexOf("-->", lt + 4);
      if (end < 0) return;
      i = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", lt)) {
      const end = xml.indexOf("]]>", lt + 9);
      if (end < 0) return;
      v.text?.(xml.slice(lt + 9, end));
      i = end + 3;
      continue;
    }
    const gt = xml.indexOf(">", lt + 1);
    if (gt < 0) return;
    i = gt + 1;
    const first = xml.charCodeAt(lt + 1);
    if (first === 63 || first === 33) continue;
    if (first === 47) {
      v.close?.(xml.slice(lt + 2, gt).trim());
      continue;
    }
    const selfClosing = xml.charCodeAt(gt - 1) === 47;
    const body = xml.slice(lt + 1, selfClosing ? gt - 1 : gt);
    const space = body.search(/\s/);
    const name = space < 0 ? body : body.slice(0, space);
    v.open?.(name, space < 0 ? "" : body.slice(space));
    if (selfClosing) v.close?.(name);
  }
}
function attr(attrs, name) {
  let re = attrPatterns.get(name);
  if (!re) {
    const key = name.startsWith("*:") ? `[\\w.-]+:${name.slice(2)}` : name.replace(/[.]/g, "\\.");
    re = new RegExp(`(?:^|\\s)${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`);
    attrPatterns.set(name, re);
  }
  const m = re.exec(attrs);
  return m ? decodeXml(m[1] ?? m[2] ?? "") : void 0;
}
function blankRow(row, width) {
  for (let c = 0; c < row.length && c < width; c++) if (row[c]?.trim()) return false;
  return true;
}
function keepRow(table, row) {
  const blank = blankRow(row, row.length);
  if (!blank || !table.blank) table.rows.push(row);
  table.blank = blank;
}
function markdownTable(rows, budget) {
  let last = rows.length;
  while (last > 0 && rows[last - 1].every((c) => !c.trim())) last--;
  let width = 0;
  for (let r = 0; r < last; r++) {
    const row = rows[r];
    for (let c = Math.min(row.length, MAX_COLUMNS) - 1; c >= width; c--) {
      if (row[c]?.trim()) {
        width = c + 1;
        break;
      }
    }
  }
  if (!last || !width) return "";
  const rules = 3 * width + 2;
  const rule = `|${" --- |".repeat(width)}`;
  if (!budget.takeRules(rules + rule.length + 1)) return "";
  const line = (row) => `| ${Array.from({ length: width }, (_, c) => cell(row[c] ?? "")).join(" | ")} |`;
  const out2 = [line(rows[0]), rule];
  let blank = false;
  for (let r = 1; r < last; r++) {
    const row = rows[r];
    const empty = blankRow(row, width);
    if (empty && blank) continue;
    blank = empty;
    if (!budget.takeRules(rules)) break;
    out2.push(line(row));
  }
  return out2.join("\n");
}
function joinBlocks(blocks) {
  const out2 = [];
  for (const [i, block] of blocks.entries()) {
    if (i) out2.push(block.startsWith("- ") && blocks[i - 1].startsWith("- ") ? "\n" : "\n\n");
    out2.push(block);
  }
  return out2.join("");
}
function relationships(zip, part) {
  const slash = part.lastIndexOf("/");
  const dir = part.slice(0, slash + 1);
  const rels = /* @__PURE__ */ new Map();
  const xml = zip.text(`${dir}_rels/${part.slice(slash + 1)}.rels`);
  if (!xml) return rels;
  walkXml(xml, {
    open(name, attrs) {
      if (local(name) !== "Relationship" || attr(attrs, "TargetMode") === "External") return;
      const id = attr(attrs, "Id");
      const target = attr(attrs, "Target");
      if (id && target) rels.set(id, { target: resolvePart(dir, target), type: attr(attrs, "Type") ?? "" });
    }
  });
  return rels;
}
function relatedPart(rels, type) {
  for (const r of rels.values()) if (r.type.endsWith(`/${type}`)) return r.target;
  return void 0;
}
function resolvePart(dir, target) {
  const segments = [];
  for (const s of (target.startsWith("/") ? target.slice(1) : dir + target).split("/")) {
    if (s === "..") segments.pop();
    else if (s && s !== ".") segments.push(s);
  }
  return segments.join("/");
}
function stylePrefix(name, outline) {
  const level = HEADING_STYLE_RE.exec(name)?.[1] ?? (outline !== void 0 && outline >= 0 && outline < 6 ? String(outline + 1) : void 0);
  if (level) return `${"#".repeat(Number(level))} `;
  if (TITLE_STYLE_RE.test(name)) return "# ";
  if (LIST_STYLE_RE.test(name)) return "- ";
  return void 0;
}
function wordStyles(xml) {
  if (!xml) return void 0;
  const styles = /* @__PURE__ */ new Map();
  let current2;
  walkXml(xml, {
    open(name, attrs) {
      const n = local(name);
      if (n === "style") {
        const id = attr(attrs, "w:styleId");
        current2 = id && attr(attrs, "w:type") === "paragraph" ? { name: "" } : void 0;
        if (current2) styles.set(id, current2);
      } else if (!current2) return;
      else if (n === "name") current2.name = attr(attrs, "w:val") ?? "";
      else if (n === "basedOn") current2.basedOn = attr(attrs, "w:val");
      else if (n === "outlineLvl") current2.outline = Number(attr(attrs, "w:val"));
    },
    close(name) {
      if (local(name) === "style") current2 = void 0;
    }
  });
  const prefixes = /* @__PURE__ */ new Map();
  for (const [id, own] of styles) {
    let style = own;
    for (let depth = 0; style && depth < 16; depth++) {
      const prefix = stylePrefix(style.name, style.outline);
      if (prefix !== void 0) {
        prefixes.set(id, prefix);
        break;
      }
      style = style.basedOn ? styles.get(style.basedOn) : void 0;
    }
    if (!prefixes.has(id)) prefixes.set(id, "");
  }
  return prefixes;
}
function wordText(xml, budget, styles) {
  const blocks = [];
  const paragraphs = [];
  const tables = [];
  let inText = 0;
  let fallback = 0;
  let tabStops = 0;
  let moved = 0;
  const add2 = (p, s) => {
    if (p && !moved && budget.take(s.length)) p.text += s;
  };
  const emit = (block) => {
    const table = tables[tables.length - 1];
    if (table?.cell) table.cell.push(block);
    else if (block.trim()) blocks.push(block);
  };
  walkXml(xml, {
    open(name, attrs) {
      const n = local(name);
      if (n === "Fallback") fallback++;
      else if (n === "tabs") tabStops++;
      if (fallback) return;
      const p = paragraphs[paragraphs.length - 1];
      const table = tables[tables.length - 1];
      if (n === "moveFrom") moved++;
      else if (n === "p") paragraphs.push({ text: "", prefix: "" });
      else if (n === "t") inText++;
      else if (n === "tab" && !tabStops) add2(p, "	");
      else if (n === "br" || n === "cr") add2(p, "\n");
      else if (n === "noBreakHyphen") add2(p, "-");
      else if (n === "pStyle" && p) {
        const id = attr(attrs, "w:val") ?? "";
        const prefix = styles?.has(id) ? styles.get(id) : stylePrefix(id);
        if (prefix) p.prefix = prefix;
      } else if (n === "numPr" && p && !p.prefix) p.prefix = "- ";
      else if (n === "tbl") tables.push({ rows: [] });
      else if (n === "tr" && table) table.row = [];
      else if (n === "tc" && table) table.cell = [];
    },
    close(name) {
      const n = local(name);
      if (n === "Fallback") {
        fallback = Math.max(0, fallback - 1);
        return;
      }
      if (n === "tabs") tabStops = Math.max(0, tabStops - 1);
      if (fallback) return;
      const table = tables[tables.length - 1];
      if (n === "moveFrom") moved = Math.max(0, moved - 1);
      else if (n === "t") inText = Math.max(0, inText - 1);
      else if (n === "p") {
        const p = paragraphs.pop();
        if (p?.text.trim()) emit(table?.cell ? p.text.trim() : p.prefix ? p.prefix + p.text.trim() : p.text.trimEnd());
      } else if (n === "tc" && table?.row && table.cell) {
        table.row.push(table.cell.join(" "));
        table.cell = void 0;
      } else if (n === "tr" && table?.row) {
        keepRow(table, table.row);
        table.row = void 0;
      } else if (n === "tbl") {
        const done = tables.pop();
        if (done) emit(tables.length ? done.rows.map((r) => r.join(" ")).join(" ") : markdownTable(done.rows, budget));
      }
    },
    text(s) {
      if (!fallback && inText) add2(paragraphs[paragraphs.length - 1], s);
    }
  });
  return joinBlocks(blocks);
}
function sharedStrings(xml) {
  const strings2 = [];
  if (!xml) return strings2;
  let current2;
  let inText = 0;
  let phonetic = 0;
  walkXml(xml, {
    open(name) {
      const n = local(name);
      if (n === "si") current2 = "";
      else if (n === "t") inText++;
      else if (n === "rPh") phonetic++;
    },
    close(name) {
      const n = local(name);
      if (n === "si" && current2 !== void 0) {
        strings2.push(current2);
        current2 = void 0;
      } else if (n === "t") inText = Math.max(0, inText - 1);
      else if (n === "rPh") phonetic = Math.max(0, phonetic - 1);
    },
    text(s) {
      if (current2 !== void 0 && inText && !phonetic) current2 += s;
    }
  });
  return strings2;
}
function columnOf(ref) {
  const letters = ref && /^[A-Za-z]{1,3}/.exec(ref)?.[0];
  if (!letters) return void 0;
  let col = 0;
  for (const ch of letters.toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return col - 1;
}
function temporalOf(code) {
  if (code.length > 255 || /\[[hms]+\]/i.test(code)) return void 0;
  const bare = code.replace(/"[^"]*"|[\\_*].|\[[^[\]]*\]|General|E[+-]/gi, "");
  const time = /[hs]/i.test(bare);
  const date = /[yd]/i.test(bare) || !time && /m/i.test(bare);
  return date && time ? "datetime" : date ? "date" : time ? "time" : void 0;
}
function cellTemporals(xml) {
  const kinds = [];
  if (!xml) return kinds;
  const custom = /* @__PURE__ */ new Map();
  let cellXfs = false;
  walkXml(xml, {
    open(name, attrs) {
      const n = local(name);
      if (n === "numFmt") custom.set(Number(attr(attrs, "numFmtId")), temporalOf(attr(attrs, "formatCode") ?? ""));
      else if (n === "cellXfs") cellXfs = true;
      else if (n === "xf" && cellXfs) {
        const id = Number(attr(attrs, "numFmtId") ?? 0);
        kinds.push(custom.has(id) ? custom.get(id) : BUILTIN_TEMPORAL[id]);
      }
    },
    close(name) {
      if (local(name) === "cellXfs") cellXfs = false;
    }
  });
  return kinds;
}
function serialDate(serial, kind, date1904) {
  const days = date1904 ? serial + 1462 : serial < 60 ? serial + 1 : serial;
  if (!(serial >= 0 && days <= 2958466)) return void 0;
  const iso = new Date(Math.round((EXCEL_EPOCH + days * DAY_MS) / 1e3) * 1e3).toISOString();
  const time = iso.slice(11, iso.endsWith(":00.000Z") ? 16 : 19);
  return kind === "date" ? iso.slice(0, 10) : kind === "time" ? time : `${iso.slice(0, 10)} ${time}`;
}
function sheetRows(xml, shared, styles, budget) {
  const table = { rows: [] };
  let row;
  let col = 0;
  let nextCol = 0;
  let type;
  let style = 0;
  let value;
  let collecting = 0;
  walkXml(xml, {
    open(name, attrs) {
      const n = local(name);
      if (n === "row") {
        row = [];
        nextCol = 0;
      } else if (n === "c" && row) {
        col = columnOf(attr(attrs, "r")) ?? nextCol;
        nextCol = col + 1;
        type = attr(attrs, "t");
        style = Number(attr(attrs, "s") ?? 0);
        value = "";
      } else if ((n === "v" || n === "t") && value !== void 0) collecting++;
    },
    close(name) {
      const n = local(name);
      if ((n === "v" || n === "t") && collecting) collecting--;
      else if (n === "c" && row && value !== void 0) {
        let shown = value;
        const kind = styles.temporal[style];
        if (type === "s") shown = value.trim() ? shared[Number(value)] ?? "" : "";
        else if (type === "b") shown = value === "1" ? "TRUE" : "FALSE";
        else if (kind && (type === void 0 || type === "n") && value.trim()) shown = serialDate(Number(value), kind, styles.date1904) ?? value;
        if (col < MAX_COLUMNS && shown && budget.take(shown.length)) {
          while (row.length < col) row.push("");
          row[col] = shown;
        }
        value = void 0;
      } else if (n === "row" && row) {
        keepRow(table, row);
        row = void 0;
      }
    },
    text(s) {
      if (collecting && value !== void 0 && value.length < MAX_OUTPUT_CHARS) value += s;
    }
  });
  return table.rows;
}
function spreadsheetText(zip, workbookPart, budget) {
  const rels = relationships(zip, workbookPart);
  const stringsPart = relatedPart(rels, "sharedStrings");
  const shared = sharedStrings(stringsPart ? zip.text(stringsPart) : void 0);
  const stylesPart = relatedPart(rels, "styles");
  const styles = { temporal: cellTemporals(stylesPart ? zip.text(stylesPart) : void 0), date1904: false };
  const sheets = [];
  walkXml(zip.text(workbookPart) ?? "", {
    open(name, attrs) {
      const n = local(name);
      const id = attr(attrs, "*:id");
      if (n === "sheet" && id) sheets.push({ name: attr(attrs, "name") ?? `Sheet ${sheets.length + 1}`, id });
      else if (n === "workbookPr") styles.date1904 = /^(?:1|true)$/i.test(attr(attrs, "date1904") ?? "");
    }
  });
  const blocks = [];
  for (const sheet of sheets) {
    if (budget.spent) break;
    const part = rels.get(sheet.id)?.target;
    const xml = part ? zip.text(part) : void 0;
    const table = xml ? markdownTable(sheetRows(xml, shared, styles, budget), budget) : "";
    if (table) blocks.push(`## ${sheet.name}

${table}`);
  }
  return blocks.join("\n\n");
}
function drawingText(xml, budget, onlyBody = false) {
  const lines = [];
  const titles = [];
  const shapes = [];
  const tables = [];
  let para;
  let inText = 0;
  let fallback = 0;
  const add2 = (s) => {
    if (para !== void 0 && budget.take(s.length)) para += s;
  };
  const emit = (line) => {
    const table = tables[tables.length - 1];
    if (table?.cell) table.cell.push(line);
    else if (shapes.length) shapes[shapes.length - 1].lines.push(line);
    else if (!onlyBody) lines.push(line);
  };
  walkXml(xml, {
    open(name, attrs) {
      const n = local(name);
      if (n === "Fallback") fallback++;
      if (fallback) return;
      const table = tables[tables.length - 1];
      if (n === "sp") shapes.push({ kind: "other", lines: [] });
      else if (n === "ph" && shapes.length) {
        const type = attr(attrs, "type");
        shapes[shapes.length - 1].kind = type === "title" || type === "ctrTitle" ? "title" : type === "body" ? "body" : "other";
      } else if (n === "p" && name.startsWith("a:")) para = "";
      else if (n === "t") inText++;
      else if (n === "br") add2("\n");
      else if (name === "a:tbl") tables.push({ rows: [] });
      else if (name === "a:tr" && table) table.row = [];
      else if (name === "a:tc" && table?.row) table.cell = [];
    },
    close(name) {
      const n = local(name);
      if (n === "Fallback") {
        fallback = Math.max(0, fallback - 1);
        return;
      }
      if (fallback) return;
      const table = tables[tables.length - 1];
      if (n === "t") inText = Math.max(0, inText - 1);
      else if (n === "p" && name.startsWith("a:") && para !== void 0) {
        const line = para.trim();
        para = void 0;
        if (line) emit(line);
      } else if (name === "a:tc" && table?.row && table.cell) {
        table.row.push(table.cell.join(" "));
        table.cell = void 0;
      } else if (name === "a:tr" && table?.row) {
        keepRow(table, table.row);
        table.row = void 0;
      } else if (name === "a:tbl") {
        const done = tables.pop();
        if (done) emit(tables.length ? done.rows.map((r) => r.join(" ")).join(" ") : `
${markdownTable(done.rows, budget)}
`);
      } else if (n === "sp") {
        const shape = shapes.pop();
        if (!shape) return;
        if (shape.kind === "title" && !onlyBody) titles.push(shape.lines.join(" "));
        else if (!onlyBody || shape.kind === "body") lines.push(...shape.lines);
      }
    },
    text(s) {
      if (!fallback && inText) add2(s);
    }
  });
  return { title: titles.join(" ").trim(), text: lines.join("\n").trim() };
}
function presentationText(zip, presentationPart, budget) {
  const rels = relationships(zip, presentationPart);
  const order = [];
  walkXml(zip.text(presentationPart) ?? "", {
    open(name, attrs) {
      const target = local(name) === "sldId" ? rels.get(attr(attrs, "*:id") ?? "")?.target : void 0;
      if (target) order.push(target);
    }
  });
  const blocks = [];
  for (const [i, part] of order.entries()) {
    if (budget.spent) break;
    const slide = drawingText(zip.text(part) ?? "", budget);
    const notesPart = relatedPart(relationships(zip, part), "notesSlide");
    const notes = notesPart ? drawingText(zip.text(notesPart) ?? "", budget, true).text : "";
    const heading = `## Slide ${i + 1}${slide.title ? `: ${slide.title}` : ""}`;
    if (slide.title || slide.text || notes) blocks.push(`${heading}${slide.text ? `

${slide.text}` : ""}${notes ? `

Notes: ${notes}` : ""}`);
  }
  return blocks.join("\n\n");
}
function openDocumentText(xml, budget) {
  const blocks = [];
  const paragraphs = [];
  const tables = [];
  let skip = 0;
  let listItem = false;
  let spreadsheet = false;
  let slide = 0;
  let heading = -1;
  let titleFrame = 0;
  let inNotes = 0;
  const title = [];
  const notes = [];
  const add2 = (p, s) => {
    if (p && budget.take(s.length)) p.text += s;
  };
  const emit = (block) => {
    const table = tables[tables.length - 1];
    if (table?.cell) table.cell.push(block);
    else if (titleFrame) title.push(block);
    else if (inNotes) notes.push(block);
    else if (block.trim()) blocks.push(block);
  };
  const repeat = (attrs, name) => Math.min(MAX_REPEAT, Math.max(1, Number(attr(attrs, name)) || 1));
  walkXml(xml, {
    open(name, attrs) {
      if (ODF_ASIDES.has(name)) skip++;
      if (skip) return;
      const p = paragraphs[paragraphs.length - 1];
      const table = tables[tables.length - 1];
      if (name === "text:p" || name === "text:h") {
        const level = name === "text:h" ? Math.min(6, Math.max(1, Number(attr(attrs, "text:outline-level")) || 1)) : 0;
        paragraphs.push({ text: "", prefix: level ? `${"#".repeat(level)} ` : listItem && !table ? "- " : "" });
        listItem = false;
      } else if (name === "text:list-item") listItem = true;
      else if (name === "text:s") add2(p, " ".repeat(Math.min(100, Math.max(1, Number(attr(attrs, "text:c")) || 1))));
      else if (name === "text:tab") add2(p, "	");
      else if (name === "text:line-break") add2(p, "\n");
      else if (name === "office:spreadsheet") spreadsheet = true;
      else if (name === "draw:page") {
        heading = blocks.push(`## Slide ${++slide}`) - 1;
        title.length = 0;
        notes.length = 0;
      } else if (name === "presentation:notes") inNotes++;
      else if (name === "draw:frame" && (titleFrame || attr(attrs, "presentation:class") === "title")) titleFrame++;
      else if (name === "table:table") {
        const sheet = attr(attrs, "table:name");
        const heading2 = sheet && spreadsheet && !tables.length ? blocks.push(`## ${sheet}`) - 1 : void 0;
        tables.push({ rows: [], repeatRow: 1, repeatCell: 1, ...heading2 !== void 0 ? { heading: heading2 } : {} });
      } else if (name === "table:table-row" && table) {
        table.row = [];
        table.repeatRow = repeat(attrs, "table:number-rows-repeated");
      } else if ((name === "table:table-cell" || name === "table:covered-table-cell") && table?.row) {
        table.cell = [];
        table.repeatCell = repeat(attrs, "table:number-columns-repeated");
      }
    },
    close(name) {
      if (ODF_ASIDES.has(name)) {
        skip = Math.max(0, skip - 1);
        return;
      }
      if (skip) return;
      const table = tables[tables.length - 1];
      if (name === "text:p" || name === "text:h") {
        const p = paragraphs.pop();
        if (p?.text.trim()) emit(table?.cell ? p.text.trim() : p.prefix + p.text.trim());
      } else if ((name === "table:table-cell" || name === "table:covered-table-cell") && table?.row && table.cell) {
        const text = table.cell.join(" ");
        for (let k = 0; k < table.repeatCell && table.row.length < MAX_COLUMNS; k++) {
          if (k && text && !budget.take(text.length)) break;
          table.row.push(text);
        }
        table.cell = void 0;
      } else if (name === "table:table-row" && table?.row) {
        const size = table.row.reduce((n, c) => n + c.length, 0);
        const times = size ? table.repeatRow : 1;
        for (let k = 0; k < times; k++) {
          if (k && !budget.take(size)) break;
          keepRow(table, table.row);
        }
        table.row = void 0;
      } else if (name === "table:table") {
        const done = tables.pop();
        if (done) emit(tables.length ? done.rows.map((r) => r.join(" ")).join(" ") : markdownTable(done.rows, budget));
        if (done?.heading !== void 0 && blocks.length === done.heading + 1) blocks.length = done.heading;
      } else if (name === "draw:frame" && titleFrame) titleFrame--;
      else if (name === "presentation:notes") inNotes = Math.max(0, inNotes - 1);
      else if (name === "draw:page" && heading >= 0) {
        if (title.length) blocks[heading] = `## Slide ${slide}: ${title.join(" ")}`;
        if (notes.length) blocks.push(`Notes: ${notes.join(" ")}`);
        if (!title.length && !notes.length && blocks.length === heading + 1) blocks.length = heading;
        heading = -1;
      }
    },
    text(s) {
      if (!skip) add2(paragraphs[paragraphs.length - 1], s.replace(/[ \t\r\n]+/g, " "));
    }
  });
  return joinBlocks(blocks);
}
function mainPart(zip) {
  const officeDocument = relatedPart(relationships(zip, ""), "officeDocument");
  if (officeDocument && zip.has(officeDocument)) return officeDocument;
  return ["word/document.xml", "xl/workbook.xml", "ppt/presentation.xml"].find((p) => zip.has(p));
}
function packageText(bytes, budget) {
  if (bytes.subarray(0, 8).equals(OLE_SIGNATURE2))
    throw new Refused("a legacy binary or password-protected Office file (only OOXML and OpenDocument are read here)");
  const zip = openZip(bytes);
  const mimetype = zip.has("mimetype") ? zip.text("mimetype")?.trim() : void 0;
  if (mimetype?.startsWith("application/vnd.oasis.opendocument.")) {
    const content = zip.text("content.xml");
    if (content === void 0) throw new Refused("an OpenDocument package with no content.xml");
    return openDocumentText(content, budget);
  }
  const main2 = mainPart(zip);
  const xml = main2 ? zip.text(main2) : void 0;
  if (!main2 || xml === void 0) throw new Refused("not an OOXML or OpenDocument file");
  if (main2.startsWith("word/")) {
    const stylesPart = relatedPart(relationships(zip, main2), "styles");
    return wordText(xml, budget, wordStyles(stylesPart ? zip.text(stylesPart) : void 0));
  }
  if (main2.startsWith("xl/")) return spreadsheetText(zip, main2, budget);
  if (main2.startsWith("ppt/")) return presentationText(zip, main2, budget);
  throw new Refused("not an OOXML or OpenDocument file");
}
function readOffice(bytes) {
  try {
    const text = packageText(bytes, new Budget()).replace(/\n{3,}/g, "\n\n").trim();
    if (text.length <= MAX_OUTPUT_CHARS) return { text };
    const lineEnd = text.lastIndexOf("\n", MAX_OUTPUT_CHARS);
    return { text: text.slice(0, lineEnd < 0 ? MAX_OUTPUT_CHARS : lineEnd) };
  } catch (e) {
    return { failure: e instanceof Refused ? e.message : "the built-in reader could not parse it" };
  }
}
var MAX_ENTRIES;
var MAX_ENTRY_BYTES;
var MAX_TOTAL_BYTES2;
var MAX_OUTPUT_CHARS;
var MAX_COLUMNS;
var MAX_REPEAT;
var Refused;
var Zip;
var Budget;
var ENTITIES;
var local;
var attrPatterns;
var cell;
var HEADING_STYLE_RE;
var TITLE_STYLE_RE;
var LIST_STYLE_RE;
var BUILTIN_TEMPORAL;
var DAY_MS;
var EXCEL_EPOCH;
var ODF_ASIDES;
var OLE_SIGNATURE2;
var init_office = __esm({
  "src/doc/office.ts"() {
    "use strict";
    MAX_ENTRIES = 1e4;
    MAX_ENTRY_BYTES = 64 * 1024 * 1024;
    MAX_TOTAL_BYTES2 = 256 * 1024 * 1024;
    MAX_OUTPUT_CHARS = 24 * 1024 * 1024;
    MAX_COLUMNS = 256;
    MAX_REPEAT = 1e3;
    Refused = class extends Error {
    };
    Zip = class {
      constructor(buf, entries) {
        this.buf = buf;
        this.entries = entries;
      }
      buf;
      entries;
      inflated = 0;
      has(name) {
        return this.entries.has(name);
      }
      /** An entry's bytes, or undefined when there is no such entry. Throws Refused on anything it will not read. */
      read(name) {
        const e = this.entries.get(name);
        if (!e) return void 0;
        if (e.flags & 1) throw new Refused("encrypted ZIP entries");
        if (e.compressedSize === 4294967295 || e.size === 4294967295 || e.localHeader === 4294967295) throw new Refused("ZIP64 archives are not supported");
        const buf = this.buf;
        const lh = e.localHeader;
        if (lh + 30 > buf.length || buf.readUInt32LE(lh) !== 67324752) throw new Refused("truncated or corrupt ZIP archive");
        const start = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28);
        const end = start + e.compressedSize;
        if (end > buf.length) throw new Refused("truncated or corrupt ZIP archive");
        const cap = Math.min(MAX_ENTRY_BYTES, MAX_TOTAL_BYTES2 - this.inflated);
        const tooLarge = () => new Refused(
          cap < MAX_ENTRY_BYTES ? `the archive inflates past ${MAX_TOTAL_BYTES2 >> 20} MB` : `an entry inflates past ${MAX_ENTRY_BYTES >> 20} MB (a decompression bomb?)`
        );
        if (cap <= 0) throw tooLarge();
        let out2;
        if (e.method === 0) {
          if (e.compressedSize > cap) throw tooLarge();
          out2 = buf.subarray(start, end);
        } else if (e.method === 8) {
          try {
            out2 = inflateRawSync2(buf.subarray(start, end), { maxOutputLength: cap });
          } catch (err) {
            throw err.code === "ERR_BUFFER_TOO_LARGE" ? tooLarge() : new Refused("truncated or corrupt ZIP archive");
          }
        } else {
          throw new Refused(`unsupported ZIP compression method ${e.method}`);
        }
        this.inflated += out2.length;
        return out2;
      }
      /** An XML part as text: UTF-8, or UTF-16LE when it says so with a BOM. */
      text(name) {
        const b = this.read(name);
        if (!b) return void 0;
        if (b[0] === 255 && b[1] === 254) return b.subarray(2).toString("utf16le");
        const s = b.toString("utf8");
        return s.charCodeAt(0) === 65279 ? s.slice(1) : s;
      }
    };
    Budget = class {
      left = MAX_OUTPUT_CHARS;
      rulesLeft = MAX_OUTPUT_CHARS;
      /** Spend `n` characters: false, and nothing spent, once they no longer fit — the caller drops them. */
      take(n) {
        if (n > this.left) {
          this.left = 0;
          return false;
        }
        this.left -= n;
        return true;
      }
      /** The same, for `n` characters of table rules. */
      takeRules(n) {
        if (n > this.rulesLeft) {
          this.rulesLeft = 0;
          return false;
        }
        this.rulesLeft -= n;
        return true;
      }
      get spent() {
        return this.left <= 0 || this.rulesLeft <= 0;
      }
    };
    ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
    local = (name) => name.slice(name.indexOf(":") + 1);
    attrPatterns = /* @__PURE__ */ new Map();
    cell = (s) => s.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
    HEADING_STYLE_RE = /^(?:heading|titre|berschrift|überschrift|kop|titolo|encabezado|ttulo|título)\s?([1-6])$/i;
    TITLE_STYLE_RE = /^(?:title|titel|titre|titolo|ttulo|título)$/i;
    LIST_STYLE_RE = /^list ?(?:bullet|number)/i;
    BUILTIN_TEMPORAL = {
      14: "date",
      15: "date",
      16: "date",
      17: "date",
      18: "time",
      19: "time",
      20: "time",
      21: "time",
      22: "datetime",
      45: "time",
      47: "time"
    };
    DAY_MS = 864e5;
    EXCEL_EPOCH = Date.UTC(1899, 11, 30);
    ODF_ASIDES = /* @__PURE__ */ new Set(["text:note", "office:annotation", "text:tracked-changes"]);
    OLE_SIGNATURE2 = Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]);
  }
});
function enabledDocExtractors(engines) {
  if (engines) return engines;
  const chosen = enginesFromEnv("DOC_ENGINE", DOC_EXTRACTORS);
  if (chosen) return chosen;
  if (envFlag("NO_NPX")) return DOC_EXTRACTORS.filter((e) => e !== "anydoc");
  return DOC_EXTRACTORS;
}
async function viaAnydoc(bytes, format) {
  const args = ["-"];
  if (format) args.push("--format", format);
  const r = await runNpx(ANYDOC_SPEC, args, bytes);
  if (r.ok) return { text: r.stdout };
  if (r.unavailable === "not installed") return { unavailable: true };
  if (r.unavailable) return { unavailable: true, failure: `anydoc ${r.unavailable}; ${skipNpxHint()}` };
  return { failure: failureDetail("anydoc", r) };
}
function viaBuiltin(bytes, fmt) {
  if (fmt.format === "csv") return {};
  const r = readOffice(bytes);
  return r.text === void 0 ? { failure: `builtin: ${r.failure}` } : { text: r.text };
}
async function extractDocument(bytes, fmt, opts = {}) {
  let lastReason;
  const failures = [];
  for (const id of enabledDocExtractors(opts.engines)) {
    const known = dead2.get(id);
    if (known) {
      if (known.failure) failures.push(known.failure);
      continue;
    }
    let got;
    try {
      if (id === "anydoc") got = await viaAnydoc(bytes, fmt.format);
      else if (id === "builtin") got = viaBuiltin(bytes, fmt);
      else got = { text: opts.firecrawl ? await opts.firecrawl() : void 0 };
    } catch {
      got = {};
    }
    if (got.text === void 0) {
      if (got.unavailable) dead2.set(id, { failure: got.failure });
      if (got.failure) failures.push(got.failure);
      continue;
    }
    const verdict = assessExtractedText(got.text, "the converter produced no text", "the converter returned the file's bytes, not its text");
    if (verdict.ok) return { text: got.text.trim(), via: id };
    lastReason = verdict.reason;
  }
  const reason = [lastReason, ...failures].filter(Boolean).join("; ");
  return { text: "", reason: reason || "no document converter available" };
}
var DOC_EXTRACTORS;
var dead2;
var init_ladder2 = __esm({
  "src/doc/ladder.ts"() {
    "use strict";
    init_brand();
    init_exec();
    init_ladder();
    init_npx();
    init_quality();
    init_office();
    DOC_EXTRACTORS = ["anydoc", "firecrawl", "builtin"];
    dead2 = /* @__PURE__ */ new Map();
  }
});
var init_doc = __esm({
  "src/doc.ts"() {
    "use strict";
    init_formats();
    init_ladder2();
    init_office();
  }
});
function trimTrailing(s, ch) {
  let end = s.length;
  while (end > 0 && s[end - 1] === ch) end--;
  return s.slice(0, end);
}
var init_trim = __esm({
  "src/trim.ts"() {
    "use strict";
  }
});
function canonicalizeUrl(raw) {
  try {
    const u = new URL(raw.trim());
    const proto = u.protocol.toLowerCase();
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    let port = u.port;
    if (proto === "http:" && port === "80" || proto === "https:" && port === "443") port = "";
    const path = trimTrailing(u.pathname, "/");
    const keep = [];
    const shareSi = SHARE_SI_HOSTS.test(host);
    for (const [k, v] of u.searchParams) {
      if (!TRACKING_PARAMS.test(k) && !(shareSi && k === "si")) keep.push([k, v]);
    }
    keep.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    const search2 = keep.length ? "?" + keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&") : "";
    return `${proto}//${host}${port ? ":" + port : ""}${path}${search2}`.replace(/\/$/, "");
  } catch {
    return raw.trim().replace(/#.*$/, "").replace(/\/$/, "");
  }
}
function fnvMix(s) {
  let hi = laneHi;
  let lo = laneLo;
  for (let i = 0; i < s.length; i++) {
    lo = (lo ^ s.charCodeAt(i)) >>> 0;
    const bP = (lo & 65535) * FNV_PRIME_LOW;
    const aP = (lo >>> 16) * FNV_PRIME_LOW + (bP >>> 16);
    const carry = aP >>> 16;
    hi = carry + Math.imul(hi, FNV_PRIME_LOW) + (lo << 8) >>> 0;
    lo = ((aP & 65535) << 16 | bP & 65535) >>> 0;
  }
  laneHi = hi;
  laneLo = lo;
}
function fnv1a64(s) {
  laneHi = FNV_OFFSET_HI;
  laneLo = FNV_OFFSET_LO;
  fnvMix(s);
  return BigInt(laneHi) << 32n | BigInt(laneLo);
}
var TRACKING_PARAMS;
var SHARE_SI_HOSTS;
var LOCAL_FILE_DOMAIN;
var FNV_OFFSET_HI;
var FNV_OFFSET_LO;
var FNV_PRIME_LOW;
var laneHi;
var laneLo;
var init_url = __esm({
  "src/url.ts"() {
    "use strict";
    init_trim();
    TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|gclsrc$|dclid$|msclkid$|yclid$|twclid$|ttclid$|li_fat_id$|mkt_tok$|_gl$|mc_|ref_src$|ref_url$|spm$|_hsenc$|_hsmi$|igshid$|igsh$)/i;
    SHARE_SI_HOSTS = /(^|\.)(youtube\.com|youtu\.be|spotify\.com)$/;
    LOCAL_FILE_DOMAIN = "local file";
    FNV_OFFSET_HI = 3421674724;
    FNV_OFFSET_LO = 2216829733;
    FNV_PRIME_LOW = 435;
    laneHi = 0;
    laneLo = 0;
  }
});
function parse(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u : void 0;
  } catch {
    return void 0;
  }
}
function isYoutubeHost(host) {
  const h = host.toLowerCase();
  return YOUTUBE_HOSTS.some((d) => onHost(h, d));
}
function youtubeVideoId(url) {
  const u = parse(url);
  if (!u) return void 0;
  const host = u.hostname.toLowerCase();
  let id;
  if (host === "youtu.be" || host === "www.youtu.be") id = u.pathname.split("/")[1];
  else if (isYoutubeHost(host)) {
    if (u.pathname === "/watch") id = u.searchParams.get("v") ?? void 0;
    else id = /^\/(?:shorts|embed|live|v)\/([^/]+)/.exec(u.pathname)?.[1];
  }
  return id && VIDEO_ID.test(id) ? id : void 0;
}
function knownVideo(url) {
  const id = youtubeVideoId(url);
  if (id) return { site: "youtube", url: `https://www.youtube.com/watch?v=${id}`, key: id };
  const u = parse(url);
  if (!u) return void 0;
  const host = u.hostname.toLowerCase();
  for (const rule of HOSTS) {
    if (!rule.domains.some((d) => onHost(host, d))) continue;
    const m = rule.video.exec(u.pathname);
    if (!m) continue;
    if (!rule.canonical) return { site: rule.site, url: u.toString() };
    const c = rule.canonical(m, u);
    return { site: rule.site, url: c.url, key: safeKey(rule.site, c.id) };
  }
  return void 0;
}
function videoSource(url, opts = {}) {
  const known = knownVideo(url);
  if (known) return known;
  if (!opts.anySite) return void 0;
  const u = parse(url);
  return u ? { site: "web", url: u.toString() } : void 0;
}
function videoRunKey(site, id, pageUrl) {
  if (site === "youtube" && VIDEO_ID.test(id)) return id;
  const key = safeKey(site, id);
  const altered = key !== `${site}-${id}`;
  return site === "web" || altered ? `${key.slice(0, 110)}-${shortHash(pageUrl ?? id)}` : key;
}
var VIDEO_ID;
var YOUTUBE_HOSTS;
var onHost;
var HOSTS;
var safeKey;
var shortHash;
var init_url2 = __esm({
  "src/video/url.ts"() {
    "use strict";
    init_url();
    VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
    YOUTUBE_HOSTS = ["youtube.com", "youtube-nocookie.com"];
    onHost = (host, domain) => host === domain || host.endsWith(`.${domain}`);
    HOSTS = [
      {
        site: "vimeo",
        domains: ["vimeo.com"],
        // vimeo.com/<id>, vimeo.com/<id>/<hash> (unlisted), vimeo.com/channels/<c>/<id>,
        // vimeo.com/groups/<g>/videos/<id>, player.vimeo.com/video/<id>.
        video: /^\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{5,})(?:\/([0-9a-f]{6,}))?\/?$/,
        // The player URL, because vimeo.com's own page now answers yt-dlp with a
        // login wall while the player serves a public video — and its subtitles.
        canonical: (m, u) => {
          const hash = m[2] ?? u.searchParams.get("h") ?? void 0;
          return { id: m[1], url: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ""}` };
        }
      },
      {
        site: "dailymotion",
        domains: ["dailymotion.com"],
        video: /^\/(?:embed\/)?video\/([a-z0-9]{5,})(?:_[^/]*)?\/?$/i,
        canonical: (m) => ({ id: m[1], url: `https://www.dailymotion.com/video/${m[1]}` })
      },
      {
        site: "dailymotion",
        domains: ["dai.ly"],
        video: /^\/([a-z0-9]{5,})\/?$/i,
        canonical: (m) => ({ id: m[1], url: `https://www.dailymotion.com/video/${m[1]}` })
      },
      // Where the URL names the video, its key does too: a video read once is
      // reused with no yt-dlp call at all, as on YouTube.
      {
        site: "twitch",
        domains: ["twitch.tv"],
        video: /^\/videos\/(\d+)\/?$/,
        canonical: (m) => ({ id: m[1], url: `https://www.twitch.tv/videos/${m[1]}` })
      },
      { site: "twitch", domains: ["twitch.tv"], video: /^\/[^/]+\/clip\/[^/]+\/?$/ },
      {
        site: "ted",
        domains: ["ted.com"],
        video: /^\/talks\/([\w-]+)\/?$/,
        canonical: (m) => ({ id: m[1], url: `https://www.ted.com/talks/${m[1]}` })
      },
      {
        site: "loom",
        domains: ["loom.com"],
        video: /^\/(?:share|embed)\/([0-9a-f]{16,})\/?$/,
        canonical: (m) => ({ id: m[1], url: `https://www.loom.com/share/${m[1]}` })
      },
      {
        site: "tiktok",
        domains: ["tiktok.com"],
        video: /^\/(@[^/]+)\/video\/(\d+)\/?$/,
        canonical: (m) => ({ id: m[2], url: `https://www.tiktok.com/${m[1]}/video/${m[2]}` })
      },
      { site: "instagram", domains: ["instagram.com"], video: /^\/(?:reel|reels|tv)\/[\w-]+\/?$/ },
      { site: "facebook", domains: ["facebook.com"], video: /^\/(?:[^/]+\/videos\/[^/]+|reel\/\d+)\/?$/ },
      { site: "facebook", domains: ["fb.watch"], video: /^\/[\w-]{6,}\/?$/ },
      {
        site: "x",
        domains: ["x.com", "twitter.com"],
        video: /^\/([^/]+)\/status\/(\d+)(?:\/video\/\d)?\/?$/,
        canonical: (m) => ({ id: m[2], url: `https://x.com/${m[1]}/status/${m[2]}` })
      },
      { site: "bilibili", domains: ["bilibili.com"], video: /^\/video\/(?:BV\w+|av\d+)\/?$/i },
      { site: "rumble", domains: ["rumble.com"], video: /^\/v[\w-]+\.html$/ },
      { site: "peertube", domains: ["framatube.org", "tilvids.com"], video: /^\/(?:w|videos\/watch)\/[\w-]+\/?$/ }
    ];
    safeKey = (site, id) => `${site}-${id}`.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120);
    shortHash = (text) => fnv1a64(text).toString(16).padStart(16, "0").slice(0, 8);
  }
});
function toResult(status, stdout, stderr, err) {
  const missing = err?.code === "ENOENT";
  return {
    ok: !missing && status === 0,
    status: status ?? (missing ? 127 : 1),
    stdout,
    stderr: stderr || (err ? err.message : ""),
    ...missing ? { missing: true } : {}
  };
}
function have(cmd) {
  let hit2 = havePresence.get(cmd);
  if (hit2 === void 0) {
    const probe = spawnSync2(process.platform === "win32" ? "where" : "which", [cmd], { encoding: "utf8" });
    hit2 = probe.status === 0 && (probe.stdout ?? "").trim().length > 0;
    havePresence.set(cmd, hit2);
  }
  return hit2;
}
function shAsync(cmd, args, opts = {}) {
  const timeoutMs = Math.min(opts.timeoutMs ?? defaultTimeoutMs(), MAX_TIMER_MS);
  if (opts.signal?.aborted) return Promise.resolve({ ok: false, status: 130, stdout: "", stderr: "aborted" });
  return new Promise((resolve9) => {
    let settled = false;
    let timer;
    let onAbort;
    const done = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (onAbort) opts.signal?.removeEventListener("abort", onAbort);
      resolve9(r);
    };
    let child;
    try {
      child = spawn3(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      done({ ok: false, status: 1, stdout: "", stderr: e.message });
      return;
    }
    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (d) => {
      if (stdout.length < STDOUT_CAP) stdout += d;
    });
    child.stderr?.on("data", (d) => {
      if (stderr.length < STDOUT_CAP) stderr += d;
    });
    timer = setTimeout(() => {
      killTree(child);
      done({ ok: false, status: 124, stdout, stderr: stderr || `timed out after ${timeoutMs}ms` });
    }, timeoutMs);
    if (opts.signal) {
      onAbort = () => {
        killTree(child);
        done({ ok: false, status: 130, stdout, stderr: "aborted" });
      };
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }
    child.on("error", (e) => done(toResult(null, stdout, stderr, e)));
    child.on("close", (code) => done(toResult(code, stdout, stderr)));
  });
}
var STDOUT_CAP;
var defaultTimeoutMs;
var havePresence;
var init_exec2 = __esm({
  "src/exec.ts"() {
    "use strict";
    init_brand();
    init_process_tree();
    STDOUT_CAP = 24 * 1024 * 1024;
    defaultTimeoutMs = () => envInt("SH_TIMEOUT_MS", 6e4, 1e3, MAX_TIMER_MS);
    havePresence = /* @__PURE__ */ new Map();
  }
});
function ytdlpExtraArgs() {
  return (env("YTDLP_ARGS") ?? "").split(/\s+/).filter(Boolean);
}
function runYtdlp(args, opts = {}) {
  const strict = opts.knownOnly ? ["--use-extractors", "default,-generic"] : [];
  const argv = [...strict, ...args, ...ytdlpExtraArgs(), ...opts.url ? ["--", opts.url] : []];
  return (opts.run ?? defaultVideoRunner)("yt-dlp", argv, { timeoutMs: opts.timeoutMs ?? PROBE_TIMEOUT_MS, signal: opts.signal });
}
function siteOf(extractor) {
  const e = extractor.toLowerCase().split(":")[0].replace(/[^a-z0-9]/g, "");
  const known = [
    ["youtube", "youtube"],
    ["vimeo", "vimeo"],
    ["dailymotion", "dailymotion"],
    ["twitch", "twitch"],
    ["twitter", "x"],
    ["ted", "ted"],
    ["loom", "loom"],
    ["tiktok", "tiktok"],
    ["instagram", "instagram"],
    ["facebook", "facebook"],
    ["bilibili", "bilibili"],
    ["rumble", "rumble"],
    ["peertube", "peertube"]
  ];
  if (!e || e === "generic") return "web";
  return known.find(([prefix]) => e.startsWith(prefix))?.[1] ?? e;
}
function videoMetaFromInfo(info, sourceUrl) {
  const id = str(info.id);
  if (!id) return void 0;
  const site = siteOf(str(info.extractor_key) ?? str(info.extractor) ?? "youtube");
  const webpageUrl = httpUrl(str(info.webpage_url)) ?? httpUrl(str(info.original_url)) ?? httpUrl(sourceUrl) ?? `https://www.youtube.com/watch?v=${id}`;
  const date = str(info.upload_date);
  const tracks = (v) => v && typeof v === "object" ? Object.keys(v).filter((k) => k !== "live_chat") : [];
  const duration = num(info.duration);
  const chapters = Array.isArray(info.chapters) ? info.chapters.map((c) => ({
    start: num(c.start_time) ?? 0,
    end: num(c.end_time) ?? duration ?? 0,
    title: (str(c.title) ?? "").replace(/^<Untitled Chapter (\d+)>$/, "Chapter $1")
  })).filter((c) => c.title) : [];
  return {
    id,
    site,
    key: videoRunKey(site, id, webpageUrl),
    title: str(info.title) ?? id,
    channel: str(info.channel) ?? str(info.uploader),
    uploadDate: date && /^\d{8}$/.test(date) ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}` : void 0,
    duration,
    language: str(info.language),
    chapters,
    subtitles: tracks(info.subtitles),
    autoCaptions: tracks(info.automatic_captions),
    webpageUrl,
    ...info.live_status === "is_live" || info.is_live === true ? { live: "live" } : {},
    ...info.live_status === "is_upcoming" ? { live: "upcoming" } : {}
  };
}
async function probeVideo(url, run = defaultVideoRunner, signal, knownOnly = false) {
  const r = await runYtdlp(["-J", "--skip-download", "--no-playlist", "--no-warnings"], { run, url, signal, knownOnly });
  if (signal?.aborted) return { error: "cancelled" };
  if (r.missing) return { error: "install yt-dlp (https://github.com/yt-dlp/yt-dlp) to read videos", missing: true };
  if (!r.ok) return { error: classifyYtdlpError(r.stderr) };
  try {
    const parsed = JSON.parse(r.stdout);
    if (parsed?._type === "playlist") return { error: "a list of videos, not one \u2014 read it with `video list`" };
    const meta = parsed ? videoMetaFromInfo(parsed, url) : void 0;
    return meta ? { meta, info: r.stdout } : { error: "no video at this URL (yt-dlp found none)" };
  } catch {
    return { error: "yt-dlp returned unreadable metadata" };
  }
}
function classifyYtdlpError(stderr) {
  const s = stderr || "";
  const unblock = `update yt-dlp (\`${brand().cli} doctor\` shows how old it is) or set ${envName("YTDLP_ARGS")}="--cookies-from-browser firefox"`;
  if (/private video/i.test(s)) return "private video";
  if (/logged-in|log(?:ged)? ?in (?:is )?required|login required|requires? (?:a )?login|--username and --password|account credentials/i.test(s)) {
    return `the site asks yt-dlp to log in \u2014 ${envName("YTDLP_ARGS")}="--cookies-from-browser firefox" passes your browser's session`;
  }
  if (/members[- ]only|join this channel/i.test(s)) return "members-only video";
  if (/confirm your age|age[- ]restricted|inappropriate for some users/i.test(s)) {
    return `age-restricted video \u2014 it needs a signed-in session: ${envName("YTDLP_ARGS")}="--cookies-from-browser firefox"`;
  }
  if (/not a bot|sign in to confirm|po[ _-]?token|HTTP Error 403/i.test(s)) return `YouTube refused yt-dlp \u2014 ${unblock}`;
  if (/has been removed|account .*terminated|no longer available|copyright claim/i.test(s)) return "video removed";
  if (/unavailable|not available/i.test(s)) return "video unavailable";
  if (/timed out after/i.test(s)) return "yt-dlp timed out";
  if (/DRM protected/i.test(s)) return "the site serves this video under DRM: its picture and sound cannot be downloaded (subtitles still can)";
  if (/unsupported url|no video (?:formats|could be found)|no media found|there's no video/i.test(s)) return "no video at this URL (yt-dlp found none)";
  const line = s.split("\n").map((l) => l.trim()).find((l) => l.startsWith("ERROR:"));
  return `yt-dlp failed: ${(line ?? s.trim().split("\n")[0] ?? "").replace(/^ERROR:\s*/, "").slice(0, 200) || "no output"}`;
}
async function withTempDir(label, fn) {
  const dir = mkdtempSync2(join3(tmpdir3(), `${brand().name}-${label}-`));
  try {
    return await fn(dir);
  } finally {
    rmSync2(dir, { recursive: true, force: true });
  }
}
async function downloadSubtitle(info, lang, auto, run = defaultVideoRunner, signal, knownOnly = false) {
  return withTempDir("subs", async (dir) => {
    const infoPath = join3(dir, "info.json");
    writeFileSync2(infoPath, info);
    const r = await runYtdlp(
      [
        "--load-info-json",
        infoPath,
        "--skip-download",
        "--no-warnings",
        auto ? "--write-auto-subs" : "--write-subs",
        "--sub-langs",
        lang,
        "--sub-format",
        "vtt/srt",
        "-o",
        join3(dir, "sub.%(ext)s")
      ],
      { run, timeoutMs: SUBTITLE_TIMEOUT_MS, signal, knownOnly }
    );
    const file = readdirSync2(dir).find((f) => f.endsWith(".vtt")) ?? readdirSync2(dir).find((f) => f.endsWith(".srt"));
    if (file) return { vtt: readFileSync3(join3(dir, file), "utf8") };
    if (signal?.aborted) return { error: "cancelled" };
    return { error: r.ok ? `yt-dlp wrote no ${lang} track` : classifyYtdlpError(r.stderr) };
  });
}
async function downloadMedia(args, dir, stem, opts) {
  let stderr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const timeoutMs = typeof opts.timeoutMs === "function" ? opts.timeoutMs() : opts.timeoutMs;
    const r = await runYtdlp([...args, "--no-warnings", "-o", join3(dir, `${stem}.%(ext)s`)], {
      run: opts.run,
      url: opts.url,
      timeoutMs,
      signal: opts.signal,
      knownOnly: opts.knownOnly
    });
    if (opts.signal?.aborted) return { error: "cancelled" };
    if (r.status === 124) return { error: "timed out", timedOut: true };
    const file = r.ok ? readdirSync2(dir).find((f) => f.startsWith(`${stem}.`) && !/\.part(?:-Frag\d+)?$|\.ytdl$|\.f\d+\.\w+$/.test(f)) : void 0;
    if (file) return { file };
    stderr = r.ok ? "yt-dlp wrote no file" : r.stderr;
  }
  return { error: classifyYtdlpError(stderr) };
}
var defaultVideoRunner;
var PROBE_TIMEOUT_MS;
var SUBTITLE_TIMEOUT_MS;
var str;
var httpUrl;
var num;
var init_ytdlp = __esm({
  "src/video/ytdlp.ts"() {
    "use strict";
    init_brand();
    init_exec2();
    init_url2();
    defaultVideoRunner = (cmd, args, opts) => shAsync(cmd, args, opts);
    PROBE_TIMEOUT_MS = 12e4;
    SUBTITLE_TIMEOUT_MS = 12e4;
    str = (v) => typeof v === "string" && v.trim() ? v.trim() : void 0;
    httpUrl = (v) => v && /^https?:\/\//i.test(v) ? v : void 0;
    num = (v) => typeof v === "number" && Number.isFinite(v) ? v : void 0;
  }
});
function seconds(stamp) {
  const parts = stamp.replace(",", ".").split(":").map(Number);
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole2, name) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1));
      return Number.isFinite(code) && code > 0 && code <= 1114111 ? String.fromCodePoint(code) : whole2;
    }
    return ENTITIES2[name.toLowerCase()] ?? whole2;
  });
}
function parseVtt(src, opts = {}) {
  const text = src.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const srt = !/^WEBVTT/.test(text) && /^\s*\d+[ \t]*\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->/.test(text);
  if (!/^WEBVTT/.test(text) && !srt) return [];
  const rolling = opts.rolling ?? (/<\d{2}:\d{2}[:.]\d/.test(text) || /<c>/.test(text));
  const out2 = [];
  let shown = [];
  for (const block of text.split(/\n{2,}/)) {
    const raw = block.split("\n");
    const at = raw.findIndex((l) => TIMING.test(l));
    if (at < 0) continue;
    const m = TIMING.exec(raw[at]);
    const start = seconds(m[1]);
    const end = seconds(m[2]);
    const lines = raw.slice(at + 1).map(clean).filter(Boolean);
    const previous = shown;
    shown = lines;
    if (end - start < MIN_CUE_S) continue;
    let fresh = lines;
    if (rolling) {
      fresh = lines.slice(repeatedLead(lines, previous));
      const last = previous[previous.length - 1];
      if (last && fresh[0]?.startsWith(`${last} `)) fresh = [fresh[0].slice(last.length + 1), ...fresh.slice(1)];
    }
    if (fresh.length) out2.push({ start, end, text: fresh.join(" ") });
  }
  return out2;
}
function repeatedLead(lines, previous) {
  for (let n = Math.min(lines.length, previous.length); n > 0; n--) {
    const tail = previous.slice(previous.length - n);
    if (tail.every((l, i) => l === lines[i])) return n;
  }
  return 0;
}
function mergeSegments(cues, breaks = []) {
  const out2 = [];
  let cur;
  const flush = () => {
    if (cur) out2.push(cur);
    cur = void 0;
  };
  const crossesBreak = (from, to) => breaks.some((b) => b > from + BREAK_SLACK_S && b <= to + BREAK_SLACK_S);
  let sentences = 0;
  let spaceRuns = 0;
  let endsInSpace = false;
  for (const cue of cues) {
    if (cur && (cue.start - cur.end > PAUSE_S || cue.end - cur.start > MAX_SEGMENT_S || crossesBreak(cur.start, cue.start))) flush();
    const found = cue.text.match(SENTENCE_END)?.length ?? 0;
    const runs = cue.text.match(/\s+/g)?.length ?? 0;
    if (cur) {
      sentences += found;
      spaceRuns += runs + 1 - Number(endsInSpace) - Number(/^\s/.test(cue.text));
      endsInSpace = cue.text === "" || /\s$/.test(cue.text);
      cur = { start: cur.start, end: Math.max(cur.end, cue.end), text: `${cur.text} ${cue.text}` };
    } else {
      sentences = found;
      spaceRuns = runs;
      endsInSpace = /\s$/.test(cue.text);
      cur = { ...cue };
    }
    if (sentences >= MAX_SENTENCES || ENDS_SENTENCE.test(cue.text) && spaceRuns + 1 >= WORDS_TO_CLOSE) flush();
  }
  flush();
  return out2;
}
var TIMING;
var MIN_CUE_S;
var ENTITIES2;
var clean;
var SENTENCE_END;
var ENDS_SENTENCE;
var MAX_SEGMENT_S;
var MAX_SENTENCES;
var PAUSE_S;
var WORDS_TO_CLOSE;
var BREAK_SLACK_S;
var init_vtt = __esm({
  "src/video/vtt.ts"() {
    "use strict";
    TIMING = /^((?:\d+:)?\d{1,2}:\d{2}[.,]\d{3})\s+-->\s+((?:\d+:)?\d{1,2}:\d{2}[.,]\d{3})/;
    MIN_CUE_S = 0.05;
    ENTITIES2 = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", lrm: "", rlm: "" };
    clean = (line) => decode(line.replace(/<[^<>]*>/g, "").replace(/\{\\[^{}]*\}/g, "")).replace(/\s+/g, " ").trim();
    SENTENCE_END = /(?<![.!?…])[.!?…]+["'”’)\]]*(?=\s|$)/g;
    ENDS_SENTENCE = /(?<![.!?…])[.!?…]+["'”’)\]]*$/;
    MAX_SEGMENT_S = 30;
    MAX_SENTENCES = 3;
    PAUSE_S = 5;
    WORDS_TO_CLOSE = 25;
    BREAK_SLACK_S = 0.5;
  }
});
function whisperBudgetLeft() {
  return Math.max(0, envInt("WHISPER_MAX", DEFAULT_MAX) - spent2);
}
function whisperModel() {
  return env("WHISPER_MODEL") ?? DEFAULT_MODEL;
}
function whisperSegments(json2) {
  try {
    const parsed = JSON.parse(json2);
    return (parsed.segments ?? []).map((s) => ({
      start: Number(s.start),
      end: Number(s.end),
      text: String(s.text ?? "").replace(/\s+/g, " ").trim()
    })).filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.text);
  } catch {
    return [];
  }
}
function whisperLanguage(tag) {
  const base2 = tag?.toLowerCase().split(/[-_]/)[0];
  return base2 && /^[a-z]{2,3}$/.test(base2) ? base2 : void 0;
}
async function whisperTranscribe(info, language, run, signal, knownOnly = false) {
  if (whisperBudgetLeft() <= 0) return { declined: "budget" };
  spent2++;
  const refund = (r) => {
    spent2 = Math.max(0, spent2 - 1);
    return r;
  };
  const budgetMs = envInt("WHISPER_TIMEOUT_MS", DEFAULT_TIMEOUT_MS2, 1e3);
  const deadline = Date.now() + budgetMs;
  const left = () => Math.max(1e3, deadline - Date.now());
  const timedOut = { failed: `whisper: timed out after ${Math.round(budgetMs / 6e4)} min (${envName("WHISPER_TIMEOUT_MS")})` };
  return withTempDir("whisper", async (dir) => {
    const infoPath = join4(dir, "info.json");
    writeFileSync3(infoPath, info);
    const dl = await downloadMedia(["--load-info-json", infoPath, "-f", AUDIO_FORMAT], dir, "audio", { run, timeoutMs: left, signal, knownOnly });
    if (signal?.aborted) return refund({ failed: "whisper: cancelled" });
    if ("timedOut" in dl) return refund(timedOut);
    if ("error" in dl) return refund({ failed: `whisper: the audio download failed (${dl.error})` });
    const audio = dl.file;
    const wav = join4(dir, "speech.wav");
    const ff = await run("ffmpeg", ["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", join4(dir, audio), "-ar", "16000", "-ac", "1", wav], {
      timeoutMs: left(),
      signal
    });
    if (ff.missing) return refund({ failed: "whisper needs ffmpeg", unavailable: true });
    if (signal?.aborted) return refund({ failed: "whisper: cancelled" });
    if (ff.status === 124) return refund(timedOut);
    if (!ff.ok || !existsSync2(wav)) return refund({ failed: "whisper: ffmpeg could not convert the audio" });
    const args = ["--with", PYAV_PIN, "whisper-ctranslate2", wav, "--model", whisperModel(), "--output_format", "json", "--output_dir", dir];
    const lang = whisperLanguage(language);
    if (lang) args.push("--language", lang);
    const w = await run("uvx", args, { timeoutMs: left(), cwd: dir, signal });
    if (w.missing) return refund({ failed: "whisper needs uvx", unavailable: true });
    if (signal?.aborted) return { failed: "whisper: cancelled" };
    if (w.status === 124) return timedOut;
    const out2 = join4(dir, "speech.json");
    if (!w.ok || !existsSync2(out2)) return { failed: `whisper: ${w.stderr.trim().split("\n").pop() || "failed"}` };
    return { segments: whisperSegments(readFileSync4(out2, "utf8")) };
  });
}
var DEFAULT_MAX;
var DEFAULT_TIMEOUT_MS2;
var DEFAULT_MODEL;
var PYAV_PIN;
var AUDIO_FORMAT;
var spent2;
var init_whisper = __esm({
  "src/video/whisper.ts"() {
    "use strict";
    init_brand();
    init_ytdlp();
    DEFAULT_MAX = 3;
    DEFAULT_TIMEOUT_MS2 = 30 * 6e4;
    DEFAULT_MODEL = "small";
    PYAV_PIN = "av<18";
    AUDIO_FORMAT = "bestaudio/best";
    spent2 = 0;
  }
});
function videoDeps(own) {
  return { run: own?.run ?? processDeps.run ?? defaultVideoRunner, have: own?.have ?? processDeps.have ?? have };
}
function enabledTranscribers(engines) {
  return engines ?? enginesFromEnv("VIDEO_ENGINES", VIDEO_TRANSCRIBERS) ?? VIDEO_TRANSCRIBERS;
}
function assessTranscript(segments, duration) {
  const words = segments.reduce((n, s) => n + s.text.split(/\s+/).filter(Boolean).length, 0);
  if (!words) return { ok: false, reason: "empty transcript" };
  if (duration && duration > 60) {
    const minutes = duration / 60;
    if (words / minutes < MIN_WORDS_PER_MINUTE) {
      return { ok: false, reason: `transcript too sparse: ${words} words over ${Math.round(minutes)} min \u2014 music or a silent video?` };
    }
  }
  return { ok: true };
}
function pickManualTrack(meta, lang) {
  const tracks = meta.subtitles;
  if (!tracks.length) return void 0;
  for (const want of [lang, meta.language, "en"]) {
    if (!want) continue;
    const exact = tracks.find((t) => t.toLowerCase() === want.toLowerCase());
    if (exact) return exact;
    const sameBase = tracks.find((t) => base(t) === base(want));
    if (sameBase) return sameBase;
  }
  return tracks[0];
}
function pickAutoTrack(meta) {
  const tracks = meta.autoCaptions;
  const lang = meta.language;
  if (lang) {
    for (const want of [`${lang}-orig`, lang]) {
      const hit2 = tracks.find((t) => t.toLowerCase() === want.toLowerCase());
      if (hit2) return hit2;
    }
    const orig = tracks.find((t) => t.endsWith("-orig") && base(t) === base(lang));
    if (orig) return orig;
    return void 0;
  }
  const origs = tracks.filter((t) => t.endsWith("-orig"));
  return origs.length === 1 ? origs[0] : void 0;
}
async function subtitleRung(auto, meta, info, opts, deps) {
  const track2 = auto ? pickAutoTrack(meta) : pickManualTrack(meta, opts.lang);
  if (!track2) return { failure: auto ? "no auto-captions in the video's language" : "no manual subtitles", noTrack: true };
  const got = await downloadSubtitle(info, track2, auto, deps.run, opts.signal, opts.knownHostsOnly);
  if ("error" in got) return { failure: `${auto ? "auto-captions" : "subtitles"} (${track2}): ${got.error}` };
  return { segments: mergeSegments(parseVtt(got.vtt, { rolling: auto }), chapterStarts(meta)), track: track2 };
}
async function whisperRung(meta, info, opts, deps) {
  const missing = ["uvx", "ffmpeg"].filter((c) => !deps.have(c));
  if (missing.length) return { failure: "whisper needs uvx and ffmpeg", unavailable: true };
  if (whisperBudgetLeft() <= 0) return { failure: `this run's whisper budget is spent (raise ${envName("WHISPER_MAX")})` };
  const r = await whisperTranscribe(info, meta.language, deps.run, opts.signal, opts.knownHostsOnly);
  if ("segments" in r) return { segments: mergeSegments(r.segments, chapterStarts(meta)) };
  if ("declined" in r) return { failure: `this run's whisper budget is spent (raise ${envName("WHISPER_MAX")})` };
  return { failure: r.failed, unavailable: r.unavailable };
}
async function transcribeVideo(url, opts = {}) {
  const none = (reason2, meta2) => ({
    text: "",
    segments: [],
    chapters: meta2?.chapters ?? [],
    ...meta2 ? { meta: meta2 } : {},
    reason: reason2
  });
  const source2 = videoSource(url, { anySite: !opts.knownHostsOnly });
  if (!source2) return none(`not a video URL${opts.knownHostsOnly ? " on a known video host" : ""}: ${url}`);
  const deps = videoDeps(opts.deps);
  const rungs = enabledTranscribers(opts.engines);
  if (!rungs.length) return none(`every transcript rung is switched off (${envName("VIDEO_ENGINES")})`);
  const probe = opts.probed ?? await probeVideo(source2.url, deps.run, opts.signal, opts.knownHostsOnly);
  if ("error" in probe) return none(probe.error);
  const { meta, info } = probe;
  if (meta.live) return none(`live stream ${meta.live === "live" ? "in progress" : "not started yet"} \u2014 read it once it has ended`, meta);
  const failures = [];
  let noTrack = 0;
  let subtitleRungs = 0;
  let whisperMissing = false;
  let gateReason;
  for (const rung of rungs) {
    if (opts.signal?.aborted) return none("cancelled", meta);
    if (rung !== "whisper") subtitleRungs++;
    const known = dead3.get(rung);
    let got;
    if (known) got = { failure: known, unavailable: true };
    else {
      try {
        got = rung === "whisper" ? await whisperRung(meta, info, opts, deps) : await subtitleRung(rung === "auto-subs", meta, info, opts, deps);
      } catch (e) {
        got = { failure: `${rung}: ${e.message}` };
      }
    }
    if (opts.signal?.aborted) return none("cancelled", meta);
    if ("failure" in got) {
      if (got.unavailable) dead3.set(rung, got.failure);
      if (rung === "whisper" && got.unavailable) whisperMissing = true;
      if (got.noTrack) noTrack++;
      failures.push(got.failure);
      continue;
    }
    const verdict = assessTranscript(got.segments, meta.duration);
    if (verdict.ok)
      return { text: plain(got.segments), segments: got.segments, chapters: meta.chapters, meta, via: rung, ...got.track ? { track: got.track } : {} };
    gateReason = verdict.reason;
  }
  let reason;
  if (subtitleRungs && noTrack === subtitleRungs && whisperMissing && !gateReason) reason = "no subtitles, and whisper needs uvx and ffmpeg";
  else reason = [...new Set([gateReason, ...failures].filter(Boolean))].join("; ");
  return none(reason || "no transcript", meta);
}
var VIDEO_TRANSCRIBERS;
var processDeps;
var dead3;
var MIN_WORDS_PER_MINUTE;
var base;
var chapterStarts;
var plain;
var init_ladder3 = __esm({
  "src/video/ladder.ts"() {
    "use strict";
    init_brand();
    init_exec2();
    init_ladder();
    init_url2();
    init_vtt();
    init_whisper();
    init_ytdlp();
    VIDEO_TRANSCRIBERS = ["manual-subs", "auto-subs", "whisper"];
    processDeps = {};
    dead3 = /* @__PURE__ */ new Map();
    MIN_WORDS_PER_MINUTE = 5;
    base = (tag) => tag.toLowerCase().split(/[-_]/)[0];
    chapterStarts = (meta) => meta.chapters.map((c) => c.start);
    plain = (segments) => segments.map((s) => s.text).join("\n");
  }
});
function formatStamp(seconds3) {
  const t = Math.max(0, Math.floor(Number.isFinite(seconds3) ? seconds3 : 0));
  const pad2 = (n) => String(n).padStart(2, "0");
  const h = Math.floor(t / 3600);
  const m = Math.floor(t % 3600 / 60);
  const s = t % 60;
  return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}
function source(t) {
  if (!t.via) return void 0;
  const site = t.meta?.site ?? "youtube";
  const label = t.via === "auto-subs" && site !== "youtube" ? `the site's auto-captions` : VIA_LABEL[t.via] ?? t.via;
  const how = `${label} (${t.via}${t.track ? `, track ${t.track}` : ""})`;
  const spoken = t.meta?.language;
  if (t.track && spoken && baseLang(t.track) !== baseLang(spoken)) return `${how} \u2014 a translation: the video speaks ${spoken}`;
  return how;
}
function transcriptMarkdown(t) {
  if (!t.segments.length) return "";
  const meta = t.meta;
  const head = [`# ${meta?.title ?? "Video transcript"}`, ""];
  if (meta) {
    const facts = [
      meta.channel && `- Channel: ${meta.channel}`,
      meta.uploadDate && `- Published: ${meta.uploadDate}`,
      meta.duration !== void 0 && `- Duration: ${formatStamp(meta.duration)}`,
      `- URL: ${meta.webpageUrl}`,
      t.via && `- Transcript: ${source(t)}`
    ].filter(Boolean);
    head.push(...facts, "");
  }
  const body = [];
  const chapters = [...t.chapters].sort((a, b) => a.start - b.start);
  let c = -1;
  for (const seg of t.segments) {
    while (c + 1 < chapters.length && chapters[c + 1].start <= seg.start + 0.5) {
      c++;
      body.push(`## ${chapters[c].title}`, "");
    }
    body.push(paragraph(seg), "");
  }
  return [...head, ...body].join("\n").trimEnd() + "\n";
}
var VIA_LABEL;
var paragraph;
var baseLang;
var init_markdown = __esm({
  "src/video/markdown.ts"() {
    "use strict";
    VIA_LABEL = {
      "manual-subs": "manual subtitles",
      "auto-subs": "YouTube auto-captions",
      whisper: "local whisper transcription"
    };
    paragraph = (s) => `[${formatStamp(s.start)}] ${s.text}`;
    baseLang = (tag) => tag.toLowerCase().replace(/-orig$/, "").split(/[-_]/)[0];
  }
});
function isNoWrite() {
  return flagged || envFlag("NO_WRITE");
}
function writeFileAtomic(path, content, mode2) {
  const tmp = `${path}.${process.pid}.${tmpCounter++}.tmp`;
  try {
    writeFileSync4(tmp, content, mode2 === void 0 ? void 0 : { mode: mode2 });
    renameSync(tmp, path);
  } catch (e) {
    try {
      unlinkSync(tmp);
    } catch {
    }
    throw e;
  }
}
var flagged;
var collected;
var tmpCounter;
var init_no_write = __esm({
  "src/no-write.ts"() {
    "use strict";
    init_brand();
    flagged = false;
    collected = [];
    tmpCounter = 0;
  }
});
var init_private_dir = __esm({
  "src/private-dir.ts"() {
    "use strict";
    init_no_write();
  }
});
var REDIRECT_STATUS;
var DOT_SEGMENT;
var MAX_IDENT;
var init_shared = __esm({
  "src/shared.ts"() {
    "use strict";
    REDIRECT_STATUS = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
    DOT_SEGMENT = /^(?:\.|%2e){1,2}$/i;
    MAX_IDENT = 64;
  }
});
var STOPWORDS;
var LOCALE_STOPWORDS;
var extraSets;
var TOKEN_RE;
var CJK_CHAR;
var CJK_RUNS;
var ACCENT_CLASSES;
var BASE_OF;
var NON_ASCII;
var MAX_PATTERNS;
var MAX_KEYWORD_CHARS;
var VARIANT_PRIORITY;
var LIGATURE_SPELLING;
var LIGATURE_OF;
var SHORT_VARIANT;
var ATX_OPEN;
var ATX_CLOSE;
var MD_ESCAPE;
var init_text = __esm({
  "src/text.ts"() {
    "use strict";
    init_brand();
    init_url();
    init_shared();
    STOPWORDS = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "do",
      "does",
      "did",
      "how",
      "what",
      "why",
      "when",
      "where",
      "which",
      "who",
      "whom",
      "this",
      "that",
      "these",
      "those",
      "of",
      "in",
      "on",
      "to",
      "for",
      "with",
      "and",
      "or",
      "but",
      "if",
      "then",
      "else",
      "than",
      "as",
      "at",
      "by",
      "from",
      "into",
      "about",
      "it",
      "its",
      "i",
      "you",
      "we",
      "they",
      "he",
      "she",
      "there",
      "here",
      "can",
      "could",
      "should",
      "would",
      "will",
      "shall",
      "may",
      "might",
      "must",
      "have",
      "has",
      "had",
      "not",
      "no",
      "yes",
      "so",
      "such",
      "only",
      "any",
      "some",
      "all",
      "get",
      "set",
      "use",
      "used",
      "using",
      "work",
      "works",
      "working",
      "handle",
      "handled",
      "happen",
      "happens",
      "default",
      "value",
      "values",
      "please",
      "explain",
      "tell",
      "me",
      "my",
      "our",
      "vs"
    ]);
    LOCALE_STOPWORDS = /* @__PURE__ */ new Set([
      "le",
      "la",
      "les",
      "de",
      "des",
      "du",
      "un",
      "une",
      "est",
      "sont",
      "que",
      "qui",
      "quoi",
      "quel",
      "quelle",
      "quels",
      "quelles",
      "pour",
      "dans",
      "avec",
      "entre",
      "sur",
      "par",
      "pas",
      "plus",
      "et",
      "ou",
      "o\xF9",
      "ce",
      "cette",
      "ces",
      "se",
      "sa",
      "son",
      "ses",
      "leur",
      "leurs",
      "comment",
      "pourquoi",
      "quand",
      "fait",
      "faire",
      "peut",
      "doit",
      "\xEAtre",
      "avoir",
      "il",
      "elle",
      "nous",
      "vous",
      "ils",
      "elles",
      "au",
      "aux",
      "si",
      "ne",
      // German.
      "der",
      "die",
      "das",
      "und",
      "ist",
      "sind",
      "wie",
      "ein",
      "eine",
      "einen",
      "einem",
      "einer",
      "mit",
      "f\xFCr",
      "von",
      "zu",
      "den",
      "dem",
      "im",
      "auf",
      "nicht",
      "sich",
      "oder",
      "warum",
      "wann",
      "welche",
      "welcher",
      "welches",
      "kann",
      "wird"
    ]);
    extraSets = /* @__PURE__ */ new WeakMap();
    TOKEN_RE = new RegExp("(?<![\\p{L}\\p{M}\\p{N}_])\\.net(?![\\p{L}\\p{M}\\p{N}_])|[\\p{L}\\p{M}\\p{N}_]+(?:(?<=\\p{L})[+#]{1,2}\\d*(?![\\p{L}\\p{M}\\p{N}_+#])|\\/\\d(?:\\.\\d)?(?![\\p{L}\\p{M}\\p{N}_./]))?", "giu");
    CJK_CHAR = /[\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}]/u;
    CJK_RUNS = /([\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}]+)/u;
    ACCENT_CLASSES = {
      a: "a\xE0\xE1\xE2\xE3\xE4\xE5\u0101\u0103\u0105",
      c: "c\xE7\u0107\u0109\u010B\u010D",
      d: "d\u010F\u0111",
      e: "e\xE8\xE9\xEA\xEB\u0113\u0115\u0117\u0119\u011B",
      g: "g\u011D\u011F\u0121\u0123",
      i: "i\xEC\xED\xEE\xEF\u0129\u012B\u012D\u012F\u0131",
      l: "l\u013A\u013C\u013E\u0140\u0142",
      n: "n\xF1\u0144\u0146\u0148",
      o: "o\xF2\xF3\xF4\xF5\xF6\xF8\u014D\u014F\u0151",
      r: "r\u0155\u0157\u0159",
      s: "s\u015B\u015D\u015F\u0161",
      t: "t\u0163\u0165\u0167",
      u: "u\xF9\xFA\xFB\xFC\u0169\u016B\u016D\u016F\u0171\u0173",
      y: "y\xFD\xFF\u0177",
      z: "z\u017A\u017C\u017E"
    };
    BASE_OF = /* @__PURE__ */ new Map();
    for (const [base2, cls] of Object.entries(ACCENT_CLASSES)) {
      for (const ch of cls) BASE_OF.set(ch, base2);
    }
    NON_ASCII = /[\u0080-\uffff]/;
    MAX_PATTERNS = 24;
    MAX_KEYWORD_CHARS = 256;
    VARIANT_PRIORITY = { original: 0, folded: 1, subtoken: 2 };
    LIGATURE_SPELLING = { \u0153: "oe", \u00E6: "ae", \u00DF: "ss" };
    LIGATURE_OF = { oe: "\u0153", ae: "\xE6", ss: "\xDF" };
    SHORT_VARIANT = 3;
    ATX_OPEN = /^#{1,6}\s+/;
    ATX_CLOSE = /(?:^|\s)#+$/;
    MD_ESCAPE = /\\([!-/:-@[-`{-~])/g;
  }
});
var byCodeUnit;
var indexTokenCache;
var WORD_SPLIT;
var NON_ASCII2;
var CJK_CHAR2;
var CJK_RUNS2;
var IDENT_BOUNDARY;
var FOLD_CACHE_MAX;
var foldCache;
var NO_SUBTERMS;
var subtermCache;
var subtermExtras;
var STEM_CACHE_MAX;
var stemCache;
var MASK32;
var unsigned64;
var PAIR_CACHE_MAX;
var URL_IN_TEXT;
var UNDER_COVERED_MIN;
var init_rank = __esm({
  "src/rank.ts"() {
    "use strict";
    init_brand();
    init_text();
    init_trim();
    init_url();
    init_shared();
    byCodeUnit = (a, b) => a < b ? -1 : a > b ? 1 : 0;
    indexTokenCache = /* @__PURE__ */ new WeakMap();
    WORD_SPLIT = /[^\p{L}\p{M}\p{N}_]+/u;
    NON_ASCII2 = /[^\p{ASCII}]/u;
    CJK_CHAR2 = /[\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}]/u;
    CJK_RUNS2 = /([\p{scx=Han}\p{scx=Hiragana}\p{scx=Katakana}]+)/u;
    IDENT_BOUNDARY = new RegExp("_|[\\p{Ll}\\p{N}]\\p{Lu}|\\p{Lu}\\p{Lu}\\p{Ll}|\\p{L}\\p{N}|\\p{N}\\p{L}", "u");
    FOLD_CACHE_MAX = 5e4;
    foldCache = /* @__PURE__ */ new Map();
    NO_SUBTERMS = [];
    subtermCache = /* @__PURE__ */ new Map();
    subtermExtras = { list: void 0, length: 0 };
    STEM_CACHE_MAX = 5e4;
    stemCache = /* @__PURE__ */ new Map();
    MASK32 = 0xffffffffn;
    unsigned64 = (v) => v < 0n ? BigInt.asUintN(64, v) : v;
    PAIR_CACHE_MAX = 2048;
    URL_IN_TEXT = /https?:\/\/(?:[^\s/@?#]+@)?[\p{L}\p{N}.-]+/giu;
    UNDER_COVERED_MIN = 2;
  }
});
var baseLang2;
var readJson;
var PASSAGE_S;
var chapterAt;
var init_run = __esm({
  "src/video/run.ts"() {
    "use strict";
    init_brand();
    init_no_write();
    init_private_dir();
    init_rank();
    init_ladder3();
    init_markdown();
    init_url2();
    init_ytdlp();
    baseLang2 = (tag) => tag.toLowerCase().replace(/-orig$/, "").split(/[-_]/)[0];
    readJson = (path) => {
      try {
        return JSON.parse(readFileSync5(path, "utf8"));
      } catch {
        return void 0;
      }
    };
    PASSAGE_S = 45;
    chapterAt = (chapters, t) => [...chapters].sort((a, b) => b.start - a.start).find((c) => c.start <= t + 0.5)?.title;
  }
});
var chains;
var init_run_lock = __esm({
  "src/run-lock.ts"() {
    "use strict";
    chains = /* @__PURE__ */ new Map();
  }
});
var BEFORE_S;
var AFTER_S;
var chapterAt2;
var init_align = __esm({
  "src/video/align.ts"() {
    "use strict";
    init_markdown();
    BEFORE_S = 5;
    AFTER_S = 10;
    chapterAt2 = (chapters, t) => [...chapters].sort((a, b) => b.start - a.start).find((c) => c.start <= t + 0.5)?.title;
  }
});
var DHASH_FRAME_BYTES;
var DHASH_SAME;
var init_dhash = __esm({
  "src/video/dhash.ts"() {
    "use strict";
    DHASH_FRAME_BYTES = 72;
    DHASH_SAME = 6;
  }
});
var FRAME_EFFORT;
var SCENE_THRESHOLD;
var VIDEO_FORMAT;
var FRAMES_TIMEOUT_MS;
var MIN_FRAMES;
var INTERVAL_FRAMES;
var JPEG_FILTER;
var plural;
var fileStamp;
var init_frames = __esm({
  "src/video/frames.ts"() {
    "use strict";
    init_no_write();
    init_run_lock();
    init_align();
    init_dhash();
    init_ladder3();
    init_markdown();
    init_run();
    init_url2();
    init_ytdlp();
    FRAME_EFFORT = { low: 20, med: 50, high: 100 };
    SCENE_THRESHOLD = 0.3;
    VIDEO_FORMAT = "bv*[height<=720]/b[height<=720]/bv*/b";
    FRAMES_TIMEOUT_MS = 30 * 6e4;
    MIN_FRAMES = 3;
    INTERVAL_FRAMES = 10;
    JPEG_FILTER = "scale='min(1280,iw)':-2:out_range=full,format=yuvj420p";
    plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
    fileStamp = (t) => formatStamp(t).replace(/:/g, "-");
  }
});
var init_pool = __esm({
  "src/pool.ts"() {
    "use strict";
  }
});
var LIST_TIMEOUT_MS;
var DEFAULT_LIMIT;
var CORPUS_CONCURRENCY;
var init_list = __esm({
  "src/video/list.ts"() {
    "use strict";
    init_no_write();
    init_pool();
    init_ladder3();
    init_markdown();
    init_run();
    init_url2();
    init_ytdlp();
    LIST_TIMEOUT_MS = 12e4;
    DEFAULT_LIMIT = 10;
    CORPUS_CONCURRENCY = 2;
  }
});
var init_video = __esm({
  "src/video.ts"() {
    "use strict";
    init_url2();
    init_ytdlp();
    init_vtt();
    init_whisper();
    init_ladder3();
    init_markdown();
    init_run();
    init_frames();
    init_list();
  }
});
function parseArgs(argv, spec) {
  const commands = new Set(spec.commands);
  const valueFlags = new Set(spec.valueFlags);
  const boolFlags = new Set(spec.boolFlags);
  const scoped = spec.commandFlags?.[argv[0] ?? ""];
  const takes = scoped === void 0 ? void 0 : new Set(scoped);
  if (argv.length === 0) return { kind: "help" };
  if (isHelpWord(argv[0])) return argv[1] !== void 0 && commands.has(argv[1]) ? { kind: "help", command: argv[1] } : { kind: "help" };
  if (isVersionWord(argv[0])) return { kind: "version" };
  const command2 = argv[0];
  if (!commands.has(command2)) {
    throw new UsageError(`unknown command "${command2}" \u2014 run --help for the supported commands`);
  }
  const values = {};
  const bools = /* @__PURE__ */ new Set();
  const positional = [];
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (!arg.startsWith("--") && arg !== "-h" && arg !== "-v") {
      if (arg.length > 1 && arg[0] === "-" && !/^-\.?\d/.test(arg)) {
        throw new UsageError(`unknown flag "${arg}" \u2014 flags here are long (--name); put -- before a word that starts with a dash`);
      }
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const key = eq !== -1 ? arg.slice(2, eq) : arg.slice(2);
    const declared = boolFlags.has(key) || valueFlags.has(key);
    const own = declared && (takes === void 0 || takes.has(key));
    if (!own) {
      if (isHelpWord(arg)) return { kind: "help", command: command2 };
      if (isVersionWord(arg)) return { kind: "version" };
    }
    if (declared && !own) {
      throw new UsageError(`--${key} does not apply to ${command2} \u2014 run \`${command2} --help\` for its options`);
    }
    if (boolFlags.has(key)) {
      if (eq !== -1) throw new UsageError(`--${key} is a boolean flag and takes no value`);
      bools.add(key);
      continue;
    }
    if (!valueFlags.has(key)) {
      throw new UsageError(`unknown flag "--${key}" \u2014 run --help for the supported options`);
    }
    if (eq !== -1) {
      values[key] = arg.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next === void 0 || next.startsWith("--")) {
      throw new UsageError(`missing value for --${key}`);
    }
    values[key] = next;
    i++;
  }
  return { kind: "command", command: command2, positional, values, bools };
}
function isHelpWord(a) {
  return a === "--help" || a === "-h" || a === "help";
}
function isVersionWord(a) {
  return a === "--version" || a === "-v" || a === "version";
}
function argValue(p, name) {
  return p.values[name];
}
function argBool(p, name) {
  return p.bools.has(name);
}
function argInt(p, name, range = {}) {
  const raw = p.values[name];
  if (raw === void 0) return void 0;
  const n = raw.trim() ? Number(raw) : Number.NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new UsageError(`--${name} expects a whole number, got "${raw}"`);
  }
  const { min, max } = range;
  if (min !== void 0 && n < min || max !== void 0 && n > max) {
    const bound = min !== void 0 && max !== void 0 ? `from ${min} to ${max}` : min !== void 0 ? `of at least ${min}` : `of at most ${max}`;
    throw new UsageError(`--${name} expects a whole number ${bound}, got "${raw}"`);
  }
  return n;
}
function argList(p, name) {
  const raw = p.values[name];
  if (raw === void 0) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
function jsonLine(value) {
  return `${JSON.stringify(value, null, 2)}
`;
}
function isInvokedDirectly(argv1 = process.argv[1], cli = brand().cli) {
  if (!argv1) return false;
  return basename(argv1).replace(/\.(mjs|cjs|js)$/, "") === cli;
}
var EXIT_OK;
var EXIT_FAILURE;
var EXIT_USAGE;
var EXIT_HUMAN;
var UsageError;
var init_cli_kit = __esm({
  "src/cli-kit.ts"() {
    "use strict";
    init_brand();
    init_text();
    EXIT_OK = 0;
    EXIT_FAILURE = 1;
    EXIT_USAGE = 2;
    EXIT_HUMAN = 3;
    UsageError = class extends Error {
      exitCode = EXIT_USAGE;
    };
  }
});
function encodeFrame(opcode, payload, opts = {}) {
  const mask = opts.mask ?? true;
  const len = payload.length;
  const lenBytes = len <= 125 ? 0 : len <= 65535 ? 2 : 8;
  const head = Buffer.alloc(2 + lenBytes + (mask ? 4 : 0));
  head[0] = (opts.fin === false ? 0 : 128) | opcode & 15;
  head[1] = (mask ? 128 : 0) | (lenBytes === 0 ? len : lenBytes === 2 ? 126 : 127);
  if (lenBytes === 2) head.writeUInt16BE(len, 2);
  if (lenBytes === 8) head.writeBigUInt64BE(BigInt(len), 2);
  if (!mask) return Buffer.concat([head, payload]);
  const key = opts.maskKey ?? randomBytes(4);
  key.copy(head, 2 + lenBytes);
  return Buffer.concat([head, unmask(payload, key)]);
}
function unmask(payload, key) {
  const out2 = Buffer.allocUnsafe(payload.length);
  for (let i = 0; i < payload.length; i++) out2[i] = payload[i] ^ key[i & 3];
  return out2;
}
async function connectWebSocket(url, opts = {}) {
  const { request } = await import("http");
  return new Promise((resolve9, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch {
      return reject(new Error(`bad WebSocket URL: ${url}`));
    }
    if (u.protocol !== "ws:") return reject(new Error(`only ws:// URLs are supported, got ${u.protocol}//`));
    const key = randomBytes(16).toString("base64");
    const expected = createHash("sha1").update(key + GUID).digest("base64");
    let settled = false;
    const settle = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const req = request({
      host: u.hostname.replace(/^\[|\]$/g, ""),
      port: u.port || 80,
      path: u.pathname + u.search,
      headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Key": key, "Sec-WebSocket-Version": "13" }
    });
    const timer = setTimeout(
      () => settle(() => {
        req.destroy();
        reject(new Error(`WebSocket connect timed out after ${opts.connectTimeoutMs ?? 1e4} ms`));
      }),
      opts.connectTimeoutMs ?? 1e4
    );
    req.on("upgrade", (res, socket, head) => {
      if (res.headers["sec-websocket-accept"] !== expected) {
        socket.destroy();
        return settle(() => reject(new Error("WebSocket handshake failed: bad Accept")));
      }
      settle(() => resolve9(new WsClient(socket, opts, head)));
    });
    req.on("response", (res) => {
      res.resume();
      settle(() => reject(new Error(`WebSocket handshake failed: HTTP ${res.statusCode}`)));
    });
    req.on("error", (e) => settle(() => reject(e)));
    req.end();
  });
}
var GUID;
var DEFAULT_MAX_MESSAGE;
var WsProtocolError;
var FrameParser;
var WsClient;
var init_ws = __esm({
  "src/browser/ws.ts"() {
    "use strict";
    GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    DEFAULT_MAX_MESSAGE = 64 * 1024 * 1024;
    WsProtocolError = class extends Error {
      constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "WsProtocolError";
      }
      code;
    };
    FrameParser = class {
      chunks = [];
      bytes = 0;
      max;
      constructor(opts = {}) {
        this.max = opts.maxMessageSize ?? DEFAULT_MAX_MESSAGE;
      }
      push(chunk) {
        if (chunk.length) {
          this.chunks.push(chunk);
          this.bytes += chunk.length;
        }
        const frames = [];
        for (; ; ) {
          const frame = this.next();
          if (!frame) return frames;
          frames.push(frame);
        }
      }
      /** Remove the next `n` buffered bytes, joined into one buffer of their own. */
      take(n) {
        const pieces = [];
        for (let left = n; left > 0; ) {
          const c = this.chunks[0];
          if (c.length <= left) {
            pieces.push(c);
            this.chunks.shift();
            left -= c.length;
          } else {
            pieces.push(c.subarray(0, left));
            this.chunks[0] = c.subarray(left);
            left = 0;
          }
        }
        this.bytes -= n;
        return Buffer.concat(pieces, n);
      }
      /** The first chunk, grown to hold at least the first `n` buffered bytes (a header split across chunks). */
      peek(n) {
        if (this.chunks[0].length < n) {
          const head = this.take(n);
          this.chunks.unshift(head);
          this.bytes += n;
        }
        return this.chunks[0];
      }
      next() {
        if (this.bytes < 2) return void 0;
        const b = this.peek(Math.min(this.bytes, 14));
        if (b.length < 2) return void 0;
        const masked = (b[1] & 128) !== 0;
        let len = b[1] & 127;
        let off = 2;
        if (len === 126) {
          if (b.length < 4) return void 0;
          len = b.readUInt16BE(2);
          off = 4;
        } else if (len === 127) {
          if (b.length < 10) return void 0;
          const big = b.readBigUInt64BE(2);
          if (big > BigInt(this.max)) throw new WsProtocolError("message too large", 1009);
          len = Number(big);
          off = 10;
        }
        if (len > this.max) throw new WsProtocolError("message too large", 1009);
        const total = off + (masked ? 4 : 0) + len;
        if (this.bytes < total) return void 0;
        const fin = (b[0] & 128) !== 0;
        const opcode = b[0] & 15;
        const key = masked ? Buffer.from(b.subarray(off, off + 4)) : void 0;
        this.take(off + (masked ? 4 : 0));
        const payload = this.take(len);
        if (key) for (let i = 0; i < payload.length; i++) payload[i] ^= key[i & 3];
        return { fin, opcode, payload };
      }
    };
    WsClient = class extends EventEmitter {
      constructor(socket, opts = {}, head = Buffer.alloc(0)) {
        super();
        this.socket = socket;
        this.max = opts.maxMessageSize ?? DEFAULT_MAX_MESSAGE;
        this.closeTimeoutMs = opts.closeTimeoutMs ?? 2e3;
        this.parser = new FrameParser({ maxMessageSize: this.max });
        socket.on("data", (d) => this.feed(d));
        socket.on("error", (e) => this.fail(e, 1006));
        socket.on("close", () => this.finish(1006, ""));
        socket.pause();
        setImmediate(() => {
          if (head.length) this.feed(head);
          socket.resume();
        });
      }
      socket;
      parser;
      max;
      closeTimeoutMs;
      fragments = [];
      fragmentBytes = 0;
      started = false;
      closing = false;
      done = false;
      send(text) {
        if (this.done || this.closing) throw new Error("WebSocket is not open");
        this.socket.write(encodeFrame(1, Buffer.from(text, "utf8")));
      }
      /** Send a close frame, then wait (bounded) for the peer to answer or hang up. */
      async close(code = 1e3, reason = "") {
        if (this.done) return;
        if (!this.closing) {
          this.closing = true;
          this.writeClose(code, reason);
        }
        await new Promise((resolve9) => {
          const timer = setTimeout(() => {
            this.socket.destroy();
            this.finish(code, reason);
          }, this.closeTimeoutMs);
          this.once("close", () => {
            clearTimeout(timer);
            resolve9();
          });
        });
      }
      /** Drop the socket without a closing handshake. */
      terminate() {
        this.socket.destroy();
        this.finish(1006, "");
      }
      writeClose(code, reason) {
        const payload = Buffer.alloc(2 + Buffer.byteLength(reason));
        payload.writeUInt16BE(code, 0);
        payload.write(reason, 2);
        if (!this.socket.destroyed) this.socket.write(encodeFrame(8, payload));
      }
      feed(chunk) {
        let frames;
        try {
          frames = this.parser.push(chunk);
        } catch (e) {
          this.fail(e, e instanceof WsProtocolError ? e.code : 1002);
          return;
        }
        for (const frame of frames) {
          if (this.done) return;
          let text;
          try {
            text = this.onFrame(frame);
          } catch (e) {
            this.fail(e, e instanceof WsProtocolError ? e.code : 1002);
            return;
          }
          if (text !== void 0) this.deliver(text);
        }
      }
      deliver(text) {
        try {
          this.emit("message", text);
        } catch (e) {
          if (this.listenerCount("error") > 0) this.emit("error", e);
          else
            process.nextTick(() => {
              throw e;
            });
        }
      }
      /** Handle one frame; returns the text of a message it completed. */
      onFrame(f) {
        if (this.done) return;
        switch (f.opcode) {
          case 9:
            if (!this.socket.destroyed) this.socket.write(encodeFrame(10, f.payload));
            return;
          case 10:
            return;
          case 8: {
            const code = f.payload.length >= 2 ? f.payload.readUInt16BE(0) : 1005;
            const reason = f.payload.subarray(2).toString("utf8");
            if (!this.closing) this.writeClose(f.payload.length >= 2 ? code : 1e3, "");
            this.socket.end();
            this.finish(code, reason);
            return;
          }
          case 1:
          case 2:
            if (this.started) throw new WsProtocolError("new data frame inside a fragmented message", 1002);
            this.started = true;
            break;
          case 0:
            if (!this.started) throw new WsProtocolError("unexpected continuation frame", 1002);
            break;
          default:
            throw new WsProtocolError(`unknown opcode ${f.opcode}`, 1002);
        }
        this.fragmentBytes += f.payload.length;
        if (this.fragmentBytes > this.max) throw new WsProtocolError("message too large", 1009);
        this.fragments.push(f.payload);
        if (!f.fin) return;
        const text = Buffer.concat(this.fragments).toString("utf8");
        this.fragments = [];
        this.fragmentBytes = 0;
        this.started = false;
        return text;
      }
      /** Protocol or socket failure: tell the peer why (when we can), surface the error, close. */
      fail(err, code) {
        if (this.done) return;
        if (code !== 1006 && !this.closing) {
          this.closing = true;
          this.writeClose(code, "");
        }
        if (this.listenerCount("error") > 0) this.emit("error", err);
        this.socket.end();
        this.finish(code, err.message);
      }
      finish(code, reason) {
        if (this.done) return;
        this.done = true;
        this.emit("close", { code, reason });
      }
    };
  }
});
var DEFAULT_CALL_TIMEOUT_MS;
var DEFAULT_CONNECT_TIMEOUT_MS;
var CdpError;
var defaultConnector;
var bucket;
var CdpClient;
var init_cdp = __esm({
  "src/browser/cdp.ts"() {
    "use strict";
    init_ws();
    DEFAULT_CALL_TIMEOUT_MS = 3e4;
    DEFAULT_CONNECT_TIMEOUT_MS = 1e4;
    CdpError = class extends Error {
      constructor(method, code, message) {
        super(`CDP ${method} failed: ${message}${code ? ` (${code})` : ""}`);
        this.method = method;
        this.code = code;
        this.name = "CdpError";
      }
      method;
      code;
    };
    defaultConnector = (url, { timeoutMs }) => connectWebSocket(url, { connectTimeoutMs: timeoutMs });
    bucket = (sessionId, method) => `${sessionId ?? ""}
${method}`;
    CdpClient = class _CdpClient {
      constructor(ws) {
        this.ws = ws;
        ws.on("message", (text) => this.onMessage(text));
        ws.on("close", () => this.onClosed());
        ws.on("error", () => {
        });
      }
      ws;
      nextId = 0;
      pending = /* @__PURE__ */ new Map();
      handlers = /* @__PURE__ */ new Map();
      closeHandlers = /* @__PURE__ */ new Set();
      isClosed = false;
      static async connect(wsUrl, opts = {}) {
        const connector = opts.transport ?? defaultConnector;
        return new _CdpClient(await connector(wsUrl, { timeoutMs: opts.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS }));
      }
      get closed() {
        return this.isClosed;
      }
      send(method, params, opts = {}) {
        if (this.isClosed) return Promise.reject(new Error(`CDP connection closed (${method})`));
        const id = ++this.nextId;
        const timeoutMs = opts.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
        return new Promise((resolve9, reject) => {
          const timer = setTimeout(() => {
            this.pending.delete(id);
            reject(new Error(`CDP command timed out: ${method} (${timeoutMs} ms)`));
          }, timeoutMs);
          this.pending.set(id, { method, resolve: resolve9, reject, timer });
          try {
            this.ws.send(JSON.stringify({ id, method, params, sessionId: opts.sessionId }));
          } catch (e) {
            clearTimeout(timer);
            this.pending.delete(id);
            reject(e);
          }
        });
      }
      on(method, handler, sessionId) {
        const key = bucket(sessionId, method);
        let set = this.handlers.get(key);
        if (!set) this.handlers.set(key, set = /* @__PURE__ */ new Set());
        set.add(handler);
      }
      off(method, handler, sessionId) {
        const key = bucket(sessionId, method);
        const set = this.handlers.get(key);
        if (!set) return;
        set.delete(handler);
        if (set.size === 0) this.handlers.delete(key);
      }
      /** Resolve with the params of the next matching event; reject on timeout or when the socket closes. */
      once(method, opts = {}) {
        const timeoutMs = opts.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
        return new Promise((resolve9, reject) => {
          const cleanup = () => {
            clearTimeout(timer);
            this.off(method, handler, opts.sessionId);
            this.closeHandlers.delete(onClose);
          };
          const handler = (params) => {
            if (opts.predicate && !opts.predicate(params)) return;
            cleanup();
            resolve9(params);
          };
          const onClose = () => {
            cleanup();
            reject(new Error(`CDP connection closed while waiting for ${method}`));
          };
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Timed out waiting for CDP event ${method} (${timeoutMs} ms)`));
          }, timeoutMs);
          this.on(method, handler, opts.sessionId);
          this.closeHandlers.add(onClose);
          if (this.isClosed) onClose();
        });
      }
      /** A view of this client bound to one session (`Target.attachToTarget({ flatten: true })`). */
      session(sessionId) {
        return {
          sessionId,
          send: (method, params, opts) => this.send(method, params, { ...opts, sessionId }),
          on: (method, handler) => this.on(method, handler, sessionId),
          off: (method, handler) => this.off(method, handler, sessionId),
          once: (method, opts) => this.once(method, { ...opts, sessionId })
        };
      }
      /** Run `handler` once the connection is closed (at once if it already is). Returns its unsubscribe. */
      onClose(handler) {
        if (this.isClosed) {
          handler();
          return () => {
          };
        }
        this.closeHandlers.add(handler);
        return () => void this.closeHandlers.delete(handler);
      }
      /** Close the connection (the browser keeps running). */
      async close() {
        if (this.isClosed) return;
        await this.ws.close();
        this.onClosed();
      }
      onMessage(text) {
        let msg;
        try {
          msg = JSON.parse(text);
        } catch {
          return;
        }
        if (msg === null || typeof msg !== "object") return;
        if (typeof msg.id === "number") {
          const p = this.pending.get(msg.id);
          if (!p) return;
          clearTimeout(p.timer);
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new CdpError(p.method, Number(msg.error.code) || 0, String(msg.error.message ?? "unknown error")));
          else p.resolve(msg.result);
          return;
        }
        if (typeof msg.method !== "string") return;
        const set = this.handlers.get(bucket(msg.sessionId, msg.method));
        if (!set) return;
        for (const h of [...set]) {
          try {
            h(msg.params);
          } catch {
          }
        }
      }
      onClosed() {
        if (this.isClosed) return;
        this.isClosed = true;
        for (const p of this.pending.values()) {
          clearTimeout(p.timer);
          p.reject(new Error(`CDP connection closed (${p.method})`));
        }
        this.pending.clear();
        for (const h of [...this.closeHandlers]) h();
        this.closeHandlers.clear();
      }
    };
  }
});
function challengePage(text) {
  const t = text.trim();
  if (!t || t.length >= CHALLENGE_MAX_CHARS) return void 0;
  const head = t.slice(0, 800);
  return CHALLENGE_PAGES.find(([re]) => re.test(head))?.[1];
}
function looksLikeJunkExtraction(text) {
  const t = text.trim();
  const challenge = challengePage(t);
  if (challenge) return challenge;
  if (t.length >= 2e3) return void 0;
  const head = t.slice(0, 800);
  const hits = JUNK_PATTERNS.filter(([re]) => re.test(head));
  const strong = hits.find(([, , kind]) => kind === "strong");
  if (!strong) return void 0;
  if (hits.length >= 2) return strong[1];
  const prose = t.split("\n").filter((l) => l.trim().length >= 60 && !JUNK_PATTERNS.some(([re]) => re.test(l))).length;
  return prose < 3 ? strong[1] : void 0;
}
var JUNK_PATTERNS;
var CHALLENGE_PAGES;
var CHALLENGE_MAX_CHARS;
var init_junk = __esm({
  "src/junk.ts"() {
    "use strict";
    JUNK_PATTERNS = [
      [/\b(accept|manage)\s+(all\s+)?cookies\b/i, "cookie/consent wall", "strong"],
      [/\bwe use cookies\b/i, "cookie/consent wall", "strong"],
      [/\bcookie (policy|settings|consent|preferences)\b/i, "cookie/consent wall", "weak"],
      [/\b(accept|reject|allow|decline) all\b/i, "cookie/consent wall", "weak"],
      [/\b(please )?enable javascript\b/i, "JavaScript-required shell", "strong"],
      [/\bjavascript is (disabled|required|not enabled)\b/i, "JavaScript-required shell", "strong"],
      [
        /\bverify(ing)? (that )?(you are|you're) (a )?(human|not a (ro)?bot)\b|\bmaking sure (you are|you're) not a (ro)?bot\b|\bare you a (human|robot)\b|\bhuman verification\b/i,
        "anti-bot interstitial",
        "strong"
      ],
      [/\battention required\b.*cloudflare|\bunusual traffic from your (computer )?network\b|\bchecking your browser\b/i, "anti-bot interstitial", "strong"],
      // Akamai's and Cloudflare's denials carry an incident reference; without one
      // the phrase is as likely a permission-error article.
      [/\baccess denied\b[\s\S]{0,300}?(\breference #|\bray id\b|\bpermission to access\b)/i, "anti-bot interstitial", "strong"],
      // Cloudflare's WAF block page. Its "Attention Required!" is the <title>,
      // which extraction drops, so the body's own wording has to carry it.
      [/\bsorry, you have been blocked\b|\byou are unable to access\b[\s\S]{0,300}?\bray id\b/i, "anti-bot interstitial", "strong"],
      [/\baccess denied\b|\benable cookies\b/i, "anti-bot interstitial", "weak"],
      // FR / DE (the locale layer targets non-EN markets)
      [/\bnous utilisons des cookies\b|\baccepter (tous )?les cookies\b|\bactiver javascript\b/i, "cookie/consent wall (fr)", "strong"],
      [/\bwir verwenden cookies\b|\bcookies akzeptieren\b|\bjavascript aktivieren\b/i, "cookie/consent wall (de)", "strong"]
    ];
    CHALLENGE_PAGES = [
      // Anubis (TecharoHQ): its <h1>, and its explanation of itself.
      [/^\W*(?:#+\s*)?making sure you(?:'|’| a)re not a bot\b/i, "anti-bot proof-of-work challenge"],
      [/\bset up anubis to protect (?:the|this) server\b|\bprotected by anubis\b/i, "anti-bot proof-of-work challenge"],
      // Apple's forums interstitial and its kin.
      [/^\W*(?:#+\s*)?security verification in progress\b|\bplease wait while we verify your browser\b/i, "anti-bot interstitial"]
    ];
    CHALLENGE_MAX_CHARS = 4e3;
  }
});
function browserFetchMode(explicit) {
  const m = (explicit ?? env("BROWSER_FETCH"))?.toLowerCase();
  return m === "always" || m === "fallback" ? m : "off";
}
function browserFetchModeFor(opts) {
  const m = browserFetchMode(opts.browser);
  return m === "off" && opts.human && opts.browser !== "off" ? "fallback" : m;
}
function worthRendering(res) {
  if (RENDER_STATUS.has(res.status)) return res.status ? `got HTTP ${res.status}` : "got no answer";
  if (res.status < 200 || res.status >= 300) return void 0;
  const junk = looksLikeJunkExtraction(res.text);
  if (junk) return `read a ${junk}`;
  return res.text.trim().length < 200 ? "found almost no text" : void 0;
}
function canShowWindow(platform2 = process.platform, env2 = process.env) {
  const ci = env2.CI?.trim().toLowerCase();
  if (ci && ci !== "false" && ci !== "0") return false;
  if (platform2 === "darwin" || platform2 === "win32") return true;
  return !!(env2.DISPLAY || env2.WAYLAND_DISPLAY);
}
function humanWall(text) {
  const junk = looksLikeJunkExtraction(text);
  if (junk && !junk.startsWith("JavaScript")) return junk;
  const t = text.trim();
  return t && t.length < LOGIN_WALL_MAX && LOGIN_WALL.test(t.slice(0, 800)) ? "login wall" : void 0;
}
var RENDER_STATUS;
var LOGIN_WALL;
var LOGIN_WALL_MAX;
var init_mode = __esm({
  "src/browser/mode.ts"() {
    "use strict";
    init_brand();
    init_junk();
    RENDER_STATUS = /* @__PURE__ */ new Set([0, 401, 403, 429, 503]);
    LOGIN_WALL = /\b(?:sign|log) ?in (?:to (?:continue|read|view|see|access|keep reading)|or (?:sign up|register|create an account))\b|\byou (?:must|need to|have to) (?:be )?(?:signed|logged) ?in\b|\bplease (?:sign|log) ?in\b/i;
    LOGIN_WALL_MAX = 1500;
  }
});
function humanAskMode(explicit) {
  const m = (explicit ?? env("HUMAN_ASK"))?.trim().toLowerCase();
  return m === "always" || m === "never" ? m : "ask";
}
function humanAskTimeoutMs() {
  return envInt("HUMAN_ASK_TIMEOUT_MS", HUMAN_ASK_TIMEOUT_MS, 1e4, 36e5);
}
async function humanLang(opts = {}) {
  const e = opts.env ?? process.env;
  for (const key of ["LC_ALL", "LC_MESSAGES", "LANG"]) {
    const v = e[key]?.trim();
    if (!v || /^(?:C|POSIX)(?:$|[.@])/i.test(v)) continue;
    return isFrench(v) ? "fr" : "en";
  }
  if ((opts.platform ?? process.platform) === "darwin") {
    const r = await (opts.run ?? shAsync)("defaults", ["read", "-g", "AppleLocale"], { timeoutMs: 5e3 });
    if (r.ok && r.stdout.trim()) return isFrench(r.stdout) ? "fr" : "en";
  }
  return isFrench(opts.defaultLocale ?? Intl.DateTimeFormat().resolvedOptions().locale) ? "fr" : "en";
}
function humanCheckLabel(check, lang = "en") {
  const t = (check ?? "").toLowerCase();
  const fr = lang === "fr";
  if (/captcha/.test(t)) return "CAPTCHA";
  const vendor = /\b(cloudflare|turnstile|datadome|perimeterx|akamai|imperva|arkose)\b/.exec(t)?.[1];
  if (vendor) return fr ? `v\xE9rification ${VENDORS[vendor]}` : `${VENDORS[vendor]} check`;
  if (/\b(?:log|sign) ?-?in\b|\bsignin\b/.test(t)) return fr ? "connexion requise" : "sign-in";
  if (/consent|cookie/.test(t)) return fr ? "bandeau de consentement" : "consent wall";
  return fr ? "v\xE9rification anti-robot" : "human check";
}
function hostOf(url) {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}
function humanAskText(pages, lang = "en", title = brand().name) {
  const fr = lang === "fr";
  const sites = /* @__PURE__ */ new Map();
  for (const p of pages) {
    const host = hostOf(p.url);
    const site = sites.get(host) ?? { labels: /* @__PURE__ */ new Set(), pages: 0 };
    site.labels.add(humanCheckLabel(p.check, lang));
    site.pages++;
    sites.set(host, site);
  }
  const lines = [...sites].slice(0, SITES_SHOWN).map(([host, s]) => {
    const n2 = s.pages > 1 ? ` (${s.pages} pages)` : "";
    return `\u2022 ${host} \u2014 ${[...s.labels].join(", ")}${n2}`;
  });
  const more = sites.size - SITES_SHOWN;
  if (more > 0) lines.push(fr ? `\u2022 et ${more} autre(s) site(s)` : `\u2022 and ${more} more site(s)`);
  const n = pages.length;
  const head = fr ? n === 1 ? "Une page est bloqu\xE9e par une v\xE9rification humaine :" : `${n} pages sont bloqu\xE9es par une v\xE9rification humaine :` : n === 1 ? "A page is stopped by a human check:" : `${n} pages are stopped by a human check:`;
  const solve = fr ? "R\xE9soudre" : "Solve it";
  const later = fr ? "Plus tard" : "Later";
  const what = fr ? `${solve} : le navigateur passe au premier plan sur chaque page, l'une apr\xE8s l'autre ; passez la v\xE9rification et la suite se fait toute seule.
${later} : rien ne s'affiche, les pages restent de c\xF4t\xE9 pour plus tard.` : `${solve}: the browser comes forward on each page in turn; get past the check there and the rest goes on by itself.
${later}: nothing comes forward; the pages are left for later.`;
  return {
    title,
    message: `${head}
${lines.join("\n")}

${what}`,
    solve,
    later,
    done: (cleared, total) => fr ? `${cleared} page(s) sur ${total} d\xE9bloqu\xE9e(s) \u2014 la suite continue.` : `Got past ${cleared} of ${total} page(s) \u2014 the run goes on.`
  };
}
async function askMac(a) {
  const { text } = a;
  const args = [...MAC_DIALOG.flatMap((l) => ["-e", l]), text.message, text.title, text.later, text.solve, String(a.secs)];
  const r = await a.run("osascript", args, { timeoutMs: a.timeoutMs + GRACE_MS });
  if (r.status === 124) return "no-answer";
  if (r.missing || /-1713\b/.test(r.stderr)) return "unavailable";
  if (!r.ok) return "no-answer";
  const out2 = r.stdout.trim();
  if (out2 === text.solve) return "solve";
  if (out2 === text.later) return "later";
  return "no-answer";
}
async function askLinux(a) {
  const { text } = a;
  if (a.has("zenity")) {
    const r = await a.run(
      "zenity",
      [
        "--question",
        "--no-markup",
        `--title=${text.title}`,
        `--text=${text.message}`,
        `--ok-label=${text.solve}`,
        `--cancel-label=${text.later}`,
        `--timeout=${a.secs}`
      ],
      { timeoutMs: a.timeoutMs + GRACE_MS }
    );
    if (!r.missing) {
      if (r.status === 0) return "solve";
      if (r.status === 1) return "later";
      if (r.status === 5 || r.status === 124) return "no-answer";
    }
  }
  if (a.has("kdialog")) {
    const r = await a.run("kdialog", ["--title", text.title, "--yes-label", text.solve, "--no-label", text.later, "--warningyesno", text.message], {
      timeoutMs: a.timeoutMs
    });
    if (!r.missing) {
      if (r.status === 0) return "solve";
      if (r.status === 1) return "later";
      if (r.status === 124) return "no-answer";
    }
  }
  if (a.has("notify-send")) {
    const r = await a.run(
      "notify-send",
      [
        `--app-name=${text.title}`,
        "--urgency=critical",
        `--expire-time=${a.timeoutMs}`,
        `--action=solve=${text.solve}`,
        `--action=later=${text.later}`,
        "--wait",
        text.title,
        text.message
      ],
      { timeoutMs: a.timeoutMs + GRACE_MS }
    );
    if (r.status === 124) return "no-answer";
    if (r.ok) {
      const out2 = r.stdout.trim();
      return out2 === "solve" ? "solve" : out2 === "later" ? "later" : "no-answer";
    }
  }
  return "unavailable";
}
async function askWindows(a, lang) {
  const { text } = a;
  const legend = lang === "fr" ? `Oui : ${text.solve.toLowerCase()} \xB7 Non : ${text.later.toLowerCase()}` : `Yes: ${text.solve.toLowerCase()} \xB7 No: ${text.later.toLowerCase()}`;
  const r = await a.run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", WIN_POPUP], {
    timeoutMs: a.timeoutMs + GRACE_MS,
    env: { ...process.env, HUMAN_ASK_TEXT: `${text.message}

${legend}`, HUMAN_ASK_SECS: String(a.secs), HUMAN_ASK_TITLE: text.title }
  });
  if (r.status === 124) return "no-answer";
  if (!r.ok) return "unavailable";
  const out2 = r.stdout.trim();
  return out2 === "6" ? "solve" : out2 === "7" ? "later" : out2 === "-1" ? "no-answer" : "unavailable";
}
async function askHuman(pages, opts = {}) {
  const platform2 = opts.platform ?? process.platform;
  const e = opts.env ?? process.env;
  if (!pages.length || !canShowWindow(platform2, e)) return "unavailable";
  const run = opts.run ?? ((cmd, args, o) => shAsync(cmd, args, o));
  try {
    const lang = opts.lang ?? await humanLang({ platform: platform2, env: e, run, ...opts.defaultLocale ? { defaultLocale: opts.defaultLocale } : {} });
    const timeoutMs = opts.timeoutMs ?? humanAskTimeoutMs();
    const asking2 = {
      text: humanAskText(pages, lang, opts.title),
      secs: Math.max(1, Math.round(timeoutMs / 1e3)),
      timeoutMs,
      run,
      has: opts.have ?? have
    };
    if (platform2 === "darwin") return await askMac(asking2);
    if (platform2 === "win32") return await askWindows(asking2, lang);
    return await askLinux(asking2);
  } catch {
    return "unavailable";
  }
}
async function notifyHuman(message, opts = {}) {
  const platform2 = opts.platform ?? process.platform;
  if (!canShowWindow(platform2, opts.env ?? process.env)) return false;
  const run = opts.run ?? ((cmd, args, o) => shAsync(cmd, args, o));
  const title = opts.title ?? brand().name;
  try {
    if (platform2 === "darwin") {
      const script = ["on run argv", 'display notification (item 1 of argv) with title (item 2 of argv) sound name "Glass"', "end run"];
      return (await run("osascript", [...script.flatMap((l) => ["-e", l]), message, title], { timeoutMs: 1e4 })).ok;
    }
    if (platform2 !== "win32" && (opts.have ?? have)("notify-send")) {
      return (await run("notify-send", [`--app-name=${title}`, "--expire-time=6000", title, message], { timeoutMs: 1e4 })).ok;
    }
  } catch {
  }
  return false;
}
async function notifyHumanDone(cleared, total, opts = {}) {
  const platform2 = opts.platform ?? process.platform;
  const e = opts.env ?? process.env;
  if (!canShowWindow(platform2, e)) return false;
  const run = opts.run ?? ((cmd, args, o) => shAsync(cmd, args, o));
  const lang = opts.lang ?? await humanLang({ platform: platform2, env: e, run, ...opts.defaultLocale ? { defaultLocale: opts.defaultLocale } : {} }).catch(() => "en");
  const { lang: _l, defaultLocale: _d, ...rest } = opts;
  return notifyHuman(humanAskText([], lang, opts.title).done(cleared, total), { ...rest, platform: platform2, env: e, run });
}
var HUMAN_ASK_TIMEOUT_MS;
var GRACE_MS;
var isFrench;
var VENDORS;
var SITES_SHOWN;
var MAC_DIALOG;
var WIN_POPUP;
var init_ask = __esm({
  "src/ask.ts"() {
    "use strict";
    init_brand();
    init_mode();
    init_exec2();
    HUMAN_ASK_TIMEOUT_MS = 12e4;
    GRACE_MS = 15e3;
    isFrench = (locale) => /^fr(?:$|[_.@-])/i.test(locale.trim());
    VENDORS = {
      cloudflare: "Cloudflare",
      turnstile: "Cloudflare",
      datadome: "DataDome",
      perimeterx: "PerimeterX",
      akamai: "Akamai",
      imperva: "Imperva",
      arkose: "Arkose"
    };
    SITES_SHOWN = 5;
    MAC_DIALOG = [
      "on run argv",
      // osascript is no app of its own: brought to the front, or the dialog may open behind the window in use.
      "activate",
      "beep",
      "set r to display dialog (item 1 of argv) with title (item 2 of argv) buttons {item 3 of argv, item 4 of argv} default button 2 with icon caution giving up after ((item 5 of argv) as integer)",
      'if gave up of r then return "gave-up"',
      "return button returned of r",
      "end run"
    ];
    WIN_POPUP = "$s = New-Object -ComObject WScript.Shell; [Console]::Out.Write($s.Popup($env:HUMAN_ASK_TEXT, [int]$env:HUMAN_ASK_SECS, $env:HUMAN_ASK_TITLE, 4132))";
  }
});
function isLaunchable(path) {
  try {
    if (!statSync2(path).isFile()) return false;
    if (process.platform !== "win32") accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
function candidates(kind, platform2, sys, home) {
  if (platform2 === "darwin") {
    const app = MAC_APPS[kind];
    return ["/Applications", posix.join(home, "Applications")].map((dir) => posix.join(dir, `${app}.app`, "Contents", "MacOS", app));
  }
  if (platform2 === "win32") {
    const roots = [sys.ProgramFiles, sys["ProgramFiles(x86)"], sys.LOCALAPPDATA].filter((r) => !!r);
    return roots.map((root) => win32.join(root, WINDOWS_PATHS[kind]));
  }
  const dirs = (sys.PATH ?? "").split(":").filter(Boolean);
  return LINUX_NAMES[kind].flatMap((name) => dirs.map((dir) => posix.join(dir, name)));
}
function kindOf(path) {
  const name = (path.split(/[\\/]/).pop() ?? "").toLowerCase();
  if (name.includes("brave")) return "brave";
  if (name.includes("edge")) return "edge";
  if (name.includes("chromium")) return "chromium";
  return "chrome";
}
function detectBrowserBinary(opts = {}) {
  const platform2 = opts.platform ?? process.platform;
  const sys = opts.processEnv ?? process.env;
  const exists = opts.exists ?? isLaunchable;
  const home = opts.home ?? homedir();
  const explicit = opts.env ? opts.env("BROWSER_BIN") : env("BROWSER_BIN");
  if (explicit) {
    const bare = !/[\\/]/.test(explicit);
    const win = platform2 === "win32";
    const names = win && !/\.[a-z0-9]+$/i.test(explicit) ? [explicit, `${explicit}.exe`] : [explicit];
    const options = bare ? (sys.PATH ?? (win ? sys.Path : void 0) ?? "").split(win ? ";" : ":").filter(Boolean).flatMap((d) => names.map((n) => (win ? win32 : posix).join(d, n))) : [explicit];
    const found = options.find(exists);
    if (!found) throw new Error(`BROWSER_BIN points at "${explicit}", which is not an executable file`);
    return { kind: kindOf(found), path: found };
  }
  let only = opts.kind;
  if (!only && !opts.prefer) {
    const asked = (opts.env ? opts.env("BROWSER_KIND") : env("BROWSER_KIND"))?.trim().toLowerCase();
    if (asked && !isBrowserKind(asked)) throw new Error(`${envName("BROWSER_KIND")} is "${asked}", not one of ${ORDER.join(", ")}`);
    if (asked && isBrowserKind(asked)) only = asked;
  }
  const prefer = opts.prefer;
  const kinds = only ? [only] : prefer ? [prefer, ...ORDER.filter((k) => k !== prefer)] : ORDER;
  for (const kind of kinds) {
    const path = candidates(kind, platform2, sys, home).find(exists);
    if (path) return { kind, path };
  }
  return null;
}
function ignoresUnpackedExtensions(bin, browserVersion) {
  if (bin.kind !== "chrome" || /for[ _-]?testing|[\\/]chrome-(?:linux|mac|win)[^\\/]*[\\/]/i.test(bin.path)) return false;
  if (browserVersion === void 0) return true;
  const major = /^(?:Headless)?Chrome\/(\d+)\./.exec(browserVersion)?.[1];
  return major !== void 0 && Number(major) >= 137;
}
var ORDER;
var isBrowserKind;
var MAC_APPS;
var LINUX_NAMES;
var WINDOWS_PATHS;
var init_detect = __esm({
  "src/browser/detect.ts"() {
    "use strict";
    init_brand();
    ORDER = ["chrome", "brave", "chromium", "edge"];
    isBrowserKind = (v) => ORDER.includes(v);
    MAC_APPS = {
      chrome: "Google Chrome",
      brave: "Brave Browser",
      chromium: "Chromium",
      edge: "Microsoft Edge"
    };
    LINUX_NAMES = {
      chrome: ["google-chrome", "google-chrome-stable"],
      brave: ["brave-browser"],
      chromium: ["chromium", "chromium-browser"],
      edge: ["microsoft-edge"]
    };
    WINDOWS_PATHS = {
      chrome: "Google\\Chrome\\Application\\chrome.exe",
      brave: "BraveSoftware\\Brave-Browser\\Application\\brave.exe",
      chromium: "Chromium\\Application\\chrome.exe",
      edge: "Microsoft\\Edge\\Application\\msedge.exe"
    };
  }
});
var discovery_exports = {};
__export(discovery_exports, {
  activateTarget: () => activateTarget,
  assertLoopback: () => assertLoopback,
  closeTarget: () => closeTarget,
  dialHost: () => dialHost,
  getVersion: () => getVersion,
  isPortAlive: () => isPortAlive,
  listPages: () => listPages,
  listTargets: () => listTargets,
  loopbackSocketUrl: () => loopbackSocketUrl,
  parseCdpEndpoint: () => parseCdpEndpoint
});
function assertLoopback(host) {
  const bare = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!LOOPBACK.has(bare)) throw new Error(`refusing non-loopback DevTools host "${host}" (only 127.0.0.1, ::1 and localhost are allowed)`);
  return bare;
}
function loopbackSocketUrl(wsUrl) {
  let url;
  try {
    url = new URL(wsUrl);
  } catch {
    throw new Error(`invalid DevTools WebSocket URL "${wsUrl}"`);
  }
  if (url.protocol !== "ws:") throw new Error(`refusing DevTools WebSocket URL "${wsUrl}": only ws:// on loopback is dialled`);
  assertLoopback(url.hostname);
  return wsUrl;
}
function parseCdpEndpoint(input) {
  const text = input.trim();
  if (/^\d+$/.test(text)) return { host: "127.0.0.1", port: checkPort(Number(text), input) };
  let url;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `http://${text}`);
  } catch {
    throw new Error(`invalid DevTools endpoint "${input}"`);
  }
  if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) throw new Error(`unsupported DevTools endpoint scheme "${url.protocol}" in "${input}"`);
  const host = assertLoopback(url.hostname);
  if (!url.port) throw new Error(`DevTools endpoint "${input}" has no port`);
  const endpoint = { host, port: checkPort(Number(url.port), input) };
  if (url.protocol === "ws:" || url.protocol === "wss:") endpoint.wsUrl = text;
  return endpoint;
}
function checkPort(port, input) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`invalid port in DevTools endpoint "${input}"`);
  return port;
}
function dialHost(host) {
  const bare = assertLoopback(host);
  return bare === "localhost" ? "127.0.0.1" : bare;
}
async function http(method, port, host, path, timeoutMs = REQUEST_TIMEOUT_MS) {
  const { request } = await import("http");
  return new Promise((resolve9, reject) => {
    const req = request({ host: dialHost(host), port, path, method, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve9({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error(`DevTools request ${method} ${path} timed out after ${timeoutMs} ms`)));
    req.on("error", reject);
    req.end();
  });
}
async function json(method, port, host, path) {
  const { status, body } = await http(method, port, host, path);
  if (status < 200 || status >= 300) throw new Error(`DevTools ${method} ${path} answered HTTP ${status}`);
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`DevTools ${path} did not return valid JSON`);
  }
}
function getVersion(port, host = "127.0.0.1") {
  return json("GET", port, host, "/json/version");
}
function listTargets(port, host = "127.0.0.1") {
  return json("GET", port, host, "/json/list");
}
async function listPages(port, host = "127.0.0.1") {
  return (await listTargets(port, host)).filter((t) => t.type === "page");
}
async function command(port, host, path) {
  const { status, body } = await http("GET", port, host, path);
  if (status < 200 || status >= 300) throw new Error(`DevTools GET ${path} answered HTTP ${status}`);
  return body;
}
async function closeTarget(port, id, host = "127.0.0.1") {
  await command(port, host, `/json/close/${encodeURIComponent(id)}`);
}
async function activateTarget(port, id, host = "127.0.0.1") {
  await command(port, host, `/json/activate/${encodeURIComponent(id)}`);
}
async function isPortAlive(port, host = "127.0.0.1") {
  try {
    const { status } = await http("GET", port, host, "/json/version", ALIVE_TIMEOUT_MS);
    return status === 200;
  } catch {
    return false;
  }
}
var REQUEST_TIMEOUT_MS;
var ALIVE_TIMEOUT_MS;
var LOOPBACK;
var init_discovery = __esm({
  "src/browser/discovery.ts"() {
    "use strict";
    REQUEST_TIMEOUT_MS = 3e3;
    ALIVE_TIMEOUT_MS = 1e3;
    LOOPBACK = /* @__PURE__ */ new Set(["127.0.0.1", "::1", "localhost"]);
  }
});
function browserHome() {
  return env("BROWSER_DIR") ?? brand().browserDir ?? join8(homedir2(), `.${brand().name}`, "browser");
}
function checkName(name) {
  if (!PROFILE_NAME.test(name) || name === "." || name === "..") {
    throw new UsageError(`invalid profile name ${JSON.stringify(name)} (1-64 of letters, digits, ".", "_", "-")`);
  }
}
function profileDir(name = "default") {
  checkName(name);
  return join8(browserHome(), "profiles", name);
}
function profileKindFile(name = "default") {
  return join8(profileDir(name), `.${brand().name}-kind`);
}
function readProfileKind(name = "default") {
  try {
    const kind = readFileSync7(profileKindFile(name), "utf8").trim();
    return isBrowserKind(kind) ? kind : void 0;
  } catch {
    return void 0;
  }
}
function writeProfileKind(name, kind) {
  ensurePrivateDir(profileDir(name));
  writeFileSync5(profileKindFile(name), `${kind}
`, { mode: 384 });
}
function ensurePrivateDir(path) {
  try {
    mkdirSync4(path, { recursive: true, mode: 448 });
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  const st = lstatSync2(path);
  if (st.isSymbolicLink()) throw new Error(`${path} is a symbolic link`);
  if (!st.isDirectory()) throw new Error(`${path} is not a directory`);
  if (typeof process.getuid === "function" && st.uid !== process.getuid()) {
    throw new Error(`${path} belongs to another user`);
  }
  if (process.platform === "win32") return;
  if (st.mode & 18) throw new Error(`${path} is writable by other users`);
  if (st.mode & 63) chmodSync2(path, 448);
}
var PROFILE_NAME;
var init_profile = __esm({
  "src/browser/profile.ts"() {
    "use strict";
    init_brand();
    init_cli_kit();
    init_detect();
    PROFILE_NAME = /^[A-Za-z0-9._-]{1,64}$/;
  }
});
function checkTargetId(id) {
  if (!/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(id)) throw new Error(`invalid target id: ${JSON.stringify(id)}`);
  return id;
}
function readJson2(path) {
  try {
    return JSON.parse(readFileSync8(path, "utf8"));
  } catch {
    return null;
  }
}
function writeJson(dir, name, value) {
  ensurePrivateDir(dir);
  writeFileAtomic(join9(dir, name), `${JSON.stringify(value)}
`, FILE_MODE);
}
function readSession(o) {
  const v = readJson2(join9(homeOf(o), "session.json"));
  if (!isObj(v) || v.version !== 1 || typeof v.port !== "number" || typeof v.targetId !== "string") return null;
  return v;
}
function writeSession(s, o) {
  if (isNoWrite()) return;
  writeJson(homeOf(o), "session.json", s);
}
function clearSession(o) {
  if (isNoWrite()) return;
  rmSync5(join9(homeOf(o), "session.json"), { force: true });
}
function clearRefs(targetId, o) {
  const id = targetId === void 0 ? void 0 : checkTargetId(targetId);
  if (isNoWrite()) return;
  const dir = join9(homeOf(o), "refs");
  rmSync5(id === void 0 ? dir : join9(dir, `${id}.json`), { recursive: true, force: true });
}
function clearNetwork(targetId, o) {
  const path = targetId === void 0 ? join9(homeOf(o), "network") : networkFile(targetId, o);
  if (isNoWrite()) return;
  rmSync5(path, { recursive: true, force: true });
}
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
function readOrNull(path) {
  try {
    return readFileSync8(path, "utf8");
  } catch {
    return null;
  }
}
function judgeLock(path, staleMs, now) {
  const raw = readOrNull(path);
  return { reason: staleReason(path, raw, staleMs, now), raw };
}
function staleReason(path, raw, staleMs, now) {
  let at;
  let pid;
  try {
    const held = JSON.parse(raw ?? "");
    pid = held.pid;
    at = typeof held.at === "number" ? held.at : Number.NaN;
  } catch {
    at = Number.NaN;
  }
  if (Number.isNaN(at)) {
    try {
      at = statSync4(path).mtimeMs;
    } catch {
      return "gone";
    }
  }
  if (now - at > staleMs) return "old";
  if (typeof pid === "number" && !pidAlive(pid)) return "dead";
  return null;
}
function moveAsideStale(path, judged, token) {
  const aside = `${path}.${token}.stale`;
  try {
    renameSync3(path, aside);
  } catch (e) {
    if (e.code === "ENOENT") return;
    throw e;
  }
  try {
    if (readOrNull(aside) === judged) return;
    try {
      linkSync(aside, path);
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
  } finally {
    rmSync5(aside, { force: true });
  }
}
function holds(path, token) {
  try {
    const held = JSON.parse(readFileSync8(path, "utf8"));
    return held.pid === process.pid && held.token === token;
  } catch {
    return false;
  }
}
async function withBrowserLock(fn, opts = {}) {
  if (isNoWrite()) return fn();
  const { staleMs = 3e4, waitMs = 1e4, pollMs = 50 } = opts;
  const { now, sleep: sleep2 } = opts.deps ?? realDeps;
  const dir = homeOf(opts);
  ensurePrivateDir(dir);
  const path = join9(dir, "lock");
  const token = randomUUID2();
  const stamp = () => JSON.stringify({ pid: process.pid, at: now(), token });
  const deadline = now() + waitMs;
  for (; ; ) {
    try {
      const fd = openSync(path, "wx", FILE_MODE);
      try {
        writeSync(fd, stamp());
      } finally {
        closeSync(fd);
      }
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
    const judged = judgeLock(path, staleMs, now());
    if (judged.reason) {
      moveAsideStale(path, judged.raw, token);
      continue;
    }
    if (now() >= deadline) throw new Error(`browser busy: another webindex command holds ${path} (waited ${waitMs} ms)`);
    await sleep2(pollMs);
  }
  const beat = setInterval(
    () => {
      if (!holds(path, token)) return;
      try {
        writeFileAtomic(path, stamp(), FILE_MODE);
      } catch {
      }
    },
    Math.max(1e3, staleMs / 3)
  );
  beat.unref?.();
  try {
    return await fn();
  } finally {
    clearInterval(beat);
    try {
      if (holds(path, token)) unlinkSync2(path);
    } catch {
    }
  }
}
var FILE_MODE;
var homeOf;
var isObj;
var networkFile;
var realDeps;
var init_state = __esm({
  "src/browser/state.ts"() {
    "use strict";
    init_no_write();
    init_profile();
    FILE_MODE = 384;
    homeOf = (o) => o?.home ?? browserHome();
    isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
    networkFile = (targetId, o) => join9(homeOf(o), "network", `${checkTargetId(targetId)}.jsonl`);
    realDeps = {
      now: () => Date.now(),
      sleep: (ms) => new Promise((r) => setTimeout(r, ms))
    };
  }
});
function defaultBrowserDeps() {
  return {
    spawn: (cmd, args, opts) => nodeSpawn(cmd, args, opts),
    fs: { readFile, writeFile, rename, mkdir, rm, stat, open },
    now: () => Date.now(),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    connectCdp: (wsUrl) => CdpClient.connect(wsUrl),
    discovery: discovery_exports,
    detectBrowser: (kind) => detectBrowserBinary(kind ? { kind } : {}),
    kill: (pid, signal) => void process.kill(pid, signal),
    alive: pidAlive,
    env: (name) => env(name),
    platform: process.platform,
    askHuman: (pages) => askHuman(pages),
    notifyHuman: (cleared, total) => notifyHumanDone(cleared, total)
  };
}
function browserDeps(own) {
  return { ...defaultBrowserDeps(), ...own };
}
var init_deps = __esm({
  "src/browser/deps.ts"() {
    "use strict";
    init_ask();
    init_brand();
    init_cdp();
    init_detect();
    init_discovery();
    init_state();
  }
});
function extensionDirs(raw) {
  const name = envName("BROWSER_EXTENSIONS");
  return (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean).map((dir) => {
    if (!isAbsolute2(dir)) throw new UsageError(`${name} takes absolute paths, not ${JSON.stringify(dir)}`);
    let isDir = false;
    try {
      isDir = statSync5(dir).isDirectory();
    } catch {
    }
    if (!isDir) throw new UsageError(`${name}: no such directory: ${dir}`);
    if (!existsSync7(join10(dir, "manifest.json"))) {
      throw new UsageError(`${name}: ${dir} has no manifest.json \u2014 name the unpacked extension's own folder, the one that holds manifest.json`);
    }
    return dir;
  });
}
function extensionArgs(dirs) {
  if (dirs.length === 0) return [];
  const list = dirs.join(",");
  return [`--load-extension=${list}`, `--disable-extensions-except=${list}`];
}
var unpackedIgnoredNote;
var init_extensions = __esm({
  "src/browser/extensions.ts"() {
    "use strict";
    init_brand();
    init_cli_kit();
    unpackedIgnoredNote = () => `Google Chrome \u2265 137 ignores unpacked extensions \u2014 use Brave (built-in ad/tracker blocking: ${envName("BROWSER_KIND")}=brave), Chromium or Chrome for Testing`;
  }
});
async function resolveEndpoint(opts = {}) {
  const deps = browserDeps(opts.deps);
  const profile = opts.profile ?? "default";
  const headless = opts.headless ?? false;
  if (opts.cdp !== void 0) {
    let host;
    let port;
    try {
      const ep = parseCdpEndpoint(String(opts.cdp));
      host = dialHost(ep.host);
      port = ep.port;
    } catch (e) {
      throw new UsageError(e.message);
    }
    if (!await deps.discovery.isPortAlive(port, host)) throw new Error(`nothing answers DevTools on ${host}:${port}`);
    return { host, port, launchedByUs: false, profile, headless };
  }
  const saved = readSession();
  const usable = saved && (saved.launchedByUs ? opts.profile === void 0 || saved.profile === opts.profile : opts.profile === void 0 && !opts.ownOnly);
  if (saved && usable) {
    const host = saved.host ?? "127.0.0.1";
    const same = saved.wsBrowserUrl ? await isSameBrowser(deps, saved.port, host, saved.wsBrowserUrl) : !saved.launchedByUs && await deps.discovery.isPortAlive(saved.port, host);
    if (same) {
      return {
        host,
        port: saved.port,
        launchedByUs: saved.launchedByUs,
        ...saved.pid !== void 0 ? { pid: saved.pid } : {},
        profile: saved.profile,
        headless: saved.headless
      };
    }
    clearSession();
  }
  return launch(deps, opts.binary, profile, headless, opts.kind, opts.quiet === true);
}
function readWindowSize(deps) {
  const m = /^\s*(\d{3,4})\s*[x,]\s*(\d{3,4})\s*$/i.exec(deps.env("BROWSER_WINDOW") ?? "");
  const clamp = (n) => Math.min(4e3, Math.max(200, n));
  return m ? { width: clamp(Number(m[1])), height: clamp(Number(m[2])) } : { width: 800, height: 600 };
}
function wantedKind(deps, kind, profile) {
  if (kind) return kind;
  const asked = deps.env("BROWSER_KIND")?.trim().toLowerCase();
  if (asked && !isBrowserKind(asked)) throw new UsageError(`${envName("BROWSER_KIND")} is "${asked}", not one of chrome, brave, chromium, edge`);
  return asked && isBrowserKind(asked) ? asked : readProfileKind(profile);
}
async function launch(deps, binary, profile, headless, kind, quiet) {
  const wanted = binary ? void 0 : wantedKind(deps, kind, profile);
  const found = binary ? { kind: kindOf(binary), path: binary } : deps.detectBrowser(wanted);
  if (!found && wanted) throw new UsageError(`no ${wanted} found: install it, or name its executable with ${envName("BROWSER_BIN")}`);
  if (!found) {
    throw new Error(`no Chrome, Brave, Chromium or Edge found: install one, or set ${envName("BROWSER_BIN")} to the browser's executable`);
  }
  const bin = found.path;
  const dir = profileDir(profile);
  ensurePrivateDir(browserHome());
  ensurePrivateDir(join11(browserHome(), "profiles"));
  ensurePrivateDir(dir);
  const portFile = join11(dir, "DevToolsActivePort");
  const running = await readActivePort(deps, portFile);
  if (running && await isSameBrowser(deps, running.port, "127.0.0.1", running.path)) {
    return { host: "127.0.0.1", port: running.port, launchedByUs: true, profile, headless };
  }
  const owner = readProfileKind(profile);
  if (owner && owner !== found.kind) {
    const named = binary !== void 0 || !!deps.env("BROWSER_BIN");
    const hint = named ? `; ${envName("BROWSER_BIN")} names a ${found.kind} binary` : `, or ${owner} (\`--browser-kind ${owner}\`)`;
    throw new UsageError(
      `the profile "${profile}" belongs to ${owner} (its logins are encrypted for that browser), not ${found.kind}: use a profile of its own (\`--profile ${found.kind}\`)${hint}`
    );
  }
  const extensions = extensionDirs(deps.env("BROWSER_EXTENSIONS"));
  const dropped = extensions.length > 0 && ignoresUnpackedExtensions(found);
  await deps.fs.rm(portFile, { force: true });
  const args = [
    "--remote-debugging-port=0",
    `--user-data-dir=${dir}`,
    "--no-first-run",
    "--no-default-browser-check",
    ...dropped ? [] : extensionArgs(extensions)
  ];
  if (headless) args.push("--headless=new", "about:blank");
  else if (quiet && deps.platform === "darwin") args.push(...KEEP_RENDERING, "--no-startup-window");
  else if (quiet) {
    const { width, height } = readWindowSize(deps);
    args.push(...KEEP_RENDERING, `--window-size=${width},${height}`, "about:blank");
  } else args.push(...KEEP_RENDERING, "about:blank");
  const child = deps.spawn(bin, args, { detached: true, stdio: "ignore" });
  let failure2;
  child.on("exit", (code, signal) => {
    const how = code !== null ? `code ${code}` : `signal ${signal}`;
    const hint = code === 0 ? `; is a browser already running on the profile ${dir}?` : "";
    failure2 = `the browser exited before exposing a DevTools port (${how}${hint})`;
  });
  child.on("error", (err) => {
    failure2 = `could not start ${bin}: ${err.message}`;
  });
  child.unref();
  const deadline = deps.now() + STARTUP_TIMEOUT_MS;
  for (; ; ) {
    const active2 = await readActivePort(deps, portFile);
    if (active2 && await isSameBrowser(deps, active2.port, "127.0.0.1", active2.path)) {
      const port = active2.port;
      if (!owner) {
        try {
          writeProfileKind(profile, found.kind);
        } catch {
        }
      }
      const notes = dropped ? [unpackedIgnoredNote()] : [];
      return {
        host: "127.0.0.1",
        port,
        launchedByUs: true,
        spawned: true,
        ...child.pid !== void 0 ? { pid: child.pid } : {},
        profile,
        headless,
        ...notes.length ? { notes } : {}
      };
    }
    if (failure2) throw new Error(failure2);
    if (deps.now() >= deadline) {
      child.kill("SIGTERM");
      throw new Error(`${bin} did not expose a DevTools port within ${STARTUP_TIMEOUT_MS / 1e3} s (no usable ${portFile})`);
    }
    await deps.sleep(POLL_MS);
  }
}
async function readActivePort(deps, file) {
  let text;
  try {
    text = await deps.fs.readFile(file, "utf8");
  } catch {
    return void 0;
  }
  const [first = "", second = ""] = text.split("\n");
  const port = Number(first.trim());
  const path = second.trim();
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !path) return void 0;
  return { port, path };
}
function socketPath(urlOrPath) {
  try {
    return new URL(urlOrPath).pathname;
  } catch {
    return urlOrPath;
  }
}
async function isSameBrowser(deps, port, host, wsBrowserUrl) {
  try {
    const { webSocketDebuggerUrl } = await deps.discovery.getVersion(port, host);
    return socketPath(webSocketDebuggerUrl) === socketPath(wsBrowserUrl);
  } catch {
    return false;
  }
}
var STARTUP_TIMEOUT_MS;
var POLL_MS;
var KEEP_RENDERING;
var init_launch = __esm({
  "src/browser/launch.ts"() {
    "use strict";
    init_brand();
    init_cli_kit();
    init_deps();
    init_detect();
    init_discovery();
    init_extensions();
    init_profile();
    init_state();
    STARTUP_TIMEOUT_MS = 2e4;
    POLL_MS = 100;
    KEEP_RENDERING = ["--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"];
  }
});
function cleanTabs(v) {
  const out2 = {};
  if (typeof v !== "object" || v === null) return out2;
  for (const [id, targetId] of Object.entries(v)) if (TAB_ID.test(id) && typeof targetId === "string") out2[id] = targetId;
  return out2;
}
function syncTabs(map, pages) {
  const live = new Set(pages.map((p) => p.id));
  let high = 0;
  const out2 = {};
  const kept = /* @__PURE__ */ new Set();
  for (const [id, targetId] of Object.entries(map)) {
    high = Math.max(high, tabNumber(id));
    if (live.has(targetId) && !kept.has(targetId)) {
      out2[id] = targetId;
      kept.add(targetId);
    }
  }
  const unseen = pages.map((p) => p.id).filter((id) => !kept.has(id));
  for (const id of unseen.sort()) out2[`t${++high}`] = id;
  return out2;
}
function pick(tabs, id) {
  const tab = tabs.find((t) => t.id === id || t.targetId === id);
  if (!tab) throw new Error(`no tab ${id}: list the tabs to see their ids`);
  return tab;
}
function tabList(map, pages, current2) {
  const byId = new Map(pages.map((p) => [p.id, p]));
  return Object.entries(map).sort(([a], [b]) => tabNumber(a) - tabNumber(b)).map(([id, targetId]) => {
    const p = byId.get(targetId);
    return { id, targetId, url: p?.url ?? "", title: p?.title ?? "", active: targetId === current2 };
  });
}
function assertOpenableUrl(url) {
  const u = url.trim();
  let ok = /^about:blank$/i.test(u) || u.startsWith("#");
  if (!ok) {
    try {
      ok = /^https?:$/.test(new URL(u).protocol);
    } catch {
    }
  }
  if (!ok) throw new UsageError(`only http(s) URLs (and about:blank) can be opened \u2014 use \`${brand().cli} extract <path>\` for local files`);
}
async function createTarget(cdp, opts = {}) {
  const params = { url: "about:blank", ...opts.background ? { background: true } : {}, ...opts.window ? { newWindow: true, ...opts.window } : {} };
  const { targetId } = await cdp.send("Target.createTarget", params);
  return targetId;
}
function screenArea(v) {
  const a = v;
  const ok = (n) => typeof n === "number" && Number.isFinite(n);
  return a && ok(a.left) && ok(a.top) && ok(a.width) && ok(a.height) && a.width > 0 && a.height > 0 ? a : void 0;
}
async function windowOf(cdp, targetId) {
  const got = await cdp.send("Browser.getWindowForTarget", { targetId }).catch(() => void 0);
  return typeof got?.windowId === "number" && got.bounds ? { windowId: got.windowId, bounds: got.bounds } : void 0;
}
async function setBounds(cdp, windowId, bounds) {
  await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } });
  await cdp.send("Browser.setWindowBounds", { windowId, bounds });
}
async function tuckAway(cdp, targetId, size) {
  try {
    const win = await windowOf(cdp, targetId);
    if (!win) return;
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    let area;
    try {
      const got = await cdp.session(sessionId).send("Runtime.evaluate", { expression: SCREEN_AREA, returnByValue: true }, { timeoutMs: STATUS_TIMEOUT_MS });
      area = screenArea(got.result?.value);
    } finally {
      await cdp.send("Target.detachFromTarget", { sessionId }).catch(() => {
      });
    }
    if (!area) return;
    const width = Math.min(size.width, area.width);
    const height = Math.min(size.height, area.height);
    await setBounds(cdp, win.windowId, { left: area.left + area.width - width, top: area.top + area.height - height, width, height });
  } catch {
  }
}
async function attachPage(cdp, targetId) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const page = cdp.session(sessionId);
  const o = { timeoutMs: ATTACH_TIMEOUT_MS };
  try {
    await Promise.all([
      page.send("Page.enable", void 0, o),
      page.send("Runtime.enable", void 0, o),
      page.send("DOM.enable", void 0, o),
      page.send("Page.setLifecycleEventsEnabled", { enabled: true }, o)
    ]);
  } catch (e) {
    if (e instanceof CdpError || cdp.closed) throw e;
    throw new Error(
      `the tab does not answer; most likely a JavaScript dialog the page opened between commands \u2014 answer it in the window, or \`${brand().cli} browser close\``
    );
  }
  return sessionId;
}
async function closeLaunched(cdp, pid, deps) {
  try {
    await cdp.send("Browser.close", void 0, { timeoutMs: BROWSER_CLOSE_TIMEOUT_MS });
  } catch {
    if (cdp.closed || pid === void 0) return;
    try {
      deps.kill(pid, "SIGTERM");
    } catch {
    }
  }
}
function forget(targetIds, all) {
  clearSession();
  if (all) {
    clearRefs();
    clearNetwork();
    return;
  }
  for (const id of new Set(targetIds)) {
    clearRefs(id);
    clearNetwork(id);
  }
}
async function openBrowserSession(opts = {}) {
  const deps = browserDeps(opts.deps);
  const endpoint = await resolveEndpoint({ ...opts, deps, quiet: opts.quiet ?? opts.scratch === true });
  const saved = readSession();
  const same = saved !== null && saved.port === endpoint.port && (saved.host ?? "127.0.0.1") === endpoint.host ? saved : null;
  const { webSocketDebuggerUrl } = await deps.discovery.getVersion(endpoint.port, endpoint.host);
  const cdp = await deps.connectCdp(loopbackSocketUrl(webSocketDebuggerUrl));
  let created;
  try {
    const pages = await deps.discovery.listPages(endpoint.port, endpoint.host);
    let targetId;
    if (opts.scratch && !endpoint.headless) {
      const size = readWindowSize(deps);
      let holder = pages[0]?.id;
      const fresh = holder === void 0 && endpoint.launchedByUs;
      if (fresh) holder = await createTarget(cdp, { background: true, window: size });
      if (holder !== void 0 && (fresh || endpoint.spawned)) await tuckAway(cdp, holder, size);
      targetId = created = await createTarget(cdp, { background: true });
    } else if (opts.newTab || opts.scratch) targetId = created = await createTarget(cdp);
    else if (same && pages.some((p) => p.id === same.targetId)) targetId = same.targetId;
    else targetId = pages[0]?.id ?? await createTarget(cdp);
    const sessionId = await attachPage(cdp, targetId);
    const session = new BrowserSession(cdp, endpoint, webSocketDebuggerUrl, deps, targetId, sessionId, cleanTabs(same?.tabs), opts.scratch);
    if (!opts.scratch) await session.listTabs();
    if (opts.url !== void 0) await session.navigate(opts.url);
    return session;
  } catch (e) {
    if (created !== void 0) await deps.discovery.closeTarget(endpoint.port, created, endpoint.host).catch(() => {
    });
    await cdp.close();
    throw e;
  }
}
var NAVIGATION_TIMEOUT_MS;
var BROWSER_CLOSE_TIMEOUT_MS;
var STATUS_TIMEOUT_MS;
var ATTACH_TIMEOUT_MS;
var TAB_ID;
var HUMAN_WINDOW;
var LIFECYCLE;
var NavigationTimeoutError;
var committedIn;
var stillLoading;
var tabNumber;
var SCREEN_AREA;
var BrowserSession;
var init_session = __esm({
  "src/browser/session.ts"() {
    "use strict";
    init_brand();
    init_cli_kit();
    init_cdp();
    init_deps();
    init_discovery();
    init_launch();
    init_profile();
    init_state();
    NAVIGATION_TIMEOUT_MS = 3e4;
    BROWSER_CLOSE_TIMEOUT_MS = 5e3;
    STATUS_TIMEOUT_MS = 2e3;
    ATTACH_TIMEOUT_MS = 5e3;
    TAB_ID = /^t([1-9]\d*)$/;
    HUMAN_WINDOW = { width: 1100, height: 860 };
    LIFECYCLE = { load: "load", domcontentloaded: "DOMContentLoaded" };
    NavigationTimeoutError = class extends Error {
    };
    committedIn = (frameId, isNew) => (e) => e.frameId === frameId && isNew(e.loaderId) && (e.kind === "commit" || e.kind === "lifecycle" && e.name !== "init");
    stillLoading = (timeoutMs) => `still loading after ${timeoutMs} ms \u2014 take a snapshot or \`${brand().cli} browser wait --load\``;
    tabNumber = (id) => Number(TAB_ID.exec(id)?.[1] ?? 0);
    SCREEN_AREA = "({ left: screen.availLeft, top: screen.availTop, width: screen.availWidth, height: screen.availHeight })";
    BrowserSession = class {
      /** @internal use openBrowserSession */
      constructor(cdp, endpoint, wsBrowserUrl, deps, targetId, sessionId, tabs, scratch = false) {
        this.cdp = cdp;
        this.endpoint = endpoint;
        this.wsBrowserUrl = wsBrowserUrl;
        this.deps = deps;
        this.scratch = scratch;
        this.current = { targetId, sessionId, page: cdp.session(sessionId) };
        this.tabs = tabs;
      }
      cdp;
      endpoint;
      wsBrowserUrl;
      deps;
      scratch;
      tabs;
      current;
      /** Targets closed by this session that /json/list may still report for a moment. */
      closed = /* @__PURE__ */ new Set();
      /** Dialog listeners, each bound to the current tab's session and moved with it. */
      dialogListeners = /* @__PURE__ */ new Map();
      ended = false;
      get port() {
        return this.endpoint.port;
      }
      get host() {
        return this.endpoint.host;
      }
      get launchedByUs() {
        return this.endpoint.launchedByUs;
      }
      /** Whether opening this session started the browser (not a reuse of one already running). */
      get spawned() {
        return this.endpoint.spawned === true;
      }
      /** The browser-level socket URL: its path names this run of the browser and no other. */
      get browserSocket() {
        return this.wsBrowserUrl;
      }
      get pid() {
        return this.endpoint.pid;
      }
      get profile() {
        return this.endpoint.profile;
      }
      get headless() {
        return this.endpoint.headless;
      }
      /**
       * Bring this session's tab to the front for a person: its window at a size
       * one can work in (the reads keep it small, in a corner), the tab shown, the
       * browser activated. Resolves with what puts the window back as it was. Best
       * effort, all of it: a window that cannot be resized is still brought up.
       */
      async showToHuman() {
        let restore = async () => {
        };
        const win = await windowOf(this.cdp, this.targetId);
        if (win) {
          try {
            const got = await this.page.send(
              "Runtime.evaluate",
              { expression: SCREEN_AREA, returnByValue: true },
              { timeoutMs: STATUS_TIMEOUT_MS }
            );
            const area = screenArea(got.result?.value);
            const { width = 0, height = 0 } = win.bounds;
            if (area && (width < HUMAN_WINDOW.width || height < HUMAN_WINDOW.height)) {
              const w = Math.min(Math.max(width, HUMAN_WINDOW.width), area.width);
              const h = Math.min(Math.max(height, HUMAN_WINDOW.height), area.height);
              await setBounds(this.cdp, win.windowId, {
                left: area.left + Math.round((area.width - w) / 2),
                top: area.top + Math.round((area.height - h) / 2),
                width: w,
                height: h
              });
              const { windowState, ...was } = win.bounds;
              restore = async () => {
                await setBounds(this.cdp, win.windowId, was).catch(() => {
                });
                if (windowState && windowState !== "normal")
                  await this.cdp.send("Browser.setWindowBounds", { windowId: win.windowId, bounds: { windowState } }).catch(() => {
                  });
              };
            }
          } catch {
          }
        }
        await this.deps.discovery.activateTarget(this.port, this.targetId, this.host).catch(() => {
        });
        return restore;
      }
      /** What the launch had to say (extensions the browser will not load), once: the next call gets nothing. */
      takeNotes() {
        const notes = this.endpoint.notes ?? [];
        this.endpoint.notes = void 0;
        return notes;
      }
      get targetId() {
        return this.current.targetId;
      }
      get sessionId() {
        return this.current.sessionId;
      }
      /** The current tab's flat session. It changes with selectTab/newTab/closeTab: read it, do not keep it. */
      get page() {
        return this.current.page;
      }
      /** Write session.json (port, ownership, current tab, tab ids). A no-op once shut down, and for a scratch tab. */
      save() {
        if (this.ended || this.scratch) return;
        const { host, port, pid, launchedByUs, profile, headless } = this.endpoint;
        writeSession({
          version: 1,
          ...host !== "127.0.0.1" ? { host } : {},
          port,
          wsBrowserUrl: this.wsBrowserUrl,
          ...pid !== void 0 ? { pid } : {},
          launchedByUs,
          profile,
          headless,
          targetId: this.targetId,
          tabs: this.tabs,
          updatedAt: this.deps.now()
        });
      }
      // --- page --------------------------------------------------------------------
      async frame() {
        const { frameTree } = await this.page.send("Page.getFrameTree");
        return frameTree.frame;
      }
      async currentUrl() {
        const f = await this.frame();
        return f.url + (f.urlFragment ?? "");
      }
      async loaderId() {
        return (await this.frame()).loaderId;
      }
      async title() {
        const { targetInfo } = await this.cdp.send("Target.getTargetInfo", { targetId: this.targetId });
        return targetInfo.title ?? "";
      }
      /** The document's HTTP status from the Navigation Timing entry; undefined when the page does not say. */
      async responseStatus() {
        try {
          const r = await this.page.send(
            "Runtime.evaluate",
            { expression: "performance.getEntriesByType('navigation')[0]?.responseStatus", returnByValue: true },
            { timeoutMs: STATUS_TIMEOUT_MS }
          );
          const v = r.result?.value;
          return typeof v === "number" && v > 0 ? v : void 0;
        } catch {
          return void 0;
        }
      }
      async loaded() {
        const f = await this.frame();
        const status = await this.responseStatus();
        return { url: f.url + (f.urlFragment ?? ""), loaderId: f.loaderId, ...status !== void 0 ? { status } : {} };
      }
      /**
       * Start recording navigation events BEFORE the command that causes them: the
       * browser may report the new document's lifecycle before it answers the
       * command itself, and an event listened for too late never comes again.
       */
      watch() {
        const page = this.page;
        const seen = [];
        let wake;
        let closed = false;
        let leaving = false;
        let cancelled = false;
        const push = (e) => {
          seen.push(e);
          wake?.();
        };
        const handlers = [
          ["Page.lifecycleEvent", (p) => push({ kind: "lifecycle", frameId: p.frameId, loaderId: p.loaderId, name: p.name })],
          ["Page.navigatedWithinDocument", (p) => push({ kind: "same-document", frameId: p.frameId })],
          // A page restored from the back/forward cache fires no lifecycle event. Any other is a new
          // document committing: in the main frame, what a navigation that has not loaded yet has got to.
          [
            "Page.frameNavigated",
            (p) => {
              if (p.type === "BackForwardCacheRestore") push({ kind: "bfcache", frameId: p.frame?.id, loaderId: p.frame?.loaderId });
              else if (p.frame && !p.frame.parentId) push({ kind: "commit", frameId: p.frame.id, loaderId: p.frame.loaderId });
            }
          ],
          ["Page.javascriptDialogOpening", (p) => leaving = p?.type === "beforeunload"],
          [
            "Page.javascriptDialogClosed",
            (p) => {
              if (leaving && p?.result === false) {
                cancelled = true;
                wake?.();
              }
              leaving = false;
            }
          ]
        ];
        for (const [method, h] of handlers) page.on(method, h);
        const offClose = this.cdp.onClose(() => {
          closed = true;
          wake?.();
        });
        return {
          stop: () => {
            for (const [method, h] of handlers) page.off(method, h);
            offClose();
          },
          /** Whether such an event has come, whatever was waited for. */
          saw: (match) => seen.some(match),
          until: (match, timeoutMs, what, cancelledWhat) => new Promise((resolve9, reject) => {
            const timer = setTimeout(() => {
              wake = void 0;
              reject(new NavigationTimeoutError(`${what} within ${timeoutMs} ms`));
            }, timeoutMs);
            wake = () => {
              const hit2 = seen.find(match);
              if (hit2) resolve9(hit2);
              else if (cancelled) reject(new Error(`${cancelledWhat} was cancelled: the page asked to confirm leaving it (beforeunload), and that was declined`));
              else if (closed) reject(new Error("the browser connection closed while waiting for the page to load"));
              else return;
              clearTimeout(timer);
              wake = void 0;
            };
            wake();
          })
        };
      }
      /**
       * Load `url` in the current tab and wait for the new document's `load` (or
       * `DOMContentLoaded`, or nothing). The tab's refs are cleared: they named
       * nodes of the document that is going away. A navigation the browser refuses
       * (`errorText`: DNS failure, refused connection…) rejects, and so does one
       * that did not even commit in time. One that committed but has not loaded
       * (a cold server, a render-blocking script that holds even DOMContentLoaded)
       * is the page now, still loading: it resolves, with a `note`.
       */
      async navigate(given, opts = {}) {
        assertOpenableUrl(given);
        const url = given.trim().startsWith("#") ? new URL(given.trim(), await this.currentUrl()).href : given;
        const waitUntil = opts.waitUntil ?? "load";
        const timeoutMs = opts.timeoutMs ?? NAVIGATION_TIMEOUT_MS;
        const nav = this.watch();
        try {
          const r = await this.page.send("Page.navigate", { url }, { timeoutMs });
          if (r.errorText) throw new Error(`navigation to ${url} failed: ${r.errorText}`);
          if (!r.loaderId) {
            const f = await this.frame();
            return { url: f.url + (f.urlFragment ?? ""), loaderId: f.loaderId };
          }
          clearRefs(this.targetId);
          if (waitUntil === "none") return { url, loaderId: r.loaderId };
          const name = LIFECYCLE[waitUntil];
          try {
            await nav.until(
              (e) => e.kind === "lifecycle" && e.name === name && e.loaderId === r.loaderId,
              timeoutMs,
              `navigation to ${url} did not reach ${name}`,
              `navigation to ${url}`
            );
          } catch (e) {
            if (!(e instanceof NavigationTimeoutError) || !nav.saw(committedIn(r.frameId, (l) => l === r.loaderId))) throw e;
            return { ...await this.loaded(), note: stillLoading(timeoutMs) };
          }
          return await this.loaded();
        } finally {
          nav.stop();
        }
      }
      /**
       * Run a history move or a reload and wait until the main frame shows another
       * document (or the same one, scrolled). One that committed but has not loaded
       * in time resolves with a `note`, as in navigate.
       */
      async settle(what, trigger, timeoutMs = NAVIGATION_TIMEOUT_MS) {
        const before = await this.frame();
        const nav = this.watch();
        try {
          await trigger(timeoutMs);
          const isNew = (l) => l !== before.loaderId;
          let hit2;
          try {
            hit2 = await nav.until(
              (e) => e.frameId === before.id && (e.kind === "same-document" || e.kind === "bfcache" || e.kind === "lifecycle" && e.name === "load" && isNew(e.loaderId)),
              timeoutMs,
              `${what} did not reach load`,
              what
            );
          } catch (e) {
            if (!(e instanceof NavigationTimeoutError) || !nav.saw(committedIn(before.id, isNew))) throw e;
            clearRefs(this.targetId);
            return { ...await this.loaded(), note: stillLoading(timeoutMs) };
          }
          if (hit2.kind !== "same-document") clearRefs(this.targetId);
          return await this.loaded();
        } finally {
          nav.stop();
        }
      }
      async history(step, timeoutMs) {
        const h = await this.page.send("Page.getNavigationHistory");
        const entry = h.entries[h.currentIndex + step];
        if (!entry) throw new Error(step < 0 ? "no previous page in this tab's history" : "no next page in this tab's history");
        return this.settle(
          step < 0 ? "going back" : "going forward",
          (t) => this.page.send("Page.navigateToHistoryEntry", { entryId: entry.id }, { timeoutMs: t }),
          timeoutMs
        );
      }
      back(opts = {}) {
        return this.history(-1, opts.timeoutMs);
      }
      forward(opts = {}) {
        return this.history(1, opts.timeoutMs);
      }
      reload(opts = {}) {
        return this.settle("reloading", (t) => this.page.send("Page.reload", void 0, { timeoutMs: t }), opts.timeoutMs);
      }
      // --- tabs --------------------------------------------------------------------
      /** The browser's tabs with their stable short ids; the map is refreshed and saved. */
      async listTabs() {
        const pages = (await this.deps.discovery.listPages(this.port, this.host)).filter((p) => !this.closed.has(p.id));
        this.tabs = syncTabs(this.tabs, pages);
        this.save();
        return tabList(this.tabs, pages, this.targetId);
      }
      /**
       * Hear the JavaScript dialogs of whichever tab is current, across tab
       * switches, each with the page session that can answer it. Returns its unsubscribe.
       */
      onDialog(listener) {
        this.hookDialogs(listener, this.page);
        return () => {
          const h = this.dialogListeners.get(listener);
          if (h) this.page.off("Page.javascriptDialogOpening", h);
          this.dialogListeners.delete(listener);
        };
      }
      hookDialogs(listener, page) {
        const h = (p) => listener({ type: String(p?.type ?? "alert"), message: String(p?.message ?? ""), ...typeof p?.url === "string" ? { url: p.url } : {} }, page);
        page.on("Page.javascriptDialogOpening", h);
        this.dialogListeners.set(listener, h);
      }
      /** Move this session onto another tab: attach to it, let go of the old one, bring it to the front. */
      async switchTo(targetId) {
        const old = this.current.sessionId;
        const sessionId = await attachPage(this.cdp, targetId);
        const oldPage = this.current.page;
        this.current = { targetId, sessionId, page: this.cdp.session(sessionId) };
        for (const [listener, h] of [...this.dialogListeners]) {
          oldPage.off("Page.javascriptDialogOpening", h);
          this.hookDialogs(listener, this.current.page);
        }
        await this.cdp.send("Target.detachFromTarget", { sessionId: old }).catch(() => {
        });
        await this.deps.discovery.activateTarget(this.port, targetId, this.host);
        this.save();
      }
      async selectTab(id) {
        const tab = pick(await this.listTabs(), id);
        await this.switchTo(tab.targetId);
        return { ...tab, active: true };
      }
      /** Open a tab, make it current and, given a url, load it. */
      async newTab(url, opts = {}) {
        if (url !== void 0) assertOpenableUrl(url);
        const targetId = await createTarget(this.cdp);
        try {
          await this.switchTo(targetId);
        } catch (e) {
          await this.deps.discovery.closeTarget(this.port, targetId, this.host).catch(() => {
          });
          throw e;
        }
        if (url !== void 0) await this.navigate(url, opts);
        return pick(await this.listTabs(), targetId);
      }
      /**
       * Close a tab and forget its refs and network log. Closing the current tab
       * moves to another one first; closing the last opens a blank one, since a
       * browser left with no tab may quit.
       */
      async closeTab(id) {
        const tabs = await this.listTabs();
        const tab = pick(tabs, id);
        if (tab.targetId === this.targetId) {
          const next = tabs.find((t) => t.targetId !== tab.targetId);
          await this.switchTo(next ? next.targetId : await createTarget(this.cdp));
        }
        await this.deps.discovery.closeTarget(this.port, tab.targetId, this.host);
        this.closed.add(tab.targetId);
        clearRefs(tab.targetId);
        clearNetwork(tab.targetId);
        await this.listTabs();
      }
      // --- lifetime ------------------------------------------------------------------
      /** Close the socket only. The browser and its tabs keep running; the next call reconnects. */
      async detach() {
        await this.cdp.close();
      }
      /**
       * End the session. A browser we launched is closed (`Browser.close`, then
       * SIGTERM to its pid if it refuses); one we attached to is left running. Either
       * way session.json and our tabs' refs and network logs go (every tab's with `all`).
       */
      async shutdown(opts = {}) {
        this.ended = true;
        if (this.launchedByUs) await closeLaunched(this.cdp, this.pid, this.deps);
        await this.cdp.close();
        forget([this.targetId, ...Object.values(this.tabs)], opts.all);
      }
      async status() {
        const tabs = await this.listTabs();
        const cur = tabs.find((t) => t.active);
        return {
          alive: true,
          port: this.port,
          launchedByUs: this.launchedByUs,
          profile: this.profile,
          headless: this.headless,
          targetId: this.targetId,
          url: cur?.url ?? "",
          title: cur?.title ?? "",
          tabs
        };
      }
    };
  }
});
var AMBIGUOUS_TYPES;
var init_mime = __esm({
  "src/mime.ts"() {
    "use strict";
    AMBIGUOUS_TYPES = /* @__PURE__ */ new Set([
      "",
      "application/octet-stream",
      "binary/octet-stream",
      "application/x-download",
      "application/force-download",
      "application/download",
      "application/unknown",
      "application/zip",
      "application/x-zip-compressed"
    ]);
  }
});
function bomEncoding(bytes) {
  if (bytes.length >= 3 && bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) return { encoding: "utf-8", skip: 3 };
  if (bytes.length >= 2 && bytes[0] === 255 && bytes[1] === 254) return { encoding: "utf-16le", skip: 2 };
  if (bytes.length >= 2 && bytes[0] === 254 && bytes[1] === 255) return { encoding: "utf-16be", skip: 2 };
  return void 0;
}
function charsetFromContentType(contentType) {
  return CHARSET_IN_CONTENT_TYPE.exec(contentType ?? "")?.[1]?.toLowerCase();
}
function prescanLabel(label) {
  const lower = label.toLowerCase();
  if (UTF16_LABELS.has(lower)) return "utf-8";
  return lower === "x-user-defined" ? "windows-1252" : lower;
}
function metaAttributes(tag) {
  const attrs = /* @__PURE__ */ new Map();
  for (const m of tag.slice(5).matchAll(TAG_ATTRIBUTE)) {
    const value = m[2] ?? m[3] ?? m[4];
    const name = m[1].toLowerCase();
    if (value !== void 0 && !attrs.has(name)) attrs.set(name, value);
  }
  return attrs;
}
function charsetFromHtml(head) {
  for (const [tag] of head.slice(0, 4096).matchAll(META_TAG)) {
    const attrs = metaAttributes(tag);
    const direct = attrs.get("charset")?.trim();
    if (direct) return prescanLabel(direct);
    if (attrs.get("http-equiv")?.trim().toLowerCase() !== "content-type") continue;
    const pragma = charsetFromContentType(attrs.get("content") ?? "");
    if (pragma) return prescanLabel(pragma);
  }
  return void 0;
}
function charsetFromXmlDeclaration(bytes) {
  const label = XML_DECLARATION.exec(bytes.subarray(0, 256).toString("latin1"))?.[1];
  return label ? prescanLabel(label) : void 0;
}
function readsAsUtf8(text) {
  let valid = 0;
  let replaced = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 128 || c >= 56320 && c <= 57343) continue;
    if (c === 65533) replaced++;
    else valid++;
  }
  return valid > replaced;
}
function decodeUtf8OrCp1252(bytes) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text;
  try {
    text = decoder.decode(bytes, { stream: true });
  } catch {
    const lenient = new TextDecoder("utf-8").decode(bytes);
    return readsAsUtf8(lenient) ? lenient : decodeCp1252(bytes);
  }
  try {
    return text + decoder.decode();
  } catch {
    return /[\x80-\uffff]/.test(text) ? text : decodeCp1252(bytes);
  }
}
function decodeBody(bytes, contentType = "") {
  const bom = bomEncoding(bytes);
  if (bom) return decodeWith(bytes.subarray(bom.skip), bom.encoding);
  const declared = charsetFromContentType(contentType);
  if (declared && !isUtf8Label(declared)) return decodeWith(bytes, declared);
  if (declared) return bytes.toString("utf8");
  const mime = contentType.split(";")[0].trim().toLowerCase();
  const own = charsetFromXmlDeclaration(bytes) ?? (SNIFFABLE_MIME.has(mime) ? charsetFromHtml(bytes.subarray(0, 4096).toString("latin1")) : void 0);
  if (own && !isUtf8Label(own)) return decodeWith(bytes, own);
  return decodeUtf8OrCp1252(bytes);
}
function decodeCp1252(bytes) {
  return bytes.toString("latin1").replace(CP1252_C1_RANGE, cp1252C1);
}
function decodeWith(bytes, encoding) {
  if (CP1252_LABELS.has(encoding)) return decodeCp1252(bytes);
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(bytes);
  } catch {
    return bytes.toString("utf8");
  }
}
var CHARSET_IN_CONTENT_TYPE;
var UTF16_LABELS;
var META_TAG;
var TAG_ATTRIBUTE;
var XML_DECLARATION;
var isUtf8Label;
var SNIFFABLE_MIME;
var CP1252_C1;
var CP1252_LABELS;
var CP1252_C1_RANGE;
var cp1252C1;
var init_charset = __esm({
  "src/charset.ts"() {
    "use strict";
    init_mime();
    CHARSET_IN_CONTENT_TYPE = /charset\s*=\s*["']?([a-z0-9_:.+-]+)/i;
    UTF16_LABELS = /* @__PURE__ */ new Set(["utf-16", "utf-16le", "utf-16be", "unicode", "unicodefeff", "unicodefffe", "ucs-2", "csunicode", "iso-10646-ucs-2"]);
    META_TAG = /<meta\b(?:[^>"']|"[^"]*(?:"|$)|'[^']*(?:'|$))*(?:>|$)/gi;
    TAG_ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)(?:"|$)|'([^']*)(?:'|$)|([^\s"'=<>`]+)))?/g;
    XML_DECLARATION = /^\s*<\?xml\b[^>]*?\bencoding\s*=\s*["']([A-Za-z0-9._:-]+)["']/;
    isUtf8Label = (label) => label === "utf-8" || label === "utf8";
    SNIFFABLE_MIME = /* @__PURE__ */ new Set(["text/html", "application/xhtml+xml", ...AMBIGUOUS_TYPES]);
    CP1252_C1 = [
      8364,
      129,
      8218,
      402,
      8222,
      8230,
      8224,
      8225,
      710,
      8240,
      352,
      8249,
      338,
      141,
      381,
      143,
      144,
      8216,
      8217,
      8220,
      8221,
      8226,
      8211,
      8212,
      732,
      8482,
      353,
      8250,
      339,
      157,
      382,
      376
    ];
    CP1252_LABELS = /* @__PURE__ */ new Set([
      "windows-1252",
      "cp1252",
      "cp-1252",
      "x-cp1252",
      "ansi_x3.4-1968",
      "iso-8859-1",
      "iso8859-1",
      "latin1",
      "l1",
      "us-ascii",
      "ascii"
    ]);
    CP1252_C1_RANGE = /[\x80-\x9f]/g;
    cp1252C1 = (c) => String.fromCharCode(CP1252_C1[c.charCodeAt(0) - 128]);
  }
});
function numericChar(n) {
  if (n >= 128 && n <= 159) return String.fromCodePoint(CP1252_C1[n - 128]);
  if (n === 0 || !(n <= 1114111) || n >= 55296 && n <= 57343) return "\uFFFD";
  return charFor(n);
}
function decodeEntities(s) {
  return s.replace(ENTITY_RE, (m, ref) => {
    if (ref[0] !== "#") return ENTITY_BY_NAME.get(ref) ?? m;
    return numericChar(ref[1] === "x" || ref[1] === "X" ? Number.parseInt(ref.slice(2), 16) : Number(ref.slice(1)));
  });
}
var NAMED;
var INVISIBLE;
var charFor;
var ENTITY_BY_NAME;
var ENTITY_RE;
var init_entities = __esm({
  "src/entities.ts"() {
    "use strict";
    init_charset();
    NAMED = `
  quot 22 amp 26 apos 27 lt 3c gt 3e QUOT 22 AMP 26 LT 3c GT 3e COPY a9 REG ae
  nbsp a0 iexcl a1 cent a2 pound a3 curren a4 yen a5 brvbar a6 sect a7 uml a8 copy a9 ordf aa laquo ab not ac shy ad reg ae macr af
  deg b0 plusmn b1 sup2 b2 sup3 b3 acute b4 micro b5 para b6 middot b7 cedil b8 sup1 b9 ordm ba raquo bb frac14 bc frac12 bd frac34 be iquest bf
  Agrave c0 Aacute c1 Acirc c2 Atilde c3 Auml c4 Aring c5 AElig c6 Ccedil c7 Egrave c8 Eacute c9 Ecirc ca Euml cb Igrave cc Iacute cd Icirc ce Iuml cf
  ETH d0 Ntilde d1 Ograve d2 Oacute d3 Ocirc d4 Otilde d5 Ouml d6 times d7 Oslash d8 Ugrave d9 Uacute da Ucirc db Uuml dc Yacute dd THORN de szlig df
  agrave e0 aacute e1 acirc e2 atilde e3 auml e4 aring e5 aelig e6 ccedil e7 egrave e8 eacute e9 ecirc ea euml eb igrave ec iacute ed icirc ee iuml ef
  eth f0 ntilde f1 ograve f2 oacute f3 ocirc f4 otilde f5 ouml f6 divide f7 oslash f8 ugrave f9 uacute fa ucirc fb uuml fc yacute fd thorn fe yuml ff
  OElig 152 oelig 153 Scaron 160 scaron 161 Yuml 178 fnof 192 circ 2c6 tilde 2dc
  Alpha 391 Beta 392 Gamma 393 Delta 394 Epsilon 395 Zeta 396 Eta 397 Theta 398 Iota 399 Kappa 39a Lambda 39b Mu 39c Nu 39d Xi 39e Omicron 39f
  Pi 3a0 Rho 3a1 Sigma 3a3 Tau 3a4 Upsilon 3a5 Phi 3a6 Chi 3a7 Psi 3a8 Omega 3a9
  alpha 3b1 beta 3b2 gamma 3b3 delta 3b4 epsilon 3b5 zeta 3b6 eta 3b7 theta 3b8 iota 3b9 kappa 3ba lambda 3bb mu 3bc nu 3bd xi 3be omicron 3bf
  pi 3c0 rho 3c1 sigmaf 3c2 sigma 3c3 tau 3c4 upsilon 3c5 phi 3c6 chi 3c7 psi 3c8 omega 3c9 thetasym 3d1 upsih 3d2 piv 3d6
  ensp 2002 emsp 2003 thinsp 2009 zwnj 200c zwj 200d lrm 200e rlm 200f ndash 2013 mdash 2014 lsquo 2018 rsquo 2019 sbquo 201a
  ldquo 201c rdquo 201d bdquo 201e dagger 2020 Dagger 2021 bull 2022 hellip 2026 permil 2030 prime 2032 Prime 2033 lsaquo 2039 rsaquo 203a
  oline 203e frasl 2044 euro 20ac image 2111 weierp 2118 real 211c trade 2122 alefsym 2135
  larr 2190 uarr 2191 rarr 2192 darr 2193 harr 2194 crarr 21b5 lArr 21d0 uArr 21d1 rArr 21d2 dArr 21d3 hArr 21d4
  forall 2200 part 2202 exist 2203 empty 2205 nabla 2207 isin 2208 notin 2209 ni 220b prod 220f sum 2211 minus 2212 lowast 2217 radic 221a
  prop 221d infin 221e ang 2220 and 2227 or 2228 cap 2229 cup 222a int 222b there4 2234 sim 223c cong 2245 asymp 2248 ne 2260 equiv 2261
  le 2264 ge 2265 sub 2282 sup 2283 nsub 2284 sube 2286 supe 2287 oplus 2295 otimes 2297 perp 22a5 sdot 22c5
  lceil 2308 rceil 2309 lfloor 230a rfloor 230b lang 27e8 rang 27e9 loz 25ca spades 2660 clubs 2663 hearts 2665 diams 2666
`;
    INVISIBLE = /* @__PURE__ */ new Set([173, 8203, 8204, 8205, 8206, 8207, 8288, 65279]);
    charFor = (cp) => INVISIBLE.has(cp) ? "" : String.fromCodePoint(cp);
    ENTITY_BY_NAME = /* @__PURE__ */ new Map();
    {
      const parts = NAMED.trim().split(/\s+/);
      for (let i = 0; i < parts.length; i += 2) ENTITY_BY_NAME.set(parts[i], charFor(Number.parseInt(parts[i + 1], 16)));
      ENTITY_BY_NAME.set("nbsp", " ");
    }
    ENTITY_RE = /&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g;
  }
});
function closeTagRe(name) {
  let re = CLOSE_TAG_RE.get(name);
  if (!re) CLOSE_TAG_RE.set(name, re = new RegExp(`</${name}\\s*>`, "gi"));
  return re;
}
function htmlAttributes(tag) {
  const attrs = /* @__PURE__ */ new Map();
  for (const m of tag.matchAll(/(?<![^\s"'<>/=])([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)) {
    const name = m[1].toLowerCase();
    if (!attrs.has(name)) attrs.set(name, m[2] ?? m[3] ?? m[4] ?? "");
  }
  return attrs;
}
function implicitHeadEnd(html, from) {
  const re = new RegExp(TAG_RE.source, "g");
  re.lastIndex = from;
  let m;
  while (m = re.exec(html)) {
    const tag = m[0];
    if (tag[1] === "/" || tag[1] === "!" || tag[1] === "?") continue;
    const name = tagName(tag);
    if (!HEAD_CONTENT.has(name)) return m.index;
    if (!HEAD_RAW.has(name) || tag.endsWith("/>")) continue;
    const close = closeTagRe(name);
    close.lastIndex = re.lastIndex;
    const c = close.exec(html);
    if (!c) return -1;
    re.lastIndex = c.index + c[0].length;
  }
  return -1;
}
function dropElements(html, names, toEof = /* @__PURE__ */ new Set()) {
  if (!new RegExp(`<!--|<(?:${names.join("|")})(?=[\\s/>])`, "i").test(html)) return html;
  const drop = new Set(names);
  const open2 = new RegExp(`<!--|${TAG_RE.source}|<(${names.join("|")})(?=[\\s/>])`, "gi");
  const unclosed = /* @__PURE__ */ new Set();
  const noClose = /* @__PURE__ */ new Set();
  let out2 = "";
  let last = 0;
  let m;
  while (m = open2.exec(html)) {
    const tag = m[0];
    const name = m[1]?.toLowerCase() ?? (tag === "<!--" ? "!--" : tag[1] === "/" ? "" : tagName(tag));
    const opaque = !drop.has(name) && RCDATA_ELEMENTS.has(name);
    if (name !== "!--" && !drop.has(name) && !opaque || unclosed.has(name)) continue;
    let end;
    if (!m[1] && SELF_CLOSING_FOREIGN.has(name) && tag.endsWith("/>")) {
      end = m.index + tag.length;
    } else if (name === "!--") {
      const close = html.indexOf("-->", m.index + 2);
      end = close < 0 ? -1 : close + 3;
    } else {
      let c = null;
      if (!noClose.has(name)) {
        const close = closeTagRe(name);
        close.lastIndex = open2.lastIndex;
        c = close.exec(html);
        if (!c) noClose.add(name);
      }
      end = c ? c.index + c[0].length : toEof.has(name) ? html.length : name === "head" ? implicitHeadEnd(html, open2.lastIndex) : -1;
    }
    if (end < 0) {
      unclosed.add(name);
      continue;
    }
    if (!opaque) {
      out2 += html.slice(last, m.index) + " ";
      last = end;
    }
    open2.lastIndex = end;
  }
  return last === 0 ? html : out2 + html.slice(last);
}
function balancedRegions(html, tag, isCandidate) {
  const re = new RegExp(`<${tag}(?=[\\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>|</${tag}\\s*>`, "gi");
  const stack = [];
  const out2 = [];
  let m;
  while (m = re.exec(html)) {
    if (m[0][1] === "/") {
      const top = stack.pop();
      if (top?.open) out2.push({ start: top.start, end: m.index, from: top.from, to: re.lastIndex, open: top.open });
    } else {
      stack.push({ start: re.lastIndex, from: m.index, open: isCandidate(m[0]) ? m[0] : void 0 });
    }
  }
  return out2;
}
function dropLandmarks(html, roles) {
  const role = `\\srole\\s*=\\s*["']?(?:${roles.join("|")})(?=["'\\s/>])`;
  const hasRole = new RegExp(role, "i");
  const names = /* @__PURE__ */ new Set();
  for (const m of html.matchAll(new RegExp(`<([a-zA-Z][a-zA-Z0-9-]*)(?=[\\s/>])[^<>]*${role}`, "gi"))) names.add(m[1].toLowerCase());
  if (!names.size) return html;
  const regions = [...names].flatMap((name) => balancedRegions(html, name, (open2) => hasRole.test(open2))).sort((a, b) => a.from - b.from);
  let out2 = "";
  let last = 0;
  for (const r of regions) {
    if (r.from < last) continue;
    out2 += `${html.slice(last, r.from)} `;
    last = r.to;
  }
  return last === 0 ? html : out2 + html.slice(last);
}
function dropLanguageSelectors(html) {
  let seen = 0;
  for (let i = html.indexOf("hreflang"); i >= 0 && seen < MIN_LANGUAGE_LINKS; i = html.indexOf("hreflang", i + 8)) seen++;
  if (seen < MIN_LANGUAGE_LINKS) return html;
  const totals = { links: 0, lang: 0, text: 0, blocks: 0 };
  const stack = [];
  const open2 = /* @__PURE__ */ new Map();
  const done = [];
  let inLangLink = false;
  let last = 0;
  const re = new RegExp(TAG_RE.source, "g");
  let m;
  while (m = re.exec(html)) {
    if (!inLangLink) totals.text += countVisible(html, last, m.index);
    last = re.lastIndex;
    const tag = m[0];
    const closing = tag[1] === "/";
    const name = tagName(tag);
    if (name === "a") {
      if (closing) inLangLink = false;
      else {
        totals.links++;
        if (HREFLANG_ATTR.test(tag)) {
          totals.lang++;
          inLangLink = true;
        }
      }
    } else if (!closing && SELECTOR_BLOCKERS.has(name)) totals.blocks++;
    if (!SELECTOR_CONTAINERS.has(name)) continue;
    if (!closing) {
      if (tag.endsWith("/>")) continue;
      stack.push({ name, node: { from: m.index, to: -1, links: 0, lang: 0, text: 0, blocks: 0, parent: stack.at(-1)?.node }, at: { ...totals } });
      open2.set(name, (open2.get(name) ?? 0) + 1);
      continue;
    }
    if (!open2.get(name)) continue;
    let i = stack.length - 1;
    while (stack[i].name !== name) i--;
    for (let j = i; j < stack.length; j++) open2.set(stack[j].name, open2.get(stack[j].name) - 1);
    const { node, at: at2 } = stack[i];
    stack.length = i;
    Object.assign(node, {
      to: re.lastIndex,
      links: totals.links - at2.links,
      lang: totals.lang - at2.lang,
      text: totals.text - at2.text,
      blocks: totals.blocks - at2.blocks
    });
    done.push(node);
  }
  const isSelector = (n) => !!n && n.to >= 0 && n.lang >= MIN_LANGUAGE_LINKS && n.lang * 2 > n.links && n.blocks === 0 && n.text <= MAX_SELECTOR_TEXT;
  const outermost = /* @__PURE__ */ new Map();
  const targets = /* @__PURE__ */ new Set();
  for (let k = done.length - 1; k >= 0; k--) {
    const n = done[k];
    if (!isSelector(n)) continue;
    const top = isSelector(n.parent) ? outermost.get(n.parent) ?? n.parent : n;
    outermost.set(n, top);
    targets.add(top);
  }
  if (!targets.size) return html;
  let out2 = "";
  let at = 0;
  for (const r of [...targets].sort((a, b) => a.from - b.from)) {
    if (r.from < at) continue;
    out2 += `${html.slice(at, r.from)} `;
    at = r.to;
  }
  return out2 + html.slice(at);
}
function countVisible(html, from, to) {
  let n = 0;
  for (let i = from; i < to; i++) {
    const c = html.charCodeAt(i);
    if (c > 32) n++;
  }
  return n;
}
function firstElementText(html, name) {
  const open2 = new RegExp(`<${name}(?=[\\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>`, "i").exec(html);
  if (!open2) return void 0;
  const close = closeTagRe(name);
  close.lastIndex = open2.index + open2[0].length;
  const c = close.exec(html);
  if (!c) return void 0;
  const inner = html.slice(open2.index + open2[0].length, c.index).replace(TAG_RE, (tag) => INLINE_TAGS.has(tagName(tag)) ? "" : " ");
  return decodeEntities(inner).replace(/\s+/g, " ").trim() || void 0;
}
function metaContent(html, keys) {
  const found = /* @__PURE__ */ new Map();
  for (const m of html.matchAll(/<meta(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attrs = htmlAttributes(m[0]);
    const key = (attrs.get("property") ?? attrs.get("name"))?.toLowerCase();
    const value = attrs.get("content")?.trim();
    if (key && value && keys.includes(key) && !found.has(key)) found.set(key, decodeEntities(value).replace(/\s+/g, " ").trim());
  }
  return keys.map((k) => found.get(k)).find(Boolean);
}
function canonicalHref(clean3) {
  const end = clean3.search(/<\/head\s*>|<body(?=[\s/>])/i);
  const head = end < 0 ? clean3 : clean3.slice(0, end);
  let og;
  for (const m of head.matchAll(/<(link|meta)(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attrs = htmlAttributes(m[0]);
    if (m[1].toLowerCase() === "link") {
      const href = attrs.get("href")?.trim();
      if (href && (attrs.get("rel") ?? "").toLowerCase().split(/\s+/).includes("canonical")) return decodeEntities(href);
    } else if (og === void 0 && attrs.get("property")?.toLowerCase() === "og:url") {
      og = attrs.get("content")?.trim() || void 0;
    }
  }
  return og && decodeEntities(og);
}
var BLOCK_TAGS;
var INLINE_TAGS;
var TAG_RE;
var LOOSE_TAG_RE;
var tagName;
var CLOSE_TAG_RE;
var RCDATA_ELEMENTS;
var SELF_CLOSING_FOREIGN;
var HEAD_CONTENT;
var HEAD_RAW;
var SELECTOR_CONTAINERS;
var SELECTOR_BLOCKERS;
var HREFLANG_ATTR;
var MIN_LANGUAGE_LINKS;
var MAX_SELECTOR_TEXT;
var CHROME_ROLES;
var HIDDEN_ELEMENTS;
var CHROME_ELEMENTS;
var RAW_TEXT_ELEMENTS;
var METADATA_HIDDEN;
var init_html = __esm({
  "src/html.ts"() {
    "use strict";
    init_entities();
    BLOCK_TAGS = /* @__PURE__ */ new Set([
      "p",
      "div",
      "section",
      "article",
      "li",
      "tr",
      "td",
      "th",
      "ul",
      "ol",
      "pre",
      "blockquote",
      "table",
      "caption",
      "dl",
      "dt",
      "dd",
      "header",
      "footer",
      "nav",
      "aside",
      "main",
      "search",
      "figure",
      "figcaption",
      "details",
      "summary",
      "address",
      "form",
      "fieldset",
      "legend",
      "hgroup",
      "center",
      "dialog",
      "menu"
    ]);
    INLINE_TAGS = /* @__PURE__ */ new Set([
      "a",
      "abbr",
      "acronym",
      "b",
      "bdi",
      "bdo",
      "big",
      "cite",
      "code",
      "data",
      "del",
      "dfn",
      "em",
      "font",
      "i",
      "ins",
      "kbd",
      "label",
      "mark",
      "nobr",
      "q",
      "s",
      "samp",
      "small",
      "span",
      "strike",
      "strong",
      "sub",
      "sup",
      "time",
      "tt",
      "u",
      "var",
      "wbr"
    ]);
    TAG_RE = /<[a-zA-Z!/?][^<>"']*(?:(?:"[^"]*"|'[^']*')[^<>"']*)*>/g;
    LOOSE_TAG_RE = /<[a-zA-Z!/?][^<>]*>/g;
    tagName = (tag) => /^<\/?([a-zA-Z][^\s/>]*)/.exec(tag)?.[1]?.toLowerCase() ?? "";
    CLOSE_TAG_RE = /* @__PURE__ */ new Map();
    RCDATA_ELEMENTS = /* @__PURE__ */ new Set(["title"]);
    SELF_CLOSING_FOREIGN = /* @__PURE__ */ new Set(["svg", "math"]);
    HEAD_CONTENT = /* @__PURE__ */ new Set(["title", "meta", "link", "base", "style", "script", "noscript", "template"]);
    HEAD_RAW = /* @__PURE__ */ new Set(["title", "style", "script", "noscript", "template"]);
    SELECTOR_CONTAINERS = /* @__PURE__ */ new Set(["div", "ul", "ol", "menu", "nav", "section", "aside", "details"]);
    SELECTOR_BLOCKERS = /* @__PURE__ */ new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "table", "article", "main", "pre", "blockquote"]);
    HREFLANG_ATTR = /\shreflang\s*=/i;
    MIN_LANGUAGE_LINKS = 3;
    MAX_SELECTOR_TEXT = 80;
    CHROME_ROLES = ["navigation", "banner", "contentinfo"];
    HIDDEN_ELEMENTS = ["script", "style", "noscript", "head", "svg", "template", "select", "datalist"];
    CHROME_ELEMENTS = ["nav", "footer"];
    RAW_TEXT_ELEMENTS = /* @__PURE__ */ new Set(["script", "style"]);
    METADATA_HIDDEN = ["script", "style", "template", "svg"];
  }
});
function retryDelayMs(retryAfterMs) {
  if (retryAfterMs === void 0) return defaultRetryMs();
  return retryAfterMs <= RETRY_AFTER_CAP_MS ? retryAfterMs : void 0;
}
function isPermanentFailure(e) {
  const err = e;
  const code = err?.cause?.code ?? err?.code;
  if (typeof code === "string" && PERMANENT_CODES.has(code)) return true;
  return [err?.message, err?.cause?.message].some((m) => typeof m === "string" && PERMANENT_MESSAGE.test(m));
}
var maxAttempts;
var defaultRetryMs;
var RETRY_AFTER_CAP_MS;
var PERMANENT_CODES;
var PERMANENT_MESSAGE;
var init_retry = __esm({
  "src/retry.ts"() {
    "use strict";
    init_brand();
    maxAttempts = () => envInt("MAX_ATTEMPTS", 2, 1, 5);
    defaultRetryMs = () => envInt("RETRY_MS", 600, 0, 5e3);
    RETRY_AFTER_CAP_MS = 5e3;
    PERMANENT_CODES = /* @__PURE__ */ new Set([
      "ENOTFOUND",
      "ERR_INVALID_URL",
      "ERR_TLS_CERT_ALTNAME_INVALID",
      "CERT_HAS_EXPIRED",
      "DEPTH_ZERO_SELF_SIGNED_CERT",
      "SELF_SIGNED_CERT_IN_CHAIN",
      "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
      "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"
    ]);
    PERMANENT_MESSAGE = /redirect count exceeded|scheme must be|unknown scheme|bad port|invalid url|failed to parse url/i;
  }
});
function fragmentText(html) {
  return decodeEntities(html.replace(TAG_RE, (tag) => INLINE_TAGS.has(tagName(tag)) ? "" : " ").replace(LOOSE_TAG_RE, " "));
}
function spanAttr(attrs, name) {
  const n = Number.parseInt(attrs.get(name) ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 100) : 1;
}
function expand(rows) {
  const grid = rows.map(() => []);
  let slots = 0;
  for (let r = 0; r < rows.length; r++) {
    const out2 = grid[r];
    let c = 0;
    for (const cell2 of rows[r]) {
      while (out2[c] !== void 0) c++;
      const down = Math.min(cell2.rowspan, rows.length - r);
      slots += down * cell2.colspan;
      if (slots > MAX_SLOTS) return void 0;
      for (let j = 0; j < down; j++) for (let i = 0; i < cell2.colspan; i++) grid[r + j][c + i] = cell2.text;
      c += cell2.colspan;
    }
  }
  const width = grid.reduce((w, row) => Math.max(w, row.length), 0);
  if (width * grid.length > MAX_SLOTS) return void 0;
  return grid.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ""));
}
function extractTables(html) {
  const src = dropElements(html, NOT_RENDERED, RAW_TEXT_ELEMENTS);
  const tag = /<(\/?)(table|caption|thead|tbody|tfoot|tr|td|th)(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/gi;
  const done = [];
  const stack = [];
  let order = 0;
  let last = 0;
  let buried = 0;
  let m;
  while (m = tag.exec(src)) {
    const top = stack[stack.length - 1];
    if (top) top.text(src.slice(last, m.index));
    last = tag.lastIndex;
    const closing = m[1] === "/";
    const name = m[2].toLowerCase();
    if (top && (buried || name === "table" && !closing && stack.length >= MAX_DEPTH)) {
      if (name === "table") buried += closing ? -1 : 1;
      top.text(" ");
      continue;
    }
    if (name === "table") {
      if (!closing) stack.push(new OpenTable(order++));
      else if (top) closeTable(stack, done);
      continue;
    }
    if (!top) continue;
    if (name === "td" || name === "th") {
      if (closing) top.endCell();
      else top.startCell(name === "th", htmlAttributes(m[0]));
    } else if (name === "tr") {
      top.endRow();
      if (!closing) top.startRow();
    } else if (name === "caption") {
      top.endRow();
      top.inCaption = !closing;
    } else {
      top.endRow();
      top.inHead = name === "thead" && !closing;
    }
  }
  while (stack.length) closeTable(stack, done);
  return done.sort((a, b) => a.order - b.order).map((d) => d.table);
}
function closeTable(stack, done) {
  const t = stack.pop();
  t.endRow();
  const caption = collapse(t.caption.join(""));
  const table = buildTable(t.rows, caption);
  if (table) done.push({ order: t.order, table });
  const flat2 = [caption, ...t.rows.flatMap((r) => r.cells.map((c) => c.text))].filter(Boolean).join(" ");
  stack[stack.length - 1]?.nested(flat2);
}
function buildTable(rows, caption) {
  if (!rows.length) return void 0;
  const grid = expand(rows.map((r) => r.cells));
  if (!grid) return void 0;
  let headers = [];
  let body = grid;
  if (rows.some((r) => r.head)) {
    const head = grid.filter((_, i) => rows[i].head);
    headers = head[0].map((_, c) => [...new Set(head.map((r) => r[c]).filter(Boolean))].join(" "));
    body = grid.filter((_, i) => !rows[i].head);
  } else if (isHeaderRow(rows[0].cells)) {
    headers = grid[0];
    body = grid.slice(1);
  }
  if (!body.length) return void 0;
  return { ...caption ? { caption } : {}, headers, rows: body };
}
function isHeaderRow(cells) {
  return cells.some((c) => c.header) && cells.every((c) => c.header || !c.text);
}
function tableToMarkdown(table) {
  const width = table.rows.reduce((w, r) => Math.max(w, r.length), Math.max(table.headers.length, 1));
  const esc = (s) => s.replace(/\|/g, "\\|");
  const line = (cells) => `| ${Array.from({ length: width }, (_, i) => esc(cells[i] ?? "")).join(" | ")} |`;
  const out2 = [];
  if (table.caption) out2.push(`**${table.caption}**`, "");
  out2.push(line(table.headers.length ? table.headers : Array.from({ length: width }, () => "")));
  out2.push(`|${" --- |".repeat(width)}`);
  for (const row of table.rows) out2.push(line(row));
  return out2.join("\n");
}
var collapse;
var MAX_SLOTS;
var NOT_RENDERED;
var MAX_DEPTH;
var OpenTable;
var init_tables = __esm({
  "src/tables.ts"() {
    "use strict";
    init_entities();
    init_html();
    collapse = (s) => s.replace(/\s+/g, " ").trim();
    MAX_SLOTS = 1e6;
    NOT_RENDERED = ["script", "style", "template", "svg", "select", "datalist"];
    MAX_DEPTH = 8;
    OpenTable = class {
      constructor(order) {
        this.order = order;
      }
      order;
      rows = [];
      caption = [];
      inCaption = false;
      inHead = false;
      row;
      cell;
      /** Text between two table tags: it belongs to the open cell, else the caption. */
      text(fragment) {
        if (this.cell) this.cell.parts.push(fragmentText(fragment));
        else if (this.inCaption) this.caption.push(fragmentText(fragment));
      }
      /** A nested table's text, already clean, joins the cell that holds it. */
      nested(text) {
        this.cell?.parts.push(` ${text} `);
      }
      startRow() {
        this.inCaption = false;
        this.row = { cells: [], head: this.inHead };
      }
      startCell(header2, attrs) {
        this.endCell();
        if (!this.row) this.startRow();
        this.cell = { parts: [], header: header2, colspan: spanAttr(attrs, "colspan"), rowspan: spanAttr(attrs, "rowspan") };
      }
      endCell() {
        if (!this.cell || !this.row) return;
        const { parts, header: header2, colspan, rowspan } = this.cell;
        this.row.cells.push({ text: collapse(parts.join("")), header: header2, colspan, rowspan });
        this.cell = void 0;
      }
      endRow() {
        this.endCell();
        if (this.row?.cells.length) this.rows.push(this.row);
        this.row = void 0;
      }
    };
  }
});
function markdownAgainst(html, base2, fullPage) {
  const src = withoutNul(html);
  const hidden = fullPage ? HIDDEN_ELEMENTS : [...HIDDEN_ELEMENTS, ...CHROME_ELEMENTS];
  let s = dropElements(src, hidden, RAW_TEXT_ELEMENTS);
  if (!fullPage) s = dropLanguageSelectors(dropLandmarks(s, CHROME_ROLES));
  const tables = /* @__PURE__ */ new Map();
  if (TABLE_OPEN.test(s)) for (const r of balancedRegions(s, "table", () => true)) tables.set(r.from, r);
  const w = new Writer();
  const tag = new RegExp(TAG_RE.source, "g");
  const headingEdge = new RegExp(HEADING_EDGE.source, "gi");
  let preUnclosed = false;
  let headingEnd = -1;
  const divs = [];
  let divOverflow = 0;
  let prevAEnd = -1;
  let last = 0;
  let m;
  while (m = tag.exec(s)) {
    if (m.index > last) w.text(s.slice(last, m.index));
    last = tag.lastIndex;
    const t = m[0];
    const closing = t[1] === "/";
    const name = tagName(t);
    const adjacentLinks = name === "a" && !closing && m.index === prevAEnd;
    prevAEnd = closing && (name === "a" || m.index === prevAEnd && INLINE_TAGS.has(name)) ? tag.lastIndex : -1;
    if (!name) continue;
    if (name === "div") {
      if (closing) {
        if (divOverflow) divOverflow--;
        else divs.pop();
      } else if (divs.length < MAX_BLOCK_DEPTH * 4) divs.push(t);
      else divOverflow++;
    }
    const heading = /^h[1-6]$/.test(name) ? Number(name[1]) : 0;
    if (w.heading) {
      if (heading) {
        w.flush();
        headingEnd = -1;
        if (closing) continue;
      } else if (BLOCK_TAGS.has(name) || name === "br" || name === "hr") {
        if (headingEnd >= 0 && m.index < headingEnd) {
          w.space();
          continue;
        }
        w.flush();
        headingEnd = -1;
      }
    }
    if (heading) {
      w.flush();
      if (closing) continue;
      w.heading = heading;
      headingEdge.lastIndex = tag.lastIndex;
      const edge = headingEdge.exec(s);
      headingEnd = edge && edge[0][1] === "/" ? edge.index : -1;
      continue;
    }
    if (name === "pre" && !closing && !preUnclosed) {
      const close = closeTagRe("pre");
      close.lastIndex = tag.lastIndex;
      const c = close.exec(s);
      if (c) {
        w.flush();
        w.codeBlock(s.slice(tag.lastIndex, c.index), codeLanguage(t, s.slice(tag.lastIndex, c.index), divs));
        last = tag.lastIndex = c.index + c[0].length;
        continue;
      }
      preUnclosed = true;
    }
    if (name === "table" && !closing) {
      const region = tables.get(m.index);
      const table = region && !isLayoutTable(t, s, region) ? extractTables(s.slice(region.from, region.to))[0] : void 0;
      if (region && table) {
        w.flush();
        const escaped = {
          ...table.caption ? { caption: escapeText(table.caption) } : {},
          headers: table.headers.map((cell2) => escapeText(cell2)),
          rows: table.rows.map((row) => row.map((cell2) => escapeText(cell2)))
        };
        w.block(tableToMarkdown(escaped).split("\n"));
        last = tag.lastIndex = region.to;
        continue;
      }
    }
    switch (name) {
      case "ul":
      case "ol":
        w.flush();
        if (closing) w.closeList();
        else w.openList(name === "ol", listStart(t));
        continue;
      case "li":
        w.flush();
        if (closing) w.closeItem();
        else w.openItem();
        continue;
      case "blockquote":
        w.flush();
        if (closing) w.closeQuote();
        else w.openQuote();
        continue;
      case "hr":
        w.flush();
        w.rule();
        continue;
      case "br":
        w.hardBreak();
        continue;
      case "img":
        w.image(htmlAttributes(t), base2);
        continue;
    }
    const kind = INLINE_KIND[name];
    if (kind) {
      if (closing) {
        w.close(kind);
        continue;
      }
      if (adjacentLinks) w.space();
      if (kind === "a") {
        w.close("a");
        const href = htmlAttributes(t).get("href");
        w.open("a", linkTarget(href, base2), href?.trimStart().startsWith("#"));
      } else w.open(kind);
      continue;
    }
    if (BLOCK_TAGS.has(name)) w.flush();
    else if (!INLINE_TAGS.has(name)) w.space();
  }
  if (last < s.length) w.text(s.slice(last));
  return w.finish();
}
function withoutNul(html) {
  return html.includes(NUL) ? html.split(NUL).join("\uFFFD") : html;
}
function flank(marker, core, start, end) {
  const link = core.includes("](");
  const movable = (i) => {
    const c = core[i];
    if (!(c === " " || FLANK_PUNCT.test(c)) || MARKUP_CHARS.includes(c) || core[i - 1] === "\\") return false;
    return c === "(" || c === ")" ? !link : !(c === "!" && core[i + 1] === "[");
  };
  let from = 0;
  let to = core.length;
  if (start) while (from < to && movable(from)) from++;
  if (end) while (to > from && movable(to - 1)) to--;
  if (from === to) return core;
  return `${core.slice(0, from)}${marker}${core.slice(from, to)}${marker}${core.slice(to)}`;
}
function wrapInline(f, core, inHeading) {
  switch (f.kind) {
    case "em":
      return `*${core}*`;
    case "strong":
      return `**${core}**`;
    case "code": {
      const code = core.replace(/\s+/g, " ");
      const ticks = "`".repeat(longestRun(code, "`") + 1);
      const pad2 = code[0] === "`" || code[code.length - 1] === "`" ? " " : "";
      return `${ticks}${pad2}${code}${pad2}${ticks}`;
    }
    default:
      if (inHeading && PERMALINK_TEXT.test(core)) return "";
      if (inHeading && f.self) return core;
      return `[${core.replace(/\n{2,}/g, "\n")}](${destination(f.href)})`;
  }
}
function escapeText(s, edges) {
  let out2 = s.replace(ALWAYS_SYNTAX, "\\$&").replace(EDGE_UNDERSCORE, "\\_").replace(HTML_LIKE, "\\<").replace(ENTITY_LIKE, "\\&").replace(STRIKE, "\\~");
  if (edges?.after) out2 = out2.replace(OPEN_END, "\\$&");
  if (edges?.before && out2[0] === "~") out2 = `\\${out2}`;
  return out2;
}
function escapeLineStart(line) {
  const c = line[0];
  if (c === "#") return /^#{1,6}(?:\s|$)/.test(line) ? `\\${line}` : line;
  if (c === ">") return `\\${line}`;
  if (c === "-" || c === "+" || c === "=") return /^[-+=](?:\s|$)/.test(line) || /^(?:[-=]\s*)+$/.test(line) ? `\\${line}` : line;
  const ordered = /^(\d{1,9})[.)](?=\s|$)/.exec(line);
  return ordered ? `${ordered[1]}\\${line.slice(ordered[1].length)}` : line;
}
function longestRun(s, ch) {
  let best = 0;
  let run = 0;
  for (let i = 0; i < s.length; i++) {
    run = s[i] === ch ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}
function linkTarget(raw, base2) {
  const href = raw === void 0 ? "" : afterControls(decodeEntities(raw).replace(/[\t\n\r]/g, "")).trim();
  if (!href || UNFOLLOWABLE.test(href)) return void 0;
  try {
    const url = new URL(href, base2);
    return UNFOLLOWABLE.test(url.protocol) ? void 0 : url.href;
  } catch {
    return base2 === void 0 ? href : void 0;
  }
}
function afterControls(s) {
  let i = 0;
  while (i < s.length && s.charCodeAt(i) <= 32) i++;
  return s.slice(i);
}
function destination(url) {
  const d = url.replace(/[ <>\\]/g, (c) => encodeURIComponent(c));
  let depth = 0;
  for (const c of d) {
    if (c === "(") depth++;
    else if (c === ")" && --depth < 0) break;
  }
  return depth === 0 ? d : d.replace(/[()]/g, "\\$&");
}
function documentBaseUrl(html, pageUrl) {
  if (!/<base[\s/>]/i.test(html)) return pageUrl;
  for (const m of dropElements(html, ["script", "style", "template"], RAW_TEXT_ELEMENTS).matchAll(BASE_TAG)) {
    const href = htmlAttributes(m[0]).get("href");
    if (href === void 0) continue;
    try {
      const base2 = new URL(decodeEntities(href).trim(), pageUrl);
      return base2.protocol === "data:" || base2.protocol === "javascript:" ? pageUrl : base2.href;
    } catch {
      return pageUrl;
    }
  }
  return pageUrl;
}
function codeLanguage(pre, inner, divs) {
  const code = /^\s*(<code(?=[\s/>])[^<>]*>)/i.exec(inner)?.[1];
  for (const t of [pre, code, divs[divs.length - 1], divs[divs.length - 2]]) {
    if (!t) continue;
    const lang = LANGUAGE_CLASS.exec(htmlAttributes(t).get("class") ?? "")?.[1]?.toLowerCase();
    if (lang && !NO_LANGUAGE.has(lang)) return lang;
  }
  return "";
}
function isLayoutTable(open2, html, region) {
  if (/^(?:presentation|none)$/i.test(htmlAttributes(open2).get("role")?.trim() ?? "")) return true;
  const inner = new RegExp(LAYOUT_INSIDE.source, "gi");
  inner.lastIndex = region.start;
  const next = inner.exec(html);
  return next !== null && next.index < region.end;
}
function listStart(open2) {
  const n = Number.parseInt(htmlAttributes(open2).get("start") ?? "", 10);
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? n : 1;
}
var NUL;
var TABLE_OPEN;
var HEADING_EDGE;
var MAX_BLOCK_DEPTH;
var MAX_INLINE_DEPTH;
var INLINE_KIND;
var Writer;
var FLANK_PUNCT;
var FLANK_WORD;
var MARKUP_CHARS;
var PERMALINK_TEXT;
var HTML_SPACE;
var ALWAYS_SYNTAX;
var EDGE_UNDERSCORE;
var HTML_LIKE;
var ENTITY_LIKE;
var STRIKE;
var OPEN_END;
var UNFOLLOWABLE;
var BASE_TAG;
var LANGUAGE_CLASS;
var NO_LANGUAGE;
var LAYOUT_INSIDE;
var init_markdown2 = __esm({
  "src/markdown.ts"() {
    "use strict";
    init_entities();
    init_html();
    init_tables();
    NUL = "\0";
    TABLE_OPEN = /<table[\s/>]/i;
    HEADING_EDGE = /<\/h[1-6]\s*>|<h[1-6](?=[\s/>])/;
    MAX_BLOCK_DEPTH = 24;
    MAX_INLINE_DEPTH = 16;
    INLINE_KIND = {
      a: "a",
      em: "em",
      i: "em",
      strong: "strong",
      b: "strong",
      code: "code",
      kbd: "code",
      samp: "code",
      tt: "code"
    };
    Writer = class {
      heading = 0;
      lines = [];
      blocks = [];
      blockOverflow = 0;
      parts = [];
      frames = [];
      pendingSpace = false;
      needBlank = false;
      /** The list closed last: its container's depth, its kind, and how many lines were written by then. */
      closedList;
      /** An emphasis just written that ends in punctuation, whose closing marker a letter pushed next would spoil. */
      flanked;
      text(raw) {
        const decoded = decodeEntities(raw.includes("<") ? raw.replace(LOOSE_TAG_RE, " ") : raw).replace(HTML_SPACE, " ");
        if (!decoded) return;
        const core = decoded.trim();
        if (decoded[0] === " ") this.space();
        if (core) this.push(this.inCode() ? core : escapeText(core, { before: this.joinsBefore(decoded[0] !== " "), after: decoded[decoded.length - 1] !== " " }));
        if (core && decoded[decoded.length - 1] === " ") this.space();
      }
      space() {
        if (this.parts.length) this.pendingSpace = true;
      }
      hardBreak() {
        if (this.heading || this.inCode()) this.space();
        else if (this.parts.length) {
          this.parts.push("\n");
          this.pendingSpace = false;
        }
      }
      open(kind, href, self) {
        if (this.frames.length >= MAX_INLINE_DEPTH) return;
        const inert = kind === "a" && href === void 0 || this.inCode() || kind !== "a" && this.frames.some((f) => f.kind === kind);
        this.frames.push({ kind, start: this.parts.length, ...href !== void 0 ? { href } : {}, ...self ? { self } : {}, ...inert ? { inert } : {} });
      }
      /** Close the innermost open `kind`, and whatever opened inside it and never closed. */
      close(kind) {
        let i = this.frames.length - 1;
        while (i >= 0 && this.frames[i].kind !== kind) i--;
        if (i < 0) return;
        while (this.frames.length > i) this.wrap(this.frames.pop());
      }
      image(attrs, base2) {
        const candidates2 = [attrs.get("src"), attrs.get("data-src"), attrs.get("data-original"), attrs.get("srcset")?.trim().split(/\s+/)[0]];
        const src = candidates2.map((c) => linkTarget(c, base2)).find((u) => u !== void 0);
        const pixel = ["width", "height"].some((d) => /^[01]$/.test(attrs.get(d)?.trim() ?? ""));
        if (!src || pixel || this.inCode()) {
          this.space();
          return;
        }
        const alt = decodeEntities(attrs.get("alt") ?? "").replace(HTML_SPACE, " ").trim();
        this.push(`![${escapeText(alt)}](${destination(src)})`);
      }
      codeBlock(inner, lang) {
        const body = decodeEntities(inner.replace(/<br\s*\/?>/gi, "\n").replace(LOOSE_TAG_RE, "")).replace(/\r\n?/g, "\n").replace(/^\n/, "").trimEnd();
        if (!body.trim()) return;
        const fence = "`".repeat(Math.max(3, longestRun(body, "`") + 1));
        this.block([fence + lang, ...body.split("\n"), fence]);
      }
      rule() {
        this.block(["***"]);
      }
      openList(ordered, start) {
        const top = this.blocks[this.blocks.length - 1];
        if (top?.kind === "list" && top.items && this.blocks.length + 1 < MAX_BLOCK_DEPTH) this.blocks.push({ kind: "item", marker: top.last, first: false });
        if (!this.room()) return;
        const item = this.blocks[this.blocks.length - 1];
        if (item?.kind === "item" && !item.first && (!ordered || start === 1)) this.needBlank = false;
        const prev = this.closedList;
        const alt = prev !== void 0 && prev.depth === this.blocks.length && prev.ordered === ordered && prev.lines === this.lines.length && !prev.alt;
        this.blocks.push({ kind: "list", ordered, alt, next: start, items: 0, last: "" });
      }
      closeList() {
        if (this.blockOverflow) {
          this.blockOverflow--;
          return;
        }
        const i = this.nearest("list");
        if (i < 0) return;
        const { ordered, alt } = this.blocks[i];
        this.closedList = { depth: i, ordered, alt, lines: this.lines.length };
        this.blocks.length = i;
        this.needBlank = true;
      }
      openItem() {
        if (this.blockOverflow) {
          this.blockOverflow++;
          return;
        }
        let list = this.nearest("list");
        if (list >= 0) this.blocks.length = list + 1;
        else {
          if (!this.room()) return;
          this.blocks.push({ kind: "list", ordered: false, alt: false, next: 1, items: 0, last: "" });
          list = this.blocks.length - 1;
        }
        if (!this.room()) return;
        const owner = this.blocks[list];
        const marker = owner.ordered ? `${owner.next++}${owner.alt ? ")" : "."} ` : owner.alt ? "+ " : "- ";
        owner.last = marker;
        this.blocks.push({ kind: "item", marker, first: true });
        if (owner.items++) this.needBlank = false;
      }
      closeItem() {
        if (this.blockOverflow) {
          this.blockOverflow--;
          return;
        }
        for (let i = this.blocks.length - 1; i >= 0; i--) {
          const kind = this.blocks[i].kind;
          if (kind === "list") return;
          if (kind === "item") {
            this.blocks.length = i;
            return;
          }
        }
      }
      openQuote() {
        if (this.room()) this.blocks.push({ kind: "quote", first: true });
      }
      closeQuote() {
        if (this.blockOverflow) {
          this.blockOverflow--;
          return;
        }
        const i = this.nearest("quote");
        if (i < 0) return;
        this.blocks.length = i;
        this.needBlank = true;
      }
      /**
       * End the paragraph or heading in progress and write it out. The inline
       * elements still open close over the text so far and reopen for what
       * follows, so a link wrapped round a heading and a paragraph — a card —
       * links both.
       */
      flush() {
        const open2 = this.frames.map((f) => ({ ...f }));
        while (this.frames.length) this.wrap(this.frames.pop());
        const text = this.parts.join("");
        this.parts = [];
        this.flanked = void 0;
        this.pendingSpace = false;
        this.frames = open2.map((f) => ({ ...f, start: 0 }));
        const level = this.heading;
        this.heading = 0;
        if (level) {
          const title = text.replace(/\s+/g, " ").trim();
          if (title) this.block([`${"#".repeat(level)} ${title.replace(/(^|\s)(#+)$/, "$1\\$2")}`]);
          return;
        }
        let para = [];
        for (const raw of `${text}

`.split("\n")) {
          const line = raw.trim();
          if (line) {
            para.push(escapeLineStart(line));
            continue;
          }
          if (!para.length) continue;
          this.block(para.map((l, i) => i < para.length - 1 ? `${l}  ` : l));
          para = [];
        }
      }
      /** Write finished lines under the open blocks' prefixes, a blank line before them where one is due. */
      block(content) {
        if (!content.length) return;
        if (this.needBlank && this.lines.length) this.lines.push(this.prefix(false).trimEnd());
        for (const line of content) {
          const prefix = this.prefix(true);
          this.lines.push(line ? prefix + line : prefix.trimEnd());
        }
        this.needBlank = true;
      }
      finish() {
        this.flush();
        return this.lines.join("\n").trimEnd();
      }
      push(markdown) {
        const f = this.flanked;
        this.flanked = void 0;
        if (f && !this.pendingSpace && f.at === this.parts.length - 1 && FLANK_WORD.test(markdown[0] ?? "")) {
          this.parts[f.at] = flank(f.marker, f.core, f.start, true);
        }
        if (this.pendingSpace) this.parts.push(" ");
        this.pendingSpace = false;
        this.parts.push(markdown);
      }
      inCode() {
        return this.frames.some((f) => f.kind === "code");
      }
      /**
       * Whether text pushed next will stand straight after something other than
       * a space or a line start: the text before it, when `touching` it, or the
       * marker of an emphasis or link that opens where it starts (the marker goes
       * in when the element closes, and moves the element's leading space outside).
       */
      joinsBefore(touching) {
        const last = this.parts[this.parts.length - 1];
        if (touching && !this.pendingSpace && last !== void 0 && last !== "\n") return true;
        return this.frames.some((f) => !f.inert && f.start === this.parts.length);
      }
      /** Replace an element's text with its Markdown, its outer whitespace kept outside it. */
      wrap(f) {
        if (f.inert) return;
        const trailing = this.pendingSpace;
        this.pendingSpace = false;
        if (this.flanked && this.flanked.at >= f.start) this.flanked = void 0;
        const content = this.parts.splice(f.start).join("");
        const core = content.trim();
        const lead = content.slice(0, content.length - content.trimStart().length);
        const trail = content.slice(content.trimEnd().length);
        this.whitespace(lead);
        if (core) {
          let markdown = wrapInline(f, core, this.heading > 0);
          const last = this.parts.length - 1;
          if (f.kind === "a" && markdown && !this.pendingSpace && this.parts[last]?.endsWith("!")) this.parts[last] = `${this.parts[last].slice(0, -1)}\\!`;
          const marker = f.kind === "em" ? "*" : f.kind === "strong" ? "**" : "";
          if (marker) {
            const start = !this.pendingSpace && FLANK_WORD.test(this.parts[last]?.slice(-1) ?? "") && FLANK_PUNCT.test(core[0]);
            if (start) markdown = flank(marker, core, true, false);
            this.push(markdown);
            if (FLANK_PUNCT.test(core[core.length - 1])) this.flanked = { at: this.parts.length - 1, marker, core, start };
          } else this.push(markdown);
        }
        this.whitespace(trail);
        if (trailing) this.space();
      }
      whitespace(ws) {
        if (ws.includes("\n")) {
          if (this.parts.length) this.parts.push("\n");
          this.pendingSpace = false;
        } else if (ws) this.space();
      }
      prefix(consume) {
        let p = "";
        for (const b of this.blocks) {
          if (b.kind === "quote") {
            if (consume || !b.first) p += "> ";
            if (consume) b.first = false;
          } else if (b.kind === "item") {
            p += b.first && consume ? b.marker : " ".repeat(b.marker.length);
            if (consume) b.first = false;
          }
        }
        return p;
      }
      nearest(kind) {
        for (let i = this.blocks.length - 1; i >= 0; i--) if (this.blocks[i].kind === kind) return i;
        return -1;
      }
      /** Whether one more block may nest; past the bound it is counted instead, and its close uncounted. */
      room() {
        if (this.blocks.length < MAX_BLOCK_DEPTH) return true;
        this.blockOverflow++;
        return false;
      }
    };
    FLANK_PUNCT = /[\p{P}\p{S}]/u;
    FLANK_WORD = /[^\s\p{P}\p{S}]/u;
    MARKUP_CHARS = "\\*`[]";
    PERMALINK_TEXT = /^(?:¶|#|§|🔗)$/u;
    HTML_SPACE = /[ \t\n\r\f]+/g;
    ALWAYS_SYNTAX = /[\\`*[\]]/g;
    EDGE_UNDERSCORE = /(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu;
    HTML_LIKE = /<(?=[a-zA-Z/!?])/g;
    ENTITY_LIKE = /&(?=#?[a-zA-Z0-9]+;)/g;
    STRIKE = /~(?=~)|(?<=[^\t\n\f\r\p{Zs}])~/gu;
    OPEN_END = /(?:<|&#?[a-zA-Z0-9]*)$/;
    UNFOLLOWABLE = /^(?:javascript|vbscript|data):/i;
    BASE_TAG = /<base(?=[\s/>])[^<>"']*(?:(?:"[^"]*"|'[^']*')[^<>"']*)*>/gi;
    LANGUAGE_CLASS = /(?:^|\s)(?:(?:language|lang|highlight(?:-source)?)-|brush:\s*)([\w+#.-]+)/i;
    NO_LANGUAGE = /* @__PURE__ */ new Set(["none", "nohighlight", "plaintext"]);
    LAYOUT_INSIDE = /<(?:table|pre)[\s/>]/;
  }
});
var LANG_COUNTRY;
var SCRIPT_COUNTRY;
var REGION_ALIASES;
var DDG_LANG_ALIASES;
var DDG_KL;
var NO_REGION;
var init_locale = __esm({
  "src/locale.ts"() {
    "use strict";
    LANG_COUNTRY = {
      en: "us",
      pt: "br",
      ja: "jp",
      zh: "cn",
      ko: "kr",
      sv: "se",
      da: "dk",
      cs: "cz",
      el: "gr",
      nb: "no",
      // Bokmål → Norway
      nn: "no",
      // Nynorsk → Norway
      uk: "ua",
      // Ukrainian language → Ukraine
      ar: "sa",
      he: "il",
      hi: "in",
      et: "ee",
      vi: "vn",
      ms: "my",
      fa: "ir",
      ca: "es",
      sl: "si",
      sr: "rs",
      tl: "ph",
      fil: "ph",
      ga: "ie",
      cy: "gb",
      eu: "es",
      gl: "es",
      sq: "al",
      bs: "ba",
      be: "by",
      ka: "ge",
      hy: "am",
      kk: "kz",
      af: "za",
      sw: "ke",
      ur: "pk",
      bn: "bd",
      ta: "in",
      te: "in",
      mr: "in",
      ne: "np",
      si: "lk",
      km: "kh",
      lo: "la",
      lb: "lu"
    };
    SCRIPT_COUNTRY = {
      "zh-hant": "tw",
      "zh-hans": "cn"
    };
    REGION_ALIASES = {
      gb: "uk",
      en: "us",
      "419": "xl",
      si: "sl"
    };
    DDG_LANG_ALIASES = {
      nb: "no",
      // Bokmål
      nn: "no",
      // Nynorsk
      ja: "jp",
      ko: "kr",
      fil: "tl"
    };
    DDG_KL = {
      ar: "xa-ar",
      ca: "ct-ca",
      "zh-tw": "tw-tzh",
      "zh-hk": "hk-tzh",
      "es-us": "ue-es"
    };
    NO_REGION = "wt";
  }
});
function firecrawlBase(opts = {}) {
  const raw = (opts.firecrawl ?? env("FIRECRAWL") ?? FIRECRAWL_DEFAULT_BASE).trim();
  if (!raw || raw.toLowerCase() === "off") return null;
  return trimTrailing(raw, "/");
}
function firecrawlIsExplicit(opts = {}) {
  return !!(opts.firecrawl ?? env("FIRECRAWL"));
}
function authHeaders() {
  const key = env("FIRECRAWL_KEY");
  return key ? { authorization: `Bearer ${key}` } : void 0;
}
function markFirecrawlDown(base2) {
  for (const explicit of [true, false]) probeCache.markDown(`${base2}|${explicit}`);
}
function looksLikeFirecrawl(contentType, body) {
  if (/firecrawl/i.test(body.slice(0, 4096))) return true;
  return !/^\s*text\/html/i.test(contentType ?? "");
}
function probeFirecrawl(base2, explicit = false) {
  return probeCache.get(`${base2}|${explicit}`, async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS2);
    try {
      const res = await fetch(`${base2}/`, { signal: ctrl.signal });
      const body = await readCappedBytes(res, PROBE_BODY_BYTES).then(
        (b) => b.toString("utf8"),
        () => ""
      );
      return explicit || looksLikeFirecrawl(res.headers.get("content-type"), body);
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  });
}
function apiPrefix(base2) {
  return prefixCache.get(base2) ?? "/v2";
}
async function postJson(base2, path, body, opts) {
  const req = { timeoutMs: opts.timeoutMs, retries: opts.retries, headers: authHeaders() };
  const prefix = apiPrefix(base2);
  const first = await httpJson("POST", `${base2}${prefix}${path}`, body(prefix), req);
  if (first.status !== 404 || prefix !== "/v2") return first;
  prefixCache.set(base2, "/v1");
  return httpJson("POST", `${base2}/v1${path}`, body("/v1"), req);
}
function mapScrapeResponse(json2) {
  if (!json2 || typeof json2 !== "object" || Array.isArray(json2)) return null;
  if (json2.success === false) return null;
  const data = json2.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const markdown = typeof data.markdown === "string" ? data.markdown.trim() : "";
  if (!markdown) return null;
  const meta = data.metadata && typeof data.metadata === "object" ? data.metadata : {};
  const rawTitle = typeof meta.title === "string" ? cleanInline(meta.title) : "";
  const asked = typeof meta.sourceURL === "string" && meta.sourceURL ? meta.sourceURL : void 0;
  const landed = typeof meta.url === "string" && meta.url ? meta.url : void 0;
  const src = asked ?? landed;
  const final = landed ?? asked;
  const status = typeof meta.statusCode === "number" ? meta.statusCode : void 0;
  return {
    markdown,
    ...rawTitle ? { title: rawTitle } : {},
    ...src ? { sourceURL: src } : {},
    ...final ? { finalUrl: final } : {},
    ...status !== void 0 ? { statusCode: status } : {}
  };
}
async function scrapeViaFirecrawl(url, opts = {}) {
  const base2 = firecrawlBase(opts);
  if (!base2) return {};
  if (!await probeFirecrawl(base2, firecrawlIsExplicit(opts))) {
    return firecrawlIsExplicit(opts) ? { why: `Firecrawl not reachable at ${base2} \u2014 used the built-in extractor.` } : {};
  }
  const r = await postJson(
    base2,
    "/scrape",
    () => ({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      blockAds: true,
      removeBase64Images: true,
      maxAge: SCRAPE_MAX_AGE_MS,
      timeout: SCRAPE_TIMEOUT_MS - SERVER_MARGIN_MS.scrape
    }),
    // No retry: the built-in extractor is the fallback, and a second attempt
    // at a browser render that just failed doubles the wait for nothing.
    { timeoutMs: SCRAPE_TIMEOUT_MS, retries: 0 }
  );
  if (!r.ok) {
    if (!r.status) markFirecrawlDown(base2);
    const why = r.status ? `status ${r.status}` : r.error ?? "no response";
    return { why: `Firecrawl could not scrape ${url} (${why}) \u2014 fell back to the built-in extractor.` };
  }
  const data = mapScrapeResponse(r.data);
  if (!data) return { why: `Firecrawl returned no markdown for ${url} \u2014 fell back to the built-in extractor.` };
  return { data };
}
var FIRECRAWL_DEFAULT_BASE;
var PROBE_TIMEOUT_MS2;
var PROBE_BODY_BYTES;
var SCRAPE_TIMEOUT_MS;
var SEARCH_TIMEOUT_MS;
var SERVER_MARGIN_MS;
var SCRAPE_MAX_AGE_MS;
var PROBE_DOWN_TTL_MS;
var ProbeMemo;
var probeCache;
var prefixCache;
var init_firecrawl = __esm({
  "src/firecrawl.ts"() {
    "use strict";
    init_brand();
    init_fetch();
    init_locale();
    init_trim();
    FIRECRAWL_DEFAULT_BASE = "http://localhost:3002";
    PROBE_TIMEOUT_MS2 = 2e3;
    PROBE_BODY_BYTES = 4096;
    SCRAPE_TIMEOUT_MS = 45e3;
    SEARCH_TIMEOUT_MS = 3e4;
    SERVER_MARGIN_MS = { scrape: 5e3, search: 2e3 };
    SCRAPE_MAX_AGE_MS = 24 * 60 * 60 * 1e3;
    PROBE_DOWN_TTL_MS = 3e4;
    ProbeMemo = class {
      entries = /* @__PURE__ */ new Map();
      /** The verdict for `key`, probing when there is none or a "down" one expired. */
      get(key, probe) {
        const hit2 = this.entries.get(key);
        if (hit2 && (hit2.downAt === void 0 || Date.now() - hit2.downAt < PROBE_DOWN_TTL_MS)) return hit2.verdict;
        const entry = { verdict: probe() };
        void entry.verdict.then((up) => {
          if (!up) entry.downAt = Date.now();
        });
        this.entries.set(key, entry);
        return entry.verdict;
      }
      markDown(key) {
        this.entries.set(key, { verdict: Promise.resolve(false), downAt: Date.now() });
      }
      clear() {
        this.entries.clear();
      }
    };
    probeCache = new ProbeMemo();
    prefixCache = /* @__PURE__ */ new Map();
  }
});
function normalizeForgeHost(host) {
  const h = host.trim().toLowerCase();
  const bare = h.replace(/^www\./, "");
  return WWW_ALIASED.has(bare) ? bare : h;
}
function githubRawUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return void 0;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:" || normalizeForgeHost(u.hostname) !== "github.com") return void 0;
  const m = /^\/([^/]+)\/([^/]+)\/blob\/([^/]+\/.+)$/.exec(u.pathname);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : void 0;
}
var KINDS;
var WWW_ALIASED;
var init_forge_host = __esm({
  "src/forge-host.ts"() {
    "use strict";
    init_brand();
    KINDS = /* @__PURE__ */ new Set(["github", "gitlab", "gitea"]);
    WWW_ALIASED = /* @__PURE__ */ new Set(["github.com", "gitlab.com", "codeberg.org", "bitbucket.org"]);
  }
});
function challengeUrl(url) {
  let target;
  try {
    const u = new URL(url);
    target = `${u.pathname}${u.search}`;
  } catch {
    return void 0;
  }
  return CHALLENGE_URLS.some((re) => re.test(target)) ? "anti-bot challenge page" : void 0;
}
var MIN_USEFUL_CHARS;
var LOCAL_WALLS;
var WALL_MAX_CHARS;
var ADDRESSES_READER;
var ADDRESSES_READER_DE;
var IMPERATIVE;
var CHALLENGE_URLS;
var init_walls = __esm({
  "src/walls.ts"() {
    "use strict";
    init_junk();
    MIN_USEFUL_CHARS = 300;
    LOCAL_WALLS = [
      [/\bcookies? (must|need to|have to|should) be (enabled|turned on|allowed)\b/i, "cookie wall"],
      [/\benable cookies (for|on|in)\b[\s\S]{0,160}?\b(reload|refresh|continue)\b/i, "cookie wall"],
      [/\b(your browser|this browser) (does not|doesn't) (accept|support) cookies\b/i, "cookie wall"],
      [/\bwe value your privacy\b[\s\S]{0,600}?\b(accept|agree|consent)\b/i, "cookie/consent wall"],
      [/\b(accept|allow) all cookies\b[\s\S]{0,400}?\b(reject|decline|manage|settings|preferences)\b/i, "cookie/consent wall"],
      [/\b(please )?(enable|turn on) javascript\b[\s\S]{0,120}?\b(to continue|to proceed|and reload|and refresh|to view|to use)\b/i, "JavaScript-required shell"],
      [/\byou need to enable javascript to run this app\b/i, "JavaScript-required shell"],
      [/\bpour continuer,? (veuillez )?activer (les cookies|javascript)\b|\bles cookies doivent être activés\b/i, "cookie wall (fr)"]
    ];
    WALL_MAX_CHARS = 2e3;
    ADDRESSES_READER = /\b(you|your|yours|vous|votre|vos)\b/i;
    ADDRESSES_READER_DE = /\b(Sie|Ihr|Ihre|Ihnen)\b/;
    IMPERATIVE = /^\W*(please\s+)?(accept|allow|agree|enable|turn on|reload|refresh|click|tap|continue|manage|reject|decline|sign in|log in|subscribe|veuillez|acceptez|activez|cliquez|continuer)\b/i;
    CHALLENGE_URLS = [
      /\/apology_objects?\//i,
      // fda.gov and other Akamai-fronted sites: abuse-detection-apology.html
      /\/abuse[-_]detection\b/i,
      /\/verify[-_]human\//i,
      // developer.apple.com/forums/verify-human/verify.html
      /\/cdn-cgi\/challenge-platform\//i,
      // Cloudflare
      /[?&]__cf_chl_\w*=/i,
      /\/\.within\.website\/x\/cmd\/anubis\//i,
      // Anubis
      /\/\.well-known\/sgcaptcha\b/i,
      // SiteGround
      /\/_incapsula_resource\b/i,
      // Imperva
      /\/distil_r_(?:captcha|blocked)\b/i,
      // Distil
      // A gate at the site's root; anywhere deeper (/wiki/CAPTCHA) it is a topic.
      /^\/(?:captcha|bot[-_]?check|are[-_]you[-_](?:a[-_])?(?:human|robot))(?:\/|\.html?\b|$|\?)/i
    ];
  }
});
function browserUa() {
  return env("UA") || DEFAULT_BROWSER_UA;
}
function contactUa() {
  const b = brand();
  return `${b.name}/${b.version ?? "1.x"} (+${b.contactUrl ?? `https://github.com/maxgfr/${b.name}`})`;
}
function defaultUa() {
  return brand().defaultUa === "contact" ? contactUa() : browserUa();
}
function sleepUnlessAborted(ms, signal) {
  return new Promise((resolve9) => {
    if (signal?.aborted) return resolve9();
    const done = () => {
      clearTimeout(t);
      signal?.removeEventListener("abort", done);
      resolve9();
    };
    const t = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}
function detectRateLimited(status, headers) {
  if (status === 429) return true;
  return status === 403 && headers.get("x-ratelimit-remaining") === "0";
}
function parseRetryAfter(headers, capMs = 5e3) {
  const h = headers.get("retry-after");
  if (!h) return void 0;
  const secs = Number(h);
  if (Number.isFinite(secs)) return Math.min(Math.max(0, secs) * 1e3, capMs);
  const when = Date.parse(h);
  if (Number.isFinite(when)) return Math.min(Math.max(0, when - Date.now()), capMs);
  return void 0;
}
function attemptsFor(retries) {
  return retries === void 0 ? maxAttempts() : Math.min(4, Math.max(0, Math.trunc(retries))) + 1;
}
function networkFailure(e) {
  const err = e;
  const code = typeof err?.cause?.code === "string" ? err.cause.code : void 0;
  const detail = typeof err?.cause?.message === "string" && err.cause.message ? err.cause.message : code;
  if (!detail) return typeof err?.message === "string" ? err.message : String(e);
  return code && !detail.includes(code) ? `${code}: ${detail}` : detail;
}
async function readCappedBytes(res, max) {
  const reader = res.body?.getReader?.();
  if (!reader) return Buffer.from(await res.arrayBuffer()).subarray(0, max);
  const chunks = [];
  let total = 0;
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    const chunk = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    const remaining = max - total;
    if (chunk.length >= remaining) {
      chunks.push(chunk.subarray(0, remaining));
      await reader.cancel().catch(() => {
      });
      break;
    }
    chunks.push(chunk);
    total += chunk.length;
  }
  return Buffer.concat(chunks);
}
async function readMeasuredBody(res, max) {
  const read3 = await readCappedBytes(res, max + 1);
  const bytes = read3.subarray(0, max);
  return { bytes, bytesRead: bytes.length, truncated: read3.length > max };
}
function isBinaryDocument(contentType) {
  return /application\/pdf/i.test(contentType) || docFormatForContentType(contentType) !== void 0;
}
function dispositionFilename(header2) {
  if (!header2) return void 0;
  let name;
  const extended = /filename\*\s*=\s*[^'\s;]*'[^']*'([^;\s]+)/i.exec(header2);
  if (extended) {
    try {
      name = decodeURIComponent(extended[1]);
    } catch {
      name = void 0;
    }
  }
  if (name === void 0) {
    const plain2 = /filename\s*=\s*(?:"((?:\\.|[^"\\])*)"|([^;]+))/i.exec(header2);
    name = plain2 ? plain2[1]?.replace(/\\(.)/g, "$1") ?? plain2[2].trim() : void 0;
  }
  return name?.split(/[\\/]/).pop() || void 0;
}
async function authorizedGet(url, init, authorize) {
  let target = url;
  const fail = (error, redirectFailed) => ({
    failure: { ok: false, status: 0, body: "", contentType: "", url: target, error, ...redirectFailed ? { redirectFailed } : {} }
  });
  const headers = { ...init.headers };
  let method = (init.method ?? "GET").toUpperCase();
  let body = init.body;
  for (let redirects = 0; ; redirects++) {
    try {
      if (!await authorize(target)) return fail(`URL not authorized: ${target}`);
    } catch (e) {
      return fail(`URL authorization failed for ${target}: ${e.message}`);
    }
    const response = await fetch(target, { ...init, method, body, headers: { ...headers }, redirect: "manual" });
    const location = response.headers.get("location");
    if (!REDIRECT_STATUS.has(response.status) || !location) return { response };
    await response.body?.cancel().catch(() => {
    });
    if (redirects >= 20) return fail("Too many redirects (maximum 20)", true);
    try {
      const next = new URL(location, target);
      if (!/^https?:$/.test(next.protocol)) return fail(`Unsupported redirect protocol: ${next.protocol}`, true);
      if (next.origin !== new URL(target).origin) for (const h of CREDENTIAL_HEADERS) delete headers[h];
      if (response.status === 303 ? method !== "HEAD" && method !== "GET" : (response.status === 301 || response.status === 302) && method === "POST") {
        method = "GET";
        body = void 0;
        delete headers["content-type"];
      }
      target = next.href;
    } catch {
      return fail(`Invalid redirect URL from ${target}`, true);
    }
  }
}
async function httpGet(url, opts = {}) {
  const attempts = attemptsFor(opts.retries);
  let last = { ok: false, status: 0, body: "", contentType: "", url };
  const timeoutMs = opts.timeoutMs ?? defaultTimeoutMs2();
  const cancelled = () => ({ ok: false, status: 0, body: "", contentType: "", url, error: "cancelled" });
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (opts.signal?.aborted) return cancelled();
    const ctrl = new AbortController();
    const onCancel = () => ctrl.abort();
    opts.signal?.addEventListener("abort", onCancel, { once: true });
    let t;
    let remainingMs = timeoutMs;
    let startedAt = 0;
    let timedOut = false;
    const expire = () => {
      timedOut = true;
      ctrl.abort();
    };
    const pauseTimeout = () => {
      if (t === void 0) return;
      clearTimeout(t);
      t = void 0;
      remainingMs -= performance.now() - startedAt;
    };
    const resumeTimeout = () => {
      startedAt = performance.now();
      if (remainingMs <= 0) expire();
      else t = setTimeout(expire, remainingMs);
    };
    try {
      const headers = { "user-agent": opts.userAgent ?? defaultUa(), accept: opts.accept ?? "*/*" };
      if (opts.acceptLanguage) headers["accept-language"] = opts.acceptLanguage;
      for (const [k, v] of Object.entries(opts.headers ?? {})) headers[k.toLowerCase()] = v;
      const init = {
        signal: ctrl.signal,
        redirect: "follow",
        headers
      };
      if (!opts.authorizeUrl) resumeTimeout();
      const requested = opts.authorizeUrl ? await authorizedGet(url, init, async (target) => {
        pauseTimeout();
        const allowed = await opts.authorizeUrl(target);
        if (allowed) resumeTimeout();
        return allowed;
      }) : carriesCredential(headers) ? await authorizedGet(url, init, anyUrl) : { response: await fetch(url, init) };
      if ("failure" in requested) return requested.failure;
      const res = requested.response;
      const meta = {
        contentType: res.headers.get("content-type") ?? "",
        url: res.url || url,
        etag: res.headers.get("etag") ?? void 0,
        lastModified: res.headers.get("last-modified") ?? void 0,
        rateLimited: detectRateLimited(res.status, res.headers),
        retryAfterMs: parseRetryAfter(res.headers, Number.POSITIVE_INFINITY)
      };
      const mime = mimeOf(meta.contentType);
      const filename = dispositionFilename(res.headers.get("content-disposition"));
      const namedDocument = isBinaryDocument(meta.contentType) || namesDocument(filename);
      const ambiguous = AMBIGUOUS_TYPES.has(mime);
      const declared = Number(res.headers.get("content-length"));
      const documentCap = namedDocument || ambiguous ? opts.maxDocumentBytes : void 0;
      const pastDocumentCap = !namedDocument && documentCap !== void 0 && declared > documentCap;
      const max = opts.maxBytes ?? (pastDocumentCap ? Math.min(documentCap, DEFAULT_MAX_RESPONSE_BYTES) : documentCap) ?? DEFAULT_MAX_RESPONSE_BYTES;
      const prefixUseless = opts.binary || namedDocument || NON_TEXT_TYPE_RE.test(mime) || Object.keys(opts.headers ?? {}).some((k) => k.toLowerCase() === "range");
      if (Number.isFinite(declared) && declared > max && prefixUseless) {
        ctrl.abort();
        return { ok: false, status: res.status, body: "", bytesRead: 0, truncated: true, ...meta, error: `response too large: ${declared} bytes > ${max} cap` };
      }
      const wait = RETRY_STATUS.has(res.status) && attempt < attempts - 1 ? retryDelayMs(meta.retryAfterMs) : void 0;
      if (wait !== void 0) {
        await res.body?.cancel();
        last = { ok: false, status: res.status, body: "", bytesRead: 0, truncated: false, ...meta };
        if (wait > 0) opts.onBackOff?.(meta.url, wait);
        await sleepUnlessAborted(wait, opts.signal);
        continue;
      }
      let { bytes, bytesRead, truncated } = res.status === 304 ? { bytes: Buffer.alloc(0), bytesRead: 0, truncated: false } : await readMeasuredBody(res, max);
      countFetch(bytes.length, false);
      const sniffed = ambiguous ? sniffDocument(bytes) : void 0;
      if (ambiguous && !namedDocument && !sniffed && opts.maxBytes === void 0 && bytes.length > DEFAULT_MAX_RESPONSE_BYTES) {
        bytes = bytes.subarray(0, DEFAULT_MAX_RESPONSE_BYTES);
        bytesRead = bytes.length;
        truncated = true;
      }
      const keepBytes = opts.binary || (namedDocument || sniffed !== void 0) && !truncated;
      const binaryBody = opts.binary || sniffed !== void 0 || isBinaryDocument(meta.contentType) && !mime.startsWith("text/");
      const result = {
        ok: res.ok,
        status: res.status,
        // Decoded per the response's own encoding, not assumed UTF-8. A
        // Windows-1252 page used to come back with every accented character
        // replaced by U+FFFD, and nothing anywhere noticed.
        body: binaryBody ? "" : decodeBody(bytes, meta.contentType),
        bytes: keepBytes ? bytes : void 0,
        bytesRead,
        truncated,
        ...meta,
        ...filename ? { filename } : {}
      };
      return result;
    } catch (e) {
      if (!timedOut && opts.signal?.aborted) return cancelled();
      const error = timedOut ? `timed out after ${timeoutMs} ms` : networkFailure(e);
      last = {
        ok: false,
        status: 0,
        body: "",
        contentType: "",
        url,
        error,
        ...!timedOut && /redirect count exceeded/i.test(error) ? { redirectFailed: true } : {}
      };
      if (timedOut || isPermanentFailure(e)) break;
      if (attempt < attempts - 1) await sleepUnlessAborted(defaultRetryMs(), opts.signal);
    } finally {
      clearTimeout(t);
      opts.signal?.removeEventListener("abort", onCancel);
    }
  }
  return last;
}
async function httpJson(method, url, body, opts = {}) {
  const attempts = attemptsFor(opts.retries);
  let last = { ok: false, status: 0, data: void 0 };
  const timeoutMs = opts.timeoutMs ?? defaultTimeoutMs2();
  const cancelled = { ok: false, status: 0, data: void 0, error: "cancelled" };
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (opts.signal?.aborted) return cancelled;
    const ctrl = new AbortController();
    const onCancel = () => ctrl.abort();
    opts.signal?.addEventListener("abort", onCancel, { once: true });
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, timeoutMs);
    try {
      const headers = {
        "content-type": "application/json",
        accept: opts.accept ?? "application/json",
        "user-agent": opts.userAgent ?? defaultUa()
      };
      if (opts.acceptLanguage) headers["accept-language"] = opts.acceptLanguage;
      for (const [k, v] of Object.entries(opts.headers ?? {})) headers[k.toLowerCase()] = v;
      const init = { method, signal: ctrl.signal, headers, body: body === void 0 ? void 0 : JSON.stringify(body) };
      const requested = carriesCredential(headers) ? await authorizedGet(url, init, anyUrl) : { response: await fetch(url, init) };
      if ("failure" in requested) {
        last = { ok: false, status: 0, data: void 0, error: requested.failure.error };
        break;
      }
      const res = requested.response;
      const wait = RETRY_STATUS.has(res.status) && attempt < attempts - 1 ? retryDelayMs(parseRetryAfter(res.headers, Number.POSITIVE_INFINITY)) : void 0;
      if (wait !== void 0) {
        await res.body?.cancel();
        last = { ok: false, status: res.status, data: void 0 };
        await sleepUnlessAborted(wait, opts.signal);
        continue;
      }
      const max = opts.maxBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
      const { bytes, bytesRead, truncated } = await readMeasuredBody(res, max);
      countFetch(bytes.length, false);
      if (truncated) {
        ctrl.abort();
        return { ok: false, status: res.status, data: void 0, bytesRead, truncated, error: `response too large: over the ${max}-byte cap` };
      }
      const text = bytes.toString("utf8");
      let data;
      try {
        data = text ? JSON.parse(text) : void 0;
      } catch {
        data = text;
      }
      return { ok: res.ok, status: res.status, data, bytesRead, truncated };
    } catch (e) {
      if (!timedOut && opts.signal?.aborted) return cancelled;
      last = timedOut ? { ok: false, status: 0, data: void 0, error: `timed out after ${timeoutMs} ms`, timedOut: true } : { ok: false, status: 0, data: void 0, error: networkFailure(e) };
      if (timedOut || isPermanentFailure(e)) break;
      if (attempt < attempts - 1) await sleepUnlessAborted(defaultRetryMs(), opts.signal);
    } finally {
      clearTimeout(t);
      opts.signal?.removeEventListener("abort", onCancel);
    }
  }
  return opts.signal?.aborted ? cancelled : last;
}
function cleanInline(s) {
  const text = decodeEntities(String(s));
  const opened = /* @__PURE__ */ new Set();
  const closed = /* @__PURE__ */ new Set();
  for (const m of text.matchAll(INLINE_FORMAT_TAG)) (m[1] ? closed : opened).add(m[2].toLowerCase());
  return text.replace(INLINE_FORMAT_TAG, (tag, slash, rawName, attrs) => {
    const name = rawName.toLowerCase();
    if (name.startsWith("mml:") || name.startsWith("jats:")) return "";
    if (!INLINE_FORMAT.has(name)) return tag;
    if (name === "br") return " ";
    const markup = attrs.trim().replace(/\/$/, "") !== "" || name === "wbr" || (slash ? opened : closed).has(name);
    return markup ? "" : tag;
  }).replace(/\s+/g, " ").trim();
}
function preSlotIndex(line) {
  if (line.length < 3 || line[0] !== NUL2 || line[line.length - 1] !== NUL2) return void 0;
  const i = Number(line.slice(1, -1));
  return Number.isInteger(i) ? i : void 0;
}
function restoreInlinePre(line, blocks) {
  const parts = line.split(NUL2);
  let out2 = parts[0];
  for (let i = 1; i < parts.length; i += 2) {
    const code = (blocks[Number(parts[i])] ?? "").replace(/\s+/g, " ").trim();
    out2 += ` ${code} ${parts[i + 1] ?? ""}`;
  }
  return out2.replace(/ {2,}/g, " ").trim();
}
function setAsidePre(html, blocks) {
  const open2 = /<pre(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/gi;
  const close = closeTagRe("pre");
  let out2 = "";
  let last = 0;
  let m;
  while (m = open2.exec(html)) {
    close.lastIndex = open2.lastIndex;
    const c = close.exec(html);
    if (!c) break;
    const inner = html.slice(open2.lastIndex, c.index);
    const text = decodeEntities(inner.replace(/<br\s*\/?>/gi, "\n").replace(LOOSE_TAG_RE, "")).replace(/\r\n?/g, "\n").replace(/^\n/, "").trimEnd();
    blocks.push(text);
    out2 += html.slice(last, m.index) + PRE_SLOT(blocks.length - 1);
    last = open2.lastIndex = c.index + c[0].length;
  }
  return last === 0 ? html : out2 + html.slice(last);
}
function flattenHeadings(html) {
  let out2 = "";
  let last = 0;
  let m;
  HEADING_OPEN.lastIndex = 0;
  while (m = HEADING_OPEN.exec(html)) {
    HEADING_BOUNDARY.lastIndex = HEADING_OPEN.lastIndex;
    const b = HEADING_BOUNDARY.exec(html);
    if (!b) break;
    if (b[0][1] !== "/") continue;
    const text = html.slice(HEADING_OPEN.lastIndex, b.index).replace(PERMALINK, "").replace(TAG_RE, (tag) => INLINE_TAGS.has(tagName(tag)) ? "" : " ").replace(/\s+/g, " ").trim();
    out2 += html.slice(last, m.index) + (text ? `
${"#".repeat(Number(m[1]))} ${text}
` : "\n");
    last = HEADING_OPEN.lastIndex = b.index + b[0].length;
  }
  return last === 0 ? html : out2 + html.slice(last);
}
function htmlToText(html, opts = {}) {
  const hidden = opts.fullPage ? HIDDEN_ELEMENTS : [...HIDDEN_ELEMENTS, ...CHROME_ELEMENTS];
  let s = dropElements(html.includes(NUL2) ? html.split(NUL2).join("\uFFFD") : html, hidden, RAW_TEXT_ELEMENTS);
  if (!opts.fullPage) s = dropLanguageSelectors(dropLandmarks(s, CHROME_ROLES));
  const pre = [];
  s = setAsidePre(s, pre).replace(/[\r\n]+/g, " ").replace(PRE_SLOT_INLINE, (slot) => `
${slot}
`);
  s = flattenHeadings(s);
  let prevAEnd = -1;
  s = s.replace(TAG_RE, (tag, at) => {
    const closing = tag[1] === "/";
    const name = tagName(tag);
    const adjacentLinks = name === "a" && !closing && at === prevAEnd;
    prevAEnd = closing && (name === "a" || at === prevAEnd && INLINE_TAGS.has(name)) ? at + tag.length : -1;
    if (/^h[1-6]$/.test(name)) {
      return closing ? "\n" : "\n" + "#".repeat(Number(name[1])) + " ";
    }
    if (BLOCK_TAGS.has(name) || name === "br" || name === "hr") return "\n";
    if (INLINE_TAGS.has(name)) return adjacentLinks ? " " : "";
    return " ";
  });
  s = s.replace(LOOSE_TAG_RE, " ");
  s = decodeEntities(s);
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return s.split("\n").map((l) => {
    const t = l.trim();
    const slot = preSlotIndex(t);
    if (slot !== void 0) return pre[slot] ?? t;
    return t.includes(NUL2) ? restoreInlinePre(t, pre) : t;
  }).filter((l) => l.length > 0).join("\n");
}
function pageTitleIn(clean3) {
  return firstElementText(clean3, "title") ?? metaContent(clean3, ["og:title", "twitter:title"]) ?? firstElementText(clean3, "h1");
}
function absoluteCanonical(href, base2) {
  if (!href) return void 0;
  try {
    const u = new URL(href, base2);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : void 0;
  } catch {
    return void 0;
  }
}
function isContentContainer(open2) {
  const attrs = htmlAttributes(open2);
  for (const token of `${attrs.get("id") ?? ""} ${attrs.get("class") ?? ""}`.toLowerCase().split(/\s+/)) {
    if (token === "markdown-body") return true;
    const words = token.split(/\W+/);
    if (words.some((w) => CONTENT_WORDS.has(w)) && !words.some((w) => CHROME_WORDS.has(w))) return true;
  }
  return false;
}
function blockKind(open2) {
  const tag = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(open2)?.[1]?.toLowerCase() ?? "";
  const firstClass = (htmlAttributes(open2).get("class") ?? "").trim().split(/\s+/)[0];
  return `${tag} ${firstClass.replace(/\d+/g, "0")}`;
}
function textProfile(html) {
  const at = [];
  const len = [];
  const link = [];
  const prose = [];
  let inA = false;
  let inP = false;
  let total = 0;
  let linked = 0;
  let para = 0;
  let last = 0;
  for (const m of html.matchAll(LOOSE_TAG_RE)) {
    const n = html.slice(last, m.index).replace(/\s+/g, " ").trim().length;
    total += n;
    if (inA) linked += n;
    else if (inP) para += n;
    at.push(m.index);
    len.push(total);
    link.push(linked);
    prose.push(para);
    last = m.index + m[0].length;
    const name = tagName(m[0]);
    const closing = m[0][1] === "/";
    if (name === "a") inA = !closing;
    else if (name === "p") inP = !closing;
    else if (!closing && CLOSES_P.has(name)) inP = false;
  }
  const index = (pos) => {
    let lo = 0;
    let hi = at.length - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (at[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };
  return (from, to) => {
    if (!at.length) return { len: 0, link: 0, prose: 0 };
    const i = index(from);
    const j = index(to);
    return { len: len[j] - len[i], link: link[j] - link[i], prose: prose[j] - prose[i] };
  };
}
function headlineProse(clean3, stats, lists, minProse) {
  const firstAtOrAfter = (pos) => {
    let lo = 0;
    let hi = lists.length;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (lists[mid].from < pos) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const inList = (pos) => {
    const k = firstAtOrAfter(pos + 1) - 1;
    return k >= 0 && pos < lists[k].to;
  };
  const h1 = [...clean3.matchAll(/<h1(?=[\s/>])/gi)].map((m) => m.index).find((pos) => !inList(pos));
  if (h1 === void 0) return void 0;
  const ancestors = ["div", "section", "article", "main"].flatMap((tag) => balancedRegions(clean3, tag, () => true)).filter((r) => r.start <= h1 && h1 < r.end).sort((a, b) => a.end - a.start - (b.end - b.start));
  const cum = [{ len: 0, link: 0, prose: 0 }];
  for (const r of lists) {
    const s = stats(r.from, r.to);
    const p = cum[cum.length - 1];
    cum.push({ len: p.len + s.len, link: p.link + s.link, prose: p.prose + s.prose });
  }
  const measure = (r) => {
    const i2 = firstAtOrAfter(r.start);
    const j2 = Math.max(i2, firstAtOrAfter(r.end));
    const s = stats(r.start, r.end);
    const cut = { len: cum[j2].len - cum[i2].len, link: cum[j2].link - cum[i2].link, prose: cum[j2].prose - cum[i2].prose };
    return { region: r, i: i2, j: j2, cut: cut.len, len: s.len - cut.len, link: s.link - cut.link, prose: s.prose - cut.prose };
  };
  let best;
  for (const r of ancestors) {
    const m = measure(r);
    if (m.prose < minProse || m.prose < m.cut || isLinkList(m)) continue;
    if (!best || m.prose >= best.prose * 1.3) best = m;
  }
  if (!best) return void 0;
  const { region, i, j } = best;
  let out2 = "";
  let last = region.start;
  for (const r of lists.slice(i, j)) {
    out2 += `${clean3.slice(last, r.from)} `;
    last = r.to;
  }
  return out2 + clean3.slice(last, region.end);
}
function extractMainHtml(html) {
  const clean3 = dropElements(html, ["script", "style", "template", "svg"]);
  const roleMainTags = /* @__PURE__ */ new Set(["main"]);
  for (const m of clean3.matchAll(ROLE_MAIN_TAG)) roleMainTags.add(m[1].toLowerCase());
  const stats = textProfile(clean3);
  const tiers = [
    { tags: [...roleMainTags], isCandidate: (open2) => /^<main[\s/>]/i.test(open2) || ROLE_MAIN.test(open2) },
    { tags: ["article"], isCandidate: () => true },
    { tags: ["div", "section"], isCandidate: isContentContainer }
  ];
  for (const tier of tiers) {
    const regions = tier.tags.flatMap((tag) => balancedRegions(clean3, tag, tier.isCandidate)).sort((a, b) => a.start - b.start);
    if (!regions.length) continue;
    const outer = [];
    let reach = -1;
    for (const r of regions) {
      if (r.start < reach) continue;
      reach = r.end;
      outer.push({ ...r, len: visibleLength(clean3.slice(r.start, r.end)) });
    }
    let best = outer[0];
    for (const r of outer) if (r.len > best.len) best = r;
    const linkList = (r) => isLinkList(stats(r.start, r.end));
    const kind = blockKind(best.open);
    const bestIsList = linkList(best);
    const kept = outer.filter((r) => r === best || blockKind(r.open) === kind && (bestIsList || !linkList(r)));
    if (bestIsList) {
      const listProse = kept.reduce((n, r) => n + stats(r.start, r.end).prose, 0);
      const prose = headlineProse(clean3, stats, outer.filter(linkList), Math.max(MIN_PROSE, listProse + 1));
      if (prose !== void 0) return prose;
    }
    const keptLen = kept.reduce((n, r) => n + r.len, 0);
    if (keptLen < 500 && keptLen < visibleLength(clean3) * 0.3) return html;
    if (kept.length === 1) return clean3.slice(best.start, best.end);
    return kept.map((r) => `<div>${clean3.slice(r.start, r.end)}</div>`).join("\n");
  }
  return html;
}
function looksLikePdfUrl(url) {
  if (PDF_URL_RE.test(url)) return true;
  return PDF_ROUTE_RE.test(url) && !NON_PDF_TAIL_RE.test(url);
}
async function fetchAndExtract(url, opts = {}) {
  const cancelled = () => ({ text: "", finalUrl: url, status: 0, note: `Fetching ${url} was cancelled.` });
  if (opts.signal?.aborted) return cancelled();
  const video = opts.video === false ? void 0 : knownVideo(url);
  if (video) {
    if (opts.authorizeUrl) {
      let refusal2;
      try {
        if (!await opts.authorizeUrl(url)) refusal2 = "the URL is not authorized";
      } catch (e) {
        refusal2 = `its authorization failed (${e.message})`;
      }
      if (refusal2) return { text: "", finalUrl: url, status: 0, note: `Refused ${url}: ${refusal2}.` };
    }
    const t = await transcribeVideo(url, {
      lang: opts.acceptLanguage?.split(/[,;]/)[0]?.trim() || void 0,
      signal: opts.signal,
      knownHostsOnly: true
    });
    if (opts.signal?.aborted) return cancelled();
    const text = transcriptMarkdown(t);
    if (!text && !PURE_VIDEO_HOSTS.has(video.site)) {
      const page = await fetchAndExtract(url, { ...opts, video: false });
      return { ...page, note: [`No video read at ${url} (${t.reason ?? "no transcript"}); read as a page.`, page.note].filter(Boolean).join(" ") };
    }
    return {
      text,
      title: t.meta?.title,
      finalUrl: t.meta?.webpageUrl ?? url,
      status: text ? 200 : 0,
      documentType: "video",
      ...t.via ? { extractor: t.via } : {},
      ...t.reason ? { note: `No transcript for ${url}: ${t.reason}.` } : {}
    };
  }
  const raw = opts.fullPage ? void 0 : githubRawUrl(url);
  if (raw) {
    const file = await fetchAndExtract(raw, opts);
    if (opts.signal?.aborted) return cancelled();
    if (file.status === 304 || file.text.trim()) return { ...file, finalUrl: url };
  }
  const wantsPdf = looksLikePdfUrl(url);
  const wantsDoc = wantsPdf ? void 0 : docFormatForUrl(url);
  const browser = opts.authorizeUrl || opts.headers || wantsPdf || wantsDoc ? "off" : browserFetchModeFor(opts);
  const handoff = (got2) => got2.handoff ? { handoff: got2.handoff } : {};
  if (browser === "always") {
    const got2 = await renderInBrowser(url, opts);
    if (got2.result) return got2.result;
    const res2 = await readWithoutBrowser(url, opts, wantsPdf, wantsDoc, { page: false });
    return { ...res2, note: [`${got2.note}; read without it.`, got2.detail, res2.note].filter(Boolean).join(" "), ...handoff(got2) };
  }
  const seen = { page: false };
  const res = await readWithoutBrowser(url, opts, wantsPdf, wantsDoc, seen);
  const walled = opts.human && res.status >= 200 && res.status < 300 ? humanWall(res.text) : void 0;
  const why = browser === "fallback" && seen.page && !opts.signal?.aborted ? worthRendering(res) ?? (walled ? `read a ${walled}` : void 0) : void 0;
  if (!why) return res;
  const got = await renderInBrowser(url, opts);
  if (got.result?.text.trim())
    return { ...got.result, note: [`Read ${url} in the browser: the built-in fetch ${why}.`, got.result.note].filter(Boolean).join(" ") };
  return {
    ...res,
    note: [res.note, got.result ? got.result.note : `${got.note}.`, got.detail].filter(Boolean).join(" ") || void 0,
    ...handoff(got.result ?? got)
  };
}
async function renderInBrowser(url, opts) {
  try {
    const { readRenderedPage: readRenderedPage2 } = await Promise.resolve().then(() => (init_read(), read_exports));
    const { format, fullPage, stripConsent, keepHtml, signal, timeoutMs, human } = opts;
    const result = await readRenderedPage2(url, { format, fullPage, stripConsent, keepHtml, signal, timeoutMs, ...human ? { human } : {} });
    if (result.status >= 400)
      return { note: `The browser got HTTP ${result.status} for ${url}`, detail: result.note, ...result.handoff ? { handoff: result.handoff } : {} };
    return { result };
  } catch (e) {
    return { note: `The browser could not read ${url} (${e instanceof Error ? e.message : String(e)})` };
  }
}
async function readWithoutBrowser(url, opts, wantsPdf, wantsDoc, seen) {
  const cancelled = () => ({ text: "", finalUrl: url, status: 0, note: `Fetching ${url} was cancelled.` });
  let firecrawlNote;
  if (!wantsPdf && !wantsDoc && !opts.authorizeUrl && !opts.fullPage && !opts.headers) {
    const fc = await scrapeViaFirecrawl(url, opts);
    if (fc.data && (fc.data.statusCode ?? 200) < 400) {
      seen.page = true;
      return {
        text: fc.data.markdown,
        title: fc.data.title,
        finalUrl: fc.data.finalUrl || url,
        status: fc.data.statusCode ?? 200,
        extractor: "firecrawl"
      };
    }
    firecrawlNote = fc.data ? `Firecrawl got HTTP ${fc.data.statusCode} for ${url} \u2014 fell back to the built-in extractor.` : fc.why;
  }
  const base2 = wantsPdf ? PDF_FETCH_OPTS : wantsDoc ? DOC_FETCH_OPTS : { accept: "text/html,text/plain,*/*", acceptLanguage: opts.acceptLanguage };
  const fetchOpts = {
    ...base2,
    maxDocumentBytes: PDF_FETCH_OPTS.maxBytes,
    headers: opts.headers,
    authorizeUrl: opts.authorizeUrl,
    timeoutMs: opts.timeoutMs,
    onBackOff: opts.onBackOff,
    signal: opts.signal
  };
  if (opts.signal?.aborted) return cancelled();
  let res = await httpGet(url, fetchOpts);
  if (opts.signal?.aborted) return cancelled();
  const toldToWait = (res.retryAfterMs ?? 0) > RETRY_AFTER_CAP_MS;
  let asBrowser = brand().defaultUa !== "contact";
  if (!res.ok && !toldToWait && !asBrowser && (res.status === 403 || res.status === 429)) {
    res = await httpGet(url, { ...fetchOpts, userAgent: browserUa(), acceptLanguage: opts.acceptLanguage ?? "en-US,en;q=0.9" });
    asBrowser = true;
  }
  if (!toldToWait && challengeUrl(res.url) && !challengeUrl(url)) {
    const again = await httpGet(
      url,
      asBrowser ? { ...fetchOpts, userAgent: contactUa() } : { ...fetchOpts, userAgent: browserUa(), acceptLanguage: opts.acceptLanguage ?? "en-US,en;q=0.9" }
    );
    if (opts.signal?.aborted) return cancelled();
    if (again.status !== 0 && !challengeUrl(again.url)) res = again;
  }
  if (challengeUrl(res.url)) {
    seen.page = true;
    return { text: "", finalUrl: res.url, status: res.status, note: `Could not read ${url}: it was redirected to an anti-bot challenge (${res.url}).` };
  }
  if (res.status === 304) {
    return { text: "", finalUrl: res.url, status: 304, etag: res.etag ?? opts.headers?.["if-none-match"], lastModified: res.lastModified };
  }
  if (!res.ok) {
    seen.page = !(res.truncated && res.status >= 200 && res.status < 300);
    const wait = res.retryAfterMs !== void 0 ? `, retry after ${Math.ceil(res.retryAfterMs / 1e3)} s` : "";
    const why = res.status === 429 ? `rate-limited (HTTP 429${wait})` : `status ${res.status}${res.error ? ", " + res.error : ""}${wait}`;
    return {
      text: "",
      finalUrl: res.url,
      status: res.status,
      note: `Could not fetch ${url} (${why}).`,
      ...res.rateLimited ? { rateLimited: true } : {},
      ...res.retryAfterMs !== void 0 ? { retryAfterMs: res.retryAfterMs } : {}
    };
  }
  const validators = res.etag || res.lastModified ? { etag: res.etag, lastModified: res.lastModified } : {};
  const mime = mimeOf(res.contentType);
  const claimsPdf = wantsPdf || /application\/pdf/i.test(res.contentType) || res.filename !== void 0 && PDF_URL_RE.test(res.filename);
  const claimsDoc = claimsPdf ? void 0 : wantsDoc ?? docFormatForContentType(res.contentType) ?? (res.filename ? docFormatForUrl(res.filename) : void 0);
  if (res.truncated && (claimsPdf || claimsDoc || !res.body && res.bytesRead)) {
    return { text: "", finalUrl: res.url, status: res.status, note: `Fetched ${url} but the document exceeds the response size cap.` };
  }
  const sniffed = res.bytes ? sniffDocument(res.bytes) : void 0;
  if (!sniffed && NON_TEXT_TYPE_RE.test(mime)) {
    return { text: "", finalUrl: res.url, status: res.status, note: `Fetched ${url} but it is ${mime}, not a text document.`, ...validators };
  }
  const answeredHtml = !sniffed && (claimsPdf || claimsDoc !== void 0) && HTML_TYPE_RE.test(mime);
  const route2 = sniffed ?? (answeredHtml ? void 0 : claimsPdf ? "pdf" : claimsDoc);
  if (route2 === "pdf") {
    const bytes = res.bytes ?? (await httpGet(url, { ...PDF_FETCH_OPTS, headers: opts.headers, authorizeUrl: opts.authorizeUrl, timeoutMs: opts.timeoutMs, signal: opts.signal })).bytes;
    const got = bytes ? await extractPdf(bytes, {
      firecrawl: async () => {
        if (opts.authorizeUrl) return void 0;
        const fc = await scrapeViaFirecrawl(url, opts);
        return fc.data && (fc.data.statusCode ?? 200) < 400 ? fc.data.markdown : void 0;
      }
    }) : { text: "", reason: "empty response body" };
    return {
      text: got.text,
      documentType: "pdf",
      finalUrl: res.url,
      status: res.status,
      // `native` keeps reporting as absent, which is what the cache key and every
      // existing dossier already assume.
      extractor: got.via && got.via !== "native" ? got.via : void 0,
      note: got.text ? firecrawlNote : `Fetched ${url} but could not extract text \u2014 ${got.reason}.`,
      ...validators
    };
  }
  if (route2) {
    const docFmt = route2;
    const bytes = res.bytes ?? (await httpGet(url, { ...DOC_FETCH_OPTS, headers: opts.headers, authorizeUrl: opts.authorizeUrl, timeoutMs: opts.timeoutMs, signal: opts.signal })).bytes;
    const got = bytes ? await extractDocument(bytes, docFmt, {
      firecrawl: async () => {
        if (opts.authorizeUrl) return void 0;
        const fc = await scrapeViaFirecrawl(url, opts);
        return fc.data && (fc.data.statusCode ?? 200) < 400 ? fc.data.markdown : void 0;
      }
    }) : { text: "", reason: "empty response body" };
    if (!got.text && docFmt.textFallback && bytes?.length) {
      return { text: decodeBody(bytes, res.contentType), documentType: "doc", finalUrl: res.url, status: res.status, note: firecrawlNote, ...validators };
    }
    return {
      text: got.text,
      documentType: "doc",
      finalUrl: res.url,
      status: res.status,
      extractor: got.via,
      note: got.text ? firecrawlNote : `Fetched ${url} but could not extract text \u2014 ${got.reason}.`,
      ...validators
    };
  }
  const ambiguousType = AMBIGUOUS_TYPES.has(mime);
  if (ambiguousType && res.body.slice(0, 1024).includes("\0")) {
    return {
      text: "",
      finalUrl: res.url,
      status: res.status,
      note: `Fetched ${url} but it is binary data (${mime || "no content-type"}), not a text document.`,
      ...validators
    };
  }
  const body = !res.body && res.bytes ? decodeBody(res.bytes, res.contentType) : res.body;
  const isHtml = HTML_TYPE_RE.test(mime) || ambiguousType && /^\s*<(?:!doctype\s+html\b|html\b|head\b|body\b|article\b|main\b|p\b|h[1-6]\b)/i.test(body);
  seen.page = isHtml;
  const extracted = isHtml ? extractFromHtml(body, res.url, opts) : { text: trimBlankLines(body), consentDropped: 0, title: void 0, canonical: void 0, metaDescription: void 0 };
  const notDocument = answeredHtml ? `${url} looked like ${claimsPdf ? "a PDF" : "an office document"} but the server returned HTML (a login wall or landing page?), so it was read as a web page.` : void 0;
  const cut = res.truncated ? `Read only the first ${res.bytesRead} bytes of ${url} (the response size cap), so this text is a prefix.` : void 0;
  return {
    ...extracted,
    finalUrl: res.url,
    status: res.status,
    note: [firecrawlNote, notDocument, cut].filter(Boolean).join(" ") || void 0,
    ...res.truncated ? { truncated: true } : {},
    ...validators
  };
}
function extractFromHtml(html, finalUrl, opts = {}) {
  const markdown = opts.format === "markdown";
  const main2 = opts.fullPage ? html : extractMainHtml(html);
  const stripped = markdown ? markdownAgainst(main2, documentBaseUrl(html, finalUrl), opts.fullPage) : htmlToText(main2, opts);
  const consent = opts.stripConsent && !opts.fullPage ? stripConsentBoilerplate(stripped, { markdown }) : { text: stripped, dropped: 0 };
  const clean3 = dropElements(html, METADATA_HIDDEN);
  return {
    text: consent.text,
    consentDropped: consent.dropped,
    title: pageTitleIn(clean3),
    canonical: absoluteCanonical(canonicalHref(clean3), finalUrl),
    metaDescription: metaDescriptionOf(clean3),
    ...opts.keepHtml ? { html } : {}
  };
}
function trimBlankLines(s) {
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 10) start = i + 1;
    else if (c !== 32 && c !== 9 && c !== 13) break;
  }
  let end = s.length;
  for (let i = s.length - 1; i >= start; i--) {
    const c = s.charCodeAt(i);
    if (c === 10) end = i + 1;
    else if (c !== 32 && c !== 9 && c !== 13) break;
  }
  return start === 0 && end === s.length ? s : s.slice(start, end);
}
function stripConsentBoilerplate(text, opts = {}) {
  if (opts.markdown) return stripConsentMarkdown(text);
  let dropped = 0;
  const kept = text.split("\n").filter((line) => {
    const isBanner = isConsentLine(line.trim());
    if (isBanner) dropped++;
    return !isBanner;
  });
  return { text: kept.join("\n"), dropped };
}
function isConsentLine(t) {
  const hits = CONSENT_PATTERNS.reduce((n, re) => n + (re.test(t) ? 1 : 0), 0);
  return BUTTON_LABEL.test(t) || hits >= 1 && t.length <= BUTTON_LENGTH && (hits >= 2 || CONSENT_ACTIONS.some((re) => re.test(t))) || hits >= 1 && t.length < NOTICE_LENGTH && BANNER_VOICE.test(t);
}
function visibleText(line) {
  return line.replace(MD_LINE_START, "").replace(MD_DESTINATION, "]").replace(MD_MARKUP, "").trim();
}
function stripConsentMarkdown(text) {
  let dropped = 0;
  let fence = "";
  const kept = [];
  for (const line of text.split("\n")) {
    const f = MD_FENCE.exec(line);
    if (fence) {
      if (f && f[1][0] === fence[0] && f[1].length >= fence.length && !f[2].trim()) fence = "";
      kept.push(line);
      continue;
    }
    if (f) fence = f[1];
    else if (!line.trim()) {
      if (kept.length && kept[kept.length - 1].trim()) kept.push(line);
      continue;
    } else if (!/^[\s>]*\|/.test(line) && isConsentLine(visibleText(line))) {
      dropped++;
      continue;
    }
    kept.push(line);
  }
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
  return { text: kept.join("\n"), dropped };
}
function metaDescriptionOf(html) {
  let og;
  for (const match of html.matchAll(/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi)) {
    const attrs = htmlAttributes(match[0]);
    const value = attrs.get("content")?.replace(/\s+/g, " ").trim();
    if (!value) continue;
    if (attrs.get("name")?.toLowerCase() === "description") return decodeEntities(value);
    if (attrs.get("property")?.toLowerCase() === "og:description" && og === void 0) og = decodeEntities(value);
  }
  return og;
}
var DEFAULT_BROWSER_UA;
var RETRY_STATUS;
var defaultTimeoutMs2;
var DEFAULT_MAX_RESPONSE_BYTES;
var mimeOf;
var namesDocument;
var CREDENTIAL_HEADERS;
var carriesCredential;
var anyUrl;
var INLINE_FORMAT;
var INLINE_FORMAT_TAG;
var NUL2;
var PRE_SLOT;
var PRE_SLOT_INLINE;
var HEADING_OPEN;
var HEADING_BOUNDARY;
var PERMALINK;
var visibleLength;
var ROLE_MAIN;
var ROLE_MAIN_TAG;
var CONTENT_WORDS;
var CHROME_WORDS;
var CLOSES_P;
var isLinkList;
var MIN_PROSE;
var PDF_URL_RE;
var PDF_ROUTE_RE;
var NON_PDF_TAIL_RE;
var PDF_FETCH_OPTS;
var DOC_FETCH_OPTS;
var PURE_VIDEO_HOSTS;
var HTML_TYPE_RE;
var NON_TEXT_TYPE_RE;
var DEAD_LINK_STATUS;
var CONSENT_PATTERNS;
var CONSENT_ACTIONS;
var BANNER_VOICE;
var BUTTON_LABEL;
var BUTTON_LENGTH;
var NOTICE_LENGTH;
var MD_FENCE;
var MD_LINE_START;
var MD_DESTINATION;
var MD_MARKUP;
var PROSE_END;
var init_fetch = __esm({
  "src/fetch.ts"() {
    "use strict";
    init_brand();
    init_charset();
    init_entities();
    init_html();
    init_mime();
    init_retry();
    init_text();
    init_markdown2();
    init_pdf();
    init_doc();
    init_firecrawl();
    init_forge_host();
    init_video();
    init_mode();
    init_junk();
    init_walls();
    init_shared();
    DEFAULT_BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    RETRY_STATUS = /* @__PURE__ */ new Set([429, 503, 502, 504]);
    defaultTimeoutMs2 = () => envInt("TIMEOUT_MS", 2e4, 1e3, 3e5);
    DEFAULT_MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
    mimeOf = (contentType) => contentType.split(";")[0].trim().toLowerCase();
    namesDocument = (filename) => filename !== void 0 && (PDF_URL_RE.test(filename) || docFormatForUrl(filename) !== void 0);
    CREDENTIAL_HEADERS = ["authorization", "cookie", "proxy-authorization", "x-api-key", "api-key", "private-token", "x-auth-token"];
    carriesCredential = (headers) => CREDENTIAL_HEADERS.some((h) => headers[h] !== void 0);
    anyUrl = async () => true;
    INLINE_FORMAT = /* @__PURE__ */ new Set([...INLINE_TAGS, "br", "scp"]);
    INLINE_FORMAT_TAG = /<(\/?)([a-zA-Z][\w.-]*(?::[\w.-]+)?)(?=[\s/>])([^<>]*)>/g;
    NUL2 = "\0";
    PRE_SLOT = (i) => `
${NUL2}${i}${NUL2}
`;
    PRE_SLOT_INLINE = new RegExp(`${NUL2}\\d+${NUL2}`, "g");
    HEADING_OPEN = /<h([1-6])(?=[\s/>])(?:[^<>"']|"[^"]*"|'[^']*')*>/gi;
    HEADING_BOUNDARY = /<\/h[1-6]\s*>|<h[1-6](?=[\s/>])/gi;
    PERMALINK = /<a\b[^<>]*>\s*(?:(?:¶|#|§|🔗|&para;|&#182;|&#x[bB]6;|&sect;)\s*)?<\/a\s*>/gi;
    visibleLength = (h) => h.replace(/<[^<>]*>/g, " ").replace(/\s+/g, " ").trim().length;
    ROLE_MAIN = /\srole\s*=\s*["']?main(?=["'\s/>])/i;
    ROLE_MAIN_TAG = /<([a-zA-Z][a-zA-Z0-9-]*)(?=[\s/>])[^<>]*\srole\s*=\s*["']?main(?=["'\s/>])/gi;
    CONTENT_WORDS = /* @__PURE__ */ new Set(["content", "article", "post", "entry", "story", "main", "prose"]);
    CHROME_WORDS = /* @__PURE__ */ new Set([
      "nav",
      "navbar",
      "navigation",
      "menu",
      "header",
      "footer",
      "sidebar",
      "breadcrumb",
      "breadcrumbs",
      "banner",
      "cookie",
      "consent",
      "comment",
      "comments",
      "related",
      "share",
      "social",
      "toolbar",
      "widget",
      "meta",
      "ad",
      "ads",
      "promo"
    ]);
    CLOSES_P = /* @__PURE__ */ new Set([
      "address",
      "article",
      "aside",
      "blockquote",
      "div",
      "dl",
      "fieldset",
      "figure",
      "footer",
      "form",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "header",
      "hr",
      "main",
      "nav",
      "ol",
      "pre",
      "section",
      "table",
      "ul"
    ]);
    isLinkList = (s) => s.len > 0 && s.link > s.len * 0.5;
    MIN_PROSE = 200;
    PDF_URL_RE = /\.pdf($|[?#])/i;
    PDF_ROUTE_RE = /\/pdf\/[^/?#]+($|[?#])/i;
    NON_PDF_TAIL_RE = /\.(html?|php|aspx?|jsp|json|xml|txt|md|csv)($|[?#])/i;
    PDF_FETCH_OPTS = { accept: "application/pdf,*/*", binary: true, maxBytes: 16 * 1024 * 1024 };
    DOC_FETCH_OPTS = { accept: "*/*", binary: true, maxBytes: 16 * 1024 * 1024 };
    PURE_VIDEO_HOSTS = /* @__PURE__ */ new Set(["youtube", "vimeo", "dailymotion"]);
    HTML_TYPE_RE = /^(?:text\/html|application\/xhtml\+xml)$/;
    NON_TEXT_TYPE_RE = /^(?:image\/(?!svg\+xml$)|audio\/|video\/|font\/|model\/|application\/(?:gzip|x-gzip|x-tar|x-bzip2|x-xz|x-7z-compressed|x-rar-compressed|vnd\.rar|java-archive|wasm|x-msdownload|vnd\.android\.package-archive|x-shockwave-flash|ogg)$)/;
    DEAD_LINK_STATUS = /* @__PURE__ */ new Set([404, 410, 451, 403]);
    CONSENT_PATTERNS = [
      /\bcookies?\b/i,
      /\bconsent\b/i,
      /\bgdpr\b/i,
      /\bccpa\b/i,
      /accept all\b/i,
      /reject all\b/i,
      /manage (?:preferences|choices|cookies|settings)/i,
      /privacy (?:policy|preferences|choices)/i,
      /tracking technolog/i,
      /advertising partners/i,
      /legitimate interest/i,
      // FR / DE: the locale layer targets those markets, and their consent
      // managers (Didomi, Usercentrics, OneTrust) speak the local language.
      /\bconsentement\b/i,
      /\brgpd\b/i,
      /\beinwilligung\b/i,
      /\bdsgvo\b/i
    ];
    CONSENT_ACTIONS = [
      /\b(?:accept|reject|decline|agree|allow|manage|preferences|settings|choices)\b/i,
      /\b(?:opt[ -]out|we use cookies|this (?:site|website) uses cookies|by continuing)\b/i,
      /\b(?:learn more|privacy policy|cookie policy)\b/i
    ];
    BANNER_VOICE = /\b(?:we|us|our)\b[^.]{0,60}?\b(?:cookies?|partners|consent|tracking)\b|\bby (?:clicking|continuing|using|browsing)\b|\bthis (?:site|website) uses cookies\b|\bnous (?:utilisons|et nos partenaires)\b|\ben cliquant sur\b|\bwir (?:verwenden|nutzen|setzen|und unsere partner)\b|\bmit (?:dem )?klick auf\b/i;
    BUTTON_LABEL = /^(?:tout (?:accepter|refuser)|(?:accepter|refuser) tout|accepter et (?:fermer|continuer)|continuer sans accepter|(?:param[ée]trer|g[ée]rer|personnaliser|accepter|refuser) (?:les|mes) cookies|alle (?:cookies )?(?:akzeptieren|ablehnen)|nur (?:notwendige|essenzielle)(?: cookies)?|cookie-einstellungen|einstellungen verwalten|akzeptieren und schlie(?:ß|ss)en)$/i;
    BUTTON_LENGTH = 40;
    NOTICE_LENGTH = 400;
    MD_FENCE = /^[\s>]*(`{3,}|~{3,})(.*)$/;
    MD_LINE_START = /^[\s>]*(?:(?:[-+*]|\d{1,9}[.)])\s+)?(?:#{1,6}\s+)?/;
    MD_DESTINATION = /\]\((?:[^()\s\\]|\\.|\([^()\s]*\))*\)/g;
    MD_MARKUP = /\\(?=[!-/:-@[-`{-~])|!?\[|\]|\*+|`+/g;
    PROSE_END = /[.!?…:;]["'”’»)\]]*(?:\[[^\]\s]{1,12}\])*$/;
  }
});
function add(out2, cond, e) {
  if (cond) out2.push(e);
}
function genericEvidence(h, sig) {
  const out2 = [];
  const inTitle = GENERIC_PHRASES.find((p) => h.title.includes(p));
  add(out2, inTitle, { signal: `title mentions "${inTitle}"` });
  if (h.text.length < PHRASE_TEXT_MAX) {
    const inText = GENERIC_PHRASES.find((p) => h.text.includes(p));
    add(out2, inText, { signal: `text mentions "${inText}"` });
  }
  add(out2, frameHas(h, "captcha"), { signal: "captcha frame", widget: true });
  add(out2, sig.status !== void 0 && BLOCKED_STATUS.has(sig.status) && sig.status !== 503 && h.text.trim().length < LITTLE_TEXT, {
    signal: `status ${sig.status} with almost no text`,
    interstitial: true
  });
  return out2;
}
function classifyChallenge(sig) {
  const text = norm((sig.text ?? "").slice(0, 4096));
  const h = {
    title: norm(sig.title),
    text,
    urls: [...sig.frameUrls ?? [], ...sig.scriptUrls ?? []].map(norm),
    frames: (sig.frameUrls ?? []).map(norm),
    scripts: (sig.scriptUrls ?? []).map(norm),
    cookies: (sig.cookieNames ?? []).map(norm),
    selectors: (sig.selectors ?? []).map(norm)
  };
  const statusBlocked = sig.status !== void 0 && BLOCKED_STATUS.has(sig.status);
  const littleText = sig.text !== void 0 && sig.text.trim().length < LITTLE_TEXT;
  const finish = (kind, ev2) => ({
    kind,
    // An empty page makes a block of what is not a widget or a tag; a widget or a tag needs a blocked status.
    blocking: statusBlocked || ev2.some((e) => e.interstitial || littleText && !e.weak && !e.widget),
    signals: ev2.map((e) => e.signal)
  });
  for (const [kind, rule] of VENDORS2) {
    const ev2 = rule(h);
    if (ev2.some((e) => !e.weak) || ev2.length > 0 && statusBlocked) return finish(kind, ev2);
  }
  const ev = genericEvidence(h, sig);
  return ev.length > 0 ? finish("generic", ev) : null;
}
function frameUrls(node, out2 = []) {
  if (!node) return out2;
  if (node.frame?.url) out2.push(node.frame.url);
  for (const c of node.childFrames ?? []) frameUrls(c, out2);
  return out2;
}
async function probeChallenge(session) {
  try {
    const r = await session.page.send(
      "Runtime.evaluate",
      { expression: PROBE, returnByValue: true },
      { timeoutMs: PROBE_TIMEOUT_MS3 }
    );
    const v = r.result?.value;
    if (typeof v !== "object" || v === null) return { ok: false };
    const p = v;
    let tree = [];
    try {
      tree = frameUrls((await session.page.send("Page.getFrameTree")).frameTree);
    } catch {
    }
    const challenge = classifyChallenge({
      url: typeof p.url === "string" ? p.url : "",
      title: typeof p.title === "string" ? p.title : "",
      text: typeof p.text === "string" ? p.text : void 0,
      frameUrls: [...strings(p.iframeSrcs), ...tree],
      scriptUrls: strings(p.scriptUrls),
      cookieNames: strings(p.cookieNames),
      selectors: strings(p.selectors),
      status: typeof p.status === "number" ? p.status : void 0
    });
    return { ok: true, challenge };
  } catch {
    return { ok: false };
  }
}
async function detectChallenge(session) {
  const probe = await probeChallenge(session);
  return probe.ok ? probe.challenge : null;
}
var CHALLENGE_SELECTORS;
var LITTLE_TEXT;
var PHRASE_TEXT_MAX;
var BLOCKED_STATUS;
var norm;
var urlHas;
var frameHas;
var scriptHas;
var selHas;
var datadome;
var CF_ORCHESTRATE;
var cloudflare;
var perimeterx;
var akamai;
var imperva;
var arkose;
var hcaptcha;
var recaptcha;
var VENDORS2;
var GENERIC_PHRASES;
var PROBE_TIMEOUT_MS3;
var PROBE;
var strings;
var init_challenge = __esm({
  "src/browser/challenge.ts"() {
    "use strict";
    CHALLENGE_SELECTORS = [
      "#challenge-form",
      ".cf-turnstile",
      ".g-recaptcha",
      ".h-captcha",
      "#px-captcha",
      'iframe[src*="datadome"]',
      "#sec-if-cpt-container"
    ];
    LITTLE_TEXT = 200;
    PHRASE_TEXT_MAX = 1500;
    BLOCKED_STATUS = /* @__PURE__ */ new Set([403, 429, 503]);
    norm = (s) => s.normalize("NFD").replace(new RegExp("\\p{M}", "gu"), "").replace(/[‘’]/g, "'").toLowerCase();
    urlHas = (h, needle) => h.urls.find((u) => u.includes(needle));
    frameHas = (h, needle) => h.frames.find((u) => u.includes(needle));
    scriptHas = (h, needle) => h.scripts.find((u) => u.includes(needle));
    selHas = (h, needle) => h.selectors.some((s) => s.includes(needle));
    datadome = (h) => {
      const out2 = [];
      const frame = frameHas(h, "captcha-delivery.com");
      add(out2, frame, { signal: "captcha-delivery.com", interstitial: true });
      add(out2, scriptHas(h, "captcha-delivery.com"), { signal: "captcha-delivery.com script", weak: true });
      add(out2, selHas(h, "datadome"), { signal: "datadome frame" });
      add(out2, h.cookies.includes("datadome"), { signal: "datadome cookie", weak: true });
      add(out2, urlHas(h, "datadome.co"), { signal: "datadome.co script", weak: true });
      return out2;
    };
    CF_ORCHESTRATE = /\/cdn-cgi\/challenge-platform\/(?:h\/[a-z]\/)?orchestrate\//;
    cloudflare = (h) => {
      const out2 = [];
      const t = h.title.trim();
      add(out2, t.includes("just a moment") || t.startsWith("un instant") || t.includes("attention required! | cloudflare"), {
        signal: `title "${h.title.trim()}"`,
        interstitial: true
      });
      add(out2, selHas(h, "#challenge-form"), { signal: "#challenge-form", interstitial: true });
      add(out2, urlHas(h, "cf-chl") || urlHas(h, "__cf_chl"), { signal: "cf-chl", interstitial: true });
      const platform2 = h.urls.filter((u) => u.includes("/cdn-cgi/challenge-platform/") && !u.includes("turnstile"));
      add(
        out2,
        platform2.some((u) => CF_ORCHESTRATE.test(u)),
        { signal: "/cdn-cgi/challenge-platform/ orchestrate", interstitial: true }
      );
      add(
        out2,
        platform2.some((u) => !CF_ORCHESTRATE.test(u)),
        { signal: "/cdn-cgi/challenge-platform/", weak: true }
      );
      add(
        out2,
        h.cookies.some((c) => c.startsWith("cf-chl") || c.startsWith("__cf_chl")),
        { signal: "cf-chl cookie", weak: true }
      );
      add(out2, selHas(h, ".cf-turnstile"), { signal: ".cf-turnstile", widget: true });
      add(out2, frameHas(h, "challenges.cloudflare.com"), { signal: "challenges.cloudflare.com frame", widget: true });
      add(out2, scriptHas(h, "challenges.cloudflare.com"), { signal: "challenges.cloudflare.com script", weak: true });
      return out2;
    };
    perimeterx = (h) => {
      const out2 = [];
      add(out2, selHas(h, "px-captcha"), { signal: "#px-captcha", interstitial: true });
      add(out2, h.text.includes("press & hold") || h.text.includes("appuyez et maintenez"), { signal: "Press & Hold", interstitial: true });
      add(out2, urlHas(h, "captcha.px-cdn.net"), { signal: "captcha.px-cdn.net", widget: true });
      const tag = urlHas(h, "px-cdn.net") ?? urlHas(h, "px-cloud.net");
      add(out2, tag, { signal: "px script", weak: true });
      add(
        out2,
        h.cookies.some((c) => c === "_px3" || c === "_pxvid" || c === "_pxhd"),
        { signal: "_px cookie", weak: true }
      );
      return out2;
    };
    akamai = (h) => {
      const out2 = [];
      add(out2, h.title.includes("access denied") && h.text.includes("reference #"), { signal: "Access Denied + Reference #", interstitial: true });
      add(out2, urlHas(h, "sec-if-cpt") || selHas(h, "sec-if-cpt") || selHas(h, "sec-cpt"), { signal: "sec-if-cpt", interstitial: true });
      add(out2, urlHas(h, "edgesuite.net") || h.text.includes("edgesuite.net"), { signal: "edgesuite.net" });
      add(out2, h.cookies.includes("sec_cpt"), { signal: "sec_cpt cookie", weak: true });
      return out2;
    };
    imperva = (h) => {
      const out2 = [];
      add(out2, h.text.includes("incapsula incident id"), { signal: "Incapsula incident ID", interstitial: true });
      add(out2, urlHas(h, "_incapsula_resource") || h.text.includes("_incapsula_resource"), { signal: "_Incapsula_Resource", weak: true });
      add(
        out2,
        h.cookies.some((c) => c.startsWith("incap_ses")),
        { signal: "incap_ses cookie", weak: true }
      );
      return out2;
    };
    arkose = (h) => {
      const out2 = [];
      const f = frameHas(h, "arkoselabs.com") ?? frameHas(h, "funcaptcha");
      add(out2, f, { signal: f?.includes("funcaptcha") ? "funcaptcha" : "arkoselabs.com", widget: true });
      add(out2, scriptHas(h, "arkoselabs.com") ?? scriptHas(h, "funcaptcha"), { signal: "arkose script", weak: true });
      return out2;
    };
    hcaptcha = (h) => {
      const out2 = [];
      add(out2, frameHas(h, "hcaptcha.com"), { signal: "hcaptcha.com frame", widget: true });
      add(out2, scriptHas(h, "hcaptcha.com"), { signal: "hcaptcha.com script", weak: true });
      add(out2, selHas(h, ".h-captcha"), { signal: ".h-captcha", widget: true });
      return out2;
    };
    recaptcha = (h) => {
      const out2 = [];
      add(out2, frameHas(h, "google.com/recaptcha") || frameHas(h, "recaptcha.net"), { signal: "recaptcha frame", widget: true });
      add(out2, scriptHas(h, "google.com/recaptcha") || scriptHas(h, "recaptcha.net"), { signal: "recaptcha script", weak: true });
      add(out2, selHas(h, ".g-recaptcha"), { signal: ".g-recaptcha", widget: true });
      return out2;
    };
    VENDORS2 = [
      ["datadome", datadome],
      ["cloudflare", cloudflare],
      ["perimeterx", perimeterx],
      ["akamai", akamai],
      ["imperva", imperva],
      ["arkose", arkose],
      ["hcaptcha", hcaptcha],
      ["recaptcha", recaptcha]
    ];
    GENERIC_PHRASES = [
      "captcha",
      "are you a robot",
      "are you human",
      "verify you are human",
      "verify you're human",
      "unusual traffic",
      "checking your browser",
      "verifiez que vous etes humain",
      "je ne suis pas un robot"
    ];
    PROBE_TIMEOUT_MS3 = 3e3;
    PROBE = `(() => {
  const sel = ${JSON.stringify(CHALLENGE_SELECTORS)}.filter((s) => { try { return !!document.querySelector(s); } catch { return false; } });
  const nav = performance.getEntriesByType("navigation")[0];
  return {
    url: location.href,
    title: document.title || "",
    text: (document.body ? document.body.innerText : "").slice(0, 4096),
    scriptUrls: Array.from(document.scripts, (s) => s.src).filter(Boolean),
    iframeSrcs: Array.from(document.querySelectorAll("iframe"), (f) => f.src).filter(Boolean),
    cookieNames: (() => { try { return document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter(Boolean); } catch (e) { return []; } })(),
    selectors: sel,
    status: nav && nav.responseStatus > 0 ? nav.responseStatus : undefined,
  };
})()`;
    strings = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  }
});
var CONSENT_SELECTORS;
var BARE_TEXT_MAX;
var CONTROL_TAGS;
var CONTROL_ROLES;
var HELPERS;
var OVERLAYS_SOURCE;
var OVERLAY_ROOT_SOURCE;
var DESCRIBE_SOURCE;
var OVERLAY_INFO_SOURCE;
var READ_DOCUMENT;
var init_overlay = __esm({
  "src/browser/overlay.ts"() {
    "use strict";
    CONSENT_SELECTORS = [
      // OneTrust
      "#onetrust-consent-sdk",
      "#onetrust-banner-sdk",
      "#onetrust-pc-sdk",
      // Didomi
      "#didomi-host",
      "#didomi-notice",
      'div[class^="didomi-"]',
      // Sourcepoint
      '[id^="sp_message_container"]',
      // Quantcast Choice
      ".qc-cmp2-container",
      "#qc-cmp2-container",
      // Cookiebot
      "#CybotCookiebotDialog",
      "#CybotCookiebotDialogBodyUnderlay",
      // Usercentrics
      "#usercentrics-root",
      "#usercentrics-cmp-ui",
      // TrustArc
      "#truste-consent-track",
      "#consent_blackbar",
      'div[class^="truste_"]',
      // consentmanager.net, Commanders Act, Axeptio, Iubenda, Complianz, CookieYes, Osano, Borlabs, Google Funding Choices
      "#cmpbox",
      "#cmpbox2",
      "#tc-privacy-wrapper",
      "#axeptio_overlay",
      "#iubenda-cs-banner",
      "#cmplz-cookiebanner-container",
      ".cky-consent-container",
      ".osano-cm-window",
      "#BorlabsCookieBox",
      ".fc-consent-root",
      // The IAB TCF / GPP locator frames
      'iframe[name="__tcfapiLocator"]',
      'iframe[name="__cmpLocator"]',
      'iframe[name="__gppLocator"]'
    ];
    BARE_TEXT_MAX = 40;
    CONTROL_TAGS = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "IFRAME", "SUMMARY", "DETAILS"];
    CONTROL_ROLES = [
      "button",
      "link",
      "checkbox",
      "radio",
      "switch",
      "tab",
      "menuitem",
      "menuitemcheckbox",
      "menuitemradio",
      "option",
      "textbox",
      "searchbox",
      "combobox",
      "slider",
      "spinbutton"
    ];
    HELPERS = `const up = (n) => n.parentElement || (n.parentNode && n.parentNode.host) || n.host || null;
  const body = document.body;
  const roleOf = (el) => String((el.getAttribute && el.getAttribute("role")) || "").toLowerCase();
  const isDialog = (el) =>
    roleOf(el) === "dialog" ||
    roleOf(el) === "alertdialog" ||
    (!!el.getAttribute && el.getAttribute("aria-modal") === "true") ||
    (String(el.tagName || "").toUpperCase() === "DIALOG" && el.open === true);
  const CONSENT = ${JSON.stringify(CONSENT_SELECTORS.join(", "))};
  const isConsent = (el) => {
    try {
      return !!el.matches && el.matches(CONSENT);
    } catch (e) {
      return false;
    }
  };
  const CONTROL_TAGS = ${JSON.stringify(CONTROL_TAGS)};
  const CONTROL_ROLES = ${JSON.stringify(CONTROL_ROLES)};
  /** Something to act on: a native control, a control role, a focusable (tabindex >= 0) or editable element. */
  const isControl = (el) => {
    const attr = (n) => (el.getAttribute ? el.getAttribute(n) : null);
    const tag = String(el.tagName || "").toUpperCase();
    if (tag === "A") return attr("href") !== null;
    if (tag === "INPUT") return String(attr("type") || "").toLowerCase() !== "hidden";
    if (CONTROL_TAGS.indexOf(tag) >= 0 || CONTROL_ROLES.indexOf(roleOf(el)) >= 0) return true;
    const tab = attr("tabindex");
    if (tab !== null && tab !== "" && Number(tab) >= 0) return true;
    const edit = attr("contenteditable");
    return edit === "" || edit === "true" || edit === "plaintext-only";
  };
  const textLength = (n) => String((typeof n.innerText === "string" ? n.innerText : n.textContent) || "").replace(/\\s+/g, " ").trim().length;
  /**
   * Nothing to answer in it: no control, itself or inside (open shadow roots
   * included), and under ${BARE_TEXT_MAX} characters of text. An ad slot holding
   * an image is one; a cookie wall, a login dialog, a notice to read are not.
   * Never bare: a consent vendor's container (its buttons may be plain divs),
   * nor anything holding a custom element with no open shadow root (a closed
   * one hides its text and controls from here).
   */
  const bare = (el) => {
    let text = textLength(el);
    const stack = [el];
    for (let seen = 0; stack.length > 0; seen++) {
      // Too big to look through: whatever it is, it is no empty layer.
      if (text >= ${BARE_TEXT_MAX} || seen > 5000) return false;
      const n = stack.pop();
      if (n.nodeType === 1 && (isControl(n) || isConsent(n))) return false;
      if (n.nodeType === 1 && String(n.tagName || "").indexOf("-") >= 0 && !n.shadowRoot) return false;
      for (const k of Array.from(n.children || [])) stack.push(k);
      if (n.shadowRoot) {
        for (const k of Array.from(n.shadowRoot.children || [])) {
          text += textLength(k);
          stack.push(k);
        }
      }
    }
    return text < ${BARE_TEXT_MAX};
  };
  /** Fixed or sticky, itself or an ancestor up to the body: what a click's covering node belongs to. */
  const pinned = (el) => {
    for (let n = el; n && n.nodeType === 1 && n !== body && n !== document.documentElement; n = up(n)) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  };`;
    OVERLAYS_SOURCE = `function findOverlays() {
  ${HELPERS}
  const found = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!body || !(vw > 0) || !(vh > 0)) return found;
  const isMain = (el) => String(el.tagName || "").toUpperCase() === "MAIN" || roleOf(el) === "main";
  const holdsMain = (el) => isMain(el) || Array.prototype.some.call(el.querySelectorAll("*"), isMain);
  const textOf = (el) => String(el.textContent || "").length;
  const pageText = textOf(body);
  const fixed = (el) => {
    for (let n = el; n && n.nodeType === 1 && n !== body && n !== document.documentElement; n = up(n)) if (getComputedStyle(n).position === "fixed") return true;
    return false;
  };
  /** Out of the flow of the page, itself or an ancestor: what can be over something. */
  const floating = (el) => {
    for (let n = el; n && n.nodeType === 1 && n !== body && n !== document.documentElement; n = up(n)) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "absolute") return true;
    }
    return false;
  };
  const hiddenUp = (el) => {
    for (let n = el; n && n.nodeType === 1; n = up(n)) {
      if (n.getAttribute && (n.getAttribute("aria-hidden") === "true" || n.getAttribute("inert") !== null)) return true;
      const cs = getComputedStyle(n);
      if (cs.display === "none" || Number(cs.opacity) === 0) return true;
    }
    return false;
  };
  const shown = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.visibility === "collapse") return false;
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0) || r.right <= 0 || r.bottom <= 0 || r.left >= vw || r.top >= vh) return false;
    return !hiddenUp(el);
  };
  /** The part of the viewport the element covers, or null when it is under 30%. */
  const area = (el) => {
    const r = el.getBoundingClientRect();
    const left = Math.max(r.left, 0);
    const top = Math.max(r.top, 0);
    const w = Math.min(r.right, vw) - left;
    const h = Math.min(r.bottom, vh) - top;
    return w > 0 && h > 0 && w * h >= 0.3 * vw * vh ? { left, top, w, h } : null;
  };
  const covers = (el, a) => {
    // A side column is no overlay: one is wide, or strictly across the middle of the screen.
    const middle = a.left < vw / 2 && a.left + a.w > vw / 2 && a.top < vh / 2 && a.top + a.h > vh / 2;
    if (a.w < 0.6 * vw && !middle) return false;
    const root = el.getRootNode ? el.getRootNode() : document;
    const at = (root && root.elementFromPoint ? root : document).elementFromPoint(a.left + a.w / 2, a.top + a.h / 2);
    for (let n = at; n; n = up(n)) if (n === el) return true;
    return false;
  };
  const kids = (n) => Array.from((n && n.children) || []);
  const visit = (el, inShell) => {
    let shell = inShell;
    let take = false;
    const role = roleOf(el);
    if (isConsent(el)) take = shown(el) && !holdsMain(el);
    else if (isDialog(el)) take = floating(el) && shown(el) && !holdsMain(el);
    else if (!inShell && role !== "presentation" && role !== "none") {
      const a = area(el);
      if (a && fixed(el) && shown(el) && covers(el, a)) {
        if (holdsMain(el) || (pageText > 0 && textOf(el) > 0.6 * pageText)) shell = true;
        else take = true;
      }
    }
    // An overlay is taken whole: what is inside it is its own. A bare one is none, nor is anything inside it.
    if (take && bare(el)) return;
    if (take) {
      found.push(el);
      return;
    }
    for (const k of kids(el)) visit(k, shell);
    if (el.shadowRoot) for (const k of kids(el.shadowRoot)) visit(k, shell);
  };
  for (const k of kids(body)) visit(k, false);
  return found.slice(0, 5);
}`;
    OVERLAY_ROOT_SOURCE = `function overlayRoot() {
  ${HELPERS}
  const overlays = (${OVERLAYS_SOURCE})();
  for (let n = this; n; n = up(n)) if (overlays.indexOf(n) >= 0) return n;
  let outer = null;
  for (let n = this; n && n !== body && n !== document.documentElement; n = up(n)) {
    if (n.nodeType !== 1) continue;
    if (isDialog(n)) return n;
    if (pinned(n) && !pinned(up(n) || body)) outer = n;
  }
  return outer;
}`;
    DESCRIBE_SOURCE = `const describe = (el) => {
    const tag = String(el.tagName || "").toLowerCase();
    const attr = (n) => (el.getAttribute ? el.getAttribute(n) : null);
    const role = attr("role");
    const type = tag === "input" ? attr("type") : null;
    const text = String(el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim();
    const shown = text.length > 60 ? text.slice(0, 57) + "..." : text;
    return "<" + tag + (el.id ? "#" + el.id : "") + (role ? ' role="' + role + '"' : "") + (type ? ' type="' + type + '"' : "") + ">" + (shown ? ' "' + shown + '"' : "");
  };`;
    OVERLAY_INFO_SOURCE = `function overlayInfo() {
  ${HELPERS}
  ${DESCRIBE_SOURCE}
  const overlays = (${OVERLAYS_SOURCE})();
  return { what: describe(this), overlay: (overlays.indexOf(this) >= 0 || isDialog(this) || isConsent(this)) && !bare(this) };
}`;
    READ_DOCUMENT = `(() => {
  const findOverlays = ${OVERLAYS_SOURCE};
  const root = document.documentElement;
  if (!root) return { html: "", url: location.href };
  const mark = "data-overlay-" + Math.random().toString(36).slice(2, 10);
  let overlays = [];
  let html = "";
  try {
    try {
      overlays = findOverlays();
    } catch (e) {}
    for (const el of overlays) if (el.getRootNode && el.getRootNode() === document) el.setAttribute(mark, "");
    html = root.outerHTML;
  } finally {
    for (const el of overlays) if (el.removeAttribute) el.removeAttribute(mark);
  }
  let parsed;
  try {
    parsed = new DOMParser().parseFromString(html, "text/html");
  } catch (e) {
    return { html, url: location.href };
  }
  const drop = ["[" + mark + "]", '[role="dialog"]', '[role="alertdialog"]', '[aria-modal="true"]', "dialog", ${CONSENT_SELECTORS.map((s) => JSON.stringify(s)).join(", ")}];
  const keep = (el) =>
    el === parsed.body || el === parsed.documentElement || el.tagName === "MAIN" || el.getAttribute("role") === "main" || !!el.querySelector("main, [role=main]");
  for (const sel of drop) {
    let els = [];
    try {
      els = Array.from(parsed.querySelectorAll(sel));
    } catch (e) {}
    for (const el of els) if (!keep(el)) el.remove();
  }
  return { html: parsed.documentElement.outerHTML, url: location.href };
})()`;
  }
});
function timeoutText(c, elapsedMs) {
  if ("text" in c) return `text ${JSON.stringify(c.text)} did not appear after ${elapsedMs} ms`;
  if ("gone" in c) return `text ${JSON.stringify(c.gone)} is still on the page after ${elapsedMs} ms`;
  if ("selector" in c) return `no element matches ${JSON.stringify(c.selector)} after ${elapsedMs} ms`;
  if ("url" in c) return `the url did not match ${JSON.stringify(c.url)} after ${elapsedMs} ms`;
  if ("load" in c) return `the page did not finish loading after ${elapsedMs} ms`;
  if ("idle" in c) return `the network did not go idle after ${elapsedMs} ms`;
  if ("clear" in c)
    return `the challenge is still there after ${elapsedMs} ms \u2014 a human must solve it in the browser window (\`${brand().cli} browser open <url>\` shows it), then run wait --clear again`;
  return `timed out after ${elapsedMs} ms`;
}
async function watchNetwork(page) {
  const inflight3 = /* @__PURE__ */ new Set();
  const handlers = [
    ["Network.requestWillBeSent", (p) => inflight3.add(String(p.requestId))],
    ["Network.loadingFinished", (p) => inflight3.delete(String(p.requestId))],
    ["Network.loadingFailed", (p) => inflight3.delete(String(p.requestId))]
  ];
  for (const [m, h] of handlers) page.on(m, h);
  await page.send("Network.enable").catch(() => {
  });
  return {
    count: () => inflight3.size,
    stop: () => {
      for (const [m, h] of handlers) page.off(m, h);
    }
  };
}
async function evaluate(page, expression) {
  try {
    const r = await page.send("Runtime.evaluate", { expression, returnByValue: true }, { timeoutMs: EVAL_TIMEOUT_MS });
    return r.result?.value;
  } catch {
    return void 0;
  }
}
function urlMatcher(pattern) {
  const re = /^\/(.+)\/([a-z]*)$/.exec(pattern);
  if (re) {
    try {
      new RegExp(re[1], re[2]);
      const ctx = createContext({ src: re[1], flags: re[2], u: "" });
      const test = new Script("new RegExp(src, flags).test(u)");
      return (u) => {
        ctx.u = u;
        try {
          return test.runInContext(ctx, { timeout: REGEX_BUDGET_MS }) === true;
        } catch {
          throw new Error(`the /regex/ given to wait --url took too long on ${u.slice(0, 200)}: simplify it`);
        }
      };
    } catch (e) {
      if (e.message.includes("took too long")) throw e;
    }
  }
  if (pattern.includes("*")) {
    const rx = new RegExp(
      `^${pattern.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`
    );
    return (u) => rx.test(u);
  }
  return (u) => u.includes(pattern);
}
function checker(page, cond, now, net) {
  const hasText = (t) => evaluate(page, `(document.body ? document.body.innerText : "").includes(${JSON.stringify(t)})`);
  if ("text" in cond) return async () => await hasText(cond.text) === true;
  if ("gone" in cond) return async () => await hasText(cond.gone) === false;
  if ("selector" in cond) {
    const sel = JSON.stringify(cond.selector);
    return async () => await evaluate(
      page,
      `(() => { try { const el = document.querySelector(${sel}); return !!el && el.getClientRects().length > 0; } catch { return false; } })()`
    ) === true;
  }
  if ("url" in cond) {
    const match = urlMatcher(cond.url);
    return async () => {
      const href = await evaluate(page, "location.href");
      return typeof href === "string" && match(href);
    };
  }
  if ("load" in cond) return async () => await evaluate(page, 'document.readyState === "complete"') === true;
  if ("idle" in cond) {
    let quietSince;
    return async () => {
      if ((net?.count() ?? 0) > 0) {
        quietSince = void 0;
        return false;
      }
      quietSince ??= now();
      return now() - quietSince >= IDLE_MS;
    };
  }
  let streak = 0;
  return async () => {
    const probe = await probeChallenge({ page });
    streak = probe.ok && !probe.challenge?.blocking ? streak + 1 : 0;
    return streak >= 2;
  };
}
async function waitFor(session, cond, opts = {}) {
  const present = KEYS.filter((k) => k in cond);
  if (present.length !== 1) throw new TypeError(`invalid wait condition ${JSON.stringify(cond)}: give exactly one of ${KEYS.join(", ")}`);
  const { now, sleep: sleep2 } = browserDeps(opts.deps);
  const start = now();
  const live = () => {
    if (opts.signal?.aborted) throw new WaitCancelledError();
  };
  if ("ms" in cond) {
    for (let left = cond.ms; ; left = cond.ms - (now() - start)) {
      live();
      if (left <= 0) break;
      await sleep2(Math.min(POLL_MS2, left));
    }
    return { waitedMs: now() - start, matched: "ms" };
  }
  const timeoutMs = opts.timeoutMs ?? ("clear" in cond ? CLEAR_TIMEOUT_MS : DEFAULT_TIMEOUT_MS3);
  const net = "idle" in cond ? await watchNetwork(session.page) : void 0;
  try {
    const check = checker(session.page, cond, now, net);
    for (; ; ) {
      live();
      if (await check()) return { waitedMs: now() - start, matched: present[0] };
      const elapsed = now() - start;
      if (elapsed >= timeoutMs) throw new WaitTimeoutError(cond, elapsed);
      await sleep2(Math.min(POLL_MS2, timeoutMs - elapsed));
    }
  } finally {
    net?.stop();
  }
}
var WaitTimeoutError;
var WaitCancelledError;
var POLL_MS2;
var DEFAULT_TIMEOUT_MS3;
var CLEAR_TIMEOUT_MS;
var EVAL_TIMEOUT_MS;
var IDLE_MS;
var REGEX_BUDGET_MS;
var KEYS;
var init_wait = __esm({
  "src/browser/wait.ts"() {
    "use strict";
    init_brand();
    init_challenge();
    init_deps();
    WaitTimeoutError = class extends Error {
      constructor(condition, elapsedMs) {
        super(timeoutText(condition, elapsedMs));
        this.condition = condition;
        this.elapsedMs = elapsedMs;
        this.name = "WaitTimeoutError";
      }
      condition;
      elapsedMs;
    };
    WaitCancelledError = class extends Error {
      constructor() {
        super("the wait was cancelled");
        this.name = "WaitCancelledError";
      }
    };
    POLL_MS2 = 250;
    DEFAULT_TIMEOUT_MS3 = 3e4;
    CLEAR_TIMEOUT_MS = 3e5;
    EVAL_TIMEOUT_MS = 2e3;
    IDLE_MS = 500;
    REGEX_BUDGET_MS = 200;
    KEYS = ["text", "gone", "selector", "url", "load", "idle", "ms", "clear"];
  }
});
var read_exports = {};
__export(read_exports, {
  closeBrowserReads: () => closeBrowserReads,
  forgetHumanAnswer: () => forgetHumanAnswer,
  readRenderedPage: () => readRenderedPage
});
function pump() {
  for (let next = queue[0]; next && active < next.limit; next = queue[0]) {
    queue.shift();
    active++;
    next.go();
  }
}
async function acquire(limit, signal, cancelled) {
  if (queue.length === 0 && active < limit) active++;
  else {
    await new Promise((resolve9, reject) => {
      const onAbort = () => {
        queue.splice(queue.indexOf(waiter), 1);
        reject(cancelled());
      };
      const waiter = {
        limit,
        go: () => {
          signal?.removeEventListener("abort", onAbort);
          resolve9();
        }
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      queue.push(waiter);
    });
  }
  return () => {
    active--;
    pump();
  };
}
function track(p) {
  inflight.add(p);
  const done = () => inflight.delete(p);
  p.then(done, done);
  return p;
}
async function closeBrowserReads(opts = {}) {
  try {
    if (inflight.size > 0) {
      let timer;
      const bound = new Promise((r) => {
        timer = setTimeout(r, opts.waitMs ?? DRAIN_MS);
        timer.unref?.();
      });
      await Promise.race([Promise.allSettled([...inflight]), bound]);
      clearTimeout(timer);
    }
    const ours = launched;
    launched = void 0;
    if (!ours) return { closed: false };
    const deps = opts.deps ? browserDeps({ ...ours.deps, ...opts.deps }) : ours.deps;
    if (!await isSameBrowser(deps, ours.port, ours.host, ours.wsBrowserUrl)) return { closed: false };
    const saved = readSession();
    if (saved?.wsBrowserUrl && socketPath(saved.wsBrowserUrl) === socketPath(ours.wsBrowserUrl)) return { closed: false };
    let cdp;
    try {
      cdp = await deps.connectCdp(loopbackSocketUrl(ours.wsBrowserUrl));
    } catch {
      if (ours.pid === void 0) return { closed: false };
      deps.kill(ours.pid, "SIGTERM");
      return { closed: true };
    }
    try {
      await closeLaunched(cdp, ours.pid, deps);
    } finally {
      await cdp.close();
    }
    return { closed: true };
  } catch {
    return { closed: false };
  }
}
async function render(url, opts, deps, timeoutMs, run) {
  const { cdp, profile, headless, binary } = opts;
  const session = await withBrowserLock(
    async () => {
      if (run.stopped) throw new Error("stopped");
      return openBrowserSession({ cdp, profile, headless, binary, deps, scratch: true, ownOnly: true });
    },
    { deps }
  );
  run.session = session;
  if (session.spawned) {
    const { host, port, pid, browserSocket } = session;
    launched = { host, port, wsBrowserUrl: browserSocket, ...pid !== void 0 ? { pid } : {}, deps };
  }
  const page = session.page;
  let status;
  let mime;
  let mainFrame;
  const onResponse = (p) => {
    if (p.type !== "Document" || p.frameId !== mainFrame || typeof p.response?.status !== "number") return;
    status = p.response.status;
    mime = typeof p.response.mimeType === "string" ? p.response.mimeType : void 0;
  };
  try {
    if (run.stopped) throw new Error("stopped");
    mainFrame = (await page.send("Page.getFrameTree")).frameTree.frame.id;
    page.on("Network.responseReceived", onResponse);
    await page.send("Network.enable");
    await page.send("Page.setDownloadBehavior", { behavior: "deny" }).catch((e) => {
      throw new Error(`could not refuse downloads in the reading tab (${e.message}), so ${url} was not loaded`);
    });
    const nav = await session.navigate(url, { waitUntil: "load", timeoutMs });
    if (mime && !WEB_PAGE.test(mime)) throw new Error(`${url} is not a web page but ${mime}`);
    if (opts.waitUntil !== "load") {
      const idleMs = opts.waitUntil === "idle" ? timeoutMs / 2 : Math.min(IDLE_CAP_MS, timeoutMs);
      await waitFor(session, { idle: true }, { timeoutMs: idleMs, deps }).catch(() => {
      });
    }
    const statusNow = () => status ?? nav.status ?? 200;
    const code = statusNow();
    const take = async () => {
      const got = await page.send(
        "Runtime.evaluate",
        { expression: opts.fullPage ? WHOLE_DOCUMENT : READ_DOCUMENT, returnByValue: true },
        { timeoutMs }
      );
      const finalUrl = typeof got.result?.value?.url === "string" ? got.result.value.url : nav.url;
      const html = typeof got.result?.value?.html === "string" ? got.result.value.html : "";
      return { ...extractFromHtml(html, finalUrl, opts), finalUrl, status: statusNow(), extractor: "browser" };
    };
    const challenge = await detectChallenge(session);
    const first = await take();
    const blocked = (c) => ({
      text: "",
      finalUrl: first.finalUrl,
      status: code >= 400 ? code : 403,
      extractor: "browser",
      note: `${c.kind} challenge \u2014 open it with \`${brand().cli} browser open ${url}\` and let the human solve it`
    });
    const asIs = challenge?.blocking ? blocked(challenge) : first;
    if (!opts.human) return asIs;
    const found = challenge?.blocking ? `${challenge.kind} challenge` : humanWall(first.text);
    if (!found) return first;
    const wall = `${/^[aeiou]/i.test(found) ? "an" : "a"} ${found}`;
    const nobody = session.headless ? "the browser runs headless" : canShowWindow(deps.platform) ? void 0 : "no window can be shown here";
    if (nobody) return { ...asIs, note: [asIs.note, `It needs a human, and ${nobody}.`].filter(Boolean).join(" "), handoff: "no-window" };
    const human = opts.human === true ? {} : opts.human;
    const asks = askFirst(human, deps);
    const answer = asks === "never" ? "never" : asks === "ask" ? await answerFor(url, found, deps) : "unavailable";
    if (answer === "never" || answer === "later" || answer === "no-answer") {
      const why = answer === "never" ? `It needs a human, and handoffs are off (${envName("HUMAN_ASK")}=never).` : answer === "later" ? "It needs a human, who chose to get past it later." : "It needs a human, and nobody answered the question whether to bring it forward.";
      return { ...asIs, note: [asIs.note, why].filter(Boolean).join(" "), handoff: "declined" };
    }
    const cleared = await handOff(session, url, wall, !!challenge?.blocking, human, deps, take, opts.signal);
    if (answer === "solve" && !cleared) answered = { answer: "no-answer", at: deps.now() };
    if (answer === "solve" && cleared) await deps.notifyHuman(1, 1).catch(() => false);
    if (cleared)
      return {
        ...cleared,
        status: cleared.status >= 400 ? 200 : cleared.status,
        note: [cleared.note, `Read after a human got past ${wall}.`].filter(Boolean).join(" "),
        handoff: "cleared"
      };
    const secs = Math.round((human.timeoutMs ?? humanTimeoutMs()) / 1e3);
    return { ...asIs, note: [asIs.note, `Nobody got past it within ${secs} s.`].filter(Boolean).join(" "), handoff: "timeout" };
  } finally {
    page.off("Network.responseReceived", onResponse);
    await deps.discovery.closeTarget(session.port, session.targetId, session.host).catch(() => {
    });
    await session.detach();
  }
}
function askFirst(human, deps) {
  if (human.ask === false) return "hand";
  if (human.ask === true) return "ask";
  const mode2 = humanAskMode(deps.env("HUMAN_ASK") ?? "ask");
  return mode2 === "always" ? "hand" : mode2;
}
function answerFor(url, check, deps) {
  if (answered && deps.now() - answered.at < ANSWER_HOLDS_MS) return Promise.resolve(answered.answer);
  asking ??= deps.askHuman([{ url, check }]).catch(() => "unavailable").then((answer) => {
    answered = { answer, at: deps.now() };
    asking = void 0;
    return answer;
  });
  return asking;
}
function forgetHumanAnswer() {
  answered = void 0;
  asking = void 0;
}
async function handOff(session, url, wall, challenged, human, deps, take, signal) {
  const tell = human.tell ?? ((m) => void process.stderr.write(`${m}
`));
  const timeoutMs = human.timeoutMs ?? humanTimeoutMs();
  const start = deps.now();
  const left = () => timeoutMs - (deps.now() - start);
  const { cli, name } = brand();
  const restore = await session.showToHuman();
  tell(
    `${cli}: ${url} is behind ${wall}. It is open in the ${name} browser window (its own profile, not your browser): get past it there and the read goes on by itself \u2014 waiting up to ${Math.round(timeoutMs / 1e3)} s.`
  );
  try {
    if (challenged) await waitFor(session, { clear: true }, { timeoutMs, deps, ...signal ? { signal } : {} });
    for (; ; ) {
      await waitFor(session, { load: true }, { timeoutMs: Math.max(1, Math.min(AFTER_WALL_LOAD_MS, left())), deps }).catch(() => {
      });
      const challenge = await detectChallenge(session);
      if (!challenge?.blocking) {
        const r = await take();
        if (!humanWall(r.text)) {
          tell(`${cli}: got past it \u2014 read ${url}.`);
          return r;
        }
      }
      if (left() <= 0) break;
      if (signal?.aborted) throw new Error(`reading ${url} in the browser was cancelled`);
      await deps.sleep(Math.min(WALL_POLL_MS, left()));
    }
  } catch (e) {
    if (!(e instanceof WaitTimeoutError)) throw e;
  } finally {
    await restore();
  }
  tell(`${cli}: ${url} is still behind ${wall} after ${Math.round(timeoutMs / 1e3)} s \u2014 read without it.`);
  return void 0;
}
function readRenderedPage(url, opts = {}) {
  return track(read(url, opts));
}
async function read(url, opts) {
  const cancelled = () => new Error(`reading ${url} in the browser was cancelled`);
  const { signal } = opts;
  if (signal?.aborted) throw cancelled();
  const deps = browserDeps(opts.deps);
  const timeoutMs = opts.timeoutMs ?? envInt("BROWSER_TIMEOUT_MS", 3e4, 5e3, 3e5);
  const human = opts.human === true ? {} : opts.human || void 0;
  const humanMs = human ? (human.timeoutMs ?? humanTimeoutMs()) + (askFirst(human, deps) === "ask" ? humanAskTimeoutMs() + ASK_GRACE_MS : 0) : 0;
  const release = await acquire(envInt("BROWSER_CONCURRENCY", 1, 1, 4), signal, cancelled);
  if (signal?.aborted) {
    release();
    throw cancelled();
  }
  const run = { stopped: false };
  const work = track(render(url, opts, deps, timeoutMs, run));
  work.then(release, release);
  let stop;
  const cut = new Promise((_, reject) => {
    stop = reject;
  });
  const budgetMs = humanMs ? 2 * timeoutMs + humanMs : timeoutMs;
  const timer = setTimeout(() => stop(new Error(`reading ${url} in the browser did not finish within ${budgetMs} ms`)), budgetMs);
  const onAbort = () => stop(cancelled());
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    return await Promise.race([work, cut]);
  } catch (e) {
    run.stopped = true;
    work.catch(() => {
    });
    await run.session?.detach();
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
var IDLE_CAP_MS;
var WEB_PAGE;
var HUMAN_TIMEOUT_MS;
var humanTimeoutMs;
var WALL_POLL_MS;
var AFTER_WALL_LOAD_MS;
var active;
var queue;
var DRAIN_MS;
var launched;
var inflight;
var WHOLE_DOCUMENT;
var ANSWER_HOLDS_MS;
var ASK_GRACE_MS;
var answered;
var asking;
var init_read = __esm({
  "src/browser/read.ts"() {
    "use strict";
    init_ask();
    init_brand();
    init_fetch();
    init_challenge();
    init_deps();
    init_launch();
    init_discovery();
    init_mode();
    init_overlay();
    init_session();
    init_state();
    init_wait();
    IDLE_CAP_MS = 3e3;
    WEB_PAGE = /^(?:text\/html|application\/xhtml\+xml)$/i;
    HUMAN_TIMEOUT_MS = 3e5;
    humanTimeoutMs = () => envInt("HUMAN_TIMEOUT_MS", HUMAN_TIMEOUT_MS, 1e4, 36e5);
    WALL_POLL_MS = 1e3;
    AFTER_WALL_LOAD_MS = 1e4;
    active = 0;
    queue = [];
    DRAIN_MS = 5e3;
    inflight = /* @__PURE__ */ new Set();
    WHOLE_DOCUMENT = "({ html: document.documentElement ? document.documentElement.outerHTML : '', url: location.href })";
    ANSWER_HOLDS_MS = 6e5;
    ASK_GRACE_MS = 15e3;
  }
});
var ENGINE_VERSION = "1.37.2";
init_brand();
init_pdf();
init_doc();
init_video();
init_session();
init_read();
init_cli_kit();
init_cdp();
init_overlay();
init_state();
init_challenge();
init_mode();
init_detect();
init_profile();
init_ask();
init_exec();
init_fetch();
init_markdown2();
init_firecrawl();
init_text();
init_url();
init_rank();
init_walls();
init_locale();
init_exec2();
init_brand();
init_exec2();
init_forge_host();
init_private_dir();
init_text();
init_shared();
var STALE_STAGING_MS = 24 * 60 * 60 * 1e3;
init_brand();
init_exec2();
init_fetch();
init_forge_host();
init_retry();
init_text();
init_trim();
init_shared();
var MAX_BODY_BYTES = 4 * 1024 * 1024;
init_fetch();
init_trim();
var NPM_TIME_TAIL_FIRST_BYTES = 256 * 1024;
var NPM_TIME_TAIL_BYTES = 2 * 1024 * 1024;
init_charset();
init_brand();
init_fetch();
var ROBOTS_TTL_MS = 24 * 60 * 60 * 1e3;
var UNREACHABLE_TTL_MS = 5 * 60 * 1e3;
init_entities();
init_html();
init_charset();
init_fetch();
init_html();
var HTML_ELEMENTS = /* @__PURE__ */ new Set([...BLOCK_TAGS, ...INLINE_TAGS, "br", "hr", "img", "h1", "h2", "h3", "h4", "h5", "h6"]);
var SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
var gunzipAsync = promisify(gunzip);
init_brand();
init_fetch();
init_locale();
init_url();
init_shared();
var INLINE_TAG = /<\/?(?:a|abbr|b|bdi|bdo|cite|code|em|i|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var|wbr)\b[^<>]*>/gi;
function stripTags(s) {
  return decodeEntities(s.replace(INLINE_TAG, "").replace(/<[^<>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
function ddgRedirectTarget(href) {
  const uddg = /[?&]uddg=([^&]+)/.exec(href);
  if (uddg) {
    try {
      return decodeURIComponent(uddg[1]);
    } catch {
    }
  }
  return href.startsWith("//") ? `https:${href}` : href;
}
var attrPattern = (name) => new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'<>=\`]+))`, "i");
var HREF_ATTR = attrPattern("href");
var CLASS_ATTR = attrPattern("class");
var NAME_ATTR = attrPattern("name");
var TYPE_ATTR = attrPattern("type");
var VALUE_ATTR = attrPattern("value");
function attr2(attrs, re) {
  const m = re.exec(attrs);
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "") : void 0;
}
function hasClass(attrs, cls) {
  return (attr2(attrs, CLASS_ATTR) ?? "").split(/\s+/).includes(cls);
}
function hostIs(url, domain) {
  try {
    const host = new URL(url).hostname;
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}
var OPEN_A = /<a\b([^<>]*)>/gi;
var element = (tag, cls) => ({ open: new RegExp(`<${tag}\\b([^<>]*)>`, "gi"), close: new RegExp(`</${tag}\\s*>`, "i"), cls });
function parseBlocks(body, limit, shape) {
  const anchors = [];
  for (const m of body.matchAll(OPEN_A)) {
    if (hasClass(m[1], shape.anchor)) anchors.push({ start: m.index, end: m.index + m[0].length, attrs: m[1] });
  }
  const found = [];
  for (let i = 0; i < anchors.length && found.length < limit; i++) {
    const a = anchors[i];
    const block = body.slice(a.end, anchors[i + 1]?.start ?? body.length);
    const close = /<\/a\s*>/i.exec(block);
    const href = attr2(a.attrs, HREF_ATTR);
    if (!close || !href) continue;
    const url = shape.resolve(href);
    if (!url) continue;
    const rest = block.slice(close.index + close[0].length);
    found.push({ url, title: stripTags(block.slice(0, close.index)) || url, snippet: elementText(rest, shape.snippet) });
  }
  return found;
}
function elementText(html, el) {
  for (const m of html.matchAll(el.open)) {
    if (!hasClass(m[1], el.cls)) continue;
    const inner = html.slice(m.index + m[0].length);
    const end = el.close.exec(inner);
    return end ? stripTags(inner.slice(0, end.index)) : "";
  }
  return "";
}
function ddgDestination(href) {
  const url = ddgRedirectTarget(href);
  if (!/^https?:\/\//i.test(url)) return void 0;
  const unwrapped = url !== (href.startsWith("//") ? `https:${href}` : href);
  return unwrapped || !hostIs(url, "duckduckgo.com") ? url : void 0;
}
function parseDdgHtml(body, limit = 50) {
  return parseBlocks(body, limit, { anchor: "result__a", snippet: element("a", "result__snippet"), resolve: ddgDestination });
}
function parseDdgLite(body, limit = 50) {
  return parseBlocks(body, limit, { anchor: "result-link", snippet: element("td", "result-snippet"), resolve: ddgDestination });
}
function parseMojeek(body, limit = 50) {
  return parseBlocks(body, limit, {
    anchor: "title",
    snippet: element("p", "s"),
    // Mojeek links its results directly, so its own links are the ones on its
    // own host. Its blog, or a page ABOUT Mojeek, is a result like any other.
    resolve: (h) => {
      const url = h.startsWith("//") ? `https:${h}` : h;
      return /^https?:\/\//i.test(url) && !/^https?:\/\/(?:www\.)?mojeek\.com(?:[:/?#]|$)/i.test(url) ? url : void 0;
    }
  });
}
var OPEN_FORM = /<form\b[^<>]*>/gi;
var INPUT = /<input\b([^<>]*)>/gi;
function ddgNextForm(body) {
  const forms = [...body.matchAll(OPEN_FORM)];
  for (let i = 0; i < forms.length; i++) {
    const chunk = body.slice(forms[i].index + forms[i][0].length, forms[i + 1]?.index ?? body.length);
    const end = chunk.search(/<\/form\s*>/i);
    const fields = {};
    let next = false;
    for (const m of (end < 0 ? chunk : chunk.slice(0, end)).matchAll(INPUT)) {
      const value = attr2(m[1], VALUE_ATTR) ?? "";
      if (attr2(m[1], TYPE_ATTR)?.toLowerCase() === "submit") next ||= /^\s*next\b/i.test(value);
      else {
        const name = attr2(m[1], NAME_ATTR);
        if (name) fields[name] = value;
      }
    }
    if (next) return fields;
  }
  return void 0;
}
function ddgNext(endpoint) {
  return (body, q, kl, p) => {
    const form = ddgNextForm(body);
    if (!form) return null;
    return `${endpoint}?${new URLSearchParams({ ...form, q, kl, s: form.s || String((p + 1) * 10) })}`;
  };
}
function mojeekLocaleParams(locale) {
  if (!locale) return "";
  const lang = `&lb=${encodeURIComponent(locale.lang)}&lbb=100`;
  return locale.region === "WT" ? lang : `${lang}&rb=${encodeURIComponent(locale.region)}&rbb=10`;
}
var SPECS = {
  // Page one only: every later page is the one the previous page's own Next
  // form names (see ddgNextForm).
  ddg: {
    label: "DuckDuckGo",
    url: (q, _p, kl) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=${encodeURIComponent(kl)}`,
    parse: parseDdgHtml,
    next: ddgNext("https://html.duckduckgo.com/html/")
  },
  ddglite: {
    label: "DuckDuckGo Lite",
    url: (q, _p, kl) => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}&kl=${encodeURIComponent(kl)}`,
    parse: parseDdgLite,
    next: ddgNext("https://lite.duckduckgo.com/lite/")
  },
  // Mojeek's `s` is the 1-BASED index of the first result, 10 per page — so
  // page 2 starts at 11, not 10. Its own crawler and index, which is why it is
  // worth asking at all: it surfaces pages the DDG family does not have.
  mojeek: {
    label: "Mojeek",
    url: (q, p, _kl, locale) => `https://www.mojeek.com/search?q=${encodeURIComponent(q)}${p > 0 ? `&s=${p * 10 + 1}` : ""}${mojeekLocaleParams(locale)}`,
    parse: parseMojeek
  }
};
init_brand();
init_fetch();
init_firecrawl();
init_locale();
init_trim();
init_url();
init_shared();
var probeCache2 = new ProbeMemo();
init_brand();
init_fetch();
init_doc();
init_video();
init_firecrawl();
init_url();
init_no_write();
init_private_dir();
init_brand();
init_mode();
var DEFAULT_TTL_MS = 24 * 60 * 60 * 1e3;
var PDF_CACHE_NS = "pdf";
var DOC_CACHE_NS = "doc";
var VIDEO_CACHE_NS = "video";
var DOCUMENT_NAMESPACES = [PDF_CACHE_NS, DOC_CACHE_NS, VIDEO_CACHE_NS, "pdf-inspector", "pdftotext", "anydoc", "ocr"];
var WRITTEN_NAMESPACES = ["native", "firecrawl", "browser", ...DOCUMENT_NAMESPACES];
var ORPHAN_GRACE_MS = 10 * 60 * 1e3;
var MODEL_PULL_TIMEOUT_MS = 6e5;
function embedModel() {
  return env("EMBED_MODEL") ?? "nomic-embed-text";
}
var STACKS = {
  searxng: {
    profiles: ["search"],
    summary: "SearXNG is up (:8888) \u2014 keyless discovery, JSON API enabled.",
    ports: [[8888, "SearXNG", "SEARXNG"]]
  },
  firecrawl: {
    profiles: ["search", "extract"],
    summary: "Firecrawl is up (:3002 \xB7 playwright \xB7 redis \xB7 rabbitmq \xB7 postgres), with SearXNG behind it.",
    ports: [
      [8888, "SearXNG", "SEARXNG"],
      [3002, "Firecrawl", "FIRECRAWL"]
    ],
    postUp: () => [
      "  keyless: USE_DB_AUTHENTICATION=false \u2014 no API key is sent or needed.",
      "  effect:  pages are now cleaned by a real browser; --firecrawl off opts out."
    ]
  },
  semantic: {
    profiles: ["semantic"],
    summary: "Qdrant (:6333) and Ollama (:11434) are up.",
    ports: [
      [6333, "Qdrant", "QDRANT"],
      [11434, "Ollama", "OLLAMA"]
    ],
    postUp: (file, run) => {
      const model = embedModel();
      const pull = run("docker", ["compose", "-f", file, "exec", "-T", "ollama", "ollama", "pull", model], { timeoutMs: MODEL_PULL_TIMEOUT_MS, capture: true });
      return [pull.ok ? `  model:   ${model} ready` : `  model:   pull it yourself: docker compose -f ${file} exec ollama ollama pull ${model}`];
    }
  },
  all: {
    profiles: ["all", "extract"],
    summary: "The whole stack is up (Qdrant \xB7 Ollama \xB7 SearXNG \xB7 Firecrawl).",
    ports: [
      [6333, "Qdrant", "QDRANT"],
      [11434, "Ollama", "OLLAMA"],
      [8888, "SearXNG", "SEARXNG"],
      [3002, "Firecrawl", "FIRECRAWL"]
    ],
    postUp: (file, run) => STACKS.semantic.postUp(file, run)
  }
};
var STACK_SERVICES = Object.keys(STACKS);
var SERVICE_PROFILES = Object.fromEntries(Object.entries(STACKS).map(([k, v]) => [k, v.profiles]));
init_pool();
init_run_lock();
init_no_write();
init_no_write();
init_fetch();
var FINGERPRINT_MAX_BYTES = 64 * 1024 * 1024;
init_tables();
init_brand();
init_fetch();
init_pool();
init_html();
init_markdown2();
init_url();
init_brand();
init_fetch();
init_pool();
init_trim();
var MIN_ANSWER_BYTES = 4 * 1024 * 1024;
var ANSWER_BYTES_PER_VECTOR = 128 * 1024;
init_brand();
init_fetch();
init_rank();
init_trim();
var TOKEN_RE2 = /\[([^\]\n]+)\](?!\()/g;
function stripHtmlComments(text) {
  let out2 = "";
  let from = 0;
  for (; ; ) {
    const open2 = text.indexOf("<!--", from);
    if (open2 < 0) break;
    const close = text.indexOf("-->", open2 + 4);
    if (close < 0) break;
    out2 += text.slice(from, open2) + text.slice(open2, close + 3).replace(/[^\n]/g, " ");
    from = close + 3;
  }
  return out2 + text.slice(from);
}
function stripInlineCode(line) {
  return line.replace(/`[^`\n]*`/g, " ");
}
function codeMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let open2;
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(`{3,}|~{3,})(.*)$/.exec(lines[i]);
    if (!open2) {
      if (m && !(m[1][0] === "`" && m[2].includes("`"))) {
        open2 = { ch: m[1][0], len: m[1].length };
        mask[i] = true;
      }
      continue;
    }
    mask[i] = true;
    if (m && m[1][0] === open2.ch && m[1].length >= open2.len && m[2].trim() === "") open2 = void 0;
  }
  return mask;
}
var isHeadingOrRule = (t) => /^#{1,6}\s/.test(t) || /^([-*_])\1{2,}$/.test(t);
var isTableSeparator = (line) => /\|/.test(line) && /^[\s:|-]+$/.test(line.trim()) && /-/.test(line);
var isTableRow = (line) => /\|/.test(line.trim()) && !isTableSeparator(line);
var isListItem = (line) => /^\s*([-*+]|\d+\.)\s+\S/.test(line);
var isReferenceDefinition = (line) => /^ {0,3}\[[^\]\n]+\]:[ \t]*(?:<[^>\n]*>|\S+)(?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'|\([^)\n]*\)))?[ \t]*$/.test(line);
function tableCells(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()).join(" ");
}
function extractClaimUnits(text, opts = {}) {
  const lines = stripHtmlComments(text).split("\n");
  const code = codeMask(lines);
  const extra = opts.exclude ? opts.exclude(lines) : [];
  const skip = (i2) => code[i2] === true || extra[i2] === true;
  const quoteMode = opts.blockquotes ?? "unit";
  const skipHeader = opts.skipTableHeader !== false;
  const stored = (raw) => opts.keepInlineCode ? raw : stripInlineCode(raw);
  const units = [];
  let prose = [];
  let section;
  const tag = (u) => section === void 0 ? u : { ...u, section };
  const flush = () => {
    if (prose.length) units.push(tag({ kind: "text", text: prose.join(" ") }));
    prose = [];
  };
  let i = 0;
  while (i < lines.length) {
    if (skip(i)) {
      flush();
      i++;
      continue;
    }
    const raw = lines[i];
    const line = stripInlineCode(raw);
    const t = line.trim();
    if (!prose.length && isReferenceDefinition(raw)) {
      i++;
      continue;
    }
    if (t === "" || isHeadingOrRule(t) || isTableSeparator(line)) {
      flush();
      if (/^#{1,6}\s/.test(t)) section = opts.sectionTag?.(t);
      i++;
      continue;
    }
    if (isTableRow(line)) {
      flush();
      const next = i + 1 < lines.length && !skip(i + 1) ? stripInlineCode(lines[i + 1]) : "";
      if (!(skipHeader && isTableSeparator(next))) units.push(tag({ kind: "text", text: tableCells(stored(raw)) }));
      i++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      if (quoteMode === "prose") {
        const dequoted = stored(raw).replace(/^\s*>\s?/, "").trim();
        if (dequoted) prose.push(dequoted);
        i++;
        continue;
      }
      flush();
      const quoted = [];
      while (i < lines.length && !skip(i)) {
        if (!/^\s*>/.test(stripInlineCode(lines[i]))) break;
        const dq = stored(lines[i]).replace(/^\s*>\s?/, "").trim();
        if (dq) quoted.push(dq);
        i++;
      }
      if (quoted.length) units.push(tag({ kind: "text", text: quoted.join(" ") }));
      continue;
    }
    if (isListItem(line)) {
      flush();
      const items = [];
      while (i < lines.length && !skip(i)) {
        const rawL = lines[i];
        const l = stripInlineCode(rawL);
        const tt = l.trim();
        if (tt === "" || isHeadingOrRule(tt) || isTableSeparator(l) || isTableRow(l)) break;
        if (isListItem(l))
          items.push(
            stored(rawL).replace(/^\s*([-*+]|\d+\.)\s+/, "").trim()
          );
        else if (items.length) items[items.length - 1] += ` ${stored(rawL).trim()}`;
        else items.push(stored(rawL).trim());
        i++;
      }
      units.push(tag({ kind: "list", items }));
      continue;
    }
    prose.push(stored(raw));
    i++;
  }
  flush();
  return units;
}
function unitTexts(unit) {
  return unit.kind === "text" ? [unit.text] : unit.items;
}
function citationTokensIn(text, isCitation2) {
  const masked = stripInlineCode(text);
  const out2 = [];
  for (const m of masked.matchAll(TOKEN_RE2)) {
    for (const tok of citationsInBracket(m[1], isCitation2)) if (!out2.includes(tok)) out2.push(tok);
  }
  return out2;
}
function citationsInBracket(inner, isCitation2) {
  const tok = inner.trim();
  const unwrapped = tok.startsWith("[") ? tok.slice(1).trim() : tok;
  const parts = unwrapped.split(/[,;]/).map((p) => p.trim());
  if (parts.length > 1 && parts.every((p) => isCitation2(p))) return parts;
  if (isCitation2(tok)) return [tok];
  return unwrapped !== tok && isCitation2(unwrapped) ? [unwrapped] : [];
}
function danglingTokens(cited, known) {
  const have2 = new Set(known);
  const out2 = [];
  for (const t of cited) if (!have2.has(t) && !out2.includes(t)) out2.push(t);
  return out2;
}
init_brand();
init_no_write();
init_brand();
init_cli_kit();
var PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"];
var LATEST_PROTOCOL = PROTOCOL_VERSIONS[PROTOCOL_VERSIONS.length - 1];
init_brand();
init_brand();
init_brand();
var MAX_BODY_BYTES2 = 4 * 1024 * 1024;
var DRAIN_LIMIT = MAX_BODY_BYTES2 * 8;

// src/engine.ts
configure({
  name: "ultraguard",
  envPrefix: "ULTRAGUARD",
  cli: "ultraguard",
  contactUrl: "https://github.com/maxgfr/ultraguard"
});

// src/types.ts
var INDICATOR_TYPES = [
  "branch",
  "pr_title",
  "commit_message",
  "file",
  "workflow_file",
  "string",
  "sha256",
  "ip",
  "domain",
  "url",
  "package",
  "cache_key_prefix",
  "artifact_prefix",
  "cron_tag",
  "process",
  "azure_fedcred_prefix",
  "actor"
];
var SURFACES = ["github:account", "github:repos", "host", "deps", "cloud"];

// src/verdict.ts
function blind(surface, results) {
  const r = results.find((x) => x.surface === surface);
  return !r?.scanned;
}
function verdicts(findings, gaps, results) {
  return SURFACES.map((surface) => {
    const mine = findings.filter(
      (f) => f.surface === surface || surface === "github:account" && f.surface === "github:repos" && f.scope === "own" && f.severity === "compromised"
    );
    const ids = (sev) => mine.filter((f) => f.severity === sev).map((f) => f.id);
    const g = gaps.filter((x) => x.surface === surface).length;
    const compromised = ids("compromised");
    const exposed = ids("exposed");
    const suspicious = ids("suspicious");
    if (compromised.length) return { surface, verdict: "COMPROMISED", findings: compromised, gaps: g, why: `${compromised.length} IOC match(es)` };
    if (exposed.length) return { surface, verdict: "EXPOSED", findings: exposed, gaps: g, why: `${exposed.length} exposure(s)` };
    if (blind(surface, results)) return { surface, verdict: "UNKNOWN", findings: [], gaps: g, why: "not scanned" };
    if (suspicious.length) return { surface, verdict: "REVIEW", findings: suspicious, gaps: g, why: `${suspicious.length} change(s) in the window to judge` };
    return { surface, verdict: "CLEAN", findings: [], gaps: g, why: g ? `no IOC matched; ${g} coverage gap(s)` : "no IOC matched" };
  });
}
var RANK = { COMPROMISED: 4, EXPOSED: 3, REVIEW: 2, UNKNOWN: 1, CLEAN: 0 };
function worst(list) {
  return list.reduce((w, v) => RANK[v.verdict] > RANK[w] ? v.verdict : w, "CLEAN");
}

// src/check.ts
var isCitation = (t) => /^[SF]\d+$/.test(t);
var NAMES = {
  "github:account": /github:account|\b(your|the|my|mon|ton) (github )?(account|compte)\b|\bcompte github\b/i,
  "github:repos": /github:repos|\brepositor(y|ies)\b|\brepos?\b|\bd[ée]p[ôo]ts?\b/i,
  host: /\bhost\b|\bmachine\b|\bmac\b|\blaptop\b|\bcomputer\b|\bordinateur\b/i,
  deps: /\bdeps\b|\bdependenc(y|ies)\b|\blockfiles?\b|\bd[ée]pendances?\b|\bpackages?\b|\bpaquets?\b/i,
  cloud: /\bcloud\b|\baws\b|\bgcp\b|\bazure\b/i
};
function checkAnswer(run, text) {
  const problems = [];
  const known = [...run.sources().map((s) => s.id), ...run.findings().map((f) => f.id)];
  const lines = text.split("\n");
  const lineOf = (needle) => lines.findIndex((l) => l.includes(needle)) + 1 || void 0;
  for (const t of danglingTokens(citationTokensIn(text, isCitation), known))
    problems.push({ rule: "dangling", message: `[${t}] is not a source or finding of this run`, line: lineOf(`[${t}]`) });
  for (const unit of extractClaimUnits(text)) {
    for (const block of unitTexts(unit)) {
      const cited = citationTokensIn(block, (t) => /^F\d+$/.test(t) && known.includes(t)).length > 0;
      if (cited) continue;
      for (const s of block.split(/(?<=[.!?])\s+/)) {
        if (!/\b(compromised|exposed|infected|hit by|touché|compromis|exposé)/i.test(s)) continue;
        if (/\b(not|no|never|pas|aucun|aucune|ni)\b[^.]{0,40}\b(compromised|exposed|infected|hit|touché|compromis|exposé)/i.test(s)) continue;
        problems.push({
          rule: "uncited-claim",
          message: `claims a compromise without citing a finding [F#]: "${s.slice(0, 120)}"`,
          line: lineOf(s.slice(0, 40))
        });
      }
    }
  }
  const vs = verdicts(run.findings(), run.gaps(), run.surfaces());
  for (const v of vs) {
    if ((v.verdict === "COMPROMISED" || v.verdict === "EXPOSED") && !NAMES[v.surface].test(text) && !v.findings.some((id) => text.includes(`[${id}]`)))
      problems.push({
        rule: "omitted-surface",
        message: `${v.surface} is ${v.verdict} (${v.findings.map((x) => `[${x}]`).join("")}) but the answer never mentions it`
      });
  }
  const sentences = lines.flatMap((l, i) => l.split(/(?<=[.!?;])\s+/).map((t) => ({ t, line: i + 1 })));
  const CLEAN_WORDS = /\b(clean|safe|not (been )?(compromised|hit|affected)|propre|sain|rien trouvé|aucune trace)\b/i;
  const allClean = /\b(everything|all (surfaces )?(is |are )?|nothing (was )?(found|hit)|tout est|rien n'a été)\b.{0,20}\b(clean|safe|found|propre|sain|trouvé|touché)\b/i;
  const anyBad = vs.some((v) => v.verdict !== "CLEAN");
  for (const { t, line } of sentences) {
    if (/\b(but|except|however|mais|sauf)\b/i.test(t)) continue;
    if (anyBad && allClean.test(t)) {
      problems.push({
        rule: "wrong-clean",
        message: `"${t.slice(0, 80)}" but the verdicts are ${vs.map((v2) => `${v2.surface}=${v2.verdict}`).join(", ")}`,
        line
      });
      continue;
    }
    if (!CLEAN_WORDS.test(t)) continue;
    const named = SURFACES.filter((x) => NAMES[x].test(t));
    if (named.length !== 1) continue;
    const v = vs.find((x) => x.surface === named[0]);
    if (v && v.verdict !== "CLEAN") problems.push({ rule: "wrong-clean", message: `calls ${v.surface} clean but its verdict is ${v.verdict}`, line });
  }
  if (run.gaps().length && !/\b(coverage|gaps?|not (checked|scanned|covered)|couverture|non vérifié|pas vérifié|angles? morts?)\b/i.test(text))
    problems.push({
      rule: "no-coverage",
      message: `the run has ${run.gaps().length} coverage gap(s) and the answer does not mention any: gaps are not absence`
    });
  return problems;
}

// src/scan/gh.ts
var Gh = class {
  constructor(run, timeoutMs = 6e4) {
    this.run = run;
    this.timeoutMs = timeoutMs;
  }
  run;
  timeoutMs;
  calls = 0;
  async api(path, extra = []) {
    this.calls++;
    const res = await this.run("gh", ["api", ...extra, path], { timeoutMs: this.timeoutMs });
    if (res.missing) return { ok: false, status: 0, error: "gh is not installed" };
    if (!res.ok) {
      const m = /HTTP (\d{3})/.exec(res.stderr) ?? /"status":\s*"?(\d{3})/.exec(res.stdout);
      return { ok: false, status: m ? Number(m[1]) : 0, error: (res.stderr || res.stdout).trim().split("\n")[0] };
    }
    try {
      return { ok: true, status: 200, data: JSON.parse(res.stdout) };
    } catch {
      return { ok: false, status: 0, error: "gh returned non-JSON output" };
    }
  }
  /**
   * Every page of a list endpoint, up to `maxPages`. `pick` extracts the list
   * from an envelope (`workflow_runs`, `items`). `truncated` says the cap cut it.
   */
  async paged(path, opts = {}) {
    const all = [];
    const max = opts.maxPages ?? 10;
    for (let page = 1; page <= max; page++) {
      const sep2 = path.includes("?") ? "&" : "?";
      const res = await this.api(`${path}${sep2}per_page=100&page=${page}`);
      if (!res.ok) return page === 1 ? { ok: false, status: res.status, error: res.error } : { ok: true, status: 200, data: all, truncated: true };
      const list = opts.pick ? opts.pick(res.data) : res.data;
      all.push(...list);
      if (list.length < 100 || opts.stop?.(list)) return { ok: true, status: 200, data: all };
    }
    return { ok: true, status: 200, data: all, truncated: true };
  }
  /** The token's OAuth scopes, read from the X-OAuth-Scopes header. Undefined when gh hides them (fine-grained tokens). */
  async scopes() {
    this.calls++;
    const res = await this.run("gh", ["api", "-i", "user"], { timeoutMs: this.timeoutMs });
    if (!res.ok) return void 0;
    const m = /^x-oauth-scopes:\s*(.*)$/im.exec(res.stdout);
    return m ? (m[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : void 0;
  }
};

// src/doctor.ts
async function doctor(runner2, opts = {}) {
  const out2 = [];
  const major = Number(process.versions.node.split(".")[0]);
  out2.push({ check: "node", ok: major >= 18, detail: process.versions.node, fix: major >= 18 ? void 0 : "install Node 18 or newer" });
  const gh = new Gh(runner2);
  const me = await gh.api("user");
  if (!me.ok)
    out2.push({
      check: "gh",
      ok: false,
      detail: me.error ?? `HTTP ${me.status}`,
      fix: me.status === 0 ? "install the GitHub CLI: https://cli.github.com" : "gh auth login"
    });
  else {
    const scopes = await gh.scopes();
    const missing = scopes ? ["repo", "read:org"].filter((s) => !scopes.includes(s)) : [];
    out2.push({
      check: "gh",
      ok: missing.length === 0,
      detail: `logged in as ${me.data?.login}${scopes ? `; scopes: ${scopes.join(", ")}` : "; fine-grained token (scopes not listed)"}`,
      fix: missing.length ? `gh auth refresh -s ${missing.join(",")}` : void 0
    });
  }
  const net = process.platform === "darwin" ? ["lsof", ["-v"], "lsof (open connections)"] : ["ss", ["-V"], "ss (open connections)"];
  for (const [cmd, args, label] of [net, ["crontab", ["-l"], "crontab"]]) {
    const r = await runner2(cmd, [...args], { timeoutMs: 1e4 });
    out2.push({ check: label, ok: !r.missing, detail: r.missing ? "not installed" : "available" });
  }
  for (const [cmd, args, fix] of [
    ["aws", ["sts", "get-caller-identity", "--output", "json"], "aws sso login"],
    ["gcloud", ["config", "get-value", "account"], "gcloud auth login"],
    ["az", ["account", "show", "--output", "json"], "az login"]
  ]) {
    const r = await runner2(cmd, [...args], { timeoutMs: 3e4 });
    const ok = r.ok && r.stdout.trim().length > 0;
    out2.push({
      check: cmd,
      ok,
      detail: r.missing ? "not installed (cloud surface skipped for it)" : ok ? "logged in" : "not logged in",
      fix: r.missing ? void 0 : ok ? void 0 : fix
    });
  }
  if (opts.probe) {
    try {
      const res = await httpJson(
        "POST",
        "https://api.osv.dev/v1/query",
        { package: { ecosystem: "npm", name: "left-pad" }, version: "1.3.0" },
        { timeoutMs: 2e4 }
      );
      out2.push({ check: "osv.dev", ok: !!res, detail: "reachable" });
    } catch (e) {
      out2.push({ check: "osv.dev", ok: false, detail: e.message, fix: "check the network; scan deps --no-osv works offline" });
    }
  }
  return out2;
}
function formatDoctor(lines) {
  return lines.map((l) => `${l.ok ? "ok  " : "no  "} ${l.check}: ${l.detail}${l.fix ? `
       fix: ${l.fix}` : ""}`).join("\n");
}

// src/intel.ts
import { mkdirSync as mkdirSync2, readFileSync as readFileSync6 } from "fs";

// src/ioc.ts
var ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;
function validateIocs(raw, sources) {
  const problems = [];
  const usable = new Set(sources.filter((s) => !s.error).map((s) => s.id));
  const push = (path, message) => problems.push({ path, message });
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.campaigns)) {
    push("$", 'expected an object with a "campaigns" array');
    return { problems };
  }
  const campaigns = raw.campaigns;
  const ids = /* @__PURE__ */ new Set();
  for (const [ci, c] of campaigns.entries()) {
    const at = `campaigns[${ci}]`;
    if (!c || typeof c !== "object") {
      push(at, "expected an object");
      continue;
    }
    if (!c.id || typeof c.id !== "string") push(`${at}.id`, "required string");
    else if (ids.has(c.id)) push(`${at}.id`, `duplicate campaign id "${c.id}"`);
    else ids.add(c.id);
    if (!c.title) push(`${at}.title`, "required string");
    if (!c.since || !ISO_DATE.test(c.since) || Number.isNaN(Date.parse(c.since))) push(`${at}.since`, "required ISO date (YYYY-MM-DD or full timestamp)");
    if (c.until && (!ISO_DATE.test(c.until) || Number.isNaN(Date.parse(c.until)))) push(`${at}.until`, "must be an ISO date");
    if (!Array.isArray(c.sources) || c.sources.length === 0) push(`${at}.sources`, "cite at least one [S#]");
    else for (const s of c.sources) if (!usable.has(s)) push(`${at}.sources`, `${s} is not a fetched source of this run`);
    if (!Array.isArray(c.indicators) || c.indicators.length === 0) push(`${at}.indicators`, "at least one indicator");
    else c.indicators.forEach((ind, ii) => validateIndicator(ind, `${at}.indicators[${ii}]`, usable, push));
  }
  return problems.length ? { problems } : { iocs: raw, problems };
}
function validateIndicator(ind, at, usable, push) {
  if (!ind || typeof ind !== "object") {
    push(at, "expected an object");
    return;
  }
  if (!INDICATOR_TYPES.includes(ind.type)) push(`${at}.type`, `one of ${INDICATOR_TYPES.join(", ")}`);
  if (typeof ind.value !== "string" || ind.value.trim() === "") push(`${at}.value`, "required non-empty string");
  if (!ind.source) push(`${at}.source`, "cite the [S#] that states this indicator");
  else if (!usable.has(ind.source)) push(`${at}.source`, `${ind.source} is not a fetched source of this run`);
  if (ind.regex) {
    try {
      new RegExp(ind.value);
    } catch (e) {
      push(`${at}.value`, `invalid regex: ${e.message}`);
    }
  }
  if (ind.type === "package" && !ind.ecosystem) push(`${at}.ecosystem`, "required for a package indicator");
  if (ind.type === "sha256" && !/^[a-f0-9]{64}$/i.test(ind.value)) push(`${at}.value`, "a sha256 is 64 hex characters");
  if (ind.type === "ip" && !/^[\d.]+$|^[a-f0-9:]+$/i.test(defang(ind.value))) push(`${at}.value`, "an IPv4 or IPv6 address");
}
function defang(s) {
  return s.replace(/\[\.\]|\(\.\)|\{\.\}/g, ".").replace(/\[:\]/g, ":").replace(/^hxxp/i, "http");
}
function globRegex(glob) {
  let re = "";
  for (const ch of glob) {
    if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}
function compile(c, ind) {
  const value = defang(ind.value);
  let test;
  if (ind.regex) {
    const re = new RegExp(value, "i");
    test = (s) => re.test(s);
  } else if (ind.type === "file" || ind.type === "workflow_file") {
    const re = globRegex(value);
    const hasSlash = value.includes("/");
    test = (s) => {
      if (!hasSlash) return re.test(s.split("/").pop() ?? s);
      const parts = s.split("/");
      const depth = value.split("/").length;
      return re.test(parts.slice(-depth).join("/"));
    };
  } else if (ind.type === "branch" || ind.type === "actor" || ind.type === "commit_message" || ind.type === "pr_title") {
    const want = value.trim().toLowerCase();
    test = (s) => s.trim().toLowerCase() === want;
  } else if (ind.type.endsWith("_prefix")) {
    test = (s) => s.toLowerCase().startsWith(value.toLowerCase());
  } else {
    const needle = value.toLowerCase();
    test = (s) => s.toLowerCase().includes(needle);
  }
  return { campaign: c, indicator: { ...ind, value }, test };
}
function matchers(iocs, ...types) {
  const out2 = [];
  for (const c of iocs.campaigns) for (const ind of c.indicators) if (types.includes(ind.type)) out2.push(compile(c, ind));
  return out2;
}
function windowStart(iocs) {
  const times = iocs.campaigns.map((c) => Date.parse(c.since)).filter((t) => !Number.isNaN(t));
  return new Date(times.length ? Math.min(...times) : Date.now() - 30 * 864e5).toISOString();
}
function packageHit(ind, ecosystem, name, version) {
  if (ind.type !== "package") return false;
  if (normEco(ind.ecosystem ?? "") !== normEco(ecosystem)) return false;
  if (ind.value.toLowerCase() !== name.toLowerCase()) return false;
  if (!ind.versions || ind.versions.length === 0) return true;
  const v = version.replace(/^v/, "");
  return ind.versions.some((x) => x.replace(/^v/, "") === v);
}
function normEco(e) {
  const s = e.toLowerCase();
  if (s === "crates" || s === "cargo") return "crates.io";
  if (s === "golang") return "go";
  if (s === "composer") return "packagist";
  if (s === "gem" || s === "gems") return "rubygems";
  if (s === "python" || s === "pip") return "pypi";
  if (s === "openvsx" || s === "vscode-extension") return "vscode";
  return s;
}
function iocTemplate(sources) {
  const ok = sources.filter((s) => !s.error && s.origin === "web");
  return {
    campaigns: ok.map((s, i) => ({
      id: `campaign-${i + 1}`,
      title: s.title ?? s.url,
      sources: [s.id],
      since: "YYYY-MM-DD",
      indicators: [{ type: "string", value: "TODO: replace with the indicators the source states, verbatim", source: s.id }]
    }))
  };
}

// src/intel.ts
var defaultFetcher = (url) => fetchAndExtract(url, { stripConsent: true, format: "markdown" });
function parseWebResults(raw) {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? raw.results ?? raw.hits ?? raw.items ?? [] : [];
  const out2 = [];
  for (const item of list) {
    if (typeof item === "string") out2.push({ url: item });
    else if (item && typeof item === "object") {
      const o = item;
      const url = o.url ?? o.link ?? o.href;
      if (typeof url === "string") out2.push({ url, title: typeof o.title === "string" ? o.title : void 0 });
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return out2.filter((h) => {
    if (!/^https?:\/\//i.test(h.url)) return false;
    const k = safeCanonical(h.url);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function safeCanonical(url) {
  try {
    return canonicalizeUrl(url);
  } catch {
    return url;
  }
}
function readWebResultsFile(path) {
  return parseWebResults(JSON.parse(readFileSync6(path, "utf8")));
}
async function intel(run, hits, fetcher = defaultFetcher, now = /* @__PURE__ */ new Date()) {
  mkdirSync2(run.path("sources"), { recursive: true });
  const out2 = [];
  for (const hit2 of hits) {
    let res;
    let error;
    try {
      res = await fetcher(hit2.url);
      if (res.status >= 400 || !res.text || res.text.trim().length < 200) error = `HTTP ${res.status}, ${res.text?.trim().length ?? 0} chars of text`;
    } catch (e) {
      error = e.message;
    }
    const src = run.addSource({
      url: hit2.url,
      title: res?.title ?? hit2.title,
      fetchedAt: now.toISOString(),
      origin: "web",
      ...error ? { error } : {}
    });
    if (!error && res) {
      const file = `sources/${src.id}.md`;
      writeFileAtomic(run.path(file), `# ${src.title ?? src.url}

<${res.finalUrl || src.url}>

${res.text}
`);
      run.addSource({ ...src, file });
      src.file = file;
    }
    out2.push(src);
  }
  if (!run.iocs()) run.write("iocs.todo.json", iocTemplate(run.sources()));
  return out2;
}

// src/report.ts
var LABEL = {
  "github:account": "GitHub account",
  "github:repos": "GitHub repositories you can push to",
  host: "This machine",
  deps: "Local dependencies (lockfiles)",
  cloud: "Cloud (AWS, GCP, Azure)"
};
var cite = (f) => `[${f.id}]${f.source ? `[${f.source}]` : ""}`;
function findingLine(f) {
  const when = f.at ? ` (${f.at.slice(0, 16).replace("T", " ")})` : "";
  const who = f.scope === "other" && f.actor && !f.title.includes(f.actor) ? ` by \`${f.actor}\`` : "";
  return `- **${f.severity}**: ${f.title}${who}${when} ${cite(f)}`;
}
var SEV_ORDER = ["compromised", "exposed", "suspicious", "info"];
function payloadRan(findings, repo) {
  return findings.some((f) => f.subject === repo && f.severity === "compromised" && /^(Workflow|Commit) /.test(f.title));
}
function idList(ids, max = 8) {
  if (!ids.length) return "none";
  const shown = ids.slice(0, max).map((id) => `[${id}]`).join(" ");
  return ids.length > max ? `${shown} and ${ids.length - max} more` : shown;
}
function renderReport(run, now = /* @__PURE__ */ new Date()) {
  const findings = run.findings();
  const gaps = run.gaps();
  const sources = run.sources();
  const iocs = run.iocs();
  const vs = verdicts(findings, gaps, run.surfaces());
  const meta = run.meta();
  const out2 = [];
  out2.push(`# ultraguard report`, "");
  out2.push(`Generated ${now.toISOString()}${meta.login ? ` for GitHub account \`${meta.login}\`` : ""}. Overall: **${worst(vs)}**.`, "");
  out2.push("## Verdict", "", "| Surface | Verdict | Evidence | Gaps |", "|---|---|---|---|");
  for (const v of vs) out2.push(`| ${LABEL[v.surface]} (\`${v.surface}\`) | **${v.verdict}** | ${idList(v.findings)} | ${v.gaps} |`);
  out2.push("");
  out2.push("## Campaigns checked", "");
  for (const c of iocs?.campaigns ?? []) {
    const types = [...new Set(c.indicators.map((i) => i.type))].join(", ");
    out2.push(
      `- **${c.title}** (\`${c.id}\`), since ${c.since.slice(0, 10)}: ${c.indicators.length} indicators (${types}) ${c.sources.map((s) => `[${s}]`).join("")}`
    );
  }
  if (!iocs?.campaigns.length) out2.push("- none: no IOC file was set for this run");
  out2.push("");
  for (const v of vs) {
    const fs = findings.filter((f) => f.surface === v.surface);
    if (!fs.length) continue;
    out2.push(`## ${LABEL[v.surface]}`, "");
    if (v.surface === "github:repos") {
      const repos = [...new Set(fs.map((f) => f.subject))].sort((a, b) => Number(payloadRan(fs, b)) - Number(payloadRan(fs, a)) || a.localeCompare(b));
      for (const r of repos) {
        const own = fs.filter((f) => f.subject === r);
        const ran = payloadRan(fs, r);
        const hitRepo = own.some((f) => f.severity === "compromised");
        out2.push(`### ${r}${hitRepo ? ran ? ": attacker code ran in CI" : ": probe only, no attacker run seen" : ""}`, "");
        for (const sev of SEV_ORDER) for (const f of own.filter((x) => x.severity === sev)) out2.push(findingLine(f));
        out2.push("");
      }
      continue;
    }
    for (const sev of SEV_ORDER) for (const f of fs.filter((x) => x.severity === sev)) out2.push(findingLine(f));
    out2.push("");
  }
  const timed = findings.filter((f) => f.at && f.severity !== "info").sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if (timed.length) {
    out2.push("## Timeline", "");
    for (const f of timed) out2.push(`- ${String(f.at).slice(0, 16).replace("T", " ")}: ${f.subject}: ${f.title} [${f.id}]`);
    out2.push("");
  }
  out2.push("## Coverage", "", "Gaps are not absence: what was not looked at is not clean.", "");
  for (const g of gaps) out2.push(`- \`${g.surface}\`: ${g.what}: ${g.why}${g.fix ? ` (to close: ${g.fix})` : ""}`);
  if (!gaps.length) out2.push("- no gap recorded");
  out2.push("");
  out2.push("## Sources", "");
  for (const s of sources) out2.push(`- [${s.id}] ${s.title ?? s.url} <${s.url}>${s.error ? ` (fetch failed: ${s.error})` : ""}`);
  out2.push("", "## Findings register", "");
  for (const f of findings)
    out2.push(`- [${f.id}] ${f.evidence.kind}: \`${f.evidence.ref}\`${f.evidence.excerpt ? `: ${f.evidence.excerpt.replace(/`/g, "'")}` : ""}`);
  out2.push("");
  return { report: out2.join("\n"), remediation: renderRemediation(findings, vs, sources, gaps), verdicts: vs };
}
function renderRemediation(findings, vs, _sources, gaps) {
  const out2 = ["# Remediation", "", "ultraguard runs none of these commands. Read each one, then run the ones that apply.", ""];
  const v = Object.fromEntries(vs.map((x) => [x.surface, x.verdict]));
  let step = 0;
  const h = (t) => out2.push(`## ${++step}. ${t}`, "");
  if (v["github:account"] === "COMPROMISED") {
    h("Your GitHub account acted for the attacker: lock it first");
    out2.push(
      "1. Change your password and check 2FA: <https://github.com/settings/security>",
      "2. Revoke every session, token and OAuth grant you do not recognise: <https://github.com/settings/sessions>, <https://github.com/settings/tokens>, <https://github.com/settings/applications>",
      "3. Refresh the gh CLI token: `gh auth logout && gh auth login`",
      "4. Read the security log for the window: <https://github.com/settings/security-log>",
      "5. Close the PRs and delete the branches your account created:",
      ""
    );
    for (const f of findings.filter((x) => x.surface === "github:account" && x.severity === "compromised"))
      out2.push(`   - ${f.title} [${f.id}]: <${f.evidence.ref}>`);
    out2.push("", "6. Find where the token leaked: a machine with the stealer (see the host section), a CI log, a `.env` in a public repo.", "");
  }
  const hitRepos = [...new Set(findings.filter((f) => f.surface === "github:repos" && f.severity === "compromised").map((f) => f.subject))];
  if (hitRepos.length) {
    h("Repositories hit: assume every secret their CI could read is stolen");
    const others = [...new Set(findings.filter((f) => f.surface === "github:repos" && f.scope === "other" && f.actor).map((f) => f.actor))];
    if (others.length)
      out2.push(
        `The activity came from ${others.map((a) => `\`${a}\``).join(", ")}. Tell the owners or org admins: that account must be locked and its tokens revoked.`,
        ""
      );
    hitRepos.sort((a, b) => Number(payloadRan(findings, b)) - Number(payloadRan(findings, a)) || a.localeCompare(b));
    for (const r of hitRepos) {
      const ran = payloadRan(findings, r);
      out2.push(`### ${r}${ran ? ": attacker code ran in CI, rotate now" : ": probe PR only"}`, "");
      if (!ran)
        out2.push(
          "The probe proves the attacker could write here. No attacker run was seen, but runs can be deleted: check the run list below for gaps, and rotate if any attacker run executed.",
          ""
        );
      for (const f of findings.filter((x) => x.subject === r && x.surface === "github:repos")) out2.push(`- ${f.title} [${f.id}]`);
      out2.push(
        "",
        "```sh",
        `gh secret list -R ${r}                       # rotate each one AT ITS SOURCE, then update it here`,
        `gh variable list -R ${r}`,
        `gh api repos/${r}/environments --jq '.environments[].name'   # environment secrets too`,
        `gh api repos/${r}/actions/runs --paginate --jq '.workflow_runs[] | [.run_number,.head_branch,.display_title,.actor.login] | @tsv' | less`,
        `gh api repos/${r}/commits --jq '.[] | [.sha[0:8], .author.login, .commit.message] | @tsv' | head -50`,
        "```",
        "",
        "- Check branch protection and recent commit statuses: a forged `success` status can let a bad commit merge.",
        "- Delete leftover attacker branches, caches and artifacts once you have kept a copy as evidence.",
        ""
      );
    }
    out2.push("Org-level secrets shared with these repositories count too: `gh secret list --org <org>`.", "");
  }
  const host = findings.filter((f) => f.surface === "host" && (f.severity === "compromised" || f.severity === "exposed"));
  if (host.length) {
    h("This machine");
    if (host.some((f) => f.severity === "compromised"))
      out2.push(
        "An IOC is on this machine. Treat every credential it holds as stolen: browser sessions, `~/.ssh`, `~/.aws`, `~/.config/gcloud`, `~/.azure`, `~/.npmrc`, `~/.pypirc`, `~/.docker/config.json`, `~/.kube`, the gh token, `.env` files and AI provider keys.",
        "Rotate them from ANOTHER, clean machine. Then remove the persistence below and consider a reinstall.",
        ""
      );
    for (const f of host) out2.push(`- ${f.title} [${f.id}]: \`${f.evidence.ref}\``);
    out2.push("");
  }
  const deps = findings.filter((f) => f.surface === "deps" && f.severity === "compromised");
  if (deps.length) {
    h("Malicious dependencies");
    out2.push("A project locks a malicious version. If it was installed, its install scripts ran: treat that machine and its CI as compromised.", "");
    for (const f of deps) out2.push(`- ${f.title} [${f.id}]`);
    out2.push(
      "",
      "Pin a clean version, delete `node_modules` (or the venv), reinstall with scripts off (`npm ci --ignore-scripts`), and rotate what the install could read.",
      ""
    );
  }
  const cloud = findings.filter((f) => f.surface === "cloud" && f.severity !== "info");
  if (cloud.length) {
    h("Cloud persistence");
    for (const f of cloud) out2.push(`- ${f.title} [${f.id}]: \`${f.evidence.ref}\``);
    out2.push(
      "",
      "- A role that trusts `*` lets anyone assume it: restore its trust policy (`aws iam update-assume-role-policy`).",
      "- Delete access keys you did not create (`aws iam delete-access-key`), GCP keys (`gcloud iam service-accounts keys delete`) and Azure federated credentials (`az ad app federated-credential delete`).",
      ""
    );
  }
  const review = findings.filter((f) => f.severity === "suspicious");
  if (review.length) {
    h("To judge: changes in the window that match no IOC");
    for (const f of review) out2.push(`- ${f.title} [${f.id}]: \`${f.evidence.ref}\``);
    out2.push("", "Each one is either yours (an install, an update) or not. If it is not, treat it as compromised.", "");
  }
  if (gaps.length) {
    h("Close the coverage gaps");
    for (const g of gaps.filter((x) => x.fix)) out2.push(`- \`${g.surface}\` ${g.what}: ${g.fix}`);
    out2.push("");
  }
  if (step === 0) out2.push("Nothing to do: no surface was hit.", "");
  return out2.join("\n");
}

// src/run.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync3, readFileSync as readFileSync9 } from "fs";
import { join, resolve } from "path";
var Run = class {
  dir;
  constructor(dir) {
    this.dir = resolve(dir);
    mkdirSync3(this.dir, { recursive: true });
  }
  path(name) {
    return join(this.dir, name);
  }
  read(name, fallback) {
    const p = this.path(name);
    if (!existsSync4(p)) return fallback;
    return JSON.parse(readFileSync9(p, "utf8"));
  }
  write(name, value) {
    writeFileAtomic(this.path(name), `${JSON.stringify(value, null, 2)}
`);
  }
  writeText(name, text) {
    writeFileAtomic(this.path(name), text);
  }
  sources() {
    return this.read("sources.json", []);
  }
  addSource(s) {
    const all = this.sources();
    const existing = all.find((x) => x.url === s.url);
    if (existing && !existing.error) return existing;
    const id = existing?.id ?? `S${all.length + 1}`;
    const src = { id, ...s };
    const next = existing ? all.map((x) => x.id === id ? src : x) : [...all, src];
    this.write("sources.json", next);
    return src;
  }
  iocs() {
    return this.read("iocs.json", void 0);
  }
  findings() {
    return this.read("findings.json", []);
  }
  gaps() {
    return this.read("gaps.json", []);
  }
  surfaces() {
    return this.read("surfaces.json", []);
  }
  meta() {
    return this.read("meta.json", {});
  }
  setMeta(patch) {
    this.write("meta.json", { ...this.meta(), ...patch });
  }
  /** Replace everything one surface reported: a re-scan supersedes the last one. */
  recordSurface(result, found, gaps) {
    const kept = this.findings().filter((f) => f.surface !== result.surface && !found.some((n2) => n2.key === f.key));
    let n = kept.reduce((max, f) => Math.max(max, Number(f.id.slice(1)) || 0), 0);
    const seen = /* @__PURE__ */ new Set();
    const added = [];
    for (const f of found) {
      if (seen.has(f.key)) continue;
      seen.add(f.key);
      added.push({ id: `F${++n}`, ...f });
    }
    this.write("findings.json", [...kept, ...added]);
    this.write("gaps.json", [...this.gaps().filter((g) => g.surface !== result.surface), ...gaps]);
    this.write("surfaces.json", [...this.surfaces().filter((s) => s.surface !== result.surface), result]);
    return added;
  }
};

// src/runner.ts
var defaultRunner = (cmd, args, opts) => shAsync(cmd, args, { timeoutMs: opts?.timeoutMs ?? 6e4, cwd: opts?.cwd });
function parseJsonOutput(res) {
  if (!res.ok) return void 0;
  try {
    return JSON.parse(res.stdout);
  } catch {
    return void 0;
  }
}

// src/pool.ts
async function mapPool(items, limit, fn) {
  const out2 = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const i = next++;
      out2[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out2;
}

// src/scan/cloud.ts
var T = 6e4;
function wildcardTrust(doc) {
  const stmts = Array.isArray(doc?.Statement) ? doc.Statement : doc?.Statement ? [doc.Statement] : [];
  for (const s of stmts) {
    if (s.Effect !== "Allow") continue;
    const p = s.Principal;
    const aws = p === "*" ? ["*"] : p?.AWS ? Array.isArray(p.AWS) ? p.AWS : [p.AWS] : [];
    if (aws.some((a) => a === "*" || /^arn:aws:iam::\*:/.test(a))) return { statement: s, conditioned: !!s.Condition };
  }
  return void 0;
}
async function scanCloud(iocs, runner2, opts = {}) {
  const since = windowStart(iocs);
  const result = { surface: "cloud", scanned: false, stats: {}, startedAt: (opts.now ?? /* @__PURE__ */ new Date()).toISOString() };
  const findings = [];
  const gaps = [];
  const fedPrefix = matchers(iocs, "azure_fedcred_prefix");
  const who = await runner2("aws", ["sts", "get-caller-identity", "--output", "json"], { timeoutMs: T });
  if (who.missing) gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not installed", fix: "skip if you use no AWS account" });
  else if (!who.ok)
    gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not logged in", fix: "aws sso login (or set a profile), then re-run scan cloud" });
  else {
    result.scanned = true;
    const account = parseJsonOutput(who)?.Account ?? "?";
    const roles = parseJsonOutput(await runner2("aws", ["iam", "list-roles", "--output", "json"], { timeoutMs: T }))?.Roles ?? [];
    result.stats.awsRoles = roles.length;
    for (const role of roles) {
      let doc = role.AssumeRolePolicyDocument;
      if (typeof doc === "string") doc = JSON.parse(decodeURIComponent(doc));
      const w = wildcardTrust(doc);
      if (!w) continue;
      findings.push({
        surface: "cloud",
        severity: w.conditioned ? "suspicious" : "compromised",
        subject: `aws:${account}:role/${role.RoleName}`,
        title: `IAM role ${role.RoleName} trusts any AWS principal${w.conditioned ? " (with a Condition: check it)" : ""}`,
        evidence: { kind: "command", ref: `aws iam get-role --role-name ${role.RoleName}`, excerpt: JSON.stringify(w.statement).slice(0, 300) },
        key: `cloud|aws|${account}|trust|${role.RoleName}`
      });
    }
    const users = parseJsonOutput(await runner2("aws", ["iam", "list-users", "--output", "json"], { timeoutMs: T }))?.Users ?? [];
    result.stats.awsUsers = users.length;
    await mapPool(users, 4, async (u) => {
      const keys = parseJsonOutput(
        await runner2("aws", ["iam", "list-access-keys", "--user-name", u.UserName, "--output", "json"], { timeoutMs: T })
      )?.AccessKeyMetadata ?? [];
      for (const k of keys) {
        if (!k.CreateDate || k.CreateDate < since) continue;
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `aws:${account}:user/${u.UserName}`,
          title: `Access key ${k.AccessKeyId} for IAM user ${u.UserName} was created during the campaign window (${k.Status})`,
          at: k.CreateDate,
          evidence: { kind: "command", ref: `aws iam list-access-keys --user-name ${u.UserName}` },
          key: `cloud|aws|${account}|key|${k.AccessKeyId}`
        });
      }
    });
    gaps.push({
      surface: "cloud",
      what: "AWS CloudTrail (who assumed which role)",
      why: "not queried: it needs a trail and can be large",
      fix: "aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=CreateAccessKey"
    });
  }
  const gacct = await runner2("gcloud", ["config", "get-value", "account"], { timeoutMs: T });
  const gproj = gacct.ok ? (await runner2("gcloud", ["config", "get-value", "project"], { timeoutMs: T })).stdout.trim() : "";
  if (gacct.missing) gaps.push({ surface: "cloud", what: "GCP", why: "the gcloud CLI is not installed", fix: "skip if you use no GCP project" });
  else if (!gacct.ok || !gacct.stdout.trim() || !gproj)
    gaps.push({ surface: "cloud", what: "GCP", why: "gcloud has no account or project set", fix: "gcloud auth login && gcloud config set project <id>" });
  else {
    result.scanned = true;
    const sas = parseJsonOutput(await runner2("gcloud", ["iam", "service-accounts", "list", "--format=json"], { timeoutMs: T })) ?? [];
    result.stats.gcpServiceAccounts = sas.length;
    await mapPool(sas, 4, async (sa) => {
      const keys = parseJsonOutput(
        await runner2("gcloud", ["iam", "service-accounts", "keys", "list", `--iam-account=${sa.email}`, "--managed-by=user", "--format=json"], {
          timeoutMs: T
        })
      ) ?? [];
      for (const k of keys) {
        if (!k.validAfterTime || k.validAfterTime < since) continue;
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `gcp:${gproj}:${sa.email}`,
          title: `User-managed key for ${sa.email} was created during the campaign window`,
          at: k.validAfterTime,
          evidence: { kind: "command", ref: `gcloud iam service-accounts keys list --iam-account=${sa.email}`, excerpt: String(k.name).split("/").pop() },
          key: `cloud|gcp|${k.name}`
        });
      }
    });
    const filter = `protoPayload.methodName:("GenerateAccessToken" OR "SignJwt") AND timestamp>="${since}"`;
    const logs = parseJsonOutput(await runner2("gcloud", ["logging", "read", filter, "--limit=200", "--format=json"], { timeoutMs: 2 * T }));
    if (!logs)
      gaps.push({
        surface: "cloud",
        what: "GCP service-account impersonation logs",
        why: "gcloud logging read failed (Data Access logs off, or no permission)"
      });
    else if (logs.length) {
      const callers = /* @__PURE__ */ new Map();
      for (const e of logs) {
        const who2 = e.protoPayload?.authenticationInfo?.principalEmail ?? "?";
        callers.set(who2, (callers.get(who2) ?? 0) + 1);
      }
      for (const [who2, n] of callers)
        findings.push({
          surface: "cloud",
          severity: "suspicious",
          subject: `gcp:${gproj}:${who2}`,
          title: `${who2} minted service-account tokens ${n} time(s) during the campaign window (generateAccessToken/signJwt)`,
          evidence: { kind: "command", ref: `gcloud logging read '${filter}'` },
          key: `cloud|gcp|impersonation|${who2}`
        });
    }
  }
  const az = await runner2("az", ["account", "show", "--output", "json"], { timeoutMs: T });
  if (az.missing) gaps.push({ surface: "cloud", what: "Azure", why: "the az CLI is not installed", fix: "skip if you use no Azure tenant" });
  else if (!az.ok) gaps.push({ surface: "cloud", what: "Azure", why: "the az CLI is not logged in", fix: "az login" });
  else {
    result.scanned = true;
    const apps = parseJsonOutput(await runner2("az", ["ad", "app", "list", "--show-mine", "--output", "json"], { timeoutMs: T })) ?? [];
    result.stats.azureApps = apps.length;
    await mapPool(apps, 4, async (app) => {
      const creds = parseJsonOutput(await runner2("az", ["ad", "app", "federated-credential", "list", "--id", app.appId, "--output", "json"], { timeoutMs: T })) ?? [];
      for (const c of creds) {
        const m = fedPrefix.find((x) => x.test(c.name ?? ""));
        if (!m && !/github|token\.actions/.test(String(c.issuer ?? ""))) continue;
        findings.push({
          surface: "cloud",
          severity: m ? "compromised" : "info",
          subject: `azure:app/${app.displayName}`,
          title: m ? `Federated credential "${c.name}" on app ${app.displayName} matches "${m.indicator.value}"` : `App ${app.displayName} trusts GitHub Actions OIDC (${c.subject}): any workflow matching this subject can get a token`,
          ...m ? { campaign: m.campaign.id, source: m.indicator.source, indicator: { type: m.indicator.type, value: m.indicator.value } } : {},
          evidence: { kind: "command", ref: `az ad app federated-credential list --id ${app.appId}`, excerpt: `${c.name} ${c.subject}` },
          key: `cloud|azure|${app.appId}|${c.name}`
        });
      }
    });
  }
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return { result, findings, gaps };
}

// src/scan/deps.ts
import { readFileSync as readFileSync10, statSync as statSync6 } from "fs";

// src/scan/lockfiles.ts
import { basename as basename3 } from "path";
var LOCKFILES = {
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "pnpm-lock.yaml": "npm",
  "yarn.lock": "npm",
  "bun.lock": "npm",
  "poetry.lock": "pypi",
  "uv.lock": "pypi",
  "Pipfile.lock": "pypi",
  "Cargo.lock": "crates.io",
  "go.sum": "go",
  "composer.lock": "packagist",
  "Gemfile.lock": "rubygems"
};
function lockfileKind(path) {
  const name = basename3(path);
  if (LOCKFILES[name]) return name;
  if (/^requirements.*\.txt$/.test(name)) return "requirements.txt";
  return void 0;
}
function parseLockfile(path, text) {
  const kind = lockfileKind(path);
  switch (kind) {
    case "package-lock.json":
    case "npm-shrinkwrap.json":
      return npmLock(text);
    case "pnpm-lock.yaml":
      return pnpmLock(text);
    case "yarn.lock":
      return yarnLock(text);
    case "bun.lock":
      return bunLock(text);
    case "poetry.lock":
    case "uv.lock":
      return tomlPackages(text, "pypi");
    case "Cargo.lock":
      return tomlPackages(text, "crates.io");
    case "Pipfile.lock":
      return pipfileLock(text);
    case "requirements.txt":
      return requirements(text);
    case "go.sum":
      return goSum(text);
    case "composer.lock":
      return composerLock(text);
    case "Gemfile.lock":
      return gemfileLock(text);
    default:
      return [];
  }
}
function uniq(list) {
  const seen = /* @__PURE__ */ new Set();
  return list.filter((l) => {
    const k = `${l.ecosystem}|${l.name}|${l.version}`;
    if (seen.has(k) || !l.name || !l.version) return false;
    seen.add(k);
    return true;
  });
}
function npmLock(text) {
  const j = JSON.parse(text);
  const out2 = [];
  for (const [key, v] of Object.entries(j.packages ?? {})) {
    if (!key) continue;
    const name = v.name ?? key.split("node_modules/").pop();
    if (v.version && !v.link) out2.push({ ecosystem: "npm", name, version: v.version });
  }
  const walkDeps = (deps) => {
    for (const [name, v] of Object.entries(deps ?? {})) {
      if (v.version) out2.push({ ecosystem: "npm", name, version: v.version });
      walkDeps(v.dependencies);
    }
  };
  walkDeps(j.dependencies);
  return uniq(out2);
}
function pnpmLock(text) {
  const out2 = [];
  for (const m of text.matchAll(/^ {2}['"]?\/?((?:@[^/@\s]+\/)?[^/@\s:'"(]+)[@/](\d[^:'"(\s]*)/gm))
    out2.push({ ecosystem: "npm", name: m[1], version: m[2] });
  return uniq(out2);
}
function yarnLock(text) {
  const out2 = [];
  for (const block of text.split(/\n(?=\S)/)) {
    const header = /^"?((?:@[^/@\s]+\/)?[^@\s",]+)@/.exec(block);
    const version = /^\s+version:?\s+"?([^"\s]+)"?/m.exec(block);
    if (header && version) out2.push({ ecosystem: "npm", name: header[1], version: version[1] });
  }
  return uniq(out2);
}
function bunLock(text) {
  const out2 = [];
  for (const m of text.matchAll(/\[\s*"((?:@[^/@"]+\/)?[^@"]+)@(\d[^"]*)"/g)) out2.push({ ecosystem: "npm", name: m[1], version: m[2] });
  return uniq(out2);
}
function tomlPackages(text, ecosystem) {
  const out2 = [];
  for (const block of text.split(/^\[\[package\]\]\s*$/m).slice(1)) {
    const name = /^name\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    const version = /^version\s*=\s*"([^"]+)"/m.exec(block)?.[1];
    if (name && version) out2.push({ ecosystem, name, version });
  }
  return uniq(out2);
}
function pipfileLock(text) {
  const j = JSON.parse(text);
  const out2 = [];
  for (const section of ["default", "develop"])
    for (const [name, v] of Object.entries(j[section] ?? {}))
      if (typeof v.version === "string") out2.push({ ecosystem: "pypi", name, version: v.version.replace(/^==/, "") });
  return uniq(out2);
}
function requirements(text) {
  const out2 = [];
  for (const m of text.matchAll(/^\s*([A-Za-z0-9_.-]+)(?:\[[^\]]*\])?\s*==\s*([^\s;#]+)/gm))
    out2.push({ ecosystem: "pypi", name: m[1], version: m[2] });
  return uniq(out2);
}
function goSum(text) {
  const out2 = [];
  for (const m of text.matchAll(/^(\S+)\s+(v[^\s/]+?)(?:\/go\.mod)?\s+h1:/gm)) out2.push({ ecosystem: "go", name: m[1], version: m[2] });
  return uniq(out2);
}
function composerLock(text) {
  const j = JSON.parse(text);
  const out2 = [];
  for (const p of [...j.packages ?? [], ...j["packages-dev"] ?? []])
    if (p.name && p.version) out2.push({ ecosystem: "packagist", name: p.name, version: String(p.version).replace(/^v/, "") });
  return uniq(out2);
}
function gemfileLock(text) {
  const out2 = [];
  for (const m of text.matchAll(/^ {4}([A-Za-z0-9_.-]+) \(([^)]+)\)$/gm)) out2.push({ ecosystem: "rubygems", name: m[1], version: m[2] });
  return uniq(out2);
}
function osvEcosystem(e) {
  return { npm: "npm", pypi: "PyPI", "crates.io": "crates.io", go: "Go", packagist: "Packagist", rubygems: "RubyGems" }[e];
}

// src/scan/deps.ts
var defaultOsvBatch = async (queries) => {
  try {
    const res = await httpJson(
      "POST",
      "https://api.osv.dev/v1/querybatch",
      { queries },
      { timeoutMs: 6e4, retries: 2, maxBytes: 32 * 1024 * 1024 }
    );
    return { ok: true, results: res?.results ?? [] };
  } catch (e) {
    return { ok: false, results: [], error: e.message };
  }
};
async function scanDeps(iocs, tree, run, opts = {}) {
  const result = { surface: "deps", scanned: true, stats: {}, startedAt: (opts.now ?? /* @__PURE__ */ new Date()).toISOString() };
  const findings = [];
  const gaps = [];
  const pkgs = matchers(iocs, "package");
  const where = /* @__PURE__ */ new Map();
  let lockfiles = 0;
  let unreadable = 0;
  for (const p of tree.files) {
    if (!lockfileKind(p)) continue;
    let locked;
    try {
      if (statSync6(p).size > 64 * 1024 * 1024) throw new Error("too large");
      locked = parseLockfile(p, readFileSync10(p, "utf8"));
    } catch {
      unreadable++;
      continue;
    }
    lockfiles++;
    for (const l of locked) {
      const k = `${l.ecosystem}|${l.name}|${l.version}`;
      const set = where.get(k) ?? /* @__PURE__ */ new Set();
      set.add(p);
      where.set(k, set);
      for (const m of pkgs) {
        if (!packageHit(m.indicator, l.ecosystem, l.name, l.version)) continue;
        findings.push({
          surface: "deps",
          severity: "compromised",
          subject: p,
          title: `${p} locks ${l.name}@${l.version}, named by the campaign`,
          campaign: m.campaign.id,
          source: m.indicator.source,
          indicator: { type: "package", value: m.indicator.value },
          evidence: { kind: "file", ref: p, excerpt: `${l.ecosystem} ${l.name}@${l.version}` },
          key: `deps|${p}|${l.ecosystem}|${l.name}|${l.version}`
        });
      }
    }
  }
  result.stats.lockfiles = lockfiles;
  result.stats.packages = where.size;
  if (unreadable) gaps.push({ surface: "deps", what: `${unreadable} lockfiles`, why: "could not be parsed or were over 64 MB" });
  if (opts.osv !== false) {
    const osv = opts.osv ?? defaultOsvBatch;
    const keys = [...where.keys()].filter((k) => osvEcosystem(k.split("|")[0]));
    let failed = 0;
    let malicious = 0;
    for (let i = 0; i < keys.length; i += 1e3) {
      const chunk = keys.slice(i, i + 1e3);
      const queries = chunk.map((k) => {
        const [eco, name, version] = k.split("|");
        return { package: { ecosystem: osvEcosystem(eco), name }, version };
      });
      const res = await osv(queries);
      if (!res.ok) {
        failed += chunk.length;
        continue;
      }
      res.results.forEach((r, j) => {
        for (const v of r.vulns ?? []) {
          if (!v.id.startsWith("MAL-")) continue;
          malicious++;
          const k = chunk[j];
          const [eco, name, version] = k.split("|");
          const url = `https://osv.dev/vulnerability/${v.id}`;
          const src = run?.addSource({ url, title: `OSV ${v.id}: malicious package ${name}`, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), origin: "osv" });
          for (const p of where.get(k) ?? []) {
            findings.push({
              surface: "deps",
              severity: "compromised",
              subject: p,
              title: `${p} locks ${name}@${version}, a malicious package (${v.id})`,
              source: src?.id,
              evidence: { kind: "url", ref: url, excerpt: `${eco} ${name}@${version}` },
              key: `deps|${p}|${eco}|${name}|${version}|${v.id}`
            });
          }
        }
      });
    }
    result.stats.osvQueried = keys.length - failed;
    result.stats.osvMalicious = malicious;
    if (failed)
      gaps.push({
        surface: "deps",
        what: `${failed} packages against OSV malicious-package advisories`,
        why: "the OSV API did not answer",
        fix: "re-run when online"
      });
  } else gaps.push({ surface: "deps", what: "OSV malicious-package advisories", why: "--no-osv" });
  gaps.push({
    surface: "deps",
    what: "globally installed packages (npm -g, pipx, cargo install) and Docker images",
    why: "only lockfiles under the roots are read"
  });
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return { result, findings, gaps };
}

// src/scan/github.ts
var firstLine = (s) => (s ?? "").split("\n")[0] ?? "";
function hit(m, base2) {
  return {
    severity: "compromised",
    ...base2,
    campaign: m.campaign.id,
    source: m.indicator.source,
    indicator: { type: m.indicator.type, value: m.indicator.value },
    key: `${base2.surface}|${base2.subject}|${m.indicator.type}:${m.indicator.value}|${base2.evidence.ref}`
  };
}
function firstMatch(ms, value) {
  if (!value) return void 0;
  return ms.find((m) => m.test(value));
}
async function scanGithub(iocs, runner2, opts = {}) {
  const gh = new Gh(runner2);
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const since = windowStart(iocs);
  const sinceDay = since.slice(0, 10);
  const accountRes = { surface: "github:account", scanned: false, stats: {}, startedAt: now.toISOString() };
  const reposRes = { surface: "github:repos", scanned: false, stats: {}, startedAt: now.toISOString() };
  const accF = [];
  const accG = [];
  const repF = [];
  const repG = [];
  const M = {
    branch: matchers(iocs, "branch"),
    pr: matchers(iocs, "pr_title"),
    commit: matchers(iocs, "commit_message"),
    file: matchers(iocs, "file"),
    workflow: matchers(iocs, "workflow_file"),
    content: matchers(iocs, "string", "ip", "domain", "url"),
    cache: matchers(iocs, "cache_key_prefix"),
    artifact: matchers(iocs, "artifact_prefix"),
    actor: matchers(iocs, "actor")
  };
  const me = await gh.api("user");
  if (!me.ok || !me.data) {
    const why = me.status === 0 ? me.error ?? "gh failed" : `HTTP ${me.status}`;
    const gap = { what: "the whole GitHub surface", why, fix: "gh auth login" };
    return {
      account: { result: accountRes, findings: [], gaps: [{ surface: "github:account", ...gap }] },
      repos: { result: reposRes, findings: [], gaps: [{ surface: "github:repos", ...gap }] },
      hitRepos: []
    };
  }
  const login = me.data.login;
  accountRes.scanned = true;
  reposRes.scanned = true;
  const scopeOf = (actor) => actor ? actor.toLowerCase() === login.toLowerCase() ? "own" : "other" : void 0;
  const scopes = await gh.scopes();
  if (scopes && !scopes.includes("repo"))
    accG.push({
      surface: "github:account",
      what: "private repositories",
      why: `token scopes are ${scopes.join(", ") || "none"}`,
      fix: "gh auth refresh -s repo"
    });
  accG.push({
    surface: "github:account",
    what: "the account security log (sign-ins, token creation, OAuth grants)",
    why: "GitHub exposes it to the web UI, not to a personal token",
    fix: "open https://github.com/settings/security-log and https://github.com/settings/applications"
  });
  if (M.pr.length) {
    const q = encodeURIComponent(`author:${login} type:pr created:>=${sinceDay}`);
    const prs = await gh.paged(`search/issues?q=${q}`, { pick: (b) => b.items ?? [], maxPages: 10 });
    accountRes.stats.prsSearched = prs.data?.length ?? 0;
    if (!prs.ok) accG.push({ surface: "github:account", what: "pull requests you opened", why: prs.error ?? `HTTP ${prs.status}` });
    if (prs.truncated) accG.push({ surface: "github:account", what: "pull requests past the first 1,000", why: "search caps at 1,000 results" });
    for (const pr of prs.data ?? []) {
      const m = firstMatch(M.pr, pr.title);
      if (!m) continue;
      const repo = String(pr.repository_url ?? "").replace("https://api.github.com/repos/", "");
      accF.push(
        hit(m, {
          surface: "github:account",
          subject: repo,
          title: `Your account opened PR "${pr.title}" in ${repo}`,
          actor: login,
          scope: "own",
          at: pr.created_at,
          evidence: { kind: "url", ref: pr.html_url, excerpt: `state=${pr.state}` }
        })
      );
    }
  }
  if (M.commit.length) {
    const q = encodeURIComponent(`author:${login} author-date:>=${sinceDay}`);
    const commits = await gh.paged(`search/commits?q=${q}`, { pick: (b) => b.items ?? [], maxPages: 10 });
    accountRes.stats.commitsSearched = commits.data?.length ?? 0;
    if (!commits.ok) accG.push({ surface: "github:account", what: "commits you authored", why: commits.error ?? `HTTP ${commits.status}` });
    if (commits.truncated)
      accG.push({
        surface: "github:account",
        what: "commits you authored past the first 1,000",
        why: "search caps at 1,000 results; per-repository commits are still read below"
      });
    for (const c of commits.data ?? []) {
      const msg = firstLine(c.commit?.message);
      const m = firstMatch(M.commit, msg);
      if (!m) continue;
      const repo = c.repository?.full_name ?? "?";
      accF.push(
        hit(m, {
          surface: "github:account",
          subject: repo,
          title: `Your account authored commit "${msg}" in ${repo}`,
          actor: login,
          scope: "own",
          at: c.commit?.author?.date,
          evidence: { kind: "url", ref: c.html_url }
        })
      );
    }
  }
  if (M.branch.length) {
    const events = await gh.paged(`users/${login}/events`, { maxPages: 3 });
    accountRes.stats.events = events.data?.length ?? 0;
    for (const e of events.data ?? []) {
      if (e.created_at < since) continue;
      const ref = String(e.payload?.ref ?? "").replace(/^refs\/heads\//, "");
      if (!ref || e.type !== "CreateEvent" && e.type !== "PushEvent") continue;
      const m = firstMatch(M.branch, ref);
      if (!m) continue;
      accF.push(
        hit(m, {
          surface: "github:account",
          subject: e.repo?.name ?? "?",
          title: `Your account ${e.type === "CreateEvent" ? "created" : "pushed to"} branch ${ref} in ${e.repo?.name}`,
          actor: login,
          scope: "own",
          at: e.created_at,
          evidence: { kind: "api", ref: `users/${login}/events`, excerpt: `${e.type} ${ref}` }
        })
      );
    }
  }
  for (const [path, label] of [
    ["user/keys", "SSH key"],
    ["user/gpg_keys", "GPG key"]
  ]) {
    const keys = await gh.api(path);
    if (!keys.ok) {
      accG.push({ surface: "github:account", what: `${label}s`, why: keys.error ?? `HTTP ${keys.status}` });
      continue;
    }
    accountRes.stats[path === "user/keys" ? "sshKeys" : "gpgKeys"] = keys.data?.length ?? 0;
    for (const k of keys.data ?? []) {
      if (!k.created_at || k.created_at < since) continue;
      accF.push({
        surface: "github:account",
        severity: "suspicious",
        subject: login,
        title: `${label} "${k.title ?? k.key_id}" was added during the campaign window`,
        at: k.created_at,
        evidence: { kind: "api", ref: path, excerpt: `id=${k.id} created_at=${k.created_at}` },
        key: `github:account|${path}|${k.id}`
      });
    }
  }
  accountRes.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  let repos;
  if (opts.repos?.length) {
    const got = await mapPool(opts.repos, 8, (r) => gh.api(`repos/${r}`));
    repos = got.filter((g) => g.ok && g.data).map((g) => g.data);
    for (const [i, g] of got.entries()) if (!g.ok) repG.push({ surface: "github:repos", what: opts.repos[i], why: g.error ?? `HTTP ${g.status}` });
  } else {
    const list = await gh.paged("user/repos?affiliation=owner,collaborator,organization_member", { maxPages: 50 });
    if (!list.ok) repG.push({ surface: "github:repos", what: "the list of your repositories", why: list.error ?? `HTTP ${list.status}` });
    repos = (list.data ?? []).filter((r) => r.permissions?.push && !r.archived);
  }
  if (opts.maxRepos && repos.length > opts.maxRepos) {
    repG.push({ surface: "github:repos", what: `${repos.length - opts.maxRepos} repositories past --max-repos`, why: "capped by the caller" });
    repos = repos.slice(0, opts.maxRepos);
  }
  reposRes.stats.repos = repos.length;
  let inactive = 0;
  let noAdmin = 0;
  const truncated = [];
  await mapPool(repos, opts.concurrency ?? 8, async (repo) => {
    const r = repo.full_name;
    const add2 = (f) => repF.push(f);
    const active2 = !!repo.pushed_at && repo.pushed_at >= since;
    if (M.pr.length || M.branch.length) {
      const prs = await gh.paged(`repos/${r}/pulls?state=all&sort=created&direction=desc`, {
        maxPages: 3,
        stop: (page) => page.some((p) => p.created_at < since)
      });
      for (const pr of prs.data ?? []) {
        if (pr.created_at < since) continue;
        const m = firstMatch(M.pr, pr.title) ?? firstMatch(M.branch, pr.head?.ref);
        if (!m) continue;
        const actor = pr.user?.login;
        add2(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `PR #${pr.number} "${pr.title}" (branch ${pr.head?.ref}) by ${actor}`,
            actor,
            scope: scopeOf(actor),
            at: pr.created_at,
            evidence: { kind: "url", ref: pr.html_url, excerpt: `state=${pr.state}` }
          })
        );
      }
    }
    if (!active2) {
      inactive++;
      return;
    }
    if (M.branch.length) {
      const branches = await gh.paged(`repos/${r}/branches`, { maxPages: 10 });
      for (const b of branches.data ?? []) {
        const m = firstMatch(M.branch, b.name);
        if (m)
          add2(
            hit(m, { surface: "github:repos", subject: r, title: `Branch ${b.name} exists`, evidence: { kind: "api", ref: `repos/${r}/branches/${b.name}` } })
          );
      }
    }
    if (M.commit.length || M.file.length) {
      const commits = await gh.paged(`repos/${r}/commits?since=${since}`, { maxPages: 3 });
      if (commits.truncated) truncated.push(`${r} commits`);
      for (const c of commits.data ?? []) {
        const msg = firstLine(c.commit?.message);
        const m = firstMatch(M.commit, msg);
        if (!m) continue;
        const actor = c.author?.login ?? c.commit?.author?.name;
        let excerpt;
        const detail = await gh.api(`repos/${r}/commits/${c.sha}`);
        if (detail.ok) {
          const files = detail.data?.files ?? [];
          excerpt = files.map((f) => `${f.status} ${f.filename}`).join(", ");
        }
        add2(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Commit ${String(c.sha).slice(0, 8)} "${msg}" on ${repo.default_branch} by ${actor}`,
            actor,
            scope: scopeOf(actor),
            at: c.commit?.author?.date,
            evidence: { kind: "url", ref: c.html_url, excerpt }
          })
        );
      }
    }
    const runs = await gh.paged(`repos/${r}/actions/runs?created=>=${sinceDay}`, { pick: (b) => b.workflow_runs ?? [], maxPages: 3 });
    if (runs.truncated) truncated.push(`${r} workflow runs`);
    const byWorkflow = /* @__PURE__ */ new Map();
    for (const run of runs.data ?? []) {
      const w = byWorkflow.get(run.workflow_id) ?? { numbers: [], name: run.name };
      w.numbers.push(run.run_number);
      byWorkflow.set(run.workflow_id, w);
      const m = firstMatch(M.branch, run.head_branch) ?? firstMatch(M.commit, firstLine(run.display_title)) ?? firstMatch(M.pr, run.display_title);
      if (!m) continue;
      const actor = run.triggering_actor?.login ?? run.actor?.login;
      add2(
        hit(m, {
          surface: "github:repos",
          subject: r,
          title: `Workflow "${run.name}" ran on ${run.head_branch} ("${firstLine(run.display_title)}"), ${run.conclusion ?? run.status}, triggered by ${actor}`,
          actor,
          scope: scopeOf(actor),
          at: run.created_at,
          evidence: { kind: "url", ref: run.html_url }
        })
      );
    }
    for (const [id, w] of byWorkflow) {
      const nums = [...new Set(w.numbers)].sort((a, b) => a - b);
      const missing = [];
      for (let i = 1; i < nums.length; i++) for (let n = nums[i - 1] + 1; n < nums[i]; n++) missing.push(n);
      if (!missing.length || runs.truncated) continue;
      add2({
        surface: "github:repos",
        severity: "suspicious",
        subject: r,
        title: `Workflow "${w.name}" is missing ${missing.length} run(s) in the window (#${missing.slice(0, 5).join(", #")}${missing.length > 5 ? ", ..." : ""}): deleted runs`,
        evidence: { kind: "api", ref: `repos/${r}/actions/workflows/${id}/runs` },
        key: `github:repos|${r}|run-gap|${id}|${missing.join(",")}`
      });
    }
    if (M.cache.length) {
      const caches = await gh.api(`repos/${r}/actions/caches?per_page=100`);
      for (const c of caches.data?.actions_caches ?? []) {
        const m = firstMatch(M.cache, c.key);
        if (m)
          add2(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `Actions cache "${c.key}"`,
              at: c.created_at,
              evidence: { kind: "api", ref: `repos/${r}/actions/caches?key=${c.key}` }
            })
          );
      }
    }
    if (M.artifact.length) {
      const arts = await gh.api(`repos/${r}/actions/artifacts?per_page=100`);
      for (const a of arts.data?.artifacts ?? []) {
        const m = firstMatch(M.artifact, a.name);
        if (m)
          add2(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `Workflow artifact "${a.name}"`,
              at: a.created_at,
              evidence: { kind: "api", ref: `repos/${r}/actions/artifacts/${a.id}` }
            })
          );
      }
    }
    const wf = await gh.api(`repos/${r}/contents/.github/workflows`);
    for (const f of Array.isArray(wf.data) ? wf.data : []) {
      const m = firstMatch(M.workflow, f.path) ?? firstMatch(M.file, f.path);
      if (m)
        add2(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Workflow file ${f.path} on ${repo.default_branch}`,
            evidence: { kind: "url", ref: f.html_url }
          })
        );
    }
    if (M.content.length && Array.isArray(wf.data)) {
      for (const f of wf.data.slice(0, 25)) {
        const body = await gh.api(`repos/${r}/contents/${f.path}`);
        const text = body.data?.content ? Buffer.from(body.data.content, "base64").toString("utf8") : "";
        const lines = text.split("\n");
        for (const m of M.content) {
          const ln = lines.findIndex((l) => m.test(l));
          if (ln < 0) continue;
          add2(
            hit(m, {
              surface: "github:repos",
              subject: r,
              title: `${f.path} contains "${m.indicator.value}"`,
              evidence: { kind: "url", ref: `${f.html_url}#L${ln + 1}`, excerpt: lines[ln]?.trim().slice(0, 200) }
            })
          );
        }
      }
    }
    if (M.file.length || M.content.length) {
      const root = await gh.api(`repos/${r}/contents/`);
      const names = Array.isArray(root.data) ? root.data : [];
      for (const f of names) {
        const m = firstMatch(M.file, f.path);
        if (m)
          add2(hit(m, { surface: "github:repos", subject: r, title: `File ${f.path} on ${repo.default_branch}`, evidence: { kind: "url", ref: f.html_url } }));
      }
      if (names.some((f) => f.name === "package.json")) {
        const pkg = await gh.api(`repos/${r}/contents/package.json`);
        const text = pkg.data?.content ? Buffer.from(pkg.data.content, "base64").toString("utf8") : "";
        try {
          const scripts = JSON.parse(text).scripts ?? {};
          for (const hook of ["preinstall", "install", "postinstall", "prepare"]) {
            const cmd = scripts[hook];
            if (!cmd) continue;
            const m = M.file.find((x) => cmd.split(/[\s;&|]+/).some((tok) => x.test(tok))) ?? firstMatch(M.content, cmd);
            if (m)
              add2(
                hit(m, {
                  surface: "github:repos",
                  subject: r,
                  title: `package.json "${hook}" runs "${cmd}"`,
                  evidence: { kind: "url", ref: pkg.data.html_url, excerpt: cmd }
                })
              );
          }
        } catch {
        }
      }
    }
    if (repo.permissions?.admin) {
      for (const [path, label] of [
        ["hooks", "Webhook"],
        ["keys", "Deploy key"]
      ]) {
        const items = await gh.api(`repos/${r}/${path}`);
        for (const it of items.data ?? []) {
          if (!it.created_at || it.created_at < since) continue;
          add2({
            surface: "github:repos",
            severity: "suspicious",
            subject: r,
            title: `${label} added in the window: ${label === "Webhook" ? it.config?.url : it.title}`,
            at: it.created_at,
            evidence: { kind: "api", ref: `repos/${r}/${path}/${it.id}` },
            key: `github:repos|${r}|${path}|${it.id}`
          });
        }
      }
    } else noAdmin++;
  });
  for (const f of repF) {
    const m = f.actor ? firstMatch(M.actor, f.actor) : void 0;
    if (m && !f.title.includes("(named compromised")) f.title += ` (named compromised by ${m.indicator.source})`;
  }
  reposRes.stats.inactiveSkipped = inactive;
  reposRes.stats.apiCalls = gh.calls;
  if (inactive)
    repG.push({
      surface: "github:repos",
      what: `${inactive} repositories with no push since ${sinceDay}`,
      why: "only their pull requests were checked: branches, runs and files cannot have changed without a push"
    });
  if (noAdmin)
    repG.push({ surface: "github:repos", what: `webhooks and deploy keys of ${noAdmin} repositories`, why: "they need admin rights on the repository" });
  if (truncated.length) repG.push({ surface: "github:repos", what: truncated.join("; "), why: "more than 300 items in the window: the oldest were not read" });
  repG.push({
    surface: "github:repos",
    what: "branches other than the default branch, for commits and files",
    why: "commits and files are read on the default branch; attacker branches are caught by name, runs and PRs"
  });
  reposRes.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  const hitRepos = [...new Set(repF.filter((f) => f.severity === "compromised").map((f) => f.subject))].sort();
  return {
    login,
    account: { result: accountRes, findings: accF, gaps: accG },
    repos: { result: reposRes, findings: repF, gaps: repG },
    hitRepos
  };
}

// src/scan/host.ts
import { createHash as createHash2 } from "crypto";
import { existsSync as existsSync8, readdirSync as readdirSync4, readFileSync as readFileSync11, statSync as statSync7 } from "fs";
import { homedir as homedir3, platform } from "os";
import { basename as basename4, join as join5 } from "path";
var MAX_HASH_BYTES = 50 * 1024 * 1024;
function sha256File(p) {
  try {
    if (statSync7(p).size > MAX_HASH_BYTES) return void 0;
    return createHash2("sha256").update(readFileSync11(p)).digest("hex");
  } catch {
    return void 0;
  }
}
function readText(p, max = 2 * 1024 * 1024) {
  try {
    if (statSync7(p).size > max) return void 0;
    return readFileSync11(p, "utf8");
  } catch {
    return void 0;
  }
}
function hitOf(m, f) {
  return {
    surface: "host",
    severity: "compromised",
    ...f,
    campaign: m.campaign.id,
    source: m.indicator.source,
    indicator: { type: m.indicator.type, value: m.indicator.value },
    key: `host|${f.subject}|${m.indicator.type}:${m.indicator.value}`
  };
}
function startupDirs(home, os) {
  if (os === "darwin") return [join5(home, "Library/LaunchAgents"), "/Library/LaunchAgents", "/Library/LaunchDaemons"];
  return [join5(home, ".config/systemd/user"), join5(home, ".config/autostart"), "/etc/systemd/system", "/etc/cron.d", "/etc/xdg/autostart"];
}
async function scanHost(iocs, tree, runner2, opts = {}) {
  const home = opts.home ?? homedir3();
  const os = opts.platform ?? platform();
  const since = windowStart(iocs);
  const sinceMs = Date.parse(since);
  const result = { surface: "host", scanned: true, stats: {}, startedAt: (opts.now ?? /* @__PURE__ */ new Date()).toISOString() };
  const findings = [];
  const gaps = [];
  const M = {
    file: matchers(iocs, "file", "workflow_file"),
    hash: matchers(iocs, "sha256"),
    content: matchers(iocs, "string", "ip", "domain", "url", "cron_tag"),
    net: matchers(iocs, "ip", "domain"),
    process: matchers(iocs, "process"),
    pkg: matchers(iocs, "package").filter((m) => (m.indicator.ecosystem ?? "").toLowerCase().startsWith("vs") || m.indicator.ecosystem === "openvsx")
  };
  const hashes = new Map(M.hash.map((m) => [m.indicator.value.toLowerCase(), m]));
  result.stats.files = tree.files.length;
  for (const p of tree.files) {
    const m = M.file.find((x) => x.test(p));
    if (!m) continue;
    const digest = sha256File(p);
    const hashHit = digest ? hashes.get(digest) : void 0;
    findings.push(
      hitOf(hashHit ?? m, {
        subject: p,
        title: `File ${p} matches ${hashHit ? "the sha256" : `"${m.indicator.value}"`}`,
        evidence: { kind: "file", ref: p, excerpt: digest ? `sha256=${digest}` : void 0 }
      })
    );
  }
  if (tree.capped)
    gaps.push({
      surface: "host",
      what: `files past the first ${tree.entries} entries`,
      why: "the walk is capped",
      fix: "re-run with --roots narrowed to your code folders"
    });
  if (tree.unreadable)
    gaps.push({
      surface: "host",
      what: `${tree.unreadable} unreadable directories`,
      why: "permission denied (macOS privacy protection or another user's files)"
    });
  if (hashes.size) gaps.push({ surface: "host", what: "sha256 of every file", why: "only files named like an IOC and startup items are hashed" });
  for (const dir of tree.vscodeDirs) {
    const p = join5(dir, "tasks.json");
    const text = existsSync8(p) ? readText(p) : void 0;
    if (!text || !/"runOn"\s*:\s*"folderOpen"/.test(text)) continue;
    const line = text.split("\n").findIndex((l) => /folderOpen/.test(l)) + 1;
    const cmd = /"command"\s*:\s*"([^"]+)"/.exec(text)?.[1];
    const m = M.content.find((x) => x.test(text));
    if (m)
      findings.push(
        hitOf(m, {
          subject: p,
          title: `VS Code task in ${p} runs on folder open and contains "${m.indicator.value}"`,
          evidence: { kind: "file", ref: `${p}:${line}`, excerpt: cmd }
        })
      );
    else
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: p,
        title: `VS Code task runs automatically when the folder opens${cmd ? `: ${cmd}` : ""}`,
        evidence: { kind: "file", ref: `${p}:${line}`, excerpt: cmd },
        key: `host|${p}|folderOpen`
      });
  }
  result.stats.vscodeDirs = tree.vscodeDirs.length;
  let startupCount = 0;
  for (const dir of opts.startupDirs ?? startupDirs(home, os)) {
    let names = [];
    try {
      names = readdirSync4(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const p = join5(dir, name);
      let st;
      try {
        st = statSync7(p);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      startupCount++;
      const text = readText(p) ?? "";
      const m = M.content.find((x) => x.test(text)) ?? (hashes.size ? hashes.get(sha256File(p) ?? "") : void 0);
      const program = /<key>Program(?:Arguments)?<\/key>\s*<(?:array>\s*<)?string>([^<]+)/.exec(text)?.[1] ?? /^ExecStart=(.*)$/m.exec(text)?.[1] ?? /^Exec=(.*)$/m.exec(text)?.[1];
      if (m)
        findings.push(
          hitOf(m, {
            subject: p,
            title: `Startup item ${p} contains "${m.indicator.value}"`,
            at: st.mtime.toISOString(),
            evidence: { kind: "file", ref: p, excerpt: program }
          })
        );
      else if (st.mtimeMs >= sinceMs)
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `Startup item ${basename4(p)} was written during the campaign window${program ? ` (runs ${program})` : ""}`,
          at: st.mtime.toISOString(),
          evidence: { kind: "file", ref: p, excerpt: program },
          key: `host|${p}|startup-mtime`
        });
    }
  }
  result.stats.startupItems = startupCount;
  const traces = [".zsh_history", ".bash_history", ".local/share/fish/fish_history", ".python_history"].map((f) => join5(home, f));
  traces.push("/etc/hosts");
  for (const p of traces) {
    const text = existsSync8(p) ? readText(p, 20 * 1024 * 1024) : void 0;
    if (!text) continue;
    const lines = text.split("\n");
    for (const m of M.content) {
      const ln = lines.findIndex((l) => m.test(l));
      if (ln < 0) continue;
      findings.push(
        hitOf(m, {
          subject: p,
          severity: p === "/etc/hosts" ? "compromised" : "exposed",
          title: `${p} line ${ln + 1} mentions "${m.indicator.value}"`,
          evidence: {
            kind: "file",
            ref: `${p}:${ln + 1}`,
            excerpt: (lines[ln] ?? "").replace(/^: \d+:\d+;/, "").trim().slice(0, 200)
          }
        })
      );
    }
  }
  let extensions = 0;
  for (const dir of [".vscode/extensions", ".vscode-insiders/extensions", ".cursor/extensions", ".windsurf/extensions", ".vscode-oss/extensions"].map(
    (d) => join5(home, d)
  )) {
    let names = [];
    try {
      names = readdirSync4(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const mm = /^(.+?)-(\d+\.\d+\.\d+.*)$/.exec(name);
      if (!mm) continue;
      extensions++;
      const [, id, version] = mm;
      const m = M.pkg.find(
        (x) => x.indicator.value.toLowerCase() === id.toLowerCase() && (!x.indicator.versions?.length || x.indicator.versions.includes(version))
      );
      if (m)
        findings.push(
          hitOf(m, { subject: join5(dir, name), title: `Editor extension ${id}@${version} is installed`, evidence: { kind: "file", ref: join5(dir, name) } })
        );
    }
  }
  result.stats.extensions = extensions;
  if (opts.hitRepos?.length) {
    const wanted = new Set(opts.hitRepos.map((r) => r.toLowerCase()));
    for (const dir of tree.gitDirs) {
      const cfg = readText(join5(dir, ".git/config")) ?? "";
      const urls = [...cfg.matchAll(/url\s*=\s*(\S+)/g)].map((x) => x[1] ?? "");
      const repo = urls.map((u) => /github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/.exec(u)?.[1]?.toLowerCase()).find((r) => r && wanted.has(r));
      if (!repo) continue;
      let fetched;
      try {
        fetched = statSync7(join5(dir, ".git/FETCH_HEAD")).mtime.toISOString();
      } catch {
      }
      findings.push({
        surface: "host",
        severity: "exposed",
        subject: dir,
        title: `Local clone of ${repo}, a repository the GitHub scan found hit${fetched ? ` (last fetch ${fetched})` : ""}`,
        at: fetched,
        evidence: { kind: "file", ref: join5(dir, ".git/config") },
        key: `host|${dir}|clone|${repo}`
      });
    }
  }
  result.stats.clones = tree.gitDirs.length;
  if (!opts.skipLive) {
    const cron = await runner2("crontab", ["-l"], { timeoutMs: 1e4 });
    if (cron.ok) {
      const lines = cron.stdout.split("\n");
      for (const m of M.content) {
        const ln = lines.findIndex((l) => m.test(l));
        if (ln >= 0)
          findings.push(
            hitOf(m, {
              subject: "crontab",
              title: `crontab line ${ln + 1} contains "${m.indicator.value}"`,
              evidence: { kind: "command", ref: "crontab -l", excerpt: lines[ln]?.slice(0, 200) }
            })
          );
      }
    }
    const net = os === "darwin" ? await runner2("lsof", ["-nPi"], { timeoutMs: 2e4 }) : await runner2("ss", ["-tunap"], { timeoutMs: 2e4 });
    if (net.ok) {
      const lines = net.stdout.split("\n");
      result.stats.connections = lines.length;
      for (const m of M.net) {
        const line = lines.find((l) => m.test(l));
        if (line)
          findings.push(
            hitOf(m, {
              subject: "network",
              title: `Open connection to ${m.indicator.value}`,
              evidence: { kind: "command", ref: os === "darwin" ? "lsof -nPi" : "ss -tunap", excerpt: line.trim().slice(0, 200) }
            })
          );
      }
      if (M.net.some((m) => m.indicator.type === "domain"))
        gaps.push({ surface: "host", what: "connections to IOC domains", why: "open sockets show addresses, not names; only IOC IPs are matched live" });
    } else
      gaps.push({
        surface: "host",
        what: "open network connections",
        why: net.missing ? "lsof/ss is not installed" : net.stderr.trim().split("\n")[0] ?? "the command failed"
      });
    if (M.process.length) {
      const ps = await runner2("ps", ["-axo", "pid=,command="], { timeoutMs: 1e4 });
      for (const m of M.process) {
        const line = ps.stdout.split("\n").find((l) => m.test(l) && !l.includes("ultraguard"));
        if (line)
          findings.push(
            hitOf(m, {
              subject: "process",
              title: `Running process matches "${m.indicator.value}"`,
              evidence: { kind: "command", ref: "ps -axo pid=,command=", excerpt: line.trim().slice(0, 200) }
            })
          );
      }
    }
  } else gaps.push({ surface: "host", what: "crontab, open connections and processes", why: "live checks were skipped" });
  gaps.push({
    surface: "host",
    what: "files outside the scanned roots and deeper than the walk depth",
    why: "the walk is bounded",
    fix: "pass --roots and --depth to widen it"
  });
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return { result, findings, gaps };
}

// src/scan/walk.ts
import { lstatSync, readdirSync as readdirSync6 } from "fs";
import { join as join6 } from "path";
var PRUNE = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "Library",
  ".Trash",
  ".cache",
  ".npm",
  ".pnpm-store",
  ".yarn",
  ".cargo",
  ".rustup",
  ".gradle",
  ".m2",
  ".venv",
  "venv",
  "__pycache__",
  ".next",
  "dist",
  "build",
  "target",
  ".docker",
  ".local",
  "Pictures",
  "Movies",
  "Music",
  "Photos Library.photoslibrary"
]);
function walk(roots, opts = {}) {
  const maxDepth = opts.maxDepth ?? 6;
  const maxEntries = opts.maxEntries ?? 4e5;
  const out2 = { files: [], gitDirs: [], vscodeDirs: [], entries: 0, capped: false, unreadable: 0 };
  const stack = roots.map((dir) => ({ dir, depth: 0 }));
  while (stack.length) {
    const { dir, depth } = stack.pop();
    let names;
    try {
      names = readdirSync6(dir);
    } catch {
      out2.unreadable++;
      continue;
    }
    for (const name of names) {
      if (++out2.entries > maxEntries) {
        out2.capped = true;
        return out2;
      }
      const p = join6(dir, name);
      if (name === ".git") {
        out2.gitDirs.push(dir);
        continue;
      }
      if (name === ".vscode") out2.vscodeDirs.push(p);
      let st;
      try {
        st = lstatSync(p);
      } catch {
        out2.unreadable++;
        continue;
      }
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (PRUNE.has(name) || depth + 1 > maxDepth) continue;
        stack.push({ dir: p, depth: depth + 1 });
      } else if (st.isFile()) out2.files.push(p);
    }
  }
  return out2;
}

// src/version.ts
var VERSION = "1.0.0";

// src/watch.ts
import { mkdirSync as mkdirSync5 } from "fs";
import { homedir as homedir4 } from "os";
import { join as join7 } from "path";
var EXIT_ALERT = 10;
var EXIT_INCOMPLETE = 20;
function stateDir(flag) {
  return flag ?? env("HOME") ?? join7(homedir4(), ".ultraguard");
}
function loadState(dir) {
  mkdirSync5(dir, { recursive: true });
  const store = new Run(dir);
  return { store, state: store.read("state.json", { handled: [], campaigns: [], alerted: [] }) };
}
async function watchPlan(dir, run, hits, opts = {}) {
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const { state } = loadState(dir);
  const done = new Set(state.handled.map((h) => safeCanonical(h.url)));
  const fresh = hits.filter((h) => !done.has(safeCanonical(h.url)));
  const days = opts.resweepDays ?? 7;
  const resweep = state.campaigns.length > 0 && (!state.lastFullSweep || now.getTime() - Date.parse(state.lastFullSweep) >= days * 864e5);
  if (fresh.length) await intel(run, fresh, opts.fetcher, now);
  if (resweep) {
    const carried = [];
    for (const c of state.campaigns) {
      const ids = c.sources.map((s) => {
        const known = c.sourceUrls?.[s];
        return known ? run.addSource({ url: known, title: c.title, fetchedAt: now.toISOString(), origin: "manual" }).id : s;
      });
      const remap = Object.fromEntries(c.sources.map((s, i) => [s, ids[i]]));
      carried.push({ ...c, sources: ids, indicators: c.indicators.map((ind) => ({ ...ind, source: remap[ind.source] ?? ind.source })) });
    }
    run.write("iocs.carried.json", { campaigns: carried });
  }
  const result = {
    newSources: fresh.length,
    skipped: hits.length - fresh.length,
    resweep,
    since: state.lastSweep,
    nothingNew: fresh.length === 0 && !resweep
  };
  run.write("watch.json", result);
  return result;
}
async function watchCommit(dir, run, opts = {}) {
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const { store, state } = loadState(dir);
  const plan = run.read("watch.json", void 0);
  const sources = run.sources();
  const urlOf = Object.fromEntries(sources.map((s) => [s.id, s.url]));
  const byId = new Map(state.campaigns.map((c) => [c.id, c]));
  for (const c of run.iocs()?.campaigns ?? []) byId.set(c.id, { ...c, sourceUrls: Object.fromEntries(c.sources.map((s) => [s, urlOf[s] ?? ""])) });
  const handled = new Map(state.handled.map((h) => [safeCanonical(h.url), h]));
  for (const s of sources) if (s.origin === "web" && !s.error) handled.set(safeCanonical(s.url), { url: s.url, at: now.toISOString() });
  const findings = run.findings();
  const alerted = new Set(state.alerted);
  const newFindings = findings.filter((f) => (f.severity === "compromised" || f.severity === "exposed") && !alerted.has(f.key));
  for (const f of newFindings) alerted.add(f.key);
  const vs = verdicts(findings, run.gaps(), run.surfaces());
  const incomplete = vs.some((v) => v.verdict === "UNKNOWN");
  const alert = newFindings.length > 0;
  const next = {
    handled: [...handled.values()],
    campaigns: [...byId.values()],
    alerted: [...alerted],
    lastSweep: now.toISOString(),
    lastFullSweep: plan?.resweep || !state.lastFullSweep ? now.toISOString() : state.lastFullSweep
  };
  store.write("state.json", next);
  const lines = alert ? newFindings.map(
    (f) => `ALERT: ${f.campaign ?? (f.surface === "deps" ? "malicious package" : "no campaign")} \u2192 ${f.surface} ${f.severity.toUpperCase()}: ${f.title} [${f.id}]`
  ) : [`NOTHING NEW: ${vs.map((v) => `${v.surface}=${v.verdict}`).join(", ")}`];
  lines.push(`report: ${run.path("REPORT.md")}`);
  const result = { alert, incomplete, newFindings, exitCode: alert ? EXIT_ALERT : incomplete ? EXIT_INCOMPLETE : 0, summary: lines.join("\n") };
  if (alert && opts.notifyIssue && opts.runner) {
    const res = await opts.runner(
      "gh",
      [
        "issue",
        "create",
        "-R",
        opts.notifyIssue,
        "--title",
        `ultraguard: ${newFindings.length} new finding(s) on ${now.toISOString().slice(0, 10)}`,
        "--body-file",
        run.path("REPORT.md")
      ],
      { timeoutMs: 6e4 }
    );
    result.notified = res.ok ? res.stdout.trim() : `failed: ${res.stderr.trim()}`;
  }
  return result;
}

// src/cli.ts
var HELP = `ultraguard v${VERSION} (webindex ${ENGINE_VERSION})
An AI antivirus for an agent: the agent finds attack news on the web, turns
each article into indicators of compromise (IOCs) that cite it, and ultraguard
sweeps your GitHub account and the repositories you can push to, this machine,
your lockfiles and your cloud for them. Read-only: it changes nothing.

USAGE
  ultraguard doctor [--probe] [--json]
  ultraguard intel [<url>...] [--web-results <file.json>] --out <run>
  ultraguard ioc set --file <iocs.json> --out <run>
  ultraguard ioc show --out <run> [--json]
  ultraguard scan github|host|deps|cloud --out <run> [scan flags]
  ultraguard sweep --out <run> [--surfaces <list>] [scan flags]
  ultraguard report --out <run> [--json]
  ultraguard check <answer.md> --out <run> [--json]
  ultraguard watch plan [--web-results <file.json>] --out <run> [--state <dir>] [--resweep-days <n>]
  ultraguard watch commit --out <run> [--state <dir>] [--notify-issue <owner/repo>]

THE LOOP
  1. You search the web for attacks; save the hits as JSON.
  2. intel        fetch each page once: sources [S1], [S2]... and iocs.todo.json
  3. ioc set      validate your IOC file: every indicator cites a fetched [S#]
  4. sweep        run every scan: findings [F1], [F2]... and coverage gaps
  5. report       REPORT.md (verdict per surface) and REMEDIATION.md
  6. check        your answer cites only real [S#]/[F#] and hides no verdict

SCAN FLAGS
  --repos <a/b,c/d>     github: only these repositories
  --max-repos <n>       github: stop after n repositories
  --concurrency <n>     github: parallel repositories (default 8)
  --roots <dir,dir>     host, deps: where to walk (default: your home directory)
  --depth <n>           host, deps: walk depth (default 6)
  --skip-live           host: skip crontab, open connections and processes
  --no-osv              deps: skip the OSV malicious-package advisories
  --surfaces <list>     sweep: github,host,deps,cloud (default: all)

ROUTINE (watch)
  watch plan drops sources already handled in --state (default ~/.ultraguard,
  or ULTRAGUARD_HOME), fetches the new ones, and re-arms every known campaign
  each --resweep-days (default 7). Fill iocs.json, sweep, report, then
  watch commit: it alerts only on findings never alerted before.
  Exit codes: 0 nothing new, 10 alert, 20 a surface could not be scanned.
  --notify-issue opens a GitHub issue on alert. Off unless you pass it.

VERDICTS (per surface)
  COMPROMISED an IOC matched   EXPOSED in the blast radius   REVIEW changed in
  the window, judge it   CLEAN no IOC matched   UNKNOWN not scanned

  --out <dir>   the run directory shared by every command
  --json        machine-readable output
  --help, --version
`;
var COMMANDS = ["doctor", "intel", "ioc", "scan", "sweep", "report", "check", "watch"];
var VALUE_FLAGS = [
  "out",
  "web-results",
  "file",
  "repos",
  "max-repos",
  "concurrency",
  "roots",
  "depth",
  "surfaces",
  "state",
  "resweep-days",
  "notify-issue"
];
var BOOL_FLAGS = ["json", "probe", "skip-live", "no-osv"];
var SCAN = ["out", "repos", "max-repos", "concurrency", "roots", "depth", "skip-live", "no-osv", "json"];
var SPEC = {
  commands: COMMANDS,
  valueFlags: VALUE_FLAGS,
  boolFlags: BOOL_FLAGS,
  commandFlags: {
    doctor: ["probe", "json"],
    intel: ["out", "web-results", "json"],
    ioc: ["out", "file", "json"],
    scan: SCAN,
    sweep: [...SCAN, "surfaces"],
    report: ["out", "json"],
    check: ["out", "json"],
    watch: ["out", "web-results", "state", "resweep-days", "notify-issue", "json"]
  }
};
var runner = defaultRunner;
function setRunner(r) {
  runner = r;
}
function out(text) {
  process.stdout.write(text.endsWith("\n") ? text : `${text}
`);
}
function needRun(a) {
  const dir = argValue(a, "out");
  if (!dir) throw new UsageError(`${a.command} needs --out <run>: one directory per investigation, shared by every command`);
  return new Run(dir);
}
function needIocs(run) {
  const iocs = run.iocs();
  if (!iocs) throw new UsageError(`no iocs.json in ${run.dir}: run \`ultraguard ioc set --file <iocs.json> --out ${run.dir}\` first`);
  return iocs;
}
function walkFor(a) {
  const roots = argList(a, "roots").map((r) => resolve2(r.replace(/^~(?=$|\/)/, homedir5())));
  return walk(roots.length ? roots : [homedir5()], { maxDepth: argInt(a, "depth", { min: 1, max: 20 }) ?? 6 });
}
async function runScan(surface, a, run, iocs, tree) {
  if (surface === "github") {
    const r2 = await scanGithub(iocs, runner, {
      repos: argList(a, "repos"),
      maxRepos: argInt(a, "max-repos", { min: 1 }),
      concurrency: argInt(a, "concurrency", { min: 1, max: 32 })
    });
    const accF = run.recordSurface(r2.account.result, r2.account.findings, r2.account.gaps);
    const repF = run.recordSurface(r2.repos.result, r2.repos.findings, r2.repos.gaps);
    run.setMeta({ login: r2.login, hitRepos: r2.hitRepos });
    return `github: ${r2.repos.result.stats.repos ?? 0} repositories as ${r2.login ?? "?"}; ${accF.length} account finding(s), ${repF.length} repository finding(s)`;
  }
  if (surface === "host") {
    const r2 = await scanHost(iocs, (tree ?? (() => walkFor(a)))(), runner, { hitRepos: run.meta().hitRepos, skipLive: argBool(a, "skip-live") });
    const f2 = run.recordSurface(r2.result, r2.findings, r2.gaps);
    return `host: ${r2.result.stats.files ?? 0} files, ${r2.result.stats.startupItems ?? 0} startup items; ${f2.length} finding(s)`;
  }
  if (surface === "deps") {
    const r2 = await scanDeps(iocs, (tree ?? (() => walkFor(a)))(), run, { osv: argBool(a, "no-osv") ? false : void 0 });
    const f2 = run.recordSurface(r2.result, r2.findings, r2.gaps);
    return `deps: ${r2.result.stats.lockfiles ?? 0} lockfiles, ${r2.result.stats.packages ?? 0} packages; ${f2.length} finding(s)`;
  }
  const r = await scanCloud(iocs, runner);
  const f = run.recordSurface(r.result, r.findings, r.gaps);
  return `cloud: ${r.result.scanned ? "scanned" : "no logged-in CLI"}; ${f.length} finding(s)`;
}
var SURFACE_OF = { github: ["github:account", "github:repos"], host: ["host"], deps: ["deps"], cloud: ["cloud"] };
async function dispatch(a) {
  const json2 = argBool(a, "json");
  switch (a.command) {
    case "doctor": {
      const lines = await doctor(runner, { probe: argBool(a, "probe") });
      out(json2 ? jsonLine(lines) : formatDoctor(lines));
      return lines.find((l) => l.check === "gh" && !l.ok) ? EXIT_FAILURE : EXIT_OK;
    }
    case "intel": {
      const run = needRun(a);
      const hits = a.positional.map((url) => ({ url }));
      const file = argValue(a, "web-results");
      if (file) hits.push(...readWebResultsFile(file));
      if (!hits.length) throw new UsageError("intel needs at least one <url> or --web-results <file.json>");
      const sources = await intel(run, hits);
      if (json2) out(jsonLine(sources));
      else {
        for (const s of sources)
          out(`[${s.id}] ${s.error ? `FAILED (${s.error})` : "ok"}  ${s.title ?? ""} <${s.url}>${s.file ? `
     text: ${run.path(s.file)}` : ""}`);
        out(
          `
Next: read each source, fill ${run.path(run.iocs() ? "iocs.json" : "iocs.todo.json")}, then \`ultraguard ioc set --file <it> --out ${run.dir}\`.`
        );
      }
      return sources.some((s) => !s.error) ? EXIT_OK : EXIT_FAILURE;
    }
    case "ioc": {
      const run = needRun(a);
      const sub = a.positional[0];
      if (sub === "show") {
        const iocs2 = needIocs(run);
        out(
          json2 ? jsonLine(iocs2) : iocs2.campaigns.map((c) => `${c.id}: ${c.title} (since ${c.since}, ${c.indicators.length} indicators) ${c.sources.map((s) => `[${s}]`).join("")}`).join("\n")
        );
        return EXIT_OK;
      }
      if (sub !== "set") throw new UsageError("ioc takes `set --file <iocs.json>` or `show`");
      const file = argValue(a, "file");
      const own = file ? JSON.parse(readFileSync12(file, "utf8")).campaigns : [];
      const carried = run.read("iocs.carried.json", { campaigns: [] }).campaigns;
      if (!file && !carried.length) throw new UsageError("ioc set needs --file <iocs.json>");
      const merged = [...own, ...carried.filter((c) => !own.some((o) => o.id === c.id))];
      const { iocs, problems } = validateIocs({ campaigns: merged }, run.sources());
      if (!iocs) {
        out(json2 ? jsonLine(problems) : `iocs refused: ${problems.length} problem(s)
${problems.map((p) => `  ${p.path}: ${p.message}`).join("\n")}`);
        return EXIT_FAILURE;
      }
      run.write("iocs.json", iocs);
      const n = iocs.campaigns.reduce((s, c) => s + c.indicators.length, 0);
      out(
        json2 ? jsonLine({ campaigns: iocs.campaigns.length, indicators: n }) : `iocs set: ${iocs.campaigns.length} campaign(s), ${n} indicator(s)${carried.length ? ` (${carried.length} carried from the watch state)` : ""}`
      );
      return EXIT_OK;
    }
    case "scan": {
      const surface = a.positional[0];
      if (surface !== "github" && surface !== "host" && surface !== "deps" && surface !== "cloud")
        throw new UsageError("scan takes github, host, deps or cloud");
      const run = needRun(a);
      out(await runScan(surface, a, run, needIocs(run)));
      return EXIT_OK;
    }
    case "sweep": {
      const run = needRun(a);
      const iocs = needIocs(run);
      const wanted = argList(a, "surfaces");
      for (const w of wanted) if (!SURFACE_OF[w]) throw new UsageError(`--surfaces takes github,host,deps,cloud, not "${w}"`);
      const list = wanted.length ? wanted : ["github", "host", "deps", "cloud"];
      let tree;
      const shared = () => tree ??= walkFor(a);
      for (const s of list) out(await runScan(s, a, run, iocs, shared));
      const { verdicts: vs } = writeReport(run);
      out(`
${vs.map((v) => `${v.surface.padEnd(15)} ${v.verdict}`).join("\n")}

report: ${run.path("REPORT.md")}`);
      return EXIT_OK;
    }
    case "report": {
      const run = needRun(a);
      const r = writeReport(run);
      out(
        json2 ? jsonLine(r.verdicts) : `${r.verdicts.map((v) => `${v.surface.padEnd(15)} ${v.verdict}  ${v.why}`).join("\n")}

${run.path("REPORT.md")}
${run.path("REMEDIATION.md")}`
      );
      return EXIT_OK;
    }
    case "check": {
      const file = a.positional[0];
      if (!file) throw new UsageError("check needs the answer file: ultraguard check <answer.md> --out <run>");
      const run = needRun(a);
      const problems = checkAnswer(run, readFileSync12(file, "utf8"));
      if (json2) out(jsonLine({ ok: problems.length === 0, problems }));
      else
        out(
          problems.length ? `check FAILED: ${problems.length} problem(s)
${problems.map((p) => `  ${p.line ? `line ${p.line}: ` : ""}[${p.rule}] ${p.message}`).join("\n")}` : "check passed"
        );
      return problems.length ? EXIT_FAILURE : EXIT_OK;
    }
    case "watch": {
      const sub = a.positional[0];
      const run = needRun(a);
      const dir = stateDir(argValue(a, "state"));
      if (sub === "plan") {
        const file = argValue(a, "web-results");
        const hits = file ? readWebResultsFile(file) : [];
        const r2 = await watchPlan(dir, run, hits, { resweepDays: argInt(a, "resweep-days", { min: 1, max: 365 }) });
        if (json2) out(jsonLine(r2));
        else if (r2.nothingNew) out(`NOTHING NEW: ${r2.skipped} source(s) already handled${r2.since ? ` (last sweep ${r2.since})` : ""}; no re-sweep due`);
        else
          out(
            `${r2.newSources} new source(s), ${r2.skipped} already handled${r2.resweep ? "; re-sweep of every known campaign is due (iocs.carried.json)" : ""}.
Next: fill the IOCs, ioc set, sweep, report, then watch commit.`
          );
        return EXIT_OK;
      }
      if (sub !== "commit") throw new UsageError("watch takes `plan` or `commit`");
      writeReport(run);
      const r = await watchCommit(dir, run, { notifyIssue: argValue(a, "notify-issue"), runner });
      out(json2 ? jsonLine({ ...r, newFindings: r.newFindings.map((f) => f.id) }) : `${r.summary}${r.notified ? `
issue: ${r.notified}` : ""}`);
      return r.exitCode;
    }
  }
  throw new UsageError(`unknown command "${a.command}"`);
}
function writeReport(run) {
  const r = renderReport(run);
  run.writeText("REPORT.md", r.report);
  run.writeText("REMEDIATION.md", r.remediation);
  run.write("verdicts.json", r.verdicts);
  return r;
}
async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv, SPEC);
  } catch (e) {
    process.stderr.write(`ultraguard: ${e.message}
Run \`ultraguard --help\`.
`);
    return EXIT_USAGE;
  }
  if (parsed.kind === "help") {
    out(HELP);
    return EXIT_OK;
  }
  if (parsed.kind === "version") {
    out(VERSION);
    return EXIT_OK;
  }
  try {
    return await dispatch(parsed);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`ultraguard: ${e.message}
`);
      return EXIT_USAGE;
    }
    process.stderr.write(`ultraguard: ${e.message}
`);
    return EXIT_FAILURE;
  }
}
function isStartedFile() {
  try {
    return !!process.argv[1] && pathToFileURL(realpathSync2(process.argv[1])).href === import.meta.url;
  } catch {
    return false;
  }
}
if (isInvokedDirectly() || isStartedFile()) {
  for (const stream of [process.stdout, process.stderr]) {
    stream.on("error", (e) => {
      if (e.code === "EPIPE") process.exit(EXIT_OK);
      throw e;
    });
  }
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      process.stderr.write(`ultraguard: ${e.message}
`);
      process.exitCode = EXIT_FAILURE;
    }
  );
}
export {
  BOOL_FLAGS,
  COMMANDS,
  HELP,
  SURFACES,
  VALUE_FLAGS,
  main,
  setRunner
};
