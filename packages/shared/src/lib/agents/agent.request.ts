import { Static, Type } from '@sinclair/typebox'
import { AgentOutputField, AgentOutputType } from './agent'
import { AgentSettings } from './agent-settings'

export const CreateAgentRequest = Type.Object({
    displayName: Type.String(),
    description: Type.String(),
    systemPrompt: Type.String(),
})

export type CreateAgentRequest = Static<typeof CreateAgentRequest>

export const UpdateAgentRequestBody = Type.Object({
    systemPrompt: Type.Optional(Type.String()),
    displayName: Type.Optional(Type.String()),  
    description: Type.Optional(Type.String()),
    testPrompt: Type.Optional(Type.String()),
    outputType: Type.Optional(Type.Enum(AgentOutputType)),
    outputFields: Type.Optional(Type.Array(AgentOutputField)),
    settings: Type.Optional(AgentSettings),
    generateNewProfilePicture: Type.Optional(Type.Boolean()),
})

export type UpdateAgentRequestBody = Static<typeof UpdateAgentRequestBody>

export const ListAgentsQueryParams = Type.Object({
    externalIds: Type.Optional(Type.Array(Type.String())),
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListAgentsQueryParams = Static<typeof ListAgentsQueryParams>
