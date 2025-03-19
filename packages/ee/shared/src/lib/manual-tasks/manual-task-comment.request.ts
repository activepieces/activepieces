import { Static, Type } from "@sinclair/typebox"
import { ApId } from "@activepieces/shared"

export const ListManualTaskCommentsQueryParams = Type.Object({
    platformId: ApId,
    projectId: ApId,
    taskId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})

export type ListManualTaskCommentsQueryParams = Static<typeof ListManualTaskCommentsQueryParams>

export const CreateManualTaskCommentRequestBody = Type.Object({
    content: Type.String(),
})
export type CreateManualTaskCommentRequestBody = Static<typeof CreateManualTaskCommentRequestBody>
