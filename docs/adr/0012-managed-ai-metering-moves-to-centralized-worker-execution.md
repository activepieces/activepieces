# Managed-AI credit gating/metering is interim; the target is centralized worker AI execution

Status: proposed (direction agreed; not yet built)

## Context

Managed AI (the Activepieces-vended OpenRouter key) is currently gated and metered **around** the LLM
call, not on it:

- The credit gate (`assertCreditsAndAppSumoNotExceeded`) fires at `GET /:provider/config`
  (`ai-provider-controller.ts`). The AI piece fetches that config on **every AI action execution**
  (`createAIModel` → `fetchProviderConfig`, `packages/pieces/community/ai/src/lib/common/ai-sdk.ts`),
  so the gate re-checks on each AI call — an AI step inside a 50k-iteration loop hits it 50k times.
- The engine/worker then holds the raw OpenRouter key and calls OpenRouter **directly** — the AP server
  never sees the request/response, so it cannot count tokens.
- Credit usage is **reconstructed after the fact** and tracked post-run / fire-and-forget
  (`flow-run-ai-usage-tracker` from `flow-run-hooks.ts#onFinish`, `chat-usage-tracker` → `trackCredits`).

Consequences of this shape (the over-consumption window; tracked as finding S4 of the security
workstream, WS5, in the internal Autumn billing hardening plan): the gate only sees usage that has
already been *tracked*, and a run's own usage is not tracked until the run finishes — so a single
long run spends invisibly past the limit for its whole duration, and the per-call gate cuts it off
only once *previously finished* runs/chats have pushed the platform's tracked balance over. The only
hard in-run ceiling is the OpenRouter key's own monthly limit (`MANAGED_OPENROUTER_KEY_MONTHLY_LIMIT_USD`,
$1000/month). And token counts are derived, not observed, so metering accuracy depends on the
reconstruction staying in sync with what OpenRouter actually billed.

## Decision

Treat the per-call config gate + post-hoc reconstruction as **interim**. The target architecture is to route
managed-AI calls through **centralized AI execution in the worker** (the `feat/centralized-worker-ai-execution`
effort, `context.ai.execute`), so that:

- Every managed-AI call passes through one AP-controlled chokepoint that observes real token usage
  (prompt/completion) directly from the provider response, instead of reconstructing it.
- Credit checks and metering happen **per call** at that chokepoint, with usage recorded as it happens —
  so a run's own in-flight spend counts against the balance immediately (instead of becoming visible only
  after the run finishes), and tracking is observed-not-derived.

This ADR records the direction and the "why"; it does not design the chokepoint. The centralized-worker-AI
work is the vehicle — accurate, centralized token tracking is an explicit goal of that migration, and the
managed-AI gate/metering should fold into it rather than being hardened in its current around-the-call form.

## Consequences

- Until then, the over-consumption window (a run's in-flight usage is invisible to the gate until
  post-run tracking) stands, backstopped only by the OpenRouter key's monthly limit. Do not invest in
  tightening the config-fetch gate in isolation; that effort belongs in the centralized chokepoint.
- The centralized path must preserve today's non-blocking properties (billing must not add per-token
  latency, per WS6): the goal is *observed* usage at one place, not a synchronous console/Autumn round-trip
  on every token.
