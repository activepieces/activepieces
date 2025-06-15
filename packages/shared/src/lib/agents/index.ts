import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export enum AgentOutputType {
    NO_OUTPUT = 'no_output',
    STRUCTURED_OUTPUT = 'structured_output',
}


export const agentbuiltInToolsNames = {
    markAsComplete: 'markAsComplete',
}

export enum AgentOutputFieldType {
    TEXT = 'text',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
}

export const AgentOutputField = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.Enum(AgentOutputFieldType),
})

export type AgentOutputField = Static<typeof AgentOutputField>


export const AgentTestResult = Type.Object({
    todoId: Type.String(),
    output: Type.Unknown(),
})

export type AgentTestResult = Static<typeof AgentTestResult>

export const Agent = Type.Object({
    ...BaseModelSchema,
    displayName: Type.String(),
    description: Type.String(),
    systemPrompt: Type.String(),
    profilePictureUrl: Type.String(),
    testPrompt: Type.Optional(Type.String()),
    projectId: Type.String(),
    maxSteps: Type.Number(),
    mcpId: Type.String(),
    platformId: Type.String(),
    taskCompleted: Type.Number(),
    outputType: Type.Optional(Type.Enum(AgentOutputType)),
    outputFields: Type.Optional(Type.Array(AgentOutputField)),
})

export type Agent = Static<typeof Agent>

export const CreateAgentRequest = Type.Object({
    displayName: Type.String(),
    description: Type.String(),
})

export type CreateAgentRequest = Static<typeof CreateAgentRequest>

export const UpdateAgentRequest = Type.Object({
    systemPrompt: Type.Optional(Type.String()),
    displayName: Type.Optional(Type.String()),  
    description: Type.Optional(Type.String()),
    testPrompt: Type.Optional(Type.String()),
    outputType: Type.Optional(Type.String()),
    outputFields: Type.Optional(Type.Array(AgentOutputField)),
})

export type UpdateAgentRequest = Static<typeof UpdateAgentRequest>

export const ListAgentsQueryParams = Type.Object({
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListAgentsQueryParams = Static<typeof ListAgentsQueryParams>

export const RunAgentRequest = Type.Object({
    prompt: Type.String(),
    callbackUrl: Type.Optional(Type.String()),
})

export type RunAgentRequest = Static<typeof RunAgentRequest>