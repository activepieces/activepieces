import { isNil } from '@activepieces/shared'
import { Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from './job-queue/job-queue'

export const platformQueueMigrationService = (log: FastifyBaseLogger) => ({
    async migrateJobs({ fromQueueName, toQueueName, platformId, batchSize = 200 }: MigrateJobsParams): Promise<void> {
        if (fromQueueName === toQueueName) {
            return
        }
        const sourceQueue = await jobQueue(log).getOrCreateQueue({ queueName: fromQueueName })
        const targetQueue = await jobQueue(log).getOrCreateQueue({ queueName: toQueueName })

        await migrateRegularJobs({ sourceQueue, targetQueue, platformId, batchSize })
        await migrateSchedulers({ sourceQueue, targetQueue, platformId, batchSize, log })
    },
})

async function migrateRegularJobs({ sourceQueue, targetQueue, platformId, batchSize }: MigrateQueueParams): Promise<void> {
    for (const state of ['waiting', 'delayed', 'paused'] as const) {
        let offset = 0
        while (true) {
            const jobs = await sourceQueue.getJobs([state], offset, offset + batchSize - 1)
            if (jobs.length === 0) {
                break
            }

            const platformJobs = jobs.filter(job => job.data?.platformId === platformId && !job.repeatJobKey)
            const skipped = jobs.length - platformJobs.length

            await Promise.all(platformJobs.map(async (job) => {
                if (isNil(job.id)) {
                    return
                }
                const remainingDelay = isNil(job.opts.delay) ? undefined : Math.max(0, job.timestamp + (job.opts.delay ?? 0) - Date.now())
                await targetQueue.add(job.name, job.data, {
                    jobId: job.id,
                    priority: job.opts.priority,
                    delay: remainingDelay,
                    attempts: job.opts.attempts,
                    backoff: job.opts.backoff,
                    removeOnComplete: job.opts.removeOnComplete,
                    removeOnFail: job.opts.removeOnFail,
                })
                await job.remove()
            }))

            // Only advance by skipped count — removed jobs collapse the indices
            offset += skipped
            if (jobs.length < batchSize) {
                break
            }
        }
    }
}

async function migrateSchedulers({ sourceQueue, targetQueue, platformId, batchSize, log }: MigrateQueueParams & { log: FastifyBaseLogger }): Promise<void> {
    let offset = 0
    const migratedSchedulerIds: string[] = []
    let migrationFailed = false

    while (true) {
        const schedulers = await sourceQueue.getJobSchedulers(offset, offset + batchSize - 1)
        if (schedulers.length === 0) {
            break
        }
        const platformSchedulers = schedulers.filter(s => s.template?.data?.platformId === platformId)
        const skipped = schedulers.length - platformSchedulers.length

        for (const scheduler of platformSchedulers) {
            const schedulerId = scheduler.id ?? scheduler.key
            await targetQueue.upsertJobScheduler(
                schedulerId,
                {
                    pattern: scheduler.pattern,
                    every: scheduler.every,
                    tz: scheduler.tz,
                },
                {
                    name: scheduler.name,
                    data: scheduler.template?.data,
                    opts: scheduler.template?.opts,
                },
            ).then(async (data) => {
                if (!isNil(data)) { // to make sure job is not removed unless it is upserted in target queue
                    log.info({
                        platformId,
                        schedulerId,
                        batch: `${offset}-${offset + batchSize - 1}`,
                    }, '[platformQueueMigrationService#migrateSchedulers] Migrated scheduler to new queue')
                    migratedSchedulerIds.push(schedulerId)
                    await sourceQueue.removeJobScheduler(schedulerId)
                }
                else {
                    log.error({
                        platformId,
                        schedulerId,
                        batch: `${offset}-${offset + batchSize - 1}`,
                    }, '[platformQueueMigrationService#migrateSchedulers] Failed to migrate scheduler to new queue')
                    migrationFailed = true
                }
            })
            
        }

        offset += skipped
        if (schedulers.length < batchSize) {
            break
        }
    }

    if (!migrationFailed) {
        await removeOrphanedDelayedJobs({ sourceQueue, schedulerIds: migratedSchedulerIds, batchSize })
        log.info({
            platformId,
            migratedSchedulers: migratedSchedulerIds.length,
        }, '[platformQueueMigrationService#migrateSchedulers] Migrated schedulers to new queue')
        return
    }

    log.error({
        platformId,
        migratedSchedulers: migratedSchedulerIds.length,
    }, '[platformQueueMigrationService#migrateSchedulers] Some batches failed to migrate schedulers, delayed orphaned jobs not deleted')
}

// removeJobScheduler does not remove the already-queued next-run delayed job.
// Scan delayed jobs and remove any whose repeatJobKey belongs to a migrated scheduler.
async function removeOrphanedDelayedJobs({ sourceQueue, schedulerIds, batchSize }: { sourceQueue: Queue, schedulerIds: string[], batchSize: number }): Promise<void> {
    if (schedulerIds.length === 0) {
        return
    }
    let offset = 0
    while (true) {
        const jobs = await sourceQueue.getJobs(['delayed'], offset, offset + batchSize - 1)
        if (jobs.length === 0) {
            break
        }
        let skipped = 0
        await Promise.all(jobs.map(async (job) => {
            const isOrphaned = schedulerIds.some(id => job.repeatJobKey?.startsWith(id))
            if (isOrphaned) {
                await job.remove()
            }
            else {
                skipped++
            }
        }))
        offset += skipped
        if (jobs.length < batchSize) {
            break
        }
    }
}

type MigrateJobsParams = {
    fromQueueName: string
    toQueueName: string
    platformId: string
    batchSize?: number
}

type MigrateQueueParams = {
    sourceQueue: Queue
    targetQueue: Queue
    platformId: string
    batchSize: number
}
