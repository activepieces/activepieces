
import { Static, Type } from '@sinclair/typebox'

export enum FlowExecutionStatus {
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

const BaseExecutiionResponse = {
    steps: Type.Record(Type.String(), Type.Unknown()),
    duration: Type.Number(),
    error: Type.Optional(Type.Object({
        stepName: Type.String(),
        message: Type.String(),
    })),
    stopResponse: Type.Optional(StopResponse),
}

export const FlowExecutionResponse = Type.Union([
    Type.Object({
        status: Type.Literal(FlowExecutionStatus.PAUSED),
        ...BaseExecutiionResponse,
        pauseMetadata: Type.Optional(PauseMetadata),
    }),
    Type.Object({
        status: Type.Union([Type.Literal(FlowExecutionStatus.FAILED), 
            Type.Literal(FlowExecutionStatus.SUCCEEDED), 
            Type.Literal(FlowExecutionStatus.RUNNING),
            Type.Literal(FlowExecutionStatus.QUOTA_EXCEEDED),
            Type.Literal(FlowExecutionStatus.TIMEOUT),
            Type.Literal(FlowExecutionStatus.INTERNAL_ERROR),
            Type.Literal(FlowExecutionStatus.STOPPED),
        ]),
        ...BaseExecutiionResponse,
    }),
])
export type FlowExecutionResponse = Static<typeof FlowExecutionResponse>
