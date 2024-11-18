import { Static, Type } from "@sinclair/typebox";
import { ApId, BaseModelSchema, Rbac, UserMeta } from "@activepieces/shared";

export type ProjectMemberId = string;

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    platformId: ApId,
    userId: ApId,
    projectId: Type.String(),
    projectRole: Rbac,
}, {
    description: "Project member is which user is assigned to a project."
});

export type ProjectMember = Static<typeof ProjectMember>;

export const ProjectMemberWithUser = Type.Composite([ProjectMember, Type.Object({
    user: UserMeta
})])

export type ProjectMemberWithUser = Static<typeof ProjectMemberWithUser>;