import { z } from 'zod'

export const ManagedAuthnRequestBody = z.object({
    //if you change this you need to update the embed-sdk I can't import it there because it can't have dependencies
    externalAccessToken: z.string(),
})

export type ManagedAuthnRequestBody = z.infer<typeof ManagedAuthnRequestBody>
