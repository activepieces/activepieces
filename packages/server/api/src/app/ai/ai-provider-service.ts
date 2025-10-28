import {
    AI_USAGE_AGENT_ID_HEADER,
    AI_USAGE_FEATURE_HEADER,
    AI_USAGE_MCP_ID_HEADER,
    AIProvider,
    AIProviderWithoutSensitiveData,
    AIUsageFeature,
    CreateAIProviderRequest,
    SUPPORTED_AI_PROVIDERS,
    SupportedAIProvider,
} from '@activepieces/common-ai'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    ErrorCode,
    isNil,
    PlatformId,
    SeekPage,
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
            config: await encryptUtils.encryptObject({
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

    isNonUsageRequest(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean {
        const providerStrategy = aiProvidersStrategies[provider]
        if (providerStrategy?.isNonUsageRequest) {
            return providerStrategy.isNonUsageRequest(request)
        }
        return false
    },

    calculateUsage(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>): Usage | null {
        const providerStrategy = aiProvidersStrategies[provider]
        return providerStrategy.calculateUsage(request, response)
    },

    extractModelId(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): string | null {
        const providerStrategy = aiProvidersStrategies[provider]
        if (!providerStrategy) return null
        return providerStrategy.extractModelId(request)
    },

    isModelSupported(provider: string, model: string | null, request: FastifyRequest<RequestGenericInterface, RawServerBase>): boolean {
        const providerConfig = getProviderConfig(provider)!
        if (this.isNonUsageRequest(provider, request)) {
            return true
        }
        return (
            !isNil(model) &&
            !isNil(providerConfig.languageModels.find((m) => m.instance.modelId === model)) ||
            !isNil(providerConfig.imageModels.find((m) => m.instance.modelId === model)) ||
            !isNil(providerConfig.videoModels.find((m) => m.instance.modelId === model))
        )
    },
    getVideoModelCost({ provider, request }: { provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase> }) {
        const providerStrategy = aiProvidersStrategies[provider]
        const modelConfig = providerStrategy.extractModelId(request)
        const providerConfig = getProviderConfig(provider)
        const videoModelConfig = providerConfig?.videoModels.find((m) => m.instance.modelId === modelConfig)
        if (videoModelConfig) {
            return videoModelConfig.pricing.costPerSecond * videoModelConfig.minimumDurationInSeconds
        }
        return 0
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

    validateRequest(provider: string, request: FastifyRequest<RequestGenericInterface, RawServerBase>): void {
        validateAIUsageHeaders(request.headers)

        if (this.isStreaming(provider, request) && !this.providerSupportsStreaming(provider)) {
            throw new ActivepiecesError({
                code: ErrorCode.AI_REQUEST_NOT_SUPPORTED,
                params: {
                    message: 'Streaming is not supported for this provider',
                },
            })
        }

        const model = this.extractModelId(provider, request)
        if (!this.isModelSupported(provider, model, request)) {
            throw new ActivepiecesError({
                code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                params: {
                    provider,
                    model: model ?? 'unknown',
                },
            })
        }

        const providerStrategy = aiProvidersStrategies[provider]
        if (providerStrategy.validateRequest) {
            providerStrategy.validateRequest(request)
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


function validateAIUsageHeaders(headers: Record<string, string | string[] | undefined>): void {
    const feature = headers[AI_USAGE_FEATURE_HEADER] as AIUsageFeature
    const agentId = headers[AI_USAGE_AGENT_ID_HEADER] as string | undefined
    const mcpId = headers[AI_USAGE_MCP_ID_HEADER] as string | undefined

    // Validate feature header
    const supportedFeatures = Object.values(AIUsageFeature).filter(f => f !== AIUsageFeature.UNKNOWN) as AIUsageFeature[]
    if (feature && !supportedFeatures.includes(feature)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `${AI_USAGE_FEATURE_HEADER} header must be one of the following: ${supportedFeatures.join(', ')}`,
            },
        })
    }

    if (feature === AIUsageFeature.AGENTS && !agentId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `${AI_USAGE_AGENT_ID_HEADER} header is required when feature is ${AIUsageFeature.AGENTS}`,
            },
        })
    }

    if (feature === AIUsageFeature.MCP && !mcpId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `${AI_USAGE_MCP_ID_HEADER} header is required when feature is ${AIUsageFeature.MCP}`,
            },
        })
    }
}
