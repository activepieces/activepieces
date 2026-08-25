import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { Cell } from './cell'

export const Record = z.object({
    ...BaseModelSchema,
    tableId: z.string(),
    projectId: z.string(),
})

export type Record = z.infer<typeof Record>

export const PopulatedRecord = Record.extend({
    cells: z.record(z.string(), Cell.pick({ updated: true, created: true, value: true }).extend({
        fieldName: z.string(),
    })),
})

export type PopulatedRecord = z.infer<typeof PopulatedRecord>
