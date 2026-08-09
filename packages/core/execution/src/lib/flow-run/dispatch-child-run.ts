import { z } from 'zod'

export const DispatchChildRunRequest = z.object({
    parentRunId: z.string(),
    entryStepName: z.string(),
    seedSteps: z.record(z.string(), z.unknown()),
    parentWaitpointId: z.string().optional(),
    dispatchIndex: z.number().int().nonnegative(),
    dispatchKey: z.string(),
})
export type DispatchChildRunRequest = z.infer<typeof DispatchChildRunRequest>

export const DispatchChildRunResponse = z.object({
    id: z.string(),
    attributedToBarrier: z.boolean(),
})
export type DispatchChildRunResponse = z.infer<typeof DispatchChildRunResponse>
