import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    AIProvider,
    AIProviderWithoutSensitiveData,
    ApEdition,
    apId,
    CreateAIProviderRequest,
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
import { aiProvidersStrategies, Usage } from './providers'
import { StreamingParser } from './providers/types'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)
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

    async isAgentConfigured(): Promise<boolean> {
        return aiProviderRepo().existsBy({
            provider: 'openai',
        })
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
        const isEnterpriseCustomer = platformUtils.isCustomerOnDedicatedDomain(platform)
        return isEnterpriseCustomer ? userPlatformId : cloudPlatformId
    },


    calculateUsage(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage {
        const providerStrategy = aiProvidersStrategies[provider]
        return providerStrategy.calculateUsage(request, response)
    },

    extractModelId(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null {
        const providerStrategy = aiProvidersStrategies[provider]
        if (!providerStrategy) return null
        return providerStrategy.extractModelId(request)
    },

    isModelSupported(provider: string, model: string): boolean {
        const providerConfig = getProviderConfig(provider)!
        return !isNil(providerConfig.languageModels.find((m) => m.instance.modelId === model)) || !isNil(providerConfig.imageModels.find((m) => m.instance.modelId === model))
    },

    isStreaming(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean {
        const providerStrategy = aiProvidersStrategies[provider]
        return providerStrategy.isStreaming(request)
    },

    providerSupportsStreaming(provider: string): boolean {
        const providerConfig = getProviderConfig(provider)!
        return providerConfig.streaming
    },

    streamingParser(provider: string): StreamingParser {
        const providerStrategy = aiProvidersStrategies[provider]
        return providerStrategy.streamingParser!()
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
