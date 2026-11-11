import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module')
    const nodePath = await import('node:path')
    const pieceRequire = createRequire(nodePath.resolve(__dirname, '../package.json'))
    const rows: string[][] = []
    return {
        sheetsPath: pieceRequire.resolve('@googleapis/sheets'),
        drivePath: pieceRequire.resolve('@googleapis/drive'),
        rows,
    }
})

vi.mock(h.sheetsPath, () => ({
    sheets: () => ({
        spreadsheets: {
            get: async () => ({ data: { sheets: [{ properties: { sheetId: 0, title: 'Orders', index: 0 } }] } }),
            values: {
                get: async ({ range }: { range: string }) => {
                    const rowRange = /^Orders!(\d+):(\d+)$/.exec(range)
                    if (rowRange) return { data: { values: h.rows.slice(Number(rowRange[1]) - 1, Number(rowRange[2])).map((r) => [...r]) } }
                    if (range !== 'Orders' && range !== "'Orders'") throw new Error(`unexpected range ${range}`)
                    return { data: { values: h.rows.map((r) => [...r]) } }
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

const trigger = googleSheets.getTrigger('google-sheets-new-or-updated-row')!
function ctx(triggerColumn: string): Parameters<typeof trigger.run>[0] {
    return engineContext({
        context: {
            store: createContextStore({ apiUrl: 'http://api.local/', prefix: '', flowId: 'flowC0570', engineToken: 'tok' }),
            auth: { type: 'OAUTH2', access_token: 'ya29.test', props: {}, data: {} },
            propsValue: { includeTeamDrives: false, spreadsheetId: 'spreadsheet-1', sheetId: 0, trigger_column: triggerColumn },
            webhookUrl: 'https://cloud.example/v1/webhooks/flowC0570',
            payload: { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} },
        },
    })
}
const events = (out: unknown[]) => out.map(toRowEvent).map((r) => ({ row: r.row, values: r.values }))

describe("C0570 Google Sheets 'New or Updated Row' when a row's cells are cleared", () => {
    beforeEach(() => {
        storeData.clear()
        installStoreApi()
        h.rows = [['Order', 'Status'], ['1001', 'paid'], ['1002', 'paid'], ['1003', 'open']]
    })

    it('control: Trigger Column = Status, clearing only the Status cell of row 3 is reported', async () => {
        await trigger.onEnable(ctx('B'))
        h.rows[2] = ['1002', '']
        expect(events(await trigger.run(ctx('B')))).toEqual([{ row: 3, values: { A: '1002', B: '' } }])
    })

    it('Trigger Column = Status, clearing the whole row 3 (Status included) is reported', async () => {
        await trigger.onEnable(ctx('B'))
        h.rows[2] = []
        expect(events(await trigger.run(ctx('B')))).toEqual([{ row: 3, values: { A: '', B: '' } }])
    })

    it('Any Column, clearing the whole row 3 is reported', async () => {
        await trigger.onEnable(ctx('all_columns'))
        h.rows[2] = []
        expect(events(await trigger.run(ctx('all_columns')))).toEqual([{ row: 3, values: { A: '', B: '' } }])
    })

    it('control: blank rows that only appear because data was typed further down are not reported', async () => {
        await trigger.onEnable(ctx('all_columns'))
        h.rows.push([], [], ['1006', 'open'])
        expect(events(await trigger.run(ctx('all_columns')))).toEqual([{ row: 7, values: { A: '1006', B: 'open' } }])
    })
})

type RowEvent = { row: number, values: Record<string, string> }

function toRowEvent(value: unknown): RowEvent {
    if (typeof value !== 'object' || value === null || !('row' in value) || !('values' in value)) throw new Error('not a row event')
    const { row, values } = value
    if (typeof row !== 'number' || typeof values !== 'object' || values === null) throw new Error('not a row event')
    return { row, values: Object.fromEntries(Object.entries(values).map(([key, cell]) => [key, String(cell)])) }
}
