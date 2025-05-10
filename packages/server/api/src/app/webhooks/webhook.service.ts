import { pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, apId, EngineHttpResponse, ErrorCode, EventPayload, Flow, FlowStatus, isNil, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { usageService } from '../ee/platform-billing/usage/usage-service'
import { flowService } from '../flows/flow/flow.service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { WebhookFlowVersionToRun, webhookHandler } from './webhook-handler'

type HandleWebhookParams = {
    flowId: string
    async: boolean
    saveSampleData: boolean
    flowVersionToRun: WebhookFlowVersionToRun
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

        if (isNil(flow)) {
            pinoLogger.info('Flow not found, returning GONE')
            return {
                status: StatusCodes.GONE,
                body: {},
                headers: {},
            }
        }

        const flowVersionIdToRun = await webhookHandler.getFlowVersionIdToRun(flowVersionToRun, flow)

        const webhookValidationResponse = await validateWebhookRequest({
            flow,
            log: pinoLogger,
            saveSampleData,
            webhookHeader,
            webhookRequestId,
            flowVersionToRun,
        })

        if (!isNil(webhookValidationResponse)) {
            return webhookValidationResponse
        }

        pinoLogger.info('Adding webhook job to queue')

        if (async) {
            return webhookHandler.handleAsync({
                flow,
                saveSampleData,
                flowVersionIdToRun,
                payload: payload ?? await data(flow.projectId),
                logger: pinoLogger,
                webhookRequestId,
                runEnvironment: flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST ? RunEnvironment.PRODUCTION : RunEnvironment.TESTING,
                webhookHeader,
                execute: flow.status === FlowStatus.ENABLED && execute,
            })
        }


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
    await assertExceedsLimit(flow, log)

    if (flow.status !== FlowStatus.ENABLED && !saveSampleData && flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST) {
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
    webhookHeader: string
    webhookRequestId: string
    flowVersionToRun: WebhookFlowVersionToRun
}
