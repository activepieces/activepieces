import { JobPayload, WorkerToApiContract } from '@activepieces/shared'

export async function resolvePayload(payload: JobPayload, projectId: string, apiClient: WorkerToApiContract): Promise<unknown> {
    if (payload.type === 'inline') {
        return payload.value
    }
    const data = await apiClient.getPayloadFile({ fileId: payload.fileId, projectId })
    return JSON.parse(data.toString('utf8'))
}
