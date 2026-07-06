import { z } from 'zod'


export const GetFlowTemplateRequestQuery = z.object({
    versionId: z.string().optional(),
})

export type GetFlowTemplateRequestQuery = z.infer<typeof GetFlowTemplateRequestQuery>
