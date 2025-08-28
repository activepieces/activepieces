import { ResolveToolInputsRequest } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'
import { EngineConstants } from '../handler/context/engine-constants'

const fetchWithRetry = fetchRetry(global.fetch)

export const toolInputsResolver = {
    resolve: async (engineConstants: EngineConstants, request: ResolveToolInputsRequest): Promise<Record<string, unknown>> => {
        const response = await fetchWithRetry(new URL(`${engineConstants.internalApiUrl}v1/engine/resolve-tool-inputs`).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineConstants.engineToken}`,
            },
            retryDelay: 4000,
            retries: 3,
            body: JSON.stringify(request),
        })
        return response.json()
    },
}