---
status: accepted
---

# The shared script session is one persistent Deno process

## Decision

A props-resolution session (`deno.createSession` → `denoCodeSandbox.createScriptSession`) is **one long-lived Deno process**, not a spawn per evaluation. Step outputs are pushed into the child's heap once as globals, and each `{{ }}` expression that needs the sandbox is then evaluated in that same process. The engine drives it over the child's stdin/stdout with newline-delimited JSON: `{kind:"set",key,value,id}` installs a global, `{kind:"run",script,id}` evaluates an expression, and the child answers on stdout with a line prefixed by a per-session random marker (`MARKER{"id","success",...}`). Anything unmarked on stdout is the script's own console output.

## Context

Since 0.92, any `{{ }}` token that isn't a plain property path evaluates in Deno. The previous "session" spawned a fresh Deno process on every `run()` and `JSON.stringify`'d the **entire accumulated** script context into it. Because sibling expressions in one step resolve concurrently and the context grows as tokens reference more steps — and inputs resolve twice (resolved + censored) — a step mapping many columns over a large list made dozens of full copies of the data through the engine heap, causing `MEMORY_ISSUE` and OOMKills (Pylon #6216 / SRE-239).

## Why

Serialize each step output across the process boundary **once per session** instead of once per expression. Deno's own machine-mode REPL (`deno repl --json`, the engine behind `@deno/sandbox`) has this exact shape but was unusable: it returns results as display strings (`String(object)`, not values — structured output is the still-open denoland/deno#30470), its transport is a Unix socketpair on fd 3 that Node can't cleanly hand a non-Node child, and it is Unix-only and undocumented. An in-child TCP/socket RPC server was rejected because it would need `--allow-net`/`--allow-read`, breaking the zero-permission posture that keeps user expressions from reaching localhost services — stdin/stdout needs no grant and only the parent holds the pipe ends.

## Consequences

The sandbox interface (`run` / `setGlobal` / `dispose`) is unchanged, so callers are untouched. The process runs with the same empty permission set and 128 MB V8 cap as the old per-run spawns. State now persists within a session: a script that mutates step data, pollutes a built-in, or leaves background work affects later expressions **in the same resolve()** — but only within that one flow's own input resolution, and the default noOp sandbox already shares mutable context the same way (Deno is actually safer: it mutates only its in-child copy, never the engine's live step view). If the child dies mid-session the sandbox respawns and replays the globals before the next run, preserving the old per-spawn isolation across runs.

## Gotchas

(The child program's own mechanics — ESM scope isolation, the bound `console.log` reply channel, the `(0, eval)` paren trick, the hand-rolled line loop — are documented inline on `buildSessionProgram` in `deno.ts`.)

**The session timeout is a no-progress watchdog, not a per-command deadline.** Sibling expressions are sent concurrently (`applyFunctionToValues` uses `Promise.all`) but the child runs them one at a time, so a command can sit queued behind slower ones. A per-command timer counted that queue-wait and could kill a healthy session; instead a single timer fires only when the child produces **no reply at all** for `idleTimeoutMs` (default 30s), reset on every reply. On trip it SIGKILLs the child and the next run respawns — so a wedged event loop or corrupted reply channel can never hold the engine, while a long queue of progressing commands is never killed.

**Globals are sent once under concurrency via an in-flight promise.** `sentGlobals` holds, per key, the value sent **and the promise of that send**, so concurrent `syncGlobals` callers await the one transfer instead of each re-serializing the step output. A new value (different reference) supersedes it with a fresh send; a failed send is dropped so the next run retries rather than treating a never-arrived global as present. Record-after-await alone is wrong — it lets every concurrent caller re-send.

**A long-lived child needs pipe hardening the one-shot path didn't.** `child.stdin` must have its own `'error'` listener: an unhandled `'error'` on the stdin pipe (an EPIPE when the child dies mid-write) is an uncaught exception that crashes the whole engine, not just the run — the `child.on('error')` listener does not catch pipe errors. `stdout`/`stderr` get `setEncoding('utf8')` so a multibyte character split across chunk boundaries is decoded whole instead of becoming `�` in the returned result (the per-chunk `toString()` in the one-shot path has the same latent bug, harmless there because it writes once). And `spawnDeno` removes its temp `DENO_DIR` if writing `main.mjs` fails, since no child was created to trigger the close-time cleanup.

## Key files

- `packages/core/utils/src/lib/deno.ts` — `deno.createSession` (the process + protocol), `buildSessionProgram` (the child program)
- `packages/server/engine/src/lib/core/code/deno-code-sandbox.ts` — `createScriptSession` (lazy spawn, respawn-on-death, `syncGlobals` send-once)
- `packages/server/engine/src/lib/variables/props-resolver.ts` — one session per `resolve()`, shared by the resolved + censored passes
