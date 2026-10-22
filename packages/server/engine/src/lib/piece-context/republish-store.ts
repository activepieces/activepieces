import { isNil } from '@activepieces/core-utils'
import { Store, StoreScope, TriggerStrategy } from '@activepieces/pieces-framework'

export const republishStore = {
    forOnEnable({ store, isRepublish, triggerType }: ForOnEnableParams): Store {
        const keepsPollingCheckpoint = isRepublish === true && triggerType === TriggerStrategy.POLLING
        return keepsPollingCheckpoint ? keepExistingEntries(store) : store
    },
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

type ForOnEnableParams = {
    store: Store
    isRepublish: boolean | undefined
    triggerType: TriggerStrategy
}
