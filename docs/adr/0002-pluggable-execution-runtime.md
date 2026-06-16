---
status: accepted
---

# Pluggable execution runtime (worker pool / GCP function-per-project / Lambda)

## Revision (2026-06-16)

The original decision (preserved below) chose a **pull-and-share** artifact model: a
piece-set-keyed image **shared** across projects, with **flow JSON and code pulled from
the invoking worker at runtime**, and **one runtime at a time** per deployment.

This revision **supersedes that** in favour of a simpler **bake-everything, per-project**
model, because behavioural parity with the worker-pool engine turned out to matter more
than image-sharing and cheap flow edits. The affected decisions (§5, §6, §7, §8, §9) are
rewritten in place; the seam (§1), the two-abstraction split (§2–§3), and
piece-scoped-always-local (§4) are unchanged. In summary:

- **One cache preparer, used by every runtime.** The routine that populates today's
  worker cache is made runtime-agnostic — it fills a **target root folder** with
  engine + pieces + code (+ flow JSON) in the **exact layout the engine already reads**.
  `WORKER_POOL` points it at the global cache; cloud runtimes point it at a per-project
  staging folder. (Supersedes §5's "reuse none of the local installers".)
- **The image is a verbatim copy of that folder, keyed by `projectId`.** Nothing is
  pulled at runtime — the engine inside the container sees the cache **identically** to a
  local run. (Supersedes §6/§7's runtime pull path and the shared piece-set image.)
- **Routing is per run `environment`.** `TESTING` runs **always** execute on the local
  worker pool; only `PRODUCTION` runs route to the cloud runtime — which is what makes
  baking the high-churn flow JSON tolerable (interactive iteration never triggers a
  build). (Supersedes §9's "one runtime at a time" and §8's "drafts provision on first
  test".)
- **Cross-project image sharing via a content hash is deferred**, not designed in.

The original pull-and-share model is preserved under Considered options as the rejected
alternative, so the trade-off stays legible.

## Revision 2 (2026-06-16) — collapse to a single `ready()` deep module

This revision supersedes **§1**'s "job handlers untouched" and **§2**'s two-abstraction
split (and flips the "slim the run seam" Considered option from rejected to adopted).

The original seam exposed **two** caller-facing abstractions — `RuntimeProvisioner.provision()`
and `FlowExecutionRuntime.acquire()`/`start()` — and every job handler orchestrated
`provision → check → acquire → start → execute → release`. That sequence, plus the
flow-scoped/piece-scoped routing, sandbox reuse, and disable-on-missing-piece, leaked to
every call site (a shallow module).

Replace it with **one per-runtime deep module**: `ready(operation) → Sandbox`. It hides
the **provision** phase (now an internal step, not a caller-facing op), slot
**acquisition**, and **start**. Call sites collapse to `ready → execute`.

- `RuntimeProvisioner` and the trivial `worker-pool-provisioner` wrapper are **removed** —
  provisioning is folded into `ready()`.
- `cache/provisioner.ts` is **renamed** to the cache **preparer** (the §5 Prepared cache
  primitive); it stays because Piece-scoped operations still need a direct single-piece
  local fill in every runtime (§4).
- On-enable uses the **same** `ready()` (the `ON_ENABLE` engine run), so there is no
  separate "ensure ready" entrypoint.

The original "slim the seam" option was rejected only on a Phase-1 cost basis ("don't
rewrite handlers yet"). Now that the seam exists and the split proved leaky, the deeper
module is adopted deliberately — the handler rewrite is a net simplification.

## Revision 3 (2026-06-16) — socketless engine

This revision **rewrites §6**. The prior model kept the engine **dialing back to the
invoking worker over socket.io** for run callbacks. That socket is hostile to a
Lambda/Cloud-Run engine: a function cannot host an inbound listener for the worker, and
the reverse dial-back forces the worker's WS to be reachable from the execution network.
**Remove the worker↔engine socket entirely.** The seam (§1, as revised), the abstractions
(§2–§3), provisioning (§4–§5, §7–§8), and routing (§9) are unchanged.

- **The engine becomes a stateless HTTP request/response service.** Its core stays
  `execute(operation) → EngineResponse`; a thin HTTP entrypoint wraps it. The **local
  worker** POSTs the operation to the engine's loopback port; **Cloud Run** POSTs
  natively; **Lambda** is a thin handler shim over the same `execute()` core. One engine
  binary, identical invocation contract everywhere. socket.io is deleted from the engine.
- **Callbacks go engine → API directly**, not through the worker. The four run callbacks
  (`updateRunProgress`, `uploadRunLog`, `sendFlowResponse`, `updateStepProgress`) become
  direct HTTP calls authed by the engine's **existing run-scoped `engineToken`**
  (`PrincipalType.ENGINE`, already carrying `projectId`/`platformId`). The engine already
  calls the API directly this way for connections/files/tables; these callbacks were the
  last traffic through the worker, and the worker's handlers were a pure pass-through
  (`WorkerContract` ≡ `WorkerToApiContract`). The API gains four HTTP routes delegating to
  the **same** `worker-rpc-service` handlers. The migration is a transport swap at two
  engine call sites (`flow-run-progress-reporter`, already batched on a 15s flush; and
  `piece-executor`'s `sendFlowResponse`).
- **Engine lifecycle leaves the engine.** The socket-disconnect self-exit is removed; the
  engine carries **no liveness logic**. The local worker `treeKill`s on
  release/timeout/shutdown; cloud platforms reap natively. This **inverts** the prior
  "engine must self-terminate" stance — the reaper is now the spawner, not the engine.
  **Deferred follow-up:** a kernel-enforced backstop (**PR_SET_PDEATHSIG** / PID-namespace)
  for the case where the worker dies *uncleanly* (OOM-SIGKILL) and never runs `treeKill` —
  the 2026-05 orphan-OOM failure mode. Until that lands, an unclean worker death can orphan
  reused fork-mode engines; the backstop (plus an orphan test for the SIGKILL'd-worker case)
  is required **before cloud / high-density rollout**. The phase-1 test proves no orphan on
  clean release/shutdown.
- **Logs ride back in the HTTP response body** (uniform local + cloud — the worker cannot
  read a remote function's pipes). Crash classification comes from the process exit
  signal/code locally and the invoke error/5xx in cloud; no streamed stderr channel.

Non-issues confirmed: sync webhooks still resolve via the `workerHandlerId`/`SERVER_ID`
pubsub key (independent of which worker/function ran the flow); the rotating WS handshake
token is replaced by a per-spawn bearer token the engine requires on its execute route
(cloud uses platform IAM + a shared secret); the HTTP body limit must be raised to the old
`maxHttpBufferSize` for large file payloads.

## Context

Flow execution today is a fixed local pipeline: the worker polls BullMQ, acquires
a local `isolate`/process **sandbox** (`AP_WORKER_CONCURRENCY`, default 5), runs the
engine in it, and relays the engine's RPC to the API over socket.io. The sandbox
count is a CPU/RAM limit on the worker box.

Two problems motivate change:

1. **Realtime flows queue behind heavy flows.** Production runs that execute in
   ~6s sat in the queue for ~1,300s. The cause is *not* BullMQ — it is the fixed
   5-slot worker pool plus the per-project rate limiter (`rate-limiter-interceptor.ts`,
   5 concurrent `EXECUTE_FLOW` for STANDARD), both built around workers being a
   scarce, shared resource. When a project's heavy flows fill its slots, its own
   realtime flow gets rejected → exponential backoff → 1,300s.
2. We want execution to run on elastic cloud infra (GCP, later AWS) so capacity is
   no longer a fixed pool, while keeping a path back to the current local runtime.

## Decision

Introduce a third, orthogonal axis — the **Execution runtime** (`WORKER_POOL`,
`GCP_FUNCTION`, `LAMBDA`) — distinct from **Execution mode** (in-sandbox isolation
strength) and **Network mode** (egress posture, ADR-0001). A `GCP_FUNCTION` runtime
runs `UNSANDBOXED` inside, because the Cloud Run microVM is the isolation boundary.

### 1. Replace only the sandbox; the worker stays the orchestrator

The seam is the existing `Sandbox.execute(EngineOperation) → SandboxResult`
(`worker/src/lib/sandbox/types.ts`). The worker keeps polling BullMQ, relaying the
engine's RPC to the API, the sync-response/pubsub path, and `FlowRun` tracking
**unchanged**. Only the sandbox implementation is swapped for a remote invoke.

The shared **`FlowExecutionRuntime`** exposes a single deep module
`ready(operation) → Sandbox` (see §2, as amended by Revision 2): it ensures the
execution target is provisioned, acquires a slot, and starts the sandbox. A remote
runtime returns a `Sandbox` whose `execute()` invokes the project's deploy unit and
whose `release()` is trivial; `getActiveSandbox()` returns `null` (nothing local to
reap). Job handlers collapse to `ready() → execute()` — they no longer orchestrate
`provision`/`acquire`/`start`. The worker-pool-specific `boxId`/`proxyPort` stay inside
the worker-pool factory, off the shared seam.

This keeps both tracking layers intact: operational **job tracking** (BullMQ —
retries, dedup, scheduling, lock extension) and user-facing **run tracking**
(`FlowRun` in Postgres, updated via the engine's existing `uploadRunLog`).

### 2. One abstraction: the `ready()` deep module (amended by Revision 2)

Each runtime implements a single deep module on `FlowExecutionRuntime`:
**`ready(operation) → Sandbox`**, which internally performs **provision** (ensure the
target is runnable), **acquire** (a concurrency slot), and **start**. Impls:
`WorkerPoolRuntime` (fill the local cache via the Prepared cache → start a local
isolate/process sandbox), `GcpFunctionRuntime`, `LambdaRuntime` (ensure the Project
image + Deploy unit exist → return a remote-invoke sandbox).

Provisioning is therefore an **internal phase**, not a caller-facing operation, and the
former separate `RuntimeProvisioner` abstraction is removed. The Prepared cache
primitive (§5) remains, shared by the WORKER_POOL `ready()` **and** by Piece-scoped
operations, which call it directly for a single-piece local fill (§4). Filling the cache
and building the image are still the same verb at different targets — but now that verb
lives *inside* `ready()`.

### 3. `provision()` is unified, idempotent, and called at two points

`provision()` is **idempotent** and invoked **both** on enable (provision-on-enable)
**and** per run; each implementation cheap-no-ops when already ready:

- `WORKER_POOL`: the per-run call hydrates the **executing** worker's local cache
  (skips fast on a cache hit). The on-enable call hydrates the enabling worker, but
  the per-run call is the one that matters — the cache is per-worker and BullMQ jobs
  are not pinned to the worker that enabled the flow, so worker-pool **cannot** be
  enable-only.
- `GCP_FUNCTION`/`LAMBDA`: the on-enable call builds the image + deploy unit; the
  per-run call is a deploy-unit existence check (in-memory cached per worker → free
  after the first), guarding against worker crashes between enable and run.

The single idempotency guard — cache-hit for worker-pool, deploy-unit existence for
cloud — lives inside each impl, so the call sites carry no runtime-specific branching.

### 4. Only flow-scoped execution is pluggable; piece-scoped ops are always local

Engine work splits in two:

- **Flow-scoped execution** — `EXECUTE_FLOW`, trigger hooks (incl. `ON_ENABLE`),
  polling, webhook renewal. Carries a `flowId`, can target the project's deploy unit.
  This is the **only** work routed through the pluggable runtime + `provision()`.
- **Piece-scoped operations** — `EXECUTE_PROPERTY` (dropdown options),
  `EXECUTE_VALIDATE_AUTH` (connection auth validation), `EXTRACT_PIECE_METADATA`.
  These are interactive builder calls bound to a single piece, with **no `flowId`,
  no enabled flow, no deploy unit** to invoke. They **always run on the local worker
  sandbox in every runtime**, provisioning one piece into the local cache directly
  and bypassing the pluggable `provision()`.

Consequence: a `GCP_FUNCTION`/`LAMBDA` worker **still ships the local cache + `sandbox/`** —
the local isolate/cache machinery is off the *production flow* hot path but is permanently
required for piece-scoped ops (and for test runs, §9). It is never deleted, only relocated.

### 5. Code organization: the cache preparer is runtime-agnostic

`sandbox/` (isolate/fork/process) stays **worker-pool-specific** and moves under
`runtime/worker-pool/`. The **cache preparer** (`provisioner` + installers + paths +
state) is lifted **out** of worker-pool to a shared location, because **every runtime
uses the same routine** — it fills a **target root folder** with engine + pieces + code
(+ flow JSON) in the exact layout the engine reads. It is parameterized only by the root
path:

- `WORKER_POOL` points it at the global cache (today's behaviour, unchanged).
- `GCP_FUNCTION`/`LAMBDA` point it at a **per-project staging folder**, which is then
  copied verbatim into the Project image.

"Global cache" vs "per-project cache" is the same code with a different root — that is
the whole point of the abstraction. Also runtime-agnostic: flow-artifact extraction
(`extractPiecePackages` / `extractCodeArtifacts`) and the `Sandbox` interface (the run
contract — a remote `acquire()` returns an object satisfying it).

**Parity caveats** (the image must reproduce what the local engine reads):

- The cache uses absolute `path.resolve('cache', …)`. The Project image must place the
  folder at the **same resolved path** (matching `WORKDIR`/cwd) or the engine won't find
  it.
- The layout depends on `EXECUTION_MODE`: custom pieces go to `custom_pieces/<platformId>/`
  under `SANDBOX_PROCESS` but into `common/` under `UNSANDBOXED` (`piece-installer.ts`).
  The staging build must run under the **cloud's** mode (`UNSANDBOXED`) so the layout
  matches what the cloud engine expects.

### 6. The engine is a socketless HTTP service; callbacks go engine → API directly

> Rewritten by **Revision 3 (2026-06-16)**. The original text (engine dials back to the
> invoking worker's WS for socket-only callbacks) is superseded — see that revision.

The engine carries **no socket**. It is invoked request/response (worker → loopback POST,
Cloud Run → native POST, Lambda → handler shim over `execute()`) and makes its run
callbacks (`updateRunProgress`, `uploadRunLog`, `sendFlowResponse`, `updateStepProgress`)
**directly to the API** over HTTP, authed by its existing run-scoped `engineToken`
(`PrincipalType.ENGINE`). The worker is no longer in the callback path; the API exposes
these as HTTP routes that delegate to the same `worker-rpc-service` handlers. No worker WS
ingress from the execution network is required. Logs return in the HTTP response body;
crash classification comes from exit signal/code (local) or invoke error (cloud).

### 7. Artifact model: bake the whole prepared cache into a per-project image

The image is a **verbatim copy of the project's prepared cache folder** — engine +
pieces + code + flow JSON — keyed by **`projectId`**:

| Layer | Keyed by | Shared? | Rebuilds when | Acquired how |
|---|---|---|---|---|
| **Project image** = the prepared cache folder | `projectId` | per-project (no cross-project sharing yet) | anything in the project's folder changes (piece / code / flow) | built by `COPY`ing the staged folder; built on enable |
| **Deploy unit** = Cloud Run service / Lambda function | `projectId` | per-project | the image changes | points at the project image |

- **Everything the engine needs is in the image.** Flow definition, code, pieces, and
  engine are all baked — the container needs **no network pull** to run. This is the
  parity guarantee: the engine reads the same folder it reads on the worker pool.
- **Code is pre-bundled (deps inlined) at publish**, so even though it is baked at build
  time there is no runtime `bun install` — STRICT-compatible (ADR-0001).
- **No Kaniko sorted-per-piece layering.** The folder is copied as-is; the prepared
  cache (a single bun-workspace install) is the unit, not individual piece layers. The
  per-piece layer-reuse scheme from the original model is dropped.
- **No cross-project sharing yet.** Two projects with identical pieces build separate
  images. A content-hash key that would let identical piece-sets share an image is a
  **deferred** optimization, explicitly out of scope for phase 1.

### 8. Provisioning is inline, lazy, and provision-on-enable

- The deploy unit and image are named per **`projectId`**. The cloud is the source of
  truth — the deploy unit's existence (pointing at the current image) *is* the readiness
  signal; no state table.
- Provisioning runs **inline in the worker** (calling Cloud Build + Cloud Run / ECR +
  Lambda APIs, not a local Docker daemon), guarded by a **distributed lock** scoped to
  the `projectId` with a double-check inside the lock. Self-healing across worker
  crashes: the next invocation re-checks and rebuilds/redeploys if needed.
- It is triggered lazily by the **`ON_ENABLE` trigger hook** that already runs the
  engine when a flow is enabled (`flow-trigger-side-effect.ts`). Enabling already blocks
  on that run, so the deploy unit exists before any webhook/schedule traffic.
- **Drafts do not provision to the cloud.** A draft's test run executes on the local
  worker pool (§9), so there is no image build on the interactive test path — only
  enabling/publishing a production flow builds.
- Every worker holds a **least-privilege** provisioning service account (push to the
  AP image repo + deploy/delete in one AP-managed namespace, nothing else), bounding
  the blast radius of a worker compromise.

### 9. One *production* runtime; testing is always local

The **production** runtime is chosen per deployment — local *or* GCP/Lambda — but
routing is keyed on the run's `environment`: **`TESTING` runs always execute on the
local worker pool**, and only `PRODUCTION` runs route to the cloud runtime. The local
sandbox is already permanently present (piece-scoped ops always run local, §4), so this
adds no new machinery — and it is what keeps baking the high-churn flow JSON cheap
(interactive iteration never triggers an image build, §7/§8).

Concurrency: a cloud-runtime worker wants high concurrency for `PRODUCTION` invokes
(~200, I/O-bound — the worker only awaits invokes), but **local execution on that same
worker** (piece-scoped ops **and** test runs) is CPU-bound and must sit behind its
**own** small concurrency bound (~5), separate from the cloud-invoke knob, so a burst of
test runs cannot oversubscribe a box sized for awaiting invokes. The high cloud
concurrency is what removes the 1,300s queue waits.

### 10. Rate limiter becomes a cost ceiling under elastic runtimes

The per-project rate limiter existed to ration a scarce pool. Under `GCP_FUNCTION`
there is no scarce pool, so it is **raised, not deleted**, and reinterpreted as a
cost/abuse ceiling (per-plan, configurable) plus a global max-concurrent-invocations
cap — so "unthrottled" cannot mean "unbounded cloud spend."

## Considered options

- **Pull-and-share: a piece-set-keyed image shared across projects, with flow JSON and
  code pulled from the invoking worker at runtime** (the original decision in this ADR,
  see Revision). Rejected on reconsideration: the runtime pull path makes the engine's
  view *differ* from the worker-pool engine (new failure modes, STRICT-mode handling for
  the pull, the worker WS becoming a flow/code source as well as a callback relay), and
  image-sharing's benefit (skip a build when a piece-set repeats across projects) is
  outweighed by the simplicity of a **self-contained image the engine reads identically
  to a local run**. The price — rebuilding the project image on flow/code edits — is
  bounded because test runs stay local (§9), so only production publishes rebuild.
- **Two separate provisioning seams** (per-run cache-hydration for worker-pool, a
  separate on-enable-only provisioner for cloud). Rejected in favor of one idempotent
  `provision()` called at both points: it is genuinely one concept, and the
  cache-hit / existence-check guard makes the double call free.
- **Seam at the API dispatch layer (invoke the function from the webhook handler,
  bypass BullMQ).** Rejected. It would fix the queue problem but requires an HTTP
  mirror of the socket-only engine→worker→API callbacks, loses BullMQ job tracking,
  and is a far larger change. "Replace only the sandbox" + raising worker concurrency
  achieves the same queue fix because the bottleneck was the 5-slot pool, not BullMQ.
- **Slim the run seam to a single `ready()` deep module (provision + acquire + start
  hidden).** Initially rejected on Phase-1 cost — it forces rewriting every job handler
  (including the piece-scoped ones), defeating "replace only the sandbox." **Adopted in
  Revision 2** once the seam shipped and the two-abstraction split proved leaky: the
  handler rewrite is a net simplification (`ready → execute`), and the cache preparer
  (§5) gives piece-scoped ops their single-piece local fill without a caller-facing
  provisioner.
- **Dedicated credentialed provisioner service** (workers request builds, a separate
  process deploys). Rejected as the baseline in favor of inline provisioning, which
  is simpler and self-healing via deterministic naming + existence check. The price —
  deploy creds on every worker — is bounded by the least-privilege SA.
- **Eager provisioning at publish, or lazy with local fallback during the build.**
  Both superseded by provision-on-enable, which needs neither a separate build step
  nor a fallback path: the `ON_ENABLE` engine run is the build trigger.
- **Self-contained function with an embedded worker-shim relaying to the API.**
  Rejected: reproduces the socket-only relay as net-new code and drifts back toward
  the API-dispatch seam. The engine dialing back to the invoking worker keeps the
  worker as the single relay point.
- **Per-flow image / shared piece-set image.** Both superseded by the per-project image
  (§7). Per-flow would build byte-identical duplicates for flows sharing a piece-set; a
  shared piece-set image requires the pull path (above). The per-project image trades
  cross-project sharing for engine parity and a single deterministic build artifact.

## Consequences

- **Enabling a flow on GCP/Lambda is slower the first time** — it builds the project
  image (`COPY` of the prepared folder). Enabling was already a synchronous
  wait-for-engine action; no hard timeout applies (unlike sync webhooks).
- **Editing a piece, code step, or flow in an enabled project rebuilds that project's
  image.** This is the accepted cost of baking everything; it is bounded because test
  runs stay local (§9), so only production publishes trigger a build. Cross-project image
  reuse via a content hash is a deferred mitigation.
- **Deploy units are per-project** (one Cloud Run service / Lambda function per project,
  not per flow). This is far *fewer* units than the original per-flow model — GCP's
  ~1,000-services/region/project quota is much less pressured, though large
  project counts still need project-sharding awareness at scale.
- **Code steps with native/binary npm deps cannot be bundled** (esbuild can't inline
  a `.node` addon). Those few steps need a fallback (ship the dep in the image, or
  refuse with a clear error). Rare, but must be handled.
- **The local cache + `sandbox/` are never removed in GCP/Lambda mode** — they are
  required for piece-scoped operations (property/connection-validation/extract-piece-info)
  and for test runs, which always run on the local worker sandbox. The cache preparer is
  relocated *out* of `runtime/worker-pool/` to a shared location (it is now runtime-
  agnostic); `sandbox/` stays under `runtime/worker-pool/`.
- **No worker ingress from the execution network** (Revision 3). The engine talks only
  *outbound* to the API (run callbacks, authed by its `engineToken`); nothing dials back
  to the worker. The worker's only inbound surface is the local loopback execute POST,
  authed by a per-spawn bearer token.
