---
status: accepted
---

# The engine never imports a piece, a fresh child process does

## Decision

Nothing in the engine process may `import()` a piece package. A piece is loaded only inside a child process spawned per call and killed when that call returns (`packages/server/engine/src/lib/core/piece/piece-child.ts`, shipped as its own esbuild entry `piece-child.js`). The parent talks to it with exactly two requests — `describe` (piece metadata as JSON plus the list of paths that are functions) and `call` (`['actions', 'send_http', 'run']` and its arguments) — over `piece-runner.ts`.

## Context

The engine is long-lived and served many operations, each `import()`ing pieces into the same process. Resident piece modules (and their duplicated `@activepieces/shared` copies) never came back — measured as hundreds of MB of a single engine heap. Loading a piece to read its metadata, or just to discover an auth `validate` hook does not exist, cost the same permanent memory as running it. Measured after the change with `smoke-test/verify-memory.sh` (webhook → data-mapper → return-response, 2000 runs): the engine ends **28 MB below** its warm baseline, i.e. V8 gives the heap back because nothing from the pieces stays resident.

## Why

Process exit is the only reliable way to free a required module graph; a cache or a `delete require.cache` does not free native handles or the transitive graph. Everything the engine needs about a piece is data (props, auth, trigger type, `contextInfo`), so it can cross a process boundary — only *behaviour* has to run where the piece is loaded. Rejected: keeping metadata loading in-process and isolating only `run` (metadata loading is what most operations do, so the leak would remain), and a persistent piece process per version (it re-creates the leak with extra lifecycle).

The child is a real bundled engine entry, not an inline `--eval` script, because file materialization must live with the engine's own file processor: `ApStreamingFile.body` is a `Readable` and cannot be structured-cloned.

## Consequences

- **The piece's context cannot be proxied back to the engine — the child has to build it.** Two hard constraints kill any marker/RPC bridge, and both fail silently: (1) parts of the context are **synchronous by contract** — `CreateWaitpointResult.buildResumeUrl` returns a `string` and pieces call it without `await`, which an RPC can only answer with a Promise; (2) pieces **mutate objects after handing them to a hook** — `return-response-and-wait-for-next-webhook` passes `response` to `createWaitpoint` and only then writes the resume URL into its `headers`, and in-process the engine sees that through the shared reference. A snapshot does not. Since almost every context function is just HTTP over scalars (`apiUrl`, `engineToken`, `projectId`, `flowId`) the child builds them itself; only the collectors the engine reads afterwards (`hookResponse` tags/stop/respond/paused/responseToSend, trigger `listeners` and `scheduleOptions`) travel back, as plain data on the result.
- `describe` costs one extra spawn per piece per engine process (memoized by `name@version`), so a 10-step flow on one piece is 11 spawns, not 20.
- **A piece call costs ~79 ms** (spawn + import the piece + build the context + run + IPC), measured on a warm cache against the built child bundle. The benchmark flow's three calls show up as `RUN=400ms` in `FlowRun.timeline` with `PROVISION=0ms, BOOT=0ms`. That is the price of never letting a piece into the engine heap; if the sync-webhook path ever needs it back, the upgrade is one child per *flow run* instead of per *call* — the process still dies at the end of the run, so nothing accumulates, and an N-step flow pays one spawn instead of N.
- `fileProcessor` returns a `__apFileSource` marker and the child calls `materializeFile`, so nothing is fetched until the piece actually runs — a validation failure now opens zero connections. The cost: an unreachable file URL fails *in the child when the step runs* rather than in the parent's prop validation (same message, later stage), because you cannot check a remote file without fetching it.
- Piece metadata reaches the engine JSON-round-tripped, so any *function* on a property (dropdown `options`, dynamic `props`) is addressable only by path, never callable in-process.
- A sandbox gets the engine by **file-by-file copy**, not by copying a directory: `engineInstaller` (`packages/server/sandbox`) copies each bundle into the cache dir that isolate mounts at `/root/common`. A new engine entry point must be added to that list or it is simply absent at runtime — the Docker image, which copies all of `dist/packages/engine`, looks perfectly fine and hides it.
- The child is a second esbuild entry, so anything that builds it (including `vitest.config.ts`, which builds it for tests) must reuse the same `alias` map as `esbuild.config.mjs` — miss it and tests bundle `@activepieces/*` from `dist` while production bundles from `src`, so a green suite proves nothing about the shipped child.
- **The child inherits the engine's node flags, and its OOM is detected rather than prevented.** `engineNodeArgs` sets `--max-old-space-size` as the *only* bound on engine memory (isolate passes no `--mem`/`--cg-mem`), so spawning the child without it would leave it on V8's default heap — spawn it with `[...process.execArgv, entry]`. Engine + child can then together reach `AP_SANDBOX_MEMORY_LIMIT`, and that is accepted: the worker is the sandbox, so it dies and restarts. What must not happen is the failure being anonymous — `piece-runner` classifies the child's exit the way `sandbox.ts` classifies the engine's (V8 heap message, exit 134, SIGABRT, SIGKILL) and raises a user-level `PieceMemoryLimitError`. A budget split between the two processes was tried and reverted: it bought little, and a floor on each share silently overshot the limit on small configurations.
- The child inherits no in-process guards the parent installs (e.g. the SSRF monkeypatches in `network/ssrf-guard.ts`). Whatever must apply to piece code has to be installed in `src/piece-child.ts`.
