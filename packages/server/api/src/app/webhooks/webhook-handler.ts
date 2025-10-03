import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, EngineHttpResponse, ExecutionType, Flow, FlowRun, FlowStatus, FlowVersionId, isNil, LATEST_JOB_DATA_SCHEMA_VERSION, ProgressUpdateType, ProjectId, RunEnvironment, TriggerPayload, WorkerJobType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { system } from '../helper/system/system'
import { projectService } from '../project/project-service'
import { triggerSourceService } from '../trigger/trigger-source/trigger-source-service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue } from '../workers/queue/job-queue'
import { JobType } from '../workers/queue/queue-manager'
import { handshakeHandler } from './handshake-handler'
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
        const { flow, logger, webhookRequestId, payload, flowVersionIdToRun, webhookHeader, saveSampleData, execute, runEnvironment, parentRunId, failParentOnFailure } = params


        const triggerSource = await triggerSourceService(logger).getByFlowId({
            flowId: flow.id,
            projectId: flow.projectId,
            simulate: saveSampleData,
        })

        const response = await handshakeHandler(logger).handleHandshakeRequest({
            payload: payload as TriggerPayload,
            handshakeConfiguration: await handshakeHandler(logger).getWebhookHandshakeConfiguration(triggerSource),
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
            return {
                status: response.status,
                body: response.body,
                headers: response.headers ?? {},
            }
        }

        const platformId = await projectService.getPlatformId(flow.projectId)
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
            },
        })
        logger.info('Async webhook request completed')
        return {
            status: StatusCodes.OK,
            body: {},
            headers: {
                [webhookHeader]: webhookRequestId,
            },
        }
    },

    async handleSync(params: SyncWebhookParams): Promise<EngineHttpResponse> {
        const { payload, projectId, flow, logger, webhookRequestId, synchronousHandlerId, flowVersionIdToRun, runEnvironment, saveSampleData, flowVersionToRun, parentRunId, failParentOnFailure } = params

        if (saveSampleData) {
            rejectedPromiseHandler(savePayload({
                flow,
                logger,
                webhookRequestId,
                payload,
                flowVersionIdToRun,
                runEnvironment,
                parentRunId,
                failParentOnFailure,
            }), logger)
        }

        const disabledFlow = flow.status !== FlowStatus.ENABLED && flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST

        if (disabledFlow) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            }
        }

        const createdRun = await flowRunService(logger).start({
            environment: runEnvironment,
            flowVersionId: flowVersionIdToRun,
            payload,
            synchronousHandlerId,
            flowId: flow.id,
            flowDisplayName: 'SOMETHING',
            projectId,
            executeTrigger: true,
            httpRequestId: webhookRequestId,
            executionType: ExecutionType.BEGIN,
            progressUpdateType: ProgressUpdateType.WEBHOOK_RESPONSE,
            parentRunId,
            failParentOnFailure,
        })

        params.onRunCreated?.(createdRun)

        return engineResponseWatcher(logger).oneTimeListener<EngineHttpResponse>(webhookRequestId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    },
}

async function savePayload(params: Omit<AsyncWebhookParams, 'saveSampleData' | 'webhookHeader' | 'execute'>): Promise<void> {
    const { flow, logger, webhookRequestId, payload, flowVersionIdToRun, runEnvironment, parentRunId, failParentOnFailure } = params
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
        parentRunId,
        failParentOnFailure,
    })
    await triggerSourceService(logger).disable({ flowId: flow.id, projectId: flow.projectId, simulate: true, ignoreError: true })
}


type AsyncWebhookParams = {
    flow: Flow
    logger: FastifyBaseLogger
    webhookRequestId: string
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

