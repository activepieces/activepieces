import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createReplicate } from '@ai-sdk/replicate'
import { ImageModel, Tool } from 'ai'
import { SUPPORTED_AI_PROVIDERS } from './supported-ai-providers'
import { AI_USAGE_AGENT_ID_HEADER, AI_USAGE_FEATURE_HEADER, AI_USAGE_MCP_ID_HEADER, AIUsageFeature, AIUsageMetadata } from './index'

export function createAIProvider<T extends LanguageModelV2 | ImageModel>({
    providerName,
    modelInstance,
    apiKey,
    baseURL,
    metadata,
    openaiResponsesModel = false,
}: CreateAIProviderParams<T>): T {
    const modelId = modelInstance.modelId
    const isImageModel = SUPPORTED_AI_PROVIDERS
        .flatMap(provider => provider.imageModels)
        .some(model => model.instance.modelId === modelId)

    const getMetadataId = (): string | undefined => {
        switch (metadata.feature) {
            case AIUsageFeature.AGENTS:
                return metadata.agentid
            case AIUsageFeature.MCP:
                return metadata.mcpid
            default:
                return undefined
        }
    }

    const createHeaders = (): Record<string, string> => {
        const baseHeaders: Record<string, string> = {
            'Authorization': `Bearer ${apiKey}`,
            [AI_USAGE_FEATURE_HEADER]: metadata.feature,
        }
        const id = getMetadataId()
        if (id) {
            const idHeader = metadata.feature === AIUsageFeature.AGENTS ? AI_USAGE_AGENT_ID_HEADER : AI_USAGE_MCP_ID_HEADER
            baseHeaders[idHeader] = id
        }
        return baseHeaders
    }

    switch (providerName) {
        case 'openai': {
            const openaiVersion = 'v1'
            const provider = createOpenAI({
                apiKey,
                baseURL: `${baseURL}/${openaiVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                return provider.imageModel(modelId) as T
            }
            return openaiResponsesModel ? provider.responses(modelId) as T : provider.chat(modelId) as T
        }
        case 'anthropic': {
            const anthropicVersion = 'v1'
            const provider = createAnthropic({
                apiKey,
                baseURL: `${baseURL}/${anthropicVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                throw new Error(`Provider ${providerName} does not support image models`)
            }
            return provider(modelId) as T
        }
        case 'replicate': {
            const replicateVersion = 'v1'
            const provider = createReplicate({
                apiToken: apiKey,
                baseURL: `${baseURL}/${replicateVersion}`,
                headers: createHeaders(),
            })
            if (!isImageModel) {
                throw new Error(`Provider ${providerName} does not support language models`)
            }
            return provider.imageModel(modelId) as unknown as T
        }
        case 'google': {
            const googleVersion = 'v1beta'
            const provider = createGoogleGenerativeAI({
                apiKey,
                baseURL: `${baseURL}/${googleVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                throw new Error(`Provider ${providerName} does not support image models`)
            }
            return provider(modelId) as T
        }
        default:
            throw new Error(`Provider ${providerName} is not supported`)
    }
}

export function createWebSearchTool(provider: string, options: WebSearchOptions = {}): Record<string, Tool> {
    switch (provider) {
        case 'anthropic': {
            const anthropicOptions = options as AnthropicWebSearchOptions
            const anthropicProvider = createAnthropic({})

            const toolOptions: Record<string, unknown> = {}

            toolOptions['maxUses'] = anthropicOptions.maxUses

            if (anthropicOptions.allowedDomains && anthropicOptions.allowedDomains.length > 0) {
                toolOptions['allowedDomains'] = anthropicOptions.allowedDomains.map(({ domain }) => domain)
            }

            if (anthropicOptions.blockedDomains && anthropicOptions.blockedDomains.length > 0 && (!anthropicOptions.allowedDomains || anthropicOptions.allowedDomains.length === 0)) {
                toolOptions['blockedDomains'] = anthropicOptions.blockedDomains.map(({ domain }) => domain)
            }

            if (anthropicOptions.userLocationCity || anthropicOptions.userLocationRegion ||
                anthropicOptions.userLocationCountry || anthropicOptions.userLocationTimezone) {
                toolOptions['userLocation'] = buildUserLocation(anthropicOptions)
            }

            return {
                web_search: anthropicProvider.tools.webSearch_20250305(toolOptions),
            }
        }

        case 'openai': {
            const openaiOptions = options as OpenAIWebSearchOptions
            const openaiProvider = createOpenAI({})

            const toolOptions: Record<string, unknown> = {}

            toolOptions['maxUses'] = openaiOptions.maxUses

            if (openaiOptions.searchContextSize) {
                toolOptions['search_context_size'] = openaiOptions.searchContextSize
            }

            if (openaiOptions.userLocationCity || openaiOptions.userLocationRegion ||
                openaiOptions.userLocationCountry || openaiOptions.userLocationTimezone) {
                toolOptions['userLocation'] = buildUserLocation(openaiOptions)
            }

            return {
                web_search_preview: openaiProvider.tools.webSearchPreview(toolOptions),
            }
        }

        case 'google': {
            const googleOptions = options as GoogleWebSearchOptions
            const googleProvider = createGoogleGenerativeAI({})

            const toolOptions: Record<string, unknown> = {}

            toolOptions['maxUses'] = googleOptions.maxUses

            return {
                google_search: googleProvider.tools.googleSearch(toolOptions),
            }
        }

        default:
            throw new Error(`Provider ${provider} is not supported for web search`)
    }
}

function buildUserLocation(options: UserLocationOptions): Record<string, string> | undefined {
    const userLocation: Record<string, string> = {
        type: 'approximate',
    }
    
    if (options.userLocationCountry) userLocation['country'] = options.userLocationCountry
    if (options.userLocationRegion) userLocation['region'] = options.userLocationRegion
    if (options.userLocationCity) userLocation['city'] = options.userLocationCity
    if (options.userLocationTimezone) userLocation['timezone'] = options.userLocationTimezone
    
    return Object.keys(userLocation).length > 0 ? userLocation : undefined
}

type CreateAIProviderParams<T extends LanguageModelV2 | ImageModel> = {
    providerName: string
    modelInstance: T
    apiKey: string
    baseURL: string
    metadata: AIUsageMetadata
    openaiResponsesModel?: boolean
}

export type BaseWebSearchOptions = {
    maxUses?: number
}

export type UserLocationOptions = {
    userLocationCity?: string
    userLocationRegion?: string
    userLocationCountry?: string
    userLocationTimezone?: string
}

export type AnthropicWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
    allowedDomains?: { domain: string }[]
    blockedDomains?: { domain: string }[]
}

export type OpenAIWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
    searchContextSize?: 'low' | 'medium' | 'high'
}

export type GoogleWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
    mode?: 'MODE_DYNAMIC' | 'MODE_UNSPECIFIED'
}

export type WebSearchOptions = AnthropicWebSearchOptions | OpenAIWebSearchOptions | GoogleWebSearchOptions
