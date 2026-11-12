// Every external command goes through a Runner, so a test replays recorded
// output instead of calling gh, lsof or aws on the developer's machine.
import { type ShResult, shAsync } from "./engine.js";

export type Runner = (cmd: string, args: string[], opts?: { timeoutMs?: number; cwd?: string }) => Promise<ShResult>;

export const defaultRunner: Runner = (cmd, args, opts) => shAsync(cmd, args, { timeoutMs: opts?.timeoutMs ?? 60_000, cwd: opts?.cwd });

/** Parse a command's stdout as JSON, or undefined when it failed or is not JSON. */
export function parseJsonOutput<T>(res: ShResult): T | undefined {
  if (!res.ok) return undefined;
  try {
    return JSON.parse(res.stdout) as T;
  } catch {
    return undefined;
  }
}
