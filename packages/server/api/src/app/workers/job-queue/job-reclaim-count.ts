import { tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { getJobReclaimCountKey } from '../../database/redis/keys'
import { distributedStore, redisConnections } from '../../database/redis-connections'

async function increment({ jobId, log }: { jobId: string, log: FastifyBaseLogger }): Promise<number> {
    const { data, error } = await tryCatch(async () => {
        const redis = await redisConnections.useExisting()
        return redis.incr(getJobReclaimCountKey(jobId))
    })
    if (error) {
        log.error({ job: { id: jobId }, error: String(error) }, '[jobReclaimCount] Failed to increment reclaim count')
        return 0
    }
    return data
}

async function clear({ jobId, log }: { jobId: string, log: FastifyBaseLogger }): Promise<void> {
    const { error } = await tryCatch(() => distributedStore.delete(getJobReclaimCountKey(jobId)))
    if (error) {
        log.error({ job: { id: jobId }, error: String(error) }, '[jobReclaimCount] Failed to clear reclaim count')
    }
}

export const jobReclaimCount = { increment, clear }
