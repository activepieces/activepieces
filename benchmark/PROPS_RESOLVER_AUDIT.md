# Props Resolver Audit: Memory/CPU Hot Spots in Flow Execution

## Overview

This audit examines memory and CPU inefficiencies in Activepieces' flow execution engine, specifically in the props-resolution and sandboxed execution paths. It was triggered by PR [#14047](https://github.com/activepieces/activepieces/pull/14047), which fixed a production incident where a large step output (~17 MB nested JSON) pushed through the props resolver caused builder timeouts (minutes) and sandbox OOM crashes during `EXECUTE_PROPERTY` calls.

**Critical: PR #14047 is still OPEN (not merged to `main`).** The fixed code exists only on the PR's branch; `main` is currently exposed to the exact incident pattern this audit documents.

## Findings (Ranked by Blast Radius)

### 1. ⚠️ PR #14047 OPEN — `testExecutionContext` Eager Loop Resolution (CRITICAL)

**Status**: Open PR, unfixed on `main`.

**File**: [packages/server/engine/src/lib/handler/context/test-execution-context.ts:47-58](packages/server/engine/src/lib/handler/context/test-execution-context.ts)

**Root Cause**: `stateFromFlowVersion` unconditionally resolves every `LOOP_ON_ITEMS` step's settings through the props resolver, regardless of whether the `EXECUTE_PROPERTY` input references that loop. Each mustache token (`{{...}}`) pushes the entire referenced step output through `JSON.stringify`/`JSON.parse` + `ivm.ExternalCopy` into a throwaway 128 MB isolate, **twice** (resolved + censored pass).

**Real-World Impact**: A customer flow storing a full Google Docs `documents.get` API response (~17 MB deeply-nested JSON) as sample data on a step referenced by a loop caused every builder property-resolution request to stall for 3+ seconds (or timeout at the sandbox limit, triggering retries). The builder was unusable.

**Evidence** (from PR #14047's test):
- 31.6 MB Google-Docs-like sample, referenced by loops: **2,956 ms → 6 ms** (after the fix skips unreferenced loops).

**Estimated Fix Complexity**: Medium. PR #14047 already implements the fix: `computeRelevantStepNames()` uses a fixed-point traversal of loop settings to resolve only loops the input references, directly or transitively. The PR is ready to merge.

**Action**: Land PR #14047 immediately. Block this audit until it merges (it defines the reference pattern for mitigating similar issues elsewhere).

---

### 2. 🔴 Censoring Double-Pass in Props Resolver (HIGH BLAST RADIUS)

**File**: [packages/server/engine/src/lib/variables/props-resolver.ts:50-65](packages/server/engine/src/lib/variables/props-resolver.ts)

**Root Cause**:
```ts
const resolvedInput = await applyFunctionToValues<T>(unresolvedInput, token => 
  resolveInputAsync({...opts, censoredInput: false, ...})
)
const censoredInput = await applyFunctionToValues<T>(unresolvedInput, token =>
  resolveInputAsync({...opts, censoredInput: true, ...})
)
```

Both passes execute identical isolate-creation + JSON clone + `ivm.ExternalCopy` work. The `censoredInput` flag is only consumed by `handleVariable` (line 183-184) and `handleConnection` (line 206-207) — the `variables.`/`connections.` token prefixes.

For **the common case** — plain step-output references like `{{step_1['output']['data']}}` — `resolveSingleToken` falls through to `evalInScope` (line 174), which **never reads the `censoredInput` flag**. So both passes:
- Create a fresh 128 MB V8 isolate
- Deep-clone the execution state via `JSON.stringify`/`JSON.parse`
- Copy the clone into the isolate via `ivm.ExternalCopy`
- Evaluate the expression (identical result either way)
- Discard the isolate

**Blast Radius**: 
- Runs on **every action, every flow run** (piece-executor, code-executor, loop-executor, router-executor, test-execution-context, all call `resolve()`).
- **Measured** (microbench, `run-action-resolution.perf.test.ts`): resolving 2 non-secret tokens over a 3.8 MB payload takes **309 ms**; the second (censoring) pass is redundant for these tokens, so single-pass would be **~155 ms** — a **~2× wall-clock tax** confirmed.
- Secondary effect: amplifies findings #4 (per-token isolate churn).

**Mitigation Strategy**:
- **Option A (fastest)**: Remove censoring entirely for step-output tokens — only apply censoring to variables/connections at resolution time via a pre-pass that detects `variables.` / `connections.` prefixes using `extractMustacheTokens` (already available), then substitute `'**REDACTED**'` into the already-resolved result.
- **Option B (compatible)**: Detect at token-extraction time which tokens actually need censoring, resolve only those twice, resolve everything else once.

**Estimated Fix Complexity**: Small (surgical, localized to `createPropsResolver().resolve()` and `resolveSingleToken()`).

---

### 3. 🔴 Router Eager All-Branches Resolution (UNFIXED, LIVE RUN PATH)

**File**: [packages/server/engine/src/lib/handler/router-executor.ts:18-24](packages/server/engine/src/lib/handler/router-executor.ts)

**Root Cause**:
```ts
const { data: resolved } = await utils.tryCatchAndThrowOnEngineError(() =>
  constants.getPropsResolver(LATEST_CONTEXT_VERSION).resolve<RouterActionSettings>({
    unresolvedInput: { ...action.settings },
    executionState,
  }),
)
```

The entire `action.settings` (all branches' conditions) gets resolved in one call to `resolve()`, before `evaluateConditions` (line 64) determines which branch matched. Only the matched branch executes (lines 89-108). Non-matching branches' conditions — which may reference large step outputs — are resolved for no reason, paying the isolate + copy + censoring costs (findings #2 and #3) for each branch.

**Shape**: Identical to the bug PR #14047 fixes in `testExecutionContext`, but:
- Occurring in the **live RUN path** (not just builder `EXECUTE_PROPERTY`)
- **Currently unfixed** (PR #14047 does not touch `router-executor.ts`)

**Blast Radius**:
- Every router step in every flow run, scaled by branch count.
- **Measured** (microbench): router resolution costs **~150 ms per branch and is independent of which branch matches** — 3 branches = 558 ms, 10 = 1,585 ms, 30 = 4,407 ms. A 30-branch router spends ~4.4 s resolving branches that never execute.
- Secondary amplification: if non-matching branches reference the same large step, finding #4 (per-token isolate churn) multiplies the cost further.

**Mitigation Strategy**:
- Apply the PR #14047 pattern: before calling `resolve()`, scan `action.settings.branches[].conditions[][]` to identify which branches reference any step outputs, then resolve only those branches' settings, using `LoopStepOutput.init()` placeholders for unresolved branches (matching the PR's pattern for loops).
- Or, in `resolve()`, short-circuit censoring for non-referenced branches.

**Estimated Fix Complexity**: Medium (same technique as PR #14047, but applied to router branch conditions).

---

### 4. 🟡 Per-Token Isolate Churn (UNDERLYING COST MULTIPLIER)

**File**: [packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts:46-72](packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts)

**Root Cause**:
```ts
async function runScript(...) {
  const isolate = new ivm.Isolate({ memoryLimit: 128 })
  const context = isolate.createContextSync()
  const result = context.evalSync(script, { ...options })
  isolate.dispose()
}
```
Called once per `{{...}}` token via `evalInScope` (props-resolver.ts:251-268), not once per action. A step setting with K mustache tokens pays the isolate-creation overhead K times, plus K full JSON-clone + ivm.ExternalCopy cycles.

**Secondary Effect**: Amplifies findings #2 and #3. A wide router with many branches, each branch with many token references, and with censoring double-pass, scales as O(branches × tokens × 2) isolates created.

**Measurement** (microbench): ~**62 ms per token**, linear — 1 token = 94 ms, 3 = 221 ms, 5 = 309 ms over the same 3.1 MB payload. This is isolate init (fixed) + per-token JSON clone (payload-dependent) paid once per `{{...}}`. Separately, resolution heap grows to **~6–7× the payload size** (6.3 MB → 47.7 MB; 18.5 MB → 109.5 MB), because each resolve clones the payload several times over (stringify + parse + `ivm.ExternalCopy` + output) — a ~20–25 MB step output pushed through resolution reaches the 128 MB isolate cap.

**Mitigation Strategy**: Out of scope for this audit — requires architectural change (pooling isolates or batching token evaluation). But measuring it separately (microbench finding #3.2) helps estimate the win from fixing #2 (per-token churn is the hidden cost below the censoring double-pass).

**Estimated Fix Complexity**: Large (architectural, post-audit).

---

### 5. 🟢 Sample Data Write-Time Cap (CHEAP, COMPLEMENTARY)

**Files**: 
- [packages/server/api/src/app/flows/step-run/sample-data.service.ts:74-101](packages/server/api/src/app/flows/step-run/sample-data.service.ts)
- [packages/server/api/src/app/file/file.service.ts:242-274](packages/server/api/src/app/file/file.service.ts)

**Root Cause**: `saveSampleData` calls `fileService.save(...)` unconditionally, with no size check. `file.service.ts` has a `maxFileSizeInBytes` parameter, but it's wired only into `uploadPublicAsset` (platform logos, images), not into `FileType.SAMPLE_DATA` saves.

**Limitation**: This mitigates the incident-class case (large sample data stored in the builder) but doesn't address real runtime step outputs, which (a) are also large, (b) are never capped at write time, and (c) get pulled into isolates during props resolution in the RUN path regardless.

**Mitigation Strategy**: Add a write-time cap to sample data, following the existing `applyLogSizeLimitIfExceeded` pattern in `flow-executor.ts:163-186` — truncate arrays/strings beyond N MB before persisting.

**Estimated Fix Complexity**: Small (localized to `saveSampleData`, mirrors existing log-limit pattern).

**Blast Radius**: Prevents *new* incident recurrence (a 50MB sample data upload blocks future builder timeouts), but doesn't fix the RUN-path resolver cost for existing flows or large real outputs.

---

### 6. 🟠 Code-Step Working-Set OOM — the "Apply Watermark" / large-image case (DISTINCT MECHANISM)

**This is not props-resolver overhead.** Findings #1–#5 are about the *platform* cloning a large step
output through isolates during input resolution. This one is about the *user's own code* allocating
more than the isolate can hold while it runs — a different mechanism, a different fix, but the same
128 MB wall and the same `MEMORY_LIMIT_EXCEEDED` outcome. Called out because a real incident hit both
at once and they were easy to conflate.

**File**: [packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts:23](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts) (hardcoded `memoryLimit: 128`).

**Root Cause**: A code step that processes images (Jimp/sharp) decodes each photo into a raw **RGBA
bitmap of `width × height × 4` bytes** — a size that is **independent of the compressed file size**. A
"small" 3 MB phone JPEG is ~24 MP, which decodes to **~96 MB**; watermark compositing keeps a second
copy simultaneously. That exceeds the 128 MB isolate cap, and because it's a large native allocation
V8 aborts the process rather than throwing a catchable JS error — the engine dies with **SIGKILL
("Caught fatal signal 9")**, which `sandbox.ts::handleProcessExit` maps to
`ErrorCode.SANDBOX_MEMORY_ISSUE` → `FlowRunStatus.MEMORY_LIMIT_EXCEEDED`, and the job is retried.

**Real-world incident**: An "Apply Watermark" step OOM-killed on full-resolution photos. It compounded
with an orchestration bug — a parent cron flow **re-dispatched the same files repeatedly** (~80 →
~1,400 runs/day), so duplicate runs also failed with Dropbox `path/not_found` (an earlier run had
already deleted the file), and the run flood amplified the OOM rate. Both flows were disabled to stop
the bleeding. The re-dispatch flood is an idempotency/orchestration issue (out of scope here); the OOM
itself is this finding.

**Why it's different from #1–#5**:
- The oversized allocation is in **user code**, not in `resolve()`. No amount of props-resolver
  optimization prevents it.
- It is **not fixable by slicing/log limits** — the bitmap only exists transiently inside the isolate
  during `code()`; it's never a persisted step output.

**Mitigation Strategy** (in order of leverage):
1. **Resize/stream before full decode** (user-side): downscale to the working resolution before
   compositing, or use a streaming/tiled pipeline (`sharp` with limited `pixelLimit`) instead of
   loading the whole bitmap. This is the real fix for the incident.
2. **Make the code-step memory limit configurable** instead of a hardcoded `128` — image/PDF
   workloads legitimately need more; today there is no knob. Pair with a clear pre-flight error
   ("image too large for the N MB code limit") rather than an opaque SIGKILL retry loop.
3. **Fail fast, don't retry OOM**: a deterministic working-set OOM will OOM again on retry — retrying
   just multiplies the cost (as the incident showed). Treat `SANDBOX_MEMORY_ISSUE` from a code step as
   non-retryable.

**Reproduce**: [`setup-image-oom.sh`](./setup-image-oom.sh) — `MEGAPIXELS` (default 24) allocates a
decoded-bitmap-sized buffer + a watermark copy, no image library required (a raw byte buffer is the
faithful stand-in for what Jimp holds). Sweep `MEGAPIXELS=8/16/24/32` to find where the run flips from
SUCCEEDED to `MEMORY_LIMIT_EXCEEDED`.

**Estimated Fix Complexity**: Small for the config knob + non-retryable classification; the real
resolution is user-side (resize before decode) plus docs.

---

## Recommended Execution Order

1. **Land PR #14047** (fix finding #1) — immediate, unblocks this audit's pattern adoption elsewhere.
2. **Fix finding #2** (censoring double-pass) — highest blast-radius, lowest complexity, affects every run today.
3. **Fix finding #3** (router eager branches) — same pattern as #1, unfixed in RUN path.
4. **Measure finding #4** (per-token isolate churn) — microbenchmark to quantify the win from #2/#3, plan architectural fix.
5. **Add finding #5** (sample-data cap) — cheap complementary defense.
6. **Address finding #6 separately** (code-step working-set OOM) — different track from the resolver work: make the 128 MB code limit configurable, classify code-step OOM as non-retryable, and document resize-before-decode for image/PDF flows.

---

## Verification

The [run-action-resolution.perf.test.ts](../packages/server/engine/test/variables/run-action-resolution.perf.test.ts) microbenchmarks validate findings #2, #3, and #4 with measured numbers:
- Loop resolution cost with a large deeply-nested (Google-Docs-shaped) payload — the incident shape
- Loop resolution cost over a **100k-row parsed-CSV array** — the realistic "process a big spreadsheet/export" shape (many small uniform objects, tens of MB, approaching the 128 MB isolate cap)
- Router branch resolution scaling with branch count
- Direct censoring-pass cost isolation
- Per-token isolate churn scaling with property count

Full-stack load tests in the `benchmark/` directory validate end-to-end impact (see [EXPERIMENTS.md](./EXPERIMENTS.md), Experiment 3):
- [`setup-loop-huge.sh`](./setup-loop-huge.sh) — loop over a deeply-nested payload
- [`setup-router-wide.sh`](./setup-router-wide.sh) — wide router, only fallback matches
- [`setup-csv-huge.sh`](./setup-csv-huge.sh) — code step that builds + parses a 100k-row CSV, then loops the rows (`ROW_COUNT` sweepable to find where `MEMORY_LIMIT_EXCEEDED` begins firing)
- [`setup-image-oom.sh`](./setup-image-oom.sh) — finding #6: a code step that decodes a large image into a raw bitmap + watermark copy (`MEGAPIXELS` sweepable), reproducing the user-code working-set OOM / SIGKILL

---

## Appendix — Why resolution heap ≈ 6× the payload, and how it scales with flow size

### Where the copies come from (per `{{token}}`)

Resolving one expression walks `resolve()` → `resolveSingleToken` → `evalInScope` →
`v8IsolateCodeSandbox.runScript`. For a token whose value is a large step output `P`, these full
materializations of `P` are alive in the **main process heap** at once:

1. **`JSON.stringify(scriptContext)`** ([v8-isolate-code-sandbox.ts:54](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts)) — a JS string of the whole context. V8 strings are UTF-16, so this is **~2× the JSON byte size**.
2. **`JSON.parse(...)`** (same line) — a full deep-clone object graph. In-memory object graphs run larger than their JSON text (per-object headers, hidden classes, pointer slots), especially for arrays of many small records.
3. **`new ivm.ExternalCopy(value).copyInto()`** ([:76](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts)) — serializes the clone again into an external buffer and copies it **into the isolate** (which is where the hardcoded **128 MB** cap applies).
4. **`outRef.copy()`** ([:90](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts)) — deserializes the result back **out** of the isolate into the main heap. For a token that returns the whole payload (e.g. a loop's `items`), this is another full copy of `P`.

That is **three-to-four full materializations of `P` in the main heap** (stringify string at 2×, parse clone, result copy) plus a fourth inside the isolate — and `resolve()` runs the **entire chain twice** (the resolved pass **and** the redundant censoring pass, finding #2). Net: **heap ≈ 6–7× the JSON payload size**, which is exactly what the microbench measures (6.3 MB → 47.7 MB; 18.5 MB → 109.5 MB). The practical consequence is the **128 MB isolate cap** (step 3): a single referenced payload of only ~20–25 MB fills the isolate and OOMs the step.

### Correlation with the number of pieces in a flow (measured)

`resolve()` first computes `currentState` scoped to `extractReferencedStepNames()`
([props-resolver.ts:42-43](../packages/server/engine/src/lib/variables/props-resolver.ts)), so the
clone cost depends on **which** upstream steps an expression references, not on the raw step count.
Measured (40k-row steps, heap Δ):

| Scenario | Heap Δ | Meaning |
|---|---:|---|
| 1 referenced big step, no others | 40.3 MB | baseline |
| 1 referenced big step **+ 4 unreferenced big steps** | 39.9 MB | **flat** → unreferenced pieces are scoped out and cost nothing |
| reference `step_10` while `step_1` is also big | 50.5 MB | **inflated** → substring false-positive (below) |

So the real correlations are:

- **Unreferenced pieces are free.** Adding steps a given expression doesn't mention does **not**
  inflate that resolution — `currentState` excludes them. (B stayed flat vs A.)
- **Per-expression cost scales with the *union* of the steps it references, cloned once per token.**
  `currentState` is built once as the union of all step names appearing anywhere in the action's
  input, but **every `{{token}}` re-clones that entire union** inside its own fresh isolate
  ([props-resolver.ts:50-65](../packages/server/engine/src/lib/variables/props-resolver.ts) →
  `evalInScope` per leaf). An action with `K` tokens referencing `S` large steps does `K ×
  (Σ referenced sizes)` of clone work — **quadratic in transient allocation / CPU** when `K` grows
  with `S` (e.g. a mapping step that fans in many large upstream outputs). Retained heap stays
  roughly linear (the resolved + censored outputs), but the transient peak and CPU are what drive GC
  pressure and the per-isolate 128 MB ceiling.
- **Cumulative across the run scales with piece count.** In a linear pipeline where each step passes
  a large payload to the next, *every* step pays the full 6× clone on its own resolve, so total
  flow-run resolution churn grows ~linearly with the number of pieces that touch large data.
- **Substring false-positive (secondary bug).** `extractReferencedStepNames` uses
  `stringifiedInput.includes(stepName)` ([props-resolver.ts:107](../packages/server/engine/src/lib/variables/props-resolver.ts)),
  so referencing `step_10` also matches `step_1` (a substring). Once a flow has ≥10 default-named
  steps, high-numbered references spuriously pull prefix-colliding steps' outputs into `currentState`
  and clone them for nothing (C: +10 MB). This makes even correctly-scoped resolution grow with flow
  size. Fix: word-boundary / token-aware matching instead of `String.includes`.
