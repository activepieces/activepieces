import { Static, Type } from '@sinclair/typebox'
import { FieldType } from '../field'

export const CreateFieldRequest = Type.Object({
    name: Type.String(),
    type: Type.Enum(FieldType),
    tableId: Type.String(),
    position: Type.Optional(Type.Number()),
})

export type CreateFieldRequest = Static<typeof CreateFieldRequest>
