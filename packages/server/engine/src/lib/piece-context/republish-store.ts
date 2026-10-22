import { isNil } from '@activepieces/core-utils'
import { Store, StoreScope, TriggerStrategy } from '@activepieces/pieces-framework'

export const republishStore = {
    forOnEnable({ store, isRepublish, triggerType }: RepublishStoreParams): Store {
        return keepsPollingCheckpoint({ isRepublish, triggerType }) ? keepExistingEntries(store) : store
    },
    forOnDisable({ store, isRepublish, triggerType }: RepublishStoreParams): Store {
        return keepsPollingCheckpoint({ isRepublish, triggerType }) ? withoutDeletes(store) : store
    },
}

function keepsPollingCheckpoint({ isRepublish, triggerType }: Omit<RepublishStoreParams, 'store'>): boolean {
    return isRepublish === true && triggerType === TriggerStrategy.POLLING
}

function withoutDeletes(store: Store): Store {
    return {
        put: (key, value, scope) => store.put(key, value, scope),
        get: (key, scope) => store.get(key, scope),
        async delete(): Promise<void> {
        },
    }
}

function keepExistingEntries(store: Store): Store {
    return {
        async put<T>(key: string, value: T, scope?: StoreScope): Promise<T> {
            const existing = await store.get<T>(key, scope)
            if (!isNil(existing)) {
                return existing
            }
            return store.put(key, value, scope)
        },
        get: (key, scope) => store.get(key, scope),
        delete: (key, scope) => store.delete(key, scope),
    }
}

type RepublishStoreParams = {
    store: Store
    isRepublish: boolean | undefined
    triggerType: TriggerStrategy
}
