---
icon: ⚡
---

# Triggers

Triggers define how and when a flow starts. The module handles registration, event capture, testing, and deduplication, tracking each enabled trigger as a `TriggerSource` record and driving enable/disable side effects (BullMQ scheduling, external webhook registration).

### Entities & services
- **TriggerStrategy** — `POLLING`, `WEBHOOK`, `APP_WEBHOOK`, `MANUAL`.
- **TriggerSource** — persisted link between a flow version and its registered trigger; soft-deleted on disable; unique per `(projectId, flowId, simulate)`.
- **TriggerEvent** — a captured payload stored as a File ref; used for test-data selection in the builder. `sourceName` format: `pieceName@version:triggerName`.
- **AppEventRouting** — routing table for APP_WEBHOOK: maps `(appName, event, identifierValue)` to a flow.
- Services: `flow-trigger-side-effect.ts`, `trigger-source-service.ts`, `dedupe-service.ts`, `test-trigger-service.ts`.

### How it works
- **Strategies**: POLLING = cron via BullMQ repeating job + Redis dedupe. WEBHOOK = external service pushes to an AP webhook URL. APP_WEBHOOK = app-native events routed via AppEventRouting (Slack, GitHub). MANUAL = user-triggered only.
- **On enable**: POLLING creates the repeating job — the piece's `setSchedule` supplies either a cron (`CRON_EXPRESSION`) or a rolling interval (`INTERVAL` → BullMQ `every`); when the piece sets nothing the default is a rolling interval of `AP_TRIGGER_DEFAULT_POLL_INTERVAL` minutes (default 5). WEBHOOK submits ON_ENABLE hook (+ renewal job if the piece needs periodic re-registration); APP_WEBHOOK creates routing records.
- **On disable**: removes repeating jobs, submits ON_DISABLE hook (unregister), deletes routing records.
- **Testing** (`testTriggerService`, distributed-locked): `SIMULATION` creates a `simulate=true` source and collects events; `TEST_FUNCTION` submits a TEST hook and saves outputs as TriggerEvents.

### Gotchas
- **Deduplication** (polling): extracts `__DEDUPE_KEY_PROPERTY`, Redis INCR with 30s TTL — first passes, duplicates filtered; the dedupe key is stripped from returned payloads.
- The **simulate flag** lets a production source and a test source coexist independently.
- **Renewal jobs** re-register expiring webhook pieces via the ON_RENEW hook.
- **`*/X` cron is not "every X minutes"** — it means "minutes divisible by X", so it double-fires at :00 and :X for X > 30 and gaps unevenly when X doesn't divide 60. Use `INTERVAL`/`intervalMs` for a rolling interval; reserve cron for wall-clock schedules. This bit the default poll schedule until GIT-1632.
- **Trigger health** (`triggerRunStats`): Redis key `trigger_run:{platformId}:{pieceName}:{date}:{status}`, 14-day retention, shown in Platform Admin (Cloud).

### Editions
All four strategies available in CE/EE/Cloud. Cloud additionally surfaces trigger health stats in Platform Admin.

### Key files
Entry point: `flowTriggerSideEffect`, exported from `trigger-source/flow-trigger-side-effect.ts` and called by `trigger-source-service.ts` on enable and disable.

- `packages/server/api/src/app/trigger/trigger-source/` — TriggerSource CRUD, entity, and the enable/disable side effects per strategy
- `packages/server/api/src/app/trigger/trigger-events/` — TriggerEvent storage, entity, and endpoints
- `packages/server/api/src/app/trigger/test-trigger/` — simulation and test-function modes, plus their endpoints
- `packages/server/api/src/app/trigger/app-event-routing/` — APP_WEBHOOK routing table and entity
- `packages/server/api/src/app/trigger/trigger-run/` — per-platform trigger health tracking and stats endpoints
- `packages/server/api/src/app/trigger/dedupe-service.ts` — Redis-based deduplication for polling
- `packages/server/api/src/app/trigger/trigger.module.ts` — module registration
- `packages/core/shared/src/lib/automation/trigger/` — TriggerSource schema, TriggerStrategy enum, handshake and schedule options
- `packages/web/src/app/builder/test-step/` — builder test panel, event selector, and the manual webhook test dialog
- `packages/web/src/app/builder/flow-canvas/` — trigger node widget and the add-trigger button above it

Paths verified 2026-07-17.
