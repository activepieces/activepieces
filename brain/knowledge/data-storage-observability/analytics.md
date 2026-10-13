---
icon: 📊
---

# Analytics

Platform-level reporting on automation usage — daily run counts, active flows/users, and time-saved estimates — powering the "Impact" dashboard (`/impact`). Gated by the `analyticsEnabled` plan flag (EE/Cloud only, not in CE).

### Entities & services

- **PlatformAnalyticsReport**: cached entity holding `runs` (daily `{flowId, day, runs}`), `flows` (enabled-flow metadata), `users`, plus `outdated` flag and `cachedAt`.
- `platform-analytics-report.service.ts`: `refreshReport`, `getOrGenerateReport`, `markAsOutdated`.
- `pieces-analytics.service.ts`: separate daily service tracking per-piece usage.
- `AnalyticsTimePeriod`: LAST_WEEK / MONTH / THREE_MONTHS / SIX_MONTHS / YEAR.

### How it works

- `getOrGenerateReport` serves a cached report (5-min TTL) filtered by time period. `refreshReport` runs under a distributed lock (400s), queries users + enabled flows + daily run counts (**PRODUCTION runs only**), and merges incrementally.
- **Time saved**: `minutesSaved = runs × flow.timeSavedPerRun` (per-flow estimate in minutes, editable by the flow owner in the Details drill-down).
- Pieces analytics (daily cron 12:00 UTC): for each enabled flow, extract piece steps, count unique projects per piece, write `pieceMetadata.usage = projectCount`.

### Gotchas

- All frontend queries include `enabled: platform.plan.analyticsEnabled` so they never fire when off.
- The "Refresh" button invalidates all analytics query keys after calling the backend refresh.

### Key files

Entry point: `platformAnalyticsModule`, the Fastify plugin registered in `packages/server/api/src/app/app.ts`.

- `packages/server/api/src/app/analytics/` — backend module: controller, the two services, and the report entity
- `packages/core/shared/src/lib/management/analytics/` — shared zod schemas and enums (`AnalyticsTimePeriod`, `PlatformAnalyticsReport`, `AnalyticsReportRequest`)
- `packages/web/src/features/platform-admin/api/analytics-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/analytics-hooks.ts` — TanStack Query hooks (`platformAnalyticsHooks`)
- `packages/web/src/app/routes/impact/` — Impact dashboard: page root plus the summary, trends, and details sub-routes
- `packages/web/src/app/routes/impact/lib/` — aggregation and filter helpers; `impactRunsUtils.sumRunsByFlow` is the single run-count aggregation every consumer routes through

Paths verified 2026-07-17.
