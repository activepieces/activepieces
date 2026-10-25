import { ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin, apId } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { aiUsageFlush } from '../../../../src/app/ai/usage/ai-usage-flush'
import { AI_USAGE_STREAM_KEY, aiUsageIngest } from '../../../../src/app/ai/usage/ai-usage-ingest'
import { aiUsageRetention } from '../../../../src/app/ai/usage/ai-usage-retention'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
}, 300_000)

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app)
    const redis = await redisConnections.useExisting()
    await redis.del(AI_USAGE_STREAM_KEY)
    await databaseConnection().query('DELETE FROM "ai_usage_ingest_cursor"')
})

function stepReport({ flowRunId = apId(), idempotencyKey = apId(), observedCostUsd = 0.01 }: { flowRunId?: string, idempotencyKey?: string, observedCostUsd?: number }): ReportAiUsageRequest {
    return {
        billing: {
            source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            flowRun: { flowId: 'flow-1', flowRunId },
            context: { origin: AiUsageOrigin.FLOW_STEP, environment: AiUsageEnvironment.PRODUCTION, flowRunId, flowId: 'flow-1' },
        },
        provider: AIProviderName.OPENAI,
        modelId: 'gpt-5',
        idempotencyKey,
        usage: { type: AiChargeBasis.FIXED_CREDITS, credits: 1 },
        inputTokens: 100,
        outputTokens: 20,
        observedCostUsd,
    }
}

async function ingest(reports: ReportAiUsageRequest[]): Promise<void> {
    for (const report of reports) {
        await aiUsageIngest(app.log).ingest(report)
    }
}

async function totals(table: 'ai_usage_5m' | 'ai_usage_daily'): Promise<{ calls: number, runs: number, spend: number }> {
    const rows: { calls: string, runs: string, spend: string }[] = await databaseConnection().query(
        `SELECT coalesce(sum("calls"), 0) AS calls, coalesce(sum("runs"), 0) AS runs, coalesce(sum("spendUsd"), 0) AS spend FROM "${table}" WHERE "platformId" = $1`,
        [ctx.platform.id],
    )
    return { calls: Number(rows[0].calls), runs: Number(rows[0].runs), spend: Number(rows[0].spend) }
}

describe('AI usage pipeline: ingest then flush', () => {
    it('writes every reported call into both tables, empties the stream and moves the cursor', async () => {
        await ingest([stepReport({}), stepReport({}), stepReport({})])

        await aiUsageFlush(app.log).run()

        expect(await totals('ai_usage_5m')).toEqual({ calls: 3, runs: 3, spend: expect.closeTo(0.03, 9) })
        expect(await totals('ai_usage_daily')).toEqual({ calls: 3, runs: 3, spend: expect.closeTo(0.03, 9) })
        const redis = await redisConnections.useExisting()
        expect(await redis.xlen(AI_USAGE_STREAM_KEY)).toBe(0)
        const cursor: { lastId: string }[] = await databaseConnection().query('SELECT "lastId" FROM "ai_usage_ingest_cursor" WHERE "shard" = 0')
        expect(cursor[0].lastId).not.toBe('0-0')
    })

    it('counts a retried report once, since the retry carries the same key', async () => {
        const idempotencyKey = apId()
        await ingest([stepReport({ idempotencyKey }), stepReport({ idempotencyKey })])

        await aiUsageFlush(app.log).run()

        expect((await totals('ai_usage_daily')).calls).toBe(1)
    })

    it('counts a flow run once, however many AI calls it makes', async () => {
        const flowRunId = apId()
        await ingest([stepReport({ flowRunId }), stepReport({ flowRunId }), stepReport({ flowRunId })])

        await aiUsageFlush(app.log).run()

        expect(await totals('ai_usage_daily')).toMatchObject({ calls: 3, runs: 1 })
    })

    it('counts each call once when two flushes run at the same time', async () => {
        await ingest(Array.from({ length: 20 }, () => stepReport({})))

        await Promise.all([aiUsageFlush(app.log).run(), aiUsageFlush(app.log).run()])

        expect((await totals('ai_usage_daily')).calls).toBe(20)
    })

    it('skips a malformed entry and still writes the rest', async () => {
        const redis = await redisConnections.useExisting()
        await ingest([stepReport({})])
        await redis.xadd(AI_USAGE_STREAM_KEY, '*', 'e', '{"not":"an event"}', 'r', '0')
        await ingest([stepReport({})])

        await aiUsageFlush(app.log).run()

        expect((await totals('ai_usage_daily')).calls).toBe(2)
        expect(await redis.xlen(AI_USAGE_STREAM_KEY)).toBe(0)
    })

    it('a later flush picks up only what arrived after the previous one', async () => {
        await ingest([stepReport({})])
        await aiUsageFlush(app.log).run()
        await ingest([stepReport({}), stepReport({})])

        await aiUsageFlush(app.log).run()

        expect((await totals('ai_usage_daily')).calls).toBe(3)
    })
})

describe('AI usage retention', () => {
    it('deletes 5-minute rows older than three days and keeps recent ones', async () => {
        await ingest([stepReport({})])
        await aiUsageFlush(app.log).run()
        await databaseConnection().query(
            `INSERT INTO "ai_usage_5m" ("bucket", "seriesId", "platformId", "provider", "modelId", "origin", "environment", "calls")
             VALUES (now() - interval '4 days', 'old-series-000000000000000000000', $1, 'openai', 'gpt-5', 'FLOW_STEP', 'PRODUCTION', 7)`,
            [ctx.platform.id],
        )

        await aiUsageRetention.run()

        expect((await totals('ai_usage_5m')).calls).toBe(1)
    })
})
