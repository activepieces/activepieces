# Trigger Module

## Summary
Manages the full lifecycle of flow triggers — registration, event capture, testing, and deduplication. A trigger defines how and when a flow starts: via polling, inbound webhooks, app-native webhooks routed through a shared event bus, or manual invocation. The module tracks each enabled trigger as a `TriggerSource` record, maintains deduplication state in Redis, and drives enable/disable side effects such as BullMQ job scheduling and external webhook registration.

## Key Files
- `packages/server/api/src/app/trigger/trigger-source/flow-trigger-side-effect.ts` — enable/disable side effects per strategy
- `packages/server/api/src/app/trigger/trigger-source/trigger-source-service.ts` — TriggerSource CRUD
- `packages/server/api/src/app/trigger/trigger-source/trigger-source-entity.ts` — TriggerSource entity
- `packages/server/api/src/app/trigger/trigger-source/trigger-utils.ts` — helper utilities
- `packages/server/api/src/app/trigger/trigger-events/trigger-event.service.ts` — TriggerEvent storage and retrieval
- `packages/server/api/src/app/trigger/trigger-events/trigger-event-controller.ts` — TriggerEvent endpoints
- `packages/server/api/src/app/trigger/trigger-events/trigger-event.entity.ts` — TriggerEvent entity
- `packages/server/api/src/app/trigger/test-trigger/test-trigger-service.ts` — simulation and test-function modes
- `packages/server/api/src/app/trigger/test-trigger/test-trigger-controller.ts` — test trigger endpoints
- `packages/server/api/src/app/trigger/dedupe-service.ts` — Redis-based deduplication for polling
- `packages/server/api/src/app/trigger/app-event-routing/app-event-routing.service.ts` — APP_WEBHOOK routing table
- `packages/server/api/src/app/trigger/app-event-routing/app-event-routing.entity.ts` — AppEventRouting entity
- `packages/server/api/src/app/trigger/trigger-run/trigger-run-stats.ts` — per-platform trigger health tracking
- `packages/server/api/src/app/trigger/trigger-run/trigger-run.controller.ts` — trigger run stats endpoints
- `packages/server/api/src/app/trigger/trigger.module.ts` — module registration
- `packages/shared/src/lib/automation/trigger/index.ts` — TriggerSource schema, TriggerStrategy enum, WebhookHandshakeConfiguration, ScheduleOptions
- `packages/web/src/app/builder/test-step/test-trigger-section/index.tsx` — test panel in the builder sidebar
- `packages/web/src/app/builder/test-step/test-trigger-section/first-time-testing-section.tsx` — initial test prompt before any event is captured
- `packages/web/src/app/builder/test-step/test-trigger-section/simulation-section.tsx` — simulation status UI
- `packages/web/src/app/builder/test-step/test-trigger-section/trigger-event-select.tsx` — event selector from previously captured events
- `packages/web/src/app/builder/test-step/test-trigger-section/manual-webhook-test-button.tsx` — button to send a test HTTP request to the webhook endpoint
- `packages/web/src/app/builder/test-step/custom-test-step/test-webhook-dialog.tsx` — dialog for manually testing webhook triggers
- `packages/web/src/app/builder/flow-canvas/nodes/step-node/trigger-widget.tsx` — trigger node widget on the flow canvas
- `packages/web/src/app/builder/flow-canvas/widgets/above-trigger-button.tsx` — "+ Add trigger" button above the trigger node

## Edition Availability
- Community (CE): all four trigger strategies (POLLING, WEBHOOK, APP_WEBHOOK, MANUAL)
- Enterprise (EE): same as CE
- Cloud: same as CE; trigger health stats shown in Platform Admin

## Domain Terms
- **TriggerStrategy** — execution model: `POLLING`, `WEBHOOK`, `APP_WEBHOOK`, `MANUAL`
- **TriggerSource** — the persisted record linking a flow version to its registered trigger; soft-deleted on disable; unique per (projectId, flowId, simulate)
- **TriggerEvent** — a captured payload from a trigger execution, stored as a File reference; used for test data selection in the builder
- **AppEventRouting** — routing table for APP_WEBHOOK: maps (appName, event, identifierValue) to a flow
- **simulate flag** — TriggerSource with `simulate=true` is a test-mode source; production and test sources coexist independently
- **Deduplication** — Redis INCR check on `__DEDUPE_KEY_PROPERTY` prevents duplicate payloads from polling triggers
- **Renewal job** — BullMQ repeating job that calls ON_RENEW hook for webhook pieces that need periodic re-registration (e.g., expiring webhooks)
- **sourceName** — format `pieceName@version:triggerName`; used as a stable identifier for TriggerEvents

## Entities

**TriggerSource**: id, flowId, flowVersionId, projectId, type (TriggerStrategy), pieceName, pieceVersion, triggerName, simulate (boolean — true for test triggers), schedule (JSONB for polling cron). Unique on (projectId, flowId, simulate) with soft delete filter.

**TriggerEvent**: id, flowId, projectId, sourceName (format: `pieceName@version:triggerName`), fileId (FK to File storing serialized payload).

**AppEventRouting**: id, appName, event, identifierValue (org/account ID), flowId, projectId. Unique on (appName, projectId, flowId, identifierValue, event).

## Trigger Strategies

- **POLLING**: Periodic checks via cron schedule. BullMQ repeating job. Deduplication via Redis.
- **WEBHOOK**: External service pushes events to Activepieces webhook URL.
- **APP_WEBHOOK**: App-native webhooks routed via AppEventRouting (e.g., Slack, GitHub).
- **MANUAL**: User-triggered only, no automation.

## Enable/Disable Side Effects

**On enable** (`flowTriggerSideEffect.enable()`):
- POLLING: Creates BullMQ repeating job with cron from piece or default interval (`AP_TRIGGER_DEFAULT_POLL_INTERVAL`)
- WEBHOOK: Submits ON_ENABLE hook to worker (registers webhook with external service). If piece has renewConfiguration with CRON strategy, creates renewal job.
- APP_WEBHOOK: Creates AppEventRouting records for each event type
- MANUAL: No side effects

**On disable** (`flowTriggerSideEffect.disable()`):
- Removes BullMQ repeating jobs
- Submits ON_DISABLE hook to worker (unregisters webhook)
- Deletes AppEventRouting records

## Deduplication (`dedupeService`)

For polling triggers — prevents duplicate payloads:
- Extracts `__DEDUPE_KEY_PROPERTY` from each payload
- Redis INCR with 30s TTL: first occurrence passes, duplicates filtered
- Removes dedupe key from returned payloads

## Testing

**Two modes** via `testTriggerService`:
- **SIMULATION**: Creates test TriggerSource (simulate=true), enables it, collects events
- **TEST_FUNCTION**: Submits TEST hook job to worker, saves outputs as TriggerEvents
- Uses distributed lock to prevent concurrent test runs

## Trigger Health

`triggerRunStats` tracks per-platform success/failure rates:
- Redis key: `trigger_run:{platformId}:{pieceName}:{date}:{status}`
- 14-day retention. Displayed in Platform Admin → Infrastructure → Triggers.
