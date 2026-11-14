import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'
import { newEngagementTrigger as trigger } from '../src/lib/triggers/new-engagement'

type Engagement = { engagement: { id: number, createdAt: number, lastUpdated: number, type: string }, associations: Record<string, number[]>, attachments: unknown[], metadata: Record<string, string> }

const DAY = 24 * 3600_000
const portal: { engagements: Engagement[], nextId: number, calls: string[] } = { engagements: [], nextId: 1, calls: [] }
let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return clock
}

function log({ type = 'NOTE', at }: { type?: string, at?: number } = {}) {
    const time = at ?? tick()
    const id = portal.nextId++
    portal.engagements.push({ engagement: { id, createdAt: time, lastUpdated: time, type }, associations: { contactIds: [], companyIds: [], dealIds: [], ownerIds: [], workflowIds: [] }, attachments: [], metadata: { body: `#${id}` } })
    return id
}

function edit({ id }: { id: number }) {
    portal.engagements.find((item) => item.engagement.id === id)!.engagement.lastUpdated = tick()
}

function route(url: URL): unknown {
    if (url.pathname.endsWith('/recent/modified')) {
        const count = Math.min(Number(url.searchParams.get('count') ?? 20), 100)
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const since = Math.max(Number(url.searchParams.get('since') ?? 0), clock - 30 * DAY)
        const hits = portal.engagements.filter((item) => item.engagement.lastUpdated > since).sort((a, b) => b.engagement.lastUpdated - a.engagement.lastUpdated)
        const page = hits.slice(offset, Math.min(offset + count, 10_000))
        return { results: page, hasMore: offset + count < Math.min(hits.length, 10_000), offset: offset + page.length, total: hits.length }
    }
    if (url.pathname.endsWith('/paged')) {
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 250)
        return { results: portal.engagements.slice(0, limit), hasMore: portal.engagements.length > limit, offset: limit }
    }
    throw new Error(`no route ${url.pathname}`)
}

function memoryStore() {
    const data = new Map<string, string>()
    return {
        put: async <T>(k: string, v: T) => {
            data.set(k, JSON.stringify(v))
            return v
        },
        get: async <T>(k: string): Promise<T | null> => {
            const raw = data.get(k)
            return raw === undefined ? null : JSON.parse(raw)
        },
        delete: async (k: string) => {
            data.delete(k)
        },
    }
}

type Store = ReturnType<typeof memoryStore>
const ctx = ({ store, eventType, isRepublish }: { store: Store, eventType?: string, isRepublish?: boolean }) =>
    hubspotTestKit.pollingContext({ store, propsValue: { eventType }, isRepublish })
const ids = (events: unknown[]) => events.map((event) => Number(hubspotTestKit.field({ value: hubspotTestKit.field({ value: event, key: 'engagement' }), key: 'id' })))

beforeEach(() => {
    portal.engagements = []
    portal.nextId = 1
    portal.calls = []
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
        portal.calls.push(url.pathname)
        return new Response(JSON.stringify(route(url)), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('New Engagement behaviour', () => {
    it('fires once per new engagement across polls and republish; edits of old engagements do not fire', async () => {
        const old = log()
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        const fresh = log()
        expect(ids(await trigger.run(ctx({ store })))).toEqual([fresh])
        expect(await trigger.run(ctx({ store }))).toEqual([])
        edit({ id: old })
        edit({ id: fresh })
        expect(await trigger.run(ctx({ store }))).toEqual([])
        const between = log()
        await trigger.onDisable(ctx({ store, isRepublish: true }))
        await trigger.onEnable(ctx({ store, isRepublish: true }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual([between])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('emits a burst of more than one page oldest first, filtered by type', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store, eventType: 'CALL' }))
        const calls = Array.from({ length: 150 }, () => {
            log({ type: 'NOTE', at: tick(1000) })
            return log({ type: 'CALL', at: tick(1000) })
        })
        expect(ids(await trigger.run(ctx({ store, eventType: 'CALL' })))).toEqual(calls)
        expect(await trigger.run(ctx({ store, eventType: 'CALL' }))).toEqual([])
    })

    it('test() returns the newest engagements, oldest to newest', async () => {
        log()
        const newest = log()
        expect(ids(await trigger.test(ctx({ store: memoryStore() }))).at(-1)).toBe(newest)
    })

    it('test() still returns a sample when nothing changed in the last 30 days', async () => {
        log({ at: clock - 90 * DAY })
        expect(await trigger.test(ctx({ store: memoryStore() }))).toHaveLength(1)
    })
})
