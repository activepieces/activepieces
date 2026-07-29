import {
    buildSystemPromptWithCaching,
    collapseStaleToolOutputs,
    collectStepMessages,
    ContentPartLike,
    estimateTokenCount,
    sanitizeTruncatedAssistantTail,
    stripThinkingBlocks,
} from '@activepieces/core-agent-runtime';
import { buildProviderOptions, buildWebSearchTools, createChatModel, supportsWebSearch } from '@activepieces/core-agent-runtime/model';
import { spreadIfDefined } from '@activepieces/core-utils';
import { chatPersistenceUtils, chatToolClassification, PersistedChatPart, PersistedChatPartType, PersistedToolCallStatus } from '@activepieces/shared';
import { ModelMessage } from 'ai'

function collapseStaleChatToolOutputs({ messages }: { messages: ModelMessage[] }): ModelMessage[] {
    return collapseStaleToolOutputs({ messages, neverCollapseToolNames: CHAT_SCHEMA_TOOL_NAMES })
}

// The runtime takes a generic `extraLength` so a caller can account for anything outside the
// messages; chat only ever passes the system prompt. Kept under the original name so the facade
// stays a drop-in for every existing call site.
function estimateChatTokenCount({ messages, systemPromptLength }: {
    messages: ModelMessage[]
    systemPromptLength: number
}): number {
    return estimateTokenCount({ messages, extraLength: systemPromptLength })
}

// Tool results that are the agent's working memory of an action's input schema — never
// collapsed, so it doesn't re-discover or guess a schema it already fetched.
export const CHAT_SCHEMA_TOOL_NAMES: ReadonlySet<string> = new Set(['ap_get_piece_props', 'ap_prepare_action'])

function toRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function buildStepParts({ content }: {
    content: ContentPartLike[]
}): PersistedChatPart[] {
    const resultMap = new Map<string, ContentPartLike>()
    for (const part of content) {
        if ((part.type === 'tool-result' || part.type === 'tool-error') && part.toolCallId) {
            resultMap.set(part.toolCallId, part)
        }
    }

    const parts: PersistedChatPart[] = []
    for (const part of content) {
        switch (part.type) {
            case 'reasoning':
                if (part.text) parts.push({ type: PersistedChatPartType.REASONING, text: part.text })
                break
            case 'text':
                if (part.text) parts.push({ type: PersistedChatPartType.TEXT, text: part.text })
                break
            case 'source':
                if (part.sourceType === 'url' && part.url) {
                    parts.push({
                        type: PersistedChatPartType.SOURCE_URL,
                        sourceId: part.id ?? '',
                        url: part.url,
                        ...spreadIfDefined('title', part.title),
                    })
                }
                else if (part.sourceType === 'document') {
                    parts.push({
                        type: PersistedChatPartType.SOURCE_DOCUMENT,
                        sourceId: part.id ?? '',
                        mediaType: part.mediaType ?? '',
                        title: part.title ?? '',
                        ...spreadIfDefined('filename', part.filename),
                    })
                }
                break
            case 'tool-call': {
                const toolName = part.toolName ?? ''
                const input = toRecord(part.args ?? part.input)
                if (toolName === 'ap_update_thinking_status') {
                    const statusText = typeof input['status'] === 'string' ? input['status'] : ''
                    if (statusText) {
                        parts.push({ type: PersistedChatPartType.THINKING_STATUS, text: statusText })
                    }
                    break
                }
                const result = part.toolCallId ? resultMap.get(part.toolCallId) : undefined
                const rawOutput = result?.output ? chatPersistenceUtils.unwrapToolOutput(result.output) : undefined
                const title = typeof input['title'] === 'string' ? input['title'] : undefined
                const description = typeof input['description'] === 'string' ? input['description'] : undefined
                parts.push({
                    type: PersistedChatPartType.TOOL_CALL,
                    toolCallId: part.toolCallId ?? '',
                    toolName,
                    ...spreadIfDefined('title', title),
                    ...spreadIfDefined('description', description),
                    input,
                    output: rawOutput,
                    status: result ? PersistedToolCallStatus.COMPLETED : PersistedToolCallStatus.ERROR,
                })
                if (toolName === 'ap_execute_action' && typeof rawOutput === 'object' && rawOutput !== null && 'batchProgress' in rawOutput) {
                    parts.push({
                        type: PersistedChatPartType.BATCH_PROGRESS,
                        data: (rawOutput as Record<string, unknown>)['batchProgress'] as Record<string, unknown>,
                    })
                }
                if (toolName === 'ap_set_build_plan') {
                    const buildId = typeof toRecord(rawOutput)['buildId'] === 'string' ? toRecord(rawOutput)['buildId'] : undefined
                    if (typeof buildId === 'string') {
                        parts.push({
                            type: PersistedChatPartType.BUILD_PLAN,
                            buildId,
                            data: { ...input, updatedAt: new Date().toISOString() },
                        })
                    }
                }
                if (toolName === 'ap_generate_image' && result) {
                    const out = typeof rawOutput === 'object' && rawOutput !== null ? rawOutput as Record<string, unknown> : {}
                    const imageUrl = typeof out['url'] === 'string' ? out['url'] : undefined
                    const imageFileId = typeof out['fileId'] === 'string' ? out['fileId'] : undefined
                    if (imageUrl && imageFileId) {
                        parts.push({
                            type: PersistedChatPartType.IMAGE,
                            toolCallId: part.toolCallId ?? '',
                            fileId: imageFileId,
                            url: imageUrl,
                            mediaType: typeof out['mediaType'] === 'string' ? out['mediaType'] : 'image/png',
                            ...spreadIfDefined('prompt', typeof out['prompt'] === 'string' ? out['prompt'] : undefined),
                            ...spreadIfDefined('model', typeof out['model'] === 'string' ? out['model'] : undefined),
                            ...spreadIfDefined('title', title),
                            timestamp: new Date().toISOString(),
                        })
                    }
                }
                if (toolName === 'ap_run_code' && result) {
                    const out = typeof rawOutput === 'object' && rawOutput !== null ? rawOutput as Record<string, unknown> : {}
                    const producedFiles = Array.isArray(out['producedFiles']) ? out['producedFiles'] : []
                    for (const file of producedFiles) {
                        if (typeof file !== 'object' || file === null) continue
                        const fileRecord = file as Record<string, unknown>
                        const fileUrl = typeof fileRecord['url'] === 'string' ? fileRecord['url'] : undefined
                        const fileId = typeof fileRecord['fileId'] === 'string' ? fileRecord['fileId'] : undefined
                        if (!fileUrl || !fileId) continue
                        parts.push({
                            type: PersistedChatPartType.FILE,
                            toolCallId: part.toolCallId ?? '',
                            fileId,
                            url: fileUrl,
                            mediaType: typeof fileRecord['mediaType'] === 'string' ? fileRecord['mediaType'] : 'application/octet-stream',
                            fileName: typeof fileRecord['fileName'] === 'string' ? fileRecord['fileName'] : 'file',
                            byteSize: typeof fileRecord['byteSize'] === 'number' ? fileRecord['byteSize'] : 0,
                            ...spreadIfDefined('title', title),
                            timestamp: new Date().toISOString(),
                        })
                    }
                }
                if (toolName === 'ap_execute_action' && result) {
                    const outputRecord = typeof rawOutput === 'object' && rawOutput !== null ? rawOutput as Record<string, unknown> : {}
                    const meta = typeof outputRecord['_meta'] === 'object' && outputRecord['_meta'] !== null ? outputRecord['_meta'] as Record<string, unknown> : undefined
                    const connectionLabel = typeof meta?.['connectionLabel'] === 'string' ? meta['connectionLabel'] : undefined
                    const firstContentText = Array.isArray(outputRecord['content']) && typeof outputRecord['content'][0]?.['text'] === 'string' ? outputRecord['content'][0]['text'] as string : ''
                    const isAppSuccess = result.type === 'tool-result'
                        && outputRecord['success'] !== false
                        && outputRecord['isError'] !== true
                        && !chatToolClassification.hasFailureTextPrefix(firstContentText)
                        && !firstContentText.includes('cancelled by user')
                    const errorText = !isAppSuccess && firstContentText
                        ? firstContentText
                        : (result.type === 'tool-error' && typeof result.output === 'string' ? result.output : undefined)
                    parts.push({
                        type: PersistedChatPartType.ACTION_RECEIPT,
                        toolCallId: part.toolCallId ?? '',
                        actionDisplayName: title ?? toolName,
                        pieceName: typeof input['pieceName'] === 'string' ? input['pieceName'] : '',
                        ...spreadIfDefined('connectionLabel', connectionLabel),
                        status: isAppSuccess ? 'success' : 'failed',
                        output: rawOutput,
                        ...spreadIfDefined('errorMessage', errorText),
                        timestamp: new Date().toISOString(),
                    })
                }
                break
            }
        }
    }
    return parts
}

const DATA_ARRAY_KEYS = ['data', 'results', 'records', 'items', 'value', 'rows', 'entries']
const PREVIEW_RECORD_COUNT = 5

function findDataArray(payload: unknown): { array: unknown[], path: string } | null {
    if (Array.isArray(payload)) {
        return { array: payload, path: 'root' }
    }
    if (!isPlainObject(payload)) {
        return null
    }
    for (const key of DATA_ARRAY_KEYS) {
        const value = payload[key]
        if (Array.isArray(value)) {
            return { array: value, path: key }
        }
    }
    return null
}

// Depth-capped, value-clipped copy of a value — shows the SHAPE of a record (so the model can
// see how to project it) without dragging the full payload (incl. deep history) into context.
function shrinkForPreview(value: unknown, opts: { maxDepth: number, maxString: number, maxArray: number, depth?: number }): unknown {
    const depth = opts.depth ?? 0
    if (typeof value === 'string') {
        return value.length <= opts.maxString ? value : `${value.slice(0, opts.maxString)}…`
    }
    if (Array.isArray(value)) {
        if (depth >= opts.maxDepth) return `[${value.length} items]`
        const kept = value.slice(0, opts.maxArray).map((item) => shrinkForPreview(item, { ...opts, depth: depth + 1 }))
        return value.length > opts.maxArray ? [...kept, `…+${value.length - opts.maxArray} more`] : kept
    }
    if (isPlainObject(value)) {
        if (depth >= opts.maxDepth) return '{…}'
        return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, shrinkForPreview(val, { ...opts, depth: depth + 1 })]))
    }
    return value
}

// Builds a compact, never-mangled preview of a large tool result: a depth-capped shape sample of
// the first few records + a clear instruction to process the FULL data with ap_run_code via the
// offloaded fileId (so the giant payload never enters the model context). When there is no fileId
// (backstop path), it instead steers toward narrowing/paginating.
function buildLargeResultPreview({ payload, byteSize, fileId, label = 'Result', statusNote = '' }: {
    payload: unknown
    byteSize: number
    fileId?: string
    label?: string
    statusNote?: string
}): string {
    const kb = Math.round(byteSize / 1024)
    const found = findDataArray(payload)
    if (found) {
        const previewCount = Math.min(found.array.length, PREVIEW_RECORD_COUNT)
        const preview = found.array.slice(0, previewCount).map((record) => shrinkForPreview(record, { maxDepth: 4, maxString: 200, maxArray: 4 }))
        const how = fileId !== undefined
            ? `→ Full result (all ${found.array.length} records) saved as file ${fileId}. Process it with ap_run_code: pass inputFileIds:['${fileId}'] and read inputs.data (parsed JSON) — pull just the fields you need (e.g. name, stage, value, owner), then return a compact summary. Do NOT re-run this call or regex the preview.`
            : `→ Narrow with a filter/limit or paginate (offset/cursor) to get the rest — or process it in ap_run_code.`
        return `✅ ${label} completed${statusNote}. ${found.array.length} record(s) at "${found.path}", ~${kb}KB — too large to load inline.\nShape preview (first ${previewCount}, values clipped):\n${JSON.stringify(preview, null, 2)}\n\n${how}`
    }
    const preview = shrinkForPreview(payload, { maxDepth: 3, maxString: 300, maxArray: 5 })
    const how = fileId !== undefined
        ? `→ Full result saved as file ${fileId}. Inspect/process it with ap_run_code via inputFileIds:['${fileId}'] (read inputs.data).`
        : '→ Process it in ap_run_code or request a narrower slice.'
    return `✅ ${label} completed${statusNote}. Large result ~${kb}KB — too large to load inline.\nShape preview (clipped):\n${JSON.stringify(preview, null, 2)}\n\n${how}`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const chatAiUtils = {
    createChatModel,
    supportsWebSearch,
    buildWebSearchTools,
    stripThinkingBlocks,
    sanitizeTruncatedAssistantTail,
    collectStepMessages,
    estimateTokenCount: estimateChatTokenCount,
    collapseStaleToolOutputs: collapseStaleChatToolOutputs,
    buildProviderOptions,
    buildSystemPromptWithCaching,
    buildStepParts,
    findDataArray,
    buildLargeResultPreview,
}

export type { ContentPartLike }
