import { describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type Member = { recordId: string, membershipTimestamp: number }

const fake = vi.hoisted(() => {
    const state: { members: Member[], pollElapsedMs: number, newestFirst: boolean } = { members: [], pollElapsedMs: 0, newestFirst: false }
    return state
})

vi.mock('@hubspot/api-client', () => {
    const LATENCY_MS = 150
    const TRIGGER_TIMEOUT_MS = 60_000
    const encode = ({ member }: { member: Member }) => Buffer.from(`${member.membershipTimestamp}:${member.recordId}`).toString('base64url')
    function spendCall() {
        fake.pollElapsedMs += LATENCY_MS
        if (fake.pollElapsedMs > TRIGGER_TIMEOUT_MS) {
            throw new Error('HTTP-Code: 500 sandbox killed by timeout')
        }
    }
    class Client {
        crm = {
            lists: {
                membershipsApi: {
                    getPageOrderedByAddedToListDate: async (_listId: string, after?: string, _before?: string, limit = 100) => {
                        spendCall()
                        const ascending = [...fake.members].sort((a, b) => a.membershipTimestamp - b.membershipTimestamp || a.recordId.localeCompare(b.recordId))
                        const sorted = fake.newestFirst ? ascending.reverse() : ascending
                        const start = after ? sorted.findIndex((member) => encode({ member }) === after) + 1 : 0
                        const page = sorted.slice(start, start + limit)
                        const more = start + limit < sorted.length
                        return {
                            results: page.map((member) => ({ recordId: member.recordId, membershipTimestamp: new Date(member.membershipTimestamp) })),
                            ...(more ? { paging: { next: { after: encode({ member: page[page.length - 1] }) } } } : {}),
                        }
                    },
                },
            },
            contacts: {
                batchApi: {
                    read: async (req: { inputs: { id: string }[] }) => {
                        spendCall()
                        return {
                            status: 'COMPLETE',
                            results: req.inputs.map((input) => ({ id: input.id, properties: { email: `${input.id}@example.com` }, createdAt: new Date(0), updatedAt: new Date(0), archived: false })),
                        }
                    },
                },
            },
        }
    }
    return { Client }
})

import { newContactInListTrigger } from '../src/lib/triggers/new-contact-in-list'

async function scenario({ existingMembers, newestFirst = false }: { existingMembers: number, newestFirst?: boolean }) {
    fake.newestFirst = newestFirst
    const store = hubspotTestKit.memoryStore()
    const ctx = hubspotTestKit.pollingContext({ store, propsValue: { listId: '42' } })
    const enabledAt = Date.now()
    fake.members = []
    for (let i = 0; i < existingMembers; i++) {
        fake.members.push({ recordId: String(100000 + i), membershipTimestamp: enabledAt - 10_000_000 + i })
    }
    fake.pollElapsedMs = 0
    await newContactInListTrigger.onEnable(ctx)
    fake.members.push({ recordId: 'new-member', membershipTimestamp: hubspotTestKit.storedNumber({ store, key: 'lastPoll' }) + 30_000 })

    const delivered: string[] = []
    for (let poll = 0; poll < 3; poll++) {
        fake.pollElapsedMs = 0
        const out = await newContactInListTrigger.run(ctx).catch(() => [])
        delivered.push(...hubspotTestKit.ids({ events: out }))
    }
    return delivered
}

describe('PIE-952 HubSpot New Contact in List trigger', () => {
    it('control: a list with 5,000 members delivers a newly added contact once within 3 polls', async () => {
        expect(await scenario({ existingMembers: 5_000 })).toEqual(['new-member'])
    }, 120_000)

    it('a list with 45,000 members delivers a newly added contact once within 3 polls', async () => {
        expect(await scenario({ existingMembers: 45_000 })).toEqual(['new-member'])
    }, 300_000)

    it('a 45,000-member list answered newest first (live order) delivers a newly added contact once', async () => {
        expect(await scenario({ existingMembers: 45_000, newestFirst: true })).toEqual(['new-member'])
    }, 300_000)

    it('later polls resume after the pages already known to be old', async () => {
        await scenario({ existingMembers: 45_000 })
        expect(fake.pollElapsedMs).toBeLessThan(5_000)
    }, 300_000)
})
