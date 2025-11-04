import { Static, Type } from '@sinclair/typebox'
import { FieldType } from '../field'


const StaticDropdownData = Type.Object({
    options: Type.Array(Type.Object({
        value: Type.String(),
    })),
})

export const CreateFieldRequest = Type.Union([Type.Object({
    name: Type.String(),
    type: Type.Literal(FieldType.STATIC_DROPDOWN),
    tableId: Type.String(),
    data: StaticDropdownData,
    externalId: Type.Optional(Type.String()),
}), Type.Object({
    name: Type.String(),
    type: Type.Union([Type.Literal(FieldType.TEXT), Type.Literal(FieldType.NUMBER), Type.Literal(FieldType.DATE)]),
    tableId: Type.String(),
    externalId: Type.Optional(Type.String()),
})])

export const UpdateFieldRequest = Type.Object({
    name: Type.String(),
})

export type CreateFieldRequest = Static<typeof CreateFieldRequest>
export type UpdateFieldRequest = Static<typeof UpdateFieldRequest>
