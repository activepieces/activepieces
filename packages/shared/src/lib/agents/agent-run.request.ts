import { Static, Type } from '@sinclair/typebox'
import { AgentTaskStatus } from './agent'
import { AgentStepBlock } from './agent-run/content'

export const ListAgentRunsQueryParams = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
    agentId: Type.String(),
})

export type ListAgentRunsQueryParams = Static<typeof ListAgentRunsQueryParams>

export const RunAgentRequestBody = Type.Object({
    externalId: Type.String(),
    prompt: Type.String(),
})

export type RunAgentRequestBody = Static<typeof RunAgentRequestBody>

export const UpdateAgentRunRequestBody = Type.Object({
    projectId: Type.String(),
    status: Type.Optional(Type.Enum(AgentTaskStatus)),
    startTime: Type.Optional(Type.String()),
    steps: Type.Optional(Type.Array(AgentStepBlock)),
    message: Type.Optional(Type.String()),
    output: Type.Optional(Type.Unknown()),
    finishTime: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
    summary: Type.Optional(Type.String()),
})

export type UpdateAgentRunRequestBody = Static<typeof UpdateAgentRunRequestBody>