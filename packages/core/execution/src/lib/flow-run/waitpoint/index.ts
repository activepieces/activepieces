import { z } from 'zod'
import { RespondResponse } from '../execution/flow-execution'

export const WaitpointVersion = z.enum(['V0', 'V1'])
export type WaitpointVersion = z.infer<typeof WaitpointVersion>

export const CreateWaitpointRequest = z.object({
    flowRunId: z.string(),
    projectId: z.string(),
    stepName: z.string(),
    type: z.enum(['DELAY', 'WEBHOOK']),
    version: WaitpointVersion,
    resumeDateTime: z.string().optional(),
    responseToSend: RespondResponse.optional(),
    workerHandlerId: z.string().optional(),
    httpRequestId: z.string().optional(),
    isFanIn: z.boolean().optional(),
    intendedChildren: z.number().int().nonnegative().optional(),
    dispatchDigest: z.string().optional(),
})
export type CreateWaitpointRequest = z.infer<typeof CreateWaitpointRequest>

export const FanInBarrierState = z.object({
    sealed: z.boolean(),
    expectedChildren: z.number().int().nonnegative().nullable(),
    dispatchedIndices: z.array(z.number().int().nonnegative()),
})
export type FanInBarrierState = z.infer<typeof FanInBarrierState>

export const CreateWaitpointResponse = z.object({
    id: z.string(),
    resumeUrl: z.string(),
    fanIn: FanInBarrierState.optional(),
})
export type CreateWaitpointResponse = z.infer<typeof CreateWaitpointResponse>

export const SealFanInBarrierRequest = z.object({
    projectId: z.string(),
    expectedChildren: z.number().int().nonnegative(),
    failedToDispatch: z.number().int().nonnegative().optional(),
    timeoutAt: z.string().optional(),
})
export type SealFanInBarrierRequest = z.infer<typeof SealFanInBarrierRequest>

export const SealFanInBarrierResponse = z.object({
    expectedChildren: z.number().int().nonnegative(),
    alreadySealed: z.boolean(),
    released: z.boolean(),
    timeoutAt: z.string(),
})
export type SealFanInBarrierResponse = z.infer<typeof SealFanInBarrierResponse>
