import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const Record = Type.Object({
    ...BaseModelSchema,
    tableId: Type.String(),
})

export type Record = Static<typeof Record>
