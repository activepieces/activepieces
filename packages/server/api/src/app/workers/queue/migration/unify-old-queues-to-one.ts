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

        await migrateQueue<LegacyOneTimeJobData>('oneTimeJobs', async (job) => {
            const casedData = job.data
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

        await migrateQueue<LegacyWebhookJobData>('webhookJobs', async (job) => {
            const casedData = job.data
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

        await migrateQueue<LegacyDelayedJobData>('repeatableJobs', async (job) => {
            const castedData = job.data
            if (job.data.jobType !== 'DELAYED_FLOW') {
                return
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

        await cleanQueue('usersInteractionJobs')
        await cleanQueue('agentsJobs')
    },
})

async function migrateQueue<T>(name: string, migrationFn: (job: Job<T>) => Promise<void>) {
    const legacyQueue = new Queue<T>(name, {
        connection: createRedisClient(),
    })

    const waitingJobs = await legacyQueue.getJobs(['waiting', 'delayed', 'active'])

    for (const job of waitingJobs) {
        await migrationFn(job)
    }

    await legacyQueue.obliterate({
        force: true,
    })
}

async function cleanQueue(name: string) {
    if (queueMode == QueueMode.MEMORY) {
        return
    }
    const scheduledJobsQueue = new Queue(name, {
        connection: createRedisClient(),
    })
    await scheduledJobsQueue.obliterate({
        force: true,
    })
}
