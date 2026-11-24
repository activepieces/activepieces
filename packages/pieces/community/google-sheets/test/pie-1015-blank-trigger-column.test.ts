import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module')
    const nodePath = await import('node:path')
    const pieceRequire = createRequire(nodePath.resolve(__dirname, '../package.json'))
    const grid: string[][] = []
    return {
        sheetsPath: pieceRequire.resolve('@googleapis/sheets'),
        drivePath: pieceRequire.resolve('@googleapis/drive'),
        grid,
    }
})

function apiValues({ grid, from, to }: { grid: string[][], from: number, to: number }): string[][] {
    const rows = grid.slice(from - 1, to).map((r) => {
        const out = [...r]
        while (out.length > 0 && (out[out.length - 1] === '' || out[out.length - 1] === undefined)) out.pop()
        return out
    })
    while (rows.length > 0 && rows[rows.length - 1].length === 0) rows.pop()
    return rows
}

vi.mock(h.sheetsPath, () => ({
    sheets: () => {
        const valuesGet = async ({ range }: { range: string }) => {
            if (range === 'Orders') return { data: { values: apiValues({ grid: h.grid, from: 1, to: h.grid.length }) } }
            const m = /^Orders!(\d+):(\d+)$/.exec(range)
            if (!m) throw new Error(`unexpected range ${range}`)
            return { data: { values: apiValues({ grid: h.grid, from: Number(m[1]), to: Number(m[2]) }) } }
        }
        return {
            spreadsheets: {
                get: async (params: unknown) => {
                    const grid = await import('./support/grid-data')
                    if (grid.isGridRequest({ params })) return grid.gridViaValues({ params, valuesGet })
                    return { data: { sheets: [{ properties: { sheetId: 0, title: 'Orders', index: 0 } }] } }
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

const trigger = googleSheets.getTrigger('google-sheets-new-or-updated-row')!
const STATUS = 'C'

function ctx(): Parameters<typeof trigger.run>[0] {
    return engineContext({
        context: {
            store: createContextStore({ apiUrl: 'http://api.local/', prefix: '', flowId: 'flowC1120', engineToken: 'tok' }),
            auth: { type: 'OAUTH2', access_token: 'ya29.test', props: {}, data: {} },
            propsValue: { includeTeamDrives: false, spreadsheetId: 'spreadsheet-1', sheetId: 0, trigger_column: STATUS },
            webhookUrl: 'https://cloud.example/v1/webhooks/flowC1120',
            payload: { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} },
        },
    })
}

const events = (out: unknown[]) => out.map(toRowEvent).map((r) => `${r.row}:${r.values.A}:${r.values.C}`)

describe("C1120 Google Sheets 'New or Updated Row' with a Trigger Column, new rows", () => {
    beforeEach(() => {
        storeData.clear()
        installStoreApi()
        h.grid = [
            ['Order', 'Customer', 'Status'],
            ['1001', 'Ann', 'paid'],
        ]
    })

    it('control: a row appended with Status already filled fires once', async () => {
        await trigger.onEnable(ctx())
        h.grid.push(['1002', 'Bob', 'paid'])
        expect(events(await trigger.run(ctx()))).toEqual(['3:1002:paid'])
    })

    it('control: a partial entry typed into a blank row inside the data does not fire until Status is set', async () => {
        h.grid = [['Order', 'Customer', 'Status'], ['', '', ''], ['1001', 'Ann', 'paid']]
        await trigger.onEnable(ctx())
        h.grid[1] = ['1002', 'Bob', '']
        const beforeStatus = events(await trigger.run(ctx()))
        h.grid[1][2] = 'paid'
        const afterStatus = events(await trigger.run(ctx()))
        expect({ beforeStatus, afterStatus }).toEqual({ beforeStatus: [], afterStatus: ['2:1002:paid'] })
    })

    it('a row appended with Status blank does not fire until Status is set', async () => {
        await trigger.onEnable(ctx())
        h.grid.push(['1002', 'Bob', ''])
        const beforeStatus = events(await trigger.run(ctx()))
        h.grid[2][2] = 'paid'
        const afterStatus = events(await trigger.run(ctx()))
        expect({ beforeStatus, afterStatus }).toEqual({ beforeStatus: [], afterStatus: ['3:1002:paid'] })
    })
})

type RowEvent = { row: number, values: Record<string, string> }

function toRowEvent(value: unknown): RowEvent {
    if (typeof value !== 'object' || value === null || !('row' in value) || !('values' in value)) throw new Error('not a row event')
    const { row, values } = value
    if (typeof row !== 'number' || typeof values !== 'object' || values === null) throw new Error('not a row event')
    return { row, values: Object.fromEntries(Object.entries(values).map(([key, cell]) => [key, String(cell)])) }
}
