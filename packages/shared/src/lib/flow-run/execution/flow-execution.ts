
import { Static, Type } from '@sinclair/typebox'
import { ProgressUpdateType } from '../../engine'

export enum FlowRunStatus {
    FAILED = 'FAILED',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    PAUSED = 'PAUSED',
    QUEUED = 'QUEUED',
    RUNNING = 'RUNNING',
    SUCCEEDED = 'SUCCEEDED',
    MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
    TIMEOUT = 'TIMEOUT',
}

export enum PauseType {
    DELAY = 'DELAY',
    WEBHOOK = 'WEBHOOK',
}

export const DelayPauseMetadata = Type.Object({
    type: Type.Literal(PauseType.DELAY),
    resumeDateTime: Type.String(),
    requestIdToReply: Type.Optional(Type.String()),
    handlerId: Type.Optional(Type.String({})),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
})

export type DelayPauseMetadata = Static<typeof DelayPauseMetadata>

export const RespondResponse = Type.Object({
    status: Type.Optional(Type.Number()),
    body: Type.Optional(Type.Unknown()),
    headers: Type.Optional(Type.Record(Type.String(), Type.String())),
})

export type RespondResponse = Static<typeof RespondResponse>

export const StopResponse = Type.Object({
    status: Type.Optional(Type.Number()),
    body: Type.Optional(Type.Unknown()),
    headers: Type.Optional(Type.Record(Type.String(), Type.String())),
})

export type StopResponse = Static<typeof StopResponse>

export const WebhookPauseMetadata = Type.Object({
    type: Type.Literal(PauseType.WEBHOOK),
    requestId: Type.String(),
    requestIdToReply: Type.Optional(Type.String()),
    response: RespondResponse,
    handlerId: Type.Optional(Type.String({})),
    progressUpdateType: Type.Optional(Type.Enum(ProgressUpdateType)),
})
export type WebhookPauseMetadata = Static<typeof WebhookPauseMetadata>

export const PauseMetadata = Type.Union([DelayPauseMetadata, WebhookPauseMetadata])
export type PauseMetadata = Static<typeof PauseMetadata>


export const FlowError = Type.Object({
    stepName: Type.String(),
    message: Type.String(),
})

export type FlowError = Static<typeof FlowError>

const BaseExecutionResponse = {
    steps: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    duration: Type.Number(),
    tasks: Type.Optional(Type.Number()),
    tags: Type.Optional(Type.Array(Type.String())),
    error: Type.Optional(FlowError),
    response: Type.Optional(Type.Union([RespondResponse, PauseMetadata])),
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
            Type.Literal(FlowRunStatus.MEMORY_LIMIT_EXCEEDED),
            Type.Literal(FlowRunStatus.QUEUED),
        ]),
    }),
])
export type FlowRunResponse = Static<typeof FlowRunResponse>


export const isFlowRunStateTerminal = ({ status, ignoreInternalError }: { status: FlowRunStatus, ignoreInternalError: boolean }): boolean => {
    switch (status) {
        case FlowRunStatus.SUCCEEDED:
        case FlowRunStatus.TIMEOUT:
        case FlowRunStatus.FAILED:
        case FlowRunStatus.QUOTA_EXCEEDED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
            return true
        case FlowRunStatus.INTERNAL_ERROR:
            return !ignoreInternalError
        case FlowRunStatus.QUEUED:
        case FlowRunStatus.RUNNING:
            return false
        case FlowRunStatus.PAUSED:
            return false
    }
}


export const FAILED_STATES = [
    FlowRunStatus.FAILED,
    FlowRunStatus.INTERNAL_ERROR,
    FlowRunStatus.QUOTA_EXCEEDED,
    FlowRunStatus.TIMEOUT,
    FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
]   
export const isFailedState = (status: FlowRunStatus): boolean => {
    return FAILED_STATES.includes(status)
}