import { apId, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { getConcurrencyPoolLimitKey, getProjectConcurrencyPoolKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { projectRepo } from '../../../project/project-repo'
import { ConcurrencyPoolEntity, ConcurrencyPoolEntitySchema } from './concurrency-pool.entity'

const concurrencyPoolRepo = repoFactory<ConcurrencyPoolEntitySchema>(ConcurrencyPoolEntity)

export const concurrencyPoolService = (_log: FastifyBaseLogger) => ({

    async createPool({ platformId, projectIds, maxConcurrentJobs }: CreatePoolParams): Promise<{ poolId: string }> {
        const poolId = apId()
        await transaction(async (entityManager) =>{
            await concurrencyPoolRepo(entityManager).save({ id: poolId, platformId, maxConcurrentJobs })
            await projectRepo(entityManager).update({ id: In(projectIds), platformId }, { poolId })
        })
        return { poolId }
    },

    async upsertPool({ platformId, projectIds, maxConcurrentJobs }: UpsertPoolParams): Promise<{ poolId: string }> {
        const existingProjects = await projectRepo().find({
            where: { id: In(projectIds), platformId },
            select: { id: true, poolId: true },
        })
        const oldPoolIds = [...new Set(existingProjects.map(p => p.poolId).filter((id): id is string => !isNil(id)))]

        const { poolId } = await concurrencyPoolService(_log).createPool({ platformId, projectIds, maxConcurrentJobs })

        await distributedStore.delete([
            ...projectIds.map(id => getProjectConcurrencyPoolKey(id)),
            ...oldPoolIds.map(id => getConcurrencyPoolLimitKey(id)),
        ])

        await Promise.all([
            ...projectIds.map(id => distributedStore.put(getProjectConcurrencyPoolKey(id), poolId)),
            distributedStore.put(getConcurrencyPoolLimitKey(poolId), maxConcurrentJobs),
        ])

        await concurrencyPoolRepo()
            .createQueryBuilder()
            .delete()
            .where('id NOT IN (SELECT "poolId" FROM project WHERE "poolId" IS NOT NULL)')
            .execute()

        return { poolId }
    },

    async setProjectConcurrencyLimit({ projectId, platformId, maxConcurrentJobs }: SetProjectLimitParams): Promise<void> {
        const project = await projectRepo().findOne({
            where: { id: projectId, platformId },
            select: { poolId: true },
        })
        const existingPoolId = project?.poolId ?? null

        if (!isNil(existingPoolId)) {
            const poolProjectCount = await projectRepo().count({ where: { platformId, poolId: existingPoolId } })
            if (poolProjectCount === 1) { // if this project is not a in a group pool we just update the max
                await concurrencyPoolRepo().update({ id: existingPoolId }, { maxConcurrentJobs })
                await distributedStore.put(getConcurrencyPoolLimitKey(existingPoolId), maxConcurrentJobs)
                return
            }
            await distributedStore.delete(getProjectConcurrencyPoolKey(projectId))
        }
        // no pool for the project or the project is in a pool with more than 1 project ( move it to his own pool )
        const { poolId } = await concurrencyPoolService(_log).createPool({ platformId, projectIds: [projectId], maxConcurrentJobs })
        await distributedStore.put(getConcurrencyPoolLimitKey(poolId), maxConcurrentJobs)
        await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
    },

    async clearProjectConcurrencyLimit({ projectId, platformId }: ClearProjectLimitParams): Promise<void> {
        const project = await projectRepo().findOne({
            where: { id: projectId, platformId },
            select: { poolId: true },
        })
        const existingPoolId = project?.poolId ?? null
        if (isNil(existingPoolId)) return

        await projectRepo().update({ id: projectId }, { poolId: null })
        await distributedStore.delete(getProjectConcurrencyPoolKey(projectId))

        const stillReferenced = await projectRepo().count({ where: { platformId, poolId: existingPoolId } })
        if (stillReferenced === 0) {
            await concurrencyPoolRepo().delete({ id: existingPoolId })
            await distributedStore.delete(getConcurrencyPoolLimitKey(existingPoolId))
        }
    },

    async getProjectPoolId(projectId: string): Promise<string | null> {
        const cached = await distributedStore.get<string>(getProjectConcurrencyPoolKey(projectId))
        if (!isNil(cached)) return cached

        const project = await projectRepo().findOne({
            where: { id: projectId },
            select: { poolId: true },
        })
        const poolId = project?.poolId ?? null
        if (!isNil(poolId)) {
            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
        }
        return poolId
    },

    async getPoolLimit(poolId: string): Promise<number | null> {
        const cached = await distributedStore.get<number>(getConcurrencyPoolLimitKey(poolId))
        if (!isNil(cached)) return cached

        const pool = await concurrencyPoolRepo().findOne({
            where: { id: poolId },
            select: { maxConcurrentJobs: true },
        })
        const limit = pool?.maxConcurrentJobs ?? null
        if (!isNil(limit)) {
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), limit)
        }
        return limit
    },
})

type CreatePoolParams = { platformId: string, projectIds: string[], maxConcurrentJobs: number }
type UpsertPoolParams = { platformId: string, projectIds: string[], maxConcurrentJobs: number }
type SetProjectLimitParams = { projectId: string, platformId: string, maxConcurrentJobs: number }
type ClearProjectLimitParams = { projectId: string, platformId: string }
