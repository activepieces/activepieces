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

        if (request.useAzureOpenAI && system.getEdition() !== ApEdition.ENTERPRISE) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: {
                    message: 'Azure OpenAI is only available for enterprise customers',
                },
            })
        }

        await aiProviderRepo().upsert({
            id: apId(),
            config: encryptUtils.encryptObject({
                apiKey: request.apiKey,
                azureOpenAI: request.useAzureOpenAI ? {
                    resourceName: request.resourceName,
                } : undefined,
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

    async getConfig(provider: string, platformId: PlatformId): Promise<AIProvider['config']> {
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

        return encryptUtils.decryptObject(aiProvider.config)
    },

    async getAIProviderPlatformId(userPlatformId: string): Promise<string> {
        if (!isCloudEdition) return userPlatformId

        const cloudPlatformId = system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID)
        if (cloudPlatformId === userPlatformId) return cloudPlatformId

        const platform = await platformService.getOneWithPlanOrThrow(userPlatformId)
        const isEnterpriseCustomer = platformUtils.isCustomerOnDedicatedDomain(platform)
        return isEnterpriseCustomer ? userPlatformId : cloudPlatformId
    },

    getBaseUrl(provider: string, config: AIProvider['config']): string {
        const providerStrategy = aiProvidersStrategies[provider]
        if (providerStrategy?.getBaseUrl) {
            return providerStrategy.getBaseUrl(config)
        }
        const providerConfig = getProviderConfig(provider)!
        return providerConfig.baseUrl
    },

    isModerationRequest(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean {
        const providerStrategy = aiProvidersStrategies[provider]
        if (providerStrategy?.isModerationRequest) {
            return providerStrategy.isModerationRequest(request)
        }
        return false
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

    isModelSupported(provider: string, model: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean {
        const providerConfig = getProviderConfig(provider)!
        return (
            !isNil(providerConfig.languageModels.find((m) => m.instance.modelId === model)) ||
            !isNil(providerConfig.imageModels.find((m) => m.instance.modelId === model)) ||
            !isNil(providerConfig.transcriptionModels.find((m) => m.instance.modelId === model)) ||
            this.isModerationRequest(provider, request)
        )
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

    rewriteUrl(provider: string, config: AIProvider['config'], originalUrl: string): string {
        const providerStrategy = aiProvidersStrategies[provider]
        if (providerStrategy?.rewriteUrl) {
            return providerStrategy.rewriteUrl(config, originalUrl)
        }
        return originalUrl
    },

    getAuthHeaders(provider: string, config: AIProvider['config']): Record<string, string> {
        const providerStrategy = aiProvidersStrategies[provider]
        if (providerStrategy.getAuthHeaders) {
            return providerStrategy.getAuthHeaders(config)
        }

        const providerConfig = getProviderConfig(provider)!
        return {
            [providerConfig.auth.headerName]: providerConfig.auth.bearer ? `Bearer ${config.apiKey}` : config.apiKey,
        }
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
