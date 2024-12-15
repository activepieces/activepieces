import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { Cell } from './dto/records.dto'

export const Record = Type.Object({
    ...BaseModelSchema,
    cells: Type.Array(Cell),
})

export type Record = Static<typeof Record>
