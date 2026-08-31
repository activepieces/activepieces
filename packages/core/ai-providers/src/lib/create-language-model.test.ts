import { AIProviderName } from '@activepieces/core-utils'
import { AIProviderConfig, AIProviderModelType, VertexProviderConfig } from '@activepieces/core-piece-types'
import { describe, expect, it } from 'vitest'
import { buildOpenAICompatibleHeaders, createLanguageModel } from './create-language-model'

type ModelIdentity = { provider: string, modelId: string, settings?: { plugins?: unknown[] } }

type VertexModelIdentity = { config: { baseURL: string | (() => string) } }

function identify(model: unknown): ModelIdentity {
    return model as ModelIdentity
}

function identifyVertex(model: unknown): VertexModelIdentity {
    return model as VertexModelIdentity
}

const authFor: Partial<Record<AIProviderName, unknown>> = {
    [AIProviderName.BEDROCK]: { accessKeyId: 'a', secretAccessKey: 'b' },
    [AIProviderName.VERTEX]: { serviceAccountJson: JSON.stringify({
        type: 'service_account',
        project_id: 'gcp-project',
        client_email: 'sa@gcp-project.iam.gserviceaccount.com',
        private_key: '-----BEGIN PRIVATE KEY-----\\nnot-a-real-key\\n-----END PRIVATE KEY-----\\n',
    }) },
}

const configFor: Partial<Record<AIProviderName, unknown>> = {
    [AIProviderName.AZURE]: { resourceName: 'res', apiVersion: '2024-01-01' },
    [AIProviderName.BEDROCK]: { region: 'us-east-1' },
    [AIProviderName.CUSTOM]: { apiKeyHeader: 'x-api-key', baseUrl: 'https://example.test/v1', models: [] },
    [AIProviderName.VERTEX]: { project: 'gcp-project', region: 'europe-west4', models: [] },
}

const buildFor = (provider: AIProviderName, options?: Record<string, unknown>) => createLanguageModel({
    provider,
    auth: authFor[provider] ?? { apiKey: 'test-key' },
    config: configFor[provider] ?? {},
    modelId: 'some-model-id',
    options,
})

const supportedProviders = Object.values(AIProviderName).filter((p) => p !== AIProviderName.CLOUDFLARE_GATEWAY)

describe('AIProviderConfig union', () => {
    it('keeps every Vertex field instead of losing them to a looser member', () => {
        const config = {
            project: 'gcp-project',
            region: 'europe-west4',
            models: [{ modelId: 'gemini-2.5-pro', modelName: 'Gemini 2.5 Pro', modelType: AIProviderModelType.TEXT }],
        }

        expect(AIProviderConfig.parse(config)).toEqual(config)
    })

    it('rejects a region that would escape the Vertex hostname', () => {
        const withRegion = (region: string) => VertexProviderConfig.safeParse({ project: 'gcp-project', region, models: [] }).success

        expect(withRegion('europe-west4')).toBe(true)
        expect(withRegion('global')).toBe(true)
        expect(withRegion('evil.test/')).toBe(false)
        expect(withRegion('foo.attacker.test')).toBe(false)
        expect(withRegion('a/../../b')).toBe(false)
    })
})

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

    it('routes Vertex straight at the configured GCP project and region', () => {
        const model = buildFor(AIProviderName.VERTEX)
        const { config } = identifyVertex(model)
        const baseUrl = typeof config.baseURL === 'function' ? config.baseURL() : config.baseURL

        expect(identify(model).provider).toBe('google.vertex.chat')
        expect(baseUrl).toBe('https://europe-west4-aiplatform.googleapis.com/v1beta1/projects/gcp-project/locations/europe-west4/publishers/google')
    })

    it('sends Model Garden Claude ids to the Vertex Anthropic client, not the Gemini one', () => {
        const anthropicOnVertex = createLanguageModel({
            provider: AIProviderName.VERTEX,
            auth: authFor[AIProviderName.VERTEX],
            config: configFor[AIProviderName.VERTEX],
            modelId: 'claude-sonnet-4-6',
        })

        expect(identify(buildFor(AIProviderName.VERTEX)).provider).toBe('google.vertex.chat')
        expect(identify(anthropicOnVertex).provider).toBe('googleVertex.anthropic.messages')
    })

    it('sends Model Garden MaaS ids to the Vertex MaaS client', () => {
        const build = (modelId: string) => identify(createLanguageModel({
            provider: AIProviderName.VERTEX,
            auth: authFor[AIProviderName.VERTEX],
            config: configFor[AIProviderName.VERTEX],
            modelId,
        })).provider

        expect(build('meta/llama-4-scout-17b-16e-instruct-maas')).toBe('vertex.maas.chat')
        expect(build('mistral-large-2411-maas')).toBe('vertex.maas.chat')
        expect(build('gemini-2.5-pro')).toBe('google.vertex.chat')
        expect(build('claude-3-5-sonnet@20241022')).toBe('googleVertex.anthropic.messages')
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

    it('attaches the caller metadata headers to managed OpenRouter traffic', () => {
        const cfg = configOf(createLanguageModel({
            provider: AIProviderName.ACTIVEPIECES,
            auth: { apiKey: 'SECRET' },
            config: {},
            modelId: 'anthropic/claude',
            options: { extraHeaders: { 'x-ap-platform-id': 'plat', 'x-ap-conversation-id': 'conv' } },
        }))
        const headers = headersOf(cfg)
        expect(headers['Authorization']).toBe('Bearer SECRET')
        expect(headers['x-ap-platform-id']).toBe('plat')
        expect(headers['x-ap-conversation-id']).toBe('conv')
    })

    it('leaves OpenRouter headers untouched when no metadata is passed', () => {
        const cfg = configOf(createLanguageModel({ provider: AIProviderName.OPENROUTER, auth: { apiKey: 'SECRET' }, config: {}, modelId: 'anthropic/claude' }))
        const headers = headersOf(cfg)
        expect(headers['x-ap-platform-id']).toBeUndefined()
        expect(headers['Authorization']).toBe('Bearer SECRET')
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
