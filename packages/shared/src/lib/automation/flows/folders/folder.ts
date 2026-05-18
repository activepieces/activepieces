import { z } from 'zod'
import { BaseModelSchema } from '../../../core/common'

export type FolderId = string

export const Folder = z.object({
    ...BaseModelSchema,
    id: z.string(),
    projectId: z.string(),
    displayName: z.string(),
    displayOrder: z.number(),
})

export const UncategorizedFolderId = 'NULL'
export type Folder = z.infer<typeof Folder>

export type FolderDto = Folder & { numberOfFlows: number }

