# Analytics

## Summary
The Analytics module provides platform-level reporting on automation usage: daily run counts, active flow counts, active user counts, and time-saved estimates. It powers an "Impact" dashboard for project-level drill-down and a "Leaderboard" view that ranks projects and users by automation output. Reports are cached with a 5-minute TTL and refreshed via a distributed-lock background job; a separate daily cron tracks per-piece usage across all flows.

## Key Files
- `packages/server/api/src/app/analytics/` — backend module (controller, two services, entity)
- `packages/shared/src/lib/management/analytics/index.ts` — all shared Zod schemas and enums (`AnalyticsTimePeriod`, `PlatformAnalyticsReport`, `ProjectLeaderboardItem`, `UserLeaderboardItem`, etc.)
- `packages/web/src/features/platform-admin/api/analytics-api.ts` — frontend API client
- `packages/web/src/features/platform-admin/hooks/analytics-hooks.ts` — TanStack Query hooks (`platformAnalyticsHooks`)
- `packages/web/src/app/routes/impact/index.tsx` — Impact page root
- `packages/web/src/app/routes/impact/summary/index.tsx` — summary metrics (active flows, users, runs, time saved)
- `packages/web/src/app/routes/impact/trends/index.tsx` — time-series area charts
- `packages/web/src/app/routes/impact/details/index.tsx` — per-flow drill-down with editable time-saved
- `packages/web/src/app/routes/leaderboard/index.tsx` — leaderboard page root
- `packages/web/src/app/routes/leaderboard/projects-leaderboard.tsx` — projects leaderboard table
- `packages/web/src/app/routes/leaderboard/users-leaderboard.tsx` — users leaderboard table

## Edition Availability
- **Community (CE)**: Not available — gated behind `analyticsEnabled` plan flag.
- **Enterprise (EE)**: Available when `analyticsEnabled` is true on the platform plan.
- **Cloud**: Available when `analyticsEnabled` is true on the platform plan.

## Domain Terms
- **PlatformAnalyticsReport**: Cached entity holding daily run aggregations, enabled-flow metadata, and user list for a platform.
- **AnalyticsTimePeriod**: Enum for time windows (`LAST_WEEK`, `LAST_MONTH`, `LAST_THREE_MONTHS`, `LAST_SIX_MONTHS`, `LAST_YEAR`).
- **timeSavedPerRun**: Per-flow estimate (in minutes) of manual time saved per automation run; editable by the flow owner.
- **minutesSaved**: Derived metric = `runs × timeSavedPerRun`; displayed on leaderboards and impact summary.
- **outdated**: Boolean flag on the report entity indicating a background refresh is needed.
- **Pieces analytics**: Separate service that counts how many projects actively use each piece and updates `pieceMetadata.usage`.

## Entities

**PlatformAnalyticsReport**: id, platformId, cachedAt, outdated (boolean), runs (AnalyticsRunsUsageItem[]), flows (AnalyticsFlowReportItem[]), users (UserWithMetaInformation[]).

- `AnalyticsRunsUsageItem`: `{ flowId, day: Date, runs: number }` — daily aggregation
- `AnalyticsFlowReportItem`: `{ flowId, flowName, projectId, projectName, ownerId }` — enabled flows

## Pieces Analytics (`pieces-analytics.service.ts`)

**Scheduled**: Daily cron at 12:00 UTC

Tracks which pieces are actively used:
1. For each enabled flow → get published version → extract piece steps
2. Group by piece → count unique projects using each piece
3. Update `pieceMetadata.usage = projectCount`

## Platform Report Service (`platform-analytics-report.service.ts`)

**Key methods**:
- `refreshReport(platformId)` — distributed lock (400s), queries users + enabled flows + daily run counts (PRODUCTION only), merges incrementally. Stored as entity.
- `getOrGenerateReport(platformId, timePeriod?)` — returns cached report (5-min TTL), filters by time period
- `getProjectLeaderboard(platformId, timePeriod)` — groups flows by project, calculates minutes saved
- `getUserLeaderboard(platformId, timePeriod)` — groups flows by owner, calculates minutes saved
- `markAsOutdated(platformId)` — flags report for refresh

## Time Periods

`AnalyticsTimePeriod`: LAST_WEEK, LAST_MONTH, LAST_THREE_MONTHS, LAST_SIX_MONTHS, LAST_YEAR

Minutes saved = runs count × flow.timeSavedPerRun

## Leaderboard

**Users**: rank, userName, email, flowCount, minutesSaved, badges[]
**Projects**: rank, projectName, flowCount, minutesSaved

Displayed at `/leaderboard` in frontend with time period selector + search + time-saved range filter.

## Gating

`analyticsEnabled` plan flag. Module uses `platformMustHaveFeatureEnabled((p) => p.plan.analyticsEnabled)`.

## Frontend

All analytics queries in `platformAnalyticsHooks` include `enabled: platform.plan.analyticsEnabled` to prevent firing when the feature is off. The Impact page (`/impact`) is split into Summary, Trends, and Details sub-routes. The Leaderboard page (`/leaderboard`) shows separate tabs for projects and users, each with a time period picker. A "Refresh" button triggers `useRefreshAnalytics` mutation which calls the backend refresh endpoint and invalidates all analytics query keys.
