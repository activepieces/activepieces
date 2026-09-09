import { ErrorCode } from '@activepieces/core-utils'
import { CreateWaitpointRequest, CreateWaitpointResponse, EngineGenericError, PausedFlowTimeoutError } from '@activepieces/shared'
import { retryFetch } from '../api/retry-fetch'

export const waitpointClient = {
    create: async ({ apiUrl, engineToken, ...body }: CreateWaitpointClientRequest): Promise<CreateWaitpointResponse> => {
        const response = await retryFetch(`${apiUrl}v1/waitpoints`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            const parsed = await parseErrorBody(response)
            if (parsed?.code === ErrorCode.PAUSED_FLOW_TIMEOUT_EXCEEDED) {
                throw new PausedFlowTimeoutError(undefined, parsed.params?.pauseTimeoutDays)
            }
            throw new EngineGenericError('WaitpointCreationError', `Failed to create waitpoint: ${response.status} ${response.statusText}`)
        }
        return response.json() as Promise<CreateWaitpointResponse>
    },
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
    try {
        const body: unknown = await response.json()
        if (isApiErrorBody(body)) {
            return body
        }
        return null
    }
    catch {
        return null
    }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
    if (typeof value !== 'object' || value === null || !('code' in value)) {
        return false
    }
    return typeof value.code === 'string'
}

type ApiErrorBody = {
    code: string
    params?: { pauseTimeoutDays?: number }
}

type CreateWaitpointClientRequest = CreateWaitpointRequest & {
    apiUrl: string
    engineToken: string
}
