import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'

export type UserId = ApId

export enum UserStatus {
    /* user registered but didn't verify their email */
    CREATED = 'CREATED',
    /* user invited but didn't accept the invitation */
    INVITED = 'INVITED',
    /* user registered and verified their email or accepted the invitation */
    VERIFIED = 'VERIFIED',
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
    status: Type.Enum(UserStatus),
    imageUrl: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
    externalId: Type.Optional(Type.String()),
    platformId: Type.Union([ApId, Type.Null()]),
})

export type User = Static<typeof User>

export const UserMeta = Type.Object({
    id: Type.String(),
    email: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    imageUrl: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
})

export type UserMeta = Static<typeof UserMeta>
