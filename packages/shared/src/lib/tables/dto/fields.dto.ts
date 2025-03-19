import { Static, Type } from '@sinclair/typebox'
import { FieldType } from '../field'

export const CreateFieldRequest = Type.Object({
    name: Type.String(),
    type: Type.Enum(FieldType),
    tableId: Type.String(),
})

export const UpdateFieldRequest = Type.Object({
    name: Type.String(),
})

export type CreateFieldRequest = Static<typeof CreateFieldRequest>
export type UpdateFieldRequest = Static<typeof UpdateFieldRequest>
