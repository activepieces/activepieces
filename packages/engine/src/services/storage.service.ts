import axios from 'axios';
import { PutStoreEntryRequest, StoreEntry } from 'shared';
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