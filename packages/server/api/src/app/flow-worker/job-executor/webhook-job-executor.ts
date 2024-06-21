import { StatusCodes } from 'http-status-codes'
import { webhookService } from '../../webhooks/webhook-service'
import { webhookSimulationService } from '../../webhooks/webhook-simulation/webhook-simulation-service'
import { EngineHttpResponse, webhookResponseWatcher } from '../helper/webhook-response-watcher'
import { WebhookJobData } from '@activepieces/server-shared'
import { FlowStatus, GetFlowVersionForWorkerRequestType, isNil } from '@activepieces/shared'
import { engineApiService, workerApiService } from 'server-worker'

export const webhookExecutor = {
    async consumeWebhook(data: WebhookJobData, engineToken: string, workerToken: string): Promise<void> {
        const { flowId, payload, simulate } = data
        const populatedFlow = await engineApiService(engineToken).getFlowWithExactPieces({
            flowId,
            type: simulate ? GetFlowVersionForWorkerRequestType.LATEST : GetFlowVersionForWorkerRequestType.LOCKED,
        })
        if (isNil(populatedFlow)) {
            await stopAndReply(data, {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            })
            return
        }
        const handshakeResponse = await webhookService.handshake({
            engineToken,
            populatedFlow,
            payload,
        })
        if (!isNil(handshakeResponse)) {
            await stopAndReply(data, {
                status: handshakeResponse.status,
                headers: handshakeResponse.headers ?? {},
                body: handshakeResponse.body,
            })
            return
        }

        if (populatedFlow.status !== FlowStatus.ENABLED && !simulate) {
            await stopAndReply(data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        const filteredPayloads = await webhookService.extractPayloadAndSave({
            engineToken,
            flowVersion: populatedFlow.version,
            payload: data.payload,
            projectId: populatedFlow.projectId,
        })

        if (simulate) {
            await webhookSimulationService.delete({ flowId: populatedFlow.id, projectId: populatedFlow.projectId })
            await stopAndReply(data, {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            })
            return
        }
        const runs = await workerApiService(workerToken).startRuns({
            flowVersionId: populatedFlow.version.id,
            projectId: populatedFlow.projectId,
            synchronousHandlerId: webhookResponseWatcher.getHandlerId(),
            payloads: filteredPayloads,
        })
        if (isNil(runs) || runs.length === 0 || isNil(runs[0])) {
            await stopAndReply(data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        if (!isNil(data.synchronousHandlerId)) {
            const firstRun = runs[0]
            const response = await webhookResponseWatcher.oneTimeListener(firstRun.id, true)
            await stopAndReply(data, response)
        }
    },

}


async function stopAndReply(data: WebhookJobData, response: EngineHttpResponse): Promise<void> {
    const { requestId, synchronousHandlerId } = data
    if (!isNil(synchronousHandlerId)) {
        await webhookResponseWatcher.publish(
            requestId,
            synchronousHandlerId,
            response,
        )
    }
}

