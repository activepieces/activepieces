import { EngineGenericError } from '@activepieces/shared'

export const engineFileApi = {
    async uploadLogSlice({ engineToken, apiUrl, data }: UploadLogSliceParams): Promise<{ fileId: string, url: string }> {
        const response = await fetch(`${apiUrl}v1/engine/files/log-slice`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${engineToken}`,
                'Content-Type': 'application/octet-stream',
            },
            body: data,
        })
        if (!response.ok) {
            throw new EngineGenericError(
                'LogSliceUploadError',
                `Failed to upload log slice: ${response.status} ${response.statusText}`,
            )
        }
        const payload = await response.json() as { fileId?: unknown, url?: unknown }
        if (typeof payload?.fileId !== 'string' || typeof payload?.url !== 'string') {
            throw new EngineGenericError(
                'LogSliceUploadError',
                'Upload response missing fileId or signed url',
            )
        }
        return { fileId: payload.fileId, url: payload.url }
    },
    async download({ engineToken, apiUrl, fileId }: DownloadFileParams): Promise<Uint8Array> {
        const response = await fetch(`${apiUrl}v1/engine/files/${fileId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${engineToken}`,
            },
        })
        if (!response.ok) {
            throw new EngineGenericError(
                'EngineFileDownloadError',
                `Failed to download file ${fileId}: ${response.status} ${response.statusText}`,
            )
        }
        return new Uint8Array(await response.arrayBuffer())
    },
}

type UploadLogSliceParams = {
    engineToken: string
    apiUrl: string
    data: Uint8Array
}

type DownloadFileParams = {
    engineToken: string
    apiUrl: string
    fileId: string
}
