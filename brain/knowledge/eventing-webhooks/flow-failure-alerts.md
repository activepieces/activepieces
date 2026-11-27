---
icon: 🚨
---

# Flow Failure Alerts

Email notifications when a flow run fails. The first failure of a flow version emails every receiver of the project; later failures of that version stay silent until 24 hours pass with no failure (a Redis counter). Cloud/EE only: the service checks the edition, there is no plan flag.

### Entities & services
- **Alert**: subscription tying a project to an email **receiver** (stored lowercased; lookups use `LOWER(receiver)`). **AlertChannel** is currently only `EMAIL`.
- `alerts-service.ts`: `sendAlertOnRunFinish`, `add`, `list`, `delete`. Email via `email-service.ts` `sendIssueCreatedNotification`.
- No unique index — the service enforces one alert per `(projectId, LOWER(receiver))` and answers a duplicate with `EXISTING_ALERT_CHANNEL` (409).

### How it works
- `sendAlertOnRunFinish({ issueToAlert, flowRunId, failedStep })` runs from `flowRunHooks.onFinish` for a run that is in a failed state, in the `PRODUCTION` environment, and has a `failedStep`. A test run from the builder never alerts.
- It increments Redis `flow_fail_count:<flowVersionId>` and sets its expiry to 86400s on every failure; only when the count is 1 does it email. A new published version starts a new counter.
- It fetches **the run's own** flow version (not the latest locked one) so `failedStep.name` is always findable and `failedStepNumber` is present.
- One mail goes to every receiver of the project (the first 50 alerts) in a single `To` line, so receivers see each other's address.
- **Notify flow owners** (`project.notifyFlowOwnerOnFailure`, off by default) also adds the email of the flow's owner.
- Personal projects: exactly one receiver, the owner (single on/off switch). Team projects: any number of receivers.
- Endpoints `/v1/alerts`: GET (`READ_ALERT`), POST (`WRITE_ALERT`), DELETE `/:id` (`WRITE_ALERT`). Of the default project roles, only Admin holds them. The web also checks `WRITE_PROJECT` for the delete button and the switches.
- The settings tab **Alert Emails** shows when the `SHOW_ALERTS` flag is on (any edition but CE) and the user has `READ_ALERT`.
- Project post-create hooks auto-subscribe the owner of a personal project (not for a JWT identity) or the `alertReceiverEmail` of a new team project.

### Gotchas
- Personal projects reject any receiver that isn't the owner's identity email (throws `VALIDATION`).
- The expiry restarts on each failure, so a flow version that fails at least once a day never sends a second alert.
- The settings tab says "Other failures are summarized in a daily email", but no code sends a daily summary.
- `POST /v1/alerts` returns an empty body, not the alert. A caller lists the alerts of the project to find the new id.
- The server does not check that `receiver` is an email address; only the web form does.
- There is **no Issues feature** — the email CTA "View Run" links straight to `projects/<id>/runs/<runId>`. The old `checkIssuesEnabled`/`isIssue`/"View Issue" plumbing was removed.
- Email subject: `[<project>] Flow has an issue "<flow>" ⚠️`.
- Platform admins can subscribe or unsubscribe their own email on many projects at once. The web sends one request per selected project, all at the same time, with no concurrency limit.

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
- `packages/tests-e2e/scenarios/ee/project/alerts.spec.ts` — E2E spec: add a receiver, invalid address, alert mail on a failed run

Paths verified 2026-11-22.
