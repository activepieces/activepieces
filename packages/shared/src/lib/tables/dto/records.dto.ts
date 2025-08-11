import { Static, Type } from '@sinclair/typebox'
import { Cursor } from '../../common/seek-page'

export const CreateRecordsRequest = Type.Object({
    records: Type.Array(Type.Array(Type.Object({
        fieldId: Type.String(),
        value: Type.String(),
    }))),
    tableId: Type.String(),
})

export type CreateRecordsRequest = Static<typeof CreateRecordsRequest>

export const UpdateRecordRequest = Type.Object({
    cells: Type.Optional(Type.Array(Type.Object({
        fieldId: Type.String(),
        value: Type.String(),
    }))),
    tableId: Type.String(),
    agentUpdate: Type.Optional(Type.Boolean()),
})

export type UpdateRecordRequest = Static<typeof UpdateRecordRequest>


export enum FilterOperator {
    EQ = 'eq',
    NEQ = 'neq',
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    CO = 'co',
}

export const Filter = Type.Object({
    fieldId: Type.String(),
    value: Type.String(),
    operator: Type.Optional(Type.Enum(FilterOperator)),
})

export type Filter = Static<typeof Filter>

export const ListRecordsRequest = Type.Object({
    tableId: Type.String(),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
    filters: Type.Optional(Type.Array(Filter)),
})

export type ListRecordsRequest = Omit<Static<typeof ListRecordsRequest>, 'cursor'> & { cursor: Cursor | undefined }

export const DeleteRecordsRequest = Type.Object({
    ids: Type.Array(Type.String()),
})

export type DeleteRecordsRequest = Static<typeof DeleteRecordsRequest>

