import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common'
import { PopulatedFlow } from '../flows'
import { UserWithMetaInformation } from '../user'

export enum STATUS_VARIANT {
    POSITIVE = 'Positive (Green)',
    NEGATIVE = 'Negative (Red)',
    NEUTRAL = 'Neutral (Gray)',
}

export const UNRESOLVED_STATUS = {
    name: 'Unresolved',
    description: 'Unresolved',
    variant: STATUS_VARIANT.NEUTRAL,
}

export const RESOLVED_STATUS = {
    name: 'Resolved',
    description: 'Resolved',
    variant: STATUS_VARIANT.POSITIVE,
}

export const STATUS_COLORS: Record<STATUS_VARIANT, StatusColor> = {
    [STATUS_VARIANT.POSITIVE]: {
        color: '#e5efe7',
        textColor: '#28813e',
    },
    [STATUS_VARIANT.NEGATIVE]: {
        color: '#fbe2e3',
        textColor: '#dd111b',
    },
    [STATUS_VARIANT.NEUTRAL]: {
        color: '#fef3c7',
        textColor: '#b45309',
    },
}

export type StatusColor = {
    color: string
    textColor: string
}

export const CreateAndWaitTodoResult = Type.Object({
    status: Type.String(),
    message: Nullable(Type.String()),
})

export type CreateAndWaitTodoResult = Static<typeof CreateAndWaitTodoResult>

export const CreateTodoResult = Type.Object({
    id: Type.String(),
    links: Type.Array(Type.Object({
        name: Type.String(),
        url: Type.String(),
    })),
})

export type CreateTodoResult = Static<typeof CreateTodoResult>

export const StatusOption = Type.Object({
    name: Type.String(),
    description: Nullable(Type.String()),
    variant: Type.Union([Type.Literal(STATUS_VARIANT.POSITIVE), Type.Literal(STATUS_VARIANT.NEGATIVE), Type.Literal(STATUS_VARIANT.NEUTRAL)]),
    continueFlow: Type.Boolean(),
})

export type StatusOption = Static<typeof StatusOption>


export enum TodoEnvironment {
    TEST = 'test',
    PRODUCTION = 'production',
}

export const Todo = Type.Object({
    ...BaseModelSchema,
    title: Type.String(),
    description: Type.String(),
    status: StatusOption,
    createdByUserId: Nullable(Type.String()),
    statusOptions: Type.Array(StatusOption),
    platformId: Type.String(),
    projectId: Type.String(),
    flowId: Type.String(),
    runId: Type.String(),
    assigneeId: Nullable(Type.String()),
    locked: Type.Boolean(),
    resolveUrl: Nullable(Type.String()),
    environment: Type.Enum(TodoEnvironment),
})

export type Todo = Static<typeof Todo>

export const PopulatedTodo = Type.Composite([Todo, Type.Object({
    assignee: Nullable(UserWithMetaInformation),
    createdByUser: Nullable(UserWithMetaInformation),
    flow: Nullable(PopulatedFlow),
})])

export type PopulatedTodo = Static<typeof PopulatedTodo>

export enum TodoType {
    INTERNAL = 'internal',
    EXTERNAL = 'external',
}

export const TodoActivity = Type.Object({
    ...BaseModelSchema,
    todoId: Type.String(),
    userId: Nullable(Type.String()),
    content: Type.String(),
})

export type TodoActivity = Static<typeof TodoActivity>


export const TodoActivityWithUser = Type.Composite([TodoActivity, Type.Object({
    user: Nullable(UserWithMetaInformation),
})])

export type TodoActivityWithUser = Static<typeof TodoActivityWithUser>
