import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: { axios: { request: mockRequest } },
}))

import { openAiCompatibleVendor } from '../../../../../src/app/ai/providers/openai-compatible-vendor'

const respondWith = (ids: string[]) => {
    mockRequest.mockResolvedValue({ data: { data: ids.map((id) => ({ id })) } })
}

const respondWithDeclaredModalities = (models: { id: string, output_modalities?: string[] }[]) => {
    mockRequest.mockResolvedValue({ data: { models } })
}

const requestedUrl = () => mockRequest.mock.calls[0][0].url

const requestedUrls = () => mockRequest.mock.calls.map((call) => call[0].url)

describe('openAiCompatibleVendor', () => {
    beforeEach(() => {
        mockRequest.mockReset()
    })

    it('requests the vendor endpoint for the provider', async () => {
        respondWith(['kimi-k2'])
        const vendor = openAiCompatibleVendor({ name: 'Moonshot AI', provider: AIProviderName.MOONSHOT })

        await vendor.listModels({ apiKey: 'k' }, {})

        expect(requestedUrl()).toBe('https://api.moonshot.ai/v1/models')
    })

    it('only ever requests a hardcoded vendor host, so no admin input can redirect it', async () => {
        respondWith(['glm-5.2'])
        const vendor = openAiCompatibleVendor({ name: 'Z.ai', provider: AIProviderName.ZAI })

        await vendor.listModels({ apiKey: 'k' }, {})

        expect(requestedUrl()).toBe('https://api.z.ai/api/paas/v4/models')
    })

    it('authenticates with the configured key', async () => {
        respondWith(['deepseek-chat'])
        const vendor = openAiCompatibleVendor({ name: 'DeepSeek', provider: AIProviderName.DEEPSEEK })

        await vendor.listModels({ apiKey: 'test-key' }, {})

        expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({ 'Authorization': 'Bearer test-key' }),
        }))
    })

    it('mirrors the id into the name and marks every model as text', async () => {
        respondWith(['qwen-max', 'qwen-plus'])
        const vendor = openAiCompatibleVendor({ name: 'Qwen', provider: AIProviderName.QWEN })

        const models = await vendor.listModels({ apiKey: 'k' }, {})

        expect(models).toEqual([
            { id: 'qwen-max', name: 'qwen-max', type: AIProviderModelType.TEXT },
            { id: 'qwen-plus', name: 'qwen-plus', type: AIProviderModelType.TEXT },
        ])
    })

    it('returns an empty list when the vendor omits the data array', async () => {
        mockRequest.mockResolvedValue({ data: {} })
        const vendor = openAiCompatibleVendor({ name: 'MiniMax', provider: AIProviderName.MINIMAX })

        await expect(vendor.listModels({ apiKey: 'k' }, {})).resolves.toEqual([])
    })

    it('surfaces the vendor name when validation fails, so the admin knows which key is wrong', async () => {
        mockRequest.mockRejectedValue(new Error('401 Unauthorized'))
        const vendor = openAiCompatibleVendor({ name: 'MiniMax', provider: AIProviderName.MINIMAX })

        await expect(vendor.validateConnection({ apiKey: 'bad' }, {})).rejects.toThrow(/\[MiniMax\].*401 Unauthorized/)
    })
})

describe('openAiCompatibleVendor (xAI declared modalities)', () => {
    const xai = () => openAiCompatibleVendor({ name: 'xAI', provider: AIProviderName.XAI })

    beforeEach(() => {
        mockRequest.mockReset()
    })

    it('asks xAI what each model outputs instead of guessing from its id', async () => {
        respondWithDeclaredModalities([{ id: 'grok-4', output_modalities: ['text'] }])

        await xai().listModels({ apiKey: 'k' }, {})

        expect(requestedUrl()).toBe('https://api.x.ai/v1/language-models')
    })

    it('drops a model that cannot answer with text, so grok image and video stay out of chat dropdowns', async () => {
        respondWithDeclaredModalities([
            { id: 'grok-4', output_modalities: ['text'] },
            { id: 'grok-2-vision-1212', output_modalities: ['text'] },
            { id: 'grok-2-image-1212', output_modalities: ['image'] },
            { id: 'grok-imagine-v0.9', output_modalities: ['image', 'video'] },
        ])

        const models = await xai().listModels({ apiKey: 'k' }, {})

        expect(models).toEqual([
            { id: 'grok-4', name: 'grok-4', type: AIProviderModelType.TEXT },
            { id: 'grok-2-vision-1212', name: 'grok-2-vision-1212', type: AIProviderModelType.TEXT },
        ])
    })

    it('falls back to the id ruleset for a model that declares no modalities', async () => {
        respondWithDeclaredModalities([
            { id: 'grok-4' },
            { id: 'grok-4-tts' },
        ])

        const models = await xai().listModels({ apiKey: 'k' }, {})

        expect(models.map((model) => model.id)).toEqual(['grok-4'])
    })

    it('falls back to the openai-shaped endpoint when the modality endpoint is unusable', async () => {
        mockRequest.mockRejectedValueOnce(new Error('404 Not Found'))
        mockRequest.mockResolvedValueOnce({ data: { data: [{ id: 'grok-4' }] } })

        const models = await xai().listModels({ apiKey: 'k' }, {})

        expect(requestedUrls()).toEqual([
            'https://api.x.ai/v1/language-models',
            'https://api.x.ai/v1/models',
        ])
        expect(models).toEqual([{ id: 'grok-4', name: 'grok-4', type: AIProviderModelType.TEXT }])
    })

    it('falls back rather than emptying the dropdown when the modality endpoint returns nothing', async () => {
        mockRequest.mockResolvedValueOnce({ data: { models: [] } })
        mockRequest.mockResolvedValueOnce({ data: { data: [{ id: 'grok-4' }] } })

        const models = await xai().listModels({ apiKey: 'k' }, {})

        expect(models.map((model) => model.id)).toEqual(['grok-4'])
    })

    it('still rejects a bad key, since validation falls through to the endpoint that authenticates', async () => {
        mockRequest.mockRejectedValue(new Error('401 Unauthorized'))

        await expect(xai().validateConnection({ apiKey: 'bad' }, {})).rejects.toThrow(/\[xAI\].*401 Unauthorized/)
    })

    it('only ever requests hardcoded x.ai hosts, whichever endpoint answers', async () => {
        mockRequest.mockRejectedValueOnce(new Error('404 Not Found'))
        mockRequest.mockResolvedValueOnce({ data: { data: [] } })

        await xai().listModels({ apiKey: 'k' }, {})

        for (const url of requestedUrls()) {
            expect(new URL(url).host).toBe('api.x.ai')
        }
    })
})
