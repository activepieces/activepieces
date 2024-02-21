import { Store, StoreScope } from '@activepieces/pieces-framework'
import { DeletStoreEntryRequest, FlowId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'

export const createStorageService = ({ workerToken }: { workerToken: string }) => {
    return {
        async get(key: string): Promise<StoreEntry | null> {
            const response = await fetch(`${EngineConstants.API_URL}v1/store-entries?key=${encodeURIComponent(key)}`, {
                headers: {
                    Authorization: 'Bearer ' + workerToken,
                },
            })

            if (response.ok) {
                return (await response.json()) ?? null
            }

            if (response.status === 404) {
                return null
            }

            throw new Error('Failed to fetch store entry')
        },
        async put(request: PutStoreEntryRequest): Promise<StoreEntry | null> {
            const response = await fetch(`${EngineConstants.API_URL}v1/store-entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + workerToken,
                },
                body: JSON.stringify(request),
            })
            if (!response.ok) {
                throw new Error(JSON.stringify(await response.json()))
            }
            return (await response.json()) ?? null
        },
        async delete(request: DeletStoreEntryRequest): Promise<StoreEntry | null> {
            const response = await fetch(`${EngineConstants.API_URL}v1/store-entries?key=${encodeURIComponent(request.key)}`, {
                method: 'DELETE',
                headers: {
                    Authorization: 'Bearer ' + workerToken,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to delete store entry')
            }
            await response.text()
            return null
        },
    }
}

export function createContextStore({ prefix, flowId, workerToken }: { prefix: string, flowId: FlowId, workerToken: string }): Store {
    return {
        async put<T>(key: string, value: T, scope = StoreScope.FLOW): Promise<T> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await createStorageService({ workerToken }).put({
                key: modifiedKey,
                value,
            })
            return value
        },
        async delete(key: string, scope = StoreScope.FLOW): Promise<void> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await createStorageService({ workerToken }).delete({
                key: modifiedKey,
            })
        },
        async get<T>(key: string, scope = StoreScope.FLOW): Promise<T | null> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            const storeEntry = await createStorageService({ workerToken }).get(modifiedKey)
            if (storeEntry === null) {
                return null
            }
            return storeEntry.value as T
        },
    }
}

function createKey(prefix: string, scope: StoreScope, flowId: FlowId, key: string): string {
    switch (scope) {
        case StoreScope.PROJECT:
            return prefix + key
        case StoreScope.FLOW:
            return prefix + 'flow_' + flowId + '/' + key
    }
}
