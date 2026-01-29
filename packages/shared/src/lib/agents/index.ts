import { Static, Type } from '@sinclair/typebox'
import { AIProviderName } from '../ai-providers'
import { DiscriminatedUnion, Nullable } from '../common'
export * from './tools'
export * from './mcp'

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

export enum ContentBlockType {
    MARKDOWN = 'MARKDOWN',
    TOOL_CALL = 'TOOL_CALL',
}

export enum ToolCallStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
}

export enum ExecutionToolStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
}

export enum ToolCallType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    MCP = 'MCP',
    FLOW_MAKER = 'FLOW_MAKER',
}

export const AgentOutputField = Type.Object({
    displayName: Type.String(),
    description: Type.Optional(Type.String()),
    type: Type.Enum(AgentOutputFieldType),
})
export type AgentOutputField = Static<typeof AgentOutputField>

export type AgentResult = {
    prompt: string
    steps: AgentStepBlock[]
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

export const MarkdownContentBlock = Type.Object({
    type: Type.Literal(ContentBlockType.MARKDOWN),
    markdown: Type.String(),
})
export type MarkdownContentBlock = Static<typeof MarkdownContentBlock>

const ToolCallBaseSchema = Type.Object({
    type: Type.Literal(ContentBlockType.TOOL_CALL),
    input: Nullable(Type.Record(Type.String(), Type.Unknown())),
    output: Type.Optional(Type.Unknown()),
    toolName: Type.String(),
    status: Type.Enum(ToolCallStatus),
    toolCallId: Type.String(),
    startTime: Type.String(),
    endTime: Type.Optional(Type.String()),
})
export type ToolCallBase = Static<typeof ToolCallBaseSchema>

export const ToolCallContentBlock = DiscriminatedUnion('toolCallType', [
    Type.Object({
        ...ToolCallBaseSchema.properties,
        toolCallType: Type.Literal(ToolCallType.PIECE),
        pieceName: Type.String(),
        pieceVersion: Type.String(),
        actionName: Type.String(),
    }),
    Type.Object({
        ...ToolCallBaseSchema.properties,
        toolCallType: Type.Literal(ToolCallType.FLOW),
        displayName: Type.String(),
        externalFlowId: Type.Optional(Type.String()),
    }),
    Type.Object({
        ...ToolCallBaseSchema.properties,
        toolCallType: Type.Literal(ToolCallType.MCP),
        displayName: Type.String(),
        serverUrl: Type.String(),
    }),
    Type.Object({
        ...ToolCallBaseSchema.properties,
        toolCallType: Type.Literal(ToolCallType.FLOW_MAKER),
        displayName: Type.String(),
    }),
])

export type ToolCallContentBlock = Static<typeof ToolCallContentBlock>

export const AgentStepBlock = Type.Union([MarkdownContentBlock, ToolCallContentBlock])
export type AgentStepBlock = Static<typeof AgentStepBlock>