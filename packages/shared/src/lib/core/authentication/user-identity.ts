import { z } from 'zod'
import { Nullable } from '../common'


export enum UserIdentityProvider {
    EMAIL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    SAML = 'SAML',
    JWT = 'JWT',
}
export const UserIdentity = z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string().optional(),
    trackEvents: z.boolean(),
    newsLetter: z.boolean(),
    emailVerified: z.boolean(),
    tokenVersion: z.string().optional(),
    provider: z.nativeEnum(UserIdentityProvider),
    imageUrl: Nullable(z.string()),
    twoFactorEnabled: z.boolean().optional(),
})

export type UserIdentity = z.infer<typeof UserIdentity>
