import { anthropic } from '@ai-sdk/anthropic'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { EmbeddingModel, ImageModel, LanguageModel } from 'ai'
import { ProviderOptions } from '@ai-sdk/provider-utils'
import { createLanguageModel } from '@activepieces/ai-providers'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AI_PROVIDER_CAPABILITIES, AIProviderName, AzureProviderConfig, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, CloudflareGatewayProviderConfig, GetProviderConfigResponse, OpenAICompatibleProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/pieces-framework'
import { createAiGateway } from 'ai-gateway-provider';
import { createAnthropic as createAnthropicGateway } from 'ai-gateway-provider/providers/anthropic';
import { createGoogleGenerativeAI as createGoogleGateway } from 'ai-gateway-provider/providers/google';

async function fetchProviderConfig(params: { provider: AIProviderName, engineToken: string, apiUrl: string }) {
    const { body } = await httpClient.sendRequest<GetProviderConfigResponse>({
        method: HttpMethod.GET,
        url: `${params.apiUrl}v1/ai-providers/${params.provider}/config`,
        headers: {
            Authorization: `Bearer ${params.engineToken}`,
        },
    })
    return body
}

export function createAIModel(params: CreateAIModelParams<false>): Promise<LanguageModel>;
export function createAIModel(params: CreateAIModelParams<true>): Promise<ImageModel>;
export async function createAIModel({
    provider,
    modelId,
    engineToken,
    projectId,
    flowId,
    runId,
    apiUrl,
    openaiResponsesModel = false,
    isImage,
}: CreateAIModelParams<boolean>): Promise<ImageModel | LanguageModel> {
    const { config, auth, platformId } = await fetchProviderConfig({ provider, engineToken, apiUrl });

    if (isImage && !AI_PROVIDER_CAPABILITIES[provider].supportsImageGeneration) {
        throw new Error(`Provider ${provider} does not support image models`)
    }

    if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
        return buildCloudflareGatewayModel({ auth, config, modelId, isImage, openaiResponsesModel, projectId, flowId, runId })
    }

    const metadataHeaders = buildCustomMetadataHeaders({ projectId, platformId, flowId, runId })

    if (isImage) {
        const imageModel = buildNativeImageModel({ provider, auth, config, modelId, metadataHeaders })
        if (imageModel) {
            return imageModel
        }
    }

    return createLanguageModel({
        provider,
        auth,
        config,
        modelId,
        options: {
            openaiResponsesModel,
            extraHeaders: provider === AIProviderName.CUSTOM ? metadataHeaders : undefined,
        },
    })
}

export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;

const EMBEDDING_DIMENSIONS = 768

const OPENAI_EMBEDDING_PROVIDER_OPTIONS = {
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

export async function createEmbeddingModel({
    provider,
    engineToken,
    apiUrl,
}: CreateEmbeddingModelParams): Promise<CreateEmbeddingModelResult> {
    const { config, auth } = await fetchProviderConfig({ provider, engineToken, apiUrl })

    const embeddingModelId = AI_PROVIDER_CAPABILITIES[provider].defaultEmbeddingModel
    if (!embeddingModelId) {
        throw new Error(`Provider ${provider} does not have a default embedding model configured`)
    }

    const { apiKey } = auth as BaseAIProviderAuthConfig

    switch (provider) {
        case AIProviderName.OPENAI: {
            const p = createOpenAI({ apiKey })
            return { model: p.embeddingModel(embeddingModelId), embeddingModelId, providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        case AIProviderName.GOOGLE: {
            const p = createGoogleGenerativeAI({ apiKey })
            return { model: p.textEmbeddingModel(embeddingModelId), embeddingModelId, providerOptions: {} }
        }
        case AIProviderName.AZURE: {
            const { resourceName, apiVersion } = config as AzureProviderConfig
            const p = createAzure({ resourceName, apiKey, apiVersion })
            return { model: p.embeddingModel(embeddingModelId), embeddingModelId, providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER: {
            const openRouterProvider = createOpenRouter({ apiKey })
            return { model: openRouterProvider.textEmbeddingModel(embeddingModelId), embeddingModelId, providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        default:
            throw new Error(`Provider ${provider} does not support embedding models`)
    }
}

function buildCustomMetadataHeaders({ projectId, platformId, flowId, runId }: {
    projectId: string
    platformId: string
    flowId: string
    runId: string
}): Record<string, string> {
    return {
        'x-ap-project-id': projectId,
        'x-ap-platform-id': platformId,
        'x-ap-flow-id': flowId,
        'x-ap-run-id': runId,
    }
}

function buildNativeImageModel({ provider, auth, config, modelId, metadataHeaders }: {
    provider: AIProviderName
    auth: unknown
    config: unknown
    modelId: string
    metadataHeaders: Record<string, string>
}): ImageModel | undefined {
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
                headers: {
                    ...metadataHeaders,
                    ...(defaultHeaders ?? {}),
                    [apiKeyHeader]: apiKey,
                },
            }).imageModel(modelId)
        }
        default:
            return undefined
    }
}

function buildCloudflareGatewayModel({ auth, config, modelId, isImage, openaiResponsesModel, projectId, flowId, runId }: {
    auth: unknown
    config: unknown
    modelId: string
    isImage?: boolean
    openaiResponsesModel: boolean
    projectId: string
    flowId: string
    runId: string
}): ImageModel | LanguageModel {
    const { apiKey } = auth as BaseAIProviderAuthConfig
    const { accountId, gatewayId, vertexProject, vertexRegion } = config as CloudflareGatewayProviderConfig
    const aigateway = createAiGateway({
        accountId: accountId,
        gateway: gatewayId,
        apiKey,
    });
    const { provider: providerPrefix, model: actualModelId, publisher } = splitCloudflareGatewayModelId(modelId)
    const cfMetadataHeaders = {
        'cf-aig-metadata': JSON.stringify({
            projectId,
            flowId,
            runId,
        }),
    }

    const headers = {
        'cf-aig-authorization': `Bearer ${apiKey}`,
        ...cfMetadataHeaders,
    }
    switch (providerPrefix) {
        case 'anthropic': {
            const anthropicProvider = createAnthropicGateway({
                headers
            });
            return aigateway(anthropicProvider(actualModelId));
        }
        case 'google-ai-studio': {
            const googleProvider = createGoogleGateway({
                headers
            });
            return aigateway(googleProvider(actualModelId));
        }
        case 'google-vertex-ai': {
            if (vertexProject && vertexRegion && publisher) {
                const provider = createGoogleGenerativeAI({
                    apiKey,
                    baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-vertex-ai/v1/projects/${vertexProject}/locations/${vertexRegion}/publishers/${publisher}/`,
                    headers,
                })
                return provider(actualModelId);
            }
            return handleDefaultAiGatewayProvider({ accountId, gatewayId, headers, isImage, modelId })
        }
        case 'openai': {
            const openaiProvider = createOpenAI({
                apiKey: 'no-key',
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openai`,
                headers,
                fetch: (input, init) => {
                    const hdrs = new Headers(init?.headers)
                    hdrs.delete('Authorization')
                    return fetch(input, { ...init, headers: hdrs })
                },
            })
            if (isImage) {
                return openaiProvider.imageModel(actualModelId)
            }
            return openaiResponsesModel
                ? openaiProvider.responses(actualModelId)
                : openaiProvider.chat(actualModelId)
        }
        default: {
            return handleDefaultAiGatewayProvider({ accountId, gatewayId, headers, isImage, modelId })
        }
    }
}

const handleDefaultAiGatewayProvider = ({accountId, gatewayId, headers, isImage, modelId}: {
    accountId: string;
    gatewayId: string;
    headers: Record<string, string>;
    isImage?: boolean;
    modelId: string;
})=>{
    const provider = createOpenAICompatible({
        name: 'cloudflare',
        baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
        headers,
    })
    if (isImage) {
        return provider.imageModel(modelId)
    }
    return provider.chatModel(modelId)
}

type CreateAIModelParams<IsImage extends boolean = false> = {
    provider: AIProviderName;
    modelId: string;
    engineToken: string;
    projectId: string;
    flowId: string;
    runId: string;
    apiUrl: string;
    openaiResponsesModel?: boolean;
    isImage?: IsImage;
}

type CreateEmbeddingModelParams = {
    provider: AIProviderName
    engineToken: string
    apiUrl: string
}

type CreateEmbeddingModelResult = {
    model: EmbeddingModel
    embeddingModelId: string
    providerOptions: ProviderOptions
}
