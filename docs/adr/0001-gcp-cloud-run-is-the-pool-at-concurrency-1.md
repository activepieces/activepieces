# The sandbox pool is a pure `execute()`; GCP Cloud Run is that pool at concurrency 1

The sandbox pool is a **pure execution function** — `execute({ operationType, operation, timeoutInSeconds, settings, provision })` → `{ engineResponse, logs }` — that holds **no `apiClient` and no connection back to the app**. `provision` is `{ flowBundle?, pieces?, archiveRefs? }`, where a single `flowBundle` reference subsumes `flowVersion` + piece metadata + compiled codes (piece-only jobs pass bare `pieces`; private-piece archives ride alongside as S3 `archiveRefs`). The **worker** is the sole **Resolver**: it uses its Socket.IO `apiClient` to resolve the `flowVersion`, piece metadata, and bundle/archive S3 refs (disabling the flow on a missing piece) *before* calling `execute`, so the pool only ever receives healthy, fully-materialized inputs and reaches the network only to pull the blobs named in its parameters (S3 by signed URL, npm registry for public pieces). `GCP_CLOUD_RUN` is then nothing but this same pool at concurrency 1 on ephemeral disk, fronted by a single `/execute` HTTP endpoint; the worker stays in place as Resolver + queue puller and the Cloud Run container is pure compute.

## Why

- **Cloud Run can't keep per-request affinity**, so the lifecycle cannot be split into `provision`/`run`/`dispose` across the wire — it must be one self-contained call. Making the pool a single pure `execute` makes that call trivial and gives `LOCAL` and `GCP_CLOUD_RUN` an identical signature (in-process vs. over-HTTP).
- **The pool needs no app connection.** Piece-install is host-side (the engine loads pieces from a mounted dir; it never fetches them), so *something* on the pool side must materialize dependencies — but every input is request/response data, so passing it in as parameters removes the dependency on the Socket.IO `apiClient` entirely. Cloud Run holds zero Socket.IO connections, which fits its stateless/scale-to-zero model.
- **Run-time callbacks bypass the pool.** The engine posts `updateRunProgress` / `updateStepProgress` / `sendFlowResponse` / `uploadRunLog` straight to the app over engine-token HTTP (`POST /v1/engine/*`), the same channel it already uses for store/files/connections — so no callback ever needs a path back through the pool host. (Shipped separately on `refactor/engine-direct-run-callbacks`.)

## Considered and rejected

- **Cloud Run opens its own Socket.IO `apiClient` to the app.** Reused the worker's client verbatim, but pinned a persistent bidirectional connection onto a stateless request-scoped runtime, and kept the pool coupled to `WorkerToApiContract`.
- **Worker proxies callbacks/fetches back through itself.** Kept the worker as sole app contact but pinned it for the whole job and added a double hop per callback.
- **Ship heavy artifacts inline in the `/execute` body.** Self-contained, but forced an app→worker→Cloud Run double transfer of large piece archives. Chose S3 references instead (the flow bundle already works this way); the pool pulls blobs from S3 directly.

## Consequences

- Resolution code that imports `WorkerToApiContract` (`flowProvisioning`, `pieceCache`, `flowBundleStore`) moves out of `sandbox-pool` to the worker/Resolver; `sandbox-pool` stops importing `WorkerToApiContract`.
- `disableFlow` / missing-piece handling leaves the pool entirely — the Resolver detects it during resolution and never calls `execute`.
- **Cold-path bundle build stays on the worker.** On a bundle cache-miss the Resolver compiles the code and publishes the bundle to S3 *before* calling `execute`, so the worker keeps bun/build tooling and the pool only ever consumes a ready, compiled bundle. `flowBundle` is therefore always a ready ref (`{ url } | { inline }`), never a build instruction. (Rejected: building in the pool via a pre-signed upload URL, and building at flow-lock time app-side — both viable, but the worker is already the builder today, so this is the least-change path. Revisit if cold-build load on workers becomes a problem.)
