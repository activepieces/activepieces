# Flows Module

## Summary
Flows are the core automation primitive in Activepieces. Each flow is a versioned directed graph of trigger and action steps stored as a JSONB tree. The module handles the full lifecycle: draft editing via a single-endpoint operation dispatch, publishing (locking a version and registering the trigger source), enabling/disabling, folder organization, sample data capture for testing, human-input forms/chat interfaces, and the visual builder frontend powered by XYFlow. All 26 flow modification types are dispatched through one endpoint (`POST /v1/flows/:id`) with a discriminated-union body.

## Key Files
- `packages/server/api/src/app/flows/flow/flow.service.ts` — core service (operations, publish, enable/disable)
- `packages/server/api/src/app/flows/flow/flow.controller.ts` — REST controller
- `packages/server/api/src/app/flows/folder/` — folder CRUD
- `packages/server/api/src/app/flows/step-run/` — sample data capture and test-step execution
- `packages/server/api/src/app/flows/human-input/` — form and chat public endpoints
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

The visual builder (`packages/web/src/app/builder/`) uses XYFlow for the canvas. State is split into focused Zustand slices:
- `flow-state.ts` — current flow and version, pending operations
- `run-state.ts` — active test run, step results
- `canvas-state.ts` — viewport, selected node, drag state
- `step-form-state.ts` — open/focused step configuration
- `piece-selector-state.ts` — piece browser visibility and search
- `notes-state.tsx` — sticky notes overlay

`flowHooks.useChangeFlowStatus` handles both publish and enable/disable, surfaces `TRIGGER_UPDATE_STATUS` errors via an `ApErrorDialog`, and maps gateway timeout errors to a user-readable message. `flowHooks.importFlowsFromTemplates` replaces `externalId` references across a multi-flow template import to maintain cross-flow links.
