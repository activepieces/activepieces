import { ApId, BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

export const ConcurrencyPool = z.object({
    ...BaseModelSchema,
    platformId: ApId,
    key: z.string(),
    maxConcurrentJobs: z.number().int().positive(),
})
export type ConcurrencyPool = z.infer<typeof ConcurrencyPool>
