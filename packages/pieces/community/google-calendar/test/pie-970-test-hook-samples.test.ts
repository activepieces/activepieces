import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { AppConnectionType, Store } from '@activepieces/pieces-framework'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { eventEnds } from '../../../../pieces/community/google-calendar/src/lib/triggers/event-ends'
import { eventStartTimeBefore } from '../../../../pieces/community/google-calendar/src/lib/triggers/event-start-time-before'
import { idsOf, memoryStore as sharedMemoryStore, triggerContext } from './range-fake-google'

const OAUTH = { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} }
const MIN = 60_000
const DAY = 24 * 60 * MIN
const BASE = 'https://www.googleapis.com/calendar/v3/calendars/team%40example.com/events'

type FakeEvent = {
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
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
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
    })
}

function memoryStore(): Store {
    return sharedMemoryStore().store
}

function ctx({ propsValue, store }: { propsValue: Record<string, unknown>, store: Store }): Parameters<typeof eventEnds.run>[0] & Parameters<typeof eventStartTimeBefore.run>[0] {
    return triggerContext({ value: { auth: OAUTH, store, propsValue, files: {} } })
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

describe('C0538/C0573 Load Sample Data returns real Google Calendar events', () => {
    beforeEach(() => {
        addEvent({ id: 'morning-standup', summary: 'Morning standup', start: now - 3 * 60 * MIN, end: now - 3 * 60 * MIN + 15 * MIN, created: now - 7 * DAY, updated: now - 7 * DAY })
        addEvent({ id: 'design-review', summary: 'Design review', start: now - 90 * MIN, end: now - 30 * MIN, created: now - 7 * DAY, updated: now - 7 * DAY })
        addEvent({ id: 'customer-demo', summary: 'Customer demo', start: now + 4 * 60 * MIN, end: now + 5 * 60 * MIN, created: now - 7 * DAY, updated: now - 7 * DAY })
        addEvent({ id: 'planning', summary: 'Sprint planning', start: now + DAY, end: now + DAY + 60 * MIN, created: now - 7 * DAY, updated: now - 7 * DAY })
        vi.setSystemTime(now)
    })

    it('C0573 Event Ends: the sample contains a meeting that has already ended', async () => {
        const out = await eventEnds.test(ctx({ propsValue: { calendar_id: 'team@example.com', specific_event: false }, store: memoryStore() }))
        const ids = idsOf(out)
        expect(ids.length).toBeGreaterThan(0)
        expect(ids.every((id) => ['morning-standup', 'design-review'].includes(id))).toBe(true)
    })

    it('C0538 Event Start (Time Before): the sample contains an upcoming meeting', async () => {
        const props = { calendar_id: 'team@example.com', specific_event: false, time_value: 15, time_unit: 'minutes' }
        const out = await eventStartTimeBefore.test(ctx({ propsValue: props, store: memoryStore() }))
        const ids = idsOf(out)
        expect(ids.length).toBeGreaterThan(0)
        expect(ids.every((id) => ['customer-demo', 'planning'].includes(id))).toBe(true)
    })
})
