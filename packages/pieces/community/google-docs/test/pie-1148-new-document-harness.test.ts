import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppConnectionType, AppConnectionValueForAuthProperty, Store, TriggerStrategy } from '@activepieces/pieces-framework'
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test'

type FakeFile = { kind: string, id: string, name: string, mimeType: string, createdTime: string }

type Vendor = {
    files: FakeFile[]
    emptyLeadingPages: number
    pageSize: number
    calls: { params: Record<string, unknown>, options: Record<string, unknown> | undefined }[]
    msPerCall: number
    clock: number
}

const vendor = vi.hoisted((): Vendor => ({
    files: [],
    emptyLeadingPages: 0,
    pageSize: 2,
    calls: [],
    msPerCall: 0,
    clock: 0,
}))

vi.mock('@googleapis/drive', () => ({
    drive_v3: {},
    drive: () => ({
        files: {
            list: async (params: Record<string, unknown>, options?: Record<string, unknown>) => {
                vendor.calls.push({ params, options })
                vendor.clock += vendor.msPerCall
                const q = String(params['q'])
                const match = /createdTime > '([^']+)'/.exec(q)
                const after = match ? Date.parse(match[1]) : -Infinity
                const visible = vendor.files
                    .filter((file) => Date.parse(file.createdTime) > after)
                    .sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime))
                const token = params['pageToken'] ? Number(params['pageToken']) : 0
                if (token < vendor.emptyLeadingPages) {
                    return { data: { files: [], nextPageToken: String(token + 1) } }
                }
                const offset = (token - vendor.emptyLeadingPages) * vendor.pageSize
                const page = visible.slice(offset, offset + vendor.pageSize)
                const hasMore = offset + vendor.pageSize < visible.length
                return { data: { files: page, nextPageToken: hasMore ? String(token + 1) : undefined } }
            },
        },
    }),
}))

import { newDocumentTrigger } from '../src/lib/triggers/new-document'
import { googleDocsAuth } from '../src/lib/auth'

function pollingTrigger() {
    if (newDocumentTrigger.type !== TriggerStrategy.POLLING) {
        throw new Error('New Document is expected to be a polling trigger')
    }
    return newDocumentTrigger
}

const trigger = pollingTrigger()

type TriggerContext = Parameters<typeof trigger.test>[0]

const tick = ({ minutes }: { minutes: number }) => {
    vendor.clock += minutes * 60_000
    return new Date(vendor.clock).toISOString()
}

function addDoc({ id }: { id: string }) {
    vendor.files.push({ kind: 'drive#file', id, name: id, mimeType: 'application/vnd.google-apps.document', createdTime: tick({ minutes: 1 }) })
}

const hasId = (value: unknown): value is { id: string } =>
    typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string'

const ids = ({ events }: { events: unknown[] }): string[] =>
    events.map((event) => {
        if (!hasId(event)) {
            throw new Error(`event without a string id: ${JSON.stringify(event)}`)
        }
        return event.id
    })

function memoryStore() {
    const data = new Map<string, string>()
    const store: Store = {
        put: async <T>(key: string, value: T) => {
            data.set(key, JSON.stringify(value))
            return value
        },
        get: async <T>(key: string): Promise<T | null> => {
            const raw = data.get(key)
            if (raw === undefined) {
                return null
            }
            return JSON.parse(raw)
        },
        delete: async (key: string) => {
            data.delete(key)
        },
    }
    const read = ({ key }: { key: string }): unknown => {
        const raw = data.get(key)
        return raw === undefined ? undefined : JSON.parse(raw)
    }
    return { store, read }
}

const auth: AppConnectionValueForAuthProperty<typeof googleDocsAuth> = {
    type: AppConnectionType.OAUTH2,
    access_token: 'ya29.test',
    refresh_token: 'refresh-test',
    client_id: 'client-test',
    client_secret: 'secret-test',
    redirect_url: 'http://localhost/redirect',
    token_type: 'Bearer',
    claimed_at: 0,
    scope: '',
    token_url: 'https://oauth2.googleapis.com/token',
    data: {},
}

const hookContext = ({ store, isRepublish }: { store: Store, isRepublish?: boolean }): TriggerContext => ({
    ...createMockPollingTriggerContext({ propsValue: { folderId: undefined } }),
    auth,
    propsValue: { folderId: undefined },
    store,
    isRepublish,
    files: {
        write: async () => 'file-url',
        upload: async () => ({ id: 'file-id', url: 'file-url' }),
    },
})

beforeEach(() => {
    vendor.files = []
    vendor.emptyLeadingPages = 0
    vendor.pageSize = 2
    vendor.calls = []
    vendor.msPerCall = 0
    vendor.clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => vendor.clock)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Google Docs New Document behaviour', () => {
    it('test() pages past an empty first page to find a document', async () => {
        addDoc({ id: 'doc-1' })
        vendor.emptyLeadingPages = 1
        const { store } = memoryStore()
        expect(ids({ events: await trigger.test(hookContext({ store })) })).toEqual(['doc-1'])
        expect(vendor.calls).toHaveLength(2)
    })

    it('test() stops after 10 list calls when every page is empty', async () => {
        vendor.emptyLeadingPages = 12
        const { store } = memoryStore()
        expect(await trigger.test(hookContext({ store }))).toEqual([])
        expect(vendor.calls).toHaveLength(10)
    })

    it('test() makes one call when page 1 has a document and returns newest first', async () => {
        addDoc({ id: 'older' })
        addDoc({ id: 'newest' })
        const { store } = memoryStore()
        expect(ids({ events: await trigger.test(hookContext({ store })) })).toEqual(['newest', 'older'])
        expect(vendor.calls).toHaveLength(1)
    })

    it('every list call passes a timeout', async () => {
        addDoc({ id: 'a' })
        addDoc({ id: 'b' })
        addDoc({ id: 'c' })
        const { store } = memoryStore()
        await trigger.onEnable(hookContext({ store }))
        addDoc({ id: 'd' })
        addDoc({ id: 'e' })
        addDoc({ id: 'f' })
        await trigger.run(hookContext({ store }))
        expect(vendor.calls.length).toBeGreaterThan(1)
        for (const call of vendor.calls) {
            expect(call.options?.['timeout']).toBeGreaterThan(0)
            expect(call.options?.['timeout']).toBeLessThanOrEqual(10_000)
        }
    })

    it('fires once per new document across polls and a republish', async () => {
        addDoc({ id: 'old-1' })
        const { store } = memoryStore()
        await trigger.onEnable(hookContext({ store }))
        tick({ minutes: 5 })
        expect(await trigger.run(hookContext({ store }))).toEqual([])
        addDoc({ id: 'new-1' })
        expect(ids({ events: await trigger.run(hookContext({ store })) })).toEqual(['new-1'])
        expect(await trigger.run(hookContext({ store }))).toEqual([])
        await trigger.onDisable(hookContext({ store, isRepublish: true }))
        await trigger.onEnable(hookContext({ store, isRepublish: true }))
        expect(await trigger.run(hookContext({ store }))).toEqual([])
        addDoc({ id: 'new-2' })
        expect(ids({ events: await trigger.run(hookContext({ store })) })).toEqual(['new-2'])
    })

    it('run() pages back to the checkpoint and emits every new document once', async () => {
        addDoc({ id: 'seed' })
        const { store } = memoryStore()
        await trigger.onEnable(hookContext({ store }))
        const burst = ['b-0', 'b-1', 'b-2', 'b-3', 'b-4', 'b-5']
        burst.forEach((id) => addDoc({ id }))
        const fired = ids({ events: await trigger.run(hookContext({ store })) })
        expect(vendor.calls).toHaveLength(3)
        expect(new Set(fired)).toEqual(new Set(burst))
        expect(fired).toHaveLength(burst.length)
        expect(await trigger.run(hookContext({ store }))).toEqual([])
    })

    it('run() throws on the deadline and leaves the cursor where it was', async () => {
        addDoc({ id: 'seed' })
        const { store, read } = memoryStore()
        await trigger.onEnable(hookContext({ store }))
        const before = read({ key: 'lastPoll' })
        for (let index = 0; index < 20; index++) addDoc({ id: `n-${index}` })
        vendor.msPerCall = 9_000
        await expect(trigger.run(hookContext({ store }))).rejects.toThrow(/ran out of time/)
        expect(read({ key: 'lastPoll' })).toBe(before)
        vendor.msPerCall = 0
        expect(ids({ events: await trigger.run(hookContext({ store })) })).toHaveLength(20)
    })
})
