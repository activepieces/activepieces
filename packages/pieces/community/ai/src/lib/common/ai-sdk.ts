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

export function createAIModel(params: CreateAIModelParams<false>): Promise<LanguageModelV2>;
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
}: CreateAIModelParams<boolean>): Promise<ImageModel | LanguageModelV2> {
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
            const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig

            const provider = createOpenAICompatible({ 
                name: 'cloudflare',
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                headers: {
                    'cf-aig-authorization': `Bearer ${auth.apiKey}`,
                    'cf-aig-metadata': JSON.stringify({
                        projectId,
                        flowId,
                        runId,
                    })
                }
            })
            return provider.chatModel(modelId)
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
            return provider.chat(modelId)
        }
        default:
            throw new Error(`Provider ${provider} is not supported`)
    }
}

export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;
