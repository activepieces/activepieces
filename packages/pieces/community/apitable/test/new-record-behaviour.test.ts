import http from 'node:http'
import { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test'
import { APITableAuth } from '../src/lib/auth'
import { newRecordTrigger } from '../src/lib/triggers/new-record'

type FakeRecord = { recordId: string, createdAt: number, updatedAt: number, fields: Record<string, unknown> }

const vendor: { records: FakeRecord[], maxPageSize: number } = { records: [], maxPageSize: 1000 }
let clock = Date.parse('2026-11-01T10:00:00.000Z')
let counter = 0

function tick(ms = 1000): number {
    clock += ms
    vi.setSystemTime(clock)
    return clock
}

function addRecord({ at }: { at?: number } = {}): string {
    counter += 1
    const recordId = `rec${String(counter).padStart(8, '0')}`
    const createdAt = at ?? tick()
    vendor.records.push({ recordId, createdAt, updatedAt: createdAt, fields: { Title: recordId } })
    return recordId
}

function editRecord({ recordId }: { recordId: string }): void {
    const record = vendor.records.find((candidate) => candidate.recordId === recordId)
    if (record) record.updatedAt = tick()
}

function listRecords(params: URLSearchParams) {
    let rows = vendor.records
    const formula = params.get('filterByFormula')
    if (formula) {
        const window = /^AND\(CREATED_TIME\(\) > (\d+), CREATED_TIME\(\) <= (\d+)\)$/.exec(formula)
        if (!window) return { status: 400, body: { success: false, code: 400, message: `bad formula ${formula}` } }
        rows = rows.filter((record) => record.createdAt > Number(window[1]) && record.createdAt <= Number(window[2]))
    }
    const pageSize = Math.min(Number(params.get('pageSize') ?? 100), vendor.maxPageSize)
    const pageNum = Number(params.get('pageNum') ?? 1)
    const page = rows.slice((pageNum - 1) * pageSize, pageNum * pageSize)
    return { status: 200, body: { success: true, code: 200, message: 'SUCCESS', data: { total: rows.length, pageNum, pageSize, records: page } } }
}

let server: http.Server
let baseUrl = ''

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const out = /^\/fusion\/v1\/datasheets\/dst1\/records$/.test(url.pathname)
            ? listRecords(url.searchParams)
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
    vendor.maxPageSize = 1000
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    counter = 0
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(clock)
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
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

function ctx({ store, isRepublish }: { store: ReturnType<typeof memoryStore>, isRepublish?: boolean }) {
    const auth: AppConnectionValueForAuthProperty<typeof APITableAuth> = {
        type: AppConnectionType.CUSTOM_AUTH,
        props: { token: 'tok', apiTableUrl: baseUrl },
    }
    return {
        ...createMockPollingTriggerContext<typeof newRecordTrigger.props>({ propsValue: { space_id: 'spc1', datasheet_id: 'dst1' } }),
        auth,
        store,
        isRepublish,
        files: createMockActionContext({ propsValue: {} }).files,
    }
}

function recordIdOf({ event }: { event: unknown }): string {
    if (typeof event !== 'object' || event === null || !('recordId' in event)) {
        throw new Error('event has no recordId')
    }
    return String(event.recordId)
}

const ids = (events: unknown[]) => events.map((event) => recordIdOf({ event }))

describe('APITable New Record behaviour', () => {
    it('fires once per new record across polls and a republish, never for records that existed at enable', async () => {
        addRecord()
        addRecord()
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        const first = addRecord()
        expect(ids(await trigger.run(ctx({ store })))).toEqual([first])
        expect(await trigger.run(ctx({ store }))).toEqual([])
        const between = addRecord()
        await trigger.onDisable(ctx({ store, isRepublish: true }))
        await trigger.onEnable(ctx({ store, isRepublish: true }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual([between])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('does not fire when an existing record is edited', async () => {
        const old = addRecord()
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        editRecord({ recordId: old })
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('pages through more records than one page between polls, each once', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store }))
        const burst = Array.from({ length: 1150 }, () => addRecord({ at: tick(10) }))
        const fired = ids(await trigger.run(ctx({ store })))
        expect(new Set(fired)).toEqual(new Set(burst))
        expect(fired).toHaveLength(burst.length)
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('test() returns the newest records oldest to newest, newest last, on a datasheet quiet for days', async () => {
        const created = [addRecord(), addRecord(), addRecord()]
        tick(3 * 24 * 60 * 60 * 1000)
        const store = memoryStore()
        expect(ids(await trigger.test(ctx({ store })))).toEqual(created)
    })

    it('test() returns the five newest when there are many', async () => {
        const created = Array.from({ length: 12 }, () => addRecord())
        const store = memoryStore()
        expect(ids(await trigger.test(ctx({ store })))).toEqual(created.slice(-5))
    })

    it('test() returns the five newest from the tail when the window holds more than a page', async () => {
        const created = Array.from({ length: 1003 }, () => addRecord({ at: tick(10) }))
        tick(2 * 24 * 60 * 60 * 1000)
        const store = memoryStore()
        expect(ids(await trigger.test(ctx({ store })))).toEqual(created.slice(-5))
    })

    it('test() returns nothing for an empty datasheet', async () => {
        const store = memoryStore()
        expect(await trigger.test(ctx({ store }))).toEqual([])
    })
})
