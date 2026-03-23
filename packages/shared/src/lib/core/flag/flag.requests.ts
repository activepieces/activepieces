import { z } from 'zod'

export const UpdateTemplatesCategoriesFlagRequestBody = z.object({
    value: z.array(z.string()),
})
export type UpdateTemplatesCategoriesFlagRequestBody = z.infer<typeof UpdateTemplatesCategoriesFlagRequestBody>
