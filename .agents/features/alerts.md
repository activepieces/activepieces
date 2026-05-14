# Flow Failure Alerts

## Summary
Flow Failure Alerts allow users to subscribe to email notifications when a flow run fails. When a flow fails for the first time within a 24-hour window, the system sends an email to all configured alert receivers for that project. Subsequent failures of the same flow version within the same window are suppressed using a Redis counter to avoid alert spam. Both **personal** and **team** projects support alerts: personal projects allow exactly one receiver — the project owner — toggled via a single switch, while team projects allow any number of receivers managed by project admins. Platform admins can also bulk subscribe/unsubscribe their own email across many projects from the platform admin Projects table. This feature is available on Cloud and Enterprise editions only.

## Key Files
- `packages/server/api/src/app/ee/alerts/alerts-controller.ts` — REST controller (list, create, delete)
- `packages/server/api/src/app/ee/alerts/alerts-service.ts` — alert dispatch logic, Redis deduplication, case-insensitive receiver storage, personal-project owner-only constraint
- `packages/server/api/src/app/ee/alerts/alerts-entity.ts` — TypeORM entity
- `packages/server/api/src/app/ee/alerts/alerts-module.ts` — module registration (no project-type restriction)
- `packages/server/api/src/app/ee/projects/ee-project-hooks.ts` — auto-subscribes the owner on personal-project creation; auto-subscribes `alertReceiverEmail` on team-project creation
- `packages/server/api/src/app/project/project-hooks.ts` — `ProjectHooks.postCreate` accepts `ProjectPostCreateContext`
- `packages/server/api/src/app/project/project-service.ts` — plumbs `postCreateContext` through to hooks
- `packages/server/api/src/app/ee/projects/platform-project-controller.ts` — accepts `alertReceiverEmail` on the create-project request
- `packages/server/api/src/app/ee/projects/platform-project-service.ts` — forwards `alertReceiverEmail` into `callProjectPostCreateHooks`
- `packages/shared/src/lib/ee/alerts/alerts-dto.ts` — `Alert` type and `AlertChannel` enum
- `packages/shared/src/lib/ee/alerts/alerts-requests.ts` — `ListAlertsParams` and `CreateAlertParams` Zod schemas
- `packages/shared/src/lib/management/project/project-requests.ts` — `CreatePlatformProjectRequest.alertReceiverEmail`
- `packages/web/src/features/alerts/api/alerts-api.ts` — frontend API client
- `packages/web/src/features/alerts/hooks/alert-hooks.ts` — React Query hooks: `useAlertsEmailList`, `useCreateAlert`, `useDeleteAlert`, `useBulkSubscribeAlerts`, `useBulkUnsubscribeAlerts`
- `packages/web/src/app/components/project-settings/alerts/index.tsx` — routes between personal/team UI based on `currentProject.type`
- `packages/web/src/app/components/project-settings/alerts/personal-project-alerts.tsx` — single-switch UI for personal projects
- `packages/web/src/app/components/project-settings/alerts/team-project-alerts.tsx` — receiver list UI for team projects
- `packages/web/src/app/components/project-settings/alerts/add-alert-email-form.tsx` — inline add-receiver form (replaces the prior dialog)
- `packages/web/src/features/projects/components/platform-admin-project-alert-subscription-bulk-actions.tsx` — bulk subscribe/unsubscribe action on the platform admin Projects table
- `packages/web/src/features/projects/components/new-project-dialog.tsx` — exposes the `Alert Receiver Email` field on project creation

## Edition Availability
Cloud (`AP_EDITION=cloud`) and Enterprise (`AP_EDITION=ee`). The service checks `paidEditions` at runtime when dispatching alert emails. Both personal and team projects can subscribe, with different rules:
- **Personal projects**: only the project owner's identity email may be added as a receiver — enforced in `alertsService.add()` and surfaced in the UI as a single on/off switch.
- **Team projects**: any email may be added as a receiver.

No specific plan flag gates this feature — the edition check is in the service logic.

## Domain Terms
- **Alert**: A subscription record tying a project to an email receiver.
- **AlertChannel**: Currently only `EMAIL`.
- **Receiver**: The email address that will receive the alert notification. Stored and compared **case-insensitively** (lowercased on insert; lookup uses `LOWER(receiver)`).
- **Alert deduplication (per-failure)**: Redis key `flow_fail_count:<flowVersionId>` tracks failure count per 24-hour window; only the first failure triggers an email.
- **Bulk subscription**: Platform admins can subscribe or unsubscribe their own email across many projects at once from the Projects table; concurrency capped at 5 parallel requests via `p-limit`.
- **Alert receiver email (project creation)**: Optional email passed at team-project creation time; auto-subscribed via the EE post-create hook.

## Entity

Table name: `alert`

| Column | Type | Notes |
|---|---|---|
| id | ApId (string) | PK |
| created | string | From BaseColumnSchemaPart |
| updated | string | From BaseColumnSchemaPart |
| projectId | ApId | FK to project |
| channel | string | `AlertChannel` enum value |
| receiver | string | Email address (stored lowercased) |

Constraints: no unique index, but the service enforces one alert per `(projectId, LOWER(receiver))` pair at the application level.

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

- `sendAlertOnRunFinish({ issueToAlert, flowRunId })` — called after a flow run finishes. Increments the Redis counter for the flow version; if this is the first failure in 24 hours, fetches the latest locked flow version and sends an issue-created email to all receivers for the project.
- `add({ projectId, channel, receiver })` — creates a new alert. Lowercases the receiver. For personal projects, throws `VALIDATION` if the receiver is not the owner's identity email. Throws `EXISTING_ALERT_CHANNEL` (case-insensitive lookup) if the receiver already exists for the project.
- `list({ projectId, cursor, limit })` — returns a paginated `SeekPage<Alert>`.
- `delete({ alertId })` — removes an alert record.

## Project Creation Integration

The CE `ProjectHooks.postCreate` signature accepts a `ProjectPostCreateContext`:

```ts
type ProjectPostCreateContext = {
    alertReceiverEmail?: string | null
}
```

The EE override (`projectEnterpriseHooks`) consumes it as follows:

- **Personal project (or null project type)**: subscribes the project owner's identity email automatically. Skipped for JWT-only identities without an email.
- **Team project**: subscribes the `alertReceiverEmail` provided in the create-project request, if any. Pre-existing-receiver conflicts (`EXISTING_ALERT_CHANNEL`) are swallowed; other errors propagate.

`CreatePlatformProjectRequest.alertReceiverEmail` is the inbound field. The platform project controller plumbs it into `platformProjectService.create`, which forwards it as `postCreateContext` to `projectService.callProjectPostCreateHooks`.

## Frontend UI

- **Project Settings → Alert Emails tab** routes to `PersonalProjectAlerts` or `TeamProjectAlerts` based on `currentProject.type`. The tab is enabled for both project types (previously gated on `ProjectType.TEAM`).
- **Personal projects** see a single switch ("Email me when my flows fail") that toggles the owner's subscription on/off via `useCreateAlert` / `useDeleteAlert`.
- **Team projects** see the receiver list and an inline form to add new receivers; project admins (`WRITE_ALERT` + `WRITE_PROJECT`) can delete receivers.
- **Platform admin Projects table** exposes "Subscribe to alerts" / "Unsubscribe from alerts" bulk actions. Both run requests in parallel (max 5 concurrent), summarize results in a toast (subscribed / already-subscribed / not-subscribed / failed), and the unsubscribe path requires confirmation.
- **New Project dialog** exposes an optional `Alert Receiver Email` field that is sent on creation for team projects.

## Frontend Query Cache

The alert list query key is per-project: `['alerts-email-list', projectId] as const`. `useCreateAlert` and `useDeleteAlert` invalidate the current project's key. Bulk mutations operate across many projects and do not invalidate (the platform admin table refreshes on its own selection reset).

## Redis Deduplication
Key: `flow_fail_count:<flowVersionId>`, incremented on each failure and expires after 86 400 seconds (1 day). If the count after increment is greater than 1, the email is not sent.
