import { Static, Type } from '@sinclair/typebox'

export const Cell = Type.Object({
    key: Type.String(),
    value: Type.String(),
})

export type Cell = Static<typeof Cell>

export const CreateRecordsRequest = Type.Object({
    records: Type.Array(Type.Array(Cell)),
})

export type CreateRecordsRequest = Static<typeof CreateRecordsRequest>

export const UpdateRecordRequest = Type.Object({
    cells: Type.Optional(Type.Array(Cell)),
})

export type UpdateRecordRequest = Static<typeof UpdateRecordRequest>