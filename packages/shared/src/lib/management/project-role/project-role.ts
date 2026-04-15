import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'

export const ProjectRole = z.object({
    ...BaseModelSchema,
    name: z.string(),
    permissions: z.array(z.string()),
    platformId: Nullable(z.string()),
    type: z.string(),
    userCount: z.number().optional(),
})

export type ProjectRole = z.infer<typeof ProjectRole>
