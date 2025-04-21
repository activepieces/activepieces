import { AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION, rejectedPromiseHandler } from '@activepieces/server-shared'
import { EngineHttpResponse, ExecutionType, Flow, FlowId, FlowStatus, FlowVersionId, GetFlowVersionForWorkerRequestType, isNil, ProgressUpdateType, ProjectId, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowService } from '../flows/flow/flow.service'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { system } from '../helper/system/system'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue } from '../workers/queue'
import { getJobPriority } from '../workers/queue/queue-manager'
import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'

const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000

export const webhookHandler = {

    async handleAsync(params: AsyncWebhookParams): Promise<EngineHttpResponse> {
        const { flow, logger, webhookRequestId, synchronousHandlerId, payload, flowVersionToRun, flowVersionIdToRun, webhookHeader, saveSampleData } = params

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
        const { savingSampleData, flowVersionToRun, payload, projectId, flowId, logger, webhookRequestId, synchronousHandlerId, flowVersionIdToRun } = params

        if (savingSampleData) {
            await saveSampleData({ flowId, payload, projectId, log: logger })
        }

        const onlySaveSampleData = isNil(flowVersionIdToRun)
        if (onlySaveSampleData) {
            return {
                status: StatusCodes.OK,
                body: {},
                headers: {},
            }
        }

        const populatedFlowToRun = await flowService(logger).getOnePopulatedOrThrow({
            id: flowId,
            projectId,
            versionId: flowVersionIdToRun,
        })

        const disabledFlow = flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED && populatedFlowToRun.status !== FlowStatus.ENABLED

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
}

type SyncWebhookParams = {
    savingSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined
    payload: unknown
    projectId: ProjectId
    flowId: FlowId
    logger: FastifyBaseLogger
    webhookRequestId: string
    synchronousHandlerId: string
    flowVersionIdToRun: FlowVersionId | null
}

type SaveSampleDataParams = {
    flowId: FlowId
    payload: unknown
    projectId: ProjectId
    log: FastifyBaseLogger
}