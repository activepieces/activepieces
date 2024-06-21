import { StatusCodes } from 'http-status-codes'
import { WebhookJobData, logger } from '@activepieces/server-shared'
import { EngineHttpResponse, FlowStatus, GetFlowVersionForWorkerRequestType, ProgressUpdateType, apId, isNil } from '@activepieces/shared'
import { engineApiService, workerApiService } from '../api/server-api.service'
import { webhookUtils } from '../utils/webhook-utils'

export const webhookExecutor = {
    async consumeWebhook(data: WebhookJobData, engineToken: string, workerToken: string): Promise<void> {
        const { flowId, payload, simulate } = data
        const populatedFlow = await engineApiService(engineToken).getFlowWithExactPieces({
            flowId,
            type: simulate ? GetFlowVersionForWorkerRequestType.LATEST : GetFlowVersionForWorkerRequestType.LOCKED,
        })

        if (isNil(populatedFlow)) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            })
            return
        }
        const handshakeResponse = await webhookUtils.handshake({
            engineToken,
            populatedFlow,
            payload,
        })
        if (!isNil(handshakeResponse)) {
            await stopAndReply(workerToken, data, {
                status: handshakeResponse.status,
                headers: handshakeResponse.headers ?? {},
                body: handshakeResponse.body,
            })
            return
        }

        if (populatedFlow.status !== FlowStatus.ENABLED && !simulate) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
        const filteredPayloads = await webhookUtils.extractPayloadAndSave({
            engineToken,
            workerToken,
            flowVersion: populatedFlow.version,
            payload,
            projectId: populatedFlow.projectId,
        })


        if (simulate) {
            await workerApiService(workerToken).deleteWebhookSimluation({
                flowId: populatedFlow.id,
                projectId: populatedFlow.projectId,
            })
            await stopAndReply(workerToken, data, {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            })
            return
        }
        const runs = await workerApiService(workerToken).startRuns({
            flowVersionId: populatedFlow.version.id,
            projectId: populatedFlow.projectId,
            progressUpdateType: !isNil(data.synchronousHandlerId) ? ProgressUpdateType.WEBHOOK_RESPONSE : ProgressUpdateType.NONE,
            synchronousHandlerId: data.synchronousHandlerId ?? undefined,
            httpRequestId: data.requestId,
            payloads: filteredPayloads,
        })
        if (isNil(runs) || runs.length === 0 || isNil(runs[0])) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }
    },

}


async function stopAndReply(workerToken: string, data: WebhookJobData, response: EngineHttpResponse): Promise<void> {
    if (isNil(data.synchronousHandlerId)) {
        return
    }
    await workerApiService(workerToken).sendWebhookUpdate({
        workerServerId: data.synchronousHandlerId,
        requestId: data.requestId,
        response,
    })
}

