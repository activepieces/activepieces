import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../../common'


export enum TriggerRunStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TIMED_OUT = 'TIMED_OUT',
}

export const TriggerRun = Type.Object({
    ...BaseModelSchema,
    jobId: Type.String(),
    platformId: Type.String(),
    payloadFileId: Type.String(),
    error: Nullable(Type.String()),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    projectId: Type.String(),
    status: Type.Enum(TriggerRunStatus),
    triggerSourceId: Type.String(),
})

export type TriggerRun = Static<typeof TriggerRun>


export const CreateTriggerRunRequestBody = Type.Object({
    jobId: Type.String(),
    status: Type.Enum(TriggerRunStatus),
    payload: Type.Unknown(),
    error: Nullable(Type.String()),
    flowId: Type.String(),
    simulate: Type.Boolean(),
})

export type CreateTriggerRunRequestBody = Static<typeof CreateTriggerRunRequestBody>

export const TriggerStatusReport = Type.Object({
    pieces: Type.Record(Type.String(), Type.Object({
        dailyStats: Type.Record(Type.String(), Type.Object({
            success: Type.Number(),
            failure: Type.Number(),
        })),
        totalRuns: Type.Number(),
    })),
})

export type TriggerStatusReport = Static<typeof TriggerStatusReport>