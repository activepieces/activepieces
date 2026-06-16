# Activepieces

Glossary of project-specific domain language. General programming concepts do not belong here.

## Flow execution

**Execution runtime**:
The backend that actually runs a flow's engine. Values: `WORKER_POOL` (the existing BullMQ + local sandbox path), `GCP_FUNCTION`, `LAMBDA`. Orthogonal to Execution mode and Network mode. The production runtime is chosen per deployment, but the selection is **also keyed on the run's `environment`**: `TESTING` runs **always** execute on `WORKER_POOL` (the local sandbox is permanently present for piece-scoped ops anyway), and only `PRODUCTION` runs route to the deployment's cloud runtime. So a `GCP_FUNCTION` deployment still runs every test on the local pool.
_Avoid_: "mode", "executor", "backend" — call it the Execution runtime. "One runtime at a time" without the testing caveat.

**Execution mode**:
The in-sandbox isolation strength (`SANDBOX_PROCESS`, `SANDBOX_CODE_ONLY`, `SANDBOX_CODE_AND_PROCESS`, `UNSANDBOXED`). Lives *inside* an Execution runtime — a `GCP_FUNCTION` runtime runs `UNSANDBOXED` because the microVM is the isolation boundary.
_Avoid_: conflating with Execution runtime.

**Flow-scoped execution**:
Engine work tied to an enabled flow — `EXECUTE_FLOW`, trigger hooks (incl. `ON_ENABLE`), polling, webhook renewal. The **only** work routed through the pluggable Execution runtime (`WORKER_POOL` local sandbox / `GCP_FUNCTION` / `LAMBDA`). Carries a `flowId`, which resolves to its **project's** Deploy unit.
_Avoid_: assuming all engine work is pluggable.

**Piece-scoped operation**:
Interactive builder metadata work bound to a single piece, not a flow — `EXECUTE_PROPERTY` (dropdown options), `EXECUTE_VALIDATE_AUTH` (connection auth validation), `EXTRACT_PIECE_METADATA`. No `flowId`, no enabled flow, no Deploy unit. **Always runs on the local worker sandbox in every runtime** — never offloaded to GCP/Lambda. It still goes through `ready()` (see Ready sandbox), which recognizes a piece-scoped op and routes it to a **local** ready sandbox — the preparer fills just that one piece into the local cache.
_Avoid_: "metadata job" used loosely; treating these as flow runs.

**Prepared cache** (the cache preparer):
The single, runtime-agnostic **low-level primitive** that fills a **target root folder** with the engine, pieces, and code (plus flow JSON) in the **exact layout today's worker cache uses**. Parameterized only by the root path: `WORKER_POOL` points it at the global cache (as today); cloud runtimes point it at a per-project staging folder. "Global cache" vs "per-project cache" is just *where you point it* — the structure is identical, which is the whole point of the abstraction. It is **not** a "provisioner": it is called **only inside `ready()`** (see Ready sandbox) — by the WORKER_POOL flow path (fill local cache), by the cloud path (fill a per-project staging folder, then build the image), and by the piece-scoped path (one piece into the local cache, which `ready()` routes locally in every runtime). Nothing outside `ready()` calls it.
_Avoid_: calling this "provisioner" (the code symbol is the cache **preparer**, not `provisioner`); saying piece-scoped ops call it "directly" (they go through `ready()`); treating global vs per-project as different mechanisms.

**Project image**:
The container image a `GCP_FUNCTION`/`LAMBDA` runs, built by copying a **project's entire Prepared cache folder** (engine + pieces + code + flow) into the image **verbatim**, keyed by **`projectId`**. It is a self-contained snapshot, so the engine inside sees the folder **identically** to a local run — **no runtime pull path**. Not shared across projects; rebuilt whenever anything in the project's folder changes. Content-hash-based cross-project sharing is a **deferred** optimization.
_Avoid_: "piece-set image" / "shared image" (superseded — it is per-project and now contains flow+code), "per-flow image".

**Deploy unit**:
The Cloud Run service / Lambda function that runs a Project image, keyed by **`projectId`**. The isolation boundary is the **project** — matching the product's tenancy (flows in a project already share connections/secrets), so flow-level isolation is a non-goal. A flow routes to its **project's** unit; all flows in a project share one unit and one image. Provisioning is guarded by a lock scoped to the `projectId` key. The unit is rebuilt/redeployed when the project image changes. Per-run readiness is a cheap local existence check (cached), never a global wait.
_Avoid_: "per-flow deploy unit" / "one per flowId" (superseded), "piece-set" in the key (superseded — keyed by `projectId`), "function" / "service" used loosely.

**Code bundle**:
A code step transpiled with its npm deps inlined, keyed by `hash(sourceCode)`. Pre-bundled at publish (build context with registry access) so the engine never installs deps at runtime — STRICT-safe. **Baked into the Project image** as part of the Prepared cache folder (not pulled at runtime).
_Avoid_: "compiled code", "code artifact".

**Ready sandbox** (`ready()`):
The single per-runtime **deep module** that returns a `Sandbox` ready to execute a given operation. Behind one call it hides the **provision** phase, slot **acquisition**, and **start** — callers go from `provision → check → acquire → start → execute → release` down to `ready → execute`. Flow-scoped ops route to the deployment's runtime; **Piece-scoped operations always resolve to a *local* ready sandbox** (the Prepared cache fills one piece) regardless of the configured runtime. Sandbox **reuse** and the disable-flow-on-missing-piece outcome live inside `ready()`, not at the call site.
_Avoid_: a separate caller-facing "provisioner" step; orchestrating `acquire`/`start` at the call site; a distinct `RuntimeProvisioner` abstraction (folded into `ready()`).

**Provisioning**:
The internal readiness phase *inside* `ready()` that makes the execution target runnable — **not** a standalone caller-facing operation. `WORKER_POOL` fills the worker's **local cache** via the Prepared cache; `GCP_FUNCTION`/`LAMBDA` point the preparer at a per-project staging folder, then build the **Project image** + per-project **Deploy unit**. **Idempotent**, exercised on enable (the `ON_ENABLE` engine run goes through `ready()`) and again per-run — cheap-no-op when already ready (cache-hit for `WORKER_POOL`, deploy-unit existence-check for cloud).
_Avoid_: treating provisioning as a step the worker orchestrates separately from acquiring a sandbox; using "provision" only for the remote case.

**Provision-on-enable**:
A flow's Deploy unit is created the first time the flow runs the engine on a cloud runtime — the `ON_ENABLE` trigger hook fired when the flow is enabled, not a separate build step. Drafts do **not** provision to the cloud: a draft's test run always executes locally (see Execution runtime), so cloud provisioning is triggered by enable, not by first test. Enabling already blocks on that engine run, so the deploy unit exists before any webhook/schedule traffic. Inline in the worker, guarded by a distributed lock + cloud-side existence check (existence is the readiness signal).
_Avoid_: "eager provisioning", "build on publish", "lazy provisioning".

**Engine callback**:
A run-critical message the engine emits while executing — run progress, run log, sync
flow response, step progress. Sent **directly to the API** (authed by the engine's
run-scoped engine token), **not** relayed through the worker. The worker spawns/invokes
the engine but is not in the callback path. There is **no worker↔engine socket**: the
engine is invoked request/response and calls back over the same engine→API path it
already uses for connections/files/tables.
_Avoid_: "RPC to the worker", "socket callback", "the worker relays the engine" (all
superseded — see ADR-0002 Revision 3).

## Sandbox network isolation

**Network mode**:
Per-deployment egress posture, `AP_NETWORK_MODE` ∈ {`UNRESTRICTED` (default), `STRICT`}. STRICT restricts sandbox egress to prevent SSRF; UNRESTRICTED disables all egress restriction machinery.
_Avoid_: "secure mode", "locked-down mode".

**Egress proxy**:
The forward proxy (loopback / veth-hosted) that all approved outbound sandbox HTTP must traverse in STRICT mode. It resolves destination hostnames and enforces the SSRF allowlist. The single SSRF policy decision point.
_Avoid_: "gateway", "forward proxy" (in code/docs use "egress proxy").

**Egress netns** (`ap-egress`):
The dedicated network namespace a sandbox runs in (Tier 3, see ADR-0001). Its only route is to the worker's veth peer IP hosting the egress proxy + RPC; no default route, no NAT. Egress restriction is a routing fact, not a firewall rule.
_Avoid_: "sandbox network", "jail".

**Kernel lockdown**:
The legacy (pre-Tier-3) per-UID `iptables`/`ip6tables` REJECT chain that claws back egress after `isolate --share-net` exposes the whole host network. Being retired by ADR-0001.
_Avoid_: "firewall rules", "iptables rules" (name the mechanism: kernel lockdown).

**SSRF allowlist**:
The set of destination IPs/CIDRs the egress proxy permits (`AP_SSRF_ALLOW_LIST` plus the resolved API host). Distinct from DNS resolver reachability — it does **not** open DNS holes.
_Avoid_: "whitelist", "safe list".
