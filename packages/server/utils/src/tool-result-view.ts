import { isNil, isObject, tryCatchSync } from '@activepieces/core-utils'
import { largeResultUtils } from './large-result-utils'

function payloadOf(stored: unknown): { text: string | null, json: unknown, complete: boolean } {
    const text = typeof stored === 'string' ? stored : textOf(stored)
    if (text === null) {
        return { text, json: stored, complete: true }
    }
    const { json, complete } = splitText(text)
    return { text, json, complete }
}

function textOf(result: unknown): string | null {
    if (!isObject(result) || !Array.isArray(result['content'])) {
        return null
    }
    return result['content']
        .filter((part): part is { type: 'text', text: string } => isObject(part) && part['type'] === 'text' && typeof part['text'] === 'string')
        .map((part) => part.text)
        .join('\n')
}

function modelVisibleBytes(result: unknown): number | null {
    return largeResultUtils.byteSizeOf(textOf(result) ?? result)
}

function read({ stored, fileId, path, fields, offset = 0, limit, search }: ReadParams): string {
    const { text, json, complete } = payloadOf(stored)
    if (text !== null && (json === null || (!complete && isNil(path) && isNil(fields)))) {
        return readText({ text, fileId, offset, limit: limit ?? DEFAULT_LINE_LIMIT, search })
    }
    return readJson({ payload: json, fileId, path, fields, offset, limit: limit ?? DEFAULT_ITEM_LIMIT, search })
}

function textPreview({ text, fileId, byteSize, label }: { text: string, fileId: string, byteSize: number, label: string }): string {
    const { note, json } = splitText(text)
    const size = `${label}: ~${Math.round(byteSize / 1024)}KB`
    if (json !== null) {
        const hint = `[Long values and lists above are shortened; the structure is complete. The full result is saved: read any part with ap_read_result({ fileId: '${fileId}', path: '${Array.isArray(json) ? '[0]' : '<key>'}', fields: [...] }) or search it. Do not call ${label} again for this.]`
        const fitted = largeResultUtils.fitToBudget({ value: json, maxBytes: PREVIEW_BYTES, wrap: (shrunk) => `${size}, shortened to fit.${note.length > 0 ? `\n${note}` : ''}\n${shrunk}\n\n${hint}` })
        if (fitted !== null) {
            return fitted
        }
        const shape = smallestShapeThatFits({ value: json, budget: PREVIEW_BYTES }) ?? describeKeys(json)
        return `${size}, too large to preview whole, so here is its shape (values clipped).${note.length > 0 ? `\n${note}` : ''}\n${shape}\n\n${hint}`
    }
    const lines = linesOf(text)
    const kept = linesWithinBudget({ lines, start: 0, maxLines: lines.length, budget: PREVIEW_BYTES })
    const end = kept.length
    return [
        `${size}, shown in part. Lines 1–${end} of ${lines.length}:`,
        kept.join('\n'),
        `[The full result is saved. Read the rest with ap_read_result({ fileId: '${fileId}', offset: ${end} }), or jump to what you need with ap_read_result({ fileId: '${fileId}', search: '<text>' }). Do not call ${label} again for this.]`,
    ].join('\n\n')
}

function splitText(text: string): { note: string, json: unknown, complete: boolean } {
    const lines = text.split('\n')
    const start = lines.findIndex((line) => /^\s*[[{]/.test(line))
    if (start === -1) {
        return { note: text, json: null, complete: false }
    }
    const before = lines.slice(0, start).join('\n').trim()
    const whole = parseJson(lines.slice(start).join('\n'))
    if (whole !== null) {
        return { note: before, json: whole, complete: true }
    }
    const single = parseJson(lines[start])
    const after = lines.slice(start + 1).join('\n').trim()
    return single === null
        ? { note: text, json: null, complete: false }
        : { note: [before, after.length > MAX_TRAILING_NOTE_CHARS ? `${after.slice(0, MAX_TRAILING_NOTE_CHARS)}…` : after].filter((part) => part.length > 0).join('\n\n'), json: single, complete: false }
}

function smallestShapeThatFits({ value, budget }: { value: unknown, budget: number }): string | null {
    for (const limits of PREVIEW_SHAPES) {
        const shape = safeStringify(shrinkForPreview(value, limits)) ?? ''
        if (Buffer.byteLength(shape, 'utf8') <= budget) {
            return shape
        }
    }
    return null
}

function shrinkForPreview(value: unknown, opts: PreviewLimits): unknown {
    const depth = opts.depth ?? 0
    if (typeof value === 'string') {
        return value.length <= opts.maxString ? value : `${value.slice(0, opts.maxString)}…`
    }
    if (Array.isArray(value)) {
        if (depth >= opts.maxDepth) return `[${value.length} items]`
        const kept = value.slice(0, opts.maxArray).map((item) => shrinkForPreview(item, { ...opts, depth: depth + 1 }))
        return value.length > opts.maxArray ? [...kept, `…+${value.length - opts.maxArray} more`] : kept
    }
    if (isObject(value)) {
        if (depth >= opts.maxDepth) return '{…}'
        return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, shrinkForPreview(val, { ...opts, depth: depth + 1 })]))
    }
    return value
}

function readText({ text, fileId, offset, limit, search }: { text: string, fileId: string, offset: number, limit: number, search?: string }): string {
    const lines = linesOf(text)
    if (search !== undefined && search.length > 0) {
        const needle = search.toLowerCase()
        const matches = lines.flatMap((line, index) => line.toLowerCase().includes(needle) ? [`${index + 1}: ${line}`] : [])
        if (matches.length === 0) {
            return `No line contains "${search}" (${lines.length} lines). Try a shorter search or read by offset.`
        }
        const kept = linesWithinBudget({ lines: matches, start: 0, maxLines: limit, budget: READ_BYTES })
        return `${matches.length} line(s) contain "${search}"${kept.length < matches.length ? `, first ${kept.length} shown` : ''}. Read around one with ap_read_result({ fileId: '${fileId}', offset: <line - 1> }).\n${kept.join('\n')}`
    }
    const kept = linesWithinBudget({ lines, start: offset, maxLines: limit, budget: READ_BYTES })
    const end = offset + kept.length
    const next = end < lines.length ? `\n\n[More: ap_read_result({ fileId: '${fileId}', offset: ${end} })]` : ''
    return `Lines ${offset + 1}–${end} of ${lines.length}:\n${kept.join('\n')}${next}`
}

function readJson({ payload, fileId, path, fields, offset, limit, search }: { payload: unknown, fileId: string, path?: string, fields?: string[], offset: number, limit: number, search?: string }): string {
    const target = path === undefined || path.length === 0 ? payload : valueAt({ value: payload, path })
    if (target === undefined) {
        return `Nothing at "${path}". ${describeKeys(payload)}`
    }
    const where = path === undefined || path.length === 0 ? 'the root' : `"${path}"`
    if (typeof target === 'string' && Buffer.byteLength(target, 'utf8') > READ_BYTES) {
        const chunk = target.slice(offset, offset + STRING_CHUNK_CHARS)
        const end = offset + chunk.length
        const next = end < target.length ? `\n\n[More: ap_read_result({ fileId: '${fileId}', path: '${path ?? ''}', offset: ${end} })]` : ''
        return `Characters ${offset + 1}–${end} of ${target.length} at ${where}:\n${chunk}${next}`
    }
    if (Array.isArray(target)) {
        const filtered = search === undefined || search.length === 0
            ? target
            : target.filter((item) => (safeStringify(item) ?? '').toLowerCase().includes(search.toLowerCase()))
        const page = filtered.slice(offset, offset + limit).map((item) => pick({ value: item, fields }))
        const end = offset + page.length
        const header = `Items ${offset + 1}–${end} of ${filtered.length}${search ? ` matching "${search}"` : ''} at ${where}:`
        const next = end < filtered.length ? `\n\n[More: ap_read_result({ fileId: '${fileId}', path: '${path ?? ''}', offset: ${end} })]` : ''
        return fitted({ header, value: page, footer: next })
    }
    return fitted({ header: `Value at ${where}:`, value: pick({ value: target, fields }), footer: '' })
}

function fitted({ header, value, footer }: { header: string, value: unknown, footer: string }): string {
    const json = safeStringify(value) ?? String(value)
    if (Buffer.byteLength(json, 'utf8') <= READ_BYTES) {
        return `${header}\n${json}${footer}`
    }
    const shape = smallestShapeThatFits({ value, budget: READ_BYTES }) ?? describeKeys(value)
    return `${header} too large to show whole, so here is its shape (values clipped). Read a deeper path, pass fields, or lower limit:\n${shape}${footer}`
}

function valueAt({ value, path }: { value: unknown, path: string }): unknown {
    return (path.match(PATH_TOKEN) ?? []).reduce<unknown>((current, token) => {
        if (Array.isArray(current) && /^\d+$/.test(token)) return current[Number(token)]
        if (isObject(current)) return current[token]
        return undefined
    }, value)
}

function pick({ value, fields }: { value: unknown, fields?: string[] }): unknown {
    if (fields === undefined || fields.length === 0 || !isObject(value)) {
        return value
    }
    return Object.fromEntries(fields.map((field) => [field, valueAt({ value, path: field })]).filter(([, val]) => val !== undefined))
}

function describeKeys(payload: unknown): string {
    if (Array.isArray(payload)) return `The root is a list of ${payload.length} items; use offset/limit, or a path like "0.name".`
    if (isObject(payload)) return `Top-level keys: ${Object.keys(payload).slice(0, 40).join(', ')}.`
    return 'The result has no keys.'
}

function linesWithinBudget({ lines, start, maxLines, budget }: { lines: string[], start: number, maxLines: number, budget: number }): string[] {
    const kept: string[] = []
    let bytes = 0
    for (const line of lines.slice(start, start + maxLines)) {
        bytes += Buffer.byteLength(line, 'utf8') + 1
        if (bytes > budget && kept.length > 0) {
            break
        }
        kept.push(line)
    }
    return kept
}

function linesOf(text: string): string[] {
    return text.split('\n').flatMap((line) => line.length <= MAX_LINE_CHARS
        ? [line]
        : Array.from({ length: Math.ceil(line.length / MAX_LINE_CHARS) }, (_, index) => line.slice(index * MAX_LINE_CHARS, (index + 1) * MAX_LINE_CHARS)))
}

function parseJson(text: string): unknown {
    const trimmed = text.trim()
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null
    const { data, error } = tryCatchSync((): unknown => JSON.parse(trimmed))
    return isNil(error) ? data : null
}

function safeStringify(value: unknown): string | null {
    const { data } = tryCatchSync(() => JSON.stringify(value))
    return data ?? null
}

const PATH_TOKEN = /[^.[\]]+/g
const DEFAULT_LINE_LIMIT = 200
const DEFAULT_ITEM_LIMIT = 20
const MAX_LINE_CHARS = 2_000
const READ_BYTES = 24 * 1024
const STRING_CHUNK_CHARS = 6_000
const PREVIEW_BYTES = 16 * 1024
const MAX_TRAILING_NOTE_CHARS = 6_000
const PREVIEW_SHAPES: PreviewLimits[] = [
    { maxDepth: 4, maxString: 60, maxArray: 15 },
    { maxDepth: 3, maxString: 40, maxArray: 10 },
    { maxDepth: 3, maxString: 30, maxArray: 5 },
    { maxDepth: 2, maxString: 30, maxArray: 3 },
]

export const MODEL_RESULT_OFFLOAD_BYTES = 32 * 1024

export const toolResultView = {
    textOf,
    modelVisibleBytes,
    read,
    textPreview,
    shrinkForPreview,
}

type PreviewLimits = { maxDepth: number, maxString: number, maxArray: number, depth?: number }

type ReadParams = {
    stored: unknown
    fileId: string
    path?: string
    fields?: string[]
    offset?: number
    limit?: number
    search?: string
}
