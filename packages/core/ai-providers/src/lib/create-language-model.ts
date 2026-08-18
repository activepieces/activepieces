import { AIProviderName, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils'
import { AzureProviderConfig, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, OpenAICompatibleProviderConfig } from '@activepieces/core-piece-types'
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
    const fetch = observedProviderFetch(options.onOutcome)
    switch (provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const client = createOpenAI({ apiKey, ...spreadIfDefined('fetch', fetch) })
            return options.openaiResponsesModel ? client.responses(modelId) : client.chat(modelId)
        }
        case AIProviderName.ANTHROPIC: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createAnthropic({ apiKey, ...spreadIfDefined('fetch', fetch) })(modelId)
        }
        case AIProviderName.GOOGLE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createGoogleGenerativeAI({ apiKey, ...spreadIfDefined('fetch', fetch) })(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { resourceName, apiVersion } = config as AzureProviderConfig
            return createAzure({ resourceName, apiKey, apiVersion, ...spreadIfDefined('fetch', fetch) }).chat(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = auth as BedrockProviderAuthConfig
            const { region } = config as BedrockProviderConfig
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey, ...spreadIfDefined('fetch', fetch) })(modelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { apiKeyHeader, baseUrl, defaultHeaders } = config as OpenAICompatibleProviderConfig
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: buildOpenAICompatibleHeaders({ apiKeyHeader, apiKey, defaultHeaders, extraHeaders: options.extraHeaders }),
                ...spreadIfDefined('fetch', fetch),
            }).chatModel(modelId)
        }
        case AIProviderName.MISTRAL: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            if (options.mistralViaOpenRouter) {
                return createOpenRouterChatModel({ apiKey, modelId, options, fetch })
            }
            return createOpenAICompatible({ name: 'mistral', baseURL: MISTRAL_BASE_URL, apiKey, ...spreadIfDefined('fetch', fetch) }).chatModel(modelId)
        }
        case AIProviderName.OPENROUTER:
        case AIProviderName.ACTIVEPIECES: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenRouterChatModel({ apiKey, modelId, options, fetch })
        }
        case AIProviderName.CLOUDFLARE_GATEWAY:
            throw new Error('Cloudflare Gateway routing is caller-specific and is not handled by the shared language-model factory')
        default: {
            const exhaustiveCheck: never = provider
            throw new Error(`Unsupported provider: ${exhaustiveCheck}`)
        }
    }
}

function createOpenRouterChatModel({ apiKey, modelId, options, fetch }: {
    fetch?: typeof globalThis.fetch
    apiKey: string
    modelId: string
    options: LanguageModelOptions
}): LanguageModel {
    return createOpenRouter({
        apiKey,
        ...spreadIfDefined('headers', options.extraHeaders),
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
    openaiResponsesModel?: boolean
    openRouterSettings?: OpenRouterChatSettings
    mistralViaOpenRouter?: boolean
    extraHeaders?: Record<string, string>
    onOutcome?: ProviderOutcomeReporter
}

export type CreateLanguageModelParams = {
    provider: AIProviderName
    auth: unknown
    config: unknown
    modelId: string
    options?: LanguageModelOptions
}
