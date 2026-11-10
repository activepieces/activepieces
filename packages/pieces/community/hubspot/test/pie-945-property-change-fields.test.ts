import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type Rec = { id: string, modified: number, props: Record<string, string>, history: Record<string, { value: string, timestamp: number }[]> }
type Filter = { propertyName: string, operator: string, value?: string }
type SearchRequest = { limit?: number, after?: string, sorts?: string[], properties?: string[], filterGroups?: { filters: Filter[] }[] }
type ReadRequest = { inputs: { id: string }[], properties?: string[], propertiesWithHistory?: string[] }

const portal = vi.hoisted(() => {
    const state: { objects: Record<string, Rec[]>, historyReads: number, searchCalls: number } = { objects: { contacts: [], tickets: [] }, historyReads: 0, searchCalls: 0 }
    return state
})

vi.mock('@hubspot/api-client', () => {
    const MODIFIED_PROP: Record<string, string> = { contacts: 'lastmodifieddate', tickets: 'hs_lastmodifieddate' }
    function project({ type, rec, properties }: { type: string, rec: Rec, properties?: string[] }) {
        const always: Record<string, string> = { hs_object_id: rec.id, createdate: '2020-01-01T00:00:00.000Z', [MODIFIED_PROP[type]]: new Date(rec.modified).toISOString() }
        const requested = properties && properties.length > 0 ? properties : Object.keys(rec.props)
        const props: Record<string, string> = { ...always }
        for (const key of requested) if (key in rec.props) props[key] = rec.props[key]
        return { id: rec.id, properties: props, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: new Date(rec.modified).toISOString(), archived: false }
    }
    function search({ type, req }: { type: string, req: SearchRequest }) {
        portal.searchCalls++
        const limit = Math.min(req.limit ?? 10, 200)
        const offset = req.after ? parseInt(req.after) : 0
        if (offset + limit > 10000) throw new Error('HTTP-Code: 400 VALIDATION_ERROR')
        let rows = [...portal.objects[type]]
        for (const group of req.filterGroups ?? []) for (const filter of group.filters) {
            if (filter.operator === 'GT' && filter.propertyName === MODIFIED_PROP[type]) rows = rows.filter((rec) => rec.modified > Number(filter.value))
            if (filter.operator === 'HAS_PROPERTY') rows = rows.filter((rec) => filter.propertyName in rec.props)
        }
        const descending = String(req.sorts?.[0] ?? '-').startsWith('-')
        rows.sort((a, b) => (a.modified - b.modified) * (descending ? -1 : 1))
        const page = rows.slice(offset, offset + limit)
        return { total: rows.length, results: page.map((rec) => project({ type, rec, properties: req.properties })), paging: offset + limit < rows.length ? { next: { after: String(offset + limit) } } : undefined }
    }
    function read({ type, req }: { type: string, req: ReadRequest }) {
        if (req.inputs.length > 50) throw new Error('HTTP-Code: 400 max 50 inputs with history')
        portal.historyReads += req.inputs.length
        const results = req.inputs.flatMap((input) => {
            const rec = portal.objects[type].find((candidate) => candidate.id === input.id)
            if (!rec) return []
            const withHistory: Record<string, { value: string, timestamp: string }[]> = {}
            for (const prop of req.propertiesWithHistory ?? []) {
                withHistory[prop] = (rec.history[prop] ?? []).map((entry) => ({ value: entry.value, timestamp: new Date(entry.timestamp).toISOString() }))
            }
            return [{ ...project({ type, rec, properties: req.properties }), propertiesWithHistory: withHistory }]
        })
        return { status: 'COMPLETE', results }
    }
    const api = ({ type }: { type: string }) => ({
        searchApi: { doSearch: async (req: SearchRequest) => search({ type, req }) },
        batchApi: { read: async (req: ReadRequest) => read({ type, req }) },
    })
    class Client {
        crm = { contacts: api({ type: 'contacts' }), tickets: api({ type: 'tickets' }) }
    }
    return { Client }
})

import { newContactPropertyChangeTrigger } from '../src/lib/triggers/new-contact-property-change'
import { newTicketPropertyChangeTrigger } from '../src/lib/triggers/new-ticket-property-change'

const contactRecord: Record<string, string> = {
    firstname: 'Maria', lastname: 'Johnson', email: 'maria@example.com', company: 'HubSpot', city: 'Brisbane', jobtitle: 'Salesperson', lifecyclestage: 'lead',
}
const ticketRecord: Record<string, string> = {
    subject: 'Printer on fire', content: 'It is on fire', hs_pipeline: '0', hs_pipeline_stage: '1', hs_ticket_priority: 'LOW', hubspot_owner_id: '123', hs_ticket_category: 'PRODUCT_ISSUE',
}

const cases = [
    { name: 'New Contact Property Change', type: 'contacts', trigger: newContactPropertyChangeTrigger, watched: 'lifecyclestage', newValue: 'customer', record: contactRecord, mustHave: ['email', 'firstname', 'lastname'] },
    { name: 'New Ticket Property Change', type: 'tickets', trigger: newTicketPropertyChangeTrigger, watched: 'hs_ticket_priority', newValue: 'HIGH', record: ticketRecord, mustHave: ['subject', 'hs_pipeline', 'hs_pipeline_stage', 'hubspot_owner_id'] },
]

describe('PIE-945 HubSpot property-change triggers: emitted record content', () => {
    beforeEach(() => {
        portal.objects = { contacts: [], tickets: [] }
    })

    for (const c of cases) {
        it(`${c.name}: the emitted record carries the record fields shown in the trigger sample data`, async () => {
            const store = hubspotTestKit.memoryStore()
            const ctx = hubspotTestKit.pollingContext({ store, propsValue: { propertyName: c.watched } })

            const sampleProperties = hubspotTestKit.propertiesOf({ value: c.trigger.sampleData })
            for (const f of c.mustHave) expect(Object.keys(sampleProperties)).toContain(f)

            await c.trigger.onEnable(ctx)
            const enabledAt = hubspotTestKit.storedNumber({ store, key: 'lastPoll' })
            const changedAt = enabledAt + 1000
            portal.objects[c.type].push({
                id: `${c.type}-1`,
                modified: changedAt,
                props: { ...c.record, [c.watched]: c.newValue },
                history: { [c.watched]: [{ value: c.newValue, timestamp: changedAt }, { value: 'old', timestamp: enabledAt - 86400000 }] },
            })

            const out = await c.trigger.run(ctx)
            expect(hubspotTestKit.ids({ events: out })).toEqual([`${c.type}-1`])
            const properties = hubspotTestKit.propertiesOf({ value: out[0] })
            expect(properties[c.watched]).toBe(c.newValue)
            for (const f of c.mustHave) {
                expect(properties[f], `property ${f}`).toBe(c.record[f])
            }
        }, 60000)
    }
})
