import { Static, Type } from '@sinclair/typebox'
import { DelayedJobData, JobData } from './job-data'
import { EngineHttpResponse, ProgressUpdateType } from '@activepieces/shared'

export enum JobType {
    WEBHOOK = 'WEBHOOK',
    ONE_TIME = 'ONE_TIME',
    REPEATING = 'REPEATING',
    DELAYED = 'DELAYED',
}

export enum JobStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum QueueName {
    WEBHOOK = 'webhookJobs',
    ONE_TIME = 'oneTimeJobs',
    SCHEDULED = 'scheduledJobs',
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
})

export type ApQueueJob = Static<typeof ApQueueJob>


export const DeleteWebhookSimulationRequest = Type.Object({
    flowId: Type.String(),
    projectId: Type.String(),
})
export type DeleteWebhookSimulationRequest = Static<typeof DeleteWebhookSimulationRequest>

export const SendWebhookUpdateRequest = Type.Object({
    workerServerId: Type.String(),
    requestId: Type.String(),
    response: EngineHttpResponse
})
export type SendWebhookUpdateRequest = Static<typeof SendWebhookUpdateRequest>

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
})

export type SubmitPayloadsRequest = Static<typeof SubmitPayloadsRequest>

export const GetRunForWorkerRequest = Type.Object({
    runId: Type.String(),
})
export type GetRunForWorkerRequest = Static<typeof GetRunForWorkerRequest>

export const ResumeRunRequest = DelayedJobData
export type ResumeRunRequest = Static<typeof ResumeRunRequest>
