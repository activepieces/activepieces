import { z } from 'zod'
import { BaseModelSchema } from '../../core/common/base-model'
import { AIProviderName } from '../../management/ai-providers'

export enum ChatMessageRole {
    USER = 'USER',
    ASSISTANT = 'ASSISTANT',
    TOOL = 'TOOL',
}

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
    role: z.nativeEnum(ChatMessageRole),
    content: z.string(),
    toolCalls: z.unknown().nullable(),
    fileUrls: z.array(z.string()).nullable(),
    tokenUsage: z.unknown().nullable(),
})
export type ChatMessage = z.infer<typeof ChatMessage>

export const CreateChatConversationRequest = z.object({
    title: z.string().nullable().optional(),
    modelProvider: z.nativeEnum(AIProviderName).nullable().optional(),
    modelName: z.string().nullable().optional(),
})
export type CreateChatConversationRequest = z.infer<typeof CreateChatConversationRequest>

export const UpdateChatConversationRequest = z.object({
    title: z.string().nullable().optional(),
    modelProvider: z.nativeEnum(AIProviderName).nullable().optional(),
    modelName: z.string().nullable().optional(),
})
export type UpdateChatConversationRequest = z.infer<typeof UpdateChatConversationRequest>

export const SendChatMessageRequest = z.object({
    content: z.string().min(1).max(51200),
    fileUrls: z.array(z.string()).optional(),
})
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequest>

export const ListChatConversationsRequest = z.object({
    projectId: z.string(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListChatConversationsRequest = z.infer<typeof ListChatConversationsRequest>

export const ListChatMessagesRequest = z.object({
    conversationId: z.string(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
})
export type ListChatMessagesRequest = z.infer<typeof ListChatMessagesRequest>
