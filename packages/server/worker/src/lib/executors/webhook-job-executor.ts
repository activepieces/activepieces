import { pinoLogging, WebhookJobData } from '@activepieces/server-shared'
import {
    EngineHttpResponse,
    FlowStatus,
    FlowVersionId,
    GetFlowVersionForWorkerRequestType,
    isNil,
    PopulatedFlow,
    ProgressUpdateType,
    RunEnvironment,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { engineApiService, workerApiService } from '../api/server-api.service'
import { webhookUtils } from '../utils/webhook-utils'

export const webhookExecutor = (log: FastifyBaseLogger) => ({
    async consumeWebhook(
        data: WebhookJobData,
        engineToken: string,
        workerToken: string,
    ): Promise<void> {
        const webhookLogger = pinoLogging.createWebhookContextLog({
            log,
            webhookId: data.requestId,
            flowId: data.flowId,
        })
        webhookLogger.info('Webhook job executor started')
        const { payload, saveSampleData, flowVersionToRun, flowVersionIdToRun, execute } = data

        if (saveSampleData) {
            await handleSampleData(data, engineToken, workerToken, webhookLogger)
        }

        const onlySaveSampleData = isNil(flowVersionToRun) || !execute
        if (onlySaveSampleData) {
            await stopAndReply(workerToken, data, {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            })
            return
        }

        const populatedFlowToRun = await getFlowToRun(workerToken, engineToken, flowVersionToRun, flowVersionIdToRun, data, log)
        if (isNil(populatedFlowToRun)) {
            return
        }

        const handshakeResponse = await webhookUtils(webhookLogger).handshake({
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

        
        const filteredPayloads = await webhookUtils(webhookLogger).extractPayload({
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
})
async function getFlowToRun(workerToken: string, engineToken: string, flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED, flowVersionIdToRun: FlowVersionId | null | undefined, data: WebhookJobData, log: FastifyBaseLogger): Promise<PopulatedFlow | null> {
    const flowToRun = await engineApiService(engineToken, log).getFlowWithExactPieces({
        flowId: data.flowId,
        type: flowVersionToRun,
    }, flowVersionIdToRun)

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

    const latestFlowVersion = await engineApiService(engineToken, log).getFlowWithExactPieces({
        flowId: data.flowId,
        type: GetFlowVersionForWorkerRequestType.LATEST,
    }, flowVersionIdToRun)

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
    log: FastifyBaseLogger,
): Promise<void> {
    const { flowId, payload, flowVersionIdToRun } = data
    const latestFlowVersion = await engineApiService(
        engineToken,
        log,
    ).getFlowWithExactPieces({
        flowId,
        type: GetFlowVersionForWorkerRequestType.LATEST,
    }, flowVersionIdToRun)

    if (isNil(latestFlowVersion)) {
        await stopAndReply(workerToken, data, {
            status: StatusCodes.GONE,
            body: {},
            headers: {},
        })
        return
    }

    const payloads = await webhookUtils(log).extractPayload({
        engineToken,
        flowVersion: latestFlowVersion.version,
        payload,
        projectId: latestFlowVersion.projectId,
        simulate: true,
    })

    webhookUtils(log).savePayloadsAsSampleData({
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
    await workerApiService(workerToken).sendUpdate({
        workerServerId: data.synchronousHandlerId,
        requestId: data.requestId,
        response,
    })
}
