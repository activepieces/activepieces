---
title: AI is billed on what the call cost, observed at the worker
icon: 🪙
status: accepted
---

# AI is billed on what the call cost, observed at the worker

## Decision

Managed AI is billed on the dollar cost the provider reports for each model call, converted at
`AP_AI_CREDIT_USD_VALUE`. Work on a customer's own key is billed one flat credit per billable unit —
per model call for a direct AI step, per turn for an agent. Tool calls stay at one credit each. The
cost is observed by a middleware the **worker** wraps around every language model, and the charge is
written by the API over the worker-to-API RPC. The per-model weight tables are deleted, not kept as a
fallback.

## Context

The managed provider runs on our own OpenRouter key, so we pay per token while the customer was
charged a flat `MANAGED_MODEL_WEIGHTS[model]` per step. That table is calibrated at roughly a
thousand tokens per call: below it the charge is about right, above it our cost diverges linearly and
the charge does not. A call an order of magnitude larger costs an order of magnitude more than it
bills.

Two stacks attacked this. One read the cost **in the piece** and posted it to a new endpoint. The
other moved AI **execution** to the worker.

## Why

Measuring in the piece means trusting a caller that can lie about its own identity. It needs a
`pieceVersion` gate to stop an old or forged piece from reporting a cost of zero, and that gate is a
speed bump rather than a lock. Measuring at the worker puts the observation on our side of the trust
boundary: the RPC is worker-to-API and engine-token authenticated, so piece code cannot call it and a
caller identity cannot be forged. That is what makes version gating unnecessary rather than merely
inconvenient — so the piece-side approach was rejected.

Billing one flat credit for a customer's own key, rather than nothing, keeps the credits gate
meaningful for platforms that bring their own key. That credit is charged per *turn* for an agent, not
per model call: an agent turn is one model round-trip per tool-use step, so a per-call charge would
have quietly multiplied the price of every own-key agent. For managed AI the per-call charge tracks
money we actually spend, so it stays per call; for an own key we spend nothing and the credit is a
flat platform fee, which the turn is the honest unit for.

A missing cost bills zero, is counted, and pages on-call. There is no fallback to the old table: a
silent fallback would mask the one regression that matters — an SDK bump moving where the cost is
reported — and failing the step would turn a billing-telemetry bug into a customer outage. A
genuinely free model reports a real cost of zero; a *missing* cost reports nothing, and the gap
between the two is the signal.

## Consequences

Credits are now fractional, so a small call can cost less than one credit; round only for display.
There is no fixed per-model price to publish, so the model picker and the credits breakdown say the
charge follows the call. A chat turn is charged in two events — the model cost per call, the tool
calls for the turn — which sum to the same total but mean no single event holds a turn's whole cost.

Because the charge depends on the provider actually reporting a cost, the managed request must ask
for it (`usage: { include: true }` on OpenRouter); a test pins that, since without it the entire
scheme bills nothing and raises no error.

Every AI step must run on a piece version that routes through the worker, so the release that ships
this also migrates every `@activepieces/piece-ai` step to `0.11.0`. The old trackers must be deleted
in that same release: `flowRunAiUsageExtractor` detected AI steps by piece name rather than version,
so while both paths live every managed AI step is charged twice.
