import { Static, Type } from '@sinclair/typebox'

export const CreateRecordsRequest = Type.Object({
    records: Type.Array(Type.Array(Type.Object({
        key: Type.String(),
        value: Type.String(),
    }))),
})

export type CreateRecordsRequest = Static<typeof CreateRecordsRequest>

export const UpdateRecordRequest = Type.Object({
    cells: Type.Optional(Type.Array(Type.Object({
        key: Type.String(),
        value: Type.String(),
    }))),
})

export type UpdateRecordRequest = Static<typeof UpdateRecordRequest>