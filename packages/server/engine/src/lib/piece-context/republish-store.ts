import { Store, TriggerStrategy } from '@activepieces/pieces-framework'

export const republishStore = {
    forLifecycleHook({ store, isRepublish, triggerType }: RepublishStoreParams): Store {
        const keepsPollingState = isRepublish === true && triggerType === TriggerStrategy.POLLING
        return keepsPollingState ? readOnly(store) : store
    },
}

function readOnly(store: Store): Store {
    return {
        get: (key, scope) => store.get(key, scope),
        async put<T>(_key: string, value: T): Promise<T> {
            return value
        },
        async delete(): Promise<void> {
        },
    }
}

type RepublishStoreParams = {
    store: Store
    isRepublish: boolean | undefined
    triggerType: TriggerStrategy
}
