import { pinoLogging } from '@activepieces/server-shared'
import { apId, EngineHttpResponse, EventPayload, FlowRun, FlowStatus, isNil, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { flowService } from '../flows/flow/flow.service'
import { engineResponseWatcher } from '../workers/engine-response-watcher'
import { WebhookFlowVersionToRun, webhookHandler } from './webhook-handler'

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
        const flowDisabledAndNoSaveSampleData = flow.status !== FlowStatus.ENABLED && !saveSampleData && flowVersionToRun === WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST
        if (flowDisabledAndNoSaveSampleData) {
            return {
                status: StatusCodes.NOT_FOUND,
                body: {},
                headers: {
                    [webhookHeader]: webhookRequestId,
                },
            }
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
                parentRunId,
                failParentOnFailure,
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
