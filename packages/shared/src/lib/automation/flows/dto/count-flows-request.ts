import { z } from 'zod'

export const CountFlowsRequest = z.object({
    projectId: z.string(),
    folderId: z.string().optional(),
})

export type CountFlowsRequest = z.infer<typeof CountFlowsRequest>
