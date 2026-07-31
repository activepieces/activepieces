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

    it('lists deployments with the legacy api-version even when a newer one is configured', async () => {
        await azureProvider.listModels({ apiKey: 'test-key' }, { resourceName: 'my-resource', apiVersion: '2024-10-21' })

        const requestUrl = mockSendRequest.mock.calls[0][0].url
        expect(requestUrl).toContain('api-version=2023-03-15-preview')
    })

    it('keeps the request on the resource own azure host', async () => {
        await azureProvider.listModels({ apiKey: 'test-key' }, { resourceName: 'my-resource' })

        const requestUrl = new URL(mockSendRequest.mock.calls[0][0].url)
        expect(requestUrl.host).toBe('my-resource.openai.azure.com')
    })

    it.each([
        ['host swap', 'example.com/#'],
        ['path escape', 'my-resource.openai.azure.com/x?y='],
        ['userinfo', 'user@example.com#'],
        ['port', 'my-resource:8080#'],
        ['empty', ''],
    ])('rejects a resource name that is not a single dns label (%s) without sending a request', async (_case, resourceName) => {
        await expect(azureProvider.listModels({ apiKey: 'test-key' }, { resourceName })).rejects.toThrow(
            'Azure resource name must be alphanumerics and hyphens only, up to 64 characters',
        )
        expect(mockSendRequest).not.toHaveBeenCalled()
    })
})
