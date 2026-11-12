import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type FakeMember = { recordId: string, joinedAt: number }

const portal = vi.hoisted(() => ({
    members: new Array<FakeMember>(),
    newestFirst: false,
    offsetPaging: false,
    pageCalls: 0,
}))

vi.mock('@hubspot/api-client', () => {
    const key = (member: { recordId: string, joinedAt: number }) => `${member.joinedAt}:${member.recordId}`
    class Client {
        crm = {
            lists: {
                membershipsApi: {
                    getPageOrderedByAddedToListDate: async (_listId: string, after?: string, _before?: string, limit = 100) => {
                        portal.pageCalls += 1
                        const ascending = [...portal.members].sort((a, b) => a.joinedAt - b.joinedAt || a.recordId.localeCompare(b.recordId))
                        const ordered = portal.newestFirst ? ascending.reverse() : ascending
                        const start = !after ? 0 : portal.offsetPaging ? Number(after) : ordered.findIndex((member) => key(member) === after) + 1
                        const page = ordered.slice(start, start + Math.min(limit, 250))
                        const more = start + page.length < ordered.length
                        const nextAfter = portal.offsetPaging ? String(start + page.length) : key(page[page.length - 1] ?? { recordId: '', joinedAt: 0 })
                        return {
                            results: page.map((member) => ({ recordId: member.recordId, membershipTimestamp: new Date(member.joinedAt) })),
                            paging: more ? { next: { after: nextAfter } } : undefined,
                        }
                    },
                },
            },
            contacts: {
                batchApi: {
                    read: async (req: { inputs: { id: string }[] }) => ({
                        results: [...req.inputs].reverse().map(({ id }) => ({ id, properties: { email: `${id}@example.com`, firstname: id, hs_object_id: id }, createdAt: new Date(0), updatedAt: new Date(0), archived: false })),
                    }),
                },
            },
        }
    }
    return { Client }
})

import { newContactInListTrigger as trigger } from '../src/lib/triggers/new-contact-in-list'

let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return clock
}

function join({ id, at }: { id: string, at?: number }) {
    portal.members.push({ recordId: id, joinedAt: at ?? tick() })
}

function memoryStore() {
    const data = new Map<string, string>()
    return {
        put: async <T>(k: string, v: T) => {
            data.set(k, JSON.stringify(v))
            return v
        },
        get: async <T>(k: string): Promise<T | null> => {
            const raw = data.get(k)
            return raw === undefined ? null : JSON.parse(raw)
        },
        delete: async (k: string) => {
            data.delete(k)
        },
    }
}

type Store = ReturnType<typeof memoryStore>
const ctx = ({ store, isRepublish }: { store: Store, isRepublish?: boolean }) =>
    hubspotTestKit.pollingContext({ store, propsValue: { listId: 'L1' }, isRepublish })
const ids = (events: unknown[]) => hubspotTestKit.ids({ events })

beforeEach(() => {
    portal.members = []
    portal.offsetPaging = false
    portal.pageCalls = 0
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe.each([
    { order: 'oldest first (documented)', newestFirst: false },
    { order: 'newest first (live)', newestFirst: true },
])('New Contact in List behaviour, join-order $order', ({ newestFirst }) => {
    beforeEach(() => {
        portal.newestFirst = newestFirst
    })

    it('fires once per join across polls and republish, never for existing members', async () => {
        join({ id: 'old-1' })
        join({ id: 'old-2' })
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        join({ id: 'new-1' })
        const [event] = await trigger.run(ctx({ store }))
        expect(hubspotTestKit.textField({ value: event, key: 'id' })).toBe('new-1')
        expect(hubspotTestKit.propertiesOf({ value: event }).email).toBe('new-1@example.com')
        expect(event).toHaveProperty('membershipTimestamp')
        expect(await trigger.run(ctx({ store }))).toEqual([])
        join({ id: 'between' })
        await trigger.onDisable(ctx({ store, isRepublish: true }))
        await trigger.onEnable(ctx({ store, isRepublish: true }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['between'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('emits a burst of more than one page oldest first', async () => {
        Array.from({ length: 600 }, (_, index) => join({ id: `existing-${index}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        const burst = Array.from({ length: 260 }, (_, index) => `burst-${String(index).padStart(3, '0')}`)
        burst.forEach((id) => join({ id, at: tick(1000) }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual(burst)
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('does not re-read the whole list on every poll', async () => {
        Array.from({ length: 5_000 }, (_, index) => join({ id: `existing-${index}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        await trigger.run(ctx({ store }))
        join({ id: 'fresh' })
        portal.pageCalls = 0
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['fresh'])
        expect(portal.pageCalls).toBeLessThanOrEqual(3)
    })

    it('test() returns the most recently added members, oldest to newest', async () => {
        Array.from({ length: 700 }, (_, index) => join({ id: `m-${index}`, at: tick(1000) }))
        const sample = ids(await trigger.test(ctx({ store: memoryStore() })))
        expect(sample).toEqual(['m-695', 'm-696', 'm-697', 'm-698', 'm-699'])
    })
})

describe('New Contact in List resume with offset paging', () => {
    it('reads from the head when old members left and the saved offset skips the new join', async () => {
        portal.newestFirst = false
        portal.offsetPaging = true
        Array.from({ length: 600 }, (_, index) => join({ id: `old-${index}`, at: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        join({ id: 'seed' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['seed'])
        portal.members = portal.members.filter((member) => !member.recordId.startsWith('old-') || Number(member.recordId.slice(4)) >= 300)
        join({ id: 'after-removal' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['after-removal'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })
})
