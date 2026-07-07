# Handoff — Flow-execution memory/CPU profiling & fixes

You are picking up an investigation into memory/CPU limits of Activepieces flow execution. This doc
tells you what the problems are, what's already built (tests + benchmarks + audit), the measured
numbers, and what to do next. Read it top-to-bottom once, then use the file pointers.

## TL;DR

Two independent OOM/perf problems, both hitting the **hardcoded 128 MB `isolated-vm` cap**
([v8-isolate-code-sandbox.ts:23](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts)):

1. **Platform overhead** — resolving a `{{expression}}` clones the referenced step output **~6–7×**
   through isolates (stringify → parse → `ivm.ExternalCopy` → copy-out), run **twice** (a redundant
   censoring pass). A ~20–25 MB step output pushed through one expression reaches the 128 MB cap and
   OOMs. Kicked off by PR [#14047](https://github.com/activepieces/activepieces/pull/14047) — **still
   OPEN, `main` is exposed.**
2. **User-code overhead** — a code step's own working set overflows the isolate (the "Apply
   Watermark" incident: a full-res photo decodes to ~96 MB regardless of file size, ×2 for
   compositing → SIGKILL → `MEMORY_LIMIT_EXCEEDED`). Different mechanism, different fix.

The full ranked audit is in [PROPS_RESOLVER_AUDIT.md](./PROPS_RESOLVER_AUDIT.md) (findings #1–#6 +
an appendix deriving the 6× and the piece-count correlation). The load-test write-up is
[EXPERIMENTS.md](./EXPERIMENTS.md) "Experiment 3".

## The findings (see PROPS_RESOLVER_AUDIT.md for detail)

| # | Finding | Where | Status |
|---|---|---|---|
| 1 | PR #14047 eager loop resolution unmerged | `handler/context/test-execution-context.ts:47-58` | OPEN PR — land it |
| 2 | Censoring double-pass (~2× every resolve, every run) | `variables/props-resolver.ts:50-65` | unfixed |
| 3 | Router resolves ALL branches, not just the matched one | `handler/router-executor.ts:18-24` | unfixed, live RUN path |
| 4 | Per-token isolate churn (~62 ms/token, fresh 128 MB isolate per `{{}}`) | `core/code/v8-isolate-code-sandbox.ts` | architectural |
| 5 | Sample-data has no write-time size cap | `api/.../step-run/sample-data.service.ts` | preventive |
| 6 | Code-step working-set OOM (large image) — **distinct mechanism** | `core/code/v8-isolate-code-sandbox.ts:23` | user-code |
| — | `extractReferencedStepNames` uses `String.includes` → `step_10` pulls in `step_1` | `variables/props-resolver.ts:107` | secondary bug |

### Why heap ≈ 6× payload (mechanism)
Per `{{token}}`, `runScript` ([v8-isolate-code-sandbox.ts:46-69](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts))
holds several full copies of the payload `P` in the main heap at once: `JSON.stringify` (UTF-16 → 2×)
→ `JSON.parse` deep clone → `ivm.ExternalCopy(...).copyInto()` (into the isolate) → `outRef.copy()`
(back out). `resolve()` runs that whole chain **twice** (resolved + censored). Net ≈ 6–7× the JSON
size in the main heap; the isolate copy is what hits the 128 MB cap.

### Correlation with number of pieces (measured, see appendix)
- **Unreferenced pieces are free** — `resolve()` scopes `currentState` to referenced step names
  ([props-resolver.ts:42-43](../packages/server/engine/src/lib/variables/props-resolver.ts) →
  `flow-execution-context.ts:167-190`).
- **Per-expression cost scales with the *union* of referenced steps, cloned once per token** — an
  action with `K` tokens over `S` large steps does `K × Σsizes` of clone work (quadratic transient/CPU
  when a step fans in many large upstream outputs).
- **Cumulative across a run scales with piece count** — a linear pipeline pays the 6× at every step.
- The substring bug inflates the referenced set as flow size grows.

## Tests already written (these are your baselines)

### 1. Props-resolution microbenchmarks — `packages/server/engine/test/variables/run-action-resolution.perf.test.ts`
5 tests, all passing. Measure `resolve()` clone cost + router/censoring/isolate scaling.

```bash
cd packages/server/engine
NODE_OPTIONS="--expose-gc" npx vitest run test/variables/run-action-resolution.perf.test.ts
```

Measured on a local WSL2 dev box (treat as **ratios**, not absolute latency):

| Test | Payload | Time | Heap Δ |
|---|---|---|---|
| Loop `items` resolution (deeply-nested) | 6.3 MB | 517 ms | 47.7 MB (7.5×) |
| CSV `items` resolution (100k rows) | 18.5 MB | 1,177 ms | 109.5 MB (5.9×) |
| Censoring double-pass (2 tokens) | 3.8 MB | 309 ms (~155 ms single-pass) | — |
| Router 3/10/30 branches | 6.3 MB | 558 / 1,585 / 4,407 ms | ~150 ms/branch |
| Isolate churn 1/3/5 tokens | 3.1 MB | 94 / 221 / 309 ms | ~62 ms/token |

Thresholds live at the top of the file (`MAX_ACCEPTABLE_*`). If a fix improves things, tighten them
so regressions can't creep back.

### 2. Code-step OOM reproduction — `packages/server/engine/test/core/code/v8-isolate-code-sandbox.test.ts`
Two new tests (in the existing file) bracket the 128 MB cap via `runCodeModule` (the real code-step
path). This is the **finding #6 / watermark** baseline.

```bash
cd packages/server/engine
npx vitest run test/core/code/v8-isolate-code-sandbox.test.ts
```

- Control: ~48 MB working set → **succeeds**.
- OOM: ~512 MB working set → **rejects** with `RangeError: Array buffer allocation failed`.

**Important nuance for whoever fixes this:** today the in-isolate OOM surfaces as that raw
`RangeError`, NOT a classified memory-limit error (the `MEMORY_LIMIT_EXCEEDED` mapping only happens at
the outer sandbox process-exit layer for a SIGKILL). The test's matcher is broad
(`/Array buffer allocation failed|out of memory|memory limit/i`) so it stays green if you wrap the OOM
in a clearer message, but breaks if the 512 MB allocation starts **succeeding** (i.e. you raised the
cap) — that's the signal to re-baseline. `imageWorkloadSource(mb)` is parameterized to bisect the exact
cliff.

## Benchmark fixtures (full-stack load tests) — NOT yet run under docker
All in `benchmark/`, modeled on the existing `setup.sh`/`setup-math.sh`. Each signs in as
`bench@activepieces.com`, imports a flow, publishes, enables, prints the flow id. Run against the
local docker stack (`run-local.sh` builds + boots it).

| Fixture | Env knob | Reproduces |
|---|---|---|
| `setup-loop-huge.sh` | `PARAGRAPH_COUNT` | loop over a deeply-nested payload (findings #2/#3) |
| `setup-router-wide.sh` | `BRANCH_COUNT` | router eager-all-branches (finding #3) |
| `setup-csv-huge.sh` | `ROW_COUNT` (def 100k) | parse a big CSV then loop rows — sweep to find the `MEMORY_LIMIT_EXCEEDED` cliff |
| `setup-image-oom.sh` | `MEGAPIXELS` (def 24) | finding #6 image OOM — sweep 8/16/24/32 for the cliff |
| `poll-metrics.sh` | `TOKEN` | polls `GET /v1/worker-machines` → NDJSON (cgroup CPU/RAM per sandbox) |

```bash
# example — build stack, then run a fixture and load it
cd benchmark && ./run-local.sh SANDBOX_CODE_ONLY 500     # baseline math flow
ROW_COUNT=100000 ./setup-csv-huge.sh && hey -n 200 -c 2 -t 120 "http://localhost:8080/api/v1/webhooks/$FLOW_ID/sync"
```

**Pending work here:** actually run these under docker, capture container CPU/RAM via `poll-metrics.sh`
+ per-run phase timings from the flow-run API, and fill in the "Results — full-stack load (to run)"
section of EXPERIMENTS.md. The `setup-image-oom.sh` and `oom-expression.txt` fixtures intentionally
trigger OOM/SIGKILL/retry churn — run them deliberately, not inside a clean throughput sweep.

## Recommended fix order (with file pointers)
1. **Land PR #14047** — `main` is exposed to the eager loop-resolution incident.
2. **Kill the censoring double-pass** ([props-resolver.ts:50-65](../packages/server/engine/src/lib/variables/props-resolver.ts)) — highest blast radius, smallest change. Only `variables.`/`connections.` tokens ever need the censored value ([:183-207](../packages/server/engine/src/lib/variables/props-resolver.ts)); step-output tokens (the common case) resolve identically both passes. Detect which tokens need censoring and resolve the rest once.
3. **Scope router resolution to the matched branch** ([router-executor.ts:18-24](../packages/server/engine/src/lib/handler/router-executor.ts)) — same pattern PR #14047 uses for loops. Verify with the router microbench (cost should stop scaling with branch count).
4. **Clone `currentState` once per resolve, not per token** ([props-resolver.ts:50-65](../packages/server/engine/src/lib/variables/props-resolver.ts) → `evalInScope` → `runScript`), and/or pool isolates. This is the per-token churn (finding #4) and the quadratic fan-in cost.
5. **Fix the substring matcher** ([props-resolver.ts:107](../packages/server/engine/src/lib/variables/props-resolver.ts)) — use word-boundary/token-aware matching so `step_10` doesn't pull in `step_1`.
6. **Finding #6 (separate track):** make the code-step memory limit configurable (it's a hardcoded `128` at [v8-isolate-code-sandbox.ts:23](../packages/server/engine/src/lib/core/code/v8-isolate-code-sandbox.ts)), classify code-step OOM as **non-retryable** (a deterministic OOM re-OOMs — the incident's cron re-dispatch flood, ~80→~1,400 runs/day, amplified exactly this), and document resize-before-decode for image/PDF flows.
7. **Sample-data write-time cap** (finding #5) — cheap complementary defense; mirror `applyLogSizeLimitIfExceeded` in `flow-executor.ts`.

After each change, re-run the two test commands above and diff the numbers.

## Gotchas / things that will bite you
- **`AP_EXECUTION_MODE` is captured at import time** and the sandbox instance is cached
  ([code-sandbox.ts:5,36-44](../packages/server/engine/src/lib/core/code/code-sandbox.ts)). Tests that
  need the real isolate set `process.env.AP_EXECUTION_MODE = 'SANDBOX_CODE_ONLY'` **before** dynamic
  `import()`. `vitest.config.ts` sets `UNSANDBOXED` globally, so `no-op-code-sandbox` (no 128 MB cap)
  is the default — the perf test overrides it; the OOM test imports `v8IsolateCodeSandbox` directly so
  it's always capped.
- **Do NOT measure resolution by driving `flowExecutor.execute` over a big loop in a unit test.** Each
  loop iteration attempts a progress HTTP callback to a non-running mock API, so a 5k-item loop hangs
  ~78 s (a test artifact, not signal). Measure `resolver.resolve()` directly. Full-loop iteration cost
  belongs in the docker load fixtures, where the callbacks are served.
- **In the real stack, step outputs > 32 KB are sliced to files** at upsert
  ([flow-execution-context.ts:205-222](../packages/server/engine/src/lib/handler/context/flow-execution-context.ts),
  `maybeSliceOutput`) and re-downloaded + `JSON.parse`d on resolve. The microbenches run with
  `engineApi` undefined so slicing is off — they measure the in-memory clone only. Account for the
  extra download + parse when reasoning about production.
- Heap-delta measurements are noisy (GC timing); the microbench numbers are ratios/shapes, not
  guarantees. Run with `--expose-gc`.

## Files touched by this investigation
- `benchmark/PROPS_RESOLVER_AUDIT.md` — findings #1–#6 + "why 6×" appendix
- `benchmark/EXPERIMENTS.md` — "Experiment 3" write-up
- `benchmark/setup-loop-huge.sh`, `setup-router-wide.sh`, `setup-csv-huge.sh`, `setup-image-oom.sh`, `poll-metrics.sh`
- `benchmark/run-local.sh` — added `AP_REUSE_SANDBOX` passthrough
- `packages/server/engine/test/variables/run-action-resolution.perf.test.ts` — 5 microbenchmarks
- `packages/server/engine/test/core/code/v8-isolate-code-sandbox.test.ts` — OOM baseline (2 tests added)

## Verification checklist before you call a fix done
- `cd packages/server/engine && NODE_OPTIONS="--expose-gc" npx vitest run test/variables/run-action-resolution.perf.test.ts` — passes, numbers improved
- `npx vitest run test/core/code/v8-isolate-code-sandbox.test.ts` — passes (or re-baselined intentionally)
- `npm run lint-dev` — required gate (0 errors)
- If you touched `packages/core/shared`, bump its `package.json` version (see root CLAUDE.md)
