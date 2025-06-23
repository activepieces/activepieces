import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'


export enum UserIdentityProvider {
    EMAIL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    SAML = 'SAML',
    JWT = 'JWT',
}
export const UserIdentity = Type.Object({
    ...BaseModelSchema,
    firstName: Type.String(),
    lastName: Type.String(),
    email: Type.String(),
    password: Type.String(),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
    verified: Type.Boolean(),
    tokenVersion: Type.Optional(Type.String()),
    provider: Type.Enum(UserIdentityProvider),
})

export type UserIdentity = Static<typeof UserIdentity>
