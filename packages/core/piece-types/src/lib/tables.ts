import { BaseModelSchema, Cursor, Nullable, NullableEnum, OptionalArrayFromQuery } from "@activepieces/core-utils";
import * as z from "zod/mini";

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    STATIC_DROPDOWN = 'STATIC_DROPDOWN',
}

export enum TableAutomationTrigger {
    ON_NEW_RECORD = 'ON_NEW_RECORD',
    ON_UPDATE_RECORD = 'ON_UPDATE_RECORD',
}

export enum TableAutomationStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
}

export enum TableWebhookEventType {
    RECORD_CREATED = 'RECORD_CREATED',
    RECORD_UPDATED = 'RECORD_UPDATED',
    RECORD_DELETED = 'RECORD_DELETED',
}

export enum FilterOperator {
    EQ = 'eq',
    NEQ = 'neq',
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    CO = 'co',
    EXISTS = 'exists',
    NOT_EXISTS = 'not_exists',
}

export const Field = z.union([z.object({
    ...BaseModelSchema,
    name: z.string(),
    externalId: z.string(),
    type: z.literal(FieldType.STATIC_DROPDOWN),
    tableId: z.string(),
    projectId: z.string(),
    data: z.object({
        options: z.array(z.object({
            value: z.string(),
        })),
    }),
}), z.object({
    ...BaseModelSchema,
    name: z.string(),
    externalId: z.string(),
    type: z.union([z.literal(FieldType.TEXT), z.literal(FieldType.NUMBER), z.literal(FieldType.DATE)]),
    tableId: z.string(),
    projectId: z.string(),
})])

export type Field = z.infer<typeof Field>

export const Table = z.object({
    ...BaseModelSchema,
    name: z.string(),
    folderId: Nullable(z.string()),
    projectId: z.string(),
    externalId: z.string(),
    status: NullableEnum(TableAutomationStatus),
    trigger: NullableEnum(TableAutomationTrigger),
})

export type Table = z.infer<typeof Table>

export const PopulatedRecord = z.object({
    ...BaseModelSchema,
    tableId: z.string(),
    projectId: z.string(),
    cells: z.record(z.string(), z.object({
        updated: z.string(),
        created: z.string(),
        value: z.unknown(),
        fieldName: z.string(),
    })),
})

export type PopulatedRecord = z.infer<typeof PopulatedRecord>

export const CreateTableWebhookRequest = z.object({
    events: z.array(z.enum(TableWebhookEventType)),
    webhookUrl: z.string(),
    flowId: z.string(),
})

export type CreateTableWebhookRequest = z.infer<typeof CreateTableWebhookRequest>

export const ExportTableResponse = z.object({
    fields: z.array(z.object({ id: z.string(), name: z.string() })),
    rows: z.array(z.record(z.string(), z.string())),
    name: z.string(),
})

export type ExportTableResponse = z.infer<typeof ExportTableResponse>

export const ListTablesRequest = z.object({
    projectId: z.string(),
    limit: z.optional(z.coerce.number()),
    cursor: z.optional(z.string()),
    name: z.optional(z.string()),
    externalIds: OptionalArrayFromQuery(z.string()),
    folderId: z.optional(z.string()),
    folderIds: OptionalArrayFromQuery(z.string()),
})

export type ListTablesRequest = z.infer<typeof ListTablesRequest>

export const CreateRecordsRequest = z.object({
    records: z.array(z.array(z.object({
        fieldId: z.string(),
        value: coerceToString(),
    }))),
    tableId: z.string(),
})

export type CreateRecordsRequest = z.infer<typeof CreateRecordsRequest>

export const UpdateRecordRequest = z.object({
    cells: z.optional(z.array(z.object({
        fieldId: z.string(),
        value: coerceToString(),
    }))),
    tableId: z.string(),
    agentUpdate: z.optional(z.boolean()),
})

export type UpdateRecordRequest = z.infer<typeof UpdateRecordRequest>

export const Filter = z.discriminatedUnion('operator', [
    valueFilter(FilterOperator.EQ),
    valueFilter(FilterOperator.NEQ),
    valueFilter(FilterOperator.GT),
    valueFilter(FilterOperator.GTE),
    valueFilter(FilterOperator.LT),
    valueFilter(FilterOperator.LTE),
    valueFilter(FilterOperator.CO),
    existenceFilter(FilterOperator.EXISTS),
    existenceFilter(FilterOperator.NOT_EXISTS),
])

export type Filter = z.infer<typeof Filter>

export const ListRecordsRequest = z.object({
    tableId: z.string(),
    limit: z.optional(z.coerce.number()),
    cursor: z.optional(z.string()),
    filters: OptionalArrayFromQuery(Filter),
})

export const StaticDropdownEmptyOption = {
    label: '',
    value: '',
}

function coerceToString() {
    return z.pipe(
        z.transform((v: unknown) => (v === null || v === undefined ? v : String(v))),
        z.nullable(z.string()),
    )
}

function valueFilter<T extends FilterOperator>(op: T) {
    return z.object({
        fieldId: z.string(),
        operator: z.literal(op),
        value: z.string(),
    })
}

function existenceFilter<T extends FilterOperator>(op: T) {
    return z.object({
        fieldId: z.string(),
        operator: z.literal(op),
    })
}

export type ListRecordsRequest = Omit<z.infer<typeof ListRecordsRequest>, 'cursor'> & { cursor: Cursor | undefined }
