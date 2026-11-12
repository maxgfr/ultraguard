// A run directory holds every fact of one investigation as JSON. Commands read
// and append to it, so `intel`, the scans, `report` and `check` agree on one
// register of sources [S#] and findings [F#].
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeFileAtomic } from "./engine.js";
import type { Finding, Gap, IocFile, Source, Surface, SurfaceResult } from "./types.js";

export class Run {
  readonly dir: string;
  constructor(dir: string) {
    this.dir = resolve(dir);
    mkdirSync(this.dir, { recursive: true });
  }

  path(name: string): string {
    return join(this.dir, name);
  }

  read<T>(name: string, fallback: T): T {
    const p = this.path(name);
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, "utf8")) as T;
  }

  write(name: string, value: unknown): void {
    writeFileAtomic(this.path(name), `${JSON.stringify(value, null, 2)}\n`);
  }

  writeText(name: string, text: string): void {
    writeFileAtomic(this.path(name), text);
  }

  sources(): Source[] {
    return this.read<Source[]>("sources.json", []);
  }

  addSource(s: Omit<Source, "id">): Source {
    const all = this.sources();
    const existing = all.find((x) => x.url === s.url);
    if (existing && !existing.error) {
      // Same page: keep its id, record what is new (the text file intel wrote).
      if (s.file && existing.file !== s.file) {
        const merged = { ...existing, file: s.file };
        this.write(
          "sources.json",
          all.map((x) => (x.id === existing.id ? merged : x)),
        );
        return merged;
      }
      return existing;
    }
    const id = existing?.id ?? `S${all.length + 1}`;
    const src: Source = { id, ...s };
    const next = existing ? all.map((x) => (x.id === id ? src : x)) : [...all, src];
    this.write("sources.json", next);
    return src;
  }

  iocs(): IocFile | undefined {
    return this.read<IocFile | undefined>("iocs.json", undefined);
  }

  findings(): Finding[] {
    return this.read<Finding[]>("findings.json", []);
  }

  gaps(): Gap[] {
    return this.read<Gap[]>("gaps.json", []);
  }

  surfaces(): SurfaceResult[] {
    return this.read<SurfaceResult[]>("surfaces.json", []);
  }

  meta(): RunMeta {
    return this.read<RunMeta>("meta.json", {});
  }

  setMeta(patch: Partial<RunMeta>): void {
    this.write("meta.json", { ...this.meta(), ...patch });
  }

  /** Replace everything one surface reported: a re-scan supersedes the last one. */
  recordSurface(result: SurfaceResult, found: Omit<Finding, "id">[], gaps: Gap[]): Finding[] {
    const kept = this.findings().filter((f) => f.surface !== result.surface && !found.some((n) => n.key === f.key));
    let n = kept.reduce((max, f) => Math.max(max, Number(f.id.slice(1)) || 0), 0);
    const seen = new Set<string>();
    const added: Finding[] = [];
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
}

export interface RunMeta {
  /** The GitHub login the scan ran as. */
  login?: string;
  /** Repositories the GitHub scan found hit, for the host scan's clone check. */
  hitRepos?: string[];
  createdAt?: string;
}

export function surfaceList(raw: string[] | undefined, all: readonly Surface[]): Surface[] {
  if (!raw || raw.length === 0) return [...all];
  return raw as Surface[];
}
