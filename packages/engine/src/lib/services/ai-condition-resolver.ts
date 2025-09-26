import { isNil, ResolveAIConditionRequest } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'
import { EngineConstants } from '../handler/context/engine-constants'

const fetchWithRetry = fetchRetry(global.fetch)

export const aiConditionResolver = {
    resolve: async (engineConstants: EngineConstants, request: ResolveAIConditionRequest): Promise<boolean[] | null> => {
        const response = await fetchWithRetry(new URL(`${engineConstants.internalApiUrl}v1/engine/resolve-ai-condition`).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineConstants.engineToken}`,
            },
            retryDelay: 4000,
            retries: 3,
            body: JSON.stringify(request),
        })
        if (isNil(response)) {
            return null
        }
        return response.json()
    },
}