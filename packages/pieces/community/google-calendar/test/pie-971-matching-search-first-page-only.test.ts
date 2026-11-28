import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { AppConnectionType } from '@activepieces/pieces-framework'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newEventMatchingSearch } from '../src/lib/triggers/new-event-matching-search'

type FakeEvent = { id: string, summary: string, status: string, created: string, updated: string }

class FakeCalendar {
    events = new Map<string, FakeEvent>()
    pagesServed = 0

    put(e: FakeEvent): void {
        this.events.set(e.id, e)
    }

    handle(req: HttpRequest): unknown {
        const url = new URL(req.url)
        const q = req.queryParams ?? {}
        if (req.method !== HttpMethod.GET || !url.pathname.endsWith('/events') || q['updatedMin'] === undefined) {
            throw new Error(`unexpected request ${req.method} ${req.url}`)
        }
        const pageSize = Math.min(Number(q['maxResults'] ?? '250'), 2500)
        const offset = Number(q['pageToken'] || '0')
        const min = new Date(q['updatedMin']).getTime()
        const term = (q['q'] ?? '').toLowerCase()
        const all = [...this.events.values()]
            .filter((e) => new Date(e.updated).getTime() >= min)
            .filter((e) => term === '' || e.summary.toLowerCase().includes(term))
            .sort((a, b) => new Date(a.updated).getTime() - new Date(b.updated).getTime())
        const page = all.slice(offset, offset + pageSize)
        this.pagesServed += 1
        const res: Record<string, unknown> = {
            kind: 'calendar#events',
            items: page.map((e) => ({ kind: 'calendar#event', ...e })),
        }
        if (offset + pageSize < all.length) res['nextPageToken'] = String(offset + pageSize)
        return res
    }
}

afterEach(() => {
    vi.restoreAllMocks()
})

function memoryStore() {
    const data = new Map<string, string>()
    return {
        async get(key: string): Promise<unknown> {
            const raw = data.get(key)
            return raw === undefined ? null : JSON.parse(raw)
        },
        async put(key: string, value: unknown): Promise<unknown> {
            data.set(key, JSON.stringify(value))
            return value
        },
        async delete(key: string): Promise<void> {
            data.delete(key)
        },
    }
}

function installFake(fake: FakeCalendar): void {
    const respond = async (req: HttpRequest) => ({
        status: 200,
        headers: {},
        body: fake.handle(req),
    })
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((req) => Reflect.apply(respond, undefined, [req]))
}

const AUTH = { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} }

function ctx(store: unknown) {
    return {
        auth: AUTH,
        propsValue: { calendar_id: 'primary', search_term: 'interview', event_types: undefined, search_fields: undefined },
        store,
        files: {},
    }
}

const enable = (store: unknown) => Reflect.apply(newEventMatchingSearch.onEnable, newEventMatchingSearch, [ctx(store)])
const runPoll = (store: unknown) => Reflect.apply(newEventMatchingSearch.run, newEventMatchingSearch, [ctx(store)])
const ids = (out: { id: string }[]) => out.map((e) => e.id)
const iso = (ms: number) => new Date(ms).toISOString()

describe('PIE-971 New Event Matching Search reads only the first result page', () => {
    it('control: a new matching event is delivered when few events changed since the last poll', async () => {
        const fake = new FakeCalendar()
        installFake(fake)
        const store = memoryStore()
        await enable(store)

        const t = Date.now() + 2_000
        fake.put({ id: 'old-edited', summary: 'Interview loop planning', status: 'confirmed', created: iso(t - 30 * 86400000), updated: iso(t) })
        fake.put({ id: 'new-interview', summary: 'Interview with Jane', status: 'confirmed', created: iso(t + 1_000), updated: iso(t + 1_000) })

        expect(ids(await runPoll(store))).toEqual(['new-interview'])
    })

    it('a new matching event is delivered even when more than one page of older matching events was edited first', async () => {
        const fake = new FakeCalendar()
        installFake(fake)
        const store = memoryStore()
        await enable(store)

        const editedAt = Date.now() + 2_000
        for (let i = 0; i < 300; i++) {
            fake.put({ id: `slot_${i}`, summary: 'Interview slot (daily)', status: 'confirmed', created: iso(editedAt - 30 * 86400000), updated: iso(editedAt) })
        }
        const bookedAt = editedAt + 60_000
        fake.put({ id: 'new-interview', summary: 'Interview with Jane', status: 'confirmed', created: iso(bookedAt), updated: iso(bookedAt) })

        const emitted: string[] = []
        for (let poll = 0; poll < 3; poll++) {
            emitted.push(...ids(await runPoll(store)))
        }

        expect(emitted).toEqual(['new-interview'])
    })
})
