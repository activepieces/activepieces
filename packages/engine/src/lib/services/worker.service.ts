import { EngineSocketEvent, UpdateRunProgressRequest } from '@activepieces/shared'
import { sendToWorkerWithAck } from '../../main'

export const workerService = {
    async updateRunProgress(request: UpdateRunProgressRequest): Promise<void> {
        await sendToWorkerWithAck(EngineSocketEvent.UPDATE_RUN_PROGRESS, request)
    },
}
