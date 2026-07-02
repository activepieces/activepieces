import { ChatPromptOverride } from '@activepieces/core-execution'
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
    // A gate/approval card that has opened but not yet resolved. Persisted the moment the gate
    // opens so the interactive card survives a page reload from history alone (independent of the
    // in-memory pending-gate cache). Replaced in place by COMPLETED/ERROR once the gate resolves.
    PENDING = 'pending',
    // A PENDING gate the user abandoned by sending a NEW message instead of answering it. Flipped
    // on the next send so an ignored card can't hijack every future crash-recovery (Fix R3): it
    // renders as a non-interactive, dismissed card and is invisible to gate/recovery routing.
    SUPERSEDED = 'superseded',
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
    title: z.string().optional(),
    description: z.string().optional(),
    input: z.record(z.string(), z.unknown()),
    output: z.unknown().optional(),
    status: z.enum([PersistedToolCallStatus.COMPLETED, PersistedToolCallStatus.ERROR, PersistedToolCallStatus.PENDING, PersistedToolCallStatus.SUPERSEDED]),
    errorText: z.string().optional(),
})

const PersistedThinkingStatusPartSchema = z.object({
    type: z.literal(PersistedChatPartType.THINKING_STATUS),
    text: z.string(),
})

const PersistedBatchProgressPartSchema = z.object({
    type: z.literal(PersistedChatPartType.BATCH_PROGRESS),
    data: z.record(z.string(), z.unknown()),
})

const PersistedActionReceiptPartSchema = z.object({
    type: z.literal(PersistedChatPartType.ACTION_RECEIPT),
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
    type: z.literal(PersistedChatPartType.BUILD_PLAN),
    buildId: z.string(),
    data: z.record(z.string(), z.unknown()),
})

const PersistedSourceUrlPartSchema = z.object({
    type: z.literal(PersistedChatPartType.SOURCE_URL),
    sourceId: z.string(),
    url: z.string(),
    title: z.string().optional(),
})

const PersistedSourceDocumentPartSchema = z.object({
    type: z.literal(PersistedChatPartType.SOURCE_DOCUMENT),
    sourceId: z.string(),
    mediaType: z.string(),
    title: z.string(),
    filename: z.string().optional(),
})

const PersistedImagePartSchema = z.object({
    type: z.literal(PersistedChatPartType.IMAGE),
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
    type: z.literal(PersistedChatPartType.FILE),
    toolCallId: z.string(),
    fileId: z.string(),
    url: z.string(),
    mediaType: z.string(),
    fileName: z.string(),
    byteSize: z.number(),
    title: z.string().optional(),
    timestamp: z.string(),
})

const PersistedChatPartSchema = z.discriminatedUnion('type', [
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

export const PersistedChatMessageSchema = z.object({
    role: z.enum([PersistedChatRole.USER, PersistedChatRole.ASSISTANT]),
    parts: z.array(PersistedChatPartSchema),
    thinkingDurationMs: z.number().optional(),
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
export type PersistedChatPart = z.infer<typeof PersistedChatPartSchema>
export type PersistedChatMessage = z.infer<typeof PersistedChatMessageSchema>

export enum ChatConversationStatus {
    IDLE = 'IDLE',
    STREAMING = 'STREAMING',
    ERROR = 'ERROR',
}

// Shown to the user (and persisted as a normal assistant text bubble) when a turn is reclaimed
// because its worker went silent — a deploy, crash, or reload dropped the in-flight job. Shared so
// the API writes it, the sweeper de-dupes on it, and the web can key its retry affordance off it.
export const CHAT_INTERRUPTED_MESSAGE = 'This response was interrupted — the run stopped unexpectedly. Send your last message again to retry.'

// Injected (as a system-role message in the LLM history, never shown to the user) when a resume
// turn picks up after the previous run was interrupted mid-flight by a crash/deploy/reload. Tells
// the model the transcript above is everything already done and to verify-before-redo any write
// whose result is missing, rather than blindly re-executing side effects.
export const CHAT_CRASH_RESUME_NOTE = [
    '[system note — not from the user] The previous run handling this task was interrupted before it finished (a deploy, crash, or reload dropped it).',
    'The transcript above is everything that was already done — treat it as the source of truth.',
    'For any action you were about to take or may have started but whose result is not visible above AND which could have a side effect (sent an email, created/updated a record, triggered a run), VERIFY the current state with a read BEFORE doing it again — never blindly re-execute a write, to avoid duplicates.',
    'Then continue the task to completion from where it left off.',
].join(' ')

// How many times the watchdog will auto-resume a single user turn after crashes before giving up
// and falling back to the ERROR + interrupted-message banner. The spent count is derived durably by
// counting CHAT_CRASH_RESUME_NOTE occurrences in the conversation's LLM history since the last real
// user message — no DB column, and it survives a full worker restart.
export const CHAT_MAX_AUTO_RESUMES = 3

// Persisted as the tool result of an approval-gate (ap_execute_action / ap_send_email / ap_test_flow)
// that the user approved AFTER its worker died. The side-effecting execution died with the worker, so
// this is explicitly NOT an execution — it tells the resumed model the action is pre-approved and must
// be re-issued now. Paired with a one-shot pre-approval in the store so the re-issued call runs
// without opening a second card. `executed: false` keeps the flipped card from reading as "done".
export const CHAT_LATE_APPROVAL_MARKER = {
    approved: true,
    executed: false,
    note: 'The user approved this after the original run ended — the action was NOT executed. Re-run it now; it is pre-approved, so do not ask again.',
} as const

// Email's late-approve marker (Fix R1d). ap_send_email deliberately re-opens its confirmation card
// on resume (the SMTP boundary re-verifies the exact recipients/subject/body against the recorded
// decision), so — unlike the generic marker above — this one must NOT say "do not ask again". No
// pre-approval token is stored for email; the resumed model re-issues the send and the user confirms
// it once more on the card that reappears.
export const CHAT_LATE_APPROVAL_MARKER_EMAIL = {
    approved: true,
    executed: false,
    note: 'The user approved this after the original run ended — the email was NOT sent. Re-issue the send now. A confirmation card will be shown again to confirm the recipients and content before it goes out.',
} as const

export const ChatConversation = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    projectId: Nullable(z.string()),
    userId: z.string(),
    title: Nullable(z.string()),
    modelName: Nullable(z.string()),
    status: z.nativeEnum(ChatConversationStatus).default(ChatConversationStatus.IDLE),
    activeRunId: Nullable(z.string()),
    messages: z.array(z.record(z.string(), z.unknown())).default([]),
    uiMessages: z.array(PersistedChatMessageSchema).nullable().default(null),
    summary: Nullable(z.string()),
    summarizedUpToIndex: Nullable(z.number().int()),
})
export type ChatConversation = z.infer<typeof ChatConversation>

export const CreateChatConversationRequest = z.object({
    title: z.optional(Nullable(z.string())),
    modelName: z.optional(Nullable(z.string())),
})
export type CreateChatConversationRequest = z.infer<typeof CreateChatConversationRequest>

export const UpdateChatConversationRequest = z.object({
    title: z.optional(Nullable(z.string())),
    modelName: z.optional(Nullable(z.string())),
})
export type UpdateChatConversationRequest = z.infer<typeof UpdateChatConversationRequest>

export const SendChatMessageRequest = z.object({
    content: z.string().max(51200),
    runId: z.string().optional(),
    files: z.array(ChatMessageFile).max(10).optional(),
}).refine(
    (val) => val.content.length > 0 || (val.files && val.files.length > 0),
    { message: formErrors.messageRequiresContentOrFiles },
)
export type SendChatMessageRequest = z.infer<typeof SendChatMessageRequest>

export const SimulateChatRequest = z.object({
    platformId: z.string(),
    userMessage: z.string().min(1).max(51200).optional(),
    userMessages: z.array(z.string().min(1).max(51200)).min(1).optional(),
    promptOverride: ChatPromptOverride.optional(),
}).refine(
    (val) => val.userMessage !== undefined || (val.userMessages !== undefined && val.userMessages.length > 0),
    { message: formErrors.messageRequiresContentOrFiles },
)
export type SimulateChatRequest = z.infer<typeof SimulateChatRequest>

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

export type ChatToolOutputs = {
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

// Reads the context-compression metadata the worker attaches to a tool result's
// `structuredContent` when it shrank a large output before returning it to the model.
// Returns null when the field is absent or malformed, so the UI badge is fail-safe.
function readContextCompression(structuredContent: unknown): ChatContextCompression | null {
    if (typeof structuredContent !== 'object' || structuredContent === null) return null
    const candidate = (structuredContent as Record<string, unknown>)['contextCompression']
    if (typeof candidate !== 'object' || candidate === null) return null
    const record = candidate as Record<string, unknown>
    const method = record['method']
    const originalBytes = record['originalBytes']
    const returnedBytes = record['returnedBytes']
    const methodIsValid = method === 'condensed' || method === 'offloaded' || method === 'truncated'
    if (!methodIsValid || typeof originalBytes !== 'number' || typeof returnedBytes !== 'number') return null
    return { method, originalBytes, returnedBytes }
}

// Reserved key the Code Mode bridge adds to a bridged tool call's args to mark "this result is
// consumed by in-VM code, not the model — return the FULL, un-offloaded, un-truncated result".
// It rides on the top-level args object (which becomes `toolInput` across the worker→API RPC), so
// every offload layer can read it and skip its model-context protection. The piece's own input is
// nested under `input`, so this top-level key never reaches the executed action. Each layer strips
// it before handing args to the underlying tool / piece.
const CODE_MODE_RAW_RESULT_KEY = '__apCodeModeRawResult'

function markCodeModeRawArgs(args: unknown): Record<string, unknown> {
    if (typeof args !== 'object' || args === null || Array.isArray(args)) {
        return { [CODE_MODE_RAW_RESULT_KEY]: true }
    }
    return { ...args, [CODE_MODE_RAW_RESULT_KEY]: true }
}

function isCodeModeRawArgs(args: unknown): boolean {
    return typeof args === 'object' && args !== null && (args as Record<string, unknown>)[CODE_MODE_RAW_RESULT_KEY] === true
}

function stripCodeModeRawArgs(args: unknown): unknown {
    if (typeof args !== 'object' || args === null || Array.isArray(args) || !(CODE_MODE_RAW_RESULT_KEY in args)) {
        return args
    }
    const { [CODE_MODE_RAW_RESULT_KEY]: _omit, ...rest } = args as Record<string, unknown>
    return rest
}

export const chatPersistenceUtils = {
    unwrapToolOutput,
    readContextCompression,
}

// Marks/reads/strips the Code Mode "give me the raw, un-reduced result" flag on bridged tool-call
// args. The bridge marks; each offload layer reads it to skip truncation/offload and strips it
// before invoking the underlying tool. Keeps the magic-key in one place across worker + API.
export const chatCodeModeUtils = {
    markRawArgs: markCodeModeRawArgs,
    isRawArgs: isCodeModeRawArgs,
    stripRawArgs: stripCodeModeRawArgs,
}

export type ChatContextCompressionMethod = 'condensed' | 'offloaded' | 'truncated'

// Surfaced on a tool result's `structuredContent.contextCompression` so the chat UI can show a
// "Context compression" badge on tool calls whose (often large) output was reduced before being
// returned to the model. `originalBytes`/`returnedBytes` are the serialized sizes before/after.
export type ChatContextCompression = {
    method: ChatContextCompressionMethod
    originalBytes: number
    returnedBytes: number
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

export type ChatAllowedMimeType = typeof CHAT_ALLOWED_MIME_TYPES[number]
export { CHAT_ALLOWED_MIME_TYPES }

export { chatToolClassification } from './tool-classification'
export { chatToolPhases, type ChatPhase } from './tool-phases'
export { chatVisibility, type ResolveChatEnabledParams } from './chat-visibility'
