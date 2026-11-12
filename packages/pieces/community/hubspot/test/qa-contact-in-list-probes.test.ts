import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type FakeMember = { recordId: string, joinedAt: number }

const portal = vi.hoisted(() => ({
    members: new Array<FakeMember>(),
    newestFirst: true,
    inFlightReads: 0,
    peakReads: 0,
    failReads: false,
    msPerRead: 0,
}))

vi.mock('@hubspot/api-client', () => {
    const key = (member: { recordId: string, joinedAt: number }) => `${member.joinedAt}:${member.recordId}`
    class Client {
        crm = {
            lists: {
                membershipsApi: {
                    getPageOrderedByAddedToListDate: async (_listId: string, after?: string, _before?: string, limit = 100) => {
                        const ascending = [...portal.members].sort((a, b) => a.joinedAt - b.joinedAt || a.recordId.localeCompare(b.recordId))
                        const ordered = portal.newestFirst ? ascending.reverse() : ascending
                        const start = after ? ordered.findIndex((member) => key(member) === after) + 1 : 0
                        const page = ordered.slice(start, start + Math.min(limit, 250))
                        const more = start + page.length < ordered.length
                        return {
                            results: page.map((member) => ({ recordId: member.recordId, membershipTimestamp: new Date(member.joinedAt) })),
                            paging: more ? { next: { after: key(page[page.length - 1]) } } : undefined,
                        }
                    },
                },
            },
            contacts: {
                batchApi: {
                    read: async (req: { inputs: { id: string }[] }) => {
                        portal.inFlightReads += 1
                        portal.peakReads = Math.max(portal.peakReads, portal.inFlightReads)
                        await new Promise((resolve) => setTimeout(resolve, 1))
                        portal.inFlightReads -= 1
                        clock += portal.msPerRead
                        if (portal.failReads) throw new Error('HTTP-Code: 429 Too Many Requests')
                        return { results: req.inputs.map(({ id }) => ({ id, properties: { email: `${id}@example.com`, hs_object_id: id }, createdAt: new Date(0), updatedAt: new Date(0), archived: false })) }
                    },
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

function memoryStore() {
    const data = new Map<string, string>()
    return {
        data,
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
const ctx = ({ store, listId = 'L1' }: { store: Store, listId?: string }) =>
    hubspotTestKit.pollingContext({ store, propsValue: { listId } })
const ids = (events: unknown[]) => hubspotTestKit.ids({ events })

beforeEach(() => {
    portal.members = []
    portal.newestFirst = true
    portal.inFlightReads = 0
    portal.peakReads = 0
    portal.failReads = false
    portal.msPerRead = 0
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('QA probe: New Contact in List (live newest-first order)', () => {
    it('a bulk add of more than one page sharing one membershipTimestamp does not make later joins invisible', async () => {
        Array.from({ length: 600 }, (_, i) => portal.members.push({ recordId: `old-${i}`, joinedAt: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        const bulkAt = tick()
        Array.from({ length: 300 }, (_, i) => portal.members.push({ recordId: `bulk-${String(i).padStart(3, '0')}`, joinedAt: bulkAt }))
        expect(ids(await trigger.run(ctx({ store })))).toHaveLength(300)
        portal.members.push({ recordId: 'later', joinedAt: tick() })
        const fired = [...ids(await trigger.run(ctx({ store }))), ...ids(await trigger.run(ctx({ store })))]
        expect(fired).toEqual(['later'])
    })

    it('a list built by one bulk import (all members share one membershipTimestamp) still fires for later joins', async () => {
        const importedAt = tick()
        Array.from({ length: 600 }, (_, i) => portal.members.push({ recordId: `imported-${String(i).padStart(3, '0')}`, joinedAt: importedAt }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        portal.members.push({ recordId: 'later', joinedAt: tick() })
        const fired = [
            ...ids(await trigger.run(ctx({ store }))),
            ...ids(await trigger.run(ctx({ store }))),
            ...ids(await trigger.run(ctx({ store }))),
        ]
        expect(fired).toEqual(['later'])
    })

    it('contact batch reads stay within a small concurrency when many members join between polls', async () => {
        Array.from({ length: 10 }, (_, i) => portal.members.push({ recordId: `old-${i}`, joinedAt: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        Array.from({ length: 3_000 }, (_, i) => portal.members.push({ recordId: `n-${i}`, joinedAt: tick(10) }))
        expect(ids(await trigger.run(ctx({ store })))).toHaveLength(3_000)
        expect(portal.peakReads).toBeLessThanOrEqual(5)
    })

    it('a failing contact read throws and leaves lastPoll where it was', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store }))
        const before = store.data.get('lastPoll')
        portal.members.push({ recordId: 'x', joinedAt: tick() })
        portal.failReads = true
        await expect(trigger.run(ctx({ store }))).rejects.toThrow(/429/)
        expect(store.data.get('lastPoll')).toBe(before)
        portal.failReads = false
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['x'])
    })

    it('switching to another list does not flood that list\'s existing members', async () => {
        Array.from({ length: 5 }, (_, i) => portal.members.push({ recordId: `m-${i}`, joinedAt: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store, listId: 'L2' }))).toEqual([])
    })
})

describe.each([
    { order: 'newest first (live)', newestFirst: true },
    { order: 'oldest first (documented)', newestFirst: false },
])('QA round 2: Contact in List order detection, $order', ({ newestFirst }) => {
    beforeEach(() => {
        portal.newestFirst = newestFirst
    })

    it('a tied head page (bulk add of 300 in one ms) then a later join: everything fires exactly once', async () => {
        Array.from({ length: 600 }, (_, i) => portal.members.push({ recordId: `old-${i}`, joinedAt: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        const bulkAt = tick()
        const bulk = Array.from({ length: 300 }, (_, i) => `bulk-${String(i).padStart(3, '0')}`)
        bulk.forEach((id) => portal.members.push({ recordId: id, joinedAt: bulkAt }))
        let fired = ids(await trigger.run(ctx({ store })))
        portal.members.push({ recordId: 'later', joinedAt: tick() })
        for (let i = 0; i < 3; i++) fired = [...fired, ...ids(await trigger.run(ctx({ store })))]
        expect(fired.sort()).toEqual([...bulk, 'later'].sort())
    })

    it('a list that is entirely one bulk import: no cursor is saved while order is unknown, and a later join fires once', async () => {
        const importedAt = tick()
        Array.from({ length: 600 }, (_, i) => portal.members.push({ recordId: `imp-${String(i).padStart(3, '0')}`, joinedAt: importedAt }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        expect(store.data.has('listMembershipCursor')).toBe(false)
        portal.members.push({ recordId: 'later', joinedAt: tick() })
        let fired: string[] = []
        for (let i = 0; i < 3; i++) fired = [...fired, ...ids(await trigger.run(ctx({ store })))]
        expect(fired).toEqual(['later'])
    })

    it('saves a resume cursor only once oldest-first order is proven', async () => {
        Array.from({ length: 600 }, (_, i) => portal.members.push({ recordId: `m-${i}`, joinedAt: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        await trigger.run(ctx({ store }))
        const saved = store.data.get('listMembershipCursor')
        if (newestFirst) {
            expect(saved).toBeUndefined()
        } else {
            expect(JSON.parse(saved!)).toMatchObject({ listId: 'L1', oldestFirst: true })
        }
    })

    it('a tied bulk add split by the contact-read deadline fires every member exactly once across polls', async () => {
        Array.from({ length: 300 }, (_, i) => portal.members.push({ recordId: `old-${i}`, joinedAt: tick(1000) }))
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        const bulkAt = tick()
        const bulk = Array.from({ length: 1_000 }, (_, i) => `bulk-${String(i).padStart(4, '0')}`)
        bulk.forEach((id) => portal.members.push({ recordId: id, joinedAt: bulkAt }))
        portal.msPerRead = 30_000
        const first = ids(await trigger.run(ctx({ store })))
        expect(first.length).toBeGreaterThan(0)
        expect(first.length).toBeLessThan(bulk.length)
        portal.msPerRead = 0
        let fired = [...first]
        for (let i = 0; i < 3; i++) fired = [...fired, ...ids(await trigger.run(ctx({ store })))]
        portal.members.push({ recordId: 'later', joinedAt: tick() })
        for (let i = 0; i < 2; i++) fired = [...fired, ...ids(await trigger.run(ctx({ store })))]
        expect(fired).toHaveLength(bulk.length + 1)
        expect([...fired].sort()).toEqual([...bulk, 'later'].sort())
    })

    it('a tied bulk add larger than the seen-id limit keeps a constant-size cursor and fires every member once', async () => {
        const store = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store }))
        const bulkAt = tick()
        const bulk = Array.from({ length: 12_000 }, (_, i) => `bulk-${String(i).padStart(5, '0')}`)
        bulk.forEach((id) => portal.members.push({ recordId: id, joinedAt: bulkAt }))
        portal.msPerRead = 10_000
        let fired: string[] = []
        let largestCursor = 0
        for (let i = 0; i < 40 && fired.length < bulk.length; i++) {
            fired = [...fired, ...ids(await trigger.run(ctx({ store })))]
            largestCursor = Math.max(largestCursor, (store.data.get('listMembershipTie') ?? '').length)
        }
        expect(fired).toHaveLength(bulk.length)
        expect(new Set(fired).size).toBe(bulk.length)
        expect(largestCursor).toBeLessThan(1_000)
    }, 60_000)
})

