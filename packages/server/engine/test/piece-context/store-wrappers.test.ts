import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common'
import { Store, StoreScope } from '@activepieces/pieces-framework'
import { createNoOverwriteStore, createReadOnlyStore } from '../../src/lib/piece-context/store'

function fakeStore(initial: Record<string, unknown> = {}): Store {
    const data: Record<string, unknown> = Object.fromEntries(
        Object.entries(initial).map(([key, value]) => [`${StoreScope.FLOW}:${key}`, value]),
    )
    return {
        async put<T>(key: string, value: T, scope = StoreScope.FLOW): Promise<T> {
            data[`${scope}:${key}`] = value
            return value
        },
        async get<T>(key: string, scope = StoreScope.FLOW): Promise<T | null> {
            return (data[`${scope}:${key}`] as T) ?? null
        },
        async delete(key: string, scope = StoreScope.FLOW): Promise<void> {
            delete data[`${scope}:${key}`]
        },
    }
}

describe('createReadOnlyStore', () => {
    it('reads through to the underlying store', async () => {
        const store = fakeStore({ lastPoll: 1000 })
        expect(await createReadOnlyStore(store).get('lastPoll')).toBe(1000)
    })

    it('ignores writes', async () => {
        const store = fakeStore({ lastPoll: 1000 })
        await createReadOnlyStore(store).put('lastPoll', 2000)
        await createReadOnlyStore(store).put('newKey', 'value')
        expect(await store.get('lastPoll')).toBe(1000)
        expect(await store.get('newKey')).toBeNull()
    })

    it('ignores deletes', async () => {
        const store = fakeStore({ lastPoll: 1000 })
        await createReadOnlyStore(store).delete('lastPoll')
        expect(await store.get('lastPoll')).toBe(1000)
    })
})

describe('createNoOverwriteStore', () => {
    it('keeps the existing value when a key is already set', async () => {
        const store = fakeStore({ lastPoll: 1000 })
        const result = await createNoOverwriteStore(store).put('lastPoll', 2000)
        expect(result).toBe(1000)
        expect(await store.get('lastPoll')).toBe(1000)
    })

    it('writes a key that is not set yet', async () => {
        const store = fakeStore()
        await createNoOverwriteStore(store).put('lastPoll', 2000)
        expect(await store.get('lastPoll')).toBe(2000)
    })

    it('checks existence in the scope being written', async () => {
        const store = fakeStore({ lastPoll: 1000 })
        await createNoOverwriteStore(store).put('lastPoll', 2000, StoreScope.PROJECT)
        expect(await store.get('lastPoll', StoreScope.PROJECT)).toBe(2000)
    })

    it('lets a deliberate delete through, so a cache can be refreshed', async () => {
        const store = fakeStore({ zoho_poll_fields: ['Name'] })
        await createNoOverwriteStore(store).delete('zoho_poll_fields')
        expect(await store.get('zoho_poll_fields')).toBeNull()
    })

    it('keeps the polling checkpoint when a piece drops isRepublish from the helper call', async () => {
        const timebased: Polling<undefined, unknown> = { strategy: DedupeStrategy.TIMEBASED, items: async () => [] }
        const lastItem: Polling<undefined, unknown> = { strategy: DedupeStrategy.LAST_ITEM, items: async () => [{ id: 'newest', data: {} }] }
        const store = fakeStore({ lastPoll: 1000, lastItem: 'previous' })
        const noOverwriteStore = createNoOverwriteStore(store)

        await pollingHelper.onEnable(timebased, { store: noOverwriteStore, auth: undefined, propsValue: {} })
        await pollingHelper.onEnable(lastItem, { store: noOverwriteStore, auth: undefined, propsValue: {} })

        expect(await store.get('lastPoll')).toBe(1000)
        expect(await store.get('lastItem')).toBe('previous')
    })
})

describe('republish sequence', () => {
    it('keeps state that the old version clears on disable and the new version re-seeds on enable', async () => {
        const store = fakeStore({ _seenVideoIds: ['v1', 'v2'] })

        await createReadOnlyStore(store).delete('_seenVideoIds')
        await createNoOverwriteStore(store).put('_seenVideoIds', ['v1', 'v2', 'v3'])

        expect(await store.get('_seenVideoIds')).toEqual(['v1', 'v2'])
    })
})
