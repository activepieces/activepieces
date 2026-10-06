import { AIProviderName, ErrorCode } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { aiModelCandidates } from '../../../../src/app/ai/ai-model-candidates'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { platformPlanService } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
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

describe('Own AI keys plan gate', () => {
    it('refuses to add a key when the plan has no AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: false } })

        const response = await ctx.post('/v1/ai-providers', {
            provider: AIProviderName.OPENAI,
            displayName: 'OpenAI',
            auth: { apiKey: 'sk-test' },
            config: {},
        })

        expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })

    it('stops handing a key to runs once the plan no longer has AI providers', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: true } })
        await mockAndSaveAIProvider({ platformId: ctx.platform.id, provider: AIProviderName.OPENAI })
        const resolveForRun = () => aiProviderService(app!.log).getConfigOrThrow({
            platformId: ctx.platform.id,
            provider: AIProviderName.OPENAI,
            scope: { type: 'project', projectId: ctx.project.id },
        })

        await expect(resolveForRun()).resolves.toBeDefined()
        await platformPlanService(app!.log).update({ platformId: ctx.platform.id, aiProvidersEnabled: false })

        await expect(resolveForRun()).rejects.toMatchObject({
            error: expect.objectContaining({ code: ErrorCode.FEATURE_DISABLED }),
        })
    })

    it('fails a tier whose main model uses an own key with the plan error once the plan lapses', async () => {
        const ctx = await createTestContext(app!, { plan: { aiProvidersEnabled: true } })
        const key = await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.CUSTOM,
            config: { baseUrl: 'https://api.example.com/v1', apiKeyHeader: 'Authorization', models: [] },
        })
        const tier = (await ctx.post(TIERS, { name: 'Fast', emoji: '⚡', entries: [{ configId: key.id, modelId: 'gpt-4o' }] })).json()
        await platformPlanService(app!.log).update({ platformId: ctx.platform.id, aiProvidersEnabled: false })

        await expect(aiModelCandidates(app!.log).resolve({ platformId: ctx.platform.id, tierId: tier.id })).rejects.toMatchObject({
            error: expect.objectContaining({ code: ErrorCode.FEATURE_DISABLED }),
        })
    })
})

const TIERS = '/v1/platform-model-tiers'
