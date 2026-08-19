---
icon: 🧨
---

# Gotcha: the code cache is namespaced by `flowVersionId` — never hand it a constant

`flowVersionId` is the **only** namespace separating one compiled code step from another, and it does
double duty: it names the cache directory *and* the isolate bind mount. Anything that compiles a code
step must pass an id unique to that execution.

- Build path: `codeCache.stepDir({ flowVersionId, stepName })` → `<codeCache>/<flowVersionId>/<stepName>/index.js`
  (`sandbox/cache/flow/code/code-cache.ts`).
- Read path: the engine loads `${AP_BASE_CODE_DIRECTORY}/${constants.flowVersionId}/${action.name}/index.js`
  (`engine/handler/code-executor.ts`) — same two segments, no other keying.

Two things break when the id is a shared constant (e.g. `DEFAULT_MCP_DATA.flowVersionId`) and the step
name is fixed:

1. **Cross-tenant code execution.** A hash mismatch `rm -rf`s the directory and rebuilds. `memoryLock`
   serializes the *build*, not the *execution* that reads `index.js` afterwards — so with
   `AP_WORKER_CONCURRENCY=5` boxes sharing one on-disk cache, run A can end up executing run B's
   snippet, or ENOENT mid-delete. `sandbox.ts` explicitly justifies having no per-key provision dedup
   on the assumption that these paths are already unique.
2. **No mount in isolate mode.** `buildCodeMount` returns `null` when `reusable === false` and
   `flowVersionId` is nil, so nothing lands at `/root/codes` and the artifact is invisible inside the
   jail. `reusable` is false for `SANDBOX_PROCESS` / `SANDBOX_CODE_AND_PROCESS` unless
   `AP_REUSE_SANDBOX=true` — i.e. exactly the hardened configuration. Piece actions are unaffected
   (they mount via `/root/common`), so this fails *only* for code steps and looks config-specific.

Flow runs are safe by construction — a real `flowVersion.id`. The trap is any flowless execution path
(agent tools, MCP `ap_run_code`, chat code execution). **Do not hand-roll an id there** — call
`actionRunCache.namespace({ platformId, sourceHash })` from `sandbox/cache/action-run-cache.ts` and set the
result on `provision.flowVersionId` (so the mount is built) *and* on the `CodeArtifact` *and* on
`EngineConstants.flowVersionId` (what the engine reads). All three must be the same string. It yields
`ar_<platformId>_<sha256(sourceCode)>`: the hash keeps the build deterministic and cacheable, the
`platformId` keeps one customer's compiled code out of another's directory, and the literal `ar_` prefix is
how the sweeper tells action-run builds from flow-version builds — length cannot, since `platformId` and
`flowVersionId` are both 21-char `apId`s.

Do **not** clean the directory up at the end of a run. Reclamation is `actionRunCache.sweep`, a worker-local
30-minute pass over `ar_*` (2h TTL, then oldest-first eviction past `AR_CACHE_MAX_DIRS`) driven from
`worker.ts`. It is safe because `localExecutionCache.provision` touches each dir's mtime immediately before
`sandbox.start()` and **eviction skips anything touched inside `AR_CACHE_ACTIVE_WINDOW_MS`** (15 min). The
count cap is not enough on its own: mtime orders dirs by provision time, not by whether a run is still
attached, so a slow run is outranked by every fast one that started after it. Being a count rather than a
byte budget is what keeps the survivor floor fixed at N regardless of dir size — but the window is what makes
a live dir unreachable. The touch is gated on `isManagedDir`, so flow-version dirs pay nothing for it.

**Anything that deletes a code directory depends on `code-builder` re-checking that `index.js` exists on a
cache hit.** `cacheState`'s memo is module-scoped with no invalidation API, so a hit skips the disk entirely
— delete the artifact and that snippet reports a phantom hit and fails forever on that worker. It is
cross-process too: the reference `docker-compose.yml` shares one `./cache` bind mount across `app` and five
`worker` replicas, so process-local invalidation could not have fixed it.

**That existence check must be evaluated inside `cacheMiss`, never snapshotted before `getOrSetCache`.**
`cacheMiss` is called twice — once on the module-scoped memo before the lock, once against disk *inside*
`memoryLock.runExclusive`. A `const present = await fileExists(...)` hoisted above the call freezes the
pre-lock answer, so every run that queued behind the winning builder still sees "absent" when the lock
finally lets it in, and rebuilds: N concurrent runs of one cold code step produce N builds, each opening with
`rm -rf codePath`. That deletes `index.js` out from under the engines that already provisioned, and they die
with `MODULE_NOT_FOUND` — the ENOENT-mid-delete failure above, but on the ordinary cold-cache path instead of
only on a hash mismatch. A synchronous `existsSync` in the predicate keeps the check atomic with the decision
it feeds; pinned by the concurrency case in `sandbox/test/lib/cache/flow/code/code-builder.test.ts` and, end
to end, by `handles concurrent flow run executions without jobs getting stuck` in
`api/test/integration/ce/flows/flow-run/execute-flow-e2e.test.ts`.

Related: [[workers]], [[action-run]], [[gotcha-engine-vitest-needs-fresh-core-execution-dist-can-t-load-piece-dist-local]].
