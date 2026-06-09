import { ActivepiecesError, apId, ErrorCode, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, UserInteractionJobDataWithoutWatchingInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineResponseWatcher } from './engine-response-watcher'
import { jobQueue, JobType } from './job-queue/job-queue'

const WATCHER_SAFETY_TIMEOUT_MS = 5 * 60 * 1000

export const userInteractionWatcher = {
    submitAndWaitForResponse: async <T>(request: UserInteractionJobDataWithoutWatchingInformation, log: FastifyBaseLogger, requestId?: string): Promise<T> => {
        const id = requestId ?? apId()
        await jobQueue(log).add({
            id,
            type: JobType.ONE_TIME,
            data: {
                ...request,
                requestId: id,
                webserverId: engineResponseWatcher(log).getServerId(),
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
            },
        })
        const result = await engineResponseWatcher(log).oneTimeListener<T>(id, true, WATCHER_SAFETY_TIMEOUT_MS, undefined)
        if (isNil(result)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: 'Worker did not respond within the safety timeout' },
            })
        }
        return result
    },
}
