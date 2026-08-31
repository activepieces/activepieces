import { ActivepiecesError, AiProviderKeyStatus, AIProviderName, apId, classifyProviderOutcome, ErrorCode, isNil, PlatformId, ProviderOutcomeSignal, spreadIfDefined, spreadIfNotUndefined, toProviderOutcomeSignal, tryCatch, unique } from '@activepieces/core-utils'
import { modelCatalog } from '@activepieces/server-utils'
import { ActivePiecesProviderAuthConfig, AI_PROVIDER_ENTITY_TYPES, AIProviderAuthConfig, AIProviderConfig, AIProviderModel, AiProviderProjectScope, AIProviderWithoutSensitiveData, CreateAIProviderRequest, GetProviderConfigResponse, ProjectAIProvider, UpdateAIProviderRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import cron from 'node-cron'
import { repoFactory } from '../core/db/repo-factory'
import { getAiProviderConfirmKey } from '../database/redis/keys'
import { distributedStore } from '../database/redis-connections'
import { openRouterApi } from '../ee/platform/platform-plan/openrouter/openrouter-api'
import { flagService } from '../flags/flag.service'
import { encryptUtils } from '../helper/encryption'
import { platformService } from '../platform/platform.service'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { aiProviderHealth } from './ai-provider-health'
import { aiProviders } from './providers'

const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const modelsCache = new Map<string, AIProviderModel[]>()

const MANAGED_OPENROUTER_KEY_MONTHLY_LIMIT_USD = 500
const MANAGED_OPENROUTER_KEY_LIMIT_RESET = 'monthly'

// A passing check must not lock out the next real failure, so the claim is a floor between
// checks rather than a window that swallows them. A confirmed failure needs no floor: the row
// stops being active, and only an active key asks for confirmation.
const CONFIRM_MIN_INTERVAL_SECONDS = 10

export const aiProviderService = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        cron.schedule('0 0 * * *', () => {
            log.info('Clearing AI provider models cache')
            modelsCache.clear()
        })
    },

    async listConfigs(platformId: PlatformId): Promise<AIProviderWithoutSensitiveData[]> {
        const rows = await listVisibleRows({ platformId, log })
        return rows.map(toConfigResponse)
    },

    async listForProject({ platformId, projectId }: { platformId: PlatformId, projectId: string }): Promise<ProjectAIProvider[]> {
        const rows = await listVisibleRows({ platformId, log })
        const eligible = rows.filter((row) => rowAllowsScope({ row, scope: { type: 'project', projectId } }))
        const ranked = rankRows(eligible)
        return unique(ranked.map((row) => row.provider)).map((provider) => {
            const rows = ranked.filter((row) => row.provider === provider)
            return {
                provider,
                name: aiProviders[provider].name,
                enabledForChat: rows.some((row) => row.enabledForChat === true),
                keys: rows.map((row) => ({ id: row.id, name: row.displayName })),
            }
        })
    },

    async listModels({ platformId, provider, scope, configId }: { platformId: PlatformId, provider: AIProviderName, scope: ProviderScope, configId?: string }): Promise<AIProviderModel[]> {
        const aiProvider = await resolveRowForScope({ platformId, provider, scope, configId })
        const models = await fetchModels({ aiProvider, platformId, log })
        return aiProvider.modelScope === 'selected'
            ? models.filter((model) => aiProvider.modelIds.includes(model.id))
            : models
    },

    async listModelsForConfig({ platformId, configId }: { platformId: PlatformId, configId: string }): Promise<AIProviderModel[]> {
        const aiProvider = await getRowByIdOrThrow({ platformId, configId })
        return fetchModels({ aiProvider, platformId, log })
    },

    async create(platformId: PlatformId, request: CreateAIProviderRequest): Promise<AIProviderWithoutSensitiveData> {
        if (request.provider === AIProviderName.ACTIVEPIECES) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'aiProvider.activepiecesIsManaged' },
            })
        }
        await assertDisplayNameIsFree({ platformId, provider: request.provider, displayName: request.displayName })
        await this.validateProviderCredentials(request.provider, request.auth, request.config)
        const saved = await aiProviderRepo().save({
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
            status: 'active',
            statusReason: null,
            statusUpdated: new Date().toISOString(),
        })
        return toConfigResponse(saved)
    },
    async update(platformId: PlatformId, providerId: string, request: UpdateAIProviderRequest): Promise<void> {
        const aiProvider = await aiProviderRepo().findOneBy({
            platformId,
            id: providerId,
        })
        if (isNil(aiProvider)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: providerId, entityType: AI_PROVIDER_ENTITY_TYPES.provider },
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

        await assertDisplayNameIsFree({ platformId, provider: aiProvider.provider, displayName: request.displayName, exceptId: providerId })

        const config = request.config ?? aiProvider.config
        const revalidated = !isNil(request.auth) || !isNil(request.config)
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
            ...(revalidated ? provedHealthy() : {}),
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

    async getChatProviderName({ platformId, scope }: { platformId: PlatformId, scope: ProviderScope }): Promise<AIProviderName | null> {
        const chatProvider = await findAvailableChatProviderRow({ platformId, scope, log })
        return chatProvider?.provider ?? null
    },

    async getChatProvider({ platformId, scope }: { platformId: PlatformId, scope: ProviderScope }): Promise<GetProviderConfigResponse | null> {
        const chatProvider = await findAvailableChatProviderRow({ platformId, scope, log })
        if (isNil(chatProvider)) {
            return null
        }
        const auth = await decryptRowAuth({ aiProvider: chatProvider, platformId })
        return { provider: chatProvider.provider, configId: chatProvider.id, auth, config: chatProvider.config, platformId }
    },

    async keyServesScope({ platformId, provider, configId, resolvedFor, target }: { platformId: PlatformId, provider?: AIProviderName, configId?: string, resolvedFor: ProviderScope, target: ProviderScope }): Promise<boolean> {
        const candidates = await findRunKeyCandidates({ platformId, provider, configId, scope: resolvedFor, log })
        return candidates.every((row) => target.type === 'platform'
            ? row.projectScope === 'all'
            : rowAllowsScope({ row, scope: target }))
    },

    async exists({ platformId, provider, scope, configId }: { platformId: PlatformId, provider: AIProviderName, scope: ProviderScope, configId?: string }): Promise<boolean> {
        const rows = await aiProviderRepo().findBy({ platformId, provider })
        return rows.some((row) => rowAllowsScope({ row, scope }) && (isNil(configId) || row.id === configId))
    },

    async delete(platformId: PlatformId, providerId: string): Promise<void> {
        await aiProviderRepo().delete({
            platformId,
            id: providerId,
        })
    },
    async recordKeyObservation({ platformId, providerId, signal }: { platformId: PlatformId, providerId: string, signal: ProviderOutcomeSignal }): Promise<void> {
        const status = classifyProviderOutcome(signal)
        if (status === 'no_change') {
            return
        }
        const aiProvider = await aiProviderRepo().findOneBy({ id: providerId, platformId })
        if (isNil(aiProvider)) {
            return
        }
        const demotesHealthyKey = status !== 'active' && aiProvider.status === 'active'
        if (!demotesHealthyKey || aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            await aiProviderHealth(log).record({ platformId, providerId, signal })
            return
        }
        await distributedStore.runOnceWithin(
            getAiProviderConfirmKey(providerId),
            CONFIRM_MIN_INTERVAL_SECONDS,
            () => this.recheck({ platformId, providerId, expectVersion: aiProvider.statusVersion }),
        )
    },

    async recheck({ platformId, providerId, expectVersion }: { platformId: PlatformId, providerId: string, expectVersion?: number }): Promise<AiProviderKeyStatus> {
        const aiProvider = await getRowByIdOrThrow({ platformId, configId: providerId })
        if (aiProvider.provider === AIProviderName.ACTIVEPIECES) {
            return aiProvider.status
        }
        const auth = await decryptRowAuth({ aiProvider, platformId })
        const { error } = await tryCatch(() => aiProviders[aiProvider.provider].validateConnection(auth, aiProvider.config, log))
        const signal = isNil(error) ? { statusCode: 200 } : toProviderOutcomeSignal(error)
        const recorded = await aiProviderHealth(log).record({ platformId, providerId, signal, throttled: false, ...spreadIfNotUndefined('expectVersion', expectVersion) })
        return recorded ?? aiProvider.status
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
    async getConfigOrThrow({ platformId, provider, scope, configId }: { platformId: PlatformId, provider: AIProviderName, scope: ProviderScope, configId?: string }): Promise<GetProviderConfigResponse> {
        const aiProvider = await resolveRowForScope({ platformId, provider, scope, configId })
        const auth = await decryptRowAuth({ aiProvider, platformId })
        return { provider: aiProvider.provider, configId: aiProvider.id, auth, config: aiProvider.config, platformId }
    },
    async getOrCreateActivePiecesProviderAuthConfig(platformId: PlatformId): Promise<ActivePiecesProviderAuthConfig> {
        await ensureManagedProviderRow({ platformId })
        const { auth } = await this.getConfigOrThrow({ platformId, provider: AIProviderName.ACTIVEPIECES, scope: { type: 'platform' } })
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

function rowAllowsScope({ row, scope }: { row: AIProviderSchema, scope: ProviderScope }): boolean {
    if (scope.type === 'platform') {
        return true
    }
    switch (row.projectScope) {
        case 'selected':
            return row.projectIds.includes(scope.projectId)
        case 'except':
            return !row.projectIds.includes(scope.projectId)
        default:
            return true
    }
}

function rankRows(rows: AIProviderSchema[]): AIProviderSchema[] {
    return [...rows].sort((a, b) => {
        const specificityDelta = PROJECT_SCOPE_SPECIFICITY[a.projectScope] - PROJECT_SCOPE_SPECIFICITY[b.projectScope]
        if (specificityDelta !== 0) {
            return specificityDelta
        }
        return new Date(b.created).getTime() - new Date(a.created).getTime()
    })
}

function provedHealthy(): { status: AiProviderKeyStatus, statusReason: null, statusUpdated: () => string, statusVersion: () => string } {
    return { status: 'active', statusReason: null, statusUpdated: () => 'now()', statusVersion: () => '"statusVersion" + 1' }
}

function toConfigResponse(row: AIProviderSchema): AIProviderWithoutSensitiveData {
    return {
        id: row.id,
        name: row.displayName,
        provider: row.provider,
        config: row.config,
        enabledForChat: row.enabledForChat ?? false,
        modelScope: row.modelScope,
        modelIds: row.modelIds,
        projectScope: row.projectScope,
        projectIds: row.projectIds,
        status: row.status,
        statusReason: row.statusReason,
        statusUpdated: row.statusUpdated,
    }
}

async function ensureManagedProviderRow({ platformId }: { platformId: PlatformId }): Promise<void> {
    const exists = await aiProviderRepo().existsBy({ platformId, provider: AIProviderName.ACTIVEPIECES })
    if (exists) {
        return
    }
    const hasChatProvider = await aiProviderRepo().existsBy({ platformId, enabledForChat: true })
    // Two concurrent readers both miss the existsBy above, so the row is inserted with
    // ON CONFLICT DO NOTHING and idx_ai_provider_platform_id_managed - a partial unique
    // index on (platformId) WHERE provider = 'activepieces' - decides which one lands.
    await aiProviderRepo().createQueryBuilder()
        .insert()
        .values({
            id: apId(),
            auth: await encryptUtils.encryptObject({}),
            config: {},
            provider: AIProviderName.ACTIVEPIECES,
            displayName: 'Activepieces',
            platformId,
            enabledForChat: !hasChatProvider,
            modelScope: 'all',
            modelIds: [],
            projectScope: 'all',
            projectIds: [],
        })
        .orIgnore()
        .execute()
}

async function listVisibleRows({ platformId, log }: { platformId: PlatformId, log: FastifyBaseLogger }): Promise<AIProviderSchema[]> {
    if (flagService(log).aiCreditsEnabled()) {
        await ensureManagedProviderRow({ platformId })
    }
    const rows = await aiProviderRepo().findBy({ platformId })
    const hasActivepiecesRow = rows.some((row) => row.provider === AIProviderName.ACTIVEPIECES)
    const hideActivepieces = hasActivepiecesRow && await isActivepiecesAiProviderHidden({ platformId, log })
    return rows.filter((row) => !(hideActivepieces && row.provider === AIProviderName.ACTIVEPIECES))
}

async function findRunKeyCandidates({ platformId, provider, configId, scope, log }: { platformId: PlatformId, provider?: AIProviderName, configId?: string, scope: ProviderScope, log: FastifyBaseLogger }): Promise<AIProviderSchema[]> {
    if (!isNil(configId)) {
        const pinnedRow = await aiProviderRepo().findOneBy({ id: configId, platformId })
        return isNil(pinnedRow) ? [] : [pinnedRow]
    }
    const chatRow = await findAvailableChatProviderRow({ platformId, scope, log })
    const namedRow = isNil(provider) ? null : await findEligibleRow({ platformId, provider, scope })
    return [chatRow, namedRow].reduce<AIProviderSchema[]>((acc, row) => (
        isNil(row) || acc.some((seen) => seen.id === row.id) ? acc : [...acc, row]
    ), [])
}

async function findEligibleRow({ platformId, provider, scope }: { platformId: PlatformId, provider: AIProviderName, scope: ProviderScope }): Promise<AIProviderSchema | null> {
    const rows = await aiProviderRepo().findBy({ platformId, provider })
    const eligible = rows.filter((row) => rowAllowsScope({ row, scope }))
    return rankRows(eligible)[0] ?? null
}

async function resolveEligibleRow({ platformId, provider, scope }: { platformId: PlatformId, provider: AIProviderName, scope: ProviderScope }): Promise<AIProviderSchema> {
    const winner = await findEligibleRow({ platformId, provider, scope })
    if (isNil(winner)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: provider,
                entityType: AI_PROVIDER_ENTITY_TYPES.provider,
            },
        }, scope.type === 'platform'
            ? `the ${provider} AI provider is not configured on this platform`
            : `no ${provider} AI provider key is available to this project`)
    }
    return winner
}

async function resolveRowForScope({ platformId, provider, scope, configId }: { platformId: PlatformId, provider: AIProviderName, scope: ProviderScope, configId?: string }): Promise<AIProviderSchema> {
    if (isNil(configId)) {
        return resolveEligibleRow({ platformId, provider, scope })
    }
    const rows = await aiProviderRepo().findBy({ platformId, provider })
    const row = rows.find((candidate) => candidate.id === configId && rowAllowsScope({ row: candidate, scope }))
    if (isNil(row)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: configId,
                entityType: AI_PROVIDER_ENTITY_TYPES.provider,
            },
        }, scope.type === 'platform'
            ? `the ${provider} AI provider key is not configured on this platform`
            : `the ${provider} AI provider key is not available to this project`)
    }
    return row
}

async function assertDisplayNameIsFree({ platformId, provider, displayName, exceptId }: { platformId: PlatformId, provider: AIProviderName, displayName: string, exceptId?: string }): Promise<void> {
    if (provider === AIProviderName.ACTIVEPIECES) {
        return
    }
    const rows = await aiProviderRepo().findBy({ platformId, provider })
    const taken = rows.some((row) => row.id !== exceptId && row.displayName.trim().toLowerCase() === displayName.trim().toLowerCase())
    if (taken) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Another key of this provider already uses this name' },
        })
    }
}

async function getRowByIdOrThrow({ platformId, configId }: { platformId: PlatformId, configId: string }): Promise<AIProviderSchema> {
    const aiProvider = await aiProviderRepo().findOneBy({ id: configId, platformId })
    if (isNil(aiProvider)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: configId,
                entityType: AI_PROVIDER_ENTITY_TYPES.provider,
            },
        })
    }
    return aiProvider
}

async function fetchModels({ aiProvider, platformId, log }: { aiProvider: AIProviderSchema, platformId: PlatformId, log: FastifyBaseLogger }): Promise<AIProviderModel[]> {
    const { provider, config } = aiProvider
    const auth = await decryptRowAuth({ aiProvider, platformId })
    const cacheKey = getModelsCacheKey({ provider, auth, config })
    if (!modelsCache.has(cacheKey) || 'models' in config) {
        const { data, error } = await tryCatch(() => aiProviders[provider].listModels(auth, config))
        if (!isNil(error) || isNil(data)) {
            await aiProviderService(log).recordKeyObservation({ platformId, providerId: aiProvider.id, signal: toProviderOutcomeSignal(error) })
            throw error
        }
        const catalog = await modelCatalog.load()
        modelsCache.set(cacheKey, data.map(model => ({
            id: model.id,
            name: model.name,
            type: model.type,
            ...spreadIfDefined('metadata', catalog.lookup({ provider, modelId: model.id })),
        })))
    }
    return modelsCache.get(cacheKey)!
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

async function findAvailableChatProviderRow({ platformId, scope, log }: { platformId: PlatformId, scope: ProviderScope, log: FastifyBaseLogger }): Promise<AIProviderSchema | null> {
    const allChatProviders = await aiProviderRepo().findBy({ platformId, enabledForChat: true })
    const chatProviders = allChatProviders.filter((row) => rowAllowsScope({ row, scope }))
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
    return { provider: savedAiProvider.provider, configId: savedAiProvider.id, auth: rawAuth, config: savedAiProvider.config, platformId }
}


function getModelsCacheKey({ provider, auth, config }: { provider: AIProviderName, auth: AIProviderAuthConfig, config: AIProviderConfig }): string {
    return `${provider}-${JSON.stringify(auth)}-${JSON.stringify(config)}`
}

export type ProviderScope =
    | { type: 'project', projectId: string }
    | { type: 'platform' }
