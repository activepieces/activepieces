import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ExecutionOutputStatus, FlowRun, StopExecutionOutput, WebhookUrlParams } from '@activepieces/shared'
import { webhookService } from './webhook-service'
import { captureException, logger } from '../helper/logger'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { fileService } from '../file/file.service'

export const webhookController: FastifyPluginAsync = async (app) => {

    app.all(
        '/:flowId/sync',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            let run = (await webhookService.callback({
                flowId: request.params.flowId,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: request.body,
                    queryParams: request.query as Record<string, string>,
                },
            }))[0]
            run = await waitForRunToComplete(run)
            await handleExecutionOutputStatus(run, reply)
        },
    )

    app.all(
        '/:flowId',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            handler(request, request.params.flowId)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/',
        {
            schema: {
                querystring: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Querystring: WebhookUrlParams }>, reply) => {
            handler(request, request.query.flowId)
            await reply.status(StatusCodes.OK).send()
        },
    )

    app.all(
        '/:flowId/simulate',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            logger.debug(`[WebhookController#simulate] flowId=${request.params.flowId}`)

            await webhookService.simulationCallback({
                flowId: request.params.flowId,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: request.body,
                    queryParams: request.query as Record<string, string>,
                },
            })

            await reply.status(StatusCodes.OK).send()
        },
    )
}

const POLLING_INTERVAL_MS = 500
const POLLING_TIMEOUT_MS = 1000 * 30

const waitForRunToComplete = async (run: FlowRun) => {
    const startTime = Date.now()
    while (run.status === ExecutionOutputStatus.RUNNING && Date.now() - startTime < POLLING_TIMEOUT_MS) {
        run = await flowRunService.getOneOrThrow({
            id: run.id,
            projectId: run.projectId,
        })
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS))
    }
    return run
}

const getResponseForStoppedRun = async (run: FlowRun, reply: FastifyReply) => {
    const logs = await fileService.getOneOrThrow({
        fileId: run.logsFileId!,
        projectId: run.projectId,
    })

    const flowLogs: StopExecutionOutput = JSON.parse(logs.data.toString())

    await reply
        .status(flowLogs.stopResponse?.status ?? StatusCodes.OK)
        .send(flowLogs.stopResponse?.body)
        .headers(flowLogs.stopResponse?.headers ?? {})
}

const handleExecutionOutputStatus = async (run: FlowRun, reply: FastifyReply) => {
    if (run.status === ExecutionOutputStatus.STOPPED) {
        await getResponseForStoppedRun(run, reply)
    }
    else {
        await reply.status(StatusCodes.NO_CONTENT).send()
    }
}

const handler = async (request: FastifyRequest, flowId: string) => {
    // If we don't catch the error here, it will crash the Fastify API. Adding await before the function call can help, but since 3P services expect a fast response, we still don't want to wait for the callback to finish.
    try {
        await webhookService.callback({
            flowId: flowId,
            payload: {
                method: request.method,
                headers: request.headers as Record<string, string>,
                body: request.body,
                queryParams: request.query as Record<string, string>,
            },
        })
    }
    catch (e) {
        captureException(e)
    }
}
