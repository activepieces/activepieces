import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion, Nullable } from '../common'
import { FlowRunResponse } from '../flow-run/execution/flow-execution'
import { StepRunResponse } from '../flows'
import { WebsocketClientEvent } from '../websocket'
import { ProgressUpdateType } from './engine-operation'

export const UpdateRunProgressRequest = Type.Object({
    runDetails: Type.Omit(FlowRunResponse, ['steps']),
    executionStateBuffer: Type.Optional(Type.String()),
    executionStateContentLength: Type.Union([Type.Number(), Type.Null()]),
    runId: Type.String(),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
    workerHandlerId: Nullable(Type.String()),
    httpRequestId: Nullable(Type.String()),
    failedStepName: Type.Optional(Type.String()),
})

export type UpdateRunProgressRequest = Static<typeof UpdateRunProgressRequest>

export const UpdateRunProgressResponse = Type.Object({
    uploadUrl: Type.Optional(Type.String()),
})
export type UpdateRunProgressResponse = Static<typeof UpdateRunProgressResponse>


export const NotifyFrontendRequest = DiscriminatedUnion('type', [
    Type.Object({
        type: Type.Literal(WebsocketClientEvent.FLOW_RUN_PROGRESS),
        data: Type.Object({
            runId: Type.String(),
        }),
    }),
    Type.Object({
        type: Type.Literal(WebsocketClientEvent.TEST_STEP_PROGRESS),
        data: StepRunResponse,
    }),
])
export type NotifyFrontendRequest = Static<typeof NotifyFrontendRequest>

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
