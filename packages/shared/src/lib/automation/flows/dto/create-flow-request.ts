import { z } from 'zod'
import { Metadata } from '../../../core/common/metadata'

export const CreateFlowRequest = z.object({
    displayName: z.string(),
    /**If folderId is provided, folderName is ignored */
    folderId: z.string().optional(),
    folderName: z.string().optional(),
    projectId: z.string(),
    templateId: z.string().optional(),
    metadata: Metadata.optional(),
})

export type CreateFlowRequest = z.infer<typeof CreateFlowRequest>
