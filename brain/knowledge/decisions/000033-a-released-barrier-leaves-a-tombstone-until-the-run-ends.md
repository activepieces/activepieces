---
icon: 🪦
status: accepted
---

# A released barrier leaves a tombstone until the run ends

## Decision

Delivering a resume no longer means deleting the waitpoint row. `waitpointService.consume` owns the
rule: a `BARRIER` is tombstoned at a third status, `CONSUMED`, and every other type is still deleted.
The tombstone lives until the run reaches a terminal status, where the existing `deleteByFlowRunId`
sweep clears it. The legacy by-run resume guard (`hasBarrier`) therefore asks whether the run holds a
barrier row **at all**, in any status, instead of whether one is `PENDING`.

## Context

A barrier's release boundary is predicate-owned: only its own predicate or its deadline may release
it. The guard enforcing that on the deprecated V0 `/:id/requests/:requestId` routes asked
`hasPendingBarrier`, which filters `status: PENDING`, so it stopped guarding the moment the barrier
was released. Two windows followed — between `closeBarrier` committing `COMPLETED` and the trusted
resume consuming it, and the much wider one after delivery, since a run stays `PAUSED` until the
engine's next progress upload. In both, a legacy resume was accepted and enqueued a second job with
a request-controlled payload, under a job id BullMQ would not collapse against the trusted one.

The root cause was that "this resume was delivered" was encoded as *row-absence*, which makes a
delivered barrier and a pre-waitpoint legacy pause indistinguishable — both are "no rows" — while
the legacy path may only serve the second.

## Why

Making delivery explicit is what lets the two be told apart, and `waitpoint.status` is
`character varying` with a TypeScript-only enum, so a third value costs no migration.

Rejected: a `flow_run.pausedWaitpointId` column — a real migration, and `pauseMetadata` was not
available to reuse (it is deprecated and pending removal). A Redis marker with a TTL — puts a
security boundary on an expiry and a flush reopens the hole. Deleting the legacy path outright —
tempting at 4.5 months past deprecation with a 30-day default pause timeout, but a self-hoster
jumping many versions would silently lose every in-flight approval.

Tombstoning is scoped to barriers rather than all waitpoints because the barrier is the only
waitpoint whose release boundary is predicate-owned; for `DELAY` / `WEBHOOK` the unguessable link
*is* the authorization. Widening it would leak `CONSUMED` rows into `findSubflowWaitpoint`'s
any-status fallback and into `createForPause`'s unique `(flowRunId, stepName)` slot.

## Consequences

A run that has ever held a barrier can never use the legacy by-run resume path again. That is
correct, not a side effect: that path serves only runs which never had a waitpoint row at all.

`hasPendingBarrier` survives alongside `hasBarrier` and `findUndeliveredCompletedWaitpoint` must keep
calling the *pending* one — switching it to existence would return null whenever a `CONSUMED` barrier
exists and hang a later non-barrier delivery on the same run.

The invariant that a row still sitting at `COMPLETED` was never delivered is preserved, now carried
by an explicit status rather than by absence. Cost is one small row per barrier for the life of the
run; `barrierService.create` already deletes any non-`PENDING` row occupying its step's slot.
