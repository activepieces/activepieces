import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ImageModel, LanguageModel } from 'ai'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderName, AzureProviderConfig, CloudflareGatewayProviderConfig, GetProviderConfigResponse, OpenAICompatibleProviderConfig, splitCloudflareGatewayModelId } from '@activepieces/shared'
import { createAiGateway } from 'ai-gateway-provider';
import { createAnthropic as createAnthropicGateway } from 'ai-gateway-provider/providers/anthropic';
import { createGoogleGenerativeAI as createGoogleGateway } from 'ai-gateway-provider/providers/google';
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
    const { body: {
        config,
        auth,
    } } = await httpClient.sendRequest<GetProviderConfigResponse>({
        method: HttpMethod.GET,
        url: `${apiUrl}v1/ai-providers/${provider}/config`,
        headers: {
            Authorization: `Bearer ${engineToken}`,
        },
    });

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
                default: {
                    return handleDefaultAiGatewayProvider({accountId, gatewayId, headers, isImage, modelId})
                }
            }
        }
        case AIProviderName.CUSTOM: {
            const { apiKeyHeader, baseUrl } = config as OpenAICompatibleProviderConfig

            const provider = createOpenAICompatible({ 
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: {
                    [apiKeyHeader]: auth.apiKey
                }
            })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return provider.chatModel(modelId)
        }
        case AIProviderName.ACTIVEPIECES: 
        case AIProviderName.OPENROUTER: {
            const provider = createOpenRouter({ apiKey: auth.apiKey })
            return provider.chat(modelId) as LanguageModel
        }
        default:
            throw new Error(`Provider ${provider} is not supported`)
    }
}

export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;

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