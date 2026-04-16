import { z } from 'zod'
import { Nullable } from '../../core/common'
import { AIProviderName } from '../../management/ai-providers'
export * from './tools'
export * from './mcp'
export * from './mcp-tool-name-util'

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
    KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
    UNKNOWN = 'UNKNOWN',
}

export const AgentOutputField = z.object({
    displayName: z.string(),
    description: z.string().optional(),
    type: z.nativeEnum(AgentOutputFieldType),
})
export type AgentOutputField = z.infer<typeof AgentOutputField>

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
    WEB_SEARCH = 'webSearch',
    WEB_SEARCH_OPTIONS = 'webSearchOptions',
}

export type AgentProviderModel = {
    provider: AIProviderName
    model: string
}

export const MarkdownContentBlock = z.object({
    type: z.literal(ContentBlockType.MARKDOWN),
    markdown: z.string(),
})
export type MarkdownContentBlock = z.infer<typeof MarkdownContentBlock>

const ToolCallBaseSchema = z.object({
    type: z.literal(ContentBlockType.TOOL_CALL),
    input: Nullable(z.record(z.string(), z.unknown())),
    output: z.unknown().optional(),
    toolName: z.string(),
    status: z.nativeEnum(ToolCallStatus),
    toolCallId: z.string(),
    startTime: z.string(),
    endTime: z.string().optional(),
})
export type ToolCallBase = z.infer<typeof ToolCallBaseSchema>

export const ToolCallContentBlock = z.discriminatedUnion('toolCallType', [
    z.object({
        ...ToolCallBaseSchema.shape,
        toolCallType: z.literal(ToolCallType.PIECE),
        pieceName: z.string(),
        pieceVersion: z.string(),
        actionName: z.string(),
    }),
    z.object({
        ...ToolCallBaseSchema.shape,
        toolCallType: z.literal(ToolCallType.FLOW),
        displayName: z.string(),
        externalFlowId: z.string(),
    }),
    z.object({
        ...ToolCallBaseSchema.shape,
        toolCallType: z.literal(ToolCallType.MCP),
        displayName: z.string(),
        serverUrl: z.string(),
    }),
    z.object({
        ...ToolCallBaseSchema.shape,
        toolCallType: z.literal(ToolCallType.KNOWLEDGE_BASE),
        displayName: z.string(),
        sourceType: z.string(),
    }),
    z.object({
        ...ToolCallBaseSchema.shape,
        toolCallType: z.literal(ToolCallType.UNKNOWN),
        displayName: z.string(),
    }),
])

export type ToolCallContentBlock = z.infer<typeof ToolCallContentBlock>

export const AgentStepBlock = z.union([MarkdownContentBlock, ToolCallContentBlock])
export type AgentStepBlock = z.infer<typeof AgentStepBlock>
