import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { ProjectMemberRole } from '../project'
import { PlatformRole } from '../user/index'

export enum InvitationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
}

export const UserInvitation = Type.Object({
    ...BaseModelSchema,
    email: Type.String(),
    status: Type.Enum(InvitationStatus),
    type: Type.Enum(InvitationType),
    platformId: Type.String(),
    platformRole: Type.Optional(Type.Enum(PlatformRole)),
    projectId: Type.Optional(Type.String()),
    projectRole: Type.Optional(Type.Enum(ProjectMemberRole)),
})

export type UserInvitation = Static<typeof UserInvitation>

export const SendUserInvitationRequest = Type.Object({
    email: Type.String(),
    type: Type.Enum(InvitationType),
    platformId: Type.String(),
    platformRole: Type.Enum(PlatformRole),
    projectId: Type.Optional(Type.String()),
    projectRole: Type.Optional(Type.Enum(ProjectMemberRole)),
})

export type SendUserInvitationRequest = Static<typeof SendUserInvitationRequest>

export const AcceptUserInvitationRequest = Type.Object({
    invitationToken: Type.String(),
})

export type AcceptUserInvitationRequest = Static<typeof AcceptUserInvitationRequest>