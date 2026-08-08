---
status: accepted
---

# Credit gating fails open on an unknown balance, and decides from cache only

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
- `computeCreditState` requires a **non-nil** balance to consider credits exhausted
  (`!isNil(balance) && !balance.unlimited && remaining <= 0`), so `null` → `blocked: false`.
- A failed fetch returns `null` rather than throwing: the inline fetch is wrapped in `tryCatch` and
  logs `'Failed to fetch credits gate snapshot; failing open'`.
- A cache **read** that times out or throws also fails open, with `enforced: false` on both features —
  so a degraded Redis cannot block, only under-enforce.

Credit *tracking* is likewise non-fatal — `trackCredits` rethrows non-duplicate errors, but no caller
lets that surface: `flow-run-hooks#onFinish` wraps both the per-run credit and the AI-usage tracker in
`tryCatch` and warns, and chat fires its tracker through `rejectedPromiseHandler`. A dead Autumn
cannot fail a run or a chat turn.

**The gate itself never fetches.** `computeCreditsAndAppSumoState` reads `billingEnforced` and the two
balance keys concurrently, races that against `CREDITS_CACHE_READ_TIMEOUT_MS` (25 ms), and returns.
Everything else — a cold cache, a stale one, a cached zero that may have been topped up since — is
handed to `scheduleCreditsCacheMaintenance`, which fires `refreshCredits` through
`rejectedPromiseHandler` under a single `runOnceWithin` debounce
(`CUSTOMER_STATE_REFRESH_DEBOUNCE_SECONDS`, 15s). The timeout exists because the shared Redis client
sets `maxRetriesPerRequest: null` (BullMQ requires it) and no `commandTimeout`, so a command issued
during a reconnect can sit in the offline queue indefinitely — without the race, every webhook would
hang there.

One case is deliberately *not* scheduled: a cache read that timed out or threw. The refresh path needs
the same Redis that just failed, so its debounce cannot hold, and every request would fan out a
`resolveClientForPlatform` (Postgres) plus a `getCustomer` (Autumn HTTP) while the store is degraded.
Redis recovering is what fixes it; the next successful read schedules the refresh normally.

Reads that are **not** on the gate path still fetch inline, and Autumn latency is bounded there by
single-flighting rather than by a timeout:

- **Cold miss → block, but single-flight.** `fetchCreditsDeduped` — now reached only via
  `resolveCreditsCache` for `getConsumablesUsage`, i.e. the billing UI — takes a per-platform distributed
  lock (`customer_state_fetch_<platformId>`, 15s) and **re-reads the cache inside the lock**. The
  winner calls Autumn once and writes the cache; every waiter finds the cache populated and returns
  without its own call. N concurrent misses on a busy platform collapse to one `getCustomer` across
  all API instances, instead of one per queued run.
- **A confirmed absence is cached too** (`platform_plan:customer-state-miss:<platformId>`, 60s).
  Single-flighting only helps when the fetch *produces* a cacheable balance. A platform with no Autumn
  credentials, or a customer with no `apCredits` balance, writes nothing — so before the marker every
  admission re-took the lock and re-asked, forever, for exactly the platforms where the gate is a no-op
  (self-hosted EE that never enrolled). The marker is written **after** the fetch confirms the absence,
  never before the call: a thrown error (Autumn down, timeout) leaves no marker, so the next request
  retries instead of remembering an outage as "this platform has no customer".
- **`getCustomer` carries an explicit 5s `timeoutMs`.** `check`/`track` inherit the SDK default, but the
  customer read did not, so an unbounded call sat inside the distributed lock above — the one place where
  a hang blocks other runs rather than just the caller.
- **Stale hit (older than `CREDITS_REFETCH_PERIOD_MS`, 180s) → serve immediately.** No lock, no
  waiting: the cached value is returned and a background refresh is fired through
  `rejectedPromiseHandler` + a `runOnceWithin` debounce. Callers that already hold a value never block
  on a refresh.

Two deliberate exceptions, both of which still fail open on an *unknown* balance:

- AppSumo credits block on a **known** exhausted balance regardless of `billingEnforced` — a lifetime
  grant has no renewal to wait for.
- Chat and managed-AI hard-block (402) on known exhaustion, where flow runs would only be
  `QUOTA_EXCEEDED`-marked.

### Self-hosted EE skips the run gate entirely (temporary)

`shouldBlockRunOnCredits` returns `false` immediately when `AP_EDITION=ee`, before any provider call.
That one branch covers every flow-run credit gate — run admission from the worker RPC
(`submitPayloads`), the webhook path, `startManualTrigger`, and the retry assert all funnel through it.
Cloud is unaffected; CE already resolved to the no-op default provider.

The reason is **latency, not policy**, and the original cost is largely gone: when this branch was added,
a cold cache took a distributed lock and waited on an Autumn `getCustomer` (5s timeout) on the admission
path, repeated every 60s for exactly the platforms that never enrolled. The cache-only rewrite removed
that entirely — the gate is now two Redis round-trips bounded at 25 ms with no lock and no Autumn call.
What is left is those two round-trips per admission, on a box where Redis sits next to a single API
process and the answer is always "allow".

This is a stopgap. Remove the edition branch once the gate can answer from in-process state (an
in-memory TTL cache in front of Redis, or an enrollment flag resolved once at platform load) so an
unenrolled platform costs nothing per run. Until then, an enrolled self-hosted EE platform is not
credit-gated on flow runs — usage is still tracked, only enforcement is off.

## Consequences

- During an Autumn outage, an enforced platform with an exhausted balance keeps running flows and
  spending managed AI. That leakage is accepted; the in-flight backstop is the OpenRouter key's own
  monthly cap (decision 000016), and enforcement resumes on the next successful refresh.
- Redis, not Autumn, is the gate's hard dependency — and if Redis is down the queues are down anyway,
  so the gate is never the weakest link.
- Because the refresh is background, the request that discovers a cached zero is still blocked. An
  enforced platform that tops up keeps producing `QUOTA_EXCEEDED` runs for up to the debounce window
  (15s) instead of paying an inline Autumn call to find out. Re-verifying inline is what was given up:
  it cost a RedLock acquire that retries every 200 ms for up to its full TTL when contended, plus a
  `getCustomer`, on the webhook path.
- Self-hosted EE run admission does no billing I/O at all, so an EE box needs neither Redis credit keys
  nor Autumn reachability to start a flow. Chat and managed-AI keep their gates on every edition.
- `packages/server/api/test/unit/app/ee/platform-plan/credits-gate.test.ts` pins the invariant
  (`computeCreditState({ balance: null, enforced: true }).blocked === false`, and the AppSumo
  equivalent), plus fail-open on a failed cache read and the fact that the failed read schedules no
  refresh. Keep those cases: they are what stops a future "unknown means unpaid" change from passing
  review, since nothing else exercises an unreachable Autumn.

## Rejected

- **Fail closed on an unknown balance.** Converts a third-party or Redis-cache outage into a full
  automation outage for every customer, including those well inside their limits. Billing accuracy is
  recoverable after the fact; a day of unrun flows is not.
- **Blocking refresh when the cached value is stale.** Puts an Autumn round-trip on the run-admission
  path for one request every 180s per platform, with no benefit — 3-minute-old credit data cannot
  change an admission decision that the next refresh will correct.
- **Treating a stale balance as unknown so it passes.** Tempting as a way to drop the read timeout: a
  slow or absent read could then just be waved through. But nothing refreshes the cache except an
  arriving request, so any platform whose traffic is sparser than `CREDITS_REFETCH_PERIOD_MS` (180s)
  presents a stale balance on nearly every request, and an exhausted one would get a free run each
  time. Staleness governs only whether a refresh is *scheduled* — never whether the gate blocks. A
  stale exhausted balance blocks exactly like a fresh one.
- **Scheduling a refresh when the cache read failed.** The refresh needs the Redis that just failed, so
  its debounce cannot hold and each request would hit Postgres and Autumn directly. See above.
- **Reading the balance from Autumn per request** (no cache): the request-path rule for all
  entitlement reads, see `brain/platform-editions-ee/ee-platform-plans-billing.md`.
