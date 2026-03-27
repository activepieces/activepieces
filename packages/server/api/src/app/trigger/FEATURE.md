# Trigger Module

Manages the lifecycle of flow triggers — registration, event capture, testing, and deduplication.

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
