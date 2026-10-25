---
status: accepted
---

# AI usage analytics live in our Postgres, not Autumn

## Decision

The AI usage page reads from our own tables, `ai_usage_5m` (kept 3 days) and `ai_usage_daily` (kept 13 months). They are fed by a Redis stream and a one-minute flush job, and read through one cached SQL query per view. Autumn stays the source of truth for billing only. On Cloud, a daily check compares our managed-credit totals with what Autumn billed.

## Context

The billing owner proposed sending every AI call to Autumn with full metadata and querying it there. That would remove our ingest, storage and retention work. Every AI call already sends an Autumn event with `projectId`, `flowId`, `flowRunId`, `environment`, `costUsd` and tokens as properties. CE has no Autumn, and leaving CE without the feature was acceptable.

## Why

The page needs things Autumn's `events.aggregate` can't do. Autumn's limits, from its docs (2026-10):
- it groups by one property per call, and returns at most 250 groups plus "Other";
- it allows 5 reads a second per customer;
- its smallest bucket is one hour;
- it can only sum the event `value`, which is credits, and own-key calls bill a fixed 1 credit;
- its retention is not documented.

A single overview needs about 9 groupings, previous-period comparisons, 5-minute buckets and lists of up to 1000 rows. On Autumn, that would mean 10–15 calls per view, an extra event per call to carry dollars, and a 250-row cap. Postgres gives one indexed scan per view, with exactly-once counting we control.

## Consequences

- We own the write pipeline: stream, cursor compare-and-swap flush, retention job, backlog pages.
- Partitioning is planned for when the daily table nears 50M rows.
- Billing and analytics can drift. The Cloud reconciliation job is what catches that.
- Plan: `~/work/plans/ai-analytics/master-plan.md` (v3).
