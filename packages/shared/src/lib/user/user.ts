import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common/base-model'
import { ApId } from '../common/id-generator'

export type UserId = ApId

export enum UserStatus {
    VERIFIED = 'VERIFIED',

    /**
   * A user that was invited to a project but has not yet accepted the invitation.
   */
    SHADOW = 'SHADOW',

    /**
   * A user using managed authentication.
   */
    EXTERNAL = 'EXTERNAL',
}

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
