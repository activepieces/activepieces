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
- The old `assertUrlIsExternal` check was **removed** to support internal handler flows; recursion is instead prevented by a server-side **cycle guard** keyed on the target flow of any same-origin webhook URL (so a self-targeting `/draft` destination is still dropped on its own run events).
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
