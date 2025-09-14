import { pinoLogging } from '@activepieces/server-shared'
import {
    ConsumeJobResponse,
    ConsumeJobResponseStatus,
    EventPayload,
    isNil,
    PopulatedFlow,
    ProgressUpdateType,
    TriggerRunStatus,
    WebhookJobData,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../api/server-api.service'
import { flowWorkerCache } from '../cache/flow-worker-cache'
import { triggerHooks } from '../utils/trigger-utils'
import { webhookUtils } from '../utils/webhook-utils'

export const webhookExecutor = (log: FastifyBaseLogger) => ({
    async consumeWebhook(
        jobId: string,
        data: WebhookJobData,
        engineToken: string,
        workerToken: string,
        timeoutInSeconds: number,
    ): Promise<ConsumeJobResponse> {
        const webhookLogger = pinoLogging.createWebhookContextLog({
            log,
            webhookId: data.requestId,
            flowId: data.flowId,
        })
        webhookLogger.info('Webhook job executor started')
        const { payload, saveSampleData, flowVersionIdToRun, execute } = data

        const populatedFlowToRun = await flowWorkerCache.getFlow({
            engineToken,
            flowVersionId: flowVersionIdToRun,
        })

        if (isNil(populatedFlowToRun)) {
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        }

        if (saveSampleData) {
            await handleSampleData(jobId, populatedFlowToRun, engineToken, workerToken, webhookLogger, payload, timeoutInSeconds)
        }

        const onlySaveSampleData = !execute
        if (onlySaveSampleData) {
            return {
                status: ConsumeJobResponseStatus.OK,
            }
        }
        const { payloads, status, errorMessage } = await triggerHooks(log).extractPayloads(engineToken, {
            jobId,
            flowVersion: populatedFlowToRun.version,
            payload,
            projectId: populatedFlowToRun.projectId,
            simulate: saveSampleData,
            timeoutInSeconds,
        })

        if (status === TriggerRunStatus.INTERNAL_ERROR) {
            return {
                status: ConsumeJobResponseStatus.INTERNAL_ERROR,
                errorMessage,
            }
        }

        await workerApiService(workerToken).startRuns({
            flowVersionId: populatedFlowToRun.version.id,
            projectId: populatedFlowToRun.projectId,
            environment: data.runEnvironment,
            progressUpdateType: ProgressUpdateType.NONE,
            httpRequestId: data.requestId,
            payloads,
            parentRunId: data.parentRunId,
            failParentOnFailure: data.failParentOnFailure,
        })  
        return {
            status: ConsumeJobResponseStatus.OK,
        }
    },
})


async function handleSampleData(
    jobId: string,
    latestFlowVersion: PopulatedFlow,
    engineToken: string,
    workerToken: string,
    log: FastifyBaseLogger,
    payload: EventPayload,
    timeoutInSeconds: number,
): Promise<void> {
    const { payloads } = await triggerHooks(log).extractPayloads(engineToken, {
        jobId,
        flowVersion: latestFlowVersion.version,
        payload,
        projectId: latestFlowVersion.projectId,
        simulate: true,
        timeoutInSeconds,
    })
    webhookUtils(log).savePayloadsAsSampleData({
        flowVersion: latestFlowVersion.version,
        projectId: latestFlowVersion.projectId,
        workerToken,
        payloads,
    })

}

