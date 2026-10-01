---
title: Direct AI steps reuse the Agent's suspend-and-resume path
icon: 🔁
status: accepted
---

## Decision

The five **Direct AI steps** — Ask AI, Summarize Text, Classify Text, Extract Structured Data,
Generate Image — execute their model call the same way the Agent step already does: the piece posts to
the API, creates a `WEBHOOK` waitpoint and pauses; a background job runs the model call; the job
releases the flow through the resume path. **One pattern for every AI step**, not two.

## Context

Agreed 2026-09-08. The Agent step is already built this way, in production, and the piece side of it is
notably small — `run-agent.ts` invents no new framework surface at all: `httpClient.sendRequest`,
`context.server.token`, `context.run.createWaitpoint` and `context.resumePayload` all already exist.

The alternative examined at length was an in-band request/response call from the engine to the worker,
exposed as a new `context.ai.execute` on the piece context. It is measurably faster: a pause-and-resume
costs ~150–400 ms on a warm sandbox and ~1.1–1.6 s cold, over roughly 25 sequential I/O hops plus a full
round trip of the run's execution state, and Cloud is likely cold.

## Why

Speed was not the deciding axis; **permanent surface area** was. In-band execution is impossible without
adding a new public API to `@activepieces/pieces-framework` — a piece can only reach what `context` hands
it, and the sandbox↔worker socket belongs to the engine. That API would be callable by every piece,
forever, and could not later be withdrawn. The suspend path needs none of it.

Running one AI execution pattern rather than two also keeps the Agent and the Direct AI steps on a single
route that is already proven, already observable, and already understood by the team.

The cost is accepted knowingly: every Direct AI step pays the resume overhead, and the overhead grows
with the size of the run, because the resume re-reads the whole execution state.

## Consequences

- **Retry can pay for a model call twice.** A background job that completes the model call but fails on
  the way back re-runs it; `flow-run-ai-usage-extractor` derives AI Credits from step outputs, so the
  customer is billed once and we are charged twice. This needs an explicit guard — an idempotency key or
  a dedupe on the job — and it is not optional.
- **Each step needs a backstop timeout**, as `run-agent.ts` does with its 3-hour ceiling. The earlier
  "inherit the flow timeout" answer only made sense for in-band execution and does not apply here.
- Every action's `run()` is invoked twice — once to dispatch, once to read `context.resumePayload` — so
  each carries two distinct branches.
- **No new piece-framework API, and no framework version bump.** This is the property the decision was
  made for.
- `packages/server/sandbox` is untouched: no engine→worker RPC direction, and no handler injected down
  through `createSandboxRuntime` → `createSandboxManager` → `createSandboxForJob` → `createSandbox`.
- **Partial progress becomes available for free.** The Agent already streams into the builder through
  `updateFlowStepProgress`; a slow Extract Structured Data can do the same.
- Provider errors reach the user as strings through the resume payload, losing `ActivepiecesError` codes
  and provider detail. Worth shaping the failure payload deliberately rather than copying
  `throw new Error(result.failure)`.

## See also

- [AI & Intelligence](../ai-intelligence/index.md)
- [000036 — The worker-side AI path is Community-Edition core](./000036-the-worker-side-ai-path-is-community-edition-core.md)
