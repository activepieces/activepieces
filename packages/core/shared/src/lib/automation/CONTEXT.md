# Automation

The core engine of Activepieces. A flow is a versioned graph of a trigger and one or more action steps; this context owns the vocabulary of authoring, publishing, and executing those flows.

## Language

**Flow**:
A named automation consisting of a trigger and one or more action steps, stored as a versioned JSONB graph.
_Avoid_: workflow, automation, pipeline, scenario

**FlowVersion**:
An immutable-once-locked snapshot of a flow's trigger + action graph; the DRAFT state is editable, the LOCKED state is published.
_Avoid_: version, revision

**Draft**:
The single editable `FlowVersion` of a flow; only one draft exists per flow at a time.

**Published**:
The LOCKED `FlowVersion` pointed to by `flow.publishedVersionId` — the version that runs in production.
_Avoid_: live, active version

**FlowOperationRequest**:
The discriminated union of all flow-modification types dispatched to the single flow update endpoint.

**Step**:
Any node in a flow graph — either a trigger or an action.
_Avoid_: node, block

**Action**:
A single executable step within a flow that performs an operation (HTTP call, data transform, code execution, etc.).
_Avoid_: task, command

**Trigger**:
The entry point of a flow that initiates execution via webhook, polling, app event, or manual invocation.
_Avoid_: event source, starter

**TriggerStrategy**:
The mechanism a trigger uses: POLLING, WEBHOOK, APP_WEBHOOK, or MANUAL.
_Avoid_: trigger type

**TriggerSource**:
The external registration (webhook URL, polling job, app-event subscription) that fires a flow.

**FlowRun**:
A single execution instance of a published flow, tracking status, logs, timing, and step results.
_Avoid_: execution, job, run instance

**FlowRunStatus**:
The state machine for a run: QUEUED, RUNNING, PAUSED, SUCCEEDED, FAILED, TIMEOUT, CANCELED, and others.

**Sample Data**:
Captured step input/output stored as `File` entities per flow version, used for testing downstream steps.
_Avoid_: test data, mock data

**Folder**:
A grouping container for organizing flows and tables within a project.
_Avoid_: directory, category
