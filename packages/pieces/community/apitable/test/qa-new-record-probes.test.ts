import http from 'node:http'
import { AddressInfo } from 'node:net'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test'
import { APITableAuth } from '../src/lib/auth'
import { newRecordTrigger } from '../src/lib/triggers/new-record'

type FakeRecord = { recordId: string, createdAt: number, updatedAt: number, fields: Record<string, unknown> }

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-11-01T10:00:00.000Z')
const vendor: { records: FakeRecord[], viewOrder: 'created' | 'title-desc', calls: URLSearchParams[] } = { records: [], viewOrder: 'created', calls: [] }

function addRecord({ at, title }: { at: number, title?: string }): string {
    const recordId = `rec${String(vendor.records.length + 1).padStart(6, '0')}`
    vendor.records.push({ recordId, createdAt: at, updatedAt: at, fields: { Title: title ?? recordId } })
    return recordId
}

function inViewOrder({ rows }: { rows: FakeRecord[] }): FakeRecord[] {
    if (vendor.viewOrder === 'created') return [...rows].sort((a, b) => a.createdAt - b.createdAt)
    return [...rows].sort((a, b) => String(b.fields['Title']).localeCompare(String(a.fields['Title'])))
}

function listRecords({ params }: { params: URLSearchParams }) {
    vendor.calls.push(params)
    let rows = vendor.records
    const formula = params.get('filterByFormula')
    if (formula) {
        const window = /^AND\(CREATED_TIME\(\) > (\d+), CREATED_TIME\(\) <= (\d+)\)$/.exec(formula)
        if (!window) return { status: 400, body: { success: false, code: 400, message: 'bad formula' } }
        rows = rows.filter((r) => r.createdAt > Number(window[1]) && r.createdAt <= Number(window[2]))
    }
    rows = inViewOrder({ rows })
    const pageSize = Math.min(Number(params.get('pageSize') ?? 100), 1000)
    const pageNum = Number(params.get('pageNum') ?? 1)
    return { status: 200, body: { success: true, code: 200, message: 'SUCCESS', data: { total: rows.length, pageNum, pageSize, records: rows.slice((pageNum - 1) * pageSize, pageNum * pageSize) } } }
}

let server: http.Server
let baseUrl = ''

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const out = /^\/fusion\/v1\/datasheets\/dst1\/records$/.test(url.pathname)
            ? listRecords({ params: url.searchParams })
            : { status: 404, body: {} }
        res.writeHead(out.status, { 'content-type': 'application/json' })
        res.end(JSON.stringify(out.body))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    baseUrl = `http://127.0.0.1:${listeningPort({ address: server.address() })}`
})

afterAll(async () => {
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
})

beforeEach(() => {
    vendor.records = []
    vendor.viewOrder = 'created'
    vendor.calls = []
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
})

afterEach(() => {
    vi.useRealTimers()
})

function listeningPort({ address }: { address: AddressInfo | string | null }): number {
    if (address === null || typeof address === 'string') throw new Error('server is not listening on a port')
    return address.port
}

function memoryStore() {
    const data = new Map<string, string>()
    return {
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
    }
}

const trigger = pollingTrigger()

function pollingTrigger() {
    if (newRecordTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('expected a polling trigger')
    }
    return newRecordTrigger
}

function ctx({ store, apiTableUrl = baseUrl }: { store: ReturnType<typeof memoryStore>, apiTableUrl?: string }) {
    const auth: AppConnectionValueForAuthProperty<typeof APITableAuth> = {
        type: AppConnectionType.CUSTOM_AUTH,
        props: { token: 'tok', apiTableUrl },
    }
    return {
        ...createMockPollingTriggerContext<typeof newRecordTrigger.props>({ propsValue: { space_id: 'spc1', datasheet_id: 'dst1' } }),
        auth,
        store,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

function keysOf({ item }: { item: unknown }): string[] {
    if (typeof item !== 'object' || item === null) throw new Error('item is not an object')
    return Object.keys(item)
}

function recordIdOf({ event }: { event: unknown }): string {
    if (typeof event !== 'object' || event === null || !('recordId' in event)) {
        throw new Error('event has no recordId')
    }
    return String(event.recordId)
}

const ids = (events: unknown[]) => events.map((event) => recordIdOf({ event }))

describe('QA probes: APITable New Record test()', () => {
    it('sorts by createdAt even when the view order is not creation order', async () => {
        const created = Array.from({ length: 8 }, (_, i) => addRecord({ at: NOW - (10 - i) * 60_000, title: `t${(i * 3) % 8}` }))
        vendor.viewOrder = 'title-desc'
        vendor.records.reverse()
        const out = ids(await trigger.test(ctx({ store: memoryStore() })))
        expect(out).toEqual(created.slice(-5))
    })

    it('widens past a window with fewer than five and still returns the newest five', async () => {
        const week = [6, 5, 4, 3].map((d) => addRecord({ at: NOW - d * DAY }))
        const today = [3, 2].map((h) => addRecord({ at: NOW - h * 60 * 60 * 1000 }))
        const out = ids(await trigger.test(ctx({ store: memoryStore() })))
        expect(out).toEqual([week[1], week[2], week[3], ...today])
    })

    it('returns records older than a year via the all-time branch', async () => {
        const ancient = [800, 700].map((d) => addRecord({ at: NOW - d * DAY }))
        const out = ids(await trigger.test(ctx({ store: memoryStore() })))
        expect(out).toEqual([ancient[0], ancient[1]])
    })

    it('empty datasheet: returns [] after five count probes and no page fetch', async () => {
        expect(await trigger.test(ctx({ store: memoryStore() }))).toEqual([])
        expect(vendor.calls.map((p) => p.get('pageSize'))).toEqual(['1', '1', '1', '1', '1'])
    })

    it('worst case makes at most seven API calls', async () => {
        for (let i = 0; i < 2003; i++) addRecord({ at: NOW - 400 * DAY - i })
        const out = await trigger.test(ctx({ store: memoryStore() }))
        expect(out).toHaveLength(5)
        expect(vendor.calls.length).toBeLessThanOrEqual(7)
    })

    it('test() items have exactly the keys run() emits and the sampleData declares', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store }))
        vi.setSystemTime(NOW + 60_000)
        addRecord({ at: NOW + 30_000 })
        const runItems = await trigger.run(ctx({ store }))
        const testItems = await trigger.test(ctx({ store: memoryStore() }))
        expect(runItems).toHaveLength(1)
        expect(keysOf({ item: testItems[0] }).sort()).toEqual(keysOf({ item: runItems[0] }).sort())
        expect(keysOf({ item: trigger.sampleData }).sort()).toEqual(keysOf({ item: runItems[0] }).sort())
    })

    it('run() propagates a vendor error instead of moving the cursor', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store }))
        const before = await store.get<number>('lastPoll')
        const broken = ctx({ store, apiTableUrl: `${baseUrl}/nope` })
        await expect(trigger.run(broken)).rejects.toBeDefined()
        expect(await store.get<number>('lastPoll')).toBe(before)
    })
})
