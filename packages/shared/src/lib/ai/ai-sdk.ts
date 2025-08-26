import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createReplicate } from '@ai-sdk/replicate'
import { ImageModel, LanguageModel, TranscriptionModel } from 'ai'
import { SUPPORTED_AI_PROVIDERS } from './supported-ai-providers'
import { AI_USAGE_AGENT_ID_HEADER, AI_USAGE_FEATURE_HEADER, AI_USAGE_MCP_ID_HEADER, AIUsageFeature, AIUsageMetadata } from './index'

export function createAIProvider<T extends LanguageModel | ImageModel | TranscriptionModel>({
    providerName,
    modelInstance,
    apiKey,
    baseURL,
    metadata,
}: CreateAIProviderParams<T>): T {
    const isImageModel = SUPPORTED_AI_PROVIDERS
        .flatMap(provider => provider.imageModels)
        .some(model => model.instance.modelId === modelInstance.modelId)

    const isTranscriptionModel = SUPPORTED_AI_PROVIDERS
        .flatMap(provider => provider.transcriptionModels)
        .some(model => model.instance.modelId === modelInstance.modelId)

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
            'Authorization': `Bearer ${apiKey}`,
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
                apiKey,
                baseURL: `${baseURL}/${openaiVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                return provider.imageModel(modelInstance.modelId) as T
            }
            if (isTranscriptionModel) {
                if (!provider.transcriptionModel) {
                    throw new Error(`Provider ${providerName} does not support transcription models`)
                }
                return provider.transcriptionModel(modelInstance.modelId) as T
            }
            return provider(modelInstance.modelId) as T
        }
        case 'anthropic': {
            const anthropicVersion = 'v1'
            const provider = createAnthropic({
                apiKey,
                baseURL: `${baseURL}/${anthropicVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                throw new Error(`Provider ${providerName} does not support image models`)
            }
            return provider(modelInstance.modelId) as T
        }
        case 'replicate': {
            const replicateVersion = 'v1'
            const provider = createReplicate({
                apiToken: apiKey,
                baseURL: `${baseURL}/${replicateVersion}`,
                headers: createHeaders(),
            })
            if (!isImageModel) {
                throw new Error(`Provider ${providerName} does not support language models`)
            }
            return provider.imageModel(modelInstance.modelId) as unknown as T
        }
        case 'google': {
            const googleVersion = 'v1beta'
            const provider = createGoogleGenerativeAI({
                apiKey,
                baseURL: `${baseURL}/${googleVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                throw new Error(`Provider ${providerName} does not support image models`)
            }
            return provider(modelInstance.modelId) as T
        }
        default:
            throw new Error(`Provider ${providerName} is not supported`)
    }
}

type CreateAIProviderParams<T extends LanguageModel | ImageModel | TranscriptionModel> = {
    providerName: string
    modelInstance: T
    apiKey: string
    baseURL: string
    metadata: AIUsageMetadata
}