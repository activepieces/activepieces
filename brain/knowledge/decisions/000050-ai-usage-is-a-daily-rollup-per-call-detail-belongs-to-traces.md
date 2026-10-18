---
title: AI usage is a daily rollup; per-call detail belongs to traces
icon: 📊
status: accepted
---

# AI usage is a daily rollup; per-call detail belongs to traces

## Decision

AI analytics reads one table, `ai_usage_daily`: one row per UTC day × platform × project × origin ×
environment × flow / agent / user × key × model, upserted by `aiUsageService.report`. It is not a per-call
log. Own-key agent and chat calls, which bill once per turn, now report each call with the `USAGE_ONLY`
basis: recorded, never billed.

## Context

Usage went only to Autumn, which is Cloud-only, so self-hosters had nothing to chart and own-key calls had
no dollar figure. Issue #16487 (client proposal) asks for a per-call `ai_trace` with spans, which is a much
bigger build tied to evals.

## Why

A rollup stays small (bounded by distinct combinations per day), answers every "spend per project / flow /
agent / user / key" question with one indexed query, and needs no retention job. A per-call table would grow
with every model call on Cloud. The rejected alternative was to wait for traces and aggregate from them.

## Consequences

Per-run cost is not answerable from this table; that stays with traces. The row id is a sha256 of the
dimension tuple, because Postgres 14 has no `NULLS NOT DISTINCT`. Cost is provider-reported first,
then estimated from catalog prices, else counted in `unpricedCalls`. `AiCallContext` (origin + environment)
is the shared shape traces can carry later.
