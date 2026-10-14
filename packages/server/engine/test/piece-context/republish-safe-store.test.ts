import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common'
import { Store, StoreScope } from '@activepieces/pieces-framework'
import { createRepublishSafeStore } from '../../src/lib/piece-context/store'

function fakeStore(initial: Record<string, unknown> = {}): Store {
    const data: Record<string, unknown> = { ...initial }
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

describe('createRepublishSafeStore', () => {
    it('keeps the existing value when a key is already set', async () => {
        const store = fakeStore({ [`${StoreScope.FLOW}:lastPoll`]: 1000 })
        const result = await createRepublishSafeStore(store).put('lastPoll', 2000)
        expect(result).toBe(1000)
        expect(await store.get('lastPoll')).toBe(1000)
    })

    it('writes a key that is not set yet', async () => {
        const store = fakeStore()
        await createRepublishSafeStore(store).put('lastPoll', 2000)
        expect(await store.get('lastPoll')).toBe(2000)
    })

    it('ignores deletes', async () => {
        const store = fakeStore({ [`${StoreScope.FLOW}:lastPoll`]: 1000 })
        await createRepublishSafeStore(store).delete('lastPoll')
        expect(await store.get('lastPoll')).toBe(1000)
    })

    it('checks existence in the scope being written', async () => {
        const store = fakeStore({ [`${StoreScope.FLOW}:lastPoll`]: 1000 })
        await createRepublishSafeStore(store).put('lastPoll', 2000, StoreScope.PROJECT)
        expect(await store.get('lastPoll', StoreScope.PROJECT)).toBe(2000)
    })

    it('keeps the polling checkpoint when a piece drops isRepublish from the helper call', async () => {
        const timebased: Polling<undefined, unknown> = { strategy: DedupeStrategy.TIMEBASED, items: async () => [] }
        const lastItem: Polling<undefined, unknown> = { strategy: DedupeStrategy.LAST_ITEM, items: async () => [{ id: 'newest', data: {} }] }
        const store = fakeStore({ [`${StoreScope.FLOW}:lastPoll`]: 1000, [`${StoreScope.FLOW}:lastItem`]: 'previous' })
        const safeStore = createRepublishSafeStore(store)

        await pollingHelper.onEnable(timebased, { store: safeStore, auth: undefined, propsValue: {} })
        await pollingHelper.onEnable(lastItem, { store: safeStore, auth: undefined, propsValue: {} })

        expect(await store.get('lastPoll')).toBe(1000)
        expect(await store.get('lastItem')).toBe('previous')
    })
})
