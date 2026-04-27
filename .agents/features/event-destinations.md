# Event Destinations Module

## Summary
Event Destinations streams platform and project activity events to external HTTPS webhook URLs in real time. Each destination subscribes to a configurable subset of the 19 `ApplicationEventName` events (flow CRUD, run lifecycle, user auth, connections, security, releases) and receives a structured JSON payload via a BullMQ-backed delivery queue. The feature is gated behind the `auditLogEnabled` plan flag and is only available in Enterprise/Cloud editions.

## Key Files
- `packages/server/api/src/app/event-destinations/` — controller, service, entity
- `packages/shared/src/lib/ee/event-destinations/dto.ts` — request/response Zod schemas
- `packages/shared/src/lib/ee/event-destinations/index.ts` — barrel export
- `packages/shared/src/lib/ee/audit-events/` — `ApplicationEventName` enum (19 event types)
- `packages/web/src/app/routes/platform/infra/event-destinations/index.tsx` — `EventDestinationsPage`
- `packages/web/src/app/routes/platform/infra/event-destinations/lib/event-destinations-collection.ts` — TanStack DB live collection + mutations
- `packages/web/src/app/routes/platform/infra/event-destinations/components/event-destination-dialog.tsx` — create/edit dialog
- `packages/web/src/app/routes/platform/infra/event-destinations/components/event-destination-actions.tsx` — per-row edit/delete/test actions

## Edition Availability
- **Community (CE)**: Not available.
- **Enterprise (EE, self-hosted)**: Available when `auditLogEnabled` is set by the license key.
- **Cloud**: Available on plans with `auditLogEnabled`. UI wrapped in `LockedFeatureGuard` keyed to `eventStreamingEnabled`.

## Domain Terms
- **EventDestination**: A persisted webhook subscription — one URL receiving a chosen set of events for a platform or project scope.
- **ApplicationEventName**: The 19-value enum that names every auditable action in the system.
- **Scope**: PLATFORM (all platform-level events) or PROJECT (currently only `FLOW_RUN_FINISHED`).
- **Event Delivery**: Async BullMQ `ONE_TIME` job that POSTs the event payload to the destination URL.
- **Test Delivery**: Sends a mock `FLOW_CREATED` payload synchronously so the operator can verify connectivity.

## Entity

**EventDestination**: id, platformId, projectId (nullable — null for platform scope), scope (PLATFORM/PROJECT), events[] (ApplicationEventName array), url (HTTPS webhook endpoint). Relations: platform, project.

## Scopes

- **PLATFORM**: Receives all platform-level events (flow CRUD, user auth, connections, folders, security)
- **PROJECT**: Currently only receives `FLOW_RUN_FINISHED` events for that project

## Available Events (ApplicationEventName — 19 types)

- Flow: FLOW_CREATED, FLOW_UPDATED, FLOW_DELETED
- Runs: FLOW_RUN_STARTED, FLOW_RUN_FINISHED, FLOW_RUN_RESUMED
- Folders: FOLDER_CREATED, FOLDER_UPDATED, FOLDER_DELETED
- Connections: CONNECTION_UPSERTED, CONNECTION_DELETED
- Users: USER_SIGNED_UP, USER_SIGNED_IN, USER_PASSWORD_RESET, USER_EMAIL_VERIFIED
- Security: SIGNING_KEY_CREATED, PROJECT_ROLE_CREATED, PROJECT_ROLE_UPDATED, PROJECT_ROLE_DELETED
- Releases: PROJECT_RELEASE_CREATED

## Event Delivery

Events delivered via BullMQ job queue (`WorkerJobType.EVENT_DESTINATION`):
1. Application event fires (user or worker event)
2. `eventDestinationService.trigger()` finds matching destinations
3. For each match: queues ONE_TIME job with webhook URL + event payload
4. Worker delivers HTTP POST to destination URL

## Endpoints

- `POST /v1/event-destinations` — create destination (validates URL is external — no localhost)
- `POST /v1/event-destinations/:id` — update URL or events
- `GET /v1/event-destinations` — list destinations (paginated)
- `DELETE /v1/event-destinations/:id` — delete destination
- `POST /v1/event-destinations/test` — sends mock FLOW_CREATED event to URL

## URL Validation

Rejects: localhost, 127.0.0.1, ::1, [::1], and other loopback addresses.

## Gating

Enterprise feature. Requires `auditLogEnabled` plan flag (event streaming shares the audit log gating). Module registered in EE section of `app.ts`. Frontend checks `platform.plan.eventStreamingEnabled` before firing queries.

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
