import { anthropic, createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ImageModel } from 'ai'
import { AIProviderConfig, AIProviderName, AzureProviderConfig } from './types'
import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import OpenAI from 'openai'

type CreateAIModelParams<IsImage extends boolean = false> = {
    providerId: string;
    modelId: string;
    engineToken: string;
    apiUrl: string;
    openaiResponsesModel?: boolean;
    isImage?: IsImage;
}

export async function createAIModel<IsImage extends boolean = false>({
    providerId,
    modelId,
    engineToken,
    apiUrl,
    openaiResponsesModel = false,
    isImage = false as IsImage,
}: CreateAIModelParams<IsImage>): Promise<IsImage extends true ? ImageModel : LanguageModelV2> {
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
                return provider.imageModel(modelId) as any
            }
            return (openaiResponsesModel ? provider.responses(modelId) : provider.chat(modelId)) as any
        }
        case AIProviderName.ANTHROPIC: {
            const provider = createAnthropic({ apiKey: config.apiKey })
            if (isImage) {
                throw new Error(`Provider ${providerId} does not support image models`)
            }
            return provider(modelId) as any
        }
        case AIProviderName.GOOGLE: {
            const provider = createGoogleGenerativeAI({ apiKey: config.apiKey })

            return provider(modelId) as any
        }
        case AIProviderName.AZURE: {
            const { apiKey, resourceName } = config as AzureProviderConfig
            const provider = createAzure({ resourceName, apiKey })
            if (isImage) {
                return provider.imageModel(modelId) as any
            }
            return provider.chat(modelId) as any
        }
        case AIProviderName.OPENROUTER || AIProviderName.ACTIVEPIECES: {
            const provider = createOpenRouter({ apiKey: config.apiKey })
            if (isImage) {
                return provider.imageModel(modelId) as any
            }
            return provider.chat(modelId) as any
        }
        default:
            throw new Error(`Provider ${providerId} is not supported`)
    }
}

export async function createOpenAIClient(engineToken: string, apiUrl: string): Promise<OpenAI> {
    const { body: config } = await httpClient.sendRequest<AIProviderConfig>({
        method: HttpMethod.GET,
        url: `${apiUrl}v1/ai-providers/${AIProviderName.OPENAI}/config`,
        headers: {
            Authorization: `Bearer ${engineToken}`,
        },
    });

    return new OpenAI({ apiKey: config.apiKey });
}

export const anthropicSearchTool = anthropic.tools.webSearch_20250305;
export const openaiSearchTool = openai.tools.webSearchPreview;
export const googleSearchTool = google.tools.googleSearch;
