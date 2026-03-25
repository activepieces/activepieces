import { z } from 'zod'

export const CreateMCPServerFromStepParams = z.object({
    flowId: z.string(),
    flowVersionId: z.string(),
    stepName: z.string(),
})
export type CreateMCPServerFromStepParams = z.infer<typeof CreateMCPServerFromStepParams>
