import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common'
import { formErrors } from '../../form-errors'

const MAX_FILE_BINARY_SIZE = 10 * 1024 * 1024
const MAX_FILE_BASE64_CHARS = Math.ceil(MAX_FILE_BINARY_SIZE * 4 / 3)

const CHAT_ALLOWED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv', 'text/markdown',
    'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    projectId: z.string(),
    userId: z.string(),
    title: Nullable(z.string()),
    sandboxSessionId: Nullable(z.string()),
    modelName: Nullable(z.string()),
    totalInputTokens: z.number(),
    totalOutputTokens: z.number(),
    summary: Nullable(z.string()),
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

export type ToolCallItem = {
    id: string
    name: string
    title: string
    status: 'running' | 'completed' | 'failed' | 'stopped'
    kind?: string
    input?: Record<string, unknown>
    output?: string
}

export type MessageBlock =
    | { type: 'text', text: string }
    | { type: 'tool_calls', calls: ToolCallItem[] }

export type ChatMessageItem = {
    id: string
    role: 'user' | 'assistant'
    blocks: MessageBlock[]
    thoughts: string
    plan: PlanItem[] | null
    fileNames: string[]
    timestamp: number
}

export type PlanItem = {
    content: string
    status: 'pending' | 'in_progress' | 'completed'
}

export type ChatAllowedMimeType = typeof CHAT_ALLOWED_MIME_TYPES[number]
export { CHAT_ALLOWED_MIME_TYPES }
