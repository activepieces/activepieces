import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common'
import { FlowRunResponse } from '../flow-run/execution/flow-execution'
import { ProgressUpdateType } from './engine-operation'

export const UpdateRunProgressRequest = Type.Object({
    runDetails: FlowRunResponse,
    runId: Type.String(),
    progressUpdateType: Type.Enum(ProgressUpdateType),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
})

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>

export const DisableFlowByEngineRequest = Type.Object({
    flowId: Type.Optional(Type.String()),
    flowVersionId: Type.String(),
    projectId: Type.String(),
})
export type DisableFlowByEngineRequest = Static<typeof DisableFlowByEngineRequest>
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
