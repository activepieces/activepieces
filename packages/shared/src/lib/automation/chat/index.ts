import { z } from 'zod'
import { BaseModelSchema, isObject, isString, Nullable } from '../../core/common'
import { formErrors } from '../../form-errors'

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

function buildSendChatMessageRequestSchema() {
    return z.object({
        content: z.string().max(51200),
        files: z.array(ChatMessageFile).max(10).optional(),
    }).refine(
        (val) => val.content.length > 0 || (val.files && val.files.length > 0),
        { message: formErrors.messageRequiresContentOrFiles },
    )
}

function extractToolOutput(update: Record<string, unknown>): string | undefined {
    if (isString(update['rawOutput'])) return update['rawOutput']
    if (Array.isArray(update['content'])) {
        const parts: string[] = []
        for (const block of update['content']) {
            if (isObject(block) && block['type'] === 'text' && isString(block['text'])) {
                parts.push(block['text'])
            }
        }
        if (parts.length > 0) return parts.join('\n')
    }
    return undefined
}

function isHistoryReplayContent(text: string): boolean {
    return (text.includes('"jsonrpc"') && text.includes('"session/update"'))
        || text.includes('Previous session history is replayed below')
        || text.includes('[history truncated]')
}

export const SandboxSessionUpdateType = {
    AGENT_MESSAGE_CHUNK: 'agent_message_chunk',
    AGENT_THOUGHT_CHUNK: 'agent_thought_chunk',
    TOOL_CALL: 'tool_call',
    TOOL_CALL_UPDATE: 'tool_call_update',
    PLAN: 'plan',
    SESSION_INFO_UPDATE: 'session_info_update',
    USAGE_UPDATE: 'usage_update',
} as const

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

export const chatEventUtils = {
    isObject,
    extractToolOutput,
    isHistoryReplayContent,
}

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

export type ChatAllowedMimeType = typeof CHAT_ALLOWED_MIME_TYPES[number]
export { CHAT_ALLOWED_MIME_TYPES }
