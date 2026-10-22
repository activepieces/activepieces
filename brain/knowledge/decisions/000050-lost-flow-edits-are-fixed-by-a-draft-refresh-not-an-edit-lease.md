---
status: accepted
---

# Lost flow edits are fixed by a Draft Refresh, not an Edit Lease

## Decision

Every Draft Write sends a Draft Push, and each open builder tab that shows the newest version refreshes the draft in place. `POST /v1/flows/:id` keeps accepting every write: no edit lease, no version check, no 409.

## Context

GIT-1745 showed lost edits on one draft flow, caused by writes built on a stale copy of the draft: an open tab never took a different writer's save. ENG-972 first asked for a single-editor lease, then designed a cooperative Edit Lease with tab states, a heartbeat and agents that wait or refuse.

## Why

The cause is a stale copy, so a refresh fixes it: one person cannot type in two tabs at once, two people are already kept apart by the per-user Resource Lock, and an agent reads the server before each write. The Edit Lease was rejected for its size and because it made agents wait on a person; the price is a same-step race while a person types and about 1 s after.

## Consequences

Agents, API Writers and System Writers never get a write refused for staleness, so adding a version check or a lease later is a breaking change for them. The Resource Lock gained two changes: a viewer acquires a freed lock and refreshes before it becomes editable, and a leaving builder releases its lock only after its pending edits are saved. Terms and gotchas: [Draft Refresh](../flows-execution/draft-refresh.md).
