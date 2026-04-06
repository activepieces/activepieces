import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { EmbeddingModel, ImageModel, LanguageModel } from 'ai'
import { ProviderOptions } from '@ai-sdk/provider-utils'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderName, AzureProviderConfig, CloudflareGatewayProviderConfig, GetProviderConfigResponse, OpenAICompatibleProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/shared'
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

    switch (provider) {
        case AIProviderName.OPENAI: {
            const provider = createOpenAI({ apiKey: auth.apiKey })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return (openaiResponsesModel ? provider.responses(modelId) : provider.chat(modelId))
        }
        case AIProviderName.ANTHROPIC: {
            const provider = createAnthropic({ apiKey: auth.apiKey })
            if (isImage) {
                throw new Error(`Provider ${provider} does not support image models`)
            }
            return provider(modelId)
        }
        case AIProviderName.GOOGLE: {
            const provider = createGoogleGenerativeAI({ apiKey: auth.apiKey })

            return provider(modelId)
        }
        case AIProviderName.AZURE: {
            const { resourceName } = config as AzureProviderConfig
            const provider = createAzure({ resourceName, apiKey: auth.apiKey })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return provider.chat(modelId)
        }
        case AIProviderName.CLOUDFLARE_GATEWAY: {
            const { accountId, gatewayId,vertexProject,vertexRegion } = config as CloudflareGatewayProviderConfig
            const aigateway = createAiGateway({
                accountId: accountId,
                gateway: gatewayId,
                apiKey: auth.apiKey,
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
                'cf-aig-authorization': `Bearer ${auth.apiKey}`,
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
                    if(vertexProject && vertexRegion && publisher) {
                        const provider = createGoogleGenerativeAI({
                            apiKey: auth.apiKey,
                            baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-vertex-ai/v1/projects/${vertexProject}/locations/${vertexRegion}/publishers/${publisher}/`,
                            headers,
                        })
                        return provider(actualModelId);
                    }
                    return handleDefaultAiGatewayProvider({accountId, gatewayId, headers, isImage, modelId})
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
                    return handleDefaultAiGatewayProvider({accountId, gatewayId, headers, isImage, modelId})
                }
            }
        }
        case AIProviderName.CUSTOM: {
            const { apiKeyHeader, baseUrl, defaultHeaders } = config as OpenAICompatibleProviderConfig

            const customHeaders = defaultHeaders ?? {}

            const metadataHeaders: Record<string, string> = {
                'x-ap-project-id': projectId,
                'x-ap-platform-id': platformId,
                'x-ap-flow-id': flowId,
                'x-ap-run-id': runId,
            }

            const provider = createOpenAICompatible({ 
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: {
                    ...metadataHeaders,
                    ...customHeaders,
                    [apiKeyHeader]: auth.apiKey,
                },
            })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return provider.chatModel(modelId)
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER: {
            const openRouterProvider = createOpenRouter({ apiKey: auth.apiKey })
            return openRouterProvider.chat(modelId) as LanguageModel
        }
        default:
            throw new Error(`Provider ${provider} is not supported`)
    }
}



export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;

const EMBEDDING_DIMENSIONS = 768

const DEFAULT_EMBEDDING_MODELS: Partial<Record<AIProviderName, string>> = {
    [AIProviderName.OPENAI]: 'text-embedding-3-small',
    [AIProviderName.GOOGLE]: 'text-embedding-004',
    [AIProviderName.AZURE]: 'text-embedding-3-small',
    [AIProviderName.ACTIVEPIECES]: 'text-embedding-3-small',
    [AIProviderName.OPENROUTER]: 'openai/text-embedding-3-small',
}

const OPENAI_EMBEDDING_PROVIDER_OPTIONS = {
    openai: { dimensions: EMBEDDING_DIMENSIONS },
}

type CreateEmbeddingModelParams = {
    provider: AIProviderName
    engineToken: string
    apiUrl: string
}

export async function createEmbeddingModel({
    provider,
    engineToken,
    apiUrl,
}: CreateEmbeddingModelParams): Promise<CreateEmbeddingModelResult> {
    const { config, auth } = await fetchProviderConfig({ provider, engineToken, apiUrl })

    const embeddingModelId = DEFAULT_EMBEDDING_MODELS[provider]
    if (!embeddingModelId) {
        throw new Error(`Provider ${provider} does not have a default embedding model configured`)
    }

    switch (provider) {
        case AIProviderName.OPENAI: {
            const p = createOpenAI({ apiKey: auth.apiKey })
            return { model: p.embeddingModel(embeddingModelId), embeddingModelId, providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        case AIProviderName.GOOGLE: {
            const p = createGoogleGenerativeAI({ apiKey: auth.apiKey })
            return { model: p.textEmbeddingModel(embeddingModelId), embeddingModelId, providerOptions: {} }
        }
        case AIProviderName.AZURE: {
            const { resourceName } = config as AzureProviderConfig
            const p = createAzure({ resourceName, apiKey: auth.apiKey })
            return { model: p.embeddingModel(embeddingModelId), embeddingModelId, providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER: {
            const openRouterProvider = createOpenRouter({ apiKey: auth.apiKey })
            return { model: openRouterProvider.textEmbeddingModel(embeddingModelId), embeddingModelId, providerOptions: OPENAI_EMBEDDING_PROVIDER_OPTIONS }
        }
        default:
            throw new Error(`Provider ${provider} does not support embedding models`)
    }
}

type CreateEmbeddingModelResult = {
    model: EmbeddingModel
    embeddingModelId: string
    providerOptions: ProviderOptions
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
