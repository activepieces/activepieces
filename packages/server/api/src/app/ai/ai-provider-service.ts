import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, spreadIfDefined } from '@activepieces/core-utils'
import { ActivePiecesProviderAuthConfig, AIProviderAuthConfig, AIProviderConfig, AIProviderModel, AiProviderProjectScope, AIProviderWithoutSensitiveData, BaseAIProviderAuthConfig, BedrockProviderAuthConfig, BedrockProviderConfig, CreateAIProviderRequest, GetProviderConfigResponse, UpdateAIProviderRequest } from '@activepieces/shared'
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
                modelScope: p.modelScope,
                modelIds: p.modelIds,
                projectScope: p.projectScope,
                projectIds: p.projectIds,
            }))
    },

    async listModels({ platformId, provider, projectId }: { platformId: PlatformId, provider: AIProviderName, projectId?: string }): Promise<AIProviderModel[]> {
        const aiProvider = await resolveEligibleRow({ platformId, provider, projectId })
        const { config } = aiProvider
        const auth = await decryptRowAuth({ aiProvider, platformId })

        const cacheKey = `${provider}-${getAuthCacheFingerprint({ provider, auth, config })}`
        if (!modelsCache.has(cacheKey) || 'models' in config) {
            const data = await aiProviders[provider].listModels(auth, config)
            modelsCache.set(cacheKey, data.map(model => ({
                id: model.id,
                name: model.name,
                type: model.type,
            })))
        }

        const models = modelsCache.get(cacheKey)!
        const restrictToAllowList = !isNil(projectId) && aiProvider.modelScope === 'selected'
        return restrictToAllowList ? models.filter((model) => aiProvider.modelIds.includes(model.id)) : models
    },

    async create(platformId: PlatformId, request: CreateAIProviderRequest): Promise<void> {
        if (request.provider === AIProviderName.ACTIVEPIECES) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'aiProvider.activepiecesIsManaged' },
            })
        }
        await this.validateProviderCredentials(request.provider, request.auth, request.config)
        await aiProviderRepo().save({
            id: apId(),
            auth: await encryptUtils.encryptObject(request.auth),
            config: request.config,
            provider: request.provider,
            displayName: request.displayName,
            platformId,
            modelScope: 'all',
            modelIds: [],
            projectScope: 'all',
            projectIds: [],
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
        else if (!isNil(request.config)) {
            const auth = await decryptRowAuth({ aiProvider, platformId })
            await this.validateProviderCredentials(aiProvider.provider, auth, config)
        }

        const encryptedAuth = !isNil(request.auth) ? await encryptUtils.encryptObject(request.auth) : undefined
        const updates = {
            ...spreadIfDefined('auth', encryptedAuth),
            ...spreadIfDefined('config', request.config),
            ...spreadIfDefined('enabledForChat', request.enabledForChat),
            ...spreadIfDefined('modelScope', request.modelScope),
            ...spreadIfDefined('modelIds', request.modelIds),
            ...spreadIfDefined('projectScope', request.projectScope),
            ...spreadIfDefined('projectIds', request.projectIds),
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
    async getConfigOrThrow({ platformId, provider, projectId }: { platformId: PlatformId, provider: AIProviderName, projectId?: string }): Promise<GetProviderConfigResponse> {
        const aiProvider = await resolveEligibleRow({ platformId, provider, projectId })
        const auth = await decryptRowAuth({ aiProvider, platformId })
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

const PROJECT_SCOPE_SPECIFICITY: Record<AiProviderProjectScope, number> = {
    selected: 0,
    except: 1,
    all: 2,
}

function rowAllowsProject({ row, projectId }: { row: AIProviderSchema, projectId: string }): boolean {
    switch (row.projectScope) {
        case 'selected':
            return row.projectIds.includes(projectId)
        case 'except':
            return !row.projectIds.includes(projectId)
        default:
            return true
    }
}

async function resolveEligibleRow({ platformId, provider, projectId }: { platformId: PlatformId, provider: AIProviderName, projectId?: string }): Promise<AIProviderSchema> {
    const rows = await aiProviderRepo().findBy({ platformId, provider })
    const eligible = isNil(projectId) ? rows : rows.filter((row) => rowAllowsProject({ row, projectId }))
    const ranked = [...eligible].sort((a, b) => {
        const specificityDelta = PROJECT_SCOPE_SPECIFICITY[a.projectScope] - PROJECT_SCOPE_SPECIFICITY[b.projectScope]
        if (specificityDelta !== 0) {
            return specificityDelta
        }
        return new Date(b.created).getTime() - new Date(a.created).getTime()
    })
    const winner = ranked[0]
    if (isNil(winner)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: provider,
                entityType: 'AIProvider',
            },
        })
    }
    return winner
}

async function decryptRowAuth({ aiProvider, platformId }: { aiProvider: AIProviderSchema, platformId: PlatformId }): Promise<AIProviderAuthConfig> {
    const auth = await encryptUtils.decryptObject<AIProviderAuthConfig>(aiProvider.auth)
    if (aiProvider.provider === AIProviderName.ACTIVEPIECES) {
        const doesHaveKeys = !isNil(auth) && 'apiKey' in auth && !isNil(auth.apiKey) && auth.apiKey !== ''
        if (!doesHaveKeys) {
            const { auth: activePiecesAuth } = await enrichWithKeysIfNeeded(aiProvider, platformId)
            return activePiecesAuth
        }
    }
    return auth
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
