import {
    EngineOperationType,
    ProgressUpdateType,
    RunEnvironment,
} from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { DelayedJobData, JobData } from './job-data'

export enum JobType {
    WEBHOOK = 'WEBHOOK',
    ONE_TIME = 'ONE_TIME',
    REPEATING = 'REPEATING',
    DELAYED = 'DELAYED',
    USERS_INTERACTION = 'USERS_INTERACTION',
    AGENTS = 'AGENTS',
}

export enum JobStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum QueueName {
    WEBHOOK = 'webhookJobs',
    ONE_TIME = 'oneTimeJobs',
    SCHEDULED = 'repeatableJobs',
    USERS_INTERACTION = 'usersInteractionJobs',
    AGENTS = 'agentsJobs',
}

export const PollJobRequest = Type.Object({
    queueName: Type.Enum(QueueName),
})

export type PollJobRequest = Static<typeof PollJobRequest>

export const UpdateJobRequest = Type.Object({
    queueName: Type.Enum(QueueName),
    status: Type.Enum(JobStatus),
    message: Type.Optional(Type.String()),
})
export type UpdateJobRequest = Static<typeof UpdateJobRequest>

export const ApQueueJob = Type.Object({
    id: Type.String(),
    data: JobData,
    engineToken: Type.String(),
    attempsStarted: Type.Number(),
})

export type ApQueueJob = Static<typeof ApQueueJob>

export const SendEngineUpdateRequest = Type.Object({
    workerServerId: Type.String(),
    requestId: Type.String(),
    response: Type.Unknown(),
})
export type SendEngineUpdateRequest = Static<typeof SendEngineUpdateRequest>

export const SavePayloadRequest = Type.Object({
    flowId: Type.String(),
    projectId: Type.String(),
    payloads: Type.Array(Type.Unknown()),
})
export type SavePayloadRequest = Static<typeof SavePayloadRequest>

export const SubmitPayloadsRequest = Type.Object({
    flowVersionId: Type.String(),
    projectId: Type.String(),
    progressUpdateType: Type.Enum(ProgressUpdateType),
    synchronousHandlerId: Type.Optional(Type.String()),
    httpRequestId: Type.Optional(Type.String()),
    payloads: Type.Array(Type.Unknown()),
    environment: Type.Enum(RunEnvironment),
    parentRunId: Type.Optional(Type.String()),
    failParentOnFailure: Type.Optional(Type.Boolean()),
})

export type SubmitPayloadsRequest = Static<typeof SubmitPayloadsRequest>

export const GetRunForWorkerRequest = Type.Object({
    runId: Type.String(),
})
export type GetRunForWorkerRequest = Static<typeof GetRunForWorkerRequest>

export const ResumeRunRequest = Type.Omit(DelayedJobData, ['flowId'])
export type ResumeRunRequest = Static<typeof ResumeRunRequest>


export function getEngineTimeout(operationType: EngineOperationType, flowTimeoutSandbox: number, triggerTimeoutSandbox: number): number {
    switch (operationType) {
        case EngineOperationType.EXECUTE_FLOW:
        case EngineOperationType.EXECUTE_TOOL:
            return flowTimeoutSandbox
        case EngineOperationType.EXECUTE_PROPERTY:
        case EngineOperationType.EXECUTE_VALIDATE_AUTH:
        case EngineOperationType.EXTRACT_PIECE_METADATA:
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            return triggerTimeoutSandbox
    }
}
