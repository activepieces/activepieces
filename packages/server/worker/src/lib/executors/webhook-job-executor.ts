import { WebhookJobData } from '@activepieces/server-shared'
import { EngineHttpResponse, FlowStatus, GetFlowVersionForWorkerRequestType, isNil, PopulatedFlow, ProgressUpdateType } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { engineApiService, workerApiService } from '../api/server-api.service'
import { webhookUtils } from '../utils/webhook-utils'

export const webhookExecutor = {
    async consumeWebhook(data: WebhookJobData, engineToken: string, workerToken: string): Promise<void> {
        const { flowId, payload, simulate, saveSampleData } = data
        const latestPopulatedFlow = await engineApiService(engineToken).getFlowWithExactPieces({
            flowId,
            type: GetFlowVersionForWorkerRequestType.LATEST,
        })

        if (isNil(latestPopulatedFlow)) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            })
            return
        }
        const handshakeResponse = await webhookUtils.handshake({
            engineToken,
            populatedFlow: latestPopulatedFlow,
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

        if (saveSampleData) {
            // TODO SAVE SAMPLE DATA
        }

        if (simulate) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            })
            return
        }

        if (latestPopulatedFlow.status !== FlowStatus.ENABLED) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }

        const runs = await startRuns(engineToken, workerToken, latestPopulatedFlow, data)
        if (isNil(runs) || runs.length === 0 || isNil(runs[0])) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return;
        }

    },

}

async function startRuns(engineToken: string, workerToken: string, data: WebhookJobData) {
    const populatedFlow = await engineApiService(engineToken).getFlowWithExactPieces({
        flowId: data.flowId,
        type: GetFlowVersionForWorkerRequestType.LATEST,
    })

    const filteredPayloads = await webhookUtils.extractPayloadAndSave({
        engineToken,
        workerToken,
        flowVersion: populatedFlow.version,
        payload: data.payload,
        projectId: populatedFlow.projectId,
    })

    return await workerApiService(workerToken).startRuns({
        flowVersionId: populatedFlow.version.id,
        projectId: populatedFlow.projectId,
        progressUpdateType: !isNil(data.synchronousHandlerId) ? ProgressUpdateType.WEBHOOK_RESPONSE : ProgressUpdateType.NONE,
        synchronousHandlerId: data.synchronousHandlerId ?? undefined,
        httpRequestId: data.requestId,
        payloads: filteredPayloads,
    })
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

