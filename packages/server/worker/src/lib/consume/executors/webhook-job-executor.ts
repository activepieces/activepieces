import { pinoLogging } from '@activepieces/server-shared'
import {
    ConsumeJobResponse,
    ConsumeJobResponseStatus,
    EventPayload,
    FlowVersion,
    isNil,
    ProgressUpdateType,
    TriggerRunStatus,
    WebhookJobData,
} from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { workerApiService } from '../../api/server-api.service'
import { flowWorkerCache } from '../../cache/flow-worker-cache'
import { triggerHooks } from '../../utils/trigger-utils'
import { webhookUtils } from '../../utils/webhook-utils'

const tracer = trace.getTracer('webhook-executor')

export const webhookExecutor = (log: FastifyBaseLogger) => ({
    async consumeWebhook(
        jobId: string,
        data: WebhookJobData,
        engineToken: string,
        workerToken: string,
        timeoutInSeconds: number,
    ): Promise<ConsumeJobResponse> {
        return tracer.startActiveSpan('webhook.executor.consume', {
            attributes: {
                'webhook.jobId': jobId,
                'webhook.flowId': data.flowId,
                'webhook.requestId': data.requestId,
                'webhook.saveSampleData': data.saveSampleData,
                'webhook.execute': data.execute,
                'webhook.environment': data.runEnvironment,
            },
        }, async (span) => {
            try {
                const webhookLogger = pinoLogging.createWebhookContextLog({
                    log,
                    webhookId: data.requestId,
                    flowId: data.flowId,
                })
                webhookLogger.info('Webhook job executor started')
                const { payload, saveSampleData, flowVersionIdToRun, execute } = data

                const flowVersion = await flowWorkerCache(log).getVersion({
                    engineToken,
                    flowVersionId: flowVersionIdToRun,
                })

                if (isNil(flowVersion)) {
                    span.setAttribute('webhook.flowNotFound', true)
                    return {
                        status: ConsumeJobResponseStatus.OK,
                    }
                }

                span.setAttribute('webhook.projectId', data.projectId)

                if (saveSampleData) {
                    await handleSampleData(jobId, flowVersion, engineToken, workerToken, data.projectId, webhookLogger, payload, timeoutInSeconds)
                }

                const onlySaveSampleData = !execute
                if (onlySaveSampleData) {
                    span.setAttribute('webhook.onlySaveSampleData', true)
                    return {
                        status: ConsumeJobResponseStatus.OK,
                    }
                }
                const { payloads, status, errorMessage } = await triggerHooks(log).extractPayloads(engineToken, {
                    jobId,
                    flowVersion,
                    payload,
                    projectId: data.projectId,
                    simulate: saveSampleData,
                    timeoutInSeconds,
                })

                span.setAttribute('webhook.payloadsCount', payloads.length)

                if (status === TriggerRunStatus.INTERNAL_ERROR) {
                    span.setAttribute('webhook.error', true)
                    span.setAttribute('webhook.errorMessage', errorMessage ?? 'unknown')
                    return {
                        status: ConsumeJobResponseStatus.INTERNAL_ERROR,
                        errorMessage,
                    }
                }

                await workerApiService(workerToken).startRuns({
                    flowVersionId: flowVersion.id,
                    projectId: data.projectId,
                    environment: data.runEnvironment,
                    progressUpdateType: ProgressUpdateType.NONE,
                    httpRequestId: data.requestId,
                    payloads,
                    platformId: data.platformId,
                    parentRunId: data.parentRunId,
                    failParentOnFailure: data.failParentOnFailure,
                })  
                span.setAttribute('webhook.runsStarted', true)
                return {
                    status: ConsumeJobResponseStatus.OK,
                }
            }
            finally {
                span.end()
            }
        })
    },
})


async function handleSampleData(
    jobId: string,
    latestFlowVersion: FlowVersion,
    engineToken: string,
    workerToken: string,
    projectId: string,
    log: FastifyBaseLogger,
    payload: EventPayload,
    timeoutInSeconds: number,
): Promise<void> {
    const { payloads } = await triggerHooks(log).extractPayloads(engineToken, {
        jobId,
        flowVersion: latestFlowVersion,
        payload,
        projectId,
        simulate: true,
        timeoutInSeconds,
    })
    webhookUtils(log).savePayloadsAsSampleData({
        flowVersion: latestFlowVersion,
        projectId,
        workerToken,
        payloads,
    })

}

