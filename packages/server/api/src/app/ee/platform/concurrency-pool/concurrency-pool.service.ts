import { apId, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { getConcurrencyPoolLimitKey, getProjectConcurrencyPoolKey } from '../../../database/redis/keys'
import { distributedStore } from '../../../database/redis-connections'
import { projectRepo } from '../../../project/project-repo'
import { ConcurrencyPoolEntity, ConcurrencyPoolEntitySchema } from './concurrency-pool.entity'

const concurrencyPoolRepo = repoFactory<ConcurrencyPoolEntitySchema>(ConcurrencyPoolEntity)
const CACHE_TTL_SECONDS = 86400 // 24 hours

export const concurrencyPoolService = (_log: FastifyBaseLogger) => ({

    async upsertPool({ platformId, key, maxConcurrentJobs }: UpsertPoolParams): Promise<{ poolId: string }> {
        const existing = await concurrencyPoolRepo().findOne({
            where: { platformId, key },
        })
        const poolId = existing?.id ?? apId()
        await concurrencyPoolRepo().upsert({
            id: poolId,
            platformId,
            key,
            maxConcurrentJobs: maxConcurrentJobs ?? existing?.maxConcurrentJobs ?? 1,
        }, ['platformId', 'key'])
        if (!isNil(maxConcurrentJobs)) {
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), maxConcurrentJobs, CACHE_TTL_SECONDS)
        }
        return { poolId }
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
            await distributedStore.put(getProjectConcurrencyPoolKey(projectId), poolId, CACHE_TTL_SECONDS)
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
            await distributedStore.put(getConcurrencyPoolLimitKey(poolId), limit, CACHE_TTL_SECONDS)
        }
        return limit
    },
})

type UpsertPoolParams = { platformId: string, key: string, maxConcurrentJobs?: number }
