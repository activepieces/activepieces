import { z } from 'zod'
import { BaseModelSchema, DateOrString, Nullable } from '../common/base-model'
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
     * Platform operator with automatic access to all projects without editior permission, except (others' private projects) in the
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

export const EmailType = z.string().email()

export const PasswordType = z.string().min(8).max(64)

export const User = z.object({
    ...BaseModelSchema,
    platformRole: z.nativeEnum(PlatformRole),
    status: z.nativeEnum(UserStatus),
    identityId: z.string(),
    externalId: Nullable(z.string()),
    platformId: Nullable(z.string()),
    lastActiveDate: Nullable(DateOrString),
})

export type User = z.infer<typeof User>

export const UserWithMetaInformation = z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    status: z.enum(UserStatus),
    externalId: Nullable(z.string()),
    platformId: Nullable(z.string()),
    platformRole: z.enum(PlatformRole),
    lastName: z.string(),
    created: DateOrString,
    updated: DateOrString,
    lastActiveDate: Nullable(DateOrString),
    imageUrl: Nullable(z.string()),
})

export type UserWithMetaInformation = z.infer<typeof UserWithMetaInformation>


export const UserWithBadges = z.object({
    ...UserWithMetaInformation.shape,
    badges: z.array(UserBadge.pick({ name: true, created: true })),
})

export type UserWithBadges = z.infer<typeof UserWithBadges>

export const AP_MAXIMUM_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024 // 5 MB

export const PROFILE_PICTURE_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]

export const UpdateMeRequestBody = z.object({
    profilePicture: z.any().optional(),
})

export type UpdateMeRequestBody = z.infer<typeof UpdateMeRequestBody>

export const UpdateMeResponse = z.object({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    trackEvents: z.boolean(),
    newsLetter: z.boolean(),
    imageUrl: Nullable(z.string()),
})

export type UpdateMeResponse = z.infer<typeof UpdateMeResponse>
