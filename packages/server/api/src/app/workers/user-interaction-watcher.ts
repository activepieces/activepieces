import { apId, LATEST_JOB_DATA_SCHEMA_VERSION, UserInteractionJobDataWithoutWatchingInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue, JobType } from './job-queue/job-queue'

export const userInteractionWatcher = (log: FastifyBaseLogger) => ({
    submitAndWaitForResponse: async <T>(request: UserInteractionJobDataWithoutWatchingInformation, requestId?: string): Promise<T> => {
        const id = requestId ?? apId()
        const job = await jobQueue(log).add({
            id,
            type: JobType.ONE_TIME,
            data: {
                ...request,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            },
        })
        if (!job) {
            throw new Error('Failed to create job')
        }
        const queueEvents = await jobQueue(log).getQueueEvents(request.platformId)
        const result = await job.waitUntilFinished(queueEvents)
        return result.response as T
    },
})
