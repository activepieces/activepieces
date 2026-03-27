# Analytics Module

Platform-level analytics reporting, pieces usage tracking, and leaderboards.

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

`AnalyticsTimePeriod`: LAST_WEEK, LAST_MONTH, LAST_QUARTER, LAST_YEAR

Minutes saved = runs count × flow.timeSavedPerRun

## Leaderboard

**Users**: rank, userName, email, flowCount, minutesSaved, badges[]
**Projects**: rank, projectName, flowCount, minutesSaved

Displayed at `/leaderboard` in frontend with time period selector + search + time-saved range filter.

## Gating

`analyticsEnabled` plan flag. Module uses `platformMustHaveFeatureEnabled((p) => p.plan.analyticsEnabled)`.
