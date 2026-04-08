import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'

const KnowledgeBaseFile = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    fileId: z.string(),
    displayName: z.string(),
})

export type KnowledgeBaseFile = z.infer<typeof KnowledgeBaseFile>
