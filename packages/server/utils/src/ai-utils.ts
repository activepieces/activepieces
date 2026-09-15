import { AIProviderName, isNil, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils';
import { createLanguageModel } from '@activepieces/ai-providers';
import { AI_PROVIDER_CAPABILITIES, AIWebSearchMode, BaseAIProviderAuthConfig, CloudflareGatewayProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/shared';
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { EmbeddingModel, LanguageModel, ToolSet } from 'ai'

const MAX_WEB_SEARCH_RESULTS = 5
export const EMBEDDING_DIMENSIONS = 768
const OPENAI_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

const OPENROUTER_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openrouter: { dimensions: EMBEDDING_DIMENSIONS },
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

// OpenAI is absent on purpose: its web search needs the Responses API, which breaks legacy BYOK models.
// Which providers support web search (and how) is declared in AI_PROVIDER_CAPABILITIES; the native
// tool builders below stay here because they need the provider SDKs.
const NATIVE_WEB_SEARCH_TOOLS: Partial<Record<AIProviderName, (auth: BaseAIProviderAuthConfig) => ToolSet>> = {
    [AIProviderName.ANTHROPIC]: ({ apiKey }) => ({ web_search: createAnthropic({ apiKey }).tools.webSearch_20250305({ maxUses: MAX_WEB_SEARCH_RESULTS }) }),
    [AIProviderName.GOOGLE]: ({ apiKey }) => ({ google_search: createGoogleGenerativeAI({ apiKey }).tools.googleSearch({}) }),
}

function supportsWebSearch(provider: AIProviderName): boolean {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch !== undefined
}

function buildWebSearchTools({ provider, auth }: {
    provider: AIProviderName
    auth: Record<string, unknown>
}): ToolSet {
    return NATIVE_WEB_SEARCH_TOOLS[provider]?.(auth as BaseAIProviderAuthConfig) ?? {}
}

function webSearchModeOf(provider: AIProviderName): AIWebSearchMode | undefined {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch
}

function openRouterModelSettings(provider: AIProviderName, webSearchEnabled: boolean): OpenRouterChatSettings | undefined {
    if (!webSearchEnabled || AI_PROVIDER_CAPABILITIES[provider].webSearch !== 'plugin') {
        return undefined
    }
    return { plugins: [{ id: 'web', max_results: MAX_WEB_SEARCH_RESULTS }] }
}

function createModel({ provider, auth, config, modelId, metadata, webSearchEnabled = false, onOutcome }: {
    provider: AIProviderName
    auth: Record<string, unknown>
    config: Record<string, unknown>
    modelId: string
    metadata?: ChatModelMetadata
    webSearchEnabled?: boolean
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
            openRouterSettings: openRouterModelSettings(provider, webSearchEnabled),
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
}

type ChatModelMetadata = {
    platformId: string
    conversationId: string
    runId?: string
}

export type { ChatModelMetadata }
