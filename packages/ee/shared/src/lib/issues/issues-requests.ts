
import { Type, Static } from '@sinclair/typebox'
import { ApId } from '@activepieces/shared'
import { IssueStatus } from './issue-dto'

export const ListIssuesParams = Type.Object({
    projectId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})
export type ListIssuesParams = Static<typeof ListIssuesParams>

export const UpdateIssueRequest = Type.Object({
    projectId: ApId,
    flowId: ApId,
    status: Type.Enum(IssueStatus),
})

export type UpdateIssueRequest = Static<typeof UpdateIssueRequest>