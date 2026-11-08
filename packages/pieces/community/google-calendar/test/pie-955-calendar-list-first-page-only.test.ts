import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { idsOf, triggerContext } from './range-fake-google'
import { calendarEventChanged } from '../../../../pieces/community/google-calendar/src/lib/triggers/calendar-event'
import { newCalendar } from '../../../../pieces/community/google-calendar/src/lib/triggers/new-calendar'

type Cal = { kind: string, id: string, summary: string, accessRole: string, primary?: boolean }

const google: { calendars: Cal[] } = { calendars: [] }

function json({ body, status = 200 }: { body: unknown, status?: number }): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

async function fakeGoogleCalendar(input: unknown): Promise<Response> {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.pathname !== '/calendar/v3/users/me/calendarList') return json({ body: { error: { code: 404 } }, status: 404 })
    const minRole = url.searchParams.get('minAccessRole')
    const rank: Record<string, number> = { freeBusyReader: 0, reader: 1, writer: 2, owner: 3 }
    const all = google.calendars.filter((c) => !minRole || rank[c.accessRole] >= rank[minRole])
    const pageSize = Math.min(Number(url.searchParams.get('maxResults') ?? '100') || 100, 250)
    const offset = Number(url.searchParams.get('pageToken') || '0')
    const items = all.slice(offset, offset + pageSize)
    const next = offset + pageSize < all.length ? String(offset + pageSize) : undefined
    return json({ body: { kind: 'calendar#calendarList', etag: 'e', items, ...(next ? { nextPageToken: next } : { nextSyncToken: 'sync' }) } })
}

function memoryStore() {
    const data = new Map<string, unknown>()
    return {
        get: async (k: string) => (data.has(k) ? data.get(k) : null),
        put: async (k: string, v: unknown) => { data.set(k, v); return v },
        delete: async (k: string) => { data.delete(k) },
    }
}

const auth = { type: 'OAUTH2', access_token: 'token', data: {} }

function cal({ i, role = 'writer' }: { i: number, role?: string }): Cal {
    return { kind: 'calendar#calendarListEntry', id: `room-${String(i).padStart(3, '0')}@resource.calendar.google.com`, summary: `Room ${i}`, accessRole: role }
}

describe('C1328 Google Calendar calendar list beyond the first page', () => {
    beforeEach(() => {
        google.calendars = [{ kind: 'calendar#calendarListEntry', id: 'me@example.com', summary: 'me@example.com', accessRole: 'owner', primary: true }]
        for (let i = 1; i <= 149; i++) google.calendars.push(cal({ i }))
        vi.stubGlobal('fetch', vi.fn(fakeGoogleCalendar))
    })
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('the Calendar dropdown of a Calendar trigger offers every calendar the account can use (150)', async () => {
        const prop = calendarEventChanged.props.calendar_id
        const state = await Reflect.apply(prop.options, prop, [{ auth }, {}])
        const values = state.options.map((o: { value: string }) => o.value)
        expect(values).toHaveLength(150)
        expect(values).toContain('room-149@resource.calendar.google.com')
    })

    it('New Calendar fires for a calendar shared into an account that already has 150 calendars', async () => {
        const store = memoryStore()
        const props = { access_role_filter: [], calendar_name_filter: '', exclude_shared: false }
        const ctx = (): Parameters<typeof newCalendar.run>[0] => triggerContext({ value: { auth, store, propsValue: props, files: {} } })
        await newCalendar.onEnable(ctx())
        google.calendars.push({ kind: 'calendar#calendarListEntry', id: 'board-2027@group.calendar.google.com', summary: 'Board 2027', accessRole: 'reader' })
        const out = await newCalendar.run(ctx())
        expect(idsOf(out)).toEqual(['board-2027@group.calendar.google.com'])
    })
})
