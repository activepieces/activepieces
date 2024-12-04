import { Type, Static } from "@sinclair/typebox";

export const AcceptInvitationRequest = Type.Object({
    token: Type.String()
})
export type AcceptInvitationRequest = Static<typeof AcceptInvitationRequest>;

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


export const UpdateProjectMemberRoleRequestBody = Type.Object({
    role: Type.String(),
})

export type UpdateProjectMemberRoleRequestBody = Static<typeof UpdateProjectMemberRoleRequestBody>
