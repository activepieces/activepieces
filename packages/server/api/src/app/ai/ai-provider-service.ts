import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    AIProvider,
    AIProviderWithoutSensitiveData,
    ApEdition,
    apId,
    CreateAIProviderRequest,
    DALLE2PricingPerImage,
    DALLE3PricingPerImage,
    ErrorCode,
    isNil,
    PlatformId,
    SeekPage,
    SUPPORTED_AI_PROVIDERS,
    SupportedAIProvider,
} from '@activepieces/shared'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { encryptUtils } from '../helper/encryption'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { platformUtils } from '../platform/platform.utils'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { AIUsageEntity, AIUsageSchema } from './ai-usage-entity'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)
const aiUsageRepo = repoFactory<AIUsageSchema>(AIUsageEntity)
const isCloudEdition = system.getEdition() === ApEdition.CLOUD

export const aiProviderService = {
    async list(userPlatformId: PlatformId): Promise<SeekPage<AIProviderWithoutSensitiveData>> {
        const platformId = await this.getAIProviderPlatformId(userPlatformId)

        const providers = await aiProviderRepo().findBy({ platformId })

        const aiProviders = providers.map((provider): AIProviderWithoutSensitiveData => ({
            id: provider.id,
            created: provider.created,
            updated: provider.updated,
            provider: provider.provider,
            platformId: provider.platformId,
        }))

        return {
            data: aiProviders,
            next: null,
            previous: null,
        }
    },

    async upsert(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        assertOnlyCloudPlatformCanEditOnCloud(platformId)

        await aiProviderRepo().upsert({
            id: apId(),
            config: encryptUtils.encryptObject({
                apiKey: request.apiKey,
            }),
            provider: request.provider,
            platformId,
        }, ['provider', 'platformId'])
    },

    async delete(platformId: PlatformId, provider: string): Promise<void> {
        assertOnlyCloudPlatformCanEditOnCloud(platformId)

        await aiProviderRepo().delete({
            platformId,
            provider,
        })
    },

    async getApiKey(provider: string, platformId: PlatformId): Promise<string> {
        const aiProvider = await aiProviderRepo().findOneOrFail({
            where: {
                provider,
                platformId,
            },
            select: {
                config: {
                    iv: true,
                    data: true,
                },
            },
        })

        return encryptUtils.decryptObject<AIProvider['config']>(aiProvider.config).apiKey
    },

    async getAIProviderPlatformId(userPlatformId: string): Promise<string> {
        if (!isCloudEdition) return userPlatformId

        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        if (cloudPlatformId === userPlatformId) return cloudPlatformId

        const platform = await platformService.getOneWithPlanOrThrow(userPlatformId)
        const isEnterpriseCustomer = platformUtils.isEnterpriseCustomerOnCloud(platform)
        return isEnterpriseCustomer ? userPlatformId : cloudPlatformId
    },

    async increaseProjectAIUsage(params: IncreaseProjectAIUsageParams): Promise<void> {
        await aiUsageRepo().insert({
            id: apId(),
            projectId: params.projectId,
            provider: params.provider,
            model: params.model,
            cost: params.cost,
        })
    },

    calculateUsage(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage {
        let strategy: UsageStrategy
        switch (provider) {
            case 'openai':
                strategy = openAIUsageStrategy
                break
            case 'anthropic':
                strategy = anthropicUsageStrategy
                break
            case 'replicate':
                strategy = replicateUsageStrategy
                break
            default:
                throw new ActivepiecesError({
                    code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
                    params: {
                        provider,
                    },
                })
                break
        }
        return strategy(request, response)
    },

    extractModel(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null {
        const body = request.body as Record<string, string>

        switch (provider) {
            case 'openai':
                return body.model
            case 'anthropic':
                return body?.model
            case 'replicate':
                if (body.version) {
                    // e.g. replicate/hello-world:5c7d5dc6
                    return body.version.split(':')[0]
                }
                else {
                    // Extract model from URL pattern: /v1/models/{owner}/{model-name}/predictions
                    const urlMatch = request.url.match(/\/v1\/models\/([^/]+\/[^/]+)/)
                    return urlMatch?.[1] ?? null
                }
            default:
                return null
        }
    },

    isModelSupported(provider: string, model: string): boolean {
        const providerConfig = getProviderConfig(provider)!
        return !isNil(providerConfig.languageModels.find((m) => m.instance.modelId === model)) || !isNil(providerConfig.imageModels.find((m) => m.instance.modelId === model))
    },
}

function assertOnlyCloudPlatformCanEditOnCloud(platformId: PlatformId): void {
    if (!isCloudEdition) {
        return
    }
    const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
    if (platformId === cloudPlatformId) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHORIZATION,
        params: {
            message: 'invalid route for principal type',
        },
    })
}

function getProviderConfig(provider: string | undefined): SupportedAIProvider | undefined {
    if (isNil(provider)) {
        return undefined
    }
    return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
}



type IncreaseProjectAIUsageParams = {
    projectId: string
    provider: string
    model: string
    cost: number
}

type Usage = {
    cost: number
    model: string
}

type UsageStrategy = (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>) => Usage

const openAIUsageStrategy: UsageStrategy = (request, response) => {
    const apiResponse = response as { usage?: { input_tokens?: number, output_tokens?: number, prompt_tokens?: number, completion_tokens?: number } }
    const params = request.params as Record<string, string>
    const provider = params?.['provider']
    const providerConfig = getProviderConfig(provider)!
    const body = request.body as Record<string, unknown>
    const model = aiProviderService.extractModel(provider!, request)!
    const size = body.size
    const imageCount = parseInt(body.n as string ?? '1')
    const quality = (body.quality ?? 'standard') as 'standard' | 'hd'

    const languageModelConfig = providerConfig.languageModels.find((m) => m.instance.modelId === model)
    const imageModelConfig = providerConfig.imageModels.find((m) => m.instance.modelId === model)
    if (!languageModelConfig && !imageModelConfig) {
        throw new ActivepiecesError({
            code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
            params: {
                provider: 'openai',
            },
        })
    }
    if (languageModelConfig) {
        let inputTokens = 0
        let outputTokens = 0
        if (request.url.includes('chat/completions')) {
            inputTokens = apiResponse.usage?.prompt_tokens ?? 0
            outputTokens = apiResponse.usage?.completion_tokens ?? 0
        }
        else {
            inputTokens = apiResponse.usage?.input_tokens ?? 0
            outputTokens = apiResponse.usage?.output_tokens ?? 0
        }

        const { input, output } = languageModelConfig.pricing
        return {
            cost: calculateTokensCost(inputTokens, outputTokens, input, output),
            model,
        }
    }

    if (imageModelConfig?.instance.modelId === 'dall-e-3') {
        const pricing = imageModelConfig.pricing as DALLE3PricingPerImage
        const imageCost = pricing[quality][size as keyof typeof pricing[typeof quality]]
        return {
            cost: imageCost * imageCount,
            model,
        }
    }

    const pricing = imageModelConfig?.pricing as DALLE2PricingPerImage
    const imageCost = pricing['standard'][size as keyof typeof pricing['standard']]
    return {
        cost: imageCost * imageCount,
        model,
    }
}

const anthropicUsageStrategy: UsageStrategy = (request, response) => {
    const apiResponse = response as { usage?: { input_tokens?: number, output_tokens?: number } }
    const params = request.params as Record<string, string>
    const provider = params?.['provider']
    const providerConfig = getProviderConfig(provider)!
    const model = aiProviderService.extractModel(provider!, request)!

    const languageModelConfig = providerConfig.languageModels.find((m) => m.instance.modelId === model)
    if (!languageModelConfig) {
        throw new ActivepiecesError({
            code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
            params: {
                provider: 'anthropic',
            },
        })
    }

    const inputTokens = apiResponse.usage?.input_tokens ?? 0
    const outputTokens = apiResponse.usage?.output_tokens ?? 0
    const { input, output } = languageModelConfig.pricing
    return {
        cost: calculateTokensCost(inputTokens, outputTokens, input, output),
        model,
    }
}

const replicateUsageStrategy: UsageStrategy = (request, _response) => {
    const params = request.params as Record<string, string>
    const provider = params?.['provider']
    const providerConfig = getProviderConfig(provider)!
    const model = aiProviderService.extractModel(provider!, request)!

    const imageModelConfig = providerConfig.imageModels.find((m) => m.instance.modelId === model)
    if (!imageModelConfig) {
        throw new ActivepiecesError({
            code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
            params: {
                provider: 'replicate',
            },
        })
    }

    return {
        cost: imageModelConfig.pricing as number,
        model,
    }
}

function calculateTokensCost(
    inputTokens: number,
    outputTokens: number,
    inputCostPerMillionTokens: number,
    outputCostPerMillionTokens: number,
): number {
    return (inputTokens / 1000000) * inputCostPerMillionTokens + (outputTokens / 1000000) * outputCostPerMillionTokens
}
