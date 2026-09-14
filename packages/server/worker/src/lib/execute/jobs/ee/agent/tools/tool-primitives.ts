import { isNil, isObject, spreadIfDefined } from '@activepieces/core-utils'
import { largeResultUtils, MAX_TOOL_RESULT_BYTES } from '@activepieces/server-utils'
import { ActionPreviewEvent, ActionReceiptEvent, agentToolClassification, BuildPlanEvent, FileProducedEvent, ImageGeneratedEvent, ToolProgressEvent } from '@activepieces/shared'
import { ToolExecutionOptions, ToolSet } from 'ai'
import { z } from 'zod'

export const TOOL_EXECUTION_TIMEOUT_MS = 5 * 60 * 1_000
const CARD_ERROR_MAX_LENGTH = 300
export const FETCH_URL_TIMEOUT_MS = 30 * 1_000
export const MAX_FETCH_URL_BYTES = 5 * 1024 * 1024
const READABLE_TEXT_CONTENT_TYPE = /^(text\/|application\/(json|xml|javascript|x-ndjson|[^;]*\+json|[^;]*\+xml))/i

// Keep in sync with ALLOWED_QUESTION_ICONS in packages/web/.../question-inputs/question-icon.tsx
export const QUESTION_ICON_NAMES = 'mail, message-square, message-circle, send, bell, calendar, calendar-clock, clock, zap, database, table, file-text, file, folder, globe, link, hash, phone, smartphone, user, users, user-plus, tag, tags, filter, search, check, check-circle, x, x-circle, circle, alert-triangle, alert-circle, info, star, heart, flag, bookmark, repeat, refresh-cw, play, pause, square, settings, sliders-horizontal, plus, minus, trash-2, pencil, download, upload, cloud, server, lock, key, shield, eye, dollar-sign, credit-card, bar-chart, line-chart, pie-chart, trending-up, image, video, mic, map-pin, truck, package, gift, briefcase, building, home, bot, sparkles, rocket, thumbs-up, thumbs-down, smile, sun, moon, wifi'

export const questionTitleSchema = z.string().optional().describe('Optional short section title')
export const questionTextSchema = z.string().describe('The question text')

export const cardTitleFields = {
    title: z.string().optional().describe('Short 2-4 word fallback label for the tool card, e.g. "Search emails".'),
    activeTitle: z.string().optional().describe('Label shown WHILE this runs. Present continuous (-ing). Make it fun, casual, and centered on the value to the user, while still naming the real action or asset. E.g. "Hunting through Stripe payment docs", "Designing your Instagram post", "Digging through your Gmail".'),
    doneTitle: z.string().optional().describe('The SAME label once it finishes. Past tense (-ed), consistent with activeTitle. E.g. "Found the Stripe payment docs", "Designed your Instagram post", "Dug through your Gmail".'),
}
export const richOptionSchema = z.object({
    label: z.string().describe('The choice label'),
    piece: z.string().optional().describe('When this option IS an app/integration, set its piece name (e.g. "google-sheets", "hubspot", "@activepieces/piece-airtable") to show the real app logo. Prefer this over icon whenever the option is an app — use the exact piece names returned by ap_research_pieces.'),
    icon: z.string().optional().describe(`Optional Lucide icon name (kebab-case) for short (1-2 word) non-app labels (ignored if piece is set). Allowed names: ${QUESTION_ICON_NAMES}`),
    description: z.string().optional().describe('Optional one-line subtitle under the label'),
})

export async function withToolTimeout<T>({ fn, timeoutMs, toolName }: {
    fn: (signal: AbortSignal) => Promise<T>
    timeoutMs: number
    toolName: string
}): Promise<T> {
    const abortController = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
            abortController.abort()
            reject(new Error(`Tool "${toolName}" timed out after ${timeoutMs / 1_000} seconds. The operation took too long to complete. You may retry with different parameters or skip this step.`))
        }, timeoutMs)
    })
    try {
        return await Promise.race([fn(abortController.signal), timeoutPromise])
    }
    finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
        }
    }
}

export function truncateLargeResult(result: unknown): unknown {
    const byteSize = largeResultUtils.byteSizeOf(result)
    if (byteSize !== null && byteSize <= MAX_TOOL_RESULT_BYTES) return result

    const sizeNote = byteSize === null ? '' : ` The full response was ${Math.round(byteSize / 1024)}KB.`
    const fitted = largeResultUtils.fitToBudget({
        value: result,
        maxBytes: MAX_TOOL_RESULT_BYTES,
        wrap: (json) => buildOversizeEnvelope({
            result,
            text: `[LARGE RESPONSE — long values were truncated to fit, structure preserved]${sizeNote} Truncated values are marked with "…[truncated]".\n\n${json}`,
        }),
    })
    return fitted ?? buildOversizeEnvelope({
        result,
        text: `[LARGE RESPONSE] The response could not be included.${sizeNote} Retry with a more specific filter, request fewer items, or fetch only IDs/metadata.`,
    })
}

function buildOversizeEnvelope({ result, text }: { result: unknown, text: string }): { content: Array<{ type: 'text', text: string }> } {
    const meta = isObject(result) && isObject(result['_meta']) ? result['_meta'] : undefined
    return {
        content: [{ type: 'text', text }],
        ...spreadIfDefined('_meta', meta),
    }
}

export function normalizePieceName(piece: string): string {
    if (piece.startsWith('@')) return piece
    const stripped = piece.startsWith('piece-') ? piece.slice('piece-'.length) : piece
    return `@activepieces/piece-${stripped.replace(/_/g, '-')}`
}

export function gateNoResponseMessage(step: string): string {
    return `⏳ The user hasn't responded to the ${step} yet (it timed out) — they did NOT decline, they're just away. Decide based on how essential this step is: if the task can continue without it, skip only this step, keep going, and briefly tell the user what you skipped and why. If it is required to proceed, stop here and tell the user this step needs their approval — ask them to approve it to continue. Never assume approval or perform the gated action on your own.`
}

export function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`
}

export function describeHttpError(error: unknown): string {
    const base = error instanceof Error ? error.message : String(error)
    const response = isObject(error) && isObject(error['response']) ? error['response'] : undefined
    if (isNil(response)) {
        return base
    }
    const status = typeof response['status'] === 'number' ? response['status'] : undefined
    const data = response['data']
    const detail = typeof data === 'string' ? data : (isObject(data) ? JSON.stringify(data) : undefined)
    const prefix = isNil(status) ? base : `HTTP ${status}`
    if (isNil(detail) || detail.length === 0) {
        return prefix
    }
    const truncated = detail.length > CARD_ERROR_MAX_LENGTH ? `${detail.slice(0, CARD_ERROR_MAX_LENGTH)}…` : detail
    return `${prefix}: ${truncated}`
}

export function isSuccessResult(result: unknown): boolean {
    if (!isObject(result)) return false
    if (result['success'] === false) return false
    if (result['isError'] === true) return false
    if (Array.isArray(result['content'])) {
        const first = result['content'][0]
        const text = isObject(first) && typeof first['text'] === 'string' ? first['text'] : ''
        return !agentToolClassification.hasFailureTextPrefix(text)
    }
    return false
}

export function extractResultText(result: unknown): string {
    if (typeof result === 'string') return result
    if (!isObject(result)) return truncateForCard(JSON.stringify(result))
    if (typeof result['error'] === 'string') return result['error']
    if (Array.isArray(result['content'])) {
        return result['content']
            .filter((c): c is Record<string, unknown> & { text: string } => isObject(c) && typeof c['text'] === 'string')
            .map((c) => c.text)
            .join('\n')
    }
    return truncateForCard(JSON.stringify(result))
}

export function extractUserFacingError({ result, meta }: { result: unknown, meta?: Record<string, unknown> }): string {
    const summary = typeof meta?.['errorSummary'] === 'string' ? meta['errorSummary'] : undefined
    if (summary !== undefined && summary.trim().length > 0) {
        return summary.trim()
    }
    return truncateForCard(stripFailureDecoration(extractResultText(result)))
}

function stripFailureDecoration(text: string): string {
    return text
        .replace(/^[❌⏳✅]\s*/, '')
        .split('\n\nRetry suggestion:')[0]
        .trim()
}

export function truncateForCard(text: string): string {
    const trimmed = text.trim()
    return trimmed.length > CARD_ERROR_MAX_LENGTH ? `${trimmed.slice(0, CARD_ERROR_MAX_LENGTH)}…` : trimmed
}

export function isReadableTextContentType(contentType: string): boolean {
    return contentType === '' || READABLE_TEXT_CONTENT_TYPE.test(contentType)
}

export function toolHasExecute(tool: Record<string, unknown>): tool is Record<string, unknown> & { execute: (args: unknown, options?: ToolExecutionOptions<undefined>) => Promise<unknown> } {
    return typeof tool['execute'] === 'function'
}

export type AgentEventEmitter = {
    emitToolProgress(data: ToolProgressEvent): void
    emitActionPreview(data: ActionPreviewEvent): void
    emitActionReceipt(data: ActionReceiptEvent): void
    emitImageGenerated(data: ImageGeneratedEvent): void
    emitFileProduced(data: FileProducedEvent): void
    emitBuildPlan(data: BuildPlanEvent): void
}

export type TaintState = { tainted: boolean }

type GateOutcome = 'approved' | 'declined' | 'timeout' | 'aborted'
export type GateDecision = { outcome: GateOutcome, payload?: Record<string, unknown> }

export function wrapToolsWithTaint({ tools, taintState }: { tools: ToolSet, taintState: TaintState }): ToolSet {
    return Object.fromEntries(Object.entries(tools).map(([name, toolDef]) => {
        const run = toolDef.execute
        if (typeof run !== 'function') {
            return [name, toolDef]
        }
        return [name, {
            ...toolDef,
            execute: async (input: unknown, options: ToolExecutionOptions<undefined>) => {
                taintState.tainted = true
                return run(input, options)
            },
        }]
    }))
}

export type ResolvedToolConfig = { provider: string, apiKey: string, config?: Record<string, unknown> }
export type ImageStyle = 'realistic' | 'graphic_text' | 'brand_vector' | 'abstract'
export type ImageAspect = 'square' | 'landscape' | 'portrait'
export type ScrapedPage = { markdown: string, metadata: Record<string, unknown> }
export type GeneratedImage = { bytes: Buffer, mediaType: string, extension: string }

