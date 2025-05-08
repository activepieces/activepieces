import { pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, apId, assertNotNullOrUndefined, EngineHttpResponse, ErrorCode, EventPayload, Flow, FlowStatus, GetFlowVersionForWorkerRequestType, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { usageService } from '../ee/platform-billing/usage/usage-service'
import { flowService } from '../flows/flow/flow.service'
import { projectService } from '../project/project-service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { webhookHandler } from './webhook-handler'

type HandleWebhookParams = {
    flowId: string
    async: boolean
    saveSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED
    data: (projectId: string) => Promise<EventPayload>
    logger: FastifyBaseLogger
    payload?: Record<string, unknown>
    execute: boolean
}


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
    }: HandleWebhookParams): Promise<EngineHttpResponse> {
        const webhookHeader = 'x-webhook-id'
        const webhookRequestId = apId()
        const pinoLogger = pinoLogging.createWebhookContextLog({ log: logger, webhookId: webhookRequestId, flowId })
        const flow = await flowService(pinoLogger).getOneById(flowId)
        const onlySaveSampleData = isNil(flowVersionToRun) || !execute

        if (isNil(flow)) {
            pinoLogger.info('Flow not found, returning GONE')
            return {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            }
        }

        const webhookValidationResponse = await validateWebhookRequest({
            flow,
            log: pinoLogger,
            saveSampleData,
            flowVersionToRun,
            webhookHeader,
            webhookRequestId,
        })

        if (!isNil(webhookValidationResponse)) {
            return webhookValidationResponse
        }

        pinoLogger.info('Adding webhook job to queue')
        const synchronousHandlerId = async ? null : engineResponseWatcher(pinoLogger).getServerId()
        const flowVersionIdToRun = onlySaveSampleData ? null : await webhookHandler.getFlowVersionIdToRun(flowVersionToRun, flow)

        if (async) {
            return webhookHandler.handleAsync({
                flow,
                saveSampleData,
                flowVersionToRun,
                payload: payload ?? await data(flow.projectId),
                logger: pinoLogger,
                webhookRequestId,
                synchronousHandlerId,
                flowVersionIdToRun,
                webhookHeader,
                execute: !onlySaveSampleData,
            })
        }

        assertNotNullOrUndefined(synchronousHandlerId, 'synchronousHandlerId is required for sync webhook')

        const flowHttpResponse = await webhookHandler.handleSync({
            savingSampleData: saveSampleData,
            flowVersionToRun,
            payload: payload ?? await data(flow.projectId),
            projectId: flow.projectId,
            flow,
            logger: pinoLogger,
            webhookRequestId,
            synchronousHandlerId,
            flowVersionIdToRun,
            execute: !onlySaveSampleData,
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

async function validateWebhookRequest(params: CheckValidWebhookParams): Promise<EngineHttpResponse | null> {
    const { flow, log, saveSampleData, flowVersionToRun, webhookHeader, webhookRequestId } = params

    const projectExists = await projectService.exists(flow.projectId)
    if (!projectExists) {
        log.info('Project is soft deleted, returning GONE')
        return {
            status: StatusCodes.GONE,
            body: {},
            headers: {},
        }
    }

    await assertExceedsLimit(flow, log)
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
    return null
}

async function assertExceedsLimit(flow: Flow, log: FastifyBaseLogger): Promise<void> {
    const exceededLimit = await usageService(log).tasksExceededLimit(flow.projectId)
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

type CheckValidWebhookParams = {
    flow: Flow
    log: FastifyBaseLogger
    saveSampleData: boolean
    flowVersionToRun: GetFlowVersionForWorkerRequestType.LATEST | GetFlowVersionForWorkerRequestType.LOCKED | undefined
    webhookHeader: string
    webhookRequestId: string
}
