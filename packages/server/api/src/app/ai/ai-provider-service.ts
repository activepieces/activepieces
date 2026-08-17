import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, spreadIfDefined } from '@activepieces/core-utils'
import { ActivePiecesProviderAuthConfig, AIProviderAuthConfig, AIProviderConfig, AIProviderModel, AIProviderWithoutSensitiveData, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, CreateAIProviderRequest, GetProviderConfigResponse, UpdateAIProviderRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { repoFactory } from '../core/db/repo-factory'
import { openRouterApi } from '../ee/platform/platform-plan/openrouter/openrouter-api'
import { flagService } from '../flags/flag.service'
import { encryptUtils } from '../helper/encryption'
import { platformService } from '../platform/platform.service'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { aiProviders } from './providers'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const modelsCache = new Map<string, AIProviderModel[]>()

const MANAGED_OPENROUTER_KEY_MONTHLY_LIMIT_USD = 500
const MANAGED_OPENROUTER_KEY_LIMIT_RESET = 'monthly'

export const aiProviderService = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        cron.schedule('0 0 * * *', () => {
            log.info('Clearing AI provider models cache')
            modelsCache.clear()
        })
    },

    async listProviders(platformId: PlatformId): Promise<AIProviderWithoutSensitiveData[]> {
        const aiCreditsEnabled = flagService(log).aiCreditsEnabled()
        const activepiecesExists = await aiProviderRepo().existsBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })

        if (aiCreditsEnabled && !activepiecesExists) {
            const hasChatProvider = await aiProviderRepo().existsBy({ platformId, enabledForChat: true })
            await aiProviderRepo().save({
                id: apId(),
                auth: await encryptUtils.encryptObject({}),
                config: {},
                provider: AIProviderName.ACTIVEPIECES,
                displayName: 'Activepieces',
                platformId,
                enabledForChat: !hasChatProvider,
            })
        }
        const configuredProviders = await aiProviderRepo().findBy({ platformId })

        const hasActivepiecesProvider = configuredProviders.some((p) => p.provider === AIProviderName.ACTIVEPIECES)
        const hideActivepiecesProvider = hasActivepiecesProvider && await isActivepiecesAiProviderHidden({ platformId, log })

        return configuredProviders
            .filter((p) => !(hideActivepiecesProvider && p.provider === AIProviderName.ACTIVEPIECES))
            .map((p): AIProviderWithoutSensitiveData => ({
                id: p.id,
                name: p.displayName,
                provider: p.provider,
                config: p.config,
                enabledForChat: p.enabledForChat ?? false,
            }))
    },

    async listModels(platformId: PlatformId, provider: AIProviderName): Promise<AIProviderModel[]> {
        const { config, auth } = await this.getConfigOrThrow({ platformId, provider })

        const cacheKey = `${provider}-${getAuthCacheFingerprint({ provider, auth, config })}`
        if (modelsCache.has(cacheKey) && !('models' in config)) {
            return modelsCache.get(cacheKey)!
        }

        const data = await aiProviders[provider].listModels(auth, config)

        modelsCache.set(cacheKey, data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
        })))

        return modelsCache.get(cacheKey)!
    },

    async create(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        await this.validateProviderCredentials(request.provider, request.auth, request.config)
        await aiProviderRepo().save({
            id: apId(),
            auth: await encryptUtils.encryptObject(request.auth),
            config: request.config,
            provider: request.provider,
            displayName: request.displayName,
            platformId,
        })
    },
    async update(platformId: PlatformId, providerId: string, request: UpdateAIProviderRequest): Promise<void> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            id: providerId,
        })
        if (isNil(aiProvider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: providerId, entityType: 'AIProvider' },
            })
        }

        if (aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            if (request.enabledForChat === true) {
                await aiProviderRepo().manager.transaction(async (manager) => {
                    await manager.update(AIProviderEntity, { platformId }, { enabledForChat: false })
                    await manager.update(AIProviderEntity, providerId, { enabledForChat: true })
                })
            }
            return
        }

        const config = request.config ?? aiProvider.config
        if (!isNil(request.auth)) {
            await this.validateProviderCredentials(aiProvider.provider, request.auth, config)
        }
        else {
            const { auth } = await this.getConfigOrThrow({ platformId, provider: aiProvider.provider })
            await this.validateProviderCredentials(aiProvider.provider, auth, config)
        }

        const encryptedAuth = !isNil(request.auth) ? await encryptUtils.encryptObject(request.auth) : undefined
        const updates = {
            ...spreadIfDefined('auth', encryptedAuth),
            ...spreadIfDefined('config', request.config),
            ...spreadIfDefined('enabledForChat', request.enabledForChat),
            displayName: request.displayName,
        }

        if (request.enabledForChat === true) {
            await aiProviderRepo().manager.transaction(async (manager) => {
                await manager.update(AIProviderEntity, { platformId }, { enabledForChat: false })
                await manager.update(AIProviderEntity, providerId, updates)
            })
        }
        else {
            await aiProviderRepo().update(providerId, updates)
        }
    },

    async getChatProviderName({ platformId }: { platformId: PlatformId }): Promise<AIProviderName | null> {
        const chatProvider = await findAvailableChatProviderRow({ platformId, log })
        return chatProvider?.provider ?? null
    },

    async getChatProvider({ platformId }: { platformId: PlatformId }): Promise<GetProviderConfigResponse | null> {
        const chatProvider = await findAvailableChatProviderRow({ platformId, log })
        if (isNil(chatProvider)) {
            return null
        }
        let auth = await encryptUtils.decryptObject<AIProviderAuthConfig>(chatProvider.auth)
        if (chatProvider.provider === AIProviderName.ACTIVEPIECES) {
            const doesHaveKeys = !isNil(auth) && 'apiKey' in auth && !isNil(auth.apiKey) && auth.apiKey !== ''
            if (!doesHaveKeys) {
                const enriched = await enrichWithKeysIfNeeded(chatProvider, platformId)
                auth = enriched.auth
            }
        }
        return { provider: chatProvider.provider, auth, config: chatProvider.config, platformId }
    },

    async exists({ platformId, provider }: { platformId: PlatformId, provider: AIProviderName }): Promise<boolean> {
        return aiProviderRepo().existsBy({ platformId, provider })
    },

    async delete(platformId: PlatformId, providerId: string): Promise<void> {
        await aiProviderRepo().delete({
            platformId,
            id: providerId,
        })
    },
    async validateProviderCredentials(provider: AIProviderName, auth: AIProviderAuthConfig, config: AIProviderConfig): Promise<void> {
        const providerStrategy = aiProviders[provider]
        try {
            await providerStrategy.validateConnection(auth, config, log)
        }
        catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            const includeHttpErrorInMessage = provider === AIProviderName.CLOUDFLARE_GATEWAY
            log.error({ error }, '[aiProviderService#validateProviderCredentials] Failed to validate provider credentials')
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_AI_PROVIDER_CREDENTIALS,
                params: {
                    provider,
                    message: includeHttpErrorInMessage
                        ? `Failed to validate credentials for ${providerStrategy.name}, ${errorMessage}`
                        : `Failed to validate credentials for ${providerStrategy.name}`,
                    httpErrorResponse: errorMessage,
                },
            })
        }
    },
    async getConfigOrThrow({ platformId, provider }: GetOrCreateActivepiecesConfigResponse): Promise<GetProviderConfigResponse> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            provider,
        })
        if (isNil(aiProvider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: provider,
                    entityType: 'AIProvider',
                },
            }, `the ${provider} AI provider is not configured on this platform`)
        }

        let auth = await encryptUtils.decryptObject<AIProviderAuthConfig>(aiProvider.auth)

        if (aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            const doesHaveKeys = !isNil(auth) && 'apiKey' in auth && !isNil(auth.apiKey) && auth.apiKey !== ''
            if (!doesHaveKeys) {
                const { auth: activePiecesAuth } = await enrichWithKeysIfNeeded(aiProvider, platformId)

                auth = activePiecesAuth
            }

        }


        return { provider: aiProvider.provider, auth, config: aiProvider.config, platformId }
    },
    async getOrCreateActivePiecesProviderAuthConfig(platformId: PlatformId): Promise<ActivePiecesProviderAuthConfig> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            provider: AIProviderName.ACTIVEPIECES,
        })
        if (isNil(aiProvider)) {
            const hasChatProvider = await aiProviderRepo().existsBy({ platformId, enabledForChat: true })
            await aiProviderRepo().save({
                id: apId(),
                auth: await encryptUtils.encryptObject({}),
                config: {},
                provider: AIProviderName.ACTIVEPIECES,
                displayName: 'Activepieces',
                platformId,
                enabledForChat: !hasChatProvider,
            })
        }

        const { auth } = await this.getConfigOrThrow({ platformId, provider: AIProviderName.ACTIVEPIECES })
        return auth as ActivePiecesProviderAuthConfig
    },
})

async function shouldHideActivepiecesAiProvider({ platformId, log }: { platformId: PlatformId, log: FastifyBaseLogger }): Promise<boolean> {
    const { plan } = await platformService(log).getOneWithPlanOrThrow(platformId)
    return plan.embeddingEnabled
}

type GetOrCreateActivepiecesConfigResponse = {
    platformId: PlatformId
    provider: AIProviderName
}

async function findAvailableChatProviderRow({ platformId, log }: { platformId: PlatformId, log: FastifyBaseLogger }): Promise<AIProviderSchema | null> {
    const chatProviders = await aiProviderRepo().findBy({ platformId, enabledForChat: true })
    if (!chatProviders.some((chatProvider) => chatProvider.provider === AIProviderName.ACTIVEPIECES)) {
        return chatProviders[0] ?? null
    }
    const activepiecesHidden = await isActivepiecesAiProviderHidden({ platformId, log })
    return chatProviders.find((chatProvider) => chatProvider.provider !== AIProviderName.ACTIVEPIECES || !activepiecesHidden) ?? null
}

async function isActivepiecesAiProviderHidden({ platformId, log }: { platformId: PlatformId, log: FastifyBaseLogger }): Promise<boolean> {
    if (!flagService(log).aiCreditsEnabled()) {
        return true
    }
    return shouldHideActivepiecesAiProvider({ platformId, log })
}

async function enrichWithKeysIfNeeded(aiProvider: AIProviderSchema, platformId: PlatformId): Promise<GetProviderConfigResponse> {
    const { key, data } = await openRouterApi.createKey({
        name: `Platform ${platformId}`,
        limit: MANAGED_OPENROUTER_KEY_MONTHLY_LIMIT_USD,
        limit_reset: MANAGED_OPENROUTER_KEY_LIMIT_RESET,
    })
    const rawAuth: ActivePiecesProviderAuthConfig = { apiKey: key, apiKeyHash: data.hash }
    const savedAiProvider = await aiProviderRepo().save({
        id: aiProvider.id,
        platformId,
        provider: AIProviderName.ACTIVEPIECES,
        displayName: 'Activepieces',
        config: {},
        auth: await encryptUtils.encryptObject(rawAuth),
    })
    return { provider: savedAiProvider.provider, auth: rawAuth, config: savedAiProvider.config, platformId }
}


function getAuthCacheFingerprint({ provider, auth, config }: { provider: AIProviderName, auth: AIProviderAuthConfig, config: AIProviderConfig }): string {
    switch (provider) {
        case AIProviderName.BEDROCK: {
            const { accessKeyId, secretAccessKey } = auth as BedrockProviderAuthConfig
            const { region } = config as BedrockProviderConfig
            return `${accessKeyId}-${secretAccessKey}-${region}`
        }
        default: {
            const { apiKey } = auth as BaseAIProviderAuthConfig
            return apiKey
        }
    }
}
