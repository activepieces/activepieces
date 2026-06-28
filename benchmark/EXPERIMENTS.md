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

## Experiment 2 — Does throughput scale linearly as app+worker instances scale? (and the DB hotpath ceiling)

**Question.** Keeping a fixed 1:10 app:worker ratio, does throughput grow proportionally as we scale
the fleet (2a/20w → 4a/40w → 8a/80w)? If not, which shared singleton (the single Postgres or Redis)
saturates first and caps it?

### Rig

Same worker-is-the-sandbox model as Experiment 1, rebuilt in a fresh project (`activepieces-372016`,
cluster `ap-sandbox-bench`, `us-central1-a`, autoscaling e2-standard-4). Object store is a same-region
GCS bucket over the S3-interop endpoint with signed URLs. App `1.5 vCPU`, worker `0.5 vCPU`/1 GB
concurrency-1. Postgres + Redis are single in-cluster pods — **the shared singletons under test**.

### How to reproduce

```bash
# Project-agnostic now: pass the registry/bucket/cluster via env (defaults still point at the old b3803 rig).
export CLUSTER=ap-sandbox-bench ZONE=us-central1-a
export APP_IMAGE=us-central1-docker.pkg.dev/activepieces-372016/bench/ap-app:bench
export WORKER_IMAGE=us-central1-docker.pkg.dev/activepieces-372016/bench/ap-worker:bench
export AP_S3_BUCKET=ap-bench-372016 AP_S3_REGION=us-central1
export AP_JWT_SECRET=bench-fixed-xxxx   # pin it: the sweep runs run-gke.sh 3× and the app is NOT restarted between runs
REUSE_SANDBOX=false benchmark/run-scaling-sweep.sh   # cold; REUSE_SANDBOX=true for warm
```

`run-scaling-sweep.sh` loops `run-gke.sh` over `2:20 4:40 8:80` and tabulates **req/s per worker**
(flat ⇒ linear) against Postgres/Redis CPU.

### Result — scaling is linear; the ceiling is the per-request DB work

| Sweep (1:10) | Cold req/s | Cold linearity | Warm req/s | Warm linearity |
|---|---|---|---|---|
| 2a · 20w | 8.6 | base | 45.3 | base |
| 4a · 40w | 17.0 | 99% | 89.2 | 98% |
| 8a · 80w | 37.5 | 109% | 165.0 | 91% |

- **Cold is sandbox-boot-bound** (~1.1 s fork+boot per run dominates), and that cost is *per-worker
  CPU*, so it parallelizes perfectly — throughput scales linearly and Postgres/Redis sit idle.
- **Warm is the regime that stresses the shared singletons** (the boot tax is gone, so per-request
  orchestration + DB work dominates). It scales near-linearly too, but the gentle droop
  (2.27 → 2.06 req/s/worker) was the first sign of the real ceiling.

### The ceiling: ~20 DB transactions per request, Postgres CPU-bound

A clean, fully-warmed warm run at 8a/80w (`pg_stat`-instrumented) showed the orchestration hotpath is
**Postgres-bound, not idle** — earlier "idle Postgres" reads were `metrics-server` sampling lag on
short runs (and a throttle test that accidentally hit a wiped emptyDir DB — Postgres uses `emptyDir`,
so any pod restart wipes it; re-seed after restarting it).

Per-request DB profile (`pg_stat_user_tables` over a clean burst), ranked:

| table | reads/req | writes/req | note |
|---|---|---|---|
| **piece_metadata** | **10.5** | ~0 (hotpath) | full immutable metadata re-fetched per `getPiece` RPC / bundle resolve |
| flow_run | 7.5 | ~2.8 | run row + status updates + read-after-write in the metadata queue |
| file | 5.6 | ~1.9 | payload offload + per-step output/log metadata rows |
| project | 3.8 | 0 | re-loaded ~once per engine→app callback (auth/principal) |
| flow / flow_version | 1.9 / 1.9 | 0 | engine re-fetches the locked version per run (`engine-controller GET /flows`) |

At 137 req/s × ~20 xact = **a single Postgres at ~811m CPU — near saturation**. This is what caps
linear scaling: add workers past ~80–100 and the single Postgres becomes the wall regardless of fleet
size.

### Fix — cache the immutable piece metadata (the #1 offender)

`pieceMetadataService.get()` → `fetchPieceVersion()` did a `piece_metadata` `findOne` on **every**
call; the existing `dedupe()` only collapses *concurrent* in-flight calls, and the in-process
`pieceCache` held only a lightweight registry, not the full metadata. But an exact
`name:version:platformId` is **immutable**, and the only writers (`create`/`delete`/`bulkDelete`)
already broadcast invalidation over the `PIECE_REGISTRY_INVALIDATION_CHANNEL` pubsub. So a persistent
in-process metadata cache, cleared by that same invalidation, is safe (see `piece-cache.ts` +
`piece-metadata-service.ts`).

**Before → after (warm 8a/80w, same flow, same protocol):**

| metric | baseline | with fix | Δ |
|---|---|---|---|
| throughput | 137.7 req/s | **166.8 req/s** | **+21%** |
| Postgres CPU | avg **811m** (max 896) | avg **232m** (max 680) | **−71%** |
| DB xact/request | 20.4 | 17.4 | −14% |
| avg latency | 0.54 s | 0.44 s | −19% |

The transaction-count drop is modest but Postgres CPU fell **71%** — the eliminated reads were
CPU-heavy (large JSON rows with actions/triggers/props deserialized ~10×/run). Postgres went from
near-saturation to comfortable at *higher* throughput, pushing the saturation point from ~170 req/s
out to ~700+ req/s — i.e. the fleet can scale ~3–4× further before Postgres is the wall.

### Levers 2 & 3 — cache the immutable project platformId and locked flow version

Same pattern, applied at the **service level** (one fix covers every caller, not just one endpoint):

2. **project `platformId` (3.7 → 2.0 reads/req)** — `projectService.getPlatformId` is called ~5×/run
   (run creation + worker RPCs), each a `project` SELECT. A project's platformId is immutable, so it's
   memoized in-process (`project-service.ts`). NB: the *first* attempt cached the wrong layer
   (`engine-controller GET /flows`) — the engine actually fetches via the **worker RPC
   `getFlowVersion`**, so the cache must live in the service, not the HTTP handler.
3. **locked flow_version (1.9 → 1.0 reads/req)** — `flowVersionService.getOne` cached for `LOCKED`
   versions only (immutable; DRAFT stays uncached). Removes the heavy trigger-JSONB read + migration
   pass the worker RPC does each run.

**Verified per-request read reductions (pg_stat over a fixed request count — the reliable metric):**

| table | baseline | +piece cache | +getPlatformId | +flowVersion |
|---|---|---|---|---|
| piece_metadata | 10.5 | **0.01** | 0.01 | 0.01 |
| project | 3.7 | 3.7 | **2.0** | 2.0 |
| flow_version | 1.9 | 1.9 | 2.1 | **1.0** |

The **piece_metadata cache (lever in §"Fix" above) is the dominant win** — those were CPU-heavy JSON
rows, and the back-to-back baseline→fix comparison moved Postgres from 811m→232m and throughput +21%.
Levers 2 & 3 verifiably remove ~2.6 more (lighter) reads/req and raise headroom further, but their
increment is **within this rig's run-to-run throughput noise** (3000-req warm runs swung 117–167 req/s
on engine-warmup variance; `kubectl top` pg-CPU swung 22–811m on metrics-server lag with 3–7 samples).
Trust the `pg_stat` read-count deltas, not the per-run `top`/throughput snapshots, for the small levers.

### Remaining (not done — lower value or higher risk)

- **flow existence check (≈2 reads/req)** — the `getFlowVersion` RPC also `getOneById`s the flow purely
  as a "still exists?" guard. Flow rows are mutable (status/publishedVersionId), so caching is riskier
  for a light read — left alone.
- **flow_run (≈8 reads + ≈2.8 writes/req)** and **file (≈6 reads + ≈1.9 writes/req)** are the
  data-path floor: run-state persistence (incl. the `flow-runs-queue.ts` read-after-write — a
  distributed-lock/waitpoint path, touch with care) and per-step file metadata. Reducing these needs
  batching/protocol changes, not a cache.

---

## Experiment 3 — The non-DB scaling ceiling: Redis op amplification

**Question.** Postgres was the obvious shared singleton (Experiment 2). With its load cut, what is the
*next* thing that caps linear scaling — and is it a database at all?

### Method

At 8a/80w warm, sample Redis's own counters under sustained load (`INFO stats`
`instantaneous_ops_per_sec`, `INFO cpu` `used_cpu_*` delta over a timed window, `INFO commandstats`
per-command counts over a fixed request count). Redis CPU from Redis itself, **not** `kubectl top` —
metrics-server lag made `top` report Redis at "5m" while it was actually doing 27k ops/s.

### Result — Redis is the binding shared-resource ceiling, and it's not the database

- **~158 Redis operations per request** for the 4-step flow (27,000 ops/s at ~165 req/s).
- **Redis CPU: 51% of one core at 163 req/s** (12.7 CPU-seconds over 25 s). Redis is **single-threaded**,
  so it saturates one core at **~320 req/s (~160 workers)** — that is the hard linear-scaling wall.
  After Experiment 2's caches pushed Postgres out to ~700 req/s, **Redis now caps first.**
- At 80 workers (~165 req/s) *nothing* is saturated (Redis 51%, Postgres ~0.23 core): throughput there
  is **latency-bound** (~440 ms orchestration round-trip × 80 concurrent ≈ 180 req/s). Adding workers
  raises req/s ~linearly **until Redis hits 100%**, then it flattens.

### Where the 158 ops/request go (`INFO commandstats`, per request)

| command(s) | /req | subsystem |
|---|---|---|
| `xadd` + `xtrim` | ~17 | BullMQ event streams (one append per job state transition) |
| `evalsha` | ~13 | BullMQ LUA scripts (add / move-to-active / move-to-finished) |
| `hmget`+`hget`+`hgetall`+`hmset`+`hset`+`hincrby` | ~43 | BullMQ job hashes + `distributedStore` run-metadata hash |
| `del`+`set`+`get`+`exists`+`incr` | ~41 | Redlock (`distributedLock`) + dedup keys + store |
| `zadd`+`zrangebyscore`+`zcard` | ~15 | BullMQ wait/active/delayed sorted sets |
| `rpoplpush` | ~4 | BullMQ job fetch (wait → active) |

**Root cause — the per-step run-metadata path is BullMQ-heavy.** Every status/progress update
(`uploadRunLog` → `runsMetadataQueue.add`, `runs-metadata-queue-factory.ts`) is a **full BullMQ job
lifecycle** (~20 Redis ops: add+fetch+complete across hashes/sorted-sets/streams) **plus** a
`distributedStore.merge`, **plus** in the consumer a per-run **Redlock** (`runs_metadata_${runId}`,
`flow-runs-queue.ts`) and more store ops. With the webhook execution queue on top, a single 4-step run
drives ~158 single-threaded-Redis ops. This is the textbook non-DB bottleneck: a shared single-threaded
resource whose per-request work doesn't shrink as you add app/worker pods.

### Levers to push the Redis ceiling out (ranked; not yet applied — architectural, higher risk)

1. **Fewer metadata-queue jobs per run.** On the production sync path (no one watching live progress),
   persist `START` + terminal state instead of every intermediate `uploadRunLog`. Each eliminated
   update removes ~25–40 Redis ops. Biggest lever; needs care so the runs UI still reflects state.
2. **Trim BullMQ event streams** (`xadd`/`xtrim` ≈ 17 ops/req). Nothing consumes `QueueEvents` on these
   queues here; capping/disabling the events stream is ~11% of the ops. Config-level, verify no
   monitoring depends on it.
3. **Lighten the metadata consumer.** Drop the read-after-write (Exp. 2 §remaining) and reconsider the
   per-update Redlock (dedup already coalesces pending updates) — fewer `evalsha`/`get`/`del`.
4. **Scale Redis horizontally** (Redis Cluster / separate Redis for BullMQ vs pub/sub vs store). Ops
   move, not code — the clean way past a single-threaded ceiling if op-count can't drop enough.

> Reliable-metric note: trust Redis's own `INFO` counters (ops/sec, `used_cpu`, commandstats) over
> `kubectl top` — metrics-server lag made every per-pod `top` reading in this rig untrustworthy on
> short runs (Redis "5m" vs the real 51% of a core; Postgres "17m" vs the real ~811m in Exp. 2).
