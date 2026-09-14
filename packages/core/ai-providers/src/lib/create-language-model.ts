import { AiProviderCredentials, AIProviderName, observedProviderFetch, ProviderOutcomeReporter, spreadIfDefined } from '@activepieces/core-utils'
import { AzureProviderConfig, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, OPENAI_COMPATIBLE_VENDOR_BASE_URLS, OpenAICompatibleProviderConfig, VertexProviderAuthConfig, VertexProviderConfig } from '@activepieces/core-piece-types'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createVertex } from '@ai-sdk/google-vertex'
import { createVertexAnthropic } from '@ai-sdk/google-vertex/anthropic'
import { createVertexMaas } from '@ai-sdk/google-vertex/maas'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter, OpenRouterChatSettings } from '@openrouter/ai-sdk-provider'
import { ImageModel, LanguageModel } from 'ai'

const VERTEX_MAAS_SUFFIX = '-maas'
const VERTEX_ANTHROPIC_PREFIX = 'claude'
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1'
const AUTHORIZATION_HEADER = 'authorization'

export function createLanguageModel({ credentials, modelId, options = {} }: CreateLanguageModelParams): LanguageModel {
    const observed = spreadIfDefined('fetch', observedProviderFetch(options.onOutcome))
    switch (credentials.provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = credentials.auth
            const client = createOpenAI({ apiKey, ...observed })
            return options.openaiResponsesModel ? client.responses(modelId) : client.chat(modelId)
        }
        case AIProviderName.ANTHROPIC: {
            const { apiKey } = credentials.auth
            return createAnthropic({ apiKey, ...observed })(modelId)
        }
        case AIProviderName.GOOGLE: {
            const { apiKey } = credentials.auth
            return createGoogleGenerativeAI({ apiKey, ...observed })(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = credentials.auth
            const { resourceName, apiVersion } = credentials.config
            return createAzure({ resourceName, apiKey, apiVersion, ...observed }).chat(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = credentials.auth
            const { region } = credentials.config
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey, ...observed })(modelId)
        }
        case AIProviderName.VERTEX: {
            const { serviceAccountJson } = credentials.auth
            const { project, region } = credentials.config
            const vertexSettings = { project, location: region, googleAuthOptions: { credentials: parseServiceAccount(serviceAccountJson ?? '') }, ...observed }
            return vertexClientFor({ modelId })(vertexSettings)(modelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = credentials.auth
            const { apiKeyHeader, baseUrl, defaultHeaders, apiStyle } = credentials.config
            const headers = buildOpenAICompatibleHeaders({ apiKeyHeader: apiKeyHeader ?? AUTHORIZATION_HEADER, apiKey: apiKey ?? '', defaultHeaders, extraHeaders: options.extraHeaders })
            if (apiStyle === 'responses') {
                return createOpenAI({
                    baseURL: baseUrl,
                    apiKey: apiKey ?? '',
                    headers,
                    ...observed,
                    ...spreadIfDefined('fetch', stripDefaultAuthorization({
                        headers,
                        delegate: observedProviderFetch(options.onOutcome),
                    })),
                }).responses(modelId)
            }
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl ?? '',
                headers,
                ...observed,
            }).chatModel(modelId)
        }
        case AIProviderName.MISTRAL: {
            const { apiKey } = credentials.auth
            if (options.mistralViaOpenRouter) {
                return createOpenRouterChatModel({ apiKey, modelId, options })
            }
            return createOpenAICompatible({ name: 'mistral', baseURL: MISTRAL_BASE_URL, apiKey: apiKey ?? '', ...observed }).chatModel(modelId)
        }
        case AIProviderName.XAI:
        case AIProviderName.DEEPSEEK:
        case AIProviderName.ZAI:
        case AIProviderName.QWEN:
        case AIProviderName.MINIMAX:
        case AIProviderName.MOONSHOT: {
            const { apiKey } = credentials.auth
            return createOpenAICompatible({
                name: credentials.provider,
                baseURL: OPENAI_COMPATIBLE_VENDOR_BASE_URLS[credentials.provider],
                apiKey: apiKey ?? '',
                ...observed,
            }).chatModel(modelId)
        }
        case AIProviderName.OPENROUTER:
        case AIProviderName.ACTIVEPIECES: {
            const { apiKey } = credentials.auth
            return createOpenRouterChatModel({ apiKey, modelId, options })
        }
        case AIProviderName.CLOUDFLARE_GATEWAY:
            throw new Error('Cloudflare Gateway routing is caller-specific and is not handled by the shared language-model factory')
        default: {
            const exhaustiveCheck: never = credentials
            throw new Error(`Unsupported provider: ${exhaustiveCheck}`)
        }
    }
}

export function createImageModel({ credentials, modelId, options = {} }: CreateImageModelParams): ImageModel | undefined {
    const observed = spreadIfDefined('fetch', observedProviderFetch(options.onOutcome))
    switch (credentials.provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = credentials.auth
            return createOpenAI({ apiKey, ...observed }).imageModel(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = credentials.auth
            const { resourceName, apiVersion } = credentials.config
            return createAzure({ resourceName, apiKey, apiVersion, ...observed }).imageModel(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = credentials.auth
            const { region } = credentials.config
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey, ...observed }).imageModel(modelId)
        }
        case AIProviderName.VERTEX: {
            const { serviceAccountJson } = credentials.auth
            const { project, region } = credentials.config
            return createVertex({ project, location: region, googleAuthOptions: { credentials: parseServiceAccount(serviceAccountJson ?? '') }, ...observed }).imageModel(modelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = credentials.auth
            const { apiKeyHeader, baseUrl, defaultHeaders } = credentials.config
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl ?? '',
                headers: buildOpenAICompatibleHeaders({ apiKeyHeader: apiKeyHeader ?? AUTHORIZATION_HEADER, apiKey: apiKey ?? '', defaultHeaders, extraHeaders: options.extraHeaders }),
                ...observed,
            }).imageModel(modelId)
        }
        default:
            return undefined
    }
}

function vertexClientFor({ modelId }: { modelId: string }): typeof createVertex | typeof createVertexAnthropic | typeof createVertexMaas {
    if (modelId.includes('/') || modelId.endsWith(VERTEX_MAAS_SUFFIX)) {
        return createVertexMaas
    }
    if (modelId.toLowerCase().startsWith(VERTEX_ANTHROPIC_PREFIX)) {
        return createVertexAnthropic
    }
    return createVertex
}

function parseServiceAccount(serviceAccountJson: string): { client_email?: string, private_key?: string } {
    const parsed: unknown = JSON.parse(serviceAccountJson)
    const fields: Record<string, unknown> = typeof parsed === 'object' && parsed !== null ? { ...parsed } : {}
    const clientEmail = fields['client_email']
    const privateKey = fields['private_key']
    return {
        client_email: typeof clientEmail === 'string' ? clientEmail : undefined,
        private_key: typeof privateKey === 'string' ? privateKey.replace(/\\n/g, '\n') : undefined,
    }
}

function stripDefaultAuthorization({ headers, delegate }: {
    headers: Record<string, string>
    delegate?: typeof globalThis.fetch
}): typeof globalThis.fetch | undefined {
    const carriesAuthorization = Object.keys(headers).some((key) => key.trim().toLowerCase() === AUTHORIZATION_HEADER)
    if (carriesAuthorization) {
        return undefined
    }
    return (input, init) => {
        const sent = new Headers(init?.headers)
        sent.delete(AUTHORIZATION_HEADER)
        return (delegate ?? globalThis.fetch)(input, { ...init, headers: sent })
    }
}

function createOpenRouterChatModel({ apiKey, modelId, options }: {
    apiKey: string | undefined
    modelId: string
    options: LanguageModelOptions
}): LanguageModel {
    return createOpenRouter({
        apiKey: apiKey ?? '',
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

export type CreateImageModelParams = {
    credentials: AiProviderCredentials
    modelId: string
    options?: ImageModelOptions
}

export type ImageModelOptions = {
    onOutcome?: ProviderOutcomeReporter
    extraHeaders?: Record<string, string>
}

export type CreateLanguageModelParams = {
    credentials: AiProviderCredentials
    modelId: string
    options?: LanguageModelOptions
}
