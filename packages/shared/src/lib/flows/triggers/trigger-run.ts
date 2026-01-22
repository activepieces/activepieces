import { Static, Type } from '@sinclair/typebox'


export enum TriggerRunStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TIMED_OUT = 'TIMED_OUT',
}

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