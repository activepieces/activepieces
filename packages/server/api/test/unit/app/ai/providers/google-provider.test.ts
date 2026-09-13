import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderModelType, ALLOWED_CHAT_MODELS_BY_PROVIDER } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', () => ({
    httpClient: { sendRequest: mockSendRequest },
    HttpMethod: { GET: 'GET' },
}))

import { googleProvider } from '../../../../../src/app/ai/providers/google-provider'

describe('googleProvider.listModels', () => {
    beforeEach(() => {
        mockSendRequest.mockReset()
    })

    it('strips the models/ prefix from every emitted model id', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                models: [
                    { name: 'models/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
                    { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
                    { name: 'models/imagen-3.0-generate', displayName: 'Imagen 3' },
                ],
            },
        })

        const models = await googleProvider.listModels({ apiKey: 'test-key' }, {})

        for (const model of models) {
            expect(model.id.startsWith('models/')).toBe(false)
        }
    })

    it('emits ids that intersect the Google chat allow-list so the picker populates', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                models: [
                    { name: 'models/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
                    { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
                ],
            },
        })

        const models = await googleProvider.listModels({ apiKey: 'test-key' }, {})

        const allowedIds = ALLOWED_CHAT_MODELS_BY_PROVIDER[AIProviderName.GOOGLE] ?? []
        const intersection = models.filter((model) => allowedIds.includes(model.id))

        expect(intersection.map((model) => model.id)).toEqual(
            expect.arrayContaining(['gemini-2.5-pro', 'gemini-2.5-flash']),
        )
    })

    it('drops a model that cannot generate content, so aqa and embeddings leave the picker', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                models: [
                    { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', supportedGenerationMethods: ['generateContent'] },
                    { name: 'models/gemini-embedding-001', displayName: 'Gemini Embedding', supportedGenerationMethods: ['embedContent'] },
                    { name: 'models/aqa', displayName: 'Attributed Question Answering', supportedGenerationMethods: ['generateAnswer'] },
                ],
            },
        })

        const models = await googleProvider.listModels({ apiKey: 'test-key' }, {})

        expect(models.map((model) => model.id)).toEqual(['gemini-2.5-flash'])
    })

    it('drops imagen, which the image action reaches through generateContent and imagen never answers', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                models: [
                    { name: 'models/imagen-3.0-generate-002', displayName: 'Imagen 3', supportedGenerationMethods: ['predict'] },
                    { name: 'models/gemini-2.5-flash-image', displayName: 'Nano Banana', supportedGenerationMethods: ['generateContent'] },
                ],
            },
        })

        const models = await googleProvider.listModels({ apiKey: 'test-key' }, {})

        expect(models).toEqual([
            { id: 'gemini-2.5-flash-image', name: 'Nano Banana', type: AIProviderModelType.IMAGE },
        ])
    })

    it('keeps a model that declares no methods at all, so an unfamiliar response is not emptied', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                models: [{ name: 'models/gemini-4-pro', displayName: 'Gemini 4 Pro' }],
            },
        })

        const models = await googleProvider.listModels({ apiKey: 'test-key' }, {})

        expect(models.map((model) => model.id)).toEqual(['gemini-4-pro'])
    })

    it('still classifies image models by their name', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                models: [
                    { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
                    { name: 'models/imagen-3.0-generate-image', displayName: 'Imagen 3' },
                ],
            },
        })

        const models = await googleProvider.listModels({ apiKey: 'test-key' }, {})

        const imageModel = models.find((model) => model.id === 'imagen-3.0-generate-image')
        const textModel = models.find((model) => model.id === 'gemini-2.5-flash')
        expect(imageModel?.type).toBe(AIProviderModelType.IMAGE)
        expect(textModel?.type).toBe(AIProviderModelType.TEXT)
    })
})
