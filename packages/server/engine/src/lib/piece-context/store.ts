import { URL } from 'node:url'
import { Store, StoreScope } from '@activepieces/pieces-framework'
import { DeleteStoreEntryRequest, ExecutionError, FetchError, FlowId, isNil, PutStoreEntryRequest, StorageError, StorageInvalidKeyError, StorageLimitError, STORE_KEY_MAX_LENGTH, STORE_VALUE_MAX_SIZE, StoreEntry } from '@activepieces/shared'
import { utils } from '../utils'

export function createContextStore({ apiUrl, prefix, flowId, engineToken }: { apiUrl: string, prefix: string, flowId: FlowId, engineToken: string }): Store {
    return {
        async put<T>(key: string, value: T, scope = StoreScope.FLOW): Promise<T> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await createStoreClient({ apiUrl, engineToken }).put({
                key: modifiedKey,
                value,
            })
            return value
        },
        async delete(key: string, scope = StoreScope.FLOW): Promise<void> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            await createStoreClient({ apiUrl, engineToken }).delete({
                key: modifiedKey,
            })
        },
        async get<T>(key: string, scope = StoreScope.FLOW): Promise<T | null> {
            const modifiedKey = createKey(prefix, scope, flowId, key)
            const storeEntry = await createStoreClient({ apiUrl, engineToken }).get(modifiedKey)
            if (storeEntry === null) {
                return null
            }
            return storeEntry.value as T
        },
    }
}

function createStoreClient({ engineToken, apiUrl }: CreateStoreClientParams): StoreClient {
    return {
        async get(key: string): Promise<StoreEntry | null> {
            if (isNil(key) || key.length === 0) {
                throw new StorageInvalidKeyError(key)
            }
            const url = buildUrl(apiUrl, key)

            const { data: storeEntry, error: storeEntryError } = await utils.tryCatchAndThrowOnEngineError((async () => {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${engineToken}`,
                    },
                })
                if (!response.ok) {
                    return handleResponseError({
                        key,
                        response,
                    })
                }

                return response.json()
            }))

            if (storeEntryError) {
                return handleFetchError({
                    url,
                    cause: storeEntryError,
                })
            }
            return storeEntry
        },

        async put(request: PutStoreEntryRequest): Promise<StoreEntry | null> {
            const url = buildUrl(apiUrl)

            const { data: storeEntry, error: storeEntryError } = await utils.tryCatchAndThrowOnEngineError((async () => {
                const sizeOfValue = utils.sizeof(request.value)
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
                    return handleResponseError({
                        key: request.key,
                        response,
                    })
                }

                return response.json()
            }))

            if (storeEntryError) {
                return handleFetchError({
                    url,
                    cause: storeEntryError,
                })
            }
            return storeEntry
        },

        async delete(request: DeleteStoreEntryRequest): Promise<null> {
            if (isNil(request.key) || request.key.length === 0) {
                throw new StorageInvalidKeyError(request.key)
            }
            const url = buildUrl(apiUrl, request.key)

            const { data: storeEntry, error: storeEntryError } = await utils.tryCatchAndThrowOnEngineError((async () => {
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
            }))

            if (storeEntryError) {
                return handleFetchError({
                    url,
                    cause: storeEntryError,
                })
            }
            return storeEntry
        },
    }
}

function createKey(prefix: string, scope: StoreScope, flowId: FlowId, key: string): string {
    if (isNil(key) || typeof key !== 'string' || key.length === 0 || key.length > STORE_KEY_MAX_LENGTH) {
        throw new StorageInvalidKeyError(key)
    }
    switch (scope) {
        case StoreScope.PROJECT:
            return prefix + key
        case StoreScope.FLOW:
            return prefix + 'flow_' + flowId + '/' + key
    }
}

function buildUrl(apiUrl: string, key?: string): URL {
    const url = new URL(`${apiUrl}v1/store-entries`)
    if (key) {
        url.searchParams.set('key', key)
    }
    return url
}

function handleFetchError({ url, cause }: HandleFetchErrorParams): never {
    if (cause instanceof ExecutionError) {
        throw cause
    }
    throw new FetchError(url.toString(), cause)
}

const handleResponseError = async ({ key, response }: HandleResponseErrorParams): Promise<null> => {
    if (response.status === 404) {
        return null
    }
    if (response.status === 413) {
        throw new StorageLimitError(key, STORE_VALUE_MAX_SIZE)
    }
    const cause = await response.text()
    throw new StorageError(key, cause)
}

type CreateStoreClientParams = {
    engineToken: string
    apiUrl: string
}

type StoreClient = {
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
