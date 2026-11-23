import { describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type Rec = { id: string, value: string, history: { value: string, timestamp: string }[], lastModified: string }
type Filter = { propertyName: string, operator: string, value?: string }
type SearchRequest = { filterGroups?: { filters: Filter[] }[] }
type ReadRequest = { inputs: { id: string }[] }

const portal = vi.hoisted(() => {
    const state: { db: Record<string, Rec[]>, watched: string } = { db: {}, watched: '' }
    return state
})

vi.mock('@hubspot/api-client', () => {
    const lastModProp = ({ type }: { type: string }) => (type === 'contacts' ? 'lastmodifieddate' : 'hs_lastmodifieddate')
    const hasValue = ({ value }: { value: unknown }) => value !== undefined && value !== null && value !== ''
    function toObject({ type, rec, withHistory }: { type: string, rec: Rec, withHistory: boolean }) {
        const properties: Record<string, string | null> = {
            hs_object_id: rec.id,
            [lastModProp({ type })]: rec.lastModified,
            [portal.watched]: rec.value,
        }
        return {
            id: rec.id,
            properties,
            ...(withHistory ? { propertiesWithHistory: { [portal.watched]: rec.history.map((entry) => ({ ...entry, sourceType: 'CRM_UI' })) } } : {}),
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: rec.lastModified,
            archived: false,
        }
    }
    function matches({ type, rec, filter }: { type: string, rec: Rec, filter: Filter }): boolean {
        const value = toObject({ type, rec, withHistory: false }).properties[filter.propertyName]
        if (filter.operator === 'HAS_PROPERTY') return hasValue({ value })
        if (filter.operator === 'NOT_HAS_PROPERTY') return !hasValue({ value })
        if (filter.operator === 'GT') return Date.parse(String(value)) > Number(filter.value)
        throw new Error('unsupported operator ' + filter.operator)
    }
    function search({ type, req }: { type: string, req: SearchRequest }) {
        const filters = req.filterGroups?.[0]?.filters ?? []
        const results = (portal.db[type] ?? []).filter((rec) => filters.every((filter) => matches({ type, rec, filter })))
        return { total: results.length, results: results.map((rec) => toObject({ type, rec, withHistory: false })) }
    }
    function read({ type, req }: { type: string, req: ReadRequest }) {
        const ids = req.inputs.map((input) => input.id)
        return { status: 'COMPLETE', results: (portal.db[type] ?? []).filter((rec) => ids.includes(rec.id)).map((rec) => toObject({ type, rec, withHistory: true })) }
    }
    const api = ({ type }: { type: string }) => ({
        searchApi: { doSearch: async (req: SearchRequest) => search({ type, req }) },
        batchApi: { read: async (req: ReadRequest) => read({ type, req }) },
    })
    class Client {
        crm = {
            contacts: api({ type: 'contacts' }),
            companies: api({ type: 'companies' }),
            deals: api({ type: 'deals' }),
            tickets: api({ type: 'tickets' }),
            objects: {
                searchApi: { doSearch: async (type: string, req: SearchRequest) => search({ type, req }) },
                batchApi: { read: async (type: string, req: ReadRequest) => read({ type, req }) },
            },
        }
    }
    return { Client }
})

import { newContactPropertyChangeTrigger } from '../src/lib/triggers/new-contact-property-change'
import { newCompanyPropertyChangeTrigger } from '../src/lib/triggers/new-company-property-change'
import { newDealPropertyChangeTrigger } from '../src/lib/triggers/new-deal-property-change'
import { newTicketPropertyChangeTrigger } from '../src/lib/triggers/new-ticket-property-change'
import { newCustomObjectPropertyChangeTrigger } from '../src/lib/triggers/new-custom-object-property-change'

const cases = [
    { name: 'contact', trigger: newContactPropertyChangeTrigger, type: 'contacts', prop: 'hs_lead_status', propsValue: { propertyName: 'hs_lead_status' } },
    { name: 'company', trigger: newCompanyPropertyChangeTrigger, type: 'companies', prop: 'industry', propsValue: { propertyName: 'industry' } },
    { name: 'deal', trigger: newDealPropertyChangeTrigger, type: 'deals', prop: 'closedate', propsValue: { propertyName: 'closedate' } },
    { name: 'ticket', trigger: newTicketPropertyChangeTrigger, type: 'tickets', prop: 'hubspot_owner_id', propsValue: { propertyName: 'hubspot_owner_id' } },
    { name: 'custom object', trigger: newCustomObjectPropertyChangeTrigger, type: '2-1234567', prop: 'pet_status', propsValue: { customObjectType: '2-1234567', propertyName: { values: 'pet_status' } } },
]

describe('PIE-1018 HubSpot property-change triggers', () => {
    for (const c of cases) {
        it(`${c.name}: fires when the watched property is cleared, as well as when it changes`, async () => {
            const store = hubspotTestKit.memoryStore()
            const ctx = hubspotTestKit.pollingContext({ store, propsValue: c.propsValue })

            await c.trigger.onEnable(ctx)
            const enabledAt = hubspotTestKit.storedNumber({ store, key: 'lastPoll' })

            const old = new Date(enabledAt - 86_400_000).toISOString()
            const edit = new Date(enabledAt + 60_000).toISOString()
            portal.watched = c.prop
            portal.db[c.type] = [
                { id: 'cleared', value: '', history: [{ value: '', timestamp: edit }, { value: 'was-set', timestamp: old }], lastModified: edit },
                { id: 'changed', value: 'new', history: [{ value: 'new', timestamp: edit }, { value: 'old', timestamp: old }], lastModified: edit },
                { id: 'untouched', value: 'same', history: [{ value: 'same', timestamp: old }], lastModified: edit },
            ]

            const emitted = await c.trigger.run(ctx)
            expect(hubspotTestKit.ids({ events: emitted }).sort()).toEqual(['changed', 'cleared'])
        })
    }
})
