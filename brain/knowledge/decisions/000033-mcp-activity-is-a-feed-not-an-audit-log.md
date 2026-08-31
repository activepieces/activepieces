---
icon: 📻
status: accepted
---

# MCP Activity is a feed, not an audit log

## Decision

`mcp_activity` answers "what did my agent just do", best-effort. Rows are written after the tool
result returns, via `rejectedPromiseHandler`, so a crash or a redeploy mid-write loses one. Coverage
is bounded by a single tool — `ap_run_action` — rather than by a guarantee, and a row's `status` is
only as honest as that tool's `isError` flag.

## Context

The tab shows an MCP client's calls back to the user who made them. The same table could plausibly
have been the compliance surface for "prove what this agent touched", and several review findings —
a thrown `execute` going unrecorded, mutating tools outside the predicate, fire-and-forget writes —
only read as bugs under that second reading.

## Why

An audit log has to not drop records, which means a synchronous write or a transactional outbox on
the hot path of every tool call, plus recording throws, plus a stated retention and access policy.
That is a different feature with a different cost, and the value here is a user glancing at what
their agent did. Best-effort buys the write off the response path — on the platform server the
project is only known after a Redis read, so the context is a thunk resolved *after* the result
returns. The alternative, an audit log, was rejected as unbuilt scope rather than as a bad idea: if
it is ever needed, `toolName` is still stored so the predicate can widen without a migration, and the
delivery guarantee is the only thing that has to change.

## Consequences

Nothing may cite this table as proof of what an agent did. A dropped row is not a bug report. The
non-goals are written on the MCP Server page next to the mechanism, because the gap between "records
what ran" and "records everything that ran" is invisible from the UI.
