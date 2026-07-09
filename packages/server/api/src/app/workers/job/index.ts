import {
    EngineOperationType,
    isNil,
    JobData,
    RunEnvironment,
    StreamStepProgress,
    WorkerGroupScope,
} from '@activepieces/shared'
import { z } from 'zod'

export const parseWorkerGroupValue = ({ value, projectWorker }: { value: string | undefined, projectWorker: boolean }): WorkerGroupAssignment | null => {
    if (isNil(value) || value.length === 0) {
        return null
    }
    return {
        scope: projectWorker ? WorkerGroupScope.PROJECT : WorkerGroupScope.PLATFORM,
        id: value,
    }
}

// Only class queues a worker may subscribe to via AP_WORKER_QUEUE — never runsMetadata
// (dedicated processor) and never group queues (those travel via AP_WORKER_GROUP_ID).
export const parseWorkerQueueValue = ({ value }: { value: string | undefined }): ParsedWorkerQueue => {
    if (isNil(value) || value.length === 0 || value === QueueName.WORKER_JOBS) {
        return { queue: null, invalidValue: null }
    }
    if (value === QueueName.SYNC_JOBS) {
        return { queue: QueueName.SYNC_JOBS, invalidValue: null }
    }
    return { queue: null, invalidValue: value }
}

export * from './runs-metadata-queue-factory'

export enum JobStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum QueueName {
    WORKER_JOBS = 'workerJobs',
    SYNC_JOBS = 'syncJobs',
    RUNS_METADATA = 'runsMetadata',
}

export const getPlatformGroupQueueName = (workerGroupId: string): string => {
    // TODO Rename this to workerGroups-workerGroupId-jobs in the future and migrate existings jobs there.
    return `platform-${workerGroupId}-jobs`
}

export const getProjectGroupQueueName = (workerGroupId: string): string => {
    return `project-${workerGroupId}-jobs`
}

export const getPollQueueName = ({ assignment, workerQueue }: GetPollQueueNameParams): string => {
    if (!isNil(assignment)) {
        return assignment.scope === WorkerGroupScope.PROJECT
            ? getProjectGroupQueueName(assignment.id)
            : getPlatformGroupQueueName(assignment.id)
    }
    return workerQueue ?? QueueName.WORKER_JOBS
}

export const ApQueueJob = z.object({
    id: z.string(),
    data: z.custom<JobData>(),
    engineToken: z.string(),
    attempsStarted: z.number(),
})

export type ApQueueJob = z.infer<typeof ApQueueJob>

export const MigrateJobsRequest = z.object({
    jobData: z.record(z.string(), z.unknown()),
})
export type MigrateJobsRequest = z.infer<typeof MigrateJobsRequest>

export const SavePayloadRequest = z.object({
    flowId: z.string(),
    projectId: z.string(),
    payloads: z.array(z.unknown()),
})
export type SavePayloadRequest = z.infer<typeof SavePayloadRequest>

export const SubmitPayloadsRequest = z.object({
    flowVersionId: z.string(),
    projectId: z.string(),
    streamStepProgress: z.nativeEnum(StreamStepProgress),
    workerHandlerId: z.string().optional(),
    httpRequestId: z.string().optional(),
    payloads: z.array(z.unknown()),
    environment: z.nativeEnum(RunEnvironment),
    parentRunId: z.string().optional(),
    failParentOnFailure: z.boolean().optional(),
    platformId: z.string(),
})

export type SubmitPayloadsRequest = z.infer<typeof SubmitPayloadsRequest>




export function getEngineTimeout(operationType: EngineOperationType, flowTimeoutSandbox: number, triggerTimeoutSandbox: number): number {
    switch (operationType) {
        case EngineOperationType.EXECUTE_FLOW:
            return flowTimeoutSandbox
        case EngineOperationType.EXECUTE_PROPERTY:
        case EngineOperationType.EXECUTE_VALIDATE_AUTH:
        case EngineOperationType.EXECUTE_REFRESH_TOKEN_AUTH:
        case EngineOperationType.EXTRACT_PIECE_METADATA:
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            return triggerTimeoutSandbox
    }
}

export type WorkerGroupAssignment = {
    scope: WorkerGroupScope
    id: string
}

export type ParsedWorkerQueue = {
    queue: QueueName.SYNC_JOBS | null
    invalidValue: string | null
}

export type GetPollQueueNameParams = {
    assignment: WorkerGroupAssignment | null
    workerQueue: QueueName.SYNC_JOBS | null
}
