import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
}

export const Field = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    type: Type.Enum(FieldType),
    tableId: Type.String(),
    projectId: Type.String(),
})

export type Field = Static<typeof Field>