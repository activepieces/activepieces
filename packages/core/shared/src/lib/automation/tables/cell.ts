import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

export const Cell = z.object({
    ...BaseModelSchema,
    recordId: z.string(),
    fieldId: z.string(),
    projectId: z.string(),
    value: z.unknown(),
})

export type Cell = z.infer<typeof Cell>
