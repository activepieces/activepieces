---
icon: 🌊
---

# Flows

Flows are the core automation primitive: a versioned directed graph of trigger + action steps stored as a JSONB tree. The module covers the full lifecycle — draft editing, publishing, enable/disable, folders, sample data, human-input forms/chat, and the XYFlow visual builder.

### Entities & services
- **Flow** — persistent record: status (ENABLED/DISABLED), folderId, publishedVersionId, externalId, operationStatus (NONE/DELETING/ENABLING/DISABLING), ownerId, createdBy (`FlowCreator`: `{type: MCP|AGENT, id}`, null for humans → "AI" badge).
- **FlowVersion** — immutable-once-LOCKED snapshot of the graph. DRAFT is editable; current schemaVersion is `'22'`. Holds trigger (full graph JSONB), connectionIds, agentIds, notes.
- **Folder** — simple per-project grouping, case-insensitive unique.
- Core service: `flow.service.ts`; single controller endpoint `POST /v1/flows/:id`.

### How it works
- **All 26 modification types** dispatch through one endpoint `POST /v1/flows/:id` with a `FlowOperationRequest` discriminated union (ADD/UPDATE/DELETE/MOVE_ACTION, branch ops, UPDATE_TRIGGER, LOCK_AND_PUBLISH, CHANGE_STATUS, CHANGE_FOLDER, IMPORT_FLOW, SAVE_SAMPLE_DATA, notes, etc.).
- **Draft vs published**: editing always hits DRAFT. `LOCK_AND_PUBLISH` snapshots to a LOCKED version + sets `publishedVersionId`; `USE_AS_DRAFT` copies it back. Only published flows can be enabled.
- **Publish/enable side effects**: lock version → register trigger source (webhook/polling/app-event) → invalidate execution cache → emit WebSocket event → fire-and-forget telemetry. Disable unregisters the trigger source.
- Sample data is captured per step (input+output) as File entities per flow version.

### Gotchas
- **Step output nesting (schema v21+)**: every step output is wrapped as `{ output, error? }`; expressions must use the `['output']` accessor. The v20→v21 migration rewrites existing expressions via `expression-rewriter`.
- **Continue on Failure**: CODE/PIECE steps with `continueOnFailure.value: true` carry `onSuccess`/`onFailure` sub-trees under `settings.errorHandlingOptions.continueOnFailureBranches`.
- `createdBy` (automated source) is distinct from `ownerId` (current owning user).
- List filtering: `folderId` uses the string sentinel `"NULL"` for uncategorized; `folderIds` (array) loads all foldered flows in one request.
- Builder is Zustand-sliced (flow/run/canvas/step-form/piece-selector state). Canvas supports vertical (default) and horizontal orientations, and PNG export via a hand-rolled clone-and-rasterize pipeline.
- **Flows stuck in `DELETING` keep eating the active-flow limit.** Deletion is a durable BullMQ system job (`delete-flow-<flowId>`), not synchronous: `delete()` sets `operationStatus=DELETING` and enqueues, and the row plus `status=ENABLED` only go away when the job finishes. That job runs `sampleDataService.deleteForFlow`, whose `DELETE FROM file … metadata->>'flowId'=?` had no index — on the large prod `file` table it seq-scans, blows `statement_timeout`, exhausts its 2 attempts and lands **permanently** in the failed set. The flow is then hidden from the UI list (which filters `!=DELETING`) but still counted by the active-flows quota (`getUsage` counts `status=ENABLED`), so Publish silently shows the "Purchase Extra Active Flows" dialog instead of publishing — this is what breaks the `webhook-should-return-response` e2e monitor. Stuck flows are functionally dead (`preDelete` disables the trigger before the failing delete), so forcing their rows away is safe. Fixes on `fix/flow-delete-sample-data-timeout`: a partial expression index `idx_file_sample_data_flow_id` on `file (type, (metadata->>'flowId'))`, plus `operationStatus != DELETING` in the active-flow counts so the quota stops depending on delete-job success.

### Editions
CE has full authoring/publishing/folders/forms. EE/Cloud add owner transfer, piece filtering, template sharing, and active-flow quota enforcement on publish/enable.

### Key files
Entry point: `flowService`, exported from `flows/flow/flow.service.ts` and called per-request as `flowService(request.log)` from the flow controller.

- `packages/server/api/src/app/flows/` — server module: flow service + REST controller, folders, step-run sample data, human-input form/chat endpoints
- `packages/server/api/src/app/flows/flow-version/migrations/` — schema migrations, including v21 step-output nesting and the `expression-rewriter`
- `packages/core/execution/src/lib/flows/` — shared types: Flow, FlowVersion, the FlowOperationRequest union, actions, triggers
- `packages/web/src/features/flows/` — client API, hooks, components, export/import utils
- `packages/web/src/app/builder/` — visual builder: Zustand state slices, step settings, step data panel, test-step, data selector
- `packages/web/src/app/builder/flow-canvas/` — XYFlow canvas, orientation layout, canvas controls, PNG export
- `packages/web/src/components/custom/smart-output-viewer/` — friendly and raw output rendering for test-step and run details
- `packages/web/src/lib/path-utils.ts` — dot/bracket path resolution with the wrapper-key fallback
- `packages/web/src/app/routes/automations/index.tsx` — flows list page

Paths verified 2026-07-17. An earlier version pointed the shared flow types at `packages/core/shared/src/lib/automation/flows/`; they moved to `packages/core/execution/src/lib/flows/`. `expression-rewriter.ts` also left that tree and now lives in the server's `flow-version/migrations/`.
