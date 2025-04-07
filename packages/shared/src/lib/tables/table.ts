import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Field } from './field'

export const Table = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    projectId: Type.String(),
})

export type Table = Static<typeof Table>

export const PopulatedTable = Type.Composite([Table, Type.Object({
    fields: Type.Array(Field),
})])

export type PopulatedTable = Static<typeof PopulatedTable>