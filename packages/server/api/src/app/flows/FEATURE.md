# Flows Module

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
