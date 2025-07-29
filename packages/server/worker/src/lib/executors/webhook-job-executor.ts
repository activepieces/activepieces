import { pinoLogging, WebhookJobData } from '@activepieces/server-shared'
import {
    EventPayload,
    isNil,
    PopulatedFlow,
    ProgressUpdateType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowWorkerCache } from '../api/flow-worker-cache'
import { workerApiService } from '../api/server-api.service'
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
        const { payload, saveSampleData, flowVersionIdToRun, execute } = data

        const populatedFlowToRun = await flowWorkerCache(log).getFlow({
            engineToken,
            flowVersionId: flowVersionIdToRun,
        })

        if (isNil(populatedFlowToRun)) {
            return
        }

        if (saveSampleData) {
            await handleSampleData(populatedFlowToRun, engineToken, workerToken, webhookLogger, payload)
        }

        const onlySaveSampleData = !execute
        if (onlySaveSampleData) {
            return
        }
        const filteredPayloads = await webhookUtils(webhookLogger).extractPayload({
            engineToken,
            flowVersion: populatedFlowToRun.version,
            payload,
            projectId: populatedFlowToRun.projectId,
            simulate: saveSampleData,
        })

        await workerApiService(workerToken).startRuns({
            flowVersionId: populatedFlowToRun.version.id,
            projectId: populatedFlowToRun.projectId,
            environment: data.runEnvironment,
            progressUpdateType: ProgressUpdateType.NONE,
            httpRequestId: data.requestId,
            payloads: filteredPayloads,
            parentRunId: data.parentRunId,
            failParentOnFailure: data.failParentOnFailure,
        })
    },
})


async function handleSampleData(
    latestFlowVersion: PopulatedFlow,
    engineToken: string,
    workerToken: string,
    log: FastifyBaseLogger,
    payload: EventPayload,
): Promise<void> {
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

