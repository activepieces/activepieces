import { Static, Type } from '@sinclair/typebox'
import { Cursor } from '../../common/seek-page'

export const CreateRecordsRequest = Type.Object({
    records: Type.Array(Type.Array(Type.Object({
        key: Type.String(),
        value: Type.String(),
    }))),
    tableId: Type.String(),
})

export type CreateRecordsRequest = Static<typeof CreateRecordsRequest>

export const UpdateRecordRequest = Type.Object({
    cells: Type.Optional(Type.Array(Type.Object({
        key: Type.String(),
        value: Type.String(),
    }))),
    tableId: Type.String(),
})

export type UpdateRecordRequest = Static<typeof UpdateRecordRequest>

export const ListRecordsRequest = Type.Object({
    tableId: Type.String(),
    limit: Type.Optional(Type.Number({})),
    cursor: Type.Optional(Type.String({})),
})

export type ListRecordsRequest = Omit<Static<typeof ListRecordsRequest>, 'cursor'> & { cursor: Cursor | undefined }
