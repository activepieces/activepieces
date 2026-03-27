# Event Destinations Module

Stream platform events to external webhooks in real-time.

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

Enterprise feature. Requires `auditLogEnabled` plan flag (event streaming shares the audit log gating). Module registered in EE section of `app.ts`.

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
