import { ActivepiecesAiConsumerSource, AiChargeBasis, AIProviderName, AiUsageEnvironment, AiUsageOrigin } from '@activepieces/core-utils'
import { ReportAiUsageRequest } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AiUsageDaily } from '../../../../src/app/ai/ai-usage-daily-entity'
import { aiUsageRollup } from '../../../../src/app/ai/ai-usage-rollup'
import { databaseConnection } from '../../../../src/app/database/database-connection'
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
})

function report({ projectId, agentId, environment = AiUsageEnvironment.PRODUCTION }: { projectId: string | null, agentId?: string, environment?: AiUsageEnvironment }): ReportAiUsageRequest {
    return {
        billing: {
            source: ActivepiecesAiConsumerSource.CHAT,
            platformId: ctx.platform.id,
            projectId,
            conversationId: 'conversation-1',
            context: { origin: AiUsageOrigin.CHAT, environment, ...(agentId ? { agentId } : {}) },
        },
        provider: AIProviderName.CUSTOM,
        modelId: 'in-house-model',
        idempotencyKey: 'idem',
        usage: { type: AiChargeBasis.USAGE_ONLY },
        inputTokens: 10,
        outputTokens: 4,
        observedCostUsd: 0.25,
    }
}

async function rows(): Promise<AiUsageDaily[]> {
    return databaseConnection().getRepository<AiUsageDaily>('ai_usage_daily').findBy({ platformId: ctx.platform.id })
}

describe('ai_usage_daily upsert', () => {
    it('adds two calls with the same dimensions into one row', async () => {
        await aiUsageRollup.record(report({ projectId: ctx.project.id }))
        await aiUsageRollup.record(report({ projectId: ctx.project.id }))

        const [row] = await rows()
        expect(row.calls).toBe(2)
        expect(Number(row.inputTokens)).toBe(20)
        expect(Number(row.outputTokens)).toBe(8)
        expect(row.reportedCostUsd).toBeCloseTo(0.5)
    })

    it('keeps a different agent and a test run in their own rows', async () => {
        await aiUsageRollup.record(report({ projectId: ctx.project.id }))
        await aiUsageRollup.record(report({ projectId: ctx.project.id, agentId: 'agent-2' }))
        await aiUsageRollup.record(report({ projectId: ctx.project.id, environment: AiUsageEnvironment.TESTING }))

        expect(await rows()).toHaveLength(3)
    })

    it('records chat that belongs to no project', async () => {
        await aiUsageRollup.record(report({ projectId: null }))
        await aiUsageRollup.record(report({ projectId: null }))

        const all = await rows()
        expect(all).toHaveLength(1)
        expect(all[0].projectId).toBeNull()
        expect(all[0].calls).toBe(2)
    })
})
