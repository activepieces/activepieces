import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit, MemoryStore } from './support/hubspot-test-kit'

type Rec = { id: string, properties: Record<string, string>, history: Record<string, { value: string, timestamp: string }[]> }
type Filter = { propertyName: string, operator: string, value?: string }
type SearchRequest = { limit?: number, after?: string, sorts?: string[], filterGroups?: { filters: Filter[] }[], properties?: string[] }

const crm = vi.hoisted(() => {
    const db: { companies: Rec[], deals: Rec[], searchCalls: number } = { companies: [], deals: [], searchCalls: 0 }
    function asMs(v: string): number {
        return /^\d+$/.test(v) ? Number(v) : Date.parse(v)
    }
    function matches({ rec, filter: f }: { rec: Rec, filter: Filter }): boolean {
        const v = rec.properties[f.propertyName]
        switch (f.operator) {
            case 'HAS_PROPERTY': return v !== undefined && v !== null && v !== ''
            case 'EQ': return v === f.value
            case 'GT': return v !== undefined && asMs(v) > asMs(f.value!)
            case 'LT': return v !== undefined && asMs(v) < asMs(f.value!)
            case 'GTE': return v !== undefined && asMs(v) >= asMs(f.value!)
            case 'LTE': return v !== undefined && asMs(v) <= asMs(f.value!)
            default: throw new Error('unsupported operator ' + f.operator)
        }
    }
    function search({ table, req }: { table: Rec[], req: SearchRequest }) {
        db.searchCalls++
        const offset = req.after ? Number(req.after) : 0
        const limit = req.limit ?? 10
        if (offset + limit > 10000) {
            const err = new Error('HTTP-Code: 400 Message: An error occurred. Body: {"status":"error","message":"Search results are limited to 10,000"}')
            throw err
        }
        let rows = table.filter((r) => (req.filterGroups ?? []).length === 0 || (req.filterGroups ?? []).some((g) => g.filters.every((f) => matches({ rec: r, filter: f }))))
        const sort = (req.sorts ?? [])[0]
        if (sort) {
            const desc = sort.startsWith('-')
            const prop = desc ? sort.slice(1) : sort
            rows = [...rows].sort((a, b) => (asMs(a.properties[prop]) - asMs(b.properties[prop])) * (desc ? -1 : 1))
        }
        const total = rows.length
        const page = rows.slice(offset, offset + limit)
        const nextOffset = offset + limit
        return {
            total,
            results: page.map((r) => ({ id: r.id, properties: { ...r.properties }, createdAt: r.properties.createdate, updatedAt: r.properties.hs_lastmodifieddate, archived: false })),
            paging: nextOffset < total ? { next: { after: String(nextOffset) } } : undefined,
        }
    }
    return { db, search }
})

vi.mock('@hubspot/api-client', () => {
    class Client {
        crm = {
            properties: { coreApi: { getByName: async (objectType: string, propertyName: string) => ({ name: propertyName, objectType }) } },
            companies: {
                searchApi: { doSearch: async (req: SearchRequest) => crm.search({ table: crm.db.companies, req }) },
                batchApi: {
                    read: async (req: { inputs: { id: string }[], propertiesWithHistory: string[] }) => ({
                        results: req.inputs.map(({ id }) => {
                            const rec = crm.db.companies.find((c) => c.id === id)!
                            const prop = req.propertiesWithHistory[0]
                            return {
                                id,
                                properties: { ...rec.properties },
                                propertiesWithHistory: { [prop]: rec.history[prop] ?? [] },
                                createdAt: rec.properties.createdate,
                                updatedAt: rec.properties.hs_lastmodifieddate,
                                archived: false,
                            }
                        }),
                    }),
                },
            },
            deals: {
                searchApi: { doSearch: async (req: SearchRequest) => crm.search({ table: crm.db.deals, req }) },
            },
        }
    }
    return { Client }
})

import { newCompanyPropertyChangeTrigger } from '../src/lib/triggers/new-company-property-change'
import { dealStageUpdatedTrigger } from '../src/lib/triggers/deal-stage-updated'

const T0 = Date.parse('2026-09-01T10:00:00.000Z')
const CHANGED = 10_050

const ctx = ({ store, propsValue }: { store: MemoryStore, propsValue: Record<string, unknown> }) => hubspotTestKit.pollingContext({ store, propsValue })

describe('C0084-n1 HubSpot polling stops at 10,000 newest results and skips older changes for good', () => {
    beforeEach(() => {
        crm.db.companies = []
        crm.db.deals = []
        crm.db.searchCalls = 0
    })

    it('New Company Property Change: every company whose watched property changed after enable is delivered across polls', async () => {
        const store = hubspotTestKit.memoryStore()
        await store.put('lastPoll', T0)
        for (let i = 1; i <= CHANGED; i++) {
            const ts = new Date(T0 + i * 10).toISOString()
            crm.db.companies.push({
                id: `c${i}`,
                properties: { lifecyclestage: 'customer', hs_lastmodifieddate: ts, createdate: new Date(T0 - 86_400_000).toISOString(), hs_object_id: `c${i}` },
                history: { lifecyclestage: [{ value: 'customer', timestamp: ts }, { value: 'lead', timestamp: new Date(T0 - 86_400_000).toISOString() }] },
            })
        }
        const delivered = new Set<string>()
        for (let poll = 0; poll < 3; poll++) {
            const out = hubspotTestKit.ids({ events: await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: { propertyName: 'lifecyclestage' } })) })
            out.forEach((id) => delivered.add(id))
        }
        expect(delivered.size).toBe(CHANGED)
    }, 120_000)

    it('Updated Deal Stage: every deal that entered the stage after enable is delivered across polls', async () => {
        const store = hubspotTestKit.memoryStore()
        await store.put('lastPoll', T0)
        for (let i = 1; i <= CHANGED; i++) {
            const ts = new Date(T0 + i * 10).toISOString()
            crm.db.deals.push({
                id: `d${i}`,
                properties: { pipeline: 'default', dealstage: 'closedwon', hs_v2_date_entered_current_stage: ts, hs_v2_date_entered_closedwon: ts, hs_lastmodifieddate: ts, createdate: new Date(T0 - 86_400_000).toISOString(), hs_object_id: `d${i}` },
                history: {},
            })
        }
        const delivered = new Set<string>()
        for (let poll = 0; poll < 3; poll++) {
            const out = hubspotTestKit.ids({ events: await dealStageUpdatedTrigger.run(ctx({ store, propsValue: { pipelineId: 'default', stageId: 'closedwon' } })) })
            out.forEach((id) => delivered.add(id))
        }
        expect(delivered.size).toBe(CHANGED)
    }, 120_000)

    it('control: below the 10,000 limit every change is delivered in one poll', async () => {
        const store = hubspotTestKit.memoryStore()
        await store.put('lastPoll', T0)
        for (let i = 1; i <= 300; i++) {
            const ts = new Date(T0 + i * 10).toISOString()
            crm.db.deals.push({
                id: `d${i}`,
                properties: { pipeline: 'default', dealstage: 'closedwon', hs_v2_date_entered_current_stage: ts, hs_v2_date_entered_closedwon: ts, hs_lastmodifieddate: ts, createdate: ts, hs_object_id: `d${i}` },
                history: {},
            })
        }
        const out = hubspotTestKit.ids({ events: await dealStageUpdatedTrigger.run(ctx({ store, propsValue: { pipelineId: 'default', stageId: 'closedwon' } })) })
        expect(new Set(out).size).toBe(300)
    })
})
