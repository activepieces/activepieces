import { describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type StageVisit = { stage: string, at: number }
type FakeDeal = { id: string, name: string, pipeline: string, visits: StageVisit[] }
type Filter = { propertyName: string, operator: string, value?: string }
type SearchBody = { filterGroups?: { filters: Filter[] }[], sorts?: string[], properties?: string[], limit?: number, after?: string }

const portal = vi.hoisted(() => ({ deals: new Array<FakeDeal>() }))

vi.mock('@hubspot/api-client', () => {
    function dealProperties(deal: FakeDeal): Record<string, string | null> {
        const iso = (ms: number) => new Date(ms).toISOString()
        const current = deal.visits[deal.visits.length - 1]
        const props: Record<string, string | null> = {
            hs_object_id: deal.id,
            dealname: deal.name,
            pipeline: deal.pipeline,
            dealstage: current.stage,
            createdate: iso(deal.visits[0].at),
            hs_lastmodifieddate: iso(current.at),
            hs_v2_date_entered_current_stage: iso(current.at),
        }
        deal.visits.forEach((visit, index) => {
            props[`hs_v2_date_entered_${visit.stage}`] = iso(visit.at)
            const next = deal.visits[index + 1]
            if (next) props[`hs_v2_date_exited_${visit.stage}`] = iso(next.at)
        })
        return props
    }
    function matches({ props, filter }: { props: Record<string, string | null>, filter: Filter }): boolean {
        const actual = props[filter.propertyName]
        if (filter.operator === 'HAS_PROPERTY') return actual !== undefined && actual !== null
        if (actual === undefined || actual === null) return false
        if (filter.operator === 'EQ') return actual === filter.value
        if (filter.operator === 'GT') return Date.parse(actual) > Number(filter.value)
        throw new Error(`fake HubSpot does not support operator ${filter.operator}`)
    }
    function searchDeals(body: SearchBody) {
        const groups = body.filterGroups ?? []
        const hits = portal.deals.map((deal) => ({ deal, props: dealProperties(deal) }))
            .filter(({ props }) => groups.length === 0 || groups.some((group) => group.filters.every((filter) => matches({ props, filter }))))
        const sort = body.sorts?.[0]
        if (sort) {
            const descending = sort.startsWith('-')
            const key = descending ? sort.slice(1) : sort
            hits.sort((a, b) => ((Date.parse(a.props[key] ?? '') || 0) - (Date.parse(b.props[key] ?? '') || 0)) * (descending ? -1 : 1))
        }
        const offset = Number(body.after ?? 0)
        const limit = body.limit ?? 10
        const requested = new Set([...(body.properties ?? []), 'hs_object_id', 'createdate', 'hs_lastmodifieddate'])
        return {
            total: hits.length,
            results: hits.slice(offset, offset + limit).map(({ deal, props }) => ({
                id: deal.id,
                properties: Object.fromEntries(Object.entries(props).filter(([key]) => requested.has(key))),
                createdAt: props.createdate,
                updatedAt: props.hs_lastmodifieddate,
                archived: false,
            })),
            ...(offset + limit < hits.length ? { paging: { next: { after: String(offset + limit) } } } : {}),
        }
    }
    class Client {
        crm = { deals: { searchApi: { doSearch: async (body: SearchBody) => searchDeals(body) } }, properties: { coreApi: { getByName: async (objectType: string, propertyName: string) => ({ name: propertyName, objectType }) } } }
    }
    return { Client }
})

import { dealStageUpdatedTrigger } from '../src/lib/triggers/deal-stage-updated'


describe('PIE-933 HubSpot Updated Deal Stage', () => {
    it('reports every deal that entered the stage since the last poll, including one that already moved on', async () => {
        const store = hubspotTestKit.memoryStore()
        const ctx = hubspotTestKit.pollingContext({ store, propsValue: { pipelineId: 'default', stageId: 'presentationscheduled' } })
        await dealStageUpdatedTrigger.onEnable(ctx)
        const now = Date.now()
        await store.put('lastPoll', now - 10 * 60_000)
        portal.deals = [
            { id: '101', name: 'Acme renewal', pipeline: 'default', visits: [{ stage: 'qualifiedtobuy', at: now - 30 * 60_000 }, { stage: 'presentationscheduled', at: now - 8 * 60_000 }, { stage: 'contractsent', at: now - 5 * 60_000 }] },
            { id: '102', name: 'Globex expansion', pipeline: 'default', visits: [{ stage: 'qualifiedtobuy', at: now - 40 * 60_000 }, { stage: 'presentationscheduled', at: now - 7 * 60_000 }] },
            { id: '103', name: 'Initech', pipeline: 'default', visits: [{ stage: 'presentationscheduled', at: now - 50 * 60_000 }] },
        ]
        const emitted = hubspotTestKit.ids({ events: await dealStageUpdatedTrigger.run(ctx) })
        expect(emitted).toEqual(['101', '102'])
        expect(await dealStageUpdatedTrigger.run(ctx)).toEqual([])
    })

    it('test() returns the deals that most recently entered the stage, oldest to newest', async () => {
        const now = Date.now()
        portal.deals = [
            { id: 'a', name: 'A', pipeline: 'default', visits: [{ stage: 'presentationscheduled', at: now - 3 * 60_000 }, { stage: 'closedwon', at: now - 60_000 }] },
            { id: 'b', name: 'B', pipeline: 'default', visits: [{ stage: 'presentationscheduled', at: now - 2 * 60_000 }] },
            { id: 'c', name: 'C', pipeline: 'default', visits: [{ stage: 'qualifiedtobuy', at: now - 60_000 }] },
        ]
        const ctx = hubspotTestKit.pollingContext({ store: hubspotTestKit.memoryStore(), propsValue: { pipelineId: 'default', stageId: 'presentationscheduled' } })
        const sample = hubspotTestKit.ids({ events: await dealStageUpdatedTrigger.test(ctx) })
        expect(sample).toEqual(['a', 'b'])
    })
})
