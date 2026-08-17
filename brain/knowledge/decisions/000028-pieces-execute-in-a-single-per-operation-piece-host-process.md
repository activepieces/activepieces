---
status: accepted
---

# Pieces execute in a single per-operation piece-host process

## Decision
When the engine is warm (`AP_REUSE_SANDBOX=true`), the main engine process never `import()`s a piece. On the first time an operation needs anything from a piece — run an action, run a trigger hook, execute props, extract metadata, validate/resolve/refresh auth — it lazily forks **one** child "piece host" (`node main.js --piece-host`) and talks to it over IPC. The host loads pieces with the unchanged `pieceLoader`, does its own HTTP callbacks, and is **killed in the operation's `finally`**. One host per operation, reused across every piece call in it, so its accumulated piece modules die with it. The engine keeps the flow-executor loop, code/router/loop steps, execution state, resolution, and verdict logic; only the piece-touching work crosses to the host. Gated off entirely when reuse is off (the engine is already disposed per operation). Lives in `packages/server/engine/src/lib/piece-process/`.

## Context
`pieceLoader.loadPieceOrThrow` does `await import(piecePath)`, and Node never evicts the module cache. In a reused engine every distinct piece version stays resident forever (~40 MB of `@activepieces/shared` per fat piece), so a warm worker grows until it is OOM-killed. Code pieces already dodge this by running in a child that `require()`s and exits (`no-op-code-sandbox.ts`); pieces did not.

## Why
A killed-per-operation child reclaims everything unconditionally — no `require.cache` eviction (native-addon crashes, retained closures) and no per-piece leak. **One** host, not one-per-piece: fewer forks, and the host caches each piece once for the operation. Resolution stays in the parent (it holds the execution state) — the parent fetches only `contextVersion` via a cheap RPC and ships already-resolved input, so execution state never crosses IPC. The rich `ActionContext` hooks (`stop`/`respond`/`createWaitpoint`/`tags`) are marshaled back as an accumulated `hookResponse` the parent's verdict logic reads unchanged. Rejected: whole-flow offload (runs code/router/state in the child too, loses per-piece framing); `require()`+LRU eviction in-process (native-addon crash risk, only caps count); recycling the engine after N ops (a memory ceiling, not isolation).

## Consequences
- Piece work costs one fork per operation (reused across its steps); the outer sandbox timeout still bounds a hung piece, and the host self-exits when the parent IPC disconnects.
- A piece OOM/crash now kills the host, not the warm engine — the parent turns a premature exit into an error; the sandbox layer's `SANDBOX_MEMORY_ISSUE` classification (keyed on engine exit) no longer fires for piece OOMs.
- USER-vs-ENGINE error fidelity must survive IPC (`error-serde.ts`) or oncall pages on user mistakes / real bugs get hidden.
- Gating is strictly `AP_REUSE_SANDBOX=true`; it does not exclude the isolate modes, where forking inside the jail may not work.
