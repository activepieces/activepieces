import { BaseModelSchema, UserWithMetaInformation } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

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