import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
import { FlowRunResponse } from '../flow-run/execution/flow-execution'
import { ProgressUpdateType } from './engine-operation'



export const UpdateRunProgressRequest = Type.Object({
    runDetails: Type.Omit(FlowRunResponse, ['steps']),
    runId: Type.String(),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
    failedStepName: Type.Optional(Type.String()),
    logsFileId: Type.Optional(Type.String()),
    stepNameToTest: Type.Optional(Type.String()),
})

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>


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
