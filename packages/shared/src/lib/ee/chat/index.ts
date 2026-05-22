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

export enum PersistedChatPartType {
    TEXT = 'text',
    REASONING = 'reasoning',
    TOOL_CALL = 'tool-call',
}

export enum PersistedToolCallStatus {
    COMPLETED = 'completed',
    ERROR = 'error',
}

export enum PersistedChatRole {
    USER = 'user',
    ASSISTANT = 'assistant',
}

const PersistedTextPartSchema = z.object({
    type: z.literal(PersistedChatPartType.TEXT),
    text: z.string(),
})

const PersistedReasoningPartSchema = z.object({
    type: z.literal(PersistedChatPartType.REASONING),
    text: z.string(),
})

const PersistedToolCallPartSchema = z.object({
    type: z.literal(PersistedChatPartType.TOOL_CALL),
    toolCallId: z.string(),
    toolName: z.string(),
    input: z.record(z.string(), z.unknown()),
    output: z.unknown().optional(),
    status: z.enum([PersistedToolCallStatus.COMPLETED, PersistedToolCallStatus.ERROR]),
    errorText: z.string().optional(),
})

const PersistedChatPartSchema = z.discriminatedUnion('type', [
    PersistedTextPartSchema,
    PersistedReasoningPartSchema,
    PersistedToolCallPartSchema,
])

export const PersistedChatMessageSchema = z.object({
    role: z.enum([PersistedChatRole.USER, PersistedChatRole.ASSISTANT]),
    parts: z.array(PersistedChatPartSchema),
})

export type PersistedTextPart = z.infer<typeof PersistedTextPartSchema>
export type PersistedReasoningPart = z.infer<typeof PersistedReasoningPartSchema>
export type PersistedToolCallPart = z.infer<typeof PersistedToolCallPartSchema>
export type PersistedChatPart = z.infer<typeof PersistedChatPartSchema>
export type PersistedChatMessage = z.infer<typeof PersistedChatMessageSchema>

export const ChatConversation = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: Nullable(z.string()),
    userId: z.string(),
    title: Nullable(z.string()),
    modelName: Nullable(z.string()),
    messages: z.array(z.record(z.string(), z.unknown())).default([]),
    uiMessages: z.array(PersistedChatMessageSchema).nullable().default(null),
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

export type ToolApprovalRequest = {
    gateId: string
    toolName: string
    displayName: string
}

export type PlanApprovalRequest = {
    gateId: string
    planSummary: string
    steps: string[]
}

export type PlanStepStatus = 'pending' | 'executing' | 'done' | 'error'

export type PlanStepUpdate = {
    stepIndex: number
    status: PlanStepStatus
}

export type ChatStreamWriter = {
    write(part: Record<string, unknown>): void
}

export type ChatToolOutputs = {
    ap_set_session_title: { success: boolean }
    ap_select_project: { success: boolean, message?: string, error?: string }
    ap_request_plan_approval: { success: boolean, message: string }
    ap_list_across_projects: { content: { type: string, text: string }[] }
    ap_run_one_time_action:
    | { noAuthRequired: true, piece: string }
    | { needsConnection: true, piece: string, displayName: string }
    | { pickConnection: true, piece: string, displayName: string, connections: ConnectionOption[] }
    | { success: boolean, error?: string, output?: unknown }
    ap_show_connection_required: { displayed: boolean }
    ap_show_connection_picker: { displayed: boolean }
    ap_show_project_picker: { displayed: boolean }
    ap_show_questions: { displayed: boolean }
    ap_show_quick_replies: { displayed: boolean }
}

export type ConnectionOption = {
    label: string
    project: string
    externalId: string
    projectId: string
    status: string
}

export type ChatToolName = keyof ChatToolOutputs

function unwrapToolOutput(output: unknown): unknown {
    if (typeof output !== 'object' || output === null) return output
    if (!('type' in output) || !('value' in output)) return output
    const record = output as Record<string, unknown>
    if (record['type'] === 'json') {
        return record['value']
    }
    return output
}

export const chatPersistenceUtils = {
    unwrapToolOutput,
}

export type ChatAllowedMimeType = typeof CHAT_ALLOWED_MIME_TYPES[number]
export { CHAT_ALLOWED_MIME_TYPES }
