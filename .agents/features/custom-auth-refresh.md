# Custom Auth Connection Refresh

## Why This Exists

Issues [#13602](https://github.com/activepieces/activepieces/issues/13602) and [#13618](https://github.com/activepieces/activepieces/issues/13618): customers using `CUSTOM_AUTH` pieces with short-lived credentials (access tokens, rotating API keys, session tokens) hit silent failures after expiry because the platform had no mechanism to renew them. OAuth2 connections have had auto-refresh since the beginning; CUSTOM_AUTH did not.

## Design

The piece defines an optional `refresh` callback. The platform stores `nextRefreshEpochMs` alongside the connection's `props` and calls `refresh` automatically before that timestamp, using the same distributed-lock path as OAuth2 refresh.

**Timing**: The piece controls the schedule by returning `nextRefreshEpochMs`:

| Use case | What the piece returns |
|---|---|
| Token with known expiry | `nextRefreshEpochMs: Date.now() + expires_in * 1000` |
| Fixed interval | `nextRefreshEpochMs: Date.now() + 3600 * 1000` |
| One-shot, then stop | Omit `nextRefreshEpochMs` — no further auto-refresh |
| Static credential | Don't define `refresh` — unaffected |

**Initial setup**: When a connection is created, `validate` runs first (unchanged). If the piece has `refresh`, the platform calls it immediately after validate so `nextRefreshEpochMs` is populated from the start. No changes to `validate`'s signature.

**Backward compatibility**: Any `CUSTOM_AUTH` connection without `nextRefreshEpochMs` (including all pre-existing ones) has `needRefresh` return false — behaviour is identical to before this change.

## Architecture Flow

```
POST /v1/app-connections  (create)
  └── validateConnectionValue()
        ├── engineValidateAuth() [EXECUTE_VALIDATION job]
        └── if piece.hasRefresh:
              engineRefreshCustomAuth() [EXECUTE_REFRESH job]
              → updates value.props + value.nextRefreshEpochMs in returned value

GET /v1/worker/app-connections/:externalId  (retrieval at runtime)
  └── decryptAndRefreshConnection()
        └── lockAndRefreshConnection()
              ├── needRefresh(connection)
              │     case CUSTOM_AUTH: !isNil(nextRefreshEpochMs) && Date.now() >= nextRefreshEpochMs - 15min
              └── if true: refresh(connection)
                    case CUSTOM_AUTH: refreshCustomAuth()
                          → EXECUTE_REFRESH job → sandbox → piece.auth.refresh()
                          → update connection.value.props + .nextRefreshEpochMs in DB
```

## Files and Responsibilities

| File | Responsibility |
|------|---------------|
| `packages/shared/src/lib/automation/app-connection/app-connection.ts` | `CustomAuthConnectionValue.nextRefreshEpochMs?: number` |
| `packages/shared/src/lib/automation/engine/engine-operation.ts` | `EXECUTE_REFRESH_AUTH` operation type + request/response types |
| `packages/shared/src/lib/automation/workers/job-data.ts` | `EXECUTE_REFRESH` job type + `ExecuteRefreshAuthJobData` schema |
| `packages/pieces/framework/src/lib/property/authentication/common.ts` | `BasePieceAuthSchema.refresh` optional callback |
| `packages/pieces/framework/src/lib/piece-metadata.ts` | `PieceMetadata.hasRefresh?: boolean` (set by engine extraction) |
| `packages/server/engine/src/lib/helper/piece-helper.ts` | `executeRefreshAuth()` + `extractPieceMetadata` populates `hasRefresh` |
| `packages/server/engine/src/lib/operations/auth-refresh.operation.ts` | Engine operation handler |
| `packages/server/worker/src/lib/execute/jobs/execute-refresh.ts` | Worker job handler (mirrors `execute-validation.ts`) |
| `packages/server/worker/src/lib/execute/job-registry.ts` | Registers `EXECUTE_REFRESH` → `executeRefreshJob` |
| `packages/server/api/src/app/app-connection/app-connection-service/app-connection-service.ts` | `engineRefreshCustomAuth()` — dispatches job, checks `hasRefresh` during creation |
| `packages/server/api/src/app/app-connection/app-connection-service/app-connection.handler.ts` | `needRefresh()` CUSTOM_AUTH case + `refresh()` CUSTOM_AUTH case + `refreshCustomAuth()` helper |

## Multi-Worker Safety

The existing `distributedLock` in `lockAndRefreshConnection` already handles concurrent refreshes:
- Lock key: `${projectId}_${externalId}`, 60 s timeout
- Double-check: after acquiring the lock, re-reads from DB and calls `needRefresh` again before refreshing
- CUSTOM_AUTH slots into the same lock path as OAuth2 — no new concurrency primitives needed

## Error Handling

Unlike OAuth2 (which distinguishes user errors from system errors), any exception from a CUSTOM_AUTH `refresh` marks the connection as `ERROR`. Rationale: if the piece's refresh logic throws, the credentials are invalid and the user must reconnect.

## Delete / Reconnect Edge Cases

- **Delete while refresh in-flight**: `lockAndRefreshConnection` re-reads after acquiring the lock. If deleted, `findOneBy` returns `null` → exits immediately. No error.
- **Reconnect**: `POST /v1/app-connections` calls `validateConnectionValue` again → `refresh` fires with the new credentials, resetting `nextRefreshEpochMs` from scratch.

## Adding a New Auth Type with Refresh

To support refresh on a different auth type in future:
1. Add `case AppConnectionType.NEW_TYPE: return needRefreshLogic(...)` in `needRefresh()`
2. Add `case AppConnectionType.NEW_TYPE:` in `refresh()` (or reuse `EXECUTE_REFRESH_AUTH` if it's piece-defined)
3. Add the corresponding engine op case if the refresh logic needs to run in a sandbox

## Tests

- Unit: `packages/server/api/test/unit/app/app-connection/app-connection-handler.test.ts` — all `needRefresh` cases for CUSTOM_AUTH + regression for other types
- Integration: planned in `packages/server/api/test/integration/ce/app-connection/custom-auth-refresh.test.ts`
