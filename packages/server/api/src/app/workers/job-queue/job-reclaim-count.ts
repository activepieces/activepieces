import { tryCatch } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { getJobReclaimCountKey } from '../../database/redis/keys'
import { redisConnections } from '../../database/redis-connections'

async function increment(jobId: string): Promise<number> {
    const redis = await redisConnections.useExisting()
    return redis.incr(getJobReclaimCountKey(jobId))
}

async function clear({ jobId, log }: { jobId: string, log: FastifyBaseLogger }): Promise<void> {
    const { error } = await tryCatch(async () => {
        const redis = await redisConnections.useExisting()
        await redis.del(getJobReclaimCountKey(jobId))
    })
    if (error) {
        log.error({ job: { id: jobId }, error: String(error) }, '[jobReclaimCount] Failed to clear reclaim count')
    }
}

export const jobReclaimCount = { increment, clear }
