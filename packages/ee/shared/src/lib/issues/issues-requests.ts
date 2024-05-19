
import { Type, Static } from '@sinclair/typebox'
import { ApId } from '@activepieces/shared'
import { IssueStatus } from './issue-dto'

export const ListIssuesParams = Type.Object({
    projectId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})
export type ListIssuesParams = Static<typeof ListIssuesParams>

export const UpdateIssueRequestBody = Type.Object({
    status: Type.Enum(IssueStatus),
})

export type UpdateIssueRequestBody = Static<typeof UpdateIssueRequestBody>