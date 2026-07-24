---
status: proposed
---

# Action runs stay a separate table from flow_run

## Decision
Single-step ad-hoc runs (MCP `ap_run_action`, chat tool executor, piece-run API) get their own `action_run` table — NOT merged into `flow_run`, and NOT a polymorphic `run` table with a FLOW/PIECE discriminator. Only two thin glue helpers are shared. Canonical name is **action run** (retire "adhoc run" / "piece run"). Raised while reviewing PR #14176. Full architecture: [Run tables architecture](pg_W8MYVcu58jDzzrUaKZWRG).

## Context
PR #14176 introduces a first-class run for flowless single-step execution. Natural instinct: reuse `flow_run`, which already carries heavy optimization (28 migrations, 5 tuned composite indexes). The question was whether to unify.

## Why
The `flow_run` optimizations do not transfer: all 5 composite indexes lead with `environment` + `flowId`, columns a flowless run lacks. Merging would force `flowId`/`flowVersionId` nullable (killing NOT NULL + CASCADE FKs on the hottest table), add ~7 always-NULL sparse columns to every flow-run row, and still need a parallel action-shaped index family. Different write engines too: flow execution does subflows/waitpoints/pause; action runs reject waitpoints (`pieceRunMode`). The only real duplication is ~60 lines of glue — payload ZSTD offload and the chunked retention loop — nowhere near worth the cost. The primitives (compressor, file table, `FlowRunStatus`, paginator, UI tab shell) are already shared.

## Consequences
Extract the two glue routines into a shared `runs/` folder (`run-log-store.ts`, `run-retention.ts`, both generic over `FileType`+repo); keep separate entities/services/controllers. Rename `piece_run`/`PieceRun`/`adhoc_run` → `action_run`/`ActionRun` before merge (cheap now, expensive post-release; migration `1812000000000-AddActionRunTable`). "action" is right because `kind` can be CODE, which is not a piece, and it matches the engine's `EXECUTE_ACTION`.

General rule this sets: **a new run-like concept = a new table + the shared `runs/` helpers, never a new discriminator value on a mega-table.** Applies to a future `trigger_run` (dropped inbound events: webhook auth-fail / filtered / dedup'd) — its own table reusing the helpers, NOT part of `action_run`. Two things that are NOT run rows at all: a cron that didn't fire (an absence → `issue`/alerting), and `trigger_event` (already exists, stores sampled trigger payloads, unrelated). Keep the `runs/` helpers table-agnostic so new kinds cost only a table + a migration.
