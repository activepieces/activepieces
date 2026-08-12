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
configuration can produce a hang; `policy` only ever releases *sooner* —`requiredSuccesses` (K-of-N
approvals) and `releaseOnFirstFailure` (veto). Evaluation is a coalesced `EVALUATE_BARRIER` job on a
dedicated queue, deduplicated on the barrier id, owned by the waitpoints module. The check is `EXISTS`, not
`COUNT(*)`; the counts are taken exactly once, when building the summary of a barrier that has already been
decided. Signals are deleted on release, in the same transaction that completes the waitpoint — summary
first, then complete, then delete.

This supersedes the `isFanIn` / `expectedChildren` / `failedToDispatch` / `dispatchDigest` barrier, which
never shipped in a tagged release and was removed rather than migrated.

## Context
Four asks need the same primitive: array batching into subflows, streaming CSV batching, request-approval
waiting on **multiple** approvals (K-of-N, veto, accept/reject reasons), and later parallel branches. The
previous barrier could serve only the first: it counted *child runs* by `parentWaitpointId`, so anything
without a run row — a human approval, a batch that never dispatched — had no way to be awaited.

Counting children also forced three separate concepts for "a thing that will never report": `expectedChildren`
minus what exists, `failedToDispatch`, and `notStarted`. And it forced `expectedChildren` to exist at all,
purely because child rows appeared later than the dispatch that created them.

## Why
- **One row per awaited thing collapses the three concepts into one.** A batch that never dispatched is a
  signal with a `NOT_DISPATCHED` outcome. Nothing has to be inferred by subtraction, and the summary is exact
  rather than reconstructed.
- **One column per role, rather than one key doing three jobs.** A single caller-supplied `signalKey` would
  have to be identity, idempotency key, ordinal and human label at once, and is wrong for at least one of
  those in every use case. `sequence` is **nullable on purpose**: a producer that writes the barrier and all
  N signals in one transaction already gets idempotency from the barrier's own `(flowRunId, stepName)` key.
  Only the streaming dispatcher — re-entered by redelivery, re-parsing from row 0 — has to answer *"did I
  already insert batch 4 200?"*, and `sequence` is that answer. Postgres treats NULLs as distinct, so the
  partial unique index does not bite the rows that do not need it.
- **Release stays a predicate re-derived from committed state, never an incremented counter.** A counter's
  failure mode is a premature release on a green-looking run. Exactly-once release still rests on one
  `UPDATE … WHERE status = PENDING` plus a deduplicated resume job id.
- **Receiving is an upsert, last write wins.** It is not a state machine and does not reject a second write:
  a retried child reports its terminal status again — possibly a different one — and the barrier must reflect
  the latest truth, not the first. That also makes redelivery of the receive path free.
- **The deadline is set at create and nothing moves it.** The floor rule needs an evaluation to fire; a
  barrier nobody ever signals gets none, so the deadline is the only thing between "the dispatcher died hard"
  and a run paused until retention deletes it. Seal does not touch it — the clamp with no requested value
  already returns the ceiling, and a shorter deadline is a `policy` input, so both are known at create.
- **Evaluation must be coalesced, and coalescing must not swallow its own last signal.** At 10 000 signals,
  evaluating per signal is ~100M row reads. BullMQ holds a deduplication key while the job is queued *and*
  active, so the handler's **first statement** is `removeDeduplicationKey`, and every producer commits its
  signal row **before** enqueuing. Otherwise the final signal lands while the job meant to see it is already
  running, its enqueue is dropped as a duplicate, and the barrier waits out its deadline holding a run that
  was ready to resume.

## Consequences
- **Identity is path-keyed, and that needed no new column.** The engine sends `loop_1:3/loop_2:0/batch_step`
  in the existing `stepName` field, which is only ever an identity key inside `waitpoint-service`. Which
  fixes a live bug on the way past: a delay or approval **inside a loop** used to reuse one waitpoint row
  across every iteration, so iteration 2 found iteration 1's COMPLETED row in `createForPause`'s pre-completed
  check and skipped its pause entirely.
- **Two per-run waitpoint reads stopped being sound and were fixed here.** `getByFlowRunId` became
  `findPreCompletedByFlowRunId` — **null when any PENDING row exists for the run**, else the newest COMPLETED
  one — because per-iteration rows mean a run can hold a COMPLETED leftover *and* an open PENDING pause at
  once, and both callers delete the row they find and enqueue a resume. `findNonFanInByFlowRunId` became
  `findNonBarrierByFlowRunId` and prefers PENDING, newest first. `findPendingByVersion` is **still** unsound
  for parallel branches; nothing here creates that case.
- **The resume guards moved to the entry point rather than becoming a flag.** `resumeFromWaitpoint`
  **refuses barriers, always** — by addressed waitpoint type, or, on the by-run legacy routes, by "does this
  run hold any PENDING barrier". Every unscoped route goes through it, so there is no `false` to forget and
  no parameter to default wrong. What the guard is *not* is structural: `releaseBarrier` and
  `releaseBarrierWithoutLock` are ordinary public members of `resumeService`, one `if` away from the guard
  they skip, and neither project-scopes nor type-checks the waitpoint it is handed. `flow-runs-queue`'s
  pre-completed recovery calls the unlocked variant from outside the module, so a module-private
  `releaseBarrier` would not have worked as written. Treated as acceptable because the reachable surface —
  the HTTP routes — is closed; if a third caller appears, make the boundary real rather than adding a
  second convention.
- **An external actor never addresses the waitpoint.** Their link carries a **signal id** on
  `/v1/flow-runs/:id/signals/:signalId/confirm` — in the path, not the query string, because `resumePayload`
  is built from `{ body, headers, queryParams }` and persisted with the run. The link must never carry
  `label`: the route's entire guard is that every segment is unguessable, so a semantic segment lets one
  legitimate approver substitute the string and cast the whole quorum.
- **`result` is the first place unauthenticated free text reaches a jsonb column.** Bounded to 2 000
  characters **server-side** (rejected at the page, never truncated), passed through
  `sanitizeObjectForPostgresql()` before the insert, stored as text and rendered escaped.
- **`flow_run.parentWaitpointId` and `dispatchIndex` both stay**; only the unique
  `(parentWaitpointId, dispatchIndex)` index goes, because dispatch idempotency is the signal claim now.
  `parentWaitpointId` is in the list-covering index that keeps batch children off the runs list; `dispatchIndex`
  is what the builder's per-click lookup and the "Batch N" label read **after** the barrier resolved and its
  signals were deleted.
- **Accepted cost: ~40k row writes per 10 000-signal barrier** — insert, claim, receive, delete — on top of
  the child runs themselves. Bounded, on a narrow table, and gone the moment the barrier resolves.
- **A returning approver still sees a bare "already responded".** Signals die with the release, so there is
  nothing left to tell them what they decided. Decision 000009's gap stays open.
- **The machinery ships able to carry K-of-N approvals; no approval piece is rewired yet.** Per-signal links
  and `reasonRequiredOn` exist now because retrofitting them means another migration.
- **A waiting step publishes `BarrierSummary` itself, with no per-step adapter — which is a breaking change
  for Process in Batches.** `expected` → `total`, `failedToDispatch` → `notDispatched`, `exceptions[]` →
  `signals[]` covering *every* awaited thing rather than only the failures, `rejected` split out of `failed`,
  and `notStarted` deleted (it was hardcoded `0`). The point is that an expression written against a waiting
  step does not break when what the step waits on changes. The cost is one entry in
  `docs/install/reference/breaking-changes.mdx` and a rewrite of the run detail's batch rail. Two fields the
  spec's shape omits are kept because the rail cannot work without them: `barrierId` (what its child-run
  queries key on) and `totalItems`/`batchSize` (the per-dot item ranges), spread around the summary.
  `canceled` is an eighth count for the same reason.
- **The release predicate is pure and lives in `core-execution`, not in the service.**
  `shouldReleaseBarrier({ policy, sealed, counts })` takes counts rather than issuing its own queries, so one
  `GROUP BY status` replaces up to three round-trips and the policy matrix is unit-testable without a
  database. The `EXISTS`-not-`COUNT(*)` note above is therefore no longer literal — the decision it encodes
  (take counts once, on a barrier being summarised) survives; the floor rule now reads the PENDING count out
  of the same grouped row set.
- **`policy` carries no deadline override.** The plan allowed "or the policy's shorter value"; nothing
  produces one, so `resolveDeadline()` is `now + AP_PAUSED_FLOW_TIMEOUT_DAYS` and takes no arguments. Add the
  field when a caller for it exists, not before.
- **The 2 000-character reason bound stays a handler check, not a request schema.** The confirm route is
  `app.all` serving an HTML form: a Zod `body` schema would also apply to the GET that renders the page, and
  a schema rejection returns JSON where the handler returns a themed 400. The bound is enforced server-side
  either way — this is about which response the browser gets.
