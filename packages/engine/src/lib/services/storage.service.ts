import axios from 'axios';
import { Store, StoreScope } from '@activepieces/pieces-framework';
import { DeletStoreEntryRequest, FlowId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared';
import { globals } from '../globals';

export const storageService = {
    async get(key: string): Promise<StoreEntry | null> {
        try {
            return (
                await axios.get(globals.apiUrl + '/v1/store-entries?key=' + encodeURIComponent(key), {
                    headers: {
                        Authorization: 'Bearer ' + globals.workerToken
                    }
                })
            ).data ?? null;;
        } catch (e) {
            return null;
        }
    },
    async put(request: PutStoreEntryRequest): Promise<StoreEntry | null> {
        try {
            return (
                await axios.post(globals.apiUrl + '/v1/store-entries', request, {
                    headers: {
                        Authorization: 'Bearer ' + globals.workerToken
                    }
                })
            ).data ?? null;;
        } catch (e) {
            return null;
        }
    },
    async delete(request: DeletStoreEntryRequest): Promise<StoreEntry | null> {
        try {
            return (
                await axios.delete(globals.apiUrl + '/v1/store-entries?key=' + encodeURIComponent(request.key), {
                    headers: {
                        Authorization: 'Bearer ' + globals.workerToken
                    }
                })
            ).data ?? null;;
        } catch (e) {
            return null;
        }
    }

}
export function createContextStore(prefix: string, flowId: FlowId): Store {
    return {
        put: async function <T>(key: string, value: T, scope = StoreScope.FLOW): Promise<T> {
            const modifiedKey = createKey(prefix, scope, flowId, key);
            await storageService.put({
                key: modifiedKey,
                value: value,
            });
            return value;
        },
        delete: async function (key: string, scope = StoreScope.FLOW): Promise<void> {
            const modifiedKey = createKey(prefix, scope, flowId, key);
            await storageService.delete({
                key: modifiedKey,
            });
        },
        get: async function <T>(key: string, scope = StoreScope.FLOW): Promise<T | null> {
            const modifiedKey = createKey(prefix, scope, flowId, key);
            const storeEntry = await storageService.get(modifiedKey);
            if (storeEntry === null) {
                // TODO remove in three months (May) as old triggers are storing as collection, while it should store as flow
                if (scope === StoreScope.FLOW) {
                    return this.get(key, StoreScope.PROJECT);
                }
                return null;
            }
            return storeEntry.value as T;
        },
    };
}

function createKey(prefix: string, scope: StoreScope, flowId: FlowId, key: string): string {
    switch (scope) {
        case StoreScope.PROJECT:
            return prefix + key;
        case StoreScope.FLOW:
            return prefix + "flow_" + flowId + "/" + key;
    }
}
