import { EngineGenericError, SendFlowResponseRequest, UpdateRunProgressRequest, UpdateStepProgressRequest, UploadRunLogsRequest } from '@activepieces/shared'
import { retryFetch } from './retry-fetch'

export const engineRunApi = {
    async updateRunProgress({ apiUrl, engineToken, request }: RunProgressParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'run-progress', body: request })
    },
    async updateStepProgress({ apiUrl, engineToken, request }: StepProgressParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'step-progress', body: request, fetcher: global.fetch })
    },
    async uploadRunLog({ apiUrl, engineToken, request }: RunLogParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'run-logs', body: request })
    },
    async sendFlowResponse({ apiUrl, engineToken, request }: FlowResponseParams): Promise<void> {
        await post({ apiUrl, engineToken, path: 'flow-response', body: request })
    },
}

async function post({ apiUrl, engineToken, path, body, fetcher = retryFetch }: PostParams): Promise<void> {
    const response = await fetcher(`${apiUrl}v1/engine/${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify(body),
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
    fetcher?: typeof retryFetch
}
