import { AIProviderName, BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'

const KnowledgeBaseFile = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    fileId: z.string(),
    displayName: z.string(),
})

export const KnowledgeBaseEmbeddingSource = z.object({
    provider: Nullable(z.enum(AIProviderName)),
    modelId: Nullable(z.string()),
})

export type KnowledgeBaseFile = z.infer<typeof KnowledgeBaseFile>
export type KnowledgeBaseEmbeddingSource = z.infer<typeof KnowledgeBaseEmbeddingSource>
