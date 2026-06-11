import {
    AIProviderName,
    AzureProviderConfig,
    BaseAIProviderAuthConfig,
    BedrockProviderAuthConfig,
    BedrockProviderConfig,
    CloudflareGatewayProviderConfig,
    isNil,
    OpenAICompatibleProviderConfig,
    splitCloudflareGatewayModelId,
} from '@activepieces/shared'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { EmbeddingModel, ImageModel } from 'ai'

/**
 * Worker-side image-model builder. `createChatModel` (sibling) is text-only; this ports the image
 * branches of the AI piece's in-sandbox `createAIModel` so the worker can run `generate-image`
 * without provider credentials ever entering the sandbox. It operates on an ALREADY-resolved
 * `{ auth, config }` (the worker resolves them via `resolveAiProvider`), so there is no in-builder
 * provider-config fetch. Providers without an SDK image model throw — matching the piece's behavior.
 */
function createImageModel({ provider, auth, config, modelId }: CreateImageModelParams): ImageModel {
    switch (provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenAI({ apiKey }).imageModel(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { resourceName, apiVersion } = config as AzureProviderConfig
            return createAzure({ resourceName, apiKey, apiVersion }).imageModel(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = auth as BedrockProviderAuthConfig
            const { region } = config as BedrockProviderConfig
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey }).imageModel(modelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { apiKeyHeader, baseUrl, defaultHeaders } = config as OpenAICompatibleProviderConfig
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: { ...(defaultHeaders ?? {}), [apiKeyHeader]: apiKey },
            }).imageModel(modelId)
        }
        case AIProviderName.CLOUDFLARE_GATEWAY: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig
            const { model: actualModelId } = splitCloudflareGatewayModelId(modelId)
            return createOpenAICompatible({
                name: 'cloudflare',
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                headers: { 'cf-aig-authorization': `Bearer ${apiKey}` },
            }).imageModel(actualModelId)
        }
        case AIProviderName.ANTHROPIC:
        case AIProviderName.GOOGLE:
        case AIProviderName.MISTRAL:
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            throw new Error(`Provider ${provider} does not support image models`)
        default: {
            const exhaustiveCheck: never = provider
            throw new Error(`Unsupported image provider: ${exhaustiveCheck}`)
        }
    }
}

/**
 * Worker-side embedding-model builder for the agent's knowledge-base tools. Like `createImageModel`,
 * it operates on an ALREADY-resolved `{ auth, config }` (the worker resolves provider credentials via
 * `resolveAiProvider`), so credentials never enter the sandbox. Mirrors the AI piece's
 * `createEmbeddingModel`: each provider has a default embedding model and provider options.
 */
function createEmbeddingModel({ provider, auth, config }: CreateEmbeddingModelParams): CreateEmbeddingModelResult {
    const embeddingModelId = DEFAULT_EMBEDDING_MODELS[provider]
    if (isNil(embeddingModelId)) {
        throw new Error(`Provider ${provider} does not have a default embedding model configured`)
    }
    const { apiKey } = auth as BaseAIProviderAuthConfig

    switch (provider) {
        case AIProviderName.OPENAI:
            return { model: createOpenAI({ apiKey }).embeddingModel(embeddingModelId), providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        case AIProviderName.GOOGLE:
            return { model: createGoogleGenerativeAI({ apiKey }).textEmbeddingModel(embeddingModelId), providerOptions: {} }
        case AIProviderName.AZURE: {
            const { resourceName, apiVersion } = config as AzureProviderConfig
            return { model: createAzure({ resourceName, apiKey, apiVersion }).embeddingModel(embeddingModelId), providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER:
            return { model: createOpenRouter({ apiKey }).textEmbeddingModel(embeddingModelId), providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        default:
            throw new Error(`Provider ${provider} does not support embedding models`)
    }
}

export const aiModelUtils = {
    createImageModel,
    createEmbeddingModel,
}

const EMBEDDING_DIMENSIONS = 768

const DEFAULT_EMBEDDING_MODELS: Partial<Record<AIProviderName, string>> = {
    [AIProviderName.OPENAI]: 'text-embedding-3-small',
    [AIProviderName.GOOGLE]: 'text-embedding-004',
    [AIProviderName.AZURE]: 'text-embedding-3-small',
    [AIProviderName.ACTIVEPIECES]: 'text-embedding-3-small',
    [AIProviderName.OPENROUTER]: 'openai/text-embedding-3-small',
}

const OPENAI_EMBEDDING_PROVIDER_OPTIONS: SharedV3ProviderOptions = {
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

type CreateImageModelParams = {
    provider: AIProviderName
    auth: Record<string, unknown>
    config: Record<string, unknown>
    modelId: string
}

type CreateEmbeddingModelParams = {
    provider: AIProviderName
    auth: Record<string, unknown>
    config: Record<string, unknown>
}

export type CreateEmbeddingModelResult = {
    model: EmbeddingModel
    providerOptions: SharedV3ProviderOptions
}
