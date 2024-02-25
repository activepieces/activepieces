import { Type, Static } from "@sinclair/typebox";
import { ProjectMemberRole } from "@activepieces/shared";
import { ProjectMemberStatus } from "./project-member";

export const AcceptInvitationRequest = Type.Object({
    token: Type.String()
})
export type AcceptInvitationRequest = Static<typeof AcceptInvitationRequest>;

export const AddProjectMemberRequestBody = Type.Object({
    projectId: Type.String(),
    email: Type.String(),
    role: Type.Enum(ProjectMemberRole),
    status: Type.Optional(Type.Enum(ProjectMemberStatus, { default: ProjectMemberStatus.PENDING })),
});

export type AddProjectMemberRequestBody = Static<typeof AddProjectMemberRequestBody>;

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
