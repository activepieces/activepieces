---
status: accepted
---

# Credit gating fails open on an unknown balance; a cold cache is single-flighted, a stale one is served

## Context

The credit gate sits on hot paths that must not depend on a third party being reachable: the worker
RPC `submitPayloads` consults `shouldBlockOnCredits` for every production run it admits, and chat and
managed-AI calls consult `assertCreditsAndAppSumoNotExceeded`. The balance behind the gate originates
from Autumn (`getCustomer`, via a customer-scoped key) and is cached in Redis for an hour
(`CREDITS_CACHE_TTL_SECONDS`); `billingEnforced` is cached separately for a day.

So the gate is routinely asked to decide with **no** balance in hand: first access for a platform,
after the cache TTL expires, after a Redis flush, or while Autumn/the console is unreachable. "No
data" and "zero remaining" are different states, and conflating them turns a billing-provider outage
into an outage of every customer's automations.

## Decision

**An unknown balance never blocks.** Three independent layers each default to "allow", so no single
mistake closes the gate:

- `isBillingEnforced` is a plain Redis read with `?? false` — a missing or never-synced key means not
  enforced.
- `toCreditsGateState` requires a **non-nil** balance to consider credits exhausted
  (`!isNil(balance) && !balance.unlimited && remaining <= 0`), so `null` → `blocked: false`.
- A failed fetch returns `null` rather than throwing: the inline fetch is wrapped in `tryCatch` and
  logs `'Failed to fetch credits gate snapshot; failing open'`.

Credit *tracking* is likewise non-fatal — `trackCredits` rethrows non-duplicate errors, but no caller
lets that surface: `flow-run-hooks#onFinish` wraps both the per-run credit and the AI-usage tracker in
`tryCatch` and warns, and chat fires its tracker through `rejectedPromiseHandler`. A dead Autumn
cannot fail a run or a chat turn.

Reading the balance uses **two different strategies depending on whether the caller already has a
value**, and neither one lets Autumn latency reach the request:

- **Cold miss → block, but single-flight.** `fetchCreditsDeduped` takes a per-platform distributed
  lock (`customer_state_fetch_<platformId>`, 15s) and **re-reads the cache inside the lock**. The
  winner calls Autumn once and writes the cache; every waiter finds the cache populated and returns
  without its own call. N concurrent misses on a busy platform collapse to one `getCustomer` across
  all API instances, instead of one per queued run.
- **A confirmed absence is cached too** (`platform_plan:customer-state-miss:<platformId>`, 60s).
  Single-flighting only helps when the fetch *produces* a cacheable balance. A platform with no Autumn
  credentials, or a customer with no `apCredits` balance, writes nothing — so before the marker every
  admission re-took the lock and re-asked, forever, for exactly the platforms where the gate is a no-op
  (self-hosted EE that never enrolled). The marker is written **after** the fetch confirms the absence,
  never before the call: a thrown error (Autumn down, timeout) leaves no marker, so the next admission
  retries instead of remembering an outage as "this platform has no customer".
- **`getCustomer` carries an explicit 5s `timeoutMs`.** `check`/`track` inherit the SDK default, but the
  customer read did not, so an unbounded call sat inside the distributed lock above — the one place where
  a hang blocks other runs rather than just the caller.
- **Stale hit (older than `CREDITS_REFETCH_PERIOD_MS`, 180s) → serve immediately.** No lock, no
  waiting: the cached value is returned and a background refresh is fired through
  `rejectedPromiseHandler` + a `runOnceWithin` debounce (60s). Callers that already hold a value never
  block on a refresh.

Two deliberate exceptions, both of which still fail open on an *unknown* balance:

- AppSumo credits block on a **known** exhausted balance regardless of `billingEnforced` — a lifetime
  grant has no renewal to wait for.
- Chat and managed-AI hard-block (402) on known exhaustion, where flow runs would only be
  `QUOTA_EXCEEDED`-marked.

## Consequences

- During an Autumn outage, an enforced platform with an exhausted balance keeps running flows and
  spending managed AI. That leakage is accepted; the in-flight backstop is the OpenRouter key's own
  monthly cap (decision 000016), and enforcement resumes on the next successful refresh.
- Redis, not Autumn, is the gate's hard dependency — and if Redis is down the queues are down anyway,
  so the gate is never the weakest link.
- `packages/server/api/test/unit/app/ee/platform-plan/credits-gate.test.ts` pins the invariant
  (`toCreditsGateState(null, true).blocked === false`, and the AppSumo equivalent). Keep those cases:
  they are what stops a future "unknown means unpaid" change from passing review, since nothing else
  exercises an unreachable Autumn.

## Rejected

- **Fail closed on an unknown balance.** Converts a third-party or Redis-cache outage into a full
  automation outage for every customer, including those well inside their limits. Billing accuracy is
  recoverable after the fact; a day of unrun flows is not.
- **Blocking refresh when the cached value is stale.** Puts an Autumn round-trip on the run-admission
  path for one request every 180s per platform, with no benefit — 3-minute-old credit data cannot
  change an admission decision that the next refresh will correct.
- **Reading the balance from Autumn per request** (no cache): the request-path rule for all
  entitlement reads, see `brain/wiki/platform/ee-platform-plans-billing.md`.
