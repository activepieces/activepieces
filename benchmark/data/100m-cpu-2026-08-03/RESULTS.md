# 100m-CPU worker benchmark — CPU-bound vs I/O-bound flow (2026-08-03)

Prompted by a customer report: at 100m worker CPU they saw p50 1–2 s and frequent errors, and asked
whether the benchmark reflects real-world flows (theirs mostly wait on external APIs). The default
benchmark flow makes **no external calls** — it is pure orchestration + CPU — so this run measures
both shapes at 100m:

1. **CPU-bound** — the standard flow: webhook → math → code → return response.
2. **I/O-bound** — same flow + an HTTP piece step that GETs an in-cluster endpoint responding
   after **5 s** (`benchmark/k8s-delay.yaml`), simulating a slow external API.

Primary config is **2 apps / 20 workers** (1:10). A 2 apps / 40 workers pass was also run and is
kept as a second column.

## Rig

| Component | Configuration |
|---|---|
| Cluster | GKE `ap-sandbox-bench`, `e2-standard-4` × 4 (× 5 for the 40w pass), `us-central1-a`, project `activepieces-372016` |
| Worker | **100m CPU** / 1 GB (requests==limits), concurrency 1, `SANDBOX_CODE_ONLY`, `AP_REUSE_SANDBOX=true` (warm), 20 replicas (40 in the second pass) |
| App | 2 × 1500m / 1 GB |
| Images | `us-central1-docker.pkg.dev/activepieces-372016/bench/{ap-app,ap-worker}:envfix` |
| Object store | GCS `ap-bench-us-372016` (us-central1) over S3-interop + signed URLs |
| Load | `hey`, 1000 requests @ concurrency = worker count |
| Reference | Experiment 1 in `EXPERIMENTS.md`: 2 app / 40 worker warm pair at **500m** did 59.1 req/s |

## Benchmark 1 — CPU-bound flow @ 100m workers

1000/1000 HTTP 200 in both passes. Logs: `bench1-cpu-bound-20w.log`, `bench1-cpu-bound.log` (40w).

| Metric | 2a / 20w | 2a / 40w | Reference @ 500m (2a/40w) |
|---|---|---|---|
| Warm throughput | **31.0 req/s** | 52.5 req/s | 59.1 req/s |
| Per-worker throughput | 1.55 req/s/worker | 1.31 | 1.48 |
| Latency avg / p50 | 632 / 618 ms | 733 / 720 ms | ~505 / 446 ms |
| p95 / p99 | 799 / 962 ms | 897 / 1021 ms | 648 / 3817 ms |
| Slowest | 1.11 s | 1.22 s | — |
| Cold boot (first request, fresh fork) | **9,284 ms** | 12,556 ms | ~2,000 ms |
| Worker CPU during load | avg 68m/pod (68% of cap) | 60m (60%) | 346m (69%) |
| App CPU during load | avg 430m/pod | 372m | — |
| Idle worker RSS | avg 137 Mi (127–151) | 140 Mi | — |

Per-run engine breakdown (20w pass, 1502 runs incl. warmup): provision 14.8 ms, sandbox boot
83.7 ms, sandbox run (4 steps) 542.7 ms, execution total 626.5 ms. (40w pass: boot 181 ms, run
694 ms, total 875 ms — more forks contending for CPU.)

**Reading.** Warm throughput per worker at 100m is essentially the 500m number (1.55 vs 1.48
req/s/worker) — the warm path waits on app callbacks, not worker CPU. Latency is also *better* at
20w than 40w (p50 618 vs 720 ms): fewer workers means less callback contention on the 2 apps. What
100m really costs is the **cold path**: a fresh engine fork is CPU-bound, so capping at 1/5 the CPU
turned the ~2 s cold boot into **9–12.6 s**. Any pod churn, scale-up, or `AP_REUSE_SANDBOX=false`
deployment at 100m pays that per fork — which matches the customer's "lots of errors at low CPU"
experience (sync webhooks time out long before such boots complete under load).

## Benchmark 2 — flow + 5 s external HTTP call @ 100m workers

Same rig and flow, plus an HTTP piece step (`send_request`, GET `http://delay`) between the code
step and the response. The delay service (`benchmark/k8s-delay.yaml`) answers after exactly 5 s —
verified 5.02 s in-cluster. 1000/1000 HTTP 200 in both passes. Logs: `bench2-http-5s-20w.log`,
`bench2-http-5s.log` (40w).

| Metric | 2a / 20w | 2a / 40w |
|---|---|---|
| Throughput | **3.47 req/s** (cap: 20 / ~5.7 s ≈ 3.5) | 6.53 req/s (cap ≈ 6.8) |
| Latency avg / p50 | 5.72 / 5.68 s | 5.91 / 5.81 s |
| p95 / p99 / slowest | 6.13 / 6.59 / 7.40 s | 6.55 / 7.15 / 8.97 s |
| Fastest | 5.47 s | 5.38 s |
| **Orchestration overhead over the 5 s call** | **~0.68 s at p50** | ~0.81 s at p50 |
| Worker CPU during load | **avg 23m/pod (23% of the 100m cap)** | 29m (29%) |
| App CPU during load | avg 307m/pod | 224m |
| Cold boot (first request, cold cache) | 16,771 ms | 18,159 ms |

Per-run engine breakdown (20w pass, 1042 runs): provision 12.5 ms, sandbox boot 124 ms, sandbox
run 5667 ms (≈ 5000 ms external wait + ~670 ms orchestration), execution total 5791 ms.

### Operational incidents at 100m (worth as much as the numbers)

- **Flow publish timed out (40w pass).** `LOCK_AND_PUBLISH` of the HTTP-step flow failed with
  `ENGINE_OPERATION_FAILURE: Worker did not respond within the safety timeout` — the engine
  operation behind publish (validate + first install of the heavier HTTP piece) exceeded the
  worker safety timeout on a cold 100m worker. It succeeded on retry once the piece cache was
  warm; the 20w pass published within the timeout. At 500m this has never been observed.
  Control-plane engine ops (publish, enable, test step) share the worker CPU cap with runs — at
  100m they flirt with the timeout whenever caches are cold. This is very likely a component of
  the customer's "frequent errors" at 100–200m.
- **Benchmark-rig gotcha (not a product issue):** re-running `run-gke.sh` against a live cluster
  mints a fresh random `AP_JWT_SECRET` and restarts only the workers; the app keeps the old
  secret, so all workers are rejected and jobs sit in `prioritized` forever. Pin `AP_JWT_SECRET`
  across runs (done for the 20w passes) or restart the app deployment too.

## Reading the two together (2a / 20w)

| | CPU-bound flow | + 5 s external call |
|---|---|---|
| Throughput | 31.0 req/s | 3.47 req/s |
| p50 | 0.62 s | 5.68 s (0.68 s above the call itself) |
| Worker CPU | 68% of 100m cap | **23% of 100m cap** |
| Errors | 0/1000 | 0/1000 |

1. **The default benchmark is a worst case for CPU.** It has no external I/O, so all of its
   latency is orchestration that scales with worker CPU. Real flows that wait on external APIs add
   roughly the same fixed overhead (~0.6–0.8 s at 100m warm) on top of the external latency, while
   the worker sits ~75% idle.
2. **100m is fine for the warm, steady-state I/O-bound path** — zero errors, overhead well under a
   second. What breaks at 100m is everything cold and CPU-bound: engine fork/boot (9–12.6 s vs
   ~2 s at 500m), first-time piece installs, and control-plane engine ops (publish/enable), which
   can hit the worker safety timeout. Under churn (deploys, scale-up, cache eviction) those become
   user-visible errors — matching the customer's instability report.
3. **Implication for the customer's cost question:** with concurrency-1 workers, an I/O-bound
   fleet is limited by slots, not CPU — 20 workers @ 100m served 3.5 req/s of 5 s-flows using
   ~0.5 vCPU total across the whole worker fleet. The lever for their workload is worker
   concurrency (more in-flight flows per worker/CPU) rather than more CPU per worker; 100m-class
   workers plus warm-pool hygiene (avoid cold forks in the hot path, pre-warmed piece caches,
   generous safety timeouts for control-plane ops) is the direction that makes their 5× cost
   target plausible.
