---
title: AI usage is copied from Autumn into our Postgres
status: accepted
icon: 📊
---

# AI usage is copied from Autumn into our Postgres

## Decision

Every AI call already sends one Autumn `track` for billing. That event now carries a `usage` block (v1): origin, environment, project, flow, agent, user, run, provider, key, model, tokens, and reported and estimated cost. Calls we don't bill send the same block as a value-0 `apCredits` event. A per-minute job, `AI_USAGE_COPY`, reads each platform's events with `events.list` and folds them into `ai_usage_5m` and `ai_usage_daily`. The usage page reads only those tables. Cloud and Enterprise only.

## Context

We built and reviewed our own pipeline first: a Redis stream, a Lua ingest and a flush job (old #16619). Review pointed out that Autumn already receives every AI call, so analytics could count the same events billing charges for. The team compared the approaches on 27 Oct 2026 ("Where AI Usage Lives, v2"). We rebuilt from scratch on 28 Oct.

## Why

- One record: the page and the bill count the same events.
- AI calls do no extra work beyond the track they already send.
- No analytics Redis and less code to own.
- `events.list` returns raw events with millisecond timestamps and every property, so we bin and sum in SQL. That avoids the hourly bins and 5 reads per second of `events.aggregate`.

We rejected two alternatives. Our own stream would have kept a second record that can drift from the bill, plus Redis memory to watch. Reading Autumn on every page view would have cost 10–18 aggregate calls per view.

## Consequences

- The job reads every `apCredits` event, including flow-run events, and keeps only those with a `usage` block. If AI events become a small share, move the block to its own unbilled feature.
- Self-hosted EE now sends own-key usage (value 0) to our Autumn. An install without Autumn credentials shows an empty page.
- Analytics depends on Autumn being reachable. The job keeps a cursor per platform and catches up after an outage.
- Tracking starts per platform when its cursor is created. There is no backfill from before that.
