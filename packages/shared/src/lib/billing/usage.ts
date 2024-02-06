import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";

export type ProjectUsageId = string;

export const ProjectUsage = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    consumedTasks: Type.Number(),
    connections: Type.Number(),
    teamMembers: Type.Number(),
    consumedTasksToday: Type.Number(),
    nextResetDatetime: Type.String(),
})

export type ProjectUsage = Static<typeof ProjectUsage>;

export const ListProjectUsageRequest = Type.Object({
    limit: Type.Optional(Type.Number({})),
    projectIds: Type.Optional(Type.Array(Type.String({}))),
    cursor: Type.Optional(Type.String({})),
})

export type ListProjectUsageRequest = Static<typeof ListProjectUsageRequest> & { cursor: Cursor }
