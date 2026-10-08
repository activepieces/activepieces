import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, spreadIfDefined } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { AIProviderModelType, AiProviderToolChoices, AiProviderToolConfig, AiToolAuthConfig, AiToolCapability, AiToolConfigWithoutSensitiveData, AiToolProvider, AiToolProviderConfig, CreateAiToolConfigRequest, GetEnabledAiToolsResponse, ResolvedAiTool, UpdateAiToolConfigRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { encryptUtils } from '../helper/encryption'
import { aiKeyScope } from './ai-key-scope'
import { AIProviderEntity } from './ai-provider-entity'
import { aiProviderService } from './ai-provider-service'
import { AiToolConfigEntity, AiToolConfigSchema } from './ai-tool-config-entity'
import { platformModelTierService } from './platform-model-tier-service'

const aiToolConfigRepo = repoFactory<AiToolConfigSchema>(AiToolConfigEntity)

export const aiToolConfigService = (log: FastifyBaseLogger) => ({
    async list(platformId: PlatformId): Promise<AiToolConfigWithoutSensitiveData[]> {
        const configs = await aiToolConfigRepo().findBy({ platformId })
        return configs.map(toWithoutSensitiveData)
    },

    async upsert(platformId: PlatformId, request: CreateAiToolConfigRequest): Promise<void> {
        const existing = await aiToolConfigRepo().findOneBy({ platformId, capability: request.capability })
        if (request.provider === AiToolProvider.AI_PROVIDER) {
            await assertProviderChoice({ platformId, capability: request.capability, config: request.config, log })
        }
        else if (isNil(request.auth)) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'An API key is required for this service' } })
        }
        const encryptedAuth = await encryptUtils.encryptObject(request.auth ?? {})
        await saveUnderPlatformLock({
            platformId,
            choice: request.provider === AiToolProvider.AI_PROVIDER ? request.config : null,
            write: (manager) => aiToolConfigRepo(manager).save({
                id: existing?.id ?? apId(),
                platformId,
                capability: request.capability,
                provider: request.provider,
                auth: encryptedAuth,
                config: request.config ?? null,
                enabled: request.enabled ?? true,
            }),
        })
    },

    async update(platformId: PlatformId, id: string, request: UpdateAiToolConfigRequest): Promise<void> {
        const config = await aiToolConfigRepo().findOneBy({ platformId, id })
        if (isNil(config)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: id, entityType: 'AiToolConfig' },
            })
        }
        const provider = request.provider ?? config.provider
        if (provider === AiToolProvider.AI_PROVIDER && (!isNil(request.provider) || !isNil(request.config))) {
            await assertProviderChoice({ platformId, capability: config.capability, config: request.config ?? config.config, log })
        }
        const leavesProviderWithoutKey = config.provider === AiToolProvider.AI_PROVIDER && provider !== AiToolProvider.AI_PROVIDER && isNil(request.auth)
        if (leavesProviderWithoutKey) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'An API key is required for this service' } })
        }
        const encryptedAuth = !isNil(request.auth) ? await encryptUtils.encryptObject(request.auth) : undefined
        await saveUnderPlatformLock({
            platformId,
            choice: provider === AiToolProvider.AI_PROVIDER ? request.config ?? config.config : null,
            write: (manager) => aiToolConfigRepo(manager).update(id, {
                ...spreadIfDefined('provider', request.provider),
                ...spreadIfDefined('auth', encryptedAuth),
                ...spreadIfDefined('config', request.config),
                ...spreadIfDefined('enabled', request.enabled),
            }),
        })
    },

    async delete(platformId: PlatformId, id: string): Promise<void> {
        await aiToolConfigRepo().delete({ platformId, id })
    },

    async getEnabledTools({ platformId }: { platformId: PlatformId }): Promise<GetEnabledAiToolsResponse> {
        const configs = await aiToolConfigRepo().findBy({ platformId, enabled: true })
        const result: GetEnabledAiToolsResponse = {}
        for (const config of configs.filter((row) => row.provider !== AiToolProvider.AI_PROVIDER)) {
            const resolved = await toResolvedTool(config)
            if (isNil(resolved)) {
                continue
            }
            switch (config.capability) {
                case AiToolCapability.WEB_SEARCH:
                    result.webSearch = resolved
                    break
                case AiToolCapability.WEB_SCRAPING:
                    result.webScraping = resolved
                    break
                case AiToolCapability.IMAGE_GENERATION:
                    result.imageGeneration = resolved
                    break
            }
        }
        return result
    },

    async getProviderChoices({ platformId }: { platformId: PlatformId }): Promise<AiProviderToolChoices> {
        const configs = await aiToolConfigRepo().findBy({ platformId, enabled: true, provider: AiToolProvider.AI_PROVIDER })
        return Object.fromEntries(configs.flatMap((config) => {
            const choice = AiProviderToolConfig.safeParse(config.config)
            const key = CHOICE_KEY_BY_CAPABILITY[config.capability]
            return choice.success && !isNil(key) ? [[key, choice.data]] : []
        }))
    },
})

async function saveUnderPlatformLock({ platformId, choice, write }: { platformId: PlatformId, choice: AiToolProviderConfig | null | undefined, write: (manager: EntityManager) => Promise<unknown> }): Promise<void> {
    await transaction(async (manager) => {
        await platformModelTierService.lockPlatform({ manager, platformId })
        const parsed = AiProviderToolConfig.safeParse(choice)
        if (parsed.success) {
            const key = await manager.getRepository(AIProviderEntity).findOneBy({ platformId, id: parsed.data.aiProviderId })
            const modelId = parsed.data.modelId
            const dropsModel = !isNil(key) && !isNil(modelId) && !aiKeyScope.keyOffersModel({ key, modelId })
            if (isNil(key) || key.projectScope !== 'all' || dropsModel) {
                throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'This AI provider cannot be used for this capability' } })
            }
        }
        await write(manager)
    })
}

async function assertProviderChoice({ platformId, capability, config, log }: { platformId: PlatformId, capability: AiToolCapability, config: AiToolProviderConfig | null | undefined, log: FastifyBaseLogger }): Promise<void> {
    const choice = AiProviderToolConfig.safeParse(config)
    const configs = choice.success ? await aiProviderService(log).listConfigs(platformId) : []
    const aiProvider = choice.success ? configs.find((row) => row.id === choice.data.aiProviderId) : undefined
    if (choice.success && !isNil(aiProvider) && await providerCovers({ platformId, capability, aiProvider, modelId: choice.data.modelId, log })) {
        return
    }
    throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'This AI provider cannot be used for this capability' } })
}

async function providerCovers({ platformId, capability, aiProvider, modelId, log }: { platformId: PlatformId, capability: AiToolCapability, aiProvider: { id: string, provider: AIProviderName }, modelId: string | undefined, log: FastifyBaseLogger }): Promise<boolean> {
    if (capability === AiToolCapability.WEB_SEARCH) {
        return aiUtils.supportsWebSearch(aiProvider.provider)
    }
    if (capability !== AiToolCapability.IMAGE_GENERATION || isNil(modelId)) {
        return false
    }
    const models = await aiProviderService(log).listModels({ platformId, provider: aiProvider.provider, scope: { type: 'platform' }, configId: aiProvider.id })
    return models.some((model) => model.id === modelId && model.type === AIProviderModelType.IMAGE)
}

function toWithoutSensitiveData(config: AiToolConfigSchema): AiToolConfigWithoutSensitiveData {
    return {
        id: config.id,
        capability: config.capability,
        provider: config.provider,
        config: config.config,
        enabled: config.enabled,
        hasApiKey: config.provider !== AiToolProvider.AI_PROVIDER && !isNil(config.auth),
    }
}

async function toResolvedTool(config: AiToolConfigSchema): Promise<ResolvedAiTool | null> {
    const auth = await encryptUtils.decryptObject<AiToolAuthConfig>(config.auth)
    if (isNil(auth?.apiKey) || auth.apiKey === '') {
        return null
    }
    return {
        provider: config.provider,
        apiKey: auth.apiKey,
        ...spreadIfDefined('config', config.config ?? undefined),
    }
}

const CHOICE_KEY_BY_CAPABILITY: Partial<Record<AiToolCapability, keyof AiProviderToolChoices>> = {
    [AiToolCapability.WEB_SEARCH]: 'webSearch',
    [AiToolCapability.IMAGE_GENERATION]: 'imageGeneration',
}
