import { ActivepiecesError, apId, ErrorCode, isNil, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { CreatePieceSetRequestBody, PieceSet, PieceSetConfig, UpdatePieceSetRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { distributedLock } from '../../../database/redis-connections'
import { pieceSetConfig } from './piece-set-config'
import { PieceSetEntity } from './piece-set.entity'

export const pieceSetRepo = repoFactory<PieceSet>(PieceSetEntity)

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
        const qb = pieceSetRepo()
            .createQueryBuilder('ps')
            .where('ps.platformId = :platformId', { platformId })
            .orderBy('ps.created', 'ASC')
            .addOrderBy('ps.id', 'ASC')
            .take(limit + 1)

        if (cursor) {
            qb.andWhere(
                '(ps.created, ps.id) > (SELECT created, id FROM piece_set WHERE id = :cursorId)',
                { cursorId: cursor },
            )
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

    async create({ platformId, name, externalId, isDefault = false, generatedForProjectId = null, config }: CreateParams): Promise<PieceSet> {
        const id = apId()
        await pieceSetRepo().save({
            id,
            platformId,
            name,
            externalId: externalId ?? null,
            isDefault,
            generatedForProjectId,
            config: config ?? pieceSetConfig.emptyConfig(),
        })
        return pieceSetRepo().findOneByOrFail({ id })
    },

    async update({ id, platformId, request }: UpdateParams): Promise<PieceSet> {
        const existing = await this.getOne({ id, platformId })

        const updatedConfig = pieceSetConfig.applyUpdate({ current: existing.config, request })

        await pieceSetRepo().update({ id, platformId }, {
            ...spreadIfDefined('name', request.name),
            ...(request.externalId !== undefined ? { externalId: request.externalId } : {}),
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
