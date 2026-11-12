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
        if (filter.operator === 'LT') return asMs(value) < asMs(filter.value)
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
import { newCompanyPropertyChangeTrigger } from '../src/lib/triggers/new-company-property-change'

let clock = Date.parse('2026-11-01T10:00:00.000Z')
const tick = (ms = 60_000) => {
    clock += ms
    return new Date(clock).toISOString()
}

let nextId = 10_000_000_000
const newId = () => String(nextId++)

function create({ id, at }: { id: string, at?: string }) {
    const time = at ?? tick()
    crm.tables.companies = crm.tables.companies ?? []
    crm.tables.companies.push({ id, properties: { hs_object_id: id, name: id, createdate: time, hs_lastmodifieddate: time, industry: 'initial' }, history: { industry: [{ value: 'initial', timestamp: time }] } })
}

function rec(id: string) {
    return crm.tables.companies.find((candidate) => candidate.id === id)!
}

function changeIndustry({ id, at }: { id: string, at: string }) {
    const r = rec(id)
    r.properties.industry = `v-${at}`
    r.properties.hs_lastmodifieddate = at
    r.history.industry.push({ value: r.properties.industry, timestamp: at })
}

function memoryStore() {
    const data = new Map<string, string>()
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
const ctx = ({ store, propsValue }: { store: Store, propsValue: Record<string, unknown> }) =>
    hubspotTestKit.pollingContext({ store, propsValue })
const ids = (events: unknown[]) => hubspotTestKit.ids({ events })

async function drain({ trigger, store, propsValue, polls = 8 }: { trigger: { run: (c: never) => Promise<unknown[]> }, store: Store, propsValue: Record<string, unknown>, polls?: number }) {
    let fired: string[] = []
    for (let i = 0; i < polls; i++) {
        fired = [...fired, ...ids(await trigger.run(ctx({ store, propsValue })))]
    }
    return fired
}

function duplicates(list: string[]) {
    const seen = new Set<string>()
    return list.filter((id) => (seen.has(id) ? true : (seen.add(id), false)))
}

beforeEach(() => {
    crm.tables = { companies: [] }
    crm.searchCalls = 0
    crm.onSearch = undefined
    crm.onRead = undefined
    clock = Date.parse('2026-11-01T10:00:00.000Z')
    vi.spyOn(Date, 'now').mockImplementation(() => clock)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('QA round 2: hs_object_id tie-paging mode', () => {
    it('enters on a capped window that is one millisecond, delivers every tie once, exits, and later records still fire', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: {} }))
        const same = tick()
        const ties = Array.from({ length: 10_050 }, () => newId())
        ties.forEach((id) => create({ id, at: same }))
        const after = Array.from({ length: 5 }, () => newId())
        after.forEach((id) => create({ id, at: tick(10) }))
        const fired = await drain({ trigger: newCompanyTrigger, store, propsValue: {} })
        expect(duplicates(fired)).toEqual([])
        expect(new Set(fired)).toEqual(new Set([...ties, ...after]))
        const cursor = JSON.parse(store.data.get('hubspotSearchCursor')!)
        expect(cursor.tieAfterId).toBeUndefined()
        expect(JSON.parse(store.data.get('lastPoll')!)).toBe(cursor.time)
        const late = newId()
        create({ id: late, at: tick() })
        expect(await drain({ trigger: newCompanyTrigger, store, propsValue: {}, polls: 3 })).toEqual([late])
    }, 120_000)

    it('pages more than 10,000 ties in one millisecond by id across several polls', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: {} }))
        const same = tick()
        const ties = Array.from({ length: 20_500 }, () => newId())
        ties.forEach((id) => create({ id, at: same }))
        const fired = await drain({ trigger: newCompanyTrigger, store, propsValue: {}, polls: 6 })
        expect(duplicates(fired)).toEqual([])
        expect(fired).toHaveLength(ties.length)
    }, 180_000)

    it('a deadline inside tie-paging keeps its place and finishes next poll', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: {} }))
        const same = tick()
        const ties = Array.from({ length: 10_400 }, () => newId())
        ties.forEach((id) => create({ id, at: same }))
        expect(await newCompanyTrigger.run(ctx({ store, propsValue: {} }))).toEqual([])
        crm.searchCalls = 0
        crm.onSearch = (call) => {
            if (call === 3) clock += 50_000
        }
        const first = ids(await newCompanyTrigger.run(ctx({ store, propsValue: {} })))
        crm.onSearch = undefined
        expect(first.length).toBeGreaterThan(0)
        expect(first.length).toBeLessThan(ties.length)
        const rest = await drain({ trigger: newCompanyTrigger, store, propsValue: {}, polls: 4 })
        expect(duplicates([...first, ...rest])).toEqual([])
        expect([...first, ...rest]).toHaveLength(ties.length)
    }, 120_000)

    it('a large tie group that is not the whole window is carried in seen ids without loss or duplicates', async () => {
        const store = memoryStore()
        await newCompanyTrigger.onEnable(ctx({ store, propsValue: {} }))
        const lone = newId()
        create({ id: lone, at: tick() })
        const same = tick()
        const ties = Array.from({ length: 9_999 }, () => newId())
        ties.forEach((id) => create({ id, at: same }))
        const tail = Array.from({ length: 300 }, () => newId())
        tail.forEach((id) => create({ id, at: tick(10) }))
        let fired: string[] = []
        let peak = 0
        for (let i = 0; i < 5; i++) {
            fired = [...fired, ...ids(await newCompanyTrigger.run(ctx({ store, propsValue: {} })))]
            peak = Math.max(peak, store.data.get('hubspotSearchCursor')?.length ?? 0)
        }
        console.info(`[qa] peak hubspotSearchCursor bytes with a 9,999-id tie group: ${peak}`)
        expect(duplicates(fired)).toEqual([])
        expect(new Set(fired)).toEqual(new Set([lone, ...ties, ...tail]))
        expect(peak).toBeLessThan(512 * 1024)
    }, 120_000)
})

describe('QA round 2: property-change catch-up with more than 1,000 emitted changes', () => {
    it('a long catch-up (12,000 changes, 100 records edited again) loses no change; duplicates stay limited to records whose key was evicted', async () => {
        const store = memoryStore()
        Array.from({ length: 12_000 }, () => create({ id: newId(), at: tick(10) }))
        tick()
        await newCompanyPropertyChangeTrigger.onEnable(ctx({ store, propsValue: { propertyName: 'industry' } }))
        const all = crm.tables.companies.map((r) => r.id)
        all.forEach((id) => changeIndustry({ id, at: tick(10) }))
        const first = ids(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: { propertyName: 'industry' } })))
        expect(first.length).toBeLessThan(all.length)
        all.slice(0, 100).forEach((id) => {
            rec(id).properties.hs_lastmodifieddate = tick(10)
        })
        const rest = await drain({ trigger: newCompanyPropertyChangeTrigger, store, propsValue: { propertyName: 'industry' }, polls: 3 })
        const fired = [...first, ...rest]
        expect(new Set(fired)).toEqual(new Set(all))
        const dupes = duplicates(fired)
        console.info(`[qa] duplicates after 1,000-key eviction: ${dupes.length}`)
        expect(dupes.every((id) => all.slice(0, 100).includes(id))).toBe(true)
    }, 180_000)

    it('records re-edited during a catch-up fire once while their key is among the last 5,000 emitted', async () => {
        const store = memoryStore()
        Array.from({ length: 12_000 }, () => create({ id: newId(), at: tick(10) }))
        tick()
        await newCompanyPropertyChangeTrigger.onEnable(ctx({ store, propsValue: { propertyName: 'industry' } }))
        const all = crm.tables.companies.map((r) => r.id)
        all.forEach((id) => changeIndustry({ id, at: tick(10) }))
        const first = ids(await newCompanyPropertyChangeTrigger.run(ctx({ store, propsValue: { propertyName: 'industry' } })))
        expect(first.length).toBeGreaterThan(5_200)
        const reEdited = first.slice(first.length - 5_000 + 100, first.length - 5_000 + 200)
        reEdited.forEach((id) => {
            rec(id).properties.hs_lastmodifieddate = tick(10)
        })
        const rest = await drain({ trigger: newCompanyPropertyChangeTrigger, store, propsValue: { propertyName: 'industry' }, polls: 3 })
        const fired = [...first, ...rest]
        expect(new Set(fired)).toEqual(new Set(all))
        expect(duplicates(fired)).toEqual([])
        expect(store.data.get('hubspotSearchCursor')?.length ?? 0).toBeLessThan(512 * 1024)
    }, 180_000)
})
