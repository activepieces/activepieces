import { Static, Type } from '@sinclair/typebox'

export const CreateTableRequest = Type.Object({
    name: Type.String(),
})

export type CreateTableRequest = Static<typeof CreateTableRequest>

export const ExportTableResponse = Type.Object({
    fields: Type.Array(Type.Object({ id: Type.String(), name: Type.String() })),
    rows: Type.Array(Type.Record(Type.String(), Type.String())),
})

export type ExportTableResponse = Static<typeof ExportTableResponse>
