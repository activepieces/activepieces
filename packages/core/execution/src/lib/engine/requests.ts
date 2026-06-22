import { z } from 'zod'
import { RunInternalError } from '../flow-run/execution/execution-output'
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
    internalError: RunInternalError.optional(),
})

export type UploadRunLogsRequest = z.infer<typeof UploadRunLogsRequest>


export const UpdateStepProgressRequest = z.object({
    projectId: z.string(),
    stepResponse: StepRunResponse,
})
export type UpdateStepProgressRequest = z.infer<typeof UpdateStepProgressRequest>

export const FileTransportQueryParams = z.object({
    token: z.string(),
})
export type FileTransportQueryParams = z.infer<typeof FileTransportQueryParams>

export const FileReadToken = z.object({
    fileId: z.string(),
    fileType: z.string().optional(),
})
export type FileReadToken = z.infer<typeof FileReadToken>

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

export const UpdateRunProgressRequest = z.object({
    flowRun: FlowRun.omit({ steps: true }),
    step: z.object({
        name: z.string(),
        path: z.array(z.tuple([z.string(), z.number()])).readonly(),
        // StepOutput is a runtime class, not a schema — it travels as serialized JSON and
        // is forwarded verbatim to websocket clients, so it is passed through unvalidated.
        output: z.custom<StepOutput>(),
    }).optional(),
})
export type UpdateRunProgressRequest = z.infer<typeof UpdateRunProgressRequest>
