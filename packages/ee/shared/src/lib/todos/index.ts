import { BaseModelSchema, UserWithMetaInformation } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";

export const TodoComment = Type.Object({
    ...BaseModelSchema,
    todoId: Type.String(),
    userId: Type.String(),
    content: Type.String(),
})

export type TodoComment = Static<typeof TodoComment>


export const TodoCommentWithUser = Type.Composite([TodoComment, Type.Object({
    user: UserWithMetaInformation,
})])

export type TodoCommentWithUser = Static<typeof TodoCommentWithUser>