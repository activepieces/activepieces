import { aiProviderCredentials, AIProviderName } from '@activepieces/core-utils'
import { describe, expect, it } from 'vitest'
import { createImageModel, createLanguageModel } from './create-language-model'
import { litellmAuth } from './litellm'

const BASE_URL = 'https://litellm.example.test/v1'
const REASONING_MODEL = { modelId: 'prod-smart', modelName: 'prod-smart', modelType: 'text', metadata: { supportsReasoning: true } }
const PLAIN_MODEL = { modelId: 'ap-fast', modelName: 'ap-fast', modelType: 'text' }

describe('LiteLLM language model', () => {
    it.each([
        { apiKeyHeader: 'Authorization' },
        { apiKeyHeader: '' },
    ])('sends chat completions one bearer key for header "$apiKeyHeader" when the key was pasted with Bearer', async ({ apiKeyHeader }) => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiKey: 'Bearer sk-1', apiKeyHeader }) }) })

        expect(new URL(sent[0].url).pathname).toBe('/v1/chat/completions')
        expect(sent[0].headers.get('authorization')).toBe('Bearer sk-1')
    })

    it('stays on chat completions when a responses api style was saved', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiStyle: 'responses' }) }) })

        expect(new URL(sent[0].url).pathname).toBe('/v1/chat/completions')
    })

    it('sends a custom key header the raw key and no Authorization', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ apiKey: 'sk-1', apiKeyHeader: 'x-litellm-api-key' }) }) })

        expect(sent[0].headers.get('x-litellm-api-key')).toBe('sk-1')
        expect(sent[0].headers.has('authorization')).toBe(false)
    })

    it('sends medium effort and no temperature for a reasoning model', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'prod-smart' }), temperature: 0.3 }) })

        expect(sent[0].body.reasoning_effort).toBe('medium')
        expect(sent[0].body).not.toHaveProperty('temperature')
    })

    it('sends no effort for a model that does not reason', async () => {
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'ap-fast' }), temperature: 0.3 }) })

        expect(sent[0].body).not.toHaveProperty('reasoning_effort')
        expect(sent[0].body.temperature).toBe(0.3)
    })

    it('leaves tool_choice on auto for a reasoning model with tools', async () => {
        const tools = [{ type: 'function', name: 'get_weather', description: 'weather', inputSchema: { type: 'object', properties: {} } }]
        const sent = await captureRequests({ send: () => generate({ model: buildText({ modelId: 'prod-smart' }), tools, toolChoice: { type: 'auto' } }) })

        expect(sent[0].body.tool_choice).toBe('auto')
        expect(sent[0].body.tools).toHaveLength(1)
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

function buildImage({ apiKey, apiKeyHeader = 'authorization' }: { apiKey: string, apiKeyHeader?: string }): CallableModel {
    return asCallable(createImageModel({
        credentials: aiProviderCredentials({ provider: AIProviderName.LITELLM, auth: { apiKey }, config: { apiKeyHeader, baseUrl: BASE_URL, models: [] } }),
        modelId: 'prod-image',
    }))
}

function asCallable(model: unknown): CallableModel {
    if (!isCallable(model)) {
        throw new Error('expected a model object')
    }
    return model
}

function isCallable(model: unknown): model is CallableModel {
    return typeof model === 'object' && model !== null && 'doGenerate' in model
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

type SentRequest = { url: string, headers: Headers, body: Record<string, unknown> }

type CallableModel = {
    doGenerate: (options: Record<string, unknown>) => Promise<unknown>
}
