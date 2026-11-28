import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HttpError, httpClient, HttpRequest } from '@activepieces/pieces-common'
import { newEvent } from '../../../../pieces/community/google-calendar/src/lib/triggers/new-event'
import { idsOf, memoryStore, triggerContext } from './range-fake-google'

type CalEvent = { kind: string, id: string, status: string, summary: string, created: string, updated: string, eventType: string, start: { dateTime: string }, end: { dateTime: string } }
const changes: { v: number, ev: CalEvent }[] = []
const requests: Record<string, string>[] = []
const calendar = { version: 0, changes, invalidTokens: new Set<string>(), requests }

function createEvent({ id, summary, createdAt }: { id: string, summary: string, createdAt?: string }): void {
    calendar.version += 1
    const now = createdAt ?? new Date().toISOString()
    calendar.changes.push({ v: calendar.version, ev: { kind: 'calendar#event', id, status: 'confirmed', summary, created: now, updated: now, eventType: 'default', start: { dateTime: '2026-10-20T10:00:00Z' }, end: { dateTime: '2026-10-20T11:00:00Z' } } })
}

function latestById(sinceVersion: number): CalEvent[] {
    const byId = new Map<string, CalEvent>()
    for (const c of calendar.changes) if (c.v > sinceVersion) byId.set(c.ev.id, c.ev)
    return [...byId.values()]
}

async function fakeGoogle(request: HttpRequest): Promise<{ status: number, headers: Record<string, string>, body: unknown }> {
    const url = request.url
    const ok = (body: unknown) => ({ status: 200, headers: {}, body })
    if (url.endsWith('/events/watch')) return ok({ kind: 'api#channel', id: String(Reflect.get(Object(request.body), 'id')), resourceId: 'res-1', expiration: String(Date.now() + 6 * 86400000) })
    if (url.endsWith('/channels/stop')) return ok({})
    if (/\/calendars\/[^/]+\/events$/.test(url) && request.method === 'GET') {
        const qp = request.queryParams ?? {}
        calendar.requests.push({ ...qp })
        const token = qp['syncToken']
        if (token !== undefined && calendar.invalidTokens.has(token)) {
            throw new HttpError(request.body, { status: 410, responseBody: { error: { code: 410, message: 'Sync token is no longer valid, a full sync is required.', errors: [{ domain: 'calendar', reason: 'fullSyncRequired' }] } } })
        }
        const since = token === undefined ? 0 : Number(token.replace('tok-', ''))
        const items = latestById(since)
        const body: Record<string, unknown> = { kind: 'calendar#events', nextSyncToken: `tok-${calendar.version}` }
        if (qp['fields'] === undefined || qp['fields'].includes('items')) body['items'] = items
        return ok(body)
    }
    throw new HttpError(request.body, { status: 404, responseBody: { error: { code: 404, message: `unexpected ${request.method} ${url}` } } })
}

const AUTH = { type: 'OAUTH2', access_token: 'ya29.test', data: {} }
const PROPS = { calendar_id: 'primary', event_types: undefined, search_filter: undefined, exclude_all_day: false }
const { store } = memoryStore()
const context = (payloadHeaders?: Record<string, string>): Parameters<typeof newEvent.run>[0] => triggerContext({
    value: {
        auth: AUTH, propsValue: PROPS, store, webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
        payload: { headers: payloadHeaders ?? {}, body: {}, queryParams: {} },
    },
})
const notification = async (n: number) => {
    const watch = await store.get<{ id: string }>('google_calendar_watch')
    return context({ 'x-goog-resource-state': 'exists', 'x-goog-channel-id': watch?.id ?? '', 'x-goog-message-number': String(n) })
}
const ids = (events: unknown[]) => idsOf(events)

beforeAll(() => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeGoogle, undefined, [request]))
})
afterAll(() => {
    vi.restoreAllMocks()
})

describe('C0296 Calendar New Event after Google invalidates the sync token (HTTP 410)', () => {
    it('still fires for the event created while the old token was being rejected, and not for older events', async () => {
        createEvent({ id: 'evt-old-1', summary: 'Weekly 1:1', createdAt: '2026-09-01T08:00:00.000Z' })
        createEvent({ id: 'evt-old-2', summary: 'Board meeting', createdAt: '2026-09-02T08:00:00.000Z' })
        await newEvent.onEnable(context())
        const enabledToken = await store.get<string>('google_calendar_sync_token')
        await new Promise((r) => setTimeout(r, 20))

        createEvent({ id: 'evt-a', summary: 'Intro call with ACME' })
        const first = await newEvent.run(await notification(2))

        const tokenBefore410 = await store.get<string>('google_calendar_sync_token') ?? ''
        calendar.invalidTokens.add(tokenBefore410)
        createEvent({ id: 'evt-b', summary: 'Demo booked by client' })
        const afterInvalidation = await newEvent.run(await notification(3))

        createEvent({ id: 'evt-c', summary: 'Follow-up booked by client' })
        const later = await newEvent.run(await notification(4))

        const fired = [...ids(first), ...ids(afterInvalidation), ...ids(later)]
        console.log('C0296 enabled token', enabledToken, '| run1', JSON.stringify(ids(first)), '| token rejected', tokenBefore410,
            '| run2 (410)', JSON.stringify(ids(afterInvalidation)), '| token now', await store.get<string>('google_calendar_sync_token'), '| run3', JSON.stringify(ids(later)))

        expect(ids(first)).toEqual(['evt-a'])
        expect(fired).toContain('evt-c')
        expect(fired).toContain('evt-b')
        expect(fired).not.toContain('evt-old-1')
        expect(fired).not.toContain('evt-old-2')
        expect(fired.filter((id) => id === 'evt-a')).toHaveLength(1)
    })
})
