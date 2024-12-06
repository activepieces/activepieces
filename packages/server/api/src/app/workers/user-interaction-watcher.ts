import { JobType, UserInteractionJobDataWithoutWatchingInformation } from '@activepieces/server-shared'
import { apId } from '@activepieces/shared'
import { engineResponseWatcher } from './engine-response-watcher'
import { jobQueue } from './queue'

export const userInteractionWatcher = {
    submitAndWaitForResponse: async <T>(request: UserInteractionJobDataWithoutWatchingInformation): Promise<T> => {
        const requestId = apId()
        await jobQueue.add({
            id: apId(),
            type: JobType.USERS_INTERACTION,
            data: {
                ...request,
                requestId,
                webserverId: engineResponseWatcher.getServerId(),
            },
        })
        return engineResponseWatcher.oneTimeListener<T>(requestId, false, undefined, undefined)
    },
}