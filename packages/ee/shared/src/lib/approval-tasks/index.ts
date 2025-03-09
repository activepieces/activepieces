import { BaseModelSchema } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const ApprovalTask = Type.Object({
    ...BaseModelSchema,
    projectId: Type.String(),
    flowId: Type.String(),
    assignedUserId: Type.String(),
    options: Type.Record(Type.String(), Type.Any()),
    selectedOption: Type.Optional(Type.String()),
    title: Type.String(),
    description: Type.String(),
})

export type ApprovalTask = Static<typeof ApprovalTask>

export const ApprovalTaskComment = Type.Object({
    ...BaseModelSchema,
    taskId: Type.String(),
    userId: Type.String(),
    comment: Type.String(),
})

export type ApprovalTaskComment = Static<typeof ApprovalTaskComment>