import { Type, Static } from "@sinclair/typebox";
import { ProjectMemberRole } from "./project-member-role";

export const AcceptInvitationRequest = Type.Object({
    token: Type.String()
})
export type AcceptInvitationRequest = Static<typeof AcceptInvitationRequest>;

export const SendInvitationRequest = Type.Object({
    email: Type.String(),
    role: Type.Enum(ProjectMemberRole),
});

export type SendInvitationRequest = Static<typeof SendInvitationRequest>;

export const ListProjectMembersRequest = Type.Object({
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
});

export type ListProjectMembersRequest = Static<typeof ListProjectMembersRequest>;