import { ActivepiecesError, AIProviderModelType, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: {
        axios: { request: mockRequest },
        isSsrfFilterError: (error: unknown) => error instanceof Error && /is not allowed/.test(error.message),
    },
}))

import { litellmDiscovery } from '../../../../../src/app/ai/providers/litellm-discovery'

const TYPED = { modelId: 'typed-by-hand', modelName: 'typed-by-hand', modelType: AIProviderModelType.TEXT }

const config = (overrides: Partial<OpenAICompatibleProviderConfig> = {}): OpenAICompatibleProviderConfig => ({
    apiKeyHeader: 'Authorization',
    baseUrl: 'https://litellm.example.com/v1/',
    models: [],
    ...overrides,
})

function sync({ models = [], mode = 'save' }: { models?: OpenAICompatibleProviderConfig['models'], mode?: 'save' | 'refresh' } = {}): Promise<OpenAICompatibleProviderConfig> {
    return litellmDiscovery.syncModels({ authConfig: { apiKey: 'sk-test' }, config: config({ models }), mode })
}

function httpError(status: number): Error {
    return Object.assign(new Error(`Request failed with status code ${status}`), { isAxiosError: true, response: { status } })
}

async function messageOf(promise: Promise<unknown>): Promise<string> {
    const error = await promise.then(() => undefined, (rejection: unknown) => rejection)
    if (!(error instanceof ActivepiecesError)) {
        throw new Error('expected an ActivepiecesError')
    }
    const params = error.error.params
    return params !== null && 'message' in params ? String(params.message) : ''
}

describe('litellmDiscovery.fromModelInfo', () => {
    it('maps modes to types, keeps one row per name, skips wildcards and drops other modes', () => {
        const models = litellmDiscovery.fromModelInfo({ rows: [
            { model_name: 'ap-fast', litellm_params: { model: 'openai/gpt-5.4-mini' }, model_info: { mode: 'chat' } },
            { model_name: 'ap-fast', litellm_params: { model: 'openai/gpt-5.4' }, model_info: { mode: 'chat' } },
            { model_name: 'prod-image', model_info: { mode: 'image_generation' } },
            { model_name: 'no-mode' },
            { model_name: 'openai/*', model_info: { mode: 'chat' } },
            { model_name: 'embed', model_info: { mode: 'embedding' } },
            { model_info: { mode: 'chat' } },
        ] })

        expect(models.map((model) => [model.modelId, model.modelType])).toEqual([
            ['ap-fast', AIProviderModelType.TEXT],
            ['prod-image', AIProviderModelType.IMAGE],
            ['no-mode', AIProviderModelType.TEXT],
        ])
        expect(models[0].metadata?.realModelId).toBe('gpt-5.4-mini')
        expect(models.every((model) => model.discovered === true)).toBe(true)
    })

    it('reads context, cost per million and flags, and leaves unknown flags unset', () => {
        const [model] = litellmDiscovery.fromModelInfo({ rows: [{
            model_name: 'ap-fast',
            litellm_params: { model: 'openai/gpt-5.4-mini' },
            model_info: { mode: 'chat', max_input_tokens: 272000, max_output_tokens: 128000, input_cost_per_token: 7.5e-7, output_cost_per_token: 0.0000045, supports_vision: false, supports_function_calling: null },
        }] })

        expect(model.metadata).toEqual({
            contextTokens: 272000,
            maxOutputTokens: 128000,
            inputCostPerMillionTokens: 0.75,
            outputCostPerMillionTokens: 4.5,
            realModelId: 'gpt-5.4-mini',
        })
        expect(model.metadata).not.toHaveProperty('supportsToolCalling', false)
        expect(model.metadata).not.toHaveProperty('supportsVision', false)
    })

    it('prefers base_model and omits metadata when nothing is known', () => {
        const [withBase, bare] = litellmDiscovery.fromModelInfo({ rows: [
            { model_name: 'smart', litellm_params: { model: 'azure/my-deploy' }, model_info: { mode: 'chat', base_model: 'azure/gpt-5.4', supports_reasoning: true } },
            { model_name: 'bare', model_info: { mode: 'chat' } },
        ] })

        expect(withBase.metadata).toMatchObject({ realModelId: 'gpt-5.4', supportsReasoning: true })
        expect(bare).not.toHaveProperty('metadata')
    })
})

describe('litellmDiscovery.proxyRoot', () => {
    it('drops trailing slashes and a trailing /v1, keeping any path prefix', () => {
        expect(litellmDiscovery.proxyRoot({ baseUrl: 'https://gw.example.com/litellm/v1//' })).toBe('https://gw.example.com/litellm')
        expect(litellmDiscovery.proxyRoot({ baseUrl: 'http://litellm:4000' })).toBe('http://litellm:4000')
    })

    it('handles a long run of slashes quickly', () => {
        const started = performance.now()
        litellmDiscovery.proxyRoot({ baseUrl: `https://x${'/'.repeat(100_000)}` })
        expect(performance.now() - started).toBeLessThan(1000)
    })
})

describe('litellmDiscovery.mergeModels', () => {
    it('keeps manual models over discovered ones, refreshes discovered rows and drops the ones gone upstream', () => {
        const merged = litellmDiscovery.mergeModels({
            sent: [
                TYPED,
                { modelId: 'ap-fast', modelName: 'My fast', modelType: AIProviderModelType.TEXT },
                { modelId: 'gone', modelName: 'gone', modelType: AIProviderModelType.TEXT, discovered: true },
                { modelId: 'smart', modelName: 'smart', modelType: AIProviderModelType.TEXT, discovered: true },
            ],
            discovered: [
                { modelId: 'ap-fast', modelName: 'ap-fast', modelType: AIProviderModelType.TEXT, discovered: true },
                { modelId: 'smart', modelName: 'smart', modelType: AIProviderModelType.TEXT, discovered: true, metadata: { contextTokens: 1 } },
                { modelId: 'new', modelName: 'new', modelType: AIProviderModelType.IMAGE, discovered: true },
            ],
        })

        expect(merged.map((model) => model.modelId)).toEqual(['typed-by-hand', 'ap-fast', 'smart', 'new'])
        expect(merged[1].modelName).toBe('My fast')
        expect(merged[2].metadata).toEqual({ contextTokens: 1 })
    })
})

describe('litellmDiscovery.syncModels', () => {
    beforeEach(() => {
        mockRequest.mockReset()
    })

    it('reads /v1/model/info at the proxy root with the key in the configured header', async () => {
        mockRequest.mockResolvedValue({ data: { data: [{ model_name: 'ap-fast', model_info: { mode: 'chat' } }] } })

        const synced = await sync({ models: [TYPED] })

        expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://litellm.example.com/v1/model/info', headers: { Authorization: 'Bearer sk-test' } }))
        expect(synced.models.map((model) => model.modelId)).toEqual(['typed-by-hand', 'ap-fast'])
    })

    it('falls back to /v1/models when /model/info is missing', async () => {
        mockRequest.mockRejectedValueOnce(httpError(404)).mockResolvedValueOnce({ data: { data: [{ id: 'ap-fast' }, { id: 'text-embedding-3-small' }] } })

        const synced = await sync()

        expect(mockRequest).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'https://litellm.example.com/v1/models' }))
        expect(synced.models).toEqual([{ modelId: 'ap-fast', modelName: 'ap-fast', modelType: AIProviderModelType.TEXT, discovered: true }])
    })

    it('fails on a bad key even when models are typed in', async () => {
        mockRequest.mockRejectedValue(httpError(401))

        expect(await messageOf(sync({ models: [TYPED] }))).toContain('rejected the API key')
    })

    it('saves the typed-in models when the proxy is blocked or unreachable', async () => {
        mockRequest.mockRejectedValueOnce(new Error('DNS lookup 10.0.0.5 is not allowed'))
        expect((await sync({ models: [TYPED] })).models).toEqual([TYPED])

        mockRequest.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
        expect((await sync({ models: [TYPED] })).models).toEqual([TYPED])
    })

    it('fails with its own message when no models are typed in', async () => {
        mockRequest.mockRejectedValueOnce(new Error('DNS lookup 10.0.0.5 is not allowed'))
        expect(await messageOf(sync())).toContain('AP_SSRF_ALLOW_LIST')

        mockRequest.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
        expect(await messageOf(sync())).toContain('ECONNREFUSED')

        mockRequest.mockResolvedValueOnce({ data: { data: [{ model_name: 'embed', model_info: { mode: 'embedding' } }] } })
        expect(await messageOf(sync())).toContain('no chat or image models')
    })

    it('fails on refresh when discovery fails, even with typed-in models', async () => {
        mockRequest.mockRejectedValue(new Error('connect ECONNREFUSED'))

        expect(await messageOf(sync({ models: [TYPED], mode: 'refresh' }))).toContain('Could not list the models')
    })
})
