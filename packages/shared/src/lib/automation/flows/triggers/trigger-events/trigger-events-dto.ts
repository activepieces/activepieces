import { z } from 'zod'
import { ApId } from '../../../../core/common/id-generator'
import { Cursor } from '../../../../core/common/seek-page'
import { FlowId } from '../../flow'

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
