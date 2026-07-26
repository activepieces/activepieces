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
(agent tools, MCP `ap_run_code`, chat code execution): synthesize a per-run id, set it on
`provision.flowVersionId` so the mount is built, and clean the directory up afterwards.

Related: [[workers]], [[gotcha-engine-vitest-needs-fresh-core-execution-dist-can-t-load-piece-dist-local]].
