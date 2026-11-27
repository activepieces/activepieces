---
icon: 📊
---

# Analytics

Platform-level reporting on automation usage — daily run counts, active flows/users, and time-saved estimates — powering the "Impact" dashboard (`/impact`). Gated by the `analyticsEnabled` plan flag, which is on in every edition: the CE plan (`OPEN_SOURCE_PLAN`) and the free Autumn plan both set it.

### Entities & services

- **PlatformAnalyticsReport**: cached entity holding `runs` (daily `{flowId, day, runs}`), `flows` (enabled-flow metadata), `users`, plus `outdated` flag and `cachedAt`.
- `platform-analytics-report.service.ts`: `refreshReport`, `getOrGenerateReport`, `markAsOutdated`, and the per-user `getReportForUser` / `refreshReportForUser`.
- `pieces-analytics.service.ts`: separate daily service tracking per-piece usage.
- `AnalyticsTimePeriod`: LAST_WEEK / MONTH / THREE_MONTHS / SIX_MONTHS / YEAR.

### How it works

- `getOrGenerateReport` serves a cached report (5-min TTL, or sooner when `outdated`) filtered by time period. `refreshReport` runs under a distributed lock (400s), queries users + enabled flows + daily run counts (**PRODUCTION runs only**, child runs of a waitpoint excluded), and merges incrementally.
- **One report per platform, scoped per user.** Platform admins and operators get the whole report. Any other user gets only the flows, runs and users of the projects they belong to (`scopeReportForUser`).
- **Time saved**: `runs × flow.timeSavedPerRun`, where `timeSavedPerRun` is in **seconds**. Any user who can edit the flows of the project sets it in the Details tab (the `UPDATE_MINUTES_SAVED` flow operation), and the edit marks the report outdated.
- Pieces analytics (daily cron 12:00 UTC): for each enabled flow, extract piece steps, count unique projects per piece, write `pieceMetadata.usage = projectCount`.

### Gotchas

- All frontend queries include `enabled: platform.plan.analyticsEnabled` so they never fire when off.
- The "Refresh" button waits 5 s, calls the backend refresh, then invalidates all analytics query keys.
- The project picker on `/impact` filters the report in the browser; the server never filters by project for an admin.
- The Details table has no run count column: a flow's run count shows only through Total Time Saved (`runs × timeSavedPerRun`). The web field `minutesSaved` holds seconds, not minutes.
- An embedded user gets a 403 from every `/v1/analytics` endpoint.
- `flow_run.created` is when a run was admitted, not when its row was written: the runs metadata queue writes the row later, hours later on retry. So a `created > lastRefresh` cursor misses runs; each refresh recounts yesterday and today and replaces those day buckets (ENG-1004).
- Raw `DATE_TRUNC` rows come back from `pg` as a `Date`; convert with `dayjs(day).toISOString()` before using them as keys next to saved JSON strings (ENG-924).
- E2E: `scenarios/rail/impact.spec.ts` (run count, CE and EE) and `scenarios/ee/rail/impact.spec.ts` (project scoping). Assert the runs of the spec's own flow, never a platform total: other specs add runs at the same time.

### Key files

Entry point: `platformAnalyticsModule`, the Fastify plugin registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/analytics/` — backend module: controller, the two services, and the report entity
- `packages/core/shared/src/lib/management/analytics/` — shared zod schemas and enums (`AnalyticsTimePeriod`, `PlatformAnalyticsReport`, `AnalyticsReportRequest`)
- `packages/web/src/features/platform-admin/api/analytics-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/analytics-hooks.ts` — TanStack Query hooks (`platformAnalyticsHooks`)
- `packages/web/src/app/routes/impact/` — Impact dashboard: page root plus the summary, trends, and details sub-routes
- `packages/web/src/app/routes/impact/lib/` — aggregation and filter helpers; `impactRunsUtils.sumRunsByFlow` is the single run-count aggregation every consumer routes through

Paths verified 2026-11-22.
