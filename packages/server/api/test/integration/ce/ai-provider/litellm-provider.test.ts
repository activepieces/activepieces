import { AIProviderName } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
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

afterEach(() => {
    vi.restoreAllMocks()
})

describe('LiteLLM AI provider', () => {
    it('creates a key and lists its models with the metadata saved on each model', async () => {
        mockProxy({ rows: [] })
        const created = await createKey({ models: [
            { modelId: 'prod-smart', modelName: 'prod-smart', modelType: AIProviderModelType.TEXT, metadata: { supportsReasoning: true, realModelId: 'gpt-5.4-mini' } },
            { modelId: 'ap-fast', modelName: 'ap-fast', modelType: AIProviderModelType.TEXT },
        ] })
        expect(created?.statusCode).toBe(StatusCodes.OK)

        const byConfig = await ctx.get(`/v1/ai-providers/configs/${created?.json().id}/models`)
        const resolved = await ctx.get(`/v1/ai-providers/${AIProviderName.LITELLM}/models`, { projectId: ctx.project.id })

        for (const response of [byConfig, resolved]) {
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const models: ListedModel[] = response?.json()
            expect(models.find((model) => model.id === 'prod-smart')?.metadata).toMatchObject({ supportsReasoning: true, realModelId: 'gpt-5.4-mini' })
            expect(models.find((model) => model.id === 'ap-fast')?.metadata).toBeUndefined()
        }
    })

    it('lists the models LiteLLM serves on create, with their metadata', async () => {
        const request = mockProxy({ rows: [
            { model_name: 'ap-fast', litellm_params: { model: 'openai/gpt-5.4-mini' }, model_info: { mode: 'chat', max_input_tokens: 272000, supports_function_calling: true } },
            { model_name: 'prod-image', model_info: { mode: 'image_generation' } },
            { model_name: 'embed', model_info: { mode: 'embedding' } },
        ] })

        const created = await createKey({ models: [] })

        expect(created?.statusCode).toBe(StatusCodes.OK)
        expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://litellm.example.com/v1/model/info' }))
        const models = await listModels({ id: created?.json().id })
        expect(models.map((model) => model.id).sort()).toEqual(['ap-fast', 'prod-image'])
        expect(models.find((model) => model.id === 'ap-fast')?.metadata).toMatchObject({ contextTokens: 272000, supportsToolCalling: true, realModelId: 'gpt-5.4-mini' })
    })

    it('refuses the key when LiteLLM rejects it, even with models typed in', async () => {
        vi.spyOn(safeHttp.axios, 'request').mockRejectedValue(Object.assign(new Error('Request failed with status code 401'), { isAxiosError: true, response: { status: 401 } }))

        const created = await createKey({ models: [TYPED] })

        expect(created?.statusCode).not.toBe(StatusCodes.OK)
        expect(created?.json().params.message).toContain('rejected the API key')
    })

    it('saves typed-in models when the proxy cannot be reached, and fails without them', async () => {
        vi.spyOn(safeHttp.axios, 'request').mockRejectedValue(new Error('connect ECONNREFUSED'))

        const withoutModels = await createKey({ models: [] })
        expect(withoutModels?.statusCode).not.toBe(StatusCodes.OK)
        expect(withoutModels?.json().params.message).toContain('Could not list the models')

        const withModels = await createKey({ models: [TYPED] })
        expect(withModels?.statusCode).toBe(StatusCodes.OK)
        expect((await listModels({ id: withModels?.json().id })).map((model) => model.id)).toEqual(['typed-by-hand'])
    })

    it('refresh adds new models, drops removed ones and keeps typed-in ones', async () => {
        mockProxy({ rows: [{ model_name: 'ap-fast', model_info: { mode: 'chat' } }, { model_name: 'old', model_info: { mode: 'chat' } }] })
        const created = await createKey({ models: [TYPED] })
        expect(created?.statusCode).toBe(StatusCodes.OK)

        mockProxy({ rows: [{ model_name: 'ap-fast', model_info: { mode: 'chat' } }, { model_name: 'new', model_info: { mode: 'chat' } }] })
        const refreshed = await ctx.post(`/v1/ai-providers/${created?.json().id}/refresh-models`, {})

        expect(refreshed?.statusCode).toBe(StatusCodes.OK)
        const expected = ['ap-fast', 'new', 'typed-by-hand']
        expect(refreshed?.json<ListedModel[]>().map((model) => model.id).sort()).toEqual(expected)
        expect((await listModels({ id: created?.json().id })).map((model) => model.id).sort()).toEqual(expected)
    })

    it('refresh fails and keeps the saved models when the proxy cannot be reached', async () => {
        mockProxy({ rows: [{ model_name: 'ap-fast', model_info: { mode: 'chat' } }] })
        const created = await createKey({ models: [TYPED] })

        vi.spyOn(safeHttp.axios, 'request').mockRejectedValue(new Error('connect ECONNREFUSED'))
        const refreshed = await ctx.post(`/v1/ai-providers/${created?.json().id}/refresh-models`, {})

        expect(refreshed?.statusCode).not.toBe(StatusCodes.OK)
        expect(refreshed?.json().params.message).toContain('Could not list the models')
        expect((await listModels({ id: created?.json().id })).map((model) => model.id).sort()).toEqual(['ap-fast', 'typed-by-hand'])
    })

    it('keeps an edit made while a refresh is still waiting on the proxy', async () => {
        const rows = [{ model_name: 'ap-fast', model_info: { mode: 'chat' } }]
        mockProxy({ rows })
        const created = await createKey({ models: [] })
        const id = created?.json().id

        let releaseRefresh: () => void = () => undefined
        const request = vi.spyOn(safeHttp.axios, 'request')
            .mockImplementationOnce(() => new Promise((resolve) => {
                releaseRefresh = (): void => resolve({ data: { data: rows } })
            }))
            .mockResolvedValue({ data: { data: rows } })

        const refreshing = ctx.post(`/v1/ai-providers/${id}/refresh-models`, {})
        await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))
        const editing = ctx.post(`/v1/ai-providers/${id}`, {
            displayName: 'LiteLLM',
            config: { baseUrl: BASE_URL, apiKeyHeader: 'x-litellm-api-key', models: [] },
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
        releaseRefresh()
        const [refreshed, edited] = await Promise.all([refreshing, editing])

        expect(refreshed?.statusCode).toBe(StatusCodes.OK)
        expect(edited?.statusCode).toBe(StatusCodes.OK)
        const configs = await ctx.get('/v1/ai-providers/configs')
        const saved = configs?.json<{ id: string, config: { apiKeyHeader?: string } }[]>().find((config) => config.id === id)
        expect(saved?.config.apiKeyHeader).toBe('x-litellm-api-key')
    })

    it('keeps discovered metadata when only the API key header changes', async () => {
        mockProxy({ rows: [{ model_name: 'ap-fast', model_info: { mode: 'chat', max_input_tokens: 272000 } }] })
        const created = await createKey({ models: [] })

        const updated = await ctx.post(`/v1/ai-providers/${created?.json().id}`, {
            displayName: 'LiteLLM',
            config: {
                baseUrl: BASE_URL,
                apiKeyHeader: 'x-litellm-api-key',
                models: [{ modelId: 'ap-fast', modelName: 'ap-fast', modelType: AIProviderModelType.TEXT, discovered: true, metadata: { contextTokens: 272000 } }],
            },
        })

        expect(updated?.statusCode).toBe(StatusCodes.OK)
        expect((await listModels({ id: created?.json().id }))[0].metadata).toMatchObject({ contextTokens: 272000 })
    })
})

function mockProxy({ rows }: { rows: unknown[] }) {
    return vi.spyOn(safeHttp.axios, 'request').mockResolvedValue({ data: { data: rows } })
}

function createKey({ models }: { models: unknown[] }) {
    return ctx.post('/v1/ai-providers', {
        provider: AIProviderName.LITELLM,
        displayName: 'LiteLLM',
        config: { baseUrl: BASE_URL, apiKeyHeader: 'Authorization', models },
        auth: { apiKey: 'sk-test' },
    })
}

async function listModels({ id }: { id: string }): Promise<ListedModel[]> {
    const response = await ctx.get(`/v1/ai-providers/configs/${id}/models`)
    return response?.json() ?? []
}

const BASE_URL = 'https://litellm.example.com/v1'
const TYPED = { modelId: 'typed-by-hand', modelName: 'typed-by-hand', modelType: AIProviderModelType.TEXT }

type ListedModel = { id: string, metadata?: Record<string, unknown> }
