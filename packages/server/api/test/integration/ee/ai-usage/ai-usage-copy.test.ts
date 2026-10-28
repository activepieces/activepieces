import { AIProviderName, AiUsageEnvironment, AiUsageOrigin, apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AiUsageBlock } from '../../../../src/app/ai/usage/ai-usage-block'
import { aiUsageCopy } from '../../../../src/app/ai/usage/ai-usage-copy'
import { aiUsageRetention } from '../../../../src/app/ai/usage/ai-usage-retention'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { autumnBillingProvider } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-billing'
import { billingProvider, ListUsageEventsParams, UsageEvent } from '../../../../src/app/platform/billing-provider'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext
let autumn: FakeAutumn

beforeAll(async () => {
    app = await setupTestEnvironment()
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    autumn = { events: new Map(), failing: false }
    const fake = autumn
    billingProvider.set((log) => ({
        ...autumnBillingProvider(log),
        listUsageEvents: async (params: ListUsageEventsParams) => listFrom({ autumn: fake, params }),
    }))
    ctx = await createCopiedPlatform()
})

function listFrom({ autumn: source, params }: { autumn: FakeAutumn, params: ListUsageEventsParams }): { events: UsageEvent[], nextCursor: string | null } {
    if (source.failing) {
        throw new Error('autumn is down')
    }
    const inRange = (source.events.get(params.platformId) ?? []).filter((event) => event.timestamp >= params.startMs && event.timestamp < params.endMs)
    const offset = Number(params.cursor ?? '0')
    const page = inRange.slice(offset, offset + PAGE_SIZE)
    return { events: page, nextCursor: offset + PAGE_SIZE < inRange.length ? String(offset + PAGE_SIZE) : null }
}

async function createCopiedPlatform({ aiProvidersEnabled = true }: { aiProvidersEnabled?: boolean } = {}): Promise<TestContext> {
    const created = await createTestContext(app, { plan: { aiProvidersEnabled } })
    await databaseConnection().query(
        'UPDATE "platform_plan" SET "autumnCustomerId" = $2, "autumnApiKey" = $3 WHERE "platformId" = $1',
        [created.platform.id, `cus_${apId()}`, 'am_sk_test'],
    )
    return created
}

async function startCursorAt({ platformId, minutesAgo }: { platformId: string, minutesAgo: number }): Promise<void> {
    const atMs = Date.now() - minutesAgo * MINUTE_MS
    await databaseConnection().query(
        'INSERT INTO "ai_usage_copy_cursor" ("platformId", "copiedUntil", "startedAt") VALUES ($1, to_timestamp($2::float8 / 1000), to_timestamp($2::float8 / 1000)) ON CONFLICT ("platformId") DO UPDATE SET "copiedUntil" = to_timestamp($2::float8 / 1000)',
        [platformId, atMs],
    )
}

function block(overrides: Partial<AiUsageBlock> = {}): AiUsageBlock {
    return {
        v: 1,
        origin: AiUsageOrigin.FLOW_STEP,
        environment: AiUsageEnvironment.PRODUCTION,
        projectId: ctx.project.id,
        flowId: 'flow-1',
        agentId: null,
        userId: null,
        runId: null,
        provider: AIProviderName.OPENAI,
        providerConfigId: null,
        modelId: 'gpt-5',
        inputTokens: 100,
        outputTokens: 20,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
        reportedCostUsd: 0.01,
        estimatedCostUsd: 0,
        managedCredits: 0,
        unpriced: false,
        ...overrides,
    }
}

function addEvent({ minutesAgo, properties, platformId = ctx.platform.id }: { minutesAgo: number, properties: Record<string, unknown>, platformId?: string }): void {
    const events = autumn.events.get(platformId) ?? []
    autumn.events.set(platformId, [...events, { id: `evt_${apId()}`, timestamp: Date.now() - minutesAgo * MINUTE_MS, properties }])
}

async function dailyTotals(platformId = ctx.platform.id): Promise<{ calls: number, runs: number, spend: number, managedCredits: number }> {
    const rows: { calls: number, runs: number, spend: number, managedCredits: number }[] = await databaseConnection().query(
        `SELECT coalesce(sum("calls"), 0)::int AS "calls", coalesce(sum("runs"), 0)::int AS "runs",
            coalesce(sum("spendUsd"), 0)::float8 AS "spend", coalesce(sum("managedCredits"), 0)::float8 AS "managedCredits"
         FROM "ai_usage_daily" WHERE "platformId" = $1`,
        [platformId],
    )
    return rows[0]
}

async function fiveMinuteCalls(platformId = ctx.platform.id): Promise<number> {
    const rows: { calls: number }[] = await databaseConnection().query('SELECT coalesce(sum("calls"), 0)::int AS "calls" FROM "ai_usage_5m" WHERE "platformId" = $1', [platformId])
    return rows[0].calls
}

describe('AI usage copy from Autumn', () => {
    it('starts a platform at the current time on its first run, without copying older events', async () => {
        addEvent({ minutesAgo: 30, properties: { usage: block() } })

        await aiUsageCopy(app.log).run()

        const cursor: { copiedUntil: Date, startedAt: Date }[] = await databaseConnection().query('SELECT "copiedUntil", "startedAt" FROM "ai_usage_copy_cursor" WHERE "platformId" = $1', [ctx.platform.id])
        expect(cursor).toHaveLength(1)
        expect(Date.now() - new Date(cursor[0].startedAt).getTime()).toBeLessThan(MINUTE_MS)
        expect((await dailyTotals()).calls).toBe(0)
    })

    it('copies usage events into both tables and skips events without a usage block', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 30 })
        addEvent({ minutesAgo: 25, properties: { source: 'ai', usage: block({ provider: AIProviderName.ACTIVEPIECES, reportedCostUsd: 0.002, managedCredits: 4 }) } })
        addEvent({ minutesAgo: 15, properties: { source: 'ai_usage', usage: block({ reportedCostUsd: 0, estimatedCostUsd: 0.003 }) } })
        addEvent({ minutesAgo: 10, properties: { source: 'flow_run', flowId: 'flow-1' } })
        addEvent({ minutesAgo: 1, properties: { usage: block() } })

        await aiUsageCopy(app.log).run()

        const totals = await dailyTotals()
        expect(totals.calls).toBe(2)
        expect(totals.spend).toBeCloseTo(0.005, 9)
        expect(totals.managedCredits).toBe(4)
        expect(await fiveMinuteCalls()).toBe(2)
    })

    it('copies events whose null ids Autumn dropped', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 10 })
        const stored = Object.fromEntries(Object.entries(block()).filter(([, value]) => value !== null))
        addEvent({ minutesAgo: 5, properties: { source: 'ai', usage: stored } })

        await aiUsageCopy(app.log).run()

        expect((await dailyTotals()).calls).toBe(1)
    })

    it('counts a run once, credited to its earliest call, even across windows', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 30 })
        const runId = apId()
        addEvent({ minutesAgo: 28, properties: { usage: block({ runId }) } })
        addEvent({ minutesAgo: 27, properties: { usage: block({ runId }) } })
        addEvent({ minutesAgo: 12, properties: { usage: block({ runId }) } })

        await aiUsageCopy(app.log).run()

        expect(await dailyTotals()).toMatchObject({ calls: 3, runs: 1 })
    })

    it('keeps the cursor when Autumn fails and catches up on the next run', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 20 })
        addEvent({ minutesAgo: 15, properties: { usage: block() } })
        autumn.failing = true

        await aiUsageCopy(app.log).run()
        expect((await dailyTotals()).calls).toBe(0)

        autumn.failing = false
        await aiUsageCopy(app.log).run()
        expect((await dailyTotals()).calls).toBe(1)
    })

    it('counts every event once when two runs overlap', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 30 })
        addEvent({ minutesAgo: 25, properties: { usage: block() } })
        addEvent({ minutesAgo: 5, properties: { usage: block() } })

        await Promise.all([aiUsageCopy(app.log).run(), aiUsageCopy(app.log).run()])

        expect((await dailyTotals()).calls).toBe(2)
    })

    it('reads every page of a busy window', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 12 })
        Array.from({ length: PAGE_SIZE * 2 + 3 }, () => addEvent({ minutesAgo: 8, properties: { usage: block() } }))

        await aiUsageCopy(app.log).run()

        expect((await dailyTotals()).calls).toBe(PAGE_SIZE * 2 + 3)
    })

    it('splits a window with too many pages instead of getting stuck on it', async () => {
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 12 })
        Array.from({ length: PAGE_SIZE * 7 }, (_, index) => addEvent({ minutesAgo: 11.5 - index * 0.4, properties: { usage: block() } }))

        await aiUsageCopy(app.log).run()

        expect((await dailyTotals()).calls).toBe(PAGE_SIZE * 7)
        const savedWindowMs = Number(await (await redisConnections.useExisting()).get(`ai-usage:copy:window:${ctx.platform.id}`))
        expect(savedWindowMs).toBeGreaterThan(0)
        expect(savedWindowMs).toBeLessThan(10 * MINUTE_MS)
    })

    it('grows a small saved window back once reads are quiet', async () => {
        const redis = await redisConnections.useExisting()
        await redis.set(`ai-usage:copy:window:${ctx.platform.id}`, 1000, 'EX', 3600)
        await startCursorAt({ platformId: ctx.platform.id, minutesAgo: 3 })
        addEvent({ minutesAgo: 2.5, properties: { usage: block() } })

        await aiUsageCopy(app.log).run()

        expect((await dailyTotals()).calls).toBe(1)
        expect(Number(await redis.get(`ai-usage:copy:window:${ctx.platform.id}`))).toBeGreaterThan(1000)
    })

    it('leaves platforms without AI providers alone', async () => {
        const other = await createCopiedPlatform({ aiProvidersEnabled: false })

        await aiUsageCopy(app.log).run()

        const cursor = await databaseConnection().query('SELECT 1 FROM "ai_usage_copy_cursor" WHERE "platformId" = $1', [other.platform.id])
        expect(cursor).toHaveLength(0)
    })

    it('forgets run ids after a day', async () => {
        const oldRun = apId()
        const freshRun = apId()
        await databaseConnection().query('INSERT INTO "ai_usage_run" ("runId", "seenAt") VALUES ($1, now() - interval \'25 hours\'), ($2, now())', [oldRun, freshRun])

        await aiUsageRetention.run()

        const left: { runId: string }[] = await databaseConnection().query('SELECT "runId" FROM "ai_usage_run" WHERE "runId" = ANY($1)', [[oldRun, freshRun]])
        expect(left.map((row) => row.runId)).toEqual([freshRun])
    })
})

const MINUTE_MS = 60 * 1000
const PAGE_SIZE = 3

type FakeAutumn = {
    events: Map<string, UsageEvent[]>
    failing: boolean
}
