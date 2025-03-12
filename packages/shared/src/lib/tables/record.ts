import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Cell } from './cell'

export const Record = Type.Object({
    ...BaseModelSchema,
    tableId: Type.String(),
    projectId: Type.String(),
})

export type Record = Static<typeof Record>

export const PopulatedRecord = Type.Composite([
    Record,
    Type.Object({
        cells: Type.Record(Type.String(), Type.Composite([
            Type.Pick(Cell, ['updated', 'created', 'value']),
            Type.Object({
                fieldName: Type.String(),
            }),
        ])),
    }),
])

export type PopulatedRecord = Static<typeof PopulatedRecord>
