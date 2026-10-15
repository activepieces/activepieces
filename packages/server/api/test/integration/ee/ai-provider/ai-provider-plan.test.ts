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

describe('AI provider keys plan gate', () => {
    it('refuses creating and updating keys but still deletes them when the plan has no AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: false } })
        const key = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.CUSTOM,
            config: CUSTOM_CONFIG,
        })

        const create = await ctx.post(KEYS, { provider: AIProviderName.CUSTOM, displayName: 'New key', config: CUSTOM_CONFIG, auth: { apiKey: 'test-key' } })
        const update = await ctx.post(`${KEYS}/${key.id}`, { displayName: 'Renamed key', config: CUSTOM_CONFIG, auth: { apiKey: 'test-key' } })
        const remove = await ctx.delete(`${KEYS}/${key.id}`)

        expect(create.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(update.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(remove.statusCode).toBe(StatusCodes.NO_CONTENT)
    })

    it('moves chat back to the managed key when the plan has no AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: false } })
        const managed = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.ACTIVEPIECES, enabledForChat: false })
        const key = await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.CUSTOM, config: CUSTOM_CONFIG, enabledForChat: true })

        const update = await ctx.post(`${KEYS}/${managed.id}`, { displayName: 'Activepieces', enabledForChat: true })
        const managedAfter = await databaseConnection().getRepository('ai_provider').findOneByOrFail({ id: managed.id })
        const keyAfter = await databaseConnection().getRepository('ai_provider').findOneByOrFail({ id: key.id })

        expect(update.statusCode).toBe(StatusCodes.OK)
        expect(managedAfter.enabledForChat).toBe(true)
        expect(keyAfter.enabledForChat).toBe(false)
    })

    it('allows creating keys when the plan has AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: true } })

        const create = await ctx.post(KEYS, { provider: AIProviderName.CUSTOM, displayName: 'New key', config: CUSTOM_CONFIG, auth: { apiKey: 'test-key' } })

        expect(create.statusCode).toBe(StatusCodes.OK)
    })
})

const KEYS = '/v1/ai-providers'
const CUSTOM_CONFIG = { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] }
