import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { StatusOption } from '.'

const StatusOptionsSchema = Type.Array(StatusOption, { minItems: 1 })

export const ListTodosQueryParams = Type.Object({
    platformId: ApId,
    projectId: ApId,
    flowId: Type.Optional(ApId),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    assigneeId: Type.Optional(ApId),
    statusOptions: Type.Optional(Type.Array(Type.String())),
    title: Type.Optional(Type.String()),
})
export type ListTodosQueryParams = Static<typeof ListTodosQueryParams>


export const ListTodoAssigneesRequestQuery = Type.Object({
})
export type ListTodoAssigneesRequestQuery = Static<typeof ListTodoAssigneesRequestQuery>

export const UpdateTodoRequestBody = Type.Object({
    title: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    status: Type.Optional(StatusOption),
    statusOptions: Type.Optional(StatusOptionsSchema),
    assigneeId: Type.Optional(ApId),
})
export type UpdateTodoRequestBody = Static<typeof UpdateTodoRequestBody>


export const CreateTodoRequestBody = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    statusOptions: StatusOptionsSchema,
    flowId: ApId,
    runId: Type.Optional(ApId),
    assigneeId: Type.Optional(ApId),
    approvalUrl: Type.Optional(Type.String()),
})
export type CreateTodoRequestBody = Static<typeof CreateTodoRequestBody>
