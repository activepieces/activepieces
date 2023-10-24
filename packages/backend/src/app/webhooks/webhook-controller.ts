import { FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ApEdition, ErrorCode, EventPayload, ExecutionOutputStatus, Flow, FlowId, FlowInstanceStatus, FlowRun, StopExecutionOutput, WebhookUrlParams } from '@activepieces/shared'
import { webhookService } from './webhook-service'
import { captureException, logger } from '../helper/logger'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { fileService } from '../file/file.service'
import { isNil } from '@activepieces/shared'
import { flowRepo } from '../flows/flow/flow.repo'
import { flowInstanceService } from '../flows/flow-instance/flow-instance.service'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { tasksLimit } from '../ee/billing/usage/limits/tasks-limit'
import { getEdition } from '../helper/secret-helper'

export const webhookController: FastifyPluginAsyncTypebox = async (app) => {

    app.all(
        '/:flowId/sync',
        {
            schema: {
                params: WebhookUrlParams,
            },
        },
        async (request: FastifyRequest<{ Params: WebhookUrlParams }>, reply) => {
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, reply)
            if (isHandshake) {
                return
            }
            let run = (await webhookService.callback({
                flow,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: await convertBody(request),
                    queryParams: request.query as Record<string, string>,
                },
            }))[0]
            if (isNil(run)) {
                await reply.status(StatusCodes.NOT_FOUND).send()
                return
            }
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
            const flow = await getFlowOrThrow(request.params.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, reply)
            if (isHandshake) {
                return
            }
            asyncHandler(payload, flow)
                .catch(captureException)
            await reply.status(StatusCodes.OK).headers({}).send({})
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
            const flow = await getFlowOrThrow(request.query.flowId)
            const payload = await convertRequest(request)
            const isHandshake = await handshakeHandler(flow, payload, reply)
            if (isHandshake) {
                return
            }
            asyncHandler(payload, flow)
                .catch(captureException)
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
            const flow = await getFlowOrThrow(request.params.flowId)
            await webhookService.simulationCallback({
                flow,
                payload: {
                    method: request.method,
                    headers: request.headers as Record<string, string>,
                    body: await convertBody(request),
                    queryParams: request.query as Record<string, string>,
                },
            })

            await reply.status(StatusCodes.OK).send()
        },
    )
}

const POLLING_INTERVAL_MS = 300
const MAX_POLLING_INTERVAL_MS = 2000
const POLLING_TIMEOUT_MS = 1000 * 30

const waitForRunToComplete = async (run: FlowRun) => {
    const startTime = Date.now()
    let pollingInterval = POLLING_INTERVAL_MS // Initialize with the initial polling interval

    while (run.status === ExecutionOutputStatus.RUNNING) {
        if (Date.now() - startTime >= POLLING_TIMEOUT_MS) {
            break
        }

        run = await flowRunService.getOneOrThrow({
            id: run.id,
            projectId: run.projectId,
        })

        if (run.status === ExecutionOutputStatus.RUNNING) {
            await new Promise((resolve) => setTimeout(resolve, pollingInterval))

            // Increase the polling interval
            if (pollingInterval < MAX_POLLING_INTERVAL_MS) {
                pollingInterval *= 2
                pollingInterval = Math.min(pollingInterval, MAX_POLLING_INTERVAL_MS)
            }
        }
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

async function convertRequest(request: FastifyRequest): Promise<EventPayload> {
    const payload: EventPayload = {
        method: request.method,
        headers: request.headers as Record<string, string>,
        body: await convertBody(request),
        queryParams: request.query as Record<string, string>,
    }
    return payload
}

const convertBody = async (request: FastifyRequest): Promise<unknown> => {
    if (request.isMultipart()) {
        const jsonResult: Record<string, unknown> = {}
        const requestBodyEntries = Object.entries(request.body as Record<string, unknown>)

        for (const [key, value] of requestBodyEntries) {
            jsonResult[key] = value instanceof Buffer ? value.toString('base64') : value
        }

        logger.debug({ name: 'WebhookController#convertBody', jsonResult })

        return jsonResult
    }
    return request.body

}

async function handshakeHandler(flow: Flow, payload: EventPayload, reply: FastifyReply): Promise<boolean> {
    const handshakeResponse = await webhookService.handshake({
        flow,
        payload,
    })
    if (handshakeResponse !== null) {
        reply = reply.status(handshakeResponse.status)
        if (handshakeResponse.headers !== undefined) {
            for (const header of Object.keys(handshakeResponse.headers)) {
                reply = reply.header(header, handshakeResponse.headers[header] as string)
            }
        }
        await reply.send(handshakeResponse.body)
        return true
    }
    return false
}

const asyncHandler = async (payload: EventPayload, flow: Flow) => {
    return webhookService.callback({
        flow,
        payload,
    })
}

const getFlowOrThrow = async (flowId: FlowId): Promise<Flow> => {
    if (isNil(flowId)) {
        logger.error('[WebhookService#getFlowOrThrow] error=flow_id_is_undefined')
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'flowId is undefined',
            },
        })
    }

    const flow = await flowRepo.findOneBy({ id: flowId })

    if (isNil(flow)) {
        logger.error(`[WebhookService#getFlowOrThrow] error=flow_not_found flowId=${flowId}`)

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    // TODO FIX AND REFACTOR
    // BEGIN EE
    const edition = getEdition()
    if (edition === ApEdition.CLOUD) {
        try {
            await tasksLimit.limit({
                projectId: flow.projectId,
            })
        }
        catch (e) {
            if (e instanceof ActivepiecesError && e.error.code === ErrorCode.QUOTA_EXCEEDED) {
                logger.info(`[webhookController] removing flow.id=${flow.id} run out of flow quota`)
                await flowInstanceService.update({ projectId: flow.projectId, flowId: flow.id, status: FlowInstanceStatus.DISABLED })
            }
            throw e
        }
    }
    // END EE

    return flow
}
