import { BaseModelSchema, Nullable, UserWithMetaInformation } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const StatusOption = Type.Object({
    name: Type.String(),
    description: Nullable(Type.String()),
    color: Type.String(),
    textColor: Type.String(),
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
    approvalUrl: Nullable(Type.String()),
})

export type ManualTask = Static<typeof ManualTask>

export const ManualTaskComment = Type.Object({
    ...BaseModelSchema,
    taskId: Type.String(),
    userId: Type.String(),
    content: Type.String(),
})

export type ManualTaskComment = Static<typeof ManualTaskComment>


export const ManualTaskCommentWithUser = Type.Composite([ManualTaskComment, Type.Object({
    user: UserWithMetaInformation,
})])

export type ManualTaskCommentWithUser = Static<typeof ManualTaskCommentWithUser>

export const ManualTaskWithAssignee = Type.Composite([ManualTask, Type.Object({
    assignee: Nullable(UserWithMetaInformation),
})])

export type ManualTaskWithAssignee = Static<typeof ManualTaskWithAssignee>;


export const NO_ANSWER_STATUS = {
    name: 'No Answer',
    description: 'No Answer',
    color: '#f6f6f6',
    textColor: '#2c2c2c',
}


export const ANSWERED_STATUS = {
    name: 'Answered',
    description: 'Answered',
    color: '#f6f6f6',
    textColor: '#2c2c2c',
}