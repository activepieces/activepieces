import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { AppConnectionType } from '@activepieces/pieces-framework'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newEventMatchingSearch } from '../../../../pieces/community/google-calendar/src/lib/triggers/new-event-matching-search'

const OAUTH = { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} }
const MIN = 60_000
const DAY = 24 * 60 * MIN
const BASE = 'https://www.googleapis.com/calendar/v3/calendars/team%40example.com/events'

type FakeEvent = {
    recurrence?: string[]
    recurringEventId?: string
    id: string
    status: string
    summary: string
    created: string
    updated: string
    start: { dateTime: string }
    end: { dateTime: string }
}

const calendar: FakeEvent[] = []
const listCalls: Record<string, string>[] = []

function iso(ms: number): string {
    return new Date(ms).toISOString()
}

function addEvent(e: { id: string, summary: string, start: number, end: number, created: number, updated: number, status?: string }): void {
    calendar.push({
        id: e.id,
        status: e.status ?? 'confirmed',
        summary: e.summary,
        created: iso(e.created),
        updated: iso(e.updated),
        start: { dateTime: iso(e.start) },
        end: { dateTime: iso(e.end) },
    })
}

function list(q: Record<string, string>): { items: FakeEvent[], nextPageToken?: string } {
    listCalls.push({ ...q })
    let items = calendar.filter((e) => e.status !== 'cancelled' || q.showDeleted === 'true' || q.updatedMin)
    items = items.filter((e) => (q.singleEvents === 'true' ? !e.recurrence : !e.recurringEventId))
    if (q.timeMin) items = items.filter((e) => Date.parse(e.end.dateTime) > Date.parse(q.timeMin))
    if (q.timeMax) items = items.filter((e) => Date.parse(e.start.dateTime) < Date.parse(q.timeMax))
    if (q.updatedMin) items = items.filter((e) => Date.parse(e.updated) >= Date.parse(q.updatedMin))
    if (q.q) items = items.filter((e) => e.summary.toLowerCase().includes(q.q.toLowerCase()))
    if (q.orderBy === 'startTime') items = [...items].sort((a, b) => Date.parse(a.start.dateTime) - Date.parse(b.start.dateTime))
    if (q.orderBy === 'updated') items = [...items].sort((a, b) => Date.parse(a.updated) - Date.parse(b.updated))
    const pageSize = Math.min(Number(q.maxResults ?? 250), 2500)
    const offset = q.pageToken ? Number(q.pageToken) : 0
    const page = items.slice(offset, offset + pageSize)
    const next = offset + pageSize < items.length ? String(offset + pageSize) : undefined
    return next ? { items: page, nextPageToken: next } : { items: page }
}

function fakeGoogle(): void {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(respond, undefined, [request]))
}

async function respond(request: HttpRequest): Promise<{ status: number, headers: Record<string, string>, body: unknown }> {
    const path = request.url.split('?')[0].replace('/calendars/team@example.com/', '/calendars/team%40example.com/')
    if (request.method === 'GET' && path === BASE) {
        return { status: 200, headers: {}, body: list(request.queryParams ?? {}) }
    }
    if (request.method === 'GET' && path.startsWith(BASE + '/')) {
        const found = calendar.find((e) => e.id === path.slice(BASE.length + 1))
        if (!found) throw new HttpError(request.body, { status: 404, responseBody: { error: { code: 404 } } })
        return { status: 200, headers: {}, body: found }
    }
    throw new Error(`unexpected request ${request.method} ${request.url}`)
}

function memoryStore() {
    const data = new Map<string, unknown>()
    return {
        async get(key: string): Promise<unknown> { return data.has(key) ? data.get(key) : null },
        async put(key: string, value: unknown): Promise<unknown> { data.set(key, value); return value },
        async delete(key: string): Promise<void> { data.delete(key) },
    }
}

function ctx({ propsValue, store }: { propsValue: Record<string, unknown>, store: ReturnType<typeof memoryStore> }) {
    return { auth: OAUTH, store, propsValue, files: {} }
}

async function enable(context: ReturnType<typeof ctx>): Promise<void> {
    await Reflect.apply(newEventMatchingSearch.onEnable, newEventMatchingSearch, [context])
}

async function poll(context: ReturnType<typeof ctx>): Promise<FakeEvent[]> {
    return Reflect.apply(newEventMatchingSearch.run, newEventMatchingSearch, [context])
}

let now: number

beforeEach(() => {
    calendar.length = 0
    listCalls.length = 0
    vi.useFakeTimers({ toFake: ['Date'] })
    now = Date.parse('2026-09-30T12:00:00.000Z')
    fakeGoogle()
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})

function addWeeklySeries({ id, summary, firstStart, weeks, createdAt }: { id: string, summary: string, firstStart: number, weeks: number, createdAt: number }): void {
    calendar.push({ id, status: 'confirmed', summary, created: iso(createdAt), updated: iso(createdAt), start: { dateTime: iso(firstStart) }, end: { dateTime: iso(firstStart + 30 * MIN) }, recurrence: ['RRULE:FREQ=WEEKLY'] })
    for (let w = 0; w < weeks; w++) {
        const s = firstStart + w * 7 * DAY
        calendar.push({ id: `${id}_${w}`, recurringEventId: id, status: 'confirmed', summary, created: iso(createdAt), updated: iso(createdAt), start: { dateTime: iso(s) }, end: { dateTime: iso(s + 30 * MIN) } })
    }
}

describe('C0212-n2 one new recurring meeting fires New Event Matching Search once', () => {
    it('creating a weekly "Phoenix sync" series starts one flow run, not one per week', async () => {
        const store = memoryStore()
        const props = { calendar_id: 'team@example.com', search_term: 'Phoenix' }
        vi.setSystemTime(now - 10 * MIN)
        await enable(ctx({ propsValue: props, store }))

        addWeeklySeries({ id: 'phoenix-sync', summary: 'Phoenix sync', firstStart: now + DAY, weeks: 52, createdAt: now - 5 * MIN })

        vi.setSystemTime(now)
        const out = await poll(ctx({ propsValue: props, store }))

        expect(out.map((e) => e.summary)).toEqual(['Phoenix sync'])
    })

    it('control: creating a one-off "Phoenix kickoff" starts one flow run', async () => {
        const store = memoryStore()
        const props = { calendar_id: 'team@example.com', search_term: 'Phoenix' }
        vi.setSystemTime(now - 10 * MIN)
        await enable(ctx({ propsValue: props, store }))

        addEvent({ id: 'phoenix-kickoff', summary: 'Phoenix kickoff', start: now + DAY, end: now + DAY + 60 * MIN, created: now - 5 * MIN, updated: now - 5 * MIN })

        vi.setSystemTime(now)
        const out = await poll(ctx({ propsValue: props, store }))

        expect(out.map((e) => e.summary)).toEqual(['Phoenix kickoff'])
    })
})
