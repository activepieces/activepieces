import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Platform model tiers plan gate', () => {
    it('blocks writes but keeps reads when the plan has no AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: false } })
        const key = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.CUSTOM,
            config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
        })

        const create = await ctx.post(TIERS, { name: 'Fast', emoji: '⚡', entries: [{ configId: key.id, modelId: 'gpt-4o' }] })
        const settings = await ctx.post(`${TIERS}/settings`, { aiSpecificModelsVisible: false })
        const list = await ctx.get(TIERS, { projectId: ctx.project.id })

        expect(create.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(settings.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(list.statusCode).toBe(StatusCodes.OK)
    })

    it('allows writes when the plan has AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: true } })
        const key = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.CUSTOM,
            config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
        })

        const create = await ctx.post(TIERS, { name: 'Fast', emoji: '⚡', entries: [{ configId: key.id, modelId: 'gpt-4o' }] })

        expect(create.statusCode).toBe(StatusCodes.OK)
    })
})

const TIERS = '/v1/platform-model-tiers'
