---
status: accepted
---

# Platform usage counts are reported to PostHog only, not pushed to Autumn


## Context

A daily job (`billing-usage-report-service.ts`, `reportAllPlatforms`) aggregates per-platform usage
counts — active flows, team projects, active users — for every licensed platform. Until this decision
the job had two sinks: a PostHog `total_runs_per_day` snapshot event (read by the console's usage
cards) and an Autumn push (`reportUsageCounts` on the billing provider → `balances.update` per
feature) meant to populate the usage column next to each limit in the Autumn dashboard.

The Autumn leg never worked and nothing consumed it:

- The instance holds only a **customer-scoped** Autumn key, and scoped tokens are allowlisted to
  `check`, `track`, `customers.get`, and `entities.get` (per Autumn's `keys.mint` docs).
  `balances.update` is not callable with one — the same 403 already recorded in decision 000013 for the
  abandoned seat-usage backstop. The client is constructed with `failOpen: true`, so the failing
  writes were swallowed silently.
- Enforcement never reads Autumn-side usage: limits are projected from plan grants
  (`mapAutumnFeaturesToPlatformPlan` reads `granted`), and the checks run against the AP database
  (decision 000013). Seat billing reads `includedGrant`/`prepaidGrant`, never usage.
- The console's usage views read the PostHog snapshots, not Autumn.

## Decision

Report usage counts to **PostHog only**. The Autumn leg is removed end-to-end: `reportUsageCounts`
is dropped from the `BillingProvider` interface (and its CE no-op and Autumn implementation), and
`setUsage`/`balances.update` is dropped from the instance-side Autumn client wrapper
(`autumnUtils.client`).

## Consequences

- The Autumn dashboard shows no usage next to `activeFlowsLimit` / `teamProjectsLimit` /
  `usersLimit` for a customer. Support and sales read usage from the console's instance-reported
  usage cards (PostHog-backed) instead.
- One less silently-failing network call per platform per day; the PostHog capture in the same loop
  is unchanged.
- If Autumn-side usage is ever wanted, the scoped-key-compatible options are a read-then-`track`
  delta (both operations are on the scoped-token allowlist) or proxying `balances.update` through
  the console's master key — rejected for now as pure cost with no consumer.
