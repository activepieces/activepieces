import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Cell } from './cell'

export const ApRecord = Type.Object({
    ...BaseModelSchema,
    tableId: Type.String(),
    projectId: Type.String(),
    //record<fieldId, cell>
    cells: Type.Record(Type.String(), Cell),
})

export type ApRecord = Static<typeof ApRecord>