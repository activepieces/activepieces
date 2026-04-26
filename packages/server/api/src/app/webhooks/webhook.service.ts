import { apId, assertNotNullOrUndefined, EngineHttpResponse, EventPayload, ExecutionType, Flow, FlowRun, FlowStatus, FlowVersionId, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PlatformId, ProjectId, RunEnvironment, StreamStepProgress, TriggerPayload, WorkerJobType } from '@activepieces/shared'
import { context, propagation, trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowExecutionCache } from '../flows/flow/flow-execution-cache'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { pinoLogging } from '../helper/logger'
import { rejectedPromiseHandler } from '../helper/promise-handler'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue, JobType } from '../workers/job-queue/job-queue'
import { payloadOffloader } from '../workers/payload-offloader'
import { isHandshakeRequest, webhookHandshake } from './webhook-handshake'

const tracer = trace.getTracer('webhook-service')
const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000
const MAX_PAYLOAD_SIZE_BYTES = system.getNumberOrThrow(AppSystemProp.MAX_WEBHOOK_PAYLOAD_SIZE_MB) * 1024 * 1024

export enum WebhookFlowVersionToRun {
    LOCKED_FALL_BACK_TO_LATEST = 'locked_fall_back_to_latest',
    LATEST = 'latest',
}

export const webhookService = {
    async getFlowVersionIdToRun(type: WebhookFlowVersionToRun, flow: Flow): Promise<FlowVersionId> {
        if (type === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST && !isNil(flow.publishedVersionId)) {
            return flow.publishedVersionId
        }

        const flowVersionSchema = await flowVersionRepo().createQueryBuilder()
            .select('id')
            .where({
                flowId: flow.id,
            })
            .orderBy('created', 'DESC')
            .getRawOne()
        assertNotNullOrUndefined(flowVersionSchema, 'Flow version not found')
        return flowVersionSchema.id
    },

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
                span.setAttribute('webhook.flowFound', true)
                span.setAttribute('webhook.projectId', flow.projectId)
                const flowVersionIdToRun = await webhookService.getFlowVersionIdToRun(flowVersionToRun, flow)
                span.setAttribute('webhook.flowVersionId', flowVersionIdToRun)

                const resolvedPayload = payload ?? await data(flow.projectId)
                const handshakeConfiguration = flowExecutionResult.handshakeConfiguration ?? null

                // Handshake validation requests must be processed even when the flow is still
                // DISABLED — third-party services (e.g. Trello) send a HEAD/POST to verify the
                // webhook URL during onEnable before the flow transitions to ENABLED.
                if (flow.status === FlowStatus.DISABLED && !saveSampleData && !isHandshakeRequest({ payload: resolvedPayload as TriggerPayload, handshakeConfiguration })) {
                    pinoLogger.warn({ flowId }, 'Webhook received for disabled flow')
                    span.setAttribute('webhook.triggerSourceFound', false)
                    return {
                        status: StatusCodes.NOT_FOUND,
                        body: {},
                        headers: {
                            [webhookHeader]: webhookRequestId,
                        },
                    }
                }

                const response = await webhookHandshake.handleHandshakeRequest({
                    payload: resolvedPayload as TriggerPayload,
                    handshakeConfiguration,
                    flowId: flow.id,
                    flowVersionId: flowVersionIdToRun,
                    projectId: flow.projectId,
                    logger: pinoLogger,
                })
                if (!isNil(response)) {
                    logger.info({
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

                const payloadSize = payloadOffloader.getPayloadSizeInBytes(resolvedPayload)
                if (payloadSize > MAX_PAYLOAD_SIZE_BYTES) {
                    pinoLogger.warn({ payloadSize, maxPayloadSizeBytes: MAX_PAYLOAD_SIZE_BYTES }, 'Webhook payload too large')
                    span.setAttribute('webhook.payloadTooLarge', true)
                    return {
                        status: StatusCodes.REQUEST_TOO_LONG,
                        body: { message: 'Payload too large' },
                        headers: {
                            [webhookHeader]: webhookRequestId,
                        },
                    }
                }

                if (async) {
                    span.setAttribute('webhook.mode', 'async')
                    return await handleAsync({
                        flow,
                        saveSampleData,
                        platformId: flowExecutionResult.platformId,
                        flowVersionIdToRun,
                        payload: resolvedPayload,
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
                const flowHttpResponse = await handleSync({
                    payload: resolvedPayload,
                    projectId: flow.projectId,
                    flow,
                    platformId: flowExecutionResult.platformId,
                    runEnvironment: flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST ? RunEnvironment.PRODUCTION : RunEnvironment.TESTING,
                    logger: pinoLogger,
                    webhookRequestId,
                    workerHandlerId: engineResponseWatcher(pinoLogger).getServerId(),
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

async function handleAsync(params: AsyncWebhookParams): Promise<EngineHttpResponse> {
    return tracer.startActiveSpan('webhook.handler.async', {
        attributes: {
            'webhook.flowId': params.flow.id,
            'webhook.requestId': params.webhookRequestId,
            'webhook.saveSampleData': params.saveSampleData,
            'webhook.execute': params.execute,
            'webhook.environment': params.runEnvironment,
        },
    }, async (span) => {
        try {
            const { flow, logger, webhookRequestId, payload, flowVersionIdToRun, webhookHeader, saveSampleData, execute, runEnvironment, parentRunId, failParentOnFailure, platformId } = params

            span.setAttribute('webhook.platformId', platformId)

            // Inject trace context for propagation across queue boundary
            const traceContext: Record<string, string> = {}
            propagation.inject(context.active(), traceContext)

            const jobPayload = await payloadOffloader.offloadPayload(logger, payload, flow.projectId, platformId)

            await jobQueue(logger).add({
                id: webhookRequestId,
                type: JobType.ONE_TIME,
                data: {
                    platformId,
                    projectId: flow.projectId,
                    schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                    requestId: webhookRequestId,
                    payload: jobPayload,
                    jobType: WorkerJobType.EXECUTE_WEBHOOK,
                    flowId: flow.id,
                    saveSampleData,
                    flowVersionIdToRun,
                    runEnvironment,
                    execute,
                    parentRunId,
                    failParentOnFailure,
                    traceContext,
                },
            })
            logger.info('Async webhook request completed')
            span.setAttribute('webhook.queuedSuccessfully', true)
            return {
                status: StatusCodes.OK,
                body: {},
                headers: {
                    [webhookHeader]: webhookRequestId,
                },
            }
        }
        finally {
            span.end()
        }
    })
}

async function handleSync(params: SyncWebhookParams): Promise<EngineHttpResponse> {
    return tracer.startActiveSpan('webhook.handler.sync', {
        attributes: {
            'webhook.flowId': params.flow.id,
            'webhook.requestId': params.webhookRequestId,
            'webhook.saveSampleData': params.saveSampleData,
            'webhook.environment': params.runEnvironment,
        },
    }, async (span) => {
        try {
            const { payload, projectId, flow, logger, webhookRequestId, workerHandlerId, flowVersionIdToRun, runEnvironment, saveSampleData, flowVersionToRun, parentRunId, failParentOnFailure, platformId } = params

            if (saveSampleData) {
                rejectedPromiseHandler(savePayload({
                    flow,
                    logger,
                    webhookRequestId,
                    payload,
                    platformId,
                    flowVersionIdToRun,
                    runEnvironment,
                    parentRunId,
                    failParentOnFailure,
                }), logger)
            }

            const disabledFlow = flow.status !== FlowStatus.ENABLED && flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST

            if (disabledFlow) {
                span.setAttribute('webhook.flowDisabled', true)
                return {
                    status: StatusCodes.NOT_FOUND,
                    body: {},
                    headers: {},
                }
            }

            const createdRun = await flowRunService(logger).start({
                platformId,
                environment: runEnvironment,
                flowId: flow.id,
                flowVersionId: flowVersionIdToRun,
                payload,
                workerHandlerId,
                projectId,
                executeTrigger: true,
                httpRequestId: webhookRequestId,
                executionType: ExecutionType.BEGIN,
                streamStepProgress: StreamStepProgress.NONE,
                parentRunId,
                failParentOnFailure,
            })

            span.setAttribute('webhook.runId', createdRun.id)
            params.onRunCreated?.(createdRun)

            const listenerResult = await engineResponseWatcher(logger).oneTimeListener<EngineHttpResponse>(webhookRequestId, true, WEBHOOK_TIMEOUT_MS, {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            })
            return listenerResult
        }
        finally {
            span.end()
        }
    })
}

async function savePayload(params: Omit<AsyncWebhookParams, 'saveSampleData' | 'webhookHeader' | 'execute'>): Promise<void> {
    const { flow, logger, webhookRequestId, payload, flowVersionIdToRun, runEnvironment, parentRunId, failParentOnFailure, platformId } = params
    await handleAsync({
        flow,
        logger,
        webhookRequestId,
        payload,
        flowVersionIdToRun,
        saveSampleData: true,
        runEnvironment,
        execute: false,
        webhookHeader: '',
        platformId,
        parentRunId,
        failParentOnFailure,
    })
    await triggerSourceService(logger).disable({ flowId: flow.id, projectId: flow.projectId, simulate: true, ignoreError: true })
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

type AsyncWebhookParams = {
    flow: Flow
    logger: FastifyBaseLogger
    webhookRequestId: string
    platformId: PlatformId
    payload: unknown
    flowVersionIdToRun: FlowVersionId
    webhookHeader: string
    saveSampleData: boolean
    runEnvironment: RunEnvironment
    execute: boolean
    parentRunId?: string
    failParentOnFailure: boolean
}

type SyncWebhookParams = {
    payload: unknown
    saveSampleData: boolean
    projectId: ProjectId
    runEnvironment: RunEnvironment
    platformId: PlatformId
    flowVersionToRun: WebhookFlowVersionToRun
    flow: Flow
    logger: FastifyBaseLogger
    webhookRequestId: string
    workerHandlerId: string
    flowVersionIdToRun: FlowVersionId
    onRunCreated?: (run: FlowRun) => void
    parentRunId?: string
    failParentOnFailure: boolean
}
