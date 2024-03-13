import { URL } from 'node:url'
import { Store, StoreScope } from '@activepieces/pieces-framework'
import { DeleteStoreEntryRequest, FlowId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { EngineConstants } from '../handler/context/engine-constants'
import { FetchError, StorageError } from '../helper/execution-errors'

export const createStorageService = ({ workerToken }: CreateStorageServiceParams): StorageService => {
    return {
        async get(key: string): Promise<StoreEntry | null> {
            const url = buildUrl(key)

            try {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${workerToken}`,
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
            const url = buildUrl()

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${workerToken}`,
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
            const url = buildUrl(request.key)

            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${workerToken}`,
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

const buildUrl = (key?: string): URL => {
    const url = new URL(`${EngineConstants.API_URL}v1/store-entries`)

    if (key) {
        url.searchParams.set('key', key)
    }

    return url
}

const handleResponseError = async ({ key, response }: HandleResponseErrorParams): Promise<null> => {
    if (response.status === StatusCodes.NOT_FOUND.valueOf()) {
        return null
    }

    const cause = await response.text()
    throw new StorageError(key, cause)
}

const handleFetchError = ({ url, cause }: HandleFetchErrorParams): never => {
    throw new FetchError(url.toString(), cause)
}

type CreateStorageServiceParams = {
    workerToken: string
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
