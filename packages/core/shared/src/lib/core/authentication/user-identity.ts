import { BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'


export enum UserIdentityProvider {
    EMAIL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    SAML = 'SAML',
    JWT = 'JWT',
}
export const UserIdentity = z.object({
    ...BaseModelSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
    trackEvents: z.boolean(),
    newsLetter: z.boolean(),
    verified: z.boolean(),
    tokenVersion: z.string().optional(),
    provider: z.nativeEnum(UserIdentityProvider),
    imageUrl: Nullable(z.string()),
    lastLoggedInPlatformId: Nullable(z.string()),
})

export type UserIdentity = z.infer<typeof UserIdentity>
