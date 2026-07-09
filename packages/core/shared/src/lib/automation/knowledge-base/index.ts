import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

const KnowledgeBaseFile = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    fileId: z.string(),
    displayName: z.string(),
})

export type KnowledgeBaseFile = z.infer<typeof KnowledgeBaseFile>
