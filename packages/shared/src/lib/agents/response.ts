import { Static, Type } from '@sinclair/typebox'
import { Nullable } from '../common/base-model'

/**
 *  This file can not be changed, as the agent piece uses this format to parse the response.
 */
export enum ContentBlockType {
    MARKDOWN = 'markdown',
    TOOL_CALL = 'tool-call',
}

export const MarkdownContentBlock = Type.Object({
    type: Type.Literal(ContentBlockType.MARKDOWN),
    markdown: Type.String(),
})

export type MarkdownContentBlock = Static<typeof MarkdownContentBlock>


export enum AgentTaskStatus {
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum ToolCallStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
}

export enum ToolCallType {
    PIECE = 'piece',
    FLOW = 'flow',
}

export const ToolCallContentBlock = Type.Object({
    type: Type.Literal(ContentBlockType.TOOL_CALL),
    displayName: Type.String(),
    name: Type.String(),
    toolCallType: Type.Enum(ToolCallType),
    logoUrl: Nullable(Type.String()),
    status: Type.Enum(ToolCallStatus),
    input: Nullable(Type.Unknown()),
    output: Nullable(Type.Unknown()),
    toolCallId: Type.String(),
    startTime: Type.String(),
    endTime: Type.Optional(Type.String()),
})

export type ToolCallContentBlock = Static<typeof ToolCallContentBlock>

export const RichContentBlock = Type.Union([MarkdownContentBlock, ToolCallContentBlock])

export type RichContentBlock = Static<typeof RichContentBlock>

export const AgentTestResult = Type.Object({
    todoId: Type.String(),
    status: Type.Enum(AgentTaskStatus),
    output: Type.Unknown(),
    text: Type.String(),
    tools: Type.Array(Type.Object({
        displayName: Type.String(),
        logoUrl: Nullable(Type.String()),
        status: Type.Enum(ToolCallStatus),
        input: Nullable(Type.Unknown()),
        output: Nullable(Type.Unknown()),
        startTime: Type.String(),
        endTime: Type.Optional(Type.String()),
    })),
    content: Type.Array(RichContentBlock)
})

export type AgentTestResult = Static<typeof AgentTestResult>
