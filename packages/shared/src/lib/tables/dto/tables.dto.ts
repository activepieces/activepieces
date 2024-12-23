import { Static, Type } from '@sinclair/typebox'

export const CreateTableRequest = Type.Object({
    name: Type.String(),
})

export type CreateTableRequest = Static<typeof CreateTableRequest>
