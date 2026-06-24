import { EngineGenericError, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'

const TERMINAL_RETRY_CONFIG = {
    retries: 3,
    retryDelay: 3000,
} as const

const PROGRESS_RETRY_CONFIG = {
    retries: 0,
} as const

export const engineRunApi = {
    async updateRunProgress({ apiUrl, engineToken, request }: RunProgressParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'run-progress', body: request, retry: PROGRESS_RETRY_CONFIG })
    },
    async updateStepProgress({ apiUrl, engineToken, request }: StepProgressParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'step-progress', body: request, retry: PROGRESS_RETRY_CONFIG })
    },
    async uploadRunLog({ apiUrl, engineToken, request }: RunLogParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'run-logs', body: request, retry: TERMINAL_RETRY_CONFIG })
    },
    async sendFlowResponse({ apiUrl, engineToken, request }: FlowResponseParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'flow-response', body: request, retry: TERMINAL_RETRY_CONFIG })
    },
}

async function post({ apiUrl, engineToken, path, body, retry }: PostParams): Promise<void> {
    const fetchWithRetry = fetchRetry(global.fetch)
    const response = await fetchWithRetry(`${apiUrl}v1/engine/${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify(body),
        ...retry,
    })
    if (!response.ok) {
        throw new EngineGenericError(
            'EngineRunCallbackError',
            `Failed to POST ${path}: ${response.status} ${response.statusText}`,
        )
    }
}

type BaseParams = {
    apiUrl: string
    engineToken: string
}

type RunProgressParams = BaseParams & { request: UpdateRunProgressRequest }
type StepProgressParams = BaseParams & { request: UpdateStepProgressRequest }
type RunLogParams = BaseParams & { request: UploadRunLogsRequest }
type FlowResponseParams = BaseParams & { request: SendFlowResponseRequest }

type PostParams = BaseParams & {
    path: string
    body: unknown
    retry: { retries: number, retryDelay?: number }
}
