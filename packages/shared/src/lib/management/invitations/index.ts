import { z } from 'zod'
import { BaseModelSchema, Nullable, NullableEnum } from '../../core/common'
import { PlatformRole } from '../../core/user/index'
import { ProjectRole } from '../project-role/project-role'

export enum InvitationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
}

export const UserInvitation = z.object({
    ...BaseModelSchema,
    email: z.string(),
    status: z.nativeEnum(InvitationStatus),
    type: z.nativeEnum(InvitationType),
    platformId: z.string(),
    platformRole: NullableEnum(PlatformRole),
    projectId: Nullable(z.string()),
    projectRoleId: Nullable(z.string()),
    projectRole: Nullable(ProjectRole),
})

export type UserInvitation = z.infer<typeof UserInvitation>

export const UserInvitationWithLink = UserInvitation.extend({
    link: z.string().optional(),
})

export type UserInvitationWithLink = z.infer<typeof UserInvitationWithLink>

export const SendUserInvitationRequest = z.union([
    z.object({
        type: z.literal(InvitationType.PROJECT),
        email: z.string(),
        projectId: z.string(),
        projectRole: z.string(),
    }),
    z.object({
        type: z.literal(InvitationType.PLATFORM),
        email: z.string(),
        platformRole: z.nativeEnum(PlatformRole),
    }),
])


export type SendUserInvitationRequest = z.infer<typeof SendUserInvitationRequest>

export const AcceptUserInvitationRequest = z.object({
    invitationToken: z.string(),
})

export type AcceptUserInvitationRequest = z.infer<typeof AcceptUserInvitationRequest>

export const ListUserInvitationsRequest = z.object({
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
    type: z.nativeEnum(InvitationType),
    projectId: Nullable(z.string()),
    status: z.nativeEnum(InvitationStatus).optional(),
})

export type ListUserInvitationsRequest = z.infer<typeof ListUserInvitationsRequest>
