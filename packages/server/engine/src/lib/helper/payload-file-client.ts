import { EngineGenericError } from '@activepieces/shared'

export const payloadFileClient = {
    get: async ({ apiUrl, engineToken, fileId }: GetPayloadFileRequest): Promise<Buffer> => {
        const response = await fetch(`${apiUrl}v1/engine/files/${fileId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${engineToken}`,
            },
        })
        if (!response.ok) {
            throw new EngineGenericError('PayloadFileFetchError', `Failed to fetch payload file ${fileId}: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
    },
}

type GetPayloadFileRequest = {
    apiUrl: string
    engineToken: string
    fileId: string
}
