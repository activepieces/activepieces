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
    platformRole: Type.Optional(Type.Union([Type.Enum(PlatformRole), Type.Null()])),
    projectId: Type.Optional(Type.String()),
    projectRole: Type.Optional(Type.Union([Type.Enum(ProjectMemberRole), Type.Null()])),
})

export type UserInvitation = Static<typeof UserInvitation>

export const UserInvitationWithLink = Type.Composite([UserInvitation, Type.Object({
    link: Type.Optional(Type.String()),
})])

export type UserInvitationWithLink = Static<typeof UserInvitationWithLink>

export const SendUserInvitationRequest = Type.Object({
    email: Type.String(),
    type: Type.Enum(InvitationType),
    platformRole: Type.Optional(Type.Enum(PlatformRole)),
    projectRole: Type.Optional(Type.Enum(ProjectMemberRole)),
})

export type SendUserInvitationRequest = Static<typeof SendUserInvitationRequest>

export const AcceptUserInvitationRequest = Type.Object({
    invitationToken: Type.String(),
})

export type AcceptUserInvitationRequest = Static<typeof AcceptUserInvitationRequest>

export const ListUserInvitationsRequest = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
    type: Type.Enum(InvitationType),
    status: Type.Optional(Type.Enum(InvitationStatus)),
})

export type ListUserInvitationsRequest = Static<typeof ListUserInvitationsRequest>
