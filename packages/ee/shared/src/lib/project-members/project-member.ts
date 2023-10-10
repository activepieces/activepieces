import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";
import { ProjectMemberRole } from "./project-member-role";

export type ProjectMemberId = string;

export enum ProjectMemberStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
}

export const ProjectMember = Type.Object({
    ...BaseModelSchema,
    userId: Type.String(),
    email: Type.String(),
    projectId: Type.String(),
    role: Type.Enum(ProjectMemberRole),
    status: Type.Enum(ProjectMemberStatus),
});

export type ProjectMember = Static<typeof ProjectMember>;