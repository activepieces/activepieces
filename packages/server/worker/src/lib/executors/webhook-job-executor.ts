import { WebhookJobData } from '@activepieces/server-shared'
import {
    EngineHttpResponse,
    FlowStatus,
    GetFlowVersionForWorkerRequestType,
    isNil,
    PopulatedFlow,
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
        const { payload, saveSampleData, flowVersionToRun } = data

        if (saveSampleData) {
            await handleSampleData(data, engineToken, workerToken)
        }

        const onlySaveSampleData = isNil(flowVersionToRun)
        if (onlySaveSampleData) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            })
            return
        }

        const populatedFlowToRun = await getFlowToRun(workerToken, engineToken, flowVersionToRun, data)
        if (isNil(populatedFlowToRun)) {
            return
        }

        const handshakeResponse = await webhookUtils.handshake({
            engineToken,
            populatedFlow: populatedFlowToRun,
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

        const disabledFlow = flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED && populatedFlowToRun.status !== FlowStatus.ENABLED

        if (disabledFlow) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            })
            return
        }


        const filteredPayloads = await webhookUtils.extractPayload({
            engineToken,
            flowVersion: populatedFlowToRun.version,
            payload,
            projectId: populatedFlowToRun.projectId,
            simulate: saveSampleData,
        })

        const runs = await workerApiService(workerToken).startRuns({
            flowVersionId: populatedFlowToRun.version.id,
            projectId: populatedFlowToRun.projectId,
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
async function getFlowToRun(workerToken: string, engineToken: string, flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED, data: WebhookJobData): Promise<PopulatedFlow | null> {
    const flowToRun = await engineApiService(engineToken).getFlowWithExactPieces({
        flowId: data.flowId,
        type: flowVersionToRun,
    })

    if (!isNil(flowToRun)) {
        return flowToRun
    }

    if (flowVersionToRun === GetFlowVersionForWorkerRequestType.LATEST) {
        await stopAndReply(workerToken, data, {
            body: {},
            headers: {},
            status: StatusCodes.GONE,
        })
        return null
    }

    const latestFlowVersion = await engineApiService(engineToken).getFlowWithExactPieces({
        flowId: data.flowId,
        type: GetFlowVersionForWorkerRequestType.LATEST,
    })

    await stopAndReply(workerToken, data, {
        body: {},
        headers: {},
        status: isNil(latestFlowVersion) ? StatusCodes.GONE : StatusCodes.NOT_FOUND,
    })
    return null
}

async function handleSampleData(
    data: WebhookJobData,
    engineToken: string,
    workerToken: string,
): Promise<void> {
    const { flowId, payload } = data
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
        simulate: true,
    })

    await webhookUtils.savePayloadsAsSampleData({
        flowVersion: latestFlowVersion.version,
        projectId: latestFlowVersion.projectId,
        workerToken,
        payloads,
    })

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
