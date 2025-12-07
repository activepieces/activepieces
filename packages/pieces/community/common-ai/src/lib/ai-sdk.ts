import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ImageModel } from 'ai'
import { AIProviderConfig, AIProviderName, AzureProviderConfig } from './types'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'

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
    const { body: config } = await httpClient.sendRequest<AIProviderConfig>({
        method: HttpMethod.GET,
        url: `${apiUrl}v1/ai-providers/${providerId}/config`,
        headers: {
            Authorization: `Bearer ${engineToken}`,
        },
    });

    switch (providerId) {
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
                throw new Error(`Provider ${providerId} does not support image models`)
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
        case AIProviderName.ACTIVEPIECES: 
        case AIProviderName.OPENROUTER: {
            const provider = createOpenRouter({ apiKey: config.apiKey })
            return provider.chat(modelId)
        }
        default:
            throw new Error(`Provider ${providerId} is not supported`)
    }
}

export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;
