import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit, MemoryStore } from './support/hubspot-test-kit'
import { newEngagementTrigger } from '../src/lib/triggers/new-engagement'

const DAY = 24 * 3600_000
const TYPES = ['NOTE', 'TASK', 'MEETING', 'EMAIL', 'CALL']

type Engagement = {
    engagement: { id: number, portalId: number, active: boolean, createdAt: number, lastUpdated: number, type: string, timestamp: number }
    associations: { contactIds: number[], companyIds: number[], dealIds: number[], ownerIds: number[], workflowIds: number[] }
    attachments: unknown[]
    metadata: { body: string }
}

const fake: { engagements: Engagement[], requests: string[] } = { engagements: [], requests: [] }

function engagement({ id, createdAt }: { id: number, createdAt: number }): Engagement {
    return {
        engagement: { id, portalId: 62515, active: true, createdAt, lastUpdated: createdAt, type: TYPES[id % TYPES.length], timestamp: createdAt },
        associations: { contactIds: [1000 + (id % 500)], companyIds: [], dealIds: [], ownerIds: [], workflowIds: [] },
        attachments: [],
        metadata: { body: `Logged activity #${id}` },
    }
}

function seedPortal({ count, now }: { count: number, now: number }): void {
    const start = now - 3 * 365 * DAY
    const span = now - 60 * 60_000 - start
    fake.engagements = Array.from({ length: count }, (_, i) => engagement({ id: i + 1, createdAt: Math.floor(start + (span * i) / count) }))
}

function hubspotRoute(url: URL): unknown {
    if (url.pathname === '/engagements/v1/engagements/paged') {
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 250)
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const page = fake.engagements.filter((e) => e.engagement.id > offset).slice(0, limit)
        const last = page[page.length - 1]?.engagement.id ?? offset
        return { results: page, hasMore: fake.engagements.some((e) => e.engagement.id > last), offset: last }
    }
    if (url.pathname === '/engagements/v1/engagements/recent/modified') {
        const count = Math.min(Number(url.searchParams.get('count') ?? 20), 100)
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const since = Math.max(Number(url.searchParams.get('since') ?? 0), Date.now() - 30 * DAY)
        const hits = fake.engagements.filter((e) => e.engagement.lastUpdated > since).sort((a, b) => b.engagement.lastUpdated - a.engagement.lastUpdated)
        const page = hits.slice(offset, offset + count)
        return { results: page, hasMore: offset + count < hits.length, offset: offset + page.length, total: hits.length }
    }
    throw new Error(`fake HubSpot has no route ${url.pathname}`)
}

const context = (store: MemoryStore) => hubspotTestKit.pollingContext({ store, propsValue: {} })

beforeEach(() => {
    fake.requests = []
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
        const url = hubspotTestKit.requestUrl({ input })
        fake.requests.push(url.pathname)
        return new Response(JSON.stringify(hubspotRoute(url)), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
})

afterEach(() => {
    vi.unstubAllGlobals()
})

async function scenario(history: number) {
    const store = hubspotTestKit.memoryStore()
    seedPortal({ count: history, now: Date.now() })
    await newEngagementTrigger.onEnable(context(store))
    const lastPoll = hubspotTestKit.storedNumber({ store, key: 'lastPoll' })
    const freshId = history + 1
    fake.engagements.push(engagement({ id: freshId, createdAt: lastPoll + 1000 }))
    fake.requests = []
    const emitted = await newEngagementTrigger.run(context(store))
    return { freshId, emitted: emitted.map((event) => Number(hubspotTestKit.field({ value: hubspotTestKit.field({ value: event, key: 'engagement' }), key: 'id' }))) }
}

describe('PIE-929 HubSpot New Engagement on a portal with a long history', () => {
    it('control: on a small portal one poll emits the engagement logged after enabling', async () => {
        const { freshId, emitted } = await scenario(50)
        expect(emitted).toEqual([freshId])
    })

    it('a poll with one new engagement reads only recent changes, not the 40,000-engagement history', async () => {
        const { freshId, emitted } = await scenario(40_000)
        expect(fake.requests.length).toBeLessThanOrEqual(2)
        expect(fake.requests.every((path) => path.endsWith('/recent/modified'))).toBe(true)
        expect(emitted).toEqual([freshId])
    })
})
