import { WebhookJobData } from '@activepieces/server-shared'
import {
    EngineHttpResponse,
    FlowStatus,
    GetFlowVersionForWorkerRequestType,
    isNil,
    ProgressUpdateType,
    RunEnvironment,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { engineApiService, workerApiService } from '../api/server-api.service'
import { webhookUtils } from '../utils/webhook-utils'

export const webhookExecutor = {
    async consumeWebhook(
        data: WebhookJobData,
        engineToken: string,
        workerToken: string,
    ): Promise<void> {
        const { flowId, payload, saveSampleData, flowVersionToRun } =
      data
        const populatedFlow = await engineApiService(
            engineToken,
        ).getFlowWithExactPieces({
            flowId,
            type: flowVersionToRun ?? GetFlowVersionForWorkerRequestType.LATEST,
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

        if (
            flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED &&
            populatedFlow.status !== FlowStatus.ENABLED &&
            !saveSampleData
        ) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }

        if (saveSampleData) {
            const latestFlowVersion = await engineApiService(
                engineToken,
            ).getFlowWithExactPieces({
                flowId,
                type: GetFlowVersionForWorkerRequestType.LATEST,
            })

            if (isNil(latestFlowVersion)) {
                await stopAndReply(workerToken, data, {
                    status: StatusCodes.GONE,
                    body: {},
                    headers: {},
                })
                return
            }

            const payloads = await webhookUtils.extractPayload({
                engineToken,
                flowVersion: latestFlowVersion.version,
                payload,
                projectId: latestFlowVersion.projectId,
                simulate: saveSampleData,
            })

            await webhookUtils.savePayloadsAsSampleData({
                flowVersion: latestFlowVersion.version,
                projectId: latestFlowVersion.projectId,
                workerToken,
                payloads,
            })

            await stopAndReply(workerToken, data, {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            })

            if (isNil(flowVersionToRun)) return
        }

        const filteredPayloads = await webhookUtils.extractPayload({
            engineToken,
            flowVersion: populatedFlow.version,
            payload,
            projectId: populatedFlow.projectId,
            simulate: saveSampleData,
        })

        const runs = await workerApiService(workerToken).startRuns({
            flowVersionId: populatedFlow.version.id,
            projectId: populatedFlow.projectId,
            environment: flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED
                ? RunEnvironment.PRODUCTION
                : RunEnvironment.TESTING,
            progressUpdateType: !isNil(data.synchronousHandlerId)
                ? ProgressUpdateType.WEBHOOK_RESPONSE
                : ProgressUpdateType.NONE,
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

async function stopAndReply(
    workerToken: string,
    data: WebhookJobData,
    response: EngineHttpResponse,
): Promise<void> {
    if (isNil(data.synchronousHandlerId)) {
        return
    }
    await workerApiService(workerToken).sendWebhookUpdate({
        workerServerId: data.synchronousHandlerId,
        requestId: data.requestId,
        response,
    })
}
