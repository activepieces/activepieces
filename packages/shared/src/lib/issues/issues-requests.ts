import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { IssueStatus } from './issue-dto'

export const ListIssuesParams = Type.Object({
    projectId: ApId,
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    status: Type.Optional(Type.Array(Type.Enum(IssueStatus))),
})
export type ListIssuesParams = Static<typeof ListIssuesParams>

export const UpdateIssueRequestBody = Type.Object({
    status: Type.Enum(IssueStatus),
})

export type UpdateIssueRequestBody = Static<typeof UpdateIssueRequestBody>