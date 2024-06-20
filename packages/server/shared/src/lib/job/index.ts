import { Static, Type } from "@sinclair/typebox";
import { JobData } from "./job-data";

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
