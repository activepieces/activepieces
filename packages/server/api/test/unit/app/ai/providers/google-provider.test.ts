import { AIProviderModelType, AIProviderName, ALLOWED_CHAT_MODELS_BY_PROVIDER } from '@activepieces/shared'
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
