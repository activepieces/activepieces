import { aiProviderCredentials, AIProviderName } from '@activepieces/core-utils'
import { AIProviderConfig, AIProviderModelType, VertexProviderConfig } from '@activepieces/core-piece-types'
import { describe, expect, it } from 'vitest'
import { buildOpenAICompatibleHeaders, createLanguageModel } from './create-language-model'

type ModelIdentity = { provider: string, modelId: string, settings?: { plugins?: unknown[] } }

type VertexModelIdentity = { config: { baseURL: string | (() => string) } }
type CustomModelIdentity = { config: { headers: () => Record<string, string>, fetch?: typeof globalThis.fetch } }
type SentRequest = { url: string, headers: Headers, body: Record<string, unknown> }

function identify(model: unknown): ModelIdentity {
    return model as ModelIdentity
}

function identifyVertex(model: unknown): VertexModelIdentity {
    return model as VertexModelIdentity
}

function identifyCustom(model: unknown): CustomModelIdentity {
    return model as CustomModelIdentity
}

async function captureSentRequest(send: () => Promise<unknown>): Promise<SentRequest> {
    const original = globalThis.fetch
    let seen: SentRequest = { url: '', headers: new Headers(), body: {} }
    globalThis.fetch = (input, init) => {
        seen = { url: String(input), headers: new Headers(init?.headers), body: typeof init?.body === 'string' ? JSON.parse(init.body) : {} }
        return Promise.resolve(new Response('{}'))
    }
    try {
        await send().catch(() => undefined)
    }
    finally {
        globalThis.fetch = original
    }
    return seen
}

async function captureSentHeaders(send: () => Promise<unknown>): Promise<Headers> {
    return (await captureSentRequest(send)).headers
}

function generateHi(model: ReturnType<typeof createLanguageModel>): Promise<SentRequest> {
    return captureSentRequest(() => model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] }))
}

function captureHeaders({ patchedFetch, headers }: {
    patchedFetch?: typeof globalThis.fetch
    headers: Record<string, string>
}): Promise<Headers> {
    return captureSentHeaders(async () => patchedFetch?.('https://example.test/v1/responses', { headers }))
}

function captureBedrockHeaders(auth: Record<string, string>): Promise<Headers> {
    const model = createLanguageModel({
        credentials: aiProviderCredentials({ provider: AIProviderName.BEDROCK, auth, config: { region: 'us-east-1' } }),
        modelId: 'some-model-id',
    })
    return captureSentHeaders(() => model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] }))
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
    credentials: aiProviderCredentials({ provider, auth: authFor[provider] ?? { apiKey: 'test-key' }, config: configFor[provider] ?? {} }),
    modelId: 'some-model-id',
    options,
})

const supportedProviders = Object.values(AIProviderName).filter((p) => p !== AIProviderName.CLOUDFLARE_GATEWAY)

const forcedCall = {
    tools: [{ type: 'function' as const, name: 'extractData', inputSchema: { type: 'object' as const, properties: {} } }],
    toolChoice: { type: 'tool' as const, toolName: 'extractData' },
    prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'hi' }] }],
}

async function replyingWith<T>({ replies, send }: {
    replies: Record<string, unknown>[]
    send: (model: ReturnType<typeof createLanguageModel>) => Promise<T>
}): Promise<{ bodies: Record<string, unknown>[], result: T }> {
    const original = globalThis.fetch
    const bodies: Record<string, unknown>[] = []
    globalThis.fetch = (_input, init) => {
        bodies.push(typeof init?.body === 'string' ? JSON.parse(init.body) : {})
        const reply = replies[Math.min(bodies.length - 1, replies.length - 1)]
        return Promise.resolve(new Response(JSON.stringify(reply), { headers: { 'content-type': 'application/json' } }))
    }
    try {
        const result = await send(buildFor(AIProviderName.META))
        return { bodies, result }
    }
    finally {
        globalThis.fetch = original
    }
}

async function readStream(stream: ReadableStream<{ type: string }>): Promise<{ type: string }[]> {
    const parts: { type: string }[] = []
    const reader = stream.getReader()
    for (let next = await reader.read(); !next.done; next = await reader.read()) {
        parts.push(next.value)
    }
    return parts
}

const RESPONSE_BASE = {
    id: 'resp_1',
    object: 'response',
    created_at: 1,
    model: 'muse-spark-1.3',
    status: 'completed',
    incomplete_details: null,
    usage: { input_tokens: 1, output_tokens: 1, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
}

const TEXT_REPLY = {
    ...RESPONSE_BASE,
    output: [{ type: 'message', id: 'msg_1', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'Here is the data.', annotations: [] }] }],
}

const TOOL_REPLY = {
    ...RESPONSE_BASE,
    output: [{ type: 'function_call', id: 'fc_1', call_id: 'call_1', name: 'extractData', arguments: '{}', status: 'completed' }],
}

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
        expect(identify(buildFor(AIProviderName.OPENAI)).provider).toBe('openai.responses')
        expect(identify(buildFor(AIProviderName.ANTHROPIC)).provider).toBe('anthropic.messages')
        expect(identify(buildFor(AIProviderName.AZURE)).provider).toBe('azure.responses')
        expect(identify(buildFor(AIProviderName.BEDROCK)).provider).toBe('amazon-bedrock')
        expect(identify(buildFor(AIProviderName.CUSTOM)).provider).toBe('openai-compatible.chat')
        expect(identify(buildFor(AIProviderName.OPENROUTER)).provider).toBe('openrouter')
    })

    it('signs Bedrock requests with the session token, so temporary AWS credentials are accepted', async () => {
        const headers = await captureBedrockHeaders({ accessKeyId: 'ASIA', secretAccessKey: 'b', sessionToken: 'temporary' })

        expect(headers.get('x-amz-security-token')).toBe('temporary')
    })

    it('omits the security token header when Bedrock runs on a long-term access key', async () => {
        const headers = await captureBedrockHeaders({ accessKeyId: 'AKIA', secretAccessKey: 'b' })

        expect(headers.get('authorization')).toContain('AWS4-HMAC-SHA256')
        expect(headers.has('x-amz-security-token')).toBe(false)
    })

    it.each([AIProviderName.OPENAI, AIProviderName.AZURE, AIProviderName.META])('sends %s to the Responses API without storing the conversation', async (provider) => {
        const request = await generateHi(buildFor(provider))

        expect(new URL(request.url).pathname).toMatch(/\/responses$/)
        expect(request.body.store).toBe(false)
    })

    it('sends Meta to the Meta Model API and NVIDIA to the NVIDIA chat completions endpoint', async () => {
        const meta = await generateHi(buildFor(AIProviderName.META))
        const nvidia = await generateHi(buildFor(AIProviderName.NVIDIA))

        expect(meta.url).toBe('https://api.meta.ai/v1/responses')
        expect(meta.headers.get('authorization')).toBe('Bearer test-key')
        expect(nvidia.url).toBe('https://integrate.api.nvidia.com/v1/chat/completions')
    })

    describe('Meta, which only accepts tool_choice auto', () => {
        const tools = [
            { type: 'function' as const, name: 'extractData', inputSchema: { type: 'object' as const, properties: {} } },
            { type: 'function' as const, name: 'search', inputSchema: { type: 'object' as const, properties: {} } },
        ]
        const sendToMeta = (toolChoice: Parameters<ReturnType<typeof createLanguageModel>['doGenerate']>[0]['toolChoice']) => {
            const model = buildFor(AIProviderName.META)
            return captureSentRequest(() => model.doGenerate({ tools, toolChoice, prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] }))
        }
        const toolNames = (body: Record<string, unknown>) => (Array.isArray(body.tools) ? body.tools.map((tool: { name: string }) => tool.name) : [])

        it('turns required into auto and keeps every tool', async () => {
            const { body } = await sendToMeta({ type: 'required' })

            expect(body.tool_choice).toBe('auto')
            expect(toolNames(body)).toEqual(['extractData', 'search'])
        })

        it('turns a forced tool into auto with only that tool offered', async () => {
            const { body } = await sendToMeta({ type: 'tool', toolName: 'extractData' })

            expect(body.tool_choice).toBe('auto')
            expect(toolNames(body)).toEqual(['extractData'])
        })

        it('turns none into a request with no tools', async () => {
            const { body } = await sendToMeta({ type: 'none' })

            expect(body.tools).toBeUndefined()
            expect(body.tool_choice).toBeUndefined()
        })

        it('leaves auto alone', async () => {
            const { body } = await sendToMeta({ type: 'auto' })

            expect(body.tool_choice).toBe('auto')
            expect(toolNames(body)).toEqual(['extractData', 'search'])
        })

        it('tells the model to call the forced tool', async () => {
            const { body } = await sendToMeta({ type: 'tool', toolName: 'extractData' })

            expect(JSON.stringify(body.input)).toContain('Reply only by calling the extractData tool')
        })

        it('asks once more when the model answers a forced call in text', async () => {
            const { bodies, result } = await replyingWith({ replies: [TEXT_REPLY, TOOL_REPLY], send: (model) => model.doGenerate(forcedCall) })

            expect(bodies).toHaveLength(2)
            expect(JSON.stringify(bodies[1].input)).toContain('Your previous reply did not call a tool')
            expect(result.content).toContainEqual(expect.objectContaining({ type: 'tool-call', toolName: 'extractData' }))
        })

        it('fails instead of completing when the model answers in text twice', async () => {
            const { bodies, result } = await replyingWith({
                replies: [TEXT_REPLY, TEXT_REPLY],
                send: (model) => model.doGenerate(forcedCall).then(() => 'completed', (error: Error) => error.message),
            })

            expect(bodies).toHaveLength(2)
            expect(result).toBe('The model answered in text twice instead of calling the extractData tool')
        })

        it('fails a forced streamed call when the model answers in text twice', async () => {
            const { result } = await replyingWith({
                replies: [TEXT_REPLY, TEXT_REPLY],
                send: (model) => model.doStream(forcedCall).then(() => 'completed', (error: Error) => error.name),
            })

            expect(result).toBe('ForcedToolNotCalledError')
        })

        it('counts the tokens of both attempts when it asks again', async () => {
            const { result } = await replyingWith({ replies: [TEXT_REPLY, TOOL_REPLY], send: (model) => model.doGenerate(forcedCall) })

            expect(result.usage.inputTokens.total).toBe(2)
            expect(result.usage.outputTokens.total).toBe(2)
        })

        it('does not ask again once the model calls the tool', async () => {
            const { bodies, result } = await replyingWith({ replies: [TOOL_REPLY], send: (model) => model.doGenerate(forcedCall) })

            expect(bodies).toHaveLength(1)
            expect(result.content).toContainEqual(expect.objectContaining({ type: 'tool-call', toolName: 'extractData' }))
        })

        it('serves a forced streamed call from the retried generate call', async () => {
            const { bodies, result } = await replyingWith({
                replies: [TEXT_REPLY, TOOL_REPLY],
                send: async (model) => {
                    const { stream } = await model.doStream(forcedCall)
                    return readStream(stream)
                },
            })

            expect(bodies).toHaveLength(2)
            expect(bodies.every((body) => body.stream !== true)).toBe(true)
            expect(result).toContainEqual(expect.objectContaining({ type: 'tool-call', toolName: 'extractData' }))
        })
    })

    it.each([
        { provider: AIProviderName.OPENAI, optionsKey: 'openai' },
        { provider: AIProviderName.AZURE, optionsKey: 'azure' },
    ])('replays a saved $provider tool turn in full instead of as a stored item reference', async ({ provider, optionsKey }) => {
        const model = buildFor(provider)
        const request = await captureSentRequest(() => model.doGenerate({
            tools: [{ type: 'function', name: 'getWeather', inputSchema: { type: 'object', properties: {} } }],
            prompt: [
                { role: 'user', content: [{ type: 'text', text: 'weather in Paris?' }] },
                { role: 'assistant', content: [{ type: 'text', text: 'Checking the weather.', providerOptions: { [optionsKey]: { itemId: 'msg_saved' } } }, { type: 'tool-call', toolCallId: 'call_1', toolName: 'getWeather', input: { city: 'Paris' }, providerOptions: { [optionsKey]: { itemId: 'fc_saved' } } }] },
                { role: 'tool', content: [{ type: 'tool-result', toolCallId: 'call_1', toolName: 'getWeather', output: { type: 'json', value: { celsius: 20 } } }] },
            ],
        }))
        const items = Array.isArray(request.body.input) ? request.body.input : []

        expect(items).toContainEqual(expect.objectContaining({ role: 'assistant' }))
        expect(items).toContainEqual(expect.objectContaining({ type: 'function_call', call_id: 'call_1', name: 'getWeather' }))
        expect(items).toContainEqual(expect.objectContaining({ type: 'function_call_output', call_id: 'call_1' }))
        expect(items).not.toContainEqual(expect.objectContaining({ type: 'item_reference' }))
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
            credentials: aiProviderCredentials({ provider: AIProviderName.VERTEX, auth: authFor[AIProviderName.VERTEX], config: configFor[AIProviderName.VERTEX] }),
            modelId: 'claude-sonnet-4-6',
        })

        expect(identify(buildFor(AIProviderName.VERTEX)).provider).toBe('google.vertex.chat')
        expect(identify(anthropicOnVertex).provider).toBe('googleVertex.anthropic.messages')
    })

    it('sends Model Garden MaaS ids to the Vertex MaaS client', () => {
        const build = (modelId: string) => identify(createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.VERTEX, auth: authFor[AIProviderName.VERTEX], config: configFor[AIProviderName.VERTEX] }),
            modelId,
        })).provider

        expect(build('meta/llama-4-scout-17b-16e-instruct-maas')).toBe('vertex.maas.chat')
        expect(build('mistral-large-2411-maas')).toBe('vertex.maas.chat')
        expect(build('gemini-2.5-pro')).toBe('google.vertex.chat')
        expect(build('claude-3-5-sonnet@20241022')).toBe('googleVertex.anthropic.messages')
    })

    it('keeps the custom provider on chat completions unless apiStyle asks for responses', () => {
        const responsesConfig = { ...(configFor[AIProviderName.CUSTOM] as Record<string, unknown>), apiStyle: 'responses' }
        const model = createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.CUSTOM, auth: { apiKey: 'test-key' }, config: responsesConfig }),
            modelId: 'openai.gpt-oss-120b',
        })
        expect(identify(buildFor(AIProviderName.CUSTOM)).provider).toBe('openai-compatible.chat')
        expect(identify(model).provider).toBe('openai.responses')
        expect(identify(model).modelId).toBe('openai.gpt-oss-120b')
    })

    it('drops the SDK default Authorization when the custom provider authenticates with another header', async () => {
        const model = createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.CUSTOM, auth: { apiKey: 'secret-key' }, config: { apiKeyHeader: 'x-api-key', baseUrl: 'https://example.test/v1', models: [], apiStyle: 'responses' } }),
            modelId: 'some-model-id',
        })
        const { headers, fetch: patchedFetch } = identifyCustom(model).config
        const sent = headers()

        expect(sent['x-api-key']).toBe('secret-key')
        expect(sent['authorization']).toBe('Bearer secret-key')
        expect(patchedFetch).toBeDefined()

        const seen = await captureHeaders({ patchedFetch, headers: sent })
        expect(seen.get('x-api-key')).toBe('secret-key')
        expect(seen.get('authorization')).toBeNull()
    })

    it('keeps the Authorization header when that is the custom provider\'s own api key header', () => {
        const model = createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.CUSTOM, auth: { apiKey: 'Bearer bedrock-key' }, config: { apiKeyHeader: 'Authorization', baseUrl: 'https://bedrock-mantle.us-east-1.api.aws/v1', models: [], apiStyle: 'responses' } }),
            modelId: 'openai.gpt-oss-120b',
        })
        const { headers, fetch: patchedFetch } = identifyCustom(model).config

        expect(headers()['authorization']).toBe('Bearer bedrock-key')
        expect(patchedFetch).toBeUndefined()
    })

    it('keeps an Authorization the admin supplied through custom headers', async () => {
        const model = createLanguageModel({
            credentials: aiProviderCredentials({
                provider: AIProviderName.CUSTOM,
                auth: { apiKey: 'secret-key' },
                config: {
                    apiKeyHeader: 'x-api-key',
                    baseUrl: 'https://gateway.test/v1',
                    models: [],
                    apiStyle: 'responses',
                    defaultHeaders: { Authorization: 'Bearer gateway-token' },
                },
            }),
            modelId: 'some-model-id',
        })
        const { headers, fetch: patchedFetch } = identifyCustom(model).config

        expect(headers()['authorization']).toBe('Bearer gateway-token')
        expect(patchedFetch).toBeUndefined()
    })

    it('sends Mistral to its own API by default and via OpenRouter when requested', () => {
        expect(identify(buildFor(AIProviderName.MISTRAL)).provider).toBe('mistral.chat')
        expect(identify(buildFor(AIProviderName.MISTRAL, { mistralViaOpenRouter: true })).provider).toBe('openrouter')
    })

    it('forwards OpenRouter web-search plugin settings onto the model', () => {
        const openRouterSettings = { plugins: [{ id: 'web', max_results: 5 }] }
        const model = createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth: { apiKey: 'test-key' }, config: {} }),
            modelId: 'anthropic/claude',
            options: { openRouterSettings },
        })
        expect(identify(model).settings).toEqual(openRouterSettings)
    })

    it('refuses to build Cloudflare Gateway (caller-specific)', () => {
        expect(() => createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.CLOUDFLARE_GATEWAY, auth: { apiKey: 'test-key' }, config: { accountId: 'a', gatewayId: 'g', models: [] } }),
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

    it('sends OpenAI to the OpenAI endpoint with a bearer credential', async () => {
        const request = await generateHi(createLanguageModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENAI, auth: { apiKey: 'SECRET' }, config: {} }), modelId: 'm' }))
        expect(request.url).toContain('https://api.openai.com')
        expect(request.headers.get('authorization')).toBe('Bearer SECRET')
    })

    it('encodes the Azure resource name and api version into the URL', async () => {
        const request = await generateHi(createLanguageModel({ credentials: aiProviderCredentials({ provider: AIProviderName.AZURE, auth: { apiKey: 'SECRET' }, config: { resourceName: 'myres', apiVersion: '2024-08-01' } }), modelId: 'm' }))
        expect(request.url).toContain('myres')
        expect(request.url).toContain('api-version=2024-08-01')
        expect(request.headers.get('api-key')).toBe('SECRET')
    })

    it('attaches the caller metadata headers to managed OpenRouter traffic', () => {
        const cfg = configOf(createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.ACTIVEPIECES, auth: { apiKey: 'SECRET' }, config: {} }),
            modelId: 'anthropic/claude',
            options: { extraHeaders: { 'x-ap-platform-id': 'plat', 'x-ap-conversation-id': 'conv' } },
        }))
        const headers = headersOf(cfg)
        expect(headers['Authorization']).toBe('Bearer SECRET')
        expect(headers['x-ap-platform-id']).toBe('plat')
        expect(headers['x-ap-conversation-id']).toBe('conv')
    })

    it('leaves OpenRouter headers untouched when no metadata is passed', () => {
        const cfg = configOf(createLanguageModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth: { apiKey: 'SECRET' }, config: {} }), modelId: 'anthropic/claude' }))
        const headers = headersOf(cfg)
        expect(headers['x-ap-platform-id']).toBeUndefined()
        expect(headers['Authorization']).toBe('Bearer SECRET')
    })

    it('points Custom at its base URL and applies header precedence end to end', () => {
        const cfg = configOf(createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.CUSTOM, auth: { apiKey: 'SECRET' }, config: { apiKeyHeader: 'x-api-key', baseUrl: 'https://custom.test/v1', defaultHeaders: { 'x-shared': 'from-default' }, models: [] } }),
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
