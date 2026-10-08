import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, spreadIfDefined, spreadIfNotUndefined, tryCatch, unique } from '@activepieces/core-utils'
import { AiProviderModelScope, CreatePlatformModelTierRequest, PlatformModelTier, PlatformModelTierEntry, PlatformModelTierSummary, UpdatePlatformModelTierRequest } from '@activepieces/shared'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { isUniqueViolation } from '../core/db/unique-violation'
import { aiKeyScope, ProviderScope } from './ai-key-scope'
import { AIProviderEntity, AIProviderSchema } from './ai-provider-entity'
import { PlatformModelTierEntity, PlatformModelTierSchema } from './platform-model-tier-entity'

const tierRepo = repoFactory<PlatformModelTierSchema>(PlatformModelTierEntity)
const aiProviderRepo = repoFactory<AIProviderSchema>(AIProviderEntity)

const MAX_LIVE_TIERS = 50
const MAX_REPLACEMENT_HOPS = 3
const TIER_REMOVED_MESSAGE = 'This tier was removed. Pick a new model for this step.'
const TIER_NOT_AVAILABLE_MESSAGE = 'This tier isn\'t available in this project. Pick another model.'
const PLATFORM_SCOPE: ProviderScope = { type: 'platform' }

export const platformModelTierService = {
    async listSummaries({ platformId, scope }: { platformId: PlatformId, scope: ProviderScope }): Promise<PlatformModelTierSummary[]> {
        const tiers = await listLive({ platformId })
        const mainConfigIds = unique(tiers.flatMap((tier) => tier.entries.slice(0, 1).map((entry) => entry.configId)))
        const keys = mainConfigIds.length === 0 ? [] : await aiProviderRepo().findBy({ platformId, id: In(mainConfigIds) })
        const keyById = new Map(keys.map((key) => [key.id, key]))
        const providerByConfigId = new Map(keys.map((key) => [key.id, key.provider]))
        return tiers
            .filter((tier) => mainRunsIn({ tier, keyById, scope }))
            .map((tier) => toSummary({ tier, providerByConfigId }))
    },

    async list({ platformId }: { platformId: PlatformId }): Promise<PlatformModelTier[]> {
        return listLive({ platformId })
    },

    async create({ platformId, request }: { platformId: PlatformId, request: CreatePlatformModelTierRequest }): Promise<PlatformModelTier> {
        return withNameConflictAsValidation(() => transaction(async (manager) => {
            await lockPlatform({ manager, platformId })
            await assertEntriesValid({ manager, platformId, entries: request.entries })
            const live = await listLive({ platformId, manager })
            if (live.length >= MAX_LIVE_TIERS) {
                throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `A platform can have at most ${MAX_LIVE_TIERS} tiers` } })
            }
            assertNameIsFree({ live, name: request.name })
            const isFirstTier = live.length === 0
            const position = live.reduce((max, tier) => Math.max(max, tier.position + 1), 0)
            return tierRepo(manager).save({
                id: apId(),
                platformId,
                name: request.name,
                emoji: request.emoji,
                description: request.description ?? null,
                position,
                entries: request.entries,
                thinkingBudget: request.thinkingBudget ?? null,
                isDefault: isFirstTier,
                isFast: isFirstTier,
                deleted: null,
                replacedBy: null,
            })
        }))
    },

    async update({ platformId, id, request }: { platformId: PlatformId, id: string, request: UpdatePlatformModelTierRequest }): Promise<PlatformModelTier> {
        return withNameConflictAsValidation(() => transaction(async (manager) => {
            await lockPlatform({ manager, platformId })
            const tier = await getLiveOrThrow({ manager, platformId, id })
            if (!isNil(request.name)) {
                assertNameIsFree({ live: await listLive({ platformId, manager }), name: request.name, exceptId: id })
            }
            if (!isNil(request.entries)) {
                await assertEntriesValid({ manager, platformId, entries: request.entries })
            }
            if (request.isDefault === true && !tier.isDefault) {
                await tierRepo(manager).update({ platformId, isDefault: true }, { isDefault: false })
            }
            if (request.isFast === true && !tier.isFast) {
                await tierRepo(manager).update({ platformId, isFast: true }, { isFast: false })
            }
            await tierRepo(manager).update({ platformId, id }, {
                ...spreadIfDefined('name', request.name),
                ...spreadIfDefined('emoji', request.emoji),
                ...spreadIfNotUndefined('description', request.description),
                ...spreadIfDefined('entries', request.entries),
                ...spreadIfNotUndefined('thinkingBudget', request.thinkingBudget),
                ...spreadIfDefined('isDefault', request.isDefault),
                ...spreadIfDefined('isFast', request.isFast),
            })
            return getLiveOrThrow({ manager, platformId, id })
        }))
    },

    async reorder({ platformId, tierIds }: { platformId: PlatformId, tierIds: string[] }): Promise<PlatformModelTier[]> {
        return transaction(async (manager) => {
            await lockPlatform({ manager, platformId })
            const live = await listLive({ platformId, manager })
            const liveIds = new Set(live.map((tier) => tier.id))
            const sameSet = tierIds.length === liveIds.size && new Set(tierIds).size === tierIds.length && tierIds.every((id) => liveIds.has(id))
            if (!sameSet) {
                throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'Reorder must list every tier exactly once' } })
            }
            await manager.query(
                `
                UPDATE "platform_model_tier" AS t
                SET "position" = ordering.ord - 1
                FROM unnest($1::text[]) WITH ORDINALITY AS ordering(id, ord)
                WHERE t."id" = ordering.id
                  AND t."platformId" = $2
                  AND t."deleted" IS NULL
                  AND t."position" IS DISTINCT FROM ordering.ord - 1
                `,
                [tierIds, platformId],
            )
            return listLive({ platformId, manager })
        })
    },

    async delete({ platformId, id, replacedBy }: { platformId: PlatformId, id: string, replacedBy: string | undefined }): Promise<void> {
        if (replacedBy === id) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'A tier cannot replace itself' } })
        }
        await transaction(async (manager) => {
            await lockPlatform({ manager, platformId })
            const tier = await getLiveOrThrow({ manager, platformId, id })
            if (isNil(replacedBy)) {
                await assertLastTierCanGo({ manager, platformId })
                await tierRepo(manager).update({ platformId, id }, { isDefault: false, isFast: false })
                await tierRepo(manager).softDelete({ platformId, id })
                return
            }
            await getLiveOrThrow({ manager, platformId, id: replacedBy })
            await manager.query(
                'UPDATE "platform_model_tier" SET "replacedBy" = $1 WHERE "platformId" = $2 AND ("id" = $3 OR "replacedBy" = $3)',
                [replacedBy, platformId, id],
            )
            await tierRepo(manager).update({ platformId, id }, { isDefault: false, isFast: false })
            await tierRepo(manager).softDelete({ platformId, id })
            if (tier.isDefault || tier.isFast) {
                await tierRepo(manager).update({ platformId, id: replacedBy }, {
                    ...(tier.isDefault ? { isDefault: true } : {}),
                    ...(tier.isFast ? { isFast: true } : {}),
                })
            }
        })
    },

    async assertKeyCanBeDeleted({ manager, platformId, configId }: { manager: EntityManager, platformId: PlatformId, configId: string }): Promise<void> {
        await lockPlatform({ manager, platformId })
        const tiers = await findLiveTiersUsingKey({ manager, platformId, configId })
        if (tiers.length > 0) {
            throw keyInUseError({ tierNames: tiers.map((tier) => tier.name) })
        }
    },

    async getFastForRun({ platformId, scope }: { platformId: PlatformId, scope: ProviderScope }): Promise<TierForRun | null> {
        const fastTier = await tierRepo().findOneBy({ platformId, isFast: true })
        if (isNil(fastTier)) {
            return null
        }
        const { data } = await tryCatch(() => platformModelTierService.getForRun({ platformId, id: fastTier.id, scope }))
        return data ?? null
    },

    async getForRun({ platformId, id, scope }: { platformId: PlatformId, id: string, scope: ProviderScope }): Promise<TierForRun> {
        const tier = await followReplacements({ platformId, id })
        const configIds = unique(tier.entries.map((entry) => entry.configId))
        const keys = await aiProviderRepo().findBy({ platformId, id: In(configIds) })
        const keyById = new Map(keys.map((key) => [key.id, key]))
        if (!mainRunsIn({ tier, keyById, scope })) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: TIER_NOT_AVAILABLE_MESSAGE } })
        }
        const entries = runnableEntries({ tier, keyById, scope })
        if (entries.length === 0) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `No model in tier "${tier.name}" can run` } })
        }
        return { tier, entries }
    },

    async getManyForRun({ platformId, ids }: { platformId: PlatformId, ids: string[] }): Promise<Map<string, TierForRun | null>> {
        const liveByRequestedId = await followReplacementsInBulk({ platformId, ids: unique(ids) })
        const liveTiers = unique([...liveByRequestedId.values()].filter((tier): tier is PlatformModelTier => !isNil(tier)))
        const configIds = unique(liveTiers.flatMap((tier) => tier.entries.map((entry) => entry.configId)))
        const keys = configIds.length === 0 ? [] : await aiProviderRepo().findBy({ platformId, id: In(configIds) })
        const keyById = new Map(keys.map((key) => [key.id, key]))
        return new Map([...liveByRequestedId].map(([requestedId, tier]) => {
            const entries = isNil(tier) ? [] : runnableEntries({ tier, keyById, scope: PLATFORM_SCOPE })
            return [requestedId, isNil(tier) || entries.length === 0 ? null : { tier, entries }]
        }))
    },

    async lockPlatform({ manager, platformId }: { manager: EntityManager, platformId: PlatformId }): Promise<void> {
        await lockPlatform({ manager, platformId })
    },

    async assertKeyScopeKeepsTiers({ manager, platformId, configId, modelScope, modelIds, config }: AssertKeyScopeParams): Promise<void> {
        await lockPlatform({ manager, platformId })
        const key = await aiProviderRepo(manager).findOneBy({ platformId, id: configId })
        if (isNil(key)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: configId, entityType: 'ai_provider' } })
        }
        const nextScope = { modelScope: modelScope ?? key.modelScope, modelIds: modelIds ?? key.modelIds }
        const tiers = await findLiveTiersUsingKey({ manager, platformId, configId })
        const keyKeeps = (modelId: string): boolean => aiKeyScope.keyOffersModel({ key: { ...nextScope, config }, modelId })
        const broken = tiers.filter((tier) => tier.entries.some((entry) => entry.configId === configId && !keyKeeps(entry.modelId)))
        if (broken.length > 0) {
            throw keyInUseError({ tierNames: broken.map((tier) => tier.name) })
        }
    },
}

async function lockPlatform({ manager, platformId }: { manager: EntityManager, platformId: PlatformId }): Promise<void> {
    const rows: unknown[] = await manager.query(
        'SELECT 1 FROM "platform" WHERE "id" = $1 FOR NO KEY UPDATE',
        [platformId],
    )
    if (rows.length === 0) {
        throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: platformId, entityType: 'platform' } })
    }
}

function mainRunsIn({ tier, keyById, scope }: { tier: PlatformModelTier, keyById: Map<string, AIProviderSchema>, scope: ProviderScope }): boolean {
    const main = tier.entries[0]
    return !isNil(main) && entryRunsIn({ entry: main, key: keyById.get(main.configId), scope })
}

function entryRunsIn({ entry, key, scope }: { entry: PlatformModelTierEntry, key: AIProviderSchema | undefined, scope: ProviderScope }): boolean {
    return !isNil(key)
        && key.provider !== AIProviderName.ACTIVEPIECES
        && aiKeyScope.scopeAllows({ modelScope: key.modelScope, modelIds: key.modelIds, modelId: entry.modelId })
        && aiKeyScope.rowAllowsScope({ row: key, scope })
}

function runnableEntries({ tier, keyById, scope }: { tier: PlatformModelTier, keyById: Map<string, AIProviderSchema>, scope: ProviderScope }): TierForRun['entries'] {
    const runnable = tier.entries.flatMap((entry) => {
        const key = keyById.get(entry.configId)
        return isNil(key) || !entryRunsIn({ entry, key, scope }) ? [] : [{ modelId: entry.modelId, key }]
    })
    return [
        ...runnable.filter((entry) => entry.key.status === 'active'),
        ...runnable.filter((entry) => entry.key.status !== 'active'),
    ]
}

async function followReplacementsInBulk({ platformId, ids }: { platformId: PlatformId, ids: string[] }): Promise<Map<string, PlatformModelTier | null>> {
    const loaded = new Map<string, PlatformModelTier>()
    let missing = ids
    for (let hop = 0; hop <= MAX_REPLACEMENT_HOPS && missing.length > 0; hop++) {
        const tiers = await tierRepo().find({ where: { platformId, id: In(missing) }, withDeleted: true })
        tiers.forEach((tier) => loaded.set(tier.id, tier))
        missing = unique(tiers.flatMap((tier) => isNil(tier.deleted) || isNil(tier.replacedBy) || loaded.has(tier.replacedBy) ? [] : [tier.replacedBy]))
    }
    const liveFor = (id: string): PlatformModelTier | null => {
        let current = loaded.get(id)
        for (let hop = 0; hop <= MAX_REPLACEMENT_HOPS && !isNil(current); hop++) {
            if (isNil(current.deleted)) {
                return current
            }
            current = isNil(current.replacedBy) ? undefined : loaded.get(current.replacedBy)
        }
        return null
    }
    return new Map(ids.map((id) => [id, liveFor(id)]))
}

async function followReplacements({ platformId, id }: { platformId: PlatformId, id: string }): Promise<PlatformModelTier> {
    let currentId = id
    for (let hop = 0; hop <= MAX_REPLACEMENT_HOPS; hop++) {
        const tier = await tierRepo().findOne({ where: { platformId, id: currentId }, withDeleted: true })
        if (isNil(tier)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: currentId, entityType: 'platform_model_tier' } })
        }
        if (isNil(tier.deleted)) {
            return tier
        }
        if (isNil(tier.replacedBy)) {
            break
        }
        currentId = tier.replacedBy
    }
    throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: TIER_REMOVED_MESSAGE } })
}

async function listLive({ platformId, manager }: { platformId: PlatformId, manager?: EntityManager }): Promise<PlatformModelTier[]> {
    return tierRepo(manager).find({ where: { platformId }, order: { position: 'ASC', created: 'ASC' }, take: MAX_LIVE_TIERS })
}

async function getLiveOrThrow({ platformId, id, manager }: { platformId: PlatformId, id: string, manager?: EntityManager }): Promise<PlatformModelTier> {
    const tier = await tierRepo(manager).findOneBy({ platformId, id })
    if (isNil(tier)) {
        throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: id, entityType: 'platform_model_tier' } })
    }
    return tier
}

async function assertLastTierCanGo({ manager, platformId }: { manager: EntityManager, platformId: PlatformId }): Promise<void> {
    const live = await listLive({ platformId, manager })
    if (live.length > 1) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'Pick a tier to move this tier\'s users to' } })
    }
}

function assertNameIsFree({ live, name, exceptId }: { live: PlatformModelTier[], name: string, exceptId?: string }): void {
    const taken = live.some((tier) => tier.id !== exceptId && tier.name.toLowerCase() === name.toLowerCase())
    if (taken) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'A tier with this name already exists' } })
    }
}

async function assertEntriesValid({ manager, platformId, entries }: { manager: EntityManager, platformId: PlatformId, entries: PlatformModelTierEntry[] }): Promise<void> {
    const configIds = unique(entries.map((entry) => entry.configId))
    const keys = await aiProviderRepo(manager).findBy({ platformId, id: In(configIds) })
    const keyById = new Map(keys.map((key) => [key.id, key]))
    for (const entry of entries) {
        const key = keyById.get(entry.configId)
        if (isNil(key)) {
            throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: { entityId: entry.configId, entityType: 'ai_provider' } })
        }
        if (key.provider === AIProviderName.ACTIVEPIECES) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'Tiers cannot use the Activepieces credits key' } })
        }
        if (!aiKeyScope.scopeAllows({ modelScope: key.modelScope, modelIds: key.modelIds, modelId: entry.modelId })) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: `Key "${key.displayName}" does not allow model ${entry.modelId}` } })
        }
    }
}

async function findLiveTiersUsingKey({ manager, platformId, configId }: { manager: EntityManager, platformId: PlatformId, configId: string }): Promise<PlatformModelTier[]> {
    return tierRepo(manager).createQueryBuilder('tier')
        .where('tier."platformId" = :platformId', { platformId })
        .andWhere('tier."deleted" IS NULL')
        .andWhere('tier."entries" @> :needle::jsonb', { needle: JSON.stringify([{ configId }]) })
        .getMany()
}

async function withNameConflictAsValidation<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation()
    }
    catch (error) {
        if (isUniqueViolation(error)) {
            throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'A tier with this name already exists' } })
        }
        throw error
    }
}

function keyInUseError({ tierNames }: { tierNames: string[] }): ActivepiecesError {
    return new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: { message: `This key is used by tiers: ${tierNames.join(', ')}. Remove it from them first.` },
    })
}

function toSummary({ tier, providerByConfigId }: { tier: PlatformModelTier, providerByConfigId: Map<string, AIProviderName> }): PlatformModelTierSummary {
    const main = tier.entries[0]
    const provider = isNil(main) ? undefined : providerByConfigId.get(main.configId)
    return {
        id: tier.id,
        name: tier.name,
        emoji: tier.emoji,
        description: tier.description ?? null,
        position: tier.position,
        isDefault: tier.isDefault,
        isFast: tier.isFast,
        mainModel: isNil(main) || isNil(provider) ? null : { provider, modelId: main.modelId },
        fallbackCount: Math.max(tier.entries.length - 1, 0),
    }
}

export type TierForRun = {
    tier: PlatformModelTier
    entries: { modelId: string, key: AIProviderSchema }[]
}

type AssertKeyScopeParams = {
    manager: EntityManager
    platformId: PlatformId
    configId: string
    modelScope: AiProviderModelScope | undefined
    modelIds: string[] | undefined
    config: unknown
}
