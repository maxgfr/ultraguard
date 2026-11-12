// The vendored engine, configured for this skill.
//
// Everything in src/ reaches the engine through THIS module, never through
// src/vendor/ directly. That is the whole point: you cannot obtain an engine
// function without first importing the module that configures it, so there is
// no ordering hazard to remember and no entry point that can forget — a new CLI
// command, a new MCP handler and a test all get a configured engine for free.
//
// The engine reads `ULTRAGUARD_*` at CALL time, so every variable a user has
// already exported keeps working. `cli` names this tool inside engine-emitted
// notes, and `contactUrl` goes into the polite User-Agent rate-limited APIs
// see — it must identify ultraguard, not the shared engine underneath.
import { configure } from "./vendor/webindex-engine.mjs";

configure({
  name: "ultraguard",
  envPrefix: "ULTRAGUARD",
  cli: "ultraguard",
  contactUrl: "https://github.com/maxgfr/ultraguard",
});

export * from "./vendor/webindex-engine.mjs";
