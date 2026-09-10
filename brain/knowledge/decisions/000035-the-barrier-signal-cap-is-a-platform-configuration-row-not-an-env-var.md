---
status: accepted
---

# The barrier signal cap is a platform configuration row, not an env var

## Decision

`AP_MAX_BARRIER_SIGNALS` becomes `maxBarrierSignals`, an `integer NOT NULL DEFAULT 10000` column on
`platform_configuration`, edited from a new `Limits` section on the Configurations page. The row is
authoritative and born from the env var, exactly as [000033](000033-platform-configuration-rows-are-authoritative-and-created-on-first-read.md)
does it. The env var survives only as the birth default for a platform that has no row yet.

Cloud is short-circuited **in the service**: `maxBarrierSignals({ platformId })` returns the system prop
and ignores the row when `edition === CLOUD`, the same shape `isProductTelemetryEnabled` already uses.
`platformId` is added to `CreateBarrierParams` so the caller supplies it rather than
`barrierService.create` resolving it from `projectId`. There is no unlimited value and no nullable
column.

## Context

The variable is new on `feat/barrier-service` and has never shipped: it is absent from `main`, from the
published env var table, and from every deploy surface. So this is a choice about where a dial lives
before release, with no upgrade path to protect, no breaking-change label and no docs migration.

Its only read site is `assertSignalCountWithinLimit` in `waitpoints/barrier-service.ts`, and
`barrierService.create` has no production caller yet, so the signature is free to change.

## Why

000033 draws a line that this decision deliberately walks up to: configurations hold behaviour,
`platform_plan` holds entitlements, and a **cap** is the `MAX_RECORDS_PER_TABLE` shape that decision
keeps off the page, because `POST /v1/platform-configurations` carries no edition guard and a limit
living there is a self-serve quota bypass the day the page stops being Cloud-hidden.

The cap goes there anyway because the bypass is closed where 000033 says invariants must be closed: in
the server, on the value. Hiding the page was never the enforcement, and the Cloud short-circuit in the
service makes the row unreadable as a cap on Cloud regardless of what an admin writes.

**Rejected: `platform_plan`.** It is the correct home for a limit that is sold, and it is CE-readable
via `platformService.getOneWithPlanOrThrow`. It was rejected because nobody sells barrier width, and a
plan column would put a self-hoster's own protective cap behind an entitlement they cannot edit.

**Rejected: env var as a `min(row, env)` ceiling.** It preserves an operator guarantee on a
multi-platform EE install, where a platform admin is not the operator and could raise a cap that
consumes shared Postgres and Redis. It was rejected as one concept too many for a case that does not
yet exist, and because it reintroduces the two-sources-of-truth shape 000033 rejected for telemetry.
This is the variant to revisit if multi-platform installs start mattering here.

## Consequences

- The error message must stop saying "raise `AP_MAX_BARRIER_SIGNALS`". It is read by a project member
  who may not be a platform admin, so it names the limit and the page without implying the reader can
  change it.
- `platformId` on `CreateBarrierParams` means every future caller has to hold platform scope. The
  waitpoints module already resolves it the other way in `resume-service.ts`
  (`projectService.getPlatformId`), so the two paths in one module now differ on purpose: the check runs
  before the transaction that inserts up to 10 000 signal rows, and the caller was cheaper to widen
  while it has no production implementation.
- **The number reaches the browser whether or not the builder uses it.** The GET response is the whole
  `PlatformConfiguration` object, and `TelemetryProvider` wraps the router and already caches that row
  for every signed-in user, so any builder component can read it with an existing hook and no new
  endpoint. Nothing is built on that now: no fan-out step exists, and the real fan-out shape dispatches
  over a runtime array, so a design-time count does not exist for the general case.
- Because Cloud ignores the row, the raw column is **not** the effective cap. Whoever adds a builder
  surface must serve a computed effective value rather than recompute the edition rule in the browser,
  which is how 000033's split-brain bug happened.
- **No `tryCatch` around the read, because every failure that could reach it is already fatal to
  `barrierService.create`.** Postgres down kills the transaction and the signal inserts, Redis down kills
  `enqueueEvaluation`, and the `distributedLock` is taken only on the create path, once per platform for
  the life of the install. Fail-closed is also the do-nothing option, so there is no code to write.
- Postgres only. There is no sqlite migration for `platform_configuration`.
