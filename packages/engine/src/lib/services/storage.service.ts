import { URL } from 'node:url'
import { Store, StoreScope } from '@activepieces/pieces-framework'
import { StatusCodes } from 'http-status-codes'
import { DeletStoreEntryRequest, FlowId, FlowRunId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
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

export function createContextStore<
    SCOPE extends StoreScope | Omit<StoreScope, 'RUN'>,
>({
    prefix,
    flowId,
    workerToken,
    runId,
    defaultScope,
}: {
    prefix: string
    flowId: FlowId
    workerToken: string
    defaultScope: SCOPE
    runId: SCOPE extends StoreScope.RUN ? FlowRunId : undefined
}): Store<SCOPE> {
    return {
        async put<T>(key: string, value: T, scope = defaultScope): Promise<T> {
            const modifiedKey = createKey(prefix, scope, flowId, key, runId)
            await createStorageService({ workerToken }).put({
                key: modifiedKey,
                value,
            })
            return value
        },
        async delete(key: string, scope = defaultScope as SCOPE): Promise<void> {
            const modifiedKey = createKey(prefix, scope, flowId, key, runId)
            await createStorageService({ workerToken }).delete({
                key: modifiedKey,
            })
        },
        async get<T>(key: string, scope = defaultScope): Promise<T | null> {
            const modifiedKey = createKey(prefix, scope, flowId, key, runId)
            const storeEntry = await createStorageService({ workerToken }).get(
                modifiedKey,
            )
            if (storeEntry === null) {
                return null
            }
            return storeEntry.value as T
        },
    }
}

function createKey(
    prefix: string,
    scope: StoreScope | Omit<StoreScope, 'RUN'>,
    flowId: FlowId,
    key: string,
    runId?: FlowRunId,
): string {
    switch (scope) {
        case StoreScope.RUN:
            return prefix + 'run_' + runId + '/' + key
        case StoreScope.FLOW:
            return prefix + 'flow_' + flowId + '/' + key
        default:
            return prefix + key
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
