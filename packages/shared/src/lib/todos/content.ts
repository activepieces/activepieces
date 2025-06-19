import { Static, Type } from "@sinclair/typebox"
import { Nullable } from "../common/base-model"

export enum ContentBlockType {
    MARKDOWN = 'markdown',
    TOOL_CALL = 'tool-call',
}

export const MarkdownContentBlock = Type.Object({
    type: Type.Literal(ContentBlockType.MARKDOWN),
    markdown: Type.String(),
})

export type MarkdownContentBlock = Static<typeof MarkdownContentBlock>


export enum ToolCallStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed'
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
    startTime: Type.String(),
    endTime: Type.Optional(Type.String()),
})

export type ToolCallContentBlock = Static<typeof ToolCallContentBlock>

export const RichContentBlock = Type.Union([MarkdownContentBlock, ToolCallContentBlock])

export type RichContentBlock = Static<typeof RichContentBlock>
