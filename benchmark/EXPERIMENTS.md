# Benchmark Experiments

A log of the load-test experiments run against the **worker-is-the-sandbox** execution model
(ADR 0003 / ADR 0004), so the methodology and findings can be reused without re-deriving them.

Each experiment records: the question, the rig, how to reproduce it, and the measured output.

---

## Experiment 1 — GKE app : worker ratio (1:10 vs 1:20)

**Question.** At a fixed app size (1 vCPU / 1 GB), does halving the app:worker ratio from 1:20 to
1:10 (twice as many app pods per worker) buy proportionally more throughput — for warm and for cold
traffic?

### Rig

| Component | Configuration |
|---|---|
| Cluster | GKE, `e2-standard-4` × 14 nodes, `europe-west1-b` |
| Worker | One sandbox per worker, concurrency 1, in-process engine fork (`SANDBOX_CODE_ONLY`: Node child + isolated-vm). Hard cap **0.5 vCPU / 1 GB** |
| App | `1 vCPU / 1 GB` per pod |
| Object store | Real same-region **GCS** bucket (`europe-west1`) over the S3-interop endpoint (`storage.googleapis.com`, path-style + SigV4 presigned URLs). Engine pulls flow bundle + piece archives via signed links |
| Postgres / Redis | In-cluster |
| Load tool | [`hey`](https://github.com/rakyll/hey), `-c` = worker count (40 or 80) so requests don't queue behind the concurrency-1 workers — latency reflects real service time, not backlog |

**Pairs tested** (ratio is the only variable):

- **1:20** → `2 app / 40 worker` and `4 app / 80 worker`
- **1:10** → `4 app / 40 worker` and `8 app / 80 worker`

**Warm vs cold:**

- `warm` = `AP_REUSE_SANDBOX=true` — engine process reused between jobs.
- `cold` = `AP_REUSE_SANDBOX=false` — fresh engine fork + boot every job (the realistic isolation guarantee).

### The flow under test

A 4-node synchronous webhook flow:

1. **Webhook trigger** (`catch_webhook`, `/sync` — holds the HTTP connection until the flow returns)
2. **Math Helper** (`addition_math`, `2 + 3`)
3. **Code step** in isolated-vm (`return { result: Number(inputs.sum) + 1 }`)
4. **Webhook response** (`sendFlowResponse`)

The actual compute is sub-millisecond; everything measured below is orchestration overhead.

### How to reproduce

```bash
# Deploys benchmark/k8s-sandbox.yaml to the cluster, runs the load test against the app
# LoadBalancer, and reports cold-boot latency, warm throughput, and the per-run breakdown.
WORKER_REPLICAS=80 APP_REPLICAS=8 REUSE_SANDBOX=true benchmark/run-gke.sh 1000 80
```

Vary `WORKER_REPLICAS` / `APP_REPLICAS` for each pair and `REUSE_SANDBOX` for warm vs cold. The
cluster + GCS bucket were torn down after the run (teardown commands are printed at the end).

### Results

**Headline — throughput by config** (app limit 1000m, worker limit 500m; the bottleneck is whoever
saturates its cap first):

| Config | Warm req/s | Cold req/s | App CPU/pod (cold) | Worker CPU/pod (cold) |
|---|---|---|---|---|
| 2 app · 40 w | 59.1 | 19.8 | 415m (42%) | 346m (69%) |
| 4 app · 40 w | 93.5 | 19.6 | 257m (26%) | 339m (68%) |
| 4 app · 80 w | 110.5 | 33.3 | 0m (0%)¹ | 0m (0%)¹ |
| 8 app · 80 w | 148.9 | 33.5 | 235m (24%) | 336m (67%) |

¹ `kubectl top` sampling missed this cold run; CPU not captured.

**Latency anatomy** — where the milliseconds go (warm 8a/80w vs cold 2a/40w):

| Layer | Warm | Cold | What it is |
|---|---|---|---|
| app ingress + Redis + worker poll | ~91 ms | ~39 ms | webhook→app→Redis enqueue→worker dequeue, + response delivery back |
| provision | 24 ms | 16 ms | flow-bundle + piece + engine install — all disk-cache hits |
| sandbox boot | 18 ms | 1167 ms | warm = process reused; cold = fresh fork + Node start + bundle parse + isolated-vm init + socket connect |
| flow run (4 steps) | 372 ms | 762 ms | per-step engine→app callbacks + isolated-vm code + response handshake |
| **end-to-end avg** | **505 ms** | **1984 ms** | p50 446/1957 · p95 648/2183 · p99 3817/2986 ms |

- **The cold "sandbox boot" tax (1167 ms).** A fresh engine fork pays Node startup (incl. the
  ~80 ms `--no-node-snapshot` penalty forced by isolated-vm), 694 KB engine-bundle parse/compile
  (the bulk), and socket.io connect (~90 ms). In isolated profiling this is ~570 ms; under sustained
  cold load it inflates to ~1167 ms because ~40 workers fork at once, each capped at 0.5 CPU, and
  contend — boot is CPU-bound. Warm reuses the process and pays just 18 ms.
- **"flow run" (372 ms warm / 762 ms cold)** is orchestration, not compute: after each step the
  engine reports progress / persists output via an HTTP callback to the app (3 runnable steps ≈ 3
  round-trips + flow load + final `sendFlowResponse`), plus the isolated-vm code call. Direct
  evidence it's app-callback-bound: adding apps cut warm flow-run from 477 ms (1:20) → 372 ms (1:10)
  with identical steps — pure compute wouldn't move. Cold flow-run is ~2× warm because the
  just-forked engine runs on a cold V8 (no JIT warmup) while contending for CPU.

### The ratio finding

| Workers | Mode | 1:20 | 1:10 | Δ |
|---|---|---|---|---|
| 40 w | warm | 59.1 (2a) | 93.5 (4a) | +58% |
| 40 w | cold | 19.8 | 19.6 | −1% |
| 80 w | warm | 110.5 (4a) | 148.9 (8a) | +35% |
| 80 w | cold | 33.3 | 33.5 | +1% |

- **Warm: 1:10 does add throughput** — at 80 workers 111 → 149 req/s (+35%). The app is the warm
  bottleneck (workers idle ~11–14%), so more apps = more callback capacity = lower flow-run latency =
  higher throughput. The 40-worker pair shows +58%, smaller because 40 workers can't push enough warm
  load to fully use even the 1:20 apps.
- **Cold: 1:10 makes essentially no difference** (−1% / +1%) — cold is worker-bound (each job pays
  the ~1.1–1.3 s fork+boot; workers at 64–68%), so extra apps sit idle.

**Verdict.** 1:10 helps only warm/burst traffic and only where workers can saturate the apps; for cold
(the realistic isolation path) it's wasted apps. Since apps at 1 vCPU are cheap relative to the worker
fleet, 1:10 is a reasonable safety margin for warm-heavy workloads, but **1:20 is the efficient
default** — the extra apps in 1:10 buy headroom, not a proportional throughput gain.

### Notes on caching

Provisioning is cheap because pieces are cached. A worker is its own sandbox and fills its piece cache
lazily on first use (the old `AP_PRE_WARM_CACHE` up-front install step no longer exists). After first
use the piece + flow bundle live on the worker's local disk, so warm runs do zero install work — here
flow-bundle download ≈ 2 ms and piece install ≈ 3–13 ms. On a cold/first install the archive is pulled
from the same-region S3 bucket via a signed link (fast in-region fetch, not a slow npm round-trip).
**Cache warmth comes from running long-lived worker replicas, not a warm-up flag.**

> Measurement caveat: layer numbers are from `hey` + engine timing logs. Per-step splits weren't
> captured (the engine logged flow-run as one aggregate), so the within-step attribution is
> structural, not timed.

---

## Experiment 2 — Autoscaling: how fast does new worker capacity arrive, and is scale-down safe?

**Question.** When the worker deployment scales up, how long until a new worker actually takes
jobs — (a) on a node with spare capacity, (b) when the cluster autoscaler must add a node? And
does deleting a worker pod under load lose runs?

Raw measurement logs: [`data/autoscaling-2026-07-02/`](data/autoscaling-2026-07-02/).
Written up for users in `docs/install/architecture/autoscaling.mdx`.

### Rig

| Component | Configuration |
|---|---|
| Cluster | GKE standard, `e2-standard-4`, `--enable-autoscaling --min-nodes 2 --max-nodes 5`, `europe-west1-b` |
| Worker | 0.5 vCPU / 1 GB, concurrency 1, `SANDBOX_CODE_ONLY`, `AP_REUSE_SANDBOX=true`, v0.85.4 |
| Images | worker 126 MiB compressed (13 layers), app 551 MiB (24 layers); worker registry cross-region (us-central1 → europe-west1), so pull times are an upper bound |
| Method | `kubectl scale` timestamped, then pod events (`Scheduled`/`Pulling`/`Pulled`/`Started`) + the worker's `"Worker started, polling for jobs..."` log line (needs `AP_LOG_LEVEL=info`; the benchmark manifest defaults to `error`) |

Workers have **no readiness probe** — pod `Ready` only means the container started. The honest
"capacity available" marker is the polling log line, which is what all numbers below use.

### Scale-up, warm node (capacity free, image cached) — 7 samples

`kubectl scale` → polling: **4.57 / 4.69 / 4.76 / 4.77 / 4.80 / 4.90 / 4.96 s** (median ~4.8 s).
Stages: scheduled ~0 s → cached-image digest check +1 s → container started ~+2 s → Node boot +
settings fetch + Socket.IO connect → polling ~+5 s.

### Scale-up, new node (cluster autoscaler) — full path 87 s

Forced by scaling past the fleet's free CPU (worker requests are `requests==limits`):

| Stage | Cumulative |
|---|---|
| Scale command (pod unschedulable, `TriggeredScaleUp`) | 0 s |
| Node created / Ready | +59 s / +60 s |
| Worker image pulled (uncached, cross-region, ~21–24 s) | +83.8 s |
| Container started / pod Ready | +83.8 s / +84.8 s |
| **Worker polling for jobs** | **+87.0 s** |

Unschedulable → node Ready was ~60 s in both observed scale-up events (61 s, 60 s). A node that
already exists but lacks the image costs only the pull: +17.4 s to polling (14 s pull). Uncached
pulls observed: 10.2–17.1 s (n=5).

### First job on a fresh worker

First `job.execute`: 3.30 s = provision 1223 ms (pieces install 1153 ms) + sandbox boot 1103 ms +
run 786 ms. Second job on the same worker: 247 ms. One-time cold start per new worker, as
documented in `docs/install/architecture/latency.mdx`.

Under a shallow queue (hey `-c 8` vs 4→6 workers) the new workers' first *completed* job logged
~22 s after the scale command — pickup contention with already-warm workers, not boot time. Don't
use time-to-first-job under light load as a boot metric.

### Scale-down drain (pod deleted under load)

Victim had executed 252 runs and had one in flight. `kubectl delete pod` →

| Event | Delta |
|---|---|
| In-flight `job.execute` completed | +0.42 s |
| `Worker stopped` (after `drainInFlightJobs()`) | +0.49 s |
| Pod fully gone | +1.7 s |

Client + server verification: the concurrent `hey` run returned **747/747 HTTP 200**; the
flow-runs API showed **0** `FAILED` / `INTERNAL_ERROR` / `TIMEOUT` runs afterwards. (A separate
150 s run that spanned a 14→4→6 rescale saw 8/2144 responses come back 408 — the sync-reply path
giving up during churn; the runs themselves all succeeded.)

### Takeaways

- Warm-node scale-up is ~5 s; the new-node path is ~85–90 s and is dominated by node provisioning
  (~60 s) + image pull. The worker's own boot is ~3–5 s either way.
- The 126 MiB worker image is what keeps the pull segment at 10–24 s; keep it in a same-region
  registry.
- Scale-down is lossless and sub-second — aggressive scale-down policies are safe.
- For sync webhooks (30 s budget) the new-node path cannot arrive in time: keep min replicas at
  the sync peak, autoscale the burst headroom above it (matches `production-setup.mdx`).

---

## Experiment 3 — Props-resolution / isolated-vm copy overhead

**Question.** When a step output is large (a big API response, or a parsed CSV/spreadsheet), how
much CPU and memory does *resolving* a downstream expression that references it actually cost — and
where does that cost blow up (censoring, router branches, per-token isolates, payload size)? This is
the bug class behind PR [#14047](https://github.com/activepieces/activepieces/pull/14047) (still
**open** — `main` is exposed); the full audit is in
[PROPS_RESOLVER_AUDIT.md](./PROPS_RESOLVER_AUDIT.md).

### Rig

Two layers, measured separately:

| Layer | What it isolates | How |
|---|---|---|
| **Engine microbench** | The `resolve()` clone/isolate cost alone — no HTTP callbacks, no loop iteration | [`run-action-resolution.perf.test.ts`](../packages/server/engine/test/variables/run-action-resolution.perf.test.ts), Vitest, `SANDBOX_CODE_ONLY` (Node + isolated-vm), `--expose-gc` for clean heap deltas |
| **Full-stack load** | End-to-end container CPU/RAM under real webhook load, incl. loop iteration + callbacks | `benchmark/` docker-compose + `hey`, metrics via `GET /v1/worker-machines` (`poll-metrics.sh`) |

The microbench measures `createPropsResolver().resolve()` on an input that references a large upstream
step output — the exact clone a `LOOP_ON_ITEMS` `items` expression, a router condition, or a piece
input pays. It deliberately does **not** drive `flowExecutor.execute` over the whole loop: in the unit
harness each loop iteration attempts a progress callback to a non-running mock API, so full-loop
numbers there are a test artifact, not signal. Whole-loop iteration cost is left to the load fixtures,
where the real stack serves those callbacks.

> Microbench numbers below are from a local WSL2 dev machine (single-threaded), so treat them as
> **ratios and scaling shapes**, not absolute production latencies. The scaling (per-branch,
> per-token, heap-vs-payload) is what transfers.

### The fixtures

- [`setup-loop-huge.sh`](./setup-loop-huge.sh) — webhook → CODE emits a Google-Docs-shaped payload
  (`PARAGRAPH_COUNT`, default 10k) → `LOOP_ON_ITEMS` over it → response. Deeply-nested shape.
- [`setup-router-wide.sh`](./setup-router-wide.sh) — webhook → CODE emits the payload → `ROUTER` with
  `BRANCH_COUNT` branches (non-matching branches reference the payload, only the fallback matches) →
  response. Isolates eager-all-branches resolution.
- [`setup-csv-huge.sh`](./setup-csv-huge.sh) — webhook → CODE builds **and parses a `ROW_COUNT`-row
  CSV (default 100k) × 8 columns** into row objects → `LOOP_ON_ITEMS` over the rows → response. The
  realistic "process a big spreadsheet/export" case: many small uniform objects, tens of MB.
- OOM control: `CODE_INPUT_SUM="$(cat oom-expression.txt)" benchmark/setup.sh` — confirms
  `MEMORY_LIMIT_EXCEEDED` still fires when a code step genuinely exceeds the 128 MB isolate cap.

### How to reproduce

```bash
# Engine microbench (hard numbers, no infra) — ~2 min
cd packages/server/engine
NODE_OPTIONS="--expose-gc" npx vitest run test/variables/run-action-resolution.perf.test.ts

# Full-stack load (docker) — sweep the CSV row count to find the memory cliff
benchmark/poll-metrics.sh metrics.ndjson &          # TOKEN from setup output
ROW_COUNT=100000 benchmark/setup-csv-huge.sh        # or 10000 / 50000 to sweep
hey -n 200 -c 2 -t 120 "http://localhost:8080/api/v1/webhooks/$FLOW_ID/sync"
```

### Results — engine microbench (measured)

| Scenario | Payload | Time | Heap Δ | Confirms |
|---|---|---:|---:|---|
| Loop `items` resolution (nested) | 6.3 MB | 517 ms | **47.7 MB** (7.5×) | RUN-path resolver clone cost |
| CSV `items` resolution (100k rows) | 18.5 MB | 1,177 ms | **109.5 MB** (5.9×) | large parsed-array clone |
| Censoring double-pass (2 tokens) | 3.8 MB | 309 ms | — | ~2× tax vs ~155 ms single-pass (finding #2) |
| Router, 3 branches | 6.3 MB | 558 ms | — | ~150 ms/branch |
| Router, 10 branches | 6.3 MB | 1,585 ms | — | eager-all-branches, linear (finding #3) |
| Router, 30 branches | 6.3 MB | 4,407 ms | — | ~147 ms/branch — no payload dependence |
| Isolate churn, 1 token | 3.1 MB | 94 ms | — | baseline |
| Isolate churn, 3 tokens | 3.1 MB | 221 ms | — | ~62 ms/token |
| Isolate churn, 5 tokens | 3.1 MB | 309 ms | — | linear per-token (finding #4) |

**The memory headline.** Resolving a single expression clones the referenced payload several times
over (the `JSON.stringify` string + the `JSON.parse` clone + the `ivm.ExternalCopy` into the isolate +
the resolved output), so **heap grows to ~6–7× the payload size**. At 18.5 MB the resolution alone
touches ~110 MB of heap — meaning a step output of only ~20–25 MB pushed through resolution already
approaches the hardcoded **128 MB** isolate cap, at which point the step OOMs and the job is
SIGKILLed/retried (the exact `MEMORY_LIMIT_EXCEEDED` path). That is the practical ceiling on how big a
CSV/API-response a flow can carry through an expression today.

**The CPU headlines.** Router cost is ~150 ms per branch and is **independent of which branch
matches** — a 30-branch router pays ~4.4 s resolving branches that never run (finding #3). Per-token
isolate churn is ~62 ms per `{{...}}` token because each token spins up and tears down its own 128 MB
V8 isolate (finding #4). The censoring double-pass roughly doubles resolution wall-clock for
step-output tokens that never need censoring (finding #2).

### Results — full-stack load (to run)

Container-level CPU/RAM under `hey` load and the CSV `ROW_COUNT` cliff (row count at which container
memory saturates / `MEMORY_LIMIT_EXCEEDED` first fires) are pending a docker run of the fixtures
above. The OOM control fixture intentionally triggers isolate OOM + retry churn, so run it
deliberately, not as part of a clean throughput sweep.

### Takeaways

- **Fix order** (from the audit): land PR #14047 → kill the censoring double-pass (finding #2, every
  run, ~2× today) → scope router branch resolution to the matched branch (finding #3) → then the
  architectural per-token isolate reuse (finding #4).
- **Heap ≈ 6–7× payload during resolution** is the number to design around: keep single step outputs
  that feed expressions well under ~15–20 MB, or the 128 MB isolate cap becomes reachable. For big
  CSVs/exports, stream or paginate rather than carrying the whole parsed array through one expression.
- Router latency scales with **branch count, not payload** — wide routers are the silent cost.
