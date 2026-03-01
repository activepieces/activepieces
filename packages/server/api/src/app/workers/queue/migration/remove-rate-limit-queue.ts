import { isNil, RATE_LIMIT_PRIORITY } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis-connections'
import { jobQueue } from '../job-queue'

const REMOVE_RATE_LIMIT_QUEUE_KEY = 'remove_rate_limit_queue'

export const removeRateLimitJobsQueue = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const isMigrated = await redisConnection.get(REMOVE_RATE_LIMIT_QUEUE_KEY)
        if (!isNil(isMigrated)) {
            log.info('[removeRateLimitJobsQueue] Already migrated, skipping')
            return
        }
        const queue = new Queue('rateLimitJobs', {
            connection: await redisConnections.create(),
        })
        const jobs = await queue.getJobs(['waiting', 'delayed', 'active', 'prioritized'])
        for (const job of jobs) {
            await jobQueue(log).add({
                ...job.data,
                priority: RATE_LIMIT_PRIORITY,
            })
        }
        await queue.obliterate({
            force: true,
        })
        await queue.close()
        await redisConnection.set(REMOVE_RATE_LIMIT_QUEUE_KEY, 'true')
    },
})