import { isNil } from '@activepieces/core-utils'
import { JobPayload } from '@activepieces/shared'
import { engineFileApi } from '../../api/engine-file-api'

export async function resolveJobPayload({ payload, apiUrl, engineToken }: ResolveJobPayloadParams): Promise<unknown> {
    if (isNil(payload)) {
        return undefined
    }
    if (payload.type === 'inline') {
        return payload.value
    }
    const bytes = await engineFileApi.download({
        fileId: payload.fileId,
        apiUrl,
        engineToken,
    })
    return JSON.parse(new TextDecoder('utf-8').decode(bytes))
}

type ResolveJobPayloadParams = {
    payload: JobPayload | undefined
    apiUrl: string
    engineToken: string
}
