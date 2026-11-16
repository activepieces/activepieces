import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module')
    const nodePath = await import('node:path')
    const pieceRequire = createRequire(nodePath.resolve(__dirname, '../package.json'))
    const tabs: { sheetId: number, title: string, rows: string[][] }[] = []
    const ranges: string[] = []
    return {
        sheetsPath: pieceRequire.resolve('@googleapis/sheets'),
        drivePath: pieceRequire.resolve('@googleapis/drive'),
        tabs,
        ranges,
    }
})

function colToIndex(col: string): number {
    let n = 0
    for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
    return n - 1
}
function resolveA1(range: string): string[][] {
    let title: string | undefined
    let sub: string | undefined
    if (range.startsWith("'")) {
        const m = /^'((?:[^']|'')*)'(?:!(.*))?$/.exec(range)
        if (!m) throw new Error(`Unable to parse range: ${range}`)
        title = m[1].replace(/''/g, "'")
        sub = m[2]
    } else if (range.includes('!')) {
        title = range.slice(0, range.indexOf('!'))
        sub = range.slice(range.indexOf('!') + 1)
    } else if (/^[A-Za-z]{1,3}[0-9]+$/.test(range)) {
        sub = range
    } else {
        title = range
    }
    const tab = title === undefined ? h.tabs[0] : h.tabs.find((t) => t.title === title)
    if (!tab) throw new Error(`Unable to parse range: ${range}`)
    const rows = tab.rows
    if (sub === undefined || sub === '') return rows.map((r) => [...r])
    const rowSpan = /^(\d+):(\d+)$/.exec(sub)
    if (rowSpan) return rows.slice(Number(rowSpan[1]) - 1, Number(rowSpan[2])).map((r) => [...r])
    const cell = /^([A-Za-z]{1,3})([0-9]+)$/.exec(sub)
    if (cell) {
        const v = rows[Number(cell[2]) - 1]?.[colToIndex(cell[1])]
        return v === undefined || v === '' ? [] : [[v]]
    }
    throw new Error(`unsupported range in fake: ${range}`)
}

vi.mock(h.sheetsPath, () => ({
    sheets: () => ({
        spreadsheets: {
            get: async () => ({ data: { sheets: h.tabs.map((t, index) => ({ properties: { sheetId: t.sheetId, title: t.title, index } })) } }),
            values: {
                get: async ({ range }: { range: string }) => {
                    h.ranges.push(range)
                    const values = resolveA1(range)
                    return { data: values.length ? { range, values } : { range } }
                },
            },
        },
    }),
}))
vi.mock(h.drivePath, () => ({
    drive: () => ({
        files: { watch: async ({ requestBody }: { requestBody: { id: string } }) => ({ data: { kind: 'api#channel', id: requestBody.id, resourceId: 'res-1' } }) },
        channels: { stop: async () => ({ data: undefined }) },
    }),
}))

import { googleSheets } from '../src'
import { engineContext } from './support/engine-context'

const STORE_VALUE_MAX_SIZE = 512 * 1024
function createContextStore({ apiUrl, prefix, flowId }: { apiUrl: string, prefix: string, flowId: string, engineToken: string }) {
    const k = ({ key, scope }: { key: string, scope?: string }) => `${prefix}${scope === 'PLATFORM' ? '' : `flow_${flowId}/`}${key}`
    const url = (key?: string) => { const u = new URL('v1/store-entries', apiUrl); if (key) u.searchParams.set('key', key); return u.toString() }
    return {
        async put<T>(key: string, value: T, scope?: string): Promise<T> {
            const size = Buffer.byteLength(JSON.stringify(value) ?? '', 'utf8')
            if (size > STORE_VALUE_MAX_SIZE) throw new Error(`StorageLimitError: ${key} exceeds ${STORE_VALUE_MAX_SIZE} bytes`)
            const res = await fetch(url(), { method: 'POST', body: JSON.stringify({ key: k({ key, scope }), value }) })
            if (!res.ok) throw new Error(`StorageError ${res.status}`)
            return value
        },
        async get<T>(key: string, scope?: string): Promise<T | null> {
            const res = await fetch(url(k({ key, scope })))
            if (res.status === 404) return null
            if (!res.ok) throw new Error(`StorageError ${res.status}`)
            const body = await res.json()
            return body.value
        },
        async delete(key: string, scope?: string): Promise<void> {
            await fetch(url(k({ key, scope })), { method: 'DELETE' })
        },
    }
}

const storeData = new Map<string, unknown>()
function installStoreApi(): void {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input))
        const method = init?.method ?? 'GET'
        if (method === 'POST') {
            const body = JSON.parse(String(init!.body))
            storeData.set(body.key, body.value)
            return new Response(JSON.stringify({ key: body.key, value: body.value }), { status: 200 })
        }
        const key = url.searchParams.get('key')!
        if (method === 'DELETE') {
            storeData.delete(key)
            return new Response('', { status: 200 })
        }
        if (!storeData.has(key)) return new Response('Value not found!', { status: 404 })
        return new Response(JSON.stringify({ key, value: storeData.get(key) }), { status: 200 })
    }
}

function ctx({ sheetId, extra = {} }: { sheetId: number, extra?: Record<string, unknown> }): Parameters<typeof newRow.run>[0] {
    return engineContext({
        context: {
            store: createContextStore({ apiUrl: 'http://api.local/', prefix: '', flowId: 'flowC0252', engineToken: 'tok' }),
            auth: { type: 'OAUTH2', access_token: 'ya29.test', props: {}, data: {} },
            propsValue: { includeTeamDrives: false, spreadsheetId: 'spreadsheet-1', sheetId, ...extra },
            webhookUrl: 'https://cloud.example/v1/webhooks/flowC0252',
            payload: { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} },
        },
    })
}

const newRow = googleSheets.getTrigger('googlesheets_new_row_added')!
const newOrUpdated = googleSheets.getTrigger('google-sheets-new-or-updated-row')!

function setup(tabTitle: string): void {
    h.ranges = []
    h.tabs = [
        { sheetId: 0, title: 'Summary', rows: [['Quarter', 'Total'], ['Q1', '120']] },
        { sheetId: 111, title: tabTitle, rows: [['Name', 'Email'], ['Ann', 'ann@x.io'], ['Bob', 'bob@x.io']] },
    ]
}
const tab = () => h.tabs[1]

describe('C0252 Google Sheets row triggers on a tab whose title looks like a cell reference', () => {
    beforeEach(() => {
        storeData.clear()
        installStoreApi()
    })

    for (const title of ['Leads', 'Q1']) {
        it(`New Row Added delivers a row appended to tab "${title}"`, async () => {
            setup(title)
            await newRow.onEnable(ctx({ sheetId: 111 }))
            tab().rows.push(['Cat', 'cat@x.io'])
            const out = await newRow.run(ctx({ sheetId: 111 }))
            expect(out.map(toRowEvent).map((r) => r.values)).toEqual([{ A: 'Cat', B: 'cat@x.io' }])
        })

        it(`New Row Added test sample comes from tab "${title}"`, async () => {
            setup(title)
            const out = await newRow.test(ctx({ sheetId: 111 }))
            expect(out.map(toRowEvent).map((r) => r.values.A)).toEqual(['Bob', 'Ann'])
        })
    }

    for (const title of ['Leads', 'FY24']) {
        it(`New or Updated Row reports an edited row of tab "${title}"`, async () => {
            setup(title)
            await newOrUpdated.onEnable(ctx({ sheetId: 111, extra: { trigger_column: 'all_columns' } }))
            tab().rows[2] = ['Bob', 'bob@new.io']
            const out = await newOrUpdated.run(ctx({ sheetId: 111, extra: { trigger_column: 'all_columns' } }))
            expect(out.map(toRowEvent).map((r) => ({ row: r.row, values: r.values }))).toEqual([{ row: 3, values: { A: 'Bob', B: 'bob@new.io' } }])
        })
    }
})

type RowEvent = { row: number, values: Record<string, string> }

function toRowEvent(value: unknown): RowEvent {
    if (typeof value !== 'object' || value === null || !('row' in value) || !('values' in value)) throw new Error('not a row event')
    const { row, values } = value
    if (typeof row !== 'number' || typeof values !== 'object' || values === null) throw new Error('not a row event')
    return { row, values: Object.fromEntries(Object.entries(values).map(([key, cell]) => [key, String(cell)])) }
}
