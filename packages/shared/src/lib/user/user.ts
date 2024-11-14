import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'

export type UserId = ApId

export enum PlatformRole {
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
}

export enum UserStatus {
    /* user is active */
    ACTIVE = 'ACTIVE',
    /* user account deactivated */
    INACTIVE = 'INACTIVE',
}

export const EmailType = Type.String({
    format: 'email',
})

export const PasswordType = Type.String({
    minLength: 8,
    maxLength: 64,
})

export const User = Type.Object({
    ...BaseModelSchema,
    email: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
    password: Type.String(),
    verified: Type.Boolean(),
    platformRole: Type.Enum(PlatformRole),
    status: Type.Enum(UserStatus),
    externalId: Type.Optional(Type.String()),
    platformId: Nullable(Type.String()),
    tokenVersion: Type.Optional(Type.String()),
})

export type User = Static<typeof User>

export const UserMeta = Type.Object({
    id: Type.String(),
    email: Type.String(),
    firstName: Type.String(),
    platformId: Nullable(Type.String()),
    platformRole: Type.Enum(PlatformRole),
    lastName: Type.String(),
})

export type UserMeta = Static<typeof UserMeta>
