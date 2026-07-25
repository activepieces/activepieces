---
icon: 🚨
---

# Flow Failure Alerts

Email notifications when a flow run fails. On the first failure of a flow version within a 24-hour window, the system emails all configured receivers for the project; later failures in the same window are suppressed via a Redis counter to avoid spam. Cloud/EE only (edition check is in service logic, no plan flag).

### Entities & services
- **Alert**: subscription tying a project to an email **receiver** (stored lowercased; lookups use `LOWER(receiver)`). **AlertChannel** is currently only `EMAIL`.
- `alerts-service.ts`: `sendAlertOnRunFinish`, `add`, `list`, `delete`. Email via `email-service.ts` `sendIssueCreatedNotification`.
- No unique index — the service enforces one alert per `(projectId, LOWER(receiver))`.

### How it works
- `sendAlertOnRunFinish({ issueToAlert, flowRunId, failedStep })` runs after a failed production run. It increments Redis `flow_fail_count:<flowVersionId>` (expires 86400s); only when the count is 1 does it email.
- It fetches **the run's own** flow version (not the latest locked one) so `failedStep.name` is always findable and `failedStepNumber` is present.
- Personal projects: exactly one receiver, the owner (single on/off switch). Team projects: any number of receivers, managed by admins with `WRITE_ALERT` + `WRITE_PROJECT`.
- Endpoints `/v1/alerts`: GET (`READ_ALERT`), POST (`WRITE_ALERT`), DELETE `/:id`. Project post-create hooks auto-subscribe the owner (personal) or the `alertReceiverEmail` (team).

### Gotchas
- Personal projects reject any receiver that isn't the owner's identity email (throws `VALIDATION`).
- There is **no Issues feature** — the email CTA "View Run" links straight to `projects/<id>/runs/<runId>`. The old `checkIssuesEnabled`/`isIssue`/"View Issue" plumbing was removed.
- Email subject: `[<project>] Flow has an issue "<flow>" ⚠️`. Platform admins can bulk subscribe/unsubscribe across projects (max 5 concurrent via `p-limit`).

### Key files
Entry point: `alertsService`, called from `packages/server/api/src/app/flows/flow-run/flow-run-hooks.ts` when a run finishes.

- `packages/server/api/src/app/ee/alerts/` — controller, service, entity, module registration
- `packages/server/api/src/app/ee/helper/email/` — `sendIssueCreatedNotification` and the SMTP sender that builds the subject line
- `packages/server/api/src/assets/emails/issue-created.html` — Mustache template for the failure email
- `packages/server/api/src/app/ee/projects/` — EE post-create hooks plus the platform project controller and service that carry `alertReceiverEmail`
- `packages/server/api/src/app/project/` — CE project hooks and service that plumb the post-create context
- `packages/core/shared/src/lib/ee/alerts/` — `Alert` type, `AlertChannel`, and the list/create request schemas
- `packages/core/shared/src/lib/management/project/project-requests.ts` — `CreatePlatformProjectRequest.alertReceiverEmail`
- `packages/web/src/features/alerts/` — frontend API client and React Query hooks
- `packages/web/src/app/components/project-settings/alerts/` — personal switch UI, team receiver list, add-receiver form
- `packages/web/src/features/projects/components/` — platform admin bulk subscribe actions and the new-project dialog field

Paths verified 2026-07-17.
