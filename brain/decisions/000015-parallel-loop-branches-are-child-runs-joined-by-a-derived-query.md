---
status: proposed
---

# Parallel loop branches are child runs, joined by a derived query

## Decision
A parallel Loop on Items fans each item out as its own branch flow run (the `parentRunId` / Call Flow machinery that already exists). The parent holds **one** waitpoint for the loop step and releases it only when no branch is still live — a query over `flow_run`, not a stored count. Concurrency is a per-loop setting the author picks in the UI, defaulting to 1.

## Context
A customer needs to fan out thousands of rows. Their branches are not simple API calls: a branch can hit a delay, do work, hit an approval, then do more work, and the branch's waitpoints are independent of every other branch's. The loop is done when all branches clear. Thousands of separate approvals is the genuine intent, not an accident of modelling.

Today that is inexpressible. `loop-executor.ts` returns out of the entire loop the moment any iteration produces a non-RUNNING verdict, and resume rebuilds **one** execution context from the run's log file and re-enters at **one** point. A run has exactly one resumable program counter. "Resume branch 7 at its second delay while branch 12 sits at its first" has nowhere to live.

## Why
The blocker is the single program counter, not the waitpoint table — so the change belongs wherever a second resumable unit is cheapest. A flow run already *is* a resumable unit, with its own context, its own log file, its own waitpoints, and an existing parent/child link. Reusing it means the per-branch half of the problem costs nothing.

That leaves only the join. The `(flow_run_id, step_name)` unique constraint, which looks like the obstacle (every iteration shares a step name, so N pending waitpoints collide on one row), becomes the mechanism: one row for the loop step, held until every branch is done. The alternative — per-branch execution state inside a single run — needs a new waitpoint key (`+ loopPath`), a new log format, resume routing by path, and an executor rewrite. Same outcome, an order of magnitude more surface.

A stored pending-count was rejected. A counter that misses one decrement is wrong forever and nothing can notice, so a branch that dies without calling back strands the parent with no way to tell "still working" from "lost". Deriving the condition instead — `parentWaitpointId = :id AND status NOT IN (terminal)` over `flow_run`, behind a partial index — cannot drift: it is correct the instant a branch row goes terminal, whoever made it terminal. Unsticking a stranded parent becomes the one-line `UPDATE flow_run SET status='CANCELED'` already documented for OOM'd runs, with no counter to repair alongside it. Membership needs its own marker (`parentWaitpointId`) rather than reusing `failParentOnFailure`, because that flag already means "kill the parent if I fail" and a loop body with `continueOnFailure` set would silently drop out of the barrier.

Product calls that came out of the same interview:

- **Children nest under the parent in the runs table.** The list shows the parent; drill in for branches. 3,000 top-level rows is not acceptable, 3,000 drillable ones are.
- **Partial failure honours the step's existing `continueOnFailure`.** No new loop-level failure policy; `failParentOnFailure` already carries this to the child.
- **Parallel loops do not collect branch outputs.** The loop step output holds counts and status only. This is a real semantic break from the sequential loop — steps after the loop cannot reference per-iteration data — and it is the deliberate price for not carrying 3,000 outputs in the parent context.
- **Default concurrency is 1, so parallel is strictly opt-in.** This ships to CE, so the default is the safety story: existing flows behave identically after upgrade, and nobody gets surprise concurrency against a rate-limited CRM.

## Consequences
Anticipated at this scale, mostly outside the join itself:

- Third-party rate limits bite before our concurrency does. The customer's branches call ActiveCampaign and similar; the per-loop ceiling is as much a politeness control as a resource one.
- Thousands of delayed `RESUME_DELAY_WAITPOINT` jobs land in BullMQ per run.
- `AP_PAUSED_FLOW_TIMEOUT_DAYS` now ticks per branch, and a branch with several sequential waits can idle far longer than the author expects.
- Not collecting outputs means a parallel loop cannot be swapped for a sequential one without breaking downstream references. The UI has to make the mode obvious.

Open, deliberately unresolved:

- What cancelling a parent does to in-flight branches.
- Whether 3,000 approval emails needs any batching or digest affordance on the notification side.
