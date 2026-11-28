import http from 'node:http'
import { vi } from 'vitest'

export const BASE_ID = 'appBase000000001'
export const TABLE_ID = 'tblTable00000001'
export const VIEW_ID = 'viwReady00000001'
export const NAME_FIELD_ID = 'fldName0000000001'
export const STATUS_FIELD_ID = 'fldStatus00000001'
export const MOD_FIELD_ID = 'fldLastMod0000001'
const PAGE_SIZE = 100

type FakeRecord = { id: string, createdTime: string, values: Record<string, unknown> }
type FakeField = { id: string, name: string, type: string }

export const vendor: { fields: FakeField[], records: FakeRecord[], requests: URL[] } = {
    fields: [],
    records: [],
    requests: [],
}

let clock = Date.parse('2026-11-01T10:00:00.000Z')
let counter = 0

export function tick(ms = 60_000): number {
    clock += ms
    return clock
}

export function now(): number {
    return clock
}

export function resetVendor(): void {
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    counter = 0
    vendor.requests = []
    vendor.fields = [
        { id: NAME_FIELD_ID, name: 'Name', type: 'singleLineText' },
        { id: STATUS_FIELD_ID, name: 'Status', type: 'singleSelect' },
        { id: MOD_FIELD_ID, name: 'Last Modified', type: 'lastModifiedTime' },
    ]
    vendor.records = []
}

export function addRecord({ id, status = 'Ready', at }: { id?: string, status?: string, at?: number } = {}): string {
    counter += 1
    const recordId = id ?? `rec${String(counter).padStart(14, '0')}`
    const created = at ?? tick(1000)
    vendor.records.push({
        id: recordId,
        createdTime: airtableTime(created),
        values: { [NAME_FIELD_ID]: recordId, [STATUS_FIELD_ID]: status, [MOD_FIELD_ID]: airtableTime(created) },
    })
    return recordId
}

export function editRecord({ id, status, at }: { id: string, status?: string, at?: number }): void {
    const record = vendor.records.find((candidate) => candidate.id === id)
    if (!record) return
    if (status) record.values[STATUS_FIELD_ID] = status
    record.values[MOD_FIELD_ID] = airtableTime(at ?? tick(1000))
}

export function renameField({ id, name }: { id: string, name: string }): void {
    const field = vendor.fields.find((candidate) => candidate.id === id)
    if (field) field.name = name
}

export function deleteField({ id }: { id: string }): void {
    vendor.fields = vendor.fields.filter((field) => field.id !== id)
}

function airtableTime(epochMs: number): string {
    return new Date(Math.floor(epochMs / 1000) * 1000).toISOString()
}

function render(record: FakeRecord) {
    const fields: Record<string, unknown> = {}
    for (const field of vendor.fields) {
        if (record.values[field.id] !== undefined) fields[field.name] = record.values[field.id]
    }
    return { id: record.id, createdTime: record.createdTime, fields }
}

function fieldByName(name: string): FakeField | undefined {
    return vendor.fields.find((field) => field.name === name)
}

function fieldByNameOrId(nameOrId: string): FakeField | undefined {
    return vendor.fields.find((field) => field.id === nameOrId) ?? fieldByName(nameOrId)
}

type Predicate = (record: FakeRecord) => boolean

function compile(formula: string): Predicate | { error: string } {
    const created = /^IS_AFTER\(CREATED_TIME\(\),DATETIME_PARSE\("([^"]+)","YYYY-MM-DD HH:mm:ss.SSS"\)\)$/.exec(formula)
    if (created) {
        const after = Date.parse(created[1])
        return (record) => Date.parse(record.createdTime) > after
    }
    const fieldAfter = /^IS_AFTER\(\{(.+)\},DATETIME_PARSE\("([^"]+)","YYYY-MM-DD HH:mm:ss.SSS"\)\)$/.exec(formula)
    if (fieldAfter) {
        const field = fieldByName(fieldAfter[1])
        if (!field) return { error: `Unknown field names: ${fieldAfter[1].toLowerCase()}` }
        const after = Date.parse(fieldAfter[2])
        return (record) => {
            const value = record.values[field.id]
            return typeof value === 'string' && Date.parse(value) > after
        }
    }
    const find = /^FIND\("(.*)",\{(.+)\}\)$/.exec(formula)
    if (find) {
        const field = fieldByName(find[2])
        if (!field) return { error: `Unknown field names: ${find[2].toLowerCase()}` }
        return (record) => String(record.values[field.id] ?? '').includes(find[1])
    }
    const truthy = /^\{(.+)\}$/.exec(formula)
    if (truthy) {
        const field = fieldByName(truthy[1])
        if (!field) return { error: `Unknown field names: ${truthy[1].toLowerCase()}` }
        return (record) => Boolean(record.values[field.id])
    }
    return { error: `Unsupported formula ${formula}` }
}

function listRecords(params: URLSearchParams): { status: number, body: unknown } {
    let rows = vendor.records
    if (params.get('view') === VIEW_ID) {
        rows = rows.filter((record) => record.values[STATUS_FIELD_ID] === 'Ready')
    }
    const formula = params.get('filterByFormula')
    if (formula) {
        const predicate = compile(formula)
        if (typeof predicate !== 'function') {
            return { status: 422, body: { error: { type: 'INVALID_FILTER_BY_FORMULA', message: predicate.error } } }
        }
        rows = rows.filter(predicate)
    }
    const sortField = params.get('sort[0][field]')
    if (sortField) {
        const field = fieldByNameOrId(sortField)
        if (!field) return { status: 422, body: { error: { type: 'UNKNOWN_FIELD_NAME', message: sortField } } }
        const direction = params.get('sort[0][direction]') === 'desc' ? -1 : 1
        rows = [...rows].sort((a, b) => direction * String(a.values[field.id] ?? '').localeCompare(String(b.values[field.id] ?? '')))
    }
    const maxRecords = Number(params.get('maxRecords') ?? Infinity)
    rows = rows.slice(0, maxRecords)
    const pageSize = Math.min(Number(params.get('pageSize') ?? PAGE_SIZE), PAGE_SIZE)
    const offset = Number(params.get('offset') ?? 0)
    const page = rows.slice(offset, offset + pageSize)
    const next = offset + pageSize < rows.length ? String(offset + pageSize) : undefined
    return { status: 200, body: { records: page.map(render), ...(next ? { offset: next } : {}) } }
}

function route(url: URL): { status: number, body: unknown } {
    vendor.requests.push(url)
    if (url.pathname === `/v0/meta/bases/${BASE_ID}/tables`) {
        return {
            status: 200,
            body: {
                tables: [{
                    id: TABLE_ID,
                    name: 'Tasks',
                    description: '',
                    primaryFieldId: NAME_FIELD_ID,
                    views: [{ id: VIEW_ID, name: 'Ready', type: 'grid' }],
                    fields: vendor.fields.map((field) => ({ ...field, description: '' })),
                }],
            },
        }
    }
    if (url.pathname === `/v0/${BASE_ID}/${TABLE_ID}`) {
        return listRecords(url.searchParams)
    }
    return { status: 404, body: { error: 'NOT_FOUND' } }
}

export async function startFakeAirtable(): Promise<() => Promise<void>> {
    const server = http.createServer((req, res) => {
        const out = route(new URL(req.url ?? '/', 'http://localhost'))
        res.writeHead(out.status, { 'content-type': 'application/json' })
        res.end(JSON.stringify(out.body))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const baseUrl = `http://127.0.0.1:${portOf({ server })}`
    process.env.AIRTABLE_ENDPOINT_URL = baseUrl
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => realFetch(String(input).replace('https://api.airtable.com', baseUrl), init))
    return async () => {
        vi.unstubAllGlobals()
        server.closeAllConnections()
        await new Promise<void>((resolve) => server.close(() => resolve()))
    }
}

export function memoryStore() {
    const data = new Map<string, string>()
    return {
        data,
        store: {
            put: async <T>(key: string, value: T) => {
                data.set(key, JSON.stringify(value))
                return value
            },
            get: async <T>(key: string): Promise<T | null> => {
                const raw = data.get(key)
                return raw === undefined ? null : JSON.parse(raw)
            },
            delete: async (key: string) => {
                data.delete(key)
            },
        },
    }
}

export function installClock(): void {
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
}

export function portOf({ server }: { server: http.Server }): number {
    const address = server.address()
    if (address === null || typeof address === 'string') {
        throw new Error('server is not listening on a port')
    }
    return address.port
}

export function ids(events: unknown): string[] {
    if (!Array.isArray(events)) {
        throw new Error('expected a list of records')
    }
    return events.map((event) => String(fieldOf({ event, key: 'id' })))
}

export function keysOf(event: unknown): string[] {
    if (typeof event !== 'object' || event === null) {
        throw new Error('expected a record object')
    }
    return Object.keys(event).sort()
}

function fieldOf({ event, key }: { event: unknown, key: string }): unknown {
    if (typeof event !== 'object' || event === null || !(key in event)) {
        throw new Error(`event has no ${key}`)
    }
    return Object.entries(event).find(([name]) => name === key)?.[1]
}
