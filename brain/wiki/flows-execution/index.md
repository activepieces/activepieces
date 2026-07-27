---
icon: 🔀
---

# Flows & Execution

How flows are authored, triggered, executed, and organized in Activepieces. Skim map of the core automation domain.

### Flows
Versioned directed graph (trigger + actions) stored as JSONB. All 26 modification types go through ONE endpoint: `POST /v1/flows/:id` with a `FlowOperationRequest` discriminated union.
- Entities: `flow` (status, folderId, publishedVersionId, externalId, createdBy) + `flow_version` (immutable once LOCKED; DRAFT is the editable copy). Current schemaVersion `'22'`.
- Draft/Published split: edits hit DRAFT; `LOCK_AND_PUBLISH` snapshots to LOCKED and can enable. Publishing registers the trigger source; disabling unregisters it.
- Frontend builder = XYFlow canvas + Zustand state slices. Supports vertical/horizontal layout and PNG export.
- Gotcha: `createdBy` (MCP/AGENT) drives the "AI" badge; distinct from `ownerId`.

### Flow Runs
One execution instance per flow version, trigger → terminal state. 12 statuses (3 non-terminal: QUEUED/RUNNING/PAUSED; 9 terminal incl. FAILED/TIMEOUT/QUOTA_EXCEEDED/MEMORY_LIMIT_EXCEEDED).
- Logs: full execution context stored as zstd-compressed File (`FLOW_RUN_LOG`); step outputs >32KB offloaded to `FLOW_RUN_LOG_SLICE` files (`LogSliceRef`). State backed up every 15s for crash recovery.
- Retry: FROM_FAILED_STEP (resume, keep prior outputs) or ON_LATEST_VERSION (fresh run). Failed-trigger is a special case — restarts with `executeTrigger: true`. Only terminal states within `EXECUTION_DATA_RETENTION_DAYS`.
- `failedStep` JSONB snapshot powers filtered retries, error search, failure emails, jump-to-failed-step.
- Paid editions emit AI usage billing (`ai_usage_per_run`) on terminal runs.

### Triggers
Defines how/when a flow starts. Registered as a `TriggerSource` (unique per projectId/flowId/simulate); dedup state in Redis.
- 4 strategies: POLLING (BullMQ cron + Redis INCR dedup on `__DEDUPE_KEY_PROPERTY`), WEBHOOK (external push), APP_WEBHOOK (routed via `AppEventRouting` table, e.g. Slack/GitHub), MANUAL.
- Enable/disable side effects: schedule/remove BullMQ jobs, register/unregister external webhooks (ON_ENABLE/ON_DISABLE worker hooks), create/delete routing rows.
- `TriggerEvent` = captured payload (File ref) used as test/sample data. `simulate=true` sources are test-mode.

### Webhooks
Primary entry point for inbound HTTP → flow execution. 5 public routes: sync/async × prod/draft + test-only.
- Sync (`/:flowId/sync`) blocks the connection and returns the flow response via `engineResponseWatcher` (default 30s timeout). Async returns 200 + `x-webhook-id` and queues a BullMQ job.
- Payloads >512KB offloaded to a `WEBHOOK_PAYLOAD` file; job carries an inline-or-ref `JobPayload`. Engine resolves the ref at exec time — workers no longer fetch payloads.
- Handshake verification (HEADER/QUERY/BODY_PARAM/HEAD_REQUEST) runs BEFORE the disabled-flow guard. Version resolution = `LOCKED_FALL_BACK_TO_LATEST`. Payload cap `AP_MAX_WEBHOOK_PAYLOAD_SIZE_MB` (5MB → 413).

### Human Input (Forms & Chat)
Public read-only endpoints returning UI metadata for flows whose trigger is `@activepieces/piece-forms`. Triggers: `form_submission`, `file_submission`, `chat_submission`.
- `GET /v1/human-input/form/:flowId` and `/chat/:flowId` — return title, input schema, platform branding (white-labeled). `useDraft=true` loads the draft version.
- Gotcha: these endpoints only return the UI definition; the actual submission goes through the WEBHOOK endpoint. Unpublished flows 404 unless `useDraft=true`.

### Folders
Lightweight per-project grouping for flows and tables. Name unique case-insensitively per project.
- `folder` entity (displayName, projectId, displayOrder). List returns `numberOfFlows`/`numberOfTables` via correlated subqueries. Create is an upsert by name.
- Sentinel `"NULL"` (`UncategorizedFolderId`) filters flows with no folder. Deleting a folder does NOT delete its flows — they become uncategorized. Fires `FOLDER_CREATED/UPDATED/DELETED` audit events.

### Templates
Reusable flow/table blueprints. Types: OFFICIAL (Activepieces-curated, platformId null), CUSTOM (platform-owned, needs `manageTemplatesEnabled` flag), SHARED (ad-hoc, not listable).
- Self-hosted CE/EE proxy OFFICIAL templates from `cloud.activepieces.com/api/v1/templates`; Cloud stores them in DB. `pieces[]` and `categories[]` are denormalized + indexed for fast filtering.
- Only platform owners manage CUSTOM templates; OFFICIAL/SHARED can't be edited/deleted. Flow validation + piece extraction run before save.

## Pages

- **Flows** — the versioned trigger + action graph, DRAFT/LOCKED, publishing
- **Flow Runs** — the status state machine and RunTimeline phases
- **Triggers** — POLLING / WEBHOOK / APP_WEBHOOK / MANUAL
- **Human Input** — forms, approvals, the resume confirmation page
- **Folders** — flow organization; the uncategorized sentinel
- **Templates** — OFFICIAL / CUSTOM / SHARED blueprints
- **Variables** — project-scoped values referenced from steps
- **Formulas** — the `{{ ... }}` evaluator shared by engine, api and web
- **Chat** — the conversational surface over a flow
