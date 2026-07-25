---
icon: 🏃
---

# Run tables architecture: flow_run, action_run, and future run kinds

How Activepieces stores "run-like" observability records. The rule: **one table per write-shape, shared helpers for the machinery — never a discriminator mega-table.** Origin: review of PR #14176 (first-class single-step runs). See decision [Action runs stay a separate table from flow_run](pg_9Kc2QzEhq5hdxNCyVObJ9).

## The three run-like concepts

| Concept | What it records | Anchor | Status today |
|---|---|---|---|
| **flow_run** | one execution of a flow version, trigger → terminal | `flowId`+`flowVersionId` NOT NULL, has steps | shipped, 28 migrations of tuning |
| **action_run** | one ad-hoc action/code step, outside any flow (MCP `ap_run_action`, chat tool, piece-run API) | flowless; single input/output | PR #14176 (proposed) |
| **trigger_run** (hypothetical) | an inbound event dropped before a run — webhook failed auth, event filtered, poll dedup'd | `flowId`+`triggerName`, reject reason | not built (YAGNI) |

## Why separate tables, not a discriminator

`flow_run`'s optimizations don't transfer: its 5 composite indexes all lead with `environment`+`flowId`, columns a flowless run lacks. A shared `run` table would force `flowId`/`flowVersionId` nullable (killing NOT NULL + CASCADE FKs on the hottest table), add always-NULL sparse columns per row, maintain a union of index families on every insert, and couple 2–3 different write engines (flow execution w/ subflows+waitpoints+pause vs `pieceRunMode` which *rejects* waitpoints vs a webhook handler) onto one hot table. Each concept has a different NOT-NULL set, different index leads, and wildly different volume/retention (rejected webhooks can be ~100× flow runs). The merge would save only ~60 lines of glue.

## What IS shared (the machinery, not the storage)

Already shared primitives both services import: `fileCompressor` (ZSTD), `fileService` (file table), `FlowRunStatus`, `buildPaginator`, `EXECUTION_DATA_RETENTION_DAYS`, and the `runs-layout.tsx` UI tab shell.

Only two thin glue routines get extracted into a shared `runs/` folder:
- `runs/run-log-store.ts` — compress `{input,output,logs}` → file under a caller-supplied `FileType`, read+decompress back. Replaces `writePayloadFile`/`hydratePayload` (action-run) and the non-sliced half of `writeLogsFile`/`readLogsFile` (flow-run).
- `runs/run-retention.ts` — `deleteStaleRuns({ repo, fileType, retentionDays, chunkSize })`, the chunked delete loop both services duplicated.

Both take a `FileType` + repo — nothing table-specific — so a future `trigger_run` reuses them for free. Keeping these generic is the *entire* cost of leaving the door open for new run kinds.

## Folder structure

```
packages/server/api/src/app/
├── runs/                         ← shared machinery (~80 lines)
│   ├── run-log-store.ts
│   └── run-retention.ts
├── flows/flow-run/               ← unchanged table; offload+retention delegate to ../runs/*
│   └── … (existing files; keeps FLOW_RUN_LOG_SLICE slicing as its superset)
└── action-run/                   ← own table/service/controller
    ├── action-run.entity.ts      ← 22 cols, action-shaped indexes (source/pieceName/conversation)
    ├── action-run.service.ts     ← run() + list/get/archive; offload+retention → ../runs/*
    ├── action-run-outcome.ts     ← engine response → terminal status (action-run-only)
    ├── action-run-persist-queue.ts
    ├── action-run.controller.ts  ← GET list / GET :id / POST archive
    └── action-run.module.ts
```

## Naming: "action run" is canonical

Retire `adhoc_run` / `piece_run` / `PieceRun` / "Piece runs" → `action_run` / `ActionRun` / "Action runs". Also `PieceRunSource`→`ActionRunSource`, `PieceRunKind`→`ActionRunKind`, `FileType.PIECE_RUN_LOG`→`ACTION_RUN_LOG`, `executePieceRun*`→`executeActionRun*`. Reason: `kind` can be `CODE`, which is not a piece; "action" matches the engine's `EXECUTE_ACTION`/`actionOperation`/`WorkerJobType.EXECUTE_ACTION`. Rename before merge — cheap now (unshipped, migration `1812000000000-AddActionRunTable`), expensive after release.

## Triggers: two cases, neither belongs in action_run

- **Event dropped before a run** (webhook auth fail, filtered, dedup'd) — row-able, but its own `trigger_run` table if/when built (own columns: `flowId`, `triggerName`, reject reason, inbound payload; own sources WEBHOOK/POLLING/SCHEDULER). Reuses `runs/` helpers. Don't build speculatively.
- **Cron that didn't fire** — an *absence*; there is no event to key a row on. This is schedule reconciliation / alerting → the `issue` path, not a run table.

Note: `trigger_event` already exists but is unrelated — it stores *sampled trigger payloads* (`sourceName`+`fileId`) for the builder's "load sample data", not fire/reject history.

## Docs to update on the PR branch

`.agents/features/piece-run.md`→`action-run.md`; fix `flow-runs.md` tab cross-ref; `mcp.md` + `chat.md` term swaps; add canonical **action run** to Execution Runtime `CONTEXT.md` with `_Avoid_: adhoc run, piece run`.
