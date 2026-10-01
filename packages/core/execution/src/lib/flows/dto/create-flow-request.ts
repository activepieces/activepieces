import { z } from 'zod'
import { formErrors, Metadata, SAFE_EXTERNAL_ID_PATTERN } from '@activepieces/core-utils'

export const CreateFlowRequest = z.object({
    displayName: z.string(),
    /**If folderId is provided, folderName is ignored */
    folderId: z.string().optional(),
    folderName: z.string().optional(),
    projectId: z.string(),
    templateId: z.string().optional(),
    metadata: z.optional(Metadata),
    externalId: z.string().regex(SAFE_EXTERNAL_ID_PATTERN, formErrors.invalidExternalId).optional(),
})

export type CreateFlowRequest = z.infer<typeof CreateFlowRequest>
