import { z } from 'zod'
import { OptionalArrayFromQuery } from '../../../core/common/base-model'
import { Cursor } from '../../../core/common/seek-page'

export const CreateRecordsRequest = z.object({
    records: z.array(z.array(z.object({
        fieldId: z.string(),
        value: z.string(),
    }))),
    tableId: z.string(),
})

export type CreateRecordsRequest = z.infer<typeof CreateRecordsRequest>

export const UpdateRecordRequest = z.object({
    cells: z.array(z.object({
        fieldId: z.string(),
        value: z.string(),
    })).optional(),
    tableId: z.string(),
    agentUpdate: z.boolean().optional(),
})

export type UpdateRecordRequest = z.infer<typeof UpdateRecordRequest>

export const UpdateRecordsRequest = z.object({
    tableId: z.string(),
    records: z.array(z.object({
        recordId: z.string(),
        cells: z.array(z.object({
            fieldId: z.string(),
            value: z.string(),
        })),
    })),
})

export type UpdateRecordsRequest = z.infer<typeof UpdateRecordsRequest>

export enum FilterOperator {
    EQ = 'eq',
    NEQ = 'neq',
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    CO = 'co',
}

export const Filter = z.object({
    fieldId: z.string(),
    value: z.string(),
    operator: z.nativeEnum(FilterOperator).optional(),
})

export type Filter = z.infer<typeof Filter>

export const ListRecordsRequest = z.object({
    tableId: z.string(),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    filters: OptionalArrayFromQuery(Filter),
})

export type ListRecordsRequest = Omit<z.infer<typeof ListRecordsRequest>, 'cursor'> & { cursor: Cursor | undefined }

export const DeleteRecordsRequest = z.object({
    tableId: z.string(),
    ids: z.array(z.string()),
})

export type DeleteRecordsRequest = z.infer<typeof DeleteRecordsRequest>

