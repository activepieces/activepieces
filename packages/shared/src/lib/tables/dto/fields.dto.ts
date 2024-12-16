import { Static, Type } from '@sinclair/typebox'
import { FieldType } from '../field'

export const CreateFieldRequest = Type.Object({
    fields: Type.Array(Type.Object({
        name: Type.String(),
        type: Type.Enum(FieldType),
    })),
})

export type CreateFieldRequest = Static<typeof CreateFieldRequest>
