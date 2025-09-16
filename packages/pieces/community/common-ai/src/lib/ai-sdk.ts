import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createReplicate } from '@ai-sdk/replicate'
import { ImageModel, Tool } from 'ai'
import { SUPPORTED_AI_PROVIDERS } from './supported-ai-providers'
import { AI_USAGE_AGENT_ID_HEADER, AI_USAGE_FEATURE_HEADER, AI_USAGE_MCP_ID_HEADER, AIUsageFeature, AIUsageMetadata } from './types'
import { spreadIfDefined } from '@activepieces/shared'


export function createAIModel<T extends LanguageModelV2 | ImageModel>({
    providerName,
    modelInstance,
    engineToken,
    baseURL,
    metadata,
    openaiResponsesModel = false,
}: CreateAIModelParams<T>): T {
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
            'Authorization': `Bearer ${engineToken}`,
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
                apiKey: engineToken,
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
                apiKey: engineToken,
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
                apiToken: engineToken,
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
                apiKey: engineToken,
                baseURL: `${baseURL}/${googleVersion}`,
                headers: createHeaders(),
            })

            return provider(modelId) as T
        }
        default:
            throw new Error(`Provider ${providerName} is not supported`)
    }
}

function buildUserLocation(options: UserLocationOptions): (UserLocationOptions & { type: 'approximate' }) | undefined {
    if (!options.userLocationCity && !options.userLocationRegion && 
        !options.userLocationCountry && !options.userLocationTimezone) {
        return undefined
    }

    return {
        type: 'approximate' as const,
        ...spreadIfDefined('city', options.userLocationCity),
        ...spreadIfDefined('region', options.userLocationRegion),
        ...spreadIfDefined('country', options.userLocationCountry),
        ...spreadIfDefined('timezone', options.userLocationTimezone),
    }
}

export function createWebSearchTool(provider: string, options: WebSearchOptions = {}): Record<string, Tool> {
    const defaultMaxUses = 5

    switch (provider) {
        case 'anthropic': {
            const anthropicOptions = options as AnthropicWebSearchOptions
            const anthropicProvider = createAnthropic({})
            let allowedDomains: string[] | undefined
            let blockedDomains: string[] | undefined

            if (anthropicOptions.allowedDomains && anthropicOptions.allowedDomains.length > 0) {
                allowedDomains = anthropicOptions.allowedDomains.map(({ domain }) => domain)
            }

            if (anthropicOptions.blockedDomains && anthropicOptions.blockedDomains.length > 0 && (!anthropicOptions.allowedDomains || anthropicOptions.allowedDomains.length === 0)) {
                blockedDomains = anthropicOptions.blockedDomains.map(({ domain }) => domain)
            }

            return {
                web_search: anthropicProvider.tools.webSearch_20250305({
                    maxUses: anthropicOptions.maxUses ?? defaultMaxUses,
                    ...spreadIfDefined('userLocation', buildUserLocation(anthropicOptions)),
                    ...spreadIfDefined('allowedDomains', allowedDomains),
                    ...spreadIfDefined('blockedDomains', blockedDomains),
                }),
            }
        }

        case 'openai': {
            const openaiOptions = options as OpenAIWebSearchOptions
            const openaiProvider = createOpenAI({})

            return {
                web_search_preview: openaiProvider.tools.webSearchPreview({
                    ...spreadIfDefined('searchContextSize', openaiOptions.searchContextSize),
                    ...spreadIfDefined('userLocation', buildUserLocation(openaiOptions)),
                }),
            }
        }

        case 'google': {
            const googleProvider = createGoogleGenerativeAI({})

            return {
                google_search: googleProvider.tools.googleSearch({}),
            }
        }

        default:
            throw new Error(`Provider ${provider} is not supported for web search`)
    }
}

type CreateAIModelParams<T extends LanguageModelV2 | ImageModel> = {
    providerName: string
    modelInstance: T
    /**
     * This is the engine token that will be replaced by the proxy with the api key
     */
    engineToken: string
    baseURL: string
    metadata: AIUsageMetadata
    openaiResponsesModel?: boolean
}

type BaseWebSearchOptions = {
    maxUses?: number
    includeSources?: boolean
}

type UserLocationOptions = {
    userLocationCity?: string
    userLocationRegion?: string
    userLocationCountry?: string
    userLocationTimezone?: string
}

type AnthropicWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
    allowedDomains?: { domain: string }[]
    blockedDomains?: { domain: string }[]
}

type OpenAIWebSearchOptions = BaseWebSearchOptions & UserLocationOptions & {
    searchContextSize?: 'low' | 'medium' | 'high'
}

export type WebSearchOptions = AnthropicWebSearchOptions | OpenAIWebSearchOptions
