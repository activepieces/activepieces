import { AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION, rejectedPromiseHandler } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, EngineHttpResponse, ExecutionType, Flow, FlowId, FlowStatus, FlowVersionId, isNil, ProgressUpdateType, ProjectId, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { system } from '../helper/system/system'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue } from '../workers/queue'
import { DEFAULT_PRIORITY } from '../workers/queue/queue-manager'
import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'
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

        const flowVersionSchema = await flowVersionRepo()
            .createQueryBuilder()
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
        const { flow, logger, webhookRequestId, payload, flowVersionIdToRun, webhookHeader, saveSampleData, execute, runEnvironment } = params

        await jobQueue(logger).add({
            id: webhookRequestId,
            type: JobType.WEBHOOK,
            data: {
                projectId: flow.projectId,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                requestId: webhookRequestId,
                payload,
                flowId: flow.id,
                saveSampleData,
                flowVersionIdToRun,
                runEnvironment,
                execute,
            },
            priority: DEFAULT_PRIORITY,
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
        const { payload, projectId, flow, logger, webhookRequestId, synchronousHandlerId, flowVersionIdToRun, runEnvironment, saveSampleData } = params

        if (isNil(flow)) {
            return {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            }
        }
        if (saveSampleData) {
            // TODO this is bug, we should save the payload that is extracted from the webhook
            await saveSamplePayload({ flowId: flow.id, payload, projectId, log: logger })
        }

        const disabledFlow = flow.status !== FlowStatus.ENABLED

        if (disabledFlow) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            }
        }

        await flowRunService(logger).start({
            environment: runEnvironment,
            flowVersionId: flowVersionIdToRun,
            payload,
            synchronousHandlerId,
            projectId,
            httpRequestId: webhookRequestId,
            executionType: ExecutionType.BEGIN,
            progressUpdateType: ProgressUpdateType.WEBHOOK_RESPONSE,
        })

        return engineResponseWatcher(logger).oneTimeListener<EngineHttpResponse>(webhookRequestId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    },
}
async function saveSamplePayload(params: SaveSampleDataParams): Promise<void> {
    const { flowId, payload, projectId, log } = params
    rejectedPromiseHandler(triggerEventService(log).saveEvent({
        flowId,
        payload,
        projectId,
    }), log)
    await webhookSimulationService(log).delete({ flowId, projectId })
}


type SaveSampleDataParams = {
    flowId: FlowId
    payload: unknown
    projectId: ProjectId
    log: FastifyBaseLogger
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
}


type SyncWebhookParams = {
    payload: unknown
    saveSampleData: boolean
    projectId: ProjectId
    runEnvironment: RunEnvironment
    flow: Flow
    logger: FastifyBaseLogger
    webhookRequestId: string
    synchronousHandlerId: string
    flowVersionIdToRun: FlowVersionId
}

