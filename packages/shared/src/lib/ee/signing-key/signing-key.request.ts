import { z } from 'zod'

export const AddSigningKeyRequestBody = z.object({
    displayName: z.string(),
})

export type AddSigningKeyRequestBody = z.infer<typeof AddSigningKeyRequestBody>
