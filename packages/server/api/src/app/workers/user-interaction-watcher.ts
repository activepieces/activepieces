import { ActivepiecesError, apId, ErrorCode, isNil } from '@activepieces/core-utils'
import { LATEST_JOB_DATA_SCHEMA_VERSION, UserInteractionJobDataWithoutWatchingInformation, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineResponseWatcher } from './engine-response-watcher'
import { jobQueue, JobType } from './job-queue/job-queue'

const WATCHER_SAFETY_TIMEOUT_MS = 5 * 60 * 1000
const WATCHER_GRACE_MS = 10 * 1000

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
        const timeoutMs = request.jobType === WorkerJobType.EXECUTE_ACTION
            ? (request.expiresAt - Date.now()) + WATCHER_GRACE_MS
            : WATCHER_SAFETY_TIMEOUT_MS
        const result = await engineResponseWatcher(log).oneTimeListener<T>(id, true, timeoutMs, undefined)
        if (isNil(result)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: { message: WORKER_DID_NOT_RESPOND_MESSAGE },
            })
        }
        return result
    },
}

export const WORKER_DID_NOT_RESPOND_MESSAGE = 'Worker did not respond within the safety timeout'
