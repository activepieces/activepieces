import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('AI usage plan gate', () => {
    it('refuses every usage view when the plan has no AI providers', async () => {
        const ctx = await createTestContext(app, { plan: { aiProvidersEnabled: false } })
        const query = { period: '30d', scope: 'production' }

        const overview = await ctx.get('/v1/ai-usage/overview', query)
        const items = await ctx.get('/v1/ai-usage/items', { ...query, dimension: 'flow' })
        const detail = await ctx.get('/v1/ai-usage/items/project/no-project', query)

        expect(overview.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(items.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(detail.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })

    it('serves usage views when the plan has AI providers', async () => {
        const ctx = await createTestContext(app, { plan: { aiProvidersEnabled: true } })
        const overview = await ctx.get('/v1/ai-usage/overview', { period: '30d', scope: 'production' })
        expect(overview.statusCode).toBe(StatusCodes.OK)
    })
})
