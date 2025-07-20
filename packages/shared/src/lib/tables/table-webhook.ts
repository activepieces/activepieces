import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export enum TableWebhookEventType {
    RECORD_CREATED = 'RECORD_CREATED',
    RECORD_UPDATED = 'RECORD_UPDATED',
    RECORD_DELETED = 'RECORD_DELETED',
}

export const TableWebhook = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    tableId: Type.String(),
    events: Type.Array(Type.Enum(TableWebhookEventType)),
    flowId: Type.String(),
})

export type TableWebhook = Static<typeof TableWebhook>
