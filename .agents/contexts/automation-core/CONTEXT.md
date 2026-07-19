# Automation Core

The vocabulary of what users build and what runs: flows, their versions, the steps inside them, and the runs they produce.

## Language

**Flow**:
A named automation consisting of a trigger and one or more action steps, stored as a versioned JSONB graph.
_Avoid_: workflow, automation, pipeline, scenario

**FlowVersion**:
An immutable (once locked) snapshot of a flow's trigger + action graph; DRAFT is editable, LOCKED is published.
_Avoid_: version, revision

**Draft**:
The editable FlowVersion state; only one draft exists per flow at a time.

**Published**:
A LOCKED FlowVersion pointed to by `flow.publishedVersionId`; the version that runs in production.
_Avoid_: live, active version

**FlowOperationRequest**:
The discriminated union of all 26 modification types dispatched to the single flow update endpoint.

**Step**:
Generic term for any node in a flow graph — either a trigger or an action.
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

**RunTimeline**:
A run's latency breakdown as legs of four phases — Queue, Provision, Boot, Run — persisted on `flow_run` and shown as a stacked bar in the run detail view.
_Avoid_: latency breakdown, waterfall

**TimelinePhase**:
One labeled segment of a RunTimeline leg: QUEUE (waiting), PROVISION (install bundle/pieces/engine), BOOT (engine fork/boot), or RUN (flow execution).
_Avoid_: stage, span

**Sample Data**:
Captured step input/output stored as File entities per flow version, used for testing downstream steps.
_Avoid_: test data, mock data

**Agent**:
A flow step type that runs an LLM-driven autonomous loop, calling tools until it produces a final answer.
_Avoid_: AI step, bot

**AgentTool**:
A discriminated union of the four tool types attachable to an agent step: Piece, Flow, MCP, or Knowledge Base.

**Folder**:
A grouping container for organizing flows and tables within a project.
_Avoid_: directory, category

**Resume Confirmation Page**:
The white-labeled HTML page served on `GET`/`HEAD` of the dedicated `.../waitpoints/:id/confirm`
route; a human must click Approve/Disapprove to `POST` back and resume the paused run. Exists so an
email security scanner's link prefetch (a bare `GET`) cannot consume the single-use waitpoint. On
open it reads the waitpoint from the DB and shows an "already responded" state when the run has moved
on. The older `.../waitpoints/:id` route still resumes on a bare `GET` (deprecated, kept for
already-sent emails).
_Avoid_: interstitial

**Approval Action**:
The `action=approve|disapprove` query-param convention on approval resume links, produced by the
approval pieces and recognized by the Resume Confirmation Page to render Approve/Disapprove buttons.

### Subflows

**Subflow**:
A Flow invoked by another flow rather than by its own external trigger; it exposes a Callable Flow trigger and is reached via a webhook POST to `/v1/webhooks/:flowId`.
_Avoid_: child flow, nested flow, sub-workflow

**Callable Flow**:
The trigger (`@activepieces/piece-subflows`) that lets a flow be invoked as a Subflow; carries the parent's `data` payload and an optional `callbackUrl`.

**Call Flow**:
The action that invokes a single Subflow once and optionally waits for its response. Distinct from a fan-out, which invokes a Subflow many times.

**Subflow Fan-out**:
Dispatching many Subflow calls from one parent step (e.g. one per CSV batch). Fire-and-forget by default; the opt-in Subflow Fan-in variant waits for the children.
_Avoid_: scatter, broadcast

**Subflow Fan-in**:
A Subflow Fan-out variant where the parent pauses on a Join Waitpoint and resumes once all N dispatched children reach a terminal state, returning a `{ completed, failed }` summary. Opt-in via the `waitForSubflows` prop.
_Avoid_: barrier, gather, join

**Join Waitpoint**:
A Waitpoint carrying a non-null `expectedCount`; resumes its run when `COUNT(terminal children) == expectedCount` rather than on a single resume signal. The `expectedCount` field is the sole discriminator from a 1:1 waitpoint.
_Avoid_: counting waitpoint, multi-waitpoint, tally waitpoint

**Batch**:
The unit of rows sent as the `data` payload of one Subflow call in a fan-out — `{ batchIndex, headers, rows }`.
_Avoid_: chunk, csv table, sub-table, shard
