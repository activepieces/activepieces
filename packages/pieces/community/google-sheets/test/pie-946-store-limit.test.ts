import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module')
    const nodePath = await import('node:path')
    const pieceRequire = createRequire(nodePath.resolve(__dirname, '../package.json'))
    const rows: string[][] = []
    return {
        sheetsPath: pieceRequire.resolve('@googleapis/sheets'),
        drivePath: pieceRequire.resolve('@googleapis/drive'),
        sizeof: (v: unknown) => Buffer.byteLength(JSON.stringify(v) ?? '', 'utf8'),
        rows,
    }
})

vi.mock(h.sheetsPath, () => ({
    sheets: () => {
        const valuesGet = async ({ range }: { range: string }) => {
            const rowRange = /^Log!(\d+):(\d+)$/.exec(range)
            if (rowRange) return { data: { values: h.rows.slice(Number(rowRange[1]) - 1, Number(rowRange[2])).map((r) => [...r]) } }
            if (range !== 'Log') throw new Error(`unexpected range ${range}`)
            return { data: { values: h.rows.map((r) => [...r]) } }
        }
        return {
            spreadsheets: {
                get: async (params: unknown) => {
                    const grid = await import('./support/grid-data')
                    if (grid.isGridRequest({ params })) return grid.gridViaValues({ params, valuesGet })
                    return { data: { sheets: [{ properties: { sheetId: 0, title: 'Log', index: 0 } }] } }
                },
                values: { get: valuesGet },
            },
        }
    },
}))
vi.mock(h.drivePath, () => ({
    drive: () => ({
        files: { watch: async ({ requestBody }: { requestBody: { id: string } }) => ({ data: { kind: 'api#channel', id: requestBody.id, resourceId: 'res-1' } }) },
        channels: { stop: async () => ({ data: undefined }) },
    }),
}))

import { googleSheets } from '../src'
import { engineContext, rowEvents } from './support/engine-context'

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
            if (h.sizeof(body.value) > STORE_VALUE_MAX_SIZE) return new Response('{}', { status: 413 })
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

const trigger = googleSheets.getTrigger('google-sheets-new-or-updated-row')!
function ctx(): Parameters<typeof trigger.run>[0] {
    return engineContext({
        context: {
            store: createContextStore({ apiUrl: 'http://api.local/', prefix: '', flowId: 'flowC0085', engineToken: 'tok' }),
            auth: { type: 'OAUTH2', access_token: 'ya29.test', props: {}, data: {} },
            propsValue: { includeTeamDrives: false, spreadsheetId: 'spreadsheet-1', sheetId: 0, trigger_column: 'all_columns' },
            webhookUrl: 'https://cloud.example/v1/webhooks/flowC0085',
            payload: { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} },
        },
    })
}
const logRow = (i: number) => [`evt-${i}`, `2026-09-01T10:${String(i % 60).padStart(2, '0')}:00Z`, i % 3 === 0 ? 'error' : 'ok']
function sheetWith(dataRows: number): string[][] {
    return [['Event', 'Time', 'Level'], ...Array.from({ length: dataRows }, (_, i) => logRow(i + 1))]
}

describe("C0085 Google Sheets 'New or Updated Row' on a large worksheet", () => {
    beforeEach(() => {
        storeData.clear()
        installStoreApi()
    })

    it('can be turned on for a 16,000-row worksheet', async () => {
        h.rows = sheetWith(16_000)
        await expect(trigger.onEnable(ctx())).resolves.toBeUndefined()
    })

    it('keeps reporting new and changed rows after the worksheet grows past ~15,000 rows', async () => {
        h.rows = sheetWith(14_000)
        await trigger.onEnable(ctx())

        h.rows.push(...Array.from({ length: 2_000 }, (_, i) => logRow(14_001 + i)))
        h.rows[10] = ['evt-10', '2026-09-01T10:10:00Z', 'error']

        const out = rowEvents({ value: await trigger.run(ctx()) })
        expect(out.length).toBe(2_001)
        expect(out[0].row).toBe(11)

        h.rows.push(logRow(16_001))
        const next = rowEvents({ value: await trigger.run(ctx()) })
        expect(next.map((r) => r.row)).toEqual([16_002])
    })
})
