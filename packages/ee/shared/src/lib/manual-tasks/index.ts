import { BaseModelSchema, Nullable } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const StatusOption = Type.Object({
    name: Type.String(),
    description: Nullable(Type.String()),
    color: Type.String(),
})

export type StatusOption = Static<typeof StatusOption>

export const ManualTask = Type.Object({
    ...BaseModelSchema,
    title: Type.String(),
    description: Nullable(Type.String()),
    status: StatusOption,
    statusOptions: Type.Array(StatusOption),
    platformId: Type.String(),
    projectId: Type.String(),
    flowId: Type.String(),
    runId: Type.String(),
    assigneeId: Nullable(Type.String()),
})

export type ManualTask = Static<typeof ManualTask>

export const ManualTaskComment = Type.Object({
    ...BaseModelSchema,
    taskId: Type.String(),
    userId: Type.String(),
    comment: Type.String(),
})

export type ManualTaskComment = Static<typeof ManualTaskComment>


