---
status: superseded by 000046-chat-cost-is-cut-in-the-cache-and-build-loop-not-with-sub-agents
icon: 🪆
---

# Chat uses an orchestrator with stateless, single-writer sub-agents

## Decision

The user talks to a small orchestrator on the `smart` tier. Its prompt is about 3k tokens, identical for every user, and it has a stable set of about 6 tools. It delegates to a fixed catalog of children: Explorer (read-only, `fast` tier), Flow builder (the only writer of flows), Task runner, and Agent builder. A child runs as a nested `runAgentTurn` inside the same worker job. It gets a typed brief that quotes the user's asks verbatim, returns a typed result (`done | needs_input | failed`), and keeps no state between delegations. The real artifacts (the flow, the build plan) hold the state.

## Context

A "hello" cost about $0.20 because every request sent a 22k-token system prompt plus 12-18k tokens of tool definitions, across two models, with frequent cache misses. The free plan's 100 credits are worth about $0.05, so a free user couldn't afford one turn.

## Why

Small contexts on cheaper tiers cost far less than trimming one big agent. We avoided the known failure modes. A weak primary model can't tell when to escalate (Cognition), so the orchestrator stays on `smart`. Parallel writers make conflicting decisions, so there is only one writer. A child given only a summary misreads the task, so the brief quotes the user verbatim. We rejected a generic "spawn any sub-agent" tool: the orchestrator would need to know every tool, which brings the big context back.

## Consequences

The design binds to tiers, never to model names. The tier file gets a per-provider id map, because `nativeModelId` is Anthropic-only and OpenAI, Google, Azure and Bedrock otherwise resolve `fast` and `smart` to the same model. A provider missing from the map runs children on the orchestrator's model; the smaller context still carries most of the saving. On own-key providers, child tool calls must be persisted into the turn (tagged `delegationId`) and the child must get the outer turn's `creditsLeft`, or per-turn billing and the mid-turn credit check would miss them. Managed bills each child model call at cost through `billedLanguageModel` with no change. Only the orchestrator renders `ap_show_*` widgets. Rollout is per conversation through `getAgentConfig` (`single | subagents`), A/B tested on cloud free first. The gate is cost per message, cost per completed eval scenario, and the share of free users who reach a first flow within budget.
