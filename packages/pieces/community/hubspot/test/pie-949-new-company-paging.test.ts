import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type FakeCompany = { id: string, properties: Record<string, string> }
type SearchCall = { after?: string, limit?: number }

const hubspot = vi.hoisted(() => {
    const state: { companies: FakeCompany[], searchRequests: SearchCall[] } = { companies: [], searchRequests: [] }
    return state
})

const TRIGGER_FILE = path.resolve(__dirname, '../src/lib/triggers/new-company.ts')
const HUBSPOT_SDK = createRequire(TRIGGER_FILE).resolve('@hubspot/api-client')
vi.doMock(HUBSPOT_SDK, () => {
    class Client {
        crm = {
            companies: {
                searchApi: {
                    doSearch: async (req: { after?: string, limit?: number, sorts?: string[], filterGroups?: { filters: { propertyName: string, operator: string, value: string }[] }[] }) => {
                        hubspot.searchRequests.push({ after: req.after, limit: req.limit })
                        if (hubspot.searchRequests.length > 50) {
                            throw new Error(`stand-in HubSpot: ${hubspot.searchRequests.length} search calls in one poll, offsets requested: ${JSON.stringify([...new Set(hubspot.searchRequests.map((r) => r.after ?? 'none'))])}`)
                        }
                        const gt = req.filterGroups?.[0]?.filters?.find((f) => f.propertyName === 'createdate')?.value
                        const matching = hubspot.companies
                            .filter((c) => gt === undefined || new Date(c.properties.createdate).getTime() > Number(gt))
                            .sort((a, b) => (new Date(a.properties.createdate).getTime() - new Date(b.properties.createdate).getTime()) * (req.sorts?.[0]?.startsWith('-') ? -1 : 1))
                        const offset = Number(req.after ?? 0)
                        const limit = req.limit ?? 10
                        const results = matching.slice(offset, offset + limit)
                        const next = offset + limit < matching.length ? { next: { after: String(offset + limit) } } : undefined
                        return { total: matching.length, results, paging: next }
                    },
                },
            },
        }
        constructor(_opts: unknown) { return }
    }
    return { Client }
})


describe('HubSpot New Company polling', () => {
    it('emits every company created since the last poll when there are more than 200', async () => {
        const { newCompanyTrigger } = await import('../src/lib/triggers/new-company')
        const store = hubspotTestKit.memoryStore()
        const context = hubspotTestKit.pollingContext({ store, propsValue: {} })

        await newCompanyTrigger.onEnable(context)
        const lastPoll = hubspotTestKit.storedNumber({ store, key: 'lastPoll' })

        for (let i = 1; i <= 250; i++) {
            hubspot.companies.push({ id: `c${i}`, properties: { name: `Company ${i}`, createdate: new Date(lastPoll + i * 1000).toISOString() } })
        }

        const emitted = hubspotTestKit.ids({ events: await newCompanyTrigger.run(context) })

        expect(new Set(emitted).size).toBe(250)
        expect(hubspot.searchRequests.map((r) => r.after ?? null)).toEqual([null, '200'])
    })
})
