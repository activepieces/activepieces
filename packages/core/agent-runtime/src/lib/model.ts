import {
    AI_PROVIDER_CAPABILITIES,
    AzureProviderConfig,
    BaseAIProviderAuthConfig,
    BedrockProviderAuthConfig,
    BedrockProviderConfig,
    CloudflareGatewayProviderConfig,
    OpenAICompatibleProviderConfig,
    splitCloudflareGatewayModelId,
} from '@activepieces/core-piece-types'
import { AIProviderName } from '@activepieces/core-utils'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { LanguageModel, ToolSet } from 'ai'

export function supportsWebSearch(provider: AIProviderName): boolean {
    return AI_PROVIDER_CAPABILITIES[provider].webSearch !== undefined
}

export function buildWebSearchTools({ provider, auth }: {
    provider: AIProviderName
    auth: Record<string, unknown>
}): ToolSet {
    return NATIVE_WEB_SEARCH_TOOLS[provider]?.(auth as BaseAIProviderAuthConfig) ?? {}
}

export function createChatModel({ provider, auth, config, modelId, webSearchEnabled = false }: {
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

export function buildProviderOptions({ provider, tier, disableThinking = false }: {
    provider: AIProviderName
    tier: { thinkingBudget: number }
    disableThinking?: boolean
}): SharedV3ProviderOptions {
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

function openRouterModelSettings(provider: AIProviderName, webSearchEnabled: boolean): OpenRouterChatSettings | undefined {
    if (!webSearchEnabled || AI_PROVIDER_CAPABILITIES[provider].webSearch !== 'plugin') {
        return undefined
    }
    return { plugins: [{ id: 'web', max_results: MAX_WEB_SEARCH_RESULTS }] }
}

const MAX_WEB_SEARCH_RESULTS = 5

// OpenAI is absent on purpose: its web search needs the Responses API, which breaks legacy BYOK
// models. Which providers support web search is declared in AI_PROVIDER_CAPABILITIES; these
// builders live here because they need the provider SDKs.
const NATIVE_WEB_SEARCH_TOOLS: Partial<Record<AIProviderName, (auth: BaseAIProviderAuthConfig) => ToolSet>> = {
    [AIProviderName.ANTHROPIC]: ({ apiKey }) => ({ web_search: createAnthropic({ apiKey }).tools.webSearch_20250305({ maxUses: MAX_WEB_SEARCH_RESULTS }) }),
    [AIProviderName.GOOGLE]: ({ apiKey }) => ({ google_search: createGoogleGenerativeAI({ apiKey }).tools.googleSearch({}) }),
}
