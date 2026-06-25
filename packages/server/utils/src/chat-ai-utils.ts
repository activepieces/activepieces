import { AIProviderName, spreadIfDefined } from '@activepieces/core-utils';
import { AzureProviderConfig, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, chatPersistenceUtils, chatToolClassification, CloudflareGatewayProviderConfig, OpenAICompatibleProviderConfig, PersistedChatPart, PersistedChatPartType, PersistedToolCallStatus, splitCloudflareGatewayModelId } from '@activepieces/shared';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { LanguageModel, ModelMessage, SystemModelMessage, ToolSet } from 'ai'

const MAX_WEB_SEARCH_RESULTS = 5

const KEEP_RECENT_TOOL_RESULTS = 6
const COLLAPSE_OUTPUT_OVER_CHARS = 600
const CHARS_PER_TOKEN_ESTIMATE = 4

type WebSearchSupport = {
    nativeTools?: (auth: BaseAIProviderAuthConfig) => ToolSet
    plugin?: boolean
}

// OpenAI is absent on purpose: its web search needs the Responses API, which breaks legacy BYOK models.
const WEB_SEARCH_BY_PROVIDER: Partial<Record<AIProviderName, WebSearchSupport>> = {
    [AIProviderName.ANTHROPIC]: {
        nativeTools: ({ apiKey }) => ({ web_search: createAnthropic({ apiKey }).tools.webSearch_20250305({ maxUses: MAX_WEB_SEARCH_RESULTS }) }),
    },
    [AIProviderName.GOOGLE]: {
        nativeTools: ({ apiKey }) => ({ google_search: createGoogleGenerativeAI({ apiKey }).tools.googleSearch({}) }),
    },
    [AIProviderName.OPENROUTER]: { plugin: true },
    [AIProviderName.ACTIVEPIECES]: { plugin: true },
}

function supportsWebSearch(provider: AIProviderName): boolean {
    return WEB_SEARCH_BY_PROVIDER[provider] !== undefined
}

function buildWebSearchTools({ provider, auth }: {
    provider: AIProviderName
    auth: Record<string, unknown>
}): ToolSet {
    return WEB_SEARCH_BY_PROVIDER[provider]?.nativeTools?.(auth as BaseAIProviderAuthConfig) ?? {}
}

function openRouterModelSettings(provider: AIProviderName, webSearchEnabled: boolean): OpenRouterChatSettings | undefined {
    if (!webSearchEnabled || !WEB_SEARCH_BY_PROVIDER[provider]?.plugin) {
        return undefined
    }
    return { plugins: [{ id: 'web', max_results: MAX_WEB_SEARCH_RESULTS }] }
}

function createChatModel({ provider, auth, config, modelId, webSearchEnabled = false }: {
    provider: AIProviderName
    auth: Record<string, unknown>
    config: Record<string, unknown>
    modelId: string
    webSearchEnabled?: boolean
}): LanguageModel {
    switch (provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenAI({ apiKey }).chat(modelId)
        }
        case AIProviderName.ANTHROPIC: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createAnthropic({ apiKey })(modelId)
        }
        case AIProviderName.GOOGLE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createGoogleGenerativeAI({ apiKey })(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { resourceName } = config as AzureProviderConfig
            return createAzure({ resourceName, apiKey }).chat(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = auth as BedrockProviderAuthConfig
            const { region } = config as BedrockProviderConfig
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey })(modelId)
        }
        case AIProviderName.CLOUDFLARE_GATEWAY: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig
            const { model: actualModelId } = splitCloudflareGatewayModelId(modelId)
            return createOpenAICompatible({
                name: 'cloudflare',
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                headers: { 'cf-aig-authorization': `Bearer ${apiKey}` },
            }).chatModel(actualModelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { apiKeyHeader, baseUrl, defaultHeaders } = config as OpenAICompatibleProviderConfig
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: {
                    ...(defaultHeaders ?? {}),
                    [apiKeyHeader]: apiKey,
                },
            }).chatModel(modelId)
        }
        case AIProviderName.MISTRAL:
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenRouter({ apiKey }).chat(modelId, openRouterModelSettings(provider, webSearchEnabled)) as LanguageModel
        }
        default: {
            const exhaustiveCheck: never = provider
            throw new Error(`Unsupported chat provider: ${exhaustiveCheck}`)
        }
    }
}

/**
 * Strips for ALL providers (not just non-thinking ones) because Anthropic rejects
 * a re-sent `thinking` block whose `signature` didn't survive our DB round-trip /
 * compaction / truncation reshaping ("Invalid `signature` in `thinking` block"),
 * and prior-turn reasoning adds nothing the text + tool results don't already carry.
 * In-flight thinking within one streamText call keeps its intact signature and is
 * untouched — this only touches the cross-turn history we assemble.
 */
function stripThinkingBlocks(messages: ModelMessage[], _provider: AIProviderName): ModelMessage[] {
    const hasThinking = messages.some(
        (msg) => msg.role === 'assistant' && Array.isArray(msg.content)
            && (msg.content as Array<Record<string, unknown>>).some(
                (part) => part['type'] === 'reasoning' || part['type'] === 'thinking',
            ),
    )
    if (!hasThinking) return messages

    return messages
        .map((msg) => {
            if (msg.role !== 'assistant' || !Array.isArray(msg.content)) return msg
            const filtered = (msg.content as Array<Record<string, unknown>>).filter(
                (part) => part['type'] !== 'reasoning' && part['type'] !== 'thinking',
            )
            if (filtered.length === msg.content.length) return msg
            if (filtered.length === 0) return null
            return { ...msg, content: filtered }
        })
        .filter((msg): msg is ModelMessage => msg !== null)
}

function sanitizeTruncatedAssistantTail(messages: ModelMessage[]): ModelMessage[] {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant' || !Array.isArray(last.content)) {
        return messages
    }

    const resolvedToolCallIds = new Set(
        messages
            .flatMap((msg) => (msg.role === 'tool' && Array.isArray(msg.content) ? msg.content : []))
            .flatMap((part) => (part.type === 'tool-result' ? [part.toolCallId] : [])),
    )

    const sanitizedParts = last.content.filter((part) => {
        if (part.type === 'reasoning') {
            return false
        }
        if (part.type === 'tool-call') {
            return resolvedToolCallIds.has(part.toolCallId)
        }
        return true
    })

    const head = messages.slice(0, -1)
    if (sanitizedParts.length === 0) {
        return head
    }
    if (sanitizedParts.length === last.content.length) {
        return messages
    }
    return [...head, { ...last, content: sanitizedParts }]
}

/**
 * The response messages of a streamText turn. Each step's `response.messages` is
 * CUMULATIVE — it already contains every prior step's assistant/tool messages — so the
 * last step holds the complete set. Flat-mapping all steps instead would re-emit earlier
 * steps in a 4,3,2,1 staircase, persisting (and re-sending to the model) the same tool
 * call and reasoning block multiple times. Take the last step only.
 */
function collectStepMessages(steps: Array<{ response: { messages: ModelMessage[] } }>): ModelMessage[] {
    return steps[steps.length - 1]?.response.messages ?? []
}

/**
 * Every step's response messages flattened — the full set of messages generated
 * so far within a single streamText call (unlike collectStepMessages, which is
 * only the last step). Prepend the turn's base messages to reconstruct the
 * complete context the model would see at the current step.
 */
function collectAllStepMessages(steps: Array<{ response: { messages: ModelMessage[] } }>): ModelMessage[] {
    return steps.flatMap((step) => step.response.messages)
}

function estimateTokenCount({ messages, systemPromptLength }: { messages: ModelMessage[], systemPromptLength: number }): number {
    return Math.ceil((JSON.stringify(messages).length + systemPromptLength) / CHARS_PER_TOKEN_ESTIMATE)
}

/**
 * A tool result's full payload is only needed while the model is acting on it;
 * older oversized results just dilute the context and can overflow the window.
 * Keeps the most recent results intact and replaces older oversized ones with a
 * short marker. Never removes a message (keeps tool_use/tool_result pairing
 * valid) and never mutates the input. Pure.
 */
function collapseStaleToolOutputs({ messages }: { messages: ModelMessage[] }): ModelMessage[] {
    const totalToolResults = messages.reduce((count, message) => {
        if (message.role !== 'tool' || !Array.isArray(message.content)) return count
        return count + message.content.filter((part) => part.type === 'tool-result').length
    }, 0)

    const staleCount = totalToolResults - KEEP_RECENT_TOOL_RESULTS
    if (staleCount <= 0) return messages

    let seen = 0
    return messages.map((message) => {
        if (message.role !== 'tool' || !Array.isArray(message.content)) return message
        const content = message.content.map((part) => {
            if (part.type !== 'tool-result') return part
            const isStale = seen++ < staleCount
            if (!isStale) return part
            const serialized = typeof part.output === 'string' ? part.output : JSON.stringify(part.output)
            if (serialized.length <= COLLAPSE_OUTPUT_OVER_CHARS) return part
            return {
                ...part,
                output: { type: 'text' as const, value: `[earlier ${part.toolName} result omitted to save context — it was used at the time]` },
            }
        })
        return { ...message, content }
    })
}

function buildProviderOptions({ provider, tier, disableThinking = false }: { provider: AIProviderName, tier: { id: string, thinkingBudget: number }, disableThinking?: boolean }): SharedV3ProviderOptions {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return { anthropic: { thinking: disableThinking ? { type: 'disabled' } : { type: 'enabled', budgetTokens: tier.thinkingBudget } } }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return { openrouter: { cache_control: { type: 'ephemeral' }, reasoning: disableThinking ? { enabled: false } : { max_tokens: tier.thinkingBudget } } }
        default:
            return {}
    }
}

function buildSystemPromptWithCaching({ systemPrompt, provider }: { systemPrompt: string, provider: AIProviderName }): string | SystemModelMessage {
    switch (provider) {
        case AIProviderName.ANTHROPIC:
        case AIProviderName.BEDROCK:
            return { role: 'system', content: systemPrompt, providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }
        default:
            return systemPrompt
    }
}

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

type ContentPartLike = {
    type: string
    text?: string
    toolCallId?: string
    toolName?: string
    input?: unknown
    args?: unknown
    output?: unknown
    sourceType?: string
    id?: string
    url?: string
    title?: string
    mediaType?: string
    filename?: string
}

function buildStepParts({ content }: {
    content: ContentPartLike[]
}): PersistedChatPart[] {
    const resultMap = new Map<string, ContentPartLike>()
    for (const part of content) {
        if ((part.type === 'tool-result' || part.type === 'tool-error') && part.toolCallId) {
            resultMap.set(part.toolCallId, part)
        }
    }

    const parts: PersistedChatPart[] = []
    for (const part of content) {
        switch (part.type) {
            case 'reasoning':
                if (part.text) parts.push({ type: PersistedChatPartType.REASONING, text: part.text })
                break
            case 'text':
                if (part.text) parts.push({ type: PersistedChatPartType.TEXT, text: part.text })
                break
            case 'source':
                if (part.sourceType === 'url' && part.url) {
                    parts.push({
                        type: PersistedChatPartType.SOURCE_URL,
                        sourceId: part.id ?? '',
                        url: part.url,
                        ...spreadIfDefined('title', part.title),
                    })
                }
                else if (part.sourceType === 'document') {
                    parts.push({
                        type: PersistedChatPartType.SOURCE_DOCUMENT,
                        sourceId: part.id ?? '',
                        mediaType: part.mediaType ?? '',
                        title: part.title ?? '',
                        ...spreadIfDefined('filename', part.filename),
                    })
                }
                break
            case 'tool-call': {
                const toolName = part.toolName ?? ''
                const input = toRecord(part.args ?? part.input)
                if (toolName === 'ap_update_thinking_status') {
                    const statusText = typeof input['status'] === 'string' ? input['status'] : ''
                    if (statusText) {
                        parts.push({ type: PersistedChatPartType.THINKING_STATUS, text: statusText })
                    }
                    break
                }
                const result = part.toolCallId ? resultMap.get(part.toolCallId) : undefined
                const rawOutput = result?.output ? chatPersistenceUtils.unwrapToolOutput(result.output) : undefined
                const title = typeof input['title'] === 'string' ? input['title'] : undefined
                const description = typeof input['description'] === 'string' ? input['description'] : undefined
                parts.push({
                    type: PersistedChatPartType.TOOL_CALL,
                    toolCallId: part.toolCallId ?? '',
                    toolName,
                    ...spreadIfDefined('title', title),
                    ...spreadIfDefined('description', description),
                    input,
                    output: rawOutput,
                    status: result ? PersistedToolCallStatus.COMPLETED : PersistedToolCallStatus.ERROR,
                })
                if (toolName === 'ap_execute_action' && typeof rawOutput === 'object' && rawOutput !== null && 'batchProgress' in rawOutput) {
                    parts.push({
                        type: PersistedChatPartType.BATCH_PROGRESS,
                        data: (rawOutput as Record<string, unknown>)['batchProgress'] as Record<string, unknown>,
                    })
                }
                if (toolName === 'ap_set_build_plan') {
                    const buildId = typeof toRecord(rawOutput)['buildId'] === 'string' ? toRecord(rawOutput)['buildId'] : undefined
                    if (typeof buildId === 'string') {
                        parts.push({
                            type: PersistedChatPartType.BUILD_PLAN,
                            buildId,
                            data: { ...input, updatedAt: new Date().toISOString() },
                        })
                    }
                }
                if (toolName === 'ap_generate_image' && result) {
                    const out = typeof rawOutput === 'object' && rawOutput !== null ? rawOutput as Record<string, unknown> : {}
                    const imageUrl = typeof out['url'] === 'string' ? out['url'] : undefined
                    const imageFileId = typeof out['fileId'] === 'string' ? out['fileId'] : undefined
                    if (imageUrl && imageFileId) {
                        parts.push({
                            type: PersistedChatPartType.IMAGE,
                            toolCallId: part.toolCallId ?? '',
                            fileId: imageFileId,
                            url: imageUrl,
                            mediaType: typeof out['mediaType'] === 'string' ? out['mediaType'] : 'image/png',
                            ...spreadIfDefined('prompt', typeof out['prompt'] === 'string' ? out['prompt'] : undefined),
                            ...spreadIfDefined('model', typeof out['model'] === 'string' ? out['model'] : undefined),
                            ...spreadIfDefined('title', title),
                            timestamp: new Date().toISOString(),
                        })
                    }
                }
                if (toolName === 'ap_run_code' && result) {
                    const out = typeof rawOutput === 'object' && rawOutput !== null ? rawOutput as Record<string, unknown> : {}
                    const producedFiles = Array.isArray(out['producedFiles']) ? out['producedFiles'] : []
                    for (const file of producedFiles) {
                        if (typeof file !== 'object' || file === null) continue
                        const fileRecord = file as Record<string, unknown>
                        const fileUrl = typeof fileRecord['url'] === 'string' ? fileRecord['url'] : undefined
                        const fileId = typeof fileRecord['fileId'] === 'string' ? fileRecord['fileId'] : undefined
                        if (!fileUrl || !fileId) continue
                        parts.push({
                            type: PersistedChatPartType.FILE,
                            toolCallId: part.toolCallId ?? '',
                            fileId,
                            url: fileUrl,
                            mediaType: typeof fileRecord['mediaType'] === 'string' ? fileRecord['mediaType'] : 'application/octet-stream',
                            fileName: typeof fileRecord['fileName'] === 'string' ? fileRecord['fileName'] : 'file',
                            byteSize: typeof fileRecord['byteSize'] === 'number' ? fileRecord['byteSize'] : 0,
                            ...spreadIfDefined('title', title),
                            timestamp: new Date().toISOString(),
                        })
                    }
                }
                if (toolName === 'ap_execute_action' && result) {
                    const outputRecord = typeof rawOutput === 'object' && rawOutput !== null ? rawOutput as Record<string, unknown> : {}
                    const meta = typeof outputRecord['_meta'] === 'object' && outputRecord['_meta'] !== null ? outputRecord['_meta'] as Record<string, unknown> : undefined
                    const connectionLabel = typeof meta?.['connectionLabel'] === 'string' ? meta['connectionLabel'] : undefined
                    const firstContentText = Array.isArray(outputRecord['content']) && typeof outputRecord['content'][0]?.['text'] === 'string' ? outputRecord['content'][0]['text'] as string : ''
                    const isAppSuccess = result.type === 'tool-result'
                        && outputRecord['success'] !== false
                        && outputRecord['isError'] !== true
                        && !chatToolClassification.hasFailureTextPrefix(firstContentText)
                        && !firstContentText.includes('cancelled by user')
                    const errorText = !isAppSuccess && firstContentText
                        ? firstContentText
                        : (result.type === 'tool-error' && typeof result.output === 'string' ? result.output : undefined)
                    parts.push({
                        type: PersistedChatPartType.ACTION_RECEIPT,
                        toolCallId: part.toolCallId ?? '',
                        actionDisplayName: title ?? toolName,
                        pieceName: typeof input['pieceName'] === 'string' ? input['pieceName'] : '',
                        ...spreadIfDefined('connectionLabel', connectionLabel),
                        status: isAppSuccess ? 'success' : 'failed',
                        output: rawOutput,
                        ...spreadIfDefined('errorMessage', errorText),
                        timestamp: new Date().toISOString(),
                    })
                }
                break
            }
        }
    }
    return parts
}

export const chatAiUtils = {
    createChatModel,
    supportsWebSearch,
    buildWebSearchTools,
    stripThinkingBlocks,
    sanitizeTruncatedAssistantTail,
    collectStepMessages,
    collectAllStepMessages,
    estimateTokenCount,
    collapseStaleToolOutputs,
    buildProviderOptions,
    buildSystemPromptWithCaching,
    buildStepParts,
}

export type { ContentPartLike }
