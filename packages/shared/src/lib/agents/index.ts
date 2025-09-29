import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'
import { McpWithTools } from '../mcp'
import { AgentStepBlock } from './content'

export enum AgentOutputType {
    NO_OUTPUT = 'no_output',
    STRUCTURED_OUTPUT = 'structured_output',
}


export const agentbuiltInToolsNames = {
    markAsComplete: 'markAsComplete',
    updateTableRecord: 'updateTableRecord',
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


export enum AgentTaskStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    IN_PROGRESS = 'IN_PROGRESS',
}

export type AgentResult = {
  prompt: string,
  steps: AgentStepBlock[]
  status: AgentTaskStatus
  message: string | null
}

export const AgentRun = Type.Object({
    ...BaseModelSchema,
    agentId: Type.String(),
    projectId: Type.String(),
    status: Type.Enum(AgentTaskStatus),
    output: Type.Unknown(),
    steps: Type.Array(AgentStepBlock),
    message: Type.String(),
    prompt: Type.String(),
    startTime: Type.String(),
    finishTime: Type.Optional(Type.String()),
    metadata: Type.Optional(Type.Object({
        recordId: Type.Optional(Type.String()),
        tableId: Type.Optional(Type.String()),
    })),
})

export type AgentRun = Static<typeof AgentRun>

export const Agent = Type.Object({
    ...BaseModelSchema,
    displayName: Type.String(),
    description: Type.String(),
    systemPrompt: Type.String(),
    profilePictureUrl: Type.String(),
    projectId: Type.String(),
    maxSteps: Type.Number(),
    mcpId: Type.String(),
    tableAutomationId: Type.Optional(Type.String()),
    platformId: Type.String(),
    outputType: Type.Optional(Type.Enum(AgentOutputType)),
    outputFields: Type.Optional(Type.Array(AgentOutputField)),
    runCompleted: Type.Number(),
    externalId: Type.String(),
})
export type Agent = Static<typeof Agent>

export const PopulatedAgent = Type.Composite([
    Agent,
    Type.Object({
        mcp: McpWithTools,
    }),
])

export type PopulatedAgent = Static<typeof PopulatedAgent>

export const EnhancedAgentPrompt = Type.Object({
    displayName: Type.String(),
    description: Type.String(),
    systemPrompt: Type.String(),
})
export type EnhancedAgentPrompt = Static<typeof EnhancedAgentPrompt>

export const EnhanceAgentPrompt = Type.Object({
    agentId: Type.String(),
    systemPrompt: Type.String(),
})
export type EnhaceAgentPrompt = Static<typeof EnhanceAgentPrompt>

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
    outputType: Type.Optional(Type.Enum(AgentOutputType)),
    outputFields: Type.Optional(Type.Array(AgentOutputField)),
})

export type UpdateAgentRequestBody = Static<typeof UpdateAgentRequestBody>

export const ListAgentsQueryParams = Type.Object({
    externalIds: Type.Optional(Type.Array(Type.String())),
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String()),
})

export type ListAgentsQueryParams = Static<typeof ListAgentsQueryParams>

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
})

export type UpdateAgentRunRequestBody = Static<typeof UpdateAgentRunRequestBody>