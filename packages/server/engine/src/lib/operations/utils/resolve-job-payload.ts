import { isNil, JobPayload } from '@activepieces/shared'
import { payloadFileClient } from '../../helper/payload-file-client'

export async function resolveJobPayload({ payload, apiUrl, engineToken }: ResolveJobPayloadParams): Promise<unknown> {
    if (isNil(payload)) {
        return undefined
    }
    if (payload.type === 'inline') {
        return payload.value
    }
    const buffer = await payloadFileClient.get({
        apiUrl,
        engineToken,
        fileId: payload.fileId,
    })
    return JSON.parse(buffer.toString('utf-8'))
}

type ResolveJobPayloadParams = {
    payload: JobPayload | undefined
    apiUrl: string
    engineToken: string
}
