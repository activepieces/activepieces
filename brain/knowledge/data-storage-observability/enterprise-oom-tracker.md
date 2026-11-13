---
icon: 🧠
---

# Enterprise OOM Tracker

Daily job that finds enterprise Cloud platforms whose runs end in `MEMORY_LIMIT_EXCEEDED`, so CS/SRE can reach out before the customer escalates (SRE-237). Those runs end as a flow-run status, not a failed BullMQ job, so nothing else alerts on them.

**Script** — `/root/platform-oom-tracker/platform-oom-tracker.js` on `ap-devops`, not in this repo. Runs daily at 12:00 Cairo time and processes yesterday (UTC day). The box's Debian cron has no `CRON_TZ`, so the crontab fires at 09:00 and 10:00 UTC behind a `TZ=Africa/Cairo date +%H = 12` guard, which keeps it on 12:00 through Egypt's DST switch. Log: `/var/log/platform-oom-tracker.log`.
**Source** — the read-only Postgres replica (`OOM_PG_URL` + `OOM_PG_SSL_CA` in the script's own `.env`), never the prod `/root/queue/.env`.
**Table** — ClickHouse `ops.platform_oom_daily` on the `Activepieces` service: one row per `(day, platform_id)` with OOM > 0, carrying `platform_name`, `plan`, `oom_runs`, `distinct_flows_oom`, `total_runs`. `ReplacingMergeTree`, so read with `FINAL`; insert user `oom_tracker`.
**Alert** — one Box signal per day (`POST $SIGNALS_URL`, `fingerprint: enterprise-oom-<day>`) when any enterprise platform had an OOM run yesterday; nothing on a quiet day. The `message` is the investigation prompt and the `stack` lists platforms by id only (plan, OOM runs, flows, total runs, rate). The Box agent reads the replica and ClickHouse itself, keeps every customer name in a private org artifact, and posts the Discord summary with that link. Moved off the direct Discord webhook on 2026-10-26; `DISCORD_OOM_WEBHOOK_URL` is still in `.env` but unused.
**Dashboard** — HyperDX [Enterprise OOM Tracker](https://hyperdx.clickhouse.cloud/dashboards/6ad7451181c0f6e143965a5e): top platforms, OOM runs and platforms hit per day, and the per-day list each alert sends.
**Heartbeat** — Betterstack heartbeat 512932 "platform-oom-tracker (SRE-237)", 1d period + 3h grace, pinged only after insert and alert succeed; `/fail` on error.
**Enterprise** — `plan` not in `free, appsumo, free_legacy, plus*, team*, standard, old_unlimited_trial*`. See the plan-name gotcha in *EE Platform Plans & Billing*.

## Running it

- `node platform-oom-tracker.js --day YYYY-MM-DD` reprocesses one day; safe to repeat.
- `--backfill N --no-alert` loads the last N days without alerting. Run it under `nohup`: a day takes 25–90 s.

## Gotchas

- **The replica has `statement_timeout = 1min`.** The script sets its own session timeout (20 min); a query copied out of it into another client will be cancelled.
- **An `sslmode=` param in `OOM_PG_URL` silently discards `OOM_PG_SSL_CA`** in `pg` 8.x (the parsed URL overrides the `ssl` object), and DO console URLs ship `?sslmode=require`. The script refuses a URL with `ssl*` params.
- **`internal` counts as enterprise.** "Enterprise" is any plan not in `NON_ENTERPRISE_PLANS`, so the `internal` plan (our own platforms) shows up in the report.
- **A manual `--day` run sends a real signal** and starts an agent. Rerunning a day Box already has only adds to that day's issue, because the fingerprint is the day.
- **ClickHouse resolves a `SELECT` alias everywhere in the query**, so `sumIf(oom_runs, …) AS oom_runs` followed by another `sumIf(oom_runs, …)` fails with `ILLEGAL_AGGREGATION`. Alias results with a different name.
