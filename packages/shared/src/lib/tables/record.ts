import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Cell } from './cell'

export const ApRecord = Type.Object({
    ...BaseModelSchema,
    tableId: Type.String(),
    projectId: Type.String(),
    //record<fieldId, cell>
    cells: Type.Record(Type.String(), Type.Composite([
        Type.Pick(Cell, ['updated', 'created', 'value'])
    ])),
})

export type ApRecord = Static<typeof ApRecord>