import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'

export const ChatMessageRole = {
    USER: 'USER',
    ASSISTANT: 'ASSISTANT',
    TOOL: 'TOOL',
} as const

export type ChatMessageRole = (typeof ChatMessageRole)[keyof typeof ChatMessageRole]

export const ToolCallRecord = z.object({
    toolName: z.string(),
    toolCallId: z.string(),
    input: z.unknown(),
})
export type ToolCallRecord = z.infer<typeof ToolCallRecord>

export const TokenUsage = z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
})
export type TokenUsage = z.infer<typeof TokenUsage>

export const ChatConversation = z.object({
    ...BaseModelSchema,
    projectId: z.string(),
    userId: z.string(),
    title: z.string().nullable(),
    modelProvider: z.string().nullable(),
    modelName: z.string().nullable(),
})
export type ChatConversation = z.infer<typeof ChatConversation>

export const ChatMessage = z.object({
    ...BaseModelSchema,
    conversationId: z.string(),
    role: z.enum([ChatMessageRole.USER, ChatMessageRole.ASSISTANT, ChatMessageRole.TOOL]),
    content: z.string(),
    toolCalls: z.array(ToolCallRecord).nullable(),
    fileUrls: z.array(z.string()).nullable(),
    tokenUsage: TokenUsage.nullable(),
})
export type ChatMessage = z.infer<typeof ChatMessage>

export const CreateChatConversationRequest = z.object({
    title: z.string().nullable().optional(),
    modelProvider: z.string().nullable().optional(),
    modelName: z.string().nullable().optional(),
})
export type CreateChatConversationRequest = z.infer<typeof CreateChatConversationRequest>

export const UpdateChatConversationRequest = z.object({
    title: z.string().nullable().optional(),
    modelProvider: z.string().nullable().optional(),
    modelName: z.string().nullable().optional(),
})
export type UpdateChatConversationRequest = z.infer<typeof UpdateChatConversationRequest>

export const SendChatMessageRequest = z.object({
    content: z.string().min(1).max(51200),
    fileUrls: z.array(z.string()).optional(),
})
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequest>
