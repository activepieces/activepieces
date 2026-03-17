import { z } from 'zod'
import { BaseModelSchema } from '../../core/common'

enum KnowledgeBaseFileStatusEnum {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

const KnowledgeBaseFile = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    fileId: z.string(),
    displayName: z.string(),
    status: z.nativeEnum(KnowledgeBaseFileStatusEnum),
    error: z.string().nullable(),
    chunkCount: z.number(),
})

export const KnowledgeBaseFileStatus = KnowledgeBaseFileStatusEnum
export type KnowledgeBaseFileStatus = KnowledgeBaseFileStatusEnum
export type KnowledgeBaseFile = z.infer<typeof KnowledgeBaseFile>
