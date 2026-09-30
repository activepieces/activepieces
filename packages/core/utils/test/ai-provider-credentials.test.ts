import { describe, expect, it } from 'vitest'
import { aiProviderCredentials, AIProviderModelType } from '../src/lib/ai-provider-credentials'
import { AIProviderName } from '../src/lib/permission'

const customConfig = {
    apiKeyHeader: 'Authorization',
    baseUrl: 'https://example.com/v1',
    models: [{ modelId: 'gpt-4o', modelName: 'GPT-4o', modelType: AIProviderModelType.TEXT }],
}

describe('aiProviderCredentials', () => {
    it('returns a well-formed row unchanged', () => {
        const credentials = aiProviderCredentials({
            provider: AIProviderName.CUSTOM,
            auth: { apiKey: 'sk-live' },
            config: customConfig,
        })
        expect(credentials).toEqual({ provider: AIProviderName.CUSTOM, auth: { apiKey: 'sk-live' }, config: customConfig })
    })

    it('keeps the key of a row whose config predates a tightened rule, rather than failing the read', () => {
        const credentials = aiProviderCredentials({
            provider: AIProviderName.VERTEX,
            auth: { serviceAccountJson: '{"type":"service_account"}' },
            config: { project: 'my-project', region: 'US-CENTRAL1', models: [] },
        })
        expect(credentials.auth).toEqual({ serviceAccountJson: '{"type":"service_account"}' })
        expect(credentials.config).toEqual({})
    })

    it('carries a bedrock session token through, so temporary credentials survive the read', () => {
        const credentials = aiProviderCredentials({
            provider: AIProviderName.BEDROCK,
            auth: { accessKeyId: 'ASIA', secretAccessKey: 'secret', sessionToken: 'temporary' },
            config: { region: 'us-east-1' },
        })
        expect(credentials.auth).toEqual({ accessKeyId: 'ASIA', secretAccessKey: 'secret', sessionToken: 'temporary' })
    })

    it('returns an empty row when the auth itself cannot be parsed', () => {
        const credentials = aiProviderCredentials({
            provider: AIProviderName.CUSTOM,
            auth: { apiKey: 42 },
            config: customConfig,
        })
        expect(credentials).toEqual({ provider: AIProviderName.CUSTOM, auth: {}, config: {} })
    })
})
