import { AIProviderModelType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSendRequest } = vi.hoisted(() => ({ mockSendRequest: vi.fn() }))

vi.mock('@activepieces/pieces-common', () => ({
    httpClient: { sendRequest: mockSendRequest },
    HttpMethod: { GET: 'GET' },
}))

import { azureProvider } from '../../../../../src/app/ai/providers/azure-provider'

describe('azureProvider.listModels', () => {
    beforeEach(() => {
        mockSendRequest.mockReset()
        mockSendRequest.mockResolvedValue({
            body: {
                data: [
                    { id: 'my-gpt4o-deployment', model: 'gpt-4o', status: 'succeeded', object: 'deployment' },
                    { id: 'my-mini-deployment', model: 'gpt-4o-mini', status: 'succeeded', object: 'deployment' },
                ],
            },
        })
    })

    it('maps the deployment id as both model id and name', async () => {
        const models = await azureProvider.listModels({ apiKey: 'test-key' }, { resourceName: 'my-resource' })

        expect(models).toEqual([
            { id: 'my-gpt4o-deployment', name: 'my-gpt4o-deployment', type: AIProviderModelType.TEXT },
            { id: 'my-mini-deployment', name: 'my-mini-deployment', type: AIProviderModelType.TEXT },
        ])
    })

    it('judges a deployment by the model it runs, not the name the customer gave it', async () => {
        mockSendRequest.mockResolvedValue({
            body: {
                data: [
                    { id: 'support-voice-agent', model: 'gpt-4o', status: 'succeeded', object: 'deployment' },
                    { id: 'content-moderation-gpt4o', model: 'gpt-4.1', status: 'succeeded', object: 'deployment' },
                    { id: 'prod-1', model: 'whisper', status: 'succeeded', object: 'deployment' },
                    { id: 'prod-2', model: 'text-embedding-3-small', status: 'succeeded', object: 'deployment' },
                    { id: 'prod-3', model: 'dall-e-3', status: 'succeeded', object: 'deployment' },
                    { id: 'prod-4', model: 'sora', status: 'succeeded', object: 'deployment' },
                ],
            },
        })

        const models = await azureProvider.listModels({ apiKey: 'test-key' }, { resourceName: 'my-resource' })

        expect(models.map((model) => model.id)).toEqual(['support-voice-agent', 'content-moderation-gpt4o'])
    })

    it('keeps a deployment that does not say which model it runs, so an unfamiliar response is not emptied', async () => {
        mockSendRequest.mockResolvedValue({
            body: { data: [{ id: 'prod-voice', status: 'succeeded', object: 'deployment' }] },
        })

        const models = await azureProvider.listModels({ apiKey: 'test-key' }, { resourceName: 'my-resource' })

        expect(models.map((model) => model.id)).toEqual(['prod-voice'])
    })

    it('lists deployments with the legacy api-version even when a newer one is configured', async () => {
        await azureProvider.listModels({ apiKey: 'test-key' }, { resourceName: 'my-resource', apiVersion: '2024-10-21' })

        const requestUrl = mockSendRequest.mock.calls[0][0].url
        expect(requestUrl).toContain('api-version=2023-03-15-preview')
    })
})
