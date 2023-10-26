import { Store, StoreScope } from '@activepieces/pieces-framework'
import { DeletStoreEntryRequest, FlowId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
import { globals } from '../globals'

export const storageService = {
    async get(key: string): Promise<StoreEntry | null> {
        const response = await fetch(globals.apiUrl + 'v1/store-entries?key=' + encodeURIComponent(key), {
            headers: {
                Authorization: 'Bearer ' + globals.workerToken,
            },
        })
        if (!response.ok) {
            throw new Error('Failed to fetch store entry')
        }
        return (await response.json()) ?? null
    },
    async put(request: PutStoreEntryRequest): Promise<StoreEntry | null> {
        const response = await fetch(globals.apiUrl + 'v1/store-entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + globals.workerToken,
            },
            body: JSON.stringify(request),
        })
        if (!response.ok) {
            throw new Error('Failed to store entry')
        }
        return (await response.json()) ?? null
    },
    async delete(request: DeletStoreEntryRequest): Promise<StoreEntry | null> {
        const response = await fetch(globals.apiUrl + 'v1/store-entries?key=' + encodeURIComponent(request.key), {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer ' + globals.workerToken,
            },
        })
        if (!response.ok) {
            throw new Error('Failed to delete store entry')
        }
        await response.text()
        return null
    },
}

export function createContextStore(prefix: string, flowId: FlowId): Store {
    return {
        async put <T>(key: string, value: T, scope = StoreScope.FLOW): Promise<T> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await storageService.put({
                key: modifiedKey,
                value,
            })
            return value
        },
        async delete(key: string, scope = StoreScope.FLOW): Promise<void> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await storageService.delete({
                key: modifiedKey,
            })
        },
        async get <T>(key: string, scope = StoreScope.FLOW): Promise<T | null> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            const storeEntry = await storageService.get(modifiedKey)
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
