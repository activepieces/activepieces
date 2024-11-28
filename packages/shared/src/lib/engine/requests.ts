import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
import { FlowRunResponse } from '../flow-run/execution/flow-execution'
import { ProgressUpdateType } from './engine-operation'

export const UpdateRunProgressRequest = Type.Object({
    runDetails: Type.Omit(FlowRunResponse, ['steps']),
    executionStateBuffer: Type.Optional(Type.String()),
    executionStateContentLength: Type.Union([Type.Number(), Type.Null()]),
    runId: Type.String(),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
})

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>

export const UpdateRunProgressResponse = Type.Object({
    uploadUrl: Type.Optional(Type.String()),
})
export type UpdateRunProgressResponse = Static<typeof UpdateRunProgressResponse>


export const NotifyFrontendRequest = Type.Object({
    runId: Type.String(),
})
export type NotifyFrontendRequest = Static<typeof NotifyFrontendRequest>

export const RemoveStableJobEngineRequest = Type.Object({
    flowId: Type.Optional(Type.String()),
    flowVersionId: Type.String(),
})
export type RemoveStableJobEngineRequest = Static<typeof RemoveStableJobEngineRequest>
export enum GetFlowVersionForWorkerRequestType {
    LATEST = 'LATEST',
    LOCKED = 'LOCKED',
    EXACT = 'EXACT',
}

export const GetFlowVersionForWorkerRequest = Type.Union([
    Type.Object({
        type: Type.Literal(GetFlowVersionForWorkerRequestType.LATEST),
        flowId: Type.String(),
    }),
    Type.Object({
        type: Type.Literal(GetFlowVersionForWorkerRequestType.LOCKED),
        flowId: Type.String(),
    }),
    Type.Object({
        type: Type.Literal(GetFlowVersionForWorkerRequestType.EXACT),
        versionId: Type.String(),
    }),
])

export type GetFlowVersionForWorkerRequest = Static<typeof GetFlowVersionForWorkerRequest>
