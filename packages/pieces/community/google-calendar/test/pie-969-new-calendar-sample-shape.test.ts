import { HttpRequest, httpClient } from '@activepieces/pieces-common'
import { AppConnectionType, Store } from '@activepieces/pieces-framework'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newCalendar } from '../../../../pieces/community/google-calendar/src/lib/triggers/new-calendar'
import { memoryStore as sharedMemoryStore, triggerContext } from './range-fake-google'

const OAUTH = { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} }
const CALENDAR_LIST = 'https://www.googleapis.com/calendar/v3/users/me/calendarList'

type FakeCalendar = { kind: string, id: string, summary: string, accessRole: string, primary?: boolean, timeZone: string }

const calendarList: FakeCalendar[] = []

function addCalendar(c: { id: string, summary: string, accessRole: string, primary?: true }): void {
    calendarList.push({ kind: 'calendar#calendarListEntry', timeZone: 'Europe/Berlin', ...c })
}

function fakeGoogle(): void {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
        if (request.method === 'GET' && request.url.split('?')[0] === CALENDAR_LIST) {
            const q = request.queryParams ?? {}
            let items = calendarList
            const rank: Record<string, number> = { freeBusyReader: 0, reader: 1, writer: 2, owner: 3 }
            if (q.minAccessRole) items = items.filter((c) => rank[c.accessRole] >= rank[q.minAccessRole])
            const pageSize = Math.min(Number(q.maxResults ?? 100), 250)
            const offset = q.pageToken ? Number(q.pageToken) : 0
            const page = items.slice(offset, offset + pageSize)
            const body: Record<string, unknown> = { kind: 'calendar#calendarList', items: page }
            if (offset + pageSize < items.length) body.nextPageToken = String(offset + pageSize)
            return { status: 200, headers: {}, body }
        }
        throw new Error(`unexpected request ${request.method} ${request.url}`)
    })
}

const trigger = newCalendar

function memoryStore(): Store {
    return sharedMemoryStore().store
}

function ctx({ propsValue, store }: { propsValue: Record<string, unknown>, store: Store }): Parameters<typeof newCalendar.run>[0] {
    return triggerContext({ value: { auth: OAUTH, store, propsValue, files: {} } })
}

function asSubmitted(value: unknown): Record<string, unknown>[] {
    return JSON.parse(JSON.stringify(value))
}

beforeEach(() => {
    calendarList.length = 0
    fakeGoogle()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('C0565-n1 New Calendar sample data has the same shape as a real run', () => {
    it('the sample from Load Sample Data has the same top-level fields as the payload of a real run', async () => {
        addCalendar({ id: 'me@example.com', summary: 'me@example.com', accessRole: 'owner', primary: true })
        const store = memoryStore()
        await trigger.onEnable(ctx({ propsValue: {}, store }))
        addCalendar({ id: 'marketing@group.calendar.google.com', summary: 'Marketing', accessRole: 'writer' })

        const [sample] = asSubmitted(await trigger.test(ctx({ propsValue: {}, store: memoryStore() })))
        const [payload] = asSubmitted(await trigger.run(ctx({ propsValue: {}, store })))

        expect(payload.summary).toBe('Marketing')
        expect(Object.keys(sample).sort()).toEqual(Object.keys(payload).sort())
        expect(sample.summary).toBe('Marketing')
    })

    it('the sample respects the configured Access Role Filter', async () => {
        addCalendar({ id: 'me@example.com', summary: 'me@example.com', accessRole: 'owner', primary: true })
        addCalendar({ id: 'side-project@group.calendar.google.com', summary: 'Side project', accessRole: 'owner' })
        addCalendar({ id: 'holidays@group.v.calendar.google.com', summary: 'Holidays', accessRole: 'reader' })

        const samples = asSubmitted(await trigger.test(ctx({ propsValue: { access_role_filter: ['owner'] }, store: memoryStore() })))

        expect(samples.length).toBeGreaterThan(0)
        expect(samples.every((s) => s.accessRole === 'owner')).toBe(true)
    })
})
