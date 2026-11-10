import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { airtableFindRecordAction } from '../src/lib/actions/find-record'
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
    memoryStore,
    now,
    renameField,
    resetVendor,
    startFakeAirtable,
    tick,
} from './support/fake-airtable'
import { auth, findRecordContext, propertyContext, updatedRecordContext, updatedRecordTrigger as trigger } from './support/context'

function ctx({ store, sortFields = MOD_FIELD_ID, viewId, isRepublish }: { store: ReturnType<typeof memoryStore>['store'], sortFields?: string, viewId?: string, isRepublish?: boolean }) {
    return updatedRecordContext({ store, isRepublish, propsValue: { base: BASE_ID, tableId: TABLE_ID, sortFields, viewId } })
}

async function dropdownValue(label: string): Promise<string> {
    const state = await trigger.props.sortFields.options({ auth, base: BASE_ID, tableId: TABLE_ID }, propertyContext())
    const option = state.options.find((candidate) => candidate.label === label)
    if (!option) throw new Error(`no option ${label}`)
    return option.value
}

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

describe('Airtable New or Updated Record behaviour', () => {
    it('the Trigger Field dropdown saves the field id', async () => {
        expect(await dropdownValue('Last Modified')).toBe(MOD_FIELD_ID)
    })

    it('fires once per change across polls and a republish', async () => {
        addRecord({ id: 'recA' })
        addRecord({ id: 'recB' })
        tick()
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        expect(await trigger.run(ctx({ store }))).toEqual([])
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recA'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
        editRecord({ id: 'recB' })
        await trigger.onDisable(ctx({ store, isRepublish: true }))
        await trigger.onEnable(ctx({ store, isRepublish: true }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recB'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recA'])
    })

    it('fires a record edited later in the same second as enable', async () => {
        addRecord({ id: 'recA' })
        tick(60_300)
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        editRecord({ id: 'recA', at: tick(500) })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recA'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('fires a new record too', async () => {
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        addRecord({ id: 'recNew' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recNew'])
    })

    it('keeps firing after the Trigger Field column is renamed', async () => {
        addRecord({ id: 'recA' })
        const { store } = memoryStore()
        const sortFields = await dropdownValue('Last Modified')
        await trigger.onEnable(ctx({ store, sortFields }))
        renameField({ id: MOD_FIELD_ID, name: 'Last Edited' })
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store, sortFields })))).toEqual(['recA'])
        expect(await trigger.run(ctx({ store, sortFields }))).toEqual([])
    })

    it('a flow saved with the field name keeps working, and survives a later rename once it has polled', async () => {
        addRecord({ id: 'recA' })
        const { store } = memoryStore()
        await store.put('lastPoll', now())
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store, sortFields: 'Last Modified' })))).toEqual(['recA'])
        renameField({ id: MOD_FIELD_ID, name: 'Last Edited' })
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store, sortFields: 'Last Modified' })))).toEqual(['recA'])
    })

    it('a flow saved with the field name remembers the field at publish', async () => {
        addRecord({ id: 'recA' })
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, sortFields: 'Last Modified' }))
        renameField({ id: MOD_FIELD_ID, name: 'Edited At' })
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store, sortFields: 'Last Modified' })))).toEqual(['recA'])
    })

    it('fails with a clear message when the Trigger Field was deleted', async () => {
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        deleteField({ id: MOD_FIELD_ID })
        await expect(trigger.run(ctx({ store }))).rejects.toThrow(/Trigger Field "fldLastMod0000001" no longer exists.*pick Trigger Field again/)
    })

    it('fails with a clear message when a renamed field was saved by name and never polled', async () => {
        const { store } = memoryStore()
        renameField({ id: MOD_FIELD_ID, name: 'Last Edited' })
        await expect(trigger.run(ctx({ store, sortFields: 'Last Modified' }))).rejects.toThrow(/Trigger Field "Last Modified" no longer exists/)
    })

    it('rejects without touching the stored state when the schema call never answers', async () => {
        addRecord({ id: 'recA' })
        const { store, data } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        editRecord({ id: 'recA' })
        const before = new Map(data)
        const forwardFetch = globalThis.fetch
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => {
            if (!String(input).includes('/meta/bases/')) return forwardFetch(input, init)
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
            })
        })
        try {
            const pending = trigger.run(ctx({ store }))
            const outcome = expect(pending).rejects.toThrow(/Could not read the table's fields/)
            await vi.advanceTimersByTimeAsync(30_000)
            await outcome
            expect(data).toEqual(before)
        }
        finally {
            vi.useRealTimers()
            vi.stubGlobal('fetch', forwardFetch)
        }
    })

    it('pages through more than 100 changes between polls, each once', async () => {
        const created = Array.from({ length: 150 }, (_, index) => addRecord({ id: `recMany${String(index).padStart(6, '0')}` }))
        tick()
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        created.forEach((id) => editRecord({ id }))
        expect(ids(await trigger.run(ctx({ store })))).toEqual(created)
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('fires both records changed in the same second when they arrive in different polls', async () => {
        addRecord({ id: 'recA' })
        addRecord({ id: 'recB' })
        tick()
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        const sameTime = tick()
        editRecord({ id: 'recA', at: sameTime })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recA'])
        editRecord({ id: 'recB', at: sameTime })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recB'])
        expect(await trigger.run(ctx({ store }))).toEqual([])
    })

    it('does not re-send a record changed exactly at the checkpoint saved by the previous version', async () => {
        addRecord({ id: 'recA' })
        const at = tick()
        editRecord({ id: 'recA', at })
        const { store } = memoryStore()
        await store.put('lastPoll', at)
        expect(await trigger.run(ctx({ store }))).toEqual([])
        editRecord({ id: 'recA' })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recA'])
    })

    it('only fires for records in the selected view', async () => {
        addRecord({ id: 'recReady' })
        addRecord({ id: 'recDraft', status: 'Draft' })
        tick()
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId: VIEW_ID }))
        editRecord({ id: 'recReady' })
        editRecord({ id: 'recDraft' })
        expect(ids(await trigger.run(ctx({ store, viewId: VIEW_ID })))).toEqual(['recReady'])
    })

    it('test() returns the five most recently changed records, oldest to newest, on a table quiet for days', async () => {
        const created = Array.from({ length: 7 }, (_, index) => addRecord({ id: `recQuiet${index}` }))
        editRecord({ id: created[0] })
        tick(3 * 24 * 60 * 60 * 1000)
        const { store } = memoryStore()
        const sample = ids(await trigger.test(ctx({ store })))
        expect(sample).toEqual([created[3], created[4], created[5], created[6], created[0]])
    })
})

describe('Find Airtable Record search field', () => {
    const run = (searchField: string) => airtableFindRecordAction.run(findRecordContext({
        propsValue: { base: BASE_ID, tableId: TABLE_ID, searchField, searchValue: 'recFind', limitToView: undefined },
    }))

    it('finds by the field id saved by the dropdown, also after the column is renamed', async () => {
        addRecord({ id: 'recFind' })
        renameField({ id: NAME_FIELD_ID, name: 'Title' })
        expect(ids(await run(NAME_FIELD_ID))).toEqual(['recFind'])
    })

    it('still accepts a field name saved by an older flow', async () => {
        addRecord({ id: 'recFind' })
        expect(ids(await run('Name'))).toEqual(['recFind'])
    })
})
