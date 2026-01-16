import { Static, Type } from "@sinclair/typebox";


export const UserConversationMessage = Type.Object({
    role: Type.Literal('user'),
    content: Type.String(),
})

export type UserConversationMessage = Static<typeof UserConversationMessage>

export const PlanConversationMessage = Type.Object({
    type: Type.Literal('plan'),
    items: Type.Array(Type.Object({
        text: Type.String(),
        status: Type.Union([Type.Literal('completed'), Type.Literal('not-started')]),
    })),
})

export type PlanConversationMessage = Static<typeof PlanConversationMessage>

export const TextConversationMessage = Type.Object({
    type: Type.Literal('text'),
    message: Type.String(),
    isStreaming: Type.Boolean(),
})

export type TextConversationMessage = Static<typeof TextConversationMessage>


export const AssistantConversationContent = Type.Union([
    TextConversationMessage,
    PlanConversationMessage,
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
    sessionId: Type.String(),
    history: Type.Array(ConversationMessage),
})

export type ChatWithQuickRequest = Static<typeof ChatWithQuickRequest>

export const QuickStreamingUpdate = Type.Object({
    sessionId: Type.String(),
    part: AssistantConversationContent,
})

export type QuickStreamingUpdate = Static<typeof QuickStreamingUpdate>

export const QuickStreamingEnded = Type.Object({
    sessionId: Type.String(),
})

export type QuickStreamingEnded = Static<typeof QuickStreamingEnded>