import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, EngineHttpResponse, ExecutionType, Flow, FlowRun, FlowStatus, FlowVersionId, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, PlatformId, ProgressUpdateType, ProjectId, RunEnvironment, WorkerJobType } from '@activepieces/shared'
import { context, propagation, trace } from '@opentelemetry/api'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue } from '../workers/queue/job-queue'
import { JobType } from '../workers/queue/queue-manager'

const tracer = trace.getTracer('webhook-handler')
const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000

export enum WebhookFlowVersionToRun {
    LOCKED_FALL_BACK_TO_LATEST = 'locked_fall_back_to_latest',
    LATEST = 'latest',
}

export const webhookHandler = {
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

    async handleAsync(params: AsyncWebhookParams): Promise<EngineHttpResponse> {
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

                await jobQueue(logger).add({
                    id: webhookRequestId,
                    type: JobType.ONE_TIME,
                    data: {
                        platformId,
                        projectId: flow.projectId,
                        schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                        requestId: webhookRequestId,
                        payload,
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
                    dependOnJobId: !isNil(parentRunId) && failParentOnFailure ? parentRunId : undefined,
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
    },

    async handleSync(params: SyncWebhookParams): Promise<EngineHttpResponse> {
        return tracer.startActiveSpan('webhook.handler.sync', {
            attributes: {
                'webhook.flowId': params.flow.id,
                'webhook.requestId': params.webhookRequestId,
                'webhook.saveSampleData': params.saveSampleData,
                'webhook.environment': params.runEnvironment,
            },
        }, async (span) => {
            try {
                const { payload, projectId, flow, logger, webhookRequestId, synchronousHandlerId, flowVersionIdToRun, runEnvironment, saveSampleData, flowVersionToRun, parentRunId, failParentOnFailure, platformId } = params

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
                    synchronousHandlerId,
                    projectId,
                    executeTrigger: true,
                    httpRequestId: webhookRequestId,
                    executionType: ExecutionType.BEGIN,
                    progressUpdateType: ProgressUpdateType.WEBHOOK_RESPONSE,
                    parentRunId,
                    failParentOnFailure,
                })

                span.setAttribute('webhook.runId', createdRun.id)
                params.onRunCreated?.(createdRun)

                return await engineResponseWatcher(logger).oneTimeListener<EngineHttpResponse>(webhookRequestId, true, WEBHOOK_TIMEOUT_MS, {
                    status: StatusCodes.NO_CONTENT,
                    body: {},
                    headers: {},
                })
            }
            finally {
                span.end()
            }
        })
    },
}

async function savePayload(params: Omit<AsyncWebhookParams, 'saveSampleData' | 'webhookHeader' | 'execute'>): Promise<void> {
    const { flow, logger, webhookRequestId, payload, flowVersionIdToRun, runEnvironment, parentRunId, failParentOnFailure, platformId } = params
    await webhookHandler.handleAsync({
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
    synchronousHandlerId: string
    flowVersionIdToRun: FlowVersionId
    onRunCreated?: (run: FlowRun) => void
    parentRunId?: string
    failParentOnFailure: boolean
}

