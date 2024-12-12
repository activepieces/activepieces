import { Static, Type } from '@sinclair/typebox'

export enum FieldType {
    NUMBER = 'NUMBER',
    TEXT = 'TEXT',
    DATE = 'DATE',
    JSON = 'JSON',
}

export const Field = Type.Object({
    name: Type.String(),
    type: Type.Enum(FieldType),
})

export type Field = Static<typeof Field>

export const CreateFieldRequest = Type.Object({
    fields: Type.Array(Field),
})

export type CreateFieldRequest = Static<typeof CreateFieldRequest>
