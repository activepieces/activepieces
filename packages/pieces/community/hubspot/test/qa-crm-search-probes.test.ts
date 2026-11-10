import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type Rec = { id: string, properties: Record<string, string>, history: Record<string, { value: string, timestamp: string }[]> }
type Filter = { propertyName: string, operator: string, value?: string }
type SearchRequest = { limit?: number, after?: string, sorts?: string[], properties?: string[], filterGroups?: { filters: Filter[] }[] }

type CallHook = (call: number) => void
type BatchReadRequest = { inputs: { id: string }[], properties: string[], propertiesWithHistory: string[] }
type FakeCrm = { tables: Record<string, Rec[]>, searchCalls: number, readCalls: number, onSearch?: CallHook, onRead?: CallHook }

const crm = vi.hoisted(() => {
    const state: FakeCrm = { tables: {}, searchCalls: 0, readCalls: 0, onSearch: undefined, onRead: undefined }
    return state
})

vi.mock('@hubspot/api-client', () => {
    const ALWAYS = ['hs_object_id', 'createdate', 'lastmodifieddate', 'hs_lastmodifieddate', 'hs_createdate']
    const asMs = (value: string | undefined) => (value === undefined || value === '' || value === null ? NaN : /^\d+$/.test(value) ? Number(value) : Date.parse(value))
    function matches({ rec, filter }: { rec: Rec, filter: Filter }): boolean {
        const value = rec.properties[filter.propertyName]
        if (filter.operator === 'HAS_PROPERTY') return value !== undefined && value !== ''
        if (filter.operator === 'EQ') return value === filter.value
        if (filter.operator === 'GT') return asMs(value) > asMs(filter.value)
        throw new Error(`unsupported operator ${filter.operator}`)
    }
    function project({ rec, properties }: { rec: Rec, properties?: string[] }) {
        const keys = properties && properties.length > 0 ? [...new Set([...properties, ...ALWAYS])] : ALWAYS
        return {
            id: rec.id,
            properties: Object.fromEntries(keys.filter((key) => key in rec.properties || (properties ?? []).includes(key)).map((key) => [key, rec.properties[key] ?? null])),
            createdAt: rec.properties.createdate,
            updatedAt: rec.properties.hs_lastmodifieddate,
            archived: false,
        }
    }
    function search({ table, req }: { table: Rec[], req: SearchRequest }) {
        crm.searchCalls += 1
        crm.onSearch?.(crm.searchCalls)
        const offset = Number(req.after ?? 0)
        const limit = Math.min(req.limit ?? 10, 200)
        if (offset + limit > 10000) throw new Error('HTTP-Code: 400 Search results are limited to 10,000')
        const groups = req.filterGroups ?? []
        let rows = table.filter((rec) => groups.length === 0 || groups.some((group) => group.filters.every((filter) => matches({ rec, filter }))))
        const sort = req.sorts?.[0]
        if (sort) {
            const descending = sort.startsWith('-')
            const key = descending ? sort.slice(1) : sort
            rows = [...rows].sort((a, b) => (asMs(a.properties[key]) - asMs(b.properties[key])) * (descending ? -1 : 1))
        }
        const page = rows.slice(offset, offset + limit)
        return { total: rows.length, results: page.map((rec) => project({ rec, properties: req.properties })), paging: offset + limit < rows.length ? { next: { after: String(offset + limit) } } : undefined }
    }
    function batchRead({ table, req }: { table: Rec[], req: BatchReadRequest }) {
        crm.readCalls += 1
        crm.onRead?.(crm.readCalls)
        if (req.inputs.length > 50) throw new Error('max 50 inputs with history')
        return {
            results: req.inputs.flatMap(({ id }) => {
                const rec = table.find((candidate) => candidate.id === id)
                if (!rec) return []
                const withHistory = Object.fromEntries(req.propertiesWithHistory.map((prop) => [prop, [...(rec.history[prop] ?? [])].reverse()]))
                return [{ ...project({ rec, properties: req.properties }), propertiesWithHistory: withHistory }]
            }),
        }
    }
    const tableOf = (name: string) => {
        crm.tables[name] = crm.tables[name] ?? []
        return crm.tables[name]
    }
    const api = (name: string) => ({
        searchApi: { doSearch: async (req: SearchRequest) => search({ table: tableOf(name), req }) },
        batchApi: { read: async (req: BatchReadRequest) => batchRead({ table: tableOf(name), req }) },
    })
    class Client {
        crm = {
            properties: { coreApi: { getByName: async (objectType: string, propertyName: string) => ({ name: propertyName, objectType }) } },
            companies: api('companies'),
            contacts: api('contacts'),
            deals: api('deals'),
            tickets: api('tickets'),
            products: api('products'),
            lineItems: api('lineItems'),
            objects: {
                tasks: api('tasks'),
                searchApi: { doSearch: async (type: string, req: SearchRequest) => search({ table: tableOf(type), req }) },
                batchApi: { read: async (type: string, req: BatchReadRequest) => batchRead({ table: tableOf(type), req }) },
            },
        }
    }
    return { Client }
})

import { newCompanyTrigger } from '../src/lib/triggers/new-company'
import { newContactTrigger } from '../src/lib/triggers/new-contact'
import { newDealTrigger } from '../src/lib/triggers/new-deal'
import { newTicketTrigger } from '../src/lib/triggers/new-ticket'
import { newProductTrigger } from '../src/lib/triggers/new-product'
import { newLineItemTrigger } from '../src/lib/triggers/new-line-item'
import { newTaskTrigger } from '../src/lib/triggers/new-task'
import { newCustomObjectTrigger } from '../src/lib/triggers/new-custom-object'
import { newOrUpdatedCompanyTrigger } from '../src/lib/triggers/new-or-updated-company'
import { newOrUpdatedContactTrigger } from '../src/lib/triggers/new-or-updated-contact'
import { newOrUpdatedLineItemTrigger } from '../src/lib/triggers/new-or-updated-line-item'
import { newOrUpdatedProductTrigger } from '../src/lib/triggers/new-or-updated-product'
import { dealStageUpdatedTrigger } from '../src/lib/triggers/deal-stage-updated'
import { newContactPropertyChangeTrigger } from '../src/lib/triggers/new-contact-property-change'
import { newCompanyPropertyChangeTrigger } from '../src/lib/triggers/new-company-property-change'
import { newDealPropertyChangeTrigger } from '../src/lib/triggers/new-deal-property-change'
import { newTicketPropertyChangeTrigger } from '../src/lib/triggers/new-ticket-property-change'
import { newCustomObjectPropertyChangeTrigger } from '../src/lib/triggers/new-custom-object-property-change'

type AnyTrigger = { onEnable: (c: never) => Promise<unknown>, onDisable: (c: never) => Promise<unknown>, run: (c: never) => Promise<unknown[]>, test: (c: never) => Promise<unknown[]>, sampleData: unknown }
type Case = { name: string, trigger: AnyTrigger, table: string, watched?: string, props: Record<string, unknown> }

const CASES: Case[] = [
    { name: 'new-company', trigger: newCompanyTrigger, table: 'companies', props: {} },
    { name: 'new-contact', trigger: newContactTrigger, table: 'contacts', props: {} },
    { name: 'new-deal', trigger: newDealTrigger, table: 'deals', props: {} },
    { name: 'new-ticket', trigger: newTicketTrigger, table: 'tickets', props: {} },
    { name: 'new-product', trigger: newProductTrigger, table: 'products', props: {} },
    { name: 'new-line-item', trigger: newLineItemTrigger, table: 'lineItems', props: {} },
    { name: 'new-task', trigger: newTaskTrigger, table: 'tasks', props: {} },
    { name: 'new-custom-object', trigger: newCustomObjectTrigger, table: 'p_pets', props: { customObjectType: 'p_pets', additionalPropertiesToRetrieve: { values: [] } } },
    { name: 'new-or-updated-company', trigger: newOrUpdatedCompanyTrigger, table: 'companies', props: {} },
    { name: 'new-or-updated-contact', trigger: newOrUpdatedContactTrigger, table: 'contacts', props: {} },
    { name: 'new-or-updated-line-item', trigger: newOrUpdatedLineItemTrigger, table: 'lineItems', props: {} },
    { name: 'new-or-updated-product', trigger: newOrUpdatedProductTrigger, table: 'products', props: {} },
    { name: 'deal-stage-updated', trigger: dealStageUpdatedTrigger, table: 'deals', props: { pipelineId: 'default', stageId: 'closedwon' } },
    { name: 'new-contact-property-change', trigger: newContactPropertyChangeTrigger, table: 'contacts', watched: 'lifecyclestage', props: { propertyName: 'lifecyclestage' } },
    { name: 'new-company-property-change', trigger: newCompanyPropertyChangeTrigger, table: 'companies', watched: 'industry', props: { propertyName: 'industry' } },
    { name: 'new-deal-property-change', trigger: newDealPropertyChangeTrigger, table: 'deals', watched: 'amount', props: { propertyName: 'amount' } },
    { name: 'new-ticket-property-change', trigger: newTicketPropertyChangeTrigger, table: 'tickets', watched: 'hs_pipeline_stage', props: { propertyName: 'hs_pipeline_stage' } },
    { name: 'new-custom-object-property-change', trigger: newCustomObjectPropertyChangeTrigger, table: 'p_pets', watched: 'color', props: { customObjectType: 'p_pets', propertyName: { values: 'color' } } },
]

const WATCHED = ['lifecyclestage', 'industry', 'amount', 'hs_pipeline_stage', 'color']

const PRE_EXISTING_OR_USER_DEFINED_SAMPLE_KEYS: Record<string, string[]> = {
    'new-custom-object': ['pet_name'],
    'new-custom-object-property-change': ['pet_name'],
}

let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return new Date(clock).toISOString()
}

function create({ table, id, at }: { table: string, id: string, at?: string }) {
    const time = at ?? tick()
    const properties: Record<string, string> = {
        hs_object_id: id,
        name: id,
        createdate: time,
        hs_createdate: time,
        lastmodifieddate: time,
        hs_lastmodifieddate: time,
        hs_v2_date_entered_closedwon: time,
        hs_v2_date_entered_current_stage: time,
        dealstage: 'closedwon',
    }
    const history: Rec['history'] = {}
    for (const prop of WATCHED) {
        properties[prop] = 'initial'
        history[prop] = [{ value: 'initial', timestamp: time }]
    }
    crm.tables[table] = crm.tables[table] ?? []
    crm.tables[table].push({ id, properties, history })
}

function touch({ table, id, at }: { table: string, id: string, at?: string }) {
    const rec = crm.tables[table].find((candidate) => candidate.id === id)!
    const time = at ?? tick()
    rec.properties.lastmodifieddate = time
    rec.properties.hs_lastmodifieddate = time
}

function changeWatched({ table, id, prop, value, at }: { table: string, id: string, prop: string, value: string, at?: string }) {
    const rec = crm.tables[table].find((candidate) => candidate.id === id)!
    const time = at ?? tick()
    rec.properties[prop] = value
    rec.properties.lastmodifieddate = time
    rec.properties.hs_lastmodifieddate = time
    rec.history[prop].push({ value, timestamp: time })
}

function memoryStore(initial: Record<string, unknown> = {}) {
    const data = new Map<string, string>(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]))
    return {
        data,
        put: async <T>(key: string, value: T) => {
            data.set(key, JSON.stringify(value))
            return value
        },
        get: async <T>(key: string): Promise<T | null> => {
            const raw = data.get(key)
            return raw === undefined ? null : JSON.parse(raw)
        },
        delete: async (key: string) => {
            data.delete(key)
        },
    }
}

type Store = ReturnType<typeof memoryStore>
const ctx = ({ store, propsValue, isRepublish }: { store: Store, propsValue: Record<string, unknown>, isRepublish?: boolean }) =>
    hubspotTestKit.pollingContext({ store, propsValue, isRepublish })
const ids = (events: unknown[]) => hubspotTestKit.ids({ events })

beforeEach(() => {
    crm.tables = {}
    crm.searchCalls = 0
    crm.readCalls = 0
    crm.onSearch = undefined
    crm.onRead = undefined
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe.each(CASES)('QA probe: $name', ({ name, trigger, table, props }) => {
    it('upgrade from 0.13.2 state (only lastPoll stored): no flood of old records, nothing lost after lastPoll', async () => {
        create({ table, id: 'before-1' })
        create({ table, id: 'before-2' })
        const lastPoll = Date.parse(tick())
        create({ table, id: 'after-1' })
        create({ table, id: 'after-2' })
        const store = memoryStore({ lastPoll })
        expect(ids(await trigger.run(ctx({ store, propsValue: props })))).toEqual(['after-1', 'after-2'])
        expect(await trigger.run(ctx({ store, propsValue: props }))).toEqual([])
        await trigger.onDisable(ctx({ store, propsValue: props, isRepublish: true }))
        await trigger.onEnable(ctx({ store, propsValue: props, isRepublish: true }))
        create({ table, id: 'after-republish' })
        expect(ids(await trigger.run(ctx({ store, propsValue: props })))).toEqual(['after-republish'])
    })

    it('test() output has the same keys and property keys as run() output', async () => {
        create({ table, id: 'sample' })
        const store = memoryStore()
        const [sampleEvent] = await trigger.test(ctx({ store, propsValue: props }))
        const sample = { ...hubspotTestKit.toRecord({ value: sampleEvent }), properties: hubspotTestKit.propertiesOf({ value: sampleEvent }) }
        await trigger.onEnable(ctx({ store, propsValue: props }))
        tick()
        create({ table, id: 'real' })
        const [realEvent] = await trigger.run(ctx({ store, propsValue: props }))
        const real = { ...hubspotTestKit.toRecord({ value: realEvent }), properties: hubspotTestKit.propertiesOf({ value: realEvent }) }
        expect(Object.keys(sample).sort()).toEqual(Object.keys(real).sort())
        expect(Object.keys(sample.properties).sort()).toEqual(Object.keys(real.properties).sort())
    })

    it('every sampleData key (and sampleData.properties key) is requested/returned in a real run', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store, propsValue: props }))
        tick()
        create({ table, id: 'real' })
        const [realEvent] = await trigger.run(ctx({ store, propsValue: props }))
        const real = { ...hubspotTestKit.toRecord({ value: realEvent }), properties: hubspotTestKit.propertiesOf({ value: realEvent }) }
        const sampleRecord = hubspotTestKit.toRecord({ value: trigger.sampleData })
        const sample = { ...sampleRecord, properties: 'properties' in sampleRecord ? hubspotTestKit.propertiesOf({ value: sampleRecord }) : undefined }
        const exempt = new Set(PRE_EXISTING_OR_USER_DEFINED_SAMPLE_KEYS[name] ?? [])
        const missingTop = Object.keys(sample).filter((key) => !(key in real) && !exempt.has(key))
        const missingProps = Object.keys(sample.properties ?? {}).filter((key) => !(key in real.properties) && !exempt.has(key))
        expect({ missingTop, missingProps }).toEqual({ missingTop: [], missingProps: [] })
    })

    it('a search error on page 2 throws and does not advance lastPoll (or the scan cursor)', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store, propsValue: props }))
        tick()
        Array.from({ length: 250 }, (_, i) => `e-${i}`).forEach((id) => create({ table, id, at: tick(1000) }))
        const before = [...store.data.entries()]
        crm.onSearch = (call) => {
            if (call === 2) throw new Error('HTTP-Code: 502 Bad Gateway')
        }
        await expect(trigger.run(ctx({ store, propsValue: props }))).rejects.toThrow(/502/)
        expect([...store.data.entries()]).toEqual(before)
        crm.onSearch = undefined
        expect(ids(await trigger.run(ctx({ store, propsValue: props })))).toHaveLength(250)
    })

    it('the poll deadline mid-paging keeps the cursor and the next polls deliver the rest exactly once', async () => {
        const store = memoryStore()
        await trigger.onEnable(ctx({ store, propsValue: props }))
        tick()
        const burst = Array.from({ length: 650 }, (_, i) => `d-${String(i).padStart(4, '0')}`)
        burst.forEach((id) => create({ table, id, at: tick(1000) }))
        crm.onSearch = (call) => {
            if (call === 2) clock += 50_000
        }
        const first = ids(await trigger.run(ctx({ store, propsValue: props })))
        crm.onSearch = undefined
        expect(first.length).toBeGreaterThan(0)
        expect(first.length).toBeLessThan(burst.length)
        const second = ids(await trigger.run(ctx({ store, propsValue: props })))
        expect([...first, ...second]).toEqual(burst)
        expect(await trigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })
})

describe.each(CASES.filter((c) => c.watched))('QA probe property change: $name', ({ trigger, table, props, watched }) => {
    it('does not lose a change made behind the scan cursor on a record that was modified again after the cursor (early stop at the 10,000 cap)', async () => {
        const store = memoryStore()
        Array.from({ length: 10_100 }, (_, i) => `r-${i}`).forEach((id) => create({ table, id, at: tick(10) }))
        tick()
        await trigger.onEnable(ctx({ store, propsValue: props }))
        tick()
        changeWatched({ table, id: 'r-0', prop: watched!, value: 'changed', at: tick(10) })
        crm.tables[table].slice(1).forEach((rec) => touch({ table, id: rec.id, at: tick(10) }))
        touch({ table, id: 'r-0', at: tick(10) })
        const fired = [
            ...ids(await trigger.run(ctx({ store, propsValue: props }))),
            ...ids(await trigger.run(ctx({ store, propsValue: props }))),
            ...ids(await trigger.run(ctx({ store, propsValue: props }))),
        ]
        expect(fired).toEqual(['r-0'])
    }, 60_000)

    it('changing the watched property on republish neither floods nor replays old changes', async () => {
        const store = memoryStore()
        create({ table, id: 'x' })
        tick()
        await trigger.onEnable(ctx({ store, propsValue: props }))
        expect(await trigger.run(ctx({ store, propsValue: props }))).toEqual([])
        const otherProp = WATCHED.find((p) => p !== watched)!
        const otherProps = 'customObjectType' in props ? { ...props, propertyName: { values: otherProp } } : { ...props, propertyName: otherProp }
        await trigger.onDisable(ctx({ store, propsValue: otherProps, isRepublish: true }))
        await trigger.onEnable(ctx({ store, propsValue: otherProps, isRepublish: true }))
        expect(await trigger.run(ctx({ store, propsValue: otherProps }))).toEqual([])
        changeWatched({ table, id: 'x', prop: otherProp, value: 'new' })
        expect(ids(await trigger.run(ctx({ store, propsValue: otherProps })))).toEqual(['x'])
    })
})

describe('QA probe: search request rate', () => {
    it('property history reads run at most 4 at a time', async () => {
        let inFlight = 0
        let peak = 0
        const store = memoryStore()
        await newCompanyPropertyChangeTrigger.onEnable(ctx({ store, propsValue: { propertyName: 'industry' } }))
        tick()
        Array.from({ length: 900 }, (_, i) => `p-${i}`).forEach((id) => create({ table: 'companies', id, at: tick(10) }))
        crm.onRead = () => {
            inFlight += 1
            peak = Math.max(peak, inFlight)
            queueMicrotask(() => {
                inFlight -= 1
            })
        }
        await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: { propertyName: 'industry' } }))
        expect(peak).toBeLessThanOrEqual(4)
    })
})
