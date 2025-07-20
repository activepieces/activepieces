import { Static, Type } from "@sinclair/typebox"
import { ApId } from "@activepieces/shared"

export const ListTodoCommentsQueryParams = Type.Object({
    platformId: ApId,
    projectId: ApId,
    todoId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})

export type ListTodoCommentsQueryParams = Static<typeof ListTodoCommentsQueryParams>

export const CreateTodoCommentRequestBody = Type.Object({
    content: Type.String(),
})
export type CreateTodoCommentRequestBody = Static<typeof CreateTodoCommentRequestBody>
