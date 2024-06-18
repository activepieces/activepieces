import { Type, Static } from "@sinclair/typebox";
import { ProjectMemberRole } from "@activepieces/shared";

export const AcceptInvitationRequest = Type.Object({
    token: Type.String()
})
export type AcceptInvitationRequest = Static<typeof AcceptInvitationRequest>;

export const UpsertProjectMemberRequestBody = Type.Object({
    projectId: Type.String(),
    userId: Type.String(),
    role: Type.Enum(ProjectMemberRole),
});

export type UpsertProjectMemberRequestBody = Static<typeof UpsertProjectMemberRequestBody>;

export const ListProjectMembersRequestQuery = Type.Object({
    projectId: Type.String(),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
});

export type ListProjectMembersRequestQuery = Static<typeof ListProjectMembersRequestQuery>;

export const AcceptProjectResponse = Type.Object({
    registered: Type.Boolean(),
});

export type AcceptProjectResponse = Static<typeof AcceptProjectResponse>;
