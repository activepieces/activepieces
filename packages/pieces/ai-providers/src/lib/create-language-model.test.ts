import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { createLanguageModel } from './create-language-model'

const authFor: Partial<Record<AIProviderName, unknown>> = {
    [AIProviderName.BEDROCK]: { accessKeyId: 'a', secretAccessKey: 'b' },
}

const configFor: Partial<Record<AIProviderName, unknown>> = {
    [AIProviderName.AZURE]: { resourceName: 'res', apiVersion: '2024-01-01' },
    [AIProviderName.BEDROCK]: { region: 'us-east-1' },
    [AIProviderName.CUSTOM]: { apiKeyHeader: 'x-api-key', baseUrl: 'https://example.test/v1', models: [] },
}

const supportedProviders = Object.values(AIProviderName).filter((p) => p !== AIProviderName.CLOUDFLARE_GATEWAY)

describe('createLanguageModel', () => {
    it.each(supportedProviders)('builds a language model for %s', (provider) => {
        const model = createLanguageModel({
            provider,
            auth: authFor[provider] ?? { apiKey: 'test-key' },
            config: configFor[provider] ?? {},
            modelId: 'some-model',
        })
        expect(model).toBeDefined()
    })

    it('routes Mistral through OpenRouter when requested', () => {
        const model = createLanguageModel({
            provider: AIProviderName.MISTRAL,
            auth: { apiKey: 'test-key' },
            config: {},
            modelId: 'mistral-large',
            options: { mistralViaOpenRouter: true },
        })
        expect(model).toBeDefined()
    })

    it('refuses to build Cloudflare Gateway (caller-specific)', () => {
        expect(() => createLanguageModel({
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            auth: { apiKey: 'test-key' },
            config: { accountId: 'a', gatewayId: 'g', models: [] },
            modelId: 'openai/gpt-4',
        })).toThrow()
    })
})
