import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { aiProviderCredentials, AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { createImageModel, createLanguageModel } from './create-language-model'
import { litellm, litellmAuth } from './litellm'

const BASE_URL = 'https://litellm.example.test/v1'
const REPLY_JSON = readFileSync(join(__dirname, 'fixtures', 'litellm-claude-reply.json'), 'utf8')
const REPLY_STREAM = readFileSync(join(__dirname, 'fixtures', 'litellm-claude-stream.sse'), 'utf8')
const REASONING_MODEL = { modelId: 'prod-smart', modelName: 'prod-smart', modelType: 'text', metadata: { supportsReasoning: true } }
const PLAIN_MODEL = { modelId: 'ap-fast', modelName: 'ap-fast', modelType: 'text' }
const TWO_TURNS = [
    { role: 'user' as const, content: [{ type: 'text' as const, text: 'Weather in Oslo?' }] },
    { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'Oslo is 21C and clear.' }] },
    { role: 'user' as const, content: [{ type: 'text' as const, text: 'And what city did I ask about?' }] },
]

describe('LiteLLM language model', () => {
    it('sends the Responses API a bearer key with a pasted Bearer prefix removed, and stores nothing', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiKey: 'Bearer sk-1' }) }) })

        expect(new URL(sent[0].url).pathname).toBe('/v1/responses')
        expect(sent[0].headers.get('authorization')).toBe('Bearer sk-1')
        expect(sent[0].body.store).toBe(false)
    })

    it('sends a custom key header the raw key and no Authorization', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiKey: 'sk-1', apiKeyHeader: 'x-litellm-api-key' }) }) })

        expect(sent[0].headers.get('x-litellm-api-key')).toBe('sk-1')
        expect(sent[0].headers.has('authorization')).toBe(false)
    })

    it.each([
        { apiStyle: undefined, apiKeyHeader: 'Authorization' },
        { apiStyle: 'chat' as const, apiKeyHeader: 'Authorization' },
        { apiStyle: undefined, apiKeyHeader: '' },
        { apiStyle: 'chat' as const, apiKeyHeader: '' },
    ])('sends one bearer key for header "$apiKeyHeader" (apiStyle $apiStyle) when the key was pasted with Bearer', async ({ apiStyle, apiKeyHeader }) => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiKey: 'Bearer sk-1', apiKeyHeader, apiStyle }) }) })

        expect(sent[0].headers.get('authorization')).toBe('Bearer sk-1')
    })

    it('sends a custom key header the raw key and no Authorization on chat completions', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiKey: 'sk-1', apiKeyHeader: 'x-litellm-api-key', apiStyle: 'chat' }) }) })

        expect(sent[0].headers.get('x-litellm-api-key')).toBe('sk-1')
        expect(sent[0].headers.has('authorization')).toBe(false)
    })

    it('sends medium effort and no temperature for a reasoning model on the Responses API', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'prod-smart' }), temperature: 0.3 }) })

        expect(sent[0].body.reasoning).toMatchObject({ effort: 'medium' })
        expect(sent[0].body).not.toHaveProperty('temperature')
        expect(sent[0].body.store).toBe(false)
    })

    it('sends no effort for a model that does not reason on the Responses API', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'ap-fast' }), temperature: 0.3 }) })

        expect(sent[0].body).not.toHaveProperty('reasoning')
        expect(sent[0].body.temperature).toBe(0.3)
    })

    it('sends medium effort and no temperature for a reasoning model on chat completions', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'prod-smart', apiStyle: 'chat', apiKey: 'Bearer sk-1' }), temperature: 0.3 }) })

        expect(new URL(sent[0].url).pathname).toBe('/v1/chat/completions')
        expect(sent[0].headers.get('authorization')).toBe('Bearer sk-1')
        expect(sent[0].body.reasoning_effort).toBe('medium')
        expect(sent[0].body).not.toHaveProperty('temperature')
    })

    it('sends no effort for a model that does not reason on chat completions', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'ap-fast', apiStyle: 'chat' }), temperature: 0.3 }) })

        expect(sent[0].body).not.toHaveProperty('reasoning_effort')
        expect(sent[0].body.temperature).toBe(0.3)
    })

    it.each([
        { apiStyle: undefined },
        { apiStyle: 'chat' as const },
    ])('leaves tool_choice on auto for a reasoning model with tools (apiStyle $apiStyle)', async ({ apiStyle }) => {
        const tools = [{ type: 'function', name: 'get_weather', description: 'weather', inputSchema: { type: 'object', properties: {} } }]
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'prod-smart', apiStyle }), tools, toolChoice: { type: 'auto' } }) })

        expect(sent[0].body.tool_choice).toBe('auto')
        expect(sent[0].body.tools).toHaveLength(1)
    })

    it('parses a non-streamed second turn when Claude returns reasoning without a summary', async () => {
        const result = await replyingWith({
            body: REPLY_JSON,
            contentType: 'application/json',
            send: () => buildText({ modelId: 'claude-haiku' }).doGenerate({ prompt: TWO_TURNS }),
        })

        expect(result.content.some((part) => part.type === 'text' && part.text?.includes('Oslo') === true)).toBe(true)
    })

    it('needs the patch: the same reply fails on a plain Responses client', async () => {
        const custom = createLanguageModel({
            credentials: aiProviderCredentials({ provider: AIProviderName.CUSTOM, auth: { apiKey: 'sk-1' }, config: { apiKeyHeader: 'authorization', baseUrl: BASE_URL, models: [], apiStyle: 'responses' } }),
            modelId: 'claude-haiku',
        })

        await expect(replyingWith({ body: REPLY_JSON, contentType: 'application/json', send: () => asCallable(custom).doGenerate({ prompt: TWO_TURNS }) })).rejects.toThrow()
    })

    it('streams a second turn when Claude streams reasoning without a summary', async () => {
        const parts = await replyingWith({
            body: REPLY_STREAM,
            contentType: 'text/event-stream; charset=utf-8',
            send: async () => readStream((await buildText({ modelId: 'claude-haiku' }).doStream({ prompt: TWO_TURNS })).stream),
        })

        expect(parts.some((part) => part.type === 'error')).toBe(false)
        expect(parts.some((part) => part.type === 'text-delta')).toBe(true)
        expect(parts.at(-1)?.type).toBe('finish')
    })

    it('adds the summary to the added, done and completed events and leaves every other line as sent', async () => {
        const withoutSummaries = REPLY_STREAM.replace('"summary":[{"type":"summary_text","text":""}]', '"status":"completed"')
        const patched = await new Response((await litellm.withReasoningSummaries(() => Promise.resolve(new Response(withoutSummaries, { headers: { 'content-type': 'text/event-stream' } })))('https://x.test')).body).text()
        const sentLines = withoutSummaries.split('\n')
        const patchedLines = patched.split('\n')

        const reasoningEvents = patchedLines.filter((line) => /"type":"(response.output_item.added|response.output_item.done)"/.test(line) && line.includes('"type":"reasoning"'))
        const completed = patchedLines.find((line) => line.includes('"type":"response.completed"'))
        expect(reasoningEvents).toHaveLength(2)
        expect(reasoningEvents.every((line) => JSON.parse(line.slice('data:'.length)).item.summary !== undefined)).toBe(true)
        expect(JSON.parse(completed?.slice('data:'.length) ?? '{}').response.output[0].summary).toEqual([])
        expect(patchedLines).toHaveLength(sentLines.length)
        expect(patchedLines.filter((line, index) => line !== sentLines[index])).toHaveLength(3)
    })

    it('patches a stream split mid-line across chunks', async () => {
        const encoded = new TextEncoder().encode(REPLY_STREAM)
        const body = new ReadableStream<Uint8Array>({
            start: (controller) => {
                for (let offset = 0; offset < encoded.length; offset += 7) {
                    controller.enqueue(encoded.slice(offset, offset + 7))
                }
                controller.close()
            },
        })
        const patched = await new Response((await litellm.withReasoningSummaries(() => Promise.resolve(new Response(body, { headers: { 'content-type': 'text/event-stream' } })))('https://x.test')).body).text()

        expect(patched).toContain('"type":"reasoning","status":"in_progress","summary":[]')
    })
})

describe('LiteLLM image model', () => {
    it('generates through images/generations with the bearer key', async () => {
        const sent = await captureRequests({
            reply: JSON.stringify({ data: [{ b64_json: 'aGk=' }] }),
            send: () => buildImage({ apiKey: 'Bearer sk-1' }).doGenerate({ prompt: 'a cat', n: 1, size: undefined, aspectRatio: undefined, seed: undefined, files: undefined, mask: undefined, providerOptions: {} }),
        })

        expect(new URL(sent[0].url).pathname).toBe('/v1/images/generations')
        expect(sent[0].headers.get('authorization')).toBe('Bearer sk-1')
    })

    it('edits through images/edits with the custom key header', async () => {
        const sent = await captureRequests({
            reply: JSON.stringify({ data: [{ b64_json: 'aGk=' }] }),
            send: () => buildImage({ apiKey: 'sk-1', apiKeyHeader: 'x-litellm-api-key' }).doGenerate({
                prompt: 'add a hat',
                n: 1,
                size: undefined,
                aspectRatio: undefined,
                seed: undefined,
                files: [{ type: 'file', mediaType: 'image/png', data: new Uint8Array([137, 80, 78, 71]) }],
                mask: undefined,
                providerOptions: {},
            }),
        })

        expect(new URL(sent[0].url).pathname).toBe('/v1/images/edits')
        expect(sent[0].headers.get('x-litellm-api-key')).toBe('sk-1')
        expect(sent[0].headers.has('authorization')).toBe(false)
    })
})

describe('litellmAuth.buildHeaders', () => {
    it.each([
        { apiKeyHeader: 'Authorization', apiKey: 'sk-1', expected: { Authorization: 'Bearer sk-1' } },
        { apiKeyHeader: 'authorization', apiKey: 'Bearer sk-1', expected: { authorization: 'Bearer sk-1' } },
        { apiKeyHeader: 'AUTHORIZATION', apiKey: ' bearer  sk-1 ', expected: { AUTHORIZATION: 'Bearer sk-1' } },
        { apiKeyHeader: undefined, apiKey: 'sk-1', expected: { authorization: 'Bearer sk-1' } },
        { apiKeyHeader: 'x-litellm-api-key', apiKey: 'Bearer sk-1', expected: { 'x-litellm-api-key': 'Bearer sk-1' } },
    ])('sends $apiKeyHeader the right value for $apiKey', ({ apiKeyHeader, apiKey, expected }) => {
        expect(litellmAuth.buildHeaders({ apiKeyHeader, apiKey })).toEqual(expected)
    })
})

function buildText({ modelId = 'ap-fast', apiKey = 'sk-1', apiKeyHeader = 'authorization', apiStyle }: {
    modelId?: string
    apiKey?: string
    apiKeyHeader?: string
    apiStyle?: 'chat' | 'responses'
}): CallableModel {
    return asCallable(createLanguageModel({
        credentials: aiProviderCredentials({ provider: AIProviderName.LITELLM, auth: { apiKey }, config: { apiKeyHeader, baseUrl: BASE_URL, models: [REASONING_MODEL, PLAIN_MODEL], apiStyle } }),
        modelId,
    }))
}

function buildImage({ apiKey, apiKeyHeader = 'authorization' }: { apiKey: string, apiKeyHeader?: string }): CallableImageModel {
    const model = createImageModel({
        credentials: aiProviderCredentials({ provider: AIProviderName.LITELLM, auth: { apiKey }, config: { apiKeyHeader, baseUrl: BASE_URL, models: [] } }),
        modelId: 'prod-image',
    })
    if (!hasMethods<CallableImageModel>({ model, methods: ['doGenerate'] })) {
        throw new Error('expected an image model')
    }
    return model
}

function asCallable(model: ReturnType<typeof createLanguageModel>): CallableModel {
    if (!hasMethods<CallableModel>({ model, methods: ['doGenerate', 'doStream'] })) {
        throw new Error('expected a model object')
    }
    return model
}

function hasMethods<T>({ model, methods }: { model: unknown, methods: string[] }): model is T {
    return typeof model === 'object' && model !== null && methods.every((method) => method in model)
}

function generate({ model, ...options }: { model: CallableModel } & Record<string, unknown>): Promise<unknown> {
    return model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }], ...options })
}

async function captureRequests({ send, reply = '{}' }: { send: () => Promise<unknown>, reply?: string }): Promise<SentRequest[]> {
    const original = globalThis.fetch
    const sent: SentRequest[] = []
    globalThis.fetch = (input, init) => {
        sent.push({ url: String(input), headers: new Headers(init?.headers), body: typeof init?.body === 'string' ? JSON.parse(init.body) : {} })
        return Promise.resolve(new Response(reply, { headers: { 'content-type': 'application/json' } }))
    }
    try {
        await send().catch(() => undefined)
    }
    finally {
        globalThis.fetch = original
    }
    return sent
}

async function replyingWith<T>({ body, contentType, send }: { body: string, contentType: string, send: () => Promise<T> }): Promise<T> {
    const original = globalThis.fetch
    globalThis.fetch = () => Promise.resolve(new Response(body, { headers: { 'content-type': contentType } }))
    try {
        return await send()
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

type SentRequest = { url: string, headers: Headers, body: Record<string, unknown> }

type CallableModel = {
    doGenerate: (options: Record<string, unknown>) => Promise<{ content: { type: string, text?: string }[] }>
    doStream: (options: Record<string, unknown>) => Promise<{ stream: ReadableStream<{ type: string }> }>
}

type CallableImageModel = {
    doGenerate: (options: Record<string, unknown>) => Promise<unknown>
}
