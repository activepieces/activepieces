import { EngineSocketEvent, UpdateRunProgressRequest } from '@activepieces/shared'
import { sendToWorker } from '../../main'

export const workerService = {
    updateRunProgress(request: UpdateRunProgressRequest): void {
        sendToWorker(EngineSocketEvent.UPDATE_RUN_PROGRESS, request)
    },
}
