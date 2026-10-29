import { AIProviderModelType, isNil, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }))

vi.mock('@activepieces/server-utils', () => ({
    safeHttp: { axios: { request: mockRequest } },
}))

import { openAICompatibleProvider } from '../../../../../src/app/ai/providers/openai-compatible-gateway-provider'

const config = (overrides: Partial<OpenAICompatibleProviderConfig> = {}): OpenAICompatibleProviderConfig => ({
    apiKeyHeader: 'Authorization',
    baseUrl: 'https://llm.example.com/v1/',
    models: [{ modelId: 'typed-by-hand', modelName: 'typed-by-hand', modelType: AIProviderModelType.TEXT }],
    ...overrides,
})

const respondWith = (ids: string[]): void => {
    mockRequest.mockResolvedValue({ data: { data: ids.map((id) => ({ id })) } })
}

function suggest(overrides: Partial<OpenAICompatibleProviderConfig> = {}): Promise<string[]> {
    const { suggestModels } = openAICompatibleProvider
    if (isNil(suggestModels)) {
        throw new Error('the OpenAI-compatible provider should suggest models')
    }
    return suggestModels({ apiKey: 'Bearer sk-test' }, config(overrides))
}

describe('openAICompatibleProvider.suggestModels', () => {
    beforeEach(() => {
        mockRequest.mockReset()
    })

    it('asks the server for its models with the same headers chat calls send', async () => {
        respondWith(['llama-4'])

        await suggest({ apiKeyHeader: 'x-api-key', defaultHeaders: { 'x-team': 'ops' } })

        const request = mockRequest.mock.calls[0][0]
        expect(request.url).toBe('https://llm.example.com/v1/models')
        expect(request.headers).toEqual({ 'x-team': 'ops', 'x-api-key': 'Bearer sk-test' })
    })

    it('caps how long and how much the models request may read', async () => {
        respondWith(['llama-4'])

        await suggest()

        const request = mockRequest.mock.calls[0][0]
        expect(request.signal).toBeInstanceOf(AbortSignal)
        expect(request.maxContentLength).toBe(5 * 1024 * 1024)
    })

    it('trims a long run of trailing slashes without stalling', async () => {
        respondWith(['llama-4'])
        const startedAt = performance.now()

        await suggest({ baseUrl: `https://llm.example.com/v1${'/'.repeat(100_000)}x` })

        expect(performance.now() - startedAt).toBeLessThan(1_000)
    })

    it('keeps chat models and drops embeddings, speech and moderation ids', async () => {
        respondWith(['llama-4', 'text-embedding-3-small', 'whisper-1', 'omni-moderation-latest', 'qwen3-32b'])

        await expect(suggest()).resolves.toEqual(['llama-4', 'qwen3-32b'])
    })

    it('does not change the models the key actually offers', async () => {
        respondWith(['llama-4'])

        await expect(openAICompatibleProvider.listModels({ apiKey: 'k' }, config())).resolves.toEqual([
            { id: 'typed-by-hand', name: 'typed-by-hand', type: AIProviderModelType.TEXT },
        ])
        expect(mockRequest).not.toHaveBeenCalled()
    })
})
