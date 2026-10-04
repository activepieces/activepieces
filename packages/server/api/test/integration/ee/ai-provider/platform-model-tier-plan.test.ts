import { AIProviderName } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
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
        const list = await ctx.get(TIERS, { projectId: ctx.project.id })

        expect(create.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(list.statusCode).toBe(StatusCodes.OK)
    })

    it('lets a downgraded platform delete its last tier and then its key', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: true } })
        const key = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.CUSTOM,
            config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
        })
        const tier = (await ctx.post(TIERS, { name: 'Fast', emoji: '⚡', entries: [{ configId: key.id, modelId: 'gpt-4o' }] })).json()
        await databaseConnection().getRepository('platform_plan').update({ platformId: ctx.platform.id }, { aiProvidersEnabled: false })

        const keyWhileUsed = await ctx.delete(`/v1/ai-providers/${key.id}`)
        const deleteTier = await ctx.delete(`${TIERS}/${tier.id}`)
        const deleteKey = await ctx.delete(`/v1/ai-providers/${key.id}`)

        expect(keyWhileUsed.statusCode).toBe(StatusCodes.CONFLICT)
        expect(deleteTier.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(deleteKey.statusCode).toBe(StatusCodes.NO_CONTENT)
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
