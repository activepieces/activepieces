import { pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, apId, EngineHttpResponse, ErrorCode, EventPayload, FlowRun, FlowStatus, isNil, PlatformUsageMetric, RunEnvironment, TriggerPayload } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { projectLimitsService } from '../ee/projects/project-plan/project-plan.service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { handshakeHandler } from './handshake-handler'
import { WebhookFlowVersionToRun, webhookHandler } from './webhook-handler'

const tracer = trace.getTracer('webhook-service')

export const webhookService = {
    async handleWebhook({
        logger,
        data,
        flowId,
        async,
        saveSampleData,
        flowVersionToRun,
        payload,
        execute,
        onRunCreated,
        parentRunId,
        failParentOnFailure,
    }: HandleWebhookParams): Promise<EngineHttpResponse> {
        return tracer.startActiveSpan('webhook.service.handle', {
            attributes: {
                'webhook.flowId': flowId,
                'webhook.async': async,
                'webhook.saveSampleData': saveSampleData,
                'webhook.execute': execute,
            },
        }, async (span) => {
            try {
                const webhookHeader = 'x-webhook-id'
                const webhookRequestId = apId()
                span.setAttribute('webhook.requestId', webhookRequestId)
                const pinoLogger = pinoLogging.createWebhookContextLog({ log: logger, webhookId: webhookRequestId, flowId })

                const triggerSourceResult = await triggerSourceService(pinoLogger).getByFlowIdPopulated({
                    flowId,
                    simulate: saveSampleData,
                })

                if (isNil(triggerSourceResult)) {
                    pinoLogger.info('Flow not found, returning GONE')
                    span.setAttribute('webhook.flowFound', false)
                    return {
                        status: StatusCodes.GONE,
                        body: {},
                        headers: {},
                    }
                }

                const { flow, ...triggerSource } = triggerSourceResult

                span.setAttribute('webhook.flowFound', true)
                span.setAttribute('webhook.projectId', flow.projectId)
                const flowVersionIdToRun = await webhookHandler.getFlowVersionIdToRun(flowVersionToRun, flow)
                span.setAttribute('webhook.flowVersionId', flowVersionIdToRun)

                const exceededLimit = await projectLimitsService(pinoLogger).checkTasksExceededLimit(flow.projectId)
                if (exceededLimit) {
                    span.setAttribute('webhook.quotaExceeded', true)
                    throw new ActivepiecesError({
                        code: ErrorCode.QUOTA_EXCEEDED,
                        params: {
                            metric: PlatformUsageMetric.TASKS,
                        },
                    })
                }

                const response = await handshakeHandler(pinoLogger).handleHandshakeRequest({
                    payload: (payload ?? await data(flow.projectId)) as TriggerPayload,
                    handshakeConfiguration: await handshakeHandler(pinoLogger).getWebhookHandshakeConfiguration(triggerSource),
                    flowId: flow.id,
                    flowVersionId: flowVersionIdToRun,
                    projectId: flow.projectId,
                })
                if (!isNil(response)) {
                    logger.info({
                        message: 'Handshake request completed',
                        flowId: flow.id,
                        flowVersionId: flowVersionIdToRun,
                        webhookRequestId,
                    }, 'Handshake request completed')
                    span.setAttribute('webhook.handshake', true)
                    return {
                        status: response.status,
                        body: response.body,
                        headers: response.headers ?? {},
                    }
                }

                const flowDisabledAndNoSaveSampleData = flow.status !== FlowStatus.ENABLED && !saveSampleData && flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST
                if (flowDisabledAndNoSaveSampleData) {
                    span.setAttribute('webhook.flowDisabled', true)
                    return {
                        status: StatusCodes.NOT_FOUND,
                        body: {},
                        headers: {
                            [webhookHeader]: webhookRequestId,
                        },
                    }
                }
                pinoLogger.info('Adding webhook job to queue')


                if (async) {
                    span.setAttribute('webhook.mode', 'async')
                    return await webhookHandler.handleAsync({
                        flow,
                        saveSampleData,
                        flowVersionIdToRun,
                        payload: payload ?? await data(flow.projectId),
                        logger: pinoLogger,
                        webhookRequestId,
                        runEnvironment: flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST ? RunEnvironment.PRODUCTION : RunEnvironment.TESTING,
                        webhookHeader,
                        execute: flow.status === FlowStatus.ENABLED && execute,
                        parentRunId,
                        failParentOnFailure,
                    })
                }


                span.setAttribute('webhook.mode', 'sync')
                const flowHttpResponse = await webhookHandler.handleSync({
                    payload: payload ?? await data(flow.projectId),
                    projectId: flow.projectId,
                    flow,
                    runEnvironment: flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST ? RunEnvironment.PRODUCTION : RunEnvironment.TESTING,
                    logger: pinoLogger,
                    webhookRequestId,
                    synchronousHandlerId: engineResponseWatcher(pinoLogger).getServerId(),
                    flowVersionIdToRun,
                    saveSampleData,
                    flowVersionToRun,
                    onRunCreated,
                    parentRunId,
                    failParentOnFailure,
                })
                return {
                    status: flowHttpResponse.status,
                    body: flowHttpResponse.body,
                    headers: {
                        ...flowHttpResponse.headers,
                        [webhookHeader]: webhookRequestId,
                    },
                }
            }
            finally {
                span.end()
            }
        })
    },
}

type HandleWebhookParams = {
    flowId: string
    async: boolean
    saveSampleData: boolean
    flowVersionToRun: WebhookFlowVersionToRun
    data: (projectId: string) => Promise<EventPayload>
    logger: FastifyBaseLogger
    payload?: Record<string, unknown>
    execute: boolean
    onRunCreated?: (run: FlowRun) => void
    parentRunId?: string
    failParentOnFailure: boolean
}
