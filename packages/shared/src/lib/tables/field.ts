import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    STATIC_DROPDOWN = 'STATIC_DROPDOWN',
}

export const Field = Type.Union([Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    externalId: Type.String(),
    type: Type.Literal(FieldType.STATIC_DROPDOWN),
    tableId: Type.String(),
    projectId: Type.String(),
    data: Type.Object({
        options: Type.Array(Type.Object({
            value: Type.String(),
        })),
    }),
}), Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    externalId: Type.String(),
    type: Type.Union([Type.Literal(FieldType.TEXT), Type.Literal(FieldType.NUMBER), Type.Literal(FieldType.DATE)]),
    tableId: Type.String(),
    projectId: Type.String(),
})])

export type Field = Static<typeof Field>

export const StaticDropdownEmptyOption = {
    label: '',
    value: '',
}