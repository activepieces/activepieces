import { apId } from '@activepieces/core-utils'
import { PrincipalType, ProjectAiCreditUsage } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
})

async function reportUsage({ context, cost, model = 'openai/gpt-5' }: { context: TestContext, cost: number, model?: string }) {
    const engineToken = await generateMockToken({
        id: apId(),
        type: PrincipalType.ENGINE,
        platform: { id: context.platform.id },
        projectId: context.project.id,
    })
    return app!.inject({
        method: 'POST',
        url: '/api/v1/ai-credit-usage',
        headers: {
            authorization: `Bearer ${engineToken}`,
        },
        body: {
            provider: 'activepieces',
            model,
            cost,
        },
    })
}

describe('AI Credit Usage API', () => {
    describe('POST /v1/ai-credit-usage', () => {
        it('records engine-reported usage and aggregates same-day same-model calls', async () => {
            const first = await reportUsage({ context: ctx, cost: 0.005 })
            expect(first.statusCode).toBe(StatusCodes.NO_CONTENT)

            const second = await reportUsage({ context: ctx, cost: 0.002 })
            expect(second.statusCode).toBe(StatusCodes.NO_CONTENT)

            const response = await ctx.get('/v1/ai-credit-usage')
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body: ProjectAiCreditUsage[] = response.json()
            expect(body).toHaveLength(1)
            expect(body[0].projectId).toBe(ctx.project.id)
            expect(body[0].projectName).toBe(ctx.project.displayName)
            expect(body[0].credits).toBeCloseTo(7)
            expect(body[0].creditsThisMonth).toBeCloseTo(7)
        })

        it('rejects reports from USER tokens', async () => {
            const response = await ctx.post('/v1/ai-credit-usage', {
                provider: 'activepieces',
                model: 'openai/gpt-5',
                cost: 0.005,
            })
            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('rejects negative cost', async () => {
            const response = await reportUsage({ context: ctx, cost: -1 })
            expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })

    describe('GET /v1/ai-credit-usage', () => {
        it('only returns usage of the requesting platform', async () => {
            const otherCtx = await createTestContext(app!)
            await reportUsage({ context: ctx, cost: 0.001 })
            await reportUsage({ context: otherCtx, cost: 0.05 })

            const response = await ctx.get('/v1/ai-credit-usage')
            expect(response.statusCode).toBe(StatusCodes.OK)
            const body: ProjectAiCreditUsage[] = response.json()
            expect(body).toHaveLength(1)
            expect(body[0].projectId).toBe(ctx.project.id)
            expect(body[0].credits).toBeCloseTo(1)
        })

        it('returns an empty list when nothing was recorded', async () => {
            const response = await ctx.get('/v1/ai-credit-usage')
            expect(response.statusCode).toBe(StatusCodes.OK)
            expect(response.json()).toEqual([])
        })
    })
})
