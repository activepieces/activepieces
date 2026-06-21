# Project Replace CLI — Design

Status: design (not yet implemented).
Driver: Nedap. Replaces a Git-based GHA release pipeline with direct cross-instance API calls.

## Problem

Move a project's content from one Activepieces instance to another (e.g. staging → prod) without using Git as a storage mechanism, and fail GitHub Actions cleanly on validation errors before any destructive write occurs.

## Non-goals

- Diff UI / merge review (full mirror, no operator-visible diff)
- Replacement of the existing `project-releases` feature for users who want diffs
- Project list/create/delete commands
- Connection writes (preflight only)
- Piece installation (deployment concern)
- Interactive prompts (this is a CI tool)
- Standalone rollback command (existing flow-version history covers it)
- Pull/push split commands (single `replace` only)
- Dry-run mode (server-side preflight is enough)

## Scope (v1)

Mirrored: **flows + table schemas + folders + piece validation**.

- Connections — preflight only (validate referenced externalIds exist on dest); no payload writes; secrets never cross the wire
- Tables — schema only; never row data, ever
- MCP servers, agents, project metadata, app-credentials, custom-domains — out

## Topology assumption

Source and destination are **separate Activepieces deployments**, each with its own DB, platform, and API keys. There is no shared `projectId`/`platformId` namespace. Cross-instance is the design constraint; same-instance multi-project happens to work as a special case.

## Identity / matching

| Resource | Match key |
|---|---|
| Project | Explicit DB id passed via `--source-project` / `--dest-project` |
| Flow | `externalId` (auto-set to `apId()` if unset on create) |
| Table | `externalId` |
| Folder | `externalId` (**new column — DB migration in v1**, backfill `externalId = id`) |
| Connection | `externalId` (preflight read-only on both sides) |

"Full replace, no diff" is a **user-facing** semantic — no merge UI, end state on dest equals source. **Internally** the server walks externalId sets to compute CREATE/UPDATE/DELETE ops. This is not a contradiction: externalId mirroring exists to keep webhook URLs stable, preserve run history, and make idempotent retry cheap.

## Server endpoint

`POST /v1/projects/:projectId/replace`

- **Auth**: `PrincipalType.SERVICE` only (platform API key). No `USER` path. Project must belong to the platform owning the API key.
- **EE feature gate**: new flag (e.g. `platform.plan.projectReplaceEnabled`)
- **Per-project distributed lock** with NoWait → 409 `{ error: "REPLACE_IN_PROGRESS", retryAfter }` on contention
- **Audit event** `PROJECT_REPLACED` on every attempt (success or failure)

### Request body

```jsonc
{
  "schemaVersion": 1,
  "sourceActivepiecesVersion": "0.45.0",
  "flows":   [ /* full flow states with externalId */ ],
  "tables":  [ /* schema only — name, externalId, fields[], status, trigger */ ],
  "folders": [ /* externalId, displayName, displayOrder */ ],
  "requiredPieces": [ { "name": "@activepieces/piece-slack", "version": "1.2.3" } ]
}
```

### Server-side preflight (hard fails before any write)

1. **AP version**: `dest >= source` on same major. No override flag. Source version comes from `sourceActivepiecesVersion`.
2. **Piece versions**: every entry in `requiredPieces` must match a piece on dest's registry **exactly**. No flag.
3. **Custom-piece presence**: any `requiredPieces` entry with `pieceType: 'CUSTOM'` missing on dest → hard fail.
4. **Connection externalIds**: for every connection externalId referenced inside any source flow's content, dest must have a connection with the same externalId + same `pieceName`. If missing → hard fail.

Failure → 4xx with structured `{ errors: [{ kind, ... }] }`. No writes. CLI exits with code 2.

### Apply phase

Order (dependencies before dependents on creates; reversed on deletes):

1. Folders CREATE/UPDATE
2. Tables CREATE/UPDATE
3. Flows CREATE/UPDATE
4. Flows DELETE
5. Tables DELETE
6. Folders DELETE

For each item:

- CREATE — always writes
- UPDATE — typed-fingerprint deep-equality check first; if equal → skip (`unchanged++`); else write
- DELETE — always writes

**No-op detection** uses a typed `FlowFingerprint` / `TableFingerprint` / `FolderFingerprint` struct (extracted comparable fields) plus deep-equality. No hashing, no canonical JSON.

**Error semantics**: continue on per-item errors (4xx-class), abort on systemic errors (5xx-class). All per-item errors collected and returned.

### Response

```jsonc
{
  "applied": {
    "flowsCreated": 1, "flowsUpdated": 2, "flowsDeleted": 0, "flowsUnchanged": 47,
    "tablesCreated": 0, "tablesUpdated": 0, "tablesDeleted": 0, "tablesUnchanged": 5,
    "foldersCreated": 0, "foldersUpdated": 1, "foldersDeleted": 0, "foldersUnchanged": 3
  },
  "failed": [
    { "kind": "flow", "externalId": "...", "op": "UPDATE", "error": "..." }
  ],
  "durationMs": 1200
}
```

HTTP status: 200 if `failed` empty; 207 if any item failures; 5xx if aborted; 409 if lock held.

## CLI

Single command. No config file. No env-var auto-resolution. No dry-run. Per-call flags only.

```bash
ap project replace \
  --source-url   https://staging.activepieces.com \
  --source-token "$STAGING_TOKEN" \
  --source-project "$STAGING_PROJECT_ID" \
  --dest-url     https://prod.activepieces.com \
  --dest-token   "$PROD_TOKEN" \
  --dest-project "$PROD_PROJECT_ID"
```

- Default output: human-readable
- `--json`: structured (matches server response shape)
- Exit codes:
  - `0` — apply succeeded, `failed` empty
  - `1` — apply succeeded, `failed` non-empty
  - `2` — preflight failed (4xx, no writes)
  - `3` — server abort (5xx) or lock conflict (409)
  - `4` — CLI/transport error (unreachable, bad token)

CLI itself is thin: GET source state, POST dest endpoint, render response. No diff computation client-side.

## DB migrations (v1)

- Add `externalId` (string, unique per project) column to `flow_folder` entity. Backfill `externalId = id` for existing rows.

## Code reuse

- `ProjectState` schema (extend with `folders` array)
- `projectStateService.apply` primitives
- `projectDiffService.diff` for mirror computation
- Per-project lock pattern (switch from blocking to NoWait)
- `applicationEvents` for audit logging

Not reused:
- The diff UI / `selectedFlowsIds` filter
- `ProjectRelease` records and snapshot files (no rollback table; flow-version history covers it)
- GIT / ROLLBACK input paths

## Idempotency / failure recovery

- Mirror semantics → re-running the CLI after a partial failure converges
- Successful items stay applied; failed items surface in `failed[]`; second run picks them up
- Dest is left in partially-applied state if the first run failed mid-way; this is documented and accepted (alternative would be bulk pause-restore, which causes downtime on every successful release)

## Known limitations / accepted risks

- **Inter-flow dependency window during partial failure**: if flow A (calls subflow B) is updated before B's update succeeds, A may briefly call an old version of B. Small window; converges on retry.
- **Connection re-creation on first push**: operator must manually create the connection record on dest with the matching externalId before the first push that references it. Subsequent pushes match by externalId.
- **Folder rename** (covered by externalId): folders mirror by externalId, so renames are clean.
- **Custom piece installation** is out of scope. CLI fails preflight loudly; deploy/admin handles install separately.

## Future work (v2+, if needed)

- Agent mirror (currently `agentIds` is auto-derived from flow content; treat as covered until it isn't)
- MCP server mirror
- Optional `--allow-piece-version-skew` (only if exact-match proves too strict in practice)
- Snapshot artifact for GHA (if the no-pull/push decision is revisited)
