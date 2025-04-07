import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Cell } from './cell'

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    STATIC_DROPDOWN = 'STATIC_DROPDOWN',
}

const FieldCommonSchema ={
    ...BaseModelSchema,
    cells: Type.Array(Cell),
    name: Type.String(),
    tableId: Type.String(),
    projectId: Type.String(),
}


export const Field = Type.Union([
    Type.Object({
        ...FieldCommonSchema,
        type: Type.Literal(FieldType.STATIC_DROPDOWN),
         data: Type.Object({
           options: Type.Array(Type.Object({
            value: Type.String(),
        })),
    }),
}), Type.Object({
    ...FieldCommonSchema,
    type: Type.Union([Type.Literal(FieldType.TEXT), Type.Literal(FieldType.NUMBER), Type.Literal(FieldType.DATE)]),
})])

export type Field = Static<typeof Field>

export const StaticDropdownEmptyOption = {
    label: '',
    value: '',
}