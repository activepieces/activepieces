import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createAzure } from '@ai-sdk/azure'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LanguageModel } from 'ai'
import { AIProviderName, AzureProviderConfig, CloudflareGatewayProviderConfig, GetProviderConfigResponse, OpenAICompatibleProviderConfig } from '@activepieces/shared'
import { ApAxiosClient } from '../api/ap-axios'
import { workerMachine } from '../utils/machine'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

type GetModelParams = {
    provider: AIProviderName
    modelId: string
    engineToken: string
}

export const agentUtils = {
    async getModel({ provider, modelId, engineToken }: GetModelParams): Promise<LanguageModel> {
        const client = new ApAxiosClient(
            removeTrailingSlash(workerMachine.getInternalApiUrl()),
            engineToken,
        )
        const { config, auth } = await client.get<GetProviderConfigResponse>(
            `/v1/ai-providers/${provider}/config`,
            {},
        )

        switch (provider) {
            case AIProviderName.OPENAI: {
                const openaiProvider = createOpenAI({ apiKey: auth.apiKey })
                return openaiProvider.chat(modelId)
            }
            case AIProviderName.ANTHROPIC: {
                const anthropicProvider = createAnthropic({ apiKey: auth.apiKey })
                return anthropicProvider(modelId)
            }
            case AIProviderName.GOOGLE: {
                const googleProvider = createGoogleGenerativeAI({ apiKey: auth.apiKey })
                return googleProvider(modelId)
            }
            case AIProviderName.AZURE: {
                const { resourceName } = config as AzureProviderConfig
                const azureProvider = createAzure({ resourceName, apiKey: auth.apiKey })
                return azureProvider.chat(modelId)
            }
            case AIProviderName.CLOUDFLARE_GATEWAY: {
                const { accountId, gatewayId } = config as CloudflareGatewayProviderConfig
                const cloudflareProvider = createOpenAICompatible({
                    name: 'cloudflare',
                    baseURL: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`,
                    headers: {
                        'cf-aig-authorization': `Bearer ${auth.apiKey}`,
                    },
                })
                return cloudflareProvider.chatModel(modelId)
            }
            case AIProviderName.CUSTOM: {
                const { apiKeyHeader, baseUrl } = config as OpenAICompatibleProviderConfig
                const customProvider = createOpenAICompatible({
                    name: 'openai-compatible',
                    baseURL: baseUrl,
                    headers: {
                        [apiKeyHeader]: auth.apiKey,
                    },
                })
                return customProvider.chatModel(modelId)
            }
            case AIProviderName.ACTIVEPIECES:
            case AIProviderName.OPENROUTER: {
                const openrouterProvider = createOpenRouter({ apiKey: auth.apiKey })
                return openrouterProvider.chat(modelId) as LanguageModel
            }
            default:
                throw new Error(`Provider ${provider} is not supported`)
        }
    },
}