# Flow Failure Alerts

## Summary
Flow Failure Alerts allow project members to subscribe to email notifications when a flow run fails. When a flow fails for the first time within a 24-hour window, the system sends an email to all configured alert receivers for that project. Subsequent failures of the same flow version within the same window are suppressed using a Redis counter to avoid alert spam. This feature is available on Cloud and Enterprise editions only.

## Key Files
- `packages/server/api/src/app/ee/alerts/alerts-controller.ts` — REST controller (list, create, delete)
- `packages/server/api/src/app/ee/alerts/alerts-service.ts` — service with alert dispatch logic and Redis deduplication
- `packages/server/api/src/app/ee/alerts/alerts-entity.ts` — TypeORM entity
- `packages/server/api/src/app/ee/alerts/alerts-module.ts` — module registration (enforces `projectMustBeTeamType`)
- `packages/shared/src/lib/ee/alerts/alerts-dto.ts` — `Alert` type and `AlertChannel` enum
- `packages/shared/src/lib/ee/alerts/alerts-requests.ts` — `ListAlertsParams` and `CreateAlertParams` Zod schemas
- `packages/web/src/features/alerts/api/alerts-api.ts` — frontend API client
- `packages/web/src/features/alerts/hooks/alert-hooks.ts` — React query hooks
- `packages/web/src/app/components/project-settings/alerts/index.tsx` — project settings UI
- `packages/web/src/app/components/project-settings/alerts/add-alert-email-dialog.tsx` — add alert dialog

## Edition Availability
Cloud (`AP_EDITION=cloud`) and Enterprise (`AP_EDITION=ee`). The service checks `paidEditions` at runtime. The alerts module enforces `projectMustBeTeamType`, so alerts are only available for team-type projects (not personal projects). No specific plan flag gates this feature — the edition check is in the service logic.

## Domain Terms
- **Alert**: A subscription record tying a project to an email receiver.
- **AlertChannel**: Currently only `EMAIL`.
- **Receiver**: The email address that will receive the alert notification.
- **Alert deduplication**: Redis key `flow_fail_count:<flowVersionId>` tracks failure count per 24-hour window; only the first failure triggers an email.

## Entity

Table name: `alert`

| Column | Type | Notes |
|---|---|---|
| id | ApId (string) | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| projectId | ApId | FK to project |
| channel | string | `AlertChannel` enum value |
| receiver | string | Email address |

Constraints: no unique index, but the service enforces one alert per `(projectId, receiver)` pair at the application level.

## Endpoints

All endpoints mount under `/v1/alerts`.

| Method | Path | Auth | Permission | Description |
|---|---|---|---|---|
| GET | `/v1/alerts` | USER | `READ_ALERT` | List alerts for a project (paginated) |
| POST | `/v1/alerts` | USER | `WRITE_ALERT` | Add an alert receiver |
| DELETE | `/v1/alerts/:id` | USER | `WRITE_ALERT` | Remove an alert by ID |

Query for list: `{ projectId, cursor?, limit? }`.  
Body for create: `{ projectId, channel, receiver }`.

## Service Methods

- `sendAlertOnRunFinish({ issueToAlert, flowRunId })` — called after a flow run finishes. Increments a Redis counter per `flowVersionId`; if this is the first failure in 24 hours, fetches the latest locked flow version and sends an issue-created email.
- `add({ projectId, channel, receiver })` — creates a new alert. Throws `EXISTING_ALERT_CHANNEL` if the receiver already exists for the project.
- `list({ projectId, cursor, limit })` — returns a paginated `SeekPage<Alert>`.
- `delete({ alertId })` — removes an alert record.

## Redis Deduplication
Key: `flow_fail_count:<flowVersionId>`, incremented on each failure and expires after 86 400 seconds (1 day). If the count after increment is greater than 1, the email is not sent.
