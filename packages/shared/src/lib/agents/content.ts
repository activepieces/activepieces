import { Static, Type } from '@sinclair/typebox'
import { DiscriminatedUnion, Nullable } from '../common/base-model'

export enum ContentBlockType {
    MARKDOWN = 'MARKDOWN',
    TOOL_CALL = 'TOOL_CALL',
}

export const MarkdownContentBlock = Type.Object({
    type: Type.Literal(ContentBlockType.MARKDOWN),
    markdown: Type.String(),
})

export type MarkdownContentBlock = Static<typeof MarkdownContentBlock>


export enum ToolCallStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
}

export enum ToolCallType {
    PIECE = 'PIECE',
    FLOW = 'FLOW',
    INTERNAL = 'INTERNAL',
}

const ToolCallBase = {
    type: Type.Literal(ContentBlockType.TOOL_CALL),
    input: Nullable(Type.Record(Type.String(), Type.Unknown())),
    output: Type.Optional(Type.Unknown()),
    toolName: Type.String(),
    status: Type.Enum(ToolCallStatus),
    toolCallId: Type.String(),
    startTime: Type.String(),
    endTime: Type.Optional(Type.String()),
}

export const ToolCallContentBlock = DiscriminatedUnion('toolCallType', [
    Type.Object({
        ...ToolCallBase,
        toolCallType: Type.Literal(ToolCallType.INTERNAL),
        displayName: Type.String(),
    }),
    Type.Object({
        ...ToolCallBase,
        toolCallType: Type.Literal(ToolCallType.PIECE),
        pieceName: Type.String(),
        pieceVersion: Type.String(),
        actionName: Type.String(),
    }),
    Type.Object({
        ...ToolCallBase,
        toolCallType: Type.Literal(ToolCallType.FLOW),
        displayName: Type.String(),
        flowId: Type.String(),
    }),
])



export type ToolCallContentBlock = Static<typeof ToolCallContentBlock>

export const AgentStepBlock = Type.Union([MarkdownContentBlock, ToolCallContentBlock])

export type AgentStepBlock = Static<typeof AgentStepBlock>
