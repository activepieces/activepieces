import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion, Nullable } from '../common'
import { FlowRunResponse } from '../flow-run/execution/flow-execution'
import { ProgressUpdateType } from './engine-operation'

export enum UpdateLogsBehavior {
    UPDATE_LOGS = 'UPDATE_LOGS',
    UPDATE_LOGS_SIZE = 'UPDATE_LOGS_SIZE',
}

export const UpdateRunProgressRequest = Type.Object({
    runDetails: Type.Omit(FlowRunResponse, ['steps']),
    runId: Type.String(),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
    failedStepName: Type.Optional(Type.String()),
    testSingleStepMode: Type.Optional(Type.Boolean()),
})

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

export const UpdateLogsRequest = DiscriminatedUnion('updateLogsBehavior', [
    Type.Object({
        flowRunId: Type.String(),
        logsFileId: Type.String(),
        updateLogsBehavior: Type.Literal(UpdateLogsBehavior.UPDATE_LOGS),
        executionStateContentLength: Type.Number(),
        executionStateBuffer: Type.Optional(Type.String()),
    }),
    Type.Object({
        flowRunId: Type.String(),
        logsFileId: Type.String(),
        updateLogsBehavior: Type.Literal(UpdateLogsBehavior.UPDATE_LOGS_SIZE),
        executionStateContentLength: Type.Number(),
    }),
])

export type UpdateLogsRequest = Static<typeof UpdateLogsRequest>
