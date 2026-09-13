import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { vi } from 'vitest'
import { mockAndSaveAIProvider } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/pieces-common')>()
    return {
        ...original,
        httpClient: { ...original.httpClient, sendRequest: mockSendRequest },
    }
})

let app: FastifyInstance | null = null
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app!)
    mockSendRequest.mockReset()
})

describe('GET /v1/ai-providers/:provider/models', () => {
    it('offers only the openai models a chat step can call', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                data: [
                    { id: 'gpt-4o' },
                    { id: 'ft:gpt-4o-2024-08-06:acme:support:9xYz' },
                    { id: 'gpt-image-1' },
                    { id: 'whisper-1' },
                    { id: 'tts-1' },
                    { id: 'gpt-4o-mini-tts' },
                    { id: 'gpt-4o-transcribe' },
                    { id: 'text-embedding-3-small' },
                    { id: 'omni-moderation-latest' },
                    { id: 'sora-2' },
                ].map((model) => ({ ...model, object: 'model', created: 0, owned_by: 'openai' })),
            },
        })
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.OPENAI,
            displayName: 'OpenAI',
        })

        const response = await ctx.get('/v1/ai-providers/openai/models', { projectId: ctx.project.id })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const models: { id: string, type: string }[] = response?.json()
        expect(models.map((model) => model.id)).toEqual([
            'gpt-4o',
            'ft:gpt-4o-2024-08-06:acme:support:9xYz',
            'gpt-image-1',
        ])
        expect(models.find((model) => model.id === 'gpt-image-1')?.type).toBe(AIProviderModelType.IMAGE)
    })

    it('keeps every model an admin typed by hand, whatever it is for', async () => {
        await mockAndSaveAIProvider({
            platformId: ctx.platform.id,
            provider: AIProviderName.CUSTOM,
            displayName: 'Self-hosted gateway',
            config: {
                baseUrl: 'https://gateway.example.com/v1',
                apiKeyHeader: 'Authorization',
                models: [
                    { modelId: 'my-company-llm-v2', modelName: 'House LLM', modelType: AIProviderModelType.TEXT },
                    { modelId: 'whisper-1', modelName: 'Whisper', modelType: AIProviderModelType.TEXT },
                ],
            },
        })

        const response = await ctx.get(`/v1/ai-providers/${AIProviderName.CUSTOM}/models`, { projectId: ctx.project.id })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(response?.json().map((model: { id: string }) => model.id)).toEqual(['my-company-llm-v2', 'whisper-1'])
    })
})
