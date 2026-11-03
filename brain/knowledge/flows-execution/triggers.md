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
- **Republishing leaves an unchanged polling trigger running** (`isTriggerUnchanged`): a publish runs `onDisable(old) → onEnable(new)`, which reset `lastPoll`/`lastItem` (and every custom checkpoint) to now and silently dropped events created in between. When the flow was already `ENABLED`, stays enabled, and the trigger keeps the same piece, **piece version**, trigger name and deep-equal `settings.input` (`flowPublishUtils.isTriggerUnchanged`), `flowTriggerSideEffect` skips both engine hooks for a POLLING trigger: the store is untouched and only the poll job is re-pointed to the new flow version with the previous trigger source's schedule (no previous schedule → hooks run). The hooks are skipped, not run against a guarded store, because any store-wrapping rule changes what piece code sees mid-hook and broke real pieces (pinterest's mid-pagination bookmark, azure-ad's stale delta link failing the publish); skipping makes the trigger indistinguishable from a flow nobody republished, which is safe for custom pieces too. With the same inputs but a **new piece version** only the new version's `onEnable` runs, with `isRepublish=true` (`flowPublishUtils.isRepublish` → `context.isRepublish`); the old version's `onDisable` is skipped for POLLING, because pre-guard versions delete their checkpoint unconditionally and the old code can't be fixed after it ships. `pollingHelper.onEnable` keeps the checkpoint only if the piece passes the whole `context`, and custom state needs its own `isRepublish` guard in `onEnable`. The cost: a polling `onDisable` that cleans up something external (none in the repo) won't run on an upgrade, so that object leaks while the new `onEnable` creates a fresh one. A trigger swap, any props change, or an off→on toggle runs the hooks normally and starts fresh; off→on is the way to reset a polling trigger whose state has gone bad (e.g. an expired sync token), since a republish no longer does. The props check is not cosmetic: a checkpoint kept across a props change points at a resource that is no longer being polled, and `pollingHelper.poll` treats a `LAST_ITEM` id it cannot find (`findIndex → -1`) as "no checkpoint", emitting **every** item. Both publish paths — `flowService.updatedPublishedVersionId` and `flowApprovalRequestService.approve` (its own disable→enable) — use these two decisions; any new publish path must too.
- **A missing timestamp permanently kills a TIMEBASED polling trigger** — `pollingHelper.poll` advances the checkpoint with `items.reduce((acc, i) => Math.max(acc, i.epochMilliSeconds), lastPoll)`, and `Math.max(n, NaN)` is `NaN`, so a single item whose date field was never requested (`dayjs(undefined).valueOf()` → `NaN`) writes `NaN` into `lastPoll`; every later poll then filters on `> NaN` → false and the trigger silently never fires again, with no error anywhere. Two guards, both needed: request the date in the API's `fields`/select mask, and drop items with an unusable date before mapping to `epochMilliSeconds`. The filter must check the raw value, not just `.isValid()` — `dayjs(undefined)` is *now* and reports valid.
- **The timestamp you poll on may be client-supplied, and a future one is fatal.** Google Drive sets `modifiedTime` from the *local file mtime* on upload, not the upload moment, so it can be older than `createdTime` — or years ahead if the uploader's clock is fast. A TIMEBASED watermark is `max(epochMilliSeconds)` over the emitted items, so one future-dated row pushes `lastPoll` into the future and the trigger emits nothing until wall-clock catches up. Hold back items timestamped after `Date.now()` — they fire once the clock passes them. Do **not** clamp the watermark instead: a clamped watermark re-emits that same row on every poll forever.
- The **simulate flag** lets a production source and a test source coexist independently.
- **Renewal jobs** re-register expiring webhook pieces via the ON_RENEW hook.
- **`*/X` cron is not "every X minutes"** — it means "minutes divisible by X", so it double-fires at :00 and :X for X > 30 and gaps unevenly when X doesn't divide 60. Use `INTERVAL`/`intervalMs` for a rolling interval; reserve cron for wall-clock schedules. This bit the default poll schedule until GIT-1632.
- **A `basic-ftp` login that fails leaves the control socket open.** `access()` connects first and *then* logs in, so a refused login rejects with the socket still established, and the caller's client variable was never assigned, so no `finally` closes it. Measured against vsftpd on one refused login: the Node process stayed alive 304s waiting on that handle, versus 3s once `getClient` calls `close()` before rethrowing. Any helper that builds an FTP client must close it on a failed `access()`.
- **`basic-ftp` only fills in `modifiedAt` from `MLSD`.** `parseListUnix` and `parseListDOS` set only the unparsed `rawModifiedAt`, and the library deliberately refuses to parse it because LIST dates carry no reliable timezone or year. A LIST-only server therefore hands you `modifiedAt: undefined`, and `dayjs(undefined)` is *now*, so every file looks freshly modified on every poll and a TIMEBASED trigger re-fires the whole folder forever (ENG-1032; against vsftpd, 6 polls emitted the same file and its subdirectory 12 times). `MDTM` via `client.lastMod` is the reliable fallback: precise UTC for files, but `550` on a directory, and `basic-ftp` rejects concurrent commands on one control connection, so ask only for regular files and ask sequentially. Treat only `550` as "skip this entry" — swallowing every `lastMod` error loses files, because one entry's transient blip is skipped while a sibling's newer timestamp still advances `lastPoll` past it. Check `FEAT` once per poll rather than per file, and when the server offers neither `MLSD` nor `MDTM` keep the old "treat as now" behaviour instead of failing: there is no timestamp to be had, and changing what those flows do is a worse trade than leaving them as they are.
- **Trigger health** (`triggerRunStats`): Redis key `trigger_run:{platformId}:{pieceName}:{date}:{status}`, 14-day retention, shown in Platform Admin (Cloud).
- **A polling `items` that catches its own connect or auth error and returns `[]` hides the outage.** The worker counts the poll COMPLETED, logs no warning and the flow stays enabled, so a rotated password looks like an empty folder. Let it throw: `pollingHelper.poll` fails before it writes `lastPoll`, the poll counts FAILED with a worker warn, and the next good poll catches up on everything missed. SFTP New File was fixed this way (ENG-796); dozens of community triggers still swallow errors the same way.

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
