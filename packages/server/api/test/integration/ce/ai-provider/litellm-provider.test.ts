import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
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

describe('LiteLLM AI provider', () => {
    it('creates a key and lists its models with the metadata saved on each model', async () => {
        const created = await ctx.post('/v1/ai-providers', {
            provider: AIProviderName.LITELLM,
            displayName: 'LiteLLM',
            config: {
                baseUrl: 'https://litellm.example.com/v1',
                apiKeyHeader: 'Authorization',
                models: [
                    { modelId: 'prod-smart', modelName: 'prod-smart', modelType: AIProviderModelType.TEXT, discovered: true, metadata: { supportsReasoning: true, realModelId: 'gpt-5.4-mini' } },
                    { modelId: 'ap-fast', modelName: 'ap-fast', modelType: AIProviderModelType.TEXT },
                ],
            },
            auth: { apiKey: 'sk-test' },
        })
        expect(created?.statusCode).toBe(StatusCodes.OK)

        const byConfig = await ctx.get(`/v1/ai-providers/configs/${created?.json().id}/models`)
        const resolved = await ctx.get(`/v1/ai-providers/${AIProviderName.LITELLM}/models`, { projectId: ctx.project.id })

        for (const response of [byConfig, resolved]) {
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const models: { id: string, metadata?: Record<string, unknown> }[] = response?.json()
            expect(models.find((model) => model.id === 'prod-smart')?.metadata).toMatchObject({ supportsReasoning: true, realModelId: 'gpt-5.4-mini' })
            expect(models.find((model) => model.id === 'ap-fast')?.metadata).toBeUndefined()
        }
    })
})
