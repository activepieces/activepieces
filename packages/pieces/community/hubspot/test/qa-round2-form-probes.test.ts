import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'
import { newFormSubmissionTrigger } from '../src/lib/triggers/new-form-submission'

type Submission = { conversionId: string, submittedAt: number, pageUrl: string, values: { name: string, value: string }[] }

type TimelineEvent = { timestamp: number, recipient: string }

const portal: { submissions: Submission[], newestFirst: boolean, timeline: TimelineEvent[], calls: string[] } = {
    submissions: [],
    newestFirst: true,
    timeline: [],
    calls: [],
}
let msPerRequest = 0
let failFields = false
let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return clock
}

function submit({ id, at }: { id: string, at?: number }) {
    portal.submissions.push({ conversionId: id, submittedAt: at ?? tick(), pageUrl: 'https://example.com', values: [{ name: 'email', value: `${id}@example.com` }] })
}

function route(url: URL): unknown {
    if (url.pathname.startsWith('/form-integrations/v1/submissions/forms/')) {
        const ascending = [...portal.submissions].sort((a, b) => a.submittedAt - b.submittedAt)
        const ordered = portal.newestFirst ? ascending.reverse() : ascending
        const limit = Number(url.searchParams.get('limit') ?? 20)
        const offset = Number(url.searchParams.get('after') ?? 0)
        const page = ordered.slice(offset, offset + limit)
        return { results: page, ...(offset + limit < ordered.length ? { paging: { next: { after: String(offset + limit) } } } : {}) }
    }
    if (url.pathname.startsWith('/forms/v2/fields/')) {
        return [{ name: 'email', label: 'Email', fieldType: 'text' }]
    }
    if (url.pathname === '/email/public/v1/subscriptions/timeline') {
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const ordered = [...portal.timeline].sort((a, b) => b.timestamp - a.timestamp)
        const page = ordered.slice(offset, offset + 100)
        return { timeline: page, hasMore: offset + 100 < ordered.length, offset: String(offset + 100) }
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
const conversions = (events: unknown[]) => events.map((event) => hubspotTestKit.textField({ value: event, key: 'conversionId' }))

const ctx = ({ store, propsValue = { formId: 'F1', allowMultipleFiles: false }, isRepublish }: { store: Store, propsValue?: Record<string, unknown>, isRepublish?: boolean }) =>
    hubspotTestKit.pollingContext({ store, propsValue, isRepublish })

beforeEach(() => {
    portal.submissions = []
    portal.timeline = []
    portal.calls = []
    portal.newestFirst = true
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
        const url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url)
        portal.calls.push(url.pathname)
        clock += msPerRequest
        if (failFields && url.pathname.startsWith('/forms/v2/fields/')) {
            return new Response(JSON.stringify({ message: 'bad gateway' }), { status: 502, headers: { 'content-type': 'application/json' } })
        }
        return new Response(JSON.stringify(route(url)), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('QA round 2: New Form Submission when the API order is oldest first', () => {
    beforeEach(() => {
        portal.newestFirst = false
        msPerRequest = 0
    })

    afterEach(() => {
        msPerRequest = 0
        failFields = false
    })

    it('each poll is bounded by the deadline (requests per poll stay under the budget)', async () => {
        Array.from({ length: 5_000 }, (_, i) => submit({ id: `old-${i}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        msPerRequest = 1_000
        portal.calls = []
        await newFormSubmissionTrigger.run(ctx({ store }))
        expect(portal.calls.length).toBeLessThanOrEqual(48)
    }, 60_000)

    it('a history longer than one poll deadline still reaches new submissions by resuming the page cursor', async () => {
        Array.from({ length: 2_500 }, (_, i) => submit({ id: `old-${i}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        submit({ id: 'fresh-1' })
        msPerRequest = 1_000
        let fired: string[] = []
        for (let i = 0; i < 4; i++) fired = [...fired, ...conversions(await newFormSubmissionTrigger.run(ctx({ store })))]
        expect(fired).toEqual(['fresh-1'])
        submit({ id: 'fresh-2' })
        expect(conversions(await newFormSubmissionTrigger.run(ctx({ store })))).toEqual(['fresh-2'])
    }, 60_000)

    it('a tied burst split by the poll deadline fires every submission exactly once', async () => {
        Array.from({ length: 20 }, (_, i) => submit({ id: `old-${i}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        const burstAt = tick()
        const burst = Array.from({ length: 300 }, (_, i) => `burst-${String(i).padStart(3, '0')}`)
        burst.forEach((id) => submit({ id, at: burstAt }))
        msPerRequest = 20_000
        let fired: string[] = []
        for (let i = 0; i < 8; i++) fired = [...fired, ...conversions(await newFormSubmissionTrigger.run(ctx({ store })))]
        msPerRequest = 0
        submit({ id: 'later' })
        fired = [...fired, ...conversions(await newFormSubmissionTrigger.run(ctx({ store })))]
        expect(fired).toHaveLength(burst.length + 1)
        expect([...fired].sort()).toEqual([...burst, 'later'].sort())
    }, 60_000)

    it('a failed form-fields request keeps the position, so the next poll still delivers the submissions', async () => {
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        submit({ id: 'fresh-1' })
        submit({ id: 'fresh-2' })
        failFields = true
        await expect(newFormSubmissionTrigger.run(ctx({ store }))).rejects.toThrow()
        failFields = false
        expect(conversions(await newFormSubmissionTrigger.run(ctx({ store })))).toEqual(['fresh-1', 'fresh-2'])
    })
})

