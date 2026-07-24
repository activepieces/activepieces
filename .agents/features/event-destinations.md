# Event Destinations Module

## Summary
Event Destinations streams platform and project activity events to webhook URLs in real time. Internal Activepieces flow webhooks are valid targets, so operators can route events into a flow and fan them out to Slack, Gmail, Teams, or any HTTP endpoint without leaving the platform. Each destination subscribes to a configurable subset of the 27 `ApplicationEventName` events (flow CRUD, flow lifecycle, run lifecycle, user auth, connections, security, releases) and receives a structured JSON payload via a BullMQ-backed delivery queue. The feature is gated behind the `auditLogEnabled` plan flag and is only available in Enterprise/Cloud editions.

## Key Files
- `packages/server/api/src/app/event-destinations/` — controller, service, entity
- `packages/core/shared/src/lib/ee/event-destinations/dto.ts` — request/response Zod schemas (test endpoint accepts optional `event`)
- `packages/core/shared/src/lib/ee/event-destinations/index.ts` — barrel export
- `packages/core/shared/src/lib/ee/audit-events/` — `ApplicationEventName` enum (27 event types)
- `packages/core/shared/src/lib/ee/audit-events/mock-event-builder.ts` — `buildMockEvent()` shared helper that returns a typed `ApplicationEvent` mock for any event name
- `packages/web/src/app/routes/platform/infra/event-destinations/index.tsx` — `EventDestinationsPage`
- `packages/web/src/app/routes/platform/infra/event-destinations/lib/event-destinations-collection.ts` — TanStack DB live collection + mutations (incl. `useImportHandlerFlow`)
- `packages/web/src/app/routes/platform/infra/event-destinations/lib/handler-flow-builder.ts` — generates a `Template` for a one-click webhook-triggered handler flow with per-event router branches
- `packages/web/src/app/routes/platform/infra/event-destinations/lib/parse-flow-id-from-url.ts` — extracts an internal flow ID from a webhook URL
- `packages/web/src/app/routes/platform/infra/event-destinations/lib/use-event-labels.ts` — human-readable labels for every `ApplicationEventName`
- `packages/web/src/app/routes/platform/infra/event-destinations/components/event-destination-dialog.tsx` — create/edit dialog with Generate handler flow button and per-event Test webhook dropdown
- `packages/web/src/app/routes/platform/infra/event-destinations/components/event-destination-row.tsx` — per-destination row
- `packages/web/src/app/routes/platform/infra/event-destinations/components/event-destination-actions.tsx` — per-row edit/delete/test actions

## Edition Availability
- **Community (CE)**: Not available.
- **Enterprise (EE, self-hosted)**: Available when `auditLogEnabled` is set by the license key.
- **Cloud**: Available on plans with `auditLogEnabled`. UI wrapped in `LockedFeatureGuard` keyed to `eventStreamingEnabled`.

## Domain Terms

> Canonical term definitions live in the bounded-context glossaries — see [CONTEXT-MAP.md](../../CONTEXT-MAP.md).

- **EventDestination**: A persisted webhook subscription — one URL receiving a chosen set of events for a platform or project scope.
- **ApplicationEventName**: The 27-value enum that names every auditable action in the system.
- **Scope**: PLATFORM (all platform-level events) or PROJECT (currently only `FLOW_RUN_FINISHED`).
- **Event Delivery**: External destinations get an async BullMQ `ONE_TIME` job that POSTs the event payload to the destination URL; same-origin handler-flow destinations (rewrite-safe routes only) skip BullMQ and are dispatched internally through `webhookService.handleWebhook`.
- **Test Delivery**: Sends a mock payload for a selected event type (defaults to `FLOW_CREATED`) synchronously so the operator can verify connectivity. Backed by `buildMockEvent()`.
- **Handler Flow**: An optional internal Activepieces flow generated from `handler-flow-builder.ts` that consumes the webhook and routes each event to its own branch (Slack/Gmail/Teams/HTTP).

## Entity

**EventDestination**: id, platformId, projectId (nullable — null for platform scope), scope (PLATFORM/PROJECT), events[] (ApplicationEventName array), url (HTTPS webhook endpoint). Relations: platform, project.

## Scopes

- **PLATFORM**: Receives all platform-level events (flow CRUD, user auth, connections, folders, security)
- **PROJECT**: Currently only receives `FLOW_RUN_FINISHED` events for that project

## Available Events (ApplicationEventName — 27 types)

- Flow: FLOW_CREATED, FLOW_UPDATED, FLOW_DELETED, FLOW_PUBLISHED, FLOW_ACTIVATED, FLOW_DEACTIVATED
- Runs: FLOW_RUN_STARTED, FLOW_RUN_FINISHED, FLOW_RUN_RESUMED, FLOW_RUN_RETRIED
- Folders: FOLDER_CREATED, FOLDER_UPDATED, FOLDER_DELETED
- Connections: CONNECTION_UPSERTED, CONNECTION_DELETED
- Variables: VARIABLE_UPSERTED, VARIABLE_DELETED, VARIABLE_VALUE_REVEALED
- Users: USER_SIGNED_UP, USER_SIGNED_IN, USER_PASSWORD_RESET, USER_EMAIL_VERIFIED
- Security: SIGNING_KEY_CREATED, PROJECT_ROLE_CREATED, PROJECT_ROLE_UPDATED, PROJECT_ROLE_DELETED
- Releases: PROJECT_RELEASE_CREATED

## Event Delivery

Events delivered via BullMQ job queue (`WorkerJobType.EVENT_DESTINATION`):
1. Application event fires (user or worker event)
2. `eventDestinationService.trigger()` finds matching destinations and classifies each URL as internal (same-origin handler flow) or external
3. **Internal destinations** (URL origin exactly equals the instance's public API origin, path is under `/v1/webhooks/`, and the route suffix is `''` or `/sync`): dispatched directly through `webhookService.handleWebhook` (async EXECUTE_WEBHOOK path) — no outbound HTTP, so the SSRF filter never sees a self-referential private-IP call (GIT-1539). The destination URL's query params are forwarded as the synthesized payload's `queryParams`. `/draft` and `/test` route URLs are NOT rewritten (different version/sample-data semantics) and stay on the outbound path
4. **External destinations**: queued as ONE_TIME `EVENT_DESTINATION` jobs; the worker delivers an HTTP POST via `safeHttp` (SSRF-protected) and logs delivery failures (transport errors and 4xx/5xx responses) at error level
5. **Cycle guard**: origin-agnostic. It keys off the *target flow* of any URL whose path contains `/v1/webhooks/<flowId>` (regardless of host or route suffix, percent-decoding the id segment), so a self-targeting destination is dropped on its own flow-run events even when its URL lives on an embed domain, custom hostname, or IP that differs from `AP_FRONTEND_URL` (GIT-1641). When a cycle is detected, ALL webhook-flow-shaped destinations are dropped for that event, not just the self-target: exact-match-only filtering would let two flows wired to each other ping-pong forever. Dispatch classification (internal vs external) stays origin-strict, so cross-instance chaining still delivers over HTTP outside cycle events

## Endpoints

- `POST /v1/event-destinations` — create destination
- `POST /v1/event-destinations/:id` — update URL or events
- `GET /v1/event-destinations` — list destinations (paginated)
- `DELETE /v1/event-destinations/:id` — delete destination
- `POST /v1/event-destinations/test` — sends a mock event to the URL. Body accepts an optional `event: ApplicationEventName` field; defaults to `FLOW_CREATED`. The payload is built via `buildMockEvent()`.

Internal flow webhook URLs are accepted as destination URLs and are dispatched internally (no outbound HTTP, see Event Delivery) so self-hosted instances work without `AP_SSRF_ALLOW_LIST` configuration; external URLs are still delivered through `safeHttp` (SSRF-protected). The previous `assertUrlIsExternal` check has been removed to support the internal handler-flow pattern; recursion is prevented by a server-side cycle guard that drops events whose payload originated from the same destination chain.

## Gating & Sidebar

Enterprise feature. Requires `auditLogEnabled` plan flag (event streaming shares the audit log gating). Module registered in EE section of `app.ts`. Frontend checks `platform.plan.eventStreamingEnabled` before firing queries. The sidebar entry now lives under the new **Observability** group (moved from Infrastructure).

## Frontend Data Layer

The page uses a **TanStack DB live collection** (`eventDestinationsCollection`) rather than standard React Query. The collection holds an optimistic local mirror of all destinations. Mutations (`onUpdate`, `onInsert`, `onDelete`) call the REST API and then write back into the collection via `writeInsert` / `update` / `delete` helpers. `useLiveQuery` re-renders the list reactively on any collection change.

## Event Payload Format

```json
{
  "id": "event_id",
  "created": "ISO timestamp",
  "platformId": "...",
  "projectId": "...",
  "data": {
    "flow": { "id", "name", ... },
    "project": { "displayName", ... }
  }
}
```
