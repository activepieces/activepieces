import { URL } from 'node:url'
import { Store, StoreScope } from '@activepieces/pieces-framework'
import { DeleteStoreEntryRequest, FlowId, isNil, PutStoreEntryRequest, STORE_KEY_MAX_LENGTH, STORE_VALUE_MAX_SIZE, StoreEntry } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import sizeof from 'object-sizeof'
import { ExecutionError, FetchError, StorageError, StorageInvalidKeyError, StorageInvalidValueError, StorageLimitError } from '../helper/execution-errors'

export const createStorageService = ({ engineToken, apiUrl }: CreateStorageServiceParams): StorageService => {
    return {
        async get(key: string): Promise<StoreEntry | null> {
            const url = buildUrl(apiUrl, key)

            try {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${engineToken}`,
                    },
                })

                if (!response.ok) {
                    return await handleResponseError({
                        key,
                        response,
                    })
                }

                return await response.json()
            }
            catch (e) {
                return handleFetchError({
                    url,
                    cause: e,
                })
            }
        },

        async put(request: PutStoreEntryRequest): Promise<StoreEntry | null> {
            const url = buildUrl(apiUrl)

            try {
                if (isNil(request.value)) {
                    throw new StorageInvalidValueError(request.key)
                }
                const sizeOfValue = sizeof(request.value)
                if (sizeOfValue > STORE_VALUE_MAX_SIZE) {
                    throw new StorageLimitError(request.key, STORE_VALUE_MAX_SIZE)
                }
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${engineToken}`,
                    },
                    body: JSON.stringify(request),
                })

                if (!response.ok) {
                    return await handleResponseError({
                        key: request.key,
                        response,
                    })
                }

                return await response.json()
            }
            catch (e) {
                return handleFetchError({
                    url,
                    cause: e,
                })
            }
        },

        async delete(request: DeleteStoreEntryRequest): Promise<null> {
            const url = buildUrl(apiUrl, request.key)

            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${engineToken}`,
                    },
                })

                if (!response.ok) {
                    await handleResponseError({
                        key: request.key,
                        response,
                    })
                }

                return null
            }
            catch (e) {
                return handleFetchError({
                    url,
                    cause: e,
                })
            }
        },
    }
}

export function createContextStore({ apiUrl, prefix, flowId, engineToken }: { apiUrl: string, prefix: string, flowId: FlowId, engineToken: string }): Store {
    return {
        async put<T>(key: string, value: T, scope = StoreScope.FLOW): Promise<T> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await createStorageService({ apiUrl, engineToken }).put({
                key: modifiedKey,
                value,
            })
            return value
        },
        async delete(key: string, scope = StoreScope.FLOW): Promise<void> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await createStorageService({ apiUrl, engineToken }).delete({
                key: modifiedKey,
            })
        },
        async get<T>(key: string, scope = StoreScope.FLOW): Promise<T | null> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            const storeEntry = await createStorageService({ apiUrl, engineToken }).get(modifiedKey)
            if (storeEntry === null) {
                return null
            }
            return storeEntry.value as T
        },
    }
}

function createKey(prefix: string, scope: StoreScope, flowId: FlowId, key: string): string {
    if (typeof key !== 'string' || key.length === 0 || key.length > STORE_KEY_MAX_LENGTH) {
        throw new StorageInvalidKeyError(key)
    }
    switch (scope) {
        case StoreScope.PROJECT:
            return prefix + key
        case StoreScope.FLOW:
            return prefix + 'flow_' + flowId + '/' + key
    }
}

const buildUrl = (apiUrl: string, key?: string): URL => {
    const url = new URL(`${apiUrl}v1/store-entries`)
    if (key) {
        url.searchParams.set('key', key)
    }
    return url
}

const handleResponseError = async ({ key, response }: HandleResponseErrorParams): Promise<null> => {
    if (response.status === StatusCodes.NOT_FOUND.valueOf()) {
        return null
    }
    if (response.status === StatusCodes.REQUEST_TOO_LONG) {
        throw new StorageLimitError(key, STORE_VALUE_MAX_SIZE)
    }
    const cause = await response.text()
    throw new StorageError(key, cause)
}

const handleFetchError = ({ url, cause }: HandleFetchErrorParams): never => {
    if (cause instanceof ExecutionError) {
        throw cause
    }
    throw new FetchError(url.toString(), cause)
}

type CreateStorageServiceParams = {
    engineToken: string
    apiUrl: string
}

type StorageService = {
    get(key: string): Promise<StoreEntry | null>
    put(request: PutStoreEntryRequest): Promise<StoreEntry | null>
    delete(request: DeleteStoreEntryRequest): Promise<null>
}

type HandleResponseErrorParams = {
    key: string
    response: Response
}

type HandleFetchErrorParams = {
    url: URL
    cause: unknown
}
