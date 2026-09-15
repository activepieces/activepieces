import { AIProviderModelType, AIProviderName, tryCatch } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { aiProviderService } from '../../../../src/app/ai/ai-provider-service'

const log = { info: () => undefined, warn: () => undefined, error: () => undefined, debug: () => undefined } as never

const customConfig = (apiKeyHeader: string) => ({
    apiKeyHeader,
    baseUrl: 'https://api.example.com/v1',
    models: [{ modelId: 'gemma-4', modelName: 'Gemma 4', modelType: AIProviderModelType.TEXT }],
})

describe('validateProviderCredentials', () => {
    it('tells the user what is wrong with their own config instead of a generic failure', async () => {
        const { error } = await tryCatch(() => aiProviderService(log).validateProviderCredentials(
            AIProviderName.CUSTOM,
            { apiKey: 'sk-test' },
            customConfig('authorization: bearer'),
        ))

        expect(String(error)).toContain('Authorization')
        expect(String(error)).not.toContain('Failed to validate credentials for OpenAI Compatible')
    })

    it('accepts a config that can be used', async () => {
        const { error } = await tryCatch(() => aiProviderService(log).validateProviderCredentials(
            AIProviderName.CUSTOM,
            { apiKey: 'sk-test' },
            customConfig('Authorization'),
        ))

        expect(error).toBeNull()
    })
})
