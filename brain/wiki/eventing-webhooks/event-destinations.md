---
icon: 📡
---

# Event Destinations

Streams platform/project activity events to webhook URLs in real time. Internal Activepieces flow webhooks are valid targets, so operators can route events into a flow and fan out to Slack/Gmail/Teams/HTTP without leaving the platform. EE/Cloud only, gated by `auditLogEnabled` (shares audit-log gating). Lives under the **Observability** sidebar group.

### Entities & services
- **EventDestination**: one URL receiving a chosen subset of the 27 `ApplicationEventName` events, at PLATFORM or PROJECT scope.
- **Scope**: PLATFORM (all platform events) or PROJECT (currently only `FLOW_RUN_FINISHED`).
- Delivery via BullMQ queue (`WorkerJobType.EVENT_DESTINATION`).

### How it works
- `eventDestinationService.trigger()` finds matching destinations and classifies each URL as internal vs external.
- **Internal** (URL origin == instance's public API origin, path under `/v1/webhooks/`, suffix `''` or `/sync`): dispatched directly via `webhookService.handleWebhook` — no outbound HTTP, so the SSRF filter never sees a self-referential private-IP call (GIT-1539). `/draft` and `/test` URLs stay on the outbound path.
- **External**: queued as ONE_TIME jobs, POSTed via `safeHttp` (SSRF-protected); delivery failures logged at error level.
- Endpoints: `POST/GET/DELETE /v1/event-destinations` (+ `POST /:id`), and `POST /test` sends a mock event (defaults to `FLOW_CREATED`) built by `buildMockEvent()`.

### Gotchas
- The old `assertUrlIsExternal` check was **removed** to support internal handler flows; recursion is instead prevented by a server-side **cycle guard** keyed on the target flow of any webhook URL, regardless of route suffix (so a self-targeting `/draft` destination is still dropped on its own run events).
- **The cycle guard is host-agnostic on purpose — do not "tighten" it back to an origin check.** It matches any destination whose path contains `/v1/webhooks/<flowId>`, percent-decoding the id segment. It used to require `destination.origin === getPublicApiUrl().origin`, which is `AP_FRONTEND_URL`: platforms with an embed subdomain get `WEBHOOK_URL_PREFIX` rewritten to `https://<embed-hostname>/api/v1/webhooks`, so the origin never matched, the guard failed open, and a handler flow re-triggered on its own runs — one webhook POST produced 838 runs in ~3 min (GIT-1641, Pylon 5378). `domainHelper.getPublicApiUrl()` is called with no `platformId` here, so it can never resolve to the embed host. The path is the stable part (`/v1/webhooks` is fixed by the route registration and every URL builder); the host is not.
- **When the guard fires it drops *every* webhook-shaped destination for that event, not just the self-target.** Exact-match filtering would let two flows wired to each other ping-pong forever — destinations are platform/project-scoped, so the mutually-wired pair both sit in the same candidate list. The cost is that genuine cross-instance chaining (a destination pointing at *another* instance's `/v1/webhooks/...`) is also dropped for the looping flow's events; the `droppedDestinations` field on the cycle-break `warn` is how you see that happened.
- **Still-open loop:** two flows wired via *different* event actions (X→Y on `FLOW_RUN_STARTED`, Y→X on `FLOW_RUN_FINISHED`) never put an emitter-targeting destination in the same event's candidate list, so the guard never fires and the loop survives. URL matching cannot close this; a hop/depth counter on the dispatch chain would.
- **Three URL parsers coexist with different semantics** — `matchInternalWebhookFlowId` (origin-strict, prefix-based, does *not* percent-decode), `extractWebhookFlowIdCandidate` (host-agnostic, marker-based, decodes), and `webhookRouteSuffix`. They can disagree on the same URL. Dispatch classification stays origin-strict deliberately, so cross-instance chaining still delivers over HTTP outside cycle events.
- Frontend uses a **TanStack DB live collection** (optimistic local mirror + `useLiveQuery`), not standard React Query.
- A one-click "Generate handler flow" builds a webhook-triggered flow with per-event router branches.

### Key files
Entry point: `eventDestinationService`, a log-scoped factory wired up in `platform-webhooks.module.ts` under the `/v1/event-destinations` prefix.

- `packages/server/api/src/app/event-destinations/` — the service (trigger, internal vs external routing, cycle guard) and the typeorm entity
- `packages/server/api/src/app/ee/platform-webhooks/` — the HTTP controller and module that expose the endpoints
- `packages/server/worker/src/lib/execute/jobs/event-destination.ts` — worker side of the BullMQ job, POSTs external destinations via safeHttp
- `packages/core/shared/src/lib/ee/event-destinations/` — request/response zod schemas and barrel export
- `packages/core/shared/src/lib/ee/audit-events/` — the `ApplicationEventName` enum plus `buildMockEvent()` for test deliveries
- `packages/web/src/app/routes/platform/infra/event-destinations/` — the page, its TanStack DB collection, handler-flow builder, and dialog/row/action components
- `packages/server/api/test/integration/cloud/event-destinations/` — integration tests covering CRUD and trigger dispatch

Paths verified 2026-07-17.
