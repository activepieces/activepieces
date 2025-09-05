import { AppSystemProp } from '@activepieces/server-shared'
import { DelayedJobData, OneTimeJobData, WebhookJobData, WorkerJobType } from '@activepieces/shared'
import { Job, Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from '..'
import { createRedisClient } from '../../../database/redis-connection'
import { QueueMode, system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { JobType } from '../queue-manager'

const queueMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)

type LegacyOneTimeJobData = Pick<OneTimeJobData, 'runId' | 'projectId' | 'flowVersionId' | 'environment' | 'synchronousHandlerId' | 'httpRequestId' | 'payload' | 'executeTrigger' | 'executionType' | 'progressUpdateType' | 'stepNameToTest' | 'sampleData'>
type LegacyWebhookJobData = Pick<WebhookJobData, 'projectId' | 'schemaVersion' | 'requestId' | 'payload' | 'runEnvironment' | 'flowId' | 'saveSampleData' | 'flowVersionIdToRun' | 'execute' | 'parentRunId' | 'failParentOnFailure'>
type LegacyDelayedJobData = Pick<DelayedJobData, 'projectId' | 'environment' | 'schemaVersion' | 'flowVersionId' | 'flowId' | 'runId' | 'httpRequestId' | 'synchronousHandlerId' | 'progressUpdateType' | 'jobType'>

export const unifyOldQueuesIntoOne = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        if (queueMode === QueueMode.MEMORY) {
            return
        }

        let migratedOneTimeJobs = 0
        await migrateQueue<LegacyOneTimeJobData>('oneTimeJobs', async (job) => {
            const casedData = job.data
            migratedOneTimeJobs++
            if (migratedOneTimeJobs % 500 === 0) {
                log.info({
                    migratedOneTimeJobs,
                }, '[unifyOldQueuesIntoOne] Migrated one time jobs')
            }
            await jobQueue(log).add({
                id: job.id!,
                type: JobType.ONE_TIME,
                data: {
                    ...casedData,
                    platformId: await projectService.getPlatformId(casedData.projectId),
                    jobType: WorkerJobType.EXECUTE_FLOW,
                },
            })
        })
        log.info({
            migratedOneTimeJobs,
        }, '[unifyOldQueuesIntoOne] Migrated one time jobs')

        let migratedWebhookJobs = 0
        await migrateQueue<LegacyWebhookJobData>('webhookJobs', async (job) => {
            const casedData = job.data
            migratedWebhookJobs++
            if (migratedWebhookJobs % 500 === 0) {
                log.info({
                    migratedWebhookJobs,
                }, '[unifyOldQueuesIntoOne] Migrated webhook jobs')
            }
            await jobQueue(log).add({
                id: job.id!,
                type: JobType.ONE_TIME,
                data: {
                    ...casedData,
                    platformId: await projectService.getPlatformId(casedData.projectId),
                    jobType: WorkerJobType.EXECUTE_WEBHOOK,
                },
            })
        })
        log.info({
            migratedWebhookJobs,
        }, '[unifyOldQueuesIntoOne] Migrated webhook jobs')

        let migratedDelayedJobs = 0
        await migrateQueue<LegacyDelayedJobData>('repeatableJobs', async (job) => {
            const castedData = job.data
            if (job.data.jobType !== 'DELAYED_FLOW') {
                return
            }
            migratedDelayedJobs++
            if (migratedDelayedJobs % 500 === 0) {
                log.info({
                    migratedDelayedJobs,
                }, '[unifyOldQueuesIntoOne] Migrated delayed jobs')
            }
            await jobQueue(log).add({
                id: job.id!,
                type: JobType.ONE_TIME,
                delay: job.delay,
                data: {
                    ...castedData,
                    platformId: await projectService.getPlatformId(castedData.projectId),
                    jobType: WorkerJobType.DELAYED_FLOW,
                },
            })
        })
        log.info({
            migratedDelayedJobs,
        }, '[unifyOldQueuesIntoOne] Migrated delayed jobs')

        await cleanQueue('usersInteractionJobs')
        await cleanQueue('agentsJobs')
    },
})

async function migrateQueue<T>(name: string, migrationFn: (job: Job<T>) => Promise<void>) {
    const legacyQueue = new Queue<T>(name, {
        connection: createRedisClient(),
    })

    const waitingJobs = await legacyQueue.getJobs(['waiting', 'delayed', 'active', 'prioritized'])
    const batchSize = 200
    for (let i = 0; i < waitingJobs.length; i += batchSize) {
        const batch = waitingJobs.slice(i, i + batchSize)
        await Promise.all(batch.map(job => migrationFn(job)))
    }
    await legacyQueue.obliterate({
        force: true,
    })
    await legacyQueue.close()
}

async function cleanQueue(name: string) {
    if (queueMode == QueueMode.MEMORY) {
        return
    }
    const queue = new Queue(name, {
        connection: createRedisClient(),
    })
    await queue.obliterate({
        force: true,
    })
}
