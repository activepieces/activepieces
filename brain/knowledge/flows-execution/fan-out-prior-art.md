---
title: Fan-out prior art
icon: 🧭
---

# Fan-out prior art

What n8n, Make, Zapier, Temporal, Inngest and Trigger.dev actually do about batched fan-out, and which of
their *stated reasons* transfer to us. Gathered while charting the `PROCESS_IN_BATCHES` container that will be the
first caller of the [fan-in barrier](./fan-in-entry-points.md). Read this before re-deciding concurrency,
per-batch retry, quota or nesting — these questions have been answered five times already, and the reasons
transfer even where the numbers do not.

## The split that explains everything

The six platforms do not divide into no-code versus code. They divide on **whether a unit of work is a
first-class durable run record**:

- **Yes** — Zapier (each loop iteration *is* a Zap run), Trigger.dev (each batch item gets its own run),
  Temporal (each child has its own history and status), n8n's sub-workflow path.
- **No** — Make's Iterator (bundles inside one run), n8n's Loop Over Items (iterations inside one run).

Per-unit retry, per-unit observability and per-unit billing all *fall out of* that choice rather than being
built on top of it. Zapier never shipped "replay one iteration" — it shipped "one iteration is a run" and
inherited replay from the surface it already had. Our batch children are real `flow_run` rows, so we are in the
first camp by construction and inherit the same things.

## What transfers

- **Key-scoped concurrency, not a declared scope.** Temporal (Fairness Keys, GA), Inngest and Trigger.dev
  independently converged on: a **user-supplied runtime key**, a **platform-defined static limit**, **two
  stacked caps** (per-key *and* global), and **queue rather than reject**. Inngest and Trigger.dev both
  materialise a virtual queue per distinct key value and dequeue by weighted selection over message age, queue
  size and free capacity. For a multi-tenant platform `projectId` is the natural default key. Trigger.dev v4
  deliberately *removed* a dynamic per-trigger limit while keeping the key dynamic — the limit is static on
  purpose.
- **A per-key cap alone doesn't bound the platform; a global cap alone doesn't bound a tenant.** Hence both.
- **A waiting parent must not hold a concurrency slot.** Trigger.dev's stated reason: it *"prevents environment
  deadlocks where all concurrency slots would be occupied by waiting tasks"* — the failure mode
  [decision 000015](../../decisions/000015-fan-in-is-an-event-driven-waitpoint-barrier.md) avoids by pausing on
  the barrier.
- **A dynamic batch size is safe only if the batching decision is persisted at dispatch, never re-derived on
  re-entry.** Nobody re-derives. Inngest freezes the size in static config because it re-enters; Trigger.dev
  allows a fully dynamic caller-supplied array because the batch is materialised once and each item is
  immediately durable.
- **Caps are justified by storage and payload bounds, not throughput.** Temporal caps *pending* children at 2000
  because *"Each in-progress Activity generates a metadata entry in the Workflow Execution's mutable state. Too
  many entries … causes unstable persistence"* — the same class of limit as our runs-metadata bottleneck. Nobody
  defaults large either: n8n 1, Make 2, Inngest 5–100.
- **The container step is free; the work inside it bills.** Unanimous across all six.
- **Quota exhaustion should hold work as replayable, not discard it.** Zapier holds and lets you replay once
  tasks free up; Make's `OperationsLimitExceededError` is fatal and disables the scenario outright.
- **A publish-time nesting ban only holds if the child-call path is closed too.** Zapier bans a second Looping
  step at turn-on *and* bans loops inside Sub-Zaps. Blocking lexical nesting alone is not blocking nesting.
- **Retry attempts multiply with nesting depth, not add.** Inngest, verbatim: *"If A invokes B which invokes C,
  which invokes D, on failure D would be run 27 times (`retryCount^n`)"*.

## Gotchas

- **Nothing in the industry re-attaches a retried child to a closed parent aggregate.** n8n's parent
  re-attachment on child retry is undocumented; Zapier's independent Sub-Zap replay is undocumented; Make's
  per-bundle retry has no parent aggregate to re-attach to; Temporal can reset a child but the parent is code
  the developer must write to tolerate it. Retrying a child is cheap and well-precedented — updating a *sealed
  barrier's summary* afterwards has no prior art anywhere. Assume you are inventing it.
- **n8n exempts child executions from its concurrency cap** (*"It doesn't apply to … sub-workflow executions"*)
  **and from quota**, so a parent fanning out to 10,000 children consumes one slot and one billed run. Its
  fan-out is metered by nothing but instance memory, and no reason is given. This is the failure shape to avoid,
  shipped in production by our nearest comparable.
- **A concurrency cap set too low is its own failure mode.** n8n: *"Setting low concurrency values with a large
  numbers of workers can exhaust your database's connection pool, leading to processing delays and failures."*
  Same substrate as ours (BullMQ + Postgres) — the connection cost is paid whether or not the worker is busy.
- **Wide fan-out causes self-inflicted downstream rate limits on the first attempt, not just on retry.** Make
  caps parallel retries at 3 per scenario for exactly this reason. Zapier is the counter-example: loops are
  unconditionally parallel with no cap at any scope, and nothing sits between the fan-out and the third-party
  API — a standing complaint against it.
- **Silent truncation past a cap is a data-loss footgun.** Zapier clamps a loop to 500 and ignores the remainder
  with no documented error. Fail loudly instead.
- **Make encourages unbounded child nesting with no recursion guard**, and because its call/return plumbing is
  free there is no economic brake either. The only accidental bound is the Free plan's 2-active-scenario cap,
  which its docs never present as one.
- **Per-unit run rows and a usable runs list are in tension at fan-out scale.** Zapier guarantees 60 days of run
  history and displays at most 10,000 runs, so one 500-iteration loop spends 500 of that budget.
- **Temporal's answers are library answers.** Its customer is the developer, so per-child cost pass-through and
  undocumented limits are acceptable there and are not acceptable in a hosted product where the payer did not
  write the workflow. Take its stated reasons; discard its silence as precedent.
- **Nobody sizes fan-out width to the orchestrator's own concurrency — every published sizing input is a
  ceiling on something else.** Zero of six. Memory (n8n, *"process 200 rows with each execution"*), downstream
  rate limits (Make, *"up to 20 records per run is recommended"*), event-history stability (Temporal), payload
  bytes (Inngest, Trigger.dev). Temporal states the relationship in the *opposite* direction — *"More concurrent
  operations require more Workers"*, i.e. grow capacity to fit the work — and AWS Step Functions Distributed Map
  aims its advice at the **downstream** service. The structural consequence: a ceiling ("do not exceed X")
  composes with a static default, a target ("aim for X") does not. Prefer ceiling-shaped guidance.
- **No vendor publishes an observed typical fan-out width, and the general case is far narrower than the
  ceilings suggest.** Zero of six state a median. Documented ceilings cluster at 500–2,000 while vendor-
  *recommended* widths run 10–20× lower, which brackets the real case at tens to low hundreds. The one
  revealed-preference signal: Trigger.dev raised its batch cap 100 → 500 → 1,000 and has not raised it since.
  Design for hundreds; treat five figures as the tail, not the target.
- **No platform with a genuine wait-for-all puts a meaningful default deadline on the aggregate.** Temporal is
  unbounded and advises against setting one, Inngest is 1 year, Trigger.dev's `maxDuration` explicitly *excludes*
  the wait, Zapier hangs in `Delayed` indefinitely. Real deadlines bound the whole run instead — Make 40 min,
  and n8n's maximum settable run timeout is exactly 3,600 s, the same figure our `FAN_IN_DEFAULT_TIMEOUT_HOURS`
  fallback reached independently.
- **Available concurrency is surfaced at *read* time on a runtime surface, never in the builder.** Two of six
  ship it: n8n renders live active-execution count against the effective limit on the executions tab;
  Trigger.dev exposes a dashboard Queues page plus `queues.list()` / `queues.retrieve()` (`running`, `queued`,
  `concurrencyLimit`, `concurrency.current`), and models the movement explicitly with a base limit, a 2.0× burst
  factor and an override record. The lesson is that read-time evaluation — not declining to render — is what
  makes a moving figure safe to show. A build-time integer is stale the moment capacity shifts, and nobody
  publishes one.

## Where the detail lives

Per-platform files with every claim cited to a primary source sit under
`.scratch/parallel-loop/research/` (n8n, Make, Zapier, Temporal, Inngest + Trigger.dev, plus `SYNTHESIS.md`).
That directory is gitignored and local-only, so this page carries the transferable substance rather than
pointing at it. Vendor docs drift fast — several of the sources contradicted themselves at read time
(2026-08-04), so re-verify a specific number before betting on it.
