import { BaseModelSchema, PlatformRole, ProjectMemberRole } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

enum InvitationType {
    PLATFORM = 'PLATFORM',
    PROJECT = 'PROJECT',
}

export const UserInvitation = Type.Object({
    ...BaseModelSchema,
    email: Type.String(),
    type: Type.Enum(InvitationType),
    platformId: Type.String(),
    platformRole: Type.Enum(PlatformRole),
    projectId: Type.Optional(Type.String()),
    projectRole: Type.Optional(Type.Enum(ProjectMemberRole)),
});

export type UserInvitation = Static<typeof UserInvitation>;

export const SendUserInvitationRequest = Type.Object({
    email: Type.String(),
    type: Type.Enum(InvitationType),
    platformId: Type.String(),
    platformRole: Type.Enum(PlatformRole),
    projectId: Type.Optional(Type.String()),
    projectRole: Type.Optional(Type.Enum(ProjectMemberRole)),
})

export type SendUserInvitationRequest = Static<typeof SendUserInvitationRequest>;

export const DeleteUserInvitationRequest = Type.Object({
    email: Type.String(),
    platformId: Type.String(),
    projectId: Type.Optional(Type.String()),
})

export type DeleteUserInvitationRequest = Static<typeof DeleteUserInvitationRequest>;
