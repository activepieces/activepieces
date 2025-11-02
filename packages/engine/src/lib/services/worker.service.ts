import { EngineSocketEvent, SendFlowResponseRequest, UpdateRunProgressRequest } from '@activepieces/shared'
import { sendToWorkerWithAck } from '../../main'

export const workerService = {
    async updateRunProgress(request: UpdateRunProgressRequest): Promise<void> {
        await sendToWorkerWithAck(EngineSocketEvent.UPDATE_RUN_PROGRESS, request)
    },
    async sendFlowResponse(request: SendFlowResponseRequest): Promise<void> {
        await sendToWorkerWithAck(EngineSocketEvent.SEND_FLOW_RESPONSE, request)
    },
}