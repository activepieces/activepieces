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

Scope the time window to the job's `processedAt`/`finishedAt` from Step 1 (± a few minutes) to keep queries cheap.

> **Those two names exist only in the script's report** (`debug-failed-job.js` formats them from the raw job). If you bypass the script and read jobs straight off the queue with `bullmq` — `q.getJobs(['failed'], …)` — the properties are **`job.processedOn` / `job.finishedOn`**. `job.processedAt` is silently `undefined`, not an error, so a hand-rolled scan reports every failure as having no timestamp and you fall back to `job.timestamp` (enqueue time) without noticing. That shifts failures earlier by however long the queue backlog is (8+ minutes on cloud) and will make a fix look like it did not take effect. Bucket by `finishedOn` when you want "is this still happening". You're looking for the engine/worker log lines that bracket the failure — sandbox crashes, OOM ("no space"/heap), RPC timeouts, connection refresh failures.

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

## Step 5 — When the fault is on a worker's disk, not in the job

Some failures (`PieceNotFoundError` above all) are a bad file tree on one machine, so no amount of job/log
reading finds them. The DevOps box deploys the fleet with kamal, so it already holds SSH access — hop through it:

```bash
ssh <devops-host> 'ssh -o StrictHostKeyChecking=no root@<worker-ip> "…"'
```

Host lists live in kamal config on the DevOps box, **not** in this repo:

- `/root/mrsk/prod/config/worker.yml` — the shared worker fleet (one `%w[…]` array) plus per-tenant dedicated hosts as `{ ip:, tag:, workers: }`
- `/root/mrsk/prod/config/app.yml` — the web/API hosts; `worker-canary.yml` — the canary

Three things that decide how you search:

- **The piece cache volume is shared by every worker container on a host.** So probe **one container per host**, not
  one per container — 29 containers on a box give the same answer. Conversely a fault is *host*-wide: every tenant
  whose job lands there fails, which is how two bad folders produce failures across dozens of platforms.
- **The container name carries the deployed commit** (`…-0.90.1.<sha>.beta`). Fastest honest answer to "is the fix
  actually running", and it beats trusting a version string.
- **Where a piece lives depends on its type, not the mode alone.** `groupPiecesByPackagePath`: OFFICIAL registry
  pieces always go to `<cache>/v15/common`; CUSTOM registry and ARCHIVE pieces go to
  `<cache>/v15/custom_pieces/<platformId>` when `AP_EXECUTION_MODE` is `SANDBOX_PROCESS` /
  `SANDBOX_CODE_AND_PROCESS` (the shared cloud fleet is `SANDBOX_PROCESS`). Sweeping only `common` leaves the
  per-platform trees unchecked.

Sweep the fleet with one probe per host and print only the mismatches, so a 16-host answer fits on a screen:

```bash
for H in <hosts>; do
  R=$(ssh -o ConnectTimeout=8 root@$H 'C=$(docker ps --format "{{.Names}}" | head -1)
    docker exec $C sh -c "[ -e <path-the-engine-resolves> ] && echo ok || echo BROKEN"' 2>/dev/null)
  printf "%-18s %s\n" "$H" "${R:-UNREACHABLE}"
done
```

Test the *exact* path the consuming code resolves. For pieces that is
`pieces/<scope>/<name>-<version>/node_modules/<scope>/<name>` with `-e`, never `[ -d … /node_modules ]` and never
`-L` — one fault was a **dangling symlink**, which `find` lists and `-L` passes.

`-e` on the package directory is no longer sufficient on its own. A second shape resolves that directory fine and is
missing only the files inside it, so assert the **entry file the engine would load** — the declared `main` if the
manifest has one, else `src/index.js` — and as a real file, since a directory satisfies `-e`:

```bash
P=<piece-folder>/node_modules/<scope>/<pkg>
M=$(sed -n 's/.*"main"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$P/package.json" 2>/dev/null | head -1)
E=${M:+$P/$M}; E=${E:-$P/src/index.js}
{ [ -f "$E" ] || [ -f "$E/index.js" ]; } && echo ok || echo BROKEN
```

### Repairing a poisoned piece folder in place

Once the sweep names the host, you can clear the outage without a release — the fault is data, not the running image.

**Deleting the `ready` marker is not a reliable repair, and on older builds it does nothing at all.** Builds before
the `usedPiecesMemoryCache` removal short-circuit *above* the disk check, so a worker process that already cached the
folder as installed skips the reinstall no matter what the disk says — check whether the running image has that cache
before you rely on this. Deleting the whole piece folder is worse on those builds: the cached processes still skip, and
now nothing is there at all. Even on a build that honours it, clearing `ready` only queues the repair behind the next
job that wants the piece.

Repairing what the engine actually resolves is the version-independent fix, and it takes effect immediately. Read the dangling link, derive the store path, and re-populate
it from the `bundle.tgz` that is already in the piece folder:

```bash
L=<piece-folder>/node_modules/<scope>/<pkg>
readlink "$L"                      # -> ../../../../../node_modules/.bun/<entry>/node_modules/<scope>/<pkg>
mkdir -p "<workspace>/node_modules/.bun/<entry>/node_modules/<scope>/<pkg>"
tar -xzf "<piece-folder>/bundle.tgz" --strip-components=1 -C "<that path>"
[ -e "$L" ] && echo RESOLVES        # the engine's own predicate
```

`bun install` on its own cannot substitute for this. Measured on real bun 1.4.0 in the prod layout, a plain
reinstall answers `Checked N packages (no changes)` and heals nothing, because bun trusts a store entry that is
already present even when it is half-extracted; deleting the piece folder's `node_modules` only makes bun relink it
from that same entry. The reinstall route needs `bun install --force` (add `--filter ./pieces/<scope>/<name>-<version>`
to keep it to the one member — siblings' store entries come back byte-identical), or delete the
`node_modules/.bun/<entry>` directory first. Prefer the tar restore below when the fault is a single folder: it needs
no lockfile write and cannot contend with the other containers installing against the same volume.

**A filtered `--force` is safe to run against a live shared workspace — the usual worries were measured and do not
apply.** On bun 1.4.0 in the prod layout: it does **not** rewrite the shared `bun.lock` (identical hash before and
after, same as a plain install), it does **not** re-resolve version ranges — reinstallation comes from the lock, so
a `minimumReleaseAge` strict enough to block every version still lets the repair through and no version drifts — it
leaves shared registry deps untouched (same inode and mtime), and it is concurrency-safe: eight containers repairing
different members, and six repairing the *same* member, all exited 0 with every member healthy. Cost is a non-issue
(~0.01 s over 200 members, faster than the plain install it replaces, because local tarballs hardlink from bun's
global cache). The one thing to guard is **scope**: `--force` without `--filter` re-extracts every member of the
workspace (~1,088 in `common`), so never issue one without the other.

The tarball's `package/` prefix maps onto the store layout exactly, and the store entry usually already holds the
piece's dependency links, so this restores the one missing directory and nothing else. It needs no cache
invalidation, no lockfile write, no restart, and no `bun install` — so it cannot contend with the installs the other
containers on that host are doing against the same shared volume. It is reversible: delete the directory.

Confirm by failure *time*, not by total count — the failed set is retained history and does not shrink. Bucket
`finishedOn` by minute and check that the newest failure predates the repair.

Run commands like these as plain, legible arguments. Piping a base64 blob into a shell on a production host reads as
obfuscated remote execution and will be refused, correctly.

## Output

Lead with a one-line root cause and its classification (product bug / user-config / infra). Then: failing step + error, corroborating ClickHouse log lines, and — for a product bug — the `file:line` in this repo plus a proposed fix; otherwise the config to change or the ops signal to escalate. Quote the actual `failedReason`/stacktrace and log `Body` — don't paraphrase the error away.
