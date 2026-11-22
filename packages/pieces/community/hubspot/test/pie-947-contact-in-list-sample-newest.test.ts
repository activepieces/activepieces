import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type Member = { recordId: string, membershipTimestamp: Date }

const portal = vi.hoisted(() => {
    const state: { members: Member[], newestFirst: boolean, calls: string[] } = { members: [], newestFirst: false, calls: [] }
    return state
})

vi.mock('@hubspot/api-client', () => {
    class Client {
        crm = {
            lists: {
                membershipsApi: {
                    getPageOrderedByAddedToListDate: async (listId: string, after?: string, _before?: string, limit = 100) => {
                        portal.calls.push(`join-order ${listId}`)
                        const ordered = portal.newestFirst ? [...portal.members].reverse() : portal.members
                        const start = Number(after ?? '0')
                        const page = ordered.slice(start, start + limit)
                        const more = start + limit < ordered.length
                        return { results: page, ...(more ? { paging: { next: { after: String(start + limit) } } } : {}) }
                    },
                },
            },
            contacts: {
                batchApi: {
                    read: async (req: { inputs: { id: string }[] }) => {
                        portal.calls.push('batch-read')
                        const ids = req.inputs.map((input) => input.id).reverse()
                        return { status: 'COMPLETE', results: ids.map((id) => ({ id, properties: { email: `c${id}@example.com`, hs_object_id: id }, createdAt: new Date('2026-09-01T00:00:00.000Z'), updatedAt: new Date('2026-10-01T00:00:00.000Z'), archived: false })) }
                    },
                },
            },
        }
    }
    return { Client }
})

import { newContactInListTrigger } from '../src/lib/triggers/new-contact-in-list'

const T0 = Date.parse('2026-10-01T00:00:00.000Z')
const members: Member[] = Array.from({ length: 15 }, (_, k) => ({ recordId: String(101 + k), membershipTimestamp: new Date(T0 + (k + 1) * 60_000) }))

const sampleIds = async () => hubspotTestKit.ids({
    events: await newContactInListTrigger.test(hubspotTestKit.pollingContext({ store: hubspotTestKit.memoryStore(), propsValue: { listId: 'L1' } })),
})

beforeEach(() => {
    portal.members = members
    portal.calls = []
})

describe('PIE-947 HubSpot New Contact in List - test (sample data)', () => {
    it('returns the most recently added list members as sample events, oldest to newest so the builder shows the newest', async () => {
        portal.newestFirst = false
        expect(await sampleIds()).toEqual(['111', '112', '113', '114', '115'])
    })

    it('returns the newest members when HubSpot answers newest first (live behaviour without a cursor)', async () => {
        portal.newestFirst = true
        expect(await sampleIds()).toEqual(['111', '112', '113', '114', '115'])
    })
})
