import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common'
import { UserWithMetaInformation } from '../user'

export enum STATUS_VARIANT {
    POSITIVE = 'Postive (Green)',
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
        color: '#f6f6f6',
        textColor: '#2c2c2c',
    },
}

export type StatusColor = {
    color: string
    textColor: string
}

export const StatusOption = Type.Object({
    name: Type.String(),
    description: Nullable(Type.String()),
    variant: Type.Union([Type.Literal(STATUS_VARIANT.POSITIVE), Type.Literal(STATUS_VARIANT.NEGATIVE), Type.Literal(STATUS_VARIANT.NEUTRAL)]),
    continueFlow: Type.Boolean(),
})

export type StatusOption = Static<typeof StatusOption>

export const Todo = Type.Object({
    ...BaseModelSchema,
    title: Type.String(),
    description: Nullable(Type.String()),
    status: StatusOption,
    statusOptions: Type.Array(StatusOption),
    platformId: Type.String(),
    projectId: Type.String(),
    flowId: Type.String(),
    runId: Type.String(),
    assigneeId: Nullable(Type.String()),
    resolveUrl: Nullable(Type.String()),
})

export type Todo = Static<typeof Todo>

export const TodoWithAssignee = Type.Composite([Todo, Type.Object({
    assignee: Nullable(UserWithMetaInformation),
})])

export type TodoWithAssignee = Static<typeof TodoWithAssignee>

export enum TodoType {
    INTERNAL = 'internal',
    EXTERNAL = 'external',
}