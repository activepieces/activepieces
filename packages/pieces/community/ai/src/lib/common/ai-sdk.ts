import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ImageModel } from 'ai'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AIProviderName, AzureProviderConfig, CloudflareGatewayProviderConfig, GetProviderConfigResponse, OpenAICompatibleProviderConfig } from '@activepieces/shared'

type CreateAIModelParams<IsImage extends boolean = false> = {
    providerId: string;
    modelId: string;
    engineToken: string;
    apiUrl: string;
    openaiResponsesModel?: boolean;
    isImage?: IsImage;
}

export function createAIModel(params: CreateAIModelParams<false>): Promise<LanguageModelV2>;
export function createAIModel(params: CreateAIModelParams<true>): Promise<ImageModel>;
export async function createAIModel({
    providerId,
    modelId,
    engineToken,
    apiUrl,
    openaiResponsesModel = false,
    isImage,
}: CreateAIModelParams<boolean>): Promise<ImageModel | LanguageModelV2> {
    const { body: config } = await httpClient.sendRequest<GetProviderConfigResponse>({
        method: HttpMethod.GET,
        url: `${apiUrl}v1/ai-providers/${providerId}/config`,
        headers: {
            Authorization: `Bearer ${engineToken}`,
        },
    });

    switch (config.provider) {
        case AIProviderName.OPENAI: {
            const provider = createOpenAI({ apiKey: config.apiKey })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return (openaiResponsesModel ? provider.responses(modelId) : provider.chat(modelId))
        }
        case AIProviderName.ANTHROPIC: {
            const provider = createAnthropic({ apiKey: config.apiKey })
            if (isImage) {
                throw new Error(`Provider ${config.provider} does not support image models`)
            }
            return provider(modelId)
        }
        case AIProviderName.GOOGLE: {
            const provider = createGoogleGenerativeAI({ apiKey: config.apiKey })

            return provider(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey, resourceName } = config as AzureProviderConfig
            const provider = createAzure({ resourceName, apiKey })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return provider.chat(modelId)
        }
        case AIProviderName.CLOUDFLARE_GATEWAY: {
            const { accountId, apiKey, gatewayId } = config as CloudflareGatewayProviderConfig

            const provider = createOpenAICompatible({ 
                name: 'cloudflare',
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                headers: {
                    'cf-aig-authorization': `Bearer ${apiKey}`
                }
            })
            return provider.chatModel(modelId)
        }
        case AIProviderName.OPENAI_COMPATIBLE: {
            const { apiKey, apiKeyHeader, baseUrl } = config as OpenAICompatibleProviderConfig

            const provider = createOpenAICompatible({ 
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: {
                    [apiKeyHeader]: apiKey
                }
            })
            if (isImage) {
                return provider.imageModel(modelId)
            }
            return provider.chatModel(modelId)
        }
        case AIProviderName.ACTIVEPIECES: 
        case AIProviderName.OPENROUTER: {
            const provider = createOpenRouter({ apiKey: config.apiKey })
            return provider.chat(modelId)
        }
        default:
            throw new Error(`Provider ${config.provider} is not supported`)
    }
}

export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;
