import { AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, EngineHttpResponse, ErrorCode, ExecutionType, Flow, FlowId, FlowStatus, FlowVersionId, GetFlowVersionForWorkerRequestType, isNil, ProgressUpdateType, ProjectId, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionRepo } from '../flows/flow-version/flow-version.service'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { system } from '../helper/system/system'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue } from '../workers/queue'
import { getJobPriority } from '../workers/queue/queue-manager'
import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'
const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000

export const webhookHandler = {
    async getFlowVersionIdToRun(type: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED, flow: Flow): Promise<FlowVersionId | null> {
        if (type === GetFlowVersionForWorkerRequestType.LOCKED && !isNil(flow.publishedVersionId)) {
            return flow.publishedVersionId
        }

        const flowVersionSchema = await flowVersionRepo()
            .createQueryBuilder()
            .select('id')
            .where('"flowId" = :flowId', { flowId: flow.id })
            .orderBy('created', 'DESC')
            .getOne()

        return flowVersionSchema?.id ?? null
    },

    async handleAsync(params: AsyncWebhookParams): Promise<EngineHttpResponse> {
        const { flow, logger, webhookRequestId, synchronousHandlerId, payload, flowVersionToRun, flowVersionIdToRun, webhookHeader, saveSampleData, execute } = params

        await jobQueue(logger).add({
            id: webhookRequestId,
            type: JobType.WEBHOOK,
            data: {
                projectId: flow.projectId,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                requestId: webhookRequestId,
                synchronousHandlerId,
                payload,
                flowId: flow.id,
                saveSampleData,
                flowVersionToRun,
                flowVersionIdToRun,
                execute,
            },
            priority: await getJobPriority(synchronousHandlerId),
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
        const { savingSampleData, flowVersionToRun, payload, projectId, flow, logger, webhookRequestId, synchronousHandlerId, flowVersionIdToRun, execute } = params

        if (savingSampleData) {
            await saveSampleData({ flowId: flow.id, payload, projectId, log: logger })
        }

        const onlySaveSampleData = isNil(flowVersionIdToRun) || !execute
        if (onlySaveSampleData) {
            return {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            }
        }



        if (isNil(flow.status)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: flow.id, entityType: 'flow' },
            })
        }

        const disabledFlow = flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED && flow.status !== FlowStatus.ENABLED

        if (disabledFlow) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {},
            }
        }

        await flowRunService(logger).start({
            environment: flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED ? RunEnvironment.PRODUCTION : RunEnvironment.TESTING,
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

async function saveSampleData(params: SaveSampleDataParams): Promise<void> {
    const { flowId, payload, projectId, log } = params
    rejectedPromiseHandler(triggerEventService(log).saveEvent({
        flowId,
        payload,
        projectId,
    }), log)
    await webhookSimulationService(log).delete({ flowId, projectId })
}

type AsyncWebhookParams = {
    flow: Flow
    logger: FastifyBaseLogger
    webhookRequestId: string
    synchronousHandlerId: string | null
    payload: unknown
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined
    flowVersionIdToRun: FlowVersionId | null
    webhookHeader: string
    saveSampleData: boolean
    execute: boolean
}

type SyncWebhookParams = {
    savingSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined
    payload: unknown
    projectId: ProjectId
    flow: Flow
    logger: FastifyBaseLogger
    webhookRequestId: string
    synchronousHandlerId: string
    flowVersionIdToRun: FlowVersionId | null
    execute: boolean
}

type SaveSampleDataParams = {
    flowId: FlowId
    payload: unknown
    projectId: ProjectId
    log: FastifyBaseLogger
}