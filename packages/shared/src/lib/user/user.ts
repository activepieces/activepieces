import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { UserBadge } from './badges'

export type UserId = ApId

export enum PlatformRole {
    /**
     * Platform administrator with full control over platform settings,
     * users, and all projects
     */
    ADMIN = 'ADMIN',
    /**
     * Regular platform member with access only to projects they are
     * explicitly invited to
     */
    MEMBER = 'MEMBER',
    /**
     * Platform operator with automatic access to all projects except (others' private projects) in the
     * platform but no platform administration capabilities
     */
    OPERATOR = 'OPERATOR',
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
    platformRole: Type.Enum(PlatformRole),
    status: Type.Enum(UserStatus),
    identityId: Type.String(),
    externalId: Nullable(Type.String()),
    platformId: Nullable(Type.String()),
    lastActiveDate: Nullable(Type.String()),
})

export type User = Static<typeof User>

export const UserWithMetaInformation = Type.Object({
    id: Type.String(),
    email: Type.String(),
    firstName: Type.String(),
    status: Type.Enum(UserStatus),
    externalId: Nullable(Type.String()),
    platformId: Nullable(Type.String()),
    platformRole: Type.Enum(PlatformRole),
    lastName: Type.String(),
    created: Type.String(),
    updated: Type.String(),
    lastActiveDate: Nullable(Type.String()),
})

export type UserWithMetaInformation = Static<typeof UserWithMetaInformation>


export const UserWithBadges = Type.Object({
    ...UserWithMetaInformation.properties,
    badges: Type.Array(Type.Pick(UserBadge, ['name', 'created'])),
})

export type UserWithBadges = Static<typeof UserWithBadges>