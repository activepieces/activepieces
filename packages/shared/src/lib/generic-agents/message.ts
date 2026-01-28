import { Static, Type } from '@sinclair/typebox'

export const UserTextConversationMessage = Type.Object({
    type: Type.Literal('text'),
    message: Type.String(),
})
export type UserTextConversationMessage = Static<typeof UserTextConversationMessage>

export const UserImageConversationMessage = Type.Object({
    type: Type.Literal('image'),
    image: Type.String(),
    name: Type.Optional(Type.String()),
})
export type UserImageConversationMessage = Static<typeof UserImageConversationMessage>

export const UserFileConversationMessage = Type.Object({
    type: Type.Literal('file'),
    file: Type.String(),
    name: Type.Optional(Type.String()),
    mimeType: Type.Optional(Type.String()),
})
export type UserFileConversationMessage = Static<typeof UserFileConversationMessage>

export const UserConversationMessage = Type.Object({
    role: Type.Literal('user'),
    content: Type.Array(Type.Union([
        UserTextConversationMessage,
        UserImageConversationMessage,
        UserFileConversationMessage,
    ])),
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
    input: Type.Optional(Type.Record(Type.String(), Type.Any())),
    output: Type.Optional(Type.Record(Type.String(), Type.Any())),
    status: Type.Union([Type.Literal('loading'), Type.Literal('ready'), Type.Literal('completed'), Type.Literal('error')]),
    error: Type.Optional(Type.String()),
})
export type ToolCallConversationMessage = Static<typeof ToolCallConversationMessage>


export const AssistantConversationContent = Type.Union([
    TextConversationMessage,
    ToolCallConversationMessage,
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


export const Conversation = Type.Array(ConversationMessage)
export type Conversation = Static<typeof Conversation>