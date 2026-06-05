import { EngineGenericError } from '@activepieces/shared'
import fetchRetry from 'fetch-retry'

const RETRY_CONFIG = {
    retries: 3,
    retryDelay: 3000,
} as const

export const engineFileApi = {
    async download({ engineToken, apiUrl, fileId }: DownloadFileParams): Promise<Uint8Array> {
        const fetchWithRetry = fetchRetry(global.fetch)
        const response = await fetchWithRetry(`${apiUrl}v1/files/${fileId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${engineToken}`,
            },
            redirect: 'follow',
            ...RETRY_CONFIG,
        })
        if (!response.ok) {
            throw new EngineGenericError(
                'EngineFileDownloadError',
                `Failed to download engine file ${fileId}: ${response.status} ${response.statusText}`,
            )
        }
        const arrayBuffer = await response.arrayBuffer()
        return new Uint8Array(arrayBuffer)
    },
}

type DownloadFileParams = {
    engineToken: string
    apiUrl: string
    fileId: string
}
