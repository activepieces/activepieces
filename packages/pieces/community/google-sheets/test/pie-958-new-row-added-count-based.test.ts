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
    sheets: () => {
        const valuesGet = async ({ range }: { range: string }) => {
            if (range === 'Leads') return { data: { values: h.rows.map((r) => [...r]) } }
            const m = /^Leads!(\d+):(\d+)$/.exec(range)
            if (!m) throw new Error(`unexpected range ${range}`)
            return { data: { values: h.rows.slice(Number(m[1]) - 1, Number(m[2])).map((r) => [...r]) } }
        }
        return {
            spreadsheets: {
                get: async (params: unknown) => {
                    const grid = await import('./support/grid-data')
                    if (grid.isGridRequest({ params })) return grid.gridViaValues({ params, valuesGet })
                    return { data: { sheets: [{ properties: { sheetId: 0, title: 'Leads', index: 0 } }] } }
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

const trigger = googleSheets.getTrigger('googlesheets_new_row_added')!
function ctx(): Parameters<typeof trigger.run>[0] {
    return engineContext({
        context: {
            store: createContextStore({ apiUrl: 'http://api.local/', prefix: '', flowId: 'flowC0134', engineToken: 'tok' }),
            auth: { type: 'OAUTH2', access_token: 'ya29.test', props: {}, data: {} },
            propsValue: { includeTeamDrives: false, spreadsheetId: 'spreadsheet-1', sheetId: 0 },
            webhookUrl: 'https://cloud.example/v1/webhooks/flowC0134',
            payload: { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} },
        },
    })
}
const valuesOf = (out: unknown[]) => out.map(toRowEvent).map((r) => [r.values.A, r.values.B])

const HEADER = ['Name', 'Email']
const ANN = ['Ann', 'ann@x.io']
const BOB = ['Bob', 'bob@x.io']
const CAT = ['Cat', 'cat@x.io']
const DAN = ['Dan', 'dan@x.io']

describe("C0134 Google Sheets 'New Row Added'", () => {
    beforeEach(() => {
        storeData.clear()
        installStoreApi()
        h.rows = [HEADER, ANN, BOB, CAT]
    })

    it('control: a row appended at the bottom is delivered once', async () => {
        await trigger.onEnable(ctx())
        h.rows.push(DAN)
        expect(valuesOf(await trigger.run(ctx()))).toEqual([DAN])
        expect(valuesOf(await trigger.run(ctx()))).toEqual([])
    })

    it("does not deliver an already-existing row when a row is inserted at the top (the piece's 'Add Row at Top')", async () => {
        await trigger.onEnable(ctx())
        h.rows.splice(1, 0, DAN)
        const out = valuesOf(await trigger.run(ctx()))
        const oldRowsDelivered = out.filter((v) => [ANN, BOB, CAT].some((old) => old[0] === v[0] && old[1] === v[1]))
        expect(oldRowsDelivered).toEqual([])
    })

    it('delivers a row appended at the bottom even if an older row was deleted before the notification was processed', async () => {
        await trigger.onEnable(ctx())
        h.rows.splice(1, 1)
        h.rows.push(DAN)
        expect(valuesOf(await trigger.run(ctx()))).toEqual([DAN])
    })
})

type RowEvent = { row: number, values: Record<string, string> }

function toRowEvent(value: unknown): RowEvent {
    if (typeof value !== 'object' || value === null || !('row' in value) || !('values' in value)) throw new Error('not a row event')
    const { row, values } = value
    if (typeof row !== 'number' || typeof values !== 'object' || values === null) throw new Error('not a row event')
    return { row, values: Object.fromEntries(Object.entries(values).map(([key, cell]) => [key, String(cell)])) }
}
