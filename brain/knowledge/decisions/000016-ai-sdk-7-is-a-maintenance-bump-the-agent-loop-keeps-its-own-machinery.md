---
title: AI SDK 7 is a maintenance bump; the agent loop keeps its own machinery
icon: 🧱
status: accepted
---

# AI SDK 7 is a maintenance bump; the agent loop keeps its own machinery

We moved the agent path to `ai@7` and deliberately adopted **none** of v7's headline agent
features. Every one of them is a generic version of machinery the agent loop already has,
built more specifically — adopting them would trade domain-tuned behaviour for framework
defaults and re-open closed bugs.

## Scope

Only the agent path moved: `core/ai-providers`, `server/utils`, `server/api`,
`server/worker`, `web`. `pieces/framework`, `pieces/community/ai` and `server/engine` stay
on v6 because `pieces/framework` re-exports `LanguageModel` and `Tool` as **public piece
API** — bumping it breaks every out-of-tree piece and needs its own PR with the
`⛓️‍💥 breaking-change` label and a `breaking-changes.mdx` entry. Mixed majors are safe:
`bunfig.toml` sets `linker = "isolated"`.

## What we declined, and why

- **`ToolLoopAgent`** — our outer loop does truncation-continuation, empty-output nudging,
  one-shot stream retry and a per-turn token ceiling. `ToolLoopAgent` does none of that.
- **`WorkflowAgent` / `@ai-sdk/workflow`** — BullMQ plus incremental persistence already
  gives durability. It would add a runtime dependency, against the zero-setup self-hosting rule.
- **Native `toolApproval`** — it suspends the loop and resumes from a `tool-approval-response`
  message, but our gates block *inside* `execute` and resume in place. Native approvals would
  force suspend/resume across a BullMQ job boundary, rewriting the job lifecycle,
  `ModelMessage` persistence, the socket protocol and the frontend — for identical
  user-visible behaviour. The HMAC-signing and input-revalidation hardening is the only real
  draw; revisit on that basis alone, not for the execution model.
- **`pruneMessages`** — `stripThinkingBlocks` also filters `type: 'thinking'`, which is what
  stops Anthropic rejecting re-sent thinking blocks whose signature didn't survive the DB
  round-trip. `collapseStaleToolOutputs` never removes a message (keeps `tool_use`/`tool_result`
  pairing valid), leaves an "omitted … used at the time" marker that stops the model
  re-fetching, and pins `SCHEMA_TOOL_NAMES`. `pruneMessages` removes outright and indexes by
  message. Strictly worse for us.
- **`timeout.chunkMs` / `stepMs` / `totalMs`** — display and approval tools legitimately block
  on a human for up to 5 minutes and emit **zero** stream chunks, so these would abort a turn
  whenever a user pauses to think. Only per-tool `timeout.tools` is safe here, and it was not
  worth swapping a working `Promise.race` for.
- **`HarnessAgent`** — runs the `claude-code`/`codex` CLI in a *networked* sandbox that
  installs itself and leases a bridge port. Our agent has no repo; a flow is Postgres rows
  behind MCP tools. It cannot run on our `isolate` sandbox, which exists to deny network.
  The honest fit is **piece development** (real files, real `tsc`, real tests, and
  `/piece-builder` already encodes the procedure as a skill) — not the chat agent.
- **`contextSchema` / `toolsContext`** — tools are RPC proxies sharing one conversation
  context; there are no per-tool credentials to scope.

## What we did take

`evlog`'s AI SDK telemetry integration (`createEvlogIntegration`, bound per-call to the
`wideEvent.current()` RequestLogger) plus per-step `performance`. This was the only genuine
capability gain: the agent previously had **no** SDK telemetry at all, so per-step latency,
token attribution and tool timing were unmeasurable — including whether the
fast-model-first-step swap in `prepareStep` actually buys anything. `timeToFirstOutputMs`
now answers that.

Note evlog's integration is **per-call** (`telemetry: { integrations: [...] }`), not global
`registerTelemetry` — it binds to a logger instance, so a global registration would capture
one stale logger. It lives in `server/utils` because that workspace owns `evlog`; the worker
does not declare it.

## The honest verdict

As a feature upgrade this was weak, and the reason is worth remembering: **the agent loop is
ahead of the framework's generic helpers on the axes that matter to us.** The real
justification is that provider majors are where new model support lands, so staying on v6
guarantees a larger, riskier jump later. Expect the same conclusion next major — check
whether a v7+ feature beats our specific implementation before adopting it, not just whether
it exists.
