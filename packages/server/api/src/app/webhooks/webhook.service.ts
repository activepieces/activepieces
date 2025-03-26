import { AppSystemProp, JobType, LATEST_JOB_DATA_SCHEMA_VERSION, pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, apId, EngineHttpResponse, ErrorCode, EventPayload, Flow, FlowStatus, GetFlowVersionForWorkerRequestType, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
// import { usageService } from '../ee/platform-billing/usage/usage-service'
import { flowService } from '../flows/flow/flow.service'
import { system } from '../helper/system/system'
import { projectService } from '../project/project-service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { jobQueue } from '../workers/queue'
import { getJobPriority } from '../workers/queue/queue-manager'

const WEBHOOK_TIMEOUT_MS = system.getNumberOrThrow(AppSystemProp.WEBHOOK_TIMEOUT_SECONDS) * 1000

type HandleWebhookParams = {
    flowId: string
    async: boolean
    saveSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined
    data: (projectId: string) => Promise<EventPayload>
    logger: FastifyBaseLogger
}


export const webhookService = {
    async handleWebhook({
        logger,
        data,
        flowId,
        async,
        saveSampleData,
        flowVersionToRun,
    }: HandleWebhookParams): Promise<EngineHttpResponse> {
        const webhookHeader = 'x-webhook-id'
        const webhookRequestId = apId()
        const pinoLoger = pinoLogging.createWebhookContextLog({ log: logger, webhookId: webhookRequestId, flowId })
        const flow = await flowService(pinoLoger).getOneById(flowId)
        if (isNil(flow)) {
            pinoLoger.info('Flow not found, returning GONE')
            return {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            }
        }
        const projectExists = await projectService.exists(flow.projectId)
        if (!projectExists) {
            pinoLoger.info('Project is soft deleted, returning GONE')
            return {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            }
        }

        await assertExceedsLimit(flow, pinoLoger)
        if (
            flow.status !== FlowStatus.ENABLED &&
            !saveSampleData &&
            flowVersionToRun === GetFlowVersionForWorkerRequestType.LOCKED
        ) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {
                    [webhookHeader]: webhookRequestId,
                },
            }
        }

        pinoLoger.info('Adding webhook job to queue')

        const synchronousHandlerId = async ? null : engineResponseWatcher(pinoLoger).getServerId()
        await jobQueue(logger).add({
            id: webhookRequestId,
            type: JobType.WEBHOOK,
            data: {
                projectId: flow.projectId,
                schemaVersion: LATEST_JOB_DATA_SCHEMA_VERSION,
                requestId: webhookRequestId,
                synchronousHandlerId,
                payload: await data(flow.projectId),
                flowId: flow.id,
                saveSampleData,
                flowVersionToRun,
            },
            priority: await getJobPriority(synchronousHandlerId),
        })

        if (async) {
            pinoLoger.info('Async webhook request completed')
            return {
                status: StatusCodes.OK,
                body: {},
                headers: {
                    [webhookHeader]: webhookRequestId,
                },
            }
        }
        const flowHttpResponse = await engineResponseWatcher(pinoLoger).oneTimeListener<EngineHttpResponse>(webhookRequestId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
        return {
            status: flowHttpResponse.status,
            body: flowHttpResponse.body,
            headers: {
                ...flowHttpResponse.headers,
                [webhookHeader]: webhookRequestId,
            },
        }
    },
}

async function assertExceedsLimit(flow: Flow, log: FastifyBaseLogger): Promise<void> {
    // const exceededLimit = await usageService(log).tasksExceededLimit(flow.projectId)
    const exceededLimit = 0
    if (!exceededLimit) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.QUOTA_EXCEEDED,
        params: {
            metric: 'tasks',
        },
    })
}

