---
status: accepted
---

# A barrier is a waitpoint plus one pre-created signal row per awaited thing

## Decision
"Pause this run until N things report back" is **one generic mechanism**: a `waitpoint` of type `BARRIER`
carrying `sealed` and a nullable `policy` jsonb, plus one `waitpoint_signal` row per awaited thing, created
up front. A signal carries `id` (primary key **and** the resume-link token — a random `apId`), `refId` (the
child run or approval link it stands for, set by a compare-and-set claim), nullable `sequence` (the
producer's ordinal), nullable `label` (the human name in the summary) and a small `result` jsonb.

Release is an **unconditional floor rule**: a sealed barrier releases once no signal is still `PENDING`. No
configuration can produce a hang; `policy` only ever releases *sooner* — `requiredSuccesses` (K-of-N
approvals) and `releaseOnFirstFailure` (veto). Evaluation is a coalesced `BarrierJobName.EVALUATE` job on a
dedicated `BARRIER_JOBS` queue, deduplicated on the barrier id, owned by the waitpoints module. Counts are
taken once, from a single `GROUP BY status`, and handed to a pure predicate. Signals are deleted on release,
in the same transaction that completes the waitpoint — summary first, then complete, then delete.

## Context
Four asks need the same primitive: array batching into subflows, streaming CSV batching, request-approval
waiting on **multiple** approvals (K-of-N, veto, accept/reject reasons), and later parallel branches.

The obvious cheaper design is to count *child runs* by a `parentWaitpointId` on `flow_run`. It serves only
the first ask: anything without a run row — a human approval, a batch that never dispatched — has no way to
be awaited. Counting children also forces three separate concepts for "a thing that will never report"
(expected-minus-actual, failed-to-dispatch, not-started), and forces an `expectedChildren` column to exist at
all, purely because child rows appear later than the dispatch that created them.

## Why
- **One row per awaited thing collapses the three concepts into one.** A batch that never dispatched is a
  signal with a `NOT_DISPATCHED` outcome. Nothing has to be inferred by subtraction, and the summary is exact
  rather than reconstructed.
- **One column per role, rather than one key doing three jobs.** A single caller-supplied `signalKey` would
  have to be identity, idempotency key, ordinal and human label at once, and is wrong for at least one of
  those in every use case. `sequence` is **nullable on purpose**: a producer that writes the barrier and all
  N signals in one transaction already gets idempotency from the barrier's own `(flowRunId, stepName)` key.
  Only a streaming dispatcher — re-entered by redelivery, re-parsing from row 0 — has to answer *"did I
  already insert batch 4 200?"*, and `sequence` is that answer. Postgres treats NULLs as distinct, so the
  partial unique index does not bite the rows that do not need it.
- **Release stays a predicate re-derived from committed state, never an incremented counter.** A counter's
  failure mode is a premature release on a green-looking run. Exactly-once release still rests on one
  `UPDATE … WHERE status = PENDING` plus a deduplicated resume job id.
- **Receiving is an upsert, last write wins.** It is not a state machine and does not reject a second write:
  a retried child reports its terminal status again — possibly a different one — and the barrier must reflect
  the latest truth, not the first. That also makes redelivery of the receive path free.
- **The deadline is set at create and nothing moves it.** The floor rule needs an evaluation to fire; a
  barrier nobody ever signals gets none, so the deadline is the only thing between "the producer died hard"
  and a run paused until retention deletes it. Seal does not touch it — the clamp with no requested value
  already returns the ceiling, and a shorter deadline is a `policy` input, so both are known at create.
- **Evaluation must be coalesced, and coalescing must not swallow its own last signal.** At 10 000 signals,
  evaluating per signal is ~100M row reads. BullMQ holds a deduplication key while the job is queued *and*
  active, so the handler's **first statement** is `clearEvaluationDeduplication`, and every producer commits
  its signal row **before** enqueuing. Otherwise the final signal lands while the job meant to see it is
  already running, its enqueue is dropped as a duplicate, and the barrier waits out its deadline holding a
  run that was ready to resume.

## Consequences
- **The release predicate is pure and lives in `core-execution`, not in the service.**
  `shouldReleaseBarrier({ policy, sealed, counts })` takes counts rather than issuing its own queries, so one
  `GROUP BY status` replaces up to three round-trips and the policy matrix is unit-testable without a
  database.
- **An external actor never addresses the waitpoint.** Their link carries a **signal id** on
  `/v1/flow-runs/:id/signals/:signalId/confirm` — in the path, not the query string, because `resumePayload`
  is built from `{ body, headers, queryParams }` and persisted with the run. The link must never carry
  `label`: the route's entire guard is that every segment is unguessable, so a semantic segment lets one
  legitimate approver substitute the string and cast the whole quorum.
- **`result` is the first place unauthenticated free text reaches a jsonb column.** Bounded to 2 000
  characters **server-side** (rejected at the page, never truncated), passed through
  `sanitizeObjectForPostgresql()` before the insert, stored as text and rendered escaped.
- **Accepted cost: ~30k row writes per 10 000-signal barrier** — insert, receive, delete — on top of the
  children themselves. Bounded, on a narrow table, and gone the moment the barrier resolves.
- **A returning approver still sees a bare "already responded".** Signals die with the release, so there is
  nothing left to tell them what they decided. Decision 000009's gap stays open.
- **The machinery ships able to carry K-of-N approvals; no approval piece is rewired yet.** Per-signal links
  and `reasonRequiredOn` exist now because retrofitting them means another migration.
- **`policy` carries no deadline override.** The plan allowed "or the policy's shorter value"; nothing
  produces one, so `resolveDeadline()` is `now + AP_PAUSED_FLOW_TIMEOUT_DAYS` and takes no arguments. Add the
  field when a caller for it exists, not before.
- **The 2 000-character reason bound stays a handler check, not a request schema.** The confirm route is
  `app.all` serving an HTML form: a Zod `body` schema would also apply to the GET that renders the page, and
  a schema rejection returns JSON where the handler returns a themed 400. The bound is enforced server-side
  either way — this is about which response the browser gets.
