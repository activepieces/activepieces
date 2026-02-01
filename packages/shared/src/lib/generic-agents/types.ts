import { Static, Type } from '@sinclair/typebox'
import { AIProviderName } from '../ai-providers'
import { Conversation } from './message'

export enum AgentOutputFieldType {
    TEXT = 'text',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
}

export enum AgentTaskStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    IN_PROGRESS = 'IN_PROGRESS',
}

export const AgentOutputField = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.Enum(AgentOutputFieldType),
})
export type AgentOutputField = Static<typeof AgentOutputField>

export type AgentResult = {
    prompt: string
    conversation: Conversation
    status: AgentTaskStatus
    structuredOutput?: unknown
}

export enum AgentPieceProps {
    AGENT_TOOLS = 'agentTools',
    STRUCTURED_OUTPUT = 'structuredOutput',
    PROMPT = 'prompt',
    MAX_STEPS = 'maxSteps',
    AI_PROVIDER_MODEL = 'aiProviderModel',
}

export const AgentProviderModel = Type.Object({
    provider: Type.Enum(AIProviderName),
    model: Type.String(),
})
export type AgentProviderModel = Static<typeof AgentProviderModel>
