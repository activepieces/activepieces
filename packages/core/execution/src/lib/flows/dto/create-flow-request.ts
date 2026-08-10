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
    /**Optional stable identifier for the flow. When omitted the server generates one.
     * Lets callers (e.g. git-sync / external deploy tooling) create a flow with a known
     * externalId so redeploys can find and update it in place instead of duplicating. */
    externalId: z.string().optional(),
})

export type CreateFlowRequest = z.infer<typeof CreateFlowRequest>
