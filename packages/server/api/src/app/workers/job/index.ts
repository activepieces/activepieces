import {
    JobData,
    RunEnvironment,
    StreamStepProgress,
} from '@activepieces/shared'
import { z } from 'zod'

export * from './runs-metadata-queue-factory'

export enum JobStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum QueueName {
    WORKER_JOBS = 'workerJobs',
    RUNS_METADATA = 'runsMetadata',
    BARRIER_EVALUATION = 'barrierEvaluation',
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
