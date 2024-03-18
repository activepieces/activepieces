
import { Static, Type } from '@sinclair/typebox'
import { ExecutionState } from './execution-output'

export enum FlowRunStatus {
    FAILED = 'FAILED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    PAUSED = 'PAUSED',
    RUNNING = 'RUNNING',
    STOPPED = 'STOPPED',
    SUCCEEDED = 'SUCCEEDED',
    TIMEOUT = 'TIMEOUT',
}

export enum PauseType {
    DELAY = 'DELAY',
    WEBHOOK = 'WEBHOOK',
}

export const DelayPauseMetadata = Type.Object({
    type: Type.Literal(PauseType.DELAY),
    resumeDateTime: Type.String(),
})

export type DelayPauseMetadata = Static<typeof DelayPauseMetadata>

export const WebhookPauseMetadata = Type.Object({
    type: Type.Literal(PauseType.WEBHOOK),
    requestId: Type.String(),
    response: Type.Unknown(),
})
export type WebhookPauseMetadata = Static<typeof WebhookPauseMetadata>

export const PauseMetadata = Type.Union([DelayPauseMetadata, WebhookPauseMetadata])
export type PauseMetadata = DelayPauseMetadata | WebhookPauseMetadata

export const StopResponse = Type.Object({
    status: Type.Optional(Type.Number()),
    body: Type.Optional(Type.Unknown()),
    headers: Type.Optional(Type.Record(Type.String(), Type.String())),
})

export type StopResponse = Static<typeof StopResponse>

export const FlowError = Type.Object({
    stepName: Type.String(),
    message: Type.String(),
})

export type FlowError = Static<typeof FlowError>

const BaseExecutionResponse = {
    ...ExecutionState,
    duration: Type.Number(),
    tasks: Type.Number(),
    tags: Type.Optional(Type.Array(Type.String())),
    error: Type.Optional(FlowError),
    stopResponse: Type.Optional(StopResponse),
}

export const FlowRunResponse = Type.Union([
    Type.Object({
        ...BaseExecutionResponse,
        status: Type.Literal(FlowRunStatus.PAUSED),
        pauseMetadata: Type.Optional(PauseMetadata),
    }),
    Type.Object({
        ...BaseExecutionResponse,
        status: Type.Union([Type.Literal(FlowRunStatus.FAILED),
            Type.Literal(FlowRunStatus.SUCCEEDED),
            Type.Literal(FlowRunStatus.RUNNING),
            Type.Literal(FlowRunStatus.QUOTA_EXCEEDED),
            Type.Literal(FlowRunStatus.TIMEOUT),
            Type.Literal(FlowRunStatus.INTERNAL_ERROR),
            Type.Literal(FlowRunStatus.STOPPED),
        ]),
    }),
])
export type FlowRunResponse = Static<typeof FlowRunResponse> & ExecutionState
