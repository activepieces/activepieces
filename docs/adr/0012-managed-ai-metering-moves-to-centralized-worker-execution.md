# Managed-AI credit gating/metering is interim; the target is centralized worker AI execution

Status: proposed (direction agreed; not yet built)

## Context

Managed AI (the Activepieces-vended OpenRouter key) is currently gated and metered **around** the LLM
call, not on it:

- The credit gate fires **once per run**, at `GET /:provider/config` (`ai-provider-controller.ts`), when
  the engine fetches the managed key.
- The engine/worker then holds the raw OpenRouter key and calls OpenRouter **directly** — the AP server
  never sees the request/response, so it cannot count tokens.
- Credit usage is **reconstructed after the fact** and tracked post-response / fire-and-forget
  (`flow-run-ai-usage-tracker`, `chat-usage-tracker` → `trackCredits`).

Consequences of this shape (see WS5-S4): a run that passed the gate keeps spending within that run even
if the platform becomes exhausted mid-run; the only hard ceiling is the OpenRouter key's own monthly
limit; and token counts are derived, not observed, so metering accuracy depends on the reconstruction
staying in sync with what OpenRouter actually billed.

## Decision

Treat the once-per-run gate + post-hoc reconstruction as **interim**. The target architecture is to route
managed-AI calls through **centralized AI execution in the worker** (the `feat/centralized-worker-ai-execution`
effort, `context.ai.execute`), so that:

- Every managed-AI call passes through one AP-controlled chokepoint that observes real token usage
  (prompt/completion) directly from the provider response, instead of reconstructing it.
- Credit checks and metering happen **per call** at that chokepoint, so a platform that exhausts mid-run
  is caught on the next call rather than at the next config fetch, and tracking is observed-not-derived.

This ADR records the direction and the "why"; it does not design the chokepoint. The centralized-worker-AI
work is the vehicle — accurate, centralized token tracking is an explicit goal of that migration, and the
managed-AI gate/metering should fold into it rather than being hardened in its current around-the-call form.

## Consequences

- Until then, S4's over-consumption window (gate check → async track) stands, backstopped only by the
  OpenRouter key's monthly limit. Do not invest in tightening the per-run gate in isolation; that effort
  belongs in the centralized chokepoint.
- The centralized path must preserve today's non-blocking properties (billing must not add per-token
  latency, per WS6): the goal is *observed* usage at one place, not a synchronous console/Autumn round-trip
  on every token.
