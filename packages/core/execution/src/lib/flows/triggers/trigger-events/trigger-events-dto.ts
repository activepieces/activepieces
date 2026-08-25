import { FlowId } from '@activepieces/core-utils'
import { z } from 'zod'
import { ApId } from '@activepieces/core-utils'
import { Cursor } from '@activepieces/core-utils'

export const ListTriggerEventsRequest = z.object({
    projectId: ApId,
    flowId: z.string(),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})

export type ListTriggerEventsRequest = Omit<z.infer<typeof ListTriggerEventsRequest>, 'flowId' | 'cursor'> & {
    flowId: FlowId
    cursor: Cursor | undefined
}

export const SaveTriggerEventRequest = z.object({
    projectId: ApId,
    flowId: z.string(),
    mockData: z.unknown(),
})

export type SaveTriggerEventRequest = z.infer<typeof SaveTriggerEventRequest>
