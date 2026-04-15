import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'

export const Cell = z.object({
    ...BaseModelSchema,
    recordId: z.string(),
    fieldId: z.string(),
    projectId: z.string(),
    value: z.unknown(),
})

export type Cell = z.infer<typeof Cell>
