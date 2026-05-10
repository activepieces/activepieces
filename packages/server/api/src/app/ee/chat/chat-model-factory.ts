import {
    AIProviderAuthConfig,
    AIProviderConfig,
    AIProviderName,
    AzureProviderConfig,
    BaseAIProviderAuthConfig,
    BedrockProviderAuthConfig,
    BedrockProviderConfig,
    CloudflareGatewayProviderConfig,
    OpenAICompatibleProviderConfig,
    splitCloudflareGatewayModelId,
} from '@activepieces/shared'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure } from '@ai-sdk/azure'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LanguageModel } from 'ai'

function createChatModel({ provider, auth, config, modelId }: CreateChatModelParams): LanguageModel {
    switch (provider) {
        case AIProviderName.OPENAI: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenAI({ apiKey }).chat(modelId)
        }
        case AIProviderName.ANTHROPIC: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createAnthropic({ apiKey })(modelId)
        }
        case AIProviderName.GOOGLE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createGoogleGenerativeAI({ apiKey })(modelId)
        }
        case AIProviderName.AZURE: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { resourceName } = config as AzureProviderConfig
            return createAzure({ resourceName, apiKey }).chat(modelId)
        }
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = auth as BedrockProviderAuthConfig
            const { region } = config as BedrockProviderConfig
            return createAmazonBedrock({ region, accessKeyId, secretAccessKey })(modelId)
        }
        case AIProviderName.CLOUDFLARE_GATEWAY: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig
            const { model: actualModelId } = splitCloudflareGatewayModelId(modelId)
            return createOpenAICompatible({
                name: 'cloudflare',
                baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                headers: { 'cf-aig-authorization': `Bearer ${apiKey}` },
            }).chatModel(actualModelId)
        }
        case AIProviderName.CUSTOM: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            const { apiKeyHeader, baseUrl, defaultHeaders } = config as OpenAICompatibleProviderConfig
            return createOpenAICompatible({
                name: 'openai-compatible',
                baseURL: baseUrl,
                headers: {
                    ...(defaultHeaders ?? {}),
                    [apiKeyHeader]: apiKey,
                },
            }).chatModel(modelId)
        }
        case AIProviderName.ACTIVEPIECES:
        case AIProviderName.OPENROUTER: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return createOpenRouter({ apiKey }).chat(modelId) as LanguageModel
        }
        default: {
            const exhaustiveCheck: never = provider
            throw new Error(`Unsupported chat provider: ${exhaustiveCheck}`)
        }
    }
}

type CreateChatModelParams = {
    provider: AIProviderName
    auth: AIProviderAuthConfig
    config: AIProviderConfig
    modelId: string
}

export { createChatModel }
