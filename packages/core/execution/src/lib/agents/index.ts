import { AgentOutputFieldType, AgentTaskStatus, ContentBlockType, ToolCallStatus, ToolCallType } from '@activepieces/core-piece-types'
import { Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
export * from './tools'
export * from './mcp'
export * from './mcp-tool-name-util'

export {
    AgentOutputFieldType,
    AgentPieceProps,
    AgentTaskStatus,
    ContentBlockType,
    ExecutionToolStatus,
    ToolCallStatus,
    ToolCallType,
} from '@activepieces/core-piece-types'
export type { AgentProviderModel } from '@activepieces/core-piece-types'

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
