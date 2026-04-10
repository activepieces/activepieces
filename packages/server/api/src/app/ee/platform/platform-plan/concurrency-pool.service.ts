import { apId, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../../core/db/repo-factory'
import { getConcurrencyPoolLimitKey, getProjectConcurrencyPoolKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { projectRepo } from '../../../project/project-repo'
import { ConcurrencyPoolEntity } from './concurrency-pool.entity'

const concurrencyPoolRepo = repoFactory(ConcurrencyPoolEntity)

export const concurrencyPoolService = (_log: FastifyBaseLogger) => ({

    async upsertPool({ platformId, projectIds, maxConcurrentJobs }: UpsertPoolParams): Promise<{ poolId: string }> {
        const existingProjects = await projectRepo().find({
            where: { id: In(projectIds), platformId },
            select: { id: true, poolId: true },
        })
        const oldPoolIds = [...new Set(existingProjects.map(p => p.poolId).filter((id): id is string => !isNil(id)))]

        const poolId = apId()
        await concurrencyPoolRepo().save({ id: poolId, platformId, maxConcurrentJobs })
        await projectRepo().update({ id: In(projectIds), platformId }, { poolId })

        await distributedStore.delete([
            ...projectIds.map(id => getProjectConcurrencyPoolKey(id)),
            ...oldPoolIds.map(id => getConcurrencyPoolLimitKey(id)),
        ])

        await distributedStore.putMany([
            ...projectIds.map(id => ({ key: getProjectConcurrencyPoolKey(id), value: poolId })),
            { key: getConcurrencyPoolLimitKey(poolId), value: maxConcurrentJobs },
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
        const poolId = apId()
        await concurrencyPoolRepo().save({ id: poolId, platformId, maxConcurrentJobs })
        await projectRepo().update({ id: projectId }, { poolId })
        await distributedStore.put(getConcurrencyPoolLimitKey(poolId), maxConcurrentJobs)
        await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId)
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

type UpsertPoolParams = { platformId: string, projectIds: string[], maxConcurrentJobs: number }
type SetProjectLimitParams = { projectId: string, platformId: string, maxConcurrentJobs: number }
