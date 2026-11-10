import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    BASE_ID,
    TABLE_ID,
    VIEW_ID,
    addRecord,
    editRecord,
    ids,
    installClock,
    memoryStore,
    now,
    resetVendor,
    startFakeAirtable,
    tick,
} from './support/fake-airtable'
import { newRecordContext, newRecordTrigger as trigger } from './support/context'

function ctx({ store, viewId, isRepublish }: { store: ReturnType<typeof memoryStore>['store'], viewId?: string, isRepublish?: boolean }) {
    return newRecordContext({ store, isRepublish, propsValue: { base: BASE_ID, tableId: TABLE_ID, viewId } })
}

function storedState({ data }: { data: Map<string, string> }): { seen: unknown[] } {
    return JSON.parse(data.get('new_record_state') ?? '{}')
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

describe.each([
    { label: 'whole table', viewId: undefined },
    { label: 'with a view', viewId: VIEW_ID },
])('Airtable New Record behaviour ($label)', ({ viewId }) => {
    it('fires once per new record across polls and a republish, never for records that existed at enable', async () => {
        addRecord({ id: 'recOld1' })
        addRecord({ id: 'recOld2' })
        const { store } = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store, viewId }))
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
        addRecord({ id: 'recNew1' })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recNew1'])
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
        addRecord({ id: 'recBetween' })
        await trigger.onDisable(ctx({ store, viewId, isRepublish: true }))
        await trigger.onEnable(ctx({ store, viewId, isRepublish: true }))
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recBetween'])
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
        addRecord({ id: 'recNew2' })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recNew2'])
    })

    it('does not fire when an existing record is edited', async () => {
        addRecord({ id: 'recOld' })
        const { store } = memoryStore()
        tick()
        await trigger.onEnable(ctx({ store, viewId }))
        editRecord({ id: 'recOld' })
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
    })

    it('pages through more than 100 records created between polls, each once', async () => {
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId }))
        const burst = Array.from({ length: 150 }, (_, index) => addRecord({ id: `recBurst${String(index).padStart(6, '0')}` }))
        const fired = ids(await trigger.run(ctx({ store, viewId })))
        expect(fired).toEqual(burst)
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
    })

    it('fires both records that share a creation time when they show up in different polls', async () => {
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId }))
        const sameTime = tick()
        addRecord({ id: 'recTieA', at: sameTime })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recTieA'])
        addRecord({ id: 'recTieB', at: sameTime })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recTieB'])
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
    })

    it('keeps working on the state saved by the previous version (lastPoll)', async () => {
        const { store } = memoryStore()
        addRecord({ id: 'recBefore' })
        await store.put('lastPoll', now())
        addRecord({ id: 'recAfter' })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recAfter'])
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
    })

    it('test() returns the newest records oldest to newest, newest last, even when the table has been quiet for days', async () => {
        addRecord({ id: 'recOldest' })
        addRecord({ id: 'recMiddle' })
        addRecord({ id: 'recNewest' })
        tick(3 * 24 * 60 * 60 * 1000)
        const { store } = memoryStore()
        const sample = ids(await trigger.test(ctx({ store, viewId })))
        expect(sample).toEqual(['recOldest', 'recMiddle', 'recNewest'])
    })

    it('test() returns at most five records, oldest to newest with the newest last', async () => {
        const created = Array.from({ length: 8 }, (_, index) => addRecord({ id: `recSample${index}` }))
        const { store } = memoryStore()
        const sample = ids(await trigger.test(ctx({ store, viewId })))
        expect(sample).toEqual(created.slice(-5))
    })
})

describe('Airtable New Record: enable and record in the same second', () => {
    it.each([undefined, VIEW_ID])('fires a record created later in the same second as enable (view %s)', async (viewId) => {
        tick(300)
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId }))
        addRecord({ id: 'recSameSecond', at: tick(500) })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recSameSecond'])
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
    })

    it.each([undefined, VIEW_ID])('does not fire a record created earlier in the same second as enable (view %s)', async (viewId) => {
        addRecord({ id: 'recBefore', at: tick(100) })
        addRecord({ id: 'recBeforeDraft', status: 'Draft', at: tick(100) })
        tick(500)
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId }))
        addRecord({ id: 'recAfter', at: tick(200) })
        editRecord({ id: 'recBeforeDraft', status: 'Ready' })
        expect(ids(await trigger.run(ctx({ store, viewId })))).toEqual(['recAfter'])
        expect(await trigger.run(ctx({ store, viewId }))).toEqual([])
    })
})

describe('Airtable New Record without a view: large imports', () => {
    it('keeps the saved state well under the store limit and still fires every record once', async () => {
        const { store, data } = memoryStore()
        await trigger.onEnable(ctx({ store }))
        Array.from({ length: 6000 }, (_, index) => addRecord({ id: `recBulk${String(index).padStart(10, '0')}`, at: tick(10) }))
        expect(await trigger.run(ctx({ store }))).toHaveLength(6000)
        const saved = data.get('new_record_state') ?? ''
        expect(storedState({ data }).seen.length).toBeLessThanOrEqual(5000)
        expect(saved.length).toBeLessThan(256 * 1024)
        expect(await trigger.run(ctx({ store }))).toEqual([])
        addRecord({ id: 'recAfterBulk', at: tick(1000) })
        expect(ids(await trigger.run(ctx({ store })))).toEqual(['recAfterBulk'])
    })
})

describe('Airtable New Record with a view: late view entrants', () => {
    it('fires a record created after enable when it enters the view later, once, even after newer records fired', async () => {
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId: VIEW_ID }))
        addRecord({ id: 'recDraft', status: 'Draft' })
        addRecord({ id: 'recReady' })
        expect(ids(await trigger.run(ctx({ store, viewId: VIEW_ID })))).toEqual(['recReady'])
        editRecord({ id: 'recDraft', status: 'Ready' })
        expect(ids(await trigger.run(ctx({ store, viewId: VIEW_ID })))).toEqual(['recDraft'])
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toEqual([])
        await trigger.onDisable(ctx({ store, viewId: VIEW_ID, isRepublish: true }))
        await trigger.onEnable(ctx({ store, viewId: VIEW_ID, isRepublish: true }))
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toEqual([])
    })

    it('does not fire a record that existed before enable when it enters the view', async () => {
        addRecord({ id: 'recOldDraft', status: 'Draft' })
        tick()
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId: VIEW_ID }))
        editRecord({ id: 'recOldDraft', status: 'Ready' })
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toEqual([])
    })

    it('does not re-fire a record that leaves the view and comes back', async () => {
        const { store } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId: VIEW_ID }))
        addRecord({ id: 'recBounce' })
        expect(ids(await trigger.run(ctx({ store, viewId: VIEW_ID })))).toEqual(['recBounce'])
        editRecord({ id: 'recBounce', status: 'Draft' })
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toEqual([])
        editRecord({ id: 'recBounce', status: 'Ready' })
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toEqual([])
    })

    it('keeps the remembered ids bounded', async () => {
        const { store, data } = memoryStore()
        await trigger.onEnable(ctx({ store, viewId: VIEW_ID }))
        Array.from({ length: 1100 }, (_, index) => addRecord({ id: `recMany${String(index).padStart(6, '0')}` }))
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toHaveLength(1100)
        const state = storedState({ data })
        expect(state.seen.length).toBeLessThanOrEqual(1000)
        expect(await trigger.run(ctx({ store, viewId: VIEW_ID }))).toEqual([])
    })
})
