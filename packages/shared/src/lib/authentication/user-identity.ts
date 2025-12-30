import { Static, Type } from '@sinclair/typebox'


export enum UserIdentityProvider {
    EMAIL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    SAML = 'SAML',
    JWT = 'JWT',
}
export const UserIdentity = Type.Object({
    id: Type.String(),
    createdAt: Type.Date(),
    updatedAt: Type.Date(),

    firstName: Type.String(),
    lastName: Type.String(),
    email: Type.String(),
    password: Type.Optional(Type.String()),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
    emailVerified: Type.Boolean(),
    tokenVersion: Type.Optional(Type.String()),
    provider: Type.Enum(UserIdentityProvider),
})

export type UserIdentity = Static<typeof UserIdentity>
