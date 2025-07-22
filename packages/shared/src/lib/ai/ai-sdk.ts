import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createReplicate } from '@ai-sdk/replicate'
import { ImageModel, LanguageModel } from 'ai'
import { SUPPORTED_AI_PROVIDERS } from './supported-ai-providers'

export function createAIProvider<T extends LanguageModel | ImageModel>({
    providerName,
    modelInstance,
    apiKey,
    baseURL,
}: CreateAIProviderParams<T>): T {
    const isImageModel = SUPPORTED_AI_PROVIDERS
        .flatMap(provider => provider.imageModels)
        .some(model => model.instance.modelId === modelInstance.modelId)

    switch (providerName) {
        case 'openai': {
            const openaiVersion = 'v1'
            const provider = createOpenAI({
                apiKey,
                baseURL: `${baseURL}/${openaiVersion}`,
            })
            if (isImageModel) {
                return provider.imageModel(modelInstance.modelId) as T
            }
            return provider(modelInstance.modelId) as T
        }
        case 'anthropic': {
            const anthropicVersion = 'v1'
            const provider = createAnthropic({
                apiKey,
                baseURL: `${baseURL}/${anthropicVersion}`,
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

type CreateAIProviderParams<T extends LanguageModel | ImageModel> = {
    providerName: string
    modelInstance: T
    apiKey: string
    baseURL: string
}