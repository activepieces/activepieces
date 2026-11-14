import { tryCatch } from '@activepieces/pieces-framework'
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

async function pollAt({ times, props, enableAt }: { times: string[], props: Record<string, unknown>, enableAt: string }): Promise<{ at: string, ids: string[] }[]> {
    const store = memoryStore()
    const ctx = (): Parameters<typeof eventStartTimeBefore.run>[0] => triggerContext({ value: { auth, store, propsValue: props, files: {} } })
    vi.setSystemTime(new Date(enableAt))
    await eventStartTimeBefore.onEnable(ctx())
    const fired: { at: string, ids: string[] }[] = []
    for (const t of times) {
        vi.setSystemTime(new Date(t))
        const out = await tryCatch(() => eventStartTimeBefore.run(ctx()))
        fired.push({ at: t, ids: out.error ? [] : idsOf(out.data) })
    }
    return fired
}

describe('C0089 Event Start (Time Before) covers every reminder time between polls', () => {
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

    it('Target Specific Event: the 10:05 poll fails once (Google 503); the 10:10 retry still sends the 10:07 reminder', async () => {
        google.events = [event({ id: 'board', summary: 'Board meeting', start: '2026-10-01T10:22:00Z', end: '2026-10-01T11:22:00Z' })]
        const props = { calendar_id: 'primary', specific_event: true, event_id: 'board', time_value: 15, time_unit: 'minutes' }
        const store = memoryStore()
        const ctx = (): Parameters<typeof eventStartTimeBefore.run>[0] => triggerContext({ value: { auth, store, propsValue: props, files: {} } })
        vi.setSystemTime(new Date('2026-10-01T10:00:00Z'))
        await eventStartTimeBefore.onEnable(ctx())
        const fired: string[] = []
        for (const t of ['2026-10-01T10:00:00Z', '2026-10-01T10:05:00Z', '2026-10-01T10:10:00Z', '2026-10-01T10:15:00Z', '2026-10-01T10:20:00Z']) {
            vi.setSystemTime(new Date(t))
            if (t.endsWith('10:05:00Z')) google.failNextRequests = 1
            const out = await tryCatch(() => eventStartTimeBefore.run(ctx()))
            fired.push(...(out.error ? ['failed'] : idsOf(out.data)).map((id) => `${id}@${t.slice(11, 16)}`))
        }
        console.log('C0089 specific-event fired:', JSON.stringify(fired))
        expect(fired.map((f) => f.split('@')[0]).filter((id) => id !== 'failed')).toEqual(['board'])
    })

    it('whole calendar, AP_TRIGGER_DEFAULT_POLL_INTERVAL=10: a 3-minute check-in at 10:22 still gets its 10:07 reminder', async () => {
        google.events = [
            event({ id: 'checkin', summary: 'Quick check-in', start: '2026-10-01T10:22:00Z', end: '2026-10-01T10:25:00Z' }),
            event({ id: 'later', summary: 'Planning', start: '2026-10-01T10:40:00Z', end: '2026-10-01T11:10:00Z' }),
        ]
        const props = { calendar_id: 'primary', specific_event: false, time_value: 15, time_unit: 'minutes' }
        const fired = await pollAt({ times: ['2026-10-01T10:10:00Z', '2026-10-01T10:20:00Z', '2026-10-01T10:30:00Z', '2026-10-01T10:40:00Z'], props, enableAt: '2026-10-01T10:00:00Z' })
        console.log('C0089 10-minute interval fired:', JSON.stringify(fired))
        const all = fired.flatMap((f) => f.ids).sort()
        expect(all).toEqual(['checkin', 'later'])
    })
})
