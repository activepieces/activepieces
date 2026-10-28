import { isNil, tryCatch } from '@activepieces/core-utils'
import { onCallService, wideEvent } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { transaction } from '../../core/db/transaction'
import { databaseConnection } from '../../database/database-connection'
import { distributedStore, redisConnections } from '../../database/redis-connections'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { billingProvider, UsageEvent } from '../../platform/billing-provider'
import { AiUsageBlock } from './ai-usage-block'
import { aiUsageRollup, CopiedUsageEvent } from './ai-usage-rollup'

async function platformsToCopy(): Promise<PlatformCursor[]> {
    const rows: { platformId: string, copiedUntilMs: string | null }[] = await databaseConnection().query(`
        SELECT pp."platformId", (extract(epoch FROM c."copiedUntil") * 1000)::bigint AS "copiedUntilMs"
        FROM "platform_plan" pp
        LEFT JOIN "ai_usage_copy_cursor" c ON c."platformId" = pp."platformId"
        WHERE pp."autumnCustomerId" IS NOT NULL AND pp."autumnApiKey" IS NOT NULL AND pp."aiProvidersEnabled" = true
        ORDER BY c."copiedUntil" ASC NULLS FIRST`)
    return rows.map((row) => ({ platformId: row.platformId, copiedUntilMs: isNil(row.copiedUntilMs) ? null : Number(row.copiedUntilMs) }))
}

async function copyPlatform({ platform, log, deadlineMs }: { platform: PlatformCursor, log: FastifyBaseLogger, deadlineMs: number }): Promise<PlatformOutcome> {
    if (isNil(platform.copiedUntilMs)) {
        await databaseConnection().query(
            'INSERT INTO "ai_usage_copy_cursor" ("platformId", "copiedUntil", "startedAt") VALUES ($1, to_timestamp($2::float8 / 1000), to_timestamp($2::float8 / 1000)) ON CONFLICT DO NOTHING',
            [platform.platformId, Date.now()],
        )
        return { ...EMPTY_OUTCOME, started: true }
    }
    const redis = await redisConnections.useExisting()
    const savedWindowMs = Number(await redis.get(windowKeyOf(platform.platformId)))
    const windowMs = savedWindowMs > 0 ? savedWindowMs : WINDOW_MS
    return copyWindows({ platformId: platform.platformId, fromMs: platform.copiedUntilMs, untilMs: Date.now() - VISIBILITY_DELAY_MS, windowMs, log, deadlineMs, outcome: EMPTY_OUTCOME })
}

async function copyWindows({ platformId, fromMs, untilMs, windowMs, log, deadlineMs, outcome }: CopyWindowsParams): Promise<PlatformOutcome> {
    const endMs = Math.min(untilMs, fromMs + windowMs)
    if (endMs <= fromMs || Date.now() > deadlineMs) {
        return { ...outcome, lagMs: Date.now() - fromMs }
    }
    const maxPages = endMs - fromMs <= MIN_WINDOW_MS ? Infinity : MAX_PAGES_PER_WINDOW
    const { data: read, error } = await tryCatch(() => readWindow({ platformId, startMs: fromMs, endMs, log, maxPages }))
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, '[aiUsageCopy] Could not read usage events from Autumn, will retry this window next run')
        return { ...outcome, attempted: true, failed: true, lagMs: Date.now() - fromMs }
    }
    if (isNil(read)) {
        const smallerWindowMs = Math.max(MIN_WINDOW_MS, Math.floor((endMs - fromMs) / 2))
        await saveWindow({ platformId, windowMs: smallerWindowMs })
        return copyWindows({
            platformId,
            fromMs,
            untilMs,
            windowMs: smallerWindowMs,
            log,
            deadlineMs,
            outcome: { ...outcome, attempted: true },
        })
    }
    const { events, skipped } = usageEventsOf({ platformId, raw: read.events, startMs: fromMs, endMs })
    const moved = await writeWindow({ platformId, fromMs, endMs, events })
    if (!moved) {
        return { ...outcome, lagMs: Date.now() - fromMs }
    }
    const quietFullWindow = read.pages <= 1 && endMs - fromMs === windowMs
    const nextWindowMs = quietFullWindow ? Math.min(WINDOW_MS, windowMs * 2) : windowMs
    if (nextWindowMs !== windowMs) {
        await saveWindow({ platformId, windowMs: nextWindowMs })
    }
    return copyWindows({
        platformId,
        fromMs: endMs,
        untilMs,
        windowMs: nextWindowMs,
        log,
        deadlineMs,
        outcome: { ...outcome, attempted: true, windows: outcome.windows + 1, copied: outcome.copied + events.length, skipped: outcome.skipped + skipped },
    })
}

async function readWindow({ platformId, startMs, endMs, log, maxPages }: ReadWindowParams): Promise<{ events: UsageEvent[], pages: number } | null> {
    const pages: UsageEvent[][] = []
    let cursor: string | null = null
    do {
        if (pages.length >= maxPages) {
            return null
        }
        const page = await billingProvider.get(log).listUsageEvents({ platformId, startMs, endMs, cursor })
        pages.push(page.events)
        cursor = page.nextCursor
    } while (!isNil(cursor))
    return { events: pages.flat(), pages: pages.length }
}

async function saveWindow({ platformId, windowMs }: { platformId: string, windowMs: number }): Promise<void> {
    const redis = await redisConnections.useExisting()
    if (windowMs >= WINDOW_MS) {
        await redis.del(windowKeyOf(platformId))
        return
    }
    await redis.set(windowKeyOf(platformId), windowMs, 'EX', SMALLER_WINDOW_TTL_SECONDS)
}

function usageEventsOf({ platformId, raw, startMs, endMs }: { platformId: string, raw: UsageEvent[], startMs: number, endMs: number }): { events: UsageEventWithRun[], skipped: number } {
    const unique = [...new Map(raw.filter((event) => event.timestamp >= startMs && event.timestamp < endMs).map((event) => [event.id, event])).values()]
    const events = unique.flatMap((event) => {
        const parsed = AiUsageBlock.safeParse(event.properties['usage'])
        return parsed.success ? [{ platformId, timestampMs: event.timestamp, block: parsed.data }] : []
    })
    return { events, skipped: unique.length - events.length }
}

async function writeWindow({ platformId, fromMs, endMs, events }: { platformId: string, fromMs: number, endMs: number, events: UsageEventWithRun[] }): Promise<boolean> {
    return transaction(async (entityManager) => {
        const moved: { updated: number }[] = await entityManager.query(CURSOR_CAS_SQL, [endMs, platformId, fromMs])
        if (Number(moved[0]?.updated ?? 0) !== 1) {
            return false
        }
        const runIds = [...new Set(events.flatMap((event) => isNil(event.block.runId) ? [] : [event.block.runId]))].sort()
        const newRunRows: { runId: string }[] = runIds.length === 0
            ? []
            : await entityManager.query(NEW_RUNS_SQL, [runIds])
        await aiUsageRollup.write({ entityManager, events: markFirstOfRun({ events, newRunIds: new Set(newRunRows.map((row) => row.runId)) }) })
        return true
    })
}

function markFirstOfRun({ events, newRunIds }: { events: UsageEventWithRun[], newRunIds: Set<string> }): CopiedUsageEvent[] {
    const credited = new Set<string>()
    return [...events].sort((a, b) => a.timestampMs - b.timestampMs).map((event) => {
        const runId = event.block.runId
        const firstOfRun = !isNil(runId) && newRunIds.has(runId) && !credited.has(runId)
        if (firstOfRun) {
            credited.add(runId)
        }
        return { ...event, firstOfRun }
    })
}

function windowKeyOf(platformId: string): string {
    return `ai-usage:copy:window:${platformId}`
}

async function trackAllFailedRuns({ allFailed, log }: { allFailed: boolean, log: FastifyBaseLogger }): Promise<void> {
    const redis = await redisConnections.useExisting()
    if (!allFailed) {
        await redis.del(ALL_FAILED_COUNT_KEY)
        return
    }
    const failures = await redis.incr(ALL_FAILED_COUNT_KEY)
    await redis.expire(ALL_FAILED_COUNT_KEY, ALL_FAILED_COUNT_TTL_SECONDS)
    if (failures < FAILURES_BEFORE_PAGE) {
        return
    }
    await distributedStore.runOnceWithin(PAGE_KEY, PAGE_EVERY_SECONDS, () =>
        onCallService(log, system.get(AppSystemProp.PAGE_ONCALL_WEBHOOK)).page({
            code: 'AI_USAGE_COPY_FAILING',
            message: `AI_USAGE_COPY could not read usage from Autumn for any platform ${failures} runs in a row, so the AI usage page is falling behind.`,
            params: { failures },
        }),
    )
}

const VISIBILITY_DELAY_MS = 2 * 60 * 1000
const WINDOW_MS = 10 * 60 * 1000
const MIN_WINDOW_MS = 1000
const MAX_PAGES_PER_WINDOW = 3
const SMALLER_WINDOW_TTL_SECONDS = 60 * 60
const RUN_BUDGET_MS = 40_000
const PLATFORM_CONCURRENCY = 5
const ALL_FAILED_COUNT_KEY = 'ai-usage:copy:all-failed-runs'
const ALL_FAILED_COUNT_TTL_SECONDS = 60 * 60
const FAILURES_BEFORE_PAGE = 5
const PAGE_KEY = 'ai-usage:page:AI_USAGE_COPY_FAILING'
const PAGE_EVERY_SECONDS = 30 * 60
const EMPTY_OUTCOME: PlatformOutcome = { started: false, attempted: false, failed: false, windows: 0, copied: 0, skipped: 0, lagMs: 0 }
const CURSOR_CAS_SQL = `WITH moved AS (
    UPDATE "ai_usage_copy_cursor" SET "copiedUntil" = to_timestamp($1::float8 / 1000)
    WHERE "platformId" = $2 AND (extract(epoch FROM "copiedUntil") * 1000)::bigint = $3::bigint
    RETURNING 1
) SELECT count(*)::int AS "updated" FROM moved`
const NEW_RUNS_SQL = `INSERT INTO "ai_usage_run" ("runId")
    SELECT unnest($1::varchar[]) ORDER BY 1
    ON CONFLICT DO NOTHING
    RETURNING "runId"`

export const aiUsageCopy = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const startedAt = Date.now()
        const platforms = await platformsToCopy()
        const limit = pLimit(PLATFORM_CONCURRENCY)
        const outcomes = await Promise.all(platforms.map((platform) => limit(() => copyPlatform({ platform, log, deadlineMs: startedAt + RUN_BUDGET_MS }))))
        const attempted = outcomes.filter((outcome) => outcome.attempted)
        const failed = attempted.filter((outcome) => outcome.failed).length
        wideEvent.set({
            aiUsageCopy: {
                platforms: platforms.length,
                started: outcomes.filter((outcome) => outcome.started).length,
                windows: outcomes.reduce((sum, outcome) => sum + outcome.windows, 0),
                copied: outcomes.reduce((sum, outcome) => sum + outcome.copied, 0),
                skipped: outcomes.reduce((sum, outcome) => sum + outcome.skipped, 0),
                attempted: attempted.length,
                failed,
                maxLagMs: outcomes.reduce((max, outcome) => Math.max(max, outcome.lagMs), 0),
                durationMs: Date.now() - startedAt,
            },
        })
        await trackAllFailedRuns({ allFailed: attempted.length > 0 && failed === attempted.length, log })
    },
})

type PlatformCursor = {
    platformId: string
    copiedUntilMs: number | null
}

type PlatformOutcome = {
    started: boolean
    attempted: boolean
    failed: boolean
    windows: number
    copied: number
    skipped: number
    lagMs: number
}

type UsageEventWithRun = Omit<CopiedUsageEvent, 'firstOfRun'>

type ReadWindowParams = {
    platformId: string
    startMs: number
    endMs: number
    log: FastifyBaseLogger
    maxPages: number
}

type CopyWindowsParams = {
    platformId: string
    fromMs: number
    untilMs: number
    windowMs: number
    log: FastifyBaseLogger
    deadlineMs: number
    outcome: PlatformOutcome
}
