import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
import { FlowRunStatus, PauseMetadata } from '../flow-run/execution/flow-execution'
import { FailedStep } from '../flow-run/flow-run'
import { StepRunResponse } from '../flows/sample-data'
import { ProgressUpdateType } from './engine-operation'



export const UpdateRunProgressRequest = Type.Object({
    runId: Type.String(),
    tags: Type.Optional(Type.Array(Type.String())),
    status: Type.Enum(FlowRunStatus),
    projectId: Type.String(),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
    logsFileId: Type.Optional(Type.String()),
    stepNameToTest: Type.Optional(Type.String()),
    failedStep: Type.Optional(FailedStep),
    startTime: Type.Optional(Type.String()),
    finishTime: Type.Optional(Type.String()),
    stepResponse: Type.Optional(StepRunResponse),
    pauseMetadata: Type.Optional(PauseMetadata),
    stepsCount: Type.Optional(Type.Number()),
})

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>


export const UpdateStepProgressRequest = Type.Object({
    projectId: Type.String(),
    stepResponse: StepRunResponse,
})
export type UpdateStepProgressRequest = Static<typeof UpdateStepProgressRequest>

export const UploadLogsQueryParams = Type.Object({
    token: Type.String(),
})
export type UploadLogsQueryParams = Static<typeof UploadLogsQueryParams>

export enum UploadLogsBehavior {
    UPLOAD_DIRECTLY = 'UPLOAD_DIRECTLY',
    REDIRECT_TO_S3 = 'REDIRECT_TO_S3',
}

export const UploadLogsToken = Type.Object({
    logsFileId: Type.String(),
    projectId: Type.String(),
    flowRunId: Type.String(),
    behavior: Type.Enum(UploadLogsBehavior),
})

export type UploadLogsToken = Static<typeof UploadLogsToken>

export const SendFlowResponseRequest = Type.Object({
    workerHandlerId: Type.String(),
    httpRequestId: Type.String(),
    runResponse: Type.Object({
        status: Type.Number(),
        body: Type.Any(),
        headers: Type.Record(Type.String(), Type.String()),
    }),
})
export type SendFlowResponseRequest = Static<typeof SendFlowResponseRequest>
export const GetFlowVersionForWorkerRequest = Type.Object({
    versionId: Type.String(),
})

export type GetFlowVersionForWorkerRequest = Static<typeof GetFlowVersionForWorkerRequest>
