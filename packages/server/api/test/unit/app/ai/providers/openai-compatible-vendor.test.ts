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

const requestedUrl = () => mockRequest.mock.calls[0][0].url

describe('openAiCompatibleVendor', () => {
    beforeEach(() => {
        mockRequest.mockReset()
    })

    it('requests the vendor endpoint for the provider', async () => {
        respondWith(['grok-4.1-fast'])
        const vendor = openAiCompatibleVendor({ name: 'xAI', provider: AIProviderName.XAI })

        await vendor.listModels({ apiKey: 'k' }, {})

        expect(requestedUrl()).toBe('https://api.x.ai/v1/models')
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
