import http from 'node:http'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { airtableFindRecordAction } from '../src/lib/actions/find-record'
import { newRecordTriggerOutputSchema, updatedRecordTriggerOutputSchema } from '../src/lib/output-schemas'
import {
    BASE_ID,
    MOD_FIELD_ID,
    NAME_FIELD_ID,
    TABLE_ID,
    VIEW_ID,
    addRecord,
    deleteField,
    editRecord,
    ids,
    installClock,
    keysOf,
    memoryStore,
    portOf,
    renameField,
    resetVendor,
    startFakeAirtable,
    tick,
    vendor,
} from './support/fake-airtable'
import { findRecordContext, newRecordContext, newRecordTrigger as newRecord, updatedRecordContext, updatedRecordTrigger as updated } from './support/context'

type Store = ReturnType<typeof memoryStore>['store']
function newCtx({ store, viewId, isRepublish }: { store: Store, viewId?: string, isRepublish?: boolean }) {
    return newRecordContext({ store, isRepublish, propsValue: { base: BASE_ID, tableId: TABLE_ID, viewId } })
}

function updCtx({ store, sortFields = MOD_FIELD_ID, viewId }: { store: Store, sortFields?: string, viewId?: string }) {
    return updatedRecordContext({ store, propsValue: { base: BASE_ID, tableId: TABLE_ID, sortFields, viewId } })
}

function findRecord({ searchField, searchValue }: { searchField: string, searchValue: string }) {
    return airtableFindRecordAction.run(findRecordContext({
        propsValue: { base: BASE_ID, tableId: TABLE_ID, searchField, searchValue, limitToView: undefined },
    }))
}

function storedState({ data }: { data: Map<string, string> }): { floor: number, seen: [string, number][] } {
    return JSON.parse(data.get('new_record_state') ?? '{}')
}

const DAY = 24 * 60 * 60 * 1000
let stop: () => Promise<void>

beforeAll(async () => {
    stop = await startFakeAirtable()
})

afterAll(async () => {
    await stop()
})

beforeEach(() => {
    resetVendor()
    installClock()
})

afterEach(() => {
    vi.mocked(Date.now).mockRestore()
})

describe('QA probes: New Record', () => {
    it('emitted-id cap: evicted ids never re-fire, later entrants still fire, the oldest pending entrant is dropped (documented trade-off)', async () => {
        const { store, data } = memoryStore()
        await newRecord.onEnable(newCtx({ store, viewId: VIEW_ID }))
        addRecord({ id: 'recEarlyDraft', status: 'Draft' })
        const first = Array.from({ length: 1000 }, (_, index) => addRecord({ id: `recCap${String(index).padStart(6, '0')}` }))
        expect(ids(await newRecord.run(newCtx({ store, viewId: VIEW_ID })))).toEqual(first)
        addRecord({ id: 'recOverflow' })
        addRecord({ id: 'recLateDraft', status: 'Draft' })
        expect(ids(await newRecord.run(newCtx({ store, viewId: VIEW_ID })))).toEqual(['recOverflow'])
        const state = storedState({ data })
        expect(state.seen.length).toBe(1000)
        expect(state.seen.map(([id]) => id)).not.toContain(first[0])
        expect(await newRecord.run(newCtx({ store, viewId: VIEW_ID }))).toEqual([])
        editRecord({ id: 'recLateDraft', status: 'Ready' })
        editRecord({ id: 'recEarlyDraft', status: 'Ready' })
        expect(ids(await newRecord.run(newCtx({ store, viewId: VIEW_ID })))).toEqual(['recLateDraft'])
    })

    it('a record enters the view after several polls spread over days and fires once', async () => {
        const { store } = memoryStore()
        await newRecord.onEnable(newCtx({ store, viewId: VIEW_ID }))
        addRecord({ id: 'recSlow', status: 'Draft' })
        for (let poll = 0; poll < 3; poll += 1) {
            expect(await newRecord.run(newCtx({ store, viewId: VIEW_ID }))).toEqual([])
            tick(DAY)
        }
        editRecord({ id: 'recSlow', status: 'Ready' })
        expect(ids(await newRecord.run(newCtx({ store, viewId: VIEW_ID })))).toEqual(['recSlow'])
        expect(await newRecord.run(newCtx({ store, viewId: VIEW_ID }))).toEqual([])
    })

    it('records that exist before enable never fire, with or without a view, across many polls', async () => {
        addRecord({ id: 'recPre1' })
        addRecord({ id: 'recPre2', status: 'Draft' })
        tick()
        for (const viewId of [undefined, VIEW_ID]) {
            const { store } = memoryStore()
            await newRecord.onEnable(newCtx({ store, viewId }))
            editRecord({ id: 'recPre2', status: 'Ready' })
            expect(await newRecord.run(newCtx({ store, viewId }))).toEqual([])
            tick(DAY)
            expect(await newRecord.run(newCtx({ store, viewId }))).toEqual([])
            editRecord({ id: 'recPre2', status: 'Draft' })
        }
    })

    it('without a view, a poll after 11 quiet minutes does not re-fire records inside the old overlap', async () => {
        const { store } = memoryStore()
        await newRecord.onEnable(newCtx({ store }))
        addRecord({ id: 'recX' })
        expect(ids(await newRecord.run(newCtx({ store })))).toEqual(['recX'])
        tick(11 * 60 * 1000)
        expect(await newRecord.run(newCtx({ store }))).toEqual([])
        addRecord({ id: 'recY' })
        expect(ids(await newRecord.run(newCtx({ store })))).toEqual(['recY'])
    })

    it('test() and run() return the same keys, all present in the output schema', async () => {
        const { store } = memoryStore()
        await newRecord.onEnable(newCtx({ store }))
        addRecord({ id: 'recShape' })
        const [fromRun] = await newRecord.run(newCtx({ store }))
        const [fromTest] = await newRecord.test(newCtx({ store }))
        expect(keysOf(fromRun)).toEqual(keysOf(fromTest))
        expect(keysOf(fromRun)).toEqual(newRecordTriggerOutputSchema.fields.map((field) => field.key).sort())
    })

    it('a failed list request throws and leaves the state alone, so the record fires on the next poll', async () => {
        const { store, data } = memoryStore()
        await newRecord.onEnable(newCtx({ store }))
        addRecord({ id: 'recAfterOutage' })
        const before = data.get('new_record_state')
        const restore = await failingEndpoint()
        await expect(newRecord.run(newCtx({ store }))).rejects.toThrow()
        restore()
        expect(data.get('new_record_state')).toBe(before)
        expect(ids(await newRecord.run(newCtx({ store })))).toEqual(['recAfterOutage'])
    })
})

describe('QA probes: New or Updated Record', () => {
    it('a field name with quotes and apostrophes is used as-is inside the braces', async () => {
        addRecord({ id: 'recQ' })
        tick()
        const { store } = memoryStore()
        await updated.onEnable(updCtx({ store }))
        renameField({ id: MOD_FIELD_ID, name: 'Mod "at" it\'s' })
        editRecord({ id: 'recQ' })
        expect(ids(await updated.run(updCtx({ store })))).toEqual(['recQ'])
        const formulas = vendor.requests.map((url) => url.searchParams.get('filterByFormula')).filter(Boolean)
        expect(formulas.at(-1)).toMatch(/^IS_AFTER\(\{Mod "at" it's\},/)
    })

    it('a field renamed to contain braces fails with a clear message instead of an injected formula', async () => {
        const { store } = memoryStore()
        await updated.onEnable(updCtx({ store }))
        renameField({ id: MOD_FIELD_ID, name: 'Mod},TRUE(),{x' })
        await expect(updated.run(updCtx({ store }))).rejects.toThrow(/contains "\{" or "\}"/)
        const formulas = vendor.requests.map((url) => url.searchParams.get('filterByFormula')).filter(Boolean)
        expect(formulas.some((formula) => formula?.includes('TRUE()'))).toBe(false)
    })

    it('rename then delete: the rename keeps firing, the delete fails with a pick-again message', async () => {
        addRecord({ id: 'recR' })
        tick()
        const { store } = memoryStore()
        await updated.onEnable(updCtx({ store }))
        renameField({ id: MOD_FIELD_ID, name: 'Edited' })
        editRecord({ id: 'recR' })
        expect(ids(await updated.run(updCtx({ store })))).toEqual(['recR'])
        deleteField({ id: MOD_FIELD_ID })
        await expect(updated.run(updCtx({ store }))).rejects.toThrow(/no longer exists in table "Tasks".*pick Trigger Field again/)
    })

    it('legacy saved name: remembered at publish, rename keeps working, then delete fails clearly', async () => {
        addRecord({ id: 'recL' })
        tick()
        const { store } = memoryStore()
        await updated.onEnable(updCtx({ store, sortFields: 'Last Modified' }))
        renameField({ id: MOD_FIELD_ID, name: 'Edited' })
        editRecord({ id: 'recL' })
        expect(ids(await updated.run(updCtx({ store, sortFields: 'Last Modified' })))).toEqual(['recL'])
        deleteField({ id: MOD_FIELD_ID })
        await expect(updated.run(updCtx({ store, sortFields: 'Last Modified' }))).rejects.toThrow(/Trigger Field "Last Modified" no longer exists/)
    })

    it('a legacy saved name still works when the token cannot read the schema', async () => {
        addRecord({ id: 'recS' })
        tick()
        const { store } = memoryStore()
        const restore = blockMetaApi()
        try {
            await updated.onEnable(updCtx({ store, sortFields: 'Last Modified' }))
            editRecord({ id: 'recS' })
            expect(ids(await updated.run(updCtx({ store, sortFields: 'Last Modified' })))).toEqual(['recS'])
            await expect(updated.run(updCtx({ store, sortFields: 'fldLastModified01' }))).rejects.toThrow(/schema\.bases:read/)
        }
        finally {
            restore()
        }
    })

    it('test() and run() return the same keys, all present in the output schema; test() skips rows with an empty Trigger Field', async () => {
        addRecord({ id: 'recShape' })
        tick()
        const { store } = memoryStore()
        await updated.onEnable(updCtx({ store }))
        editRecord({ id: 'recShape' })
        const [fromRun] = await updated.run(updCtx({ store }))
        const [fromTest] = await updated.test(updCtx({ store }))
        expect(keysOf(fromRun)).toEqual(keysOf(fromTest))
        expect(keysOf(fromRun)).toEqual(updatedRecordTriggerOutputSchema.fields.map((field) => field.key).sort())
        vendor.records.forEach((record) => { delete record.values[MOD_FIELD_ID] })
        expect(await updated.test(updCtx({ store }))).toEqual([])
    })

    it('a failed list request throws and leaves the checkpoint alone', async () => {
        addRecord({ id: 'recO' })
        tick()
        const { store, data } = memoryStore()
        await updated.onEnable(updCtx({ store }))
        editRecord({ id: 'recO' })
        const before = data.get('updated_record_state')
        const restore = await failingEndpoint()
        await expect(updated.run(updCtx({ store }))).rejects.toThrow()
        restore()
        expect(data.get('updated_record_state')).toBe(before)
        expect(ids(await updated.run(updCtx({ store })))).toEqual(['recO'])
    })
})

describe('QA probes: Find Airtable Record', () => {
    it('an old flow with a saved field name finds the record, also when the schema cannot be read', async () => {
        addRecord({ id: 'recFindMe' })
        vendor.requests = []
        expect(ids(await findRecord({ searchField: 'Name', searchValue: 'recFindMe' }))).toEqual(['recFindMe'])
        expect(vendor.requests.filter((url) => url.pathname.includes('/meta/bases/'))).toHaveLength(0)
        const restore = blockMetaApi()
        try {
            expect(ids(await findRecord({ searchField: 'Name', searchValue: 'recFindMe' }))).toEqual(['recFindMe'])
        }
        finally {
            restore()
        }
    })

    it('a search field renamed to contain a brace fails clearly; a search value with quotes is escaped', async () => {
        addRecord({ id: 'recFindMe' })
        renameField({ id: NAME_FIELD_ID, name: 'Ti}tle' })
        await expect(findRecord({ searchField: NAME_FIELD_ID, searchValue: 'x' })).rejects.toThrow(/must not contain/)
        renameField({ id: NAME_FIELD_ID, name: 'Title "quoted"' })
        await findRecord({ searchField: NAME_FIELD_ID, searchValue: 'a"b' })
        const formulas = vendor.requests.map((url) => url.searchParams.get('filterByFormula')).filter(Boolean)
        expect(formulas.at(-1)).toBe('FIND("a\\"b",{Title "quoted"})')
    })

    it('a deleted search field fails with a pick-again message', async () => {
        deleteField({ id: NAME_FIELD_ID })
        await expect(findRecord({ searchField: NAME_FIELD_ID, searchValue: 'x' })).rejects.toThrow(/Search Field "fldName0000000001" no longer exists/)
    })
})

function blockMetaApi(): () => void {
    const previous = globalThis.fetch
    vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => {
        if (String(input).includes('/v0/meta/')) {
            return Promise.resolve(new Response(JSON.stringify({ error: { type: 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND' } }), { status: 403, headers: { 'content-type': 'application/json' } }))
        }
        return previous(input, init)
    })
    return () => vi.stubGlobal('fetch', previous)
}

async function failingEndpoint(): Promise<() => void> {
    const server = http.createServer((_req, res) => {
        res.writeHead(500, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: { type: 'SERVER_ERROR' } }))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const previous = process.env.AIRTABLE_ENDPOINT_URL
    process.env.AIRTABLE_ENDPOINT_URL = `http://127.0.0.1:${portOf({ server })}`
    return () => {
        process.env.AIRTABLE_ENDPOINT_URL = previous
        server.closeAllConnections()
        server.close()
    }
}
