# Flows Module

## Summary
Flows are the core automation primitive in Activepieces. Each flow is a versioned directed graph of trigger and action steps stored as a JSONB tree. The module handles the full lifecycle: draft editing via a single-endpoint operation dispatch, publishing (locking a version and registering the trigger source), enabling/disabling, folder organization, sample data capture for testing, human-input forms/chat interfaces, and the visual builder frontend powered by XYFlow. All 26 flow modification types are dispatched through one endpoint (`POST /v1/flows/:id`) with a discriminated-union body.

## Key Files
- `packages/server/api/src/app/flows/flow/flow.service.ts` — core service (operations, publish, enable/disable)
- `packages/server/api/src/app/flows/flow/flow.controller.ts` — REST controller
- `packages/server/api/src/app/flows/folder/` — folder CRUD
- `packages/server/api/src/app/flows/step-run/` — sample data capture and test-step execution
- `packages/server/api/src/app/flows/flow/human-input/` — form and chat public endpoints
- `packages/shared/src/lib/automation/flows/flow.ts` — `Flow`, `PopulatedFlow` types
- `packages/shared/src/lib/automation/flows/flow-version.ts` — `FlowVersion`, `FlowVersionState`
- `packages/shared/src/lib/automation/flows/operations/` — `FlowOperationRequest` union and all 26 op types
- `packages/shared/src/lib/automation/flows/actions/action.ts` — `FlowAction` discriminated union
- `packages/shared/src/lib/automation/flows/triggers/trigger.ts` — `FlowTrigger` discriminated union
- `packages/web/src/features/flows/api/flows-api.tsx` — `flowsApi` (list, create, update, get, versions, delete, count)
- `packages/web/src/features/flows/hooks/flow-hooks.tsx` — `flowHooks` (status change, export, import, test, version management)
- `packages/web/src/features/flows/components/` — `FlowStatusToggle`, `ImportFlowDialog`, `ShareTemplateDialog`, `ChangeOwnerDialog`
- `packages/web/src/features/flows/utils/flows-utils.tsx` — download, zip, template parsing helpers
- `packages/web/src/app/builder/index.tsx` — visual flow builder entry point
- `packages/web/src/app/builder/flow-canvas/` — XYFlow canvas (nodes, edges, drag layer, context menu)
- `packages/web/src/app/builder/state/` — Zustand-based builder state (flow, run, canvas, notes, step form, piece selector)
- `packages/web/src/app/builder/step-settings/` — step configuration panel
- `packages/web/src/app/builder/pieces-selector/` — piece/action browser
- `packages/web/src/app/builder/data-selector/` — variable picker (mentions / data selector); `index.tsx` hosts both **Advanced** (existing tree) and **Friendly** tabs. When a step is a PIECE action/trigger, friendly mode builds its tree from the piece's `outputDisplayHints` via `utils-hints.ts` and renders rows through `friendly-data-selector-node.tsx`; otherwise it falls back to a generic field list. Hints are fetched via `usePieceOutputHints` (see [pieces.md](../features/pieces.md))
- `packages/web/src/components/custom/smart-output-viewer/` — the new **Smart Output Viewer** used by test-step output and run details. `index.tsx` chooses between a labelled "Friendly view" (`output-field-list.tsx` → `output-field-row.tsx`, table-shaped arrays via `output-table-view.tsx`, generic fallback via `output-generic-field-list.tsx`) and the existing Raw JSON view. Values render through `format-value.tsx` which applies per-field `FieldFormat` rendering (clickable email/url, inline image, formatted date / currency / filesize / duration / boolean / HTML badge) and enforces an SSRF/XSS-safe URL allow-list (`http(s)` only). Path resolution and the common wrapper-key fallback (`data.*`, `body.*`, `payload.*`, …) live in `packages/web/src/lib/path-utils.ts`
- `packages/web/src/app/builder/test-step/test-sample-data-viewer.tsx` and `packages/web/src/app/builder/run-details/flow-step-input-output.tsx` — both wrap `SmartOutputViewer` for test-output and run-output panes, passing the resolved `pieceHints` for the current step
- `packages/web/src/app/routes/automations/index.tsx` — flows list page

## Edition Availability
- **Community (CE)**: Full flow authoring, publishing, folders, sample data, human-input forms.
- **Enterprise (EE) / Cloud**: Same core. Some operational features (owner transfer, piece filtering, template sharing) integrate with EE plan flags. Active-flow quota enforcement on publish/enable.

## Domain Terms
- **Flow**: The persistent automation record — holds status, folder, published version pointer, and metadata.
- **FlowVersion**: An immutable (once locked) snapshot of the trigger + action graph. DRAFT state is editable; LOCKED state is the published baseline.
- **FlowOperationRequest**: The discriminated union of all 26 modification types dispatched to `POST /v1/flows/:id`.
- **Draft / Published split**: Editing always happens on the DRAFT version. `LOCK_AND_PUBLISH` snapshots it to LOCKED and optionally enables the flow.
- **Trigger Source**: The external registration (webhook URL, polling schedule, app-event subscription) that fires the flow. Registered on enable, unregistered on disable.
- **externalId**: A stable UUID used to cross-reference a flow across imports/templates (preserved through `IMPORT_FLOW` operations).
- **Folder**: A simple grouping container for flows and tables within a project.
- **Sample Data**: Captured step output (input + output) stored as File entities per flow version, used for testing downstream steps without live execution.
- **Human Input**: Flows that expose a public form (`/form/:flowId`) or chat interface (`/chat/:flowId`) as their trigger UI.
- **operationStatus**: Tracks in-progress mutations (ENABLING, DISABLING, DELETING) to prevent race conditions on concurrent state changes.

## Entities

**Flow**: id, projectId, folderId (nullable), status (ENABLED/DISABLED), externalId, publishedVersionId (nullable, unique FK), metadata (JSONB), operationStatus (NONE/DELETING/ENABLING/DISABLING), timeSavedPerRun, ownerId, templateId. Relations: project, folder, owner, publishedVersion (one-to-one), versions (one-to-many), runs, events, tableWebhooks.

**FlowVersion**: id, flowId, displayName, schemaVersion, trigger (JSONB — full flow graph), connectionIds[], agentIds[], updatedBy, valid, state (DRAFT/LOCKED), backupFiles (JSONB), notes[] (JSONB). Relations: flow, updatedByUser.

**Folder**: id, projectId, displayName. Used to organize flows and tables. Case-insensitive uniqueness.

## Flow Operations (Single-Endpoint Dispatch)

All flow modifications go through `POST /v1/flows/:id` with a `FlowOperationRequest` discriminated union. **26 operation types**:

- Structure: ADD_ACTION, UPDATE_ACTION, DELETE_ACTION, DUPLICATE_ACTION, MOVE_ACTION, SET_SKIP_ACTION
- Branching: ADD_BRANCH, DELETE_BRANCH, DUPLICATE_BRANCH, MOVE_BRANCH
- Trigger: UPDATE_TRIGGER
- Publishing: LOCK_AND_PUBLISH, USE_AS_DRAFT, LOCK_FLOW, CHANGE_STATUS
- Organization: CHANGE_FOLDER, CHANGE_NAME, UPDATE_OWNER, UPDATE_METADATA, IMPORT_FLOW
- Data: SAVE_SAMPLE_DATA, UPDATE_SAMPLE_DATA_INFO, UPDATE_MINUTES_SAVED
- Notes: ADD_NOTE, UPDATE_NOTE, DELETE_NOTE

## Draft vs Published

- New flow → FlowVersion in DRAFT state (editable)
- LOCK_AND_PUBLISH → creates LOCKED version (immutable), sets `flow.publishedVersionId`
- USE_AS_DRAFT → copies published version back to draft for editing
- Only published flows can be enabled (triggers registered)

## Publishing Side Effects

When LOCK_AND_PUBLISH or CHANGE_STATUS to ENABLED:
1. Lock version → set publishedVersionId
2. Enable trigger source (register webhook/polling/app-event)
3. Invalidate flow execution cache
4. Emit WebSocket event
5. Track telemetry

When CHANGE_STATUS to DISABLED:
1. Disable trigger source (unregister webhook/polling)
2. Invalidate cache

## Human Input (`human-input/`)

- **Form controller** (`GET /form/:flowId`): Public endpoint returning form UI config from flow definition. Supports `?useDraft=true`.
- **Chat controller** (`GET /chat/:flowId`): Public endpoint returning chat UI config. Supports sessionId, message, file attachments.

## Step-Run / Sample Data (`step-run/`)

- Captures test data per step (input + output)
- Stored as File entities (SAMPLE_DATA / SAMPLE_DATA_INPUT types)
- Per flow version — each version has its own test data

## Frontend Builder Architecture

The visual builder (`packages/web/src/app/builder/`) uses XYFlow for the canvas. State is split into focused Zustand slices, composed by `builder-state-provider.tsx`:
- `flow-state.ts` — current flow and version, pending operations
- `run-state.ts` — active test run, step results, focused/failed step (used by the run-info widget's "See error" affordance); `setRun` resets `userManuallySelectedStepDuringRun` whenever a new run id arrives
- `canvas-state.ts` — viewport, selected node, drag state, plus the `userManuallySelectedStepDuringRun` flag and `resumeLiveFollow` action that gate auto-follow. The auto-focus effect lives in `useFocusOnStep` (`flow-canvas/hooks.tsx`): it calls `selectStepByName(step, { fromAutoFocus: true })` to pan the canvas to the latest engine step, and short-circuits whenever `userManuallySelectedStepDuringRun` is set. The flag flips to `true` when the user picks a different step mid-run (any `selectStepByName` call without `fromAutoFocus`) and clears via `resumeLiveFollow` or when `setRun` receives a new run id
- `step-form-state.ts` — open/focused step configuration
- `piece-selector-state.ts` — piece browser visibility and search
- `notes-state.tsx` — sticky notes overlay
- `chat-state.ts` — embedded chat drawer state for testing `chat_submission`-trigger flows from the builder

`flowHooks.useChangeFlowStatus` handles both publish and enable/disable, surfaces `TRIGGER_UPDATE_STATUS` errors via an `ApErrorDialog`, and maps gateway timeout errors to a user-readable message. `flowHooks.importFlowsFromTemplates` replaces `externalId` references across a multi-flow template import to maintain cross-flow links.

### Step Output Surfaces (Smart Output Viewer + Data Selector)

Two builder surfaces consume an action/trigger's optional `outputDisplayHints` (defined on the piece — see [pieces.md](./pieces.md)):

- **Smart Output Viewer** (`components/custom/smart-output-viewer/`) — used by the test-step output pane and run details. With hints, renders a labelled friendly view driven by the hints' `fields` array (type icons, copy-to-clipboard, expandable nested values via `children` / `listItems`, automatic table view for arrays of records, formatted images / emails / dates / file sizes / durations / currencies). Without hints, falls back to a generic field list for arbitrary JSON. A Raw JSON tab is always available.
- **Data Selector** (`app/builder/data-selector/`) — variable picker. With hints, the Friendly tab shows labelled rows with value previews (purple values, same formatting as the viewer); inserting a row produces a fully-qualified mention path (e.g. `step_1["thread"]["data"]["messages"][0]["subject"]`). Without hints, falls back to a generic per-step field list. The Advanced tab is the existing raw tree.

Both surfaces fetch hints via `usePieceOutputHints({ pieceName, pieceVersion, stepName })`, which reads from the cached `['piece', name, version]` React Query entry — no extra network calls. Hint path lookups use `pathUtils.getValueByDotPath` (`packages/web/src/lib/path-utils.ts`), which supports dot/bracket notation and a wrapper-key fallback (`data.*`, `body.*`, `payload.*`, …) so common API envelopes resolve transparently.
