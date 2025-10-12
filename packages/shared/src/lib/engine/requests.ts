import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion, Nullable } from '../common'
import { FlowRunResponse } from '../flow-run/execution/flow-execution'
import { ProgressUpdateType } from './engine-operation'

export enum UpdateLogsBehavior {
    UPDATE_LOGS_METADATA = 'UPDATE_LOGS_METADATA',
    NONE = 'NONE',
}

const BaseUpdateRunProgressRequest = {
    runDetails: Type.Omit(FlowRunResponse, ['steps']),
    runId: Type.String(),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
    failedStepName: Type.Optional(Type.String()),
    testSingleStepMode: Type.Optional(Type.Boolean()),
}

export const UpdateRunProgressRequest = DiscriminatedUnion('updateLogsBehavior', [
    Type.Object({
        ...BaseUpdateRunProgressRequest,
        updateLogsBehavior: Type.Literal(UpdateLogsBehavior.UPDATE_LOGS_METADATA),
        executionStateContentLength: Type.Number(),
        logsFileId: Type.Optional(Type.String()),
    }),
    Type.Object({
        ...BaseUpdateRunProgressRequest,
        updateLogsBehavior: Type.Literal(UpdateLogsBehavior.NONE),
    }),
])

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>

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

export const UpdateLogsRequest = Type.Object({
    flowRunId: Type.String(),
    logsFileId: Type.Optional(Type.String()),
    executionStateContentLength: Type.Number(),
    executionStateString: Type.String(),
})

export type UpdateLogsRequest = Static<typeof UpdateLogsRequest>
