import { ActivepiecesError, apId, ErrorCode, isNil, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { CreatePieceSetRequestBody, PieceSet, PieceSetConfig, UpdatePieceSetRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { distributedLock } from '../../../database/redis-connections'
import { PieceSetEntity } from './piece-set.entity'

export const pieceSetRepo = repoFactory<PieceSet>(PieceSetEntity)

const NEW_PIECE_BATCH_SIZE = 200

type ListParams = {
    platformId: string
    cursor?: string
    limit?: number
}

type GetOneParams = {
    id: string
    platformId: string
}

type CreateParams = CreatePieceSetRequestBody & {
    platformId: string
    isDefault?: boolean
    generatedForProjectId?: string | null
    externalId?: string | null
    config?: PieceSetConfig
}

type UpdateParams = {
    id: string
    platformId: string
    request: UpdatePieceSetRequestBody
}

type DeleteParams = {
    id: string
    platformId: string
}

type AssignProjectParams = {
    pieceSetId: string
    platformId: string
    projectId: string
    entityManager?: EntityManager
}

type HandleNewPieceInstalledParams = {
    platformId: string | undefined
    pieceName: string
    isNewPiece: boolean
    newActionNames: string[]
    newTriggerNames: string[]
}

export const pieceSetService = (log: FastifyBaseLogger) => ({
    async getOrCreateDefaultPieceSet(platformId: string): Promise<PieceSet> {
        const existing = await pieceSetRepo().findOneBy({ platformId, isDefault: true })
        if (!isNil(existing)) return existing

        return distributedLock(log).runExclusive({
            key: `piece_set_default_${platformId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const existing = await pieceSetRepo().findOneBy({ platformId, isDefault: true })
                if (!isNil(existing)) return existing

                await pieceSetRepo().save(buildDefaultSet(platformId))
                return pieceSetRepo().findOneByOrFail({ platformId, isDefault: true })
            },
        })
    },

    async list({ platformId, cursor, limit = 10 }: ListParams): Promise<SeekPage<PieceSet>> {
        const qb = pieceSetRepo()
            .createQueryBuilder('ps')
            .where('ps.platformId = :platformId', { platformId })
            .orderBy('ps.created', 'ASC')
            .take(limit + 1)

        if (cursor) {
            qb.andWhere('ps.created > (SELECT created FROM piece_set WHERE id = :cursorId)', { cursorId: cursor })
        }

        const rows = await qb.getMany()
        const hasMore = rows.length > limit
        const data = hasMore ? rows.slice(0, limit) : rows

        return {
            data,
            next: hasMore ? data[data.length - 1].id : null,
            previous: cursor ? data[0]?.id ?? null : null,
        }
    },

    async getOne({ id, platformId }: GetOneParams): Promise<PieceSet> {
        const set = await pieceSetRepo().findOneBy({ id, platformId })
        if (isNil(set)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'PieceSet', entityId: id },
            })
        }
        return set
    },

    async create({ platformId, name, externalId, includeNewPieces = true, includeNewActions = true, isDefault = false, generatedForProjectId = null, config }: CreateParams): Promise<PieceSet> {
        const id = apId()
        await pieceSetRepo().save({
            id,
            platformId,
            name,
            externalId: externalId ?? null,
            isDefault,
            includeNewPieces,
            includeNewActions,
            generatedForProjectId,
            config: config ?? { disabledPieces: [], disabledActions: {}, disabledTriggers: {} },
        })
        return pieceSetRepo().findOneByOrFail({ id })
    },

    async update({ id, platformId, request }: UpdateParams): Promise<PieceSet> {
        const existing = await this.getOne({ id, platformId })

        const updatedConfig = applyPatchOps(existing.config, request)

        await pieceSetRepo().update({ id, platformId }, {
            ...spreadIfDefined('name', request.name),
            ...(request.externalId !== undefined ? { externalId: request.externalId } : {}),
            includeNewPieces: request.includeNewPieces ?? existing.includeNewPieces,
            includeNewActions: request.includeNewActions ?? existing.includeNewActions,
            config: updatedConfig,
        })

        return this.getOne({ id, platformId })
    },

    async delete({ id, platformId }: DeleteParams): Promise<void> {
        const set = await this.getOne({ id, platformId })

        if (set.isDefault) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Cannot delete the default piece set' },
            })
        }

        const defaultSet = await this.getOrCreateDefaultPieceSet(platformId)

        await transaction(async (em) => {
            await em
                .createQueryBuilder()
                .update('project')
                .set({ pieceSetId: defaultSet.id })
                .where('"pieceSetId" = :pieceSetId', { pieceSetId: id })
                .execute()

            await em.delete(PieceSetEntity, { id, platformId })
        })
    },

    async duplicate({ id, platformId, name }: GetOneParams & { name: string }): Promise<PieceSet> {
        const original = await this.getOne({ id, platformId })
        return this.create({
            platformId,
            name,
            externalId: undefined,
            includeNewPieces: original.includeNewPieces,
            includeNewActions: original.includeNewActions,
            isDefault: false,
            generatedForProjectId: null,
            config: original.config,
        })
    },

    async assignProject({ pieceSetId, platformId, projectId, entityManager }: AssignProjectParams): Promise<void> {
        await this.getOne({ id: pieceSetId, platformId })

        const repo = entityManager
            ? entityManager.getRepository('project')
            : pieceSetRepo().manager.getRepository('project')

        await repo.update({ id: projectId, platformId }, { pieceSetId })
    },

    async removeProjectAssignment({ pieceSetId, platformId, projectId }: { pieceSetId: string, platformId: string, projectId: string }): Promise<void> {
        const set = await this.getOne({ id: pieceSetId, platformId })
        if (set.isDefault) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Cannot remove project from the default piece set' },
            })
        }
        const defaultSet = await this.getOrCreateDefaultPieceSet(platformId)
        await pieceSetRepo().manager.getRepository('project').update(
            { id: projectId, platformId, pieceSetId },
            { pieceSetId: defaultSet.id },
        )
    },

    async handleNewPieceInstalled({ platformId, pieceName, isNewPiece, newActionNames, newTriggerNames }: HandleNewPieceInstalledParams): Promise<void> {
        const hasNewActionsOrTriggers = newActionNames.length > 0 || newTriggerNames.length > 0
        if (!isNewPiece && !hasNewActionsOrTriggers) return

        const orConditions: string[] = []
        if (isNewPiece) orConditions.push('ps.includeNewPieces = false')
        if (hasNewActionsOrTriggers) orConditions.push('ps.includeNewActions = false')

        let cursor: string | undefined
        for (;;) {
            const qb = pieceSetRepo()
                .createQueryBuilder('ps')
                .where(`(${orConditions.join(' OR ')})`)
                .orderBy('ps.id', 'ASC')
                .take(NEW_PIECE_BATCH_SIZE)

            if (!isNil(platformId)) qb.andWhere('ps.platformId = :platformId', { platformId })
            if (!isNil(cursor)) qb.andWhere('ps.id > :cursor', { cursor })

            const sets = await qb.getMany()
            if (sets.length === 0) break

            await Promise.all(sets.map(async (set) => {
                const updatedConfig = computeConfigForNewPiece({ set, pieceName, isNewPiece, newActionNames, newTriggerNames })
                if (isNil(updatedConfig)) return
                await pieceSetRepo().update({ id: set.id }, { config: updatedConfig })
            }))

            if (sets.length < NEW_PIECE_BATCH_SIZE) break
            cursor = sets[sets.length - 1].id
        }
    },
})

function computeConfigForNewPiece({ set, pieceName, isNewPiece, newActionNames, newTriggerNames }: { set: PieceSet, pieceName: string, isNewPiece: boolean, newActionNames: string[], newTriggerNames: string[] }): PieceSetConfig | null {
    const config = set.config
    let changed = false

    const disabledPieces = [...config.disabledPieces]
    const disabledActions = { ...config.disabledActions }
    const disabledTriggers = { ...config.disabledTriggers }

    if (isNewPiece && !set.includeNewPieces && !disabledPieces.includes(pieceName)) {
        disabledPieces.push(pieceName)
        changed = true
    }

    if (!set.includeNewActions) {
        if (newActionNames.length > 0) {
            const existing = disabledActions[pieceName] ?? []
            const toAdd = newActionNames.filter((a) => !existing.includes(a))
            if (toAdd.length > 0) {
                disabledActions[pieceName] = [...existing, ...toAdd]
                changed = true
            }
        }
        if (newTriggerNames.length > 0) {
            const existing = disabledTriggers[pieceName] ?? []
            const toAdd = newTriggerNames.filter((t) => !existing.includes(t))
            if (toAdd.length > 0) {
                disabledTriggers[pieceName] = [...existing, ...toAdd]
                changed = true
            }
        }
    }

    return changed ? { disabledPieces, disabledActions, disabledTriggers } : null
}

function buildDefaultSet(platformId: string) {
    return {
        id: apId(),
        platformId,
        name: 'Default',
        externalId: 'default',
        isDefault: true,
        includeNewPieces: true,
        includeNewActions: true,
        generatedForProjectId: null,
        config: {
            disabledPieces: [],
            disabledActions: {},
            disabledTriggers: {},
        },
    }
}

function applyPatchOps(current: PieceSetConfig, req: UpdatePieceSetRequestBody): PieceSetConfig {
    let disabledPieces = [...current.disabledPieces]

    for (const piece of req.enablePieces ?? []) {
        disabledPieces = disabledPieces.filter((p) => p !== piece)
    }
    for (const piece of req.disablePieces ?? []) {
        if (!disabledPieces.includes(piece)) disabledPieces.push(piece)
    }

    let disabledActions = { ...current.disabledActions }
    for (const [piece, actions] of Object.entries(req.enableActions ?? {})) {
        const remaining = (disabledActions[piece] ?? []).filter((a) => !actions.includes(a))
        disabledActions = remaining.length > 0
            ? { ...disabledActions, [piece]: remaining }
            : Object.fromEntries(Object.entries(disabledActions).filter(([k]) => k !== piece))
    }
    for (const [piece, actions] of Object.entries(req.disableActions ?? {})) {
        const existing = disabledActions[piece] ?? []
        const toAdd = actions.filter((a) => !existing.includes(a))
        if (toAdd.length > 0) disabledActions = { ...disabledActions, [piece]: [...existing, ...toAdd] }
    }

    let disabledTriggers = { ...current.disabledTriggers }
    for (const [piece, triggers] of Object.entries(req.enableTriggers ?? {})) {
        const remaining = (disabledTriggers[piece] ?? []).filter((t) => !triggers.includes(t))
        disabledTriggers = remaining.length > 0
            ? { ...disabledTriggers, [piece]: remaining }
            : Object.fromEntries(Object.entries(disabledTriggers).filter(([k]) => k !== piece))
    }
    for (const [piece, triggers] of Object.entries(req.disableTriggers ?? {})) {
        const existing = disabledTriggers[piece] ?? []
        const toAdd = triggers.filter((t) => !existing.includes(t))
        if (toAdd.length > 0) disabledTriggers = { ...disabledTriggers, [piece]: [...existing, ...toAdd] }
    }

    return { disabledPieces, disabledActions, disabledTriggers }
}
