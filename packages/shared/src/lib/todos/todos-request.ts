import { Static, Type } from '@sinclair/typebox'
import { ApId } from '../common/id-generator'
import { StatusOption, TodoEnvironment } from '.'

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
    environment: Type.Optional(Type.Enum(TodoEnvironment)),
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
    isTest: Type.Optional(Type.Boolean()),
})
export type UpdateTodoRequestBody = Static<typeof UpdateTodoRequestBody>


export const CreateTodoRequestBody = Type.Object({
    title: Type.String(),
    description: Type.String(),
    statusOptions: StatusOptionsSchema,
    flowId: ApId,
    runId: Type.Optional(ApId),
    assigneeId: Type.Optional(ApId),
    resolveUrl: Type.Optional(Type.String()),
    environment: Type.Optional(Type.Enum(TodoEnvironment)),
    agentId: Type.Optional(ApId),
})
export type CreateTodoRequestBody = Static<typeof CreateTodoRequestBody>

export const ResolveTodoRequestQuery = Type.Object({
    status: Type.String(),
    isTest: Type.Optional(Type.Boolean()),
})
export type ResolveTodoRequestQuery = Static<typeof ResolveTodoRequestQuery>


export const ListTodoActivitiesQueryParams = Type.Object({
    todoId: ApId,
    type: Type.Optional(Type.String()),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
})

export type ListTodoActivitiesQueryParams = Static<typeof ListTodoActivitiesQueryParams>

export const CreateTodoActivityRequestBody = Type.Object({
    todoId: ApId,
    content: Type.String(),
})
export type CreateTodoActivityRequestBody = Static<typeof CreateTodoActivityRequestBody>

