import { AIProviderName, isNil, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils';
import { createLanguageModel } from '@activepieces/ai-providers';
import { AI_PROVIDER_CAPABILITIES, AIWebSearchMode, BaseAIProviderAuthConfig, CloudflareGatewayProviderConfig, getEffectiveProviderAndModel, splitCloudflareGatewayModelId } from '@activepieces/shared';
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { EmbeddingModel, LanguageModel, ToolSet } from 'ai'

const DEFAULT_WEB_SEARCH_RESULTS = 5
const MIN_OPENROUTER_WEB_SEARCH_RESULTS = 1
const MAX_OPENROUTER_WEB_SEARCH_RESULTS = 10
export const EMBEDDING_DIMENSIONS = 768
const OPENAI_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

const OPENROUTER_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openrouter: { dimensions: EMBEDDING_DIMENSIONS },
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

// Which providers support web search (and how) is declared in AI_PROVIDER_CAPABILITIES; the native
// tool builders stay here because they need the provider SDKs. AI_PROVIDER_CAPABILITIES lists no
// web-search mode for OPENAI, so supportsWebSearch gates it off for callers that ask; a caller that
// names OPENAI outright still gets the Responses-API tool below. Keyed on the provider that serves
// the model, which is why buildWebSearchTools resolves through getEffectiveProviderAndModel first:
// a Cloudflare Gateway model is served by whichever submodel its id names, and there is no
// CLOUDFLARE_GATEWAY entry here to fall back to.
const NATIVE_WEB_SEARCH_TOOLS: Record<string, (params: NativeWebSearchToolParams) => ToolSet> = {
    [AIProviderName.ANTHROPIC]: ({ auth: { apiKey }, options }) => ({
        web_search: createAnthropic({ apiKey }).tools.webSearch_20250305({
            maxUses: options.maxUses ?? DEFAULT_WEB_SEARCH_RESULTS,
            ...spreadIfDefined('userLocation', buildUserLocation(options)),
            ...spreadIfDefined('allowedDomains', allowedSearchDomains(options)),
            ...spreadIfDefined('blockedDomains', blockedSearchDomains(options)),
        }),
    }),
    [AIProviderName.OPENAI]: ({ auth: { apiKey }, options }) => ({
        web_search_preview: createOpenAI({ apiKey }).tools.webSearchPreview({
            ...spreadIfDefined('searchContextSize', options.searchContextSize),
            ...spreadIfDefined('userLocation', buildUserLocation(options)),
        }),
    }),
    [AIProviderName.GOOGLE]: ({ auth: { apiKey } }) => ({ google_search: createGoogleGenerativeAI({ apiKey }).tools.googleSearch({}) }),
}

function supportsWebSearch(provider: AIProviderName): boolean {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch !== undefined
}

function buildWebSearchTools({ provider, model, auth, options = {} }: {
    provider: AIProviderName
    model?: string
    auth: Record<string, unknown>
    options?: WebSearchOptions
}): ToolSet {
    const { provider: searchProvider } = getEffectiveProviderAndModel({ provider, model })
    return NATIVE_WEB_SEARCH_TOOLS[searchProvider ?? provider]?.({ auth: auth as BaseAIProviderAuthConfig, options }) ?? {}
}

function webSearchModeOf(provider: AIProviderName): AIWebSearchMode | undefined {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch
}

function buildWebSearchToolsOrThrow({ provider, model, auth, webSearchEnabled, options = {} }: {
    provider: AIProviderName
    model?: string
    auth: Record<string, unknown>
    webSearchEnabled: boolean
    options?: WebSearchOptions
}): ToolSet {
    if (!webSearchEnabled) {
        return {}
    }
    const { provider: searchProvider } = getEffectiveProviderAndModel({ provider, model })
    const resolvedProvider = searchProvider ?? provider
    if (AI_PROVIDER_CAPABILITIES[provider].webSearch === 'plugin') {
        return {}
    }
    if (isNil(NATIVE_WEB_SEARCH_TOOLS[resolvedProvider])) {
        throw new Error(`Provider ${resolvedProvider} is not supported for web search`)
    }
    return buildWebSearchTools({ provider, model, auth, options })
}

function buildUserLocation(options: WebSearchOptions): UserLocation | undefined {
    const location = {
        ...spreadIfDefined('city', options.userLocationCity),
        ...spreadIfDefined('region', options.userLocationRegion),
        ...spreadIfDefined('country', options.userLocationCountry),
        ...spreadIfDefined('timezone', options.userLocationTimezone),
    }
    return Object.keys(location).length === 0 ? undefined : { type: 'approximate', ...location }
}

function allowedSearchDomains(options: WebSearchOptions): string[] | undefined {
    const domains = options.allowedDomains?.map(({ domain }) => domain) ?? []
    return domains.length === 0 ? undefined : domains
}

function blockedSearchDomains(options: WebSearchOptions): string[] | undefined {
    if (!isNil(allowedSearchDomains(options))) {
        return undefined
    }
    const domains = options.blockedDomains?.map(({ domain }) => domain) ?? []
    return domains.length === 0 ? undefined : domains
}

function openRouterModelSettings({ provider, webSearchEnabled, options }: {
    provider: AIProviderName
    webSearchEnabled: boolean
    options?: WebSearchOptions
}): OpenRouterChatSettings | undefined {
    if (!webSearchEnabled || AI_PROVIDER_CAPABILITIES[provider].webSearch !== 'plugin') {
        return undefined
    }
    const maxResults = Math.min(
        Math.max(options?.maxUses ?? DEFAULT_WEB_SEARCH_RESULTS, MIN_OPENROUTER_WEB_SEARCH_RESULTS),
        MAX_OPENROUTER_WEB_SEARCH_RESULTS,
    )
    return { plugins: [{ id: 'web', max_results: maxResults }] }
}

function createModel({ provider, auth, config, modelId, metadata, webSearchEnabled = false, webSearchOptions, onOutcome }: {
    provider: AIProviderName
    auth: Record<string, unknown>
    config: Record<string, unknown>
    modelId: string
    metadata?: ChatModelMetadata
    webSearchEnabled?: boolean
    webSearchOptions?: WebSearchOptions
    onOutcome?: ProviderOutcomeReporter
}): LanguageModel {
    if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
        const { apiKey } = auth as BaseAIProviderAuthConfig
        const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig
        const { model: actualModelId } = splitCloudflareGatewayModelId(modelId)
        return createOpenAICompatible({
            name: 'cloudflare',
            baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
            headers: { 'cf-aig-authorization': `Bearer ${apiKey}` },
            ...spreadIfDefined('fetch', observedProviderFetch(onOutcome)),
        }).chatModel(actualModelId)
    }
    return createLanguageModel({
        provider,
        auth,
        config,
        modelId,
        options: {
            openRouterSettings: openRouterModelSettings({ provider, webSearchEnabled, options: webSearchOptions }),
            mistralViaOpenRouter: true,
            ...spreadIfDefined('extraHeaders', managedProviderMetadataHeaders({ provider, metadata })),
            ...spreadIfDefined('onOutcome', onOutcome),
        },
    })
}

function readStringField(source: Record<string, unknown>, key: string): string {
    const value = source[key]
    return typeof value === 'string' ? value : ''
}

function toStorageEmbedding(embedding: number[]): number[] {
    if (embedding.length < EMBEDDING_DIMENSIONS) {
        throw new Error(`This embedding model returns ${embedding.length} dimensions, fewer than the ${EMBEDDING_DIMENSIONS} a knowledge base stores`)
    }
    const truncated = embedding.slice(0, EMBEDDING_DIMENSIONS)
    const magnitude = Math.sqrt(truncated.reduce((sum, value) => sum + value * value, 0))
    return magnitude === 0 ? truncated : truncated.map((value) => value / magnitude)
}

function createEmbeddingModel({ provider, auth, config, onOutcome }: {
    provider: AIProviderName
    auth: Record<string, unknown>
    config: Record<string, unknown>
    onOutcome?: ProviderOutcomeReporter
}): { model: EmbeddingModel, providerOptions: SharedV3ProviderOptions } {
    const embeddingModelId = AI_PROVIDER_CAPABILITIES[provider].defaultEmbeddingModel
    if (isNil(embeddingModelId)) {
        throw new Error(`Provider ${provider} does not support knowledge base search`)
    }
    const apiKey = readStringField(auth, 'apiKey')
    const fetch = observedProviderFetch(onOutcome)
    switch (provider) {
        case AIProviderName.OPENAI:
            return { model: createOpenAI({ apiKey, ...spreadIfDefined('fetch', fetch) }).embeddingModel(embeddingModelId), providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        case AIProviderName.GOOGLE:
            return { model: createGoogleGenerativeAI({ apiKey, ...spreadIfDefined('fetch', fetch) }).textEmbeddingModel(embeddingModelId), providerOptions: {} }
        case AIProviderName.AZURE: {
            const resourceName = readStringField(config, 'resourceName')
            const apiVersion = readStringField(config, 'apiVersion')
            return {
                model: createAzure({ resourceName, apiKey, ...spreadIfDefined('apiVersion', apiVersion || undefined), ...spreadIfDefined('fetch', fetch) }).embeddingModel(embeddingModelId),
                providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS,
            }
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return { model: createOpenRouter({ apiKey, ...spreadIfDefined('fetch', fetch) }).textEmbeddingModel(embeddingModelId), providerOptions: OPENROUTER_EMBEDDING_PROVIDER_OPTIONS }
        default:
            throw new Error(`Provider ${provider} does not support knowledge base search`)
    }
}

function managedProviderMetadataHeaders({ provider, metadata }: {
    provider: AIProviderName
    metadata?: ChatModelMetadata
}): Record<string, string> | undefined {
    if (isNil(metadata) || provider !== AIProviderName.ACTIVEPIECES) {
        return undefined
    }
    return {
        'x-ap-platform-id': metadata.platformId,
        'x-ap-conversation-id': metadata.conversationId,
        ...spreadIfDefined('x-ap-run-id', metadata.runId),
    }
}

export const aiUtils = {
    createModel,
    createEmbeddingModel,
    toStorageEmbedding,
    supportsWebSearch,
    buildWebSearchTools,
    webSearchModeOf,
    buildWebSearchToolsOrThrow,
}

type NativeWebSearchToolParams = {
    auth: BaseAIProviderAuthConfig
    options: WebSearchOptions
}

type UserLocation = {
    type: 'approximate'
    city?: string
    region?: string
    country?: string
    timezone?: string
}

type WebSearchOptions = {
    maxUses?: number
    includeSources?: boolean
    userLocationCity?: string
    userLocationRegion?: string
    userLocationCountry?: string
    userLocationTimezone?: string
    allowedDomains?: { domain: string }[]
    blockedDomains?: { domain: string }[]
    searchContextSize?: 'low' | 'medium' | 'high'
}

type ChatModelMetadata = {
    platformId: string
    conversationId: string
    runId?: string
}

export type { ChatModelMetadata, WebSearchOptions }
