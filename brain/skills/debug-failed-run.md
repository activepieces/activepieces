---
name: debug-failed-run
description: Debug a failed Activepieces flow run end-to-end given a run id (or BullMQ job id) — cross-reference live BullMQ+Postgres (SSH script), centralized ClickHouse logs, and repo code; can also categorize the failed-job backlog.
---

# Debug a Failed Flow Run

Find why a flow run failed by combining three sources: the DevOps SSH debug script (live BullMQ job + Postgres rows + run log), ClickHouse logs (via **ClickStack MCP / HyperDX** — provides `clickstack_search` / `clickstack_sql`), and this repo's code.

**Dependency:** the ClickStack (HyperDX) MCP server must be connected for Step 2 — it provides `clickstack_search`, `clickstack_sql`, `clickstack_list_sources`.

## Inputs
- **`id`** (required) — flow run id. For flow executions BullMQ `jobId === flowRun.id`, so it works for both.
- **`host`** (required) — SSH target for the DevOps box. Always ask the user (or read `~/.ssh/config`); never assume.
- **`--queue`** (optional) — BullMQ queue, default `workerJobs`.

## Step 1 — Pull job/run report (SSH)
Scripts live in `/root/queue` on the box. Run with plain `node`:
```
ssh -o BatchMode=yes -o ConnectTimeout=10 <host> 'cd /root/queue && node ./debug-failed-job.js --run <id>'
```
stdout = single-line JSON (chatter on stderr). Read: `summary`/`diagnostics`; `job.failedReason` + `job.stacktrace` ("Internal error" is a generic wrapper — real cause in stacktrace); `flowRun.status` + failing step (`steps[].isFailedStep`, `runLogs.steps[].errorMessage`); `flow`/`flowVersion` (+ `connectionIds`); `triggerPayload`.
> Node caveat: box is Node 20 but run-log bodies are ZSTD (need ≥22.15). If `runLogs` says "lacks zstd support", DB data is still complete — get log lines from ClickHouse in Step 2.

## Step 2 — Correlate with ClickHouse (ClickStack MCP)
Use the **`Logs`** source (`id: 6a2a91b1d37162f45ad78233`; columns `Body`, `ServiceName`, `SeverityText`, `TraceId`, `LogAttributes`). Scope the window to job `processedAt`/`finishedAt` ± a few minutes.
- `clickstack_search` — start with the run `id`, widen to `projectId`/`platformId`/piece name; filter `SeverityText` to error/warn.
- `clickstack_sql` — raw ClickHouse SQL (needs connection id from `clickstack_list_sources`) for exact attribute filtering/aggregation.
Look for sandbox crashes, OOM (heap/no-space), RPC timeouts, connection-refresh failures.

## Step 3 — Trace into this repo, classify
Grep `packages/` for the distinctive stacktrace string / `ActivepiecesError` code (e.g. `ENTITY_NOT_FOUND`, `PIECE_NOT_FOUND`) / function name. Piece failures → `packages/pieces/**/<piece>`; engine/worker → `packages/server/{api,worker}` + `packages/engine`. Classify:
- **Product bug** — code mishandles valid input; give file:line + path + proposed fix (edit only if asked).
- **User/config** — expired connection, bad flow config/trigger payload, limits; point to the config to change.
- **Infra** — OOM/stalled/Redis/PG/S3; flag for ops.

## Step 4 — Aggregate backlog (only when asked)
For the *shape* of failures ("what's failing", "categorize internal errors"):
```
ssh ... '<host>' 'cd /root/queue && node ./aggregate-internal-errors.js'
```
Prints counts + sample job ids per category; drill in via Step 1.

## Output
Lead with one-line root cause + classification. Then failing step + error, corroborating ClickHouse lines, and for a product bug the repo file:line + fix. Quote the actual `failedReason`/stacktrace/log `Body` — don't paraphrase.

Full procedure in the repo: `.agents/skills/debug-failed-run/SKILL.md`
