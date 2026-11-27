import { isNil } from '@activepieces/core-utils'
import { RATE_LIMIT_PRIORITY } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisErrorLogger } from '../../database/redis/redis-error-logger'
import { redisConnections } from '../../database/redis-connections'
import { jobQueue } from '../job-queue/job-queue'

const REMOVE_RATE_LIMIT_QUEUE_KEY = 'remove_rate_limit_queue'

export const removeRateLimitJobsQueue = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const isMigrated = await redisConnection.get(REMOVE_RATE_LIMIT_QUEUE_KEY)
        if (!isNil(isMigrated)) {
            log.info('[removeRateLimitJobsQueue] Already migrated, skipping')
            return
        }
        const connection = await redisConnections.create()
        const queue = new Queue('rateLimitJobs', {
            connection,
        })
        redisErrorLogger.attachToBullmq({
            emitter: queue,
            connection,
            queueName: 'rateLimitJobs',
            role: 'queue',
            log,
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