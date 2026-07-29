import { AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { buildOpenAICompatibleHeaders, createLanguageModel } from './create-language-model'

type ModelIdentity = { provider: string, modelId: string, settings?: { plugins?: unknown[] } }

function identify(model: unknown): ModelIdentity {
    return model as ModelIdentity
}

const authFor: Partial<Record<AIProviderName, unknown>> = {
    [AIProviderName.BEDROCK]: { accessKeyId: 'a', secretAccessKey: 'b' },
}

const configFor: Partial<Record<AIProviderName, unknown>> = {
    [AIProviderName.AZURE]: { resourceName: 'res', apiVersion: '2024-01-01' },
    [AIProviderName.BEDROCK]: { region: 'us-east-1' },
    [AIProviderName.CUSTOM]: { apiKeyHeader: 'x-api-key', baseUrl: 'https://example.test/v1', models: [] },
}

const buildFor = (provider: AIProviderName, options?: Record<string, unknown>) => createLanguageModel({
    provider,
    auth: authFor[provider] ?? { apiKey: 'test-key' },
    config: configFor[provider] ?? {},
    modelId: 'some-model-id',
    options,
})

const supportedProviders = Object.values(AIProviderName).filter((p) => p !== AIProviderName.CLOUDFLARE_GATEWAY)

describe('createLanguageModel', () => {
    it.each(supportedProviders)('passes the model id straight through for %s', (provider) => {
        expect(identify(buildFor(provider)).modelId).toBe('some-model-id')
    })

    it('picks the right SDK client per provider', () => {
        expect(identify(buildFor(AIProviderName.OPENAI)).provider).toBe('openai.chat')
        expect(identify(buildFor(AIProviderName.ANTHROPIC)).provider).toBe('anthropic.messages')
        expect(identify(buildFor(AIProviderName.AZURE)).provider).toBe('azure.chat')
        expect(identify(buildFor(AIProviderName.BEDROCK)).provider).toBe('amazon-bedrock')
        expect(identify(buildFor(AIProviderName.CUSTOM)).provider).toBe('openai-compatible.chat')
        expect(identify(buildFor(AIProviderName.OPENROUTER)).provider).toBe('openrouter')
    })

    it('uses the OpenAI Chat API by default and the Responses API when asked', () => {
        expect(identify(buildFor(AIProviderName.OPENAI)).provider).toBe('openai.chat')
        expect(identify(buildFor(AIProviderName.OPENAI, { openaiResponsesModel: true })).provider).toBe('openai.responses')
    })

    it('sends Mistral to its own API by default and via OpenRouter when requested', () => {
        expect(identify(buildFor(AIProviderName.MISTRAL)).provider).toBe('mistral.chat')
        expect(identify(buildFor(AIProviderName.MISTRAL, { mistralViaOpenRouter: true })).provider).toBe('openrouter')
    })

    it('forwards OpenRouter web-search plugin settings onto the model', () => {
        const openRouterSettings = { plugins: [{ id: 'web', max_results: 5 }] }
        const model = createLanguageModel({
            provider: AIProviderName.OPENROUTER,
            auth: { apiKey: 'test-key' },
            config: {},
            modelId: 'anthropic/claude',
            options: { openRouterSettings },
        })
        expect(identify(model).settings).toEqual(openRouterSettings)
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

describe('buildOpenAICompatibleHeaders', () => {
    it('layers provider default headers over caller extra headers, api key last', () => {
        const headers = buildOpenAICompatibleHeaders({
            apiKeyHeader: 'authorization',
            apiKey: 'secret',
            extraHeaders: { 'x-ap-project-id': 'p', 'x-shared': 'from-extra' },
            defaultHeaders: { 'x-shared': 'from-default' },
        })
        expect(headers['x-ap-project-id']).toBe('p')
        expect(headers['x-shared']).toBe('from-default')
        expect(headers['authorization']).toBe('secret')
    })

    it('never lets a default header clobber the api key', () => {
        const headers = buildOpenAICompatibleHeaders({
            apiKeyHeader: 'authorization',
            apiKey: 'secret',
            defaultHeaders: { authorization: 'attacker' },
        })
        expect(headers['authorization']).toBe('secret')
    })
})

describe('resolved endpoint, credentials and headers', () => {
    type ResolvedConfig = {
        url: (opts: { path: string, modelId: string }) => string
        headers: (() => Record<string, string>) | Record<string, string>
    }

    const configOf = (model: unknown): ResolvedConfig => (model as { config: ResolvedConfig }).config
    const headersOf = (cfg: ResolvedConfig): Record<string, string> => (typeof cfg.headers === 'function' ? cfg.headers() : cfg.headers)
    const urlOf = (cfg: ResolvedConfig): string => cfg.url({ path: '/chat/completions', modelId: 'm' })

    it('sends OpenAI to the OpenAI endpoint with a bearer credential', () => {
        const cfg = configOf(createLanguageModel({ provider: AIProviderName.OPENAI, auth: { apiKey: 'SECRET' }, config: {}, modelId: 'm' }))
        expect(urlOf(cfg)).toContain('https://api.openai.com')
        expect(headersOf(cfg)['authorization']).toBe('Bearer SECRET')
    })

    it('encodes the Azure resource name and api version into the URL', () => {
        const cfg = configOf(createLanguageModel({ provider: AIProviderName.AZURE, auth: { apiKey: 'SECRET' }, config: { resourceName: 'myres', apiVersion: '2024-08-01' }, modelId: 'm' }))
        const url = urlOf(cfg)
        expect(url).toContain('myres')
        expect(url).toContain('api-version=2024-08-01')
        expect(headersOf(cfg)['api-key']).toBe('SECRET')
    })

    it('points Custom at its base URL and applies header precedence end to end', () => {
        const cfg = configOf(createLanguageModel({
            provider: AIProviderName.CUSTOM,
            auth: { apiKey: 'SECRET' },
            config: { apiKeyHeader: 'x-api-key', baseUrl: 'https://custom.test/v1', defaultHeaders: { 'x-shared': 'from-default' }, models: [] },
            modelId: 'm',
            options: { extraHeaders: { 'x-ap-project-id': 'proj', 'x-shared': 'from-extra' } },
        }))
        expect(urlOf(cfg)).toBe('https://custom.test/v1/chat/completions')
        const headers = headersOf(cfg)
        expect(headers['x-api-key']).toBe('SECRET')
        expect(headers['x-ap-project-id']).toBe('proj')
        expect(headers['x-shared']).toBe('from-default')
    })
})
