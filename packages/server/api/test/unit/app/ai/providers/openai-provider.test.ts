import { AIProviderModelType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', () => ({
    httpClient: { sendRequest: mockSendRequest },
    HttpMethod: { GET: 'GET' },
}))

import { openaiProvider } from '../../../../../src/app/ai/providers/openai-provider'

const AUTH = { apiKey: 'test-key' }
const CONFIG = {}

function makeApiResponse(ids: string[]) {
    return { body: { data: ids.map((id) => ({ id })) } }
}

describe('openaiProvider.listModels — image model classification', () => {
    beforeEach(() => {
        mockSendRequest.mockReset()
    })

    it('classifies known dall-e models as IMAGE', async () => {
        mockSendRequest.mockResolvedValue(makeApiResponse(['dall-e-2', 'dall-e-3']))

        const models = await openaiProvider.listModels(AUTH, CONFIG)

        expect(models).toEqual([
            { id: 'dall-e-2', name: 'dall-e-2', type: AIProviderModelType.IMAGE },
            { id: 'dall-e-3', name: 'dall-e-3', type: AIProviderModelType.IMAGE },
        ])
    })

    it('classifies gpt-image-1 as IMAGE', async () => {
        mockSendRequest.mockResolvedValue(makeApiResponse(['gpt-image-1']))

        const models = await openaiProvider.listModels(AUTH, CONFIG)

        expect(models[0].type).toBe(AIProviderModelType.IMAGE)
    })

    it('classifies future gpt-image-* models as IMAGE (regression for #14475)', async () => {
        // gpt-image-2 was silently typed as TEXT before this fix because it
        // was not in the hardcoded allowlist.
        mockSendRequest.mockResolvedValue(makeApiResponse(['gpt-image-2', 'gpt-image-3']))

        const models = await openaiProvider.listModels(AUTH, CONFIG)

        for (const model of models) {
            expect(model.type).toBe(AIProviderModelType.IMAGE)
        }
    })

    it('classifies text/chat models as TEXT', async () => {
        mockSendRequest.mockResolvedValue(
            makeApiResponse(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o3-mini']),
        )

        const models = await openaiProvider.listModels(AUTH, CONFIG)

        for (const model of models) {
            expect(model.type).toBe(AIProviderModelType.TEXT)
        }
    })

    it('returns id and name both set to the model id', async () => {
        mockSendRequest.mockResolvedValue(makeApiResponse(['gpt-4o', 'gpt-image-1']))

        const models = await openaiProvider.listModels(AUTH, CONFIG)

        for (const model of models) {
            expect(model.id).toBe(model.name)
        }
    })
})
