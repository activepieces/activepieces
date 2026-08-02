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
30-minute pass over `ar_*` (24h TTL, 2 GB oldest-first backstop) driven from `worker.ts`. It is safe only
because `localExecutionCache.provision` touches each dir's mtime immediately before `sandbox.start()`, so
anything currently bind-mounted is far too fresh to be swept.

**Anything that deletes a code directory depends on `code-builder` re-checking that `index.js` exists on a
cache hit.** `cacheState`'s memo is module-scoped with no invalidation API, so a hit skips the disk entirely
— delete the artifact and that snippet reports a phantom hit and fails forever on that worker. It is
cross-process too: the reference `docker-compose.yml` shares one `./cache` bind mount across `app` and five
`worker` replicas, so process-local invalidation could not have fixed it.

Related: [[workers]], [[action-run]], [[gotcha-engine-vitest-needs-fresh-core-execution-dist-can-t-load-piece-dist-local]].
