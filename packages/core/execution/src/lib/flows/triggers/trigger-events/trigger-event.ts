import { z } from 'zod'
import { BaseModel } from '@activepieces/core-utils'

export type TriggerEventId = string

export const TriggerEvent = z.object({
    id: z.string(),
    projectId: z.string(),
    flowId: z.string(),
    sourceName: z.string(),
    fileId: z.string(),
})
export type TriggerEvent = z.infer<typeof TriggerEvent> & BaseModel<TriggerEventId>


export const TriggerEventWithPayload = TriggerEvent.extend({
    payload: z.unknown(),
})

export type TriggerEventWithPayload = z.infer<typeof TriggerEventWithPayload>
