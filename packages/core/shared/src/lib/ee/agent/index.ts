import { AgentPromptOverride, AgentRunSource } from '@activepieces/core-execution'
import { BaseModelSchema, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
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

const AgentMessageFile = z.object({
    name: z.string().min(1).max(255).refine(
        (v) => SAFE_FILENAME.test(v),
        { message: formErrors.invalidFileName },
    ),
    mimeType: z.enum(CHAT_ALLOWED_MIME_TYPES),
    data: z.string().max(MAX_FILE_BASE64_CHARS),
})

export enum PersistedAgentPartType {
    TEXT = 'text',
    REASONING = 'reasoning',
    TOOL_CALL = 'tool-call',
    THINKING_STATUS = 'thinking-status',
    BATCH_PROGRESS = 'batch-progress',
    ACTION_RECEIPT = 'action-receipt',
    SOURCE_URL = 'source-url',
    SOURCE_DOCUMENT = 'source-document',
    IMAGE = 'image',
    FILE = 'file',
    BUILD_PLAN = 'build-plan',
}

export enum PersistedToolCallStatus {
    COMPLETED = 'completed',
    ERROR = 'error',
}

export enum PersistedAgentRole {
    USER = 'user',
    ASSISTANT = 'assistant',
}

const PersistedTextPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.TEXT),
    text: z.string(),
})

const PersistedReasoningPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.REASONING),
    text: z.string(),
})

const PersistedToolCallPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.TOOL_CALL),
    toolCallId: z.string(),
    toolName: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    input: z.record(z.string(), z.unknown()),
    output: z.unknown().optional(),
    status: z.enum([PersistedToolCallStatus.COMPLETED, PersistedToolCallStatus.ERROR]),
    errorText: z.string().optional(),
})

const PersistedThinkingStatusPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.THINKING_STATUS),
    text: z.string(),
})

const PersistedBatchProgressPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.BATCH_PROGRESS),
    data: z.record(z.string(), z.unknown()),
})

const PersistedActionReceiptPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.ACTION_RECEIPT),
    toolCallId: z.string(),
    actionDisplayName: z.string(),
    pieceName: z.string(),
    connectionLabel: z.string().optional(),
    status: z.enum(['success', 'failed']),
    output: z.unknown().optional(),
    errorMessage: z.string().optional(),
    timestamp: z.string(),
})

const PersistedBuildPlanPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.BUILD_PLAN),
    buildId: z.string(),
    data: z.record(z.string(), z.unknown()),
})

const PersistedSourceUrlPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.SOURCE_URL),
    sourceId: z.string(),
    url: z.string(),
    title: z.string().optional(),
})

const PersistedSourceDocumentPartSchema = z.object({
    type: z.literal(PersistedAgentPartType.SOURCE_DOCUMENT),
    sourceId: z.string(),
    mediaType: z.string(),
    title: z.string(),
    filename: z.string().optional(),
})

const PersistedImagePartSchema = z.object({
    type: z.literal(PersistedAgentPartType.IMAGE),
    toolCallId: z.string(),
    fileId: z.string(),
    url: z.string(),
    mediaType: z.string(),
    prompt: z.string().optional(),
    model: z.string().optional(),
    title: z.string().optional(),
    timestamp: z.string(),
})

const PersistedFilePartSchema = z.object({
    type: z.literal(PersistedAgentPartType.FILE),
    toolCallId: z.string(),
    fileId: z.string(),
    url: z.string(),
    mediaType: z.string(),
    fileName: z.string(),
    byteSize: z.number(),
    title: z.string().optional(),
    timestamp: z.string(),
})

const PersistedAgentPartSchema = z.discriminatedUnion('type', [
    PersistedTextPartSchema,
    PersistedReasoningPartSchema,
    PersistedToolCallPartSchema,
    PersistedThinkingStatusPartSchema,
    PersistedBatchProgressPartSchema,
    PersistedActionReceiptPartSchema,
    PersistedBuildPlanPartSchema,
    PersistedSourceUrlPartSchema,
    PersistedSourceDocumentPartSchema,
    PersistedImagePartSchema,
    PersistedFilePartSchema,
])

export const AgentFeedbackReason = z.enum([
    'incorrect_or_incomplete',
    'not_what_i_asked_for',
    'slow_or_buggy',
    'style_or_tone',
    'safety_or_security',
    'other',
])
export type AgentFeedbackReason = z.infer<typeof AgentFeedbackReason>

export const AgentMessageFeedbackSchema = z.object({
    rating: z.enum(['up', 'down']),
    reasons: z.array(AgentFeedbackReason).optional(),
    comment: z.string().max(2000).optional(),
})

export const PersistedAgentMessageSchema = z.object({
    role: z.enum([PersistedAgentRole.USER, PersistedAgentRole.ASSISTANT]),
    parts: z.array(PersistedAgentPartSchema),
    thinkingDurationMs: z.number().optional(),
    feedback: AgentMessageFeedbackSchema.optional(),
})

export type PersistedTextPart = z.infer<typeof PersistedTextPartSchema>
export type PersistedReasoningPart = z.infer<typeof PersistedReasoningPartSchema>
export type PersistedToolCallPart = z.infer<typeof PersistedToolCallPartSchema>
export type PersistedThinkingStatusPart = z.infer<typeof PersistedThinkingStatusPartSchema>
export type PersistedActionReceiptPart = z.infer<typeof PersistedActionReceiptPartSchema>
export type PersistedBuildPlanPart = z.infer<typeof PersistedBuildPlanPartSchema>
export type PersistedSourceUrlPart = z.infer<typeof PersistedSourceUrlPartSchema>
export type PersistedSourceDocumentPart = z.infer<typeof PersistedSourceDocumentPartSchema>
export type PersistedImagePart = z.infer<typeof PersistedImagePartSchema>
export type PersistedFilePart = z.infer<typeof PersistedFilePartSchema>
export type PersistedAgentPart = z.infer<typeof PersistedAgentPartSchema>
export type PersistedAgentMessage = z.infer<typeof PersistedAgentMessageSchema>
export type AgentMessageFeedback = z.infer<typeof AgentMessageFeedbackSchema>

export enum AgentConversationStatus {
    IDLE = 'IDLE',
    STREAMING = 'STREAMING',
    ERROR = 'ERROR',
}

export { AgentRunSource }

export const AgentConversation = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: Nullable(z.string()),
    userId: z.string(),
    source: z.enum(AgentRunSource),
    title: Nullable(z.string()),
    modelName: Nullable(z.string()),
    status: z.nativeEnum(AgentConversationStatus).default(AgentConversationStatus.IDLE),
    activeRunId: Nullable(z.string()),
    messages: z.array(z.record(z.string(), z.unknown())).default([]),
    uiMessages: z.array(PersistedAgentMessageSchema).nullable().default(null),
    summary: Nullable(z.string()),
    summarizedUpToIndex: Nullable(z.number().int()),
})
export type AgentConversation = z.infer<typeof AgentConversation>

export const CreateAgentConversationRequest = z.object({
    title: z.optional(Nullable(z.string())),
    modelName: z.optional(Nullable(z.string())),
})
export type CreateAgentConversationRequest = z.infer<typeof CreateAgentConversationRequest>

export const UpdateAgentConversationRequest = z.object({
    title: z.optional(Nullable(z.string())),
    modelName: z.optional(Nullable(z.string())),
})
export type UpdateAgentConversationRequest = z.infer<typeof UpdateAgentConversationRequest>

export const UserMemory = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    userId: z.string(),
    instructions: Nullable(z.string()),
    memories: z.array(z.string()).default([]),
})
export type UserMemory = z.infer<typeof UserMemory>

export const GetAgentMemoryResponse = z.object({
    instructions: z.string().nullable(),
    memories: z.array(z.string()),
})
export type GetAgentMemoryResponse = z.infer<typeof GetAgentMemoryResponse>

export const UpdateAgentMemoryRequest = z.object({
    instructions: Nullable(z.string()),
    memories: z.optional(z.array(z.string())),
})
export type UpdateAgentMemoryRequest = z.infer<typeof UpdateAgentMemoryRequest>

export const CHAT_BYOK_CREDIT_WEIGHT = 1
export const CHAT_CREDITS_PER_TOOL_CALL = 1

export const ImportAgentMemoryRequest = z.object({
    text: z.string(),
})
export type ImportAgentMemoryRequest = z.infer<typeof ImportAgentMemoryRequest>

export const InstructAgentMemoryRequest = z.object({
    instruction: z.string(),
})
export type InstructAgentMemoryRequest = z.infer<typeof InstructAgentMemoryRequest>

export const SendAgentMessageRequest = z.object({
    content: z.string().max(51200),
    runId: z.string().optional(),
    files: z.array(AgentMessageFile).max(10).optional(),
}).refine(
    (val) => val.content.length > 0 || (val.files && val.files.length > 0),
    { message: formErrors.messageRequiresContentOrFiles },
)
export type SendAgentMessageRequest = z.infer<typeof SendAgentMessageRequest>

export const SetAgentMessageFeedbackRequest = z.object({
    rating: z.enum(['up', 'down']).nullable(),
    reasons: z.array(AgentFeedbackReason).max(AgentFeedbackReason.options.length).optional(),
    comment: z.string().max(2000).optional(),
})
export type SetAgentMessageFeedbackRequest = z.infer<typeof SetAgentMessageFeedbackRequest>

export const SimulateAgentRequest = z.object({
    platformId: z.string(),
    userMessage: z.string().min(1).max(51200).optional(),
    userMessages: z.array(z.string().min(1).max(51200)).min(1).optional(),
    promptOverride: AgentPromptOverride.optional(),
}).refine(
    (val) => val.userMessage !== undefined || (val.userMessages !== undefined && val.userMessages.length > 0),
    { message: formErrors.messageRequiresContentOrFiles },
)
export type SimulateAgentRequest = z.infer<typeof SimulateAgentRequest>

export type AgentHistoryToolCall = {
    toolCallId: string
    title: string
    status: string
    input?: Record<string, unknown>
    output?: string
}

export type AgentHistoryMessage = {
    role: 'user' | 'assistant'
    content: string
    toolCalls?: AgentHistoryToolCall[]
    thoughts?: string
}

export type AgentToolOutputs = {
    ap_set_session_title: { success: boolean }
    ap_select_project: { success: boolean, message?: string, error?: string }
    ap_list_across_projects: { content: { type: string, text: string }[] }
    ap_execute_action:
    | { noAuthRequired: true, piece: string }
    | { needsConnection: true, piece: string, displayName: string }
    | { pickConnection: true, piece: string, displayName: string, connections: ConnectionOption[] }
    | { success: boolean, error?: string, output?: unknown }
    ap_show_connection_required: { displayed: boolean }
    ap_show_connection_picker: { displayed: boolean }
    ap_show_project_picker: { displayed: boolean }
    ap_show_questions: { displayed: boolean }
    ap_show_quick_replies: { displayed: boolean }
    ap_update_thinking_status: { success: boolean }
}

export type ConnectionOption = {
    label: string
    project: string
    externalId: string
    projectId: string
    status: string
}

export type AgentToolName = keyof AgentToolOutputs

function unwrapToolOutput(output: unknown): unknown {
    if (typeof output !== 'object' || output === null) return output
    if (!('type' in output) || !('value' in output)) return output
    const record = output as Record<string, unknown>
    if (record['type'] === 'json') {
        return record['value']
    }
    return output
}

export const agentPersistenceUtils = {
    unwrapToolOutput,
}

export type BatchItemResult = {
    index: number
    success: boolean
    output?: unknown
    error?: string
}

export type BatchProgressData = {
    label: string
    total: number
    completed: number
    succeeded: number
    failed: number
    done: boolean
    results: BatchItemResult[]
}

export type AgentAllowedMimeType = typeof CHAT_ALLOWED_MIME_TYPES[number]
export { CHAT_ALLOWED_MIME_TYPES }

export { agentToolClassification } from './tool-classification'
export { agentToolPhases, type AgentPhase } from './tool-phases'
export { chatVisibility, type ResolveChatEnabledParams } from './chat-visibility'
