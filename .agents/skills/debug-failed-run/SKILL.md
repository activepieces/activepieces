---
name: debug-failed-run
description: "Debug a failed Activepieces flow run end-to-end: given a flow run id (or BullMQ job id), find why it failed, cross-referencing the live BullMQ job + Postgres rows (SSH script on the DevOps box), the centralized ClickHouse logs (ClickStack MCP), and the code in this repo, then categorize the failed-job backlog on request."
---

# Debug a Failed Flow Run

Investigate why a flow run failed by combining two sources of truth:

1. **The DevOps debug script** — live BullMQ job + Postgres (`flow_run`, `flow_version`, `flow`) + the run log file, joined into one JSON report. Run over SSH.
2. **ClickHouse logs** — the centralized server/worker logs, queried via the ClickStack MCP. These fill in what the script can't: surrounding log lines, infra errors, and the decompressed run body when the script's host can't unzip it (see Node note below).

## Inputs

- **`id`** (required) — the flow run id. For flow executions the BullMQ `jobId === flowRun.id`, so this works for both `--run` and `--job`.
- **`host`** (required) — SSH target for the DevOps box, e.g. `user@host`. Always ask the user for this (or read it from their local SSH config / `~/.ssh/config` alias) — never assume one. The examples below use `<host>` as a placeholder; substitute the real target at run time.
- **`--queue`** (optional) — BullMQ queue name. Default `workerJobs`. Dedicated worker-group jobs may live in `platform-<workerGroupId>-jobs`.

This skill lives in the repo, **not** on the DevOps box — it drives the remote scripts over SSH.

## Step 1 — Pull the job/run report (SSH)

The scripts live in `/root/queue` on the DevOps box and read the same `AP_*` env (Redis, Postgres, S3) the server uses, via `.env`. Run with plain `node` (matches how the box invokes them):

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 <host> \
  'cd /root/queue && node ./debug-failed-job.js --run <id>'
```

stdout is a single-line JSON report (pipe-friendly); all progress chatter goes to stderr. Read these fields first:

- `summary` / `diagnostics` — human-readable verdict and caveats.
- `job.failedReason` + `job.stacktrace` — the BullMQ failure. `"Internal error"` is a generic wrapper; the real cause is in the stacktrace.
- `flowRun.status` and the failing step (`steps[].isFailedStep`, `runLogs.steps[].errorMessage`).
- `flow` / `flowVersion` — which flow/version/pieces ran; `flowVersion.connectionIds` for connection issues.
- `triggerPayload` — what triggered the run.

> **Node caveat:** the box runs Node v20, but run-log bodies are ZSTD-compressed and need Node ≥ 22.15 to decompress. When `runLogs` comes back with a "lacks node:zlib zstd support" note, the job/run/DB data is still complete — get the actual log lines from ClickHouse in Step 2 instead.

## Step 2 — Correlate with ClickHouse logs (ClickStack MCP)

Use the **`Logs`** source (`id: 6a2a91b1d37162f45ad78233`; key columns `Body`, `ServiceName`, `SeverityText`, `TraceId`, attrs in `LogAttributes`). Search around the run's failure time for the run id, flow id, project id, or platform id from Step 1:

- `clickstack_search` — keyword/Lucene-style search of `Body` + attributes over a time range. Start with the flow run `id`, then widen to `projectId` / `platformId` / the piece name. Filter `SeverityText` to `error`/`warn` to cut noise.
- `clickstack_sql` — raw ClickHouse SQL (needs the connection id from `clickstack_list_sources`) when you need exact `LogAttributes` filtering or aggregation.

Scope the time window to the job's `processedAt`/`finishedAt` from Step 1 (± a few minutes) to keep queries cheap. You're looking for the engine/worker log lines that bracket the failure — sandbox crashes, OOM ("no space"/heap), RPC timeouts, connection refresh failures.

## Step 3 — Trace the failure into this repo

Steps 1–2 tell you *what* failed at runtime; this step finds *where* in the code and decides **product bug vs. user/config issue**. Work from this repo (the Activepieces source you're already in):

- Take the distinctive part of the stacktrace / `failedReason` / log `Body` — the exact thrown message, an `ActivepiecesError` `code` (e.g. `ENTITY_NOT_FOUND`, `PIECE_NOT_FOUND`), or a function name — and `Grep` for it across `packages/`. Quoted error strings and error `code` enums are the fastest anchors.
- For a piece failure, the failing step's `settings.pieceName`/`pieceVersion` (from Step 1) points at `packages/pieces/**/<piece>`; open the failing action/trigger.
- For engine/worker failures, look under `packages/server/{api,worker}` and `packages/engine`. Read the throwing code path and the surrounding error handling to see whether the input that triggered it (from `triggerPayload` / step `input`) is being mishandled.
- Classify the outcome:
  - **Product bug** — the code mishandles valid input (unguarded `undefined`, bad assumption, regression). Identify the file:line, explain the path that reaches it, and propose a fix. Only edit code if the user asks.
  - **User/config issue** — expired/missing connection, invalid flow config, bad trigger payload, account limits. Point to the responsible config and what the user must change.
  - **Infra** — OOM, stalled jobs, Redis/Postgres/S3 errors. Not a code change; flag for ops (and Step 4 shows how widespread it is).

## Step 4 — Aggregate the failed backlog (only when asked)

When the user wants the *shape* of current failures ("what's failing", "categorize internal errors", "top failure reasons") rather than one run, run the categorizer. It scans all `failed` jobs in `workerJobs`, classifies them (ConnectionNotFound, StorageError, evalInScope errors, stalled, RPC timeouts, SANDBOX_INTERNAL_ERROR, …), and prints counts + sample job ids per category:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 <host> \
  'cd /root/queue && node ./aggregate-internal-errors.js'
```

Use its sample job ids to drill into specific runs with Step 1.

## Output

Lead with a one-line root cause and its classification (product bug / user-config / infra). Then: failing step + error, corroborating ClickHouse log lines, and — for a product bug — the `file:line` in this repo plus a proposed fix; otherwise the config to change or the ops signal to escalate. Quote the actual `failedReason`/stacktrace and log `Body` — don't paraphrase the error away.
