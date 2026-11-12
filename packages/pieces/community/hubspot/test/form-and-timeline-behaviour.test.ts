import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'
import { newFormSubmissionTrigger } from '../src/lib/triggers/new-form-submission'
import { newEmailSubscriptionsTimelineTrigger } from '../src/lib/triggers/email-subscriptions-timeline'

type Submission = { conversionId: string, submittedAt: number, pageUrl: string, values: { name: string, value: string }[] }

type TimelineEvent = { timestamp: number, recipient: string }

const portal: { submissions: Submission[], newestFirst: boolean, timeline: TimelineEvent[], calls: string[] } = {
    submissions: [],
    newestFirst: true,
    timeline: [],
    calls: [],
}
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
const ctx = ({ store, propsValue = { formId: 'F1', allowMultipleFiles: false }, isRepublish }: { store: Store, propsValue?: Record<string, unknown>, isRepublish?: boolean }) =>
    hubspotTestKit.pollingContext({ store, propsValue, isRepublish })
const conversions = (events: unknown[]) => events.map((event) => hubspotTestKit.textField({ value: event, key: 'conversionId' }))

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
        return new Response(JSON.stringify(route(url)), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe.each([
    { order: 'newest first', newestFirst: true },
    { order: 'oldest first', newestFirst: false },
])('New Form Submission behaviour, API order $order', ({ newestFirst }) => {
    beforeEach(() => {
        portal.newestFirst = newestFirst
    })

    it('fires once per submission across polls and republish, never for old ones', async () => {
        Array.from({ length: 120 }, (_, index) => submit({ id: `old-${index}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        expect(await newFormSubmissionTrigger.run(ctx({ store }))).toEqual([])
        submit({ id: 'new-1' })
        const [event] = await newFormSubmissionTrigger.run(ctx({ store }))
        expect(hubspotTestKit.textField({ value: event, key: 'conversionId' })).toBe('new-1')
        expect(hubspotTestKit.field({ value: event, key: 'values' })).toEqual({ Email: 'new-1@example.com' })
        expect(await newFormSubmissionTrigger.run(ctx({ store }))).toEqual([])
        submit({ id: 'between' })
        await newFormSubmissionTrigger.onDisable(ctx({ store, isRepublish: true }))
        await newFormSubmissionTrigger.onEnable(ctx({ store, isRepublish: true }))
        expect(conversions(await newFormSubmissionTrigger.run(ctx({ store })))).toEqual(['between'])
    })

    it('emits a burst of more than one page oldest first', async () => {
        submit({ id: 'old' })
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        const burst = Array.from({ length: 75 }, (_, index) => `b-${index}`)
        burst.forEach((id) => submit({ id, at: tick(1000) }))
        expect(conversions(await newFormSubmissionTrigger.run(ctx({ store })))).toEqual(burst)
    })

    it('test() returns the newest submissions, oldest to newest', async () => {
        Array.from({ length: 80 }, (_, index) => submit({ id: `s-${index}`, at: tick(1000) }))
        expect(conversions(await newFormSubmissionTrigger.test(ctx({ store: memoryStore() }))).at(-1)).toBe('s-79')
    })
})

describe('New Form Submission paging on a newest-first form', () => {
    it('stops paging once the checkpoint is reached instead of reading the whole history', async () => {
        Array.from({ length: 2_000 }, (_, index) => submit({ id: `old-${index}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await newFormSubmissionTrigger.onEnable(ctx({ store }))
        submit({ id: 'fresh' })
        portal.calls = []
        expect(conversions(await newFormSubmissionTrigger.run(ctx({ store })))).toEqual(['fresh'])
        expect(portal.calls.filter((path) => path.startsWith('/form-integrations')).length).toBe(1)
    })
})

describe('Email subscriptions timeline test mode', () => {
    it('test() reads one page and returns the newest events, oldest to newest', async () => {
        portal.timeline = Array.from({ length: 450 }, (_, index) => ({ timestamp: tick(1000), recipient: `r-${index}@example.com` }))
        const sample = await newEmailSubscriptionsTimelineTrigger.test(ctx({ store: memoryStore(), propsValue: {} }))
        expect(portal.calls.filter((path) => path.includes('/subscriptions/timeline'))).toHaveLength(1)
        expect(hubspotTestKit.textField({ value: sample.at(-1), key: 'recipient' })).toBe('r-449@example.com')
    })
})
