import { ActivepiecesAiBilling, AIProviderName, BYOKBilling, isNil, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils';
import { CloudflareGatewayMetadata, createCloudflareGatewayModel, createImageModel, createLanguageModel } from '@activepieces/ai-providers';
import { AI_PROVIDER_CAPABILITIES, AiProviderCredentials, AIWebSearchMode, getEffectiveProviderAndModel } from '@activepieces/shared';
import { anthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { EmbeddingModel, ImageModel, LanguageModel, ToolSet } from 'ai'
import { billedEmbeddingModel, billedLanguageModel } from './activepieces-ai-cost'
import { keyHealthReporterFor } from './ai-provider-key-health'

const DEFAULT_WEB_SEARCH_RESULTS = 5
const MIN_OPENROUTER_WEB_SEARCH_RESULTS = 1
const MAX_OPENROUTER_WEB_SEARCH_RESULTS = 10
const REPORT_WHAT_THE_CALL_COST = { usage: { include: true } } as const
const EMBEDDING_REPORTS_WHAT_IT_COST = { extraBody: { usage: { include: true } } } as const

const NATIVE_WEB_SEARCH_TOOLS: Record<string, (params: NativeWebSearchToolParams) => ToolSet> = {
    [AIProviderName.ANTHROPIC]: ({ options }) => ({
        web_search: anthropic.tools.webSearch_20250305({
            maxUses: options.maxUses ?? DEFAULT_WEB_SEARCH_RESULTS,
            ...spreadIfDefined('userLocation', buildUserLocation(options)),
            ...spreadIfDefined('allowedDomains', allowedSearchDomains(options)),
            ...spreadIfDefined('blockedDomains', blockedSearchDomains(options)),
        }),
    }),
    [AIProviderName.OPENAI]: ({ options }) => ({
        web_search_preview: openai.tools.webSearchPreview({
            ...spreadIfDefined('searchContextSize', options.searchContextSize),
            ...spreadIfDefined('userLocation', buildUserLocation(options)),
        }),
    }),
    [AIProviderName.GOOGLE]: () => ({ google_search: google.tools.googleSearch({}) }),
}

function supportsWebSearch(provider: AIProviderName): boolean {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch !== undefined
}

function buildWebSearchTools({ provider, model, options = {} }: {
    provider: AIProviderName
    model?: string
    options?: WebSearchOptions
}): ToolSet {
    const { provider: searchProvider } = getEffectiveProviderAndModel({ provider, model })
    return NATIVE_WEB_SEARCH_TOOLS[searchProvider ?? provider]?.({ options }) ?? {}
}

function webSearchModeOf(provider: AIProviderName): AIWebSearchMode | undefined {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch
}

function buildWebSearchToolsOrThrow({ provider, model, webSearchEnabled, options = {} }: {
    provider: AIProviderName
    model?: string
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
    return buildWebSearchTools({ provider, model, options })
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
    const settings: OpenRouterChatSettings = {
        ...(provider === AIProviderName.ACTIVEPIECES ? REPORT_WHAT_THE_CALL_COST : {}),
        ...(webSearchEnabled && AI_PROVIDER_CAPABILITIES[provider].webSearch === 'plugin'
            ? { plugins: [{ id: 'web' as const, max_results: openRouterWebSearchResults(options) }] }
            : {}),
    }
    return Object.keys(settings).length === 0 ? undefined : settings
}

function openRouterWebSearchResults(options?: WebSearchOptions): number {
    return Math.min(
        Math.max(options?.maxUses ?? DEFAULT_WEB_SEARCH_RESULTS, MIN_OPENROUTER_WEB_SEARCH_RESULTS),
        MAX_OPENROUTER_WEB_SEARCH_RESULTS,
    )
}

function createModel({ credentials, modelId, metadata, flowStep, billing, byokBilling, openaiResponsesModel = false, webSearchEnabled = false, webSearchOptions, platformId, providerConfigId }: {
    credentials: AiProviderCredentials
    modelId: string
    metadata?: ChatModelMetadata
    flowStep?: FlowStepMetadata
    billing?: ActivepiecesAiBilling
    byokBilling?: BYOKBilling
    openaiResponsesModel?: boolean
    webSearchEnabled?: boolean
    webSearchOptions?: WebSearchOptions
    platformId?: string
    providerConfigId?: string
}): LanguageModel {
    const model = buildModel({ credentials, modelId, metadata, flowStep, openaiResponsesModel, webSearchEnabled, webSearchOptions, onOutcome: keyHealthReporterFor({ platformId, providerConfigId }) })
    return billedLanguageModel({
        model,
        provider: credentials.provider,
        modelId,
        billing,
        ...spreadIfDefined('byokBilling', byokBilling),
        ...spreadIfDefined('apiKey', managedApiKey(credentials)),
    })
}

function managedApiKey(credentials: AiProviderCredentials): string | undefined {
    if (credentials.provider !== AIProviderName.ACTIVEPIECES) {
        return undefined
    }
    const { apiKey } = credentials.auth
    return isNil(apiKey) || apiKey.length === 0 ? undefined : apiKey
}

function buildModel({ credentials, modelId, metadata, flowStep, openaiResponsesModel, webSearchEnabled, webSearchOptions, onOutcome }: {
    credentials: AiProviderCredentials
    modelId: string
    metadata?: ChatModelMetadata
    flowStep?: FlowStepMetadata
    openaiResponsesModel: boolean
    webSearchEnabled: boolean
    webSearchOptions?: WebSearchOptions
    onOutcome?: ProviderOutcomeReporter
}): LanguageModel {
    const { provider } = credentials
    if (credentials.provider === AIProviderName.CLOUDFLARE_GATEWAY) {
        return createCloudflareGatewayModel({
            credentials,
            modelId,
            openaiResponsesModel,
            routing: isNil(flowStep) ? 'compat' : 'submodel',
            ...spreadIfDefined('metadata', cloudflareGatewayMetadata(flowStep)),
            ...spreadIfDefined('onOutcome', onOutcome),
        })
    }
    return createLanguageModel({
        credentials,
        modelId,
        options: {
            openRouterSettings: openRouterModelSettings({ provider, webSearchEnabled, options: webSearchOptions }),
            mistralViaOpenRouter: isNil(flowStep),
            openaiResponsesModel,
            ...spreadIfDefined('extraHeaders', flowStepMetadataHeaders(flowStep) ?? managedProviderMetadataHeaders({ provider, metadata })),
            ...spreadIfDefined('onOutcome', onOutcome),
        },
    })
}

function cloudflareGatewayMetadata(flowStep?: FlowStepMetadata): CloudflareGatewayMetadata | undefined {
    if (isNil(flowStep)) {
        return undefined
    }
    return { projectId: flowStep.projectId, flowId: flowStep.flowId, runId: flowStep.runId }
}

function flowStepMetadataHeaders(flowStep?: FlowStepMetadata): Record<string, string> | undefined {
    if (isNil(flowStep)) {
        return undefined
    }
    return {
        'x-ap-project-id': flowStep.projectId,
        'x-ap-platform-id': flowStep.platformId,
        'x-ap-flow-id': flowStep.flowId,
        'x-ap-run-id': flowStep.runId,
    }
}

function createModelForImages({ credentials, modelId, flowStep }: {
    credentials: AiProviderCredentials
    modelId: string
    flowStep?: FlowStepMetadata
}): ImageModel | undefined {
    if (credentials.provider === AIProviderName.CLOUDFLARE_GATEWAY) {
        return createCloudflareGatewayModel({
            credentials,
            modelId,
            isImage: true,
            routing: isNil(flowStep) ? 'compat' : 'submodel',
            ...spreadIfDefined('metadata', cloudflareGatewayMetadata(flowStep)),
        })
    }
    return createImageModel({ credentials, modelId })
}

function toStorageEmbedding(embedding: number[]): number[] {
    if (embedding.length < EMBEDDING_DIMENSIONS) {
        throw new Error(`This embedding model returns ${embedding.length} dimensions, fewer than the ${EMBEDDING_DIMENSIONS} a knowledge base stores`)
    }
    const truncated = embedding.slice(0, EMBEDDING_DIMENSIONS)
    const magnitude = Math.sqrt(truncated.reduce((sum, value) => sum + value * value, 0))
    return magnitude === 0 ? truncated : truncated.map((value) => value / magnitude)
}

function createEmbeddingModel({ credentials, billing, platformId, providerConfigId }: {
    credentials: AiProviderCredentials
    billing?: ActivepiecesAiBilling
    platformId?: string
    providerConfigId?: string
}): { model: EmbeddingModel, providerOptions: SharedV3ProviderOptions } {
    const embeddingModelId = AI_PROVIDER_CAPABILITIES[credentials.provider].defaultEmbeddingModel
    if (isNil(embeddingModelId)) {
        throw new Error(`Provider ${credentials.provider} does not support knowledge base search`)
    }
    const built = buildEmbeddingModel({ credentials, embeddingModelId, fetch: observedProviderFetch(keyHealthReporterFor({ platformId, providerConfigId })) })
    return {
        model: billedEmbeddingModel({ model: built.model, provider: credentials.provider, modelId: embeddingModelId, billing }),
        providerOptions: built.providerOptions,
    }
}

function buildEmbeddingModel({ credentials, embeddingModelId, fetch }: {
    credentials: AiProviderCredentials
    embeddingModelId: string
    fetch: typeof globalThis.fetch | undefined
}): { model: EmbeddingModel, providerOptions: SharedV3ProviderOptions } {
    switch (credentials.provider) {
        case AIProviderName.OPENAI:
            return { model: createOpenAI({ apiKey: credentials.auth.apiKey, ...spreadIfDefined('fetch', fetch) }).embeddingModel(embeddingModelId), providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        case AIProviderName.GOOGLE:
            return { model: createGoogleGenerativeAI({ apiKey: credentials.auth.apiKey, ...spreadIfDefined('fetch', fetch) }).textEmbeddingModel(embeddingModelId), providerOptions: {} }
        case AIProviderName.AZURE: {
            const { resourceName, apiVersion } = credentials.config
            return {
                model: createAzure({ resourceName: resourceName ?? '', apiKey: credentials.auth.apiKey, ...spreadIfDefined('apiVersion', apiVersion), ...spreadIfDefined('fetch', fetch) }).embeddingModel(embeddingModelId),
                providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS,
            }
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return {
                model: createOpenRouter({ apiKey: credentials.auth.apiKey, ...spreadIfDefined('fetch', fetch) })
                    .textEmbeddingModel(embeddingModelId, credentials.provider === AIProviderName.ACTIVEPIECES ? EMBEDDING_REPORTS_WHAT_IT_COST : undefined),
                providerOptions: OPENROUTER_EMBEDDING_PROVIDER_OPTIONS,
            }
        default:
            throw new Error(`Provider ${credentials.provider} does not support knowledge base search`)
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

export const EMBEDDING_DIMENSIONS = 768
const OPENAI_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

const OPENROUTER_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openrouter: { dimensions: EMBEDDING_DIMENSIONS },
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

export const aiUtils = {
    createModel,
    createModelForImages,
    createEmbeddingModel,
    toStorageEmbedding,
    supportsWebSearch,
    buildWebSearchTools,
    webSearchModeOf,
    buildWebSearchToolsOrThrow,
}

type NativeWebSearchToolParams = {
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

type FlowStepMetadata = {
    projectId: string
    platformId: string
    flowId: string
    runId: string
}

type ChatModelMetadata = {
    platformId: string
    conversationId: string
    runId?: string
}

export type { ChatModelMetadata, FlowStepMetadata, WebSearchOptions }
