import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common/base-model'
import { AgentTaskStatus } from '../agent'
import { AgentStepBlock } from './content'

export const AgentRun = Type.Object({
    ...BaseModelSchema,
    agentId: Type.String(),
    projectId: Type.String(),
    status: Type.Enum(AgentTaskStatus),
    output: Type.Unknown(),
    steps: Type.Array(AgentStepBlock),
    message: Type.String(),
    prompt: Type.String(),
    title: Type.Optional(Type.String()),
    summary: Type.Optional(Type.String()),
    startTime: Type.String(),
    finishTime: Type.Optional(Type.String()),
    metadata: Type.Optional(Type.Object({
        recordId: Type.Optional(Type.String()),
        tableId: Type.Optional(Type.String()),
    })),
})

export type AgentRun = Static<typeof AgentRun>