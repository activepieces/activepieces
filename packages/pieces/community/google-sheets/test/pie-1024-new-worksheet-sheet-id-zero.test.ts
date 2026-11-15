import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = await vi.hoisted(async () => {
    const { createRequire } = await import('node:module')
    const nodePath = await import('node:path')
    const pieceRequire = createRequire(nodePath.resolve(__dirname, '../package.json'))
    const tabs: { sheetId: number, title: string, index: number }[] = []
    return {
        sheetsPath: pieceRequire.resolve('@googleapis/sheets'),
        tabs,
    }
})

vi.mock(h.sheetsPath, () => ({
    sheets: () => ({
        spreadsheets: {
            get: async () => ({
                data: {
                    sheets: h.tabs.map((t) => ({
                        properties: { sheetId: t.sheetId, title: t.title, index: t.index, sheetType: 'GRID' },
                    })),
                },
            }),
            values: { get: async () => ({ data: { values: [] } }) },
        },
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

const trigger = googleSheets.getTrigger('new-worksheet')!

function ctx(extra: Record<string, unknown> = {}): Parameters<typeof trigger.run>[0] {
    return engineContext({
        context: {
            store: createContextStore({ apiUrl: 'http://api.local/', prefix: '', flowId: 'flowC0080', engineToken: 'tok' }),
            auth: { type: 'OAUTH2', access_token: 'ya29.test', props: {}, data: {} },
            propsValue: { includeTeamDrives: false, spreadsheetId: 'spreadsheet-1' },
            payload: {},
            webhookUrl: 'https://cloud.example/v1/webhooks/flowC0080',
            ...extra,
        },
    })
}

const titles = (out: unknown[]) => out.map(titleOf)

describe('C0080 Google Sheets New Worksheet', () => {
    beforeEach(() => {
        storeData.clear()
        installStoreApi()
        h.tabs = [
            { sheetId: 0, title: 'Sheet1', index: 0 },
            { sheetId: 1736401234, title: 'Archive', index: 1 },
        ]
    })

    it('does not report tabs that already existed when the flow was turned on', async () => {
        await trigger.onEnable(ctx())
        expect(titles(await trigger.run(ctx()))).toEqual([])

        h.tabs.push({ sheetId: 555000111, title: 'Q3', index: 2 })
        expect(titles(await trigger.run(ctx()))).toEqual(['Q3'])
        expect(titles(await trigger.run(ctx()))).toEqual([])
    })

    it('does not report the first tab again after a republish of the unchanged trigger', async () => {
        await trigger.onEnable(ctx())
        await trigger.run(ctx())
        await trigger.onDisable(ctx())
        await trigger.onEnable(ctx({ isRepublish: true }))
        expect(titles(await trigger.run(ctx()))).toEqual([])
    })
})

function titleOf(value: unknown): string {
    if (typeof value !== 'object' || value === null || !('properties' in value)) throw new Error('not a worksheet')
    const { properties } = value
    if (typeof properties !== 'object' || properties === null || !('title' in properties)) throw new Error('not a worksheet')
    return String(properties.title)
}
