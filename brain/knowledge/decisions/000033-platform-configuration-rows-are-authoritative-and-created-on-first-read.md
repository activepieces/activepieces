---
status: proposed
---

# Platform configuration rows are authoritative, and created on first read

## Decision

A new `platform_configuration` table holds admin-editable settings, one row per platform, one typed
column per setting — the same shape as `platform_plan` (1:1 with `platform`, `many-to-one`, cascade
delete). The first setting is `productAnalyticsEnabled`.

The migration creates the table and **nothing else — it seeds no rows**. A row is created lazily by
`getOrCreateForPlatform`, exactly as `platform_plan` does it: a cheap `findOneBy`, then a
`distributedLock` only on the create path. The row is created with `AP_TELEMETRY_ENABLED` as its
default, so **the env var is the default for a platform that has no row yet, not a one-time seed**.
Once the row exists, the env var is never consulted for that platform again and the platform admin UI
(Infrastructure → Configurations) is the only way to change it. The page is hidden on Cloud.

## Context

`AP_TELEMETRY_ENABLED` is one value per process, read once at module load in `telemetry.utils.ts`.
Self-hosters had no way to change it without an env edit and a restart, and no UI told them what was
collected. The wanted end state is a Configurations page that grows more dials over time.

A per-platform row is a deliberate mismatch with the env var's process-wide scope. It was chosen
anyway because every consumer turned out to have a platform in hand: `enterpriseFlagsHooks.modify`
already resolves a `platformId` per request (principal, else hostname) and overrides flags per
platform, which is how `THEME` and `EMAIL_AUTH_ENABLED` already work, and the server-side
`trackUser` / `trackProject` / `trackPlatform` sites all carry one.

## Why

Per-platform beat deployment-wide because the UI that edits it is per-platform, and because a
deployment-wide singleton edited from a tenant's admin page is a privilege leak on any instance
hosting more than one platform.

**No prefill beat a seeding migration.** Cloud's platform count puts a one-row-per-platform backfill
into hundreds of batched `INSERT`s inside a single migration transaction, to save a lookup the lazy
path performs anyway; it is also a second creation path that has to agree with the
first forever. Dropping it collapses "existing platform" and "new platform" into one case. The catch
is that it only works if the *creation* default reads the env var: with a hardcoded `true`, an
operator running `AP_TELEMETRY_ENABLED=false` would upgrade, have no row, and get telemetry switched
back **on** — the precise regression the seed existed to prevent. The insert reads
`AP_TELEMETRY_ENABLED` and omits the column when the variable is absent, so the fallback is the
schema's own `DEFAULT true` rather than a second `true` written in TypeScript — **though that omission
never actually happens today**, because `systemPropDefaultValues` already defaults the prop to `'true'`,
so `system.getBoolean` cannot return `undefined`. The column is always written explicitly and the
`?? true` in `filterProjectsWithProductAnalyticsEnabled` is unreachable. Both are deliberate belts: they
only start doing work if that systemProp default is ever removed.

**Env-as-default beat env-as-lock.** Env-as-lock (env var disables the switch when explicitly set) is not
a breaking change and preserves an air-gapped operator's guarantee, but it produces a UI with two
sources of truth and a disabled control that needs explaining. Seed-only keeps one source of truth.
Its cost is accepted openly: this is a **functional breaking change**, and an operator who set
`AP_TELEMETRY_ENABLED=false` for a compliance reason keeps the value through the upgrade but loses
the env var's enforcement afterwards.

**Typed columns beat key/value rows and a jsonb blob.** `platform_plan` already carries 49 typed
columns, the repo bans `any` and casting, and typed columns keep the zod schema honest against the
schema instead of against a registry that can drift. The cost is a migration per new setting, which
is cheap here.

## Consequences

- Needs the `⛓️‍💥 breaking-change` label, an entry in `docs/install/reference/breaking-changes.mdx`,
  and rewrites of `telemetry.mdx` and `environment-variables.mdx`.
- **The env var reaches past the code into deployment surfaces, which is what makes this breaking rather
  than internal.** `deploy/activepieces-helm/values.yaml` exposes `AP_TELEMETRY_ENABLED` as a
  configurable key and `deploy/pulumi/index.ts` sets it, so operators have it declared in infrastructure
  they own; after this change both merely seed a platform's first row. It is also `false` in `.env.dev`,
  `packages/server/api/.env.tests`, `packages/tests-e2e/.env.e2e`, both `tests-e2e-*` workflows,
  `benchmark/docker-compose.yml` and `benchmark/k8s-sandbox.yaml` — all of which keep working, because a
  row born `false` stays `false`.
- **On `main` the variable had three functional gates, and the browser was the biggest.**
  `telemetry.utils.ts` (one module-load boolean covering `identify` / `trackPlatform` / `trackProject` /
  `trackUser` / `isEnabled`, so *every* server event — auth, `flow.created`, both `mcp.*`, `run.created`),
  `flag.service.ts` republishing it as `ApFlagId.TELEMETRY_ENABLED` for the whole browser SDK (12 event
  names plus pageviews, autocapture, dead clicks, rageclick, heatmaps, session recording — most of
  Cloud's volume), and `template-telemetry.service.ts` reading it independently. The other two references
  were `system-validator.ts` (booleanValidator) and the `'true'` default in `system.ts`. The worker never
  read it. Anyone estimating the blast radius as "the auth, template and run events" undercounts it.
- **Every platform without a row still honours the env var, which supersedes an earlier call that new
  platforms should always default to on.** Because creation reads `AP_TELEMETRY_ENABLED`, a fresh
  install and a second platform on a `false` instance both start opted out. That is the opposite of
  the hardcoded-`true` default first chosen, and it is the reason no prefill is needed: the guarantee
  moves from "the migration copied your value" to "any row is born with your value".
- The env var therefore keeps having an effect for longer than a seeding design would imply: it
  governs each platform until that platform's row is created, which happens on its first flags read
  or admin visit. It is still a functional breaking change, because after that point editing the
  variable does nothing.
- Neither `flags.hooks.ts` nor `enterpriseFlagsHooks` is touched. An earlier plan added a per-platform
  flag override to both so `/v1/flags` could carry the value; removing `ApFlagId.TELEMETRY_ENABLED`
  outright made the hooks unnecessary and they were reverted to plain pass-throughs.
- `total_runs_per_day` stays ungated by design — it is the billing meter, and a customer must not be
  able to switch off their own metering. Only product analytics and (later) the setup report are
  switchable.
- **`ApFlagId.TELEMETRY_ENABLED` is removed entirely; the browser reads the configuration.** Keeping it
  as a delivery channel was the first plan and was rejected. The blocker looked structural —
  `TelemetryProvider` wraps the whole router, so `posthog.init` runs on the sign-in page before any
  principal exists, and `/v1/platform-configurations` is authenticated — but the resolution was to stop
  treating the pre-login window as a per-platform question. It only exists for **Cloud's own auth
  funnel** (`autocapture.url_allowlist` is exactly the sign-in/sign-up routes and is already `false`
  off-Cloud), so the browser initialises pre-login when `isNil(currentUser) && edition === CLOUD &&
  hostname === cloud.activepieces.com` — a constant, needing no lookup — and everywhere else waits for
  login and then reads the row. That avoided inventing a second public endpoint to answer what `/v1/flags`
  already answers. `GET /v1/platform-configurations` is widened to `publicPlatform` so any member can
  read it; `POST` stays admin-only.
- **The pre-login window is given up everywhere except `cloud.activepieces.com`, and that costs eight
  named events, not just page views.** Because the configuration query is `enabled: !isNil(currentUser)`,
  nothing pre-login can read it, so `posthog.init` never runs pre-login on self-hosted or on a Cloud
  custom domain. That drops `capture_pageview: 'history_change'` **and** every `capture()` from
  `features/authentication/components/` — `SIGN_IN_SUBMITTED`, `SIGN_IN_FAILED`, `SIGN_UP_SUBMITTED`,
  `SIGN_UP_FAILED`, `EMAIL_CODE_REJECTED`, `EMAIL_CODE_RESEND_REQUESTED`, `FEDERATED_LOGIN_STARTED`,
  `CAPTCHA_UNAVAILABLE` (plus `EMAIL_VERIFICATION_COMPLETED`) — all of which `main` sent whenever
  `AP_TELEMETRY_ENABLED` was true, since `/v1/flags` is unauthenticated and answered pre-login.
  Autocapture and session recording were already Cloud-only, so those are unaffected. Tell whoever owns
  the funnel dashboards: self-hosted and Cloud-custom-domain sign-in volume goes to zero, by design.
- **"Cloud is always on" is not enforced server-side, and the browser must not paper over that.**
  `POST /v1/platform-configurations` carries no edition guard, so a Cloud platform admin can still write
  `false` even though the page is hidden on Cloud. Making the invariant real means rejecting `update`
  (or forcing the response) on the Cloud edition — in the **server**, on the value. The first cut instead
  hard-wired the browser on for the whole session on `cloud.activepieces.com`, which produced a
  split-brain: server events stopped while `identify` (which sends email and names via
  `pickTelemetryPii` on Cloud), `group`, `capture`, autocapture, dead clicks, heatmaps and session
  recording all kept running — telling a customer we stopped and not stopping. It also made two Cloud
  platforms with identical settings behave differently by hostname, since a custom-domain tenant read the
  row and a main-domain tenant did not.
- **The pre-login override is gated on `isNil(currentUser)`, not on the hostname alone.** The only thing
  the browser genuinely cannot answer pre-login is "may I capture before a session exists", so that is
  all the constant decides:
  `isNil(currentUser) && edition === CLOUD && hostname === 'cloud.activepieces.com'`. The moment a user
  exists the row governs `init`, `identify` and `capture` for every tenant, main domain included. Written
  as a hostname test alone it reads like a narrow funnel exception and is actually a session-wide bypass
  that makes the row dead code on the main domain. Cost: a short window right after login where
  `currentUser` has arrived but the configuration request has not, during which `capture()` drops events;
  `identify` is only delayed, because its effect re-runs when the row lands. Leave that fail-closed —
  treating "still loading" as enabled would capture before consent is known.
- **`isProductAnalyticsEnabled` takes a required `platformId`; there is no optional parameter and no env
  fallback.** An event the backend cannot attribute to a platform cannot be gated by that platform's
  setting. Do not reintroduce an optional parameter that falls back to `AP_TELEMETRY_ENABLED` — that
  reads as a safe default and is really an unattributable event escaping the switch. The type is the
  enforcement: making it required surfaced all five call sites at compile time.
- **`trackUser` requires a platform; `trackIdentity` does not — because a `UserIdentity` outlives and
  precedes any platform.** A `User` row is per-platform, so `trackUser`, `trackProject`, `trackPlatform`
  and `identify` all take `platformId: string` and go through `isProductAnalyticsEnabled`. A
  `UserIdentity` is one row per email across every platform and exists before the first one, so
  `trackIdentity` takes `platformId: string | null`; when it is null the event is part of the pre-tenant
  auth funnel and is gated on **`edition === CLOUD`** — the server-side mirror of the browser's
  `isCloudAuthFunnel` constant, and the reason no env read is needed. Unattributed events carry no
  `groups`, so they never land on a platform they do not belong to.
- **An unattributed event is only safe if `null` really means "no platform exists" — resolve the platform before falling back to the edition.** `trackIdentity`'s null branch is gated on `edition === CLOUD`, which is sound only where null is unforgeable. It was not: `verifyCode` derives `preferredPlatformId` from the identity, so its null is genuine, but `requestCode` originally passed the *request's* `platformId` straight through, and on Cloud that is always null even for a long-established tenant. So `EMAIL_CODE_REQUESTED` sailed past the edition check and was sent for Cloud platforms that had `productAnalyticsEnabled: false` — the row existed, said no, and was never consulted. Both sites now call `authenticationService.resolvePreferredPlatformId` when the request carries no platform, so null means the same thing in both and the edition fallback is reached only when there is genuinely nothing to bypass. The lesson generalises past telemetry: a fallback keyed on "we could not identify the tenant" is only as trustworthy as the identification attempt that preceded it.
- **`platformId` is null on Cloud for *every* pre-login auth call, not just edge cases** — so a
  `!isNil(platformId)` guard at those sites silently deletes the whole Cloud sign-up funnel. Both
  `EMAIL_CODE_REQUESTED` and `EMAIL_CODE_VERIFIED` fire from unauthenticated routes where the principal
  is `PrincipalType.UNKNOWN`, and `platformUtils.getPlatformIdForRequest` **returns null unconditionally
  on Cloud** for a non-principal request — it never consults the hostname. Self-hosted is the opposite:
  it falls back to `getOldestPlatform()`, so a platform is in hand except on a fresh install before the
  first one exists. `EMAIL_CODE_VERIFIED`'s `needsNameStep: isNil(preferredPlatformId)` is precisely the
  brand-new-identity case, so guarding on a platform would have dropped every `true`.
- **Because rows are lazy, most platforms have no row — so any SQL filtering on a setting must
  `LEFT JOIN` and `COALESCE` to the env default, never `INNER JOIN` or a bare `WHERE`.** Nearly every
  platform is absent from this table until something reads it, so `WHERE "productAnalyticsEnabled" =
  true` silently excludes the majority and an `INNER JOIN` drops them entirely. The daily
  `RUN_TELEMETRY` job filters with
  `LEFT JOIN platform_configuration ... WHERE COALESCE(configuration."productAnalyticsEnabled", :fallback) = true`
  for exactly this reason. Filter there rather than per row: the job aggregates every project, so
  checking eligibility inside `trackProject` means a project and configuration lookup per row and a log
  line for events that are then dropped — the N+1 shape `packages/server/CLAUDE.md` forbids.
- **Configurations holds behaviour; `platform_plan` holds entitlements — never the same value in both.** A
  quota that is a plan grant (`usersLimit`, `activeFlowsLimit`) must not also be an admin-editable
  configuration, or a customer edits their own quota. This is why `MAX_RECORDS_PER_TABLE` /
  `MAX_FIELDS_PER_TABLE` look like obvious candidates for the page and are not: today it is hidden on Cloud so
  it is moot, but the day it is not, a limit in this table is a self-serve quota bypass.
- Moving any further env var here is not a schema change: `AP_TELEMETRY_ENABLED` was read **once at module
  load** in three separate places, and each read site had to be found and made platform-aware. Expect the same
  for the next one.
- The page configures **app-side** values only. Worker dials (`AP_EXECUTION_MODE`,
  `AP_WORKER_CONCURRENCY`, `AP_SANDBOX_MEMORY_LIMIT`) stay env vars; the worker has no path to read
  this table.
