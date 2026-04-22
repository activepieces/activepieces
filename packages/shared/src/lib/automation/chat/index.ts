import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'

function buildChatConversationSchema() {
    return z.object({
        ...BaseModelSchema,
        projectId: z.string(),
        userId: z.string(),
        title: Nullable(z.string()),
        sandboxSessionId: Nullable(z.string()),
        modelName: Nullable(z.string()),
        totalInputTokens: z.number(),
        totalOutputTokens: z.number(),
        summary: Nullable(z.string()),
    })
}

function buildCreateChatConversationRequestSchema() {
    return z.object({
        title: Nullable(z.string()).optional(),
        modelName: Nullable(z.string()).optional(),
    })
}

function buildUpdateChatConversationRequestSchema() {
    return z.object({
        title: Nullable(z.string()).optional(),
        modelName: Nullable(z.string()).optional(),
    })
}

function buildSendChatMessageRequestSchema() {
    return z.object({
        content: z.string().min(1).max(51200),
    })
}

export const ChatStreamEventType = {
    TEXT_CHUNK: 'TEXT_CHUNK',
    THOUGHT_CHUNK: 'THOUGHT_CHUNK',
    TOOL_CALL_START: 'TOOL_CALL_START',
    TOOL_CALL_UPDATE: 'TOOL_CALL_UPDATE',
    TOOL_CALL_COMPLETE: 'TOOL_CALL_COMPLETE',
    PLAN_UPDATE: 'PLAN_UPDATE',
    SESSION_TITLE_UPDATE: 'SESSION_TITLE_UPDATE',
    USAGE_UPDATE: 'USAGE_UPDATE',
    ERROR: 'ERROR',
    DONE: 'DONE',
} as const
export type ChatStreamEventType = (typeof ChatStreamEventType)[keyof typeof ChatStreamEventType]

export const ChatConversation = buildChatConversationSchema()
export type ChatConversation = z.infer<typeof ChatConversation>

export const CreateChatConversationRequest = buildCreateChatConversationRequestSchema()
export type CreateChatConversationRequest = z.infer<typeof CreateChatConversationRequest>

export const UpdateChatConversationRequest = buildUpdateChatConversationRequestSchema()
export type UpdateChatConversationRequest = z.infer<typeof UpdateChatConversationRequest>

export const SendChatMessageRequest = buildSendChatMessageRequestSchema()
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequest>

export type ChatStreamEvent = {
    type: ChatStreamEventType
    data: Record<string, unknown>
}

export type ChatHistoryToolCall = {
    toolCallId: string
    title: string
    status: string
    input?: Record<string, unknown>
    output?: string
}

export type ChatHistoryMessage = {
    role: 'user' | 'assistant'
    content: string
    toolCalls?: ChatHistoryToolCall[]
    thoughts?: string
}
