---
status: accepted
---

# Managed AI is billed on observed cost, not a per-message weight

## Decision

The `ACTIVEPIECES` provider bills the dollar cost OpenRouter reports for each request, converted to
credits by a single server-side rate (`AP_AI_CREDIT_USD_VALUE`, default `0.0005`). Cost is read per
step from `providerMetadata.openrouter.usage.cost` and reported to `POST /v1/ai-usage`, one event per
OpenRouter request, keyed on that request's `gen-…` generation id. `MANAGED_MODEL_WEIGHTS` stops
applying to the managed provider; BYOK keys keep their existing per-message weight of 1.

## Context

Managed AI runs on our own OpenRouter key, so we pay per token while charging a flat
`MANAGED_MODEL_WEIGHTS[model]` credits per step. That table turns out to be calibrated at roughly a
thousand tokens per call: at that size the new rule charges almost exactly the same, and past it the
old rule diverges linearly. A call an order of magnitude larger than the calibration point costs us
an order of magnitude more than it bills, and the only in-flight backstop is the OpenRouter key's own
monthly ceiling (decision 000016).

## Why

Observed cost is the only figure that stays correct as models, prices and OpenRouter's provider
routing change, and it is what we are actually billed. The rate lives server-side as one system prop
so a piece bundle can never bill at a stale rate and the number can be tuned without a piece release.
Keying on the generation id makes each event idempotent for free and forces the per-step read, which
is the same thing that stops a multi-step call being undercounted.

**Rejected: Autumn's `trackTokens`.** It prices tokens itself from models.dev plus a markup
configured in the dashboard, which is a genuinely nicer lever than an env var, and the markup
objection to it is unfounded — models.dev tracks OpenRouter's list prices closely. It fails on units:
`trackTokens` requires an `ai_credit_system`, which is dollar-denominated, `apCredits` is
credit-denominated, and a feature's type cannot change in place. That means a new feature id, a plan
item on every live plan, and a balance migration — while already-released Activepieces versions keep
draining the old feature forever. Two live balances for one thing. Worth revisiting only as its own
migration.

**Rejected: falling back to the weight table when no cost is reported.** A silent fallback would mask
the one regression that matters — an SDK bump moving the metadata, after which billing quietly
reverts to weights for everyone with no alarm. A genuinely free model (`:free` variants) reports a
real cost of zero and bills zero; a *missing* cost reports nothing at all, so the gap between config
fetches and cost reports is the signal.

## Consequences

- A step's charge now scales with its size. Small calls bill about what they did; large ones bill
  proportionally more, and any surface that shows a fixed per-message credit cost is wrong until it
  is changed.
- Generate Image has to be covered too: `ACTIVEPIECES` is not in `NO_IMAGE_GENERATION_PROVIDERS`, so
  a managed image request is served by a chat model and would otherwise become the one unmetered
  managed path.
- Embeddings on the managed provider remain unbilled — knowledge-base indexing runs on our key for
  free. Known gap, out of scope here.
- The bypass is narrowed, not closed. `GET /:provider/config` still hands the raw OpenRouter key to
  piece code in the engine process, so a piece can reuse it directly and a piece-supplied caller
  identity is forgeable. What the change does buy is *detection*: config fetches and cost reports
  should track each other, and a persistent gap between them is a bypass.
- Reporting is a hop the flow waits on and a hop it does not: the piece awaits its POST, because an
  unawaited request can be lost when the engine tears down after the last step and a lost event is
  free AI; the server then hands the Autumn call off and answers `202`, keeping the billing
  provider's latency off the step.
