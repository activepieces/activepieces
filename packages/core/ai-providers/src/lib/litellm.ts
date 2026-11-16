import { AiProviderCredentials, AIProviderName, isNil, observedProviderFetch, ProviderOutcomeReporter, tryCatchSync } from '@activepieces/core-utils'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { defaultSettingsMiddleware, ImageModel, LanguageModel, LanguageModelMiddleware, wrapLanguageModel } from 'ai'

function createLitellmLanguageModel({ credentials, modelId, onOutcome, extraHeaders }: LitellmModelParams): LanguageModel {
    const { apiKey } = credentials.auth
    const { apiKeyHeader, baseUrl, defaultHeaders, apiStyle, models } = credentials.config
    const headers = buildHeaders({ apiKeyHeader, apiKey: apiKey ?? '', defaultHeaders, extraHeaders })
    const reasons = models?.find((model) => model.modelId === modelId)?.metadata?.supportsReasoning === true
    const observedFetch = observedProviderFetch(onOutcome)
    if (apiStyle === 'chat') {
        const chat = createOpenAICompatible({ name: LITELLM_OPTIONS_KEY, baseURL: baseUrl ?? '', headers, fetch: observedFetch }).chatModel(modelId)
        return reasons ? withReasoningEffort({ model: chat, providerOptions: { [LITELLM_OPTIONS_KEY]: { reasoningEffort: REASONING_EFFORT } } }) : chat
    }
    const patchedFetch = withReasoningSummaries(observedFetch)
    const responses = createOpenAI({
        baseURL: baseUrl,
        apiKey: apiKey ?? '',
        headers,
        fetch: carriesAuthorization(headers) ? patchedFetch : withoutAuthorization(patchedFetch),
    }).responses(modelId)
    const model = reasons ? withReasoningEffort({ model: responses, providerOptions: { openai: { forceReasoning: true, reasoningEffort: REASONING_EFFORT } } }) : responses
    return wrapLanguageModel({
        model,
        middleware: defaultSettingsMiddleware({ settings: { providerOptions: { openai: { store: false } } } }),
    })
}

function createLitellmImageModel({ credentials, modelId, onOutcome, extraHeaders }: LitellmModelParams): ImageModel {
    const { apiKey } = credentials.auth
    const { apiKeyHeader, baseUrl, defaultHeaders } = credentials.config
    return createOpenAICompatible({
        name: LITELLM_OPTIONS_KEY,
        baseURL: baseUrl ?? '',
        headers: buildHeaders({ apiKeyHeader, apiKey: apiKey ?? '', defaultHeaders, extraHeaders }),
        fetch: observedProviderFetch(onOutcome),
    }).imageModel(modelId)
}

function buildHeaders({ apiKeyHeader, apiKey, defaultHeaders, extraHeaders }: {
    apiKeyHeader?: string
    apiKey: string
    defaultHeaders?: Record<string, string>
    extraHeaders?: Record<string, string>
}): Record<string, string> {
    const header = isNil(apiKeyHeader) || apiKeyHeader.trim() === '' ? AUTHORIZATION_HEADER : apiKeyHeader
    const isAuthorization = header.trim().toLowerCase() === AUTHORIZATION_HEADER
    return {
        ...(extraHeaders ?? {}),
        ...(defaultHeaders ?? {}),
        [header]: isAuthorization ? `Bearer ${apiKey.trim().replace(/^bearer\s+/i, '')}` : apiKey,
    }
}

function carriesAuthorization(headers: Record<string, string>): boolean {
    return Object.keys(headers).some((key) => key.trim().toLowerCase() === AUTHORIZATION_HEADER)
}

function withoutAuthorization(delegate: typeof globalThis.fetch): typeof globalThis.fetch {
    return (input, init) => {
        const sent = new Headers(init?.headers)
        sent.delete(AUTHORIZATION_HEADER)
        return delegate(input, { ...init, headers: sent })
    }
}

function withReasoningEffort({ model, providerOptions }: {
    model: WrappableModel
    providerOptions: Record<string, Record<string, string | boolean>>
}): WrappableModel {
    return wrapLanguageModel({
        model,
        middleware: [defaultSettingsMiddleware({ settings: { providerOptions } }), withoutTemperature],
    })
}

function withReasoningSummaries(delegate?: typeof globalThis.fetch): typeof globalThis.fetch {
    return async (input, init) => {
        const response = await (delegate ?? globalThis.fetch)(input, init)
        const contentType = response.headers.get('content-type') ?? ''
        if (!response.ok || isNil(response.body)) {
            return response
        }
        if (contentType.includes('application/json')) {
            const text = await response.text()
            return rebuild({ response, body: patchJsonReply(text) ?? text })
        }
        if (contentType.includes('text/event-stream')) {
            return rebuild({ response, body: response.body.pipeThrough(new TextDecoderStream()).pipeThrough(patchSseLines()).pipeThrough(new TextEncoderStream()) })
        }
        return response
    }
}

function rebuild({ response, body }: { response: Response, body: BodyInit }): Response {
    const headers = new Headers(response.headers)
    headers.delete('content-length')
    return new Response(body, { status: response.status, statusText: response.statusText, headers })
}

function patchJsonReply(text: string): string | undefined {
    const patched = patchResponse(parseJson(text))
    return isNil(patched) ? undefined : JSON.stringify(patched)
}

function patchSseLines(): TransformStream<string, string> {
    let pending = ''
    return new TransformStream({
        transform: (chunk, controller) => {
            const lines = (pending + chunk).split('\n')
            pending = lines.pop() ?? ''
            controller.enqueue(lines.map((line) => `${patchSseLine(line)}\n`).join(''))
        },
        flush: (controller) => {
            if (pending !== '') {
                controller.enqueue(patchSseLine(pending))
            }
        },
    })
}

function patchSseLine(line: string): string {
    if (!line.startsWith(SSE_DATA_PREFIX)) {
        return line
    }
    const patched = patchEvent(parseJson(line.slice(SSE_DATA_PREFIX.length)))
    return isNil(patched) ? line : `${SSE_DATA_PREFIX} ${JSON.stringify(patched)}${line.endsWith('\r') ? '\r' : ''}`
}

function patchEvent(event: unknown): Record<string, unknown> | undefined {
    if (!isRecord(event)) {
        return undefined
    }
    if (event['type'] === 'response.output_item.added' || event['type'] === 'response.output_item.done') {
        return lacksSummary(event['item']) ? { ...event, item: withSummary(event['item']) } : undefined
    }
    if (event['type'] === 'response.completed') {
        const response = patchResponse(event['response'])
        return isNil(response) ? undefined : { ...event, response }
    }
    return undefined
}

function patchResponse(response: unknown): Record<string, unknown> | undefined {
    if (!isRecord(response) || !Array.isArray(response['output']) || !response['output'].some(lacksSummary)) {
        return undefined
    }
    return { ...response, output: response['output'].map(withSummary) }
}

function withSummary(item: unknown): unknown {
    return lacksSummary(item) ? { ...item, summary: [] } : item
}

function lacksSummary(item: unknown): item is Record<string, unknown> {
    return isRecord(item) && item['type'] === 'reasoning' && isNil(item['summary'])
}

function parseJson(text: string): unknown {
    return tryCatchSync<unknown>(() => JSON.parse(text)).data
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const AUTHORIZATION_HEADER = 'authorization'
const LITELLM_OPTIONS_KEY = 'litellm'
const REASONING_EFFORT = 'medium'
const SSE_DATA_PREFIX = 'data:'

const withoutTemperature: LanguageModelMiddleware = {
    transformParams: async ({ params }) => ({ ...params, temperature: undefined }),
}

export const litellm = { createLanguageModel: createLitellmLanguageModel, createImageModel: createLitellmImageModel, withReasoningSummaries }

export const litellmAuth = { buildHeaders }

type WrappableModel = Parameters<typeof wrapLanguageModel>[0]['model']

type LitellmModelParams = {
    credentials: Extract<AiProviderCredentials, { provider: AIProviderName.LITELLM }>
    modelId: string
    onOutcome?: ProviderOutcomeReporter
    extraHeaders?: Record<string, string>
}
