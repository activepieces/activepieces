import { Static, Type } from "@sinclair/typebox";
import { ApId, BaseModelSchema, Nullable, ProjectMemberRole } from "@activepieces/shared";

export type ProjectMemberId = string;

export enum ProjectMemberStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
}

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    email: Type.String(),
    platformId: Nullable(ApId),
    projectId: Type.String(),
    role: Type.Enum(ProjectMemberRole),
    status: Type.Enum(ProjectMemberStatus),
}, {
    description: "Project member is which user is assigned to a project."
});

export type ProjectMember = Static<typeof ProjectMember>;
