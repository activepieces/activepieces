import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { TableColorSchema } from './table-color'

export const Cell = z.object({
    ...BaseModelSchema,
    recordId: z.string(),
    fieldId: z.string(),
    projectId: z.string(),
    value: z.unknown(),
    color: TableColorSchema.nullish(),
})

export type Cell = z.infer<typeof Cell>
