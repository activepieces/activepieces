import { z } from 'zod'
import { Metadata } from '@activepieces/core-utils'

export const CreateFlowRequest = z.object({
    displayName: z.string(),
    /**If folderId is provided, folderName is ignored */
    folderId: z.string().optional(),
    folderName: z.string().optional(),
    projectId: z.string(),
    templateId: z.string().optional(),
    metadata: z.optional(Metadata),
})

export type CreateFlowRequest = z.infer<typeof CreateFlowRequest>
