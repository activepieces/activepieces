import { AIProviderModelType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: { axios: { request: mockRequest } },
}))

import { cohereProvider } from '../../../../../src/app/ai/providers/cohere-provider'

describe('cohereProvider', () => {
    beforeEach(() => {
        mockRequest.mockReset()
    })

    it('lists chat models from the Cohere models endpoint with the key', async () => {
        mockRequest.mockResolvedValue({ data: { models: [{ name: 'command-a-03-2025' }] } })

        await cohereProvider.listModels({ apiKey: 'k' }, {})

        const request = mockRequest.mock.calls[0][0]
        expect(request.url).toBe('https://api.cohere.com/v1/models')
        expect(request.params).toEqual({ endpoint: 'chat', page_size: 1000 })
        expect(request.headers.Authorization).toBe('Bearer k')
    })

    it('drops deprecated models', async () => {
        mockRequest.mockResolvedValue({ data: { models: [
            { name: 'command-a-03-2025', is_deprecated: false },
            { name: 'command-r-03-2024', is_deprecated: true },
            { name: 'command-a-vision-07-2025' },
        ] } })

        const models = await cohereProvider.listModels({ apiKey: 'k' }, {})

        expect(models).toEqual([
            { id: 'command-a-03-2025', name: 'command-a-03-2025', type: AIProviderModelType.TEXT },
            { id: 'command-a-vision-07-2025', name: 'command-a-vision-07-2025', type: AIProviderModelType.TEXT },
        ])
    })

    it('fails validation when the key is rejected', async () => {
        mockRequest.mockRejectedValue(new Error('Request failed with status code 401'))

        await expect(cohereProvider.validateConnection({ apiKey: 'bad' }, {})).rejects.toThrow('401')
    })
})
