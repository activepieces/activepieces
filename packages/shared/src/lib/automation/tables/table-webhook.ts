import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'

export enum TableWebhookEventType {
    RECORD_CREATED = 'RECORD_CREATED',
    RECORD_UPDATED = 'RECORD_UPDATED',
    RECORD_DELETED = 'RECORD_DELETED',
}

export const TableWebhook = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    tableId: z.string(),
    events: z.array(z.nativeEnum(TableWebhookEventType)),
    flowId: z.string(),
})

export type TableWebhook = z.infer<typeof TableWebhook>
