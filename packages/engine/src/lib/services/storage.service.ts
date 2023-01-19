import axios from 'axios';
import { Store } from '@activepieces/pieces';
import { PutStoreEntryRequest, StoreEntry } from '@activepieces/shared';
import { globals } from '../globals';

export const storageService = {
    async get(key: string): Promise<StoreEntry | null> {
        try {
            return (
                await axios.get(globals.apiUrl + '/v1/store-entries?key=' + key, {
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
    }

}
export function createContextStore(): Store {
    return {
      save: async function <T>(key: string, value: T): Promise<T> {
        const storeEntry = await storageService.put({
          key: key,
          value: value,
        });
        return value;
      },
      get: async function <T>(key: string): Promise<T | null> {
        const storeEntry = await storageService.get(key);
        if (storeEntry === null) {
          return null;
        }
        return storeEntry.value as T;
      },
    };
  }
