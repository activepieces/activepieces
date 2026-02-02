import { pinoLogging } from '@activepieces/server-shared'
import { apId, EngineHttpResponse, EventPayload, FlowRun, FlowStatus, isNil, RunEnvironment, TriggerPayload } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowExecutionCache } from '../flows/flow/flow-execution-cache'
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

                const flowExecutionResult = await flowExecutionCache(pinoLogger).get({
                    flowId,
                    simulate: saveSampleData,
                })
                
                if (!flowExecutionResult.exists) {
                    pinoLogger.info('Flow not found, returning GONE')
                    span.setAttribute('webhook.flowFound', false)
                    return {
                        status: StatusCodes.GONE,
                        body: {},
                        headers: {
                            [webhookHeader]: webhookRequestId,
                        },
                    }
                }
                const { flow } = flowExecutionResult
                if (flow.status === FlowStatus.DISABLED && !saveSampleData) {
                    pinoLogger.info('trigger source not found, returning NOT FOUND')
                    span.setAttribute('webhook.triggerSourceFound', false)
                    return {
                        status: StatusCodes.NOT_FOUND,
                        body: {},
                        headers: {
                            [webhookHeader]: webhookRequestId,
                        },
                    }
                }

                span.setAttribute('webhook.flowFound', true)
                span.setAttribute('webhook.projectId', flow.projectId)
                const flowVersionIdToRun = await webhookHandler.getFlowVersionIdToRun(flowVersionToRun, flow)
                span.setAttribute('webhook.flowVersionId', flowVersionIdToRun)

                const response = await handshakeHandler(pinoLogger).handleHandshakeRequest({
                    payload: (payload ?? await data(flow.projectId)) as TriggerPayload,
                    handshakeConfiguration: flowExecutionResult.handshakeConfiguration ?? null, 
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

                pinoLogger.info('Adding webhook job to queue')


                if (async) {
                    span.setAttribute('webhook.mode', 'async')
                    return await webhookHandler.handleAsync({
                        flow,
                        saveSampleData,
                        platformId: flowExecutionResult.platformId,
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
                    platformId: flowExecutionResult.platformId,
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
