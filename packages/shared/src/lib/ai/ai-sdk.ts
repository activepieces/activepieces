import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createReplicate } from '@ai-sdk/replicate'
import { ImageModel } from 'ai'
import { SUPPORTED_AI_PROVIDERS } from './supported-ai-providers'
import { AI_USAGE_AGENT_ID_HEADER, AI_USAGE_FEATURE_HEADER, AI_USAGE_MCP_ID_HEADER, AIUsageFeature, AIUsageMetadata } from './index'

export function createAIModel<T extends LanguageModelV2 | ImageModel>({
    providerName,
    modelInstance,
    engineToken,
    baseURL,
    metadata,
}: CreateAIModelParams<T>): T {
    const modelId = modelInstance.modelId
    const isImageModel = SUPPORTED_AI_PROVIDERS
        .flatMap(provider => provider.imageModels)
        .some(model => model.instance.modelId === modelId)

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
            'Authorization': `Bearer ${engineToken}`,
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
            const model = createOpenAI({
                apiKey: engineToken,
                baseURL: `${baseURL}/${openaiVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                return model.imageModel(modelId) as T
            }
            return model.chat(modelId) as T
        }
        case 'anthropic': {
            const anthropicVersion = 'v1'
            const model = createAnthropic({
                apiKey: engineToken,
                baseURL: `${baseURL}/${anthropicVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                throw new Error(`Provider ${providerName} does not support image models`)
            }
            return model(modelId) as T
        }
        case 'replicate': {
            const replicateVersion = 'v1'
            const model = createReplicate({
                apiToken: engineToken,
                baseURL: `${baseURL}/${replicateVersion}`,
                headers: createHeaders(),
            })
            if (!isImageModel) {
                throw new Error(`Provider ${providerName} does not support language models`)
            }
            return model.imageModel(modelId) as unknown as T
        }
        case 'google': {
            const googleVersion = 'v1beta'
            const model = createGoogleGenerativeAI({
                apiKey: engineToken,
                baseURL: `${baseURL}/${googleVersion}`,
                headers: createHeaders(),
            })
            if (isImageModel) {
                throw new Error(`Provider ${providerName} does not support image models`)
            }
            return model(modelId) as T
        }
        default:
            throw new Error(`Provider ${providerName} is not supported`)
    }
}

type CreateAIModelParams<T extends LanguageModelV2 | ImageModel> = {
    providerName: string
    modelInstance: T
    /**
     * This is the engine token that will be replaced by the proxy with the api key
     */
    engineToken: string
    baseURL: string
    metadata: AIUsageMetadata
}