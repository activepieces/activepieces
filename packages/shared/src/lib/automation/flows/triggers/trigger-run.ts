import { z } from 'zod'


export enum TriggerRunStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TIMED_OUT = 'TIMED_OUT',
}

export const TriggerStatusReport = z.object({
    pieces: z.record(z.string(), z.object({
        dailyStats: z.record(z.string(), z.object({
            success: z.number(),
            failure: z.number(),
        })),
        totalRuns: z.number(),
    })),
})

export type TriggerStatusReport = z.infer<typeof TriggerStatusReport>
