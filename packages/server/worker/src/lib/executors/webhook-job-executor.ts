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
import { triggerHooks } from '../utils/trigger-utils'
import { webhookUtils } from '../utils/webhook-utils'

export const webhookExecutor = (log: FastifyBaseLogger) => ({
    async consumeWebhook(
        jobId: string,
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
            await handleSampleData(jobId, populatedFlowToRun, engineToken, workerToken, webhookLogger, payload)
        }

        const onlySaveSampleData = !execute
        if (onlySaveSampleData) {
            return
        }
        const filteredPayloads = await triggerHooks(log).extractPayloads(engineToken, {
            jobId,
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
    jobId: string,
    latestFlowVersion: PopulatedFlow,
    engineToken: string,
    workerToken: string,
    log: FastifyBaseLogger,
    payload: EventPayload,
): Promise<void> {
    const payloads = await triggerHooks(log).extractPayloads(engineToken, {
        jobId,
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

