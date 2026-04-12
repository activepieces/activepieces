import { apId, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { getConcurrencyPoolLimitKey, getProjectConcurrencyPoolKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { projectRepo } from '../../../project/project-repo'
import { ConcurrencyPoolEntity, ConcurrencyPoolEntitySchema } from './concurrency-pool.entity'

const concurrencyPoolRepo = repoFactory<ConcurrencyPoolEntitySchema>(ConcurrencyPoolEntity)
const CACHE_TTL_SECONDS = 86400 // 24 hours
const NO_POOL_SENTINEL = 'none'

export const concurrencyPoolService = (_log: FastifyBaseLogger) => ({

    async upsertPool({ platformId, key, maxConcurrentJobs }: UpsertPoolParams): Promise<{ poolId: string }> {
        const existing = await concurrencyPoolRepo().findOne({
            where: { platformId, key },
        })
        if (!isNil(existing)) {
            const updatedLimit = maxConcurrentJobs ?? existing.maxConcurrentJobs
            await concurrencyPoolRepo().update({ id: existing.id }, { maxConcurrentJobs: updatedLimit })
            if (!isNil(maxConcurrentJobs)) {
                await distributedStore.put(getConcurrencyPoolLimitKey(existing.id), maxConcurrentJobs, CACHE_TTL_SECONDS)
            }
            return { poolId: existing.id }
        }
        const poolId = apId()
        const { error } = await tryCatch(() => concurrencyPoolRepo().insert({
            id: poolId,
            platformId,
            key,
            maxConcurrentJobs: maxConcurrentJobs ?? 1,
        }))
        if (!isNil(error)) {
            // Unique constraint violation — another request created the pool concurrently
            const raceWinner = await concurrencyPoolRepo().findOneOrFail({ where: { platformId, key } })
            return { poolId: raceWinner.id }
        }
        if (!isNil(maxConcurrentJobs)) {
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), maxConcurrentJobs, CACHE_TTL_SECONDS)
        }
        return { poolId }
    },

    async getProjectPoolId(projectId: string): Promise<string | null> {
        const cached = await distributedStore.get<string>(getProjectConcurrencyPoolKey(projectId))
        if (!isNil(cached)) {
            return cached === NO_POOL_SENTINEL ? null : cached
        }

        const project = await projectRepo().findOne({
            where: { id: projectId },
            select: { poolId: true },
        })
        const poolId = project?.poolId ?? null
        await distributedStore.put(
            getProjectConcurrencyPoolKey(projectId),
            poolId ?? NO_POOL_SENTINEL,
            CACHE_TTL_SECONDS,
        )
        return poolId
    },

    async assignProject({ projectId, poolId }: { projectId: string, poolId: string | null }): Promise<void> {
        if (!isNil(poolId)) {
            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId, CACHE_TTL_SECONDS)
        }
        else {
            await distributedStore.delete(getProjectConcurrencyPoolKey(projectId))
        }
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
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), limit, CACHE_TTL_SECONDS)
        }
        return limit
    },
})

type UpsertPoolParams = { platformId: string, key: string, maxConcurrentJobs?: number }
