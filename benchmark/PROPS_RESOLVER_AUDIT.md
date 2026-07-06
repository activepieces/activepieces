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

## Recommended Execution Order

1. **Land PR #14047** (fix finding #1) — immediate, unblocks this audit's pattern adoption elsewhere.
2. **Fix finding #2** (censoring double-pass) — highest blast-radius, lowest complexity, affects every run today.
3. **Fix finding #3** (router eager branches) — same pattern as #1, unfixed in RUN path.
4. **Measure finding #4** (per-token isolate churn) — microbenchmark to quantify the win from #2/#3, plan architectural fix.
5. **Add finding #5** (sample-data cap) — cheap complementary defense.

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
