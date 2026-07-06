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
})
export type CreateWaitpointRequest = z.infer<typeof CreateWaitpointRequest>

export const CreateWaitpointResponse = z.object({
    id: z.string(),
    resumeUrl: z.string(),
})
export type CreateWaitpointResponse = z.infer<typeof CreateWaitpointResponse>
