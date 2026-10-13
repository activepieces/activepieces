---
status: accepted
---

# Providers redesign ships before model routing

## Decision

The 2026-08 replan of "AI Providers — One Experience, Any Provider" swaps milestone order: the AI providers page redesign (multi-key providers, per-key model allow-lists, per-key project scoping, "AI Center" page) is milestone 2; model routing moves to milestone 5. Routing PRs #14563 (backend) and #14587 (setup UI) stay parked open to revive later.

## Context

Routing was originally milestone 2 with its engine PR already open. Meanwhile the providers-page prototype (`proto-ai-providers-ui-v2`) converged on a data model where one platform holds multiple keys per provider, each with its own model and project scope.

## Why

The providers foundation must land first: routing's slot shape `{provider, modelId}` cannot address a specific key once multiple keys per provider exist, so routing built now would need rework. Routing's own scope also grew (metadata catalog, capability matching, custom tiers) beyond a single milestone slot.

## Consequences

Runtime key resolution is deterministic without a priority field: most specific project scope wins (selected > except > all), newest `created` breaks ties. Model routing, when revived, must address keys (rows), not provider names. Model facts (cost/context/speed) stay out of scope until a real catalog exists — pickers are names-only.
