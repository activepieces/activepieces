import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'
import { formErrors } from '../../form-errors'

const MAX_FILE_BINARY_SIZE = 10 * 1024 * 1024
const MAX_FILE_BASE64_CHARS = Math.ceil(MAX_FILE_BINARY_SIZE * 4 / 3)

const CHAT_ALLOWED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'text/plain', 'text/csv', 'text/markdown',
    'application/json',
    'application/pdf',
] as const

const SAFE_FILENAME = /^[^\x00-\x1f\r\n]*$/

const ChatMessageFile = z.object({
    name: z.string().min(1).max(255).refine(
        (v) => SAFE_FILENAME.test(v),
        { message: formErrors.invalidFileName },
    ),
    mimeType: z.enum(CHAT_ALLOWED_MIME_TYPES),
    data: z.string().max(MAX_FILE_BASE64_CHARS),
})

export const ChatConversation = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: Nullable(z.string()),
    userId: z.string(),
    title: Nullable(z.string()),
    modelName: Nullable(z.string()),
    messages: z.array(z.record(z.string(), z.unknown())).default([]),
    summary: Nullable(z.string()),
    summarizedUpToIndex: Nullable(z.number().int()),
})
export type ChatConversation = z.infer<typeof ChatConversation>

export const CreateChatConversationRequest = z.object({
    title: Nullable(z.string()).optional(),
    modelName: Nullable(z.string()).optional(),
})
export type CreateChatConversationRequest = z.infer<typeof CreateChatConversationRequest>

export const UpdateChatConversationRequest = z.object({
    title: Nullable(z.string()).optional(),
    modelName: Nullable(z.string()).optional(),
})
export type UpdateChatConversationRequest = z.infer<typeof UpdateChatConversationRequest>

export const SetProjectContextRequest = z.object({
    projectId: Nullable(z.string()),
})
export type SetProjectContextRequest = z.infer<typeof SetProjectContextRequest>

export const SendChatMessageRequest = z.object({
    content: z.string().max(51200),
    files: z.array(ChatMessageFile).max(10).optional(),
}).refine(
    (val) => val.content.length > 0 || (val.files && val.files.length > 0),
    { message: formErrors.messageRequiresContentOrFiles },
)
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequest>

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

export type ChatAllowedMimeType = typeof CHAT_ALLOWED_MIME_TYPES[number]
export { CHAT_ALLOWED_MIME_TYPES }
