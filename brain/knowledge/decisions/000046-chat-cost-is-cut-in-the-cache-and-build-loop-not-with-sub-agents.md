---
title: The chat builds composed solutions by default, one sub-agent per flow
status: proposed
icon: 💸
---

# The chat builds composed solutions by default, one sub-agent per flow

## Decision

Whenever a use case has more than one job (intake, processing, storage, reporting, approval), the chat agent becomes an architect. The result is a folder of small, well-named flows, subflows and tables, not one big flow. The architect:
- writes a Solution Blueprint: artifacts, connections, and a JSON Schema contract per connection;
- pre-creates flow shells and builds tables in code;
- runs one builder sub-agent per flow in parallel, each the only writer of its flow;
- lets code check every contract before a verifier runs the solution end to end.

A single-purpose flow stays on the single agent. A verifier sub-agent reviews and test-runs every build, single or composed, and a debug sub-agent handles failed production runs.

General cost optimisation is a separate track, owned by a teammate. It covers:
- a system-prompt cache breakpoint on managed;
- refusal handling;
- a fixed tool list and per-user data out of the prefix;
- a Sonnet 5.5 migration with effort levels.

Everything ships behind a per-conversation flag, after a live multi-turn, multi-artifact eval gate.

## Context

Users ask the chat for connected solutions: flows, callable subflows, tables, agents, forms, approvals. One agent building all of that in one context produced huge flows, mounting bugs, and $2-4 per solution on managed.

## Why

Production data (2026-10-04, read-only replica):
- 0 of 1,417 chat conversations used subflows, because the chat never offers composition;
- 56% of `ap_build_flow` calls returned invalid steps;
- about 4% of chat-built flows had a successful production run.

So the bigger problem is correctness, not the share of big requests: big tool outputs crowd one shared context. The team lead's product call is that composition is held back by supply, not demand. Earlier, five adversarial review rounds with a cost simulator found:
- **Splitting a single flow's builder saves ~1%.** The earlier sub-agent design, 000045, is superseded.
- **One builder per artifact pays off on four or more artifacts:** ~25% cheaper and 30-35% faster in parallel. It loses on one flow, hence the router.

Most of the correctness gain comes from deterministic contract checks, so those ship first and serve the single agent too.

## Consequences

Required before builders ship:
- `ap_create_flow` must return the flow externalId, which Call Flow stores;
- per-builder `phaseState`, taint state and emitter;
- builder tool calls persisted so own-key billing counts them;
- one credit reservation shared by parallel builders;
- agent, knowledge-base and flow-tool chat tools before agent nodes are buildable.

The blueprint is intent: contracts are re-derived from live flows before edits.
