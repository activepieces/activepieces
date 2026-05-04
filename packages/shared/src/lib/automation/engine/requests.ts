import { z } from 'zod'
import { FlowRunStatus } from '../flow-run/execution/flow-execution'
import { StepOutput } from '../flow-run/execution/step-output'
import { FailedStep, FlowRun } from '../flow-run/flow-run'
import { StepRunResponse } from '../flows/sample-data'
import { StreamStepProgress } from './engine-operation'



export const UploadRunLogsRequest = z.object({
    runId: z.string(),
    tags: z.array(z.string()).optional(),
    status: z.nativeEnum(FlowRunStatus),
    projectId: z.string(),
    streamStepProgress: z.nativeEnum(StreamStepProgress).optional(),
    logsFileId: z.string().optional(),
    stepNameToTest: z.string().optional(),
    failedStep: FailedStep.optional(),
    startTime: z.string().optional(),
    finishTime: z.string().optional(),
    stepResponse: StepRunResponse.optional(),
    stepsCount: z.number().optional(),
})

export type UploadRunLogsRequest = z.infer<typeof UploadRunLogsRequest>


export const UpdateStepProgressRequest = z.object({
    projectId: z.string(),
    stepResponse: StepRunResponse,
})
export type UpdateStepProgressRequest = z.infer<typeof UpdateStepProgressRequest>

export const UploadLogsQueryParams = z.object({
    token: z.string(),
})
export type UploadLogsQueryParams = z.infer<typeof UploadLogsQueryParams>

export enum UploadLogsBehavior {
    UPLOAD_DIRECTLY = 'UPLOAD_DIRECTLY',
    REDIRECT_TO_S3 = 'REDIRECT_TO_S3',
}

export const UploadLogsToken = z.object({
    logsFileId: z.string(),
    projectId: z.string(),
    flowRunId: z.string(),
    behavior: z.nativeEnum(UploadLogsBehavior),
})

export type UploadLogsToken = z.infer<typeof UploadLogsToken>

export const SendFlowResponseRequest = z.object({
    workerHandlerId: z.string(),
    httpRequestId: z.string(),
    runResponse: z.object({
        status: z.number(),
        body: z.any(),
        headers: z.record(z.string(), z.string()),
    }),
})
export type SendFlowResponseRequest = z.infer<typeof SendFlowResponseRequest>
export const GetFlowVersionForWorkerRequest = z.object({
    versionId: z.string(),
})

export type GetFlowVersionForWorkerRequest = z.infer<typeof GetFlowVersionForWorkerRequest>

export type UpdateRunProgressRequest = {
    flowRun: Omit<FlowRun, 'steps'>
    step?: {
        name: string
        path: readonly [string, number][]
        output: StepOutput
    }
}
