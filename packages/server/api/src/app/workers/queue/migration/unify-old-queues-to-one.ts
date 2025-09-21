import { DelayedJobData, ExecuteFlowJobData, WebhookJobData, WorkerJobType } from '@activepieces/shared'
import { Job, Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../../database/redis'
import { projectService } from '../../../project/project-service'
import { jobQueue } from '../job-queue'
import { JobType } from '../queue-manager'


type LegacyOneTimeJobData = Pick<ExecuteFlowJobData, 'runId' | 'projectId' | 'flowVersionId' | 'environment' | 'synchronousHandlerId' | 'httpRequestId' | 'payload' | 'executeTrigger' | 'executionType' | 'progressUpdateType' | 'stepNameToTest' | 'sampleData'>
type LegacyWebhookJobData = Pick<WebhookJobData, 'projectId' | 'schemaVersion' | 'requestId' | 'payload' | 'runEnvironment' | 'flowId' | 'saveSampleData' | 'flowVersionIdToRun' | 'execute' | 'parentRunId' | 'failParentOnFailure'>
type LegacyDelayedJobData = Pick<DelayedJobData, 'projectId' | 'environment' | 'schemaVersion' | 'flowVersionId' | 'flowId' | 'runId' | 'httpRequestId' | 'synchronousHandlerId' | 'progressUpdateType' | 'jobType'>
const migratedKey = 'unified_queue_migrated'

export const unifyOldQueuesIntoOne = (log: FastifyBaseLogger) => ({
    async run(): Promise<void> {
        if (await isMigrated()) {
            log.info('[unifyOldQueuesIntoOne] Already migrated, skipping')
            return
        }

        const oneTimeJobsHadZero = await migrateOneTimeJobs(log)
        const webhookJobsHadZero = await migrateWebhookJobs(log)
        const delayedJobsHadZero = await migrateDelayedJobs(log)

        await cleanQueue('usersInteractionJobs')
        await cleanQueue('agentsJobs')
        await cleanQueue('cleanupJobs')

        if (oneTimeJobsHadZero && webhookJobsHadZero && delayedJobsHadZero) {
            await markAsMigrated()
            log.info('[unifyOldQueuesIntoOne] Migration completed and marked as done')
        }
    },
})

async function isMigrated(): Promise<boolean> {
    const redisConnectionInstance = await redisConnections.useExisting()
    const migrated = await redisConnectionInstance.get(migratedKey)
    return migrated === 'true'
}

async function markAsMigrated(): Promise<void> {
    const redisConnectionInstance = await redisConnections.useExisting()
    await redisConnectionInstance.set(migratedKey, 'true')
}

async function migrateOneTimeJobs(log: FastifyBaseLogger): Promise<boolean> {
    let migratedOneTimeJobs = 0
    const hadZero = await migrateQueue<LegacyOneTimeJobData>('oneTimeJobs', async (job) => {
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
        await job.remove()
    })
    if (migratedOneTimeJobs > 0) {
        log.info({
            migratedOneTimeJobs,
        }, '[unifyOldQueuesIntoOne] Migrated one time jobs')
    }
    return hadZero
}

async function migrateWebhookJobs(log: FastifyBaseLogger): Promise<boolean> {
    let migratedWebhookJobs = 0
    const hadZero = await migrateQueue<LegacyWebhookJobData>('webhookJobs', async (job) => {
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
        await job.remove()
    })
    if (migratedWebhookJobs > 0) {
        log.info({
            migratedWebhookJobs,
        }, '[unifyOldQueuesIntoOne] Migrated webhook jobs')
    }
    return hadZero
}

async function migrateDelayedJobs(log: FastifyBaseLogger): Promise<boolean> {
    let migratedDelayedJobs = 0
    const hadZero = await migrateQueue<LegacyDelayedJobData>('repeatableJobs', async (job) => {
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
        await job.remove()
    })
    if (migratedDelayedJobs > 0) {
        log.info({
            migratedDelayedJobs,
        }, '[unifyOldQueuesIntoOne] Migrated delayed jobs')
    }
    return hadZero
}

async function migrateQueue<T>(name: string, migrationFn: (job: Job<T>) => Promise<void>): Promise<boolean> {
    const legacyQueue = new Queue<T>(name, {
        connection: await redisConnections.createNew(),
    })

    const waitingJobs = await legacyQueue.getJobs(['waiting', 'delayed', 'active', 'prioritized'])
    const batchSize = 200
    for (let i = 0; i < waitingJobs.length; i += batchSize) {
        const batch = waitingJobs.slice(i, i + batchSize)
        await Promise.all(batch.map(job => migrationFn(job)))
    }
    await legacyQueue.close()
    return waitingJobs.length === 0
}

async function cleanQueue(name: string) {
    const queue = new Queue(name, {
        connection: await redisConnections.createNew(),
    })
    await queue.obliterate({
        force: true,
    })
}
