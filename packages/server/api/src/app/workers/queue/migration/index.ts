import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { distributedLock, redisConnections } from '../../../database/redis-connections'
import { refillPausedRuns } from './refill-paused-jobs'
import { refillPollingJobs } from './refill-polling-jobs'
import { refillRenewWebhookJobs } from './refill-renew-webhook-jobs'
import { removeRateLimitJobsQueue } from './remove-rate-limit-queue'
import { unifyOldQueuesIntoOne } from './unify-old-queues-to-one'

const QUEUE_MIGRATION_VERSION = '1'
const QUEUE_MIGRATION_KEY = 'worker_jobs_version'

export const queueMigration = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        await distributedLock(log).runExclusive({
            key: 'job_migration_lock',
            timeoutInSeconds: dayjs.duration(20, 'minute').asSeconds(),
            fn: async () => {
                if (await needMigration()) {
                    await refillPollingJobs(log).run()
                    await refillRenewWebhookJobs(log).run()
                    await updateMigrationVersion()
                }
                await unifyOldQueuesIntoOne(log).run()
                await removeRateLimitJobsQueue(log).run()
                await refillPausedRuns(log).run()

            },
        })
      
    },
})

async function needMigration(): Promise<boolean> {
    const redisConnection = await redisConnections.useExisting()
    const queueMigration = await redisConnection.get(QUEUE_MIGRATION_KEY)
    return queueMigration !== QUEUE_MIGRATION_VERSION

}

async function updateMigrationVersion(): Promise<void> {
    const redisConnection = await redisConnections.useExisting()
    await redisConnection.set(QUEUE_MIGRATION_KEY, QUEUE_MIGRATION_VERSION)
}

