import { AIProviderName, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils'
import { AzureProviderConfig, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, OPENAI_COMPATIBLE_VENDOR_BASE_URLS, OpenAICompatibleProviderConfig } from '@activepieces/core-piece-types'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { LanguageModel } from 'ai'

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1'

export function createLanguageModel({ provider, auth, config, modelId, options = {} }: CreateLanguageModelParams): LanguageModel {
    const observed = spreadIfDefined('fetch', observedProviderFetch(options.onOutcome))
    switch (provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const client = createOpenAI({ apiKey, ...observed })
            return options.openaiResponsesModel ? client.responses(modelId) : client.chat(modelId)
        }
        case AIProviderName.ANTHROPIC: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createAnthropic({ apiKey, ...observed })(modelId)
        }
        case AIProviderName.GOOGLE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createGoogleGenerativeAI({ apiKey, ...observed })(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { resourceName, apiVersion } = config as AzureProviderConfig
            return createAzure({ resourceName, apiKey, apiVersion, ...observed }).chat(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = auth as BedrockProviderAuthConfig
            const { region } = config as BedrockProviderConfig
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey, ...observed })(modelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { apiKeyHeader, baseUrl, defaultHeaders } = config as OpenAICompatibleProviderConfig
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: buildOpenAICompatibleHeaders({ apiKeyHeader, apiKey, defaultHeaders, extraHeaders: options.extraHeaders }),
                ...observed,
            }).chatModel(modelId)
        }
        case AIProviderName.MISTRAL: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            if (options.mistralViaOpenRouter) {
                return createOpenRouterChatModel({ apiKey, modelId, options })
            }
            return createOpenAICompatible({ name: 'mistral', baseURL: MISTRAL_BASE_URL, apiKey, ...observed }).chatModel(modelId)
        }
        case AIProviderName.XAI:
        case AIProviderName.DEEPSEEK:
        case AIProviderName.ZAI:
        case AIProviderName.QWEN:
        case AIProviderName.MINIMAX:
        case AIProviderName.MOONSHOT: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenAICompatible({
                name: provider,
                baseURL: OPENAI_COMPATIBLE_VENDOR_BASE_URLS[provider],
                apiKey,
                ...observed,
            }).chatModel(modelId)
        }
        case AIProviderName.OPENROUTER:
        case AIProviderName.ACTIVEPIECES: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenRouterChatModel({ apiKey, modelId, options })
        }
        case AIProviderName.CLOUDFLARE_GATEWAY:
            throw new Error('Cloudflare Gateway routing is caller-specific and is not handled by the shared language-model factory')
        default: {
            const exhaustiveCheck: never = provider
            throw new Error(`Unsupported provider: ${exhaustiveCheck}`)
        }
    }
}

function createOpenRouterChatModel({ apiKey, modelId, options }: {
    apiKey: string
    modelId: string
    options: LanguageModelOptions
}): LanguageModel {
    return createOpenRouter({
        apiKey,
        ...spreadIfDefined('headers', options.extraHeaders),
        ...spreadIfDefined('fetch', observedProviderFetch(options.onOutcome)),
    }).chat(modelId, options.openRouterSettings) as LanguageModel
}

export function buildOpenAICompatibleHeaders({ apiKeyHeader, apiKey, defaultHeaders, extraHeaders }: {
    apiKeyHeader: string
    apiKey: string
    defaultHeaders?: Record<string, string>
    extraHeaders?: Record<string, string>
}): Record<string, string> {
    return {
        ...(extraHeaders ?? {}),
        ...(defaultHeaders ?? {}),
        [apiKeyHeader]: apiKey,
    }
}

export type LanguageModelOptions = {
    onOutcome?: ProviderOutcomeReporter
    openaiResponsesModel?: boolean
    openRouterSettings?: OpenRouterChatSettings
    mistralViaOpenRouter?: boolean
    extraHeaders?: Record<string, string>
}

export type CreateLanguageModelParams = {
    provider: AIProviderName
    auth: unknown
    config: unknown
    modelId: string
    options?: LanguageModelOptions
}
