import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";

export type ProjectMemberId = string;

export enum ProjectMemberRole {
    BUILDER = "BUILDER"
}

export enum ProjectMemberStatus {
    ACTIVE = "ACTIVE",
    INVITATION_PENDING = "INVITATION_PENDING",
}

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    userId: Type.String(),
    projectId: Type.String(),
    role: Type.Enum(ProjectMemberRole),
    status: Type.Enum(ProjectMemberStatus),
});

export type ProjectMember = Static<typeof ProjectMember>;
