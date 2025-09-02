import { Static, Type } from '@sinclair/typebox'
import { TableAutomationStatus, TableAutomationTrigger } from '../table'
import { TableWebhookEventType } from '../table-webhook'

export const CreateTableRequest = Type.Object({
    name: Type.String(),
    externalId: Type.Optional(Type.String()),
})

export type CreateTableRequest = Static<typeof CreateTableRequest>

export const ExportTableResponse = Type.Object({
    fields: Type.Array(Type.Object({ id: Type.String(), name: Type.String() })),
    rows: Type.Array(Type.Record(Type.String(), Type.String())),
    name: Type.String(),
})

export type ExportTableResponse = Static<typeof ExportTableResponse>

export const CreateTableWebhookRequest = Type.Object({
    events: Type.Array(Type.Enum(TableWebhookEventType)),
    webhookUrl: Type.String(),
    flowId: Type.String(),
})

export type CreateTableWebhookRequest = Static<typeof CreateTableWebhookRequest>

export const UpdateTableRequest = Type.Object({
    name: Type.Optional(Type.String()),
    trigger: Type.Optional(Type.Enum(TableAutomationTrigger)),
    status: Type.Optional(Type.Enum(TableAutomationStatus)),
})

export type UpdateTableRequest = Static<typeof UpdateTableRequest>


export const ListTablesRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    name: Type.Optional(Type.String({})),
    externalIds: Type.Optional(Type.Array(Type.String())),
})

export type ListTablesRequest = Static<typeof ListTablesRequest>
