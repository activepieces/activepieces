import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hubspotTestKit } from './support/hubspot-test-kit'

type Rec = { id: string, properties: Record<string, string>, history: Record<string, { value: string, timestamp: string }[]> }
type Filter = { propertyName: string, operator: string, value?: string }
type TableName = 'companies' | 'deals' | 'contacts'
type BatchReadRequest = { inputs: { id: string }[], properties: string[], propertiesWithHistory: string[] }
type SearchRequest = { limit?: number, after?: string, sorts?: string[], properties?: string[], filterGroups?: { filters: Filter[] }[] }

const crm = vi.hoisted(() => {
    const state: { tables: Record<TableName, Rec[]>, searchCalls: number, missingProperties: Set<string>, propertyLookups: number, failPropertyLookup: boolean } = { tables: { companies: [], deals: [], contacts: [] }, searchCalls: 0, missingProperties: new Set(), propertyLookups: 0, failPropertyLookup: false }
    return state
})

vi.mock('@hubspot/api-client', () => {
    const asMs = (value: string | undefined) => (value === undefined || value === '' ? NaN : /^\d+$/.test(value) ? Number(value) : Date.parse(value))
    function matches({ rec, filter }: { rec: Rec, filter: Filter }): boolean {
        const value = rec.properties[filter.propertyName]
        if (filter.operator === 'HAS_PROPERTY') return value !== undefined && value !== ''
        if (filter.operator === 'EQ') return value === filter.value
        if (filter.operator === 'GT') return asMs(value) > asMs(filter.value)
        if (filter.operator === 'LT') return asMs(value) < asMs(filter.value)
        throw new Error(`unsupported operator ${filter.operator}`)
    }
    function project({ rec, properties }: { rec: Rec, properties?: string[] }) {
        const keys = properties && properties.length > 0 ? new Set([...properties, 'hs_object_id']) : new Set(Object.keys(rec.properties))
        return { id: rec.id, properties: Object.fromEntries(Object.entries(rec.properties).filter(([key]) => keys.has(key))), createdAt: rec.properties.createdate, updatedAt: rec.properties.hs_lastmodifieddate, archived: false }
    }
    function search({ table, req }: { table: Rec[], req: SearchRequest }) {
        crm.searchCalls += 1
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
    async function lookUpProperty({ objectType, propertyName }: { objectType: string, propertyName: string }) {
        crm.propertyLookups += 1
        if (crm.failPropertyLookup) throw Object.assign(new Error('HTTP-Code: 502 Bad Gateway'), { code: 502 })
        if (crm.missingProperties.has(propertyName)) throw Object.assign(new Error('HTTP-Code: 404 Property does not exist'), { code: 404 })
        return { name: propertyName, objectType }
    }
    const api = (name: TableName) => ({
        searchApi: { doSearch: async (req: SearchRequest) => search({ table: crm.tables[name], req }) },
        batchApi: { read: async (req: BatchReadRequest) => batchRead({ table: crm.tables[name], req }) },
    })
    class Client {
        crm = { companies: api('companies'), deals: api('deals'), contacts: api('contacts'), properties: { coreApi: { getByName: async (objectType: string, propertyName: string) => lookUpProperty({ objectType, propertyName }) } } }
    }
    return { Client }
})

import { newCompanyTrigger } from '../src/lib/triggers/new-company'
import { newCompanyPropertyChangeTrigger } from '../src/lib/triggers/new-company-property-change'
import { dealStageUpdatedTrigger } from '../src/lib/triggers/deal-stage-updated'

let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return new Date(clock).toISOString()
}

function addCompany({ id, at }: { id: string, at?: string }) {
    const time = at ?? tick()
    crm.tables.companies.push({ id, properties: { hs_object_id: id, name: id, createdate: time, hs_lastmodifieddate: time, industry: 'RETAIL' }, history: { industry: [{ value: 'RETAIL', timestamp: time }] } })
}

function setIndustry({ id, value }: { id: string, value: string }) {
    const rec = crm.tables.companies.find((candidate) => candidate.id === id)!
    const time = tick()
    rec.properties.industry = value
    rec.properties.hs_lastmodifieddate = time
    rec.history.industry.push({ value, timestamp: time })
}

function touchCompany({ id }: { id: string }) {
    const rec = crm.tables.companies.find((candidate) => candidate.id === id)!
    rec.properties.hs_lastmodifieddate = tick()
}

function addDeal({ id }: { id: string }) {
    const time = tick()
    crm.tables.deals.push({ id, properties: { hs_object_id: id, dealname: id, pipeline: 'default', dealstage: 'appointmentscheduled', createdate: time, hs_lastmodifieddate: time, hs_v2_date_entered_current_stage: time, hs_v2_date_entered_appointmentscheduled: time }, history: {} })
}

function moveDeal({ id, stage, at }: { id: string, stage: string, at?: string }) {
    const rec = crm.tables.deals.find((candidate) => candidate.id === id)!
    const time = at ?? tick()
    rec.properties.dealstage = stage
    rec.properties.hs_lastmodifieddate = time
    rec.properties.hs_v2_date_entered_current_stage = time
    if (!crm.missingProperties.has(`hs_v2_date_entered_${stage}`)) {
        rec.properties[`hs_v2_date_entered_${stage}`] = time
    }
}

function memoryStore() {
    const data = new Map<string, string>()
    return {
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
    crm.tables.companies = []
    crm.tables.deals = []
    crm.tables.contacts = []
    crm.searchCalls = 0
    crm.missingProperties = new Set()
    crm.propertyLookups = 0
    crm.failPropertyLookup = false
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('New Company behaviour', () => {
    const props = {}

    it('fires once per new company across polls, never for companies that existed at enable, and survives a republish', async () => {
        addCompany({ id: 'old-1' })
        addCompany({ id: 'old-2' })
        const store = memoryStore()
        tick()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        addCompany({ id: 'new-1' })
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['new-1'])
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        touchCompany({ id: 'old-1' })
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        addCompany({ id: 'between' })
        await newCompanyTrigger.onDisable(ctx({ store, propsValue: props, isRepublish: true }))
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props, isRepublish: true }))
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['between'])
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })

    it('pages back to the checkpoint and emits a burst of more than one page oldest first', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        const burst = Array.from({ length: 205 }, (_, index) => `burst-${index}`)
        burst.forEach((id) => addCompany({ id, at: tick(1000) }))
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(burst)
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })

    it('delivers every company across polls when more than 10,000 arrive between two polls', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        const burst = Array.from({ length: 10_050 }, (_, index) => `bulk-${index}`)
        burst.forEach((id) => addCompany({ id, at: tick(10) }))
        const first = ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))
        const second = ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))
        expect(first.length).toBeLessThanOrEqual(10_000)
        expect([...first, ...second]).toEqual(burst)
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    }, 60_000)

    it('does not lose companies that share a timestamp at the 10,000 cap', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        const burst = Array.from({ length: 10_010 }, (_, index) => `tie-${String(index).padStart(5, '0')}`)
        burst.slice(0, 9_990).forEach((id) => addCompany({ id, at: tick(10) }))
        const sameTime = tick(10)
        burst.slice(9_990).forEach((id) => addCompany({ id, at: sameTime }))
        const first = ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))
        expect(first).toHaveLength(10_000)
        const fired = [
            ...first,
            ...ids(await newCompanyTrigger.run(ctx({ store, propsValue: props }))),
        ]
        expect(new Set(fired)).toEqual(new Set(burst))
        expect(fired).toHaveLength(burst.length)
    }, 60_000)

    it('delivers more than 10,000 companies created in the same millisecond, each once', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        const sameTime = tick()
        const burst = Array.from({ length: 10_050 }, (_, index) => String(500_000 + index))
        burst.forEach((id) => addCompany({ id, at: sameTime }))
        const fired: string[] = []
        for (let pollIndex = 0; pollIndex < 4; pollIndex++) {
            fired.push(...ids(await newCompanyTrigger.run(ctx({ store, propsValue: props }))))
        }
        expect(fired).toHaveLength(burst.length)
        expect(new Set(fired)).toEqual(new Set(burst))
        addCompany({ id: 'after-ties' })
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['after-ties'])
    }, 60_000)

    it('a company with a createdate far in the future does not hide companies created after it, and fires once its time comes', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        addCompany({ id: 'future', at: new Date(clock + 24 * 3600_000).toISOString() })
        addCompany({ id: 'now-1' })
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['now-1'])
        addCompany({ id: 'now-2' })
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['now-2'])
        clock += 25 * 3600_000
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['future'])
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })

    it('a capped window that is all one future createdate does not pin the cursor there or hide companies created before it', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        const futureAt = new Date(clock + 24 * 3600_000).toISOString()
        const future = Array.from({ length: 10_050 }, (_, index) => String(100_000 + index))
        future.forEach((id) => addCompany({ id, at: futureAt }))
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        addCompany({ id: '1' })
        expect(ids(await newCompanyTrigger.run(ctx({ store, propsValue: props })))).toEqual(['1'])
        clock += 25 * 3600_000
        const fired: string[] = []
        for (let pollIndex = 0; pollIndex < 4; pollIndex++) {
            fired.push(...ids(await newCompanyTrigger.run(ctx({ store, propsValue: props }))))
        }
        expect(fired).toHaveLength(future.length)
        expect(new Set(fired)).toEqual(new Set(future))
    }, 60_000)

    it('test() ends with the newest company and every sampleData key exists in a real run', async () => {
        addCompany({ id: 'older' })
        addCompany({ id: 'newest' })
        const store = memoryStore()
        expect(ids(await newCompanyTrigger.test(ctx({ store, propsValue: props }))).at(-1)).toBe('newest')
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: props }))
        addCompany({ id: 'real' })
        const [real] = await newCompanyTrigger.run(ctx({ store, propsValue: props }))
        for (const key of Object.keys(hubspotTestKit.toRecord({ value: newCompanyTrigger.sampleData }))) {
            expect(real).toHaveProperty(key)
        }
    })
})

describe('New Company Property Change behaviour', () => {
    const props = { propertyName: 'industry' }

    it('fires once per change, also when cleared, never for other edits, and survives a republish', async () => {
        addCompany({ id: 'a' })
        addCompany({ id: 'b' })
        const store = memoryStore()
        tick()
        await newCompanyPropertyChangeTrigger.onEnable(ctx({ store, propsValue: props }))
        expect(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        setIndustry({ id: 'a', value: 'TECH' })
        const [changed] = await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))
        expect(hubspotTestKit.textField({ value: changed, key: 'id' })).toBe('a')
        expect(hubspotTestKit.propertiesOf({ value: changed })).toMatchObject({ industry: 'TECH', name: 'a' })
        expect(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        touchCompany({ id: 'b' })
        expect(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        setIndustry({ id: 'b', value: '' })
        await newCompanyPropertyChangeTrigger.onDisable(ctx({ store, propsValue: props, isRepublish: true }))
        await newCompanyPropertyChangeTrigger.onEnable(ctx({ store, propsValue: props, isRepublish: true }))
        expect(ids(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props })))).toEqual(['b'])
        expect(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })

    it('moves past 10,000 edits that did not touch the watched property and still finds the change behind them', async () => {
        const store = memoryStore()
        Array.from({ length: 10_100 }, (_, index) => `c-${index}`).forEach((id) => addCompany({ id, at: tick(10) }))
        tick()
        await newCompanyPropertyChangeTrigger.onEnable(ctx({ store, propsValue: props }))
        crm.tables.companies.forEach((rec) => {
            rec.properties.hs_lastmodifieddate = tick(10)
        })
        setIndustry({ id: 'c-5', value: 'TECH' })
        const fired = [
            ...ids(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))),
            ...ids(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))),
            ...ids(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: props }))),
        ]
        expect(fired).toEqual(['c-5'])
    }, 60_000)
})

describe('Updated Deal Stage behaviour', () => {
    const props = { pipelineId: 'default', stageId: 'closedwon' }

    it('fires once per stage entry, including deals that moved on, and survives a republish', async () => {
        addDeal({ id: 'd1' })
        addDeal({ id: 'd2' })
        const store = memoryStore()
        tick()
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props }))
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        moveDeal({ id: 'd1', stage: 'closedwon' })
        moveDeal({ id: 'd1', stage: 'contractsent' })
        expect(ids(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props })))).toEqual(['d1'])
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        moveDeal({ id: 'd2', stage: 'closedwon' })
        await dealStageUpdatedTrigger.onDisable(ctx({ store, propsValue: props, isRepublish: true }))
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props, isRepublish: true }))
        expect(ids(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props })))).toEqual(['d2'])
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })

    it('pages a burst of more than one page oldest first', async () => {
        const burst = Array.from({ length: 230 }, (_, index) => `deal-${index}`)
        burst.forEach((id) => addDeal({ id }))
        const store = memoryStore()
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props }))
        burst.forEach((id) => moveDeal({ id, stage: 'closedwon', at: tick(1000) }))
        expect(ids(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props })))).toEqual(burst)
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
    })

    it('test() returns the newest deals that entered the stage, oldest to newest', async () => {
        const burst = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6']
        burst.forEach((id) => addDeal({ id }))
        burst.forEach((id) => moveDeal({ id, stage: 'closedwon' }))
        expect(ids(await dealStageUpdatedTrigger.test(ctx({ store: memoryStore(), propsValue: props })))).toEqual(['s-2', 's-3', 's-4', 's-5', 's-6'])
    })
})

describe('Updated Deal Stage on a custom pipeline stage without a date-entered property', () => {
    const props = { pipelineId: '4322980034', stageId: '6400883929' }

    beforeEach(() => {
        crm.missingProperties.add('hs_v2_date_entered_6400883929')
    })

    it('falls back to deals currently in the stage, fires once per entry across polls and a republish, and checks the property once', async () => {
        addDeal({ id: 'c1' })
        addDeal({ id: 'c2' })
        const store = memoryStore()
        tick()
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props }))
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        moveDeal({ id: 'c1', stage: '6400883929' })
        const [event] = await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))
        expect(hubspotTestKit.textField({ value: event, key: 'id' })).toBe('c1')
        expect(hubspotTestKit.propertiesOf({ value: event })).toMatchObject({ dealstage: '6400883929', pipeline: 'default' })
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        moveDeal({ id: 'c2', stage: '6400883929' })
        await dealStageUpdatedTrigger.onDisable(ctx({ store, propsValue: props, isRepublish: true }))
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props, isRepublish: true }))
        expect(ids(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props })))).toEqual(['c2'])
        expect(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).toEqual([])
        expect(crm.propertyLookups).toBe(1)
    })

    it('test() works on the fallback and returns deals in the stage, oldest to newest', async () => {
        const inStage = ['t-1', 't-2', 't-3']
        inStage.forEach((id) => addDeal({ id }))
        inStage.forEach((id) => moveDeal({ id, stage: '6400883929' }))
        expect(ids(await dealStageUpdatedTrigger.test(ctx({ store: memoryStore(), propsValue: props })))).toEqual(['t-1', 't-2', 't-3'])
    })

    it('re-checks a missing property after a day and switches to the stage-entry property once HubSpot creates it', async () => {
        addDeal({ id: 'late' })
        const store = memoryStore()
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props }))
        await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))
        await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))
        expect(crm.propertyLookups).toBe(1)
        clock += 25 * 3600_000
        crm.missingProperties.clear()
        moveDeal({ id: 'late', stage: '6400883929' })
        moveDeal({ id: 'late', stage: 'closedwon' })
        expect(ids(await dealStageUpdatedTrigger.run(ctx({ store, propsValue: props })))).toEqual(['late'])
        expect(crm.propertyLookups).toBe(2)
    })

    it('a failing property lookup (not a 404) fails the poll without changing the store', async () => {
        const store = memoryStore()
        await dealStageUpdatedTrigger.onEnable(ctx({ store, propsValue: props }))
        crm.failPropertyLookup = true
        await expect(dealStageUpdatedTrigger.run(ctx({ store, propsValue: props }))).rejects.toThrow(/502/)
        expect(await store.get('dealStageEntryProperty')).toBeNull()
    })
})
