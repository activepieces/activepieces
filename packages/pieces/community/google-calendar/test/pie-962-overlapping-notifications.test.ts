import { httpClient, HttpRequest } from '@activepieces/pieces-common'
import { AppConnectionType, DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { newEvent } from '../src/lib/triggers/new-event'

const NEW_EVENT = {
    kind: 'calendar#event',
    id: 'evt_quarterly_review',
    status: 'confirmed',
    summary: 'Quarterly review',
    eventType: 'default',
    start: { dateTime: '2026-10-05T09:00:00Z' },
    end: { dateTime: '2026-10-05T10:00:00Z' },
}

const dedupeCounters = new Map<string, number>()

const dedupeService = {
    async filterUniquePayloads(flowVersionId: string, payloads: unknown[]): Promise<unknown[]> {
        return payloads
            .filter((payload) => {
                const dedupeKeyValue = extractDedupeKey(payload)
                if (dedupeKeyValue === null || dedupeKeyValue === undefined) {
                    return true
                }
                const key = `${flowVersionId}:${String(dedupeKeyValue)}`
                const count = (dedupeCounters.get(key) ?? 0) + 1
                dedupeCounters.set(key, count)
                return count === 1
            })
            .map((payload) => (isRecord(payload) ? { ...payload, [DEDUPE_KEY_PROPERTY]: undefined } : payload))
    },
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function extractDedupeKey(payload: unknown): unknown {
    return isRecord(payload) ? payload[DEDUPE_KEY_PROPERTY] : null
}

function makeStore() {
    const data = new Map<string, unknown>([
        ['google_calendar_sync_token', 'sync-T0'],
        ['google_calendar_seen_event_ids', ['evt_older']],
    ])
    const roundTrip = () => new Promise((r) => setTimeout(r, 5))
    return {
        data,
        store: {
            get: async (key: string) => {
                await roundTrip()
                return data.has(key) ? structuredClone(data.get(key)) : null
            },
            put: async (key: string, value: unknown) => {
                await roundTrip()
                data.set(key, structuredClone(value))
                return value
            },
            delete: async (key: string) => {
                await roundTrip()
                data.delete(key)
            },
        },
    }
}

function stubGoogle() {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(respond, undefined, [request]))
}

async function respond(request: HttpRequest): Promise<{ status: number, headers: Record<string, string>, body: unknown }> {
    await new Promise((r) => setTimeout(r, 25))
    const syncToken = (request.queryParams ?? {})['syncToken']
    if (syncToken === 'sync-T0') {
        return { status: 200, headers: {}, body: { items: [NEW_EVENT], nextSyncToken: 'sync-T1' } }
    }
    return { status: 200, headers: {}, body: { items: [], nextSyncToken: syncToken } }
}

async function runOnNotification({ store, messageNumber }: { store: ReturnType<typeof makeStore>['store'], messageNumber: string }): Promise<unknown[]> {
    return Reflect.apply(newEvent.run, newEvent, [{
        auth: { type: AppConnectionType.OAUTH2, access_token: 'token', data: {} },
        propsValue: { calendar_id: 'primary', event_types: [], search_filter: undefined, exclude_all_day: false },
        store,
        payload: {
            headers: { 'x-goog-resource-state': 'exists', 'x-goog-message-number': messageNumber },
            body: {},
            queryParams: {},
        },
    }])
}

afterAll(() => {
    vi.restoreAllMocks()
})

describe('PIE-962 overlapping Google Calendar notifications', () => {
    it('control: two notifications processed one after the other start exactly one run for the new event', async () => {
        stubGoogle()
        const { store } = makeStore()
        const flowVersionId = `fv-seq-${Date.now()}`
        const first = await runOnNotification({ store, messageNumber: '101' })
        const second = await runOnNotification({ store, messageNumber: '102' })
        const runs = [
            ...(await dedupeService.filterUniquePayloads(flowVersionId, first)),
            ...(await dedupeService.filterUniquePayloads(flowVersionId, second)),
        ]
        expect(runs.filter((r) => isRecord(r) && r.id === NEW_EVENT.id)).toHaveLength(1)
    })

    it('two overlapping notifications for the same change start exactly one run for the new event', async () => {
        stubGoogle()
        const { store } = makeStore()
        const flowVersionId = `fv-par-${Date.now()}`
        const [first, second] = await Promise.all([
            runOnNotification({ store, messageNumber: '201' }),
            runOnNotification({ store, messageNumber: '202' }),
        ])
        const submitted = await Promise.all([
            dedupeService.filterUniquePayloads(flowVersionId, first),
            dedupeService.filterUniquePayloads(flowVersionId, second),
        ])
        const runs = submitted.flat()
        expect(runs.filter((r) => isRecord(r) && r.id === NEW_EVENT.id)).toHaveLength(1)
    })
})
