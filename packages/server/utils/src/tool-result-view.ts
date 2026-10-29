import { isNil, isObject, tryCatchSync } from '@activepieces/core-utils'
import { largeResultUtils } from './large-result-utils'

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
    const { text, json, whole } = payloadOf(stored)
    const wantsJson = json !== null && (whole || !isNil(path) || (fields?.length ?? 0) > 0)
    if (!wantsJson) {
        return readText({ text: text ?? '', fileId, offset, limit: limit ?? DEFAULT_LINE_LIMIT, search: search || undefined, budget: READ_BYTES })
    }
    return readJson({ payload: json, fileId, path: path || undefined, fields, offset, limit: limit ?? DEFAULT_ITEM_LIMIT, search: search || undefined, budget: READ_BYTES })
}

function textPreview({ text, fileId, byteSize, label }: { text: string, fileId: string, byteSize: number, label: string }): string {
    const { json, note } = payloadOf(text)
    const header = `${label}: ~${Math.round(byteSize / 1024)}KB, shown in part.${note.length > 0 ? `\n${note}` : ''}`
    const budget = PREVIEW_BYTES - Buffer.byteLength(header, 'utf8')
    const body = json === null
        ? readText({ text, fileId, offset: 0, limit: DEFAULT_LINE_LIMIT, budget })
        : readJson({ payload: json, fileId, offset: 0, limit: DEFAULT_ITEM_LIMIT, budget })
    return `${header}\n${body}\n\n[The full result is saved as ${fileId}: read any part with ap_read_result (path, fields, offset, search). Do not call ${label} again for this.]`
}

function payloadOf(stored: unknown): { text: string | null, json: unknown, whole: boolean, note: string } {
    const text = typeof stored === 'string' ? stored : textOf(stored)
    if (text === null) {
        return { text, json: stored, whole: true, note: '' }
    }
    const start = text.search(/[[{]/)
    const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']')) + 1
    const json = start === -1 || end <= start ? null : parseJson(text.slice(start, end))
    if (json === null) {
        return { text, json, whole: false, note: '' }
    }
    const note = `${text.slice(0, start).trim()}\n${text.slice(end).trim()}`.trim().slice(0, MAX_NOTE_CHARS)
    return { text, json, whole: note.length === 0, note }
}

function readText({ text, fileId, path, offset, limit, search, budget }: { text: string, fileId: string, path?: string, offset: number, limit: number, search?: string, budget: number }): string {
    const lines = linesOf(text)
    if (!isNil(search)) {
        const needle = search.toLowerCase()
        const matches = lines.flatMap((line, index) => line.toLowerCase().includes(needle) ? [`${index + 1}: ${line}`] : [])
        if (matches.length === 0) {
            return `No line contains "${search}" (${lines.length} lines). Try a shorter search or read by offset.`
        }
        const kept = linesWithinBudget({ lines: matches, start: 0, maxLines: limit, budget })
        return `${matches.length} line(s) contain "${search}"${kept.length < matches.length ? `, first ${kept.length} shown` : ''}. Read around one with offset: <line - 1>.\n${kept.join('\n')}`
    }
    const kept = linesWithinBudget({ lines, start: offset, maxLines: limit, budget })
    const end = offset + kept.length
    return `Lines ${offset + 1}–${end} of ${lines.length}:\n${kept.join('\n')}${more({ fileId, path, offset: end, total: lines.length })}`
}

function readJson({ payload, fileId, path, fields, offset, limit, search, budget }: { payload: unknown, fileId: string, path?: string, fields?: string[], offset: number, limit: number, search?: string, budget: number }): string {
    const target = isNil(path) ? payload : valueAt({ value: payload, path })
    if (target === undefined) {
        return `Nothing at "${path}". ${describeKeys(payload)}`
    }
    if (typeof target === 'string') {
        return readText({ text: target, fileId, path, offset, limit: DEFAULT_LINE_LIMIT, search, budget })
    }
    const where = isNil(path) ? 'the root' : `"${path}"`
    if (!Array.isArray(target)) {
        return fitted({ header: `Value at ${where}:`, value: pick({ value: target, fields }), footer: '', budget })
    }
    const needle = search?.toLowerCase()
    const matching = isNil(needle) ? target : target.filter((item) => (JSON.stringify(item) ?? '').toLowerCase().includes(needle))
    const page = matching.slice(offset, offset + limit).map((item) => pick({ value: item, fields }))
    const end = offset + page.length
    const header = `Items ${offset + 1}–${end} of ${matching.length}${isNil(search) ? '' : ` matching "${search}"`} at ${where}:`
    return fitted({ header, value: page, footer: more({ fileId, path, offset: end, total: matching.length }), budget })
}

function fitted({ header, value, footer, budget }: { header: string, value: unknown, footer: string, budget: number }): string {
    const whole = `${header}\n${JSON.stringify(value)}${footer}`
    if (Buffer.byteLength(whole, 'utf8') <= budget) {
        return whole
    }
    return largeResultUtils.fitToBudget({ value, maxBytes: budget, wrap: (shrunk) => `${header} (shortened; read a deeper path, pass fields or lower limit for full values)\n${shrunk}${footer}` })
        ?? `${header} too large to show. ${describeKeys(value)}${footer}`
}

function more({ fileId, path, offset, total }: { fileId: string, path?: string, offset: number, total: number }): string {
    return offset < total ? `\n\n[More: ap_read_result({ fileId: '${fileId}'${isNil(path) ? '' : `, path: '${path}'`}, offset: ${offset} })]` : ''
}

function valueAt({ value, path }: { value: unknown, path: string }): unknown {
    return (path.match(PATH_TOKEN) ?? []).reduce<unknown>((current, token) => {
        if (Array.isArray(current) && /^\d+$/.test(token)) return current[Number(token)]
        if (isObject(current)) return current[token]
        return undefined
    }, value)
}

function pick({ value, fields }: { value: unknown, fields?: string[] }): unknown {
    if (isNil(fields) || fields.length === 0 || !isObject(value)) {
        return value
    }
    return Object.fromEntries(fields.map((field) => [field, valueAt({ value, path: field })]).filter(([, val]) => val !== undefined))
}

function describeKeys(payload: unknown): string {
    if (Array.isArray(payload)) return `It is a list of ${payload.length} items; use offset/limit, or a path like "0.name".`
    if (isObject(payload)) return `Top-level keys: ${Object.keys(payload).slice(0, 40).join(', ')}.`
    return 'It has no keys.'
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
    const { data, error } = tryCatchSync((): unknown => JSON.parse(text))
    return isNil(error) ? data : null
}

const PATH_TOKEN = /[^.[\]]+/g
const DEFAULT_LINE_LIMIT = 200
const DEFAULT_ITEM_LIMIT = 20
const MAX_LINE_CHARS = 2_000
const MAX_NOTE_CHARS = 2_000
const READ_BYTES = 24 * 1024
const PREVIEW_BYTES = 16 * 1024

export const MODEL_RESULT_OFFLOAD_BYTES = 32 * 1024

export const toolResultView = {
    textOf,
    modelVisibleBytes,
    read,
    textPreview,
}

type ReadParams = {
    stored: unknown
    fileId: string
    path?: string
    fields?: string[]
    offset?: number
    limit?: number
    search?: string
}
