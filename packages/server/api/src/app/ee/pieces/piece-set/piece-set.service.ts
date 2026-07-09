import { ActivepiecesError, apId, ErrorCode, isNil, kebabCase, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { CreatePieceSetRequestBody, PieceSet, PieceSetConfig, UpdatePieceSetRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In, QueryFailedError } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { distributedLock } from '../../../database/redis-connections'
import { pieceSetConfig } from './piece-set-config'
import { PieceSetEntity } from './piece-set.entity'

export const pieceSetRepo = repoFactory<PieceSet>(PieceSetEntity)

const MAX_PIECE_SET_PAGE_SIZE = 100

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
    key?: string | null
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
    pieceSet: PieceSet
    projectId: string
    entityManager?: EntityManager
}

type AssignProjectsParams = {
    pieceSetId: string
    platformId: string
    projectIds: string[]
    entityManager?: EntityManager
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

                await pieceSetRepo().save(pieceSetConfig.buildDefaultSet(platformId))
                return pieceSetRepo().findOneByOrFail({ platformId, isDefault: true })
            },
        })
    },

    async list({ platformId, cursor, limit = 10 }: ListParams): Promise<SeekPage<PieceSet>> {
        const boundedLimit = Math.min(limit, MAX_PIECE_SET_PAGE_SIZE)
        const qb = pieceSetRepo()
            .createQueryBuilder('ps')
            .where('ps.platformId = :platformId', { platformId })
            .orderBy('ps.created', 'ASC')
            .addOrderBy('ps.id', 'ASC')
            .take(boundedLimit + 1)

        if (cursor) {
            qb.andWhere(
                '(ps.created, ps.id) > (SELECT created, id FROM piece_set WHERE id = :cursorId AND "platformId" = :platformId)',
                { cursorId: cursor, platformId },
            )
        }

        const rows = await qb.getMany()
        const hasMore = rows.length > boundedLimit
        const data = hasMore ? rows.slice(0, boundedLimit) : rows

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

    async create({ platformId, name, key, isDefault = false, generatedForProjectId = null, config }: CreateParams): Promise<PieceSet> {
        const id = apId()
        try {
            await pieceSetRepo().save({
                id,
                platformId,
                name,
                key: resolveKey({ key, name }),
                isDefault,
                generatedForProjectId,
                config: config ?? pieceSetConfig.emptyConfig(),
            })
        }
        catch (error) {
            rethrowKeyConflict(error)
        }
        return pieceSetRepo().findOneByOrFail({ id })
    },

    async update({ id, platformId, request }: UpdateParams): Promise<PieceSet> {
        const existing = await this.getOne({ id, platformId })

        const updatedConfig = pieceSetConfig.applyUpdate({ current: existing.config, request })

        try {
            await pieceSetRepo().update({ id, platformId }, {
                ...spreadIfDefined('name', request.name),
                ...(request.key !== undefined ? { key: resolveKey({ key: request.key, name: request.name ?? existing.name }) } : {}),
                config: updatedConfig,
            })
        }
        catch (error) {
            rethrowKeyConflict(error)
        }

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
                .andWhere('"platformId" = :platformId', { platformId })
                .execute()

            await em.delete(PieceSetEntity, { id, platformId })
        })
    },

    async duplicate({ id, platformId, name }: GetOneParams & { name: string }): Promise<PieceSet> {
        const original = await this.getOne({ id, platformId })
        return this.create({
            platformId,
            name,
            key: undefined,
            isDefault: false,
            generatedForProjectId: null,
            config: original.config,
        })
    },

    // Takes the fetched set (not an id) so hot paths like managed-authn skip a redundant validation query
    async assignProject({ pieceSet, projectId, entityManager }: AssignProjectParams): Promise<void> {
        const repo = entityManager
            ? entityManager.getRepository('project')
            : pieceSetRepo().manager.getRepository('project')

        await repo.update({ id: projectId, platformId: pieceSet.platformId }, { pieceSetId: pieceSet.id })
    },

    async assignProjects({ pieceSetId, platformId, projectIds, entityManager }: AssignProjectsParams): Promise<void> {
        if (projectIds.length === 0) return

        await this.getOne({ id: pieceSetId, platformId })

        const repo = entityManager
            ? entityManager.getRepository('project')
            : pieceSetRepo().manager.getRepository('project')

        await repo.update({ id: In(projectIds), platformId }, { pieceSetId })
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
})

function resolveKey({ key, name }: { key?: string | null, name: string }): string {
    if (!isNil(key) && key.trim().length > 0) {
        return key
    }
    return `${kebabCase(name)}-${apId().slice(0, 8)}`
}

function rethrowKeyConflict(error: unknown): never {
    const driverError: unknown = error instanceof QueryFailedError ? error.driverError : undefined
    if (typeof driverError === 'object' && driverError !== null && 'code' in driverError && driverError.code === '23505') {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Piece set key already used' },
        })
    }
    throw error
}
