# CLOUD_FUNCTION execution runtime

A pluggable execution runtime that runs flows on **per-project Cloud Functions (2nd gen)**
instead of a local pool of sandbox processes. Each function is a **self-contained image baked
with that project's pieces + code** (rebuilt on publish). Provisioning is cheap and idempotent —
a function is deployed once per project and reused for every subsequent run.

```
worker job  (AP_EXECUTION_RUNTIME=CLOUD_FUNCTION)
  └─ createCloudFunctionRuntime
       ├─ functionProvisioner ──RPC──▶ API server: ensureFunction(projectId)
       │                                  ├─ Redis fast lookup (shared across cluster)
       │                                  ├─ distributed lock (one deploy per project)
       │                                  └─ gcloud functions deploy/describe --gen2 (skip if exists)
       └─ remoteSandbox ──HTTP──▶ gen2 function  (GET /health, POST /execute + Bearer)
```

There is **one** provisioning path: the worker always calls the API server, and the API server
always deploys to GCP. There is no STATIC / runtime-selectable provisioner. For **local dev and
tests, use `WORKER_POOL`** — the cloud path keeps a single production-shaped code path.

## Why this is cheap, scalable and low-latency

- **Provisioning is skipped on the hot path.** Three layers short-circuit it: a worker-local
  in-memory cache, a cluster-wide Redis entry (`function:provisioned:<projectId>`), and the
  cloud `describe` probe. The slow `deploy` only happens the very first time a project ever runs.
- **Multi-server safe.** On a cache miss exactly one node deploys, guarded by a Redis distributed
  lock (`function:provision:<projectId>`); everyone else blocks then reads the freshly written
  Redis entry (double-checked locking).
- **Scales horizontally two ways.** Cloud Run autoscales each project's function on request
  concurrency, and the worker no longer holds a local process per run — so one worker fans out
  many concurrent HTTP executions (default `concurrencyFor(CLOUD_FUNCTION) = 50`).
- **Per-project isolation.** Each project gets its own function (`ap-engine-<projectId>`), so a
  noisy or compromised project can't touch another's compute.

## End-to-end proof (docker-compose smoke test)

```bash
./run-smoke.sh
```

This builds the engine bundle + smoke bundle, then brings up three containers:

| service    | role                                                                        |
|------------|-----------------------------------------------------------------------------|
| `engine`   | the engine HTTP function — the same engine deployed to gen2 per project      |
| `mock-api` | minimal Activepieces API stand-in for the engine's run-log callbacks         |
| `smoke`    | drives the **real** `createCloudFunctionRuntime` against `engine`            |

The smoke runner stubs the control-plane `ensureFunction` RPC (a test double, not a runtime mode)
to point at the local `engine` container, executes a flow (manual trigger → code step that returns
`{ sum, product }`), and asserts the engine produced `{ sum: 5, product: 6 }`. Exit code 0 = pass.

Expected output:

```
[smoke] engine responded status=OK in ~40ms
[smoke] code step output: {"sum":5,"product":6}
✅ SMOKE TEST PASSED — flow executed end-to-end on the remote engine function via the CLOUD_FUNCTION runtime
```

## Local dev & tests use `WORKER_POOL`

The cloud path has a single production shape (worker → API → GCP gen2), so local dev and tests do
**not** run a fake remote. In `.env.dev` keep the default runtime:

```dotenv
AP_EXECUTION_RUNTIME=WORKER_POOL
```

Flows run in local sandboxes exactly as before. The CLOUD_FUNCTION path is exercised by the
docker-compose smoke test above (which stubs the `ensureFunction` RPC) and the API-server unit
tests for the provisioning lock/Redis logic.

## Deploying for real — Cloud Functions (2nd gen)

The engine deploys as a **gen2** HTTP function (functions-framework entry, built from source).

```bash
# one-time: build the gen2 source bundle (rebuild when the engine changes)
./gcp-deploy.sh --build

# provision (or skip) a project's gen2 function
GCP_PROJECT=activepieces-b3803 \
GCP_KEY_FILE=~/gcp-deployer-key.json \
ENGINE_TOKEN=$(openssl rand -hex 32) \
./gcp-deploy.sh <ap-project-id>
```

To run the cloud path, set the worker runtime and give the API server the GCP config:

| env (worker)                | value                                                            |
|-----------------------------|------------------------------------------------------------------|
| `AP_EXECUTION_RUNTIME`      | `CLOUD_FUNCTION`                                                |

| env (API server)            | value                                                            |
|-----------------------------|------------------------------------------------------------------|
| `AP_FUNCTION_GCP_PROJECT`   | GCP project id                                                   |
| `AP_FUNCTION_GCP_REGION`    | e.g. `us-central1`                                              |
| `AP_FUNCTION_GCP_SOURCE`    | path to the gen2 build dir (`deploy/.../gen2/build`)            |
| `AP_FUNCTION_GCP_RUNTIME`   | e.g. `nodejs22` (optional)                                      |
| `AP_FUNCTION_GCP_KEY_FILE`  | path to the deployer key                                        |
| `AP_FUNCTION_ENGINE_TOKEN`  | shared bearer token the engine validates                        |

## Cold boot

gen2 scales to zero, so the first request to an idle project's function pays a cold start
(~1–3s for this slim function). After that the warm path is the ~40ms seen in the smoke test.
Trade cost for latency with `--min-instances 1` per hot project.
