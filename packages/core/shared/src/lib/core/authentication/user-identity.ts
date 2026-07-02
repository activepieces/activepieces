import { BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'


export enum UserIdentityProvider {
    EMAIL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    SAML = 'SAML',
    JWT = 'JWT',
}
export const UiPreferences = z.object({
    browseScope: z.enum(['recent', 'project']).optional(),
    browseFilter: z.enum(['all', 'flows', 'tables']).optional(),
    browseProjectId: z.string().optional(),
    pinProjectSidebar: z.boolean().optional(),
})

export type UiPreferences = z.infer<typeof UiPreferences>

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
    uiPreferences: Nullable(UiPreferences),
})

export type UserIdentity = z.infer<typeof UserIdentity>
