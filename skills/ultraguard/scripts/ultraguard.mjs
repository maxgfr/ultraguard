#!/usr/bin/env node

// src/cli.ts
import { readFileSync as readFileSync15, realpathSync as realpathSync2 } from "fs";
import { homedir as homedir5 } from "os";
import { resolve as resolve4 } from "path";
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
function countOption(value, def) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : def;
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
function spentSlackMs(budgetMs) {
  return budgetMs === void 0 ? 0 : Math.min(25, budgetMs / 4);
}
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
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
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
function parseTag(tag) {
  const parts = (tag || "en").trim().replace(/[.@].*$/, "").split(/[-_]/);
  const lang = (parts[0] || "en").toLowerCase();
  let i = 1;
  const script = /^[a-z]{4}$/i.test(parts[i] ?? "") ? parts[i++].toLowerCase() : void 0;
  const region = /^(?:[a-z]{2}|\d{3})$/i.test(parts[i] ?? "") ? parts[i].toLowerCase() : void 0;
  return { lang, script, region };
}
function baseLang3(lang) {
  return parseTag(lang).lang;
}
function resolveRegion(lang, region) {
  if (region?.trim()) return region.trim().toLowerCase();
  const t = parseTag(lang);
  if (t.region) return t.region;
  const byScript = t.script ? SCRIPT_COUNTRY[`${t.lang}-${t.script}`] : void 0;
  return byScript ?? LANG_COUNTRY[t.lang] ?? t.lang;
}
function ddgRegion(lang, region) {
  const r = resolveRegion(lang, region);
  if (r === NO_REGION) return "wt-wt";
  const l = baseLang3(lang);
  return DDG_KL[`${l}-${r}`] ?? DDG_KL[l] ?? `${REGION_ALIASES[r] ?? r}-${DDG_LANG_ALIASES[l] ?? l}`;
}
function searxngLanguage(lang, region) {
  if (!lang?.trim()) return void 0;
  const t = parseTag(lang);
  if (!/^[a-z]{2,3}$/.test(t.lang)) return void 0;
  const country = region?.trim() ? region.trim().toLowerCase() : t.region ?? (t.script ? SCRIPT_COUNTRY[`${t.lang}-${t.script}`] : void 0);
  return country && /^[a-z]{2}$/.test(country) && country !== NO_REGION ? `${t.lang}-${country.toUpperCase()}` : t.lang;
}
function acceptLanguageHeader(lang, region) {
  const l = baseLang3(lang);
  const r = resolveRegion(lang, region);
  if (r === NO_REGION) return l === "en" ? "en" : `${l},en;q=0.5`;
  const R = r.toUpperCase();
  if (l === "en") return `${l}-${R},${l};q=0.9`;
  return `${l}-${R},${l};q=0.9,en;q=0.5`;
}
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
function serverReason(data) {
  const raw = typeof data === "string" ? data : typeof data?.error === "string" ? data.error : "";
  const line = cleanInline(raw).slice(0, 200);
  return line || void 0;
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
function mapSearchResponse(json2) {
  if (!json2 || typeof json2 !== "object") return [];
  if (json2.success === false) return [];
  const data = json2.data;
  const web = Array.isArray(data) ? data : Array.isArray(data?.web) ? data.web : Array.isArray(data?.results) ? data.results : [];
  const out2 = [];
  for (const x of web) {
    if (!x || typeof x.url !== "string" || !x.url) continue;
    out2.push({
      url: x.url,
      // `||` (not `??`): an empty title degrades to the URL, never blank.
      title: cleanInline(String(x.title || x.url)),
      description: cleanInline(String(x.description ?? x.snippet ?? "")).slice(0, 360),
      ...typeof x.markdown === "string" && x.markdown.trim() ? { markdown: x.markdown } : {}
    });
  }
  return out2;
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
async function searchViaFirecrawl(query, limit, opts = {}) {
  const base2 = firecrawlBase(opts);
  if (!base2) return { why: `Firecrawl disabled (--firecrawl off / ${envName("FIRECRAWL")}=off). Skipping.` };
  if (!await probeFirecrawl(base2, firecrawlIsExplicit(opts))) {
    return { why: `Firecrawl not reachable at ${base2} (bring it up with \`${brand().cli} firecrawl up\`). Skipping.`, status: 0 };
  }
  const n = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.trunc(limit))) : 10;
  const locale = {};
  if (opts.lang || opts.region) {
    if (opts.lang) locale.lang = baseLang3(opts.lang);
    const country = resolveRegion(opts.lang, opts.region);
    if (/^[a-z]{2}$/.test(country) && country !== "wt") locale.country = country;
  }
  const timeoutMs = Math.max(1, Math.round(Math.min(SEARCH_TIMEOUT_MS, opts.budgetMs ?? SEARCH_TIMEOUT_MS)));
  const r = await postJson(
    base2,
    "/search",
    // `sources` is v2's; v1's strict schema rejects any key it does not know.
    // `timeout` tells Firecrawl to stop just before we do: its own default is
    // 60 s, double the time this client waits.
    (prefix) => ({
      query,
      limit: n,
      ...locale,
      timeout: Math.max(1e3, timeoutMs - SERVER_MARGIN_MS.search),
      ...prefix === "/v2" ? { sources: ["web"] } : {}
    }),
    // No retry: this is the cascade's last rung, and a second attempt at an
    // instance that just failed or throttled us doubles the wait for nothing.
    { timeoutMs, retries: 0 }
  );
  if (!r.ok) {
    const budgetRanOut = r.timedOut === true && timeoutMs < SEARCH_TIMEOUT_MS;
    if (!r.status && !budgetRanOut) markFirecrawlDown(base2);
    const reason = serverReason(r.data);
    const why = r.status === 429 || r.status === 503 ? `rate-limited (HTTP ${r.status})` : !r.status ? `unreachable (${r.error ?? "no response"})` : (
      // It answered: a 4xx is this request refused (a bad field, a key a
      // Cloud base wants), which "unreachable" misreported as an outage.
      `${r.status < 500 ? "rejected the request" : "failed"} (HTTP ${r.status}${reason ? `: ${reason}` : ""})`
    );
    return { why: `Firecrawl search ${why} at ${base2}.`, status: r.status };
  }
  if (r.data?.success === false) {
    return { why: `Firecrawl search failed at ${base2}${serverReason(r.data) ? `: ${serverReason(r.data)}` : ""}.`, status: r.status };
  }
  return { hits: mapSearchResponse(r.data) };
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
function pageDelayMs() {
  return envInt("PAGE_DELAY_MS", 350, 0, 5e3);
}
function sleep(ms, signal) {
  return signal ? sleepUnlessAborted(ms, signal) : new Promise((r) => setTimeout(r, ms));
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
var KEYLESS_ENGINES = ["ddg", "ddglite", "mojeek"];
function isKeylessEngine(v) {
  return KEYLESS_ENGINES.includes(v);
}
function keylessEngines(opts = {}) {
  if (opts.engines) return opts.engines;
  const raw = env("ENGINES");
  if (raw === void 0) return KEYLESS_ENGINES;
  if (raw.toLowerCase() === "off") return [];
  return engineNames(raw).filter(isKeylessEngine);
}
function unknownEngines(opts = {}) {
  const raw = opts.engines ? void 0 : env("ENGINES");
  if (raw === void 0 || raw.toLowerCase() === "off") return [];
  return engineNames(raw).filter((s) => !isKeylessEngine(s));
}
function engineNames(raw) {
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}
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
function throttleReason(status, error) {
  if (status === 429 || status === 503) return { throttled: true, why: `rate-limited (HTTP ${status})` };
  if (status === 403) return { throttled: true, why: "blocked this client as automated traffic (HTTP 403)" };
  if (status === 0) return { throttled: false, why: `unreachable (${error || "no response"})` };
  return { throttled: false, why: `unreachable (status ${status})` };
}
function looksLikeChallenge(body) {
  if (body.length > 4e4) return false;
  const head = body.slice(0, 4e3).toLowerCase();
  return /<title>[^<]*captcha/.test(head) || head.includes("anomaly-modal") || head.includes("/anomaly.js") || head.includes("captcha-wrap") || head.includes("sending automated queries");
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
async function searchViaKeyless(engine, query, opts = {}) {
  const spec = SPECS[engine];
  const q = query.trim();
  if (!q) return { hits: [], note: "Empty query." };
  const pages = countOption(opts.pages, 1);
  const limit = countOption(opts.limit, 10);
  const localised = !!(opts.lang || opts.region);
  const kl = localised ? ddgRegion(opts.lang, opts.region) : "wt-wt";
  const acceptLanguage = acceptLanguageHeader(opts.lang, opts.region);
  const locale = localised ? { lang: baseLang3(opts.lang), region: resolveRegion(opts.lang, opts.region).toUpperCase() } : void 0;
  const seen = /* @__PURE__ */ new Set();
  const hits = [];
  const deadline = opts.budgetMs === void 0 ? Number.POSITIVE_INFINITY : Date.now() + opts.budgetMs;
  let url = spec.url(q, 0, kl, locale);
  for (let p = 0; p < pages && hits.length < limit; p++) {
    if (opts.signal?.aborted || Date.now() >= deadline - spentSlackMs(opts.budgetMs)) {
      if (p > 0) break;
      return { hits: [], note: `${spec.label} was not asked: ${opts.signal?.aborted ? "the search was cancelled" : "no time was left"}.`, stopped: true };
    }
    const r = await httpGet(url, {
      accept: "text/html",
      acceptLanguage,
      timeoutMs: Math.max(1, Math.min(opts.timeoutMs ?? 12e3, deadline - Date.now())),
      retries: 0,
      signal: opts.signal
    });
    if (!r.ok || !r.body.trim()) {
      if (p > 0) break;
      if (!r.status && r.error === "cancelled") return { hits: [], note: `${spec.label} did not get to answer: the search was cancelled.`, stopped: true };
      if (r.ok) return { hits: [], note: `${spec.label} returned an empty page (HTTP ${r.status}).`, status: r.status };
      const { throttled, why } = throttleReason(r.status, r.error);
      return { hits: [], note: `${spec.label} ${why}.`, throttled, ...r.status === 403 ? { blocked: true } : {}, status: r.status };
    }
    const before = hits.length;
    const parsed = spec.parse(r.body, limit * 2);
    if (parsed.length === 0 && looksLikeChallenge(r.body)) {
      if (p > 0) break;
      return {
        hits: [],
        note: `${spec.label} served an anti-bot challenge (HTTP ${r.status}) instead of results \u2014 blocked, not empty.`,
        throttled: true,
        blocked: true,
        status: r.status
      };
    }
    for (const f of parsed) {
      const key = canonicalizeUrl(f.url);
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(f);
      if (hits.length >= limit) break;
    }
    if (hits.length === before || p + 1 >= pages || hits.length >= limit) break;
    const next = spec.next ? spec.next(r.body, q, kl, p) : spec.url(q, p + 1, kl, locale);
    if (!next) break;
    url = next;
    const pause = pageDelayMs();
    if (opts.signal?.aborted || Date.now() + pause >= deadline - spentSlackMs(opts.budgetMs)) break;
    if (pause) await sleep(pause, opts.signal);
  }
  return hits.length ? { hits, answered: true } : { hits: [], note: `${spec.label} returned no results.`, answered: true };
}
init_brand();
init_fetch();
init_firecrawl();
init_locale();
init_trim();
init_url();
init_shared();
var SEARXNG_DEFAULT_BASE = "http://localhost:8888";
var PROBE_TIMEOUT_MS4 = 2e3;
var PROBE_BODY_BYTES2 = 4096;
var QUERY_TIMEOUT_MS = 8e3;
function searxngBase(opts = {}) {
  const raw = (opts.searxng ?? env("SEARXNG") ?? SEARXNG_DEFAULT_BASE).trim();
  if (!raw || raw.toLowerCase() === "off") return null;
  return trimTrailing(raw, "/");
}
function searxngIsExplicit(opts = {}) {
  return !!(opts.searxng ?? env("SEARXNG"));
}
var probeCache2 = new ProbeMemo();
function probeSearxng(base2, explicit = false) {
  return probeCache2.get(`${base2}|${explicit}`, async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS4);
    try {
      const res = await fetch(`${base2}/healthz`, { signal: ctrl.signal });
      const body = await readCappedBytes(res, PROBE_BODY_BYTES2).then(
        (b) => b.toString("utf8"),
        () => ""
      );
      return explicit || res.ok && /^\s*ok\s*$/i.test(body);
    } catch {
      return false;
    } finally {
      clearTimeout(t);
    }
  });
}
async function searchViaSearxng(query, opts = {}) {
  const base2 = searxngBase(opts);
  if (!base2) return rungResult("searxng", "disabled", [], [`SearXNG disabled (--searxng off / ${envName("SEARXNG")}=off).`]);
  const deadline = budgetDeadline(opts);
  if (!await probeSearxng(base2, searxngIsExplicit(opts))) {
    return rungResult(
      "searxng",
      "unreachable",
      [],
      [
        searxngIsExplicit(opts) ? `SearXNG not reachable at ${base2}.` : `SearXNG not running at ${base2} \u2014 start it with \`${brand().cli} searxng up\` for local, keyless discovery.`
      ]
    );
  }
  const pages = countOption(opts.pages, 1);
  const limit = countOption(opts.limit, 10);
  const acceptLanguage = acceptLanguageHeader(opts.lang, opts.region);
  const language = searxngLanguage(opts.lang, opts.region);
  const root = `${base2}/search?q=${encodeURIComponent(query)}&format=json&safesearch=1` + (language ? `&language=${encodeURIComponent(language)}` : "");
  const notes = [];
  const seen = /* @__PURE__ */ new Set();
  const hits = [];
  const suspended = /* @__PURE__ */ new Map();
  let failed2;
  for (let p = 0; p < pages && hits.length < limit; p++) {
    const stop = halted(opts, deadline);
    if (stop) {
      if (p > 0) break;
      return rungResult("searxng", "not-tried", [], [`SearXNG was not asked: ${stop === "cancelled" ? "the search was cancelled" : "no time was left"}.`]);
    }
    const r = await httpGet(root + (p > 0 ? `&pageno=${p + 1}` : ""), {
      accept: "application/json",
      acceptLanguage,
      timeoutMs: Math.max(1, Math.min(QUERY_TIMEOUT_MS, deadline - Date.now())),
      // No retry: the cascade's next rung is the retry.
      retries: 0,
      signal: opts.signal
    });
    if (!r.ok) {
      if (p === 0 && !r.status && r.error === "cancelled") {
        return rungResult("searxng", "not-tried", [], ["SearXNG did not get to answer: the search was cancelled."]);
      }
      if (p === 0) {
        failed2 = r.status === 429 || r.status === 503 ? "throttled" : r.status === 0 ? "unreachable" : "error";
        notes.push(
          failed2 === "throttled" ? `SearXNG rate-limited (HTTP ${r.status}).` : failed2 === "unreachable" ? `SearXNG unreachable (${r.error || "no response"}).` : (
            // SearXNG answers a format it does not serve with flask.abort(403),
            // and the probe has just shown the instance is up: this is the
            // most common misconfiguration, not an outage.
            r.status === 403 ? "SearXNG refused format=json (HTTP 403) \u2014 add `json` to `search.formats` in its settings.yml." : `SearXNG failed the query (HTTP ${r.status}).`
          )
        );
      }
      break;
    }
    let data;
    try {
      data = JSON.parse(r.body);
    } catch {
      if (p === 0) {
        failed2 = "error";
        notes.push("SearXNG returned a non-JSON body \u2014 is `format: json` enabled on that instance?");
      }
      break;
    }
    for (const e of data.unresponsive_engines ?? []) {
      const pair = Array.isArray(e) ? e : [];
      if (typeof pair[0] === "string") suspended.set(pair[0], typeof pair[1] === "string" ? pair[1] : "unavailable");
    }
    const before = hits.length;
    for (const raw of data.results ?? []) {
      const it = raw;
      if (typeof it.url !== "string") continue;
      const key = canonicalizeUrl(it.url);
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        url: it.url,
        title: typeof it.title === "string" && it.title.trim() ? it.title.trim() : it.url,
        snippet: typeof it.content === "string" ? it.content.trim() : "",
        via: "searxng"
      });
      if (hits.length >= limit) break;
    }
    if (hits.length === before) break;
    if (p < pages - 1) {
      const pause = pageDelayMs();
      if (opts.signal?.aborted || Date.now() + pause >= deadline - spentSlackMs(opts.timeoutMs)) break;
      if (pause) await sleep(pause, opts.signal);
    }
  }
  if (suspended.size) {
    notes.push(`SearXNG upstreams throttled: ${[...suspended].map(([e, why]) => `${e} (${why})`).join(", ")} \u2014 fewer results than usual, not an empty web.`);
  }
  if (!hits.length && !notes.length) notes.push("SearXNG returned no results.");
  const outcome = hits.length ? "hits" : failed2 ?? (suspended.size ? "throttled" : "empty");
  return rungResult("searxng", outcome, hits, notes);
}
function budgetDeadline(opts) {
  return opts.timeoutMs !== void 0 && opts.timeoutMs > 0 ? Date.now() + opts.timeoutMs : Number.POSITIVE_INFINITY;
}
function halted(opts, deadline) {
  if (opts.signal?.aborted) return "cancelled";
  return Date.now() >= deadline - spentSlackMs(opts.timeoutMs) ? "out of time" : void 0;
}
function rungResult(rung, outcome, hits, notes) {
  return { hits, notes, rungs: [report(rung, outcome, hits.length, notes.join(" "))], searched: answered2(outcome) };
}
function report(rung, outcome, hits = 0, note) {
  return { rung, outcome, ...hits ? { hits } : {}, ...note ? { note } : {} };
}
var answered2 = (outcome) => outcome === "hits" || outcome === "empty";
function keylessOutcome(r) {
  if (r.hits.length) return "hits";
  if (r.stopped) return "not-tried";
  if (r.answered) return "empty";
  if (r.blocked) return "blocked";
  if (r.throttled) return "throttled";
  return r.status ? "error" : "unreachable";
}
async function search(query, opts = {}) {
  const q = query.trim();
  if (!q) return { hits: [], notes: ["Empty query."] };
  const deadline = budgetDeadline(opts);
  const left = () => deadline === Number.POSITIVE_INFINITY ? void 0 : Math.max(1, deadline - Date.now());
  const keyless = keylessEngines(opts);
  const order = ["searxng", ...keyless, "firecrawl"];
  const untried = (rung) => report(rung, rung === "searxng" && !searxngBase(opts) || rung === "firecrawl" && !firecrawlBase(opts) ? "disabled" : "not-tried");
  const notes = [];
  const unknown = unknownEngines(opts);
  if (unknown.length) {
    notes.push(`${envName("ENGINES")} names no engine this knows: ${unknown.join(", ")} (expected ${KEYLESS_ENGINES.join(", ")}) \u2014 ignored.`);
  }
  const rungs = [];
  let hits = [];
  for (let i = 0; i < order.length; i++) {
    const rung = order[i];
    if (hits.length) {
      rungs.push(untried(rung));
      continue;
    }
    const stop = halted(opts, deadline);
    if (stop) {
      const rest = order.slice(i).map(untried);
      const skipped = rest.filter((r) => r.outcome === "not-tried").map((r) => r.rung);
      const why = stop === "cancelled" ? "the search was cancelled" : `the ${opts.timeoutMs} ms budget ran out`;
      if (skipped.length) notes.push(`Stopped before ${skipped.join(", ")}: ${why}.`);
      rungs.push(...rest);
      break;
    }
    if (rung === "searxng") {
      const r = await searchViaSearxng(q, { ...opts, timeoutMs: left() });
      hits = r.hits;
      notes.push(...r.notes);
      rungs.push(...r.rungs ?? []);
    } else if (rung === "firecrawl") {
      const fc = await searchViaFirecrawl(q, limitOf(opts), { firecrawl: opts.firecrawl, lang: opts.lang, region: opts.region, budgetMs: left() });
      hits = firecrawlHits(fc.hits ?? [], limitOf(opts));
      if (fc.why) notes.push(fc.why);
      rungs.push(report("firecrawl", firecrawlOutcome(fc), hits.length, fc.why));
    } else {
      const r = await searchViaKeyless(rung, q, {
        limit: opts.limit,
        pages: opts.pages,
        lang: opts.lang,
        region: opts.region,
        budgetMs: left(),
        signal: opts.signal
      });
      hits = r.hits.map((h) => ({ ...h, via: rung }));
      rungs.push(report(rung, keylessOutcome(r), r.hits.length, r.note));
      if (!r.answered && r.note) notes.push(r.note);
    }
  }
  if (!hits.length) notes.push(closingNote(rungs, opts.signal?.aborted === true));
  return { hits, notes, rungs, searched: rungs.some((r) => answered2(r.outcome)) };
}
var limitOf = (opts) => countOption(opts.limit, 10);
function firecrawlHits(found, limit) {
  const seen = /* @__PURE__ */ new Set();
  const hits = [];
  for (const h of found) {
    const key = canonicalizeUrl(h.url);
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ url: h.url, title: h.title, snippet: h.description, via: "firecrawl" });
    if (hits.length >= limit) break;
  }
  return hits;
}
function firecrawlOutcome(fc) {
  if (fc.hits) return fc.hits.length ? "hits" : "empty";
  if (fc.status === void 0) return "disabled";
  if (fc.status === 0) return "unreachable";
  return fc.status === 429 || fc.status === 503 ? "throttled" : "error";
}
function closingNote(rungs, cancelled) {
  const cli = brand().cli;
  if (rungs.every((r) => r.outcome === "disabled")) {
    return `No search backend was enabled \u2014 SearXNG and Firecrawl are off and no keyless engine is selected, so nothing was searched. Set ${envName("ENGINES")} to a list of ${KEYLESS_ENGINES.join(", ")}, or run \`${cli} stack up\`.`;
  }
  if (rungs.some((r) => answered2(r.outcome))) return `No results from any engine. \`${cli} stack up\` starts SearXNG and Firecrawl locally.`;
  if (cancelled) return "The search was cancelled before any engine answered \u2014 nothing was searched.";
  const keyless = rungs.filter((r) => isKeylessEngine(r.rung));
  if (keyless.length && keyless.every((r) => r.outcome === "blocked")) {
    return `Every keyless engine blocked this client (${keyless.map((r) => r.rung).join(", ")}) \u2014 nothing was searched, which is not the same as nothing being there. Try again later, or run \`${cli} stack up\` for a local SearXNG.`;
  }
  return `No engine answered (${rungs.filter((r) => r.outcome !== "disabled").map((r) => `${r.rung} ${r.outcome}`).join(", ")}) \u2014 nothing was searched, which is not the same as nothing being there. Try again later, or run \`${cli} stack up\` for a local SearXNG.`;
}
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
function stripInlineCode(line) {
  return line.replace(/`[^`\n]*`/g, " ");
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
var CLEAN_WORDS = /\b(clean|safe|unaffected|not (been )?(compromised|hit|affected|touched)|propre|sain|intact|pas (été )?(touché|compromis))\b/i;
var NOTHING_WORDS = /\b(nothing (was |is )?(found|detected|matched)|no (sign|trace|indicator|ioc|finding|match)s?\b.{0,30}\b(found|matched|detected)|rien (n'a été |de )?(trouvé|détecté)|aucune? (trace|ioc|indicateur|signe))/i;
var NEGATED_CLEAN = /\b(not|isn't|aren't|n'est pas|ne sont pas|pas)\s+(\w+\s+)?(clean|safe|propre|sain)\b/i;
var BAD_WORDS = /\b(compromised|exposed|infected|hit|review|unknown|compromis|exposé|touché|à vérifier|inconnu)\b/i;
var ALL_CLEAN = /\b(everything|all (surfaces )?(is |are )?|nothing (was )?(found|hit)|tout est|rien n'a été)\b.{0,20}\b(clean|safe|found|propre|sain|trouvé|touché)\b/i;
function checkAnswer(run, text) {
  const problems = [];
  const known = [...run.sources().map((s) => s.id), ...run.findings().map((f) => f.id)];
  const lines = text.split("\n");
  const lineOf = (needle) => lines.findIndex((l) => l.includes(needle)) + 1 || void 0;
  for (const t of danglingTokens(citationTokensIn(text, isCitation), known))
    problems.push({ rule: "dangling", message: `[${t}] is not a source or finding of this run`, line: lineOf(`[${t}]`) });
  const isKnownF = (t) => /^F\d+$/.test(t) && known.includes(t);
  for (const b of claimBlocks(lines)) {
    if (citationTokensIn(b.text, isKnownF).length > 0) continue;
    for (const sentence of b.own.split(/(?<=[.!?])\s+/)) {
      if (!/\b(compromised|exposed|infected|hit by|touché|compromis|exposé)/i.test(sentence)) continue;
      if (/\b(not|no|never|pas|aucun|aucune|ni)\b[^.]{0,40}\b(compromised|exposed|infected|hit|touché|compromis|exposé)/i.test(sentence)) continue;
      problems.push({ rule: "uncited-claim", message: `claims a compromise without citing a finding [F#]: "${sentence.trim().slice(0, 140)}"`, line: b.line });
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
  const bySubject = /* @__PURE__ */ new Map();
  for (const f of run.findings())
    if (f.severity === "compromised" || f.severity === "exposed") bySubject.set(f.subject, [...bySubject.get(f.subject) ?? [], f.id]);
  for (const [subject, ids] of bySubject) {
    const short = subject.split("/").pop() ?? subject;
    if (text.includes(subject) || short.length >= 4 && text.includes(short) || ids.some((id) => text.includes(`[${id}]`))) continue;
    problems.push({
      rule: "omitted-subject",
      message: `${subject} has ${ids.length} compromised or exposed finding(s) (${ids.slice(0, 3).map((x) => `[${x}]`).join("")}) but the answer never names it`
    });
  }
  const sentences = lines.flatMap((l, i) => l.split(/(?<=[.!?;])\s+/).map((t) => ({ t, line: i + 1 })));
  const anyBad = vs.some((v) => v.verdict !== "CLEAN");
  const bad = (surface, strength) => {
    const v = vs.find((x) => x.surface === surface);
    if (!v || v.verdict === "CLEAN") return void 0;
    if (strength === "nothing" && v.verdict === "REVIEW") return void 0;
    return v;
  };
  for (const { t, line } of sentences) {
    const head = t.split(/\b(?:but|however|except|although|though|mais|sauf|cependant|toutefois|bien que)\b/i)[0] ?? t;
    if (anyBad && ALL_CLEAN.test(head) && !SURFACES.some((x) => NAMES[x].test(head))) {
      problems.push({
        rule: "wrong-clean",
        message: `"${head.trim().slice(0, 80)}" but the verdicts are ${vs.map((v) => `${v.surface}=${v.verdict}`).join(", ")}`,
        line
      });
      continue;
    }
    const clauses = head.split(/,|;|\b(?:and|et|while|whereas|alors que|tandis que)\b/i);
    let pending = [];
    for (const c of clauses) {
      const named = SURFACES.filter((x) => NAMES[x].test(c));
      const strength = NEGATED_CLEAN.test(c) ? void 0 : CLEAN_WORDS.test(c) ? "clean" : NOTHING_WORDS.test(c) ? "nothing" : void 0;
      if (!strength) {
        pending = BAD_WORDS.test(c) ? [] : [...pending, ...named];
        continue;
      }
      for (const surface of /* @__PURE__ */ new Set([...pending, ...named])) {
        const v = bad(surface, strength);
        if (v)
          problems.push({
            rule: "wrong-clean",
            message: `calls ${surface} ${strength === "clean" ? "clean" : "free of findings"} but its verdict is ${v.verdict}`,
            line
          });
      }
      pending = [];
    }
  }
  if (run.gaps().length && !/\b(coverage|gaps?|not (checked|scanned|covered)|couverture|non vérifié|pas vérifié|angles? morts?)\b/i.test(text))
    problems.push({
      rule: "no-coverage",
      message: `the run has ${run.gaps().length} coverage gap(s) and the answer does not mention any: gaps are not absence`
    });
  return problems;
}
var NO_CLAIM_SECTION = /\b(coverage|couverture|sources?|gaps?|angles? morts?|non vérifié|not checked|limites|limits)\b/i;
function claimBlocks(lines) {
  const out2 = [];
  let fence = false;
  let skip = false;
  const indent = (l) => l.length - l.trimStart().length;
  const bullet = /^\s*([-*+]|\d+[.)])\s+/;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*```/.test(l)) {
      fence = !fence;
      continue;
    }
    if (fence || !l.trim()) continue;
    const h = /^#{1,6}\s+(.*)$/.exec(l);
    if (h) {
      skip = NO_CLAIM_SECTION.test(h[1] ?? "");
      continue;
    }
    if (skip) continue;
    if (bullet.test(l)) {
      const own = [l.replace(bullet, "")];
      const all = [...own];
      const base2 = indent(l);
      let j2 = i + 1;
      for (; j2 < lines.length; j2++) {
        const n = lines[j2];
        if (!n.trim()) break;
        if (indent(n) <= base2 && (bullet.test(n) || /^#/.test(n))) break;
        all.push(n.trim());
        if (!bullet.test(n)) own.push(n.trim());
        else break;
      }
      for (let k = j2; k < lines.length; k++) {
        const n = lines[k];
        if (!n.trim() || indent(n) <= base2) break;
        all.push(n.trim());
      }
      out2.push({ line: i + 1, own: own.join(" "), text: all.join(" ") });
      continue;
    }
    const para = [l.trim()];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() && !bullet.test(lines[j]) && !/^#/.test(lines[j]))
      para.push(lines[j++].trim());
    out2.push({ line: i + 1, own: para.join(" "), text: para.join(" ") });
    i = j - 1;
  }
  return out2;
}

// src/rules.ts
import { createHash as createHash2 } from "crypto";
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readdirSync as readdirSync4, readFileSync as readFileSync6, renameSync as renameSync2, rmSync as rmSync3, statSync as statSync6 } from "fs";
import { join } from "path";
var RULE_SETS = ["core", "extended", "full"];
var RELEASES = "https://api.github.com/repos/YARAHQ/yara-forge/releases/latest";
var defaultRulesDeps = {
  latest: async () => {
    const res = await httpJson("GET", RELEASES, void 0, { timeoutMs: 3e4, accept: "application/vnd.github+json" });
    if (!res.ok) throw new Error(`GitHub releases API: ${res.error ?? `HTTP ${res.status}`}`);
    const r = res.data;
    return {
      tag: String(r?.tag_name ?? ""),
      published: r?.published_at,
      assets: (r?.assets ?? []).map((a) => ({ name: String(a.name), url: String(a.browser_download_url) }))
    };
  },
  download: async (url) => {
    const res = await httpGet(url, { binary: true, maxBytes: 64 * 1024 * 1024, timeoutMs: 12e4, retries: 2 });
    if (!res.ok || !res.bytes) throw new Error(`download failed: HTTP ${res.status}${res.error ? ` (${res.error})` : ""}`);
    return res.bytes;
  }
};
function rulesDir(state) {
  return join(state, "rules");
}
function installedRules(state) {
  const p = join(rulesDir(state), "yara-forge.json");
  if (!existsSync4(p)) return void 0;
  try {
    const meta = JSON.parse(readFileSync6(p, "utf8"));
    return existsSync4(meta.source) ? meta : void 0;
  } catch {
    return void 0;
  }
}
function findYar(dir) {
  for (const name of readdirSync4(dir)) {
    const p = join(dir, name);
    if (statSync6(p).isDirectory()) {
      const inner = findYar(p);
      if (inner) return inner;
    } else if (/\.yara?$/i.test(name)) return p;
  }
  return void 0;
}
async function updateRules(state, set, runner2, deps = defaultRulesDeps, now = /* @__PURE__ */ new Date()) {
  const rel = await deps.latest();
  const asset = rel.assets.find((a) => a.name === `yara-forge-rules-${set}.zip`);
  if (!asset) throw new Error(`YARA-Forge release ${rel.tag || "?"} has no ${set} rule set`);
  const bytes = await deps.download(asset.url);
  const dir = rulesDir(state);
  mkdirSync2(dir, { recursive: true });
  const work = join(dir, `.unpack-${process.pid}`);
  rmSync3(work, { recursive: true, force: true });
  mkdirSync2(work, { recursive: true });
  try {
    const zip = join(work, "rules.zip");
    writeFileAtomic(zip, bytes);
    const unzip = await runner2("unzip", ["-o", "-q", zip, "-d", work], { timeoutMs: 12e4 });
    if (!unzip.ok) throw new Error(unzip.missing ? "unzip is not installed" : `unzip failed: ${unzip.stderr.trim().split("\n")[0]}`);
    const yar = findYar(work);
    if (!yar) throw new Error("the archive holds no .yar file");
    const text = readFileSync6(yar, "utf8");
    const rules = (text.match(/^\s*(private\s+|global\s+)*rule\s+\w+/gm) ?? []).length;
    if (rules === 0) throw new Error("the rule file holds no rule");
    const source2 = join(dir, `yara-forge-${set}.yar`);
    renameSync2(yar, source2);
    let compiled;
    const target = join(dir, `yara-forge-${set}.yarc`);
    const yc = await runner2("yarac", ["--no-warnings", source2, target], { timeoutMs: 3e5 });
    if (yc.ok && existsSync4(target)) compiled = target;
    else rmSync3(target, { force: true });
    const meta = {
      name: "yara-forge",
      set,
      tag: rel.tag,
      published: rel.published,
      url: `https://github.com/YARAHQ/yara-forge/releases/tag/${rel.tag}`,
      sha256: createHash2("sha256").update(bytes).digest("hex"),
      rules,
      source: source2,
      compiled,
      fetchedAt: now.toISOString()
    };
    writeFileAtomic(join(dir, "yara-forge.json"), `${JSON.stringify(meta, null, 2)}
`);
    return meta;
  } finally {
    rmSync3(work, { recursive: true, force: true });
  }
}
function rulesAgeDays(meta, now = /* @__PURE__ */ new Date()) {
  const t = Date.parse(meta.published ?? meta.fetchedAt);
  return Number.isNaN(t) ? 0 : Math.floor((now.getTime() - t) / 864e5);
}

// src/scan/antivirus.ts
import { readdirSync as readdirSync6, statSync as statSync7 } from "fs";
import { join as join5 } from "path";
var MAX_TARGETS = 5e3;
function parseClamVersion(line, now = /* @__PURE__ */ new Date()) {
  const m = /ClamAV\s+([\d.]+)(?:\/(\d+)\/(.+))?/.exec(line.trim());
  if (!m) return void 0;
  const built = m[3] ? /* @__PURE__ */ new Date(`${m[3]} UTC`) : void 0;
  const ok = built && !Number.isNaN(built.getTime());
  return {
    version: m[1],
    signatures: ok ? built.toISOString() : void 0,
    ageDays: ok ? Math.floor((now.getTime() - built.getTime()) / 864e5) : void 0
  };
}
async function detectAv(runner2, now = /* @__PURE__ */ new Date()) {
  const ping = await runner2("clamdscan", ["--ping", "1"], { timeoutMs: 5e3 });
  const name = ping.ok ? "clamdscan" : "clamscan";
  const v = await runner2(name, ["--version"], { timeoutMs: 15e3 });
  if (!v.ok) return void 0;
  const parsed = parseClamVersion(v.stdout, now);
  return parsed ? { name, ...parsed } : void 0;
}
function recentFiles(dir, sinceMs, cap, depth = 3) {
  const out2 = [];
  const walk2 = (d, left) => {
    let names = [];
    try {
      names = readdirSync6(d);
    } catch {
      return;
    }
    for (const n of names) {
      if (out2.length >= cap) return;
      const p = join5(d, n);
      try {
        const st = statSync7(p);
        if (st.isDirectory()) {
          if (left > 0 && n !== "node_modules" && n !== ".git") walk2(p, left - 1);
        } else if (st.isFile() && st.mtimeMs >= sinceMs) out2.push(p);
      } catch {
      }
    }
  };
  walk2(dir, depth);
  return out2;
}
function avTargets(home, inventory, flagged2, sinceMs) {
  const set = /* @__PURE__ */ new Set();
  const add2 = (p) => {
    if (p?.startsWith("/") && set.size < MAX_TARGETS) set.add(p);
  };
  for (const s of inventory.startupItems) {
    add2(s.path);
    if (s.exists) add2(s.executable);
  }
  for (const p of flagged2) add2(p);
  for (const e of inventory.recentExtensions) add2(e.path);
  for (const dir of ["/tmp", "/private/tmp", "/var/tmp", "/Users/Shared", "/dev/shm", join5(home, "Downloads")])
    for (const p of recentFiles(dir, sinceMs, 2e3)) add2(p);
  return [...set].filter((p) => {
    try {
      statSync7(p);
      return true;
    } catch {
      return false;
    }
  });
}
function parseClamOutput(stdout) {
  const out2 = [];
  for (const line of stdout.split("\n")) {
    const m = /^(.*): (.+) FOUND$/.exec(line.trim());
    if (m) out2.push({ path: m[1], signature: m[2] });
  }
  return out2;
}
async function antivirusPass(runner2, opts) {
  const findings = [];
  const gaps = [];
  const stats = {};
  const engine = await detectAv(runner2, opts.now);
  if (!engine) {
    gaps.push({
      surface: "host",
      what: "a signature-based antivirus pass (known malware families)",
      why: "ClamAV is not installed",
      fix: "brew install clamav (or apt install clamav), configure freshclam, run freshclam, then re-run scan host"
    });
    return { findings, gaps, stats };
  }
  if (engine.ageDays !== void 0 && engine.ageDays > 7)
    gaps.push({
      surface: "host",
      what: `malware families newer than ${engine.signatures?.slice(0, 10)}`,
      why: `ClamAV's signatures are ${engine.ageDays} days old`,
      fix: "freshclam, then re-run scan host"
    });
  const targets = opts.full ?? avTargets(opts.home, opts.inventory, opts.flagged, opts.sinceMs);
  stats.avTargets = targets.length;
  if (!targets.length) return { findings, gaps, stats, engine };
  const { listed, odd } = splitTargets(targets);
  const list = join5(opts.listDir, "av-targets.txt");
  writeFileAtomic(list, `${listed.join("\n")}
`);
  const args = ["--infected", "--no-summary", `--file-list=${list}`];
  if (engine.name === "clamscan") args.push("--recursive", "--stdout", "--max-filesize=100M", "--max-scansize=400M", "--detect-pua=yes");
  else args.push("--fdpass", "--multiscan");
  args.push(...odd);
  const res = await runner2(engine.name, args, { timeoutMs: opts.full ? 3 * 60 * 6e4 : 20 * 6e4 });
  const hits = parseClamOutput(res.stdout);
  for (const h of hits) {
    const pua = /^PUA\./i.test(h.signature);
    findings.push({
      surface: "host",
      severity: pua ? "suspicious" : "compromised",
      subject: h.path,
      title: `ClamAV detects ${h.signature} in ${h.path}${pua ? " (potentially unwanted program)" : ""}`,
      evidence: {
        kind: "command",
        ref: `${engine.name} --no-summary ${h.path}`,
        excerpt: `${h.signature} (ClamAV ${engine.version}, signatures of ${engine.signatures?.slice(0, 10) ?? "?"})`
      },
      key: `host|av|${h.path}|${h.signature}`
    });
  }
  stats.avDetections = hits.length;
  const errors = res.stderr.split("\n").filter((l) => /ERROR|Can't open|Access denied|Permission denied|Not supported/i.test(l) && !/Warning/i.test(l));
  if (errors.length || !res.ok && res.status !== 1 && !hits.length && !/Warning/i.test(res.stderr))
    gaps.push({
      surface: "host",
      what: `${errors.length || "some"} antivirus target(s)`,
      why: `${engine.name} could not read them: ${(errors[0] ?? res.stderr.trim().split("\n")[0] ?? "").slice(0, 160)}`
    });
  if (res.status !== 0 && res.status !== 1 && res.status !== 2)
    gaps.push({
      surface: "host",
      what: "part of the antivirus pass",
      why: `${engine.name} did not finish (exit ${res.status}): files after the stop were not scanned`,
      fix: "re-run scan host, or narrow --roots"
    });
  if (!opts.full)
    gaps.push({
      surface: "host",
      what: "an antivirus pass over the whole disk",
      why: `the pass is targeted: ${targets.length} files (startup items and their programs, flagged files, recent files in temp and shared folders and Downloads, new extensions)`,
      fix: "scan host --av-full (hours on a large home directory)"
    });
  return { findings, gaps, stats, engine };
}
function yaraRuleFiles(path) {
  try {
    const st = statSync7(path);
    if (st.isFile()) return [path];
    return readdirSync6(path).filter((f) => /\.(yar|yara)$/i.test(f)).sort().slice(0, 500).map((f) => join5(path, f));
  } catch {
    return [];
  }
}
function splitTargets(targets) {
  const listed = [];
  const odd = [];
  for (const t of targets) (/[\r\n]/.test(t) ? odd : listed).push(t);
  return { listed, odd };
}
function parseYaraOutput(stdout) {
  const out2 = [];
  for (const line of stdout.split("\n")) {
    const t = line.trim();
    const meta = /^(\S+)\s+\[(.*)\]\s+(\/.*)$/.exec(t);
    if (meta) {
      const m = meta[2];
      const score = /(?:^|,)score\s*=\s*(\d+)/.exec(m)?.[1];
      const description = /(?:^|,)description\s*=\s*"((?:[^"\\]|\\.)*)"/.exec(m)?.[1];
      out2.push({ rule: meta[1], path: meta[3], score: score ? Number(score) : void 0, description });
      continue;
    }
    const plain2 = /^(\S+)\s+(\/.*)$/.exec(t);
    if (plain2) out2.push({ rule: plain2[1], path: plain2[2] });
  }
  return out2;
}
var COMMUNITY_SCORE = 75;
async function yaraPass(runner2, opts) {
  const findings = [];
  const gaps = [];
  const label = opts.label ?? "YARA";
  const files = opts.compiled ? [opts.rules] : yaraRuleFiles(opts.rules);
  if (!files.length) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: `no .yar or .yara rule file at ${opts.rules}` });
    return { findings, gaps, stats: {} };
  }
  const { listed, odd } = splitTargets(opts.targets);
  const list = join5(opts.listDir, opts.community ? "yara-community-targets.txt" : "yara-targets.txt");
  writeFileAtomic(list, `${listed.join("\n")}
`);
  const base2 = ["--no-warnings", "--print-meta", ...opts.recursive ? ["--recursive"] : [], ...opts.compiled ? ["-C"] : []];
  const timeoutMs = opts.recursive ? 3 * 60 * 6e4 : 30 * 6e4;
  const res = await runner2("yara", [...base2, "--scan-list", ...files, list], { timeoutMs });
  if (res.missing) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: "yara is not installed", fix: "brew install yara (or apt install yara)" });
    return { findings, gaps, stats: {} };
  }
  let stdout = res.stdout;
  let stderr = res.stderr;
  for (const t of odd.slice(0, 50)) {
    const one = await runner2("yara", [...base2, ...files, t], { timeoutMs: 6e4 });
    stdout += `
${one.stdout}`;
    stderr += `
${one.stderr}`;
  }
  const unreadable = stderr.split("\n").filter((l) => /could not open file|can not open file/i.test(l)).length;
  const fatal = stderr.split("\n").find((l) => l.trim() && !/could not open file|can not open file|warning/i.test(l));
  if (!stdout.trim() && fatal && !res.ok) {
    gaps.push({ surface: "host", what: `the ${label} pass`, why: `yara failed: ${fatal.slice(0, 200)}` });
    return { findings, gaps, stats: { yaraRules: files.length } };
  }
  if (unreadable) gaps.push({ surface: "host", what: `${unreadable} ${label} target(s)`, why: "yara could not open them (permissions, or the file vanished)" });
  const ruleSet = new Set(files);
  for (const h of parseYaraOutput(stdout).filter((x) => !ruleSet.has(x.path))) {
    const weak = opts.community && (h.score ?? 0) < COMMUNITY_SCORE;
    findings.push({
      surface: "host",
      severity: weak ? "suspicious" : "compromised",
      subject: h.path,
      title: `${label} rule ${h.rule} matches ${h.path}${h.score !== void 0 ? ` (score ${h.score})` : ""}${h.description ? `: ${h.description.slice(0, 140)}` : ""}`,
      ...opts.source ? { source: opts.source } : {},
      evidence: {
        kind: "command",
        ref: `yara ${opts.compiled ? "-C " : ""}${files.length === 1 ? files[0] : `<${files.length} rule files in ${opts.rules}>`} ${h.path}`
      },
      key: `host|yara|${h.path}|${h.rule}`
    });
  }
  return {
    findings,
    gaps,
    stats: {
      [opts.community ? "communityRules" : "yaraRules"]: files.length,
      yaraTargets: opts.targets.length,
      [opts.community ? "communityMatches" : "yaraMatches"]: findings.length
    }
  };
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
  /** Calls the rate limit refused: every one is something not looked at. */
  rateLimited = 0;
  /**
   * Every failed call except "not found" (no such file or list) and "empty
   * repository": a 403 or a 500 is something not looked at, never a clean answer.
   */
  failures = [];
  /** Lists cut by the page cap: their oldest items were not read. */
  truncated = [];
  async api(path, extra = []) {
    this.calls++;
    const res = await this.run("gh", ["api", ...extra, path], { timeoutMs: this.timeoutMs });
    if (res.missing) return { ok: false, status: 0, error: "gh is not installed" };
    if (!res.ok) {
      if (/rate limit/i.test(res.stderr) || /rate limit/i.test(res.stdout)) this.rateLimited++;
      const m = /HTTP (\d{3})/.exec(res.stderr) ?? /"status":\s*"?(\d{3})/.exec(res.stdout);
      const status = m ? Number(m[1]) : 0;
      const error = (res.stderr || res.stdout).trim().split("\n")[0];
      if (status !== 404 && status !== 409) this.failures.push({ path, status, error });
      return { ok: false, status, error };
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
      const sep3 = path.includes("?") ? "&" : "?";
      const res = await this.api(`${path}${sep3}per_page=100&page=${page}`);
      if (!res.ok) return page === 1 ? { ok: false, status: res.status, error: res.error } : { ok: true, status: 200, data: all, truncated: true };
      const list = opts.pick ? opts.pick(res.data) : res.data;
      all.push(...list);
      if (list.length < 100 || opts.stop?.(list)) return { ok: true, status: 200, data: all };
    }
    this.truncated.push(path);
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
    const need = ["repo", "read:org", "read:public_key", "read:gpg_key"];
    const missing = scopes ? need.filter((s) => !scopes.includes(s) && !scopes.includes(s.replace(/^read:/, "admin:"))) : [];
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
  const av = await detectAv(runner2);
  out2.push({
    check: "clamav",
    ok: !!av && (av.ageDays ?? 0) <= 7,
    detail: av ? `${av.name} ${av.version}, signatures of ${av.signatures?.slice(0, 10) ?? "?"}${av.ageDays !== void 0 ? ` (${av.ageDays} days old)` : ""}` : "not installed (no antivirus pass)",
    fix: !av ? "brew install clamav (or apt install clamav), then freshclam" : (av.ageDays ?? 0) > 7 ? "freshclam" : void 0
  });
  const yara = await runner2("yara", ["--version"], { timeoutMs: 1e4 });
  out2.push({
    check: "yara",
    ok: yara.ok,
    detail: yara.ok ? `yara ${yara.stdout.trim()}` : "not installed (no YARA pass)",
    fix: yara.ok ? void 0 : "brew install yara (or apt install yara)"
  });
  if (opts.state) {
    const meta = installedRules(opts.state);
    const age = meta ? rulesAgeDays(meta) : 0;
    out2.push({
      check: "rules",
      ok: !!meta && age <= 14,
      detail: meta ? `YARA-Forge ${meta.set} ${meta.tag}, ${meta.rules} rules, ${age} days old${meta.compiled ? "" : ", not compiled"}` : "no community YARA rules",
      fix: !meta || age > 14 ? "ultraguard rules update" : void 0
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
      out2.push({
        check: "osv.dev",
        ok: res.ok,
        detail: res.ok ? "reachable" : res.error ?? `HTTP ${res.status}`,
        fix: res.ok ? void 0 : "check the network; scan deps --no-osv works offline"
      });
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
import { mkdirSync as mkdirSync3, readFileSync as readFileSync9 } from "fs";

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
    else if (/^campaign-\d+$/.test(c.id))
      push(`${at}.id`, `"${c.id}" is the template's placeholder: name the campaign (e.g. wfx-loot-2026-11), the routine remembers campaigns by id`);
    else if (ids.has(c.id)) push(`${at}.id`, `duplicate campaign id "${c.id}"`);
    else ids.add(c.id);
    if (!c.title) push(`${at}.title`, "required string");
    if (!c.since || !ISO_DATE.test(c.since) || Number.isNaN(Date.parse(c.since))) push(`${at}.since`, "required ISO date (YYYY-MM-DD or full timestamp)");
    if (c.until && (!ISO_DATE.test(c.until) || Number.isNaN(Date.parse(c.until)))) push(`${at}.until`, "must be an ISO date");
    if (!Array.isArray(c.sources) || c.sources.length === 0) push(`${at}.sources`, "cite at least one [S#]");
    else for (const s of c.sources) if (!usable.has(s)) push(`${at}.sources`, `${s} is not a fetched source of this run`);
    if (!Array.isArray(c.indicators) || c.indicators.length === 0) push(`${at}.indicators`, "at least one indicator");
    else
      c.indicators.forEach((ind, ii) => {
        validateIndicator(ind, `${at}.indicators[${ii}]`, usable, push);
        if (ind?.source && Array.isArray(c.sources) && !c.sources.includes(ind.source))
          push(`${at}.indicators[${ii}].source`, `${ind.source} is not one of this campaign's sources (${c.sources.join(", ")}): add it to "sources"`);
      });
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
  if (ind.weak !== void 0 && typeof ind.weak !== "boolean") push(`${at}.weak`, "true or false");
  if (ind.type === "package" && !ind.ecosystem) push(`${at}.ecosystem`, "required for a package indicator");
  if (ind.type === "sha256" && !/^[a-f0-9]{64}$/i.test(ind.value)) push(`${at}.value`, "a sha256 is 64 hex characters");
  if (ind.type === "ip" && !/^[\d.]+$|^[a-f0-9:]+$/i.test(defang(ind.value))) push(`${at}.value`, "an IPv4 or IPv6 address");
}
function defang(s) {
  return s.replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]|\(dot\)|\{dot\}/gi, ".").replace(/\[:\/\/\]|\[:\]\/\//g, "://").replace(/\[:\]/g, ":").replace(/\[\/\]/g, "/").replace(/\bhxxp(s?)/gi, "http$1");
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
    test = ind.type === "file" || ind.type === "workflow_file" ? (s) => re.test(s) || re.test(s.split("/").pop() ?? s) : (s) => re.test(s);
  } else if (ind.type === "ip") {
    const re = new RegExp(`(?<![\\d.])${escapeRegExp(value)}(?![\\d])`);
    test = (s) => re.test(s);
  } else if (ind.type === "domain") {
    const re = new RegExp(`(?<![a-z0-9-])${escapeRegExp(value)}(?![a-z0-9-])`, "i");
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
function reviewStart(iocs, now = /* @__PURE__ */ new Date(), days = 30) {
  return new Date(Math.max(Date.parse(windowStart(iocs)), now.getTime() - days * 864e5)).toISOString();
}
function inWindow(m, at) {
  if (!at) return true;
  const t = Date.parse(at);
  if (Number.isNaN(t)) return true;
  if (t < Date.parse(m.campaign.since)) return false;
  return !m.campaign.until || t <= Date.parse(m.campaign.until) + 864e5;
}
function packageHit(ind, ecosystem, name, version) {
  if (ind.type !== "package") return false;
  if (normEco(ind.ecosystem ?? "") !== normEco(ecosystem)) return false;
  const norm2 = (n) => normEco(ecosystem) === "pypi" ? n.toLowerCase().replace(/[-_.]+/g, "-") : n.toLowerCase();
  if (norm2(ind.value) !== norm2(name)) return false;
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
  return parseWebResults(JSON.parse(readFileSync9(path, "utf8")));
}
async function intel(run, hits, fetcher = defaultFetcher, now = /* @__PURE__ */ new Date()) {
  mkdirSync3(run.path("sources"), { recursive: true });
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
  return findings.some((f) => f.subject === repo && f.severity === "compromised" && f.ciRun === "attacker");
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
        out2.push(`### ${r}${hitRepo ? ran ? ": the attacker made CI run" : ": probe only, no attacker run seen" : ""}`, "");
        for (const sev of SEV_ORDER) for (const f of own.filter((x) => x.severity === sev)) out2.push(findingLine(f));
        out2.push("");
      }
      continue;
    }
    const risky = (f) => /^Risky |not Apple's|downloads and runs|reverse shell|encoded payload/.test(f.title) ? 0 : 1;
    for (const sev of SEV_ORDER) for (const f of fs.filter((x) => x.severity === sev).sort((a, b) => risky(a) - risky(b))) out2.push(findingLine(f));
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
  const inventory = run.read("host-inventory.json", void 0);
  return { report: out2.join("\n"), remediation: renderRemediation(findings, vs, sources, gaps, inventory), verdicts: vs };
}
function renderRemediation(findings, vs, _sources, gaps, inventory) {
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
      out2.push(`### ${r}${ran ? ": the attacker made CI run, rotate unless the run's code is provably yours" : ": probe PR only"}`, "");
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
    if (host.some((f) => f.severity === "compromised")) {
      out2.push("An IOC is on this machine. Treat every credential it holds as stolen, and rotate them from ANOTHER, clean machine:", "");
      const creds = inventory?.credentials ?? [];
      const envs = creds.filter((c) => c.kind.startsWith(".env"));
      for (const c of creds.filter((x) => !x.kind.startsWith(".env"))) out2.push(`- ${c.kind}: \`${c.path}\``);
      if (envs.length) out2.push(`- ${envs.length} \`.env\` file(s) with project secrets (listed in host-inventory.json)`);
      if (!creds.length)
        out2.push(
          "- `~/.ssh`, `~/.aws`, `~/.config/gcloud`, `~/.azure`, `~/.npmrc`, `~/.pypirc`, `~/.docker/config.json`, `~/.kube`, the gh token, `.env` files"
        );
      out2.push(
        "- browser sessions and saved passwords, and AI provider keys in your shell profile or apps",
        "",
        "Then remove the persistence below and consider a reinstall.",
        ""
      );
    }
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
  const review = findings.filter((f) => f.severity === "suspicious").sort((a, b) => Number(!/^Risky |not Apple's/.test(a.title)) - Number(!/^Risky |not Apple's/.test(b.title)));
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

// src/search.ts
var defaultSearcher = (query, opts) => search(query, { limit: opts.limit, timeoutMs: 45e3 });
async function searchInto(run, query, opts = {}) {
  const res = await (opts.searcher ?? defaultSearcher)(query, { limit: opts.limit ?? 10 });
  const existing = run.read("search-hits.json", []);
  const seen = new Set(existing.map((h) => safeCanonical(h.url)));
  const added = [];
  for (const h of parseWebResults(res.hits)) {
    const k = safeCanonical(h.url);
    if (seen.has(k)) continue;
    seen.add(k);
    const raw = res.hits.find((x) => x.url === h.url);
    added.push({ url: h.url, title: h.title, snippet: raw?.snippet?.slice(0, 300), query });
  }
  const all = [...existing, ...added];
  run.write("search-hits.json", all);
  const notes = res.notes.map((n) => n.replace(/`?(webindex|ultraguard) (searxng|stack|firecrawl) [a-z]+`?/g, "a SearXNG instance (ULTRAGUARD_SEARXNG)"));
  return { query, added, total: all.length, searched: res.searched !== false, notes };
}

// src/run.ts
import { existsSync as existsSync8, mkdirSync as mkdirSync5, readFileSync as readFileSync10 } from "fs";
import { join as join6, resolve } from "path";
var Run = class {
  dir;
  constructor(dir) {
    this.dir = resolve(dir);
    mkdirSync5(this.dir, { recursive: true });
  }
  path(name) {
    return join6(this.dir, name);
  }
  read(name, fallback) {
    const p = this.path(name);
    if (!existsSync8(p)) return fallback;
    return JSON.parse(readFileSync10(p, "utf8"));
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
    if (existing && !existing.error) {
      if (s.file && existing.file !== s.file) {
        const merged = { ...existing, file: s.file };
        this.write(
          "sources.json",
          all.map((x) => x.id === existing.id ? merged : x)
        );
        return merged;
      }
      return existing;
    }
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
  const since = reviewStart(iocs, opts.now);
  const result = { surface: "cloud", scanned: false, stats: {}, startedAt: (opts.now ?? /* @__PURE__ */ new Date()).toISOString() };
  const findings = [];
  const gaps = [];
  const denied = /* @__PURE__ */ new Map();
  const read2 = async (what, cmd, args, timeoutMs = T) => {
    const res = await runner2(cmd, args, { timeoutMs });
    const data = parseJsonOutput(res);
    if (data === void 0) {
      const d = denied.get(what) ?? { n: 0, why: (res.stderr || res.stdout).trim().split("\n")[0]?.slice(0, 200) || `exit ${res.status}` };
      d.n++;
      denied.set(what, d);
    }
    return data;
  };
  const fedPrefix = matchers(iocs, "azure_fedcred_prefix");
  const who = await runner2("aws", ["sts", "get-caller-identity", "--output", "json"], { timeoutMs: T });
  if (who.missing) gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not installed", fix: "skip if you use no AWS account" });
  else if (!who.ok)
    gaps.push({ surface: "cloud", what: "AWS", why: "the aws CLI is not logged in", fix: "aws sso login (or set a profile), then re-run scan cloud" });
  else {
    result.scanned = true;
    const account = parseJsonOutput(who)?.Account ?? "?";
    const roles = (await read2("AWS IAM roles", "aws", ["iam", "list-roles", "--output", "json"]))?.Roles ?? [];
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
    const users = (await read2("AWS IAM users", "aws", ["iam", "list-users", "--output", "json"]))?.Users ?? [];
    result.stats.awsUsers = users.length;
    await mapPool(users, 4, async (u) => {
      const keys = (await read2("AWS access keys", "aws", ["iam", "list-access-keys", "--user-name", u.UserName, "--output", "json"]))?.AccessKeyMetadata ?? [];
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
    const sas = await read2("GCP service accounts", "gcloud", ["iam", "service-accounts", "list", "--format=json"]) ?? [];
    result.stats.gcpServiceAccounts = sas.length;
    await mapPool(sas, 4, async (sa) => {
      const keys = await read2("GCP service-account keys", "gcloud", [
        "iam",
        "service-accounts",
        "keys",
        "list",
        `--iam-account=${sa.email}`,
        "--managed-by=user",
        "--format=json"
      ]) ?? [];
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
    const apps = await read2("Azure app registrations", "az", ["ad", "app", "list", "--show-mine", "--output", "json"]) ?? [];
    result.stats.azureApps = apps.length;
    await mapPool(apps, 4, async (app) => {
      const creds = await read2("Azure federated credentials", "az", ["ad", "app", "federated-credential", "list", "--id", app.appId, "--output", "json"]) ?? [];
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
  for (const [what, d] of denied)
    gaps.push({
      surface: "cloud",
      what: `${d.n} listing(s) of ${what}`,
      why: `the CLI refused or failed: ${d.why}`,
      fix: "check the role's read permissions, then re-run scan cloud"
    });
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return { result, findings, gaps };
}

// src/scan/deps.ts
import { existsSync as existsSync9, mkdirSync as mkdirSync6, readFileSync as readFileSync11, statSync as statSync8 } from "fs";
import { tmpdir } from "os";
import { dirname, isAbsolute as isAbsolute3, join as join7, relative, resolve as resolve2, sep as sep2 } from "path";

// src/vendor/package-checker-script.ts
var PACKAGE_CHECKER_VERSION = "1.16.4";
var PACKAGE_CHECKER_SHA256 = "de5ede80029422b7218c14d98f81954e956dfa9423f90bb8c89ee7af351dd269";
var PACKAGE_CHECKER_SCRIPT = '#!/usr/bin/env bash\n# GENERATED FILE NOTICE: script.sh is built from src/ by ./build.sh \u2014 edit src/, not script.sh.\n\n# Package Vulnerability Checker\n# Analyzes package.json and lockfiles to detect vulnerable packages from custom data sources\n\n# Plain POSIX syntax up to the version check, so `sh script.sh` gets this\n# message instead of a parse error.\ncase "${BASH_VERSION:-}" in\n    ""|[0-3].*)\n        printf \'%s\\n\' \'Error: package-checker requires Bash 4 or newer (macOS: brew install bash).\' >&2\n        exit 2 ;;\nesac\nset -e\n\n# Exit codes: 0 = no vulnerable package, 1 = vulnerable packages found,\n# EXIT_ERROR = the scan could not run or complete (bad usage, unreadable or\n# empty data, unexpected failure). CI treats any non-zero code as a failure.\nEXIT_ERROR=2\n\n# Byte-wise string comparison and character classes: version ordering\n# ([[ a < b ]]), awk ranges and sort must not depend on the user\'s locale\n# (5.0.0-beta1 vs 5.0.0-RC1 orders differently under fr_FR and C).\nexport LC_ALL=C\n\n# Version - automatically updated by release workflow\n# Last release: https://github.com/maxgfr/package-checker.sh/releases\n# NOTE: this exact \'VERSION="..."\' format is sed-matched by .releaserc.json \u2014 do not reformat.\nVERSION="1.16.4"\n\n# Default configuration\nCONFIG_FILE=".package-checker.config.json"\n\nRED=\'\\033[0;31m\'\nGREEN=\'\\033[0;32m\'\nYELLOW=\'\\033[1;33m\'\nBLUE=\'\\033[0;34m\'\nNC=\'\\033[0m\' # No Color\n\n# Global variables\nLOADED_SOURCE_COUNT=0\nFOUND_VULNERABLE=0\nVULNERABLE_PACKAGES=()\n\n# Pre-built vulnerability lookup tables (for O(1) lookup)\ndeclare -A VULN_EXACT_LOOKUP      # VULN_EXACT_LOOKUP[package]="ver1|ver2|..."\ndeclare -A VULN_RANGE_LOOKUP      # VULN_RANGE_LOOKUP[package]="range1|range2|..."\n# Per finding (key "eco:package@version"): the most severe advisory\'s fields,\n# every matching advisory, and the version that fixes them all.\ndeclare -A VULN_METADATA_SEVERITY # ="critical|high|medium|low"\ndeclare -A VULN_METADATA_GHSA     # ="GHSA-xxxx-xxxx-xxxx"\ndeclare -A VULN_METADATA_CVE      # ="CVE-YYYY-NNNNN"\ndeclare -A VULN_METADATA_SOURCE   # ="ghsa|osv|custom" (merged: "ghsa, osv")\ndeclare -A VULN_ADVISORIES        # ="sev;ghsa;cve;src;fix;id||..." (all matching advisories)\ndeclare -A VULN_METADATA_FIX      # ="fix_version"\ndeclare -A VULN_RECORDS           # lookup key (eco:name@version or eco:name:range) -> advisory records\n\n# Configuration defaults (can be overridden by config file)\nCONFIG_IGNORE_PATHS=("node_modules" ".yarn" ".git" "vendor")\nCONFIG_DEPENDENCY_TYPES=("dependencies" "devDependencies" "optionalDependencies")\nCONFIG_ECOSYSTEMS=""  # optional feed-loading override from config (options.ecosystems)\nCONFIG_RUNTIME_CHECK=true  # options.runtime_check (--no-runtime-check overrides)\n\n# Project files that could not be read (an incomplete scan is never clean)\nUNREADABLE_FILE_COUNT=0\n\n# Ecosystem registry lookup tables \u2014 derived from ECOSYSTEM_REGISTRY by\n# build_ecosystem_tables() (see src/50-ecosystems/01-registry.sh)\ndeclare -A LOCKFILE_PARSER   # LOCKFILE_PARSER[basename]="analyze_fn"\ndeclare -A LOCKFILE_ECO      # LOCKFILE_ECO[basename]="purl-type"\nKNOWN_LOCKFILE_ALIASES=""    # space-separated unique alias list (validation + help)\n\n# Ecosystems detected in the scanned project (eco -> 1); drives default-feed loading\ndeclare -A DETECTED_ECOSYSTEMS\n\n# govulncheck call analysis of Go findings (--go-reachability)\ndeclare -A VULN_REACHABILITY      # VULN_REACHABILITY[dir|golang:module@version]="called|not called"\n\n# CycloneDX SBOMs given with --sbom (path -> 1), scanned as project inventories\ndeclare -A SBOM_FILES\ndeclare -A SBOM_COMPONENTS   # path -> "eco|name|version" lines (cyclonedx_components)\n# Syntax validation for JSON inputs; scan-time code must not require jq.\n# Stream tokens through a small grammar stack. Repeated indexing into a growing\n# whole-document string becomes quadratic with some awk implementations.\njson_is_valid() {\n    printf \'%s\\n\' "$1" | json_is_valid_file /dev/stdin\n}\n\n# Same check on a file, read directly by awk (no copy into a shell variable).\njson_is_valid_file() {\n    LC_ALL=C awk \'\n    function take_value() {\n        if (state[depth] != "value" && state[depth] != "value-or-end") return 0\n        state[depth] = depth ? "comma-or-end" : "done"\n        return 1\n    }\n    function finish_token() {\n        if (token == "") return 1\n        if (token !~ /^(true|false|null)$/ &&\n            token !~ /^-?(0|[1-9][0-9]*)(\\.[0-9]+)?([eE][+-]?[0-9]+)?$/) return 0\n        token = ""\n        return take_value()\n    }\n    function character(c) {\n        if (quoted) {\n            if (c ~ /[\\001-\\037]/) return 0\n            if (unicode) {\n                if (c !~ /^[0-9a-fA-F]$/) return 0\n                unicode--\n            } else if (escaped) {\n                escaped = 0\n                if (c == "u") unicode = 4\n                else if (c !~ /^["\\\\\\/bfnrt]$/) return 0\n            } else if (c == "\\\\") escaped = 1\n            else if (c == "\\"") {\n                quoted = 0\n                if (key_string) state[depth] = "colon"\n                else if (!take_value()) return 0\n            }\n            return 1\n        }\n        if (c !~ /^[ \\t\\r\\n{}\\[\\],:"]$/) { token = token c; return 1 }\n        if (!finish_token()) return 0\n        if (c ~ /^[ \\t\\r\\n]$/) return 1\n        if (c == "\\"") {\n            key_string = (state[depth] == "key" || state[depth] == "key-or-end")\n            if (!key_string && state[depth] != "value" && state[depth] != "value-or-end") return 0\n            quoted = 1\n        } else if (c == "{" || c == "[") {\n            if (!take_value() || depth >= 128) return 0\n            kind[++depth] = c\n            state[depth] = c == "{" ? "key-or-end" : "value-or-end"\n        } else if (c == "}" || c == "]") {\n            if (!depth || (c == "}" && kind[depth] != "{") ||\n                (c == "]" && kind[depth] != "[")) return 0\n            if (state[depth] != "comma-or-end" && state[depth] != "key-or-end" &&\n                state[depth] != "value-or-end") return 0\n            depth--\n        } else if (c == ":") {\n            if (state[depth] != "colon") return 0\n            state[depth] = "value"\n        } else if (c == ",") {\n            if (!depth || state[depth] != "comma-or-end") return 0\n            state[depth] = kind[depth] == "{" ? "key" : "value"\n        }\n        return 1\n    }\n    BEGIN { depth = 0; state[0] = "value" }\n    # A UTF-8 byte order mark is an encoding marker, not JSON.\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    {\n        # Most pretty-printed lockfile records contain short, unescaped tokens.\n        # Consume whole strings/numbers there, keeping the bounded byte path for\n        # escapes and long compact records. Both paths use the same grammar.\n        if (length($0) < 4096 && $0 !~ /\\\\/) {\n            rest = $0\n            while (length(rest)) {\n                if (match(rest, /^[ \\t\\r]+/)) {\n                    rest = substr(rest, RLENGTH + 1)\n                } else if (match(rest, /^"[^"\\001-\\037]*"/)) {\n                    rest = substr(rest, RLENGTH + 1)\n                    if (state[depth] == "key" || state[depth] == "key-or-end") state[depth] = "colon"\n                    else if (!take_value()) { invalid = 1; exit }\n                } else if (match(rest, /^[^ \\t\\r{}\\[\\],:"]+/)) {\n                    token = substr(rest, 1, RLENGTH)\n                    rest = substr(rest, RLENGTH + 1)\n                    if (!finish_token()) { invalid = 1; exit }\n                } else {\n                    if (!character(substr(rest, 1, 1))) { invalid = 1; exit }\n                    rest = substr(rest, 2)\n                }\n            }\n            if (!character("\\n")) { invalid = 1; exit }\n            next\n        }\n        # Bound memory for compact single-line lockfiles as well.\n        for (offset = 1; offset <= length($0); offset += 4096) {\n            size = split(substr($0, offset, 4096), chars, "")\n            for (i = 1; i <= size; i++) {\n                if (!character(chars[i])) { invalid = 1; exit }\n            }\n        }\n        if (!character("\\n")) { invalid = 1; exit }\n    }\n    END { exit (invalid || quoted || depth || !finish_token() || state[0] != "done") }\n    \' "$1"\n}\n# ============================================================================\n# Minimal JSON accessors (awk, no jq dependency)\n# For configuration files, package.json / composer files and GitHub API answers.\n# ============================================================================\n\n# One scanner for every accessor, fed with json_structural_lines records (one\n# member per record, an opening { or [ at the end of its record, a closing }\n# or ] alone): layout, escapes and document size are handled there.\n#   mode=value  print the raw value of the top-level KEY of the root object\n#   mode=items  print each element of the root array on its own line\n# Only members of the root are considered, so a key name that appears as a\n# string value or inside a nested object is never mistaken for the key.\nAWK_JSON_SCAN=\'\nfunction trim(t) {\n    sub(/^[[:space:]]+/, "", t)\n    sub(/[[:space:]]+$/, "", t)\n    return t\n}\n# Split a member record into M_KEY ("" and M_HAS_KEY=0 for an array element)\n# and M_VAL, the rest of the record.\nfunction member(rec,   i, c, n, rest) {\n    M_KEY = ""; M_VAL = rec; M_HAS_KEY = 0\n    if (substr(rec, 1, 1) != "\\"") return\n    n = length(rec)\n    for (i = 2; i <= n; i++) {\n        c = substr(rec, i, 1)\n        if (c == "\\\\") i++\n        else if (c == "\\"") break\n    }\n    rest = trim(substr(rec, i + 1))\n    if (substr(rest, 1, 1) != ":") return\n    M_HAS_KEY = 1\n    M_KEY = substr(rec, 2, i - 2)\n    M_VAL = trim(substr(rest, 2))\n}\n{\n    rec = trim($0)\n    if (rec == "") next\n    closing = (rec == "}" || rec == "]")\n    last = substr(rec, length(rec))\n    opening = (!closing && (last == "{" || last == "["))\n    if (capturing) {\n        # Rebuild the nested value, restoring the commas between members.\n        if (closing) {\n            out = out rec\n            if (--cdepth == 0) {\n                print out\n                capturing = 0\n                if (mode == "value") exit\n            }\n            next\n        }\n        out = out (count[cdepth]++ ? "," : "") rec\n        if (opening) count[++cdepth] = 0\n        next\n    }\n    if (closing) { depth--; next }\n    if (depth == 0) {\n        if (rec != (mode == "value" ? "{" : "[")) exit\n        depth = 1\n        next\n    }\n    if (depth == 1) {\n        member(rec)\n        if (mode == "value") {\n            wanted = (M_HAS_KEY && M_KEY == key)\n            if (opening && wanted) { capturing = 1; out = M_VAL; cdepth = 1; count[1] = 0 }\n            else if (opening) depth++\n            else if (wanted) { print M_VAL; exit }\n        } else if (opening) {\n            capturing = 1; out = rec; cdepth = 1; count[1] = 0\n        } else {\n            print rec\n        }\n        next\n    }\n    if (opening) depth++\n}\n\'\n\n# Raw JSON value of a top-level key ("" when the key is absent).\n# Usage: json_get_raw "$json" "key"\njson_get_raw() {\n    printf \'%s\\n\' "$1" | json_structural_lines - | awk -v mode=value -v key="$2" "$AWK_JSON_SCAN"\n}\n\n# Scalar value of a top-level key: a string without its quotes (\\" \\/ and \\\\\n# unescaped), or a number / true / false / null as written. Objects, arrays\n# and absent keys print nothing.\n# Usage: json_get_value "$json" "key"\njson_get_value() {\n    local raw\n    raw=$(json_get_raw "$1" "$2")\n    case "$raw" in\n        \'"\'*\'"\')\n            raw="${raw#\\"}"; raw="${raw%\\"}"\n            raw="${raw//\\\\\\//\\/}"\n            raw="${raw//\\\\\\"/\\"}"\n            raw="${raw//\\\\\\\\/\\\\}"\n            printf \'%s\\n\' "$raw" ;;\n        \'\'|\'{\'*|\'[\'*) ;;\n        *) printf \'%s\\n\' "$raw" ;;\n    esac\n}\n\n# Object (or array) value of a top-level key; "{}" when absent or scalar.\n# Usage: json_get_object "$json" "key"\njson_get_object() {\n    local raw\n    raw=$(json_get_raw "$1" "$2")\n    case "$raw" in\n        \'{\'*|\'[\'*) printf \'%s\\n\' "$raw" ;;\n        *) echo "{}" ;;\n    esac\n}\n\n# Array value of a top-level key; "[]" when absent.\n# Usage: json_get_array "$json" "key"\njson_get_array() {\n    local result\n    result=$(json_get_object "$1" "$2")\n    [ "$result" != "{}" ] || result="[]"\n    printf \'%s\\n\' "$result"\n}\n\n# Elements of a JSON array, one per line (raw JSON).\n# Usage: json_array_items "$json_array"\njson_array_items() {\n    printf \'%s\\n\' "$1" | json_structural_lines - | awk -v mode=items "$AWK_JSON_SCAN"\n}\n\n# Non-empty string elements of a JSON array, unquoted, into JSON_STRINGS.\n# Usage: json_read_strings "$json_array"\njson_read_strings() {\n    JSON_STRINGS=()\n    local item\n    while IFS= read -r item; do\n        case "$item" in\n            \'"\'*\'"\') item="${item#\\"}"; item="${item%\\"}" ;;\n        esac\n        [ -z "$item" ] || JSON_STRINGS+=("$item")\n    done < <(json_array_items "$1")\n}\n# Put structural JSON delimiters on separate records without changing strings.\n# Line-oriented lockfile readers can then handle compact or pretty JSON alike.\njson_structural_lines() {\n    awk \'\n    # A UTF-8 byte order mark is an encoding marker, not JSON.\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    function flush() {\n        if (buffer ~ /[^[:space:]]/) print buffer\n        buffer = ""\n    }\n    {\n        # Generated pretty JSON normally has one unescaped scalar per line.\n        # Preserve the existing record whitespace while skipping its byte loop.\n        if (!quoted && buffer !~ /[^[:space:]]/ &&\n            $0 ~ /^[[:space:]]*"[^"\\\\]*"[[:space:]]*:[[:space:]]*("[^"\\\\]*"|true|false|null|-?[0-9.]+),?$/) {\n            buffer = buffer $0\n            if (substr(buffer, length(buffer), 1) == ",") {\n                buffer = substr(buffer, 1, length(buffer) - 1)\n                flush()\n            }\n            buffer = buffer " "\n            next\n        }\n        # BSD awk scans to substr offsets in multibyte records. Bound the\n        # inner offsets even when the entire lockfile occupies one long line.\n        record_size = length($0)\n        for (offset = 1; offset <= record_size; offset += 4096) {\n            chunk = substr($0, offset, 4096)\n            chunk_size = length(chunk)\n            for (i = 1; i <= chunk_size; i++) {\n                c = substr(chunk, i, 1)\n            if (quoted) {\n                buffer = buffer c\n                if (escaped) escaped = 0\n                else if (c == "\\\\") escaped = 1\n                else if (c == "\\"") quoted = 0\n            } else if (c == "\\"") {\n                quoted = 1\n                buffer = buffer c\n            } else if (c == "{" || c == "[") {\n                buffer = buffer c\n                flush()\n            } else if (c == "}" || c == "]") {\n                flush()\n                print c\n            } else if (c == ",") {\n                flush()\n            } else {\n                buffer = buffer c\n            }\n            }\n        }\n        if (!quoted) buffer = buffer " "\n    }\n    END { flush() }\n    \' "$1"\n}\n\n# ============================================================================\n# End of JSON Parser Functions\n# ============================================================================\n\n# Show version information\nshow_version() {\n    echo "package-checker.sh version $VERSION"\n    echo ""\n    echo "Scan project dependencies (npm, PyPI, Go, Maven, Cargo, RubyGems, Composer, NuGet,"\n    echo "Pub, Hex, Swift, GitHub Actions) for known vulnerable versions."\n    echo "Repository: https://github.com/maxgfr/package-checker.sh"\n    exit 0\n}\n\n# Help message\nshow_help() {\n    cat << EOF\nUsage: $0 [PATH] [OPTIONS]\n\nScan project dependencies (npm, PyPI, Go, Maven, Cargo, RubyGems, Composer, NuGet,\nPub, Hex, Swift, GitHub Actions) for known vulnerable versions, using the built-in\nGHSA/OSV feeds or your own data sources. The Node.js and PHP versions the project\ntargets (.nvmrc, Docker base image, composer.json platform...) are checked too.\n\nARGUMENTS:\n    PATH                    Directory to scan (default: current directory)\n\nOPTIONS:\n    -h, --help              Show this help message\n    --help-ai               Show AI help menu\n    --help-ai prompt        Output the AI system prompt (prompt.md)\n    --help-ai doc           Output the full AI guide (docs/ai-guide.md)\n    -v, --version           Show version information\n    -s, --source SOURCE     Data source path or URL (can be used multiple times)\n    --default-source-ghsa   Use default GHSA source (script dir, brew, /app/data/, ./data/, then GitHub)\n    --default-source-osv    Use default OSV source (script dir, brew, /app/data/, ./data/, then GitHub)\n    --default-source-ghsa-osv        Use both default GHSA and OSV sources (recommended)\n    -f, --format FORMAT     Format of the preceding -s source: json, csv, purl, sarif,\n                            sbom-cyclonedx or trivy-json (default: auto-detected from\n                            the file extension, json when unknown)\n    -c, --config FILE       Path to configuration file (default: .package-checker.config.json);\n                            its options always apply, its sources only when no source\n                            is given on the command line\n    --no-config             Skip the default configuration file\n    --csv-columns COLS      CSV columns of the preceding -s source (e.g., "1,2" or "name,versions")\n    --package-name NAME     Check vulnerability for a specific package name\n    --package-version VER   Check specific version (requires --package-name)\n    --ecosystem ECO         Ecosystem for --package-name (default: npm). One of:\n                            npm, pypi, golang, maven, cargo, gem, composer, nuget, pub, hex, swift, githubactions,\n                            runtime (Node.js / PHP: --package-name node --ecosystem runtime)\n    --export-json [FILE]    Export results to JSON (FILE optional, default: vulnerabilities.json)\n    --export-csv [FILE]     Export results to CSV (FILE optional, default: vulnerabilities.csv)\n    --github-org ORG        GitHub organization to fetch package.json files and lockfiles from\n    --github-repo REPO      GitHub repository to fetch package.json files and lockfiles from (format: owner/repo)\n    --github-token TOKEN    GitHub personal access token (or use GITHUB_TOKEN env var)\n    --github-output DIR     Output directory for fetched packages (default: ./packages)\n    --github-only           Only fetch packages from GitHub, don\'t analyze local files\n    --create-multiple-issues Create one GitHub issue per vulnerable package (requires --github-token)\n    --create-single-issue   Create a single GitHub issue with all vulnerabilities (requires --github-token)\n    --fetch-all [DIR]       Fetch GHSA + OSV + runtime feeds for ALL ecosystems to DIR (default: data)\n    --fetch-osv [ECOS|DIR]  Fetch OSV feeds into data/; optional comma list of ecosystems\n                            (purl types or lockfile aliases: pypi,go,rust...; default: all),\n                            or an existing directory to write every feed to\n    --fetch-ghsa [ECOS|DIR] Fetch GHSA feeds (single clone); same argument as --fetch-osv\n    --fetch-runtime [DIR]   Fetch the Node.js / PHP runtime feed (OSV Bitnami) to\n                            DIR/osv-runtime.purl (default: data)\n    --only-package-json     Scan only package.json files (skip lockfiles)\n    --only-lockfiles        Scan only lockfiles (skip package.json files)\n    --lockfile-types TYPES  Comma-separated list of lockfile types to scan\n                            (npm, yarn, pnpm, bun, deno, rust, go, python, ruby, php,\n                            maven, nuget, dart, hex, swift, actions). "actions" scans\n                            GitHub Actions workflow files (.github/workflows/*.yml).\n                            Example: --lockfile-types yarn,npm\n    --ecosystems ECOS       Comma-separated ecosystems to load default feeds for,\n                            overriding auto-detection. Accepts lockfile-type aliases\n                            (npm, yarn, pnpm, bun, deno, rust, go, python, ruby, php,\n                            maven, nuget, dart, hex, swift, actions) or purl types\n                            (npm, pypi, golang, cargo, githubactions, ...).\n                            Example: --ecosystems npm\n    --sbom FILE             Also scan the components of a CycloneDX JSON SBOM, like a\n                            lockfile (can be used multiple times). Use it for Maven\n                            transitive dependencies, which pom.xml does not list:\n                            mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom\n    --go-reachability       Annotate each Go finding "called" or "not called" with\n                            govulncheck, when it is installed (one run per go.mod).\n                            The exit code does not change.\n    --no-runtime-check      Do not check the Node.js / PHP versions the project targets\n                            (.nvmrc, .node-version, .php-version, .tool-versions,\n                            package.json engines/volta, composer.json/composer.lock\n                            platform, Dockerfile FROM node:/php:, workflow\n                            node-version:/php-version:). An exact version is a\n                            finding; a release line or a range only warns.\n    --include-gitignored    Also scan git-ignored lockfiles and manifests (skipped and\n                            listed by default)\n\nEXIT CODES:\n    0   No vulnerable package found\n    1   Vulnerable packages found\n    2   Error: invalid usage, unreadable or empty data source, failed scan\n\nEXAMPLES:\n    # Scan current directory with default sources (recommended)\n    $0 --default-source-ghsa-osv\n\n    # Scan specific directory\n    $0 ./my-project --default-source-osv\n    $0 /absolute/path/to/project --default-source-ghsa-osv\n\n    # Use configuration file\n    $0 --config .package-checker.config.json\n\n    # Use custom source (-f/--csv-columns qualify the -s right before them)\n    $0 --source https://example.com/vulns.json\n    $0 --source ./vulns.csv -f csv --csv-columns "name,versions"\n\n    # GitHub organization scan\n    $0 --github-org myorg --github-token ghp_xxxx --default-source-ghsa-osv\n\n    # Check specific package\n    $0 --package-name express --package-version 4.17.1\n\n    # Fetch vulnerability feeds (all ecosystems)\n    $0 --fetch-all data\n\n    # Fetch feeds for specific ecosystems only\n    $0 --fetch-osv pypi,golang\n    $0 --fetch-ghsa cargo\n\n    # Scan a Maven project with its transitive dependencies\n    $0 --sbom target/bom.json --default-source-ghsa-osv\n\n    # Scan only lockfiles in specific directory\n    $0 ./subfolder --only-lockfiles --lockfile-types yarn,npm\n\nFor configuration file format, use: $0 --help format\nEOF\n    exit 0\n}\n\n# Show configuration format help\nshow_format_help() {\n    cat << \'EOF\'\nCONFIGURATION FILE FORMAT (.package-checker.config.json):\n{\n  "sources": [\n    {\n      "source": "https://example.com/vulns.json",\n      "format": "json",\n      "name": "My Vulnerability List"\n    },\n    {\n      "source": "https://example.com/vulns.csv",\n      "format": "csv",\n      "columns": "name,versions",\n      "name": "CSV Vulnerabilities"\n    }\n  ],\n  "github": {\n    "org": "my-organization",\n    "repo": "owner/repo",\n    "token": "ghp_xxxx",\n    "output": "./packages"\n  },\n  "options": {\n    "ignore_paths": ["node_modules", ".yarn", ".git"],\n    "dependency_types": ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"],\n    "runtime_check": true\n  }\n}\n\nDATA FORMATS:\n\nJSON format (object with package names as keys):\n{\n  "package-name": {\n    "versions": ["1.0.0", "2.0.0"]\n  }\n}\n\nCSV format (default columns: package,version; the first line is a header\nunless its version field looks like a version or a range):\nname,versions\npackage-name,1.0.0\npackage-name,2.0.0\nanother-package,">=3.0.0 <3.2.1"\n\nCSV format with custom columns:\nname,versions,sources\nexpress,4.16.0,"datadog, helixguard"\nlodash,4.17.19,"koi, reversinglabs"\n\nUse --csv-columns to specify which columns to use:\n--csv-columns "1,2"     # Use columns 1 and 2 (name, versions)\n--csv-columns "name,versions"  # Use column names\nEOF\n    exit 0\n}\n\n# GitHub raw base URL for AI docs\nGITHUB_RAW_BASE="https://raw.githubusercontent.com/maxgfr/package-checker.sh/refs/heads/main"\n\n# Resolve an AI doc file: try local paths first, then fetch from GitHub\n# Usage: resolve_ai_doc <relative-path>\n# Output: file content to stdout\nresolve_ai_doc() {\n    local file_path="$1"\n\n    # 1. Local relative to script location (symlinks resolved)\n    resolve_script_home\n    if [ -n "$SCRIPT_HOME" ] && [ -f "$SCRIPT_HOME/$file_path" ]; then\n        cat "$SCRIPT_HOME/$file_path"\n        return 0\n    fi\n\n    # 2. Local relative to cwd\n    if [ -f "./$file_path" ]; then\n        cat "./$file_path"\n        return 0\n    fi\n\n    # 3. Homebrew prefix\n    resolve_brew_prefix\n    if [ -n "$BREW_PREFIX" ] && [ -f "$BREW_PREFIX/share/package-checker/$file_path" ]; then\n        cat "$BREW_PREFIX/share/package-checker/$file_path"\n        return 0\n    fi\n\n    # 4. Docker path\n    if [ -f "/app/$file_path" ]; then\n        cat "/app/$file_path"\n        return 0\n    fi\n\n    # 5. Fetch from GitHub\n    local url="${GITHUB_RAW_BASE}/${file_path}"\n    local content\n    if content=$(curl -fsSL "$url" 2>/dev/null) && [ -n "$content" ]; then\n        echo "$content"\n        return 0\n    fi\n\n    return 1\n}\n\n# Show AI help menu or subcommand\nshow_ai_help() {\n    local subcommand="${1:-}"\n\n    case "$subcommand" in\n        prompt)\n            echo -e "${BLUE}package-checker.sh \u2014 AI System Prompt${NC}"\n            echo -e "${BLUE}======================================${NC}"\n            echo ""\n            echo -e "${YELLOW}Source: ${GITHUB_RAW_BASE}/prompt.md${NC}"\n            echo ""\n            local content\n            if content=$(resolve_ai_doc "prompt.md"); then\n                echo "$content"\n            else\n                echo -e "${RED}\u274C Error: Could not load prompt.md${NC}"\n                echo ""\n                echo "Try one of:"\n                echo "  - Clone the repo and run locally"\n                echo "  - curl -fsSL ${GITHUB_RAW_BASE}/prompt.md"\n                exit "$EXIT_ERROR"\n            fi\n            ;;\n        doc)\n            echo -e "${BLUE}package-checker.sh \u2014 AI Guide (Full Reference)${NC}"\n            echo -e "${BLUE}================================================${NC}"\n            echo ""\n            echo -e "${YELLOW}Source: ${GITHUB_RAW_BASE}/docs/ai-guide.md${NC}"\n            echo ""\n            local content\n            if content=$(resolve_ai_doc "docs/ai-guide.md"); then\n                echo "$content"\n            else\n                echo -e "${RED}\u274C Error: Could not load docs/ai-guide.md${NC}"\n                echo ""\n                echo "Try one of:"\n                echo "  - Clone the repo and run locally"\n                echo "  - curl -fsSL ${GITHUB_RAW_BASE}/docs/ai-guide.md"\n                exit "$EXIT_ERROR"\n            fi\n            ;;\n        *)\n            cat << EOF\nAI-Assisted Usage for package-checker.sh\n=========================================\n\nUse these commands to get AI-ready documentation:\n\n  $(basename "$0") --help-ai prompt    Output the system prompt (prompt.md)\n                                  Paste this into any AI assistant as context.\n\n  $(basename "$0") --help-ai doc       Output the full AI guide (docs/ai-guide.md)\n                                  Complete schemas, validation rules, and recipes.\n\nOne-liner to inject into an AI conversation:\n\n  $(basename "$0") --help-ai prompt | pbcopy       # macOS: copy to clipboard\n  $(basename "$0") --help-ai prompt | xclip        # Linux: copy to clipboard\n  $(basename "$0") --help-ai prompt > context.md   # Save to file and attach\n\nGitHub URLs (always up-to-date):\n\n  Prompt:  ${GITHUB_RAW_BASE}/prompt.md\n  Guide:   ${GITHUB_RAW_BASE}/docs/ai-guide.md\n\nEOF\n            ;;\n    esac\n    exit 0\n}\n\n# Check that the required tools are installed (default: curl, used to\n# download remote sources). Feed generation also needs jq and friends.\ncheck_dependencies() {\n    local tool\n    [ $# -gt 0 ] || set -- curl\n    for tool in "$@"; do\n        if ! command -v "$tool" &> /dev/null; then\n            echo "\u274C Error: \'$tool\' must be installed to run this command"\n            exit "$EXIT_ERROR"\n        fi\n    done\n}\n\n# Caches of the two resolvers below: values inherited from the environment\n# must never stand in for them (they decide where the built-in feeds come from).\nunset SCRIPT_HOME BREW_PREFIX\n\n# Directory of the real script file, symlinks resolved (Homebrew and the\n# Docker images run it through /usr/local/bin/package-checker). Empty when the\n# script is piped (curl ... | bash). Sets SCRIPT_HOME once.\nresolve_script_home() {\n    [ -z "${SCRIPT_HOME+x}" ] || return 0\n    SCRIPT_HOME=""\n    local path="${BASH_SOURCE[0]:-}" link hops=0\n    [ -n "$path" ] && [ -f "$path" ] || return 0\n    while [ -L "$path" ] && [ "$hops" -lt 32 ]; do\n        link=$(readlink "$path") || break\n        case "$link" in\n            /*) path="$link" ;;\n            *) path="$(dirname "$path")/$link" ;;\n        esac\n        hops=$((hops + 1))\n    done\n    SCRIPT_HOME=$(cd "$(dirname "$path")" 2>/dev/null && pwd) || SCRIPT_HOME=""\n}\n\n# Homebrew prefix, computed once (brew --prefix takes ~0.1 s). Sets\n# BREW_PREFIX ("" without Homebrew).\nresolve_brew_prefix() {\n    [ -z "${BREW_PREFIX+x}" ] || return 0\n    BREW_PREFIX=""\n    if command -v brew &> /dev/null; then\n        BREW_PREFIX=$(brew --prefix 2>/dev/null) || BREW_PREFIX=""\n    fi\n}\n\n# Temporary files removed when the script exits, whatever the exit path.\nPC_TEMP_FILES=()\nPC_TEMP_DIRS=()\nPC_CLEANUP_TRAP=false\npc_cleanup_temp_files() {\n    [ ${#PC_TEMP_FILES[@]} -eq 0 ] || rm -f -- "${PC_TEMP_FILES[@]}"\n    [ ${#PC_TEMP_DIRS[@]} -eq 0 ] || rm -rf -- "${PC_TEMP_DIRS[@]}"\n}\n# Register a temporary directory (feed generation: clones, zips) for removal\n# when the script exits, including on Ctrl-C or a CI timeout.\nregister_temp_dir() {\n    [ -n "$1" ] && [ -d "$1" ] || return 1\n    PC_TEMP_DIRS+=("$1")\n    register_temp_file "$1/.package-checker-tmp"\n    trap \'exit 130\' INT\n    trap \'exit 143\' TERM\n}\n# Register a temp file for cleanup. The EXIT trap is installed once and keeps\n# any EXIT trap already set (it runs after the cleanup).\nregister_temp_file() {\n    PC_TEMP_FILES+=("$1")\n    [ "$PC_CLEANUP_TRAP" = true ] && return 0\n    PC_CLEANUP_TRAP=true\n    local previous\n    previous=$(trap -p EXIT)\n    if [ -n "$previous" ]; then\n        eval "set -- $previous"   # trap -- \'command\' EXIT\n        # shellcheck disable=SC2064 # the previous trap is expanded now, on purpose\n        trap "pc_cleanup_temp_files; $3" EXIT\n    else\n        trap pc_cleanup_temp_files EXIT\n    fi\n}\n\n# GitHub API functions\nGITHUB_TOKEN="${GITHUB_TOKEN:-}"\nGITHUB_ORG="${GITHUB_ORG:-}"\nGITHUB_REPO="${GITHUB_REPO:-}"\nGITHUB_OUTPUT_DIR="${GITHUB_OUTPUT_DIR:-./packages}"\nGITHUB_ONLY=false\nGITHUB_RATE_LIMIT_DELAY=2\nCREATE_GITHUB_ISSUE=false\nCREATE_SINGLE_ISSUE=false\nGITHUB_FAILED_REPOS=0   # organization repositories whose files could not be fetched\n\n# Make a GitHub API request with automatic retry on rate limit. A 403/429\n# rate-limit answer waits until the time GitHub gives (Retry-After or\n# x-ratelimit-reset), capped by GITHUB_RATE_LIMIT_MAX_WAIT seconds.\nGITHUB_RATE_LIMIT_MAX_WAIT="${GITHUB_RATE_LIMIT_MAX_WAIT:-900}"\ngithub_request() {\n    local url="$1"\n    local max_retries=3\n    local attempt=1\n    local response http_code headers wait_time value\n\n    while [ $attempt -le $max_retries ]; do\n        headers=$(mktemp) || return 1\n        register_temp_file "$headers"\n        if ! response=$(curl -sS --connect-timeout 10 --max-time 60 -D "$headers" -w "\\n%{http_code}" \\\n            ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} \\\n            -H "Accept: application/vnd.github.v3+json" \\\n            -H "User-Agent: package-checker-script" \\\n            "$url"); then\n            rm -f -- "$headers"\n            echo "Error: Unable to reach GitHub API" >&2\n            return 1\n        fi\n\n        http_code="${response##*$\'\\n\'}"\n        response="${response%$\'\\n\'*}"\n\n        if [ "$http_code" = "200" ]; then\n            rm -f -- "$headers"\n            echo "$response"\n            return 0\n        fi\n\n        # Handle rate limiting (403 or 429)\n        if { [ "$http_code" = 429 ] || { [ "$http_code" = 403 ] &&\n            { [[ "$response" == *"rate limit"* ]] || grep -qi \'^x-ratelimit-remaining:[[:space:]]*0\' "$headers"; }; }; } &&\n            [ $attempt -lt $max_retries ]; then\n            wait_time=60\n            value=$(awk \'tolower($1) == "retry-after:" { gsub(/\\r/, "", $2); print $2 }\' "$headers")\n            if [[ "$value" =~ ^[0-9]+$ ]]; then\n                wait_time=$value\n            else\n                value=$(awk \'tolower($1) == "x-ratelimit-reset:" { gsub(/\\r/, "", $2); print $2 }\' "$headers")\n                if [[ "$value" =~ ^[0-9]+$ ]]; then\n                    wait_time=$(( value - $(date +%s) + 1 ))\n                    [ "$wait_time" -ge 1 ] || wait_time=1\n                fi\n            fi\n            rm -f -- "$headers"\n            if [ "$wait_time" -gt "$GITHUB_RATE_LIMIT_MAX_WAIT" ]; then\n                echo -e "${RED}\u274C GitHub rate limit resets in ${wait_time}s (more than ${GITHUB_RATE_LIMIT_MAX_WAIT}s); giving up${NC}" >&2\n                return 1\n            fi\n            echo -e "${YELLOW}\u26A0\uFE0F  Rate limit hit, waiting ${wait_time}s before retry ($attempt/$max_retries)...${NC}" >&2\n            sleep "$wait_time"\n            attempt=$((attempt + 1))\n            continue\n        fi\n        rm -f -- "$headers"\n\n        # Non-retryable error or max retries reached\n        echo -e "${RED}\u274C GitHub API error ($http_code): $response${NC}" >&2\n        return 1\n    done\n\n    return 1\n}\n\n# Get all repositories from a GitHub organization\n# OPTIMIZED: Returns newline-separated list of "name|full_name" instead of JSON\nget_github_repositories() {\n    echo -e "${BLUE}\u{1F50D} Fetching repositories for organization: $GITHUB_ORG${NC}" >&2\n    \n    local all_repos=""\n    local page=1\n    local per_page=100\n    \n    while true; do\n        local url="https://api.github.com/orgs/${GITHUB_ORG}/repos?page=${page}&per_page=${per_page}"\n        local repos\n        \n        repos=$(github_request "$url") || return 1\n        \n        # FIXED: Use grep -o | wc -l to count occurrences correctly (grep -c counts lines, not occurrences)\n        local count=$(echo "$repos" | grep -o \'"full_name"\' | wc -l | tr -d \' \')\n        \n        if [ "$count" -eq 0 ]; then\n            break\n        fi\n        \n        # OPTIMIZED: Extract name and full_name pairs using grep/sed\n        # Format: name|full_name (one per line)\n        local repo_pairs\n        repo_pairs=$(echo "$repos" | tr \'\\n\' \' \' | grep -oE \'"name"[[:space:]]*:[[:space:]]*"[^"]*"[^}]*"full_name"[[:space:]]*:[[:space:]]*"[^"]*"\' | \\\n            sed \'s/"name"[[:space:]]*:[[:space:]]*"//;s/"[^}]*"full_name"[[:space:]]*:[[:space:]]*"/|/;s/"$//\')\n        \n        if [ -z "$all_repos" ]; then\n            all_repos="$repo_pairs"\n        else\n            all_repos="$all_repos"$\'\\n\'"$repo_pairs"\n        fi\n        echo "   Found $count repositories on page $page" >&2\n        \n        if [ "$count" -lt "$per_page" ]; then\n            break\n        fi\n        \n        page=$((page + 1))\n        sleep "$GITHUB_RATE_LIMIT_DELAY"\n    done\n    \n    local total=0\n    [ -z "$all_repos" ] || total=$(printf \'%s\\n\' "$all_repos" | wc -l | tr -d \' \')\n    echo -e "${GREEN}\u2705 Total repositories found: $total${NC}" >&2\n    echo "" >&2\n    \n    echo "$all_repos"\n}\n\n# Search for package.json and lockfiles in a repository using tree API (works without token for public repos)\nsearch_package_json_in_repo_tree() {\n    local repo_full_name="$1"\n    local repo_name="$2"\n    \n    echo -e "   ${BLUE}Fetching repository tree...${NC}"\n    \n    # Get the default branch first, then pin its current commit: the tree\n    # and every file then come from the same snapshot, even if the branch\n    # moves while files are downloaded.\n    local repo_info\n    repo_info=$(github_request "https://api.github.com/repos/${repo_full_name}") || return 1\n    local default_branch ref branch_info\n    default_branch=$(json_get_value "$repo_info" "default_branch")\n    ref="$default_branch"\n    if branch_info=$(github_request "https://api.github.com/repos/${repo_full_name}/branches/${default_branch}" 2>/dev/null); then\n        local commit_sha\n        commit_sha=$(json_get_value "$(json_get_object "$branch_info" "commit")" "sha")\n        [[ "$commit_sha" =~ ^[0-9a-f]{40}$ ]] && ref="$commit_sha"\n    elif [ "$(json_get_value "$repo_info" "size")" = 0 ]; then\n        # No default branch and no content: a repository without any commit\n        # (GitHub answers 409 for its tree). "size" alone is not enough: it\n        # is computed asynchronously and reads 0 on fresh repositories.\n        echo "   \u2717 Empty repository: nothing to scan"\n        return 0\n    fi\n\n    # Get the full tree recursively\n    local tree_url="https://api.github.com/repos/${repo_full_name}/git/trees/${ref}?recursive=1"\n    local tree_response\n    tree_response=$(github_request "$tree_url") || return 1\n    if [[ "$tree_response" =~ \\"truncated\\"[[:space:]]*:[[:space:]]*true ]]; then\n        echo "Error: GitHub returned a truncated tree for $repo_full_name" >&2\n        return 1\n    fi\n    \n    # OPTIMIZED: Use grep/sed to extract paths directly instead of slow JSON parsing\n    # Extract all "path" values from the tree response and filter for target files\n    # This is MUCH faster than iterating with json_array_get for large trees\n    # Build the filename match regex from the ecosystem registry (+ package.json)\n    local scan_regex="" _name\n    for _name in $(ecosystem_scan_filenames); do\n        scan_regex="${scan_regex:+$scan_regex|}${_name//./\\\\.}"\n    done\n\n    local target_files\n    target_files=$(echo "$tree_response" | \\\n        grep -oE \'"path"[[:space:]]*:[[:space:]]*"[^"]*"\' | \\\n        sed \'s/"path"[[:space:]]*:[[:space:]]*"//;s/"$//\' | \\\n        grep -v \'node_modules\' | \\\n        grep -E "(^|/)(${scan_regex})\\$" || true)\n    \n    if [ -z "$target_files" ]; then\n        echo "   \u2717 No package.json or lockfiles found"\n        return 0\n    fi\n    \n    # Count files by type\n    local pkg_count=$(echo "$target_files" | grep -c "package.json" || true)\n    local lock_count=$(echo "$target_files" | grep -v "package.json" | grep -c "." || true)\n    echo "   Found $pkg_count package.json file(s) and $lock_count lockfile(s)"\n    \n    # Start from an empty repo directory, so files deleted upstream since a\n    # previous fetch are not scanned again. Only a directory this tool\n    # created (it holds the marker file) is cleared: a pre-existing folder of\n    # the same name, such as a local workspace, is never deleted.\n    local repo_dir="${GITHUB_OUTPUT_DIR}/${repo_name}"\n    local marker=".package-checker-fetch"\n    if [ -n "$repo_name" ] && [ "$repo_name" != . ] && [ "$repo_name" != .. ] && [ -f "$repo_dir/$marker" ]; then\n        rm -rf -- "$repo_dir"\n    fi\n    mkdir -p "$repo_dir"\n    printf \'%s\\n\' "$repo_full_name" > "$repo_dir/$marker"\n\n    # Fetch each file\n    while IFS= read -r file_path; do\n        [ -z "$file_path" ] && continue\n\n        local raw_url="https://raw.githubusercontent.com/${repo_full_name}/${ref}/${file_path}"\n        local file_content\n        file_content=$(curl -fsSL --connect-timeout 10 --max-time 60 \\\n            ${GITHUB_TOKEN:+-H "Authorization: Bearer $GITHUB_TOKEN"} \\\n            -H "User-Agent: package-checker-script" \\\n            "${raw_url// /%20}") || return 1\n        \n        # Save the file\n        local full_path="${repo_dir}/${file_path}"\n        local dir="${full_path%/*}"\n        mkdir -p "$dir"\n        \n        printf \'%s\\n\' "$file_content" > "$full_path" || return 1\n        \n        local file_name="${file_path##*/}"\n        if [ "$file_name" = "package.json" ]; then\n            echo -e "   ${GREEN}\u2713 Saved: ${repo_name}/${file_path}${NC}"\n        else\n            echo -e "   ${BLUE}\u2713 Saved: ${repo_name}/${file_path}${NC}"\n        fi\n    done <<< "$target_files"\n}\n\n# Create a GitHub issue with proper JSON escaping using jq\n# Arguments:\n#   $1 - repo_full_name (owner/repo)\n#   $2 - issue_title\n#   $3 - issue_body (markdown content)\n#   $4 - labels (comma-separated, optional)\ncreate_github_issue() {\n    local repo_full_name="$1"\n    local issue_title="$2"\n    local issue_body="$3"\n    local labels="${4:-security,vulnerability}"\n\n    if [ -z "$GITHUB_TOKEN" ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  Cannot create issue: GitHub token is required${NC}"\n        return 1\n    fi\n\n    # Check if jq is available for proper JSON escaping\n    if ! command -v jq &> /dev/null; then\n        echo -e "${RED}\u274C jq is required for creating issues. Please install it.${NC}"\n        return 1\n    fi\n\n    # Convert labels string to JSON array\n    local labels_json\n    labels_json=$(echo "$labels" | tr \',\' \'\\n\' | jq -R . | jq -s .)\n\n    # Create JSON payload with proper escaping using jq. The body goes\n    # through stdin, never the command line: a consolidated report can\n    # exceed the per-argument limit (128 KiB on Linux).\n    local json_payload\n    json_payload=$(printf \'%s\' "$issue_body" | jq -Rs \\\n        --arg title "$issue_title" \\\n        --argjson labels "$labels_json" \\\n        \'{title: $title, body: ., labels: $labels}\') || return 1\n\n    echo -e "${BLUE}\u{1F4DD} Creating issue on ${repo_full_name}...${NC}"\n\n    # Make API request to create issue\n    local response\n    response=$(curl -sS --connect-timeout 10 --max-time 60 -w "\\n%{http_code}" -X POST \\\n        -H "Authorization: Bearer $GITHUB_TOKEN" \\\n        -H "Accept: application/vnd.github+json" \\\n        -H "X-GitHub-Api-Version: 2022-11-28" \\\n        --data-binary @- \\\n        "https://api.github.com/repos/${repo_full_name}/issues" <<< "$json_payload") || return 1\n    local http_code="${response##*$\'\\n\'}"\n    response="${response%$\'\\n\'*}"\n\n    # Check if issue was created successfully\n    if [ "$http_code" = 201 ] && echo "$response" | grep -q \'"html_url"\'; then\n        local issue_url\n        issue_url=$(echo "$response" | jq -r \'.html_url // empty\' 2>/dev/null || echo "$response" | grep -o \'"html_url":"[^"]*"\' | head -1 | cut -d\'"\' -f4)\n        echo -e "${GREEN}\u2705 Issue created: ${issue_url}${NC}"\n        return 0\n    else\n        echo -e "${RED}\u274C Failed to create issue${NC}"\n        if echo "$response" | grep -q \'"message"\'; then\n            local error_msg\n            error_msg=$(echo "$response" | jq -r \'.message // empty\' 2>/dev/null || echo "$response" | grep -o \'"message":"[^"]*"\' | cut -d\'"\' -f4)\n            echo -e "${RED}   Error: ${error_msg}${NC}"\n        fi\n        return 1\n    fi\n}\n\n# Fetch all packages from GitHub organization or single repo\nfetch_github_packages() {\n    if [ -z "$GITHUB_ORG" ] && [ -z "$GITHUB_REPO" ]; then\n        echo -e "${RED}\u274C Error: GitHub organization or repository is required${NC}"\n        echo "   Use --github-org for an organization or --github-repo for a single repository"\n        return 1\n    fi\n    \n    # Token is required for organization scanning (repository listing)\n    if [ -n "$GITHUB_ORG" ] && [ -z "$GITHUB_TOKEN" ]; then\n        echo -e "${RED}\u274C Error: GitHub token is required for organization scanning${NC}"\n        echo "   Set GITHUB_TOKEN environment variable or use --github-token option"\n        return 1\n    fi\n    \n    echo ""\n    echo "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"\n    echo "\u2551       Fetching Packages from GitHub                \u2551"\n    echo "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"\n    echo ""\n    \n    if [ -z "$GITHUB_TOKEN" ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  No GitHub token provided - using unauthenticated requests (rate limited)${NC}"\n        echo ""\n    fi\n    \n    # Create output directory\n    mkdir -p "$GITHUB_OUTPUT_DIR"\n    \n    # Single repository mode\n    if [ -n "$GITHUB_REPO" ]; then\n        # Remove trailing slash if present\n        local repo_full_name="${GITHUB_REPO%/}"\n        local repo_name="${repo_full_name##*/}"\n        \n        echo -e "${BLUE}\u{1F50D} Fetching repository: $repo_full_name${NC}"\n        echo ""\n        echo -e "${BLUE}Processing: $repo_name${NC}"\n        \n        # Use tree API for single repo (works without token for public repos)\n        if ! search_package_json_in_repo_tree "$repo_full_name" "$repo_name"; then\n            echo -e "${RED}\u274C Failed to fetch repository: $repo_full_name${NC}"\n            return 1\n        fi\n    else\n        # Organization mode - use Tree API (less rate-limited than Search API)\n        local repos\n        repos=$(get_github_repositories) || return 1\n        \n        # OPTIMIZED: repos is now newline-separated "name|full_name" pairs\n        while IFS=\'|\' read -r repo_name repo_full_name; do\n            [ -z "$repo_name" ] && continue\n            \n            echo -e "${BLUE}Processing: $repo_name${NC}"\n            \n            # Use Tree API instead of Search API (much higher rate limit). An\n            # empty or unreadable repository must not stop the organization scan.\n            if ! search_package_json_in_repo_tree "$repo_full_name" "$repo_name"; then\n                echo -e "${YELLOW}\u26A0\uFE0F  Skipping $repo_full_name: unable to fetch its files${NC}"\n                GITHUB_FAILED_REPOS=$((GITHUB_FAILED_REPOS + 1))\n            fi\n            \n            sleep "$GITHUB_RATE_LIMIT_DELAY"\n        done <<< "$repos"\n    fi\n    \n    echo ""\n    echo "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550"\n    echo -e "${GREEN}\u2705 GitHub packages fetched to: $(realpath "$GITHUB_OUTPUT_DIR")${NC}"\n    echo "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550"\n    echo ""\n}\n\n# ============================================================================\n# GitHub issue reports (--create-multiple-issues / --create-single-issue)\n#\n# Findings (VULNERABLE_PACKAGES: "file|eco|name@version") are grouped by target\n# repository, then by "eco:name", then by version with the files using it.\n# Every advisory of a version comes from VULN_ADVISORIES (merged GHSA/OSV\n# records "severity;ghsa;cve;source;fix;id"). An issue whose exact title is\n# already open in the repository is not created again.\n# ============================================================================\nISSUE_REPO_LIST=()\ndeclare -A ISSUE_REPO_PKGS=()       # repo -> newline list of eco:name\ndeclare -A ISSUE_PKG_VERSIONS=()    # repo|eco:name -> newline list of versions\ndeclare -A ISSUE_VERSION_FILES=()   # repo|eco:name|version -> newline list of files\n\n# Repository (owner/repo) an issue about FILE belongs to: --github-repo, or in\n# organization mode the repository whose fetched copy holds the file\n# ($GITHUB_OUTPUT_DIR/<repo>/...). Sets ISSUE_REPO ("" when unknown).\nissue_repository_for() {\n    ISSUE_REPO=""\n    if [ -n "$GITHUB_REPO" ]; then\n        ISSUE_REPO="${GITHUB_REPO%/}"\n        return\n    fi\n    [ -n "$GITHUB_ORG" ] || return 0\n    local file="${1#./}" dir="${GITHUB_OUTPUT_DIR%/}/"\n    dir="${dir#./}"\n    [[ "$file" == "$dir"*/* ]] || return 0\n    file="${file#"$dir"}"\n    ISSUE_REPO="$GITHUB_ORG/${file%%/*}"\n}\n\ngroup_findings_for_issues() {\n    ISSUE_REPO_LIST=()\n    ISSUE_REPO_PKGS=()\n    ISSUE_PKG_VERSIONS=()\n    ISSUE_VERSION_FILES=()\n    local vuln file eco pv pkg ver pk vk unknown=0\n    for vuln in "${VULNERABLE_PACKAGES[@]}"; do\n        IFS=\'|\' read -r file eco pv <<< "$vuln"\n        issue_repository_for "$file"\n        if [ -z "$ISSUE_REPO" ]; then\n            unknown=$((unknown + 1))\n            continue\n        fi\n        pkg="$eco:${pv%@*}" ver="${pv##*@}"\n        pk="$ISSUE_REPO|$pkg" vk="$ISSUE_REPO|$pkg|$ver"\n        if [ -z "${ISSUE_REPO_PKGS[$ISSUE_REPO]+x}" ]; then\n            ISSUE_REPO_LIST+=("$ISSUE_REPO")\n            ISSUE_REPO_PKGS["$ISSUE_REPO"]=""\n        fi\n        if [ -z "${ISSUE_PKG_VERSIONS[$pk]+x}" ]; then\n            ISSUE_REPO_PKGS["$ISSUE_REPO"]+="$pkg"$\'\\n\'\n            ISSUE_PKG_VERSIONS["$pk"]=""\n        fi\n        if [ -z "${ISSUE_VERSION_FILES[$vk]+x}" ]; then\n            ISSUE_PKG_VERSIONS["$pk"]+="$ver"$\'\\n\'\n            ISSUE_VERSION_FILES["$vk"]="$file"\n        else\n            case $\'\\n\'"${ISSUE_VERSION_FILES[$vk]}"$\'\\n\' in\n                *$\'\\n\'"$file"$\'\\n\'*) ;;\n                *) ISSUE_VERSION_FILES["$vk"]+=$\'\\n\'"$file" ;;\n            esac\n        fi\n    done\n    if [ "$unknown" -gt 0 ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  ${unknown} finding(s) not attributable to a repository were left out (use --github-repo or --github-org)${NC}"\n    fi\n}\n\n# Distinct advisories of one package across its versions. Sets ADV_TOTAL,\n# ADV_MAX_RANK and ADV_SEV_COUNTS (index = severity rank, 0 = unknown).\npackage_advisory_stats() {\n    local pkg="$1" versions="$2" ver advisories advisory key\n    local severity ghsa cve source fix id\n    local -A seen=()\n    ADV_TOTAL=0 ADV_MAX_RANK=0\n    ADV_SEV_COUNTS=(0 0 0 0 0)\n    while IFS= read -r ver; do\n        [ -n "$ver" ] || continue\n        advisories="${VULN_ADVISORIES[$pkg@$ver]:-}"\n        while [ -n "$advisories" ]; do\n            advisory="${advisories%%||*}"\n            if [ "$advisory" = "$advisories" ]; then advisories=""; else advisories="${advisories#*||}"; fi\n            IFS=\';\' read -r severity ghsa cve source fix id <<< "$advisory"\n            key="${ghsa:-${cve:-${id:-$advisory}}}"\n            [ -z "${seen[$key]+x}" ] || continue\n            seen["$key"]=1\n            severity_rank "$severity"\n            ADV_SEV_COUNTS[SEV_RANK]=$(( ADV_SEV_COUNTS[SEV_RANK] + 1 ))\n            ADV_TOTAL=$((ADV_TOTAL + 1))\n            [ "$SEV_RANK" -le "$ADV_MAX_RANK" ] || ADV_MAX_RANK=$SEV_RANK\n        done\n    done <<< "$versions"\n}\n\n# Severity rank -> SEV_LABEL / SEV_EMOJI.\nseverity_label() {\n    case "$1" in\n        4) SEV_LABEL="CRITICAL" SEV_EMOJI="\u{1F534}" ;;\n        3) SEV_LABEL="HIGH" SEV_EMOJI="\u{1F7E0}" ;;\n        2) SEV_LABEL="MEDIUM" SEV_EMOJI="\u{1F7E1}" ;;\n        1) SEV_LABEL="LOW" SEV_EMOJI="\u{1F7E2}" ;;\n        *) SEV_LABEL="UNKNOWN" SEV_EMOJI="\u26AA" ;;\n    esac\n}\n\n# Markdown rows of the severity summary table.\nseverity_summary_rows() {\n    local rank rows=""\n    for rank in 4 3 2 1 0; do\n        [ "${ADV_SEV_COUNTS[$rank]}" -gt 0 ] || continue\n        severity_label "$rank"\n        rows+="| ${SEV_EMOJI} ${SEV_LABEL,,} | ${ADV_SEV_COUNTS[$rank]} |"$\'\\n\'\n    done\n    printf \'%s\' "$rows"\n}\n\n# Markdown table of the advisories of one package version.\nadvisory_table() {\n    local advisories="$1" advisory severity ghsa cve source fix id link\n    printf \'| Severity | Advisory | CVE | Source | Fixed in |\\n\'\n    printf \'|----------|----------|-----|--------|----------|\\n\'\n    while [ -n "$advisories" ]; do\n        advisory="${advisories%%||*}"\n        if [ "$advisory" = "$advisories" ]; then advisories=""; else advisories="${advisories#*||}"; fi\n        IFS=\';\' read -r severity ghsa cve source fix id <<< "$advisory"\n        severity_rank "$severity"\n        severity_label "$SEV_RANK"\n        link="-"\n        if [ -n "$ghsa" ]; then link="[${ghsa}](https://github.com/advisories/${ghsa})"\n        elif [ -n "$id" ]; then link="[${id}](https://osv.dev/vulnerability/${id})"\n        fi\n        printf \'| %s %s | %s | %s | %s | %s |\\n\' "$SEV_EMOJI" "${severity:-unknown}" "$link" \\\n            "${cve:+[${cve}](https://nvd.nist.gov/vuln/detail/${cve})}" "${source:--}" "${fix:--}"\n    done\n}\n\n# Titles of the open issues of a repository (one per line), so a run does not\n# file the same report twice. Empty when they cannot be listed.\nopen_issue_titles() {\n    local repo="$1" page response titles=""\n    for page in 1 2 3 4 5 6 7 8 9 10; do\n        response=$(github_request "https://api.github.com/repos/${repo}/issues?state=open&per_page=100&page=${page}" 2>/dev/null) || {\n            echo -e "${YELLOW}\u26A0\uFE0F  Unable to list open issues of $repo: duplicates are not checked${NC}" >&2\n            break\n        }\n        titles+=$(printf \'%s\' "$response" | jq -r \'.[] | select(.pull_request == null) | .title\' 2>/dev/null)$\'\\n\'\n        [ "$(printf \'%s\' "$response" | jq \'length\' 2>/dev/null)" = 100 ] || break\n    done\n    printf \'%s\' "$titles"\n}\n\n# Create an issue unless one with the same title is open (titles in $4).\ncreate_issue_once() {\n    local repo="$1" title="$2" body="$3" open_titles="$4"\n    if printf \'%s\\n\' "$open_titles" | grep -qxF -- "$title"; then\n        echo -e "${BLUE}\u2139\uFE0F  Already open on ${repo}: ${title}${NC}"\n        return 2\n    fi\n    create_github_issue "$repo" "$title" "$body" "security,vulnerability,dependencies"\n}\n\n# Body of the issue about one package (eco:name) in one repository.\npackage_issue_body() {\n    local repo="$1" pkg="$2" versions="$3"\n    local eco="${pkg%%:*}" name="${pkg#*:}" ver file body\n    body="## \u{1F512} Security Vulnerabilities in \\`${name}\\` (${eco})"$\'\\n\\n\'\n    body+="### \u{1F4CA} Summary"$\'\\n\\n\'"| Metric | Count |"$\'\\n\'"|--------|-------|"$\'\\n\'\n    body+="| **Total Vulnerabilities** | ${ADV_TOTAL} |"$\'\\n\'"$(severity_summary_rows)"$\'\\n\\n\'\n    body+="---"$\'\\n\\n\'"### \u{1F50D} Vulnerability Details"$\'\\n\\n\'\n    while IFS= read -r ver; do\n        [ -n "$ver" ] || continue\n        body+="#### Version \\`${ver}\\`"$\'\\n\\n\'\n        body+="$(advisory_table "${VULN_ADVISORIES[$pkg@$ver]:-}")"$\'\\n\\n\'\n        body+="<details>"$\'\\n\'"<summary>\u{1F4C1} Affected files</summary>"$\'\\n\\n\'\n        while IFS= read -r file; do\n            [ -n "$file" ] && body+="- \\`${file}\\`"$\'\\n\'\n        done <<< "${ISSUE_VERSION_FILES[$repo|$pkg|$ver]}"\n        body+=$\'\\n\'"</details>"$\'\\n\\n\'\n    done <<< "$versions"\n    body+="### \u2705 Recommendations"$\'\\n\\n\'\n    body+="1. **Update the package** to the latest patched version:"$\'\\n\'"   \\`\\`\\`bash"$\'\\n\'\n    body+="$(fix_commands_for_eco "$eco" "$name" "   ")"$\'\\n\'"   \\`\\`\\`"$\'\\n\\n\'\n    body+="2. **Check for breaking changes** before updating major versions"$\'\\n\\n\'\n    body+="3. **Run a security audit** after updating:"$\'\\n\'"   \\`\\`\\`bash"$\'\\n\'\n    body+="   $(verify_command_for_eco "$eco")"$\'\\n\'"   \\`\\`\\`"$\'\\n\\n\'\n    body+="4. **Review the advisories** linked above for specific remediation steps"$\'\\n\\n\'\n    body+="---"$\'\\n\\n\'"*\u{1F916} Generated by [package-checker.sh](https://github.com/maxgfr/package-checker.sh)*"\n    printf \'%s\' "$body"\n}\n\n# One issue per vulnerable package, in the repository that uses it.\ncreate_package_issues() {\n    local repo pkg versions title open_titles created=0 total=0 status\n    group_findings_for_issues\n    for repo in "${ISSUE_REPO_LIST[@]}"; do\n        open_titles=$(open_issue_titles "$repo")\n        while IFS= read -r pkg; do\n            [ -n "$pkg" ] || continue\n            total=$((total + 1))\n            versions="${ISSUE_PKG_VERSIONS[$repo|$pkg]}"\n            package_advisory_stats "$pkg" "$versions"\n            severity_label "$ADV_MAX_RANK"\n            title="${SEV_EMOJI} Security: ${ADV_TOTAL} vulnerabilit$([ "$ADV_TOTAL" -eq 1 ] && echo y || echo ies) in \\`${pkg#*:}\\`"\n            [ "${pkg%%:*}" = npm ] || title+=" (${pkg%%:*})"\n            [ "$ADV_MAX_RANK" -eq 0 ] || title+=" [${SEV_LABEL}]"\n            echo -e "${BLUE}\u{1F4E6} ${pkg#*:}${NC} (${ADV_TOTAL} vulnerability/ies) \u2192 ${repo}"\n            status=0\n            create_issue_once "$repo" "$title" "$(package_issue_body "$repo" "$pkg" "$versions")" "$open_titles" || status=$?\n            [ "$status" -ne 0 ] || created=$((created + 1))\n            sleep 1  # Rate limiting\n            echo ""\n        done <<< "${ISSUE_REPO_PKGS[$repo]}"\n    done\n    echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n    echo -e "${GREEN}\u2705 Created ${created} issue(s) for ${total} package(s)${NC}"\n    echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n}\n\n# One consolidated report per repository.\ncreate_consolidated_issues() {\n    local repo pkg versions ver file title body details ecos rank status\n    local total pkg_count open_titles\n    local -a counts\n    group_findings_for_issues\n    for repo in "${ISSUE_REPO_LIST[@]}"; do\n        total=0 pkg_count=0 details="" ecos=""\n        counts=(0 0 0 0 0)\n        local max_rank=0\n        while IFS= read -r pkg; do\n            [ -n "$pkg" ] || continue\n            pkg_count=$((pkg_count + 1))\n            versions="${ISSUE_PKG_VERSIONS[$repo|$pkg]}"\n            package_advisory_stats "$pkg" "$versions"\n            total=$((total + ADV_TOTAL))\n            for rank in 0 1 2 3 4; do counts[rank]=$(( counts[rank] + ADV_SEV_COUNTS[rank] )); done\n            [ "$ADV_MAX_RANK" -le "$max_rank" ] || max_rank=$ADV_MAX_RANK\n            case " $ecos " in *" ${pkg%%:*} "*) ;; *) ecos+=" ${pkg%%:*}" ;; esac\n            severity_label "$ADV_MAX_RANK"\n            details+="<details>"$\'\\n\'"<summary>${SEV_EMOJI} <strong>${pkg#*:}</strong> (${pkg%%:*}, ${ADV_TOTAL} vulnerabilities)</summary>"$\'\\n\\n\'\n            while IFS= read -r ver; do\n                [ -n "$ver" ] || continue\n                details+="**Version \\`${ver}\\`**"$\'\\n\\n\'"$(advisory_table "${VULN_ADVISORIES[$pkg@$ver]:-}")"$\'\\n\\n\'\n                while IFS= read -r file; do\n                    [ -n "$file" ] && details+="- \\`${file}\\`"$\'\\n\'\n                done <<< "${ISSUE_VERSION_FILES[$repo|$pkg|$ver]}"\n                details+=$\'\\n\'\n            done <<< "$versions"\n            details+="</details>"$\'\\n\\n\'\n        done <<< "${ISSUE_REPO_PKGS[$repo]}"\n\n        severity_label "$max_rank"\n        title="${SEV_EMOJI} Security Report: ${total} vulnerabilities in ${pkg_count} packages [${SEV_LABEL}]"\n        ADV_SEV_COUNTS=("${counts[@]}")\n        body="## \u{1F512} Security Vulnerability Report"$\'\\n\\n\'\n        body+="This issue contains a consolidated report of all security vulnerabilities detected in this repository."$\'\\n\\n\'\n        body+="### \u{1F4CA} Global Summary"$\'\\n\\n\'"| Metric | Count |"$\'\\n\'"|--------|-------|"$\'\\n\'\n        body+="| **Total Vulnerabilities** | ${total} |"$\'\\n\'"| **Affected Packages** | ${pkg_count} |"$\'\\n\'\n        body+="$(severity_summary_rows)"$\'\\n\\n\'"---"$\'\\n\\n\'"### \u{1F4E6} Vulnerable Packages"$\'\\n\\n\'"$details"\n        body+="---"$\'\\n\\n\'"### \u2705 Recommended Actions"$\'\\n\\n\'\n        body+="1. **Review each vulnerability** using the advisory links above."$\'\\n\'\n        body+="2. **Update the affected packages** to their latest patched versions. Commands per detected ecosystem:"$\'\\n\\n\'\n        local eco\n        for eco in $ecos; do\n            body+="#### $(eco_display_name "$eco")"$\'\\n\\n\'"\\`\\`\\`bash"$\'\\n\'\n            body+="$(fix_commands_for_eco "$eco" "<package-name>")"$\'\\n\'"\\`\\`\\`"$\'\\n\\n\'\n            body+="Verify: \\`$(verify_command_for_eco "$eco")\\`"$\'\\n\\n\'\n        done\n        body+="---"$\'\\n\\n\'"*\u{1F916} Generated by [package-checker.sh](https://github.com/maxgfr/package-checker.sh)*"\n\n        echo -e "${BLUE}Creating consolidated security report on ${repo}...${NC}"\n        open_titles=$(open_issue_titles "$repo")\n        status=0\n        create_issue_once "$repo" "$title" "$body" "$open_titles" || status=$?\n        echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n        case "$status" in\n            0) echo -e "${GREEN}\u2705 Created 1 consolidated issue with ${total} vulnerabilities${NC}" ;;\n            2) ;;\n            *) echo -e "${RED}\u274C Failed to create consolidated issue${NC}" ;;\n        esac\n        echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n    done\n}\n# CSV source parser: generates lookup-table eval statements in a single awk\n# pass. Handles quoted fields, multi-line quoted values, Windows line endings\n# and version ranges. Args: FILE [COLUMNS], COLUMNS being "pkg,version" as\n# 1-based indexes ("1,2") or header names ("name,versions").\n#\n# The first line is a header when columns are given by name, or when its\n# version field does not look like a version or a range; a headerless file\n# therefore keeps its first row.\nparse_csv_to_lookup_eval() {\n    local file="$1" columns="${2:-}"\n    local col1="${columns%%,*}" col2=""\n    [[ "$columns" == *,* ]] && col2="${columns#*,}" && col2="${col2%%,*}"\n    col1="${col1#"${col1%%[![:space:]]*}"}"; col1="${col1%"${col1##*[![:space:]]}"}"\n    col2="${col2#"${col2%%[![:space:]]*}"}"; col2="${col2%"${col2##*[![:space:]]}"}"\n\n    tr -d \'\\r\' < "$file" | awk -v col1="$col1" -v col2="$col2" "$AWK_FEED_LIB"\'\n    BEGIN {\n        pkg_col = 1\n        ver_col = 2\n        by_name = (col1 != "" && col2 != "" && !(col1 ~ /^[0-9]+$/ && col2 ~ /^[0-9]+$/))\n        if (col1 ~ /^[0-9]+$/ && col2 ~ /^[0-9]+$/) {\n            pkg_col = int(col1)\n            ver_col = int(col2)\n        }\n    }\n\n    function meta(name) {\n        return (name in meta_col) ? fields[meta_col[name]] : ""\n    }\n\n    function trim(s) {\n        gsub(/^[[:space:]"]+/, "", s)\n        gsub(/[[:space:]"]+$/, "", s)\n        return s\n    }\n\n    # RFC 4180: a quote opens a quoted field only at the start of a field\n    # (after optional spaces); elsewhere it is a literal character, so a stray\n    # quote such as 5" in a description cannot swallow the rest of the file.\n    function parse_csv_line(line, f,    i, n, in_quote, field, c, at_start) {\n        n = 1\n        field = ""\n        in_quote = 0\n        at_start = 1\n        for (i = 1; i <= length(line); i++) {\n            c = substr(line, i, 1)\n            if (in_quote) {\n                if (c == "\\"") {\n                    if (substr(line, i+1, 1) == "\\"") { field = field "\\""; i++ }\n                    else in_quote = 0\n                } else field = field c\n            } else if (c == "\\"" && at_start) {\n                in_quote = 1\n                at_start = 0\n            } else if (c == ",") {\n                f[n] = trim(field)\n                n++\n                field = ""\n                at_start = 1\n            } else {\n                field = field c\n                if (c !~ /[[:space:]]/) at_start = 0\n            }\n        }\n        f[n] = trim(field)\n        QUOTE_OPEN = in_quote\n        return n\n    }\n\n    # A UTF-8 byte order mark (Excel "CSV UTF-8") is not part of the header.\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    {\n        if (pending_line != "") {\n            current_line = pending_line " " $0\n            pending_line = ""\n        } else {\n            current_line = $0\n        }\n\n        if (current_line == "") next\n\n        # A quoted field still open at the end of the line continues on the next.\n        field_count = parse_csv_line(current_line, fields)\n        if (QUOTE_OPEN) {\n            pending_line = current_line\n            next\n        }\n\n        if (!header_checked) {\n            header_checked = 1\n            if (by_name || (fields[ver_col] !~ /^([<>=~^*(]|[vV]?[0-9])/ && substr(fields[ver_col], 1, 1) != "[")) {\n                # Header row: locate the named columns, including the\n                # optional advisory metadata (severity, ghsa, cve, source).\n                for (i = 1; i <= field_count; i++) {\n                    lower_field = tolower(fields[i])\n                    if (by_name && lower_field == tolower(col1)) pkg_col = i\n                    if (by_name && lower_field == tolower(col2)) ver_col = i\n                    if (lower_field ~ /^(severity|ghsa|cve|source)$/) { meta_col[lower_field] = i; has_meta = 1 }\n                    if (lower_field == tolower(col1)) found1 = 1\n                    if (lower_field == tolower(col2)) found2 = 1\n                }\n                # Named columns that the header lacks would silently load\n                # other columns as package names and versions.\n                if (by_name && !(found1 && found2)) {\n                    printf "Error: CSV header has no column named %s\\n", (found1 ? col2 : col1) > "/dev/stderr"\n                    failed = 1\n                    exit 1\n                }\n                next\n            }\n        }\n\n        pkg = fields[pkg_col]\n        ver = fields[ver_col]\n        if (pkg == "" || ver == "") next\n\n        record = ""\n        if (has_meta) {\n            ranged = range_like(ver)\n            record = tolower(meta("severity")) ";" meta("ghsa") ";" meta("cve") ";" meta("source") ";" (ranged ? range_fix(ver) : "") ";"\n        }\n        # CSV carries no ecosystem info -> wildcard namespace "*:"\n        add_entry("*:" loose_name(pkg), ver, record, range_like(ver))\n    }\n\n    END {\n        if (failed) exit 1\n        if (pending_line != "") {\n            print "Error: unterminated quoted field in CSV source" > "/dev/stderr"\n            exit 1\n        }\n        emit_lookup()\n    }\n    \'\n}\n# Awk helpers shared by every feed parser (purl, SARIF, CycloneDX, Trivy).\n# Prepended to each awk program so canonicalization cannot drift between them.\n#   escape_sq(s)            quote s for a single-quoted bash eval string\n#   canon_purl_name(e, n)   canonical package name for purl type e; MUST match\n#                           the feed emission (src/60-feeds.sh) and the lockfile\n#                           parsers (src/50-ecosystems/)\n#   purl_split(p)           split "pkg:type/name@version?q" into PURL_TYPE,\n#                           PURL_NAME, PURL_VERSION (both percent-decoded) and\n#                           PURL_QUERY; returns 0 when p is not a versioned purl\n#   loose_name(n)           key of a name in the wildcard "*:" namespace\n#   add_entry / emit_lookup collect rows, then print the bash eval statements\nAWK_FEED_LIB=\'\nfunction escape_sq(s) {\n    gsub(/\'\\\'\'/, "\'\\\'\'\\\\\'\\\'\'\'\\\'\'", s)\n    return s\n}\nfunction canon_purl_name(eco, name,   lo, cnt, parts) {\n    if (eco == "pypi") {\n        # PEP 503: lowercase, collapse runs of - _ . to a single -\n        lo = tolower(name)\n        gsub(/[-_.]+/, "-", lo)\n        return lo\n    } else if (eco == "maven") {\n        # groupId/artifactId -> groupId:artifactId (last two path components)\n        if (index(name, ":") > 0) return name\n        cnt = split(name, parts, "/")\n        if (cnt >= 2) return parts[cnt-1] ":" parts[cnt]\n        return name\n    } else if (eco == "composer" || eco == "githubactions" || eco == "nuget") {\n        return tolower(name)\n    } else if (eco == "swift") {\n        lo = name\n        sub(/^[A-Za-z][A-Za-z0-9+.-]*:\\/\\//, "", lo)\n        sub(/\\/+$/, "", lo)\n        sub(/\\.git$/, "", lo)\n        return tolower(lo)\n    }\n    # npm, golang, cargo, gem, pub, hex and unknown types: name as-is\n    return name\n}\nfunction purl_split(p,   main_part, q, te, at) {\n    PURL_TYPE = PURL_NAME = PURL_VERSION = PURL_QUERY = ""\n    if (substr(p, 1, 4) != "pkg:") return 0\n    te = index(p, "/")\n    if (te <= 5) return 0\n    # A "#subpath" names a file inside the package, never part of its version.\n    q = index(p, "#")\n    if (q > 0) p = substr(p, 1, q - 1)\n    main_part = p\n    q = index(p, "?")\n    # The query string may itself contain "@": split it off first.\n    if (q > 0) { main_part = substr(p, 1, q - 1); PURL_QUERY = substr(p, q + 1) }\n    # The purl type is case-insensitive (pkg:NPM/x is pkg:npm/x).\n    PURL_TYPE = tolower(substr(main_part, 5, te - 5))\n    # Name/version split at the LAST "@": scoped names start with "@".\n    if (!match(main_part, /@[^@]*$/)) return 0\n    at = RSTART\n    if (at <= te + 1) return 0\n    PURL_NAME = substr(main_part, te + 1, at - te - 1)\n    PURL_VERSION = substr(main_part, at + 1)\n    if (index(main_part, "\\"")) {\n        gsub(/"/, "", PURL_NAME)\n        gsub(/"/, "", PURL_VERSION)\n    }\n    PURL_NAME = pct_decode(PURL_NAME)\n    PURL_VERSION = pct_decode(PURL_VERSION)\n    return PURL_NAME != "" && PURL_VERSION != ""\n}\n# Decode %XX escapes (%40 "@", %2F "/", %2B "+" in v1.2.3%2Bincompatible).\nfunction pct_decode(s,   out, i, c, hex) {\n    if (!index(s, "%")) return s\n    out = ""\n    for (i = 1; i <= length(s); i++) {\n        c = substr(s, i, 1)\n        hex = tolower(substr(s, i + 1, 2))\n        if (c == "%" && hex ~ /^[0-9a-f][0-9a-f]$/) {\n            out = out sprintf("%c", (index("0123456789abcdef", substr(hex, 1, 1)) - 1) * 16 + index("0123456789abcdef", substr(hex, 2, 1)) - 1)\n            i += 2\n        } else out = out c\n    }\n    return out\n}\n# Loose form of a name without ecosystem (wildcard "*:" keys of CSV, JSON and\n# report sources): lowercase, runs of - _ . collapsed to "-". Must match the\n# probe in check_vulnerability.\nfunction loose_name(n) {\n    n = tolower(n)\n    gsub(/[-_.]+/, "-", n)\n    return n\n}\n# Register one advisory row. key = "eco:name", version = exact version or\n# range, record = "severity;ghsa;cve;source;fix;id" (id: the advisory id when\n# it is neither a GHSA nor a CVE, e.g. PYSEC-, GO-, RUSTSEC-, MAL-). Ranges are newline-separated\n# (they may contain "||"), exact versions "|"-separated. Every distinct record\n# is kept, even when two advisories share the same range.\nfunction add_entry(key, version, record, is_range,   meta_key, rk, vk) {\n    meta_key = key (is_range ? ":" : "@") version\n    rk = meta_key SUBSEP record\n    # A record without any metadata adds nothing to the default one.\n    if (record !~ /^;*$/ && !(rk in seen_records)) {\n        seen_records[rk] = 1\n        records[meta_key] = records[meta_key] record "\\n"\n    }\n    vk = key SUBSEP version\n    if (vk in seen_versions) return\n    seen_versions[vk] = 1\n    if (!(key in seen_keys)) { seen_keys[key] = 1; key_count++ }\n    if (is_range) {\n        # Explicit if/else: mawk creates the assignment target before the\n        # "in" test of a ternary, which then always holds (leading "|").\n        if (key in pkg_ranges) pkg_ranges[key] = pkg_ranges[key] "\\n" version\n        else pkg_ranges[key] = version\n    } else {\n        if (key in pkg_versions) pkg_versions[key] = pkg_versions[key] "|" version\n        else pkg_versions[key] = version\n    }\n}\n# True when a version string is a range: operators, spaces, wildcards\n# (*, 1.x), OR-alternatives (| and ||) or Maven/NuGet intervals ([1.0,2.0)).\nfunction range_like(v) {\n    return (v ~ /[[:space:]<>=,^~*|]/ || index(v, "[") || index(v, "]") || v ~ /\\.[xX](\\.|$)/ || v ~ /^\\(/)\n}\n# Known fixed version of a single range: its exclusive upper bound. An\n# inclusive upper bound (<=) is still affected, and an OR-range (or an\n# interval list) is ambiguous.\nfunction range_fix(version) {\n    if (version !~ /\\||\\[|\\(/ && match(version, /<[0-9][^[:space:],]*/))\n        return substr(version, RSTART + 1, RLENGTH - 1)\n    return ""\n}\n# Print the counts first (FEED_PKG_COUNT: packages kept, FEED_RAW_COUNT:\n# entries read before pre-filtering), then the eval statements. Appends ("+=")\n# merge with tables filled by earlier sources; single quotes keep the data\n# literal through eval.\nfunction emit_lookup(   pkg, key) {\n    printf "FEED_PKG_COUNT=%d\\nFEED_RAW_COUNT=%d\\n", key_count, (raw_count != "" ? raw_count : key_count)\n    for (pkg in pkg_versions)\n        printf "VULN_EXACT_LOOKUP[\'\\\'\'%s\'\\\'\']+=\'\\\'\'|%s\'\\\'\'\\n", escape_sq(pkg), escape_sq(pkg_versions[pkg])\n    for (pkg in pkg_ranges)\n        printf "VULN_RANGE_LOOKUP[\'\\\'\'%s\'\\\'\']+=\'\\\'\'%s\\n\'\\\'\'\\n", escape_sq(pkg), escape_sq(pkg_ranges[pkg])\n    for (key in records)\n        printf "VULN_RECORDS[\'\\\'\'%s\'\\\'\']+=\'\\\'\'%s\'\\\'\'\\n", escape_sq(key), escape_sq(records[key])\n}\n\'\n\n# Parse a PURL feed file into lookup-table eval statements.\n# Line format: pkg:type/namespace/name@version-or-range?severity=..&ghsa=..\n# Example: pkg:npm/lodash@4.17.21\n# Example with version range: pkg:npm/express@>=4.0.0 <4.17.0\n#\n# Pre-filtering: with PREFILTER_TOKENS_FILE set (see build_project_tokens), an\n# entry is kept only when the last segment of its name (after the last "/" or\n# ":"), lowercased with runs of - _ . collapsed to "-", is one of the project\n# tokens. That segment is part of every way a package is written in a\n# lockfile (npm scope/name, PEP 503 names, Maven group:artifact, Go module\n# paths, Swift repository URLs, NuGet ids...), so no relevant entry is lost\n# while a 300k-line feed shrinks to the few entries the project can match.\nparse_purl_to_lookup_eval() {\n    local file="$1"\n    awk -v tokens_file="${PREFILTER_TOKENS_FILE:-}" "$AWK_FEED_LIB"\'\n    BEGIN {\n        raw_count = 0\n        filtering = (tokens_file != "")\n        if (filtering) while ((getline t < tokens_file) > 0) wanted[t] = 1\n    }\n    function parse_query_params(query_string, params,   n, i, pairs, eq, value) {\n        delete params\n        if (query_string == "") return\n        n = split(query_string, pairs, "&")\n        for (i = 1; i <= n; i++) {\n            eq = index(pairs[i], "=")\n            # Values are percent-decoded; ";" separates the fields of an\n            # advisory record, so it cannot survive inside one.\n            if (eq > 0) {\n                value = pct_decode(substr(pairs[i], eq + 1))\n                gsub(/;/, ",", value)\n                params[tolower(substr(pairs[i], 1, eq - 1))] = value\n            }\n        }\n    }\n\n    {\n        # Fast path for generated feeds: one bare purl per line. Anything else\n        # (indentation, CRLF, comments, blank lines) goes through a trim.\n        line = $0\n        last = substr(line, length(line))\n        if (substr(line, 1, 4) != "pkg:" || last == "\\r" || last == " " || last == "\\t") {\n            gsub(/^[[:space:]]+|[[:space:]\\r]+$/, "", line)\n            if (substr(line, 1, 4) != "pkg:") next\n        }\n        raw_count++\n        if (filtering) {\n            # Last segment of the name, without decoding the whole purl.\n            q = index(line, "?")\n            segment = q ? substr(line, 1, q - 1) : line\n            sub(/@[^@]*$/, "", segment)\n            segment = pct_decode(segment)\n            sub(/\\/+$/, "", segment)\n            sub(/^.*[\\/:]/, "", segment)\n            segment = tolower(segment)\n            gsub(/[-_.]+/, "-", segment)\n            if (!(segment in wanted)) next\n        }\n        if (!purl_split(line)) next\n        canon_key = PURL_TYPE ":" canon_purl_name(PURL_TYPE, PURL_NAME)\n        version = PURL_VERSION\n        parse_query_params(PURL_QUERY, params)\n\n        # Ranges contain operators, spaces, wildcards or OR-alternatives.\n        is_range = range_like(version)\n\n        fix = is_range ? range_fix(version) : ""\n        if ("fixed" in params) fix = params["fixed"]\n        record = params["severity"] ";" params["ghsa"] ";" params["cve"] ";" params["source"] ";" fix ";" params["id"]\n        add_entry(canon_key, version, record, is_range)\n    }\n\n    END { emit_lookup() }\n    \' "$file"\n}\n# JSON-shaped source importers: SARIF, CycloneDX SBOM, Trivy JSON and the\n# native JSON source format.\n#\n# Every importer reads json_structural_lines output (one JSON token group per\n# record), so pretty-printed and minified reports parse identically, and walks\n# it with the path tracker below. Each finding becomes an exact-version entry\n# plus an advisory record, through the same add_entry/emit_lookup helpers as\n# the purl parser (AWK_FEED_LIB in src/31-parsers-purl.sh).\n\n# Awk JSON path tracker over json_structural_lines records. jp_step(line)\n# classifies the record (JP_EVENT = open | close | scalar), keeps a stack of\n# container names ("#" for an array element) and exposes JP_PATH, e.g.\n# "/#/runs/#/results/#" inside a SARIF result. For a scalar, JP_KEY/JP_VAL hold\n# the key and the unquoted value (escapes such as \\n stay literal, except "\\/"\n# which is read as "/"). On close, JP_PATH is the path of the container that\n# just closed and jp_depth + 1 its depth.\nAWK_JSON_PATH=\'\nfunction jp_step(line,   k, rest) {\n    gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)\n    JP_KEY = JP_VAL = ""\n    if (line == "}" || line == "]") {\n        JP_EVENT = "close"\n        JP_PATH = jp_path()\n        if (jp_depth > 0) jp_depth--\n        return\n    }\n    k = "#"\n    rest = line\n    if (match(line, /^"([^"\\\\]|\\\\.)*"[[:space:]]*:[[:space:]]*/)) {\n        k = substr(line, 1, RLENGTH)\n        sub(/"[[:space:]]*:[[:space:]]*$/, "", k)\n        k = substr(k, 2)\n        rest = substr(line, RLENGTH + 1)\n        # "\\/" is an optional JSON escape of "/" (purls, scoped names).\n        if (index(k, "\\\\/")) gsub(/\\\\\\//, "/", k)\n    }\n    if (rest == "{" || rest == "[") {\n        JP_EVENT = "open"\n        jp_stack[++jp_depth] = k\n        JP_PATH = jp_path()\n        return\n    }\n    JP_EVENT = "scalar"\n    JP_PATH = jp_path()\n    JP_KEY = k\n    if (rest ~ /^".*"$/) {\n        rest = substr(rest, 2, length(rest) - 2)\n        if (index(rest, "\\\\/")) gsub(/\\\\\\//, "/", rest)\n    }\n    JP_VAL = rest\n}\nfunction jp_path(   i, p) {\n    p = ""\n    for (i = 1; i <= jp_depth; i++) p = p "/" jp_stack[i]\n    return p\n}\n# Advisory identifier -> ghsa/cve fields of a record.\nfunction id_fields(id) {\n    ID_GHSA = ID_CVE = ID_OTHER = ""\n    if (id ~ /^GHSA-/) ID_GHSA = id\n    else if (id ~ /^CVE-/) ID_CVE = id\n    else ID_OTHER = id\n}\n# Register a finding: namespaced key from a purl when available, else the\n# wildcard namespace "*:" (the report carries no ecosystem).\nfunction add_finding(purl, name, version, severity, id, source,   key) {\n    key = ""\n    if (purl != "" && purl_split(purl)) {\n        key = PURL_TYPE ":" canon_purl_name(PURL_TYPE, PURL_NAME)\n        if (version == "") version = PURL_VERSION\n    } else if (name != "") {\n        key = "*:" loose_name(name)\n    }\n    if (key == "" || version == "") return\n    id_fields(id)\n    add_entry(key, version, tolower(severity) ";" ID_GHSA ";" ID_CVE ";" source ";;" ID_OTHER, 0)\n}\n\'\n\n# Parse a SARIF report (Trivy, Grype, ...). Each runs[].results[] entry is one\n# finding. The package comes from the Trivy-style message\n# ("Package: next\\nInstalled Version: 16.0.3\\n...") or, failing that, from a\n# location message "path: name@version" (split at the LAST "@" so scoped names\n# survive). ruleId carries the advisory identifier.\nparse_sarif_to_lookup_eval() {\n    json_structural_lines "$1" | awk "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n    function reset() { rule = level = pkg = ver = loc_pkg = loc_ver = sev = "" }\n    function field(text, label,   s) {\n        s = index(text, label)\n        if (s == 0) return ""\n        text = substr(text, s + length(label))\n        sub(/\\\\n.*/, "", text)\n        gsub(/^[[:space:]]+|[[:space:]]+$/, "", text)\n        return text\n    }\n    BEGIN { reset() }\n    {\n        jp_step($0)\n        if (JP_EVENT == "scalar") {\n            if (JP_PATH ~ /\\/results\\/#$/ && JP_KEY == "ruleId") rule = JP_VAL\n            else if (JP_PATH ~ /\\/results\\/#$/ && JP_KEY == "level") level = JP_VAL\n            else if (JP_PATH ~ /\\/results\\/#\\/message$/ && JP_KEY == "text") {\n                pkg = field(JP_VAL, "Package: ")\n                ver = field(JP_VAL, "Installed Version: ")\n                sev = field(JP_VAL, "Severity: ")\n            } else if (JP_PATH ~ /\\/locations\\/#\\/(physicalLocation\\/)?message$/ && JP_KEY == "text" && loc_pkg == "") {\n                t = JP_VAL\n                sub(/^.*:[[:space:]]+/, "", t)\n                at = 0\n                for (i = length(t); i > 1; i--) if (substr(t, i, 1) == "@") { at = i; break }\n                if (at > 1) { loc_pkg = substr(t, 1, at - 1); loc_ver = substr(t, at + 1) }\n            }\n        } else if (JP_EVENT == "close" && JP_PATH ~ /\\/results\\/#$/) {\n            if (pkg == "" || ver == "") { pkg = loc_pkg; ver = loc_ver }\n            if (sev == "") sev = (level == "error" ? "high" : (level == "warning" ? "medium" : ""))\n            add_finding("", pkg, ver, sev, rule, "sarif")\n            reset()\n        }\n    }\n    END { emit_lookup() }\n    \'\n}\n\n# Parse a CycloneDX SBOM. Each vulnerabilities[] entry lists affects[].ref,\n# which is either a purl or a bom-ref resolved through components[] (at any\n# nesting depth). Explicit affects[].versions[] with status "affected" are\n# added too. References are resolved at the end, since components may follow\n# the vulnerabilities.\nparse_sbom_to_lookup_eval() {\n    json_structural_lines "$1" | awk "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n    {\n        jp_step($0)\n        if (JP_EVENT == "scalar") {\n            if (JP_PATH ~ /\\/components\\/#$/) {\n                # Kept per depth: a component may hold nested components,\n                # whose fields must not replace (or reset) its own.\n                if (JP_KEY == "bom-ref") comp_ref[jp_depth] = JP_VAL\n                else if (JP_KEY == "purl") comp_purl[jp_depth] = JP_VAL\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#$/ && JP_KEY == "id") {\n                vid = JP_VAL\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#\\/ratings\\/#$/ && JP_KEY == "severity" && vsev == "") {\n                vsev = JP_VAL\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#\\/affects\\/#$/ && JP_KEY == "ref") {\n                aref = JP_VAL\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#\\/affects\\/#\\/versions\\/#$/) {\n                if (JP_KEY == "version") aver = JP_VAL\n                else if (JP_KEY == "status") astatus = JP_VAL\n            }\n        } else if (JP_EVENT == "close") {\n            if (JP_PATH ~ /\\/components\\/#$/) {\n                d = jp_depth + 1\n                if (comp_ref[d] != "" && comp_purl[d] != "") purl_of[comp_ref[d]] = comp_purl[d]\n                delete comp_ref[d]; delete comp_purl[d]\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#\\/affects\\/#\\/versions\\/#$/) {\n                if (aver != "" && (astatus == "" || astatus == "affected")) aextra = aextra " " aver\n                aver = astatus = ""\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#\\/affects\\/#$/) {\n                # The entry is complete: its keys may come in any order.\n                if (aref != "") { refs[++nrefs] = aref; extra[nrefs] = aextra }\n                aref = aextra = ""\n            } else if (JP_PATH ~ /\\/vulnerabilities\\/#$/) {\n                for (r = 1; r <= nrefs; r++) {\n                    n = ++nfind\n                    find_ref[n] = refs[r]; find_id[n] = vid; find_sev[n] = vsev\n                    find_extra[n] = extra[r]\n                }\n                delete refs; delete extra\n                nrefs = 0; vid = vsev = ""\n            }\n        }\n    }\n    END {\n        for (n = 1; n <= nfind; n++) {\n            p = find_ref[n]\n            if (p !~ /^pkg:/ && (p in purl_of)) p = purl_of[p]\n            if (p !~ /^pkg:/) continue\n            add_finding(p, "", "", find_sev[n], find_id[n], "cyclonedx")\n            cnt = split(find_extra[n], vers, " ")\n            for (v = 1; v <= cnt; v++) if (vers[v] != "") add_finding(p, "", vers[v], find_sev[n], find_id[n], "cyclonedx")\n        }\n        emit_lookup()\n    }\n    \'\n}\n\n# Print "eco|name|version" for every component of a CycloneDX SBOM (--sbom),\n# at any nesting depth, from its purl. metadata.component is the project\n# itself and metadata.tools lists the generators: neither is a dependency.\n# Go purls carry a "v" prefix that go.sum parsing strips too.\ncyclonedx_components() {\n    json_structural_lines "$1" | awk "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n    {\n        jp_step($0)\n        if (JP_EVENT != "scalar" || JP_KEY != "purl" || JP_PATH !~ /\\/components\\/#$/ || JP_PATH ~ /^\\/#\\/metadata\\//) next\n        if (!purl_split(JP_VAL)) next\n        if (PURL_TYPE == "golang") sub(/^v/, "", PURL_VERSION)\n        print PURL_TYPE "|" canon_purl_name(PURL_TYPE, PURL_NAME) "|" PURL_VERSION\n    }\n    \' | sort -u\n}\n\n# Check the components of a CycloneDX SBOM given with --sbom, like a lockfile.\n# A Maven build lists its transitive dependencies only there (pom.xml does not).\nanalyze_cyclonedx_inventory() {\n    local lockfile="$1"\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n    local packages eco pkg_name version\n    if [ -n "${SBOM_COMPONENTS[$lockfile]+x}" ]; then\n        packages="${SBOM_COMPONENTS[$lockfile]}"\n    else\n        packages=$(cyclonedx_components "$lockfile")\n    fi\n    while IFS=\'|\' read -r eco pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Parse a Trivy JSON report (trivy fs/image --format json). Each\n# Results[].Vulnerabilities[] entry is one finding; PkgIdentifier.PURL gives the\n# ecosystem when present, otherwise the wildcard namespace is used.\nparse_trivy_to_lookup_eval() {\n    json_structural_lines "$1" | awk "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n    {\n        jp_step($0)\n        if (JP_EVENT == "scalar") {\n            if (JP_PATH ~ /\\/Results\\/#\\/Vulnerabilities\\/#$/) {\n                if (JP_KEY == "PkgName") pkg = JP_VAL\n                else if (JP_KEY == "InstalledVersion") ver = JP_VAL\n                else if (JP_KEY == "VulnerabilityID") vid = JP_VAL\n                else if (JP_KEY == "Severity") sev = JP_VAL\n            } else if (JP_PATH ~ /\\/Results\\/#\\/Vulnerabilities\\/#\\/PkgIdentifier$/ && JP_KEY == "PURL") {\n                purl = JP_VAL\n            }\n        } else if (JP_EVENT == "close" && JP_PATH ~ /\\/Results\\/#\\/Vulnerabilities\\/#$/) {\n            add_finding(purl, pkg, ver, sev, vid, "trivy")\n            pkg = ver = vid = sev = purl = ""\n        }\n    }\n    END { emit_lookup() }\n    \'\n}\n\n# Parse the JSON source format: { "<package>": { "versions": [...],\n# "versions_range": [...], "severity", "ghsa", "cve", "source" } }. JSON\n# sources carry no ecosystem, so entries land in the wildcard namespace "*:".\n# Package objects sit at depth 2 (their names may contain "/", so depth is\n# used rather than JP_PATH patterns).\nparse_json_to_lookup_eval() {\n    json_structural_lines "$1" | awk "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n    {\n        jp_step($0)\n        if (JP_EVENT == "open" && jp_depth == 2) {\n            pkg = jp_stack[2]; nv = 0; sev = ghsa = cve = src = ""\n        } else if (JP_EVENT == "scalar" && jp_depth == 2 && pkg != "") {\n            if (JP_KEY == "severity") sev = JP_VAL\n            else if (JP_KEY == "ghsa") ghsa = JP_VAL\n            else if (JP_KEY == "cve") cve = JP_VAL\n            else if (JP_KEY == "source") src = JP_VAL\n            else if ((JP_KEY == "versions" || JP_KEY == "versions_range") && JP_VAL != "" && JP_VAL != "null") {\n                # A single version written as a string instead of a list.\n                vals[++nv] = JP_VAL\n                ranged[nv] = (JP_KEY == "versions_range")\n            }\n        } else if (JP_EVENT == "scalar" && jp_depth == 3 && pkg != "" && JP_VAL != "" &&\n                   (jp_stack[3] == "versions" || jp_stack[3] == "versions_range")) {\n            vals[++nv] = JP_VAL\n            ranged[nv] = (jp_stack[3] == "versions_range")\n        } else if (JP_EVENT == "close" && jp_depth == 1 && pkg != "") {\n            # jp_depth is already popped: the package object just closed.\n            for (i = 1; i <= nv; i++) {\n                record = tolower(sev) ";" ghsa ";" cve ";" src ";" (ranged[i] ? range_fix(vals[i]) : "") ";"\n                add_entry("*:" loose_name(pkg), vals[i], record, ranged[i])\n            }\n            pkg = ""\n        }\n    }\n    END { emit_lookup() }\n    \'\n}\ndetect_format_from_url() {\n    local url="$1"\n\n    # Remove query parameters and fragments first\n    local clean_url="${url%%\\?*}"\n    clean_url="${clean_url%%\\#*}"\n\n    # Check for compound extensions first (e.g., .sarif, .sbom.cdx.json, .trivy.json)\n    if [[ "$clean_url" =~ \\.sarif\\.json$ ]] || [[ "$clean_url" =~ \\.sarif$ ]]; then\n        echo "sarif"\n        return\n    elif [[ "$clean_url" =~ \\.sbom\\.cdx\\.json$ ]] || [[ "$clean_url" =~ \\.sbom\\.json$ ]] || [[ "$clean_url" =~ \\.cdx\\.json$ ]]; then\n        echo "sbom-cyclonedx"\n        return\n    elif [[ "$clean_url" =~ \\.trivy\\.json$ ]]; then\n        echo "trivy-json"\n        return\n    fi\n\n    # Fall back to simple extension detection\n    local extension="${clean_url##*.}"\n\n    case "$extension" in\n        json)\n            # Generic JSON format\n            echo "json"\n            ;;\n        csv)\n            echo "csv"\n            ;;\n        purl|txt)\n            echo "purl"\n            ;;\n        sarif)\n            echo "sarif"\n            ;;\n        sbom)\n            echo "sbom-cyclonedx"\n            ;;\n        trivy)\n            echo "trivy-json"\n            ;;\n        cdx)\n            echo "sbom-cyclonedx"\n            ;;\n        *)\n            # Default to json if unknown\n            echo "json"\n            ;;\n    esac\n}\n\n# Load data source\nload_data_source() {\n    local url="$1"\n    local format="${2:-}"\n    local name="${3:-$url}"\n    local csv_columns="${4:-}"\n\n    # Auto-detect format if not provided\n    if [ -z "$format" ]; then\n        format=$(detect_format_from_url "$url")\n        echo -e "${BLUE}\u{1F50D} Loading: $name (auto-detected format: $format)${NC}"\n    else\n        echo -e "${BLUE}\u{1F50D} Loading: $name${NC}"\n    fi\n\n    echo "   URL: $url"\n    echo "   Format: $format"\n\n    local parser\n    case "$format" in\n        json) parser=parse_json_to_lookup_eval ;;\n        csv) parser=parse_csv_to_lookup_eval ;;\n        purl) parser=parse_purl_to_lookup_eval ;;\n        sarif) parser=parse_sarif_to_lookup_eval ;;\n        sbom|sbom-cyclonedx) parser=parse_sbom_to_lookup_eval ;;\n        trivy|trivy-json) parser=parse_trivy_to_lookup_eval ;;\n        *)\n            echo -e "${RED}\u274C Error: Unsupported format \'$format\'${NC}"\n            return 1\n            ;;\n    esac\n\n    # Parsers read a local file: download remote sources to a temp file first.\n    local file="$url" downloaded=""\n    if [[ "$url" =~ ^(https?|ftp):// ]]; then\n        if ! downloaded=$(mktemp); then\n            echo -e "${RED}\u274C Error: Unable to create a temporary file${NC}"\n            return 1\n        fi\n        register_temp_file "$downloaded"\n        if ! curl -fsSL --connect-timeout 10 --max-time 120 -o "$downloaded" "$url"; then\n            rm -f -- "$downloaded"\n            echo -e "${RED}\u274C Error: Unable to download from $url${NC}"\n            return 1\n        fi\n        file="$downloaded"\n    elif [ ! -f "$url" ]; then\n        echo -e "${RED}\u274C Error: Local file not found: $url${NC}"\n        return 1\n    fi\n\n    local status=0 eval_commands=""\n    case "$format" in\n        json|sarif|sbom|sbom-cyclonedx|trivy|trivy-json)\n            if ! json_is_valid_file "$file"; then\n                echo "Error: Invalid JSON in $name"\n                status=1\n            fi\n            ;;\n    esac\n    if [ "$status" = 0 ]; then\n        [ -z "$csv_columns" ] || echo "   CSV Columns: $csv_columns"\n        if ! eval_commands=$("$parser" "$file" "$csv_columns"); then\n            echo -e "${RED}\u274C Error: Unable to parse $name${NC}"\n            status=1\n        fi\n    fi\n    [ -z "$downloaded" ] || rm -f -- "$downloaded"\n    [ "$status" = 0 ] || return 1\n\n    # Sets FEED_PKG_COUNT / FEED_RAW_COUNT, then fills the lookup tables,\n    # merging with every source loaded before.\n    FEED_PKG_COUNT=0 FEED_RAW_COUNT=0\n    eval "$eval_commands"\n\n    LAST_SOURCE_ENTRY_COUNT="$FEED_RAW_COUNT"\n    TOTAL_SOURCE_ENTRIES=$(( ${TOTAL_SOURCE_ENTRIES:-0} + FEED_RAW_COUNT ))\n    if [ "$format" = purl ] && [ -n "${PREFILTER_TOKENS_FILE:-}" ]; then\n        echo -e "${GREEN}\u2705 Loaded ${FEED_PKG_COUNT} packages from $name (${FEED_RAW_COUNT} entries before pre-filtering)${NC}"\n    else\n        echo -e "${GREEN}\u2705 Loaded ${FEED_PKG_COUNT} packages from $name${NC}"\n    fi\n    echo ""\n    LOADED_SOURCE_COUNT=$((LOADED_SOURCE_COUNT + 1))\n\n    return 0\n}\n\n# Load configuration file\nload_config_file() {\n    local config_path="$1"\n    local load_sources="${2:-true}"\n\n    if [ ! -f "$config_path" ]; then\n        return 1\n    fi\n    \n    echo -e "${BLUE}\u{1F4CB} Loading configuration from: $config_path${NC}"\n    echo ""\n    \n    # Read config file content (a UTF-8 BOM is not part of the JSON)\n    local config_content\n    config_content=$(cat "$config_path")\n    config_content="${config_content#$\'\\xef\\xbb\\xbf\'}"\n    if ! json_is_valid "$config_content"; then\n        echo "Error: Invalid JSON in configuration: $config_path"\n        return 1\n    fi\n    \n    # Parse github settings if present\n    local github_obj=$(json_get_object "$config_content" "github")\n    if [ -n "$github_obj" ] && [ "$github_obj" != "{}" ]; then\n        local cfg_github_org=$(json_get_value "$github_obj" "org")\n        local cfg_github_repo=$(json_get_value "$github_obj" "repo")\n        local cfg_github_token=$(json_get_value "$github_obj" "token")\n        local cfg_github_output=$(json_get_value "$github_obj" "output")\n        \n        # Apply github settings if not already set via command line\n        if [ -z "$GITHUB_ORG" ] && [ -n "$cfg_github_org" ] && [ "$cfg_github_org" != "null" ] && [ "$cfg_github_org" != "" ]; then\n            GITHUB_ORG="$cfg_github_org"\n        fi\n        if [ -z "$GITHUB_REPO" ] && [ -n "$cfg_github_repo" ] && [ "$cfg_github_repo" != "null" ] && [ "$cfg_github_repo" != "" ]; then\n            GITHUB_REPO="$cfg_github_repo"\n        fi\n        if [ -z "$GITHUB_TOKEN" ] && [ -n "$cfg_github_token" ] && [ "$cfg_github_token" != "null" ] && [ "$cfg_github_token" != "" ]; then\n            GITHUB_TOKEN="$cfg_github_token"\n        fi\n        if [ -n "$cfg_github_output" ] && [ "$cfg_github_output" != "null" ] && [ "$cfg_github_output" != "" ]; then\n            # Only override if it\'s still the default value\n            if [ "$GITHUB_OUTPUT_DIR" = "./packages" ]; then\n                GITHUB_OUTPUT_DIR="$cfg_github_output"\n            fi\n        fi\n    fi\n    \n    # Parse options settings if present\n    local options_obj=$(json_get_object "$config_content" "options")\n    if [ -n "$options_obj" ] && [ "$options_obj" != "{}" ]; then\n        # An array without any non-empty entry keeps the built-in defaults.\n        json_read_strings "$(json_get_array "$options_obj" "ignore_paths")"\n        [ ${#JSON_STRINGS[@]} -eq 0 ] || CONFIG_IGNORE_PATHS=("${JSON_STRINGS[@]}")\n\n        json_read_strings "$(json_get_array "$options_obj" "dependency_types")"\n        [ ${#JSON_STRINGS[@]} -eq 0 ] || CONFIG_DEPENDENCY_TYPES=("${JSON_STRINGS[@]}")\n\n        # Default-feed loading override; the CLI --ecosystems flag takes\n        # precedence over this when both are set.\n        json_read_strings "$(json_get_array "$options_obj" "ecosystems")"\n        [ ${#JSON_STRINGS[@]} -eq 0 ] || CONFIG_ECOSYSTEMS="${JSON_STRINGS[*]}"\n\n        # Runtime version check (Node.js, PHP): on unless "runtime_check": false\n        local runtime_check_val=$(json_get_value "$options_obj" "runtime_check")\n        [ "$runtime_check_val" != false ] || CONFIG_RUNTIME_CHECK=false\n    fi\n    \n    # Parse config file and extract sources array\n    local -a source_objs=()\n    local source_obj\n    while IFS= read -r source_obj; do\n        source_objs+=("$source_obj")\n    done < <(json_array_items "$(json_get_array "$config_content" "sources")")\n    local sources_count=${#source_objs[@]}\n\n    if [ "$load_sources" != true ]; then\n        [ "$sources_count" -eq 0 ] || echo -e "${BLUE}\u2139\uFE0F  Configuration sources ignored: sources given on the command line take precedence${NC}"\n    elif [ "$sources_count" -eq 0 ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  Warning: No sources found in configuration file${NC}"\n        # Don\'t return 1 here - config may still have github settings\n    else\n        local i url format name columns\n        for ((i = 0; i < sources_count; i++)); do\n            source_obj="${source_objs[$i]}"\n\n            # Try to get url from "source" or "url" field\n            url=$(json_get_value "$source_obj" "source")\n            if [ -z "$url" ] || [ "$url" = "null" ]; then\n                url=$(json_get_value "$source_obj" "url")\n            fi\n            if [ -z "$url" ] || [ "$url" = "null" ]; then\n                echo -e "${RED}\u274C Error: source $((i + 1)) of $config_path has no \\"source\\" or \\"url\\"${NC}"\n                return 1\n            fi\n\n            format=$(json_get_value "$source_obj" "format")\n            name=$(json_get_value "$source_obj" "name")\n            columns=$(json_get_value "$source_obj" "columns")\n\n            # Set default name if not provided\n            if [ -z "$name" ] || [ "$name" = "null" ]; then\n                name="Source $((i+1))"\n            fi\n\n            # Handle null/empty values\n            [ "$format" != "null" ] || format=""\n            [ "$columns" != "null" ] || columns=""\n\n            load_data_source "$url" "$format" "$name" "$columns" || return 1\n        done\n    fi\n\n    return 0\n}\n# Order two decimal strings of any length without shell integer overflow\n# (a version part may exceed 2^63). An operand that is not all digits is\n# compared as text; an empty one counts as 0. Sets DIGITS_CMP (-1/0/1).\ncompare_digits() {\n    local a="${1:-0}" b="${2:-0}"\n    if [[ "$a" == *[!0-9]* || "$b" == *[!0-9]* ]]; then\n        if [[ "$a" < "$b" ]]; then DIGITS_CMP=-1\n        elif [[ "$a" > "$b" ]]; then DIGITS_CMP=1\n        else DIGITS_CMP=0; fi\n        return\n    fi\n    while [[ "$a" == 0?* ]]; do a="${a#0}"; done\n    while [[ "$b" == 0?* ]]; do b="${b#0}"; done\n    if (( ${#a} != ${#b} )); then\n        (( ${#a} < ${#b} )) && DIGITS_CMP=-1 || DIGITS_CMP=1\n    elif [[ "$a" < "$b" ]]; then DIGITS_CMP=-1\n    elif [[ "$a" > "$b" ]]; then DIGITS_CMP=1\n    else DIGITS_CMP=0; fi\n}\n\n# Compare two semver versions\n# Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2\n# OPTIMIZED: Sets COMPARE_RESULT global instead of echo (avoids subshell when called)\ncompare_versions() {\n    # Build metadata never changes version precedence.\n    local v1="$1"\n    local v2="$2"\n    v1="${v1%%+*}"\n    v2="${v2%%+*}"\n    # Tags such as v1.2.3 (cargo git deps, actions, swift) carry a cosmetic \'v\'.\n    [[ "$v1" == [vV][0-9]* ]] && v1="${v1:1}"\n    [[ "$v2" == [vV][0-9]* ]] && v2="${v2:1}"\n\n    # Split base (x.y.z[.w...]) from the pre-release tail (first \'-\' onward).\n    local base1="${v1%%-*}"\n    local base2="${v2%%-*}"\n\n    # --- Compare every numeric base part (missing parts count as 0) ---\n    local -a parts1 parts2\n    IFS=\'.\' read -ra parts1 <<< "$base1"\n    IFS=\'.\' read -ra parts2 <<< "$base2"\n    local i n1 n2 nparts=${#parts1[@]}\n    [ "${#parts2[@]}" -gt "$nparts" ] && nparts=${#parts2[@]}\n    [ "$nparts" -lt 3 ] && nparts=3\n    for (( i = 0; i < nparts; i++ )); do\n        n1="${parts1[$i]:-0}"\n        n2="${parts2[$i]:-0}"\n        # Decimal identifiers have no size limit in SemVer. Comparing lengths\n        # then ASCII digits avoids shell integer overflow.\n        while [[ "$n1" == 0* && ${#n1} -gt 1 ]]; do n1="${n1#0}"; done\n        while [[ "$n2" == 0* && ${#n2} -gt 1 ]]; do n2="${n2#0}"; done\n        if (( ${#n1} < ${#n2} )); then COMPARE_RESULT="-1"; return; fi\n        if (( ${#n1} > ${#n2} )); then COMPARE_RESULT="1"; return; fi\n        if [[ "$n1" < "$n2" ]]; then COMPARE_RESULT="-1"; return; fi\n        if [[ "$n1" > "$n2" ]]; then COMPARE_RESULT="1"; return; fi\n    done\n\n    # --- Pre-release comparison (base versions are equal) ---\n    local pre1="" pre2=""\n    [ "$v1" != "$base1" ] && pre1="${v1#*-}"\n    [ "$v2" != "$base2" ] && pre2="${v2#*-}"\n\n    # A version with a pre-release has LOWER precedence than one without.\n    if [ -z "$pre1" ] && [ -z "$pre2" ]; then COMPARE_RESULT="0"; return; fi\n    if [ -z "$pre1" ]; then COMPARE_RESULT="1"; return; fi\n    if [ -z "$pre2" ]; then COMPARE_RESULT="-1"; return; fi\n\n    # Both have pre-release: compare dot-split identifiers left to right.\n    local ids1 ids2\n    IFS=\'.\' read -ra ids1 <<< "$pre1"\n    IFS=\'.\' read -ra ids2 <<< "$pre2"\n    local len1=${#ids1[@]}\n    local len2=${#ids2[@]}\n    local maxlen=$len1\n    [ "$len2" -gt "$maxlen" ] && maxlen=$len2\n\n    local j id1 id2 isnum1 isnum2\n    for (( j = 0; j < maxlen; j++ )); do\n        # A larger set of pre-release fields (prefix-superset) wins.\n        if [ "$j" -ge "$len1" ]; then COMPARE_RESULT="-1"; return; fi\n        if [ "$j" -ge "$len2" ]; then COMPARE_RESULT="1"; return; fi\n\n        id1="${ids1[$j]}"\n        id2="${ids2[$j]}"\n        [ "$id1" = "$id2" ] && continue\n\n        # Numeric identifiers rank below alphanumeric ones; two numerics\n        # compare numerically; two alphanumerics compare lexically (ASCII).\n        case "$id1" in \'\'|*[!0-9]*) isnum1=0 ;; *) isnum1=1 ;; esac\n        case "$id2" in \'\'|*[!0-9]*) isnum2=0 ;; *) isnum2=1 ;; esac\n\n        if [ "$isnum1" = 1 ] && [ "$isnum2" = 1 ]; then\n            while [[ "$id1" == 0* && ${#id1} -gt 1 ]]; do id1="${id1#0}"; done\n            while [[ "$id2" == 0* && ${#id2} -gt 1 ]]; do id2="${id2#0}"; done\n            if (( ${#id1} < ${#id2} )); then COMPARE_RESULT="-1"; return; fi\n            if (( ${#id1} > ${#id2} )); then COMPARE_RESULT="1"; return; fi\n            if [[ "$id1" < "$id2" ]]; then COMPARE_RESULT="-1"; return; fi\n            if [[ "$id1" > "$id2" ]]; then COMPARE_RESULT="1"; return; fi\n        elif [ "$isnum1" = 1 ]; then\n            COMPARE_RESULT="-1"; return\n        elif [ "$isnum2" = 1 ]; then\n            COMPARE_RESULT="1"; return\n        else\n            if [[ "$id1" < "$id2" ]]; then COMPARE_RESULT="-1"; return; fi\n            if [[ "$id1" > "$id2" ]]; then COMPARE_RESULT="1"; return; fi\n        fi\n    done\n\n    COMPARE_RESULT="0"\n}\n\n# Convert one semver shorthand token (~ and ^, full or partial) into its\n# comparator pair. Sets EXPANDED_RANGE (no subshell: called per distinct range).\n# ~1.2.3 -> >=1.2.3 <1.3.0     ~1.2 -> >=1.2.0 <1.3.0     ~1 -> >=1.0.0 <2.0.0\n# ^1.2.3 -> >=1.2.3 <2.0.0     ^0.2 -> >=0.2.0 <0.3.0     ^1 -> >=1.0.0 <2.0.0\n# Anything else is returned unchanged.\nexpand_semver_range() {\n    local range="$1"\n    EXPANDED_RANGE="$range"\n    [[ "$range" =~ ^([~^])([0-9]+)(\\.([0-9]+))?(\\.([0-9]+))?(.*)$ ]] || return 0\n    local op="${BASH_REMATCH[1]}" major="${BASH_REMATCH[2]}"\n    local minor="${BASH_REMATCH[4]}" patch="${BASH_REMATCH[6]}" tail="${BASH_REMATCH[7]}"\n    # A partial version cannot carry a pre-release tail (~1.2-beta is not semver).\n    if [ -n "$tail" ] && [ -z "$patch" ]; then return 0; fi\n    local lower="$major.${minor:-0}.${patch:-0}$tail"\n\n    if [ "$op" = "~" ]; then\n        if [ -z "$minor" ]; then\n            EXPANDED_RANGE=">=$lower <$((major + 1)).0.0"\n        else\n            EXPANDED_RANGE=">=$lower <$major.$((minor + 1)).0"\n        fi\n    elif [ "$major" != 0 ] || [ -z "$minor" ]; then\n        EXPANDED_RANGE=">=$lower <$((major + 1)).0.0"\n    elif [ "$minor" != 0 ] || [ -z "$patch" ]; then\n        EXPANDED_RANGE=">=$lower <0.$((minor + 1)).0"\n    else\n        EXPANDED_RANGE=">=$lower <0.0.$((patch + 1))"\n    fi\n}\n\n# Pessimistic constraint (Ruby ~>, PEP 440 ~=, Composer ~): the last given\n# part may grow. ~>2.2 -> >=2.2 <3   ~>2.2.3 -> >=2.2.3 <2.3   ~>2 -> >=2 <3\n# Sets EXPANDED_RANGE ("!" when the version has no numeric part).\nexpand_pessimistic_range() {\n    local ver="$1"\n    [[ "$ver" =~ ^[vV]?([0-9]+(\\.[0-9]+)*) ]] || { EXPANDED_RANGE="!"; return 0; }\n    local -a parts\n    IFS=\'.\' read -ra parts <<< "${BASH_REMATCH[1]}"\n    local last=$(( ${#parts[@]} - 1 ))\n    [ "$last" -eq 0 ] || { unset \'parts[last]\'; last=$((last - 1)); }\n    parts[last]=$(( 10#${parts[last]} + 1 ))\n    local IFS=\'.\'\n    EXPANDED_RANGE=">=$ver <${parts[*]}${RANGE_BOUND_SUFFIX:-}"\n}\n\n# X-range token: an operator and a version ending in a wildcard (1.x, 1.2.*,\n# ==1.*, >=2.x). $1 operator ("" = "=" = "=="), $2 the numeric prefix (1, 1.2).\n# 1.x -> >=1 <2   1.2.* -> >=1.2 <1.3   >1.x -> >=2   <=1.x -> <2\n# !=1.2.* -> "!x1.2:1.3" (outside [1.2, 1.3), see RANGE_EXCLUDES).\n# RANGE_BOUND_SUFFIX (".dev0" for PyPI, set by _prepare_range) makes the\n# generated bounds include the pre-releases of the prefix and exclude those of\n# the next release, as PEP 440 prefix matching does (==1.0.* has 1.0rc1).\n# Sets EXPANDED_RANGE ("!" when it cannot be expressed as one AND list).\nexpand_x_range() {\n    local op="$1" base="$2" next\n    local -a parts\n    IFS=\'.\' read -ra parts <<< "$base"\n    local last=$(( ${#parts[@]} - 1 ))\n    parts[last]=$(( 10#${parts[last]} + 1 ))\n    next="${parts[*]}"\n    next="${next// /.}"\n    local sfx="${RANGE_BOUND_SUFFIX:-}"\n    case "$op" in\n        ""|=|==) EXPANDED_RANGE=">=$base$sfx <$next$sfx" ;;\n        "!=") EXPANDED_RANGE="!x$base$sfx:$next$sfx" ;;\n        ">=") EXPANDED_RANGE=">=$base$sfx" ;;\n        ">") EXPANDED_RANGE=">=$next$sfx" ;;\n        "<") EXPANDED_RANGE="<$base$sfx" ;;\n        "<=") EXPANDED_RANGE="<$next$sfx" ;;\n        *) EXPANDED_RANGE="!" ;;\n    esac\n}\n\n# Maven / NuGet interval notation -> comparator alternatives. Sets\n# INTERVAL_RANGE (unchanged input when it is not an interval list).\n# [1.0,2.0) -> >=1.0 <2.0   (,1.0] -> <=1.0   [1.0] -> =1.0   [1.0,) -> >=1.0\n# [1.0,1.5),[2.0,2.5) -> >=1.0 <1.5 || >=2.0 <2.5\n_prepare_interval() {\n    local rest="$1" out="" alt low high\n    local re=\'^[[:space:]]*([[(])([^],()]*)(,([^],()]*))?([])])[[:space:]]*(,(.*))?$\'\n    INTERVAL_RANGE="$1"\n    while [ -n "$rest" ]; do\n        [[ "$rest" =~ $re ]] || return 0\n        low="${BASH_REMATCH[2]// /}" high="${BASH_REMATCH[4]// /}"\n        if [ -z "${BASH_REMATCH[3]}" ]; then\n            [ -n "$low" ] || return 0\n            alt="=$low"\n        else\n            alt=""\n            if [ -n "$low" ]; then\n                if [ "${BASH_REMATCH[1]}" = "[" ]; then alt=">=$low"; else alt=">$low"; fi\n            fi\n            if [ -n "$high" ]; then\n                if [ "${BASH_REMATCH[5]}" = "]" ]; then alt+="${alt:+ }<=$high"; else alt+="${alt:+ }<$high"; fi\n            fi\n            [ -n "$alt" ] || alt="*"\n        fi\n        out+="${out:+ || }$alt"\n        rest="${BASH_REMATCH[7]}"\n    done\n    INTERVAL_RANGE="$out"\n}\n\n# Parsed form of every distinct range string seen so far: "op ver op ver ..."\n# ("*" matches everything, "!" never matches), keyed "eco|range" since an\n# operator may depend on the ecosystem (Composer ~1.2 is >=1.2 <2.0). Ranges\n# repeat across thousands of lockfile entries, so normalization runs once per\n# distinct string.\ndeclare -A RANGE_CACHE=()\ndeclare -A INTERVAL_CACHE=()\n# Excluded intervals of a range ("LOW:HIGH ...", from PEP 440 !=1.3.*), kept\n# out of RANGE_CACHE so the common case pays nothing for them.\ndeclare -A RANGE_EXCLUDES=()\n\n# Normalize one range (no "|" alternatives) into RANGE_CACHE[$2]. Custom\n# sources write ranges in many dialects: ">=1.0,<2.0", ">= 1.0", "==1.0",\n# "=1.0", "^1", "~1.2", "~>2.2", "~=2.2", "!=1.5", "1.x", "1.2.*",\n# "1.2.3 - 2.3.4".\n_prepare_range() {\n    local raw="$1" key="$2" r="$1" token op ver parsed="" bad="" bare=0 count=0\n    local RANGE_BOUND_SUFFIX=""\n    [ "${key%%|*}" != pypi ] || RANGE_BOUND_SUFFIX=".dev0"\n    r="${r//,/ }"\n    # Hyphen range: "1.2.3 - 2.3.4" -> >=1.2.3 <=2.3.4; a partial upper bound\n    # admits its whole line ("1.2 - 2" -> >=1.2 <3).\n    if [[ "$r" =~ ^[[:space:]]*[vV]?([0-9][^[:space:]]*)[[:space:]]+-[[:space:]]+[vV]?([0-9][^[:space:]]*)[[:space:]]*$ ]]; then\n        local lower="${BASH_REMATCH[1]}" upper="${BASH_REMATCH[2]}"\n        if [[ "$upper" =~ ^[0-9]+(\\.[0-9]+)?$ ]]; then\n            expand_x_range "<=" "$upper"\n            r=">=$lower $EXPANDED_RANGE"\n        else\n            r=">=$lower <=$upper"\n        fi\n    fi\n    # Glue a detached operator to its version: ">= 1.0" -> ">=1.0".\n    while [[ "$r" =~ ^(.*)(===|\\>=|\\<=|==|!=|~\\>|~=|\\>|\\<|=|\\^|~)[[:space:]]+(.*)$ ]]; do\n        r="${BASH_REMATCH[1]}${BASH_REMATCH[2]}${BASH_REMATCH[3]}"\n    done\n    local -a tokens\n    read -ra tokens <<< "$r"\n    local expanded=""\n    for token in "${tokens[@]}"; do\n        case "$token" in\n            # A lone wildcard admits everything: it adds no constraint.\n            "*"|x|X) continue ;;\n        esac\n        if [[ "$token" =~ ^(\\>=|\\<=|==|!=|\\>|\\<|=|\\^|~)?[vV]?([0-9]+(\\.[0-9]+)*)\\.[xX*](\\.[xX*])*$ ]]; then\n            op="${BASH_REMATCH[1]}" ver="${BASH_REMATCH[2]}"\n            case "$op" in\n                "^"|"~") expand_semver_range "$op$ver" ;;\n                *) expand_x_range "$op" "$ver" ;;\n            esac\n            expanded+="$EXPANDED_RANGE "\n            continue\n        fi\n        case "$token" in\n            "~>"*|"~="*) expand_pessimistic_range "${token:2}"; expanded+="$EXPANDED_RANGE " ;;\n            "~"*)\n                if [ "${key%%|*}" = composer ]; then\n                    expand_pessimistic_range "${token:1}"\n                else\n                    expand_semver_range "$token"\n                fi\n                expanded+="$EXPANDED_RANGE " ;;\n            "^"*) expand_semver_range "$token"; expanded+="$EXPANDED_RANGE " ;;\n            *) expanded+="$token " ;;\n        esac\n    done\n    if [ -z "$expanded" ]; then\n        RANGE_CACHE["$key"]="*"\n        return\n    fi\n    read -ra tokens <<< "$expanded"\n    for token in "${tokens[@]}"; do\n        count=$((count + 1))\n        if [[ "$token" =~ ^(===|\\>=|\\<=|==|!=|\\>|\\<|=)(.+)$ ]]; then\n            op="${BASH_REMATCH[1]}" ver="${BASH_REMATCH[2]}"\n            # PEP 440 arbitrary equality (===) is a string match: equality.\n            [ "$op" != "==" ] && [ "$op" != "===" ] || op="="\n        elif [[ "$token" =~ ^!x(.+:.+)$ ]]; then\n            RANGE_EXCLUDES["$key"]+="${RANGE_EXCLUDES[$key]:+ }${BASH_REMATCH[1]}"\n            continue\n        elif [[ "$token" =~ ^[vV]?[0-9] ]]; then\n            op="=" ver="$token"     # a bare version is an exact constraint\n            bare=$((bare + 1))\n        else\n            bad="$token"; break\n        fi\n        parsed+="$op $ver "\n    done\n    # Only exclusions ("!=1.3.*"): every other version matches.\n    [ -n "$parsed" ] || [ -z "${RANGE_EXCLUDES[$key]+x}" ] || [ -n "$bad" ] || parsed="* "\n    if [ -n "$bad" ] || [ -z "$parsed" ]; then\n        RANGE_CACHE["$key"]="!"\n        [ -n "$raw" ] && echo -e "${YELLOW}\u26A0\uFE0F  Warning: unsupported version range \'$raw\' (token \'$bad\'); it never matches${NC}" >&2\n        return\n    fi\n    # A list of bare versions ("1.0.0, 1.0.1") names each affected version:\n    # one of them must match (AND-ed exact versions could never match).\n    if [ "$bare" -gt 1 ] && [ "$bare" -eq "$count" ]; then\n        parsed="${parsed//= /}"\n        RANGE_CACHE["$key"]="anyof ${parsed% }"\n        return\n    fi\n    RANGE_CACHE["$key"]="${parsed% }"\n}\n\n# Check if a version is within a range\n# Range format: ">1.0.0 <=2.0.0" or ">=1.0.0 <2.0.0" etc.\n# Pre-release versions are included if their base version is within the range\nversion_in_range() {\n    local version="$1"\n    local range="$2"\n\n    # Maven / NuGet intervals become "||" alternatives first: their commas\n    # separate bounds, not AND-ed constraints.\n    local interval_re=\'^[[:space:]]*[[(]\'\n    if [[ "$range" =~ $interval_re ]]; then\n        [ -n "${INTERVAL_CACHE[$range]+x}" ] || { _prepare_interval "$range"; INTERVAL_CACHE["$range"]="$INTERVAL_RANGE"; }\n        range="${INTERVAL_CACHE[$range]}"\n    fi\n\n    # Split alternatives ("||", and Composer\'s single "|") before expanding\n    # shorthand; otherwise the upper bound generated for the first caret\n    # branch is attached to the last branch.\n    if [[ "$range" == *"|"* ]]; then\n        local rest="${range#*|}"\n        version_in_range "$version" "${range%%|*}" && return 0\n        version_in_range "$version" "${rest#|}"\n        return $?\n    fi\n    range="${range#"${range%%[![:space:]]*}"}"\n    range="${range%"${range##*[![:space:]]}"}"\n\n    # Guard against empty range (should not match any version)\n    if [ -z "$range" ]; then\n        return 1\n    fi\n    [ "$range" = "*" ] && return 0\n    local cache_key="${CHECK_ECO:-npm}|$range"\n    [ -n "${RANGE_CACHE[$cache_key]+x}" ] || _prepare_range "$range" "$cache_key"\n    local parsed="${RANGE_CACHE[$cache_key]}"\n    [ "$parsed" = "!" ] && return 1\n    local range_version\n    if [ -n "${RANGE_EXCLUDES[$cache_key]+x}" ]; then\n        local excluded\n        for excluded in ${RANGE_EXCLUDES[$cache_key]}; do\n            compare_versions_eco "${CHECK_ECO:-npm}" "$version" "${excluded%%:*}"\n            [ "$COMPARE_RESULT" = "-1" ] && continue\n            compare_versions_eco "${CHECK_ECO:-npm}" "$version" "${excluded#*:}"\n            [ "$COMPARE_RESULT" != "-1" ] || return 1\n        done\n    fi\n    [ "$parsed" = "*" ] && return 0\n    if [[ "$parsed" == "anyof "* ]]; then\n        local -a listed\n        read -ra listed <<< "${parsed#anyof }"\n        for range_version in "${listed[@]}"; do\n            version_matches_vulnerable "$version" "$range_version" && return 0\n        done\n        return 1\n    fi\n\n    # Get base version for pre-release handling\n    local base_version="${version%%-*}"\n    base_version="${base_version%%+*}"\n    local is_prerelease=false\n    if [ "$version" != "$base_version" ]; then\n        is_prerelease=true\n    fi\n\n    local -a conditions\n    read -ra conditions <<< "$parsed"\n    local idx operator\n\n    for (( idx = 0; idx < ${#conditions[@]}; idx += 2 )); do\n        operator="${conditions[$idx]}"\n        range_version="${conditions[$((idx + 1))]}"\n\n        # ">=0" admits every version, including pre-releases of 0.0.0 such as\n        # Go pseudo-versions (0.0.0-2021...) and npm 0.0.0-experimental builds.\n        if [ "$operator" = ">=" ] && [[ "$range_version" =~ ^[vV]?0(\\.0)*$ ]]; then\n            continue\n        fi\n        # Identical strings compare equal under every ecosystem comparator.\n        if [ "$version" = "$range_version" ]; then\n            COMPARE_RESULT=0\n        # For pre-release versions, use base version for comparison\n        # This allows 19.0.0-rc.1 to be considered as within >=19.0.0\n        # OPTIMIZED: dispatch on CHECK_ECO and use COMPARE_RESULT (avoids subshell).\n        # npm/everything-else routes to the shared semver comparator; only\n        # ecosystems with their own comparator (e.g. golang) diverge.\n        elif [ "$is_prerelease" = true ] && [ "${CHECK_ECO:-npm}" = npm ]; then\n            # Special handling for >= operator with pre-release\n            # 19.0.0-rc is considered >= 19.0.0 (it\'s a pre-release OF 19.0.0)\n            if [ "$operator" = ">=" ] && [ "$base_version" = "$range_version" ]; then\n                COMPARE_RESULT="0"  # Consider it equal for >= comparison\n            else\n                compare_versions_eco "${CHECK_ECO:-npm}" "$version" "$range_version"\n            fi\n        else\n            compare_versions_eco "${CHECK_ECO:-npm}" "$version" "$range_version"\n        fi\n\n        case "$operator" in\n            "=")\n                [ "$COMPARE_RESULT" = "0" ] || return 1\n                ;;\n            "!=")\n                [ "$COMPARE_RESULT" != "0" ] || return 1\n                ;;\n            ">")\n                if [ "$COMPARE_RESULT" != "1" ]; then\n                    return 1  # version is not > range_version\n                fi\n                ;;\n            ">=")\n                if [ "$COMPARE_RESULT" = "-1" ]; then\n                    return 1  # version is < range_version\n                fi\n                ;;\n            "<")\n                if [ "$COMPARE_RESULT" != "-1" ]; then\n                    return 1  # version is not < range_version\n                fi\n                ;;\n            "<=")\n                if [ "$COMPARE_RESULT" = "1" ]; then\n                    return 1  # version is > range_version\n                fi\n                ;;\n        esac\n    done\n    return 0\n}\n\n# Check if a version matches a vulnerable version (exact or pre-release of it)\nversion_matches_vulnerable() {\n    local installed_version="$1"\n    local versions="$2"\n    \n    # Exact match\n    if [ "$installed_version" = "$versions" ]; then\n        return 0\n    fi\n\n    # Other ecosystems use their own version equality. npm retains the\n    # historical conservative prerelease-of-exact matching policy below.\n    if [ "${CHECK_ECO:-npm}" != npm ]; then\n        compare_versions_eco "$CHECK_ECO" "$installed_version" "$versions"\n        [ "$COMPARE_RESULT" = 0 ]\n        return $?\n    fi\n    \n    # Check if installed version is a pre-release of the vulnerable version\n    # For example: "19.0.0-rc-xxx" should match "19.0.0"\n    local installed_base="${installed_version%%-*}"\n    installed_base="${installed_base%%+*}"\n    \n    if [ "$installed_base" = "$versions" ] && [ "$installed_version" != "$installed_base" ]; then\n        # It\'s a pre-release version (has suffix) and base matches\n        return 0\n    fi\n    \n    return 1\n}\n# Comparator dispatch \u2014 routes a candidate/range version comparison to the\n# ecosystem-appropriate comparator. Matching code passes CHECK_ECO (set by\n# check_vulnerability); everything that is not a special-cased ecosystem falls\n# through to the shared semver compare_versions (runtime included: Node.js and\n# PHP versions are plain x.y.z).\n#\n# Contract mirrors compare_versions: sets the global COMPARE_RESULT (-1/0/1),\n# no stdout, no subshell.\ncompare_versions_eco() {\n    case "$1" in\n        golang) compare_versions_go "$2" "$3" ;;\n        pypi)   compare_versions_pep440 "$2" "$3" ;;\n        gem)    compare_versions_gem "$2" "$3" ;;\n        maven)  compare_versions_maven "$2" "$3" ;;\n        nuget)  compare_versions_nuget "$2" "$3" ;;\n        composer) compare_versions_composer "$2" "$3" ;;\n        pub)    compare_versions_pub "$2" "$3" ;;\n        *)      compare_versions "$2" "$3" ;;\n    esac\n}\n# PEP 440 version comparator (Python / PyPI ordering).\n#\n# Routed to from compare_versions_eco when CHECK_ECO=pypi. A wrong ordering in a\n# security tool silently produces false negatives, so this follows the reference\n# `packaging` sort-key algorithm (epoch, release, pre, post, dev, local) exactly:\n#\n#   version := [N!]release[{a|b|rc}N][.postN][.devN][+local]\n#\n#   * epoch   (N!)     compares first, numerically (default 0).\n#   * release (x.y.z)  numeric, dot-split, zero-padded (1.0 == 1.0.0,\n#                      1.0.10 > 1.0.2).\n#   * ordering within a release:\n#         dev  <  pre(a<b<rc)  <  final  <  post\n#     Precisely, mirroring packaging\'s _cmpkey:\n#       - a version with ONLY a .devN (no pre, no post) ranks BELOW every\n#         pre-release of that release   (1.0.dev1 < 1.0a1);\n#       - a version with no pre-release ranks ABOVE all pre-releases\n#         (1.0rc1 < 1.0), and a post-release ranks above the final\n#         (1.0 < 1.0.post1);\n#       - a trailing .devN drops a version just below its non-dev sibling\n#         (1.0rc1.dev1 < 1.0rc1, 1.0.post1.dev1 < 1.0.post1);\n#       - pre/post/dev NUMBERS compare numerically.\n#   * local (+...) is IGNORED for ordering/range matching (1.0+local == 1.0).\n#\n# Normalization before comparing (case-insensitive):\n#   alpha->a  beta->b  c|pre|preview->rc ; post|rev|r and a bare -N suffix\n#   -> .postN ; optional . / - / _ separators between parts (1.0-a1 == 1.0a1) ;\n#   a leading `v` is stripped (V1.0 == 1.0) ; implicit numbers default to 0\n#   (1.0a == 1.0a0).\n#\n# Contract mirrors compare_versions: sets COMPARE_RESULT (-1/0/1), no stdout,\n# no subshell in the hot path.\n\n# Parse one normalized PEP 440 version into the _PEP_* globals:\n#   _PEP_EPOCH                       epoch integer\n#   _PEP_REL                         array of release segments (integers)\n#   _PEP_PRERANK  _PEP_PRELET  _PEP_PRENUM\n#         PRERANK: 0 = dev-only (below pre-releases), 1 = has pre-release,\n#                  2 = no pre-release (final/post). PRELET: a=0 b=1 rc=2.\n#   _PEP_POSTRANK _PEP_POSTNUM       POSTRANK 0 = no post, 1 = has post.\n#   _PEP_DEVRANK  _PEP_DEVNUM        DEVRANK  0 = has dev,  1 = no dev.\n_pep440_parse() {\n    local v="$1"\n\n    # Trim surrounding whitespace, lowercase, strip a leading `v`, drop local.\n    v="${v#"${v%%[![:space:]]*}"}"\n    v="${v%"${v##*[![:space:]]}"}"\n    v="${v,,}"\n    v="${v#v}"\n    v="${v%%+*}"\n\n    # Epoch: leading "N!".\n    local epoch=0\n    case "$v" in\n        *\'!\'*) epoch="${v%%!*}"; v="${v#*!}" ;;\n    esac\n    _PEP_EPOCH="$epoch"\n\n    # One regex splits release / pre / post / dev. Group map:\n    #   1 release   4 pre-letter   5 pre-num\n    #   6 post-any  7 implicit -N post   10 explicit post-num\n    #   11 dev-any  13 dev-num\n    local re=\'^([0-9]+(\\.[0-9]+)*)([-_.]?(a|b|c|rc|alpha|beta|pre|preview)[-_.]?([0-9]+)?)?((-[0-9]+)|([-_.]?(post|rev|r)[-_.]?([0-9]+)?))?([-_.]?(dev)[-_.]?([0-9]+)?)?$\'\n\n    if [[ "$v" =~ $re ]]; then\n        # Release segments.\n        local rel="${BASH_REMATCH[1]}"\n        local IFS=\'.\'\n        # SC2206: intentional word-split of the dotted release on IFS=\'.\' into\n        # the release-segment array (values are digits only \u2014 no globbing risk).\n        # shellcheck disable=SC2206\n        _PEP_REL=($rel)\n        unset IFS\n\n        # Pre-release.\n        local prelet="${BASH_REMATCH[4]}"\n        if [ -n "$prelet" ]; then\n            _PEP_PRENUM="${BASH_REMATCH[5]:-0}"\n            case "$prelet" in\n                a|alpha)          _PEP_PRELET=0 ;;\n                b|beta)           _PEP_PRELET=1 ;;\n                c|rc|pre|preview) _PEP_PRELET=2 ;;\n                *)                _PEP_PRELET=0 ;;\n            esac\n        else\n            _PEP_PRENUM=0\n            _PEP_PRELET=0\n        fi\n\n        # Post-release (implicit "-N" or explicit post/rev/r[N]).\n        local has_post=0 postnum=0\n        if [ -n "${BASH_REMATCH[6]}" ]; then\n            has_post=1\n            if [ -n "${BASH_REMATCH[7]}" ]; then\n                postnum="${BASH_REMATCH[7]#-}"\n            else\n                postnum="${BASH_REMATCH[10]:-0}"\n            fi\n        fi\n        _PEP_POSTRANK="$has_post"\n        _PEP_POSTNUM="$postnum"\n\n        # Dev-release.\n        local has_dev=0 devnum=0\n        if [ -n "${BASH_REMATCH[11]}" ]; then\n            has_dev=1\n            devnum="${BASH_REMATCH[13]:-0}"\n        fi\n        _PEP_DEVNUM="$devnum"\n        # DEVRANK: present sorts first (0), absent sorts last (1 == +inf).\n        if [ "$has_dev" = 1 ]; then _PEP_DEVRANK=0; else _PEP_DEVRANK=1; fi\n\n        # PRERANK: dev-only (no pre, no post, has dev) sinks below pre-releases.\n        if [ -n "$prelet" ]; then\n            _PEP_PRERANK=1\n        elif [ "$has_post" = 0 ] && [ "$has_dev" = 1 ]; then\n            _PEP_PRERANK=0\n        else\n            _PEP_PRERANK=2\n        fi\n    else\n        # Unparseable tail: treat the whole thing as a bare release so ordering\n        # stays deterministic rather than crashing the scan.\n        local IFS=\'.\'\n        # SC2206: intentional word-split of the leading numeric-dotted run on\n        # IFS=\'.\' into the release-segment array (digits only \u2014 no globbing risk).\n        # shellcheck disable=SC2206\n        _PEP_REL=(${v%%[!0-9.]*})\n        unset IFS\n        [ "${#_PEP_REL[@]}" -eq 0 ] && _PEP_REL=(0)\n        _PEP_PRERANK=2; _PEP_PRELET=0; _PEP_PRENUM=0\n        _PEP_POSTRANK=0; _PEP_POSTNUM=0\n        _PEP_DEVRANK=1;  _PEP_DEVNUM=0\n    fi\n}\n\ncompare_versions_pep440() {\n    _pep440_parse "$1"\n    local e1="$_PEP_EPOCH"\n    local rel1=("${_PEP_REL[@]}")\n    local prerank1="$_PEP_PRERANK" prelet1="$_PEP_PRELET" prenum1="$_PEP_PRENUM"\n    local postrank1="$_PEP_POSTRANK" postnum1="$_PEP_POSTNUM"\n    local devrank1="$_PEP_DEVRANK" devnum1="$_PEP_DEVNUM"\n\n    _pep440_parse "$2"\n    local e2="$_PEP_EPOCH"\n    local rel2=("${_PEP_REL[@]}")\n    local prerank2="$_PEP_PRERANK" prelet2="$_PEP_PRELET" prenum2="$_PEP_PRENUM"\n    local postrank2="$_PEP_POSTRANK" postnum2="$_PEP_POSTNUM"\n    local devrank2="$_PEP_DEVRANK" devnum2="$_PEP_DEVNUM"\n\n    # 1. Epoch (numeric, any length).\n    compare_digits "$e1" "$e2"\n    [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n\n    # 2. Release, segment by segment, zero-padded (missing segment == 0).\n    local len1=${#rel1[@]} len2=${#rel2[@]}\n    local maxlen=$len1\n    [ "$len2" -gt "$maxlen" ] && maxlen=$len2\n    local i s1 s2\n    for (( i = 0; i < maxlen; i++ )); do\n        s1="${rel1[$i]:-0}"; s2="${rel2[$i]:-0}"\n        compare_digits "$s1" "$s2"\n        [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n    done\n\n    # 3. Pre-release group (dev-only < pre < final/post).\n    if [ "$prerank1" -lt "$prerank2" ]; then COMPARE_RESULT="-1"; return; fi\n    if [ "$prerank1" -gt "$prerank2" ]; then COMPARE_RESULT="1";  return; fi\n    if [ "$prerank1" = 1 ]; then\n        if [ "$prelet1" -lt "$prelet2" ]; then COMPARE_RESULT="-1"; return; fi\n        if [ "$prelet1" -gt "$prelet2" ]; then COMPARE_RESULT="1";  return; fi\n        compare_digits "$prenum1" "$prenum2"\n        [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n    fi\n\n    # 4. Post-release (no post < post; then post number).\n    if [ "$postrank1" -lt "$postrank2" ]; then COMPARE_RESULT="-1"; return; fi\n    if [ "$postrank1" -gt "$postrank2" ]; then COMPARE_RESULT="1";  return; fi\n    if [ "$postrank1" = 1 ]; then\n        compare_digits "$postnum1" "$postnum2"\n        [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n    fi\n\n    # 5. Dev-release (has dev < no dev; then dev number).\n    if [ "$devrank1" -lt "$devrank2" ]; then COMPARE_RESULT="-1"; return; fi\n    if [ "$devrank1" -gt "$devrank2" ]; then COMPARE_RESULT="1";  return; fi\n    if [ "$devrank1" = 0 ]; then\n        compare_digits "$devnum1" "$devnum2"\n        [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n    fi\n\n    COMPARE_RESULT="0"\n}\n# Go module versions use the shared semver comparator after removing the\n# module-specific leading v. Pseudo-versions follow prerelease ordering.\ncompare_versions_go() {\n    compare_versions "${1#v}" "${2#v}"\n}\n# RubyGems version comparator (Gem::Version ordering). Routed to from\n# compare_versions_eco when CHECK_ECO=gem.\n#\n# RubyGems ordering, verified segment-by-segment against real `Gem::Version`\n# (ruby -rrubygems):\n#   * a literal `-` is canonicalized to `.pre.` BEFORE splitting, so\n#     `1.0-1` and `1.0.pre.1` parse to identical segments (and compare equal);\n#   * the (dash-canonicalized) string is tokenized into segments by BOTH the\n#     literal dots AND every digit/letter boundary \u2014 `2a1` -> `2`, `a`, `1`\n#     (same as the explicit `2.a.1`), `1.0.b1` -> `1`, `0`, `b`, `1`;\n#   * segments are compared left to right; a missing trailing segment on the\n#     shorter side defaults to `0` (`1.0 == 1.0.0`);\n#   * two numeric segments compare numerically (`1.0.10 > 1.0.2`);\n#   * two string segments compare lexically (ASCII, `1.0.a < 1.0.b`);\n#   * a string segment ALWAYS ranks below a numeric segment at the same\n#     position \u2014 including a numeric segment that only exists because the\n#     other side ran out (padded to `0`) \u2014 which is exactly what makes any\n#     version with a trailing string segment a prerelease of its release\n#     (`1.0.0.pre.1 < 1.0.0`, `3.0.0.beta1 < 3.0.0`).\n#\n# Contract mirrors compare_versions: sets COMPARE_RESULT (-1/0/1), no stdout,\n# no subshell in the hot path (tokenizing is a pure bash regex/slice loop,\n# same style as the go/pep440 comparators\' identifier loops).\n\n# Tokenize a (dash-canonicalized) version string into the global array\n# _GEM_SEGS: every maximal digit-run or letter-run becomes one segment; dots\n# and any other stray character are pure separators and are dropped.\n_gem_tokenize() {\n    local s="$1"\n    _GEM_SEGS=()\n    local tok\n    while [ -n "$s" ]; do\n        if [[ "$s" =~ ^[0-9]+ ]]; then\n            tok="${BASH_REMATCH[0]}"\n            _GEM_SEGS+=("$tok")\n            s="${s:${#tok}}"\n        elif [[ "$s" =~ ^[A-Za-z]+ ]]; then\n            tok="${BASH_REMATCH[0]}"\n            _GEM_SEGS+=("$tok")\n            s="${s:${#tok}}"\n        else\n            # \'.\' separator (or any other stray char, e.g. a leftover \'+\'):\n            # skip exactly one character and keep scanning.\n            s="${s:1}"\n        fi\n    done\n}\n\n# Gem::Version#canonical_segments: drop trailing zeros from the release part\n# (numeric segments before the first string) and from the prerelease part, so\n# 1.0.0.pre.1 == 1.0.pre.1 and 1.0.0 == 1.\n_gem_canonical() {\n    local -a release=() pre=()\n    local seg in_pre=0\n    for seg in "${_GEM_SEGS[@]}"; do\n        if [ "$in_pre" = 0 ] && [[ "$seg" == *[!0-9]* ]]; then in_pre=1; fi\n        if [ "$in_pre" = 1 ]; then pre+=("$seg"); else release+=("$seg"); fi\n    done\n    while [ "${#release[@]}" -gt 0 ] && [[ "${release[-1]}" =~ ^0+$ ]]; do unset "release[$(( ${#release[@]} - 1 ))]"; done\n    while [ "${#pre[@]}" -gt 0 ] && [[ "${pre[-1]}" =~ ^0+$ ]]; do unset "pre[$(( ${#pre[@]} - 1 ))]"; done\n    _GEM_SEGS=("${release[@]}" "${pre[@]}")\n}\n\ncompare_versions_gem() {\n    # Canonicalize: \'-\' introduces a prerelease, identically to \'.pre.\'.\n    local v1="${1//-/.pre.}"\n    local v2="${2//-/.pre.}"\n\n    _gem_tokenize "$v1"\n    _gem_canonical\n    local -a segs1=("${_GEM_SEGS[@]}")\n    _gem_tokenize "$v2"\n    _gem_canonical\n    local -a segs2=("${_GEM_SEGS[@]}")\n\n    local len1=${#segs1[@]} len2=${#segs2[@]}\n    local maxlen=$len1\n    [ "$len2" -gt "$maxlen" ] && maxlen=$len2\n\n    local i s1 s2 isnum1 isnum2\n    for (( i = 0; i < maxlen; i++ )); do\n        s1="${segs1[$i]:-0}"\n        s2="${segs2[$i]:-0}"\n        [ "$s1" = "$s2" ] && continue\n\n        case "$s1" in \'\'|*[!0-9]*) isnum1=0 ;; *) isnum1=1 ;; esac\n        case "$s2" in \'\'|*[!0-9]*) isnum2=0 ;; *) isnum2=1 ;; esac\n\n        if [ "$isnum1" = 1 ] && [ "$isnum2" = 1 ]; then\n            compare_digits "$s1" "$s2"\n            [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n        elif [ "$isnum1" = 0 ] && [ "$isnum2" = 1 ]; then\n            COMPARE_RESULT="-1"; return   # string segment < numeric segment\n        elif [ "$isnum1" = 1 ] && [ "$isnum2" = 0 ]; then\n            COMPARE_RESULT="1"; return    # numeric segment > string segment\n        else\n            if [[ "$s1" < "$s2" ]]; then COMPARE_RESULT="-1"; return; fi\n            if [[ "$s1" > "$s2" ]]; then COMPARE_RESULT="1"; return; fi\n        fi\n    done\n\n    COMPARE_RESULT="0"\n}\n# Maven version comparator (Apache Maven ComparableVersion ordering). Routed to\n# from compare_versions_eco when CHECK_ECO=maven.\n#\n# This is a faithful port of org.apache.maven.artifact.versioning.ComparableVersion\n# (verified against apache/maven maven-3.9.x). A wrong ordering in a security tool\n# silently produces false negatives, so the algorithm is reproduced exactly rather\n# than approximated:\n#\n# PARSING (parseVersion): the lowercased string is tokenized into a tree of Items\n# (INT / STRING / nested LIST). Separators are \'.\' and \'-\', AND every digit<->letter\n# transition also splits a token. A \'-\' (and each digit/letter transition) opens a\n# new nested sub-list, so "1.0alpha1" and "1.0-alpha-1" parse to the identical tree\n# [1, [alpha, [1]]]. An empty token at a separator inserts an integer 0.\n#\n# QUALIFIER RANKING (comparableQualifier): known qualifiers map to their index in\n#   alpha(0) < beta(1) < milestone(2) < rc(3) < snapshot(4) < ""(5, release) < sp(6)\n# and unknown qualifiers map to the string "7-<qualifier>". Qualifiers are compared\n# as STRINGS (byte order), so an unknown qualifier ("7-xyz") sorts lexically AFTER\n# sp and the release ("5"/"6") \u2014 e.g. 1.0-xyz > 1.0. Aliases (case-insensitive):\n# ga/final/release -> "" ; cr -> rc ; and a single letter a/b/m -> alpha/beta/\n# milestone but ONLY when immediately followed by a digit (a1 == alpha-1, while a\n# trailing bare "a" stays the unknown qualifier "a").\n#\n# ITEM COMPARISON:\n#   * INT vs INT      : numeric (arbitrary precision \u2014 length then byte compare).\n#   * INT vs STRING   : INT wins (1.1 > 1-sp, so a numeric item outranks a qualifier).\n#   * INT vs LIST     : INT wins.\n#   * STRING vs STRING: comparableQualifier byte compare.\n#   * STRING vs LIST  : STRING loses (-1).\n#   * LIST vs LIST    : element-wise; a shorter list pads with a "null" item and the\n#                       missing side\'s compare is inverted (x.compareTo(null)).\n#   * X vs null       : INT 0 == null; STRING vs null == comparableQualifier vs "5"\n#                       (release); LIST vs null == firstChild vs null (empty == null).\n#\n# NORMALIZATION trims trailing "null" items (integer 0, release/empty qualifier,\n# empty list) from each list, so 1.0 == 1.0.0 == 1-0 == 1.0-0. This is why a\n# trailing 0 (1.0) equals a missing segment (1) yet 2.0.1 > 2.0.\n#\n# Contract mirrors compare_versions: sets COMPARE_RESULT (-1/0/1), no stdout, no\n# subshell in the hot path (the tree is built in flat bash arrays and walked with\n# plain recursion \u2014 no command substitution, no external processes).\n\n# Allocate one tree node. $1=type (0=int,1=string,2=list) $2=value. The node id\n# is returned in _MV_RET; per-comparison state lives in dynamically-scoped locals\n# declared by compare_versions_maven (_MV_TYPE / _MV_VAL / _MV_KIDS / _MV_N).\n_mv_new() {\n    _MV_TYPE[$_MV_N]="$1"\n    _MV_VAL[$_MV_N]="$2"\n    _MV_KIDS[$_MV_N]=""\n    _MV_RET=$_MV_N\n    _MV_N=$((_MV_N + 1))\n}\n\n# Append child node $2 to list node $1.\n_mv_addkid() {\n    if [ -z "${_MV_KIDS[$1]}" ]; then\n        _MV_KIDS[$1]="$2"\n    else\n        _MV_KIDS[$1]="${_MV_KIDS[$1]} $2"\n    fi\n}\n\n# Build a StringItem node from a raw (already-lowercased) qualifier token.\n# $2=followedByDigit (1/0) enables the single-letter a/b/m aliases; ga/final/\n# release/cr aliases always apply. Result id in _MV_RET.\n_mv_new_string() {\n    local val="$1"\n    if [ "$2" = 1 ] && [ "${#val}" -eq 1 ]; then\n        case "$val" in\n            a) val="alpha" ;;\n            b) val="beta" ;;\n            m) val="milestone" ;;\n        esac\n    fi\n    case "$val" in\n        ga|final|release) val="" ;;\n        cr) val="rc" ;;\n    esac\n    _mv_new 1 "$val"\n}\n\n# parseItem: a digit token becomes an INT node (leading zeros stripped, but at\n# least one digit kept); anything else becomes a StringItem (followedByDigit=0).\n_mv_parseitem() {\n    if [ "$1" = 1 ]; then\n        local v="$2"\n        while [ "${#v}" -gt 1 ] && [ "${v:0:1}" = "0" ]; do v="${v:1}"; done\n        _mv_new 0 "$v"\n    else\n        _mv_new_string "$2" 0\n    fi\n}\n\n# comparableQualifier -> _MV_CQ. Known qualifiers map to their single-digit index;\n# unknown qualifiers map to "7-<qualifier>" (so they byte-sort above sp/release).\n_mv_cq() {\n    case "$1" in\n        alpha)     _MV_CQ="0" ;;\n        beta)      _MV_CQ="1" ;;\n        milestone) _MV_CQ="2" ;;\n        rc)        _MV_CQ="3" ;;\n        snapshot)  _MV_CQ="4" ;;\n        "")        _MV_CQ="5" ;;\n        sp)        _MV_CQ="6" ;;\n        *)         _MV_CQ="7-$1" ;;\n    esac\n}\n\n# Byte-order string compare -> _MV_CMP (LC_ALL=C is set by the entrypoint so this\n# is a true code-point comparison, matching Java String.compareTo for this charset).\n_mv_strcmp() {\n    if [[ "$1" < "$2" ]]; then _MV_CMP=-1\n    elif [[ "$1" > "$2" ]]; then _MV_CMP=1\n    else _MV_CMP=0\n    fi\n}\n\n# Arbitrary-precision numeric compare of two leading-zero-stripped digit strings\n# -> _MV_CMP (shorter string is the smaller number; equal length falls back to\n# byte compare, which equals numeric order for equal-length digit strings).\n_mv_numcmp() {\n    if [ "${#1}" -lt "${#2}" ]; then _MV_CMP=-1; return; fi\n    if [ "${#1}" -gt "${#2}" ]; then _MV_CMP=1; return; fi\n    _mv_strcmp "$1" "$2"\n}\n\n# isNull: integer 0, release/empty qualifier, or empty list. Returns 0 (true) when\n# the node contributes nothing (subject to trailing trimming in normalize).\n_mv_isnull() {\n    case "${_MV_TYPE[$1]}" in\n        0) [ "${_MV_VAL[$1]}" = "0" ] ;;\n        1) [ -z "${_MV_VAL[$1]}" ] ;;\n        2) [ -z "${_MV_KIDS[$1]}" ] ;;\n    esac\n}\n\n# ListItem.normalize: drop trailing null items, continuing past non-null nested\n# lists (matching Maven\'s `else if (!(lastItem instanceof ListItem)) break`).\n_mv_normalize() {\n    # shellcheck disable=SC2206 # node ids: digits only, split on purpose (no here-string in this hot path)\n    local -a kids=(${_MV_KIDS[$1]})\n    local i cid\n    for (( i = ${#kids[@]} - 1; i >= 0; i-- )); do\n        cid="${kids[$i]}"\n        if _mv_isnull "$cid"; then\n            unset \'kids[$i]\'\n        elif [ "${_MV_TYPE[$cid]}" != 2 ]; then\n            break\n        fi\n    done\n    _MV_KIDS[$1]="${kids[*]}"\n}\n\n# parseVersion: tokenize $1 into a normalized Item tree; root list id -> _MV_RET.\n_mv_parse() {\n    local version="${1,,}"\n    _mv_new 2 ""\n    local root=$_MV_RET\n    local -a stack=("$root")\n    local list=$root\n    local isDigit=0 startIndex=0\n    local n=${#version} i c\n    for (( i = 0; i < n; i++ )); do\n        c="${version:i:1}"\n        if [ "$c" = "." ]; then\n            if [ "$i" -eq "$startIndex" ]; then\n                _mv_new 0 "0"; _mv_addkid "$list" "$_MV_RET"\n            else\n                _mv_parseitem "$isDigit" "${version:startIndex:i-startIndex}"; _mv_addkid "$list" "$_MV_RET"\n            fi\n            startIndex=$((i + 1))\n        elif [ "$c" = "-" ]; then\n            if [ "$i" -eq "$startIndex" ]; then\n                _mv_new 0 "0"; _mv_addkid "$list" "$_MV_RET"\n            else\n                _mv_parseitem "$isDigit" "${version:startIndex:i-startIndex}"; _mv_addkid "$list" "$_MV_RET"\n            fi\n            startIndex=$((i + 1))\n            _mv_new 2 ""; _mv_addkid "$list" "$_MV_RET"; list=$_MV_RET; stack+=("$list")\n        elif [[ "$c" == [0-9] ]]; then\n            if [ "$isDigit" = 0 ] && [ "$i" -gt "$startIndex" ]; then\n                if [ -n "${_MV_KIDS[$list]}" ]; then\n                    _mv_new 2 ""; _mv_addkid "$list" "$_MV_RET"; list=$_MV_RET; stack+=("$list")\n                fi\n                _mv_new_string "${version:startIndex:i-startIndex}" 1; _mv_addkid "$list" "$_MV_RET"\n                startIndex=$i\n                _mv_new 2 ""; _mv_addkid "$list" "$_MV_RET"; list=$_MV_RET; stack+=("$list")\n            fi\n            isDigit=1\n        else\n            if [ "$isDigit" = 1 ] && [ "$i" -gt "$startIndex" ]; then\n                _mv_parseitem 1 "${version:startIndex:i-startIndex}"; _mv_addkid "$list" "$_MV_RET"\n                startIndex=$i\n                _mv_new 2 ""; _mv_addkid "$list" "$_MV_RET"; list=$_MV_RET; stack+=("$list")\n            fi\n            isDigit=0\n        fi\n    done\n    if [ "$n" -gt "$startIndex" ]; then\n        if [ "$isDigit" = 0 ] && [ -n "${_MV_KIDS[$list]}" ]; then\n            _mv_new 2 ""; _mv_addkid "$list" "$_MV_RET"; list=$_MV_RET; stack+=("$list")\n        fi\n        _mv_parseitem "$isDigit" "${version:startIndex}"; _mv_addkid "$list" "$_MV_RET"\n    fi\n    # Normalize deepest-first (Maven pops the creation stack LIFO).\n    for (( i = ${#stack[@]} - 1; i >= 0; i-- )); do\n        _mv_normalize "${stack[$i]}"\n    done\n    _MV_RET=$root\n}\n\n# Compare item $1 (always concrete) against item $2 (a node id, or "" for null).\n# Result -> _MV_CMP (-1/0/1). Recurses for nested lists.\n_mv_compare() {\n    local l="$1" r="$2"\n    local lt="${_MV_TYPE[$l]}"\n    if [ -z "$r" ]; then\n        case "$lt" in\n            0) if [ "${_MV_VAL[$l]}" = "0" ]; then _MV_CMP=0; else _MV_CMP=1; fi ;;\n            1) _mv_cq "${_MV_VAL[$l]}"; _mv_strcmp "$_MV_CQ" "5" ;;\n            2) if [ -z "${_MV_KIDS[$l]}" ]; then\n                   _MV_CMP=0\n               else\n                   # shellcheck disable=SC2206 # node ids: digits only\n                   local -a lk=(${_MV_KIDS[$l]}); _mv_compare "${lk[0]}" ""\n               fi ;;\n        esac\n        return\n    fi\n    local rt="${_MV_TYPE[$r]}"\n    case "$lt" in\n        0) case "$rt" in\n               0) _mv_numcmp "${_MV_VAL[$l]}" "${_MV_VAL[$r]}" ;;\n               *) _MV_CMP=1 ;;\n           esac ;;\n        1) case "$rt" in\n               0) _MV_CMP=-1 ;;\n               1) _mv_cq "${_MV_VAL[$l]}"; local cl="$_MV_CQ"; _mv_cq "${_MV_VAL[$r]}"; _mv_strcmp "$cl" "$_MV_CQ" ;;\n               2) _MV_CMP=-1 ;;\n           esac ;;\n        2) case "$rt" in\n               0) _MV_CMP=-1 ;;\n               1) _MV_CMP=1 ;;\n               2) _mv_listcmp "$l" "$r" ;;\n           esac ;;\n    esac\n}\n\n# ListItem vs ListItem: walk children in lock-step, padding the shorter side with\n# a null item and inverting that side\'s comparison (Maven\'s -1 * r.compareTo(l)).\n_mv_listcmp() {\n    # shellcheck disable=SC2206 # node ids: digits only, split on purpose (no here-string in this hot path)\n    local -a lk=(${_MV_KIDS[$1]}) rk=(${_MV_KIDS[$2]})\n    local nl=${#lk[@]} nr=${#rk[@]}\n    local max=$nl\n    [ "$nr" -gt "$max" ] && max=$nr\n    local i lc rc\n    for (( i = 0; i < max; i++ )); do\n        if [ "$i" -lt "$nl" ]; then lc="${lk[$i]}"; else lc=""; fi\n        if [ "$i" -lt "$nr" ]; then rc="${rk[$i]}"; else rc=""; fi\n        if [ -z "$lc" ]; then\n            _mv_compare "$rc" ""\n            _MV_CMP=$(( -1 * _MV_CMP ))\n        else\n            _mv_compare "$lc" "$rc"\n        fi\n        [ "$_MV_CMP" -ne 0 ] && return\n    done\n    _MV_CMP=0\n}\n\ncompare_versions_maven() {\n    # Byte-order collation for all qualifier/string compares (C locale == Java\'s\n    # code-point order for the ASCII charset Maven versions use); standard IFS for\n    # the array split/join the tree walk relies on. Both are function-local.\n    local LC_ALL=C IFS=$\' \\t\\n\'\n    local -a _MV_TYPE=() _MV_VAL=() _MV_KIDS=()\n    local _MV_N=0 _MV_RET="" _MV_CMP=0 _MV_CQ=""\n\n    _mv_parse "$1"; local r1=$_MV_RET\n    _mv_parse "$2"; local r2=$_MV_RET\n    _mv_compare "$r1" "$r2"\n    COMPARE_RESULT="$_MV_CMP"\n}\n# NuGet version comparator (NuGet.Versioning ordering). Routed to from\n# compare_versions_eco when CHECK_ECO=nuget.\n#\n# NuGet versions are SemVer 2.0.0 PLUS an optional 4th numeric Revision\n# component: Major.Minor.Patch[.Revision][-prerelease][+metadata]. This is a\n# separate comparator because compare_versions only knows Major.Minor.Patch \u2014 it has no\n# concept of a 4th part, so it cannot be reused as-is:\n#   - build metadata (+meta) is stripped before comparison (SemVer 2.0.0:\n#     MUST be ignored for precedence), same as the go comparator strips\n#     +incompatible/+meta;\n#   - the Major.Minor.Patch.Revision QUAD is compared here directly, numeric\n#     part by numeric part; a missing Revision defaults to 0 (1.0.0 ==\n#     1.0.0.0), same rule the base compare_versions applies to a missing\n#     Patch;\n#   - once the quad is equal, the pre-release tail is compared using full\n#     SemVer-2 rules: dot-split identifiers, numeric identifiers compare\n#     numerically and rank below alphanumeric ones, and a longer identifier\n#     list that is a prefix-superset of the shorter one wins \u2014 the exact same\n#     dot-split ordering as the shared semver comparator, adapted to the\n#     case-insensitive rule below;\n#   - NuGet pre-release labels are compared CASE-INSENSITIVELY (this is where\n#     NuGet actually diverges from strict SemVer 2.0.0, which is\n#     case-sensitive): "1.0.0-BETA" == "1.0.0-beta". Both pre-release tails\n#     are lowercased before the dot-split comparison; the numeric quad itself\n#     has no case to normalize.\n#\n# Contract mirrors compare_versions: sets COMPARE_RESULT (-1/0/1), no stdout,\n# no subshell in the hot path.\ncompare_versions_nuget() {\n    # Strip build metadata (+meta) \u2014 ignored for precedence per SemVer 2.0.0.\n    local v1="${1%%+*}"\n    local v2="${2%%+*}"\n\n    # Split base (Major.Minor.Patch[.Revision]) from the pre-release tail.\n    local base1="${v1%%-*}"\n    local base2="${v2%%-*}"\n\n    # --- Compare the Major.Minor.Patch.Revision quad numerically ---\n    local -a parts1 parts2\n    IFS=\'.\' read -ra parts1 <<< "$base1"\n    IFS=\'.\' read -ra parts2 <<< "$base2"\n    local i\n    for i in 0 1 2 3; do\n        compare_digits "${parts1[$i]:-0}" "${parts2[$i]:-0}"\n        [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n    done\n\n    # --- Pre-release comparison (quads are equal) ---\n    local pre1="" pre2=""\n    [ "$v1" != "$base1" ] && pre1="${v1#*-}"\n    [ "$v2" != "$base2" ] && pre2="${v2#*-}"\n\n    # A version with a pre-release has LOWER precedence than one without.\n    if [ -z "$pre1" ] && [ -z "$pre2" ]; then COMPARE_RESULT="0"; return; fi\n    if [ -z "$pre1" ]; then COMPARE_RESULT="1"; return; fi\n    if [ -z "$pre2" ]; then COMPARE_RESULT="-1"; return; fi\n\n    # NuGet pre-release labels are case-insensitive: normalize before compare.\n    pre1="${pre1,,}"\n    pre2="${pre2,,}"\n\n    # Both have a pre-release: compare dot-split identifiers left to right\n    # (identical shape to compare_versions_go\'s pre-release loop).\n    local ids1 ids2\n    IFS=\'.\' read -ra ids1 <<< "$pre1"\n    IFS=\'.\' read -ra ids2 <<< "$pre2"\n    local len1=${#ids1[@]}\n    local len2=${#ids2[@]}\n    local maxlen=$len1\n    [ "$len2" -gt "$maxlen" ] && maxlen=$len2\n\n    local j id1 id2 isnum1 isnum2\n    for (( j = 0; j < maxlen; j++ )); do\n        # A larger set of pre-release fields (prefix-superset) wins.\n        if [ "$j" -ge "$len1" ]; then COMPARE_RESULT="-1"; return; fi\n        if [ "$j" -ge "$len2" ]; then COMPARE_RESULT="1"; return; fi\n\n        id1="${ids1[$j]}"\n        id2="${ids2[$j]}"\n        [ "$id1" = "$id2" ] && continue\n\n        # Numeric identifiers rank below alphanumeric ones; two numerics\n        # compare numerically; two alphanumerics compare lexically (ASCII).\n        case "$id1" in \'\'|*[!0-9]*) isnum1=0 ;; *) isnum1=1 ;; esac\n        case "$id2" in \'\'|*[!0-9]*) isnum2=0 ;; *) isnum2=1 ;; esac\n\n        if [ "$isnum1" = 1 ] && [ "$isnum2" = 1 ]; then\n            compare_digits "$id1" "$id2"\n            [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n        elif [ "$isnum1" = 1 ]; then\n            COMPARE_RESULT="-1"; return\n        elif [ "$isnum2" = 1 ]; then\n            COMPARE_RESULT="1"; return\n        else\n            if [[ "$id1" < "$id2" ]]; then COMPARE_RESULT="-1"; return; fi\n            if [[ "$id1" > "$id2" ]]; then COMPARE_RESULT="1"; return; fi\n        fi\n    done\n\n    COMPARE_RESULT="0"\n}\n# Composer (Packagist) version comparator. Routed to from compare_versions_eco\n# when CHECK_ECO=composer.\n#\n# Composer\'s VersionParser normalizes before comparing, and its ordering is not\n# semver\'s:\n#   * a leading "v" is cosmetic (v2.4.0 == 2.4.0);\n#   * the numeric part has any number of components (1.2.3.4), missing ones\n#     count as 0;\n#   * the stability suffix may be glued to the number (9.4.0RC1 == 9.4.0-RC1)\n#     and orders dev < alpha (a) < beta (b) < RC < stable < patch (pl, p);\n#   * "-pN" is a post-release patch (Magento 2.4.7-p4 > 2.4.7), not a\n#     pre-release;\n#   * the stability number compares numerically (beta10 > beta9).\n#\n# Contract mirrors compare_versions: sets COMPARE_RESULT (-1/0/1), no stdout,\n# no subshell.\n\n# Split a composer version into the globals _CV_NUMS (array of numeric parts),\n# _CV_RANK (stability rank), _CV_NUM (stability number) and _CV_TAIL (anything\n# left, compared lexically).\n_composer_parse() {\n    local v="${1,,}"\n    v="${v%%+*}"\n    [[ "$v" == v[0-9]* ]] && v="${v:1}"\n    local nums="" rest=""\n    if [[ "$v" =~ ^([0-9]+(\\.[0-9]+)*)(.*)$ ]]; then\n        nums="${BASH_REMATCH[1]}"\n        rest="${BASH_REMATCH[3]}"\n    else\n        rest="$v"\n    fi\n    IFS=\'.\' read -ra _CV_NUMS <<< "$nums"\n    _CV_RANK=4 _CV_NUM=0 _CV_TAIL=""\n    rest="${rest#[-._]}"\n    [ -z "$rest" ] && return\n    # The stability word must end the suffix or be followed by a separator:\n    # "preview" is not "p" (patch) followed by "review".\n    if [[ "$rest" =~ ^(dev|alpha|beta|rc|patch|pl|stable|a|b|c|p)[-._]?([0-9]*)([-._].*)?$ ]]; then\n        case "${BASH_REMATCH[1]}" in\n            dev) _CV_RANK=0 ;;\n            alpha|a) _CV_RANK=1 ;;\n            beta|b) _CV_RANK=2 ;;\n            rc|c) _CV_RANK=3 ;;\n            stable) _CV_RANK=4 ;;\n            patch|pl|p) _CV_RANK=5 ;;\n        esac\n        _CV_NUM="${BASH_REMATCH[2]:-0}"\n        _CV_TAIL="${BASH_REMATCH[3]}"\n    else\n        # Unknown suffix: rank it like a pre-release so it stays inside "<x.y.z".\n        _CV_RANK=0\n        _CV_TAIL="$rest"\n    fi\n}\n\ncompare_versions_composer() {\n    _composer_parse "$1"\n    local -a nums1=("${_CV_NUMS[@]}")\n    local rank1=$_CV_RANK num1=$_CV_NUM tail1=$_CV_TAIL\n    _composer_parse "$2"\n    local -a nums2=("${_CV_NUMS[@]}")\n    local rank2=$_CV_RANK num2=$_CV_NUM tail2=$_CV_TAIL\n\n    local i n1 n2 len=${#nums1[@]}\n    [ "${#nums2[@]}" -gt "$len" ] && len=${#nums2[@]}\n    for (( i = 0; i < len; i++ )); do\n        n1="${nums1[$i]:-0}" n2="${nums2[$i]:-0}"\n        while [[ "$n1" == 0* && ${#n1} -gt 1 ]]; do n1="${n1#0}"; done\n        while [[ "$n2" == 0* && ${#n2} -gt 1 ]]; do n2="${n2#0}"; done\n        if (( ${#n1} != ${#n2} )); then\n            (( ${#n1} < ${#n2} )) && COMPARE_RESULT=-1 || COMPARE_RESULT=1\n            return\n        fi\n        if [[ "$n1" < "$n2" ]]; then COMPARE_RESULT=-1; return; fi\n        if [[ "$n1" > "$n2" ]]; then COMPARE_RESULT=1; return; fi\n    done\n\n    if (( rank1 != rank2 )); then\n        (( rank1 < rank2 )) && COMPARE_RESULT=-1 || COMPARE_RESULT=1\n        return\n    fi\n    compare_digits "$num1" "$num2"\n    [ "$DIGITS_CMP" = 0 ] || { COMPARE_RESULT="$DIGITS_CMP"; return; }\n    _composer_tail_cmp "$tail1" "$tail2"\n    COMPARE_RESULT="$DIGITS_CMP"\n}\n\n# Order the remainders after the stability number: a "-dev" tail precedes\n# the bare release (1.0.0-RC1-dev < 1.0.0-RC1), which precedes any other\n# tail; other tails compare part by part, numbers numerically\n# (beta.1.2 < beta.1.10). Sets DIGITS_CMP.\n_composer_tail_cmp() {\n    local t1="${1#[-._]}" t2="${2#[-._]}" k1=1 k2=1\n    [ -z "$t1" ] || k1=2\n    [ -z "$t2" ] || k2=2\n    [[ "$t1" != dev* ]] || k1=0\n    [[ "$t2" != dev* ]] || k2=0\n    if [ "$k1" != "$k2" ]; then\n        [ "$k1" -lt "$k2" ] && DIGITS_CMP=-1 || DIGITS_CMP=1\n        return\n    fi\n    DIGITS_CMP=0\n    [ "$k1" = 2 ] || return 0\n    local -a p1 p2\n    IFS=\'-._\' read -ra p1 <<< "$t1"\n    IFS=\'-._\' read -ra p2 <<< "$t2"\n    local i n=${#p1[@]}\n    [ "${#p2[@]}" -le "$n" ] || n=${#p2[@]}\n    for (( i = 0; i < n; i++ )); do\n        compare_digits "${p1[$i]:-0}" "${p2[$i]:-0}"\n        [ "$DIGITS_CMP" = 0 ] || return 0\n    done\n}\n# Pub (Dart) version comparator. Routed to from compare_versions_eco when\n# CHECK_ECO=pub.\n#\n# Pub orders build metadata, unlike semver: 0.3.5 < 0.3.5+1 < 0.3.5+2 (pub\n# publishes fixes as "+N" builds). Versions compare as semver first; when they\n# are equal, a version without build metadata is lower, and two builds compare\n# like pre-release identifiers (dot-separated, numeric parts numerically).\n#\n# Contract mirrors compare_versions: sets COMPARE_RESULT (-1/0/1), no stdout,\n# no subshell.\ncompare_versions_pub() {\n    local v1="$1" v2="$2" build1="" build2=""\n    [[ "$v1" == *+* ]] && build1="${v1#*+}"\n    [[ "$v2" == *+* ]] && build2="${v2#*+}"\n    compare_versions "${v1%%+*}" "${v2%%+*}"\n    [ "$COMPARE_RESULT" = 0 ] || return 0\n    if [ -z "$build1" ] && [ -z "$build2" ]; then return 0; fi\n    if [ -z "$build1" ]; then COMPARE_RESULT=-1; return 0; fi\n    if [ -z "$build2" ]; then COMPARE_RESULT=1; return 0; fi\n    compare_versions "0.0.0-$build1" "0.0.0-$build2"\n}\n# Severity rank used to compare and count advisories (sets SEV_RANK).\n# GHSA spells medium "moderate".\nseverity_rank() {\n    case "${1,,}" in\n        critical) SEV_RANK=4 ;;\n        high) SEV_RANK=3 ;;\n        medium|moderate) SEV_RANK=2 ;;\n        low) SEV_RANK=1 ;;\n        *) SEV_RANK=0 ;;\n    esac\n}\n\n# Collect the advisories attached to a matched version/range into the\n# caller\'s adv_list (records "severity;ghsa;cve;source;fix;id") and adv_ids\n# (identity -> index). GHSA and OSV describe the same advisory in two records:\n# records sharing a GHSA id, a CVE or an OSV id merge into one entry whose\n# sources accumulate ("ghsa, osv") and whose missing fields are filled in.\n# Two different GHSA ids never merge.\nrecord_matching_advisories() {\n    local lookup_key="$1"\n    local records="${VULN_RECORDS[$lookup_key]:-}"\n    local record severity ghsa cve source fix id idx key\n    local s0 g0 c0 src0 f0 i0\n    [ -n "$records" ] || records=";;;;;"\n    while IFS= read -r record; do\n        [ -n "$record" ] || continue\n        IFS=\';\' read -r severity ghsa cve source fix id <<< "$record"\n        idx=""\n        if [ -n "$ghsa$cve$id" ]; then\n            for key in ${ghsa:+"ghsa:$ghsa"} ${cve:+"cve:$cve"} ${id:+"id:$id"}; do\n                [ -n "${adv_ids[$key]+x}" ] || continue\n                idx="${adv_ids[$key]}"\n                IFS=\';\' read -r s0 g0 c0 src0 f0 i0 <<< "${adv_list[$idx]}"\n                if [ -n "$ghsa" ] && [ -n "$g0" ] && [ "$ghsa" != "$g0" ]; then\n                    idx=""\n                    continue\n                fi\n                break\n            done\n        elif [ -n "${adv_ids[record:$record]+x}" ]; then\n            continue\n        fi\n        if [ -z "$idx" ]; then\n            idx=${#adv_list[@]}\n            adv_list+=("$record")\n            [ -n "$ghsa$cve$id" ] || adv_ids["record:$record"]="$idx"\n        else\n            IFS=\';\' read -r s0 g0 c0 src0 f0 i0 <<< "${adv_list[$idx]}"\n            severity_rank "$s0"; local rank0=$SEV_RANK\n            severity_rank "$severity"\n            [ "$SEV_RANK" -gt "$rank0" ] || severity="$s0"\n            case ", $src0, " in\n                *", $source, "*) source="$src0" ;;\n                *) source="${src0:+$src0${source:+, }}$source" ;;\n            esac\n            adv_list[$idx]="$severity;${g0:-$ghsa};${c0:-$cve};$source;${f0:-$fix};${i0:-$id}"\n            IFS=\';\' read -r severity ghsa cve source fix id <<< "${adv_list[$idx]}"\n        fi\n        for key in ${ghsa:+"ghsa:$ghsa"} ${cve:+"cve:$cve"} ${id:+"id:$id"}; do\n            adv_ids["$key"]="$idx"\n        done\n    done <<< "$records"\n}\n\n# Store the merged advisories of one finding. VULN_ADVISORIES keeps them all\n# ("rec||rec"); the VULN_METADATA_* summary uses the most severe advisory and\n# VULN_METADATA_FIX the highest fixed version (the one that fixes them all).\nfinalize_advisories() {\n    local result_key="$1" rec joined="" best="" best_rank=-1 fixed=""\n    local severity ghsa cve source fix id\n    for rec in "${adv_list[@]}"; do\n        joined+="${joined:+||}$rec"\n        IFS=\';\' read -r severity ghsa cve source fix id <<< "$rec"\n        severity_rank "$severity"\n        if [ "$SEV_RANK" -gt "$best_rank" ]; then best_rank=$SEV_RANK; best="$rec"; fi\n        if [ -n "$fix" ]; then\n            if [ -z "$fixed" ]; then\n                fixed="$fix"\n            else\n                compare_versions_eco "$CHECK_ECO" "$fix" "$fixed"\n                [ "$COMPARE_RESULT" != 1 ] || fixed="$fix"\n            fi\n        fi\n    done\n    VULN_ADVISORIES["$result_key"]="$joined"\n    IFS=\';\' read -r severity ghsa cve source fix id <<< "$best"\n    VULN_METADATA_SEVERITY["$result_key"]="$severity"\n    VULN_METADATA_GHSA["$result_key"]="$ghsa"\n    VULN_METADATA_CVE["$result_key"]="$cve"\n    VULN_METADATA_SOURCE["$result_key"]="$source"\n    VULN_METADATA_FIX["$result_key"]="$fixed"\n}\n\n# Canonical form of a user-supplied package name for an ecosystem (the form\n# the lockfile parsers and feeds use). Sets CANON_NAME.\ncanonical_package_name() {\n    case "$1" in\n        pypi) _pypi_normalize_name "$2"; CANON_NAME="$PEP503_NAME" ;;\n        nuget|composer|githubactions) CANON_NAME="${2,,}" ;;\n        # groupId/artifactId (purl form) -> groupId:artifactId (lockfile form)\n        maven) CANON_NAME="${2//\\//:}" ;;\n        swift)\n            local n="${2,,}"\n            n="${n#*://}"; n="${n%/}"; n="${n%.git}"\n            CANON_NAME="$n" ;;\n        *) CANON_NAME="$2" ;;\n    esac\n}\n\n# Probe ecosystem-specific and wildcard feeds without cross-ecosystem leakage.\n# Args: ecosystem package version source-file. With --package-name, only that\n# package (PACKAGE_FILTER = "eco:name") is reported.\ncheck_vulnerability() {\n    local eco="$1" name="$2" version="$3" source="$4"\n    CHECKED_PACKAGE_COUNT=$(( ${CHECKED_PACKAGE_COUNT:-0} + 1 ))\n    if [ -n "${PACKAGE_FILTER:-}" ] && [ "$eco:$name" != "$PACKAGE_FILTER" ]; then\n        return 1\n    fi\n    # Most installed packages have no advisory. Avoid allocating per-advisory\n    # maps and parsing four empty lists for every such dependency in a lockfile.\n    # Wildcard sources (CSV, JSON, reports without a purl) keep names as their\n    # author wrote them: they are keyed by a loose form (lowercase, runs of\n    # - _ . as one "-", see loose_name in AWK_FEED_LIB), probed the same way.\n    local loose="${name,,}"\n    loose="${loose//[_.]/-}"\n    while [[ "$loose" == *--* ]]; do loose="${loose//--/-}"; done\n    if [ -z "${VULN_EXACT_LOOKUP[$eco:$name]+x}" ] &&\n        [ -z "${VULN_RANGE_LOOKUP[$eco:$name]+x}" ] &&\n        [ -z "${VULN_EXACT_LOOKUP[*:$loose]+x}" ] &&\n        [ -z "${VULN_RANGE_LOOKUP[*:$loose]+x}" ]; then\n        return 1\n    fi\n    CHECK_ECO="$eco"\n    local result_key="${eco}:${name}@${version}"\n    local -a probe_keys=("${eco}:${name}")\n    [ "$eco" = "*" ] || probe_keys+=("*:${loose}")\n    local pk candidate lookup_key message="" found=false\n    local -a candidates\n    local -A seen_candidates=() adv_ids=()\n    local -a adv_list=()\n    local collect=true\n    [ -z "${VULN_ADVISORIES[$result_key]+x}" ] || collect=false\n\n    for pk in "${probe_keys[@]}"; do\n        IFS=\'|\' read -ra candidates <<< "${VULN_EXACT_LOOKUP[$pk]:-}"\n        for candidate in "${candidates[@]}"; do\n            [ -n "$candidate" ] || continue\n            lookup_key="${pk}@${candidate}"\n            [ -z "${seen_candidates[$lookup_key]+x}" ] || continue\n            seen_candidates["$lookup_key"]=1\n            if version_matches_vulnerable "$version" "$candidate"; then\n                if [ "$found" = false ]; then\n                    if [ "$version" = "$candidate" ]; then\n                        message="(vulnerable)"\n                    else\n                        message="(vulnerable - pre-release of $candidate)"\n                    fi\n                fi\n                found=true\n                if [ "$collect" = true ]; then\n                    record_matching_advisories "$lookup_key"\n                fi\n            fi\n        done\n\n        # Newlines separate complete ranges, preserving OR (||) expressions.\n        while IFS= read -r candidate; do\n            [ -n "$candidate" ] || continue\n            lookup_key="${pk}:${candidate}"\n            [ -z "${seen_candidates[$lookup_key]+x}" ] || continue\n            seen_candidates["$lookup_key"]=1\n            if version_in_range "$version" "$candidate"; then\n                if [ "$found" = false ]; then\n                    message="(vulnerable - matches range: $candidate)"\n                fi\n                found=true\n                if [ "$collect" = true ]; then\n                    record_matching_advisories "$lookup_key"\n                fi\n            fi\n        done <<< "${VULN_RANGE_LOOKUP[$pk]:-}"\n    done\n\n    if [ "$found" = true ]; then\n        [ "$collect" = false ] || finalize_advisories "$result_key"\n        echo -e "${RED}\u26A0\uFE0F  [$source] $name@$version $message${NC}"\n        FOUND_VULNERABLE=1\n        VULNERABLE_PACKAGES+=("$source|$eco|$name@$version")\n        return 0\n    fi\n    return 1\n}\nanalyze_package_lock() {\n    local lockfile="$1"\n    local eco="${2:-npm}"\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n    local packages\n\n    # Read the packages map (v2/v3) or recursive dependencies tree (v1).\n    # Structural records keep JSON whitespace and property order irrelevant.\n    packages=$(json_structural_lines "$lockfile" | awk \'\n    function key(line) {\n        sub(/^[[:space:]]*"/, "", line)\n        sub(/"[[:space:]]*:.*/, "", line)\n        gsub(/\\\\\\//, "/", line)\n        return line\n    }\n    function value(line) {\n        sub(/^[[:space:]]*"[^"]*"[[:space:]]*:[[:space:]]*"/, "", line)\n        sub(/"[[:space:]]*$/, "", line)\n        gsub(/\\\\\\//, "/", line)\n        return line\n    }\n    {\n        line = $0\n        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)\n        if (line ~ /[\\{\\[]$/) {\n            field = key(line)\n            parent = kind[depth]\n            depth++\n            kind[depth] = "other"\n            names[depth] = versions[depth] = ""\n            linked[depth] = 0\n            if (depth == 2 && field == "packages") {\n                kind[depth] = "packages"\n                have_packages = 1\n            } else if (field == "dependencies" && (depth == 2 || parent == "legacy")) {\n                kind[depth] = "dependencies"\n            } else if (parent == "packages" && field ~ /(^|\\/)node_modules\\//) {\n                kind[depth] = "modern"\n                sub(/^.*node_modules\\//, "", field)\n                names[depth] = field\n            } else if (parent == "dependencies") {\n                kind[depth] = "legacy"\n                names[depth] = field\n            }\n            next\n        }\n        if (line == "}" || line == "]") {\n            if (names[depth] != "" && versions[depth] != "" && !linked[depth]) {\n                name = names[depth]; ver = versions[depth]\n                if (ver ~ /^npm:/) {\n                    sub(/^npm:/, "", ver)\n                    if (match(ver, /@[^@]+$/)) {\n                        name = substr(ver, 1, RSTART - 1)\n                        ver = substr(ver, RSTART + 1)\n                    }\n                }\n                if (kind[depth] == "modern") modern[name "|" ver] = 1\n                else if (kind[depth] == "legacy") legacy[name "|" ver] = 1\n            }\n            depth--\n            next\n        }\n        if (kind[depth] == "modern" || kind[depth] == "legacy") {\n            if (line ~ /^"version"[[:space:]]*:[[:space:]]*"/) versions[depth] = value(line)\n            else if (line ~ /^"name"[[:space:]]*:[[:space:]]*"/) names[depth] = value(line)\n            else if (line ~ /^"link"[[:space:]]*:[[:space:]]*true/) linked[depth] = 1\n        }\n    }\n    END {\n        if (have_packages) { for (entry in modern) print entry }\n        else { for (entry in legacy) print entry }\n    }\' | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    if [ "${#VULNERABLE_PACKAGES[@]}" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Function to analyze a yarn.lock file\n# Optimized: uses awk for batch extraction (POSIX-compatible)\n# Supports both Yarn Classic (v1) and Yarn Berry (v2+) formats\nanalyze_yarn_lock() {\n    local lockfile="$1"\n    local eco="${2:-npm}"\n\n    # Track vulnerabilities found in this file\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    # Use awk to extract all packages in one pass (POSIX-compatible)\n    local packages\n    packages=$(awk \'\n    # Package name of one yarn descriptor ("name@range", "@scope/name@range").\n    # An npm alias "alias@npm:real@^1" installs "real", so return that.\n    function spec_name(spec,   at, name, rest) {\n        at = index(substr(spec, 2), "@")\n        if (at == 0) return ""\n        name = substr(spec, 1, at)\n        rest = substr(spec, at + 2)\n        if (rest ~ /^npm:/) {\n            rest = substr(rest, 5)\n            at = index(substr(rest, 2), "@")\n            if (at > 0) name = substr(rest, 1, at)\n        }\n        return name\n    }\n    function flush() {\n        if (pkg != "" && ver != "" && ver !~ /^(workspace|file|link|npm|portal|patch|exec):/ && ver != "0.0.0-use.local")\n            print pkg "|" ver\n        pkg = ver = indent = ""\n    }\n    { sub(/\\r$/, "") }\n    # Block header: one or more comma-separated descriptors ending in ":".\n    /^[^[:space:]#].*:$/ {\n        flush()\n        line = $0\n        sub(/:$/, "", line)\n        gsub(/"/, "", line)\n        sub(/,.*/, "", line)\n        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)\n        if (line != "__metadata") pkg = spec_name(line)\n        next\n    }\n    # The first property line sets the indentation of the entry fields: a\n    # dependency named "version" sits deeper, under dependencies:.\n    pkg != "" && indent == "" && match($0, /^[[:space:]]+[^[:space:]]/) { indent = substr($0, 1, RLENGTH - 1) }\n    # Classic: version "x.y.z"   Berry: version: x.y.z\n    /^[[:space:]]+version[[:space:]:]/ && pkg != "" && ver == "" && substr($0, 1, length(indent) + 1) == indent "v" {\n        line = $0\n        sub(/^[[:space:]]+version[[:space:]:]+/, "", line)\n        gsub(/"/, "", line)\n        gsub(/[[:space:]].*/, "", line)\n        ver = line\n        next\n    }\n    # Berry records the installed package itself: resolution: "real@npm:1.2.3"\n    /^[[:space:]]+resolution:[[:space:]]/ && pkg != "" {\n        line = $0\n        sub(/^[[:space:]]+resolution:[[:space:]]+/, "", line)\n        gsub(/"/, "", line)\n        at = index(substr(line, 2), "@")\n        if (at > 0 && substr(line, at + 2) ~ /^npm:/) pkg = substr(line, 1, at)\n        next\n    }\n    END { flush() }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    # Process extracted packages\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    # Check if vulnerabilities were found in this file\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Function to analyze a pnpm-lock.yaml file\n# Optimized: unified awk extraction for both formats (POSIX-compatible)\nanalyze_pnpm_lock() {\n    local lockfile="$1"\n    local eco="${2:-npm}"\n\n    # Track vulnerabilities found in this file\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    # Use awk to extract all packages in one pass (POSIX-compatible)\n    local packages\n    packages=$(awk \'\n    BEGIN { in_packages=0 }\n    /^packages:/ { in_packages=1; next }\n    /^[a-zA-Z]/ && !/^[[:space:]]/ && in_packages { in_packages=0 }\n    in_packages {\n        line = $0\n        # A package installed from a tarball URL or git names no version in\n        # its key ("xlsx@https://...", or before pnpm 9 a host path such as\n        # "github.com/owner/repo/<sha>" without even the name): pnpm records\n        # them in the name: and version: fields of the block.\n        if (want_fields && line ~ /^    (name|version):[[:space:]]*[^[:space:]]/) {\n            value = line\n            sub(/^    [a-z]+:[[:space:]]*/, "", value)\n            gsub(/[\\047"[:space:]]/, "", value)\n            if (line ~ /^    name:/) field_name = value\n            else field_version = value\n            if (field_name != "" && field_version != "") {\n                print field_name "|" field_version\n                want_fields = 0\n            }\n            next\n        }\n        # Only package-map keys, never nested dependency metadata.\n        if (line !~ /^  [^[:space:]].*:[[:space:]]*$/) next\n        want_fields = 0; field_name = ""; field_version = ""\n        # Remove leading whitespace\n        gsub(/^[[:space:]]+/, "", line)\n        # Remove trailing colon\n        gsub(/:[[:space:]]*$/, "", line)\n        # Remove surrounding quotes (single or double)\n        gsub(/^[\\047"]/, "", line)\n        gsub(/[\\047"]$/, "", line)\n        # Remove leading slash (old format)\n        gsub(/^\\//, "", line)\n\n        # Peer suffixes identify resolutions of this same installed version.\n        sub(/\\(.*/, "", line)\n        # pnpm <=7 uses /name/version, with optional _peer context. The\n        # trailing segment must be a version: "@scope/3d-lib@1.0.0" is the\n        # modern format with a name that merely starts with a digit.\n        if (match(line, /\\/[0-9][^\\/]*$/)) {\n            seg = substr(line, RSTART + 1)\n            if (seg ~ /^[0-9]+\\.[0-9]+[^@]*(_|$)/) {\n                pkg_name = substr(line, 1, RSTART - 1)\n                version = seg\n                sub(/_.*/, "", version)\n                print pkg_name "|" version\n                next\n            }\n        }\n\n        # Remote tarball or git source: the version follows in the block.\n        at = index(substr(line, 2), "@")\n        if (at > 0 && substr(line, at + 2) ~ /^(https?:|git\\+|git:|github:)/) {\n            want_fields = 1\n            field_name = substr(line, 1, at)\n            next\n        }\n\n        # name@version, split at the first "@" after a leading scope marker.\n        if (at > 0 && substr(line, at + 2) ~ /^[0-9]/) {\n            print substr(line, 1, at) "|" substr(line, at + 2)\n            next\n        }\n\n        # The key names no version: read the name: and version: fields.\n        want_fields = 1\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    # Process extracted packages\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    # Check if vulnerabilities were found in this file\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Function to analyze a bun.lock file\n# Optimized: uses awk for batch extraction (POSIX-compatible)\nanalyze_bun_lock() {\n    local lockfile="$1"\n    local eco="${2:-npm}"\n\n    # Track vulnerabilities found in this file\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    # Use awk to extract all packages in one pass (POSIX-compatible)\n    local packages\n    packages=$(awk \'\n    { sub(/\\r$/, "") }\n    # Top-level keys sit at a two-space indent; only "packages" holds\n    # resolved versions ("workspaces" lists the requested specs, e.g. "2").\n    /^  "[^"]+"[[:space:]]*:/ {\n        section = $0\n        sub(/^  "/, "", section)\n        sub(/".*/, "", section)\n    }\n    section != "packages" { next }\n    # Remote tarball: ["pkg@https://.../<base>-<version>.tgz", ...]. bun\n    # records no version, so read it from the file name; skip it otherwise.\n    match($0, /\\["[^"]+@https?:[^"]*"/) {\n        temp = substr($0, RSTART + 2, RLENGTH - 3)\n        idx = index(substr(temp, 2), "@")\n        pkg_name = substr(temp, 1, idx)\n        file = substr(temp, idx + 2)\n        sub(/[?#].*/, "", file)\n        sub(/.*\\//, "", file)\n        sub(/\\.(tgz|tar\\.gz)$/, "", file)\n        base = pkg_name\n        sub(/.*\\//, "", base)\n        if (substr(file, 1, length(base) + 1) == base "-") {\n            version = substr(file, length(base) + 2)\n            if (version ~ /^[0-9]/) print pkg_name "|" version\n        }\n        next\n    }\n    # Package entries: "key": ["pkg@version", ...]. Only the first element of\n    # an entry names the installed version: the dependencies and\n    # peerDependencies objects that follow it list requested specs\n    # ("minimist": "0.0.8" under mkdirp), never installed versions.\n    match($0, /^[[:space:]]*"[^"]+"[[:space:]]*:[[:space:]]*\\["[^"]+@[0-9][^"]*"/) {\n        temp = substr($0, RSTART, RLENGTH)\n        sub(/^.*\\["/, "", temp)\n        sub(/"$/, "", temp)\n        # Split at last @\n        idx = 0\n        for (i=length(temp); i>0; i--) {\n            if (substr(temp, i, 1) == "@") { idx = i; break }\n        }\n        if (idx > 1) print substr(temp, 1, idx-1) "|" substr(temp, idx+1)\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    # Process extracted packages\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    # Check if vulnerabilities were found in this file\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Function to analyze a deno.lock file\n# Optimized: uses awk for batch extraction (POSIX-compatible)\nanalyze_deno_lock() {\n    local lockfile="$1"\n    local eco="${2:-npm}"\n\n    # Track vulnerabilities found in this file\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    # Only the keys of the npm package map name installed npm packages:\n    # "npm" (lockfile v4/v5), "packages"."npm" (v3) and "npm"."packages" (v2).\n    # jsr packages, specifiers and remote URLs sit in sibling sections and\n    # are not npm packages. json_structural_lines makes the layout (pretty or\n    # compact) irrelevant: an object opens at the end of its record.\n    local packages\n    packages=$(json_structural_lines "$lockfile" 2>/dev/null | awk \'\n    {\n        rec = $0\n        sub(/[[:space:]]+$/, "", rec)\n        if (rec == "}" || rec == "]") { if (depth > 0) depth--; next }\n        last = substr(rec, length(rec))\n        if (last != "{" && last != "[") next\n        key = ""\n        if (match(rec, /^[[:space:]]*"[^"]*"[[:space:]]*:/)) {\n            key = substr(rec, RSTART, RLENGTH)\n            sub(/^[[:space:]]*"/, "", key)\n            sub(/"[[:space:]]*:$/, "", key)\n        }\n        in_npm = (depth == 2 && stack[2] == "npm") ||\n            (depth == 3 && stack[2] == "packages" && stack[3] == "npm") ||\n            (depth == 3 && stack[2] == "npm" && stack[3] == "packages")\n        # Name/version split at the first "@" after the scope marker.\n        # Package names may contain "_" (string_decoder): only the\n        # version carries the "_peer@x" suffix, so strip it there.\n        at_idx = index(substr(key, 2), "@")\n        if (in_npm && last == "{" && at_idx > 0) {\n            pkg_name = substr(key, 1, at_idx)\n            version = substr(key, at_idx + 2)\n            sub(/_.*/, "", version)\n            if (version ~ /^[0-9]/) print pkg_name "|" version\n        }\n        stack[++depth] = key\n    }\n    \' | sort -u)\n\n    # Process extracted packages\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    # Check if vulnerabilities were found in this file\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Export vulnerabilities to JSON format\n# Output includes package name, version, severity, GHSA, CVE, and source\n# ============================================================================\n# Ecosystem registry \u2014 single source of truth for lockfile discovery/dispatch.\n#\n# Each entry: "basename|purl-type|parser-function|type-alias"\n#   basename        exact lockfile filename matched with `find -name`\n#   purl-type       ecosystem namespace passed to check_vulnerability and used\n#                   to resolve per-ecosystem default feeds (ghsa-<eco>.purl)\n#   parser-function analyzer invoked as: <fn> <lockfile> <purl-type>\n#   type-alias      user-facing name for --lockfile-types / --ecosystems\n#\n# Support for a new ecosystem is added by APPENDING one line here (plus the\n# matching parser file). Keep the npm rows first so the derived find-pattern\n# order stays byte-identical to the legacy hardcoded list.\n#\n# GitHub Actions is discovered by PATH (.github/workflows/*.yml|*.yaml), not by\n# a fixed lockfile basename, so it is declared in the parallel\n# PATH_ECOSYSTEM_REGISTRY below \u2014 NOT as a row in this table, whose derivations\n# all assume a fixed filename (find `-name`, basename dispatch, and the GitHub\n# code-search filename list). This file is the ONE place both registries live;\n# discover_project_files and the main() dispatch loop special-case path entries\n# via path_ecosystem_match (parser: src/50-ecosystems/60-actions.sh).\n# ============================================================================\nECOSYSTEM_REGISTRY=(\n    "package-lock.json|npm|analyze_package_lock|npm"\n    "npm-shrinkwrap.json|npm|analyze_package_lock|npm"\n    "yarn.lock|npm|analyze_yarn_lock|yarn"\n    "pnpm-lock.yaml|npm|analyze_pnpm_lock|pnpm"\n    "bun.lock|npm|analyze_bun_lock|bun"\n    "deno.lock|npm|analyze_deno_lock|deno"\n    "Cargo.lock|cargo|analyze_toml_pkg_lock|rust"\n    "go.sum|golang|analyze_go_sum|go"\n    "go.mod|golang|analyze_go_mod|go"\n    "requirements.txt|pypi|analyze_requirements_txt|python"\n    "poetry.lock|pypi|analyze_toml_pkg_lock|python"\n    "uv.lock|pypi|analyze_toml_pkg_lock|python"\n    "pdm.lock|pypi|analyze_toml_pkg_lock|python"\n    "Pipfile.lock|pypi|analyze_pipfile_lock|python"\n    "Gemfile.lock|gem|analyze_gemfile_lock|ruby"\n    "composer.lock|composer|analyze_composer_lock|php"\n    "gradle.lockfile|maven|analyze_gradle_lockfile|maven"\n    "pom.xml|maven|analyze_pom_xml|maven"\n    "packages.lock.json|nuget|analyze_nuget_lock|nuget"\n    "pubspec.lock|pub|analyze_pubspec_lock|dart"\n    "mix.lock|hex|analyze_mix_lock|hex"\n    "Package.resolved|swift|analyze_package_resolved|swift"\n)\n\n# ============================================================================\n# Path-discovered ecosystems \u2014 the parallel to ECOSYSTEM_REGISTRY for\n# ecosystems selected by a directory PATH pattern or a filename glob instead of\n# a fixed lockfile basename. GitHub Actions workflow YAML lives at a well-known\n# path (.github/workflows/*.yml|*.yaml) under ARBITRARY filenames, and pip\n# projects split pins into requirements-*.txt or requirements/*.txt, so `find\n# -name <basename>` cannot select them and `basename` cannot dispatch them. Both the find-args\n# builder and the dispatcher special-case these entries (see discover_project_files\n# and the analysis loop in src/90-main.sh); path_ecosystem_match() below is the\n# single resolver they share.\n#\n# Each entry: "path-glob|name-globs|purl-type|parser-function|type-alias"\n#   path-glob        find -path pattern selecting the containing directory\n#   name-globs       comma-separated -name patterns (OR-ed) for the filename\n#   purl-type        ecosystem namespace (as in ECOSYSTEM_REGISTRY)\n#   parser-function  analyzer invoked as: <fn> <file> <purl-type>\n#   type-alias       user-facing --lockfile-types / --ecosystems name\n#\n# NOTE: path ecosystems are deliberately absent from ecosystem_scan_filenames()\n# (the GitHub org-scan search) \u2014 matching arbitrary-named workflow YAML across a\n# whole repo tree via the code-search API is too noisy \u2014 so GitHub org scanning\n# does not fetch workflow files. This is a documented limitation.\nPATH_ECOSYSTEM_REGISTRY=(\n    "*/.github/workflows/*|*.yml,*.yaml|githubactions|analyze_github_workflow|actions"\n    "*|requirements-*.txt,requirements_*.txt,*-requirements.txt,*_requirements.txt,constraints.txt,constraints-*.txt|pypi|analyze_requirements_txt|python"\n    "*|*-gradle.lockfile|maven|analyze_gradle_lockfile|maven"\n    "*/requirements/*|*.txt|pypi|analyze_requirements_txt|python"\n)\n\n# Resolve a discovered file to its path-ecosystem. Echoes "parser|eco|alias"\n# for the FIRST PATH_ECOSYSTEM_REGISTRY entry whose path-glob matches $1 and one\n# of whose name-globs matches its basename; returns non-zero with no output when\n# nothing matches. Shared by the detection loop and the dispatcher so a workflow\n# file routes to its analyzer without a basename key. `case` patterns are used\n# (not filesystem globbing): the name-globs are read via IFS to avoid pathname\n# expansion, and `$glob`/`$path_glob` act as pattern metacharacters in `case`.\npath_ecosystem_match() {\n    # NB: separate declarations \u2014 `local file=.. base=${file##*/}` would expand\n    # base against file\'s OUTER value (bash evaluates all `local` args before\n    # assigning), yielding an empty basename.\n    local file="$1"\n    local base="${file##*/}"\n    local entry path_glob name_globs eco parser alias glob\n    local -a globs\n    for entry in "${PATH_ECOSYSTEM_REGISTRY[@]}"; do\n        IFS=\'|\' read -r path_glob name_globs eco parser alias <<< "$entry"\n        # SC2254: $path_glob is INTENTIONALLY unquoted so it acts as a glob\n        # pattern (e.g. */.github/workflows/*), not a literal string.\n        # shellcheck disable=SC2254\n        case "$file" in\n            $path_glob) ;;\n            *) continue ;;\n        esac\n        IFS=\',\' read -ra globs <<< "$name_globs"\n        for glob in "${globs[@]}"; do\n            # SC2254: $glob is INTENTIONALLY unquoted so *.yml / *.yaml match as\n            # patterns rather than literal filenames.\n            # shellcheck disable=SC2254\n            case "$base" in\n                $glob) printf \'%s|%s|%s\\n\' "$parser" "$eco" "$alias"; return 0 ;;\n            esac\n        done\n    done\n    return 1\n}\n\n# Derive the per-basename lookup tables from ECOSYSTEM_REGISTRY. Called once\n# near the top of main(). Fills LOCKFILE_PARSER / LOCKFILE_ECO\n# (keyed by basename) and KNOWN_LOCKFILE_ALIASES (space-separated unique list).\nbuild_ecosystem_tables() {\n    LOCKFILE_PARSER=()\n    LOCKFILE_ECO=()\n    KNOWN_LOCKFILE_ALIASES=""\n\n    local entry basename eco parser alias\n    for entry in "${ECOSYSTEM_REGISTRY[@]}"; do\n        IFS=\'|\' read -r basename eco parser alias <<< "$entry"\n        LOCKFILE_PARSER["$basename"]="$parser"\n        LOCKFILE_ECO["$basename"]="$eco"\n\n        # Append alias to KNOWN_LOCKFILE_ALIASES only if not already present\n        case " $KNOWN_LOCKFILE_ALIASES " in\n            *" $alias "*) ;;\n            *) KNOWN_LOCKFILE_ALIASES="${KNOWN_LOCKFILE_ALIASES:+$KNOWN_LOCKFILE_ALIASES }$alias" ;;\n        esac\n    done\n\n    # Path-discovered ecosystems contribute their type-alias to the known list\n    # too (so --lockfile-types actions and --ecosystems actions validate), but\n    # NO basename rows in the LOCKFILE_* maps \u2014 they dispatch by path via\n    # path_ecosystem_match(), not by a basename lookup.\n    local pglob nglobs\n    for entry in "${PATH_ECOSYSTEM_REGISTRY[@]}"; do\n        IFS=\'|\' read -r pglob nglobs eco parser alias <<< "$entry"\n        case " $KNOWN_LOCKFILE_ALIASES " in\n            *" $alias "*) ;;\n            *) KNOWN_LOCKFILE_ALIASES="${KNOWN_LOCKFILE_ALIASES:+$KNOWN_LOCKFILE_ALIASES }$alias" ;;\n        esac\n    done\n}\n\n# Filenames GitHub discovery should fetch: package.json (scanned but NOT a\n# registry row) followed by every registry basename, in registry order.\n# Space-separated (filenames contain no spaces).\necosystem_scan_filenames() {\n    local names="package.json" entry\n    for entry in "${ECOSYSTEM_REGISTRY[@]}"; do\n        names="$names ${entry%%|*}"\n    done\n    printf \'%s\' "$names"\n}\n\n# Map a --ecosystems / --lockfile-types token to a purl type. Registry aliases\n# resolve to their purl-type; anything else passes through unchanged (callers\n# validate the result separately).\necosystem_alias_to_purl() {\n    local token="$1" entry basename eco parser alias pglob nglobs\n    for entry in "${ECOSYSTEM_REGISTRY[@]}"; do\n        IFS=\'|\' read -r basename eco parser alias <<< "$entry"\n        if [ "$token" = "$alias" ]; then\n            printf \'%s\\n\' "$eco"\n            return 0\n        fi\n    done\n    # Path-discovered ecosystems (e.g. actions -> githubactions).\n    for entry in "${PATH_ECOSYSTEM_REGISTRY[@]}"; do\n        IFS=\'|\' read -r pglob nglobs eco parser alias <<< "$entry"\n        if [ "$token" = "$alias" ]; then\n            printf \'%s\\n\' "$eco"\n            return 0\n        fi\n    done\n    printf \'%s\\n\' "$token"\n}\n\n# Default feed filename for a (feed, eco) pair.\n#   npm  -> ghsa.purl / osv.purl        (legacy names, unchanged)\n#   else -> ghsa-<eco>.purl / osv-<eco>.purl\ndefault_feed_filename() {\n    local feed="$1" eco="$2"\n    if [ "$eco" = "npm" ]; then\n        printf \'%s.purl\\n\' "$feed"\n    else\n        printf \'%s-%s.purl\\n\' "$feed" "$eco"\n    fi\n}\n# Python / PyPI dependency parsers.\n#\n# Registered lockfiles (see 01-registry.sh):\n#   requirements.txt, requirements-*.txt, requirements/*.txt\n#                    -> analyze_requirements_txt   (exact == pins only)\n#   poetry.lock / uv.lock / pdm.lock -> analyze_toml_pkg_lock (shared TOML)\n#   Pipfile.lock     -> analyze_pipfile_lock        (JSON default+develop)\n#\n# CRITICAL: package names are compared PEP 503-normalized on BOTH sides. The\n# feeds emit normalized names (lowercase; runs of - _ . collapsed to a single\n# \'-\'); every pypi parser normalizes the names it extracts the same way via\n# _pypi_normalize_name so scanned names line up with advisory names.\n\n# PEP 503 normalize a package name into the global PEP503_NAME (no subshell):\n#   lowercase, then collapse every run of - _ . to a single \'-\'.\n# e.g. Django_REST-framework -> django-rest-framework, Flask..SQL -> flask-sql.\n_pypi_normalize_name() {\n    local n="${1,,}"\n    n="${n//[-_.]/-}"                    # each separator char -> \'-\'\n    while [[ "$n" == *--* ]]; do          # collapse runs of \'-\' into one\n        n="${n//--/-}"\n    done\n    PEP503_NAME="$n"\n}\n\n# Parse a requirements.txt: ONLY fully-pinned exact requirements (name==version,\n# also name[extra1,extra2]==version with extras stripped). Everything else is\n# skipped on purpose:\n#   * inline comments (# ...) and PEP 508 env markers (; python_version < "3.8")\n#     are stripped before matching;\n#   * -r / -c includes, -e / URL / VCS / path installs, and option lines\n#     (--hash=..., --index-url, ...) are skipped (any line starting with \'-\'\n#     or containing a scheme://);\n#   * backslash continuations are joined before comments/options are stripped;\n#   * requirements using any operator other than \'==\' (>=, <=, ~=, !=, ===, >,\n#     <) are skipped \u2014 a range is not an installed version \u2014 and so are\n#     wildcard pins such as ==1.0.*.\n# Extracted names are PEP 503-normalized.\nanalyze_requirements_txt() {\n    local lockfile="$1"\n    local eco="${2:-pypi}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    # A UTF-8 byte order mark is an encoding marker, not part of the first name.\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    {\n        physical = $0\n        sub(/\\r$/, "", physical)\n        # pip drops comment lines before joining: a comment ending in "\\"\n        # does not continue onto the next requirement.\n        if (physical ~ /^[[:space:]]*#/) physical = ""\n        # pip joins physical lines without inserting whitespace. In particular\n        # a pin may be followed by several --hash options on continued lines.\n        if (physical ~ /\\\\$/) {\n            sub(/\\\\$/, "", physical)\n            pending = pending physical\n            next\n        }\n        requirement(pending physical)\n        pending = ""\n    }\n    # A continuation on the last line still ends that requirement.\n    END { if (pending != "") requirement(pending) }\n    function requirement(line,   eq, name, ver, br) {\n        sub(/[[:space:]]*#.*$/, "", line)          # strip inline/full comment\n        sub(/;.*$/, "", line)                       # strip PEP 508 env marker\n        gsub(/^[[:space:]]+/, "", line)             # trim\n        gsub(/[[:space:]]+$/, "", line)\n        if (line == "") return\n        if (line ~ /^-/) return                       # -r/-c/-e/--hash/--index-url\n        if (line ~ /:\\/\\//) return                    # scheme:// (URL/VCS install)\n        gsub(/[[:space:]]*==[[:space:]]*/, "==", line)  # tolerate spaced pins\n\n        # Exact pin only: name[extras]==version, no other operator. The name\n        # char class excludes < > ! ~ =, so >=, <=, ~=, != cannot precede the\n        # ==; the [^=...] after == rejects === and operator-led versions.\n        if (line !~ /^[A-Za-z0-9._-]+(\\[[^]]*\\])?==[^=<>!~ ]/) return\n\n        eq = index(line, "==")\n        name = substr(line, 1, eq - 1)\n        ver  = substr(line, eq + 2)\n        br = index(name, "[")                       # strip extras\n        if (br > 0) name = substr(name, 1, br - 1)\n        sub(/[[:space:]].*$/, "", ver)              # drop any trailing tokens\n        if (ver ~ /\\*/) return                        # ==1.0.* is a range, not a pin\n        if (name != "" && ver != "") print name "|" ver\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        _pypi_normalize_name "$pkg_name"\n        check_vulnerability "$eco" "$PEP503_NAME" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Parse a Pipfile.lock (pipenv, JSON). Packages live under the top-level\n# "default" and "develop" objects as name -> { ... "version": "==x.y.z" ... }.\n# Entries without a "==" version (e.g. VCS/editable refs pinned by git ref) are\n# skipped. Names are PEP 503-normalized. jq-free (POSIX awk state machine).\nanalyze_pipfile_lock() {\n    local lockfile="$1"\n    local eco="${2:-pypi}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(json_structural_lines "$lockfile" | awk \'\n    {\n        line = $0\n        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)\n        if (line ~ /[\\{\\[]$/) {\n            if (depth == 1) section = (line ~ /^"(default|develop)"[[:space:]]*:/)\n            if (section && depth == 2 && line ~ /^"/) {\n                pkg = line\n                sub(/^"/, "", pkg)\n                sub(/".*/, "", pkg)\n            }\n            depth++\n        } else if (line == "}" || line == "]") {\n            depth--\n            if (depth == 2) pkg = ""\n            if (depth == 1) section = 0\n        } else if (section && depth == 3 && pkg != "" && line ~ /^"version"[[:space:]]*:[[:space:]]*"==/) {\n            sub(/^"version"[[:space:]]*:[[:space:]]*"==/, "", line)\n            sub(/".*/, "", line)\n            if (line != "") print pkg "|" line\n        }\n    }\n    \' | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        _pypi_normalize_name "$pkg_name"\n        check_vulnerability "$eco" "$PEP503_NAME" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# Go module dependency parsers.\n#\n# Two registry rows feed these:\n#   go.sum -> analyze_go_sum   (authoritative: the full transitive build list)\n#   go.mod -> analyze_go_mod   (fallback ONLY when no go.sum sits beside it)\n#\n# Canonical package identity is the full, case-sensitive module path (matching\n# the golang feed emission, e.g. pkg:golang/golang.org/x/text@...). Versions are\n# normalized to bare semver (leading `v` stripped) so exact-version and range\n# matching line up with the feeds.\n\n# Parse a go.sum file. Each module contributes up to two lines:\n#   <module> <version> h1:<hash>\n#   <module> <version>/go.mod h1:<hash>\n# The `/go.mod` lines duplicate the module@version pair, so they are skipped.\n# go.sum also !-escapes uppercase letters in module paths\n# (github.com/!burnt!sushi/toml == github.com/BurntSushi/toml); those are decoded\n# back before matching.\nanalyze_go_sum() {\n    local lockfile="$1"\n    local eco="${2:-golang}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    # Decode go.sum !-escaping: "!x" -> uppercase X (module paths only).\n    function decode_bang(s,   out, i, c, n) {\n        out = ""\n        n = length(s)\n        for (i = 1; i <= n; i++) {\n            c = substr(s, i, 1)\n            if (c == "!" && i < n) {\n                i++\n                out = out toupper(substr(s, i, 1))\n            } else {\n                out = out c\n            }\n        }\n        return out\n    }\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    {\n        if ($0 ~ /^[[:space:]]*$/) next     # blank lines\n        mod = $1\n        ver = $2\n        if (mod == "" || ver == "") next\n        if (ver ~ /\\/go\\.mod$/) next        # skip duplicate /go.mod entries\n        sub(/^v/, "", ver)                  # normalize to bare semver\n        mod = decode_bang(mod)\n        print mod "|" ver\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Parse a go.mod file. FALLBACK ONLY: when a go.sum exists next to this go.mod,\n# analyze_go_sum already covers the (larger, transitive) build list, so bail out\n# silently to avoid double reporting.\n#\n# Handles both require forms:\n#   require mod vX.Y.Z\n#   require (\n#       mod vX.Y.Z\n#       mod vX.Y.Z // indirect\n#   )\n# `// ...` comments are stripped; module/go/toolchain/replace/exclude directives\n# are ignored. go.mod module paths are NOT !-escaped (unlike go.sum).\nanalyze_go_mod() {\n    local lockfile="$1"\n    local eco="${2:-golang}"\n\n    # If a go.sum sits beside this go.mod, it is authoritative \u2014 do nothing.\n    local godir="${lockfile%/*}"\n    [ "$godir" = "$lockfile" ] && godir="."\n    if [ -f "$godir/go.sum" ]; then\n        LOCKFILE_SKIPPED=1\n        return 0\n    fi\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    # Requirements are collected first: a replace directive anywhere in the\n    # file decides which module version is actually built.\n    function add_require(line,   a, n) {\n        n = split(line, a, " ")\n        if (n >= 2) required[a[1]] = a[2]\n    }\n    # "old [version] => new [version]". A replacement without a version is a\n    # local directory: what it holds is unknown, as in go.sum (no entry).\n    function add_replace(line,   pos, a, b, na, nb, key) {\n        pos = index(line, "=>")\n        if (!pos) return\n        na = split(substr(line, 1, pos - 1), a, " ")\n        nb = split(substr(line, pos + 2), b, " ")\n        if (na < 1 || nb < 1) return\n        key = a[1] (na >= 2 ? "@" a[2] : "")\n        new_path[key] = b[1]\n        new_version[key] = (nb >= 2 ? b[2] : "")\n    }\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    {\n        line = $0\n        sub(/\\/\\/.*$/, "", line)            # strip trailing // comment\n        gsub(/^[[:space:]]+/, "", line)\n        gsub(/[[:space:]]+$/, "", line)\n        if (line == "") next\n\n        if (block != "") {\n            if (line ~ /^\\)/) { block = ""; next }\n            if (block == "require") add_require(line)\n            else if (block == "replace") add_replace(line)\n            next\n        }\n\n        if (line ~ /^(require|replace|exclude|retract)[[:space:]]*\\(/) {\n            block = line\n            sub(/[[:space:]]*\\(.*$/, "", block)\n            next\n        }\n        if (line ~ /^require[[:space:]]+/) {\n            sub(/^require[[:space:]]+/, "", line)\n            add_require(line)\n        } else if (line ~ /^replace[[:space:]]+/) {\n            sub(/^replace[[:space:]]+/, "", line)\n            add_replace(line)\n        }\n        # module / go / toolchain / exclude / retract directives: ignored\n    }\n    END {\n        for (path in required) {\n            version = required[path]\n            key = path "@" version\n            if (!(key in new_path)) key = path\n            name = path\n            if (key in new_path) {\n                if (new_version[key] == "") continue\n                name = new_path[key]\n                version = new_version[key]\n            }\n            sub(/^v/, "", version)\n            print name "|" version\n        }\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Annotate the Go findings with govulncheck\'s call analysis (--go-reachability):\n# VULN_REACHABILITY["dir|golang:module@version"] is "called" when one of the\n# module\'s findings reaches a vulnerable function from the code of the Go\n# module in dir, else "not called". govulncheck runs once per go.mod directory whose go.sum or\n# go.mod has a finding; a module it says nothing about stays unannotated. In its JSON stream, the first frame\n# of a finding\'s trace is the vulnerable module, and names a function only when\n# the code calls it. A missing govulncheck or a failed run only warns: the\n# scan result never depends on it.\ngo_reachability() {\n    local vuln file eco dir dirs=""\n    for vuln in "${VULNERABLE_PACKAGES[@]}"; do\n        IFS=\'|\' read -r file eco _ <<< "$vuln"\n        [ "$eco" = golang ] || continue\n        finding_dir "$file"\n        dir="$FINDING_DIR"\n        [ -f "$dir/go.mod" ] || continue\n        case $\'\\n\'"$dirs"$\'\\n\' in *$\'\\n\'"$dir"$\'\\n\'*) ;; *) dirs+="${dirs:+$\'\\n\'}$dir" ;; esac\n    done\n    [ -n "$dirs" ] || return 0\n    if ! command -v govulncheck > /dev/null 2>&1; then\n        echo -e "${YELLOW}\u26A0\uFE0F  --go-reachability: govulncheck not found (go install golang.org/x/vuln/cmd/govulncheck@latest); Go findings are not annotated${NC}"\n        return 0\n    fi\n\n    local out err rc annotations module state\n    while IFS= read -r dir; do\n        out=$(mktemp) || return 0\n        register_temp_file "$out"\n        err=$(mktemp) || return 0\n        register_temp_file "$err"\n        echo "\u{1F50E} Checking Go reachability with govulncheck in $dir..."\n        rc=0\n        govulncheck -C "$dir" -format json ./... > "$out" 2> "$err" || rc=$?\n        # 3 means "vulnerabilities found" in text mode; JSON mode exits 0.\n        if [ "$rc" -ne 0 ] && [ "$rc" -ne 3 ]; then\n            echo -e "${YELLOW}\u26A0\uFE0F  govulncheck failed in $dir (exit $rc): $(head -n 1 "$err"); its Go findings are not annotated${NC}"\n            continue\n        fi\n        annotations=$(json_structural_lines "$out" | awk "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n        {\n            jp_step($0)\n            if (JP_EVENT == "open" && JP_PATH == "/#/finding/trace") frame = 0\n            else if (JP_EVENT == "open" && JP_PATH == "/#/finding/trace/#") frame++\n            else if (JP_EVENT == "scalar" && JP_PATH == "/#/finding/trace/#" && frame == 1) {\n                if (JP_KEY == "module") module = JP_VAL\n                else if (JP_KEY == "version") version = JP_VAL\n                else if (JP_KEY == "function" && JP_VAL != "") called = 1\n            } else if (JP_EVENT == "close" && JP_PATH == "/#/finding") {\n                if (module != "" && version != "") {\n                    sub(/^v/, "", version)\n                    key = module "@" version\n                    if (called) state[key] = "called"\n                    else if (!(key in state)) state[key] = "not called"\n                }\n                module = version = ""\n                called = 0\n            }\n        }\n        END { for (key in state) print key "|" state[key] }\n        \')\n        while IFS=\'|\' read -r module state; do\n            [ -n "$module" ] || continue\n            VULN_REACHABILITY["$dir|golang:$module"]="$state"\n        done <<< "$annotations"\n    done <<< "$dirs"\n}\n\n# Directory of a finding\'s file, in FINDING_DIR.\nfinding_dir() {\n    FINDING_DIR="${1%/*}"\n    [ "$FINDING_DIR" != "$1" ] || FINDING_DIR="."\n}\n\n# Reachability of one occurrence (file, eco:name@version) in REACHABILITY,\n# empty when govulncheck said nothing about it.\nreachability_of() {\n    finding_dir "$1"\n    REACHABILITY="${VULN_REACHABILITY[$FINDING_DIR|$2]:-}"\n}\n# Shared TOML "[[package]]" lockfile parser.\n#\n# Handles Cargo.lock (v3/v4) today; the same block shape (name = "..." /\n# version = "..." pairs inside [[package]] tables, keys in any order, plus\n# arbitrary other keys like source/checksum/dependencies to ignore) is reused\n# by poetry.lock, uv.lock and pdm.lock (registered by the Python task).\n#\n# HARDENING (subtable gap): name/version are only captured while INSIDE a\n# top-level [[package]] table \u2014 i.e. between a `[[package]]` header and the NEXT\n# `[`-prefixed header of ANY kind. Entering a subtable such as\n# [package.dependencies] / [package.extras] / [package.source] (or [metadata],\n# etc.) closes the capture window, so a dependency literally keyed `name` or\n# `version` inside a subtable can never leak a bogus pair.\n#\n# LOCAL PROJECTS: uv.lock lists the project being locked as a [[package]] with\n# source = { editable = "." } or { virtual = "." }; such entries are skipped.\n#\n# NORMALIZATION: when eco = pypi, package names are PEP 503-normalized\n# (lowercase; runs of - _ . collapsed to a single -) so they line up with the\n# normalized feed names. cargo names are left untouched.\nanalyze_toml_pkg_lock() {\n    local lockfile="$1"\n    local eco="${2:-cargo}"\n\n    # Track vulnerabilities found in this file\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    # Use awk to extract all packages in one pass (POSIX-compatible)\n    local packages\n    packages=$(awk \'\n    function emit_pkg() {\n        if (pkg_name != "" && pkg_version != "" && !local_pkg) {\n            print pkg_name "|" pkg_version\n        }\n        pkg_name = ""\n        pkg_version = ""\n        local_pkg = 0\n    }\n    # Start of a new [[package]] block: flush, then open the capture window.\n    /^[[:space:]]*\\[\\[package\\]\\][[:space:]]*$/ {\n        emit_pkg()\n        in_pkg = 1\n        next\n    }\n    # ANY other bracketed header (single-bracket subtable like\n    # [package.dependencies], [metadata], or a different [[...]] array) flushes\n    # and CLOSES the capture window until the next [[package]].\n    /^[[:space:]]*\\[/ {\n        emit_pkg()\n        in_pkg = 0\n        next\n    }\n    in_pkg && /^[[:space:]]*name[[:space:]]*=/ {\n        line = $0\n        sub(/^[[:space:]]*name[[:space:]]*=[[:space:]]*/, "", line)\n        gsub(/^[[:space:]]+/, "", line)\n        gsub(/[[:space:]]+$/, "", line)\n        gsub(/^"/, "", line)\n        gsub(/"$/, "", line)\n        pkg_name = line\n        next\n    }\n    # uv.lock records the project itself (and workspace members) with an\n    # editable or virtual source: local code, not a published release.\n    in_pkg && /^[[:space:]]*source[[:space:]]*=[[:space:]]*\\{.*(editable|virtual)[[:space:]]*=/ {\n        local_pkg = 1\n        next\n    }\n    in_pkg && /^[[:space:]]*version[[:space:]]*=/ {\n        line = $0\n        sub(/^[[:space:]]*version[[:space:]]*=[[:space:]]*/, "", line)\n        gsub(/^[[:space:]]+/, "", line)\n        gsub(/[[:space:]]+$/, "", line)\n        gsub(/^"/, "", line)\n        gsub(/"$/, "", line)\n        pkg_version = line\n        next\n    }\n    END { emit_pkg() }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    # Process extracted packages\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        # PEP 503 name normalization for pypi locks (cargo names untouched).\n        if [ "$eco" = "pypi" ]; then\n            _pypi_normalize_name "$pkg_name"\n            pkg_name="$PEP503_NAME"\n        fi\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    # Check if vulnerabilities were found in this file\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# Ruby (Bundler) dependency parser.\n#\n#   Gemfile.lock -> analyze_gemfile_lock\n#\n# Gemfile.lock shape (indentation is significant and exact):\n#   GIT / PATH / GEM     column-0 section headers, one or more of each\n#     remote: ...          2-space\n#     specs:                2-space\n#       name (version)        4-space  <- the installed package + version\n#         dep (~> x.y)           6-space <- a dependency CONSTRAINT, not a\n#                                            resolved package: skip it\n#   PLATFORMS / DEPENDENCIES / CHECKSUMS / BUNDLED WITH / RUBY VERSION  column-0\n#\n# ONLY the "GEM" section\'s "specs:" packages are resolved gems installed from\n# a rubygems source; GIT and PATH sections have the identical "specs:" shape\n# but pin a local/VCS gem instead (no rubygems version to check against\n# advisories), so they must be excluded the same way npm parsers skip `link:`\n# workspace deps. The state machine below re-evaluates on every column-0\n# (unindented) line: `in_gem` is set only while inside a literal "GEM"\n# header, and cleared by ANY other column-0 line (GIT, PATH, PLATFORMS,\n# DEPENDENCIES, CHECKSUMS, BUNDLED WITH, RUBY VERSION, or a second "GIT"/\n# "PATH" block) \u2014 so it also correctly re-opens across multiple GEM blocks\n# (multiple gem sources) without hardcoding every non-GEM header name.\n#\n# The exactly-4-space check (`^    [^ ]`) is what tells a resolved spec line\n# apart from a 6-space dependency-constraint line: a 6-space line still has\n# 4 leading spaces, but its 5th character is ALSO a space, so it fails to\n# match.\n#\n# Platform-suffixed versions (native gems, e.g. `nokogiri (1.16.5-arm64-darwin)`)\n# are stripped to the bare version: a version starting with a digit followed\n# by `-<tail>` where the tail contains a known gem-platform token (darwin,\n# linux, x86_64, aarch64, arm64, universal, java, mingw, mswin, freebsd) has\n# the `-<tail>` dropped. The token must be a WHOLE dash/underscore-delimited\n# segment (optionally trailed by digits, e.g. `mingw32`), anchored via\n# `(^|[-_])TOKEN[0-9]*([-_]|$)` \u2014 so `1.0.0-javascript` is NOT stripped just\n# because `java` is a substring of `javascript`. A real prerelease dash\n# (`1.0.0-rc1`) does not match any platform token either, so it is left alone\n# (RubyGems itself treats `-` as a prerelease separator; see compare_versions_gem).\nanalyze_gemfile_lock() {\n    local lockfile="$1"\n    local eco="${2:-gem}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    BEGIN { in_gem = 0 }\n    NR == 1 && substr($0, 1, 3) == "\\357\\273\\277" { $0 = substr($0, 4) }\n    # Column-0 (unindented) line: a new top-level section. Re-evaluate\n    # in_gem; every non-"GEM" header (and blank-adjacent noise) closes the\n    # capture window until the next literal "GEM" header.\n    /^[A-Za-z]/ {\n        if ($0 ~ /^GEM[[:space:]]*$/) { in_gem = 1 } else { in_gem = 0 }\n        next\n    }\n    !in_gem { next }\n    # Exactly-4-space "name (version)" spec line (6-space dependency\n    # constraints fail this match on purpose - see header comment).\n    /^    [^ ]/ {\n        line = $0\n        sub(/^    /, "", line)\n        paren = index(line, " (")\n        if (paren == 0) next\n        name = substr(line, 1, paren - 1)\n        rest = substr(line, paren + 2)\n        closepos = index(rest, ")")\n        if (closepos == 0) next\n        ver = substr(rest, 1, closepos - 1)\n        if (name == "" || ver == "") next\n\n        # Platform-suffix strip (see header comment).\n        if (ver ~ /^[0-9][0-9A-Za-z.]*-/) {\n            dash = index(ver, "-")\n            base_ver = substr(ver, 1, dash - 1)\n            suffix = substr(ver, dash + 1)\n            if (suffix ~ /(^|[-_])(x86_64|aarch64|arm64|universal|java|mingw|mswin|darwin|linux|freebsd)[0-9]*([-_]|$)/) {\n                ver = base_ver\n            }\n        }\n        print name "|" ver\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# PHP (Composer) dependency parser.\n#\n#   composer.lock -> analyze_composer_lock\n#\n# composer.lock is plain JSON (no jq available/allowed on the scan path), and\n# unlike package-lock.json\'s flat "node_modules/x": {...} map, its packages\n# live in TWO top-level arrays: "packages" (production) and "packages-dev"\n# (require-dev). Each array element is a package object with MANY sibling\n# keys beyond name/version (source, dist, require, require-dev, provide,\n# suggest, type, extra, autoload, notification-url, license, authors,\n# description, homepage, keywords, support, funding, time, ...), several of\n# which are themselves nested objects/arrays. Notably "authors" is an array\n# of {"name": ..., "email": ..., ...} objects, so a naive "capture name, then\n# capture the next version" state machine (as used for package-lock.json)\n# would risk a nested author\'s "name" clobbering the package name, or -\n# worse - would never be at risk of finding a stray "version" key deeper in\n# (composer.lock has no "version" key inside require/source/dist/authors/\n# support/funding), but relying on that emptily is fragile. Instead this\n# parser tracks JSON brace/bracket DEPTH precisely (one increment per `{`/`[`,\n# one decrement per `}`/`]`, quoted-string contents skipped so punctuation\n# inside URLs/descriptions/names never miscounts) so that "name"/"version"\n# are only captured when they are DIRECT fields of a package object (exactly\n# one level below the "packages"/"packages-dev" array) - any subtable\n# (source/dist/require/autoload/authors/support/funding/...) sits at least\n# one level deeper and is excluded, mirroring the TOML [[package]] parser\'s\n# subtable-gap hardening (src/50-ecosystems/20-rust.sh) but for JSON nesting\n# instead of TOML headers. The pending name/version pair is emitted the\n# instant the enclosing package object\'s closing brace is seen, so it does\n# not matter how many nested keys/objects a real entry has in between.\n#\n# json_structural_lines splits JSON outside strings before depth tracking,\n# so compact JSON and Composer-generated pretty JSON have the same records.\n#\n# NORMALIZATION: package names are lowercased (composer canon is\n# "vendor/package", already lowercase on the feed side - data/ghsa-composer.purl\n# / data/osv-composer.purl - so this keeps a mixed-case lockfile entry, if\n# one is ever seen in the wild, matching). Versions have a leading "v"\n# stripped (some vendors tag "v7.4.0"; compare_versions_eco routes composer\n# through the plain semver comparator, which expects a bare "7.4.0" - see\n# src/40-versions/01-dispatch.sh) and "dev-*" branch aliases (e.g.\n# "dev-master", "dev-feature/x" - not a resolvable release, no advisory can\n# target it) are skipped silently, same as npm parsers skip workspace/link\n# deps and pypi skips VCS entries without a resolvable version.\nanalyze_composer_lock() {\n    local lockfile="$1"\n    local eco="${2:-composer}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(json_structural_lines "$lockfile" | awk \'\n    function emit_pkg() {\n        if (pkg_name != "" && pkg_version != "") {\n            print pkg_name "|" pkg_version\n        }\n        pkg_name = ""\n        pkg_version = ""\n    }\n    BEGIN {\n        depth = 0\n        in_pkgs = 0\n        pkg_depth = -1\n    }\n    {\n        line = $0\n        start_depth = depth\n\n        # Enter a "packages" / "packages-dev" array at the CURRENT (pre-line)\n        # depth. Guarded by !in_pkgs so the same literal text appearing\n        # inside an already-open packages array (e.g. in a description\n        # string) cannot re-trigger this.\n        if (!in_pkgs && match(line, /"packages(-dev)?"[[:space:]]*:[[:space:]]*\\[/)) {\n            in_pkgs = 1\n            pkg_depth = start_depth + 1\n            pkg_name = ""\n            pkg_version = ""\n        }\n\n        # Only DIRECT fields of a package object (one level below the array)\n        # are candidate name/version lines; any nested object/array (source,\n        # dist, require, provide, suggest, extra, autoload, authors,\n        # support, funding, ...) sits at pkg_depth+2 or deeper and is\n        # excluded by this check.\n        if (in_pkgs && start_depth == pkg_depth + 1) {\n            if (match(line, /^[[:space:]]*"name"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^[[:space:]]*"name"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "") pkg_name = tolower(temp)\n            } else if (match(line, /^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "" && temp !~ /^dev-/) {\n                    sub(/^v/, "", temp)\n                    pkg_version = temp\n                }\n            }\n        }\n\n        # Walk the line char-by-char (quoted-string contents skipped,\n        # backslash-escape aware) to keep `depth` exact, emitting the\n        # pending package the instant its object closes and closing the\n        # array itself once depth falls back below pkg_depth.\n        n = length(line)\n        in_str = 0\n        for (i = 1; i <= n; i++) {\n            c = substr(line, i, 1)\n            if (in_str) {\n                if (c == "\\\\") { i++ }\n                else if (c == "\\"") { in_str = 0 }\n                continue\n            }\n            if (c == "\\"") { in_str = 1; continue }\n            if (c == "{" || c == "[") {\n                depth++\n            } else if (c == "}" || c == "]") {\n                depth--\n                if (in_pkgs && depth == pkg_depth) {\n                    emit_pkg()\n                } else if (in_pkgs && depth < pkg_depth) {\n                    in_pkgs = 0\n                    pkg_depth = -1\n                    pkg_name = ""\n                    pkg_version = ""\n                }\n            }\n        }\n    }\n    END { emit_pkg() }\n    \' | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# Maven (JVM) dependency parsers.\n#\n#   gradle.lockfile -> analyze_gradle_lockfile   (Gradle\'s resolved dependency lock)\n#   pom.xml         -> analyze_pom_xml           (Maven manifest, direct deps)\n#\n# Canonical package identity is "groupId:artifactId" (the ONLY ecosystem whose\n# canonical names contain a \':\'). This matches the feed emission: the purl parser\n# canonicalizes pkg:maven/groupId/artifactId to the key "maven:groupId:artifactId"\n# (canon_purl_name joins the last two path components with \':\', see\n# src/31-parsers-purl.sh), and check_vulnerability probes "maven:<name>", so a\n# parser that emits "groupId:artifactId" lines up exactly. Versions are passed\n# through verbatim and ordered by compare_versions_maven (ComparableVersion).\n\n# Parse a gradle.lockfile. Format (one dependency per line):\n#   group:artifact:version=conf1,conf2,...\n# plus a header comment block (lines starting with \'#\') and a trailing sentinel\n#   empty=conf,...\n# listing configurations that resolved to nothing. Comments and the "empty="\n# sentinel carry no package, so they are skipped. The key (left of \'=\') splits on\n# \':\' into exactly group / artifact / version (Maven coordinates never contain a\n# \':\' in any single component), so a line that does not split into three is not a\n# coordinate and is ignored.\nanalyze_gradle_lockfile() {\n    local lockfile="$1"\n    local eco="${2:-maven}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    {\n        line = $0\n        gsub(/\\r/, "", line)                       # tolerate CRLF checkouts\n        gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)\n        if (line == "") next\n        if (line ~ /^#/) next                      # header comment lines\n        eq = index(line, "=")\n        if (eq == 0) next\n        key = substr(line, 1, eq - 1)\n        if (key == "empty") next                   # "empty=" sentinel\n        n = split(key, a, ":")\n        if (n != 3) next                           # not a group:artifact:version\n        if (a[1] == "" || a[2] == "" || a[3] == "") next\n        print a[1] ":" a[2] "|" a[3]\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n\n# Parse a pom.xml. The whole file is read into one string so tags split over\n# several lines (<version>\\n  1.2.3\\n</version>) parse like single-line ones,\n# and XML comments are removed first (a commented-out <dependency> is not a\n# dependency). Each <dependency> block yields its <groupId>, <artifactId> and\n# <version>; nested <exclusions> are cut out so their coordinates cannot\n# clobber the dependency\'s. A version "${name}" is resolved from the same\n# file\'s <properties>; anything else that is not a literal version is SKIPPED:\n# unresolved properties (parent POMs, ${project.version}), dependencyManagement\n# inheritance (no version at all) and version ranges ("[1.0,2.0)"). This is a\n# manifest-grade parser \u2014 the same class of limitation every non-lockfile\n# parser in this codebase carries; the missing and unresolved versions are\n# counted and reported once, pointing to --sbom. <dependency> blocks anywhere are accepted\n# (project <dependencies> and <dependencyManagement> alike); the opening tag is\n# matched as "<dependency" followed by a space or \'>\' so that the\n# "<dependencies>" wrapper never opens a block.\nanalyze_pom_xml() {\n    local lockfile="$1"\n    local eco="${2:-maven}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    # One streaming pass: records are split at "<", so each one is a tag\n    # followed by the text up to the next tag. A stack of open elements gives\n    # every value its place: only the direct children of a <dependency> are\n    # its coordinates (an <exclusions> block is deeper), and project-level\n    # <properties> win over those of a <profile>. Versions are resolved at the\n    # end: <properties> may follow <dependencies>. Linear in the file size.\n    packages=$(awk \'\n    BEGIN { RS = "<" }\n    function trim(v) { gsub(/^[[:space:]]+|[[:space:]]+$/, "", v); return v }\n    # Text of the element that is currently open ("" target: ignored). Text\n    # after a comment inside an element (<version><!-- x -->1.0</version>)\n    # is appended to it.\n    function set_text(value, append) {\n        if (target == "") return\n        if (append) value = target_value[target] value\n        target_value[target] = value\n    }\n    NR == 1 { next }   # text before the first tag\n    {\n        record = $0\n        gsub(/\\r/, "", record)\n        if (in_comment || substr(record, 1, 3) == "!--") {\n            e = index(record, "-->")\n            if (substr(record, 1, 3) == "!--") {\n                e = index(substr(record, 4), "-->")\n                if (e) e += 3\n            }\n            if (e == 0) { in_comment = 1; next }\n            in_comment = 0\n            set_text(trim(substr(record, e + 3)), 1)\n            next\n        }\n        c = substr(record, 1, 1)\n        if (c == "?" || c == "!") next\n        gt = index(record, ">")\n        if (gt == 0) next\n        tag = substr(record, 1, gt - 1)\n        text = trim(substr(record, gt + 1))\n        if (c == "/") {\n            name = trim(substr(tag, 2))\n            if (depth > 0 && stack[depth] == name) {\n                if (name == "dependency" && depth == dep_depth) dep_depth = 0\n                depth--\n            }\n            target = ""\n            next\n        }\n        self_closing = (substr(tag, length(tag)) == "/")\n        name = tag\n        sub(/[[:space:]\\/].*$/, "", name)\n        if (self_closing) next\n        stack[++depth] = name\n        parent = stack[depth - 1]\n        target = ""\n        if (parent == "properties" && depth >= 3) {\n            if (depth == 3 && stack[1] == "project") target = "pp:" name\n            else if (!(("op:" name) in target_value)) target = "op:" name\n        }\n        if (name == "dependency" && dep_depth == 0) {\n            dep_depth = depth\n            n_deps++\n        } else if (dep_depth && depth == dep_depth + 1 &&\n                   (name == "groupId" || name == "artifactId" || name == "version")) {\n            target = "d" n_deps ":" name\n        }\n        set_text(text, 0)\n    }\n    END {\n        for (i = 1; i <= n_deps; i++) {\n            g = trim(target_value["d" i ":groupId"])\n            a = trim(target_value["d" i ":artifactId"])\n            v = trim(target_value["d" i ":version"])\n            if (g == "" || a == "") continue\n            if (v ~ /^\\$\\{[^}]+\\}$/) {\n                name = substr(v, 3, length(v) - 3)\n                v = ("pp:" name) in target_value ? target_value["pp:" name] : \\\n                    (("op:" name) in target_value ? target_value["op:" name] : "")\n                v = trim(v)\n            }\n            # Missing or unresolved versions come from a parent POM or a BOM.\n            if (v == "" || index(v, "${")) { unversioned++; continue }\n            # Version ranges are not installed versions.\n            if (v ~ /^[\\[(]/ || index(v, ",")) continue\n            print g ":" a "|" v\n        }\n        # "-" is never a groupId:artifactId: it carries the unversioned count.\n        if (unversioned) print "-|" unversioned\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    local unversioned=0\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        if [ "$pkg_name" = "-" ]; then unversioned="$version"; continue; fi\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    if [ "$unversioned" -gt 0 ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  $unversioned dependencies in $lockfile have no version here (managed by a parent POM or BOM): scan a CycloneDX SBOM with --sbom (cyclonedx-maven-plugin) or a gradle.lockfile to check them${NC}"\n    fi\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# NuGet dependency parser.\n#\n#   packages.lock.json -> analyze_nuget_lock\n#\n# (csproj is a tier-2 manifest \u2014 no manifest-grade property/MSBuild-condition\n# resolution is attempted anywhere else in this codebase either, see pom.xml\'s\n# ${property} skip \u2014 so it is NOT registered/parsed at all.)\n#\n# packages.lock.json is plain JSON (no jq on the scan path) shaped THREE\n# levels deep below the root: a single top-level "dependencies" object keyed\n# by target framework moniker (e.g. "net8.0"; a multi-targeted project has one\n# sibling object per TFM), each holding package-name-keyed objects with a\n# "type" ("Direct" | "Transitive" | "CentralTransitive" | "Project") and,\n# except for Project, a "resolved" version. CentralTransitive marks transitive\n# packages pinned through Central Package Management (Directory.Packages.props). This is one nesting level deeper than composer.lock\'s\n# "packages"/"packages-dev" ARRAY of objects (src/50-ecosystems/30-php.sh), so\n# the same JSON brace/bracket DEPTH-TRACKING approach is used here but against\n# TWO thresholds instead of composer\'s one: package names are only captured\n# at "framework object contents" depth (deps_depth + 1) and "type"/"resolved"\n# fields only at "package object contents" depth (deps_depth + 2). This\n# precision matters because a Transitive (or Project) entry commonly carries\n# its OWN nested "dependencies" sub-object (name -> requested-range STRING,\n# not an object with a "resolved" field) one level deeper still, e.g.:\n#   "Serilog.Sinks.Console": {\n#     "type": "Transitive", "resolved": "4.1.0",\n#     "dependencies": { "Serilog": "3.1.1" }\n#   }\n# A depth-exact parser skips straight past that nested map (it never reaches\n# the field-capture depth), so it can never be mistaken for another package\n# or clobber the enclosing entry\'s own type/resolved - the identical class of\n# hardening composer.lock\'s parser applies to "authors"/"require"/"support".\n#\n# "type": "Project" entries (an in-solution ProjectReference resolved through\n# the lock file, e.g. a referenced class library) carry NO "resolved" field\n# at all, so they are skipped by construction: emit_pkg() only prints when\n# type is Direct, Transitive or CentralTransitive AND a resolved version was\n# captured.\n#\n# NORMALIZATION: package names (the JSON keys themselves) are LOWERCASED\n# (NuGet canon - the feed side, data/ghsa-nuget.purl / data/osv-nuget.purl,\n# and canon_purl_name() in src/31-parsers-purl.sh, both lowercase nuget names\n# already; composer/githubactions share this same canon). Versions are passed\n# through verbatim - real "resolved" values are always a bare\n# Major.Minor.Patch[.Revision][-prerelease] with no "v" prefix, ordered by\n# compare_versions_nuget (src/40-versions/25-nuget.sh).\n#\n# DEDUPE: a multi-targeted project (TargetFrameworks with more than one TFM)\n# repeats every package once per framework block; identical name|version\n# pairs collapse via the same `sort -u` every other parser in this codebase\n# uses, so a package resolving to the SAME version under both frameworks is\n# reported (and checked) exactly once.\nanalyze_nuget_lock() {\n    local lockfile="$1"\n    local eco="${2:-nuget}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(json_structural_lines "$lockfile" | awk \'\n    function emit_pkg() {\n        if (pkg_name != "" && pkg_version != "" && (pkg_type == "Direct" || pkg_type == "Transitive" || pkg_type == "CentralTransitive")) {\n            print pkg_name "|" pkg_version\n        }\n        pkg_name = ""\n        pkg_type = ""\n        pkg_version = ""\n    }\n    BEGIN {\n        depth = 0\n        in_deps = 0\n        deps_depth = -1\n    }\n    {\n        line = $0\n        gsub(/\\r/, "", line)                        # tolerate CRLF checkouts\n        start_depth = depth\n\n        # Enter the top-level "dependencies" object at the CURRENT (pre-line)\n        # depth. Guarded by !in_deps so a package\'\\\'\'s own nested "dependencies"\n        # sub-object (requested-range strings, no "type"/"resolved" fields -\n        # see header) cannot re-trigger this once already inside.\n        if (!in_deps && match(line, /"dependencies"[[:space:]]*:[[:space:]]*\\{/)) {\n            in_deps = 1\n            deps_depth = start_depth + 1\n            pkg_name = ""\n            pkg_type = ""\n            pkg_version = ""\n        }\n\n        # Package-name keys live one level inside each framework object\n        # (deps_depth + 1): "PackageId": { opens a new package entry.\n        if (in_deps && start_depth == deps_depth + 1) {\n            if (match(line, /^[[:space:]]*"[^"]+"[[:space:]]*:[[:space:]]*\\{/)) {\n                temp = line\n                sub(/^[[:space:]]*"/, "", temp)\n                sub(/"[[:space:]]*:[[:space:]]*\\{.*$/, "", temp)\n                if (temp != "") {\n                    pkg_name = tolower(temp)\n                    pkg_type = ""\n                    pkg_version = ""\n                }\n            }\n        }\n\n        # "type"/"resolved" are DIRECT fields of a package object, one level\n        # deeper still (deps_depth + 2); a nested per-package "dependencies"\n        # map (see header) sits at deps_depth + 3 and is excluded by this\n        # check regardless of its own key names.\n        if (in_deps && start_depth == deps_depth + 2) {\n            if (match(line, /^[[:space:]]*"type"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^[[:space:]]*"type"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "") pkg_type = temp\n            } else if (match(line, /^[[:space:]]*"resolved"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^[[:space:]]*"resolved"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "") pkg_version = temp\n            }\n        }\n\n        # Walk the line char-by-char (quoted-string contents skipped,\n        # backslash-escape aware) to keep `depth` exact, emitting the pending\n        # package the instant its object closes (back to deps_depth + 1),\n        # resetting stray state when a framework object closes (deps_depth),\n        # and closing "dependencies" itself once depth falls below deps_depth.\n        n = length(line)\n        in_str = 0\n        for (i = 1; i <= n; i++) {\n            c = substr(line, i, 1)\n            if (in_str) {\n                if (c == "\\\\") { i++ }\n                else if (c == "\\"") { in_str = 0 }\n                continue\n            }\n            if (c == "\\"") { in_str = 1; continue }\n            if (c == "{" || c == "[") {\n                depth++\n            } else if (c == "}" || c == "]") {\n                depth--\n                if (in_deps && depth == deps_depth + 1) {\n                    emit_pkg()\n                } else if (in_deps && depth == deps_depth) {\n                    pkg_name = ""\n                    pkg_type = ""\n                    pkg_version = ""\n                } else if (in_deps && depth < deps_depth) {\n                    in_deps = 0\n                    deps_depth = -1\n                    pkg_name = ""\n                    pkg_type = ""\n                    pkg_version = ""\n                }\n            }\n        }\n    }\n    END { emit_pkg() }\n    \' | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# Dart/Flutter (pub) dependency parser.\n#\n#   pubspec.lock -> analyze_pubspec_lock\n#\n# pubspec.lock is YAML, generated by `dart pub get` / `flutter pub get`. Shape\n# (indentation is significant and exact, 2 spaces per level):\n#\n#   packages:                        column-0, opens the block we care about\n#     dio:                             2-space  <- package name key\n#       dependency: "direct main"        4-space\n#       description:                     4-space\n#         name: dio                        6-space (nested map, ignored)\n#         sha256: "\u2026"                      6-space\n#         url: "https://pub.dev"           6-space\n#       source: hosted                   4-space  <- HOSTED packages only\n#       version: "4.0.6"                  4-space  <- always double-quoted\n#   sdks:                             column-0, closes the block\n#     dart: ">=3.0.0 <4.0.0"\n#     flutter: ">=3.10.0"\n#\n# Only `source: hosted` packages (pulled from pub.dev, or a self-hosted pub\n# server) resolve to a checkable name+version pair. `source: git` (a VCS\n# dependency pinned by commit, description holds url/ref/resolved-ref instead\n# of name/sha256/url) and `source: path` (a local filesystem dependency) are\n# both skipped the same way npm/ruby parsers skip link:/git-sourced deps \u2014 no\n# pub.dev release to compare against advisories. `source: sdk` (the `flutter`\n# and `dart` pseudo-packages the SDK itself provides) is skipped for the same\n# reason. Because the emit only fires when source == "hosted" was seen, all\n# three are excluded by construction; no explicit skip-list needed.\n#\n# The exactly-4-space checks (`^    source:` / `^    version:`) are what tell\n# a package\'s OWN source/version apart from anything nested inside its\n# 6-space "description:" sub-map: a 6-space line still starts with 4 spaces,\n# but its 5th character is ALSO a space, so it fails to match the literal\n# "source:"/"version:" that follows the 4-space prefix in the regex.\n#\n# The block ends at the next 2-space package key (flush + start a new one) or\n# at the top-level "sdks:" key (flush + stop): both close the currently-open\n# package the same way a `[[package]]` header change flushes Cargo.lock\'s\n# TOML parser.\nanalyze_pubspec_lock() {\n    local lockfile="$1"\n    local eco="${2:-pub}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    function emit_pkg() {\n        if (pkg_name != "" && pkg_source == "hosted" && pkg_version != "") {\n            print pkg_name "|" pkg_version\n        }\n        pkg_name = ""\n        pkg_source = ""\n        pkg_version = ""\n    }\n    BEGIN { in_packages = 0 }\n    {\n        gsub(/\\r/, "", $0)                     # tolerate CRLF checkouts\n    }\n    # Top-level "packages:" key opens the block we scan.\n    /^packages:[[:space:]]*$/ {\n        in_packages = 1\n        next\n    }\n    # Any OTHER column-0 (unindented) line \u2014 "sdks:" in practice, but treated\n    # generically like every other YAML-block parser in this codebase \u2014 flushes\n    # the pending package and closes the block for good.\n    in_packages && /^[A-Za-z]/ {\n        emit_pkg()\n        in_packages = 0\n        next\n    }\n    !in_packages { next }\n    # 2-space package-name key: flush the previous package, start this one.\n    /^  [A-Za-z0-9_]+:[[:space:]]*$/ {\n        emit_pkg()\n        line = $0\n        sub(/^  /, "", line)\n        sub(/:[[:space:]]*$/, "", line)\n        pkg_name = line\n        next\n    }\n    # 4-space "source: hosted" \u2014 git/path/sdk sources are simply never set,\n    # so emit_pkg()s guard (pkg_source == "hosted") skips them by construction.\n    /^    source:[[:space:]]*hosted[[:space:]]*$/ {\n        pkg_source = "hosted"\n        next\n    }\n    # 4-space "version: \\"x.y.z\\"" \u2014 always double-quoted in a real lockfile.\n    /^    version:[[:space:]]*"/ {\n        line = $0\n        sub(/^    version:[[:space:]]*"/, "", line)\n        sub(/".*$/, "", line)\n        pkg_version = line\n        next\n    }\n    END { emit_pkg() }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# Hex (Elixir/Erlang) dependency parser.\n#\n#   mix.lock -> analyze_mix_lock\n#\n# mix.lock is a literal Elixir map, generated by `mix deps.get`, ONE entry per\n# line (Mix always emits it pre-sorted and pre-formatted this way; hand-edits\n# are never expected to survive `mix deps.get` re-running). Shape:\n#\n#   %{\n#     "jason": {:hex, :jason, "1.4.1", "<64-hex outer checksum>", [:mix], [{:decimal, "~> 1.0", [hex: :decimal, repo: "hexpm", optional: true]}], "hexpm", "<64-hex inner checksum>"},\n#     "internal_auth": {:git, "https://github.com/example-org/internal_auth.git", "<40-hex commit sha>", []},\n#   }\n#\n# Unlike every other lockfile in this codebase, this is NOT a block/indent\n# structure to track \u2014 each dependency is already a complete, self-contained\n# line, so a single per-line regex match is enough (no BEGIN/state-machine,\n# no emit_pkg() flush-on-boundary dance).\n#\n# Only `{:hex, ...}` tuples (packages resolved from the hex.pm/private hex\n# registry) are checkable. `{:git, ...}` tuples (and, per the same Mix\n# resolver, `{:path, ...}` / `{:in_umbrella, ...}` \u2014 not modeled here since\n# they never even reach a `{:hex,`-shaped line) pin a VCS ref or local sibling\n# app instead, with no hex.pm release to compare against advisories \u2014 skipped\n# the same way npm/ruby/dart parsers skip link:/git/path-sourced deps. Because\n# the match anchor below REQUIRES the literal `{:hex,` immediately after the\n# name key, git/path lines simply never match; no explicit skip-list needed.\n#\n# EXTRACTION: the second tuple element is the Hex package name. The map key\n# is the application name and may differ when a dependency uses :hex. The\n# version is the FIRST quoted string AFTER the\n# literal `{:hex,` tuple tag and its `:atom_name,` element \u2014 i.e. the 3rd\n# tuple element, `"1.2.3"` in `{:hex, :name, "1.2.3", ...}`. The checksum\n# fields, `[:mix]` build-tools list, and dependency sub-list are all ignored.\n#\n# NORMALIZATION: none. Hex package names are used as-is (same canon as\n# npm/golang/cargo/gem/pub \u2014 see canon_purl_name() in src/31-parsers-purl.sh),\n# matching hex.pm\'s own case-sensitive package naming.\nanalyze_mix_lock() {\n    local lockfile="$1"\n    local eco="${2:-hex}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    # Anchor: a quoted map key followed by a literal `{:hex,` tuple tag.\n    # `{:git, ...}` (and any other non-hex tuple) lines simply never match\n    # this pattern, so they are excluded by construction.\n    /^[[:space:]]*"[^"]+"[[:space:]]*:[[:space:]]*\\{:hex,/ {\n        line = $0\n\n        # Walk past "{:hex," then past the ":atom_name," element to reach\n        # the tuple\'\\\'\'s 3rd element, whose FIRST quoted string is the version.\n        hexpos = index(line, "{:hex,")\n        if (hexpos == 0) next\n        rest = substr(line, hexpos + 6)\n        commapos = index(rest, ",")\n        if (commapos == 0) next\n        name = substr(rest, 1, commapos - 1)\n        gsub(/^[[:space:]]*:|[[:space:]]+$/, "", name)\n        gsub(/^"|"$/, "", name)\n        rest = substr(rest, commapos + 1)\n        if (!match(rest, /"[^"]+"/)) next\n        ver = substr(rest, RSTART + 1, RLENGTH - 2)\n\n        if (name != "" && ver != "") print name "|" ver\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# Swift Package Manager dependency parser.\n#\n#   Package.resolved -> analyze_package_resolved\n#\n# Package.resolved is plain JSON, in ONE of two shapes depending on the\n# swift-tools-version that generated it:\n#\n#   v2/v3 (Swift 5.4+): pins live directly at the top level.\n#     {\n#       "pins" : [\n#         {\n#           "identity" : "swift-nio",\n#           "kind" : "remoteSourceControl",\n#           "location" : "https://github.com/apple/swift-nio.git",\n#           "state" : { "revision" : "...", "version" : "2.10.0" }\n#         }\n#       ],\n#       "version" : 2\n#     }\n#\n#   v1 (swift-tools-version < 5.4): pins are nested one level deeper, under\n#   "object", and the URL field is named "repositoryURL" instead of\n#   "location" ("identity" is spelled "package" too, but neither name field\n#   is ever read \u2014 see NORMALIZATION below).\n#     {\n#       "object" : { "pins" : [\n#         { "package" : "swift-nio", "repositoryURL" : "https://github.com/apple/swift-nio.git",\n#           "state" : { "branch" : null, "revision" : "...", "version" : "2.10.0" } }\n#       ] },\n#       "version" : 1\n#     }\n#\n# Rather than branching on the top-level "version" field, this parser tracks\n# brace/bracket DEPTH (the same technique packages.lock.json\'s parser uses,\n# src/50-ecosystems/40-nuget.sh) starting from wherever the "pins" key is\n# found \u2014 v1\'s extra "object" nesting simply shifts every depth down by one,\n# which the relative tracking below absorbs for free, so both shapes are\n# handled by ONE code path with no format sniffing. A pin\'s own direct\n# fields (identity/package, kind, location/repositoryURL) are captured one\n# level inside the array; its "state" sub-object is captured one level\n# deeper still, where \u2014 matching either format \u2014 a `"version": "..."`\n# QUOTED STRING field is required.\n#\n# Branch/revision-only pins (no released version \u2014 e.g. a dependency pinned\n# to a branch or an exact commit) carry `"version": null` (v1) or omit the\n# key entirely (v2/v3): neither satisfies the quoted-string match above, so\n# ver stays empty and emit_pkg() skips the pin by construction \u2014 exactly\n# like npm/dart/hex skip git/path/sdk-sourced deps that have no registry\n# release to compare against advisories.\n#\n# NORMALIZATION (CRITICAL \u2014 must exactly match canon_purl_name\'s swift\n# branch in src/31-parsers-purl.sh, and the feed emission in src/60-feeds.sh,\n# since check_vulnerability performs no canonicalization of its own \u2014 see\n# src/45-matching.sh): the package "name" checked against advisories is NOT\n# the "identity"/"package" field (a short, human-picked label with no\n# guaranteed uniqueness) but the resolved repository URL itself,\n# canonicalized the same way GHSA/OSV swift feed rows are: strip a leading\n# scheme ("https://", "ssh://git@"), rewrite the scp-like "git@host:owner/repo"\n# form to "host/owner/repo", strip a trailing "/" and ".git", lowercase the\n# rest. E.g. "https://GitHub.com/Apple/Swift-NIO.git" becomes\n# "github.com/apple/swift-nio". This makes matching resilient to\n# mixed-case GitHub URLs (GitHub itself is case-insensitive) and to\n# scheme/suffix variations across manifests.\n#\n# Versions fall through compare_versions_eco\'s default (npm-semver) branch \u2014\n# swift has no dedicated comparator, src/40-versions/01-dispatch.sh \u2014 with a\n# leading "v" stripped first, same as go.sum/go.mod tags\n# (src/50-ecosystems/15-go.sh), since Package.swift dependency pins commonly\n# resolve against tags like "v2.10.0".\nanalyze_package_resolved() {\n    local lockfile="$1"\n    local eco="${2:-swift}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(json_structural_lines "$lockfile" | awk \'\n    function emit_pkg() {\n        if (url != "" && ver != "") {\n            canon = url\n            # https://host/o/r(.git)(/), ssh://git@host/o/r and the scp-like\n            # git@host:o/r all name the same repository: host/o/r.\n            if (sub(/^[A-Za-z][A-Za-z0-9+.-]*:\\/\\//, "", canon)) {\n                sub(/^[^@\\/]*@/, "", canon)\n            } else if (sub(/^[^@\\/:]*@/, "", canon)) {\n                sub(/:/, "/", canon)\n            }\n            sub(/\\/+$/, "", canon)\n            sub(/\\.git$/, "", canon)\n            canon = tolower(canon)\n            v = ver\n            sub(/^v/, "", v)\n            if (canon != "" && v != "") print canon "|" v\n        }\n        url = ""\n        ver = ""\n    }\n    BEGIN {\n        depth = 0\n        in_pins = 0\n        pins_depth = -1\n    }\n    {\n        line = $0\n        gsub(/\\r/, "", line)                        # tolerate CRLF checkouts\n        start_depth = depth\n\n        # Enter the "pins" array wherever it appears (top level for v2/v3,\n        # one level inside "object" for v1) \u2014 see header for why relative\n        # depth tracking makes the two formats interchangeable here.\n        if (!in_pins && match(line, /"pins"[[:space:]]*:[[:space:]]*\\[/)) {\n            in_pins = 1\n            pins_depth = start_depth + 1\n            url = ""\n            ver = ""\n        }\n\n        # A pin object own direct fields, one level inside the array:\n        # "location" (v2/v3) or "repositoryURL" (v1) carry the repo URL.\n        if (in_pins && start_depth == pins_depth + 1) {\n            if (match(line, /"location"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^.*"location"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "") url = temp\n            } else if (match(line, /"repositoryURL"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^.*"repositoryURL"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "") url = temp\n            }\n        }\n\n        # The pin nested "state" object, one level deeper still: only a\n        # QUOTED "version" string counts \u2014 branch-only pins carry\n        # "version": null (v1) or omit the key (v2/v3), neither of which\n        # matches, so those pins fall through unresolved (see header).\n        if (in_pins && start_depth == pins_depth + 2) {\n            if (match(line, /"version"[[:space:]]*:[[:space:]]*"/)) {\n                temp = line\n                sub(/^.*"version"[[:space:]]*:[[:space:]]*"/, "", temp)\n                sub(/".*$/, "", temp)\n                if (temp != "") ver = temp\n            }\n        }\n\n        # Walk the line char-by-char (quoted-string contents skipped,\n        # backslash-escape aware) to keep `depth` exact, emitting the\n        # pending pin the instant its object closes (back to pins_depth),\n        # and closing the "pins" array itself once depth falls below it.\n        n = length(line)\n        in_str = 0\n        for (i = 1; i <= n; i++) {\n            c = substr(line, i, 1)\n            if (in_str) {\n                if (c == "\\\\") { i++ }\n                else if (c == "\\"") { in_str = 0 }\n                continue\n            }\n            if (c == "\\"") { in_str = 1; continue }\n            if (c == "{" || c == "[") {\n                depth++\n            } else if (c == "}" || c == "]") {\n                depth--\n                if (in_pins && depth == pins_depth) {\n                    emit_pkg()\n                } else if (in_pins && depth < pins_depth) {\n                    in_pins = 0\n                    pins_depth = -1\n                    url = ""\n                    ver = ""\n                }\n            }\n        }\n    }\n    \' | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        # Primary probe: the canonical repo-URL name (github.com/owner/repo).\n        local before_probe=${#VULNERABLE_PACKAGES[@]}\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n        # A few GHSA/OSV Swift advisories record the package under a bare\n        # identifier (e.g. "swift-crypto") instead of the repo URL every\n        # other advisory uses. Those can never match the URL-form name, so\n        # when the primary probe found nothing, retry with the bare last\n        # path segment as a fallback (guarded so URL-form matches always win\n        # and we never double-count the same pin).\n        if [ "${#VULNERABLE_PACKAGES[@]}" -eq "$before_probe" ] && [ "${pkg_name##*/}" != "$pkg_name" ]; then\n            check_vulnerability "$eco" "${pkg_name##*/}" "$version" "$lockfile" || true\n        fi\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# GitHub Actions workflow parser.\n#\n#   .github/workflows/*.yml | *.yaml -> analyze_github_workflow\n#\n# UNIQUE DISCOVERY: unlike every other ecosystem in this tool, GitHub Actions is\n# selected by PATH, not by a lockfile basename \u2014 workflow files live at a\n# well-known location (.github/workflows/) under arbitrary names. That hook is\n# declared ONCE in PATH_ECOSYSTEM_REGISTRY (src/50-ecosystems/01-registry.sh);\n# discover_project_files finds the files and the main() analysis loop routes\n# them here via path_ecosystem_match(). This file only implements the analyzer.\n#\n# WHAT IS CHECKED: the `uses:` step references that pin a published action, i.e.\n# `owner/repo@ref` or `owner/repo/subpath@ref` (the latter covers subpath\n# actions and reusable-workflow calls like `org/repo/.github/workflows/x.yml@ref`).\n# The plain mapping key (`uses: ...`), the list-item form (`- uses: ...`) and a\n# single-line flow mapping (`- {name: x, uses: ...}`) are handled, quoted\n# ("...") or unquoted.\n#\n# SKIPPED by construction:\n#   * local actions  \u2014 `./path` or `../path` (no published version to check)\n#   * docker images  \u2014 `docker://image:tag` (not a GitHub Action release)\n#   * versionless    \u2014 `uses: owner/repo` with no `@ref` (nothing to compare)\n#   * non-action     \u2014 a value with no `owner/repo`-shaped `/` before the `@`\n#\n# NORMALIZATION (must match canon_purl_name\'s githubactions branch in\n# src/31-parsers-purl.sh, which lowercases, and the feed emission): the name is\n# `owner/repo[/subpath]` LOWERCASED. The version is the ref with a leading `v`\n# stripped when it precedes a digit (`v4.1.1` -> `4.1.1`), matching go.sum/swift\n# tag handling and the semver comparator (githubactions falls through\n# compare_versions_eco\'s default npm-semver branch, src/40-versions/01-dispatch.sh).\n# Branch refs (main, release) and 40-hex commit SHAs pass through unchanged; a\n# SHA-pinned ref can then only ever EXACT-match a feed entry pinned to that same\n# SHA \u2014 which is fine.\n#\n# LIMITATIONS (documented, intentional):\n#   * The `uses: owner/repo@<sha> # vX.Y.Z` version-comment convention is NOT\n#     parsed \u2014 the trailing comment is stripped and the SHA is used verbatim, so\n#     a SHA-pinned action is only matched by an exact-SHA advisory, not by the\n#     commented semver. Keeping comment parsing out avoids a brittle heuristic.\n#   * A subpath ref (`github/codeql-action/analyze@v3`) is keyed by its FULL\n#     `owner/repo/subpath` name; advisories published against the base repo\n#     (`github/codeql-action`) therefore do not match a subpathed `uses:`.\n#   * Floating tags with fewer than three parts (`@v4`, `@v4.1`) are skipped:\n#     they track the latest release of that line, so the resolved version is\n#     unknown and comparing `4` against `<4.0.1` would be a false positive.\n#   * Best-effort line matching: a literal `uses: owner/repo@ref` line buried\n#     inside a `run:` shell block would be treated as a step reference. This\n#     mirrors the line-oriented approach of the other lockfile parsers.\nanalyze_github_workflow() {\n    local lockfile="$1"\n    local eco="${2:-githubactions}"\n\n    local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n    local packages\n    packages=$(awk \'\n    {\n        line = $0\n        gsub(/\\r/, "", line)                    # tolerate CRLF checkouts\n\n        if (line ~ /^[[:space:]]*-?[[:space:]]*\\{/ &&\n            match(line, /[{,][[:space:]]*uses[[:space:]]*:[[:space:]]*/)) {\n            # Flow mapping step: `- {name: x, uses: owner/repo@ref, with: {..}}`.\n            # The value ends at its closing quote, or at the next "," or "}".\n            val = substr(line, RSTART + RLENGTH)\n            quote = substr(val, 1, 1)\n            if (quote == "\\"" || quote == "\'\\\'\'") {\n                closing = index(substr(val, 2), quote)\n                if (closing == 0) next\n                val = substr(val, 2, closing - 1)\n            } else {\n                sub(/[[:space:]]*[,}].*$/, "", val)\n            }\n        } else {\n            # Only lines whose key is `uses:` (optionally a `- uses:` list item).\n            if (line !~ /^[[:space:]]*-?[[:space:]]*uses[[:space:]]*:/) next\n\n            # Strip everything up to and including the `uses:` key.\n            val = line\n            sub(/^[[:space:]]*-?[[:space:]]*uses[[:space:]]*:[[:space:]]*/, "", val)\n        }\n\n        # Strip a trailing YAML comment (whitespace + # to EOL). Action refs\n        # never contain a literal " #"; SHA-pin version comments are discarded.\n        sub(/[[:space:]]+#.*$/, "", val)\n\n        # Trim surrounding whitespace.\n        gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)\n\n        # Strip one layer of surrounding quotes (double or single).\n        if (length(val) >= 2) {\n            first = substr(val, 1, 1)\n            last  = substr(val, length(val), 1)\n            if ((first == "\\"" && last == "\\"") || (first == "\'\\\'\'" && last == "\'\\\'\'")) {\n                val = substr(val, 2, length(val) - 2)\n                gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)\n            }\n        }\n\n        if (val == "") next\n\n        # Skip local actions (./ or ../) and docker image references.\n        if (val ~ /^\\.\\.?\\//) next\n        if (val ~ /^docker:\\/\\//) next\n\n        # Need an @ref to resolve a version; split at the LAST @ (refs never\n        # contain @, and this is robust to any future name oddities).\n        at = 0\n        for (i = length(val); i >= 1; i--) {\n            if (substr(val, i, 1) == "@") { at = i; break }\n        }\n        if (at <= 1) next\n        name = substr(val, 1, at - 1)\n        ref  = substr(val, at + 1)\n        if (name == "" || ref == "") next\n\n        # A real action reference is owner/repo[/subpath] \u2014 require the slash.\n        # This drops stray `uses:` lines that are not action references.\n        if (index(name, "/") == 0) next\n\n        # Canonical GitHub Actions name: lowercased owner/repo[/subpath].\n        name = tolower(name)\n\n        # Version tag: strip a leading `v` before a digit (v1.2.3 -> 1.2.3).\n        # Branch names and 40-hex commit SHAs pass through unchanged.\n        if (ref ~ /^v[0-9]/) sub(/^v/, "", ref)\n\n        # Floating major/minor tags (@v4, @v4.1) move with every release: the\n        # commit they resolve to is unknown here, so comparing "46" against\n        # "<46.0.1" would flag every user of a long-patched action. Skip them.\n        if (ref ~ /^[0-9]+(\\.[0-9]+)?$/) next\n\n        if (name != "" && ref != "") print name "|" ref\n    }\n    \' "$lockfile" 2>/dev/null | sort -u)\n\n    while IFS=\'|\' read -r pkg_name version; do\n        [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n        check_vulnerability "$eco" "$pkg_name" "$version" "$lockfile" || true\n    done <<< "$packages"\n\n    local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n    if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n        echo -e "${GREEN}\u2713 [$lockfile] No vulnerabilities found${NC}"\n    fi\n}\n# ============================================================================\n# Runtime version check (Node.js, PHP)\n#\n# A project also targets a runtime: .nvmrc, a Docker base image, the PHP\n# version composer resolves for... Those versions are checked against the\n# runtime feed (data/osv-runtime.purl, lines pkg:runtime/<node|php>@<range>,\n# see fetch_runtime in src/60-feeds.sh).\n#\n#   * an exact version (22.1.0) is a normal finding: [runtime] node@22.1.0;\n#   * a release line (20, 8.3, node:20-alpine) floats to its latest release:\n#     it is reported only when no release of the line is fixed (EOL line);\n#   * a range (>=18, ^8.1) is reported when its lowest admitted version is\n#     vulnerable.\n# Lines and ranges are yellow warnings only: they never change the exit code.\n# Values that name no version (lts/*, latest, ${NODE_VERSION}) are ignored.\n#\n# Runtime files are discovered with the lockfiles (discover_project_files) but\n# are not ecosystem registry rows: they select no GHSA/OSV feed.\n# ============================================================================\n\n# find -name patterns of the runtime version files (package.json and the\n# GitHub Actions workflows are matched separately by discover_project_files).\nRUNTIME_FILE_NAMES=(.nvmrc .node-version .tool-versions .php-version composer.json composer.lock \'Dockerfile*\' \'*.Dockerfile\' \'*.dockerfile\')\n\n# Warnings printed again in the summary (one line per file and runtime).\nRUNTIME_WARNINGS=()\n\n# A line any file naming a runtime version contains (a superset of what\n# runtime_specs reads): most package.json files have no engines and must not\n# pull the runtime feed.\nRUNTIME_HINT_RE=\'"(engines|volta)"[[:space:]]*:|"php"[[:space:]]*:|"platform-overrides"|(node|php)-version[[:space:]]*:|^[[:space:]]*[Ff][Rr][Oo][Mm][[:space:]].*(node|php)|^(nodejs|node|php)[[:space:]]|^[[:space:]]*[vV]?[0-9]\'\n\n# Print the files of a newline-separated list that may name a runtime version\n# (one grep for all of them).\nruntime_files_with_versions() {\n    [ -n "$1" ] || return 0\n    printf \'%s\\n\' "$1" | tr \'\\n\' \'\\0\' | xargs -0 grep -lE -- "$RUNTIME_HINT_RE" 2>/dev/null || true\n}\n\n# Classify a discovered file. Sets RUNTIME_KIND; returns 1 when the file names\n# no runtime version.\nruntime_file_kind() {\n    local file="$1"\n    case "${file##*/}" in\n        .nvmrc|.node-version) RUNTIME_KIND=node_version ;;\n        .php-version) RUNTIME_KIND=php_version ;;\n        .tool-versions) RUNTIME_KIND=tool_versions ;;\n        package.json) RUNTIME_KIND=package_json ;;\n        composer.json) RUNTIME_KIND=composer_json ;;\n        composer.lock) RUNTIME_KIND=composer_lock ;;\n        Dockerfile*|*.Dockerfile|*.dockerfile) RUNTIME_KIND=dockerfile ;;\n        *.yml|*.yaml)\n            [[ "$file" == */.github/workflows/* ]] || return 1\n            RUNTIME_KIND=workflow ;;\n        *) return 1 ;;\n    esac\n}\n\n# Print "runtime|spec" for every runtime version a file names, raw (quotes\n# and comments removed).\n#\n# json_runtime_values FILE RUNTIME PATH...: print "RUNTIME|value" for the\n# string or number at each slash PATH of a JSON file, in PATH order, in one\n# pass (paths are member names from the root object).\njson_runtime_values() {\n    local file="$1" runtime="$2"\n    shift 2\n    # AWK_JSON_PATH calls AWK_FEED_LIB functions: mawk rejects a program\n    # referencing undefined functions, even uncalled ones.\n    json_structural_lines "$file" 2>/dev/null | awk -v runtime="$runtime" -v wanted="$*" "$AWK_FEED_LIB$AWK_JSON_PATH"\'\n    BEGIN { n = split(wanted, order, " ") }\n    {\n        jp_step($0)\n        if (JP_EVENT != "scalar" || JP_VAL == "null" || JP_VAL == "") next\n        path = JP_PATH "/" JP_KEY\n        sub(/^\\/#/, "", path)\n        if (!(path in found)) found[path] = JP_VAL\n    }\n    END { for (i = 1; i <= n; i++) if (order[i] in found) print runtime "|" found[order[i]] }\n    \'\n}\n\nruntime_specs() {\n    local file="$1"\n    runtime_file_kind "$file" || return 0\n    case "$RUNTIME_KIND" in\n        node_version|php_version)\n            local rt=node\n            [ "$RUNTIME_KIND" = node_version ] || rt=php\n            awk -v rt="$rt" \'{ sub(/\\r$/, ""); sub(/#.*/, "") } NF { print rt "|" $1; exit }\' "$file"\n            ;;\n        tool_versions)\n            # asdf / mise: "nodejs 22.1.0 20.0.0" (every listed version is installed)\n            awk \'{ sub(/\\r$/, ""); sub(/#.*/, "") }\n                $1 == "nodejs" || $1 == "node" || $1 == "php" {\n                    rt = ($1 == "php") ? "php" : "node"\n                    for (i = 2; i <= NF; i++) print rt "|" $i\n                }\' "$file"\n            ;;\n        package_json)\n            grep -qE \'"(engines|volta)"[[:space:]]*:\' "$file" || return 0\n            json_runtime_values "$file" node /engines/node /volta/node\n            ;;\n        composer_json)\n            grep -q \'"php"\' "$file" || return 0\n            # config.platform.php: the PHP version composer resolves for\n            json_runtime_values "$file" php /config/platform/php /require/php\n            ;;\n        composer_lock)\n            grep -q \'"platform-overrides"\' "$file" || return 0\n            json_runtime_values "$file" php /platform-overrides/php\n            ;;\n        dockerfile)\n            # FROM [--platform=...] [registry/][library/]node:TAG[@digest] [AS name]\n            awk \'{ sub(/\\r$/, "") }\n                toupper($1) == "FROM" {\n                    i = 2\n                    while (i <= NF && substr($i, 1, 2) == "--") i++\n                    image = $i\n                    sub(/@.*/, "", image)\n                    colon = 0\n                    for (j = length(image); j > 0; j--) {\n                        c = substr(image, j, 1)\n                        if (c == "/") break\n                        if (c == ":") { colon = j; break }\n                    }\n                    if (colon == 0) next\n                    name = tolower(substr(image, 1, colon - 1))\n                    tag = substr(image, colon + 1)\n                    sub(/^(index\\.)?docker\\.io\\//, "", name)\n                    sub(/^library\\//, "", name)\n                    if (name != "node" && name != "php") next\n                    # Variant suffixes name no version: 20-alpine, 8.3.10-fpm-bookworm\n                    if (match(tag, /^[vV]?[0-9]+(\\.[0-9]+)*/) && (RLENGTH == length(tag) || substr(tag, RLENGTH + 1, 1) == "-"))\n                        tag = substr(tag, 1, RLENGTH)\n                    print name "|" tag\n                }\' "$file"\n            ;;\n        workflow)\n            # node-version: 22.1.0 | [18, 20] | a block list; php-version: likewise\n            awk \'\n            function emit(rt, v) {\n                gsub(/^[[:space:]"\\047]+|[[:space:]"\\047]+$/, "", v)\n                if (v != "") print rt "|" v\n            }\n            { sub(/\\r$/, "") }\n            list_rt != "" {\n                if (match($0, /^[[:space:]]*-[[:space:]]+/) && RLENGTH > list_indent) {\n                    v = substr($0, RLENGTH + 1)\n                    sub(/[[:space:]]+#.*/, "", v)\n                    emit(list_rt, v)\n                    next\n                }\n                if ($0 !~ /^[[:space:]]*(#.*)?$/) list_rt = ""\n            }\n            match($0, /^[[:space:]]*(-[[:space:]]+)?(node|php)-version:/) {\n                key_indent = RLENGTH\n                rt = ($0 ~ /php-version:/) ? "php" : "node"\n                v = substr($0, RLENGTH + 1)\n                sub(/[[:space:]]+#.*/, "", v)\n                gsub(/^[[:space:]]+|[[:space:]]+$/, "", v)\n                if (v == "") { list_rt = rt; list_indent = key_indent - length(rt "-version:"); next }\n                if (substr(v, 1, 1) == "[") {\n                    gsub(/[][]/, "", v)\n                    n = split(v, items, ",")\n                    for (k = 1; k <= n; k++) emit(rt, items[k])\n                } else emit(rt, v)\n            }\' "$file"\n            ;;\n    esac\n}\n\n# Normalize a raw spec: no quotes or blanks at the ends, no "v" before a\n# version, ".x" / ".*" wildcards dropped (20.x -> 20). Sets RT_SPEC.\nruntime_normalize_spec() {\n    local s="$1"\n    s="${s#"${s%%[![:space:]\\"\\\']*}"}"\n    s="${s%"${s##*[![:space:]\\"\\\']}"}"\n    [[ "$s" == [vV][0-9]* ]] && s="${s:1}"\n    while [[ "$s" == *.[xX*] ]]; do s="${s%.?}"; done\n    RT_SPEC="$s"\n}\n\n# Lowest version a range admits, padded to x.y.z (>=18 -> 18.0.0,\n# ^8.1 || ^7.4 -> 7.4.0). Alternatives without a lower bound (<20, *) are\n# skipped. Sets RT_FLOOR (empty when no alternative has one).\nruntime_range_floor() {\n    local spec="${1//||/|}" alt token v\n    local -a alts tokens parts\n    RT_FLOOR=""\n    IFS=\'|\' read -ra alts <<< "$spec"\n    for alt in "${alts[@]}"; do\n        alt="${alt//,/ }"\n        # Glue a detached operator to its version: ">= 18" -> ">=18"\n        while [[ "$alt" =~ ^(.*)(\\>=|\\>|~\\>|~=|\\^|~|==|=)[[:space:]]+(.*)$ ]]; do\n            alt="${BASH_REMATCH[1]}${BASH_REMATCH[2]}${BASH_REMATCH[3]}"\n        done\n        read -ra tokens <<< "$alt"\n        v=""\n        for token in "${tokens[@]}"; do\n            if [[ "$token" =~ ^(\\>=|\\>|~\\>|~=|\\^|~|==|=)?[vV]?([0-9]+(\\.[0-9xX*]+)*)$ ]]; then\n                v="${BASH_REMATCH[2]}"\n                break\n            fi\n        done\n        [ -n "$v" ] || continue\n        while [[ "$v" == *.[xX*] ]]; do v="${v%.?}"; done\n        IFS=\'.\' read -ra parts <<< "$v"\n        v="${parts[0]}.${parts[1]:-0}.${parts[2]:-0}"\n        if [ -z "$RT_FLOOR" ]; then\n            RT_FLOOR="$v"\n        else\n            compare_versions "$v" "$RT_FLOOR"\n            [ "$COMPARE_RESULT" != -1 ] || RT_FLOOR="$v"\n        fi\n    done\n}\n\n# Integer key of a plain x.y.z version (missing parts count as 0), ordered\n# like compare_versions for such versions. Sets RT_KEY; returns 1 for any\n# other version (pre-release, 6+ digit minor or patch).\n_rt_numeric_key() {\n    [[ "$1" =~ ^[vV]?([0-9]{1,8})(\\.([0-9]{1,5}))?(\\.([0-9]{1,5}))?$ ]] || return 1\n    RT_KEY=$(( 10#${BASH_REMATCH[1]} * 10000000000 + 10#${BASH_REMATCH[3]:-0} * 100000 + 10#${BASH_REMATCH[5]:-0} ))\n}\n\n# Per runtime, the loaded feed indexed once (runtime_index): RT_INDEX[rt]\n# holds one "range|ident|fix_key|fix" row per advisory record, RT_COND\n# ["rt|range"] the range as integer comparators ("op key op key", "*" or "!";\n# empty when a bound is not plain x.y.z: version_in_range decides).\ndeclare -A RT_INDEX=() RT_COND=() RT_AFFECTED_CACHE=()\n\nruntime_index() {\n    local rt="$1" key="runtime:$1" range rec recs rows="" cond parsed i ok\n    local ghsa cve fix id ident fix_key\n    local -a tokens\n    while IFS= read -r range; do\n        [ -n "$range" ] || continue\n        cond=""\n        case "$range" in\n            # Alternatives and intervals: version_in_range decides.\n            *"|"*|*"["*|*"("*) ;;\n            *)\n                [ -n "${RANGE_CACHE[runtime|$range]+x}" ] || _prepare_range "$range" "runtime|$range"\n                parsed="${RANGE_CACHE[runtime|$range]}"\n                # Exclusions (!=1.3.*) and version lists: version_in_range decides.\n                [ -z "${RANGE_EXCLUDES[runtime|$range]+x}" ] || parsed="anyof"\n                case "$parsed" in\n                    "anyof"*) ;;\n                    "*"|"!") cond="$parsed" ;;\n                    *)\n                        ok=true\n                        read -ra tokens <<< "$parsed"\n                        for (( i = 0; i < ${#tokens[@]}; i += 2 )); do\n                            _rt_numeric_key "${tokens[i + 1]}" || { ok=false; break; }\n                            cond+="${tokens[i]} $RT_KEY "\n                        done\n                        [ "$ok" = true ] || cond="" ;;\n                esac ;;\n        esac\n        RT_COND["$rt|$range"]="${cond% }"\n        recs="${VULN_RECORDS[$key:$range]:-}"\n        while [ -n "$recs" ]; do\n            # "severity;ghsa;cve;source;fix;id", split without a subshell\n            rec="${recs%%$\'\\n\'*}"\n            recs="${recs#*$\'\\n\'}"\n            [ "$rec" != "$recs" ] || recs=""\n            rec="${rec#*;}"; ghsa="${rec%%;*}"\n            rec="${rec#*;}"; cve="${rec%%;*}"\n            rec="${rec#*;}"; rec="${rec#*;}"; fix="${rec%%;*}"\n            id="${rec#*;}"\n            ident="${cve:-${ghsa:-$id}}"\n            [ -n "$ident" ] || continue\n            fix_key=""\n            [ -z "$fix" ] || ! _rt_numeric_key "$fix" || fix_key="$RT_KEY"\n            rows+="$range|$ident|$fix_key|$fix"$\'\\n\'\n        done\n    done <<< "${VULN_RANGE_LOOKUP[$key]:-}"\n    RT_INDEX["$rt"]="$rows"\n}\n\n# Advisories of a runtime that affect one version. Sets RT_IDS (sorted,\n# space-separated CVE or advisory ids) and RT_FIX (for each advisory, the\n# lowest fixed version above VERSION; the highest of those, so that one\n# upgrade fixes them all). Returns 1 when no advisory affects VERSION.\n# Results are cached per version: workflows repeat the same lines.\nruntime_affected() {\n    local rt="$1" version="$2" cached="$1|$2"\n    if [ -n "${RT_AFFECTED_CACHE[$cached]+x}" ]; then\n        cached="${RT_AFFECTED_CACHE[$cached]}"\n        [ -n "$cached" ] || return 1\n        RT_IDS="${cached%%|*}" RT_FIX="${cached#*|}"\n        return 0\n    fi\n    [ -n "${RT_INDEX[$rt]+x}" ] || runtime_index "$rt"\n    local key="runtime:$1" range ident fix_key fix cond vkey="" i matched candidate rec lk lf\n    local severity ghsa cve source id\n    local -A hit=() lowest_key=() lowest_fix=() range_hit=()\n    local -a c exacts\n    RT_IDS="" RT_FIX=""\n    CHECK_ECO=runtime\n    ! _rt_numeric_key "$version" || vkey="$RT_KEY"\n    while IFS=\'|\' read -r range ident fix_key fix; do\n        [ -n "$range" ] || continue\n        if [ -z "${range_hit[$range]+x}" ]; then\n            cond="${RT_COND[$rt|$range]}"\n            matched=0\n            if [ -n "$vkey" ] && [ -n "$cond" ]; then\n                case "$cond" in\n                    "*") matched=1 ;;\n                    "!") ;;\n                    *)\n                        matched=1\n                        read -ra c <<< "$cond"\n                        for (( i = 0; i < ${#c[@]}; i += 2 )); do\n                            case "${c[i]}" in\n                                ">=") (( vkey >= c[i + 1] )) ;;\n                                ">") (( vkey > c[i + 1] )) ;;\n                                "<") (( vkey < c[i + 1] )) ;;\n                                "<=") (( vkey <= c[i + 1] )) ;;\n                                "=") (( vkey == c[i + 1] )) ;;\n                                "!=") (( vkey != c[i + 1] )) ;;\n                            esac || { matched=0; break; }\n                        done ;;\n                esac\n            elif version_in_range "$version" "$range"; then\n                matched=1\n            fi\n            range_hit["$range"]=$matched\n        fi\n        [ "${range_hit[$range]}" = 0 ] || hit["$ident"]=1\n        [ -n "$fix" ] || continue\n        # Lowest fix above VERSION, per advisory (integer keys when both\n        # sides are plain x.y.z, compare_versions otherwise).\n        lk="${lowest_key[$ident]:-}" lf="${lowest_fix[$ident]:-}"\n        if [ -n "$vkey" ] && [ -n "$fix_key" ]; then\n            (( fix_key > vkey )) || continue\n            if [ -n "$lk" ]; then\n                (( fix_key < lk )) || continue\n            elif [ -n "$lf" ]; then\n                compare_versions "$fix" "$lf"\n                [ "$COMPARE_RESULT" = -1 ] || continue\n            fi\n        else\n            compare_versions "$fix" "$version"\n            [ "$COMPARE_RESULT" = 1 ] || continue\n            if [ -n "$lf" ]; then\n                compare_versions "$fix" "$lf"\n                [ "$COMPARE_RESULT" = -1 ] || continue\n            fi\n        fi\n        lowest_key["$ident"]="$fix_key"\n        lowest_fix["$ident"]="$fix"\n    done <<< "${RT_INDEX[$rt]}"\n    IFS=\'|\' read -ra exacts <<< "${VULN_EXACT_LOOKUP[$key]:-}"\n    for candidate in "${exacts[@]}"; do\n        [ -n "$candidate" ] && version_matches_vulnerable "$version" "$candidate" || continue\n        while IFS= read -r rec; do\n            IFS=\';\' read -r severity ghsa cve source fix id <<< "$rec"\n            ident="${cve:-${ghsa:-$id}}"\n            [ -z "$ident" ] || hit["$ident"]=1\n        done <<< "${VULN_RECORDS[$key@$candidate]:-}"\n    done\n    if [ ${#hit[@]} -eq 0 ]; then\n        RT_AFFECTED_CACHE["$rt|$version"]=""\n        return 1\n    fi\n    RT_IDS=$(printf \'%s\\n\' "${!hit[@]}" | sort | tr \'\\n\' \' \')\n    RT_IDS="${RT_IDS% }"\n    for ident in "${!hit[@]}"; do\n        fix="${lowest_fix[$ident]:-}"\n        [ -n "$fix" ] || continue\n        if [ -n "$RT_FIX" ]; then\n            compare_versions "$fix" "$RT_FIX"\n            [ "$COMPARE_RESULT" = 1 ] || continue\n        fi\n        RT_FIX="$fix"\n    done\n    RT_AFFECTED_CACHE["$rt|$version"]="$RT_IDS|$RT_FIX"\n    return 0\n}\n\nruntime_display_name() {\n    case "$1" in\n        node) echo "Node.js" ;;\n        php) echo "PHP" ;;\n        *) echo "$1" ;;\n    esac\n}\n\n# Check the runtime versions of every RUNTIME_FILES entry (see the header).\nscan_runtimes() {\n    local file rt spec probe kind count before=${#VULNERABLE_PACKAGES[@]} warned=0\n    local -A seen=() warn_specs=() warn_ids=() warn_fix=() warn_kind=()\n    local ids n message label\n    # Monorepos repeat the same spec ("engines": {"node": ">=18"}) in every\n    # package: its advisory id list is formatted once (5 processes).\n    local -A ids_cache=()\n    count=$(printf \'%s\\n\' "$RUNTIME_FILES" | wc -l | tr -d \' \')\n    echo "\u{1F9E9} Checking runtime versions in $count file(s)..."\n    while IFS= read -r file; do\n        # Unreadable files never get here (runtime_files_with_versions).\n        [ -n "$file" ] || continue\n        # Per runtime: the specs to warn about, their advisories, the fix.\n        warn_specs=() warn_ids=() warn_fix=() warn_kind=()\n        while IFS=\'|\' read -r rt spec; do\n            [ -n "$rt" ] || continue\n            runtime_normalize_spec "$spec"\n            spec="$RT_SPEC"\n            [ -z "${seen[$file|$rt|$spec]+x}" ] || continue\n            seen["$file|$rt|$spec"]=1\n            if [[ "$spec" =~ ^[0-9]+\\.[0-9]+\\.[0-9]+$ ]]; then\n                check_vulnerability "runtime" "$rt" "$spec" "$file" || true\n                continue\n            fi\n            # Warnings belong to full scans, not to a --package-name lookup.\n            [ -z "${PACKAGE_FILTER:-}" ] || continue\n            if [[ "$spec" =~ ^[0-9]+$ ]]; then\n                probe="$spec.99999.99999" kind=line\n            elif [[ "$spec" =~ ^[0-9]+\\.[0-9]+$ ]]; then\n                probe="$spec.99999" kind=line\n            elif [[ "$spec" =~ [\\<\\>=^~|,*\\ ] ]]; then\n                runtime_range_floor "$spec"\n                [ -n "$RT_FLOOR" ] || continue\n                probe="$RT_FLOOR" kind=range\n            else\n                continue\n            fi\n            runtime_affected "$rt" "$probe" || continue\n            warn_specs["$rt"]+="${warn_specs[$rt]:+, }$spec"\n            warn_ids["$rt"]+="${warn_ids[$rt]:+ }$RT_IDS"\n            [ "$kind" = line ] && [ -n "${warn_kind[$rt]:-}" ] || warn_kind["$rt"]="$kind"\n            if [ -n "$RT_FIX" ]; then\n                if [ -z "${warn_fix[$rt]:-}" ]; then\n                    warn_fix["$rt"]="$RT_FIX"\n                else\n                    compare_versions "$RT_FIX" "${warn_fix[$rt]}"\n                    [ "$COMPARE_RESULT" != 1 ] || warn_fix["$rt"]="$RT_FIX"\n                fi\n            fi\n        done < <(runtime_specs "$file")\n\n        for rt in "${!warn_specs[@]}"; do\n            if [ -z "${ids_cache[${warn_ids[$rt]}]+x}" ]; then\n                # Newest advisories first (CVE-YYYY-NNNN).\n                # shellcheck disable=SC2086 # space-separated advisory ids\n                ids=$(printf \'%s\\n\' ${warn_ids[$rt]} | sort -u | sort -t- -k2,2nr -k3,3nr)\n                n=$(printf \'%s\\n\' "$ids" | wc -l | tr -d \' \')\n                ids=$(printf \'%s\\n\' "$ids" | head -n 3 | tr \'\\n\' \' \')\n                ids="${ids% }"\n                ids="${ids// /, }"\n                [ "$n" -le 3 ] || ids+=" (+$((n - 3)) more)"\n                ids_cache["${warn_ids[$rt]}"]="$ids"\n            fi\n            ids="${ids_cache[${warn_ids[$rt]}]}"\n            label="$(runtime_display_name "$rt") ${warn_specs[$rt]}"\n            if [ "${warn_kind[$rt]}" = line ]; then\n                message="$label: no release of this line fixes $ids"\n                [ -z "${warn_fix[$rt]:-}" ] || message+="; move to >= ${warn_fix[$rt]}"\n            else\n                message="$label allows vulnerable versions ($ids)"\n                [ -z "${warn_fix[$rt]:-}" ] || message+="; raise the minimum to >= ${warn_fix[$rt]}"\n            fi\n            echo -e "${YELLOW}\u26A0\uFE0F  [$file] $message${NC}"\n            RUNTIME_WARNINGS+=("[$file] $message")\n            warned=$((warned + 1))\n        done\n    done <<< "$RUNTIME_FILES"\n\n    if [ "${#VULNERABLE_PACKAGES[@]}" -eq "$before" ] && [ "$warned" -eq 0 ]; then\n        echo -e "${GREEN}\u2713 Runtime versions: no known vulnerability${NC}"\n    fi\n}\n# Write a JSON string without a subshell or a runtime JSON dependency.\njson_print_string() {\n    local value="$1" code char escaped\n    value="${value//\\\\/\\\\\\\\}"\n    value="${value//\\"/\\\\\\"}"\n    if [[ "$value" == *[$\'\\001\'-$\'\\037\']* ]]; then\n        for ((code = 1; code < 32; code++)); do\n            printf -v escaped \'\\\\%03o\' "$code"\n            printf -v char \'%b\' "$escaped"\n            printf -v escaped \'\\\\u%04x\' "$code"\n            value="${value//"$char"/"$escaped"}"\n        done\n    fi\n    printf \'"%s"\' "$value"\n}\n\n# Summary metadata of one finding: the most severe advisory\'s fields, the\n# version that fixes every advisory (see finalize_advisories) and, with\n# --go-reachability, whether the code calls it.\nexport_metadata() {\n    local eco="$1" pkg="$2" file="$3"\n    local key="${eco}:${pkg}"\n    severity="${VULN_METADATA_SEVERITY[$key]:-}"\n    ghsa="${VULN_METADATA_GHSA[$key]:-}"\n    cve="${VULN_METADATA_CVE[$key]:-}"\n    source="${VULN_METADATA_SOURCE[$key]:-}"\n    fixed_in="${VULN_METADATA_FIX[$key]:-}"\n    reachability_of "$file" "$key"\n    reachability="$REACHABILITY"\n}\n\n# The report is written even when nothing is vulnerable, so a CI job never\n# picks up a stale report from an earlier run.\nexport_vulnerabilities_json() {\n    local output_file="${1:-vulnerabilities.json}"\n    local vuln file eco pkg severity ghsa cve source fixed_in reachability field first=true\n    local advisories advisory a_first a_sev a_ghsa a_cve a_source a_fix a_id\n    local -A unique=()\n    {\n        printf \'{\\n  "vulnerabilities": [\'\n        for vuln in "${VULNERABLE_PACKAGES[@]}"; do\n            IFS=\'|\' read -r file eco pkg <<< "$vuln"\n            unique["${eco}:${pkg}"]=1\n            if [ "$first" = true ]; then first=false; printf \'\\n\'; else printf \',\\n\'; fi\n            export_metadata "$eco" "$pkg" "$file"\n            printf \'    {"package": \'; json_print_string "$pkg"\n            printf \', "name": \'; json_print_string "${pkg%@*}"\n            printf \', "version": \'; json_print_string "${pkg##*@}"\n            printf \', "file": \'; json_print_string "$file"\n            printf \', "ecosystem": \'; json_print_string "$eco"\n            for field in severity ghsa cve source fixed_in reachability; do\n                if [ -n "${!field}" ]; then\n                    printf \', "%s": \' "$field"\n                    json_print_string "${!field}"\n                fi\n            done\n            printf \', "advisories": [\'\n            advisories="${VULN_ADVISORIES[$eco:$pkg]:-}"\n            a_first=true\n            while [ -n "$advisories" ]; do\n                advisory="${advisories%%||*}"\n                if [ "$advisory" = "$advisories" ]; then advisories=""; else advisories="${advisories#*||}"; fi\n                IFS=\';\' read -r a_sev a_ghsa a_cve a_source a_fix a_id <<< "$advisory"\n                [ -n "$a_sev$a_ghsa$a_cve$a_source$a_fix$a_id" ] || continue\n                if [ "$a_first" = true ]; then a_first=false; else printf \', \'; fi\n                printf \'{"severity": \'; json_print_string "$a_sev"\n                printf \', "ghsa": \'; json_print_string "$a_ghsa"\n                printf \', "cve": \'; json_print_string "$a_cve"\n                printf \', "id": \'; json_print_string "$a_id"\n                printf \', "source": \'; json_print_string "$a_source"\n                printf \', "fix": \'; json_print_string "$a_fix"\n                printf \'}\'\n            done\n            printf \']}\'\n        done\n        [ "$first" = true ] || printf \'\\n  \'\n        printf \'],\\n  "summary": {\\n\'\n        printf \'    "total_unique_vulnerabilities": %s,\\n\' "${#unique[@]}"\n        printf \'    "total_occurrences": %s\\n\' "${#VULNERABLE_PACKAGES[@]}"\n        printf \'  }\\n}\\n\'\n    } > "$output_file" || return 1\n    echo -e "${GREEN}\u2713 JSON report exported to: $output_file${NC}"\n}\n\n# Quote one CSV cell. A cell starting with = + - @ (or a tab/CR) is a formula\n# in spreadsheet applications: prefix it with an apostrophe.\ncsv_cell() {\n    local value="$1"\n    case "$value" in\n        [=+@-]*|$\'\\t\'*|$\'\\r\'*) value="\'$value" ;;\n    esac\n    printf \'"%s"\' "${value//\\"/\\"\\"}"\n}\n\nexport_vulnerabilities_csv() {\n    local output_file="${1:-vulnerabilities.csv}"\n    local vuln file eco pkg severity ghsa cve source fixed_in reachability value first\n    {\n        printf \'package,file,severity,ghsa,cve,source,ecosystem,version,fix,reachability\\n\'\n        for vuln in "${VULNERABLE_PACKAGES[@]}"; do\n            IFS=\'|\' read -r file eco pkg <<< "$vuln"\n            export_metadata "$eco" "$pkg" "$file"\n            first=true\n            for value in "$pkg" "$file" "$severity" "$ghsa" "$cve" "$source" "$eco" "${pkg##*@}" "$fixed_in" "$reachability"; do\n                if [ "$first" = true ]; then first=false; else printf \',\'; fi\n                csv_cell "$value"\n            done\n            printf \'\\n\'\n        done\n    } > "$output_file" || return 1\n    echo -e "${GREEN}\u2713 CSV report exported to: $output_file${NC}"\n}\n# ============================================================================\n# Vulnerability Feed Generation Functions\n# ============================================================================\n#\n# Feeds are generated from two upstream sources, both using the OSV schema:\n#   - GHSA:  a single sparse clone of github/advisory-database, scanned once,\n#            emitting PURL lines for every supported ecosystem at once.\n#   - OSV:   one all.zip per ecosystem from the OSV GCS bucket.\n#   - Runtime: the Node.js / PHP advisories of the OSV "Bitnami" ecosystem\n#            (fetch_runtime), checked against the runtime a project targets.\n#\n# jq is REQUIRED here (fetch path only); the scan path stays jq-free.\n#\n# FEED_ECOSYSTEM_MAP is the single source of truth mapping:\n#   purl-type | OSV/GHSA ecosystem string | OSV zip directory (URL-encoded)\n#\n# The "ecosystem string" is matched against .affected[].package.ecosystem in the\n# advisory JSON; the "zip directory" is the path segment used to fetch\n# https://osv-vulnerabilities.storage.googleapis.com/<dir>/all.zip .\n#\n# Empirically verified (HEAD requests to the OSV bucket + ecosystems.txt index +\n# real advisory JSON): all 12 directories return 200 and the ecosystem strings\n# below match the upstream data exactly (notably "SwiftURL" and "GitHub Actions").\n# ============================================================================\nFEED_ECOSYSTEM_MAP=(\n    "npm|npm|npm"\n    "pypi|PyPI|PyPI"\n    "golang|Go|Go"\n    "maven|Maven|Maven"\n    "cargo|crates.io|crates.io"\n    "gem|RubyGems|RubyGems"\n    "composer|Packagist|Packagist"\n    "nuget|NuGet|NuGet"\n    "pub|Pub|Pub"\n    "hex|Hex|Hex"\n    "swift|SwiftURL|SwiftURL"\n    "githubactions|GitHub Actions|GitHub%20Actions"\n)\n\n# Space-separated list of every supported purl type, in table order.\nfeed_all_types() {\n    local entry types=""\n    for entry in "${FEED_ECOSYSTEM_MAP[@]}"; do\n        types="${types:+$types }${entry%%|*}"\n    done\n    printf \'%s\' "$types"\n}\n\n# Print the OSV/GHSA ecosystem string for a purl type (empty if unsupported).\nfeed_eco_string() {\n    local type="$1" entry t eco dir\n    for entry in "${FEED_ECOSYSTEM_MAP[@]}"; do\n        IFS=\'|\' read -r t eco dir <<< "$entry"\n        if [ "$t" = "$type" ]; then printf \'%s\' "$eco"; return 0; fi\n    done\n    return 0\n}\n\n# Print the OSV zip directory (URL-encoded) for a purl type.\nfeed_osv_dir() {\n    local type="$1" entry t eco dir\n    for entry in "${FEED_ECOSYSTEM_MAP[@]}"; do\n        IFS=\'|\' read -r t eco dir <<< "$entry"\n        if [ "$t" = "$type" ]; then printf \'%s\' "$dir"; return 0; fi\n    done\n    return 0\n}\n\n# Build a JSON object mapping {ecosystem-string: purl-type} for the given purl\n# types, consumed by the shared jq program via --argjson. Ecosystem strings are\n# simple ASCII (no quotes/backslashes) so hand-building the JSON is safe.\nfeed_build_ecomap() {\n    local out="{" first=1 t eco\n    for t in "$@"; do\n        [ -z "$t" ] && continue\n        eco=$(feed_eco_string "$t")\n        [ -z "$eco" ] && continue\n        [ "$first" -eq 0 ] && out="$out,"\n        out="$out\\"$eco\\":\\"$t\\""\n        first=0\n    done\n    printf \'%s}\' "$out"\n}\n\n# Shared jq program. Emits one PURL line per affected package/range for every\n# ecosystem present in $ecomap. Reproduces the legacy npm emission byte-for-byte\n# (npm\'s transform is identity and $ecomap={"npm":"npm"} matches the old filter),\n# while adding per-type name canonicalization that MUST match canon_purl_name in\n# the scan-side parser (src/31-parsers-purl.sh):\n#   pypi           -> lowercase, collapse runs of [-_.] to a single \'-\'\n#   maven          -> groupId:artifactId emitted as groupId/artifactId\n#   composer/nuget -> lowercase\n#   githubactions  -> strip any scheme and "github.com/", lowercase\n#   swift          -> strip any scheme, trailing "/" and ".git", lowercase\n#   npm/golang/cargo/gem/pub/hex -> name as-is\n# $source is "ghsa" or "osv" (the source= param). Severity: the advisory\'s own\n# (GHSA database_specific), else the CVSS 3.x base score computed from the\n# first CVSS_V3 vector, MAL- (malicious package) advisories being critical.\n# shellcheck disable=SC2089,SC2090 # a jq program, passed through the environment\nFEED_JQ_PROGRAM=\'\ndef emit_name($type; $name):\n    if $type == "pypi" then ($name | ascii_downcase | gsub("[-_.]+"; "-"))\n    elif $type == "maven" then ($name | gsub(":"; "/"))\n    elif ($type == "composer" or $type == "nuget") then ($name | ascii_downcase)\n    elif $type == "githubactions" then ($name | sub("^[A-Za-z][A-Za-z0-9+.-]*://"; "") | sub("^github\\\\.com/"; "") | sub("/+$"; "") | ascii_downcase)\n    elif $type == "swift" then ($name | sub("^[A-Za-z][A-Za-z0-9+.-]*://"; "") | sub("/+$"; "") | sub("\\\\.git$"; "") | ascii_downcase)\n    else $name end;\n\n# CVSS 3.x base score of a vector ("CVSS:3.1/AV:N/AC:L/..."), null when the\n# vector is not a complete 3.x one. Roundup as defined by CVSS 3.1.\ndef roundup: ((. * 100000) | round) as $i\n    | if ($i % 10000) == 0 then $i / 100000 else (($i / 10000 | floor) + 1) / 10 end;\ndef cvss3_score:\n    if (type == "string" and test("^CVSS:3\\\\.[01]/")) then\n        # A missing metric reads as "" so the lookups give null, never an error.\n        ((split("/")[1:] | map(split(":") | {(.[0]): (.[1] // "")}) | add) // {}) as $m\n        | ({"U": false, "C": true}[$m.S // ""]) as $changed\n        | ({"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.2}[$m.AV // ""]) as $av\n        | ({"L": 0.77, "H": 0.44}[$m.AC // ""]) as $ac\n        | (if $changed then {"N": 0.85, "L": 0.68, "H": 0.5} else {"N": 0.85, "L": 0.62, "H": 0.27} end)[$m.PR // ""] as $pr\n        | ({"N": 0.85, "R": 0.62}[$m.UI // ""]) as $ui\n        | ([$m.C, $m.I, $m.A] | map({"H": 0.56, "L": 0.22, "N": 0}[. // ""])) as $cia\n        | if ([$av, $ac, $pr, $ui, $changed] + $cia | any(. == null)) then null else\n            (1 - ((1 - $cia[0]) * (1 - $cia[1]) * (1 - $cia[2]))) as $iss\n            | (if $changed then 7.52 * ($iss - 0.029) - 3.25 * pow($iss - 0.02; 15) else 6.42 * $iss end) as $impact\n            | (8.22 * $av * $ac * $pr * $ui) as $exploit\n            | if $impact <= 0 then 0\n              elif $changed then ([1.08 * ($impact + $exploit), 10] | min | roundup)\n              else ([$impact + $exploit, 10] | min | roundup) end\n          end\n    elif (type == "string" and test("^[0-9]+(\\\\.[0-9]+)?$")) then tonumber\n    else null end;\ndef score_severity:\n    if . >= 9.0 then "CRITICAL"\n    elif . >= 7.0 then "HIGH"\n    elif . >= 4.0 then "MODERATE"\n    elif . > 0 then "LOW"\n    else null end;\n\n# Every field is read through a type guard: one malformed value must not\n# make jq fail, which would drop every package of the advisory file.\nselect(type == "object" and .withdrawn == null) |\n(.id | strings // "") as $id |\n(if ($id | startswith("MAL-")) then "CRITICAL"\n else ((.database_specific | objects | .severity | strings) //\n       first(.severity[]? | objects | select(.type == "CVSS_V3") | .score | cvss3_score | numbers | score_severity | strings) //\n       "UNKNOWN") end) as $severity |\n\n[.aliases[]? | strings] as $aliases |\n# The GHSA id is the advisory id itself (GHSA feed, and OSV copies of GHSA\n# advisories) or else a GHSA alias. Any other non-CVE id (PYSEC-, GO-,\n# RUSTSEC-, MAL-, ...) is kept as id=.\n(if ($id | startswith("GHSA-")) then $id\n else ($aliases | map(select(startswith("GHSA-"))) | .[0] // "") end) as $ghsa |\n(if ($id | startswith("CVE-")) then $id\n else ($aliases | map(select(startswith("CVE-"))) | .[0] // "") end) as $cve |\n(if ($id | startswith("GHSA-") or startswith("CVE-")) then "" else $id end) as $other_id |\n([\n    ("severity=" + ($severity | ascii_downcase)),\n    (if $ghsa != "" then "ghsa=" + $ghsa else empty end),\n    (if $cve != "" then "cve=" + $cve else empty end),\n    (if $other_id != "" then "id=" + $other_id else empty end),\n    ("source=" + $source)\n] | join("&")) as $params |\n\n.affected[]? | objects |\n((.package | objects | .ecosystem | strings) // "") as $e |\n($ecomap[$e] // "") as $type |\nselect($type != "") |\n((.package.name | strings) // "") as $name |\nselect($name != "") |\n# RustSec informational notices "unmaintained" and "notice" are warnings\n# about a crate, not vulnerabilities of its versions (cargo audit reports them\n# apart): listing them would flag every version as vulnerable. "unsound"\n# notices describe a defect of specific versions and are kept.\nselect(((.database_specific | objects | .informational) // null) as $info\n       | $info == null or $info == "unsound") |\n(emit_name($type; $name)) as $pkg |\n# GHSA records the upper bound of an interval with no known fix here\n# ("< 3.0.0", "<= 2.26.11"): it bounds the open interval, but is no fix.\n((.database_specific | objects | .last_known_affected_version_range | strings) // "" | gsub(" "; "")\n | if test("^<=?[0-9A-Za-z]") then . else "" end) as $last_known |\n# Ranges that define an interval (a range with only "limit" events does not).\n[.ranges[]? | objects | select(.type == "SEMVER" or .type == "ECOSYSTEM")\n | select([.events[]? | objects | select(.introduced or .fixed or .last_affected)] | length > 0)] as $ranges |\n(\n    ($ranges[] |\n        [.events[]? | objects] |\n        ([.[] | select(.limit) | .limit | strings] | if length == 0 then ["*"] else . end) as $limits |\n        map(select(.introduced or .fixed or .last_affected)) |\n        if length > 0 then\n            reduce .[] as $event (\n                {current: {}, intervals: []};\n                if $event.introduced then\n                    # A second "introduced" inside an open interval changes\n                    # nothing: the versions since the first one stay affected.\n                    if .current.introduced then . else .current = {introduced: $event.introduced} end\n                elif $event.fixed then\n                    .intervals += [(.current + {fixed: $event.fixed})] |\n                    .current = {}\n                elif $event.last_affected then\n                    .intervals += [(.current + {last_affected: $event.last_affected})] |\n                    .current = {}\n                else . end\n            ) |\n            (.intervals + (if .current.introduced then [.current] else [] end))[] |\n            . as $interval |\n            ($interval.fixed == null and $interval.last_affected == null and $last_known != "") as $bounded |\n            ([\n                (if .introduced then ">=" + .introduced else empty end),\n                (if .fixed then "<" + .fixed else empty end),\n                (if .last_affected then "<=" + .last_affected else empty end),\n                (if $bounded then $last_known else empty end)\n            ] | join(" ")) as $bounds |\n            $limits[] as $limit |\n            (if $limit == "*" then "" else " <" + $limit end) as $cap |\n            # A limit or a last-known bound is an applicability boundary, not a\n            # known patched version.\n            (if ($limit != "*" or $bounded) and ($interval.fixed == null) then "&fixed=" else "" end) as $fix_override |\n            "pkg:\\($type)/\\($pkg)@\\($bounds)\\($cap)?\\($params)\\($fix_override)"\n        else empty end\n    ),\n    # Exact versions only for entries without a SEMVER/ECOSYSTEM interval (e.g.\n    # MAL advisories, or ranges with only "limit" events): OSV enumerates every\n    # version a range covers, so emitting them alongside ranges is redundant and\n    # pushes feeds past the GitHub 100 MB file limit.\n    (if ($ranges | length) == 0 then\n        .versions[]? | strings | select(. != "") |\n        "pkg:\\($type)/\\($pkg)@\\(.)?\\($params)"\n    else empty end)\n)\'\n\n# Run FEED_JQ_PROGRAM over every *.json file under an input directory, in\n# parallel, and append the raw (unsorted) PURL lines to a combined file.\n#   $1 input dir   $2 source ("ghsa"|"osv")   $3 ecomap JSON   $4 combined out\n#\n# Robustness: 8 parallel workers each write to their OWN temp file \u2014 never a\n# shared pipe \u2014 because concurrent jq processes writing to one pipe interleave\n# non-atomically and tear PURL lines (observed frequently under load). Each\n# worker runs jq once per batch of 400 files (one process start instead of\n# 400); a batch that jq cannot process is redone file by file, so a malformed\n# advisory is isolated: it is skipped and counted (its partial output\n# discarded) instead of failing the whole ecosystem. A failed write, a failed\n# worker, no input file, or every file failing prevents replacement of the\n# existing feed. Callers sort/split the combined file (LC_ALL=C for locale\n# stability).\nfeed_emit_raw() {\n    local in_dir="$1" src="$2" ecomap="$3" combined="$4"\n    [ -d "$in_dir" ] && command -v jq >/dev/null 2>&1 || return 1\n    local parts_dir total skipped\n    total=$(find "$in_dir" -name "*.json" -type f | wc -l | tr -d \' \')\n    if [ "$total" -eq 0 ]; then\n        echo "Error: no advisory file found in $in_dir; previous output preserved" >&2\n        return 1\n    fi\n    parts_dir=$(mktemp -d) || return 1\n    # shellcheck disable=SC2090\n    export FEED_JQ_PROGRAM\n    if ! (set -o pipefail; find "$in_dir" -name "*.json" -type f -print0 | \\\n        FEED_SRC="$src" FEED_ECOMAP="$ecomap" PARTS_DIR="$parts_dir" \\\n        xargs -0 -P 8 -n 400 sh -c \'\n            out=$(mktemp "$PARTS_DIR/part.XXXXXX") || exit 1\n            bad=$(mktemp "$PARTS_DIR/bad.XXXXXX") || exit 1\n            emit() { jq -r --arg source "$FEED_SRC" --argjson ecomap "$FEED_ECOMAP" "$FEED_JQ_PROGRAM" "$@" 2>/dev/null; }\n            if ! emit "$@" > "$out"; then\n                : > "$out" || exit 1\n                for f in "$@"; do\n                    if lines=$(emit "$f"); then\n                        if [ -n "$lines" ]; then printf "%s\\n" "$lines" >> "$out" || exit 1; fi\n                    else\n                        printf "%s\\n" "$f" >> "$bad" || exit 1\n                    fi\n                done\n            fi\n        \' _); then\n        echo "Error: Failed to generate feed; previous output preserved" >&2\n        rm -rf "$parts_dir"\n        return 1\n    fi\n    skipped=$(cat "$parts_dir"/bad.* 2>/dev/null | wc -l | tr -d \' \')\n    if [ "$skipped" -gt 0 ]; then\n        echo "\u26A0\uFE0F  Skipped $skipped of $total advisory file(s) that jq could not process" >&2\n        if [ "$skipped" -ge "$total" ]; then\n            echo "Error: no advisory could be processed; previous output preserved" >&2\n            rm -rf "$parts_dir"\n            return 1\n        fi\n    fi\n    if ! cat "$parts_dir"/part.* > "$combined"; then\n        echo "Error: unable to write $combined; previous output preserved" >&2\n        rm -rf "$parts_dir"\n        return 1\n    fi\n    rm -rf "$parts_dir"\n}\n\n# Replace a feed file with a staged one, atomically, only when the staged file\n# has content: an empty result means a broken download or parse, not a feed\n# with no advisory. Feed files are world-readable like committed ones (mktemp\n# creates them 0600). Returns non-zero when the previous file was kept.\nfeed_install() {\n    local staged="$1" out_file="$2"\n    if [ ! -s "$staged" ]; then\n        echo "\u26A0\uFE0F  No entry generated for ${out_file##*/}; previous file preserved" >&2\n        rm -f "$staged"\n        return 1\n    fi\n    chmod 644 "$staged" && mv "$staged" "$out_file" && return 0\n    rm -f "$staged"\n    return 1\n}\n\n# Purl types requested on the command line (--fetch-ghsa / --fetch-osv):\n# lockfile aliases (go, rust, python...) map to their purl type. Sets\n# FEED_TYPES; returns non-zero, after an error message, when a token is not\n# a supported ecosystem.\nfeed_resolve_types() {\n    FEED_TYPES=()\n    local token type\n    for token in "$@"; do\n        [ -n "$token" ] || continue\n        type=$(ecosystem_alias_to_purl "$token")\n        if [ -z "$(feed_eco_string "$type")" ]; then\n            echo "Error: unknown ecosystem \'$token\' (supported: $(feed_all_types))" >&2\n            return 1\n        fi\n        case " ${FEED_TYPES[*]} " in *" $type "*) ;; *) FEED_TYPES+=("$type") ;; esac\n    done\n}\n\n# Create (if needed) and print the absolute feed output directory.\nfeed_output_dir() {\n    local dir="${FEED_OUTPUT_DIR:-data}"\n    mkdir -p "$dir" && (cd "$dir" && pwd)\n}\n\n# Fetch GitHub Security Advisory data for the requested ecosystems.\n# Usage: fetch_ghsa [purl-type ...]   (default: all supported types)\n# Writes data/ghsa.purl (npm, legacy name) and data/ghsa-<type>.purl (others)\n# into ${FEED_OUTPUT_DIR:-data}. Performs a SINGLE sparse clone and a SINGLE\n# parallel jq pass over the advisory files, then splits the combined output by\n# pkg:<type>/ prefix \u2014 never cloning or scanning per ecosystem.\nfetch_ghsa() {\n    command -v jq >/dev/null 2>&1 || { echo "Error: jq is required to generate feeds" >&2; return 1; }\n    local -a types=("$@")\n    if [ "${#types[@]}" -eq 0 ]; then\n        read -ra types <<< "$(feed_all_types)"\n    fi\n\n    feed_resolve_types "${types[@]}" || return 1\n    local -a valid_types=("${FEED_TYPES[@]}")\n    if [ "${#valid_types[@]}" -eq 0 ]; then\n        echo "Error: no ecosystem to fetch" >&2\n        return 1\n    fi\n\n    local out_dir\n    out_dir=$(feed_output_dir) || { echo "Error: unable to create the feed directory" >&2; return 1; }\n\n    local ecomap t\n    ecomap=$(feed_build_ecomap "${valid_types[@]}")\n\n    local ghsa_tmp\n    ghsa_tmp=$(mktemp -d) || return 1\n    register_temp_dir "$ghsa_tmp"\n    local GHSA_REPO="https://github.com/github/advisory-database.git"\n    local CLONE_DIR="$ghsa_tmp/advisory-database"\n\n    echo "Cloning GitHub Advisory Database (all reviewed advisories)..." >&2\n\n    # Shallow clone with sparse checkout for all reviewed advisories\n    if ! git clone --filter=blob:none --no-checkout --depth 1 "$GHSA_REPO" "$CLONE_DIR" > "$ghsa_tmp/clone.log" 2>&1 || ! (\n        cd "$CLONE_DIR" || exit 1\n        git sparse-checkout init --cone &&\n        git sparse-checkout set advisories/github-reviewed &&\n        git checkout\n    ) > "$ghsa_tmp/checkout.log" 2>&1; then\n        echo "Error: Failed to fetch GHSA database; previous feeds preserved" >&2\n        rm -rf "$ghsa_tmp"\n        return 1\n    fi\n\n    echo "Processing GHSA advisories for: ${valid_types[*]}" >&2\n\n    local file_count\n    file_count=$(find "$CLONE_DIR/advisories/github-reviewed" -name "*.json" -type f | wc -l | tr -d \' \')\n    echo "Found $file_count advisory files" >&2\n    echo "Using parallel processing (single pass, all ecosystems)..." >&2\n\n    # SINGLE parallel jq pass emitting PURLs for every requested ecosystem.\n    local combined="$ghsa_tmp/combined.purl"\n    if ! feed_emit_raw "$CLONE_DIR/advisories/github-reviewed" "ghsa" "$ecomap" "$combined"; then\n        rm -rf "$ghsa_tmp"\n        return 1\n    fi\n\n    # Split combined output by pkg:<type>/ prefix into per-ecosystem files.\n    local base out_file line_count staged failed=0\n    for t in "${valid_types[@]}"; do\n        base=$(default_feed_filename "ghsa" "$t")\n        out_file="$out_dir/$base"\n        # LC_ALL=C: deterministic byte-order sort, reproducible across locales\n        # (matches the CI runner and keeps committed feed diffs to real churn).\n        if ! staged=$(mktemp "$out_file.tmp.XXXXXX"); then\n            failed=1\n            continue\n        fi\n        if ! { grep "^pkg:$t/" "$combined" || true; } | LC_ALL=C sort -u > "$staged" ||\n            ! feed_install "$staged" "$out_file"; then\n            rm -f "$staged"\n            failed=1\n            continue\n        fi\n        line_count=$(wc -l < "$out_file" | tr -d \' \')\n        echo "  \u2192 $base: $line_count entries" >&2\n    done\n\n    rm -rf "$ghsa_tmp"\n    echo "GHSA processing complete" >&2\n    return "$failed"\n}\n\n# Fetch OSV vulnerability data for the requested ecosystems.\n# Usage: fetch_osv [purl-type ...]   (default: all supported types)\n# Writes data/osv.purl (npm, legacy name) and data/osv-<type>.purl (others)\n# into ${FEED_OUTPUT_DIR:-data}. Downloads one all.zip per ecosystem and reuses\n# the shared jq emission via the existing xargs -P 8 parallel pattern.\nfetch_osv() {\n    command -v jq >/dev/null 2>&1 || { echo "Error: jq is required to generate feeds" >&2; return 1; }\n    local failed=0\n    local -a types=("$@")\n    if [ "${#types[@]}" -eq 0 ]; then\n        read -ra types <<< "$(feed_all_types)"\n    fi\n\n    feed_resolve_types "${types[@]}" || return 1\n    types=("${FEED_TYPES[@]}")\n    if [ "${#types[@]}" -eq 0 ]; then\n        echo "Error: no ecosystem to fetch" >&2\n        return 1\n    fi\n\n    local out_dir\n    out_dir=$(feed_output_dir) || { echo "Error: unable to create the feed directory" >&2; return 1; }\n\n    local t eco_string osv_dir ecomap zip_file eco_tmp out_file base file_count line_count\n    for t in "${types[@]}"; do\n        eco_string=$(feed_eco_string "$t")\n        osv_dir=$(feed_osv_dir "$t")\n        ecomap=$(feed_build_ecomap "$t")\n        base=$(default_feed_filename "osv" "$t")\n        out_file="$out_dir/$base"\n\n        if ! eco_tmp=$(mktemp -d); then\n            failed=1\n            continue\n        fi\n        register_temp_dir "$eco_tmp"\n        zip_file="$eco_tmp/all.zip"\n\n        echo "Fetching OSV $eco_string vulnerabilities..." >&2\n        if ! curl -fsSL --connect-timeout 10 --max-time 300 "https://osv-vulnerabilities.storage.googleapis.com/${osv_dir}/all.zip" -o "$zip_file"; then\n            echo "\u26A0\uFE0F  Failed to download OSV feed for $t; skipping" >&2\n            rm -rf "$eco_tmp"\n            failed=1\n            continue\n        fi\n\n        echo "Extracting $eco_string vulnerabilities..." >&2\n        if ! unzip -q "$zip_file" -d "$eco_tmp" 2>/dev/null; then\n            echo "\u26A0\uFE0F  Failed to extract OSV feed for $t; skipping" >&2\n            rm -rf "$eco_tmp"\n            failed=1\n            continue\n        fi\n\n        file_count=$(find "$eco_tmp" -name "*.json" -type f | wc -l | tr -d \' \')\n        echo "Processing $file_count $eco_string files (parallel)..." >&2\n\n        # Robust parallel emission, then deterministic C-locale sort/dedupe.\n        local combined="$eco_tmp/combined.purl"\n        local staged\n        if ! feed_emit_raw "$eco_tmp" "osv" "$ecomap" "$combined"; then\n            rm -rf "$eco_tmp"\n            failed=1\n            continue\n        fi\n        if ! staged=$(mktemp "$out_file.tmp.XXXXXX"); then\n            rm -rf "$eco_tmp"\n            failed=1\n            continue\n        fi\n        if ! LC_ALL=C sort -u "$combined" > "$staged" || ! feed_install "$staged" "$out_file"; then\n            rm -f "$staged"\n            rm -rf "$eco_tmp"\n            failed=1\n            continue\n        fi\n\n        line_count=$(wc -l < "$out_file" | tr -d \' \')\n        echo "  \u2192 $base: $line_count entries" >&2\n\n        rm -rf "$eco_tmp"\n    done\n\n    echo "OSV processing complete" >&2\n    return "$failed"\n}\n\n# Runtimes whose own advisories are tracked (purl type "runtime"). The names\n# are Bitnami package names; add one here to cover another runtime.\nRUNTIME_FEED_PACKAGES="node php"\n\n# Fetch runtime advisories (Node.js, PHP, ...) from the OSV Bitnami ecosystem,\n# which carries the upstream version ranges of each runtime CVE.\n# Writes ${FEED_OUTPUT_DIR:-data}/osv-runtime.purl (pkg:runtime/<name>@<range>).\n# Only BIT-<name>-<year>-* advisories are extracted: the BIT-<name>-min-*\n# copies describe the same CVEs for Bitnami\'s minimal images.\nfetch_runtime() {\n    command -v jq >/dev/null 2>&1 || { echo "Error: jq is required to generate feeds" >&2; return 1; }\n    local out_dir\n    out_dir=$(feed_output_dir) || { echo "Error: unable to create the feed directory" >&2; return 1; }\n\n    local out_file="$out_dir/osv-runtime.purl" tmp pkg names="" staged line_count\n    local -a patterns=()\n    for pkg in $RUNTIME_FEED_PACKAGES; do\n        patterns+=("BIT-$pkg-[0-9]*")\n        names="${names:+$names|}$pkg"\n    done\n    tmp=$(mktemp -d) || return 1\n    register_temp_dir "$tmp"\n\n    echo "Fetching OSV Bitnami runtime vulnerabilities ($RUNTIME_FEED_PACKAGES)..." >&2\n    if ! curl -fsSL --connect-timeout 10 --max-time 300 "https://osv-vulnerabilities.storage.googleapis.com/Bitnami/all.zip" -o "$tmp/all.zip"; then\n        echo "\u26A0\uFE0F  Failed to download the OSV Bitnami feed; previous runtime feed preserved" >&2\n        rm -rf "$tmp"\n        return 1\n    fi\n    mkdir "$tmp/advisories"\n    if ! unzip -q "$tmp/all.zip" "${patterns[@]}" -d "$tmp/advisories" 2>/dev/null; then\n        echo "\u26A0\uFE0F  Failed to extract the runtime advisories; previous runtime feed preserved" >&2\n        rm -rf "$tmp"\n        return 1\n    fi\n\n    if ! feed_emit_raw "$tmp/advisories" "osv" \'{"Bitnami":"runtime"}\' "$tmp/combined.purl"; then\n        rm -rf "$tmp"\n        return 1\n    fi\n    staged=$(mktemp "$out_file.tmp.XXXXXX") || { rm -rf "$tmp"; return 1; }\n    # Other Bitnami packages listed in the same advisories are dropped.\n    if ! { grep -E "^pkg:runtime/($names)@" "$tmp/combined.purl" || true; } | LC_ALL=C sort -u > "$staged" ||\n        ! feed_install "$staged" "$out_file"; then\n        echo "\u26A0\uFE0F  No runtime advisory could be generated; previous runtime feed preserved" >&2\n        rm -f "$staged"\n        rm -rf "$tmp"\n        return 1\n    fi\n    rm -rf "$tmp"\n    line_count=$(wc -l < "$out_file" | tr -d \' \')\n    echo "  \u2192 osv-runtime.purl: $line_count entries" >&2\n}\n\n# Main orchestration function to fetch all PURL vulnerability feeds\n# (GHSA + OSV) for every supported ecosystem.\nfetch_all() {\n    local output_dir="${1:-data}"\n\n    echo "========================================="\n    echo "Vulnerability PURL Feed Generator"\n    echo "========================================="\n    echo ""\n\n    mkdir -p "$output_dir" || return 1\n\n    export FEED_OUTPUT_DIR="$output_dir"\n\n    # An OSV failure must not prevent the GHSA feeds: run both, report both.\n    local status=0\n\n    # Generate OSV feeds (one zip per ecosystem)\n    echo "Generating OSV feeds for all ecosystems..."\n    fetch_osv || status=1\n    echo ""\n\n    # Generate GHSA feeds (single clone, single pass, split per ecosystem)\n    echo "Generating GHSA feeds for all ecosystems..."\n    fetch_ghsa || status=1\n    echo ""\n\n    # Generate the runtime feed (Node.js, PHP: OSV Bitnami advisories)\n    echo "Generating the runtime feed..."\n    fetch_runtime || status=1\n    echo ""\n\n    unset FEED_OUTPUT_DIR\n\n    echo "========================================="\n    echo "Feed generation complete!"\n    echo "========================================="\n    echo "Per-ecosystem totals:"\n    local f count total=0\n    for f in "$output_dir"/*.purl; do\n        [ -e "$f" ] || continue\n        count=$(wc -l < "$f" | tr -d \' \')\n        total=$((total + count))\n        printf \'  - %-24s %s\\n\' "$(basename "$f")" "$count"\n    done\n    echo "  ---------------------------------------"\n    printf \'  - %-24s %s\\n\' "TOTAL" "$total"\n    echo ""\n    [ "$status" -eq 0 ] || echo "\u26A0\uFE0F  Some feeds could not be generated; previous files were kept" >&2\n    return "$status"\n}\n\n# find_default_source runs in command substitutions: resolve the installation\n# paths it probes once, in the calling shell, so they are not recomputed\n# (brew --prefix) for every feed. Only needed when a built-in feed is loaded.\nprepare_default_source_lookup() {\n    resolve_script_home\n    [ -d "$SCRIPT_HOME/data" ] || resolve_brew_prefix\n}\n\n# Find default source file with fallback logic. Tries, in order:\n# 1. the data/ directory next to this script (symlinks resolved: a git\n#    checkout, a release, Homebrew or Docker through their symlinks)\n# 2. the Homebrew installation path\n# 3. the Docker /app/data/ directory\n# 4. the remote GitHub URL\n# 5. ./data/ in the current directory, only when nothing else is reachable\n#    (offline piped run), with a warning\n# The scanned project is usually the current directory: its own data/ must\n# never replace the built-in feeds while those can be reached.\n# Returns path/URL if found, empty string if not found\nfind_default_source() {\n    local source_file="$1"  # e.g., "ghsa.purl" or "osv.purl"\n\n    resolve_script_home\n    if [ -n "$SCRIPT_HOME" ] && [ -f "$SCRIPT_HOME/data/$source_file" ]; then\n        echo "$SCRIPT_HOME/data/$source_file"\n        return 0\n    fi\n\n    resolve_brew_prefix\n    if [ -n "$BREW_PREFIX" ] && [ -f "$BREW_PREFIX/share/package-checker/data/$source_file" ]; then\n        echo "$BREW_PREFIX/share/package-checker/data/$source_file"\n        return 0\n    fi\n\n    # Try Docker /app/data/ directory\n    if [ -f "/app/data/$source_file" ]; then\n        echo "/app/data/$source_file"\n        return 0\n    fi\n\n    local github_url="https://raw.githubusercontent.com/maxgfr/package-checker.sh/refs/heads/main/data/$source_file"\n    if curl --output /dev/null --silent --head --fail --connect-timeout 10 --max-time 30 "$github_url" 2>/dev/null; then\n        echo "$github_url"\n        return 0\n    fi\n\n    if [ -f "./data/$source_file" ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  Warning: built-in feeds unreachable; using ./data/$source_file from the current directory${NC}" >&2\n        echo "./data/$source_file"\n        return 0\n    fi\n\n    # Nothing found\n    echo ""\n    return 1\n}\n\n# Main execution\n# ============================================================================\n# Per-ecosystem remediation snippets for GitHub issue bodies.\n#\n# The GitHub issue builders in src/90-main.sh used to hardcode npm remediation\n# (`npm update` / `npm audit`). These helpers make the "how do I fix this"\n# guidance ecosystem-aware so a Cargo, Go, PyPI, \u2026 finding gets the command a\n# developer on THAT stack would actually run. npm keeps its historical\n# update/audit guidance so npm-only issues read essentially as before.\n# ============================================================================\n\n# Emit the shell/command lines that fix a vulnerable package, for one ecosystem.\n# Args:\n#   $1 eco     purl type (npm, cargo, golang, pypi, gem, composer, maven,\n#              nuget, pub, hex, swift, githubactions, runtime)\n#   $2 pkg     package name (or a placeholder like "<package-name>" for the\n#              consolidated issue, which is not per-package)\n#   $3 indent  optional prefix prepended to every line (e.g. "   " to sit inside\n#              a numbered-list code fence). Defaults to no indentation.\n# The output is the BODY of a ```bash block; the caller supplies the fence.\nfix_commands_for_eco() {\n    local eco="$1" pkg="$2" ind="${3:-}"\n    case "$eco" in\n        npm)\n            printf \'%snpm update %s\\n\' "$ind" "$pkg"\n            printf \'%s# or yarn upgrade %s\\n\' "$ind" "$pkg"\n            printf \'%s# or pnpm update %s\\n\' "$ind" "$pkg"\n            printf \'%s# auto-fix all advisories: npm audit fix\\n\' "$ind"\n            ;;\n        cargo)\n            printf \'%scargo update -p %s\\n\' "$ind" "$pkg"\n            ;;\n        golang)\n            printf \'%sgo get %s@latest && go mod tidy\\n\' "$ind" "$pkg"\n            ;;\n        pypi)\n            printf \'%spip install --upgrade %s\\n\' "$ind" "$pkg"\n            printf \'%s# or with Poetry: poetry update %s\\n\' "$ind" "$pkg"\n            printf \'%s# or with uv:     uv lock --upgrade-package %s\\n\' "$ind" "$pkg"\n            ;;\n        gem)\n            printf \'%sbundle update %s\\n\' "$ind" "$pkg"\n            ;;\n        composer)\n            printf \'%scomposer update %s\\n\' "$ind" "$pkg"\n            ;;\n        maven)\n            printf \'%s# Bump %s to the patched version in pom.xml (or build.gradle).\\n\' "$ind" "$pkg"\n            printf \'%s# For Gradle lockfiles, refresh them: ./gradlew dependencies --write-locks\\n\' "$ind"\n            ;;\n        nuget)\n            printf \'%sdotnet add package %s\\n\' "$ind" "$pkg"\n            ;;\n        pub)\n            printf \'%sdart pub upgrade %s\\n\' "$ind" "$pkg"\n            ;;\n        hex)\n            printf \'%smix deps.update %s\\n\' "$ind" "$pkg"\n            ;;\n        swift)\n            # SwiftPM takes the package identity (the last URL component),\n            # not the repository URL the findings are keyed by.\n            printf \'%sswift package update %s\\n\' "$ind" "${pkg##*/}"\n            ;;\n        githubactions)\n            printf \'%s# Bump the `uses:` ref to the patched tag, e.g. %s@<patched-tag>\\n\' "$ind" "$pkg"\n            ;;\n        runtime)\n            printf \'%s# Upgrade the %s runtime to the fixed version (or later): update\\n\' "$ind" "$pkg"\n            printf \'%s# .nvmrc / .node-version / .php-version / .tool-versions, the Docker\\n\' "$ind"\n            printf \'%s# base image tag, and composer.json config.platform.php.\\n\' "$ind"\n            ;;\n        *)\n            printf \'%s# Update %s to the latest patched version.\\n\' "$ind" "$pkg"\n            ;;\n    esac\n}\n\n# Emit the one-line command that re-verifies an ecosystem after updating, used\n# as inline code in the issue "Run a security audit" step. Ecosystems without a\n# ubiquitous audit tool return a short guidance comment instead.\nverify_command_for_eco() {\n    case "$1" in\n        npm)           echo "npm audit" ;;\n        cargo)         echo "cargo audit" ;;\n        golang)        echo "govulncheck ./..." ;;\n        pypi)          echo "pip-audit" ;;\n        gem)           echo "bundle audit check --update  # needs bundler-audit: gem install bundler-audit" ;;\n        composer)      echo "composer audit" ;;\n        maven)         echo "# re-run your SCA scan (e.g. OWASP dependency-check, Trivy)" ;;\n        nuget)         echo "dotnet list package --vulnerable" ;;\n        pub)           echo "dart pub outdated" ;;\n        hex)           echo "mix deps.audit  # needs mix_audit; mix hex.audit only lists retired packages" ;;\n        swift)         echo "# re-resolve and re-scan Package.resolved" ;;\n        githubactions) echo "# re-run package-checker (or pin to the patched commit SHA)" ;;\n        runtime)       echo "node --version  # or php --version, then re-run package-checker" ;;\n        *)             echo "# re-run package-checker after updating" ;;\n    esac\n}\n\n# Human-readable ecosystem label for issue section headings.\neco_display_name() {\n    case "$1" in\n        npm)           echo "npm / Node.js" ;;\n        pypi)          echo "Python (pip / Poetry / uv)" ;;\n        golang)        echo "Go modules" ;;\n        maven)         echo "Maven / Gradle (JVM)" ;;\n        cargo)         echo "Rust (Cargo)" ;;\n        gem)           echo "Ruby (Bundler)" ;;\n        composer)      echo "PHP (Composer)" ;;\n        nuget)         echo "NuGet (.NET)" ;;\n        pub)           echo "Dart / Flutter (pub)" ;;\n        hex)           echo "Elixir (Hex)" ;;\n        swift)         echo "Swift (SwiftPM)" ;;\n        githubactions) echo "GitHub Actions" ;;\n        runtime)       echo "Runtime (Node.js / PHP)" ;;\n        *)             echo "$1" ;;\n    esac\n}\n# Validate a comma/space-separated ecosystems list (for --ecosystems). Every\n# token must be a known lockfile-type alias or a supported purl type.\nvalidate_ecosystems_list() {\n    local list="$1"\n    list="${list//,/ }"\n    local token\n    for token in $list; do\n        [ -z "$token" ] && continue\n        case " $KNOWN_LOCKFILE_ALIASES " in\n            *" $token "*) continue ;;\n        esac\n        case "$token" in\n            npm|pypi|golang|maven|cargo|gem|composer|nuget|pub|hex|swift|githubactions|runtime) continue ;;\n        esac\n        echo -e "${RED}\u274C Error: Unknown ecosystem \'$token\' in --ecosystems${NC}"\n        echo "Valid values: aliases (${KNOWN_LOCKFILE_ALIASES// /, }) or purl types (npm, pypi, golang, maven, cargo, gem, composer, nuget, pub, hex, swift, githubactions, runtime)"\n        return 1\n    done\n    return 0\n}\n\n# Emit the space-separated ecosystems (purl types) to load default feeds for.\n# Precedence: --ecosystems override > config (CONFIG_ECOSYSTEMS) > auto-detected\n# (DETECTED_ECOSYSTEMS). Falls back to npm when nothing was detected so the\n# legacy "npm feed always available" behavior is preserved.\nresolve_feed_ecosystems() {\n    local cli_override="$1"\n    local raw=""\n    if [ -n "$cli_override" ]; then\n        raw="$cli_override"\n    elif [ -n "$CONFIG_ECOSYSTEMS" ]; then\n        raw="$CONFIG_ECOSYSTEMS"\n    fi\n\n    local ecos="" item eco e\n    if [ -n "$raw" ]; then\n        raw="${raw//,/ }"\n        for item in $raw; do\n            [ -z "$item" ] && continue\n            eco=$(ecosystem_alias_to_purl "$item")\n            case " $ecos " in *" $eco "*) ;; *) ecos="${ecos:+$ecos }$eco" ;; esac\n        done\n    else\n        for e in "${!DETECTED_ECOSYSTEMS[@]}"; do\n            ecos="${ecos:+$ecos }$e"\n        done\n    fi\n\n    [ -z "$ecos" ] && ecos="npm"\n    printf \'%s\\n\' "$ecos"\n}\n\n# Write the name tokens of every discovered project file (plus extra names\n# given as arguments) to a temp file and point PREFILTER_TOKENS_FILE at it, so\n# parse_purl_to_lookup_eval keeps only the feed entries this project can\n# match. A token is a run of [A-Za-z0-9._-] (and each of its dot-separated\n# parts), lowercased with runs of - _ . collapsed to "-". One awk pass reads\n# every file; split() keeps it linear on minified one-line lockfiles.\n# PACKAGE_CHECKER_NO_PREFILTER=1 disables the filter (diagnostics).\nbuild_project_tokens() {\n    PREFILTER_TOKENS_FILE=""\n    [ "${PACKAGE_CHECKER_NO_PREFILTER:-}" != 1 ] || return 0\n    local tokens_file\n    tokens_file=$(mktemp) || return 0\n    register_temp_file "$tokens_file"\n    # awk reads the files itself (no argument list to overflow). A file it\n    # cannot read leaves the filter off: a partial token list would silently\n    # drop real findings.\n    printf \'%s\\n\' "${LOCKFILES}${LOCKFILES:+$\'\\n\'}${PACKAGE_JSON_FILES}" | awk -v names="$*" \'\n    function scan(line,   cnt, w) {\n        cnt = split(line, words, /[^A-Za-z0-9._-]+/)\n        for (w = 1; w <= cnt; w++) add(words[w])\n        # go.sum escapes capitals ("base64!captcha" is base64Captcha): add\n        # the unescaped words too, which lowercase like the feed names.\n        if (index(line, "!")) {\n            gsub(/!/, "", line)\n            cnt = split(line, words, /[^A-Za-z0-9._-]+/)\n            for (w = 1; w <= cnt; w++) add(words[w])\n        }\n    }\n    function add(t,   n, parts, cnt, i) {\n        if (t == "" || length(t) > 214) return\n        n = tolower(t)\n        gsub(/[-_.]+/, "-", n)\n        seen[n] = 1\n        if (index(t, ".")) {\n            cnt = split(t, parts, ".")\n            for (i = 1; i <= cnt; i++) {\n                n = tolower(parts[i])\n                gsub(/[-_]+/, "-", n)\n                if (n != "") seen[n] = 1\n            }\n        }\n    }\n    BEGIN { scan(names) }\n    $0 != "" {\n        file = $0\n        while ((status = (getline line < file)) > 0) scan(line)\n        if (status < 0) exit 1\n        close(file)\n    }\n    END { for (t in seen) print t }\n    \' > "$tokens_file" || return 0\n    PREFILTER_TOKENS_FILE="$tokens_file"\n}\n\n# True when DIR declares workspaces (npm/yarn/bun "workspaces", pnpm\n# pnpm-workspace.yaml, deno "workspace"): its lockfile then pins the\n# dependencies of every member package.json below it.\nis_workspace_root() {\n    local dir="$1"\n    [ -f "$dir/pnpm-workspace.yaml" ] && return 0\n    [ -f "$dir/package.json" ] && grep -q \'"workspaces"[[:space:]]*:\' "$dir/package.json" && return 0\n    local deno\n    for deno in "$dir/deno.json" "$dir/deno.jsonc"; do\n        [ -f "$deno" ] && grep -q \'"workspace"[[:space:]]*:\' "$deno" && return 0\n    done\n    return 1\n}\n\n# Discover lockfiles and package.json files under the scan directory, populate\n# the LOCKFILES / PACKAGE_JSON_FILES globals, and record which ecosystems are\n# present in DETECTED_ECOSYSTEMS. Runs BEFORE feed loading so detection can\n# drive which default feeds are pulled. Reads main()\'s locals (target_path,\n# lockfile_types, only_package_json, only_lockfiles, use_github, sbom_files)\n# via bash dynamic scope; sets SEARCH_DIR/LOCKFILES/PACKAGE_JSON_FILES/\n# SBOM_FILES as globals.\ndiscover_project_files() {\n    # Determine the (global) search directory (no trailing slash, so found\n    # paths share an exact prefix)\n    SEARCH_DIR="${target_path:-.}"\n    while [ "${#SEARCH_DIR}" -gt 1 ] && [ "${SEARCH_DIR%/}" != "$SEARCH_DIR" ]; do\n        SEARCH_DIR="${SEARCH_DIR%/}"\n    done\n    if [ "$use_github" = true ] && [ -d "$GITHUB_OUTPUT_DIR" ]; then\n        SEARCH_DIR="$GITHUB_OUTPUT_DIR"\n    elif [ -n "$target_path" ]; then\n        if [ ! -d "$SEARCH_DIR" ]; then\n            echo -e "${RED}\u274C Error: Target path does not exist: $target_path${NC}"\n            exit "$EXIT_ERROR"\n        fi\n    fi\n\n    # Resolve the lockfile basenames to search for (validates --lockfile-types\n    # against the registry-derived alias list). selected_path_entries mirrors\n    # selected_basenames for PATH-discovered ecosystems (e.g. GitHub Actions\n    # workflows), which are selected by the same --lockfile-types aliases but\n    # found via a path predicate instead of a basename (see PATH_ECOSYSTEM_REGISTRY).\n    local selected_basenames=()\n    local selected_path_entries=()\n    local entry bn eco parser alias\n    if [ -n "$lockfile_types" ]; then\n        local requested=" " t\n        local _requested_types\n        IFS=\',\' read -ra _requested_types <<< "$lockfile_types"\n        for t in "${_requested_types[@]}"; do\n            t="${t//[[:space:]]/}"\n            [ -z "$t" ] && continue\n            case " $KNOWN_LOCKFILE_ALIASES " in\n                *" $t "*) ;;\n                *)\n                    echo -e "${RED}\u274C Unknown lockfile type: $t${NC}"\n                    echo "Valid types: ${KNOWN_LOCKFILE_ALIASES// /, }"\n                    exit "$EXIT_ERROR" ;;\n            esac\n            requested="$requested$t "\n        done\n        for entry in "${ECOSYSTEM_REGISTRY[@]}"; do\n            IFS=\'|\' read -r bn eco parser alias <<< "$entry"\n            case "$requested" in\n                *" $alias "*) selected_basenames+=("$bn") ;;\n            esac\n        done\n        for entry in "${PATH_ECOSYSTEM_REGISTRY[@]}"; do\n            alias="${entry##*|}"\n            case "$requested" in\n                *" $alias "*) selected_path_entries+=("$entry") ;;\n            esac\n        done\n    else\n        for entry in "${ECOSYSTEM_REGISTRY[@]}"; do\n            selected_basenames+=("${entry%%|*}")\n        done\n        selected_path_entries=("${PATH_ECOSYSTEM_REGISTRY[@]}")\n    fi\n\n    # ---- One find for every candidate file ----\n    # Ignored directories are pruned (never descended into), and a single\n    # traversal collects lockfiles, PATH-discovered files (GitHub Actions\n    # workflows, split requirements files) and package.json files.\n    local want_locks=false want_pj=false\n    [ "$only_package_json" = false ] && want_locks=true\n    [ "$only_lockfiles" = false ] && want_pj=true\n    local -a match_args=()\n    if [ "$want_locks" = true ]; then\n        for bn in "${selected_basenames[@]}"; do\n            [ ${#match_args[@]} -gt 0 ] && match_args+=( -o )\n            match_args+=( -name "$bn" )\n        done\n        local pentry pglob nglobs ng gi\n        local -a nglob_arr\n        for pentry in "${selected_path_entries[@]}"; do\n            # eco/parser/alias are unused here (dispatch happens later).\n            IFS=\'|\' read -r pglob nglobs _ <<< "$pentry"\n            [ ${#match_args[@]} -gt 0 ] && match_args+=( -o )\n            match_args+=( \'(\' -path "$pglob" \'(\' )\n            IFS=\',\' read -ra nglob_arr <<< "$nglobs"\n            gi=0\n            for ng in "${nglob_arr[@]}"; do\n                [ "$gi" -gt 0 ] && match_args+=( -o )\n                match_args+=( -name "$ng" )\n                gi=$((gi + 1))\n            done\n            match_args+=( \')\' \')\' )\n        done\n    fi\n    # Runtime version files (src/50-ecosystems/65-runtimes.sh) ride on the same\n    # traversal, whatever --only-lockfiles / --lockfile-types select.\n    local want_runtime=true\n    [ "$runtime_check" != false ] || want_runtime=false\n    if [ "$want_pj" = true ] || [ "$want_runtime" = true ]; then\n        [ ${#match_args[@]} -gt 0 ] && match_args+=( -o )\n        match_args+=( -name "package.json" )\n    fi\n    if [ "$want_runtime" = true ]; then\n        local rname\n        for rname in "${RUNTIME_FILE_NAMES[@]}"; do\n            match_args+=( -o -name "$rname" )\n        done\n        match_args+=( -o \'(\' -path \'*/.github/workflows/*\' \'(\' -name \'*.yml\' -o -name \'*.yaml\' \')\' \')\' )\n    fi\n\n    local found=""\n    if [ ${#match_args[@]} -gt 0 ]; then\n        local -a find_args=( "$SEARCH_DIR" )\n        local ignore_path\n        # Empty entries ("ignore_paths": [""]) are dropped first: an empty\n        # "( )" group is a find syntax error that would hide every file.\n        local -a prune_args=()\n        for ignore_path in "${CONFIG_IGNORE_PATHS[@]}"; do\n            ignore_path="${ignore_path%/}"\n            [ -n "$ignore_path" ] || continue\n            [ ${#prune_args[@]} -eq 0 ] || prune_args+=( -o )\n            prune_args+=( -path "*/$ignore_path" )\n        done\n        if [ ${#prune_args[@]} -gt 0 ]; then\n            find_args+=( \'(\' "${prune_args[@]}" \')\' -prune -o )\n        fi\n        find_args+=( \'(\' "${match_args[@]}" \')\' -type f -print )\n        # An unreadable directory must not abort the scan (set -e): report it\n        # and keep whatever was found. A failure that found nothing at all is\n        # not a scan: stop instead of reporting a clean project.\n        if ! found=$(find "${find_args[@]}" 2>/dev/null); then\n            if [ -z "$found" ]; then\n                echo -e "${RED}\u274C Error: unable to search $SEARCH_DIR for project files${NC}" >&2\n                exit "$EXIT_ERROR"\n            fi\n            echo -e "${YELLOW}\u26A0\uFE0F  Warning: some directories under $SEARCH_DIR could not be read; results may be incomplete${NC}" >&2\n        fi\n    fi\n\n    # ---- Drop git-ignored files ----\n    # The repository is the one containing the scanned directory (not the\n    # current one), checked once for all files. Files fetched from GitHub are\n    # never filtered: the output directory itself is often git-ignored.\n    # Skipped files are listed; --include-gitignored scans them.\n    if [ -n "$found" ] && [ "$include_gitignored" = false ] && [ "$SEARCH_DIR" != "$GITHUB_OUTPUT_DIR" ] &&\n        git -C "$SEARCH_DIR" rev-parse --is-inside-work-tree > /dev/null 2>&1; then\n        local prefix="${SEARCH_DIR%/}/" ignored\n        ignored=$(printf \'%s\\n\' "$found" | while IFS= read -r f; do printf \'%s\\n\' "${f#"$prefix"}"; done |\n            git -C "$SEARCH_DIR" check-ignore --stdin 2>/dev/null) || true\n        if [ -n "$ignored" ]; then\n            found=$(printf \'%s\\n\' "$found" | awk -v prefix="$prefix" \'\n                NR == FNR { ignored[$0] = 1; next }\n                { rel = $0; if (index(rel, prefix) == 1) rel = substr(rel, length(prefix) + 1) }\n                !(rel in ignored)\' <(printf \'%s\\n\' "$ignored") -)\n            local ignored_count\n            ignored_count=$(printf \'%s\\n\' "$ignored" | wc -l | tr -d \' \')\n            echo -e "${YELLOW}\u26A0\uFE0F  Skipping $ignored_count git-ignored file(s) (use --include-gitignored to scan them):${NC}"\n            printf \'%s\\n\' "$ignored" | head -n 10 | sed \'s/^/      /\'\n            [ "$ignored_count" -le 10 ] || echo "      ... and $((ignored_count - 10)) more"\n            echo ""\n        fi\n    fi\n\n    # ---- Split lockfiles, package.json files and runtime version files ----\n    # A runtime pattern may also find a file no lockfile selection asked for\n    # (composer.lock under --lockfile-types npm): only selected names and\n    # paths become lockfiles.\n    LOCKFILES=""\n    PACKAGE_JSON_FILES=""\n    RUNTIME_FILES=""\n    local -A lock_basenames=()\n    for bn in "${selected_basenames[@]}"; do lock_basenames["$bn"]=1; done\n    local file base is_runtime is_lock pentry pglob nglobs ng\n    while IFS= read -r file; do\n        [ -n "$file" ] || continue\n        base="${file##*/}"\n        is_runtime=false\n        if [ "$want_runtime" = true ] && runtime_file_kind "$file"; then\n            RUNTIME_FILES+="${RUNTIME_FILES:+$\'\\n\'}$file"\n            is_runtime=true\n        fi\n        if [ "$base" = "package.json" ]; then\n            [ "$want_pj" = false ] || PACKAGE_JSON_FILES+="${PACKAGE_JSON_FILES:+$\'\\n\'}$file"\n            continue\n        fi\n        [ "$want_locks" = true ] || continue\n        is_lock=true\n        if [ "$is_runtime" = true ] && [ -z "${lock_basenames[$base]+x}" ]; then\n            is_lock=false\n            for pentry in "${selected_path_entries[@]}"; do\n                IFS=\'|\' read -r pglob nglobs _ _ _ <<< "$pentry"\n                # shellcheck disable=SC2053 # glob patterns from the registry\n                [[ "$file" == $pglob ]] || continue\n                IFS=\',\' read -ra nglob_arr <<< "$nglobs"\n                for ng in "${nglob_arr[@]}"; do\n                    # shellcheck disable=SC2053\n                    if [[ "$base" == $ng ]]; then is_lock=true; break 2; fi\n                done\n            done\n        fi\n        [ "$is_lock" = false ] || LOCKFILES+="${LOCKFILES:+$\'\\n\'}$file"\n    done <<< "$found"\n    RUNTIME_FILES=$(runtime_files_with_versions "$RUNTIME_FILES")\n\n    # ---- CycloneDX SBOMs given with --sbom ----\n    # Scanned like lockfiles, whatever their name or location (often a\n    # git-ignored build output such as target/bom.json).\n    local sbom\n    for sbom in "${sbom_files[@]}"; do\n        [ -n "${SBOM_FILES[$sbom]+x}" ] && continue\n        SBOM_FILES["$sbom"]=1\n        LOCKFILES+="${LOCKFILES:+$\'\\n\'}$sbom"\n    done\n\n    # ---- package.json files already covered by a lockfile ----\n    # A lockfile pins what is installed; the manifest only declares ranges\n    # (lodash ^4.17.0 would be checked as 4.17.0 while the lock has 4.18.1).\n    # Skip a package.json whose directory holds an npm-family lockfile, or\n    # whose ancestor (up to the scan root) is a workspace root with one.\n    SKIPPED_PACKAGE_JSON_COUNT=0\n    if [ -n "$PACKAGE_JSON_FILES" ] && [ -n "$LOCKFILES" ]; then\n        local -A npm_lock_dirs=()\n        local lf\n        while IFS= read -r lf; do\n            case "${lf##*/}" in\n                package-lock.json|npm-shrinkwrap.json|yarn.lock|pnpm-lock.yaml|bun.lock|deno.lock)\n                    npm_lock_dirs["${lf%/*}"]=1 ;;\n            esac\n        done <<< "$LOCKFILES"\n        if [ ${#npm_lock_dirs[@]} -gt 0 ]; then\n            local kept="" pj dir covered\n            while IFS= read -r pj; do\n                [ -n "$pj" ] || continue\n                dir="${pj%/*}"\n                covered=false\n                if [ -n "${npm_lock_dirs[$dir]+x}" ]; then\n                    covered=true\n                else\n                    while [ "$dir" != "$SEARCH_DIR" ] && [[ "$dir" == */* ]]; do\n                        dir="${dir%/*}"\n                        if [ -n "${npm_lock_dirs[$dir]+x}" ] && is_workspace_root "$dir"; then\n                            covered=true\n                            break\n                        fi\n                    done\n                fi\n                if [ "$covered" = true ]; then\n                    SKIPPED_PACKAGE_JSON_COUNT=$((SKIPPED_PACKAGE_JSON_COUNT + 1))\n                else\n                    kept+="${kept:+$\'\\n\'}$pj"\n                fi\n            done <<< "$PACKAGE_JSON_FILES"\n            PACKAGE_JSON_FILES="$kept"\n        fi\n    fi\n\n    # ---- Record detected ecosystems ----\n    if [ -n "$LOCKFILES" ]; then\n        local lfile b e _pe\n        while IFS= read -r lfile; do\n            [ -z "$lfile" ] && continue\n            if [ -n "${SBOM_FILES[$lfile]+x}" ]; then\n                # Parsed once: analyze_cyclonedx_inventory reuses the list.\n                SBOM_COMPONENTS["$lfile"]=$(cyclonedx_components "$lfile")\n                for e in $(printf \'%s\\n\' "${SBOM_COMPONENTS[$lfile]}" | cut -d\'|\' -f1 | sort -u); do\n                    case "$e" in\n                        npm|pypi|golang|maven|cargo|gem|composer|nuget|pub|hex|swift|githubactions)\n                            DETECTED_ECOSYSTEMS["$e"]=1 ;;\n                    esac\n                done\n                continue\n            fi\n            b="${lfile##*/}"\n            e="${LOCKFILE_ECO[$b]:-}"\n            # Path-discovered files (workflows) have no basename row; resolve\n            # their ecosystem by path so detection pulls the right default feed.\n            if [ -z "$e" ] && _pe=$(path_ecosystem_match "$lfile"); then\n                e="${_pe#*|}"; e="${e%%|*}"\n            fi\n            [ -n "$e" ] && DETECTED_ECOSYSTEMS["$e"]=1\n        done <<< "$LOCKFILES"\n    fi\n    if [ -n "$PACKAGE_JSON_FILES" ]; then\n        DETECTED_ECOSYSTEMS["npm"]=1\n    fi\n}\n\n# Report a project file that cannot be read: it was not scanned, so the run\n# cannot end with a clean result (see the end of main).\nreport_unreadable_file() {\n    echo -e "${RED}\u274C [$1] Cannot read this file: it was not scanned${NC}"\n    UNREADABLE_FILE_COUNT=$((UNREADABLE_FILE_COUNT + 1))\n}\n\n# Print the merged advisories of one finding ("rec||rec", each record\n# "severity;ghsa;cve;source;fix;id"). Returns non-zero when nothing was printed.\nprint_advisories() {\n    local advisories="$1" advisory severity ghsa cve source fix id color printed=1\n    while [ -n "$advisories" ]; do\n        advisory="${advisories%%||*}"\n        if [ "$advisory" = "$advisories" ]; then advisories=""; else advisories="${advisories#*||}"; fi\n        IFS=\';\' read -r severity ghsa cve source fix id <<< "$advisory"\n        if [ -n "$severity" ]; then\n            severity_rank "$severity"\n            case "$SEV_RANK" in\n                4) color="$RED" ;;\n                3) color="$YELLOW" ;;\n                2) color="$BLUE" ;;\n                *) color="$NC" ;;\n            esac\n            echo -e "      ${color}Severity: $severity${NC}"\n            printed=0\n        fi\n        if [ -n "$ghsa" ]; then\n            case ", $source, " in\n                *", ghsa, "*) echo -e "      ${BLUE}GHSA: $ghsa (https://github.com/advisories/$ghsa)${NC}" ;;\n                *", osv, "*) echo -e "      ${BLUE}GHSA: $ghsa (https://osv.dev/vulnerability/$ghsa)${NC}" ;;\n                *) echo -e "      ${BLUE}GHSA: $ghsa${NC}" ;;\n            esac\n            printed=0\n        fi\n        if [ -n "$cve" ]; then\n            echo -e "      ${BLUE}CVE: $cve (https://nvd.nist.gov/vuln/detail/$cve)${NC}"\n            printed=0\n        fi\n        if [ -n "$id" ]; then\n            echo -e "      ${BLUE}ID: $id (https://osv.dev/vulnerability/$id)${NC}"\n            printed=0\n        fi\n        if [ -n "$source" ]; then\n            echo -e "      ${BLUE}Source: $source${NC}"\n            printed=0\n        fi\n        if [ -n "$fix" ]; then\n            echo -e "      ${GREEN}Fix: upgrade to >= $fix${NC}"\n            printed=0\n        fi\n    done\n    return "$printed"\n}\n\nmain() {\n    local use_config=true\n    local cli_sources=false\n    local custom_config=""\n    local custom_sources=()\n    local use_github=false\n    local name=""\n    local package_version=""\n    local ecosystem="npm"\n    local export_json_file=""\n    local export_csv_file=""\n    local only_package_json=false\n    local only_lockfiles=false\n    local lockfile_types=""\n    local target_path=""\n    local default_feeds=""\n    local cli_ecosystems=""\n    local sbom_files=()\n    local go_reachability=false\n    local runtime_check=""   # "" = not set on the command line (config decides)\n    local include_gitignored=false\n\n    # Any unexpected failure that aborts the run (set -e) exits with\n    # EXIT_ERROR, never with 1, which means "vulnerable packages found".\n    # Command substitutions keep their usual non-fatal behavior.\n    set -E\n    trap \'[ "$BASH_SUBSHELL" -ne 0 ] || exit "$EXIT_ERROR"\' ERR\n\n    # Parse command line arguments\n    while [[ $# -gt 0 ]]; do\n        case "$1" in\n            -s|--source|-f|--format|--csv-columns|-c|--config|--github-org|--github-repo|--github-token|--github-output|--package-name|--package-version|--ecosystem|--ecosystems|--lockfile-types|--sbom)\n                if [ "$#" -lt 2 ] || [ -z "$2" ] || [[ "$2" == --* ]]; then\n                    echo "Error: $1 requires a value"\n                    exit "$EXIT_ERROR"\n                fi\n                ;;\n        esac\n        case $1 in\n            -h|--help)\n                if [[ "$2" == "format" ]]; then\n                    show_format_help\n                else\n                    show_help\n                fi\n                ;;\n            --help-ai)\n                show_ai_help "$2"\n                ;;\n            -v|--version)\n                show_version\n                ;;\n            -s|--source)\n                custom_sources+=("$2|")\n                cli_sources=true\n                shift 2\n                ;;\n            --default-source-ghsa|--default-source-osv|--default-source-ghsa-osv)\n                # Record intent; the feed is resolved per detected ecosystem\n                # after project discovery (see the source-loading section).\n                # The flags add up: --default-source-ghsa --default-source-osv\n                # loads both feeds.\n                local wanted_feed\n                for wanted_feed in ghsa osv; do\n                    case "$1" in *"-$wanted_feed"*) ;; *) continue ;; esac\n                    case " $default_feeds " in\n                        *" $wanted_feed "*) ;;\n                        *) default_feeds="${default_feeds:+$default_feeds }$wanted_feed" ;;\n                    esac\n                done\n                cli_sources=true\n                shift\n                ;;\n            -f|--format|--csv-columns)\n                # Both qualify the preceding -s/--source, in either order:\n                # rebuild its "url|format|columns" entry from its parts.\n                if [ ${#custom_sources[@]} -eq 0 ]; then\n                    echo -e "${RED}\u274C Error: $1 must follow the -s/--source it applies to${NC}"\n                    exit "$EXIT_ERROR"\n                fi\n                local last_idx=$((${#custom_sources[@]} - 1))\n                local src_url src_format src_columns\n                IFS=\'|\' read -r src_url src_format src_columns <<< "${custom_sources[$last_idx]}"\n                if [ "$1" = "--csv-columns" ]; then\n                    src_columns="$2"\n                else\n                    src_format="$2"\n                fi\n                custom_sources[$last_idx]="$src_url|$src_format|$src_columns"\n                shift 2\n                ;;\n            -c|--config)\n                custom_config="$2"\n                shift 2\n                ;;\n            --no-config)\n                use_config=false\n                shift\n                ;;\n            --github-org)\n                GITHUB_ORG="$2"\n                use_github=true\n                shift 2\n                ;;\n            --github-repo)\n                GITHUB_REPO="$2"\n                use_github=true\n                shift 2\n                ;;\n            --github-token)\n                GITHUB_TOKEN="$2"\n                shift 2\n                ;;\n            --github-output)\n                GITHUB_OUTPUT_DIR="$2"\n                shift 2\n                ;;\n            --github-only)\n                GITHUB_ONLY=true\n                use_github=true\n                shift\n                ;;\n            --create-multiple-issues)\n                CREATE_GITHUB_ISSUE=true\n                shift\n                ;;\n            --create-single-issue)\n                CREATE_SINGLE_ISSUE=true\n                shift\n                ;;\n            --package-name)\n                name="$2"\n                shift 2\n                ;;\n            --package-version)\n                package_version="$2"\n                shift 2\n                ;;\n            --ecosystem)\n                ecosystem="$2"\n                shift 2\n                ;;\n            --export-json|--export-csv)\n                # The file name is optional: a following option or an existing\n                # directory (the scan PATH) is not taken as the file name.\n                local export_option="$1" export_file="vulnerabilities.${1#--export-}"\n                if [ -n "${2:-}" ] && [[ "$2" != -* ]] && [ ! -d "$2" ]; then\n                    export_file="$2"\n                    shift\n                fi\n                if [ "$export_option" = "--export-json" ]; then\n                    export_json_file="$export_file"\n                else\n                    export_csv_file="$export_file"\n                fi\n                shift\n                ;;\n            --fetch-all)\n                # Optional DIR argument (default: data). Generates GHSA + OSV\n                # feeds for ALL supported ecosystems.\n                check_dependencies curl jq git unzip\n                local fetch_dir="data"\n                [ -z "${2:-}" ] || [[ "$2" == -* ]] || fetch_dir="$2"\n                fetch_all "$fetch_dir" || exit "$EXIT_ERROR"\n                exit 0\n                ;;\n            --fetch-osv)\n                # Optional argument:\n                #   (none)            -> all ecosystems into data/\n                #   comma/space list  -> those ecosystems into data/ (e.g. pypi,go)\n                #   legacy file path  -> npm feed into that file\'s directory\n                check_dependencies curl jq unzip\n                case "${2:-}" in\n                    ""|-*) fetch_osv ;;\n                    */) FEED_OUTPUT_DIR="${2%/}" fetch_osv ;;\n                    */*|*.purl)\n                        if [ -d "$2" ]; then FEED_OUTPUT_DIR="$2" fetch_osv\n                        else FEED_OUTPUT_DIR="$(dirname "$2")" fetch_osv npm; fi ;;\n                    # Ecosystem names win; otherwise an existing directory\n                    # named without a slash ("data") is the output directory.\n                    *) IFS=\', \' read -ra _fetch_ecos <<< "$2"\n                       if ! feed_resolve_types "${_fetch_ecos[@]}" 2>/dev/null && [ -d "$2" ]; then\n                           FEED_OUTPUT_DIR="$2" fetch_osv\n                       else fetch_osv "${_fetch_ecos[@]}"; fi ;;\n                esac || exit "$EXIT_ERROR"\n                exit 0\n                ;;\n            --fetch-ghsa)\n                # Same argument semantics as --fetch-osv (single clone, all ecos).\n                check_dependencies jq git\n                case "${2:-}" in\n                    ""|-*) fetch_ghsa ;;\n                    */) FEED_OUTPUT_DIR="${2%/}" fetch_ghsa ;;\n                    */*|*.purl)\n                        if [ -d "$2" ]; then FEED_OUTPUT_DIR="$2" fetch_ghsa\n                        else FEED_OUTPUT_DIR="$(dirname "$2")" fetch_ghsa npm; fi ;;\n                    # Ecosystem names win; otherwise an existing directory\n                    # named without a slash ("data") is the output directory.\n                    *) IFS=\', \' read -ra _fetch_ecos <<< "$2"\n                       if ! feed_resolve_types "${_fetch_ecos[@]}" 2>/dev/null && [ -d "$2" ]; then\n                           FEED_OUTPUT_DIR="$2" fetch_ghsa\n                       else fetch_ghsa "${_fetch_ecos[@]}"; fi ;;\n                esac || exit "$EXIT_ERROR"\n                exit 0\n                ;;\n            --fetch-runtime)\n                # Optional DIR argument (default: data): writes osv-runtime.purl.\n                check_dependencies curl jq unzip\n                local runtime_dir="data"\n                [ -z "${2:-}" ] || [[ "$2" == -* ]] || runtime_dir="$2"\n                FEED_OUTPUT_DIR="$runtime_dir" fetch_runtime || exit "$EXIT_ERROR"\n                exit 0\n                ;;\n            --no-runtime-check)\n                runtime_check=false\n                shift\n                ;;\n            --include-gitignored)\n                include_gitignored=true\n                shift\n                ;;\n            --only-package-json)\n                only_package_json=true\n                shift\n                ;;\n            --only-lockfiles)\n                only_lockfiles=true\n                shift\n                ;;\n            --lockfile-types)\n                lockfile_types="$2"\n                shift 2\n                ;;\n            --ecosystems)\n                cli_ecosystems="$2"\n                shift 2\n                ;;\n            --go-reachability)\n                go_reachability=true\n                shift\n                ;;\n            --sbom)\n                if [ ! -f "$2" ]; then\n                    echo -e "${RED}\u274C Error: SBOM file not found: $2${NC}"\n                    exit "$EXIT_ERROR"\n                fi\n                sbom_files+=("$2")\n                shift 2\n                ;;\n            -*)\n                echo -e "${RED}\u274C Unknown option: $1${NC}"\n                echo "Use --help for usage information"\n                exit "$EXIT_ERROR"\n                ;;\n            *)\n                # Positional argument - treat as target path\n                if [ -z "$target_path" ]; then\n                    target_path="$1"\n                    shift\n                else\n                    echo -e "${RED}\u274C Error: Multiple target paths specified${NC}"\n                    echo "Use --help for usage information"\n                    exit "$EXIT_ERROR"\n                fi\n                ;;\n        esac\n    done\n\n    # Validate mutually exclusive options\n    if [ "$only_package_json" = true ] && [ "$only_lockfiles" = true ]; then\n        echo -e "${RED}\u274C Error: --only-package-json and --only-lockfiles are mutually exclusive${NC}"\n        echo "Use --help for usage information"\n        exit "$EXIT_ERROR"\n    fi\n\n    # Validate lockfile-types only makes sense with lockfiles\n    if [ -n "$lockfile_types" ] && [ "$only_package_json" = true ]; then\n        echo -e "${RED}\u274C Error: --lockfile-types cannot be used with --only-package-json${NC}"\n        echo "Use --help for usage information"\n        exit "$EXIT_ERROR"\n    fi\n\n    # Validate --ecosystem against the supported purl types\n    case "$ecosystem" in\n        npm|pypi|golang|maven|cargo|gem|composer|nuget|pub|hex|swift|githubactions|runtime)\n            ;;\n        *)\n            echo -e "${RED}\u274C Error: Unsupported ecosystem \'$ecosystem\'${NC}"\n            echo "Valid ecosystems: npm, pypi, golang, maven, cargo, gem, composer, nuget, pub, hex, swift, githubactions, runtime"\n            exit "$EXIT_ERROR"\n            ;;\n    esac\n\n    # Build the ecosystem lookup tables from the registry (single source of\n    # truth for discovery, dispatch and default-feed resolution).\n    build_ecosystem_tables\n\n    # Validate the --ecosystems feed-loading override (aliases or purl types).\n    if [ -n "$cli_ecosystems" ]; then\n        validate_ecosystems_list "$cli_ecosystems" || exit "$EXIT_ERROR"\n    fi\n\n    check_dependencies\n\n    # --package-name: look the package up in the project through a virtual\n    # purl entry (NAME@VERSION, or every version when none is given) and, for\n    # an exact --package-version, check that version against the feeds. Only\n    # this package is reported; without another source, the default feed of\n    # --ecosystem is loaded.\n    local package_lookup_file=""\n    if [ -n "$name" ]; then\n        if ! package_lookup_file=$(mktemp); then\n            echo -e "${RED}\u274C Error: Unable to create a temporary file${NC}"\n            exit "$EXIT_ERROR"\n        fi\n        register_temp_file "$package_lookup_file"\n        printf \'pkg:%s/%s@%s\\n\' "$ecosystem" "$name" "${package_version:-*}" > "$package_lookup_file"\n        canonical_package_name "$ecosystem" "$name"\n        PACKAGE_FILTER="$ecosystem:$CANON_NAME"\n        cli_sources=true\n    fi\n\n    echo "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"\n    echo "\u2551       Package Vulnerability Checker                \u2551"\n    echo "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"\n    echo ""\n\n    # Configuration must precede fetching and discovery: it supplies GitHub\n    # settings, exclusions and the default-feed ecosystem override.\n    # Options and GitHub settings always apply; the configured sources only\n    # when no source was given on the command line. --no-config skips the\n    # default file, but an explicit -c/--config is always read.\n    local sources_loaded=false config_to_use=""\n    if [ -n "$custom_config" ]; then\n        config_to_use="$custom_config"\n    elif [ "$use_config" = true ] && [ -f "$CONFIG_FILE" ]; then\n        config_to_use="$CONFIG_FILE"\n    fi\n    if [ -n "$config_to_use" ]; then\n        if [ ! -f "$config_to_use" ]; then\n            echo "Error: Configuration file not found: $config_to_use"\n            exit "$EXIT_ERROR"\n        fi\n        local config_sources=true\n        [ "$cli_sources" = false ] || config_sources=false\n        load_config_file "$config_to_use" "$config_sources" || exit "$EXIT_ERROR"\n        validate_ecosystems_list "$CONFIG_ECOSYSTEMS" || exit "$EXIT_ERROR"\n        [ "$LOADED_SOURCE_COUNT" -eq 0 ] || sources_loaded=true\n        if [ -n "$GITHUB_REPO" ] || [ -n "$GITHUB_ORG" ]; then\n            use_github=true\n        fi\n    fi\n\n    if { [ "$CREATE_GITHUB_ISSUE" = true ] || [ "$CREATE_SINGLE_ISSUE" = true ]; } && [ -z "$GITHUB_TOKEN" ]; then\n        echo -e "${RED}\u274C Error: --create-multiple-issues and --create-single-issue require a GitHub token${NC}"\n        echo "   Use --github-token or set the GITHUB_TOKEN environment variable"\n        exit "$EXIT_ERROR"\n    fi\n\n    # Fetch packages from GitHub if requested\n    if [ "$use_github" = true ]; then\n        fetch_github_packages || exit "$EXIT_ERROR"\n        \n        # If --github-only, exit after fetching\n        if [ "$GITHUB_ONLY" = true ]; then\n            echo -e "${GREEN}\u2705 GitHub packages fetched successfully. Use without --github-only to analyze.${NC}"\n            exit 0\n        fi\n    fi\n\n    # Runtime versions are checked unless --no-runtime-check or\n    # options.runtime_check=false; a --package-name lookup only checks a\n    # runtime when it names one (--ecosystem runtime).\n    [ -n "$runtime_check" ] || runtime_check="$CONFIG_RUNTIME_CHECK"\n    if [ -n "$name" ] && [ "$ecosystem" != runtime ]; then\n        runtime_check=false\n    fi\n\n    # Discover project files and detect ecosystems BEFORE loading feeds, so we\n    # only pull the default feeds the detected ecosystems actually need. Only\n    # skipped git-ignored files are reported here; the results are\n    # printed/analyzed after the lookup build.\n    discover_project_files\n\n    # A truncated project file is an incomplete scan, never a clean result.\n    # Validate strict JSON only: bun.lock is JSONC and has a separate grammar.\n    local project_input\n    while IFS= read -r project_input; do\n        [ -z "$project_input" ] && continue\n        # Unreadable files are reported when they are analyzed.\n        [ -r "$project_input" ] || continue\n        case "${project_input##*/}" in\n            package.json|package-lock.json|npm-shrinkwrap.json|Pipfile.lock|composer.lock|packages.lock.json|Package.resolved|deno.lock) ;;\n            *) [ -n "${SBOM_FILES[$project_input]+x}" ] || continue ;;\n        esac\n        if ! json_is_valid_file "$project_input"; then\n            echo -e "${RED}\u274C Invalid JSON in project file: $project_input${NC}"\n            exit "$EXIT_ERROR"\n        fi\n    done <<< "${LOCKFILES}${LOCKFILES:+$\'\\n\'}${PACKAGE_JSON_FILES}"\n\n    # Feed entries are pre-filtered on the names this project can contain\n    # (plus the runtime names when a runtime version file was found).\n    local -a token_names=()\n    [ -z "$name" ] || token_names+=("$name")\n    # shellcheck disable=SC2206 # space-separated list of plain names\n    [ -z "$RUNTIME_FILES" ] || token_names+=($RUNTIME_FEED_PACKAGES)\n    build_project_tokens "${token_names[@]}"\n\n    # 2. Explicit --source entries load unconditionally (no ecosystem filtering)\n    if [ ${#custom_sources[@]} -gt 0 ]; then\n        local source url format columns\n        for source in "${custom_sources[@]}"; do\n            IFS=\'|\' read -r url format columns <<< "$source"\n            load_data_source "$url" "$format" "Custom Source" "$columns" || exit "$EXIT_ERROR"\n        done\n        sources_loaded=true\n    fi\n\n    # 3. Default feeds (GHSA/OSV), resolved per detected ecosystem. Explicit\n    #    --default-source-* flags set $default_feeds; otherwise, when nothing has\n    #    loaded yet, fall back to the implicit default (GHSA).\n    local feeds_to_load="$default_feeds"\n    local implicit_default=false\n    if [ -z "$feeds_to_load" ] && [ "$sources_loaded" = false ]; then\n        feeds_to_load="ghsa"\n        implicit_default=true\n    fi\n\n    if [ -n "$feeds_to_load" ]; then\n        prepare_default_source_lookup\n        if [ "$implicit_default" = true ]; then\n            echo -e "${BLUE}\u2139\uFE0F  No data source specified, using default GHSA source${NC}"\n            echo ""\n        fi\n\n        # Ecosystems to load feeds for: --ecosystems > config > auto-detected;\n        # a --package-name lookup only needs its own ecosystem.\n        local feed_ecos\n        if [ -n "$name" ] && [ -z "$cli_ecosystems" ]; then\n            feed_ecos="$ecosystem"\n        else\n            feed_ecos=$(resolve_feed_ecosystems "$cli_ecosystems")\n        fi\n\n        local eco feed feed_file feed_path feed_label feeds_loaded=0 feed_entries=0\n        for eco in $feed_ecos; do\n            # Runtime advisories have a single feed of their own (step 3b).\n            [ "$eco" != runtime ] || continue\n            for feed in $feeds_to_load; do\n                feed_file=$(default_feed_filename "$feed" "$eco")\n                # NB: find_default_source returns non-zero when a feed is\n                # missing; `|| true` keeps `set -e` from aborting so we can warn\n                # and continue (a plain assignment would exit the script).\n                feed_path=$(find_default_source "$feed_file") || true\n                if [ -n "$feed_path" ]; then\n                    feed_label=$(printf \'%s\' "$feed" | tr \'[:lower:]\' \'[:upper:]\')\n                    echo -e "${GREEN}\u2713 Using ${feed_label} source: $feed_path${NC}"\n                    echo ""\n                    load_data_source "$feed_path" "purl" "Default ${feed_label} Source" "" || exit "$EXIT_ERROR"\n                    sources_loaded=true\n                    feeds_loaded=$((feeds_loaded + 1))\n                    feed_entries=$((feed_entries + LAST_SOURCE_ENTRY_COUNT))\n                else\n                    echo -e "${YELLOW}\u26A0\uFE0F  Warning: Unable to find ${feed} feed for ${eco} (${feed_file})${NC}"\n                fi\n            done\n        done\n\n        # A default feed always lists advisories: none at all means the feed\n        # files are empty or unreadable, and a clean result would be a lie.\n        if [ "$feeds_loaded" -gt 0 ] && [ "$feed_entries" -eq 0 ]; then\n            echo -e "${RED}\u274C Error: the default vulnerability feeds are empty or unreadable${NC}"\n            exit "$EXIT_ERROR"\n        fi\n    fi\n\n    # 3b. Runtime advisories (Node.js, PHP): one feed, loaded whenever the\n    #     project pins a runtime version, whatever the GHSA/OSV choice.\n    local runtime_feed_loaded=false\n    if { [ "$runtime_check" != false ] && [ -n "$RUNTIME_FILES" ]; } ||\n        { [ -n "$name" ] && [ "$ecosystem" = runtime ]; }; then\n        local runtime_feed\n        prepare_default_source_lookup\n        runtime_feed=$(find_default_source "osv-runtime.purl") || true\n        if [ -n "$runtime_feed" ]; then\n            echo -e "${GREEN}\u2713 Using runtime source: $runtime_feed${NC}"\n            echo ""\n            load_data_source "$runtime_feed" "purl" "Runtime advisories (Node.js, PHP)" "" || exit "$EXIT_ERROR"\n            sources_loaded=true\n            runtime_feed_loaded=true\n        else\n            echo -e "${YELLOW}\u26A0\uFE0F  Warning: Unable to find the runtime feed (osv-runtime.purl); runtime versions are not checked${NC}"\n        fi\n    fi\n\n    # 4. --package-name: check the exact version itself, then add the lookup\n    #    entry (loaded last so the version check cannot match it).\n    if [ -n "$name" ]; then\n        if [ -n "$package_version" ] && [[ "$package_version" != *[\\ \\<\\>=\\^~*,\\|]* ]]; then\n            check_vulnerability "$ecosystem" "$CANON_NAME" "$package_version" "--package-name" || true\n        fi\n        load_data_source "$package_lookup_file" "purl" "Package lookup: $name" "" || exit "$EXIT_ERROR"\n        sources_loaded=true\n    fi\n\n    if [ "$sources_loaded" = false ]; then\n        echo -e "${RED}\u274C Error: Unable to find any vulnerability data source${NC}"\n        echo ""\n        echo "By default, package-checker uses the built-in GHSA feed."\n        echo "If you see this message, no source could be found or loaded."\n        echo ""\n        echo "Tried the following locations for each detected ecosystem:"\n        echo "  - Next to the script: <script dir>/data/"\n        echo "  - Homebrew: \\$(brew --prefix)/share/package-checker/data/"\n        echo "  - Docker: /app/data/"\n        echo "  - Local: ./data/"\n        echo "  - Remote: https://raw.githubusercontent.com/maxgfr/package-checker.sh/refs/heads/main/data/"\n        echo ""\n        echo "You can explicitly specify a data source using:"\n        echo "  --default-source-ghsa    Use default GHSA source"\n        echo "  --default-source-osv     Use default OSV source"\n        echo "  --default-source-ghsa-osv         Use both GHSA and OSV sources"\n        echo "  --source <URL>           Use custom vulnerability database"\n        echo "  A .package-checker.config.json file"\n        echo ""\n        echo "Use --help for more information"\n        exit "$EXIT_ERROR"\n    fi\n\n    # Count unique vulnerable packages across every loaded source.\n    local total_packages=0 pkg\n    local -A unique_pkgs_temp=()\n    for pkg in "${!VULN_EXACT_LOOKUP[@]}" "${!VULN_RANGE_LOOKUP[@]}"; do\n        unique_pkgs_temp["$pkg"]=1\n    done\n    total_packages=${#unique_pkgs_temp[@]}\n    unset unique_pkgs_temp\n\n    if [ -n "${PREFILTER_TOKENS_FILE:-}" ]; then\n        echo -e "${BLUE}\u{1F4CA} Total unique vulnerable packages: $total_packages relevant to this project (of ${TOTAL_SOURCE_ENTRIES:-0} entries loaded)${NC}"\n    else\n        echo -e "${BLUE}\u{1F4CA} Total unique vulnerable packages: $total_packages${NC}"\n    fi\n    if [ "${TOTAL_SOURCE_ENTRIES:-0}" -eq 0 ]; then\n        echo -e "${YELLOW}\u26A0\uFE0F  The data sources contain no vulnerability entry${NC}"\n    fi\n\n    echo -e "${GREEN}\u2705 Lookup tables ready (${#VULN_EXACT_LOOKUP[@]} packages with exact versions, ${#VULN_RANGE_LOOKUP[@]} with ranges)${NC}"\n    echo ""\n\n    # Report the directory being scanned (files were discovered before feed\n    # loading; see discover_project_files).\n    if [ "$use_github" = true ] && [ -d "$GITHUB_OUTPUT_DIR" ]; then\n        echo -e "${BLUE}\u{1F4C2} Analyzing packages from GitHub: $SEARCH_DIR${NC}"\n        echo ""\n    elif [ -n "$target_path" ]; then\n        echo -e "${BLUE}\u{1F4C2} Scanning directory: $SEARCH_DIR${NC}"\n        echo ""\n    fi\n\n    # Search for lockfiles\n    echo "\u{1F50D} Searching for lockfiles and package.json files..."\n    echo ""\n\n    if [ -z "$LOCKFILES" ]; then\n        if [ "$only_package_json" = true ]; then\n            echo "   \u23E9 Skipping lockfiles (--only-package-json specified)"\n        else\n            echo "   \u2139\uFE0F  No lockfiles found"\n        fi\n    else\n        LOCKFILE_COUNT=$(echo "$LOCKFILES" | wc -l | tr -d \' \')\n        if [ -n "$lockfile_types" ]; then\n            echo "\u{1F4E6} Analyzing $LOCKFILE_COUNT lockfile(s) [types: $lockfile_types]..."\n        else\n            echo "\u{1F4E6} Analyzing $LOCKFILE_COUNT lockfile(s)..."\n        fi\n\n        while IFS= read -r lockfile; do\n            [ -z "$lockfile" ] && continue\n            if [ ! -r "$lockfile" ]; then\n                report_unreadable_file "$lockfile"\n                continue\n            fi\n            lockname="${lockfile##*/}"\n            local lock_parser="${LOCKFILE_PARSER[$lockname]:-}"\n            local checked_before="${CHECKED_PACKAGE_COUNT:-0}"\n            LOCKFILE_SKIPPED=0   # set by a parser that defers to another file\n            if [ -n "${SBOM_FILES[$lockfile]+x}" ]; then\n                analyze_cyclonedx_inventory "$lockfile"\n            elif [ -n "$lock_parser" ]; then\n                "$lock_parser" "$lockfile" "${LOCKFILE_ECO[$lockname]}"\n            else\n                # Path-discovered ecosystem (e.g. GitHub Actions workflows):\n                # no basename key \u2014 resolve the parser by path pattern.\n                local _pe _pe_parser _pe_eco _pe_alias\n                if _pe=$(path_ecosystem_match "$lockfile"); then\n                    IFS=\'|\' read -r _pe_parser _pe_eco _pe_alias <<< "$_pe"\n                    "$_pe_parser" "$lockfile" "$_pe_eco"\n                fi\n                # A workflow without a published action is ordinary.\n                lock_parser=""\n            fi\n            # A lockfile with content that yields no package at all is either\n            # empty of dependencies or in a shape the parser does not read:\n            # say so instead of letting "no vulnerabilities" imply a check.\n            if [ -n "$lock_parser" ] && [ "$LOCKFILE_SKIPPED" = 0 ] &&\n                [ "${CHECKED_PACKAGE_COUNT:-0}" = "$checked_before" ] &&\n                grep -q \'[^[:space:]]\' "$lockfile" 2>/dev/null; then\n                echo -e "${YELLOW}\u26A0\uFE0F  [$lockfile] No package could be read from this file (no dependency, or an unsupported format)${NC}"\n            fi\n        done <<< "$LOCKFILES"\n    fi\n\n    # Analyze package.json files (discovered before feed loading)\n    if [ "${SKIPPED_PACKAGE_JSON_COUNT:-0}" -gt 0 ]; then\n        echo "   \u23E9 Skipping $SKIPPED_PACKAGE_JSON_COUNT package.json file(s) covered by a lockfile"\n    fi\n    if [ -z "$PACKAGE_JSON_FILES" ]; then\n        if [ "$only_lockfiles" = true ]; then\n            echo "   \u23E9 Skipping package.json files (--only-lockfiles specified)"\n        elif [ "${SKIPPED_PACKAGE_JSON_COUNT:-0}" -eq 0 ]; then\n            echo "   \u2139\uFE0F  No package.json files found"\n        fi\n    else\n        PACKAGE_COUNT=$(echo "$PACKAGE_JSON_FILES" | wc -l | tr -d \' \')\n        echo "\u{1F4E6} Analyzing $PACKAGE_COUNT package.json file(s) (declared versions: no lockfile covers them)..."\n        \n        # Build regex pattern of dependency types to match\n        local dep_types_pattern=$(printf \'%s|\' "${CONFIG_DEPENDENCY_TYPES[@]}")\n        dep_types_pattern="${dep_types_pattern%|}"  # Remove trailing |\n        \n        while IFS= read -r package_file; do\n            if [ ! -r "$package_file" ]; then\n                report_unreadable_file "$package_file"\n                continue\n            fi\n            # Track vulnerabilities found in this file\n            local vuln_count_before=${#VULNERABLE_PACKAGES[@]}\n\n            # Use awk to extract all dependencies efficiently\n            local deps\n            deps=$(awk -v dep_pattern="$dep_types_pattern" \'\n            BEGIN { depth=0; active=0; pending=0 }\n            {\n                line = $0\n                for (i = 1; i <= length(line); i++) {\n                    c = substr(line, i, 1)\n                    if (c == "\\"") {\n                        token = ""\n                        for (i++; i <= length(line); i++) {\n                            c = substr(line, i, 1)\n                            if (c == "\\\\") {\n                                token = token c substr(line, ++i, 1)\n                            } else if (c == "\\"") {\n                                break\n                            } else token = token c\n                        }\n                        rest = substr(line, i + 1)\n                        if (rest ~ /^[[:space:]]*:/) {\n                            if (depth == 1) pending = (token ~ ("^(" dep_pattern ")$"))\n                            else if (active && depth == 2) pkg = token\n                        } else if (active && depth == 2 && pkg != "") {\n                            # Only semver specs name a version: git+, github:,\n                            # catalog:, patch:, file:, workspace:, npm: aliases,\n                            # URLs and dist-tags (latest, next) do not.\n                            ver = token\n                            gsub(/^[\\\\^~>=<v[:space:]]+/, "", ver)\n                            gsub(/[[:space:]].*/, "", ver)\n                            if (ver ~ /^[0-9]/ && ver !~ /:/) print pkg "|" ver\n                            pkg = ""\n                        } else if (depth == 1) {\n                            pending = 0\n                        }\n                    } else if (depth == 1 && c ~ /[^[:space:],:{}]/) {\n                        # A non-object value ("dependencies": null) closes the\n                        # pending dependency section without opening it.\n                        pending = 0\n                    } else if (c == "{") {\n                        if (depth == 1) { active = pending; pending = 0; pkg = "" }\n                        depth++\n                    } else if (c == "}") {\n                        if (depth == 2) { active = 0; pkg = "" }\n                        depth--\n                    }\n                }\n            }\n            \' "$package_file" 2>/dev/null | sort -u)\n\n            # Check each dependency against vulnerability database\n            while IFS=\'|\' read -r pkg_name version; do\n                [ -z "$pkg_name" ] || [ -z "$version" ] && continue\n                # O(1) lookups of the eco and wildcard namespaces\n                check_vulnerability "npm" "$pkg_name" "$version" "$package_file" || true\n            done <<< "$deps"\n\n            # Check if vulnerabilities were found in this file\n            local vuln_count_after=${#VULNERABLE_PACKAGES[@]}\n            if [ "$vuln_count_after" -eq "$vuln_count_before" ]; then\n                echo -e "${GREEN}\u2713 [$package_file] No vulnerabilities found${NC}"\n            fi\n        done <<< "$PACKAGE_JSON_FILES"\n    fi\n\n    # Runtime versions the project targets (.nvmrc, Dockerfile, composer.json...)\n    [ "$runtime_feed_loaded" = false ] || [ -z "$RUNTIME_FILES" ] || scan_runtimes\n\n    [ "$go_reachability" = false ] || go_reachability\n\n    echo ""\n    echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n    echo -e "${BLUE}\u{1F4CA} SUMMARY${NC}"\n    echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n    \n    if [ $FOUND_VULNERABLE -eq 0 ]; then\n        echo -e "${GREEN}\u2705 No vulnerable packages detected${NC}"\n    else\n        # Count unique vulnerable packages (unique eco:name@version identities)\n        local unique_vulns=$(printf \'%s\\n\' "${VULNERABLE_PACKAGES[@]}" | awk -F\'|\' \'{print $2":"$3}\' | sort -u | wc -l | tr -d \' \')\n        local total_occurrences=${#VULNERABLE_PACKAGES[@]}\n\n        echo -e "${RED}\u26A0\uFE0F  Found ${unique_vulns} vulnerable package(s) in ${total_occurrences} location(s)${NC}"\n        echo ""\n\n        # Group by package (group key = eco:name@version)\n        declare -A pkg_files\n        for vuln in "${VULNERABLE_PACKAGES[@]}"; do\n            IFS=\'|\' read -r file eco pkg_ver <<< "$vuln"\n            local group_key="${eco}:${pkg_ver}"\n            if [ -z "${pkg_files[$group_key]}" ]; then\n                pkg_files[$group_key]="$file"\n            else\n                pkg_files[$group_key]="${pkg_files[$group_key]}|$file"\n            fi\n        done\n\n        # Display grouped results (read line by line: a key may hold spaces\n        # or glob characters, e.g. an SBOM version "1.0 beta")\n        local -a group_keys=()\n        while IFS= read -r pkg; do\n            group_keys+=("$pkg")\n        done < <(printf \'%s\\n\' "${!pkg_files[@]}" | sort -u)\n        for pkg in "${group_keys[@]}"; do\n            # Strip the ecosystem namespace for display (split at FIRST \':\' only).\n            # npm packages print with no prefix (byte-identical to legacy output);\n            # other ecosystems get a "[eco] " label.\n            local disp_eco="${pkg%%:*}"\n            local disp_rest="${pkg#*:}"\n            if [ "$disp_eco" = "npm" ]; then\n                echo -e "${RED}   \u26A0\uFE0F  $disp_rest${NC}"\n            else\n                echo -e "${RED}   \u26A0\uFE0F  [$disp_eco] $disp_rest${NC}"\n            fi\n\n            IFS=\'|\' read -ra files <<< "${pkg_files[$pkg]}"\n            # Called in any location wins; "not called" needs every location.\n            if [ ${#VULN_REACHABILITY[@]} -gt 0 ]; then\n                local reach="not called"\n                for file in "${files[@]}"; do\n                    reachability_of "$file" "$pkg"\n                    case "$REACHABILITY" in\n                        called) reach=called; break ;;\n                        "") reach="" ;;\n                    esac\n                done\n                [ -z "$reach" ] || echo -e "      ${BLUE}Reachability: $reach (govulncheck)${NC}"\n            fi\n            print_advisories "${VULN_ADVISORIES[$pkg]:-}" && echo ""\n\n            for file in "${files[@]}"; do\n                echo -e "${YELLOW}      \u2514\u2500 $file${NC}"\n            done\n        done\n        \n        echo ""\n        echo -e "${YELLOW}\u{1F4A1} Recommendations:${NC}"\n        echo "   \u2022 Update vulnerable packages to patched versions"\n        echo "   \u2022 Run your package manager\'s audit command for more details"\n\n        # Create GitHub issues if requested\n        if [ "$CREATE_GITHUB_ISSUE" = true ]; then\n            echo ""\n            echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n            echo -e "${BLUE}\u{1F4DD} Creating GitHub Issues (1 issue per package)${NC}"\n            echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n            echo ""\n            create_package_issues\n        fi\n\n        # Create a single consolidated GitHub issue per repository if requested\n        if [ "$CREATE_SINGLE_ISSUE" = true ]; then\n            echo ""\n            echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n            echo -e "${BLUE}\u{1F4DD} Creating Single Consolidated GitHub Issue${NC}"\n            echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n            echo ""\n            create_consolidated_issues\n        fi\n    fi\n    if [ ${#RUNTIME_WARNINGS[@]} -gt 0 ]; then\n        echo ""\n        echo -e "${YELLOW}\u26A0\uFE0F  Runtime versions to review (warnings, not counted as findings):${NC}"\n        local runtime_warning\n        for runtime_warning in "${RUNTIME_WARNINGS[@]}"; do\n            echo -e "${YELLOW}   \u2022 $runtime_warning${NC}"\n        done\n    fi\n    echo "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"\n    echo ""\n\n    # Export results if requested (also when empty: see export_vulnerabilities_json)\n    if [ -n "$export_json_file" ]; then\n        echo ""\n        export_vulnerabilities_json "$export_json_file" || exit "$EXIT_ERROR"\n    fi\n\n    if [ -n "$export_csv_file" ]; then\n        echo ""\n        export_vulnerabilities_csv "$export_csv_file" || exit "$EXIT_ERROR"\n    fi\n\n    # An unreadable project file, or an organization repository that could\n    # not be fetched, makes a clean result incomplete.\n    if [ "$FOUND_VULNERABLE" -eq 0 ] && [ "$UNREADABLE_FILE_COUNT" -gt 0 ]; then\n        echo -e "${RED}\u274C Scan incomplete: $UNREADABLE_FILE_COUNT project file(s) could not be read${NC}"\n        exit "$EXIT_ERROR"\n    fi\n    if [ "$FOUND_VULNERABLE" -eq 0 ] && [ "$GITHUB_FAILED_REPOS" -gt 0 ]; then\n        echo -e "${RED}\u274C Scan incomplete: $GITHUB_FAILED_REPOS repository(ies) could not be fetched${NC}"\n        exit "$EXIT_ERROR"\n    fi\n    exit $FOUND_VULNERABLE\n}\n# Run main function only when executed directly (allows `source script.sh` in unit tests)\nif [[ "${BASH_SOURCE[0]:-}" == "$0" || -z "${BASH_SOURCE[0]:-}" ]]; then\n    main "$@"\nfi\n';

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
    out2.push({ ecosystem: "npm", name: m[1], version: m[2].replace(/_.*$/, "") });
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
  for (const m of text.matchAll(/^(\S+)\s+(v\S+)\s+h1:/gm))
    if (!m[2].endsWith("/go.mod")) out2.push({ ecosystem: "go", name: m[1], version: m[2] });
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
  for (const m of text.matchAll(/^ {4}([A-Za-z0-9_.-]+) \(([^)]+)\)$/gm))
    out2.push({
      ecosystem: "rubygems",
      name: m[1],
      version: m[2].replace(/-(x86|x64|arm|aarch|universal|java|mingw|mswin|i386|i686|ppc|s390)[\w-]*$/i, "")
    });
  return uniq(out2);
}

// src/scan/deps.ts
function materializeChecker(dir) {
  mkdirSync6(dir, { recursive: true });
  const p = join7(dir, `package-checker-${PACKAGE_CHECKER_VERSION}.sh`);
  if (!existsSync9(p) || statSync8(p).size !== Buffer.byteLength(PACKAGE_CHECKER_SCRIPT)) writeFileAtomic(p, PACKAGE_CHECKER_SCRIPT);
  return p;
}
function defaultChecker(runner2, workDir) {
  const script = materializeChecker(join7(workDir, "tools"));
  let n = 0;
  return async (dir) => {
    const out2 = join7(workDir, `package-checker-${++n}.json`);
    const res = await runner2(
      "bash",
      [script, dir, "--default-source-ghsa-osv", "--only-lockfiles", "--no-config", "--no-runtime-check", "--export-json", out2],
      {
        timeoutMs: 15 * 6e4,
        cwd: workDir
      }
    );
    if (res.missing) return { ok: false, vulnerabilities: [], error: "bash is not installed" };
    if (res.status !== 0 && res.status !== 1)
      return { ok: false, vulnerabilities: [], error: (res.stderr || res.stdout).trim().split("\n").slice(-1)[0]?.slice(0, 200) };
    if (!existsSync9(out2)) return { ok: res.status === 0, vulnerabilities: [], error: res.status === 0 ? void 0 : "no JSON report written" };
    const json2 = parseJsonOutput({ ok: true, status: 0, stdout: readFileSync11(out2, "utf8"), stderr: "" });
    if (!json2) return { ok: false, vulnerabilities: [], error: "unreadable JSON report" };
    return { ok: true, vulnerabilities: (json2.vulnerabilities ?? []).map((v) => ({ ...v, file: isAbsolute3(v.file) ? v.file : resolve2(workDir, v.file) })) };
  };
}
function checkerGroups(lockfiles, roots) {
  const groups = /* @__PURE__ */ new Set();
  for (const f of lockfiles) {
    const d = dirname(f);
    const root = roots.filter((r) => d === r || d.startsWith(r.endsWith(sep2) ? r : r + sep2)).sort((a, b) => b.length - a.length)[0];
    if (!root) {
      groups.add(d);
      continue;
    }
    const rel = relative(root, d).split(sep2).filter(Boolean);
    groups.add(rel.length ? join7(root, ...rel.slice(0, 2)) : root);
  }
  const list = [...groups].sort();
  return list.filter((g) => !list.some((o) => o !== g && g.startsWith(o + sep2)));
}
async function scanDeps(iocs, tree, run, opts = {}) {
  const result = { surface: "deps", scanned: true, stats: {}, startedAt: (opts.now ?? /* @__PURE__ */ new Date()).toISOString() };
  const findings = [];
  const gaps = [];
  const pkgs = matchers(iocs, "package");
  const where = /* @__PURE__ */ new Map();
  let lockfiles = 0;
  let unreadable = 0;
  const lockfilePaths = /* @__PURE__ */ new Set();
  for (const p of tree.files) {
    if (!lockfileKind(p)) continue;
    let locked;
    try {
      if (statSync8(p).size > 64 * 1024 * 1024) throw new Error("too large");
      locked = parseLockfile(p, readFileSync11(p, "utf8"));
    } catch {
      unreadable++;
      continue;
    }
    lockfiles++;
    lockfilePaths.add(p);
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
  if (tree.capped)
    gaps.push({
      surface: "deps",
      what: `lockfiles past the first ${tree.entries} entries of the walk`,
      why: "the walk is capped",
      fix: "re-run with --roots narrowed to your code folders"
    });
  if (tree.unreadable) gaps.push({ surface: "deps", what: `lockfiles in ${tree.unreadable} unreadable directories`, why: "permission denied" });
  result.stats.packages = where.size;
  if (unreadable) gaps.push({ surface: "deps", what: `${unreadable} lockfiles`, why: "could not be parsed or were over 64 MB" });
  if (opts.checker !== false && lockfiles > 0) {
    const workDir = run ? join7(run.dir, "package-checker") : join7(tmpdir(), `ultraguard-pc-${process.pid}`);
    mkdirSync6(workDir, { recursive: true });
    const checker2 = opts.checker ?? (opts.runner ? defaultChecker(opts.runner, workDir) : void 0);
    if (!checker2) gaps.push({ surface: "deps", what: "the OSV and GHSA advisory feeds", why: "no command runner" });
    else {
      const groups = checkerGroups([...lockfilePaths], opts.roots ?? []);
      const vulns = [];
      let failed = 0;
      for (const g of groups) {
        const r = await checker2(g);
        if (!r.ok) {
          failed++;
          gaps.push({
            surface: "deps",
            what: `advisories for the lockfiles under ${g}`,
            why: `package-checker failed: ${r.error ?? "unknown error"}`,
            fix: "re-run when online"
          });
          continue;
        }
        vulns.push(...r.vulnerabilities);
      }
      const seen = /* @__PURE__ */ new Set();
      const unique = vulns.filter((v) => {
        const k = `${v.file}|${v.ecosystem}|${v.name}|${v.version}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      vulns.length = 0;
      vulns.push(...unique);
      result.stats.checkerRuns = groups.length - failed;
      let malicious = 0;
      const backlog = [];
      for (const v of vulns) {
        const mal = v.advisories.filter((a) => (a.id ?? "").startsWith("MAL-"));
        if (!mal.length) {
          backlog.push(v);
          continue;
        }
        for (const a of mal) {
          malicious++;
          const url = `https://osv.dev/vulnerability/${a.id}`;
          const src = run?.addSource({ url, title: `OSV ${a.id}: malicious package ${v.name}`, fetchedAt: (/* @__PURE__ */ new Date()).toISOString(), origin: "osv" });
          findings.push({
            surface: "deps",
            severity: "compromised",
            subject: v.file,
            title: `${v.file} locks ${v.name}@${v.version}, a malicious package (${a.id})`,
            source: src?.id,
            evidence: { kind: "url", ref: url, excerpt: `${v.ecosystem} ${v.name}@${v.version} (package-checker ${PACKAGE_CHECKER_VERSION})` },
            key: `deps|${v.file}|${v.ecosystem}|${v.name}|${v.version}|${a.id}`
          });
        }
      }
      result.stats.malicious = malicious;
      result.stats.vulnerable = backlog.length;
      if (run)
        run.write("deps-vulnerabilities.json", {
          checker: `package-checker.sh ${PACKAGE_CHECKER_VERSION}`,
          sha256: PACKAGE_CHECKER_SHA256,
          vulnerabilities: vulns
        });
      if (backlog.length) {
        const by = (sev) => backlog.filter((v) => v.severity === sev).length;
        findings.push({
          surface: "deps",
          severity: "info",
          subject: "vulnerable dependencies",
          title: `${backlog.length} locked package versions have known vulnerabilities (${by("critical")} critical, ${by("high")} high): a patching backlog, not a compromise (deps-vulnerabilities.json)`,
          evidence: { kind: "file", ref: "deps-vulnerabilities.json" },
          key: "deps|vulnerable-backlog"
        });
      }
    }
  } else if (opts.checker === false) gaps.push({ surface: "deps", what: "the OSV and GHSA advisory feeds (malicious packages)", why: "--no-osv" });
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
var activityPeriod = (since, now) => {
  const days = (now.getTime() - Date.parse(since)) / 864e5;
  return days <= 1 ? "day" : days <= 7 ? "week" : days <= 31 ? "month" : days <= 92 ? "quarter" : "year";
};
var laterOf = (a, b) => a && b ? a > b ? a : b : a ?? b ?? void 0;
var DOCS_ONLY = /\.(md|mdx|rst|adoc)$|(^|\/)(README|CHANGELOG|LICENSE|NOTICE|AUTHORS)(\.(md|txt|rst))?$/i;
function hit(m, base2) {
  return {
    severity: m.indicator.weak ? "suspicious" : "compromised",
    ...base2,
    campaign: m.campaign.id,
    source: m.indicator.source,
    indicator: { type: m.indicator.type, value: m.indicator.value },
    key: `${base2.surface}|${base2.subject}|${m.indicator.type}:${m.indicator.value}|${base2.evidence.ref}`
  };
}
function firstMatch(ms, value, at) {
  if (!value) return void 0;
  return ms.find((m) => inWindow(m, at) && m.test(value));
}
async function scanGithub(iocs, runner2, opts = {}) {
  const gh = new Gh(runner2);
  const now = opts.now ?? /* @__PURE__ */ new Date();
  const since = windowStart(iocs);
  const sinceDay = since.slice(0, 10);
  const reviewSince = reviewStart(iocs, now);
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
      const m = firstMatch(M.pr, pr.title, pr.created_at);
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
      const m = firstMatch(M.commit, msg, laterOf(c.commit?.author?.date, c.commit?.committer?.date));
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
      const m = firstMatch(M.branch, ref, e.created_at);
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
      const scope = path === "user/keys" ? "read:public_key" : "read:gpg_key";
      accG.push({
        surface: "github:account",
        what: `${label}s added to your account`,
        why: keys.status === 404 || keys.status === 403 ? `the token lacks the ${scope} scope (${keys.error ?? `HTTP ${keys.status}`})` : keys.error ?? `HTTP ${keys.status}`,
        fix: `gh auth refresh -s ${scope}`
      });
      continue;
    }
    accountRes.stats[path === "user/keys" ? "sshKeys" : "gpgKeys"] = keys.data?.length ?? 0;
    for (const k of keys.data ?? []) {
      if (!k.created_at || k.created_at < reviewSince) continue;
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
  let quietGaps = 0;
  const contentCapped = [];
  const rate = await gh.api("rate_limit");
  const remaining = rate.data?.resources?.core?.remaining;
  if (remaining !== void 0 && remaining < repos.length * 6)
    repG.push({
      surface: "github:repos",
      what: "part of the repositories may hit the API rate limit",
      why: `${remaining} REST calls left this hour for ${repos.length} repositories (about 5 each)`,
      fix: "wait for the hourly reset, or narrow with --repos"
    });
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
        const m = firstMatch(M.pr, pr.title, pr.created_at) ?? firstMatch(M.branch, pr.head?.ref, pr.created_at);
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
      const activity = await gh.paged(`repos/${r}/activity?time_period=${activityPeriod(since, now)}`, { maxPages: 3 });
      for (const ev of activity.data ?? []) {
        const name = String(ev.ref ?? "").replace(/^refs\/heads\//, "");
        if (!name || ev.timestamp && ev.timestamp < since) continue;
        const m = firstMatch(M.branch, name, ev.timestamp);
        if (!m) continue;
        const actor = ev.actor?.login;
        add2(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Branch ${name}: ${String(ev.activity_type ?? "activity").replace(/_/g, " ")} by ${actor ?? "?"}`,
            actor,
            scope: scopeOf(actor),
            at: ev.timestamp,
            evidence: {
              kind: "api",
              ref: `repos/${r}/activity?ref=${encodeURIComponent(name)}`,
              excerpt: `${ev.activity_type} ${ev.before ?? ""}..${ev.after ?? ""}`
            }
          })
        );
      }
    }
    const changed = /* @__PURE__ */ new Map();
    const commitOf = (sha) => {
      if (!changed.has(sha))
        changed.set(
          sha,
          gh.api(`repos/${r}/commits/${sha}`).then(
            (d) => d.ok ? {
              files: (d.data?.files ?? []).map((f) => `${f.status} ${f.filename}`),
              author: d.data?.author?.login
            } : void 0
          )
        );
      return changed.get(sha);
    };
    const filesOf = async (sha) => (await commitOf(sha))?.files;
    const onDefault = async (sha) => {
      const cmp = await gh.api(`repos/${r}/compare/${sha}...${repo.default_branch}`);
      return cmp.ok && (cmp.data?.status === "identical" || cmp.data?.status === "ahead");
    };
    const describe = (files) => {
      if (!files) return { text: "" };
      if (files.length && files.every((f) => DOCS_ONLY.test(f.split(" ").slice(1).join(" "))))
        return { text: "; the commit only changes docs (a probe)", kind: "probe" };
      return {
        text: files.length ? `; the commit changes ${files.slice(0, 4).map((f) => f.split(" ").slice(1).join(" ")).join(", ")}${files.length > 4 ? ", ..." : ""}` : "",
        kind: "attacker"
      };
    };
    const describeRun = async (sha, actor) => {
      if (!sha) return { text: "" };
      const c = await commitOf(sha);
      if (c?.author && actor && !/\[bot\]$/i.test(c.author) && c.author.toLowerCase() !== actor.toLowerCase() && await onDefault(sha))
        return { text: `; it ran ${repo.default_branch}'s own code (commit by ${c.author}, no attacker change)`, kind: "own-code" };
      return describe(c?.files);
    };
    if (M.commit.length || M.file.length) {
      const commits = await gh.paged(`repos/${r}/commits?since=${since}`, { maxPages: 3 });
      if (commits.truncated) truncated.push(`${r} commits`);
      for (const c of commits.data ?? []) {
        const msg = firstLine(c.commit?.message);
        const landed = laterOf(c.commit?.author?.date, c.commit?.committer?.date);
        const m = firstMatch(M.commit, msg, landed);
        if (!m) continue;
        const actor = c.author?.login ?? c.commit?.author?.name;
        const files = await filesOf(c.sha);
        const carried = describe(files);
        const excerpt = `sha=${c.sha}${files ? `; ${files.join(", ")}` : ""}`.slice(0, 600);
        add2(
          hit(m, {
            surface: "github:repos",
            subject: r,
            title: `Commit ${String(c.sha).slice(0, 8)} "${msg}" on ${repo.default_branch} by ${actor}${carried.text}`,
            ciRun: carried.kind,
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
      const m = firstMatch(M.branch, run.head_branch, run.created_at) ?? firstMatch(M.commit, firstLine(run.display_title), run.created_at) ?? firstMatch(M.pr, run.display_title, run.created_at);
      if (!m) continue;
      const actor = run.triggering_actor?.login ?? run.actor?.login;
      const carried = await describeRun(run.head_sha, actor);
      add2(
        hit(m, {
          surface: "github:repos",
          subject: r,
          title: `Workflow "${run.name}" ran on ${run.head_branch} ("${firstLine(run.display_title)}"), ${run.conclusion ?? run.status}, triggered by ${actor}${carried.text}`,
          ciRun: carried.kind ?? "attacker",
          actor,
          scope: scopeOf(actor),
          at: run.created_at,
          evidence: { kind: "url", ref: run.html_url, excerpt: `run_id=${run.id} head_sha=${run.head_sha}; gh api repos/${r}/actions/runs/${run.id}` }
        })
      );
    }
    const runGaps = [];
    for (const [id, w] of byWorkflow) {
      const nums = [...new Set(w.numbers)].sort((a, b) => a - b);
      const missing = [];
      for (let i = 1; i < nums.length; i++) for (let n = nums[i - 1] + 1; n < nums[i]; n++) missing.push(n);
      if (!missing.length || runs.truncated || missing.length > nums.length) continue;
      runGaps.push({ id, name: w.name, missing });
    }
    if (M.cache.length) {
      for (const m0 of M.cache) {
        const caches = await gh.paged(`repos/${r}/actions/caches?key=${encodeURIComponent(m0.indicator.value)}`, {
          pick: (b) => b.actions_caches ?? [],
          maxPages: 5
        });
        for (const c of caches.data ?? []) {
          const m = firstMatch(M.cache, c.key);
          if (m)
            add2(
              hit(m, {
                surface: "github:repos",
                subject: r,
                title: `Actions cache "${c.key}"`,
                at: c.created_at,
                evidence: { kind: "api", ref: `repos/${r}/actions/caches?key=${encodeURIComponent(c.key)}` }
              })
            );
        }
      }
    }
    if (M.artifact.length) {
      const arts = await gh.paged(`repos/${r}/actions/artifacts`, { pick: (b) => b.artifacts ?? [], maxPages: 5 });
      for (const a of arts.data ?? []) {
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
      if (wf.data.length > 25) contentCapped.push(`${r} (${wf.data.length} workflow files)`);
      for (const f of wf.data.slice(0, 25)) {
        const body = await gh.api(`repos/${r}/contents/${String(f.path).split("/").map(encodeURIComponent).join("/")}`);
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
          if (!it.created_at || it.created_at < reviewSince) continue;
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
    if (runGaps.length && repF.some((f) => f.subject === r && f.severity === "compromised")) {
      for (const g of runGaps)
        add2({
          surface: "github:repos",
          severity: "suspicious",
          subject: r,
          title: `Workflow "${g.name}" is missing ${g.missing.length} run(s) in the window (#${g.missing.slice(0, 5).join(", #")}${g.missing.length > 5 ? ", ..." : ""}): deleted runs`,
          evidence: { kind: "api", ref: `repos/${r}/actions/workflows/${g.id}/runs` },
          key: `github:repos|${r}|run-gap|${g.id}|${g.missing.join(",")}`
        });
    } else if (runGaps.length) quietGaps++;
  });
  for (const f of repF) {
    const m = f.actor ? firstMatch(M.actor, f.actor) : void 0;
    if (m && !f.title.includes("(named compromised")) f.title += ` (named compromised by ${m.indicator.source})`;
  }
  if (quietGaps)
    repG.push({
      surface: "github:repos",
      what: `missing workflow run numbers in ${quietGaps} repositories with no IOC match`,
      why: "not reported as findings: alone they are usually retention or re-runs"
    });
  if (gh.rateLimited)
    for (const g of [accG, repG])
      g.push({
        surface: g === accG ? "github:account" : "github:repos",
        what: `${gh.rateLimited} GitHub API calls`,
        why: "the API rate limit refused them: what they would have read was not checked",
        fix: "re-run scan github after the hourly reset (gh api rate_limit)"
      });
  reposRes.stats.inactiveSkipped = inactive;
  reposRes.stats.apiCalls = gh.calls;
  if (inactive)
    repG.push({
      surface: "github:repos",
      what: `${inactive} repositories with no push since ${sinceDay}`,
      why: "only their pull requests were checked; their branches, commits and files cannot have changed without a push, but scheduled or manual runs, caches, artifacts, webhooks and deploy keys were not read"
    });
  if (contentCapped.length)
    repG.push({
      surface: "github:repos",
      what: `workflow files past the first 25 in ${contentCapped.join(", ")}`,
      why: "their contents were not read for string, IP, domain or URL indicators"
    });
  if (noAdmin)
    repG.push({ surface: "github:repos", what: `webhooks and deploy keys of ${noAdmin} repositories`, why: "they need admin rights on the repository" });
  if (truncated.length) repG.push({ surface: "github:repos", what: truncated.join("; "), why: "more than 300 items in the window: the oldest were not read" });
  const handled = /* @__PURE__ */ new Set(["user/keys", "user/gpg_keys", "user", "rate_limit"]);
  const failed = gh.failures.filter((f) => !handled.has(f.path) && !/rate limit/i.test(f.error ?? ""));
  for (const [surface, list] of [
    ["github:account", failed.filter((f) => !/^(repos\/|user\/repos)/.test(f.path))],
    ["github:repos", failed.filter((f) => /^(repos\/|user\/repos)/.test(f.path))]
  ]) {
    if (!list.length) continue;
    const byStatus = /* @__PURE__ */ new Map();
    for (const f of list) byStatus.set(f.status, (byStatus.get(f.status) ?? 0) + 1);
    const where = [...new Set(list.map((f) => f.path.split("?")[0]?.split("/").slice(0, 3).join("/")))].slice(0, 6);
    (surface === "github:account" ? accG : repG).push({
      surface,
      what: `${list.length} GitHub API read(s) that failed (${[...byStatus].map(([st, n]) => `${n}x ${st ? `HTTP ${st}` : "error"}`).join(", ")}), e.g. ${where.join(", ")}`,
      why: `what they would have read was not checked: ${list[0]?.error ?? ""}`.slice(0, 300),
      fix: "check the token's scopes and permissions (gh auth status), then re-run scan github"
    });
  }
  const cut = gh.truncated.filter((p) => !/actions\/runs|\/commits\?/.test(p));
  if (cut.length)
    (cut.some((p) => p.startsWith("repos/") || p.startsWith("user/repos")) ? repG : accG).push({
      surface: cut.some((p) => p.startsWith("repos/") || p.startsWith("user/repos")) ? "github:repos" : "github:account",
      what: `${cut.length} list(s) cut by the page cap: ${cut.slice(0, 5).map((p) => p.split("?")[0]).join(", ")}`,
      why: "their oldest items were not read"
    });
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
import { createHash as createHash3 } from "crypto";
import { existsSync as existsSync12, readdirSync as readdirSync9, readFileSync as readFileSync14, statSync as statSync11 } from "fs";
import { homedir as homedir3, platform, tmpdir as tmpdir4 } from "os";
import { basename as basename6, join as join14 } from "path";

// src/scan/agents.ts
import { existsSync as existsSync11, readdirSync as readdirSync8, readFileSync as readFileSync13, statSync as statSync10 } from "fs";
import { basename as basename5, join as join13 } from "path";

// src/scan/hostintel.ts
import { existsSync as existsSync10, readdirSync as readdirSync7, readFileSync as readFileSync12, statSync as statSync9 } from "fs";
import { basename as basename4, join as join12 } from "path";
var STRONG = [
  [/\b(curl|wget)\b[^|;\n]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i, "downloads and runs a script"],
  [/\b(curl|wget)\b[^\n]*(-o|--output|>)\s*\S*\s*(&&|;)\s*(chmod|\.\/|sh|bash|zsh|python|node)/i, "downloads then executes a file"],
  [/\/dev\/(tcp|udp)\//, "opens a raw network socket (reverse shell pattern)"],
  [/base64\s+(-d|-D|--decode)[^\n]*\|\s*(ba|z)?sh\b|\becho\s+[A-Za-z0-9+/=]{40,}\s*\|\s*base64/i, "decodes and runs an encoded payload"],
  [/\b(python3?|perl|ruby|node)\s+-(c|e)\s+['"][^'"]*(socket|exec|eval|child_process|subprocess)/i, "runs inline interpreter code that spawns or connects"],
  [/\bosascript\s+-e\b[^\n]*(do shell script|password)/i, "AppleScript that runs shell code or asks for a password"]
];
var TEMP_PATH = /^(\/tmp\/|\/private\/tmp\/|\/var\/tmp\/|\/private\/var\/tmp\/|\/dev\/shm\/|\/Users\/Shared\/)/;
var KNOWN_HIDDEN = /* @__PURE__ */ new Set([
  ".nvm",
  ".volta",
  ".local",
  ".cargo",
  ".rustup",
  ".bun",
  ".deno",
  ".pyenv",
  ".rbenv",
  ".asdf",
  ".sdkman",
  ".vscode",
  ".vscode-insiders",
  ".cursor",
  ".windsurf",
  ".docker",
  ".orbstack",
  ".colima",
  ".rd",
  ".config",
  ".npm",
  ".pnpm",
  ".yarn",
  ".fnm",
  ".gem",
  ".go",
  ".foundry",
  ".claude",
  ".codex",
  ".agents",
  ".lima",
  ".ollama",
  ".dotnet",
  ".jenv",
  ".nix-profile",
  ".oh-my-zsh",
  ".antigen",
  ".zinit",
  ".tmux",
  ".gradle",
  ".m2"
]);
function riskSignals(rawCommand, executable, home, opts = {}) {
  const command2 = rawCommand.length > 4e3 ? rawCommand.slice(0, 4e3) : rawCommand;
  const out2 = [];
  for (const [re, label] of STRONG) if (re.test(command2)) out2.push(label);
  for (const p of opts.location === false ? [] : [executable, ...command2.split(/\s+/)].filter(Boolean)) {
    if (TEMP_PATH.test(p)) {
      out2.push(`runs from a temporary or shared folder (${p})`);
      break;
    }
    if (p.startsWith(`${home}/.`)) {
      const top = p.slice(home.length + 1).split("/")[0] ?? "";
      if (!KNOWN_HIDDEN.has(top)) {
        out2.push(`runs from a hidden folder of your home (${p})`);
        break;
      }
    }
  }
  return [...new Set(out2)];
}
function startupCommand(text) {
  const args = /<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(text)?.[1];
  if (args) {
    const parts = [...args.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => decodeXml2(m[1] ?? ""));
    const program2 = /<key>Program<\/key>\s*<string>([^<]+)<\/string>/.exec(text)?.[1];
    const shellC = parts.length >= 3 && /\/(ba|z|da)?sh$/.test(parts[0] ?? "") && parts[1] === "-c";
    const executable = program2 ?? (shellC ? (parts[2] ?? "").trim().split(/\s+/)[0]?.replace(/^["']|["']$/g, "") : parts[0]);
    return { command: parts.join(" "), executable };
  }
  const program = /<key>Program<\/key>\s*<string>([^<]+)<\/string>/.exec(text)?.[1];
  if (program) return { command: decodeXml2(program), executable: decodeXml2(program) };
  const exec = /^ExecStart=[-@+!:]*(.*)$/m.exec(text)?.[1] ?? /^Exec=(.*)$/m.exec(text)?.[1];
  if (exec) return { command: exec.trim(), executable: exec.trim().split(/\s+/)[0] };
  return { command: "" };
}
function decodeXml2(s) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
async function signerOf(runner2, executable) {
  const res = await runner2("codesign", ["-dv", "--verbose=2", executable], { timeoutMs: 15e3 });
  if (res.missing) return void 0;
  const text = `${res.stderr}
${res.stdout}`;
  if (/not signed at all|code object is not signed/i.test(text)) return { signed: false };
  if (!res.ok && !/Authority=|Signature=adhoc/.test(text)) return void 0;
  const authority = /^Authority=(.+)$/m.exec(text)?.[1]?.trim();
  const team = /^TeamIdentifier=(.+)$/m.exec(text)?.[1]?.trim();
  if (/Signature=adhoc/.test(text)) return { signed: false, signer: "ad-hoc signature (no identity)" };
  return { signed: true, signer: authority, team: team && team !== "not set" ? team : void 0 };
}
var SHELL_STARTUP = [".zshrc", ".zprofile", ".zshenv", ".zlogin", ".bashrc", ".bash_profile", ".profile", ".config/fish/config.fish"];
var SHELL_RISK = [
  ...STRONG,
  [/\b(DYLD_INSERT_LIBRARIES|LD_PRELOAD)\s*=/, "injects a library into every program"],
  [/\bNODE_OPTIONS\s*=.*--(require|import|loader)\b/, "makes every Node.js process load a module"],
  [/\bPYTHONSTARTUP\s*=|\bPERL5OPT\s*=|\bRUBYOPT\s*=.*-r/, "makes every interpreter load a file"],
  [/^\s*alias\s+(sudo|ssh|git|gh|npm|su|passwd)=/, "redefines a security-sensitive command"],
  [/^\s*(function\s+)?(sudo|ssh|git|gh)\s*\(\)/, "redefines a security-sensitive command"],
  [/\bexport\s+PATH=["']?(\/tmp|\/private\/tmp|\/Users\/Shared)/, "puts a temporary folder first in PATH"]
];
function shellStartupFindings(home) {
  const findings = [];
  const lines = [];
  for (const rel of SHELL_STARTUP) {
    const p = join12(home, rel);
    let text;
    try {
      if (statSync9(p).size > 2 * 1024 * 1024) continue;
      text = readFileSync12(p, "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((rawLine, i) => {
      const line = rawLine.length > 4e3 ? rawLine.slice(0, 4e3) : rawLine;
      if (/^\s*#/.test(line)) return;
      for (const [re, signal] of SHELL_RISK) {
        if (!re.test(line)) continue;
        lines.push({ path: p, line: i + 1, signal, text: line.trim().slice(0, 200) });
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `${basename4(p)} line ${i + 1} ${signal}`,
          evidence: { kind: "file", ref: `${p}:${i + 1}`, excerpt: line.trim().slice(0, 200) },
          key: `host|${p}|${i + 1}|${signal}`
        });
        break;
      }
    });
  }
  return { findings, lines };
}
function readSmall(p) {
  try {
    if (statSync9(p).size > 1024 * 1024) return void 0;
    return readFileSync12(p, "utf8");
  } catch {
    return void 0;
  }
}
function configFindings(home, reviewSinceMs) {
  const out2 = [];
  const add2 = (p, title, excerpt, line) => out2.push({
    surface: "host",
    severity: "suspicious",
    subject: p,
    title,
    evidence: { kind: "file", ref: line ? `${p}:${line}` : p, excerpt },
    key: `host|${p}|${title}`
  });
  const lineOf = (text, re) => text.split("\n").findIndex((l) => re.test(l)) + 1;
  const npmrc = readSmall(join12(home, ".npmrc"));
  const reg = npmrc ? /^\s*registry\s*=\s*(\S+)/m.exec(npmrc)?.[1] : void 0;
  if (npmrc && reg && !/^https:\/\/registry\.(npmjs\.org|yarnpkg\.com)\/?$/.test(reg))
    add2(join12(home, ".npmrc"), `~/.npmrc sends every npm install to another registry: ${reg}`, `registry=${reg}`, lineOf(npmrc, /^\s*registry\s*=/));
  for (const pip of [join12(home, ".pip/pip.conf"), join12(home, ".config/pip/pip.conf"), join12(home, "Library/Application Support/pip/pip.conf")]) {
    const text = readSmall(pip);
    const idx = text ? /^\s*index-url\s*=\s*(\S+)/m.exec(text)?.[1] : void 0;
    if (text && idx && !/^https:\/\/pypi\.org\/simple\/?$/.test(idx))
      add2(pip, `pip installs from another index: ${idx}`, `index-url = ${idx}`, lineOf(text, /index-url/));
  }
  const gitconfig = readSmall(join12(home, ".gitconfig"));
  if (gitconfig) {
    const hooks = /^\s*hooksPath\s*=\s*(.+)$/m.exec(gitconfig)?.[1]?.trim();
    if (hooks) {
      const dir = hooks.replace(/^~(?=\/)/, home);
      let recent = [];
      try {
        recent = readdirSync7(dir).filter((f) => statSync9(join12(dir, f)).mtimeMs >= reviewSinceMs);
      } catch {
      }
      add2(
        join12(home, ".gitconfig"),
        `git runs global hooks from ${hooks} in every repository${recent.length ? `; changed recently: ${recent.join(", ")}` : ""}`,
        `hooksPath = ${hooks}`,
        lineOf(gitconfig, /hooksPath/)
      );
    }
    const sshCmd = /^\s*sshCommand\s*=\s*(.+)$/m.exec(gitconfig)?.[1]?.trim();
    if (sshCmd && !/^ssh(\s|$)/.test(sshCmd))
      add2(join12(home, ".gitconfig"), `git runs a custom SSH command: ${sshCmd}`, sshCmd, lineOf(gitconfig, /sshCommand/));
  }
  const ak = join12(home, ".ssh/authorized_keys");
  try {
    const st = statSync9(ak);
    if (st.mtimeMs >= reviewSinceMs) {
      const keys = (readSmall(ak) ?? "").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
      const comments = keys.map((k) => k.trim().split(/\s+/).slice(2).join(" ") || "(no comment)");
      out2.push({
        surface: "host",
        severity: "suspicious",
        subject: ak,
        title: `~/.ssh/authorized_keys changed recently: ${keys.length} key(s) can log in to this machine (${comments.join(", ").slice(0, 120)})`,
        at: st.mtime.toISOString(),
        evidence: { kind: "file", ref: ak },
        key: `host|${ak}|recent`
      });
    }
  } catch {
  }
  return out2;
}
function recentExtensions(home, reviewSinceMs) {
  const findings = [];
  const list = [];
  for (const rel of [".vscode/extensions", ".vscode-insiders/extensions", ".cursor/extensions", ".windsurf/extensions", ".vscode-oss/extensions"]) {
    const dir = join12(home, rel);
    const editor = rel.split("/")[0]?.replace(/^\./, "") ?? rel;
    const manifest = readSmall(join12(dir, "extensions.json")) ?? (() => {
      try {
        return readFileSync12(join12(dir, "extensions.json"), "utf8");
      } catch {
        return void 0;
      }
    })();
    let entries = [];
    if (manifest) {
      try {
        entries = JSON.parse(manifest).map((e) => ({
          id: e.identifier?.id,
          version: e.version,
          path: e.location?.path ?? join12(dir, e.relativeLocation ?? ""),
          installed: e.metadata?.installedTimestamp,
          updated: e.metadata?.updated,
          source: e.metadata?.source,
          publisher: e.metadata?.publisherDisplayName
        }));
      } catch {
      }
    } else {
      let names = [];
      try {
        names = readdirSync7(dir);
      } catch {
        continue;
      }
      for (const name of names) {
        if (name.startsWith(".") || !/-\d+\.\d+\.\d+/.test(name)) continue;
        try {
          const st = statSync9(join12(dir, name));
          if (st.isDirectory()) entries.push({ id: name.replace(/-\d+\.\d+\.\d+.*$/, ""), version: "", path: join12(dir, name), installed: st.birthtimeMs });
        } catch {
        }
      }
    }
    for (const e of entries) {
      if (!e.id || !e.installed || e.installed < reviewSinceMs || e.updated) continue;
      const installed2 = new Date(e.installed).toISOString();
      list.push({ path: e.path, id: e.id, installed: installed2 });
      const sideloaded = e.source === "vsix";
      findings.push({
        surface: "host",
        severity: "suspicious",
        subject: e.path,
        title: `Editor extension ${e.id}${e.version ? `@${e.version}` : ""} was newly installed in ${editor}${e.publisher ? ` (publisher: ${e.publisher})` : ""}${sideloaded ? ", from a .vsix file, not the Marketplace" : ""}: check it is the one you meant`,
        at: installed2,
        evidence: { kind: "file", ref: e.path },
        key: `host|${e.path}|new-ext`
      });
    }
  }
  return { findings, list };
}
async function processFindings(runner2, home, os = process.platform) {
  const ps = await runner2("ps", os === "darwin" ? ["-axo", "pid=,comm="] : ["-eo", "pid=,args="], { timeoutMs: 1e4 });
  if (!ps.ok) return [];
  const out2 = [];
  for (const line of ps.stdout.split("\n")) {
    const m = os === "darwin" ? /^\s*(\d+)\s+(\/.+)$/.exec(line) : /^\s*(\d+)\s+(\/\S+)/.exec(line);
    if (!m) continue;
    const exe = m[2];
    const signals = riskSignals("", exe, home);
    if (!signals.length) continue;
    out2.push({
      surface: "host",
      severity: "suspicious",
      subject: exe,
      title: `Running process ${basename4(exe)} (pid ${m[1]}) ${signals[0]}`,
      evidence: { kind: "command", ref: "ps -axo pid=,comm=", excerpt: line.trim() },
      key: `host|process|${exe}`
    });
  }
  return out2;
}
function credentialInventory(home, envFiles) {
  const out2 = [];
  const has = (rel, kind, test) => {
    const p = join12(home, rel);
    if (!existsSync10(p)) return;
    if (test) {
      const text = readSmall(p);
      if (!text || !test.test(text)) return;
    }
    out2.push({ path: p, kind });
  };
  has(".aws/credentials", "AWS access keys");
  has(".aws/sso/cache", "AWS SSO tokens");
  has(".config/gcloud/credentials.db", "Google Cloud credentials");
  has(".config/gcloud/application_default_credentials.json", "Google Cloud application credentials");
  has(".azure/msal_token_cache.json", "Azure tokens");
  has(".azure/accessTokens.json", "Azure tokens");
  has(".npmrc", "npm publish token", /_authToken\s*=/);
  has(".yarnrc.yml", "yarn registry token", /npmAuthToken/);
  has(".pypirc", "PyPI upload token", /password\s*=|token/i);
  has(".cargo/credentials.toml", "crates.io token");
  has(".gem/credentials", "RubyGems key");
  has(".docker/config.json", "Docker registry logins", /"auths"\s*:\s*\{\s*"/);
  has(".kube/config", "Kubernetes credentials");
  has(".config/gh/hosts.yml", "GitHub CLI token", /oauth_token|user:/);
  has(".git-credentials", "git HTTPS credentials (plain text)");
  has(".netrc", "netrc logins (plain text)");
  has(".vault-token", "HashiCorp Vault token");
  has(".terraform.d/credentials.tfrc.json", "Terraform Cloud token");
  try {
    for (const f of readdirSync7(join12(home, ".ssh"))) {
      if (/^id_[a-z0-9]+$/.test(f) || /\.pem$/.test(f)) out2.push({ path: join12(home, ".ssh", f), kind: "SSH private key" });
    }
  } catch {
  }
  if (existsSync10(join12(home, ".gnupg/private-keys-v1.d"))) out2.push({ path: join12(home, ".gnupg"), kind: "GPG private keys" });
  for (const p of envFiles.slice(0, 200)) out2.push({ path: p, kind: ".env file (project secrets)" });
  return out2;
}
function npmCacheHits(home, pkgs) {
  const dir = join12(home, ".npm/_cacache/index-v5");
  if (!pkgs.length || !existsSync10(dir)) return [];
  const wanted = pkgs.map((p) => ({ ...p, base: p.name.split("/").pop() }));
  const out2 = [];
  const stack = [dir];
  let files = 0;
  while (stack.length && files < 2e5) {
    const d = stack.pop();
    let names = [];
    try {
      names = readdirSync7(d);
    } catch {
      continue;
    }
    for (const n of names) {
      const p = join12(d, n);
      let st;
      try {
        st = statSync9(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        stack.push(p);
        continue;
      }
      files++;
      if (st.size > 4 * 1024 * 1024) continue;
      let text;
      try {
        text = readFileSync12(p, "utf8");
      } catch {
        continue;
      }
      if (!text.includes(".tgz")) continue;
      for (const w of wanted) {
        if (!text.includes(`/-/${w.base}-`)) continue;
        for (const line of text.split("\n")) {
          const m = /"key":"[^"]*?(https:\/\/[^"]+\/-\/([^"/]+)-(\d[^"/]*)\.tgz)"/.exec(line);
          if (!m || m[2] !== w.base) continue;
          const url = decodeURIComponent(m[1]);
          if (!url.includes(`/${w.name}/-/`) && !url.includes(`/${w.name.replace("/", "%2f")}/-/`)) continue;
          const version = m[3];
          if (w.versions?.length && !w.versions.some((v) => v.replace(/^v/, "") === version)) continue;
          const time = /"time":(\d+)/.exec(line)?.[1];
          const at = time ? new Date(Number(time)).toISOString() : void 0;
          out2.push({
            surface: "host",
            severity: "exposed",
            subject: "~/.npm/_cacache",
            title: `npm downloaded ${w.name}@${version}${at ? ` on ${at.slice(0, 16).replace("T", " ")}` : ""}, named by the campaign: its install scripts likely ran on this machine`,
            at,
            campaign: w.campaign,
            source: w.source,
            indicator: { type: "package", value: w.value },
            evidence: { kind: "file", ref: p, excerpt: url },
            key: `host|npm-cache|${w.name}|${version}`
          });
        }
      }
    }
  }
  return out2;
}
var INTERPRETERS = /^(sh|bash|zsh|dash|ksh|fish|python[\d.]*|node|perl|ruby|osascript|deno|bun)$/;
function interpretedScript(command2, executable, home) {
  const parts = command2.split(/\s+/).filter(Boolean);
  const exe = basename4(executable ?? parts[0] ?? "");
  if (!INTERPRETERS.test(exe)) return { signals: [] };
  const script = parts.slice(1).find((a) => a.startsWith("/") && existsSync10(a) && statSync9(a).isFile());
  if (!script) return { signals: [] };
  let text = "";
  try {
    if (statSync9(script).size <= 256 * 1024) text = readFileSync12(script, "utf8");
  } catch {
  }
  const signals = new Set(riskSignals("", script, home).map((s) => `its script ${s}`));
  for (const l of text.split("\n").slice(0, 5e3))
    if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, void 0, home)) signals.add(`its script ${basename4(script)} ${s}`);
  return { script, signals: [...signals] };
}
var HOOK_MANAGERS = /husky|lefthook|pre-commit|overcommit|git-lfs|simple-git-hooks|yorkie|lint-staged/;
function gitHookFindings(clones, home, reviewSinceMs) {
  const out2 = [];
  for (const repo of clones) {
    const dir = join12(repo, ".git/hooks");
    let names = [];
    try {
      names = readdirSync7(dir);
    } catch {
      continue;
    }
    for (const n of names) {
      if (n.endsWith(".sample")) continue;
      const p = join12(dir, n);
      let st;
      let text = "";
      try {
        st = statSync9(p);
        if (!st.isFile()) continue;
        if (st.size <= 256 * 1024) text = readFileSync12(p, "utf8");
      } catch {
        continue;
      }
      const signals = /* @__PURE__ */ new Set();
      for (const l of text.split("\n").slice(0, 5e3)) if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, void 0, home)) signals.add(s);
      const managed = HOOK_MANAGERS.test(text);
      const recent = st.mtimeMs >= reviewSinceMs;
      if (!signals.size && (managed || !recent)) continue;
      out2.push({
        surface: "host",
        severity: "suspicious",
        subject: p,
        title: `Git hook ${n} in ${repo}${signals.size ? ` ${[...signals].join("; ")}` : " was written recently and is not from a known hook manager"}: it runs on every ${n.replace(/^(pre|post)-/, "")}`,
        at: st.mtime.toISOString(),
        evidence: { kind: "file", ref: p },
        key: `host|git-hook|${p}`
      });
    }
  }
  return out2;
}

// src/scan/agents.ts
var MAX = 2 * 1024 * 1024;
function readJson3(p) {
  try {
    if (statSync10(p).size > MAX) return void 0;
    const text = readFileSync13(p, "utf8");
    try {
      return JSON.parse(text);
    } catch {
      return JSON.parse(text.replace(/^\s*\/\/.*$/gm, "").replace(/,(\s*[}\]])/g, "$1"));
    }
  } catch {
    return void 0;
  }
}
function readText(p) {
  try {
    if (statSync10(p).size > MAX) return void 0;
    return readFileSync13(p, "utf8");
  } catch {
    return void 0;
  }
}
function agentConfigPaths(home) {
  return [
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".claude.json",
    ".cursor/mcp.json",
    ".cursor/hooks.json",
    ".codex/config.toml",
    ".gemini/settings.json",
    ".codeium/windsurf/mcp_config.json",
    "Library/Application Support/Claude/claude_desktop_config.json",
    ".config/Claude/claude_desktop_config.json",
    "Library/Application Support/Code/User/mcp.json",
    "Library/Application Support/Code/User/settings.json",
    ".config/Code/User/mcp.json",
    ".config/Code/User/settings.json"
  ].map((r) => join13(home, r)).filter((p) => existsSync11(p));
}
function projectConfigPaths(repo) {
  return [
    ".mcp.json",
    ".claude/settings.json",
    ".claude/settings.local.json",
    ".cursor/mcp.json",
    ".cursor/hooks.json",
    ".vscode/mcp.json",
    ".gemini/settings.json"
  ].map((r) => join13(repo, r)).filter((p) => existsSync11(p));
}
function launcherPackage(command2, args = []) {
  const cmd = basename5(command2 ?? "");
  let rest = args;
  let eco;
  if (cmd === "npx" || cmd === "bunx") eco = "npm";
  else if ((cmd === "pnpm" || cmd === "yarn") && args[0] === "dlx") {
    eco = "npm";
    rest = args.slice(1);
  } else if (cmd === "uvx" || cmd === "pipx") {
    eco = "pypi";
    if (cmd === "pipx" && args[0] === "run") rest = args.slice(1);
  } else if (cmd === "uv" && args[0] === "tool" && args[1] === "run") {
    eco = "pypi";
    rest = args.slice(2);
  }
  if (!eco) return void 0;
  const spec = rest.find((a) => !a.startsWith("-"));
  if (!spec) return void 0;
  if (eco === "npm") {
    const m2 = /^(@[^/@]+\/[^@]+|[^@]+)(?:@(.+))?$/.exec(spec);
    return m2 ? { ecosystem: eco, name: m2[1], version: m2[2] && /^\d/.test(m2[2]) ? m2[2] : void 0 } : void 0;
  }
  const m = /^([A-Za-z0-9_.-]+)(?:==(.+))?/.exec(spec);
  return m ? { ecosystem: eco, name: m[1], version: m[2] } : void 0;
}
function configCommands(j) {
  const out2 = [];
  const hooks = j?.hooks;
  if (hooks && typeof hooks === "object") {
    for (const [event, list] of Object.entries(hooks))
      for (const entry of Array.isArray(list) ? list : [])
        for (const h of Array.isArray(entry?.hooks) ? entry.hooks : [entry])
          if (typeof h?.command === "string") out2.push({ where: `hook ${event}`, command: h.command });
  }
  if (typeof j?.statusLine?.command === "string") out2.push({ where: "statusLine", command: j.statusLine.command });
  if (typeof j?.apiKeyHelper === "string") out2.push({ where: "apiKeyHelper", command: j.apiKeyHelper });
  if (typeof j?.awsAuthRefresh === "string") out2.push({ where: "awsAuthRefresh", command: j.awsAuthRefresh });
  return out2;
}
function mcpFrom(j, config) {
  const out2 = [];
  const add2 = (servers) => {
    if (!servers || typeof servers !== "object") return;
    for (const [name, s] of Object.entries(servers)) {
      if (!s || typeof s !== "object") continue;
      const args = Array.isArray(s.args) ? s.args.map(String) : [];
      out2.push({ config, name, command: s.command, args, url: s.url ?? s.serverUrl, package: launcherPackage(s.command, args) });
    }
  };
  add2(j?.mcpServers);
  add2(j?.servers);
  add2(j?.mcp?.servers);
  for (const p of Object.values(j?.projects ?? {})) add2(p?.mcpServers);
  return out2;
}
function mcpFromToml(text, config) {
  const out2 = [];
  for (const block of text.split(/^\[mcp_servers\./m).slice(1)) {
    const name = /^([^\]]+)\]/.exec(block)?.[1]?.replace(/^"|"$/g, "") ?? "?";
    if (!/^"/.test(/^([^\]]+)\]/.exec(block)?.[1] ?? "") && name.includes(".")) continue;
    const command2 = /^\s*command\s*=\s*"([^"]*)"/m.exec(block)?.[1];
    const argsRaw = /^\s*args\s*=\s*\[([^\]]*)\]/m.exec(block)?.[1] ?? "";
    const args = [...argsRaw.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    const url = /^\s*url\s*=\s*"([^"]*)"/m.exec(block)?.[1];
    out2.push({ config, name, command: command2, args, url, package: launcherPackage(command2, args) });
  }
  return out2;
}
var BASE_URL_KEYS = /^(ANTHROPIC_BASE_URL|ANTHROPIC_BEDROCK_BASE_URL|OPENAI_BASE_URL|OPENAI_API_BASE|GOOGLE_GEMINI_BASE_URL|GEMINI_BASE_URL)$/;
var VENDOR_HOST = /^https:\/\/([a-z0-9-]+\.)*(anthropic\.com|openai\.com|googleapis\.com|azure\.com|amazonaws\.com)(\/|$)/i;
var INVISIBLE2 = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/u;
var INSTRUCTION_FILES = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursorrules", ".windsurfrules", ".github/copilot-instructions.md"];
function scanAgents(home, clones, m) {
  const findings = [];
  const inventory = { configs: [], commands: [], mcpServers: [] };
  const configs = [...agentConfigPaths(home), ...clones.flatMap(projectConfigPaths)];
  const add2 = (f) => findings.push({ surface: "host", ...f });
  for (const p of configs) {
    inventory.configs.push(p);
    const isToml = p.endsWith(".toml");
    const text = readText(p) ?? "";
    const j = isToml ? void 0 : readJson3(p);
    const ioc = m.content.find((x) => x.test(text));
    if (ioc)
      add2({
        severity: "compromised",
        subject: p,
        title: `AI agent config ${p} contains "${ioc.indicator.value}"`,
        campaign: ioc.campaign.id,
        source: ioc.indicator.source,
        indicator: { type: ioc.indicator.type, value: ioc.indicator.value },
        evidence: { kind: "file", ref: p },
        key: `host|agent|${p}|${ioc.indicator.value}`
      });
    for (const c of j ? configCommands(j) : []) {
      inventory.commands.push({ config: p, ...c });
      const script = c.command.trim().split(/\s+/).find((t) => t.startsWith("/") || t.startsWith("~/"));
      const signals = [
        .../* @__PURE__ */ new Set([...riskSignals(c.command, void 0, home, { location: false }), ...scriptSignals(script?.replace(/^~(?=\/)/, home), home)])
      ];
      if (signals.length)
        add2({
          severity: "suspicious",
          subject: p,
          title: `AI agent ${c.where} in ${p} ${signals.join("; ")}: ${c.command.slice(0, 160)}`,
          evidence: { kind: "file", ref: p, excerpt: c.command.slice(0, 300) },
          key: `host|agent-cmd|${p}|${c.where}|${c.command.slice(0, 80)}`
        });
    }
    const env2 = j?.env && typeof j.env === "object" ? j.env : {};
    for (const [k, v] of Object.entries(env2))
      if (BASE_URL_KEYS.test(k) && typeof v === "string" && !VENDOR_HOST.test(v))
        add2({
          severity: "suspicious",
          subject: p,
          title: `AI agent config ${p} sends ${k} to ${v}: prompts, code and keys go there; check you set it`,
          evidence: { kind: "file", ref: p, excerpt: `${k}=${v}` },
          key: `host|agent-baseurl|${p}|${k}`
        });
    const servers = isToml ? mcpFromToml(text, p) : j ? mcpFrom(j, p) : [];
    for (const s of servers) {
      inventory.mcpServers.push(s);
      const line = [s.command, ...s.args ?? []].filter(Boolean).join(" ");
      const signals = line ? riskSignals(line, s.command, home) : [];
      const pkgHit = s.package ? m.pkg.find((x) => packageHit(x.indicator, s.package.ecosystem, s.package.name, s.package.version ?? x.indicator.versions?.[0] ?? "")) : void 0;
      if (pkgHit)
        add2({
          severity: s.package?.version ? "compromised" : "exposed",
          subject: p,
          title: `MCP server "${s.name}" in ${p} runs ${s.package?.name}${s.package?.version ? `@${s.package.version}` : " (unpinned: the latest version at each start)"}, named by the campaign`,
          campaign: pkgHit.campaign.id,
          source: pkgHit.indicator.source,
          indicator: { type: "package", value: pkgHit.indicator.value },
          evidence: { kind: "file", ref: p, excerpt: line.slice(0, 300) },
          key: `host|mcp-ioc|${p}|${s.name}`
        });
      else if (signals.length)
        add2({
          severity: "suspicious",
          subject: p,
          title: `MCP server "${s.name}" in ${p} ${signals.join("; ")}: ${line.slice(0, 160)}`,
          evidence: { kind: "file", ref: p, excerpt: line.slice(0, 300) },
          key: `host|mcp-risk|${p}|${s.name}`
        });
    }
  }
  const unpinned = [...new Map(inventory.mcpServers.filter((s) => s.package && !s.package.version).map((s) => [s.package?.name, s])).values()];
  if (unpinned.length)
    add2({
      severity: "info",
      subject: "MCP servers",
      title: `${unpinned.length} MCP server(s) start an unpinned registry package at every launch (${unpinned.slice(0, 5).map((s) => s.package?.name).join(", ")}${unpinned.length > 5 ? ", ..." : ""}): a compromised release would run without any install step; pin a version`,
      evidence: { kind: "file", ref: "host-inventory.json" },
      key: "host|mcp-unpinned"
    });
  let instructionFiles = 0;
  const dirs = [join13(home, ".claude"), ...clones];
  for (const d of dirs) {
    const files = [...INSTRUCTION_FILES.map((f) => join13(d, f)), ...ruleFiles(join13(d, ".cursor/rules"))];
    for (const p of files) {
      const text = existsSync11(p) ? readText(p) : void 0;
      if (text === void 0) continue;
      instructionFiles++;
      const lines = text.split("\n");
      const ln = lines.findIndex((l, i) => INVISIBLE2.test(i === 0 ? l.replace(/^\uFEFF/, "") : l));
      if (ln < 0) continue;
      const count = [...text.matchAll(new RegExp(INVISIBLE2.source, "gu"))].length;
      add2({
        severity: "suspicious",
        subject: p,
        title: `Agent instruction file ${p} holds ${count} invisible character(s) (zero-width, bidi or tag characters), a known prompt-injection trick: read it with a hex viewer`,
        evidence: { kind: "file", ref: `${p}:${ln + 1}` },
        key: `host|invisible|${p}`
      });
    }
  }
  return { findings, inventory, instructionFiles };
}
function scriptSignals(path, home) {
  if (!path) return [];
  const text = readText(path);
  if (!text) return [];
  const out2 = /* @__PURE__ */ new Set();
  for (const l of text.split("\n").slice(0, 5e3))
    if (l.trim() && !/^\s*#/.test(l)) for (const s of riskSignals(l, void 0, home, { location: false })) out2.add(`its script ${basename5(path)} ${s}`);
  return [...out2];
}
function ruleFiles(dir) {
  try {
    return readdirSync8(dir).filter((f) => /\.(mdc|md)$/.test(f)).slice(0, 200).map((f) => join13(dir, f));
  } catch {
    return [];
  }
}

// src/scan/host.ts
var hasControlChar = (s) => [...s].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);
var MAX_HASH_BYTES = 50 * 1024 * 1024;
function sha256File(p) {
  try {
    if (statSync11(p).size > MAX_HASH_BYTES) return void 0;
    return createHash3("sha256").update(readFileSync14(p)).digest("hex");
  } catch {
    return void 0;
  }
}
function readText2(p, max = 2 * 1024 * 1024) {
  try {
    if (statSync11(p).size > max) return void 0;
    return readFileSync14(p, "utf8");
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
  if (os === "darwin") return [join14(home, "Library/LaunchAgents"), "/Library/LaunchAgents", "/Library/LaunchDaemons"];
  return [join14(home, ".config/systemd/user"), join14(home, ".config/autostart"), "/etc/systemd/system", "/etc/cron.d", "/etc/xdg/autostart"];
}
async function scanHost(iocs, tree, runner2, opts = {}) {
  const home = opts.home ?? homedir3();
  const os = opts.platform ?? platform();
  const sinceMs = Date.parse(reviewStart(iocs, opts.now));
  const result = { surface: "host", scanned: true, stats: {}, startedAt: (opts.now ?? /* @__PURE__ */ new Date()).toISOString() };
  const findings = [];
  const gaps = [];
  const inventory = { startupItems: [], credentials: [], recentExtensions: [], shellStartup: [] };
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
    const campaignHashes = M.hash.filter((h) => h.campaign.id === m.campaign.id).length;
    const exactName = !/[*?]/.test(m.indicator.value) && !m.indicator.regex;
    const nameOnly = !hashHit && (!!m.indicator.weak || exactName && campaignHashes > 0);
    findings.push(
      hitOf(hashHit ?? m, {
        subject: p,
        severity: nameOnly ? "suspicious" : "compromised",
        title: hashHit ? `File ${p} matches the sha256` : nameOnly ? `File ${p} is named like "${m.indicator.value}"${m.indicator.weak ? " (a common name)" : ""}${campaignHashes ? `, but its sha256 matches none of the campaign's ${campaignHashes} hash(es)` : ""}` : `File ${p} matches "${m.indicator.value}"`,
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
  let oddNames = 0;
  for (const p of tree.files) {
    if (!hasControlChar(basename6(p)) || basename6(p) === "Icon\r" || oddNames >= 50) continue;
    oddNames++;
    findings.push({
      surface: "host",
      severity: "suspicious",
      subject: p,
      title: `File name with a control character (line break or similar), a trick to hide from tools: ${JSON.stringify(basename6(p))} in ${p.slice(0, p.length - basename6(p).length)}`,
      evidence: { kind: "file", ref: JSON.stringify(p) },
      key: `host|odd-name|${p}`
    });
  }
  for (const dir of tree.vscodeDirs) {
    const p = join14(dir, "tasks.json");
    const text = existsSync12(p) ? readText2(p) : void 0;
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
      names = readdirSync9(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const p = join14(dir, name);
      let st;
      try {
        st = statSync11(p);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      startupCount++;
      let text = readText2(p) ?? "";
      if (text.startsWith("bplist") && os === "darwin" && !opts.skipLive) {
        const xml = await runner2("plutil", ["-convert", "xml1", "-o", "-", p], { timeoutMs: 1e4 });
        if (xml.ok) text = xml.stdout;
      }
      const m = M.content.find((x) => x.test(text)) ?? (hashes.size ? hashes.get(sha256File(p) ?? "") : void 0);
      const { command: command2, executable } = startupCommand(text);
      const item = { path: p, mtime: st.mtime.toISOString(), command: command2, executable, signals: riskSignals(command2, executable, home) };
      if (!command2) {
        for (const l of text.split("\n").slice(0, 2e3)) if (l.trim() && !/^\s*#/.test(l)) item.signals.push(...riskSignals(l, void 0, home));
      }
      const interp = interpretedScript(command2, executable, home);
      if (interp.script) item.script = interp.script;
      item.signals = [.../* @__PURE__ */ new Set([...item.signals, ...interp.signals])];
      if (executable?.startsWith("/")) {
        item.exists = existsSync12(executable);
        if (!item.exists) item.signals.push("points to a program that no longer exists");
        else if (os === "darwin" && !opts.skipLive) {
          const sig = await signerOf(runner2, executable);
          if (!sig) item.signer = "unreadable (codesign could not read it, often a root-only helper)";
          else {
            item.signed = sig.signed;
            item.signer = sig.signer;
            item.team = sig.team;
            if (!sig.signed) item.signals.push(`is not signed by any developer${sig.signer ? ` (${sig.signer})` : ""}`);
          }
        }
      }
      const label = /<key>Label<\/key>\s*<string>([^<]+)<\/string>/.exec(text)?.[1] ?? name.replace(/\.plist$/, "");
      if (/^com\.apple\./i.test(label) && !(item.signer ?? "").startsWith("Software Signing") && !/^\/(System|usr\/libexec|usr\/sbin)\//.test(executable ?? ""))
        item.signals.unshift(`is named like an Apple service (${label}) but is not Apple's`);
      inventory.startupItems.push(item);
      const recent = st.mtimeMs >= sinceMs;
      const facts = [
        command2 ? `runs ${command2.slice(0, 160)}` : "no program found",
        item.signer ? `signed by ${item.signer}${item.team ? ` (team ${item.team})` : ""}` : void 0,
        ...item.signals
      ].filter(Boolean);
      const strong = item.signals.some((s) => !s.startsWith("points to") && !s.startsWith("is not signed"));
      if (m)
        findings.push(
          hitOf(m, {
            subject: p,
            title: `Startup item ${p} contains "${m.indicator.value}"`,
            at: item.mtime,
            evidence: { kind: "file", ref: p, excerpt: command2 }
          })
        );
      else if (strong || recent)
        findings.push({
          surface: "host",
          severity: "suspicious",
          subject: p,
          title: `${strong ? "Risky startup item" : "Startup item"} ${basename6(p)}${recent ? " was written recently" : ""}: ${facts.join("; ")}`,
          at: item.mtime,
          evidence: { kind: "file", ref: p, excerpt: command2.slice(0, 300) },
          key: `host|${p}|startup`
        });
    }
  }
  result.stats.startupItems = startupCount;
  const agents = scanAgents(home, tree.gitDirs, { content: M.content, pkg: matchers(iocs, "package") });
  findings.push(...agents.findings);
  inventory.agents = agents.inventory;
  result.stats.agentConfigs = agents.inventory.configs.length;
  result.stats.mcpServers = agents.inventory.mcpServers.length;
  findings.push(...gitHookFindings(tree.gitDirs, home, sinceMs));
  const npmPkgs = matchers(iocs, "package").filter((x) => (x.indicator.ecosystem ?? "").toLowerCase() === "npm").map((x) => ({ name: x.indicator.value, versions: x.indicator.versions, source: x.indicator.source, campaign: x.campaign.id, value: x.indicator.value }));
  findings.push(...npmCacheHits(home, npmPkgs));
  const rc = shellStartupFindings(home);
  findings.push(...rc.findings);
  inventory.shellStartup = rc.lines;
  findings.push(...configFindings(home, sinceMs));
  const traces = [".zsh_history", ".bash_history", ".local/share/fish/fish_history", ".python_history", ...SHELL_STARTUP].map((f) => join14(home, f));
  traces.push("/etc/hosts");
  for (const p of traces) {
    const text = existsSync12(p) ? readText2(p, 20 * 1024 * 1024) : void 0;
    if (!text) continue;
    const lines = text.split("\n");
    for (const m of M.content) {
      const ln = lines.findIndex((l) => m.test(l));
      if (ln < 0) continue;
      findings.push(
        hitOf(m, {
          subject: p,
          // In history it was typed (maybe while investigating); in a startup file or /etc/hosts it is wired in.
          severity: /_history$/.test(p) ? "exposed" : "compromised",
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
    (d) => join14(home, d)
  )) {
    let names = [];
    try {
      names = readdirSync9(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const mm = /^(.+?)-(\d+\.\d+\.\d+)(-.+)?$/.exec(name);
      if (!mm) continue;
      extensions++;
      const [, id, version] = mm;
      const m = M.pkg.find(
        (x) => x.indicator.value.toLowerCase() === id.toLowerCase() && (!x.indicator.versions?.length || x.indicator.versions.some((v) => v.replace(/^v/, "") === version || v === `${version}${mm[3] ?? ""}`))
      );
      if (m)
        findings.push(
          hitOf(m, { subject: join14(dir, name), title: `Editor extension ${id}@${version} is installed`, evidence: { kind: "file", ref: join14(dir, name) } })
        );
    }
  }
  result.stats.extensions = extensions;
  const ext = recentExtensions(home, sinceMs);
  findings.push(...ext.findings);
  inventory.recentExtensions = ext.list;
  if (opts.hitRepos?.length) {
    const wanted = new Set(opts.hitRepos.map((r) => r.toLowerCase()));
    for (const dir of tree.gitDirs) {
      const cfg = readText2(join14(dir, ".git/config")) ?? "";
      const urls = [...cfg.matchAll(/url\s*=\s*(\S+)/g)].map((x) => x[1] ?? "");
      const repo = urls.map((u) => /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(u)?.[1]?.toLowerCase()).find((r) => r && wanted.has(r));
      if (!repo) continue;
      let fetched;
      try {
        fetched = statSync11(join14(dir, ".git/FETCH_HEAD")).mtime.toISOString();
      } catch {
      }
      findings.push({
        surface: "host",
        severity: "exposed",
        subject: dir,
        title: `Local clone of ${repo}, a repository the GitHub scan found hit${fetched ? ` (last fetch ${fetched})` : ""}`,
        at: fetched,
        evidence: { kind: "file", ref: join14(dir, ".git/config") },
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
      lines.forEach((l, i) => {
        if (/^\s*#/.test(l) || !l.trim()) return;
        const signals = riskSignals(l, void 0, home);
        if (signals.length)
          findings.push({
            surface: "host",
            severity: "suspicious",
            subject: "crontab",
            title: `crontab line ${i + 1} ${signals.join("; ")}`,
            evidence: { kind: "command", ref: "crontab -l", excerpt: l.slice(0, 200) },
            key: `host|crontab|${i + 1}`
          });
      });
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
    findings.push(...await processFindings(runner2, home, os));
  } else gaps.push({ surface: "host", what: "crontab, open connections, processes and code signatures", why: "live checks were skipped" });
  inventory.credentials = credentialInventory(
    home,
    tree.files.filter((f) => /^\.env(\.[\w-]+)?$/.test(basename6(f)) && !/\.(example|sample|template|dist)$/.test(f))
  );
  if (inventory.credentials.length) {
    const kinds = [...new Set(inventory.credentials.map((c) => c.kind))];
    findings.push({
      surface: "host",
      severity: "info",
      subject: "credentials",
      title: `Credentials a stealer on this machine would take: ${kinds.join(", ")} (${inventory.credentials.length} files, listed in host-inventory.json)`,
      evidence: { kind: "file", ref: "host-inventory.json" },
      key: "host|credentials"
    });
  }
  result.stats.credentialFiles = inventory.credentials.length;
  const listDir = opts.listDir ?? tmpdir4();
  const flagged2 = findings.map((f) => f.subject).filter((s) => s.startsWith("/"));
  if (!opts.skipLive && opts.av !== "off") {
    const av = await antivirusPass(runner2, {
      home,
      inventory,
      flagged: flagged2,
      sinceMs,
      listDir,
      now: opts.now,
      full: opts.av === "full" ? opts.roots ?? [home] : void 0
    });
    findings.push(...av.findings);
    gaps.push(...av.gaps);
    Object.assign(result.stats, av.stats);
  } else if (opts.av === "off") gaps.push({ surface: "host", what: "the antivirus pass", why: "--no-av" });
  const full = opts.av === "full";
  const yaraTargets = () => full ? opts.roots ?? [home] : avTargets(home, inventory, flagged2, sinceMs);
  if (opts.yara) {
    const y = await yaraPass(runner2, { rules: opts.yara, targets: yaraTargets(), recursive: full, listDir, source: opts.yaraSource });
    findings.push(...y.findings);
    gaps.push(...y.gaps);
    Object.assign(result.stats, y.stats);
  }
  if (opts.community && !opts.skipLive) {
    const c = opts.community;
    const y = await yaraPass(runner2, {
      rules: c.compiled ?? c.source,
      compiled: !!c.compiled,
      community: true,
      label: c.label,
      targets: yaraTargets(),
      recursive: full,
      listDir,
      source: c.sourceId
    });
    findings.push(...y.findings);
    gaps.push(...y.gaps);
    Object.assign(result.stats, y.stats);
    if (c.ageDays > 14)
      gaps.push({
        surface: "host",
        what: `threats newer than the ${c.label} rules`,
        why: `the rules are ${c.ageDays} days old`,
        fix: "ultraguard rules update"
      });
  } else if (opts.communityMissing && !opts.skipLive)
    gaps.push({
      surface: "host",
      what: "community YARA rules (thousands of malware and hacking-tool families)",
      why: "not installed",
      fix: "ultraguard rules update (needs yara; yarac makes scans faster)"
    });
  gaps.push({
    surface: "host",
    what: "login items registered in System Settings, browser extensions, kernel and system extensions",
    why: "not read: the background task database needs an admin (sfltool dumpbtm), and browsers keep extensions per profile",
    fix: "System Settings > General > Login Items; each browser's extensions page"
  });
  const pruned = Object.entries(tree.pruned ?? {}).sort((a, b) => b[1] - a[1]);
  gaps.push({
    surface: "host",
    what: `files outside the scanned roots${pruned.length ? `, and inside skipped folders: ${pruned.slice(0, 8).map(([n, c]) => `${n} (${c})`).join(", ")}` : ""}`,
    why: "the walk is bounded: package folders, caches and system libraries are skipped for speed",
    fix: "pass --roots and --depth to widen it; scan a skipped folder with --roots <it>"
  });
  result.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  return { result, findings, gaps, inventory };
}

// src/scan/walk.ts
import { lstatSync, readdirSync as readdirSync10 } from "fs";
import { join as join15 } from "path";
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
  const out2 = { files: [], gitDirs: [], vscodeDirs: [], entries: 0, capped: false, unreadable: 0, pruned: {} };
  const stack = roots.map((dir) => ({ dir, depth: 0 }));
  while (stack.length) {
    const { dir, depth } = stack.pop();
    let names;
    try {
      names = readdirSync10(dir);
    } catch {
      out2.unreadable++;
      continue;
    }
    for (const name of names) {
      if (++out2.entries > maxEntries) {
        out2.capped = true;
        return out2;
      }
      const p = join15(dir, name);
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
        if (PRUNE.has(name)) {
          out2.pruned[name] = (out2.pruned[name] ?? 0) + 1;
          continue;
        }
        if (depth + 1 > maxDepth) {
          out2.pruned["(deeper than --depth)"] = (out2.pruned["(deeper than --depth)"] ?? 0) + 1;
          continue;
        }
        stack.push({ dir: p, depth: depth + 1 });
      } else if (st.isFile()) out2.files.push(p);
    }
  }
  return out2;
}

// src/version.ts
var VERSION = "1.4.0";

// src/watch.ts
import { mkdirSync as mkdirSync7 } from "fs";
import { homedir as homedir4 } from "os";
import { join as join16 } from "path";
var EXIT_ALERT = 10;
var EXIT_INCOMPLETE = 20;
function stateDir(flag) {
  return flag ?? env("HOME") ?? join16(homedir4(), ".ultraguard");
}
function loadState(dir) {
  mkdirSync7(dir, { recursive: true });
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
  const findingsNow = run.findings();
  const incompleteNow = verdicts(findingsNow, run.gaps(), run.surfaces()).some((v) => v.verdict === "UNKNOWN");
  const handled = new Map(state.handled.map((h) => [safeCanonical(h.url), h]));
  if (!incompleteNow) {
    for (const s of sources) if (s.origin === "web" && !s.error) handled.set(safeCanonical(s.url), { url: s.url, at: now.toISOString() });
  }
  const findings = run.findings();
  const alerted = new Set(state.alerted);
  const newFindings = findings.filter((f) => f.severity !== "info" && !alerted.has(f.key));
  for (const f of newFindings) alerted.add(f.key);
  const vs = verdicts(findings, run.gaps(), run.surfaces());
  const incomplete = vs.some((v) => v.verdict === "UNKNOWN");
  const alert = newFindings.length > 0;
  const next = {
    handled: [...handled.values()],
    campaigns: [...byId.values()],
    alerted: [...alerted],
    lastSweep: now.toISOString(),
    lastFullSweep: !incompleteNow && (plan?.resweep || !state.lastFullSweep) ? now.toISOString() : state.lastFullSweep
  };
  store.write("state.json", next);
  const lines = alert ? newFindings.map(
    (f) => `${f.severity === "suspicious" ? "REVIEW" : "ALERT"}: ${f.campaign ?? (f.surface === "deps" ? "malicious package" : f.severity === "suspicious" ? "machine analysis" : "no campaign")} \u2192 ${f.surface} ${f.severity.toUpperCase()}: ${f.title} [${f.id}]`
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
  ultraguard rules update [--set core|extended|full] [--state <dir>]
  ultraguard rules status [--state <dir>]
  ultraguard search <query> --out <run> [--limit <n>]
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
  1. You search the web for attacks: with your own search tool (save the hits
     as JSON), or with search, keyless, into <run>/search-hits.json.
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
  --skip-live           host: skip crontab, open connections, processes, signatures, antivirus
  --no-av               host: skip the ClamAV pass (on by default when ClamAV is installed)
  --av-full             host: ClamAV over every root instead of the targeted list (slow)
  --yara <rules>        host: also run YARA rules (a .yar file or a folder of them)
  --yara-source <S#>    host: the source the YARA rules came from, cited by their findings
  --no-rules            host: skip the community YARA rules (YARA-Forge) installed by rules update
  --set <name>          rules update: core (default, highest precision), extended or full
  --no-osv              deps: skip package-checker (OSV and GHSA feeds, malicious packages)
  --surfaces <list>     sweep: github,host,deps,cloud (default: all)
  --limit <n>           search: hits to aim for (default 10)

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
var COMMANDS = ["doctor", "rules", "search", "intel", "ioc", "scan", "sweep", "report", "check", "watch"];
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
  "notify-issue",
  "limit",
  "yara",
  "yara-source",
  "set"
];
var BOOL_FLAGS = ["json", "probe", "skip-live", "no-osv", "no-av", "av-full", "no-rules"];
var SCAN = [
  "out",
  "repos",
  "max-repos",
  "concurrency",
  "roots",
  "depth",
  "skip-live",
  "no-osv",
  "no-av",
  "av-full",
  "yara",
  "yara-source",
  "no-rules",
  "state",
  "json"
];
var SPEC = {
  commands: COMMANDS,
  valueFlags: VALUE_FLAGS,
  boolFlags: BOOL_FLAGS,
  commandFlags: {
    doctor: ["probe", "state", "json"],
    rules: ["set", "state", "json"],
    search: ["out", "limit", "json"],
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
  const raw = run.iocs();
  if (!raw) throw new UsageError(`no iocs.json in ${run.dir}: run \`ultraguard ioc set --file <iocs.json> --out ${run.dir}\` first`);
  const { iocs, problems } = validateIocs(raw, run.sources());
  if (!iocs)
    throw new UsageError(
      `iocs.json in ${run.dir} does not validate (${problems.length} problem(s), first: ${problems[0]?.path}: ${problems[0]?.message}); fix it and run ioc set again`
    );
  return iocs;
}
function walkFor(a) {
  const roots = argList(a, "roots").map((r) => resolve4(r.replace(/^~(?=$|\/)/, homedir5())));
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
    const roots = argList(a, "roots").map((r3) => resolve4(r3.replace(/^~(?=$|\/)/, homedir5())));
    const r2 = await scanHost(iocs, (tree ?? (() => walkFor(a)))(), runner, {
      hitRepos: run.meta().hitRepos,
      skipLive: argBool(a, "skip-live"),
      av: argBool(a, "no-av") ? "off" : argBool(a, "av-full") ? "full" : "targeted",
      roots: roots.length ? roots : void 0,
      yara: argValue(a, "yara"),
      yaraSource: argValue(a, "yara-source"),
      listDir: run.dir,
      ...communityRules(a, run)
    });
    const f2 = run.recordSurface(r2.result, r2.findings, r2.gaps);
    run.write("host-inventory.json", r2.inventory);
    return `host: ${r2.result.stats.files ?? 0} files, ${r2.result.stats.startupItems ?? 0} startup items, ${r2.result.stats.credentialFiles ?? 0} credential files; ${f2.length} finding(s)`;
  }
  if (surface === "deps") {
    const roots = argList(a, "roots").map((r3) => resolve4(r3.replace(/^~(?=$|\/)/, homedir5())));
    const r2 = await scanDeps(iocs, (tree ?? (() => walkFor(a)))(), run, {
      checker: argBool(a, "no-osv") ? false : void 0,
      runner,
      roots: roots.length ? roots : [homedir5()]
    });
    const f2 = run.recordSurface(r2.result, r2.findings, r2.gaps);
    return `deps: ${r2.result.stats.lockfiles ?? 0} lockfiles, ${r2.result.stats.packages ?? 0} packages, ${r2.result.stats.malicious ?? 0} malicious, ${r2.result.stats.vulnerable ?? 0} with known CVEs; ${f2.length} finding(s)`;
  }
  const r = await scanCloud(iocs, runner);
  const f = run.recordSurface(r.result, r.findings, r.gaps);
  return `cloud: ${r.result.scanned ? "scanned" : "no logged-in CLI"}; ${f.length} finding(s)`;
}
function communityRules(a, run) {
  if (argBool(a, "no-rules")) return {};
  const meta = installedRules(stateDir(argValue(a, "state")));
  if (!meta) return { communityMissing: true };
  const src = run.addSource({
    url: meta.url,
    title: `YARA-Forge ${meta.set} rules ${meta.tag} (${meta.rules} rules)`,
    fetchedAt: meta.fetchedAt,
    origin: "rules"
  });
  return { community: { source: meta.source, compiled: meta.compiled, label: `YARA-Forge ${meta.set}`, sourceId: src.id, ageDays: rulesAgeDays(meta) } };
}
var SURFACE_OF = { github: ["github:account", "github:repos"], host: ["host"], deps: ["deps"], cloud: ["cloud"] };
async function dispatch(a) {
  const json2 = argBool(a, "json");
  switch (a.command) {
    case "rules": {
      const sub = a.positional[0];
      const dir = stateDir(argValue(a, "state"));
      if (sub === "status") {
        const meta2 = installedRules(dir);
        out(
          json2 ? jsonLine(meta2 ?? null) : meta2 ? `YARA-Forge ${meta2.set} ${meta2.tag}: ${meta2.rules} rules, ${rulesAgeDays(meta2)} days old, ${meta2.compiled ? "compiled" : "not compiled (install yarac for faster scans)"}
${meta2.source}` : "no community rules installed: ultraguard rules update"
        );
        return meta2 ? EXIT_OK : EXIT_FAILURE;
      }
      if (sub !== "update") throw new UsageError("rules takes `update [--set core|extended|full]` or `status`");
      const set = argValue(a, "set") ?? "core";
      if (!RULE_SETS.includes(set)) throw new UsageError(`--set takes ${RULE_SETS.join(", ")}, not "${set}"`);
      const meta = await updateRules(dir, set, runner);
      out(
        json2 ? jsonLine(meta) : `YARA-Forge ${meta.set} ${meta.tag}: ${meta.rules} rules (sha256 ${meta.sha256.slice(0, 16)}...), ${meta.compiled ? "compiled with yarac" : "not compiled: yarac missing, scans will parse the rules each time"}
${meta.source}`
      );
      return EXIT_OK;
    }
    case "doctor": {
      const lines = await doctor(runner, { probe: argBool(a, "probe"), state: stateDir(argValue(a, "state")) });
      out(json2 ? jsonLine(lines) : formatDoctor(lines));
      return lines.find((l) => l.check === "gh" && !l.ok) ? EXIT_FAILURE : EXIT_OK;
    }
    case "search": {
      const run = needRun(a);
      const query = a.positional.join(" ").trim();
      if (!query) throw new UsageError('search needs a query: ultraguard search "malicious npm packages november 2026" --out <run>');
      const r = await searchInto(run, query, { limit: argInt(a, "limit", { min: 1, max: 50 }) });
      if (json2) out(jsonLine(r));
      else {
        for (const h of r.added) out(`- ${h.title ?? ""} <${h.url}>${h.snippet ? `
    ${h.snippet}` : ""}`);
        if (!r.searched)
          out(
            "search could not reach any engine (the keyless engines refused or throttled this address). Retry in a few minutes, use your own web search tool, or point ULTRAGUARD_SEARXNG at a SearXNG instance."
          );
        out(
          `
${r.added.length} new hit(s), ${r.total} in ${run.path("search-hits.json")}. Keep the primary write-ups, then: ultraguard intel --web-results <that file, trimmed> --out ${run.dir}`
        );
      }
      return r.searched ? EXIT_OK : EXIT_FAILURE;
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
Next: read each source, then write ${run.path("iocs.json")} (start from ${run.path("iocs.todo.json")}: one campaign per ATTACK, so merge the sources that describe the same one), then \`ultraguard ioc set --file ${run.path("iocs.json")} --out ${run.dir}\`.`
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
          json2 ? jsonLine(iocs2) : iocs2.campaigns.map(
            (c) => [
              `${c.id}: ${c.title} (since ${c.since}${c.until ? `, until ${c.until}` : ""}, ${c.indicators.length} indicators) ${c.sources.map((s) => `[${s}]`).join("")}`,
              ...c.indicators.map(
                (i) => `  ${i.type.padEnd(20)} ${i.ecosystem ? `${i.ecosystem}:` : ""}${i.value}${i.versions?.length ? `@${i.versions.join(",")}` : ""}${i.regex ? " (regex)" : ""}${i.weak ? " (weak)" : ""} [${i.source}]`
              )
            ].join("\n")
          ).join("\n\n")
        );
        return EXIT_OK;
      }
      if (sub !== "set") throw new UsageError("ioc takes `set --file <iocs.json>` or `show`");
      const file = argValue(a, "file");
      const own = file ? JSON.parse(readFileSync15(file, "utf8")).campaigns : [];
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
      const ORDER2 = ["github", "host", "deps", "cloud"];
      const list = ORDER2.filter((s) => !wanted.length || wanted.includes(s));
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
      const problems = checkAnswer(run, readFileSync15(file, "utf8"));
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
