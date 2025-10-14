import { apId, UserInteractionJobDataWithoutWatchingInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineResponseWatcher } from './engine-response-watcher'
import { jobQueue } from './queue/job-queue'
import { JobType } from './queue/queue-manager'

export const userInteractionWatcher = (log: FastifyBaseLogger) => ({
    submitAndWaitForResponse: async <T>(request: UserInteractionJobDataWithoutWatchingInformation, requestId?: string): Promise<T> => {
        const id = requestId ?? apId()
        await jobQueue(log).add({
            id,
            type: JobType.ONE_TIME,
            data: {
                ...request,
                requestId: id,
                webserverId: engineResponseWatcher(log).getServerId(),
            },
        })
        return engineResponseWatcher(log).oneTimeListener<T>(id, false, undefined, undefined)
    },
})