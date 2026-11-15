import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HttpError, httpClient, HttpRequest } from '@activepieces/pieces-common'
import { newEvent } from '../../../../pieces/community/google-calendar/src/lib/triggers/new-event'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
type CalEvent = { kind: string, id: string, status: string, summary: string, created: string, updated: string, eventType: string, start: { dateTime: string }, end: { dateTime: string } }
type Channel = { id: string, resourceId: string, address: string, active: boolean }
const changes: { v: number, ev: CalEvent }[] = []
const google = {
    version: 0,
    changes,
    channels: new Map<string, Channel>(),
    failFullSyncCalls: 0,
    failStopCalls: 0,
}

function createEvent({ id, summary }: { id: string, summary: string }): void {
    google.version += 1
    const now = new Date().toISOString()
    google.changes.push({ v: google.version, ev: { kind: 'calendar#event', id, status: 'confirmed', summary, created: now, updated: now, eventType: 'default', start: { dateTime: '2026-10-20T10:00:00Z' }, end: { dateTime: '2026-10-20T11:00:00Z' } } })
}
function latestById(sinceVersion: number): CalEvent[] {
    const byId = new Map<string, CalEvent>()
    for (const c of google.changes) if (c.v > sinceVersion) byId.set(c.ev.id, c.ev)
    return [...byId.values()]
}
const activeChannels = () => [...google.channels.values()].filter((c) => c.active)

async function fakeGoogle(request: HttpRequest): Promise<{ status: number, headers: Record<string, string>, body: unknown }> {
    await sleep(15)
    const url = request.url
    const ok = (body: unknown) => ({ status: 200, headers: {}, body })
    const fail = ({ status, message }: { status: number, message: string }) => new HttpError(request.body, { status, responseBody: { error: { code: status, message } } })
    if (url.endsWith('/events/watch')) {
        const body: { id: string, address: string, expiration: string } = request.body
        google.channels.set(body.id, { id: body.id, resourceId: 'res-primary', address: body.address, active: true })
        return ok({ kind: 'api#channel', id: body.id, resourceId: 'res-primary', resourceUri: 'https://www.googleapis.com/calendar/v3/calendars/primary/events', expiration: body.expiration })
    }
    if (url.endsWith('/channels/stop')) {
        const body: { id: string, resourceId: string } = request.body
        const ch = google.channels.get(body.id)
        if (google.failStopCalls > 0) {
            google.failStopCalls -= 1
            throw fail({ status: 503, message: 'Backend Error' })
        }
        if (!ch || !ch.active) throw fail({ status: 404, message: `Channel '${body.id}' not found for project` })
        ch.active = false
        return ok('')
    }
    if (/\/calendars\/[^/]+\/events$/.test(url) && request.method === 'GET') {
        const qp = request.queryParams ?? {}
        const token = qp['syncToken']
        if (token === undefined && google.failFullSyncCalls > 0) {
            google.failFullSyncCalls -= 1
            throw fail({ status: 503, message: 'The service is currently unavailable.' })
        }
        const since = token === undefined ? 0 : Number(token.replace('tok-', ''))
        const body: Record<string, unknown> = { kind: 'calendar#events', nextSyncToken: `tok-${google.version}` }
        if (qp['fields'] === undefined || qp['fields'].includes('items')) body['items'] = latestById(since)
        return ok(body)
    }
    throw fail({ status: 404, message: `unexpected ${request.method} ${url}` })
}

function memoryStore() {
    const data = new Map<string, unknown>()
    return {
        data,
        get: async (k: string) => { await sleep(3); return data.has(k) ? JSON.parse(JSON.stringify(data.get(k))) : null },
        put: async (k: string, v: unknown) => { await sleep(3); data.set(k, JSON.parse(JSON.stringify(v))); return v },
        delete: async (k: string) => { await sleep(3); data.delete(k) },
    }
}

const WEBHOOK_URL = 'https://cloud.example.com/api/v1/webhooks/flow-1'
const AUTH = { type: 'OAUTH2', access_token: 'ya29.test', data: {} }
const PROPS = { calendar_id: 'primary', event_types: undefined, search_filter: undefined, exclude_all_day: false }
const store = memoryStore()
const context = (headers?: Record<string, string>) => ({
    auth: AUTH, propsValue: PROPS, store, webhookUrl: WEBHOOK_URL,
    payload: { headers: headers ?? {}, body: {}, queryParams: {} },
})
const invoke = ({ hook, ctx }: { hook: 'onEnable' | 'onDisable' | 'run', ctx: ReturnType<typeof context> }) => Reflect.apply(newEvent[hook], newEvent, [ctx])
const storedWatchId = (): string => Reflect.get(Object(store.data.get('google_calendar_watch')), 'id')
let messageNumber = 1
const pushNotificationsForOneChange = () => activeChannels().map((ch) => context({
    'x-goog-resource-state': 'exists', 'x-goog-channel-id': ch.id, 'x-goog-resource-id': ch.resourceId,
    'x-goog-channel-expiration': 'Mon, 02 Nov 2026 10:00:00 GMT', 'x-goog-message-number': String(++messageNumber),
}))
const ids = (events: { id: string }[]) => events.map((e) => e.id)

beforeAll(() => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeGoogle, undefined, [request]))
})
afterAll(() => {
    vi.restoreAllMocks()
})

describe('C1777 Calendar New Event processes pushes from a channel that is not the registered one', () => {
    it('a leaked channel left by a failed stop during republish does not make one new event fire twice', async () => {
        createEvent({ id: 'evt-old', summary: 'Existing meeting' })
        await invoke({ hook: 'onEnable', ctx: context() })
        const firstChannel = storedWatchId()

        google.failStopCalls = 1
        const disableOutcome = await invoke({ hook: 'onDisable', ctx: context() }).then(() => 'ok', (e: Error) => `threw (ignored by server): ${e.message.slice(0, 50)}`)
        await invoke({ hook: 'onEnable', ctx: context() })
        const registered = storedWatchId()
        const live = activeChannels().map((c) => c.id)

        createEvent({ id: 'evt-booking', summary: 'Demo booked by client' })
        const notifications = pushNotificationsForOneChange()
        const results = await Promise.all(notifications.map((n) => invoke({ hook: 'run', ctx: n })))
        const fired = results.flatMap(ids)

        console.log('C1777 first channel', firstChannel, '| disable', disableOutcome, '| registered', registered,
            '| live channels', JSON.stringify(live), '| pushes', notifications.length, '| fired', JSON.stringify(fired))

        expect(live).toContain(firstChannel)
        expect(fired).toEqual(['evt-booking'])
    })
})
