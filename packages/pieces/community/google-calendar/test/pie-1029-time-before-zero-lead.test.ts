import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { idsOf, triggerContext } from './range-fake-google'
import { eventStartTimeBefore } from '../../../../pieces/community/google-calendar/src/lib/triggers/event-start-time-before'

type Bound = { dateTime?: string, date?: string }
type CalEvent = { id: string, status: string, summary: string, updated: string, start: Bound, end: Bound }

const google: { timeZone: string, events: CalEvent[], failNextRequests: number } = { timeZone: 'UTC', events: [], failNextRequests: 0 }

const bound = (b: Bound) => (b.dateTime ? Date.parse(b.dateTime) : Date.parse(`${b.date}T00:00:00Z`))

function json({ body, status = 200 }: { body: unknown, status?: number }): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

async function fakeGoogleCalendar(input: unknown): Promise<Response> {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (google.failNextRequests > 0) {
        google.failNextRequests--
        return json({ body: { error: { code: 503, message: 'Backend Error' } }, status: 503 })
    }
    const m = url.pathname.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/)
    if (!m) return json({ body: { error: { code: 404 } }, status: 404 })
    if (m[2]) {
        const ev = google.events.find((e) => e.id === decodeURIComponent(m[2]))
        return ev ? json({ body: ev }) : json({ body: { error: { code: 404 } }, status: 404 })
    }
    const timeMin = url.searchParams.get('timeMin')
    const timeMax = url.searchParams.get('timeMax')
    const items = google.events
        .filter((e) => e.status !== 'cancelled' || url.searchParams.get('showDeleted') === 'true')
        .filter((e) => (timeMin ? bound(e.end) > Date.parse(timeMin) : true))
        .filter((e) => (timeMax ? bound(e.start) < Date.parse(timeMax) : true))
        .sort((a, b) => bound(a.start) - bound(b.start))
    return json({ body: { kind: 'calendar#events', timeZone: google.timeZone, items } })
}

function memoryStore() {
    const data = new Map<string, unknown>()
    return {
        get: async (k: string) => (data.has(k) ? data.get(k) : null),
        put: async (k: string, v: unknown) => { data.set(k, v); return v },
        delete: async (k: string) => { data.delete(k) },
    }
}

const auth = { access_token: 'token', data: {} }

function event({ id, summary, start, end }: { id: string, summary: string, start: string, end: string }): CalEvent {
    return { id, status: 'confirmed', summary, updated: '2026-10-01T08:00:00.000Z', start: { dateTime: start }, end: { dateTime: end } }
}

describe('C0125 Event Start (Time Before) with Time Before = 0', () => {
    beforeEach(() => {
        google.events = []
        google.failNextRequests = 0
        vi.stubGlobal('fetch', vi.fn(fakeGoogleCalendar))
        vi.useFakeTimers({ toFake: ['Date'] })
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('runs the flow once for a meeting starting at 10:03 when Time Before is 0 minutes', async () => {
        google.events = [event({ id: 'standup', summary: 'Standup', start: '2026-10-01T10:03:00Z', end: '2026-10-01T10:18:00Z' })]
        const props = { calendar_id: 'primary', specific_event: false, time_value: 0, time_unit: 'minutes' }
        const store = memoryStore()
        const ctx = (): Parameters<typeof eventStartTimeBefore.run>[0] => triggerContext({ value: { auth, store, propsValue: props, files: {} } })
        vi.setSystemTime(new Date('2026-10-01T09:55:00Z'))
        await eventStartTimeBefore.onEnable(ctx())
        const fired: string[] = []
        for (const t of ['10:00', '10:05', '10:10', '10:15']) {
            vi.setSystemTime(new Date(`2026-10-01T${t}:00Z`))
            const out = await eventStartTimeBefore.run(ctx())
            fired.push(...idsOf(out).map((id) => `${id}@${t}`))
        }
        const calls = vi.mocked(fetch).mock.calls.length
        console.log('C0125 fired:', JSON.stringify(fired), 'Google requests made:', calls)
        expect(fired.map((f) => f.split('@')[0])).toEqual(['standup'])
    })
})
