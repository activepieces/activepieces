import { AIProviderModel, AIProviderModelType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', () => ({
    httpClient: { sendRequest: mockSendRequest },
    HttpMethod: { GET: 'GET' },
}))

import { openaiProvider } from '../../../../../src/app/ai/providers/openai-provider'

const listModels = async (ids: string[]) => {
    mockSendRequest.mockResolvedValue({
        body: { data: ids.map((id) => ({ id, object: 'model', created: 0, owned_by: 'openai' })) },
    })
    return openaiProvider.listModels({ apiKey: 'test-key' }, {})
}

const typeOf = ({ models, id }: { models: AIProviderModel[], id: string }) =>
    models.find((model) => model.id === id)?.type

describe('openaiProvider.listModels', () => {
    beforeEach(() => {
        mockSendRequest.mockReset()
    })

    it('classifies gpt-image models the allow-list never knew about', async () => {
        const models = await listModels(['gpt-image-2', 'gpt-image-1-mini', 'gpt-image-0721-mini-alpha'])

        expect(models).toHaveLength(3)
        for (const model of models) {
            expect(model.type, model.id).toBe(AIProviderModelType.IMAGE)
        }
    })

    it('does not promote an unreleased dall-e id, whose option contract the piece cannot know', async () => {
        const models = await listModels(['dall-e-4'])

        expect(typeOf({ models, id: 'dall-e-4' })).toBe(AIProviderModelType.TEXT)
    })

    it('still classifies the originally allow-listed image models', async () => {
        const models = await listModels(['gpt-image-1', 'dall-e-3', 'dall-e-2'])

        expect(models).toHaveLength(3)
        for (const model of models) {
            expect(model.type, model.id).toBe(AIProviderModelType.IMAGE)
        }
    })

    it('keeps chat models as text', async () => {
        const models = await listModels(['gpt-4o', 'gpt-4.1-mini', 'o3'])

        expect(models).toHaveLength(3)
        for (const model of models) {
            expect(model.type, model.id).toBe(AIProviderModelType.TEXT)
        }
    })

    it('matches on prefix, not substring, so an image-capable chat model stays text', async () => {
        const models = await listModels(['gpt-4o-image-input', 'chatgpt-image-describer'])

        expect(models).toHaveLength(2)
        expect(typeOf({ models, id: 'gpt-4o-image-input' })).toBe(AIProviderModelType.TEXT)
        expect(typeOf({ models, id: 'chatgpt-image-describer' })).toBe(AIProviderModelType.TEXT)
    })

    it('emits every model the API returned, id mirrored into name', async () => {
        const models = await listModels(['gpt-image-2', 'gpt-4o'])

        expect(models).toEqual([
            { id: 'gpt-image-2', name: 'gpt-image-2', type: AIProviderModelType.IMAGE },
            { id: 'gpt-4o', name: 'gpt-4o', type: AIProviderModelType.TEXT },
        ])
    })

    it('requests the OpenAI models endpoint with the configured key', async () => {
        await listModels(['gpt-4o'])

        expect(mockSendRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.openai.com/v1/models',
            method: 'GET',
            headers: expect.objectContaining({ 'Authorization': 'Bearer test-key' }),
        }))
    })
})
