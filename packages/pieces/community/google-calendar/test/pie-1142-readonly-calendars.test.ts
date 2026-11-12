import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

// C0148: the read-only Google Calendar triggers must offer calendars that are shared with the
// user read-only, as 'New or Updated Event' does.
//
// Stand-in: global fetch, answering only GET .../calendar/v3/users/me/calendarList the way the
// Calendar API documents it: `minAccessRole` filters entries to that role or higher
// (freeBusyReader < reader < writer < owner); without it every calendar in the list is returned.
// The real dropdown options() functions, getCalendars() and the pieces httpClient run unchanged.
//
// Scope: the four POLLING triggers only. They read the calendar with events.list, which a 'reader' can call.
// 'New Event' is left out on purpose: it registers a Google push channel (events.watch), and Google does not
// support push on some read-only subscribed calendars (e.g. public holiday calendars), so its writer-only
// filter may be deliberate.
const CALENDARS = [
    { id: 'me@example.com', summary: 'My calendar', accessRole: 'owner', primary: true },
    { id: 'team@group.calendar.google.com', summary: 'Team planning', accessRole: 'writer' },
    { id: 'ana@example.com', summary: 'Ana (shared read-only)', accessRole: 'reader' },
]
const ROLE_RANK: Record<string, number> = { freeBusyReader: 0, reader: 1, writer: 2, owner: 3 }
const requested: string[] = []

const TRIGGERS_DIR = path.resolve(__dirname, '../src/lib/triggers')
const AUTH = { type: 'OAUTH2', access_token: 'token-123', data: {} }

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('Google Calendar triggers: calendar dropdown', () => {
    it('lists a calendar shared read-only in every read-only calendar trigger', async () => {
        vi.stubGlobal('fetch', async (input: string | URL) => {
            const url = new URL(String(input))
            requested.push(url.pathname + url.search)
            if (!url.pathname.endsWith('/calendar/v3/users/me/calendarList')) {
                return new Response(JSON.stringify({ error: { code: 404 } }), { status: 404, headers: { 'content-type': 'application/json' } })
            }
            const minRole = url.searchParams.get('minAccessRole')
            const items = CALENDARS.filter((c) => minRole === null || ROLE_RANK[c.accessRole] >= ROLE_RANK[minRole])
            return new Response(JSON.stringify({ kind: 'calendar#calendarList', items }), { status: 200, headers: { 'content-type': 'application/json' } })
        })

        const triggers: Record<string, { file: string, exportName: string }> = {
            'New or Updated Event': { file: 'calendar-event.ts', exportName: 'calendarEventChanged' },
            'Event Cancelled': { file: 'event-cancelled.ts', exportName: 'eventCancelled' },
            'Event Ends': { file: 'event-ends.ts', exportName: 'eventEnds' },
            'Event Start (Time Before)': { file: 'event-start-time-before.ts', exportName: 'eventStartTimeBefore' },
            'New Event Matching Search': { file: 'new-event-matching-search.ts', exportName: 'newEventMatchingSearch' },
        }

        const offered: Record<string, string[]> = {}
        for (const [name, { file, exportName }] of Object.entries(triggers)) {
            const mod = await import(path.join(TRIGGERS_DIR, file))
            const trigger = mod[exportName]
            const state = await trigger.props.calendar_id.options({ auth: AUTH }, {} as never)
            offered[name] = state.options.map((o: { value: string }) => o.value)
        }

        const everyCalendar = CALENDARS.map((c) => c.id)
        expect(offered).toEqual({
            'New or Updated Event': everyCalendar,
            'Event Cancelled': everyCalendar,
            'Event Ends': everyCalendar,
            'Event Start (Time Before)': everyCalendar,
            'New Event Matching Search': everyCalendar,
        })
    })
})
