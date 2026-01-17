import { Static, Type } from "@sinclair/typebox";

export const UserConversationMessage = Type.Object({
    role: Type.Literal('user'),
    content: Type.String(),
})
export type UserConversationMessage = Static<typeof UserConversationMessage>

export const TextConversationMessage = Type.Object({
    type: Type.Literal('text'),
    message: Type.String(),
    isStreaming: Type.Boolean(),
})
export type TextConversationMessage = Static<typeof TextConversationMessage>


export const ToolCallConversationMessage = Type.Object({
    type: Type.Literal('tool-call'),
    toolCallId: Type.String(),
    toolName: Type.String(),
    input: Type.Record(Type.String(), Type.Any()),
})
export type ToolCallConversationMessage = Static<typeof ToolCallConversationMessage>

export const ToolResultConversationMessage = Type.Object({
    type: Type.Literal('tool-result'),
    toolCallId: Type.String(),
    toolName: Type.String(),
    output: Type.Record(Type.String(), Type.Any()),
})

export type ToolResultConversationMessage = Static<typeof ToolResultConversationMessage>


export const AssistantConversationContent = Type.Union([
    TextConversationMessage,
    ToolCallConversationMessage,
    ToolResultConversationMessage,
])

export type AssistantConversationContent = Static<typeof AssistantConversationContent>

export const AssistantConversationMessage = Type.Object({
    role: Type.Literal('assistant'),
    parts: Type.Array(AssistantConversationContent),
})

export type AssistantConversationMessage = Static<typeof AssistantConversationMessage>

export const ConversationMessage = Type.Union([
    UserConversationMessage,
    AssistantConversationMessage,
])

export type ConversationMessage = Static<typeof ConversationMessage>

export const ChatWithQuickRequest = Type.Object({
    message: Type.String(),
})

export type ChatWithQuickRequest = Static<typeof ChatWithQuickRequest>

